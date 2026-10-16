"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ChangePasscodeForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPasscode.length < 8) {
      setError("New passcode must be at least 8 characters.");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setError("New passcode and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/account/passcode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not update your passcode.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-brand-deep">
        {forced ? "Temporary passcode" : "Current passcode"}
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPasscode}
          onChange={(event) => setCurrentPasscode(event.target.value)}
          className="mt-1 w-full rounded border border-brand-deep/30 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm font-semibold text-brand-deep">
        New passcode
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPasscode}
          onChange={(event) => setNewPasscode(event.target.value)}
          className="mt-1 w-full rounded border border-brand-deep/30 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm font-semibold text-brand-deep">
        Confirm new passcode
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPasscode}
          onChange={(event) => setConfirmPasscode(event.target.value)}
          className="mt-1 w-full rounded border border-brand-deep/30 px-3 py-2 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand-deep px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-deep/90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Update passcode"}
      </button>
    </form>
  );
}
