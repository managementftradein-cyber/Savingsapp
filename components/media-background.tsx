/**
 * Full-bleed background for the splash and auth pages. Video is optional —
 * if there's no video (from the admin CMS or a local file), the browser
 * just shows the poster image; if that's missing too, it falls back to
 * the gradient already used elsewhere so nothing breaks with zero assets
 * supplied.
 *
 * Media can come from two places, checked in this order:
 *   1. Uploaded via /admin/media (stored in Supabase Storage, saved to
 *      app_settings) — pass as the videoSrc/imageSrc props.
 *   2. Local files at public/videos/auth-bg.mp4 and public/images/auth-bg.jpg
 *      — used automatically if no prop is passed.
 *
 * Recommended specs, since this loads on every visit to these pages:
 *   Video: 1080p or less, H.264 mp4, under ~4MB, 10-20s loop, no audio track
 *   Image: 1920x1080 or less, JPG, under ~300KB
 * Free, properly-licensed options: Pexels and Coverr both offer video and
 * photo downloads with licenses that permit this kind of use.
 */
export default function MediaBackground({
  children,
  videoSrc,
  imageSrc,
  overlayClassName = "bg-gradient-to-b from-brand-navy/80 via-brand-navy/60 to-brand-navy/85",
}: {
  children: React.ReactNode;
  videoSrc?: string | null;
  imageSrc?: string | null;
  overlayClassName?: string;
}) {
  const resolvedVideo = videoSrc ?? "/videos/auth-bg.mp4";
  const resolvedImage = imageSrc ?? "/images/auth-bg.jpg";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-navy via-blue-deep to-blue">
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={resolvedImage}
          className="w-full h-full object-cover"
        >
          <source src={resolvedVideo} type="video/mp4" />
        </video>
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
