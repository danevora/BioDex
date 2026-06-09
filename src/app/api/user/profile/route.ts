import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadProfileImage } from "@/lib/storage";

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
        image: true,
        hasOnboarded: true,
        createdAt: true,
        _count: {
          select: {
            captures: true,
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
      image: user.image,
      hasOnboarded: user.hasOnboarded,
      createdAt: user.createdAt,
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
    const imageFile = formData.get("image") as File | null;

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
        image: true,
        createdAt: true,
        _count: {
          select: {
            captures: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
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
