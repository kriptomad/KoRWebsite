import { isSanityConfigured, sanityClient } from "@/lib/sanity/client";
import {
  heroSlidesQuery,
  postBySlugQuery,
  postsQuery,
  productBySlugQuery,
  productsQuery,
  recipeBySlugQuery,
  recipesQuery,
} from "@/lib/sanity/queries";
import {
  listHeroSlides,
  listPosts,
  listProducts,
  listRecipes,
} from "@/lib/db/content-store";
import type { HeroSlide, Post, Product, Recipe } from "@/types";

/** ISR revalidation window (seconds) for high-traffic public catalog/blog pages (FRD 3.1). */
export const CATALOG_REVALIDATE_SECONDS = 300;

// Content source priority:
//  1. Sanity (only if an operator has deliberately configured it as an advanced
//     external CMS swap-in — see src/lib/sanity/client.ts).
//  2. The first-party CMS content store (src/lib/db/content-store.ts), which is
//     what the Owner's Command Dashboard CRUD modules read/write. This is the
//     default and primary source for this deployment.

export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(heroSlidesQuery, {}, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  return listHeroSlides();
}

export async function getProducts(): Promise<Product[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(productsQuery, {}, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  return listProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(productBySlugQuery, { slug }, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  const products = await listProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getRecipes(): Promise<Recipe[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(recipesQuery, {}, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  return listRecipes();
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(recipeBySlugQuery, { slug }, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  const recipes = await listRecipes();
  return recipes.find((recipe) => recipe.slug === slug) ?? null;
}

export async function getPosts(): Promise<Post[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(postsQuery, {}, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  return listPosts();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(postBySlugQuery, { slug }, { next: { revalidate: CATALOG_REVALIDATE_SECONDS } });
  }
  const posts = await listPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getRecipesForProduct(productSlug: string): Promise<Recipe[]> {
  const recipes = await getRecipes();
  return recipes.filter((recipe) => recipe.productSlugs.includes(productSlug));
}

