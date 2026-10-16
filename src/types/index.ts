// Domain types shared across the Sanity content layer, the Postgres
// transactional layer, and the UI. See FRD sections 3.3 and 4 for the
// source specification of each shape.

export interface HeroSlide {
  _id: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl: string;
  imageAlt: string;
  lqip?: string;
}

export interface NutritionFacts {
  caloriesKcal: number;
  proteinG: number;
  saturatedFatG: number;
  unsaturatedFatG: number;
  omega3G: number;
  /** Always normalized to a 100g serving for comparability across species. */
  servingSizeG: 100;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  scientificName: string;
  portOfOrigin: string;
  seasonStart: number; // 1-12
  seasonEnd: number; // 1-12
  allergens: string[];
  pricePerKg: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  nutrition: NutritionFacts;
}

export type RecipeDifficulty = "easy" | "medium" | "advanced";

export interface RecipeIngredient {
  label: string;
  /** Optional relational bridge to a Product, powering the product <-> recipe binding. */
  productSlug?: string;
}

export interface RecipeStep {
  title: string;
  body: string;
}

export interface Recipe {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  imageUrl: string;
  imageAlt: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  servings: number;
  cuisine: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  /** Slugs of Products this recipe anchors to (N:M bridge, see FRD 4.3). */
  productSlugs: string[];
}

export type PostCategory =
  | "market-report"
  | "seasonal-catch"
  | "chef-interview"
  | "culinary-guide";

export type PostBlock =
  | { _type: "richText"; html: string }
  | { _type: "pullQuote"; quote: string; attribution?: string }
  | { _type: "imageGrid"; images: { url: string; alt: string }[] }
  | { _type: "productCard"; productSlug: string }
  | {
      _type: "mediaText";
      imageUrl: string;
      imageAlt: string;
      heading?: string;
      body: string;
      imagePosition: "left" | "right";
    };

export interface Post {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  author: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: string; // ISO date
  blocks: PostBlock[];
}

export type CommentTargetType = "recipe" | "post";
export type CommentStatus = "pending" | "approved" | "hidden" | "purged";

export interface Comment {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  name: string;
  email: string;
  body: string;
  status: CommentStatus;
  createdAt: string; // ISO date
}

export type Permission =
  | "content.create"
  | "content.publish"
  | "products.manage"
  | "recipes.manage"
  | "posts.manage"
  | "comments.moderate"
  | "roles.manage"
  | "audit.view"
  | "gdpr.manage";

export interface Role {
  id: string;
  name: string;
  /** true when this role may not be deleted/renamed (the Owner role). */
  isSystem: boolean;
  permissions: Permission[];
}

/** An individual staff login — distinct from Role, so the Owner can revoke a
 * single person's access (e.g. when they leave) without affecting anyone
 * else sharing that role. */
export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  createdAt: string; // ISO date
}

export interface AuditLogEntry {
  id: string;
  actorRole: string;
  action: string;
  targetSummary: string;
  ipAddress: string;
  createdAt: string; // ISO date
}
