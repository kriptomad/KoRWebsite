import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortionScaler } from "@/components/recipes/PortionScaler";
import { StepChecklist } from "@/components/recipes/StepChecklist";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProducts, getRecipeBySlug, getRecipes } from "@/lib/data/content";
import { listApprovedComments } from "@/lib/db/comments";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return recipes.map((recipe) => ({ slug: recipe.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return {};
  return buildMetadata({
    title: `${recipe.title} | Kay O'Connell Fishmongers`,
    description: recipe.summary,
    path: `/recipes/${recipe.slug}`,
    imageUrl: recipe.imageUrl,
  });
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [recipe, products] = await Promise.all([getRecipeBySlug(slug), getProducts()]);
  if (!recipe) notFound();

  const comments = await listApprovedComments("recipe", recipe._id);
  const boundProducts = products.filter((p) => recipe.productSlugs.includes(p.slug));

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.summary,
    image: `${siteConfig.url}${recipe.imageUrl}`,
    recipeYield: `${recipe.servings} servings`,
    prepTime: `PT${recipe.prepTimeMinutes}M`,
    cookTime: `PT${recipe.cookTimeMinutes}M`,
    recipeIngredient: recipe.ingredients.map((i) => i.label),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <JsonLd data={recipeJsonLd} />

      <div className="relative h-72 w-full overflow-hidden rounded-3xl shadow-sm md:h-96">
        <Image src={recipe.imageUrl} alt={recipe.imageAlt} fill sizes="100vw" className="object-cover" priority />
      </div>

      <h1 className="mt-6 text-4xl font-bold text-brand-deep">{recipe.title}</h1>
      <p className="mt-2 text-brand-ink/70">{recipe.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-brand-deep">
        <span className="rounded-full bg-brand-cream px-3 py-1.5">Prep {recipe.prepTimeMinutes} min</span>
        <span className="rounded-full bg-brand-cream px-3 py-1.5">Cook {recipe.cookTimeMinutes} min</span>
        <span className="rounded-full bg-brand-cream px-3 py-1.5 capitalize">Difficulty: {recipe.difficulty}</span>
        <span className="rounded-full bg-brand-cream px-3 py-1.5">{recipe.cuisine} cuisine</span>
      </div>

      {boundProducts.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {boundProducts.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-deep-dark shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-md"
            >
              Order this catch today: {product.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <PortionScaler baseServings={recipe.servings} ingredients={recipe.ingredients} />
        <div>
          <h2 className="mb-3 font-semibold text-brand-deep">Method</h2>
          <StepChecklist steps={recipe.steps} />
        </div>
      </div>

      <section aria-labelledby="comments-heading" className="mt-16 border-t border-brand-deep/10 pt-10">
        <h2 id="comments-heading" className="mb-4 text-2xl font-semibold text-brand-deep">
          Comments
        </h2>
        <CommentList comments={comments} />
        <div className="mt-8">
          <CommentForm targetType="recipe" targetId={recipe._id} />
        </div>
      </section>
    </div>
  );
}
