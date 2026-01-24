import { supabaseAdmin } from "./supabase";

const BUCKET_NAME = "captures";

export async function uploadCaptureImage(
  userId: string,
  animalId: string,
  file: Buffer,
  contentType: string
): Promise<{ url: string; path: string }> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  const fileExtension = contentType.split("/")[1] || "jpg";
  const path = `${userId}/${animalId}.${fileExtension}`;

  // Delete existing file if present (for re-captures)
  await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function deleteCaptureImage(path: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
