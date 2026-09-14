import MediaBackground from "@/components/media-background";
import { getAuthBackgroundUrls } from "@/lib/settings";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const { videoUrl, imageUrl } = await getAuthBackgroundUrls();

  return (
    <MediaBackground videoSrc={videoUrl} imageSrc={imageUrl}>
      <LoginForm />
    </MediaBackground>
  );
}
