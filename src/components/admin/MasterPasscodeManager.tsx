"use client";

import { useState } from "react";

export function MasterPasscodeManager() {
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

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
      const response = await fetch("/api/admin/site-settings/passcode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not update the passcode.");
        return;
      }
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-brand-deep">Owner master passcode</h2>
        <p className="mt-1 text-xs text-brand-ink/60">
          This is the recovery sign-in for /admin, used when staff accounts aren&apos;t available. Change it here instead
          of asking a developer to edit environment variables.
        </p>
      </div>

      <label className="block text-sm font-semibold text-brand-deep">
        Current passcode
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
      {saved && !saving ? <p className="text-sm text-brand-deep">Passcode updated.</p> : null}

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
