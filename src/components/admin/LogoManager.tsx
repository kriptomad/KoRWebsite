"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export function LogoManager({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function persist(nextLogoUrl: string | null) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: nextLogoUrl }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save the logo.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleUploaded(url: string) {
    setLogoUrl(url);
    persist(url);
  }

  function handleReset() {
    setLogoUrl("");
    persist(null);
  }

  return (
    <div className="max-w-md space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm">
      <ImageUploadField label="Site logo" value={logoUrl} alt="" onValueChange={handleUploaded} onAltChange={() => {}} />
      <p className="text-xs text-brand-ink/60">Shown in the header next to the site name. Square images work best.</p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {saving ? <p className="text-sm text-brand-ink/60">Saving…</p> : null}
      {saved && !saving ? <p className="text-sm text-brand-deep">Saved — the new logo is now live.</p> : null}

      {initialLogoUrl || logoUrl ? (
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-brand-deep/30 px-4 py-1.5 text-sm font-semibold text-brand-deep hover:bg-brand-deep/10"
        >
          Reset to default logo
        </button>
      ) : null}
    </div>
  );
}
