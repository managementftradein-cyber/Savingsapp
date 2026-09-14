import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "app-media";
const MAX_VIDEO_BYTES = 4 * 1024 * 1024; // 4MB — Vercel serverless functions cap request bodies around 4.5MB
const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const type = formData?.get("type"); // 'video' | 'image'
  const file = formData?.get("file");

  if ((type !== "video" && type !== "image") || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file or type." }, { status: 400 });
  }

  const maxBytes = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large — keep it under ${Math.round(maxBytes / 1024 / 1024)}MB.` },
      { status: 400 }
    );
  }

  const expectedType = type === "video" ? "video/mp4" : ["image/jpeg", "image/png", "image/webp"];
  const validType = Array.isArray(expectedType)
    ? expectedType.includes(file.type)
    : file.type === expectedType;

  if (!validType) {
    return NextResponse.json(
      { error: type === "video" ? "Video must be MP4." : "Image must be JPG, PNG, or WebP." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const extension = type === "video" ? "mp4" : file.name.split(".").pop() ?? "jpg";
  const path = `auth-bg-${type}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Cache-bust — Supabase's storage CDN and browsers both cache aggressively
  // by URL, so overwriting the same path needs a changing query param or
  // visitors keep seeing the old file.
  const versionedUrl = `${publicUrl}?v=${Date.now()}`;

  const settingKey = type === "video" ? "auth_background_video_url" : "auth_background_image_url";
  const { error: settingError } = await admin
    .from("app_settings")
    .update({ value: versionedUrl })
    .eq("key", settingKey);

  if (settingError) {
    return NextResponse.json({ error: settingError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: versionedUrl });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type;

  if (type !== "video" && type !== "image") {
    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  }

  const admin = createAdminClient();
  const settingKey = type === "video" ? "auth_background_video_url" : "auth_background_image_url";

  const { error } = await admin.from("app_settings").update({ value: null }).eq("key", settingKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
