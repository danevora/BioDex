import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadProfileImage } from "@/lib/storage";

// Username validation: alphanumeric with underscores, 3-20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            captures: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      image: user.image,
      createdAt: user.createdAt,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      discoveryCount: user._count.captures,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const username = formData.get("username") as string | null;
    const bio = formData.get("bio") as string | null;
    const imageFile = formData.get("image") as File | null;

    // Validate username if provided
    if (username !== undefined) {
      if (username === null || username === "") {
        // Allow clearing username
      } else if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          {
            error:
              "Username must be 3-20 characters, alphanumeric with underscores only",
          },
          { status: 400 }
        );
      } else {
        // Check if username is already taken by another user
        const existingUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (existingUser && existingUser.id !== session.user.id) {
          return NextResponse.json(
            { error: "Username already taken" },
            { status: 409 }
          );
        }
      }
    }

    // Validate bio length
    if (bio !== undefined && bio !== null) {
      if (bio.length > 160) {
        return NextResponse.json(
          { error: "Bio must be 160 characters or less" },
          { status: 400 }
        );
      }
    }

    // Handle profile image upload
    let imageUrl: string | undefined;
    if (imageFile && imageFile.size > 0) {
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const result = await uploadProfileImage(
          session.user.id,
          buffer,
          imageFile.type
        );
        imageUrl = result.url;
      } catch (error) {
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (username !== null && username !== "") {
      updateData.username = username;
    }
    if (bio !== null) {
      updateData.bio = bio === "" ? null : bio;
    }
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            captures: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
      followerCount: updatedUser._count.followers,
      followingCount: updatedUser._count.following,
      discoveryCount: updatedUser._count.captures,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
