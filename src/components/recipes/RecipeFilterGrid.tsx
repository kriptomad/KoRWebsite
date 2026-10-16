"use client";

import { useMemo, useState } from "react";
import type { Product, Recipe, RecipeDifficulty } from "@/types";
import { RecipeCard } from "@/components/recipes/RecipeCard";

const DIFFICULTIES: RecipeDifficulty[] = ["easy", "medium", "advanced"];

export function RecipeFilterGrid({ recipes, products }: { recipes: Recipe[]; products: Product[] }) {
  const [productSlug, setProductSlug] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | "all">("all");
  const [maxTotalTime, setMaxTotalTime] = useState<number>(120);

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesProduct = productSlug === "all" || recipe.productSlugs.includes(productSlug);
      const matchesDifficulty = difficulty === "all" || recipe.difficulty === difficulty;
      const matchesTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes <= maxTotalTime;
      return matchesProduct && matchesDifficulty && matchesTime;
    });
  }, [recipes, productSlug, difficulty, maxTotalTime]);

  return (
    <div>
      <fieldset className="mb-8 grid gap-4 rounded-lg border border-brand-deep/15 bg-brand-cream p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-brand-deep">Filter recipes</legend>

        <label className="flex flex-col gap-1 text-sm">
          <span>Main ingredient</span>
          <select
            value={productSlug}
            onChange={(event) => setProductSlug(event.target.value)}
            className="rounded border border-brand-deep/20 bg-white px-3 py-2"
          >
            <option value="all">All products</option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as RecipeDifficulty | "all")}
            className="rounded border border-brand-deep/20 bg-white px-3 py-2"
          >
            <option value="all">Any difficulty</option>
            {DIFFICULTIES.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Max total time: {maxTotalTime} min</span>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={maxTotalTime}
            onChange={(event) => setMaxTotalTime(Number(event.target.value))}
          />
        </label>
      </fieldset>

      <p className="mb-4 text-sm text-brand-deep/70" role="status">
        {filtered.length} recipe{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe._id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
