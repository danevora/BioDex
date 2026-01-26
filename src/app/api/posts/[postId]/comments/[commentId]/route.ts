import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ postId: string; commentId: string }>;
}

// DELETE /api/posts/[postId]/comments/[commentId] - Delete own comment
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { postId, commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify comment belongs to this post
    if (comment.postId !== postId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check ownership - can only delete own comments
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Get updated comment count
    const commentCount = await prisma.comment.count({
      where: { postId },
    });

    return NextResponse.json({
      success: true,
      commentCount,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
