"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() || undefined, passcode }),
    });

    if (response.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Invalid passcode.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold text-brand-deep">Owner&apos;s Command Dashboard</h1>
      <p className="mt-2 text-sm text-brand-ink/70">Sign in to manage content, moderation and roles.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>Staff email (leave blank to use the Owner master passcode)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-brand-deep/20 px-3 py-2"
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Passcode</span>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="rounded border border-brand-deep/20 px-3 py-2"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-deep px-6 py-2 font-semibold text-brand-cream hover:bg-brand-deep-light disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
