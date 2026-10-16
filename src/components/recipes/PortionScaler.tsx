"use client";

import { useState } from "react";
import type { RecipeIngredient } from "@/types";

export function PortionScaler({
  baseServings,
  ingredients,
}: {
  baseServings: number;
  ingredients: RecipeIngredient[];
}) {
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div className="rounded-lg border border-brand-deep/15 bg-brand-cream p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-deep">Ingredients</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            aria-label="Decrease servings"
            className="h-8 w-8 rounded-full border border-brand-deep/30 text-brand-deep hover:bg-brand-deep/10"
          >
            −
          </button>
          <span aria-live="polite" className="w-20 text-center text-sm">
            {servings} serving{servings === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => setServings((s) => Math.min(24, s + 1))}
            aria-label="Increase servings"
            className="h-8 w-8 rounded-full border border-brand-deep/30 text-brand-deep hover:bg-brand-deep/10"
          >
            +
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {ingredients.map((ingredient) => (
          <li key={ingredient.label} className="flex items-start gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-gold" />
            <span>{scaleLabel(ingredient.label, scale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function scaleLabel(label: string, scale: number): string {
  if (scale === 1) return label;
  const match = label.match(/^(\d+(\.\d+)?)(.*)$/);
  if (!match) return label;
  const quantity = parseFloat(match[1]) * scale;
  const rounded = Math.round(quantity * 100) / 100;
  return `${rounded}${match[3]}`;
}
