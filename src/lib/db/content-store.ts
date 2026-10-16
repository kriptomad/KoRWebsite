import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore, type StoreShape } from "@/lib/db/file-store";
import { slugify, uniqueSlug } from "@/lib/slugify";
import type { HeroSlide, Post, Product, Recipe } from "@/types";

// First-party CMS content store (hero slides, products, recipes, posts).
// This is the real, writable backing store for the Owner's Command Dashboard
// CRUD modules — it is what public pages read from (via src/lib/data/content.ts)
// after the Owner publishes a change. Dual-mode like the other db/* stores:
// Supabase/Postgres when configured, durable file-backed JSON otherwise
// (see src/lib/db/file-store.ts). Sanity remains available as an optional,
// advanced swap-in content source (src/lib/sanity) but is no longer required
// for the Owner to manage content day-to-day.

type EntityKey = "heroSlides" | "products" | "recipes" | "posts";

const SB_TABLE: Record<EntityKey, string> = {
  heroSlides: "hero_slides",
  products: "products",
  recipes: "recipes",
  posts: "posts",
};

async function sbList<T>(key: EntityKey): Promise<T[]> {
  const { data, error } = await supabaseAdmin!
    .from(SB_TABLE[key])
    .select("data")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: { data: T }) => row.data);
}

/** Small catalogs (a handful of slides/products/recipes/posts) — simplest
 *  correct approach is to replace the whole table on every write, keeping
 *  array order (= display/carousel order) in sync via the `position` column. */
async function sbReplaceAll<T extends { _id: string }>(key: EntityKey, items: T[]): Promise<void> {
  const table = SB_TABLE[key];
  // hero_slides has no `slug` column (unlike products/recipes/posts) — including
  // it in the insert payload for that table trips an "undefined column" error.
  const hasSlugColumn = key !== "heroSlides";
  const { error: delError } = await supabaseAdmin!.from(table).delete().not("id", "is", null);
  if (delError) throw delError;
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item._id,
    ...(hasSlugColumn ? { slug: (item as unknown as { slug?: string }).slug ?? null } : {}),
    position: index,
    data: item,
  }));
  const { error } = await supabaseAdmin!.from(table).insert(rows);
  if (error) throw error;
}

async function listEntities<T>(key: EntityKey): Promise<T[]> {
  if (isSupabaseConfigured && supabaseAdmin) return sbList<T>(key);
  const store = await readStore();
  return store[key] as unknown as T[];
}

async function mutateEntities<T>(key: EntityKey, mutate: (list: T[]) => T[]): Promise<T[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const current = await sbList<T>(key);
    const next = mutate(current);
    await sbReplaceAll(key, next as unknown as { _id: string }[]);
    return next;
  }
  let next: T[] = [];
  await writeStore((store) => {
    const list = store[key as keyof StoreShape] as unknown as T[];
    next = mutate(list);
    (store[key as keyof StoreShape] as unknown as T[]) = next;
  });
  return next;
}

// ---------------------------------------------------------------------------
// Hero slides
// ---------------------------------------------------------------------------

export async function listHeroSlides(): Promise<HeroSlide[]> {
  return listEntities<HeroSlide>("heroSlides");
}

export async function createHeroSlide(input: Omit<HeroSlide, "_id">): Promise<HeroSlide> {
  const slide: HeroSlide = { _id: randomUUID(), ...input };
  await mutateEntities<HeroSlide>("heroSlides", (list) => [...list, slide]);
  return slide;
}

export async function updateHeroSlide(id: string, patch: Partial<Omit<HeroSlide, "_id">>): Promise<HeroSlide> {
  let updated: HeroSlide | undefined;
  await mutateEntities<HeroSlide>("heroSlides", (list) =>
    list.map((slide) => {
      if (slide._id !== id) return slide;
      updated = { ...slide, ...patch };
      return updated;
    }),
  );
  if (!updated) throw new Error("Hero slide not found");
  return updated;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await mutateEntities<HeroSlide>("heroSlides", (list) => list.filter((slide) => slide._id !== id));
}

