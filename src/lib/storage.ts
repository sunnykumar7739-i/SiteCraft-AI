import { isSupabaseConfigured } from "@/lib/db";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "screenshots";

/**
 * Stores an uploaded screenshot. With Supabase configured it goes to Storage
 * (bucket `screenshots`, public URL returned); otherwise the data URL is kept inline.
 */
export async function storeScreenshot(dataUrl: string, userId: string, projectId: string): Promise<string> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return dataUrl;
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return dataUrl;
  const [, mime, b64] = m;
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const path = `${userId}/${projectId}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, Buffer.from(b64, "base64"), { contentType: mime, upsert: true });
  if (error) {
    console.warn("[storage] upload failed, keeping inline data URL:", error.message);
    return dataUrl;
  }
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Fetches a stored screenshot back as a data URL for the vision model. */
export async function screenshotAsDataUrl(src: string): Promise<string | null> {
  if (src.startsWith("data:")) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
