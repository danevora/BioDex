import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

// GET /api/posts/[postId] - Get single post with details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await auth();

    // Allow unauthenticated access but without isLikedByMe
    const currentUserId = session?.user?.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        capture: {
          include: {
            animal: {
              select: {
                id: true,
                commonName: true,
                scientificName: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { userId: true },
          },
        }),
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: post.id,
      caption: post.caption,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: {
        id: post.user.id,
        username: post.user.username,
        image: post.user.image,
      },
      capture: {
        id: post.capture.id,
        imageUrl: post.capture.imageUrl,
        capturedAt: post.capture.capturedAt,
      },
      animal: {
        id: post.capture.animal.id,
        commonName: post.capture.animal.commonName,
        scientificName: post.capture.animal.scientificName,
      },
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLikedByMe: currentUserId
        ? (post as { likes?: { userId: string }[] }).likes?.some(
            (like) => like.userId === currentUserId
          ) ?? false
        : false,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId] - Delete own post
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership
    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete someone else's post" },
        { status: 403 }
      );
    }

    // Delete the post (cascade will delete likes and comments)
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
