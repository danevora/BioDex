import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

// GET /api/users/[userId]/followers - Get list of a user's followers (paginated)
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

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        follower: {
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
    if (followers.length > PAGE_SIZE) {
      const nextItem = followers.pop();
      nextCursor = nextItem!.id;
    }

    // Check which users the current user is following
    let followingSet = new Set<string>();
    if (currentUserId) {
      const followerIds = followers.map((f) => f.follower.id);
      const following = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followerIds },
        },
        select: { followingId: true },
      });
      followingSet = new Set(following.map((f) => f.followingId));
    }

    return NextResponse.json({
      followers: followers.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        image: f.follower.image,
        discoveryCount: f.follower._count.captures,
        isFollowing: followingSet.has(f.follower.id),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
