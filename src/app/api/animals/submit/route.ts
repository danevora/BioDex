import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCaptureImage } from "@/lib/storage";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

const VALID_DIETARY_GROUPS = [
  "Carnivore",
  "Herbivore",
  "Omnivore",
  "Insectivore",
  "Piscivore",
  "Frugivore",
  "Nectarivore",
  "Detritivore",
  "Filter Feeder",
];

const VALID_REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Great Plains",
  "Southwest",
  "Pacific",
  "Alaska",
  "Hawaii",
  "North America",
  "Central America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
  "Antarctica",
  "Worldwide",
];

const VALID_CLASSES = [
  "Mammalia",
  "Aves",
  "Reptilia",
  "Amphibia",
  "Actinopterygii",
  "Insecta",
  "Arachnida",
  "Malacostraca",
  "Gastropoda",
  "Cephalopoda",
  "Bivalvia",
  "Merostomata",
];

function toPascalCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const speciesName = formData.get("speciesName") as string;
    const image = formData.get("image") as File;
    const taxonomicClass = formData.get("taxonomicClass") as string | null;

    if (!speciesName || !image) {
      return NextResponse.json(
        { success: false, error: "Species name and image are required" },
        { status: 400 }
      );
    }

    const normalizedName = toPascalCase(speciesName);

    // Ask Claude to verify the species and generate animal data
    const client = new Anthropic();

    const verificationPrompt = `You are a zoological database assistant. A user claims to have photographed a "${normalizedName}"${taxonomicClass ? ` (taxonomic class: ${taxonomicClass})` : ""}.

Your job:
1. Determine if "${normalizedName}" refers to a real, recognized animal species (or a common name for one). It must be an actual animal — not fictional, not a plant, not a brand, not a made-up name.
2. If it IS a real animal, provide complete taxonomic and descriptive data.

Valid taxonomic classes: ${VALID_CLASSES.join(", ")}
Valid dietary groups: ${VALID_DIETARY_GROUPS.join(", ")}
Valid regions: ${VALID_REGIONS.join(", ")}

IMPORTANT: The "regions" field must contain at least one valid region. Use the broad continental regions (e.g., "Africa", "Asia") for animals found outside North America. Use the specific North American sub-regions (e.g., "Northeast", "Pacific") for animals found in North America. Use "Worldwide" only for truly cosmopolitan species. Never return an empty regions array.

Respond with ONLY a JSON object in one of these formats:

If NOT a real animal species:
{
  "is_real": false,
  "reason": "Brief explanation of why this isn't a valid animal species"
}

If it IS a real animal species:
{
  "is_real": true,
  "commonName": "Pascal Case Common Name (e.g., Red Fox, Bald Eagle, Green Tree Frog)",
  "scientificName": "Genus species",
  "class": "One of the valid taxonomic classes",
  "order": "Taxonomic order",
  "family": "Taxonomic family",
  "dietaryGroup": "One of the valid dietary groups",
  "habitat": "Brief habitat description (e.g., Forests and grasslands)",
  "regions": ["At least one valid region from the list above"],
  "blurb": "A fun, educational 1-2 sentence description of this animal suitable for a Pokédex-style app",
  "hint": "A short clue to help someone find this animal in the wild (e.g., Look near ponds at dusk)"
}

Respond ONLY with the JSON object.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: verificationPrompt }],
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to verify species" },
        { status: 500 }
      );
    }

    if (!aiResult.is_real) {
      return NextResponse.json(
        {
          success: false,
          error: aiResult.reason || "This doesn't appear to be a real animal species",
        },
        { status: 400 }
      );
    }

    // Validate and sanitize AI output
    const commonName = toPascalCase(aiResult.commonName || normalizedName);

    const dietaryGroup = VALID_DIETARY_GROUPS.includes(aiResult.dietaryGroup)
      ? aiResult.dietaryGroup
      : "Omnivore";

    const filteredRegions = Array.isArray(aiResult.regions)
      ? aiResult.regions.filter((r: string) => VALID_REGIONS.includes(r))
      : [];
    // Fallback: if AI returned no valid regions, use all regions
    const regions = filteredRegions.length > 0 ? filteredRegions : [...VALID_REGIONS];

    const animalClass = VALID_CLASSES.includes(aiResult.class)
      ? aiResult.class
      : taxonomicClass && VALID_CLASSES.includes(taxonomicClass)
        ? taxonomicClass
        : "Mammalia";

    // Check for existing animal by scientific name (case-insensitive)
    let animal = await prisma.animal.findFirst({
      where: {
        scientificName: {
          equals: aiResult.scientificName,
          mode: "insensitive",
        },
      },
    });

    if (!animal) {
      animal = await prisma.animal.create({
        data: {
          commonName,
          scientificName: aiResult.scientificName,
          class: animalClass,
          order: aiResult.order || "Unknown",
          family: aiResult.family || "Unknown",
          dietaryGroup,
          habitat: aiResult.habitat || "Various",
          regions,
          blurb: aiResult.blurb || `A ${commonName} discovered by a BioDex explorer.`,
          hint: aiResult.hint || "Keep your eyes open!",
          isActive: true,
          isUserSubmitted: true,
        },
      });
    }

    // Upload image
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const resized = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const { url: imageUrl, path: imagePath } = await uploadCaptureImage(
      userId,
      animal.id,
      resized,
      "image/jpeg"
    );

    // Create or update capture
    const capture = await prisma.capture.upsert({
      where: {
        userId_animalId: {
          userId,
          animalId: animal.id,
        },
      },
      update: {
        imageUrl,
        imagePath,
        confidence: 1.0,
      },
      create: {
        userId,
        animalId: animal.id,
        imageUrl,
        imagePath,
        confidence: 1.0,
      },
    });

    return NextResponse.json({
      success: true,
      animal: {
        id: animal.id,
        commonName: animal.commonName,
        scientificName: animal.scientificName,
        class: animal.class,
        order: animal.order,
        family: animal.family,
        dietaryGroup: animal.dietaryGroup,
        habitat: animal.habitat,
        regions: animal.regions,
        blurb: animal.blurb,
        hint: animal.hint,
      },
      capture: {
        id: capture.id,
        animalId: capture.animalId,
        imageUrl: capture.imageUrl,
      },
    });
  } catch (error) {
    console.error("Submit animal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit animal" },
      { status: 500 }
    );
  }
}
