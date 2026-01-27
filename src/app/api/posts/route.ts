import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;
const MAX_CAPTION_LENGTH = 280;

// Helper function to format post response
function formatPostResponse(
  post: {
    id: string;
    caption: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      username: string | null;
      image: string | null;
    };
    capture: {
      id: string;
      imageUrl: string;
      capturedAt: Date;
      animal: {
        id: string;
        commonName: string;
        scientificName: string;
      };
    };
    _count: {
      likes: number;
      comments: number;
    };
    likes?: { userId: string }[];
  },
  currentUserId?: string
) {
  return {
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
      ? post.likes?.some((like) => like.userId === currentUserId) ?? false
      : false,
  };
}

// GET /api/posts - Get feed of posts from followed users + own posts
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    // Get list of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    // Include own posts in the feed
    const userIds = [...followingIds, session.user.id];

    const posts = await prisma.post.findMany({
      where: {
        userId: { in: userIds },
      },
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
        likes: {
          where: { userId: session.user.id },
          select: { userId: true },
        },
      },
    });

    // Check if there are more results
    let nextCursor: string | null = null;
    if (posts.length > PAGE_SIZE) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      posts: posts.map((post) => formatPostResponse(post, session.user.id)),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a post (captureId required, caption optional)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { captureId, caption } = body;

    if (!captureId) {
      return NextResponse.json(
        { error: "captureId is required" },
        { status: 400 }
      );
    }

    // Validate caption length
    if (caption && caption.length > MAX_CAPTION_LENGTH) {
      return NextResponse.json(
        { error: `Caption must be ${MAX_CAPTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Verify capture exists and belongs to the user
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        capturedAt: true,
        animal: {
          select: {
            id: true,
            commonName: true,
            scientificName: true,
          },
        },
      },
    });

    if (!capture) {
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    if (capture.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot create post for someone else's capture" },
        { status: 403 }
      );
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        captureId,
        caption: caption || null,
      },
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
      },
    });

    return NextResponse.json(formatPostResponse(post, session.user.id));
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
