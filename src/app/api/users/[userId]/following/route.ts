import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

// GET /api/users/[userId]/following - Get list of users a user is following (paginated)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        following: {
          select: {
            id: true,
            username: true,
            image: true,
            _count: { select: { captures: true } },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (following.length > PAGE_SIZE) {
      const nextItem = following.pop();
      nextCursor = nextItem!.id;
    }

    // Check which users the current user is following
    let followingSet = new Set<string>();
    if (currentUserId) {
      const followingIds = following.map((f) => f.following.id);
      const currentUserFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followingIds },
        },
        select: { followingId: true },
      });
      followingSet = new Set(currentUserFollowing.map((f) => f.followingId));
    }

    return NextResponse.json({
      following: following.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        image: f.following.image,
        discoveryCount: f.following._count.captures,
        isFollowing: followingSet.has(f.following.id),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
