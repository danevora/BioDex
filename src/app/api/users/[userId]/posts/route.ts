import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

const PAGE_SIZE = 20;

// GET /api/users/[userId]/posts - Get posts by specific user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const posts = await prisma.post.findMany({
      where: { userId },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
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

    // Check if there are more results
    let nextCursor: string | null = null;
    if (posts.length > PAGE_SIZE) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id,
        caption: post.caption,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.user.id,
          username: post.user.username,
          displayName: post.user.displayName,
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
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch user posts" },
      { status: 500 }
    );
  }
}
