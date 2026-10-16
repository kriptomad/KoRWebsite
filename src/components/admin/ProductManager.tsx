"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Product } from "@/types";

interface Draft {
  name: string;
  scientificName: string;
  portOfOrigin: string;
  seasonStart: number;
  seasonEnd: number;
  allergensText: string;
  pricePerKg: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  caloriesKcal: number;
  proteinG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  omega3G: number;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  scientificName: "",
  portOfOrigin: "",
  seasonStart: 1,
  seasonEnd: 12,
  allergensText: "fish",
  pricePerKg: 0,
  imageUrl: "",
  imageAlt: "",
  description: "",
  caloriesKcal: 0,
  proteinG: 0,
  saturatedFatG: 0,
  unsaturatedFatG: 0,
  omega3G: 0,
};

function toPayload(draft: Draft) {
  return {
    name: draft.name,
    scientificName: draft.scientificName,
    portOfOrigin: draft.portOfOrigin,
    seasonStart: Number(draft.seasonStart),
    seasonEnd: Number(draft.seasonEnd),
    allergens: draft.allergensText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    pricePerKg: Number(draft.pricePerKg),
    imageUrl: draft.imageUrl,
    imageAlt: draft.imageAlt,
    description: draft.description,
    nutrition: {
      caloriesKcal: Number(draft.caloriesKcal),
      proteinG: Number(draft.proteinG),
      saturatedFatG: Number(draft.saturatedFatG),
      unsaturatedFatG: Number(draft.unsaturatedFatG),
      omega3G: Number(draft.omega3G),
      servingSizeG: 100 as const,
    },
  };
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(product: Product) {
    setEditingId(product._id);
    setDraft({
      name: product.name,
      scientificName: product.scientificName,
      portOfOrigin: product.portOfOrigin,
      seasonStart: product.seasonStart,
      seasonEnd: product.seasonEnd,
      allergensText: product.allergens.join(", "),
      pricePerKg: product.pricePerKg,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      description: product.description,
      caloriesKcal: product.nutrition.caloriesKcal,
      proteinG: product.nutrition.proteinG,
      saturatedFatG: product.nutrition.saturatedFatG,
      unsaturatedFatG: product.nutrition.unsaturatedFatG,
      omega3G: product.nutrition.omega3G,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.imageUrl || !draft.imageAlt.trim() || !draft.description.trim()) {
      setError("Name, image, image alt text, and description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save the product.");
        return;
      }
      const saved: Product = payload.product;
      setProducts((prev) =>
        editingId ? prev.map((p) => (p._id === saved._id ? saved : p)) : [...prev, saved],
      );
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this product? This cannot be undone.")) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (response.ok) {
      setProducts((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    }
  }

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-lg border border-brand-deep/15 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-cream/60 text-brand-deep">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Origin</th>
              <th className="px-4 py-2">Price / kg</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t border-brand-deep/10">
                <td className="px-4 py-2 font-semibold text-brand-ink">{product.name}</td>
                <td className="px-4 py-2 text-brand-ink/70">{product.portOfOrigin}</td>
                <td className="px-4 py-2 text-brand-ink/70">€{product.pricePerKg.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="mr-2 rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                    className="rounded border border-red-700/30 px-3 py-1 font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-brand-ink/60">
                  No products yet — add the first one below.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-brand-deep">{editingId ? "Edit product" : "Add a new product"}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Name *</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Scientific name *</span>
            <input
              value={draft.scientificName}
              onChange={(e) => setDraft((d) => ({ ...d, scientificName: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Port of origin *</span>
            <input
              value={draft.portOfOrigin}
              onChange={(e) => setDraft((d) => ({ ...d, portOfOrigin: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Price per kg (€) *</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.pricePerKg}
              onChange={(e) => setDraft((d) => ({ ...d, pricePerKg: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Season start (month)</span>
            <input
              type="number"
              min={1}
              max={12}
              value={draft.seasonStart}
              onChange={(e) => setDraft((d) => ({ ...d, seasonStart: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Season end (month)</span>
            <input
              type="number"
              min={1}
              max={12}
              value={draft.seasonEnd}
              onChange={(e) => setDraft((d) => ({ ...d, seasonEnd: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Allergens (comma separated)</span>
            <input
              value={draft.allergensText}
              onChange={(e) => setDraft((d) => ({ ...d, allergensText: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Description *</span>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
        </div>

        <fieldset className="rounded-lg border border-brand-deep/15 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-deep">
            Nutrition facts (per 100g serving)
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-5">
            {([
              ["caloriesKcal", "Calories (kcal)"],
              ["proteinG", "Protein (g)"],
              ["saturatedFatG", "Sat. fat (g)"],
              ["unsaturatedFatG", "Unsat. fat (g)"],
              ["omega3G", "Omega-3 (g)"],
            ] as const).map(([key, label]) => (
              <label key={key} className="block text-xs">
                <span className="font-semibold text-brand-deep">{label}</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={draft[key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
                  className="mt-1 w-full rounded border border-brand-deep/20 px-2 py-1"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <ImageUploadField
          label="Product image"
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
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
