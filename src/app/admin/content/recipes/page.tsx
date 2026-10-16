import { requirePermission } from "@/lib/auth/require-role";
import { listProducts, listRecipes } from "@/lib/db/content-store";
import { RecipeManager } from "@/components/admin/RecipeManager";

export default async function RecipesContentPage() {
  await requirePermission("recipes.manage");
  const [recipes, products] = await Promise.all([listRecipes(), listProducts()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Culinary &amp; Recipe Engine</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Build recipes with structured ingredients, step-by-step method, and binding to the products that anchor them.
      </p>
      <div className="mt-8">
        <RecipeManager initialRecipes={recipes} products={products} />
      </div>
    </div>
  );
}
