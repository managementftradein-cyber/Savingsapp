import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAuthBackgroundUrls } from "@/lib/settings";
import MediaUploadForm from "./media-upload-form";

export default async function AdminMediaPage() {
  const user = await requireAdminUser();
  if (!user) redirect("/dashboard");

  const { videoUrl, imageUrl } = await getAuthBackgroundUrls();

  return (
    <div>
      <h2 className="font-display font-extrabold text-base text-navy mb-1">
        Splash & auth background
      </h2>
      <p className="text-sm text-ink-soft mb-5">
        Controls the video/image behind the splash, login, and signup
        pages. Changes apply immediately — no deploy needed.
      </p>

      <MediaUploadForm currentVideoUrl={videoUrl} currentImageUrl={imageUrl} />
    </div>
  );
}
