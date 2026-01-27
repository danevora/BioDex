import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCaptureImage } from "@/lib/storage";

function checkAdminAuth(request: NextRequest): boolean {
  const password = request.headers.get("x-admin-password");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ animalId: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { animalId } = await params;

  // Find all captures to clean up images
  const captures = await prisma.capture.findMany({
    where: { animalId },
    select: { imagePath: true },
  });

  // Delete images from storage
  for (const capture of captures) {
    try {
      await deleteCaptureImage(capture.imagePath);
    } catch (err) {
      console.error(`Failed to delete image ${capture.imagePath}:`, err);
    }
  }

  // Delete the animal (cascades to captures, posts, likes, comments)
  await prisma.animal.delete({
    where: { id: animalId },
  });

  return NextResponse.json({ success: true });
}
