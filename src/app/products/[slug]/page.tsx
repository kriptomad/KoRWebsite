import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { NutritionFacts } from "@/components/products/NutritionFacts";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { getProductBySlug, getProducts, getRecipesForProduct } from "@/lib/data/content";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 300;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildMetadata({
    title: `${product.name} | Kay O'Connell Fishmongers`,
    description: product.description,
    path: `/products/${product.slug}`,
    imageUrl: product.imageUrl,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const relatedRecipes = await getRecipesForProduct(slug);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative h-80 w-full overflow-hidden rounded-3xl shadow-sm md:h-full">
          <Image src={product.imageUrl} alt={product.imageAlt} fill sizes="50vw" className="object-cover" priority />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-brand-deep">{product.name}</h1>
          <p className="italic text-brand-deep/60">{product.scientificName}</p>
          <p className="mt-4 text-brand-ink/80">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-semibold text-brand-deep">Port of origin</dt>
              <dd>{product.portOfOrigin}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-deep">Season</dt>
              <dd>{MONTHS[product.seasonStart - 1]} – {MONTHS[product.seasonEnd - 1]}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-deep">Allergens</dt>
              <dd className="capitalize">{product.allergens.join(", ")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-deep">Price</dt>
              <dd>€{product.pricePerKg.toFixed(2)} / kg</dd>
            </div>
          </dl>

          <h2 className="mt-8 mb-3 text-lg font-semibold text-brand-deep">Nutritional information</h2>
          <NutritionFacts nutrition={product.nutrition} />
        </div>
      </div>

      {relatedRecipes.length > 0 ? (
        <section aria-labelledby="related-recipes-heading" className="mt-16">
          <span className="section-eyebrow">Pairs well</span>
          <h2 id="related-recipes-heading" className="mb-6 mt-2 text-2xl font-bold text-brand-deep">
            Cook it tonight
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedRecipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href="/products"
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-dark transition-colors hover:text-brand-gold"
      >
        ← Back to all products
      </Link>
    </div>
  );
}
