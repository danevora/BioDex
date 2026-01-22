const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface IdentifyMatchResult {
  success: true;
  matched: true;
  animal_id: string;
  confidence: number;
}

export interface IdentifyNoMatchResult {
  success: true;
  matched: false;
  detected_animal: string | null;
}

export interface IdentifyErrorResult {
  success: false;
  error: string;
}

export type IdentifyResult =
  | IdentifyMatchResult
  | IdentifyNoMatchResult
  | IdentifyErrorResult;

export async function identifyAnimal(imageFile: File): Promise<IdentifyResult> {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await fetch(`${API_BASE_URL}/api/identify`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.detail || `Request failed with status ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
