import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Post } from "./useUserProfile";

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

async function fetchFeed(cursor?: string): Promise<FeedResponse> {
  const url = new URL("/api/posts", window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch feed");
  }
  return response.json();
}

export function useFeed() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}

interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
}

async function likePost(postId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/posts/${postId}/likes`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to like post");
  }
  return response.json();
}

async function unlikePost(postId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/posts/${postId}/likes`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to unlike post");
  }
  return response.json();
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
