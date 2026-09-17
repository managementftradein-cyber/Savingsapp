"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawalActions({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    setError(null);

    const res = await fetch(`/api/admin/withdrawals/${transactionId}/${action}`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          onClick={() => act("approve")}
          disabled={loading !== null}
          className="flex-1 bg-success text-white text-xs font-bold rounded-xl py-2.5"
        >
          {loading === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="flex-1 bg-[#C5453A] text-white text-xs font-bold rounded-xl py-2.5"
        >
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
