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

const PROFILES_BUCKET = "profiles";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadProfileImage(
  userId: string,
  file: Buffer,
  contentType: string
): Promise<{ url: string; path: string }> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
  }

  if (file.byteLength > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Delete any existing avatar files (handles extension changes)
  await deleteProfileImage(userId);

  const fileExtension = contentType.split("/")[1] || "jpg";
  const path = `${userId}/avatar.${fileExtension}`;

  const { error } = await supabaseAdmin.storage
    .from(PROFILES_BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(PROFILES_BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function deleteProfileImage(userId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  const { data: files } = await supabaseAdmin.storage
    .from(PROFILES_BUCKET)
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from(PROFILES_BUCKET).remove(paths);
  }
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
