"use client";

import { useRef, useState } from "react";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  alt: string;
  onValueChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  required?: boolean;
}

/** Shared CMS field: uploads an image file to /api/admin/uploads, stores the
 * returned URL + alt text in the parent form's state. Used by every content
 * manager (Hero, Products, Recipes, Posts). */
export function ImageUploadField({
  label,
  value,
  alt,
  onValueChange,
  onAltChange,
  required,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      onValueChange(payload.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-brand-deep">
        {label} {required ? <span className="text-brand-gold-dark">*</span> : null}
      </label>
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-brand-deep/20 bg-brand-cream">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary uploaded/local image
            <img src={value} alt={alt || ""} className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-brand-ink/50">No image</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-brand-ink/80 file:mr-3 file:rounded-full file:border-0 file:bg-brand-deep file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-cream hover:file:bg-brand-deep-dark"
          />
          <input
            value={alt}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Image alt text (required for accessibility & SEO)"
            className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
          />
          {uploading ? <p className="text-xs text-brand-ink/60">Uploading…</p> : null}
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
