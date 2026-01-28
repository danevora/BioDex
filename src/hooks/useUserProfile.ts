import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { compressImage } from "@/lib/api";

export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  bio: string | null;
  image: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  discoveryCount: number;
  hasOnboarded: boolean;
}

async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch("/api/user/profile");
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch profile");
  }
  return response.json();
}

async function fetchPublicProfile(userId: string): Promise<UserProfile & { isFollowing: boolean }> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to fetch profile");
  }
  return response.json();
}

interface UpdateProfileParams {
  username?: string;
  bio?: string;
  image?: File;
}

async function updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
  const formData = new FormData();
  if (params.username !== undefined) formData.append("username", params.username);
  if (params.bio !== undefined) formData.append("bio", params.bio);
  if (params.image) {
    const compressed = await compressImage(params.image);
    formData.append("image", compressed);
  }

  const response = await fetch("/api/user/profile", {
    method: "PATCH",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("Image is too large. Please try a smaller photo.");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update profile");
  }

  return response.json();
}

export function useUserProfile() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchUserProfile,
    enabled: !!userId,
  });
}

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchPublicProfile(userId!),
    enabled: !!userId,
  });
}

async function completeOnboarding(): Promise<{ success: boolean }> {
  const response = await fetch("/api/user/onboarding", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to complete onboarding");
  }
  return response.json();
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}

// Post types for user posts
export interface PostUser {
  id: string;
  username: string | null;
  image: string | null;
}

export interface PostAnimal {
  id: string;
  commonName: string;
  scientificName: string;
}

export interface PostCapture {
  id: string;
  imageUrl: string;
  capturedAt: string;
}

export interface Post {
  id: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
  capture: PostCapture;
  animal: PostAnimal;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
}

interface UserPostsResponse {
  posts: Post[];
  nextCursor: string | null;
}

async function fetchUserPosts(userId: string, cursor?: string): Promise<UserPostsResponse> {
  const url = new URL(`/api/users/${userId}/posts`, window.location.origin);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to fetch user posts");
  }
  return response.json();
}

export function useUserPosts(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["posts", userId],
    queryFn: ({ pageParam }) => fetchUserPosts(userId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}
