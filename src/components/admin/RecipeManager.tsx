"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Product, Recipe, RecipeDifficulty, RecipeIngredient, RecipeStep } from "@/types";

interface Draft {
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  servings: number;
  cuisine: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  productSlugs: string[];
}

const EMPTY_DRAFT: Draft = {
  title: "",
  summary: "",
  imageUrl: "",
  imageAlt: "",
  prepTimeMinutes: 15,
  cookTimeMinutes: 15,
  difficulty: "easy",
  servings: 4,
  cuisine: "",
  ingredients: [{ label: "" }],
  steps: [{ title: "", body: "" }],
  productSlugs: [],
};

export function RecipeManager({
  initialRecipes,
  products,
}: {
  initialRecipes: Recipe[];
  products: Product[];
}) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(recipe: Recipe) {
    setEditingId(recipe._id);
    setDraft({
      title: recipe.title,
      summary: recipe.summary,
      imageUrl: recipe.imageUrl,
      imageAlt: recipe.imageAlt,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      ingredients: recipe.ingredients.length ? recipe.ingredients : [{ label: "" }],
      steps: recipe.steps.length ? recipe.steps : [{ title: "", body: "" }],
      productSlugs: recipe.productSlugs,
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
    const ingredients = draft.ingredients.filter((i) => i.label.trim());
    const steps = draft.steps.filter((s) => s.title.trim() && s.body.trim());
    if (!draft.title.trim() || !draft.imageUrl || !draft.imageAlt.trim() || !ingredients.length || !steps.length) {
      setError("Title, image, at least one ingredient, and at least one step are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(editingId ? `/api/admin/recipes/${editingId}` : "/api/admin/recipes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ingredients, steps }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save the recipe.");
        return;
      }
      const saved: Recipe = payload.recipe;
      setRecipes((prev) =>
        editingId ? prev.map((r) => (r._id === saved._id ? saved : r)) : [...prev, saved],
      );
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this recipe?")) return;
    const response = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    if (response.ok) {
      setRecipes((prev) => prev.filter((r) => r._id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    }
  }

  function updateIngredient(index: number, patch: Partial<RecipeIngredient>) {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    }));
  }

  function updateStep(index: number, patch: Partial<RecipeStep>) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    }));
  }

  return (
    <div className="space-y-10">
      <ul className="space-y-3">
        {recipes.map((recipe) => (
          <li
            key={recipe._id}
            className="flex items-center gap-4 rounded-lg border border-brand-deep/15 bg-white p-4 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of uploaded/local image */}
            <img src={recipe.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-brand-deep">{recipe.title}</p>
              <p className="truncate text-sm text-brand-ink/60">
                {recipe.cuisine} · {recipe.difficulty} · {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => startEdit(recipe)}
                className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(recipe._id)}
                className="rounded border border-red-700/30 px-3 py-1 font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {recipes.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No recipes yet — add the first one below.</p>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-brand-deep">{editingId ? "Edit recipe" : "Add a new recipe"}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Title *</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Summary *</span>
            <textarea
              value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Cuisine *</span>
            <input
              value={draft.cuisine}
              onChange={(e) => setDraft((d) => ({ ...d, cuisine: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Difficulty</span>
            <select
              value={draft.difficulty}
              onChange={(e) => setDraft((d) => ({ ...d, difficulty: e.target.value as RecipeDifficulty }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Prep time (min)</span>
            <input
              type="number"
              min={0}
              value={draft.prepTimeMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, prepTimeMinutes: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Cook time (min)</span>
            <input
              type="number"
              min={0}
              value={draft.cookTimeMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, cookTimeMinutes: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Servings</span>
            <input
              type="number"
              min={1}
              value={draft.servings}
              onChange={(e) => setDraft((d) => ({ ...d, servings: Number(e.target.value) }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
        </div>

        <fieldset className="rounded-lg border border-brand-deep/15 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-deep">Ingredients *</legend>
          <div className="space-y-2">
            {draft.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={ingredient.label}
                  onChange={(e) => updateIngredient(index, { label: e.target.value })}
                  placeholder="e.g. 400g Atlantic hake fillets"
                  className="flex-1 rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                />
                <select
                  value={ingredient.productSlug ?? ""}
                  onChange={(e) => updateIngredient(index, { productSlug: e.target.value || undefined })}
                  className="rounded border border-brand-deep/20 px-2 py-1.5 text-sm"
                >
                  <option value="">Link product (optional)</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== index) }))
                  }
                  className="rounded border border-red-700/30 px-2 text-red-700 hover:bg-red-50"
                  aria-label="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, ingredients: [...d.ingredients, { label: "" }] }))}
            className="mt-2 rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
          >
            + Add ingredient
          </button>
        </fieldset>

        <fieldset className="rounded-lg border border-brand-deep/15 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-deep">Method steps *</legend>
          <div className="space-y-3">
            {draft.steps.map((step, index) => (
              <div key={index} className="flex gap-2 rounded border border-brand-deep/10 p-2">
                <div className="flex-1 space-y-1">
                  <input
                    value={step.title}
                    onChange={(e) => updateStep(index, { title: e.target.value })}
                    placeholder={`Step ${index + 1} title`}
                    className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                  />
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(index, { body: e.target.value })}
                    placeholder="Step instructions"
                    rows={2}
                    className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== index) }))}
                  className="rounded border border-red-700/30 px-2 text-red-700 hover:bg-red-50"
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, steps: [...d.steps, { title: "", body: "" }] }))}
            className="mt-2 rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
          >
            + Add step
          </button>
        </fieldset>

        <fieldset className="rounded-lg border border-brand-deep/15 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-deep">Related products</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {products.map((product) => (
              <label key={product.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.productSlugs.includes(product.slug)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      productSlugs: e.target.checked
                        ? [...d.productSlugs, product.slug]
                        : d.productSlugs.filter((s) => s !== product.slug),
                    }))
                  }
                  className="h-4 w-4 accent-brand-deep"
                />
                {product.name}
              </label>
            ))}
          </div>
        </fieldset>

        <ImageUploadField
          label="Recipe image"
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Add recipe"}
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
