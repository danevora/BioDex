import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

// GET /api/user/following - Get list of users being followed (paginated)
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      take: PAGE_SIZE + 1, // Fetch one extra to check if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        following: {
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
    if (following.length > PAGE_SIZE) {
      const nextItem = following.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      following: following.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.displayName,
        image: f.following.image,
        followedAt: f.createdAt,
        isFollowing: true, // By definition, we're following all these users
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
