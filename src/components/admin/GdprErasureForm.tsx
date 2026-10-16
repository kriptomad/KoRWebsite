"use client";

import { useState } from "react";

export function GdprErasureForm() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/admin/gdpr-erasure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setResult(`Erased ${data.purgedCount} record(s) associated with ${email}.`);
      setEmail("");
    } else {
      setError(data.error ?? "Could not process the erasure request.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>Requester&apos;s email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-brand-deep/20 px-3 py-2"
        />
      </label>

      {result ? <p role="status" className="text-sm text-brand-deep">{result}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-deep px-6 py-2 font-semibold text-brand-cream hover:bg-brand-deep-light disabled:opacity-60"
      >
        {submitting ? "Processing…" : "Erase all data for this email"}
      </button>
    </form>
  );
}
