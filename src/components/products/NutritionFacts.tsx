import type { NutritionFacts as NutritionFactsType } from "@/types";

const ROWS: { key: keyof NutritionFactsType; label: string; unit: string }[] = [
  { key: "caloriesKcal", label: "Calories", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "saturatedFatG", label: "Saturated fat", unit: "g" },
  { key: "unsaturatedFatG", label: "Unsaturated fat", unit: "g" },
  { key: "omega3G", label: "Omega-3", unit: "g" },
];

export function NutritionFacts({ nutrition }: { nutrition: NutritionFactsType }) {
  return (
    <table className="w-full max-w-sm border-collapse overflow-hidden rounded-lg border border-brand-deep/15 text-sm">
      <caption className="sr-only">Nutritional information per 100g serving</caption>
      <thead>
        <tr className="bg-brand-deep text-brand-cream">
          <th scope="col" className="px-4 py-2 text-left font-semibold">
            Per {nutrition.servingSizeG}g
          </th>
          <th scope="col" className="px-4 py-2 text-right font-semibold">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key} className="border-t border-brand-deep/10 odd:bg-brand-cream">
            <th scope="row" className="px-4 py-2 text-left font-normal">
              {row.label}
            </th>
            <td className="px-4 py-2 text-right tabular-nums">
              {nutrition[row.key]}
              {row.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
