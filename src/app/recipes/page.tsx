import { RecipeFilterGrid } from "@/components/recipes/RecipeFilterGrid";
import { getProducts, getRecipes } from "@/lib/data/content";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Recipes | Kay O'Connell Fishmongers",
  description: "Culinary guides and recipes built around today's freshest seafood.",
  path: "/recipes",
});

export default async function RecipesPage() {
  const [recipes, products] = await Promise.all([getRecipes(), getProducts()]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <span className="section-eyebrow">Culinary hub</span>
      <h1 className="mt-2 text-4xl font-bold text-brand-deep">The Culinary Hub</h1>
      <p className="mt-3 max-w-2xl text-brand-ink/70">
        Every recipe is bound to the seafood that inspired it — order the catch straight from the recipe page.
      </p>

      <div className="mt-12">
        <RecipeFilterGrid recipes={recipes} products={products} />
      </div>
    </div>
  );
}
