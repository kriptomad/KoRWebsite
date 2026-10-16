import type { HeroSlide, Post, Product, Recipe } from "@/types";

// Placeholder editorial/demo content used when Sanity is not yet configured
// (see src/lib/sanity/client.ts). Replace by publishing real content in Studio.

export const heroSlidesSeed: HeroSlide[] = [
  {
    _id: "hero-1",
    headline: "Line-caught today. Landed in Cork.",
    subheadline: "The freshest Atlantic catch, straight from the English Market slab.",
    ctaLabel: "Shop today's catch",
    ctaHref: "/products",
    imageUrl: "/images/hero-1.svg",
    imageAlt: "Fresh fish laid out on ice at the Kay O'Connell counter",
  },
  {
    _id: "hero-2",
    headline: "Three generations of fishmongering.",
    subheadline: "Heritage, expertise, and an eye for quality since the market's earliest days.",
    ctaLabel: "Our story",
    ctaHref: "/news",
    imageUrl: "/images/hero-2.svg",
    imageAlt: "The Kay O'Connell Fishmongers stall in the English Market",
  },
];

export const productsSeed: Product[] = [
  {
    _id: "prod-hake",
    slug: "atlantic-hake",
    name: "Atlantic Hake",
    scientificName: "Merluccius merluccius",
    portOfOrigin: "Castletownbere",
    seasonStart: 1,
    seasonEnd: 12,
    allergens: ["fish"],
    pricePerKg: 14.5,
    imageUrl: "/images/product-hake.svg",
    imageAlt: "Fillet of Atlantic hake on ice",
    description:
      "A delicate, flaky white fish landed daily at Castletownbere. A kitchen favourite for its versatility.",
    nutrition: {
      caloriesKcal: 90,
      proteinG: 18,
      saturatedFatG: 0.3,
      unsaturatedFatG: 1.1,
      omega3G: 0.4,
      servingSizeG: 100,
    },
  },
  {
    _id: "prod-mackerel",
    slug: "cork-mackerel",
    name: "Cork Mackerel",
    scientificName: "Scomber scombrus",
    portOfOrigin: "Union Hall",
    seasonStart: 5,
    seasonEnd: 10,
    allergens: ["fish"],
    pricePerKg: 9.0,
    imageUrl: "/images/product-mackerel.svg",
    imageAlt: "Whole fresh mackerel with iridescent skin",
    description:
      "Rich, oily and packed with Omega-3 — at its seasonal best through the summer months.",
    nutrition: {
      caloriesKcal: 205,
      proteinG: 19,
      saturatedFatG: 3.3,
      unsaturatedFatG: 8.5,
      omega3G: 2.5,
      servingSizeG: 100,
    },
  },
  {
    _id: "prod-prawns",
    slug: "dublin-bay-prawns",
    name: "Dublin Bay Prawns",
    scientificName: "Nephrops norvegicus",
    portOfOrigin: "Dunmore East",
    seasonStart: 1,
    seasonEnd: 12,
    allergens: ["crustacean"],
    pricePerKg: 28.0,
    imageUrl: "/images/product-prawns.svg",
    imageAlt: "Dublin Bay prawns on crushed ice",
    description:
      "Sweet, delicate langoustine tails — an Irish delicacy prized on menus worldwide.",
    nutrition: {
      caloriesKcal: 99,
      proteinG: 21,
      saturatedFatG: 0.2,
      unsaturatedFatG: 0.5,
      omega3G: 0.3,
      servingSizeG: 100,
    },
  },
];

