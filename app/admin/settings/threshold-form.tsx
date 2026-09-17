"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ThresholdForm({ currentThresholdNaira }: { currentThresholdNaira: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentThresholdNaira));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSaved(false);
    setLoading(true);

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thresholdNaira: Number(value) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 max-w-xs">
      <label className="text-xs font-semibold text-navy">
        Instant-transfer limit (₦)
      </label>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input-field mt-1.5"
      />
      <p className="text-[11px] text-ink-soft mt-1.5">
        Withdrawals at or above this amount need approval from{" "}
        <span className="font-semibold">/admin/withdrawals</span> instead
        of transferring instantly.
      </p>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {saved && !error && <p className="text-xs text-success mt-2">Saved.</p>}

      <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-3 w-full !py-2.5 text-sm">
        {loading ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
