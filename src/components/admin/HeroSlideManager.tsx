"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { HeroSlide } from "@/types";

type DraftSlide = Omit<HeroSlide, "_id">;

const EMPTY_DRAFT: DraftSlide = {
  headline: "",
  subheadline: "",
  ctaLabel: "",
  ctaHref: "",
  imageUrl: "",
  imageAlt: "",
};

export function HeroSlideManager({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [draft, setDraft] = useState<DraftSlide>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(slide: HeroSlide) {
    setEditingId(slide._id);
    setDraft({
      headline: slide.headline,
      subheadline: slide.subheadline ?? "",
      ctaLabel: slide.ctaLabel ?? "",
      ctaHref: slide.ctaHref ?? "",
      imageUrl: slide.imageUrl,
      imageAlt: slide.imageAlt,
    });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.headline.trim() || !draft.imageUrl || !draft.imageAlt.trim()) {
      setError("Headline, image, and image alt text are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(editingId ? `/api/admin/hero/${editingId}` : "/api/admin/hero", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save the slide.");
        return;
      }
      const saved: HeroSlide = payload.heroSlide;
      setSlides((prev) =>
        editingId ? prev.map((s) => (s._id === saved._id ? saved : s)) : [...prev, saved],
      );
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this hero slide?")) return;
    const response = await fetch(`/api/admin/hero/${id}`, { method: "DELETE" });
    if (response.ok) {
      setSlides((prev) => prev.filter((s) => s._id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const response = await fetch(`/api/admin/hero/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (response.ok) {
      const { heroSlides } = await response.json();
      setSlides(heroSlides);
      router.refresh();
    }
  }

  return (
    <div className="space-y-10">
      <ul className="space-y-3">
        {slides.map((slide, index) => (
          <li
            key={slide._id}
            className="flex items-center gap-4 rounded-lg border border-brand-deep/15 bg-white p-4 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of uploaded/local image */}
            <img src={slide.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-brand-deep">{slide.headline}</p>
              <p className="truncate text-sm text-brand-ink/60">{slide.subheadline}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <button
                type="button"
                onClick={() => handleMove(slide._id, "up")}
                disabled={index === 0}
                className="rounded border border-brand-deep/20 px-2 py-1 text-brand-deep disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMove(slide._id, "down")}
                disabled={index === slides.length - 1}
                className="rounded border border-brand-deep/20 px-2 py-1 text-brand-deep disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => startEdit(slide)}
                className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(slide._id)}
                className="rounded border border-red-700/30 px-3 py-1 font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {slides.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No hero slides yet — add the first one below.</p>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-brand-deep">{editingId ? "Edit slide" : "Add a new slide"}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Headline *</span>
            <input
              value={draft.headline}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Subheadline</span>
            <input
              value={draft.subheadline}
              onChange={(e) => setDraft((d) => ({ ...d, subheadline: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">CTA label</span>
            <input
              value={draft.ctaLabel}
              onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">CTA link</span>
            <input
              value={draft.ctaHref}
              onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))}
              placeholder="/products"
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
        </div>

        <ImageUploadField
          label="Slide image"
          value={draft.imageUrl}
          alt={draft.imageAlt}
          onValueChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
          onAltChange={(alt) => setDraft((d) => ({ ...d, imageAlt: alt }))}
          required
        />

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-deep px-5 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-deep-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add slide"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-brand-deep/30 px-5 py-2 text-sm font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
