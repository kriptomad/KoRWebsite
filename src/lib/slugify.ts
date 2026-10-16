/** Generates a URL-safe slug from a free-text title, e.g. for products/recipes/posts. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

/** Appends -2, -3, ... to a candidate slug until it's unique within `existing`. */
export function uniqueSlug(candidate: string, existing: string[], ignoreSlug?: string): string {
  const taken = new Set(existing.filter((slug) => slug !== ignoreSlug));
  if (!taken.has(candidate)) return candidate;
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n += 1;
  return `${candidate}-${n}`;
}
