export interface IdentifyMatchResult {
  success: true;
  matched: true;
  animal_id: string;
  confidence: number;
  taxonomic_class?: string | null;
}

export interface IdentifyNoMatchResult {
  success: true;
  matched: false;
  detected_animal: string | null;
  taxonomic_class?: string | null;
}

export interface IdentifyErrorResult {
  success: false;
  error: string;
}

export type IdentifyResult =
  | IdentifyMatchResult
  | IdentifyNoMatchResult
  | IdentifyErrorResult;

export async function compressImage(file: File, maxSizeMB = 3): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) return file;

  const bitmap = await createImageBitmap(file);
  const maxDim = 1024;
  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}

export async function identifyAnimal(imageFile: File): Promise<IdentifyResult> {
  const formData = new FormData();
  const compressed = await compressImage(imageFile);
  formData.append("image", compressed);

  try {
    const response = await fetch("/api/identify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || `Request failed with status ${response.status}`,
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