export async function moveHeroSlide(id: string, direction: "up" | "down"): Promise<HeroSlide[]> {
  return mutateEntities<HeroSlide>("heroSlides", (list) => {
    const index = list.findIndex((s) => s._id === id);
    if (index === -1) return list;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  return listEntities<Product>("products");
}

export async function createProduct(input: Omit<Product, "_id" | "slug"> & { slug?: string }): Promise<Product> {
  const products = await listProducts();
  const { slug: slugInput, ...rest } = input;
  const slug = uniqueSlug(slugify(slugInput || rest.name), products.map((p) => p.slug));
  const product: Product = { _id: randomUUID(), slug, ...rest };
  await mutateEntities<Product>("products", (list) => [...list, product]);
  return product;
}

export async function updateProduct(id: string, patch: Partial<Omit<Product, "_id">>): Promise<Product> {
  const products = await listProducts();
  const current = products.find((p) => p._id === id);
  if (!current) throw new Error("Product not found");
  let nextSlug: string | undefined;
  if (patch.slug || patch.name) {
    const candidate = slugify(patch.slug || patch.name || current.name);
    nextSlug = uniqueSlug(
      candidate,
      products.map((p) => p.slug),
      current.slug,
    );
  }
  let updated: Product | undefined;
  await mutateEntities<Product>("products", (list) =>
    list.map((product) => {
      if (product._id !== id) return product;
      updated = { ...product, ...patch, ...(nextSlug ? { slug: nextSlug } : {}) };
      return updated;
    }),
  );
  if (!updated) throw new Error("Product not found");
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  await mutateEntities<Product>("products", (list) => list.filter((p) => p._id !== id));
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export async function listRecipes(): Promise<Recipe[]> {
  return listEntities<Recipe>("recipes");
}

export async function createRecipe(input: Omit<Recipe, "_id" | "slug"> & { slug?: string }): Promise<Recipe> {
  const recipes = await listRecipes();
  const { slug: slugInput, ...rest } = input;
  const slug = uniqueSlug(slugify(slugInput || rest.title), recipes.map((r) => r.slug));
  const recipe: Recipe = { _id: randomUUID(), slug, ...rest };
  await mutateEntities<Recipe>("recipes", (list) => [...list, recipe]);
  return recipe;
}

export async function updateRecipe(id: string, patch: Partial<Omit<Recipe, "_id">>): Promise<Recipe> {
  const recipes = await listRecipes();
  const current = recipes.find((r) => r._id === id);
  if (!current) throw new Error("Recipe not found");
  let nextSlug: string | undefined;
  if (patch.slug || patch.title) {
    const candidate = slugify(patch.slug || patch.title || current.title);
    nextSlug = uniqueSlug(
      candidate,
      recipes.map((r) => r.slug),
      current.slug,
    );
  }
  let updated: Recipe | undefined;
  await mutateEntities<Recipe>("recipes", (list) =>
    list.map((recipe) => {
      if (recipe._id !== id) return recipe;
      updated = { ...recipe, ...patch, ...(nextSlug ? { slug: nextSlug } : {}) };
      return updated;
    }),
  );
  if (!updated) throw new Error("Recipe not found");
  return updated;
}

export async function deleteRecipe(id: string): Promise<void> {
  await mutateEntities<Recipe>("recipes", (list) => list.filter((r) => r._id !== id));
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function listPosts(): Promise<Post[]> {
  return listEntities<Post>("posts");
}

export async function createPost(input: Omit<Post, "_id" | "slug"> & { slug?: string }): Promise<Post> {
  const posts = await listPosts();
  const { slug: slugInput, ...rest } = input;
  const slug = uniqueSlug(slugify(slugInput || rest.title), posts.map((p) => p.slug));
  const post: Post = { _id: randomUUID(), slug, ...rest };
  await mutateEntities<Post>("posts", (list) => [...list, post]);
  return post;
}

export async function updatePost(id: string, patch: Partial<Omit<Post, "_id">>): Promise<Post> {
  const posts = await listPosts();
  const current = posts.find((p) => p._id === id);
  if (!current) throw new Error("Post not found");
  let nextSlug: string | undefined;
  if (patch.slug || patch.title) {
    const candidate = slugify(patch.slug || patch.title || current.title);
    nextSlug = uniqueSlug(
      candidate,
      posts.map((p) => p.slug),
      current.slug,
    );
  }
  let updated: Post | undefined;
  await mutateEntities<Post>("posts", (list) =>
    list.map((post) => {
      if (post._id !== id) return post;
      updated = { ...post, ...patch, ...(nextSlug ? { slug: nextSlug } : {}) };
      return updated;
    }),
  );
  if (!updated) throw new Error("Post not found");
  return updated;
}

export async function deletePost(id: string): Promise<void> {
  await mutateEntities<Post>("posts", (list) => list.filter((p) => p._id !== id));
}
