// GROQ projections matching the `src/types` domain shapes. Pair these with a
// Sanity Studio deployment using document types: heroSlide, product, recipe,
// post (see schema contract notes in each query for required fields).

export const heroSlidesQuery = /* groq */ `
*[_type == "heroSlide"] | order(order asc) {
  _id,
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, headline),
  "lqip": image.asset->metadata.lqip
}`;

export const productsQuery = /* groq */ `
*[_type == "product"] | order(name asc) {
  _id,
  "slug": slug.current,
  name,
  scientificName,
  portOfOrigin,
  seasonStart,
  seasonEnd,
  allergens,
  pricePerKg,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, name),
  description,
  nutrition
}`;

export const productBySlugQuery = /* groq */ `
*[_type == "product" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  name,
  scientificName,
  portOfOrigin,
  seasonStart,
  seasonEnd,
  allergens,
  pricePerKg,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, name),
  description,
  nutrition
}`;

export const recipesQuery = /* groq */ `
*[_type == "recipe"] | order(title asc) {
  _id,
  "slug": slug.current,
  title,
  summary,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, title),
  prepTimeMinutes,
  cookTimeMinutes,
  difficulty,
  servings,
  cuisine,
  ingredients,
  steps,
  "productSlugs": products[]->slug.current
}`;

export const recipeBySlugQuery = /* groq */ `
*[_type == "recipe" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  summary,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, title),
  prepTimeMinutes,
  cookTimeMinutes,
  difficulty,
  servings,
  cuisine,
  ingredients,
  steps,
  "productSlugs": products[]->slug.current
}`;

export const postsQuery = /* groq */ `
*[_type == "post"] | order(publishedAt desc) {
  _id,
  "slug": slug.current,
  title,
  excerpt,
  category,
  "author": author->name,
  "coverImageUrl": coverImage.asset->url,
  "coverImageAlt": coalesce(coverImage.alt, title),
  publishedAt,
  blocks
}`;

export const postBySlugQuery = /* groq */ `
*[_type == "post" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  excerpt,
  category,
  "author": author->name,
  "coverImageUrl": coverImage.asset->url,
  "coverImageAlt": coalesce(coverImage.alt, title),
  publishedAt,
  blocks
}`;
