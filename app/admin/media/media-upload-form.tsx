"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

function UploadCard({
  type,
  label,
  accept,
  currentUrl,
  hint,
}: {
  type: "video" | "image";
  label: string;
  accept: string;
  currentUrl: string | null;
  hint: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    router.refresh();
  }

  async function handleReset() {
    setError(null);
    setResetting(true);

    const res = await fetch("/api/admin/media/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setResetting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not reset.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-bold text-navy">{label}</p>
      <p className="text-[11px] text-ink-soft mt-1">{hint}</p>

      {currentUrl ? (
        <p className="text-[11px] text-success font-semibold mt-3">
          ✓ Custom {type} is active
        </p>
      ) : (
        <p className="text-[11px] text-ink-soft mt-3">
          Using the default local file / gradient fallback.
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 bg-blue-deep text-white text-xs font-bold rounded-xl py-2.5"
        >
          {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        </button>
        {currentUrl && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 rounded-xl border border-line text-xs font-bold text-ink-soft"
          >
            {resetting ? "…" : "Reset"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default function MediaUploadForm({
  currentVideoUrl,
  currentImageUrl,
}: {
  currentVideoUrl: string | null;
  currentImageUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <UploadCard
        type="video"
        label="Background video"
        accept="video/mp4"
        currentUrl={currentVideoUrl}
        hint="MP4 only, under 4MB. Optional — the image below works alone too."
      />
      <UploadCard
        type="image"
        label="Background image"
        accept="image/jpeg,image/png,image/webp"
        currentUrl={currentImageUrl}
        hint="JPG, PNG, or WebP, under 1MB. Used as the video's poster frame, or as the whole background if you skip video."
      />
    </div>
  );
}
