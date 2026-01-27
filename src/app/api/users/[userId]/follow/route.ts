import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// POST /api/users/[userId]/follow - Follow an Explorer
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { userId: followingId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followerId = session.user.id;

    // Cannot follow yourself
    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if user to follow exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!userToFollow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use upsert for idempotent follow (following same user twice returns success)
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {}, // No update needed, just ensure it exists
    });

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    return NextResponse.json({
      isFollowing: true,
      followerCount,
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/follow - Unfollow an Explorer
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId: followingId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followerId = session.user.id;

    // Cannot unfollow yourself
    if (followerId === followingId) {
      return NextResponse.json(
        { error: "Cannot unfollow yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToUnfollow = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!userToUnfollow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete follow record if exists (idempotent - returns success even if not following)
    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });

    // Get updated follower count
    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    return NextResponse.json({
      isFollowing: false,
      followerCount,
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
