"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    const nextPath = searchParams.get("next") ?? "/dashboard";

    if (data.needsMfa) {
      router.push(`/auth/mfa-challenge?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm w-full mx-auto bg-surface/95 backdrop-blur rounded-[28px] shadow-2xl p-7">
        <h1 className="font-display font-extrabold text-2xl text-navy">
          Welcome back
        </h1>
        <p className="text-sm text-ink-soft mt-2">Log in to your Nestegg account.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-navy">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-navy">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-deep">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mt-1.5"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          New to Nestegg?{" "}
          <Link href="/auth/signup" className="text-blue-deep font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
