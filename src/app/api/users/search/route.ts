import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Case-insensitive prefix match on username
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        image: true,
        _count: {
          select: {
            captures: true,
            followers: true,
          },
        },
      },
      take: 20,
      orderBy: {
        username: "asc",
      },
    });

    // Check if authenticated user is following each result
    const followRecords = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: {
          in: users.map((u) => u.id),
        },
      },
      select: {
        followingId: true,
      },
    });

    const followingSet = new Set(followRecords.map((f) => f.followingId));

    const results = users.map((user) => ({
      id: user.id,
      username: user.username,
      image: user.image,
      followerCount: user._count.followers,
      discoveryCount: user._count.captures,
      isFollowing: followingSet.has(user.id),
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
