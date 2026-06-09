import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { compressImage } from "@/lib/api";

export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
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

interface UpdateProfileParams {
  username?: string;
  image?: File;
}

async function updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
  const formData = new FormData();
  if (params.username !== undefined) formData.append("username", params.username);
  if (params.image) {
    const compressed = await compressImage(params.image, 1);
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
