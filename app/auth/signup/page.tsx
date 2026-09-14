import MediaBackground from "@/components/media-background";
import { getAuthBackgroundUrls } from "@/lib/settings";
import SignupForm from "./signup-form";

export default async function SignupPage() {
  const { videoUrl, imageUrl } = await getAuthBackgroundUrls();

  return (
    <MediaBackground videoSrc={videoUrl} imageSrc={imageUrl}>
      <SignupForm />
    </MediaBackground>
  );
}
