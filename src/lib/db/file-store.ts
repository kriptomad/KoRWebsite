import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";
import type { AuditLogEntry, Comment, HeroSlide, Post, Product, Recipe, Role, StaffUser } from "@/types";
import { heroSlidesSeed, postsSeed, productsSeed, recipesSeed } from "@/lib/data/seed";
import { DEFAULT_ROLES } from "@/lib/rbac";

// Durable local persistence for demo/dev use when Supabase isn't configured.
// A plain module-level array doesn't survive Next.js dev's per-route module
// isolation (or serverless cold starts) — writing to disk does, and keeps the
// Owner's CMS edits (products/recipes/posts/hero slides, comments, roles,
// audit log) consistent across every route in this environment. For real
// production durability/concurrency, configure Supabase instead (see
// src/lib/db/supabase.ts) which every store module prefers when available.

/** Staff user record as persisted in the file-store — includes the salted
 * passcode hash, which is never sent to the client (see src/lib/db/staff-users.ts). */
export type StoredStaffUser = StaffUser & { passcodeHash: string };

export interface SiteSettings {
  logoUrl: string | null;
}

export interface StoreShape {
  heroSlides: HeroSlide[];
  products: Product[];
  recipes: Recipe[];
  posts: Post[];
  comments: Comment[];
  roles: Role[];
  auditLog: AuditLogEntry[];
  staffUsers: StoredStaffUser[];
  siteSettings: SiteSettings;
}

// Serverless hosts (Netlify Functions, Vercel) ship a read-only deployment
// bundle — only the OS temp dir is writable there — so fall back to it when
// one of those platforms is detected, while keeping the nicer project-local
// .data folder for local dev. Note: the temp dir does not persist across cold
// starts/instances; configure Supabase (src/lib/db/supabase.ts) for real
// production durability.
const isServerless = Boolean(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const STORE_DIR = isServerless
  ? path.join(os.tmpdir(), "koc-digital-core-data")
  : path.join(process.cwd(), ".data");
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
    staffUsers: [],
    siteSettings: { logoUrl: null },
  };
}

// Backfills keys that didn't exist in older on-disk files, so upgrading the
// app doesn't crash on a stale .data/db.json / serverless tmp file.
function withDefaults(store: Partial<StoreShape>): StoreShape {
  return {
    ...defaultStore(),
    ...store,
    staffUsers: store.staffUsers ?? [],
    siteSettings: store.siteSettings ?? { logoUrl: null },
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
    return withDefaults(JSON.parse(raw) as Partial<StoreShape>);
  });
}

export async function writeStore(mutate: (store: StoreShape) => void): Promise<StoreShape> {
  return enqueue(async () => {
    await ensureStoreFile();
    const raw = await readFile(STORE_PATH, "utf8");
    const store = withDefaults(JSON.parse(raw) as Partial<StoreShape>);
    mutate(store);
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    return store;
  });
}
