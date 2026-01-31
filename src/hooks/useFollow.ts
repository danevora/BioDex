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

interface FollowersResponse {
  followers: FollowUser[];
  nextCursor: string | null;
}

interface FollowingResponse {
  following: FollowUser[];
  nextCursor: string | null;
}

interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
}

// Fetch followers list for a user
async function fetchUserFollowers(userId: string, cursor?: string): Promise<FollowersResponse> {
  const url = new URL(`/api/users/${userId}/followers`, window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch followers");
  }
  return response.json();
}

// Fetch following list for a user
async function fetchUserFollowing(userId: string, cursor?: string): Promise<FollowingResponse> {
  const url = new URL(`/api/users/${userId}/following`, window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
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
 * Hook to fetch a user's followers list with pagination
 */
export function useUserFollowers(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["followers", userId],
    queryFn: ({ pageParam }) => fetchUserFollowers(userId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}

/**
 * Hook to fetch the list of users a user is following with pagination
 */
export function useUserFollowing(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["following", userId],
    queryFn: ({ pageParam }) => fetchUserFollowing(userId!, pageParam as string | undefined),
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
