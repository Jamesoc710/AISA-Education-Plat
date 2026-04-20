import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "feedback-images";
let ensured = false;

async function ensureBucket() {
  if (ensured) return;
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    await admin.storage.createBucket(BUCKET, { public: false });
  }
  ensured = true;
}

export async function uploadFeedbackImage(
  userId: string,
  file: File,
): Promise<string> {
  await ensureBucket();
  const admin = getSupabaseAdmin();

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "image/png",
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  return path;
}

export async function getFeedbackImageUrl(path: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}
