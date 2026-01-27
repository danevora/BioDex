import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

const PAGE_SIZE = 20;
const MAX_COMMENT_LENGTH = 1000;

// POST /api/posts/[postId]/comments - Add comment to post
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { postId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment content must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content: trimmedContent,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Get updated comment count
    const commentCount = await prisma.comment.count({
      where: { postId },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.user,
      },
      commentCount,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET /api/posts/[postId]/comments - Get comments for post (paginated)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { postId } = await params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    // Fetch comments ordered by createdAt ASC (oldest first)
    const comments = await prisma.comment.findMany({
      where: { postId },
      take: PAGE_SIZE + 1, // Fetch one extra to determine if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Determine if there's a next page
    let nextCursor: string | null = null;
    if (comments.length > PAGE_SIZE) {
      const nextItem = comments.pop();
      nextCursor = nextItem!.id;
    }

    // Format response
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.user,
    }));

    return NextResponse.json({
      comments: formattedComments,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
