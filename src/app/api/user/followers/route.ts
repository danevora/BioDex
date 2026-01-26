import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

// GET /api/user/followers - Get list of followers (paginated)
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const followers = await prisma.follow.findMany({
      where: { followingId: session.user.id },
      take: PAGE_SIZE + 1, // Fetch one extra to check if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    // Check if there are more results
    let nextCursor: string | null = null;
    if (followers.length > PAGE_SIZE) {
      const nextItem = followers.pop();
      nextCursor = nextItem!.id;
    }

    // Check which of these users the current user is following back
    const followerIds = followers.map((f) => f.follower.id);
    const followingBack = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });
    const followingBackSet = new Set(followingBack.map((f) => f.followingId));

    return NextResponse.json({
      followers: followers.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.displayName,
        image: f.follower.image,
        followedAt: f.createdAt,
        isFollowing: followingBackSet.has(f.follower.id),
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
