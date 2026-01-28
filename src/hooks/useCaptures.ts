import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Capture } from "@/types/animal";
import { compressImage } from "@/lib/api";

async function fetchCaptures(): Promise<Capture[]> {
  const response = await fetch("/api/captures");
  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error("Failed to fetch captures");
  }
  return response.json();
}

interface CreateCaptureParams {
  animalId: string;
  image: File;
  confidence?: number;
}

async function createCapture(params: CreateCaptureParams): Promise<Capture> {
  const compressed = await compressImage(params.image, 1);
  const formData = new FormData();
  formData.append("animalId", params.animalId);
  formData.append("image", compressed);
  if (params.confidence !== undefined) {
    formData.append("confidence", params.confidence.toString());
  }

  const response = await fetch("/api/captures", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error("Image is too large. Please try a smaller photo.");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to save discovery");
  }

  return response.json();
}

export function useCaptures() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["captures", userId],
    queryFn: fetchCaptures,
    enabled: !!userId,
  });
}

export function useDeleteCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (captureId: string) => {
      const response = await fetch(`/api/captures/${captureId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete discovery");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captures"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useCreateCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCapture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captures"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}