export const recipesSeed: Recipe[] = [
  {
    _id: "recipe-hake-tray-bake",
    slug: "hake-tray-bake",
    title: "One-Tray Hake with Market Vegetables",
    summary: "A weeknight tray bake that lets delicate hake shine alongside roasted market veg.",
    imageUrl: "/images/recipe-hake.svg",
    imageAlt: "Tray bake of hake fillets and roasted vegetables",
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    difficulty: "easy",
    servings: 4,
    cuisine: "Irish",
    ingredients: [
      { label: "4 Atlantic hake fillets", productSlug: "atlantic-hake" },
      { label: "2 tbsp olive oil" },
      { label: "1 lemon, sliced" },
      { label: "Seasonal market vegetables" },
    ],
    steps: [
      { title: "Prep", body: "Preheat the oven to 200°C. Toss vegetables in olive oil and seasoning." },
      { title: "Roast", body: "Roast vegetables for 15 minutes, then nestle hake fillets on top." },
      { title: "Finish", body: "Return to the oven for 10 minutes until the fish flakes easily." },
    ],
    productSlugs: ["atlantic-hake"],
  },
  {
    _id: "recipe-mackerel-escabeche",
    slug: "mackerel-escabeche",
    title: "Mackerel Escabeche",
    summary: "A bright, vinegar-forward classic that balances the richness of fresh mackerel.",
    imageUrl: "/images/recipe-mackerel.svg",
    imageAlt: "Mackerel escabeche served with pickled vegetables",
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    difficulty: "medium",
    servings: 4,
    cuisine: "Spanish",
    ingredients: [
      { label: "4 mackerel fillets", productSlug: "cork-mackerel" },
      { label: "1 onion, sliced" },
      { label: "100ml sherry vinegar" },
      { label: "2 bay leaves" },
    ],
    steps: [
      { title: "Sear", body: "Pan-sear mackerel fillets skin-side down until crisp." },
      { title: "Pickle", body: "Simmer onion, vinegar and bay leaves to make the escabeche liquor." },
      { title: "Rest", body: "Pour the warm liquor over the fillets and rest for at least 2 hours." },
    ],
    productSlugs: ["cork-mackerel"],
  },
  {
    _id: "recipe-prawn-linguine",
    slug: "dublin-bay-prawn-linguine",
    title: "Dublin Bay Prawn Linguine",
    summary: "A restaurant-quality pasta showcasing sweet Dublin Bay prawns in a garlic-chilli butter.",
    imageUrl: "/images/recipe-prawns.svg",
    imageAlt: "Linguine tossed with Dublin Bay prawns",
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    difficulty: "advanced",
    servings: 2,
    cuisine: "Italian",
    ingredients: [
      { label: "300g Dublin Bay prawn tails", productSlug: "dublin-bay-prawns" },
      { label: "200g linguine" },
      { label: "2 cloves garlic" },
      { label: "1 red chilli" },
    ],
    steps: [
      { title: "Boil", body: "Cook linguine in well-salted water until al dente." },
      { title: "Sauté", body: "Sauté garlic and chilli in butter, then add prawn tails until just pink." },
      { title: "Toss", body: "Toss the drained pasta through the prawn butter with a splash of pasta water." },
    ],
    productSlugs: ["dublin-bay-prawns"],
  },
];

export const postsSeed: Post[] = [
  {
    _id: "post-seasonal-mackerel",
    slug: "mackerel-season-opens",
    title: "Mackerel Season Opens Along the Cork Coast",
    excerpt: "Boats are landing the first glistening shoals of the year — here's what to expect on the slab.",
    category: "seasonal-catch",
    author: "Kay O'Connell Fishmongers",
    coverImageUrl: "/images/post-mackerel.svg",
    coverImageAlt: "Crates of freshly landed mackerel",
    publishedAt: "2026-05-04",
    blocks: [
      {
        _type: "richText",
        html: "<p>As water temperatures rise along the south coast, mackerel shoals move inshore, and our boats are already landing the first catches of the season.</p>",
      },
      {
        _type: "pullQuote",
        quote: "There's nothing like mackerel landed this morning, still stiff with cold.",
        attribution: "Kay O'Connell Fishmongers",
      },
      {
        _type: "mediaText",
        imageUrl: "/images/product-mackerel.svg",
        imageAlt: "Whole fresh mackerel with iridescent skin",
        heading: "Why mackerel shines in early summer",
        body: "Rich in Omega-3 and at its seasonal peak, mackerel caught this time of year has firmer flesh and a deeper flavour. We recommend pan-searing it skin-side down for a crisp finish.",
        imagePosition: "left",
      },
      { _type: "productCard", productSlug: "cork-mackerel" },
    ],
  },
  {
    _id: "post-market-report",
    slug: "english-market-weekly-report",
    title: "English Market Weekly Report",
    excerpt: "A roundup of this week's best landings, prices, and what to cook this weekend.",
    category: "market-report",
    author: "Kay O'Connell Fishmongers",
    coverImageUrl: "/images/post-market.svg",
    coverImageAlt: "The English Market in Cork city",
    publishedAt: "2026-09-29",
    blocks: [
      {
        _type: "richText",
        html: "<p>A strong week for white fish, with hake and haddock landing in good numbers across Munster ports.</p>",
      },
      {
        _type: "imageGrid",
        images: [
          { url: "/images/post-market.svg", alt: "English Market stalls" },
          { url: "/images/product-hake.svg", alt: "Fresh hake fillets" },
        ],
      },
    ],
  },
];
