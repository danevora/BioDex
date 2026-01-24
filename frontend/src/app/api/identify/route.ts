import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_DIMENSION = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

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

async function getCatalog() {
  const animals = await prisma.animal.findMany({
    where: { isActive: true },
    select: { id: true, commonName: true, scientificName: true },
  });

  return animals;
}

function buildPrompt(catalog: { id: string; commonName: string; scientificName: string }[]) {
  const catalogDescription = catalog
    .map((a) => `- ${a.commonName} (${a.scientificName}) [id: ${a.id}]`)
    .join("\n");

  return `You are an animal identification assistant for BioDex, a Pokédex-style app for real animals.

The BioDex catalog contains the following animals:
${catalogDescription}

Analyze the provided image and determine:
1. What animal (if any) is shown in the image
2. Whether it matches any animal in our BioDex catalog

Respond with a JSON object in this exact format:
{
    "is_animal": true/false,
    "detected_animal": "name of animal detected or null",
    "matched_id": "catalog id if matched or null",
    "confidence": 0.0-1.0
}

Rules:
- If no animal is visible, set is_animal to false and other fields to null/0
- If an animal is detected but not in our catalog, set matched_id to null
- Only match to catalog entries if you're confident it's that specific animal
- For dogs: any breed of domestic dog should match "dog"
- For cats: any domestic cat should match "cat"
- For frogs: common frogs or similar species should match "frog"
- Be generous with matching - if it looks like a dog, cat, or frog, match it

Respond ONLY with the JSON object, no other text.`;
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
        { success: false, error: "Image too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const { data: resizedImage, mediaType } = await resizeImage(imageBuffer);
    const base64Image = resizedImage.toString("base64");

    const catalog = await getCatalog();
    const catalogIds = new Set(catalog.map((a: { id: string }) => a.id));
    const prompt = buildPrompt(catalog);

    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
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
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const result = JSON.parse(responseText);

    if (result.matched_id && catalogIds.has(result.matched_id)) {
      return NextResponse.json({
        success: true,
        matched: true,
        animal_id: result.matched_id,
        confidence: result.confidence || 0.9,
      });
    } else if (result.is_animal && result.detected_animal) {
      return NextResponse.json({
        success: true,
        matched: false,
        detected_animal: result.detected_animal,
      });
    } else {
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
