import Image from "next/image";
import Link from "next/link";
import type { Recipe } from "@/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block overflow-hidden rounded-3xl border border-brand-deep/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={recipe.imageUrl}
          alt={recipe.imageAlt}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-110"
        />
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-brand-deep">{recipe.title}</h3>
        <p className="mt-1 text-sm text-brand-ink/70">{recipe.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-brand-deep">
          <span className="rounded-full bg-brand-cream px-2.5 py-1">{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
          <span className="rounded-full bg-brand-cream px-2.5 py-1 capitalize">{recipe.difficulty}</span>
          <span className="rounded-full bg-brand-cream px-2.5 py-1">{recipe.cuisine}</span>
        </div>
      </div>
    </Link>
  );
}
