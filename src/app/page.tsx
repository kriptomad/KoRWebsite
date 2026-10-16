import Link from "next/link";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { PostCard } from "@/components/blog/PostCard";
import { getHeroSlides, getPosts, getProducts, getRecipes } from "@/lib/data/content";

export const revalidate = 300;

function SectionHeading({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel,
}: {
  eyebrow: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="section-eyebrow">{eyebrow}</span>
        <h2 className="mt-2 text-3xl font-bold text-brand-deep">{title}</h2>
      </div>
      <Link
        href={viewAllHref}
        className="group inline-flex items-center gap-1.5 rounded-full border border-brand-deep/15 px-5 py-2.5 text-sm font-semibold text-brand-deep transition-all duration-300 hover:border-brand-deep hover:bg-brand-deep hover:text-brand-cream"
      >
        {viewAllLabel}
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}

export default async function Home() {
  const [heroSlides, products, recipes, posts] = await Promise.all([
    getHeroSlides(),
    getProducts(),
    getRecipes(),
    getPosts(),
  ]);

  return (
    <div>
      <HeroCarousel slides={heroSlides} />

      <section aria-labelledby="products-heading" className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="Today's catch"
          title="Fresh from the slab"
          viewAllHref="/products"
          viewAllLabel="View all products"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      <section aria-labelledby="recipes-heading" className="bg-brand-cream px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Culinary hub"
            title="Recipes worth the trip"
            viewAllHref="/recipes"
            viewAllLabel="Browse all recipes"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.slice(0, 3).map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="news-heading" className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="The journal"
          title="Market news & stories"
          viewAllHref="/news"
          viewAllLabel="Read the journal"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
