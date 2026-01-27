import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CommentAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
}

interface CreateCommentResponse {
  comment: Comment;
  commentCount: number;
}

async function fetchComments(
  postId: string,
  cursor?: string
): Promise<CommentsResponse> {
  const url = new URL(`/api/posts/${postId}/comments`, window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Post not found");
    }
    throw new Error("Failed to fetch comments");
  }
  return response.json();
}

async function createComment(
  postId: string,
  content: string
): Promise<CreateCommentResponse> {
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create comment");
  }
  return response.json();
}

export function useComments(postId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: () => {
      // Invalidate comments list for this post
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      // Invalidate feed to update comment counts
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      // Invalidate user posts (for profile pages)
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
