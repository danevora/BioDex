import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCaptureImage, deleteProfileImage } from "@/lib/storage";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Find all captures to clean up images from storage
    const captures = await prisma.capture.findMany({
      where: { userId },
      select: { imagePath: true },
    });

    // Delete all capture images from Supabase storage
    for (const capture of captures) {
      try {
        await deleteCaptureImage(capture.imagePath);
      } catch (err) {
        console.error(`Failed to delete capture image ${capture.imagePath}:`, err);
      }
    }

    // Delete profile image from Supabase storage
    try {
      await deleteProfileImage(userId);
    } catch (err) {
      console.error(`Failed to delete profile image for user ${userId}:`, err);
    }

    // Delete the user record (cascades to captures, posts, likes, comments, follows)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
