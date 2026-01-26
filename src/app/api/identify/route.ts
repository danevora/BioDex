import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_DIMENSION = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Confidence thresholds
const THRESHOLDS = {
  ACCEPT: 0.70,  // Auto-accept match
  REJECT: 0.40,  // Ask for clearer photo
};

// Valid taxonomic classes in our database
const TAXONOMIC_CLASSES = [
  "Mammalia",       // Mammals
  "Aves",           // Birds
  "Reptilia",       // Reptiles
  "Amphibia",       // Amphibians
  "Actinopterygii", // Ray-finned fish
  "Insecta",        // Insects
  "Arachnida",      // Spiders, scorpions
  "Malacostraca",   // Crustaceans
  "Gastropoda",     // Snails, slugs
  "Cephalopoda",    // Octopus, squid
  "Bivalvia",       // Clams, mussels
  "Merostomata",    // Horseshoe crabs
];

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface ClassificationResult {
  is_animal: boolean;
  taxonomic_class: string | null;
  confidence: number;
}

interface MatchResult {
  matched_id: string | null;
  detected_animal: string | null;
  confidence: number;
}

async function resizeImage(
  imageBuffer: Buffer
): Promise<{ data: Buffer; mediaType: ImageMediaType }> {
  const resized = await sharp(imageBuffer)
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  return { data: resized, mediaType: "image/jpeg" };
}

/**
 * Stage 1: Classify the image to determine taxonomic class
 * This is a lightweight call that filters the catalog by ~75%
 */
async function classifyAnimal(
  client: Anthropic,
  base64Image: string,
  mediaType: ImageMediaType
): Promise<ClassificationResult> {
  const classificationPrompt = `Analyze this image and determine what type of animal (if any) is shown.

Respond with a JSON object:
{
  "is_animal": true/false,
  "taxonomic_class": "class name or null",
  "confidence": 0.0-1.0
}

Valid taxonomic classes:
- Mammalia (mammals: dogs, cats, deer, bears, etc.)
- Aves (birds: eagles, robins, ducks, etc.)
- Reptilia (reptiles: snakes, turtles, lizards, etc.)
- Amphibia (amphibians: frogs, toads, salamanders)
- Actinopterygii (fish: bass, trout, salmon, etc.)
- Insecta (insects: butterflies, bees, beetles, etc.)
- Arachnida (spiders, scorpions, ticks)
- Malacostraca (crustaceans: crabs, lobsters, shrimp)
- Gastropoda (snails, slugs)
- Cephalopoda (octopus, squid)

Rules:
- If no animal is visible, set is_animal to false
- If you see an animal, identify the taxonomic class
- Confidence reflects how certain you are about the class

Respond ONLY with the JSON object.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: classificationPrompt,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(responseText);
}

/**
 * Stage 2: Match against filtered catalog
 * Only includes animals from the detected taxonomic class
 */
async function matchAnimal(
  client: Anthropic,
  base64Image: string,
  mediaType: ImageMediaType,
  catalog: Array<{ id: string; commonName: string; scientificName: string }>
): Promise<MatchResult> {
  const catalogDescription = catalog
    .map((a) => `- ${a.commonName} (${a.scientificName}) [id: ${a.id}]`)
    .join("\n");

  const matchPrompt = `Identify the specific animal in this image from our catalog.

BioDex catalog:
${catalogDescription}

Respond with a JSON object:
{
  "matched_id": "catalog id if matched, or null",
  "detected_animal": "what animal you see",
  "confidence": 0.0-1.0
}

Rules:
- Only match to an animal if you're confident it's that species
- For domestic animals: any breed of dog matches "dog", any cat matches "cat"
- If the animal isn't in our catalog, set matched_id to null
- Confidence should reflect how certain you are of the specific match

Respond ONLY with the JSON object.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: matchPrompt,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(responseText);
}

/**
 * Get catalog filtered by taxonomic class
 */
async function getCatalog(taxonomicClass?: string | null) {
  const where: { isActive: boolean; class?: string } = { isActive: true };

  if (taxonomicClass && TAXONOMIC_CLASSES.includes(taxonomicClass)) {
    where.class = taxonomicClass;
  }

  const animals = await prisma.animal.findMany({
    where,
    select: { id: true, commonName: true, scientificName: true },
  });

  return animals;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    console.log("Identify request:", {
      hasImage: !!image,
      imageType: image?.type,
      imageSize: image?.size,
      imageName: image?.name,
    });

    if (!image) {
      console.log("Error: No image provided");
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      console.log("Error: Invalid image type:", image.type);
      return NextResponse.json(
        { success: false, error: `Invalid image type: ${image.type}. Allowed: JPEG, PNG, GIF, WebP` },
        { status: 400 }
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image too large. Maximum size: 20MB" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const { data: resizedImage, mediaType } = await resizeImage(imageBuffer);
    const base64Image = resizedImage.toString("base64");

    const client = new Anthropic();

    // Stage 1: Classify the animal
    console.log("Stage 1: Classifying animal...");
    const classification = await classifyAnimal(client, base64Image, mediaType);
    console.log("Classification result:", classification);

    // If no animal detected
    if (!classification.is_animal) {
      return NextResponse.json({
        success: true,
        matched: false,
        detected_animal: null,
        message: "No animal detected in image",
      });
    }

    // Stage 2: Get filtered catalog and match
    console.log(`Stage 2: Matching against ${classification.taxonomic_class} catalog...`);
    const catalog = await getCatalog(classification.taxonomic_class);
    console.log(`Catalog size: ${catalog.length} animals`);

    // If no animals in that class, fall back to full catalog
    const finalCatalog = catalog.length > 0 ? catalog : await getCatalog();
    const catalogIds = new Set(finalCatalog.map((a) => a.id));

    const matchResult = await matchAnimal(client, base64Image, mediaType, finalCatalog);
    console.log("Match result:", matchResult);

    // Apply confidence thresholds
    if (matchResult.matched_id && catalogIds.has(matchResult.matched_id)) {
      const confidence = matchResult.confidence || 0;

      if (confidence >= THRESHOLDS.ACCEPT) {
        // High confidence match
        return NextResponse.json({
          success: true,
          matched: true,
          animal_id: matchResult.matched_id,
          confidence: confidence,
        });
      } else if (confidence >= THRESHOLDS.REJECT) {
        // Medium confidence - accept but flag
        return NextResponse.json({
          success: true,
          matched: true,
          animal_id: matchResult.matched_id,
          confidence: confidence,
          low_confidence: true,
        });
      } else {
        // Low confidence - reject match
        return NextResponse.json({
          success: true,
          matched: false,
          detected_animal: matchResult.detected_animal,
          message: "Please take a clearer photo for better identification",
        });
      }
    } else if (matchResult.detected_animal) {
      // Animal detected but not in catalog
      return NextResponse.json({
        success: true,
        matched: false,
        detected_animal: matchResult.detected_animal,
      });
    } else {
      // Could not identify
      return NextResponse.json({
        success: true,
        matched: false,
        detected_animal: null,
      });
    }
  } catch (error) {
    console.error("Identify error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to identify animal" },
      { status: 500 }
    );
  }
}
