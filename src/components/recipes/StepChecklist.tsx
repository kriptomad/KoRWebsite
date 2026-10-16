"use client";

import { useState } from "react";
import type { RecipeStep } from "@/types";

export function StepChecklist({ steps }: { steps: RecipeStep[] }) {
  const [completed, setCompleted] = useState<boolean[]>(() => steps.map(() => false));

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3 rounded-lg border border-brand-deep/15 bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={completed[index]}
              onChange={() =>
                setCompleted((prev) => prev.map((value, i) => (i === index ? !value : value)))
              }
              className="mt-1 h-4 w-4 accent-brand-deep"
            />
            <span>
              <span className={`font-semibold text-brand-deep ${completed[index] ? "line-through opacity-60" : ""}`}>
                {index + 1}. {step.title}
              </span>
              <p className={`mt-1 text-sm text-brand-ink/80 ${completed[index] ? "line-through opacity-60" : ""}`}>
                {step.body}
              </p>
            </span>
          </label>
        </li>
      ))}
    </ol>
  );
}
