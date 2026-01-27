import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface FollowUser {
  id: string;
  username: string | null;
  image: string | null;
  followerCount: number;
  followingCount: number;
  discoveryCount: number;
  isFollowing: boolean;
}

interface FollowListResponse {
  users: FollowUser[];
  nextCursor: string | null;
}

interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
}

// Fetch followers list
async function fetchFollowers(cursor?: string): Promise<FollowListResponse> {
  const url = new URL("/api/user/followers", window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch followers");
  }
  return response.json();
}

// Fetch following list
async function fetchFollowing(cursor?: string): Promise<FollowListResponse> {
  const url = new URL("/api/user/following", window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch following");
  }
  return response.json();
}

// Follow a user
async function followUser(userId: string): Promise<FollowResponse> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: "POST",
  });
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Cannot follow yourself");
    }
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to follow user");
  }
  return response.json();
}

// Unfollow a user
async function unfollowUser(userId: string): Promise<FollowResponse> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: "DELETE",
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to unfollow user");
  }
  return response.json();
}

/**
 * Hook to fetch the current user's followers list with pagination
 */
export function useFollowers() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useInfiniteQuery({
    queryKey: ["followers"],
    queryFn: ({ pageParam }) => fetchFollowers(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}

/**
 * Hook to fetch the list of users the current user is following with pagination
 */
export function useFollowing() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useInfiniteQuery({
    queryKey: ["following"],
    queryFn: ({ pageParam }) => fetchFollowing(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}

/**
 * Hook to follow a user with optimistic update support
 * Invalidates feed, profile, and follow-related queries on success
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followUser,
    onSuccess: (_data, userId) => {
      // Invalidate the target user's profile
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      // Invalidate own profile (following count changed)
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      // Invalidate following list
      queryClient.invalidateQueries({ queryKey: ["following"] });
      // Invalidate feed (new posts might appear from followed user)
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      // Invalidate user search results (isFollowing status changed)
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
    },
  });
}

/**
 * Hook to unfollow a user with optimistic update support
 * Invalidates feed, profile, and follow-related queries on success
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: (_data, userId) => {
      // Invalidate the target user's profile
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      // Invalidate own profile (following count changed)
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      // Invalidate following list
      queryClient.invalidateQueries({ queryKey: ["following"] });
      // Invalidate feed (posts from unfollowed user should disappear)
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      // Invalidate user search results (isFollowing status changed)
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
    },
  });
}
