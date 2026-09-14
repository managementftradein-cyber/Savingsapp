import { createClient } from "@/lib/supabase/server";

export async function getAuthBackgroundUrls(): Promise<{
  videoUrl: string | null;
  imageUrl: string | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["auth_background_video_url", "auth_background_image_url"]);

  const videoUrl = data?.find((r) => r.key === "auth_background_video_url")?.value ?? null;
  const imageUrl = data?.find((r) => r.key === "auth_background_image_url")?.value ?? null;

  return { videoUrl, imageUrl };
}
