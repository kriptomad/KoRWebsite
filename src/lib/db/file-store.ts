import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { AuditLogEntry, Comment, HeroSlide, Post, Product, Recipe, Role } from "@/types";
import { heroSlidesSeed, postsSeed, productsSeed, recipesSeed } from "@/lib/data/seed";
import { DEFAULT_ROLES } from "@/lib/rbac";

// Durable local persistence for demo/dev use when Supabase isn't configured.
// A plain module-level array doesn't survive Next.js dev's per-route module
// isolation (or serverless cold starts) — writing to disk does, and keeps the
// Owner's CMS edits (products/recipes/posts/hero slides, comments, roles,
// audit log) consistent across every route in this environment. For real
// production durability/concurrency, configure Supabase instead (see
// src/lib/db/supabase.ts) which every store module prefers when available.

export interface StoreShape {
  heroSlides: HeroSlide[];
  products: Product[];
  recipes: Recipe[];
  posts: Post[];
  comments: Comment[];
  roles: Role[];
  auditLog: AuditLogEntry[];
}

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "db.json");

function defaultStore(): StoreShape {
  return {
    heroSlides: heroSlidesSeed,
    products: productsSeed,
    recipes: recipesSeed,
    posts: postsSeed,
    comments: [],
    roles: DEFAULT_ROLES.map((role) => ({ ...role, permissions: [...role.permissions] })),
    auditLog: [],
  };
}

async function ensureStoreFile(): Promise<void> {
  if (!existsSync(STORE_DIR)) {
    await mkdir(STORE_DIR, { recursive: true });
  }
  if (!existsSync(STORE_PATH)) {
    await writeFile(STORE_PATH, JSON.stringify(defaultStore(), null, 2), "utf8");
  }
}

// Serialize reads/writes within this process to avoid interleaved file writes.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

export async function readStore(): Promise<StoreShape> {
  return enqueue(async () => {
    await ensureStoreFile();
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreShape;
  });
}

export async function writeStore(mutate: (store: StoreShape) => void): Promise<StoreShape> {
  return enqueue(async () => {
    await ensureStoreFile();
    const raw = await readFile(STORE_PATH, "utf8");
    const store = JSON.parse(raw) as StoreShape;
    mutate(store);
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  });
}
