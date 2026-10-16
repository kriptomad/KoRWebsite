export const siteConfig = {
  name: "Kay O'Connell Fishmongers",
  shortName: "Kay O'Connell",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kayoconnellfish.ie",
  description:
    "Artisanal fishmonger trading from the historic English Market, Cork, Ireland. Fresh daily catch, seasonal seafood and expert culinary guidance.",
  locale: "en_IE",
  twitterHandle: "@kayoconnellfish",
  brand: {
    deep: "#1b4d4f",
    gold: "#d4af37",
  },
  localBusiness: {
    streetAddress: "English Market",
    addressLocality: "Cork",
    addressRegion: "Munster",
    postalCode: "T12",
    addressCountry: "IE",
    telephone: "+353-21-000-0000",
    priceRange: "€€",
  },
} as const;
