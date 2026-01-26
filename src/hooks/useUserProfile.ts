import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  discoveryCount: number;
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
  displayName?: string;
  bio?: string;
}

async function updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
  const response = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
  });
}
