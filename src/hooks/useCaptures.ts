import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Capture } from "@/types/animal";

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
  const formData = new FormData();
  formData.append("animalId", params.animalId);
  formData.append("image", params.image);
  if (params.confidence !== undefined) {
    formData.append("confidence", params.confidence.toString());
  }

  const response = await fetch("/api/captures", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create capture");
  }

  return response.json();
}

export function useCaptures() {
  return useQuery({
    queryKey: ["captures"],
    queryFn: fetchCaptures,
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
