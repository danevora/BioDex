import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCaptureImage, deleteCaptureImage } from "@/lib/storage";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const captures = await prisma.capture.findMany({
      where: { userId: session.user.id },
      include: { animal: true },
      orderBy: { capturedAt: "desc" },
    });

    return NextResponse.json(captures);
  } catch (error) {
    console.error("Error fetching captures:", error);
    return NextResponse.json(
      { error: "Failed to fetch captures" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const animalId = formData.get("animalId") as string;
    const image = formData.get("image") as File;
    const confidence = parseFloat(formData.get("confidence") as string) || null;

    if (!animalId || !image) {
      return NextResponse.json(
        { error: "Animal ID and image are required" },
        { status: 400 }
      );
    }

    // Verify animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
    });

    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 });
    }

    // Check for existing capture
    const existingCapture = await prisma.capture.findUnique({
      where: {
        userId_animalId: {
          userId: session.user.id,
          animalId,
        },
      },
    });

    // Delete old image if re-capturing
    if (existingCapture) {
      try {
        await deleteCaptureImage(existingCapture.imagePath);
      } catch {
        // Ignore deletion errors
      }
    }

    // Upload new image
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const { url, path } = await uploadCaptureImage(
      session.user.id,
      animalId,
      imageBuffer,
      image.type
    );

    // Create or update capture
    const capture = await prisma.capture.upsert({
      where: {
        userId_animalId: {
          userId: session.user.id,
          animalId,
        },
      },
      update: {
        imageUrl: url,
        imagePath: path,
        confidence,
        capturedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        animalId,
        imageUrl: url,
        imagePath: path,
        confidence,
      },
      include: { animal: true },
    });

    return NextResponse.json(capture);
  } catch (error) {
    console.error("Error creating capture:", error);
    return NextResponse.json(
      { error: "Failed to create capture" },
      { status: 500 }
    );
  }
}
