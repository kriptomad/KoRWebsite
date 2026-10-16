import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export function buildMetadata(options: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
}): Metadata {
  const url = `${siteConfig.url}${options.path}`;
  const image = options.imageUrl ? `${siteConfig.url}${options.imageUrl}` : undefined;

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title: options.title,
      description: options.description,
      images: image ? [image] : undefined,
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    url: siteConfig.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.localBusiness.streetAddress,
      addressLocality: siteConfig.localBusiness.addressLocality,
      addressRegion: siteConfig.localBusiness.addressRegion,
      postalCode: siteConfig.localBusiness.postalCode,
      addressCountry: siteConfig.localBusiness.addressCountry,
    },
    telephone: siteConfig.localBusiness.telephone,
    priceRange: siteConfig.localBusiness.priceRange,
  };
}
