import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCaptureImage } from "@/lib/storage";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ captureId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { captureId } = await params;

    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
    });

    if (!capture) {
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    if (capture.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete image from storage
    try {
      await deleteCaptureImage(capture.imagePath);
    } catch (err) {
      console.error(`Failed to delete capture image ${capture.imagePath}:`, err);
    }

    // Delete the capture (cascades to posts, likes, comments via Prisma schema)
    await prisma.capture.delete({
      where: { id: captureId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting capture:", error);
    return NextResponse.json(
      { error: "Failed to delete capture" },
      { status: 500 }
    );
  }
}
