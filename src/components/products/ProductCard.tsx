import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-3xl border border-brand-deep/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-110"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-brand-deep shadow-sm backdrop-blur">
          €{product.pricePerKg.toFixed(2)}/kg
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-brand-deep">{product.name}</h3>
        <p className="text-sm italic text-brand-deep/60">{product.scientificName}</p>
        <p className="mt-2 text-sm text-brand-ink/70">{product.portOfOrigin}</p>
      </div>
    </Link>
  );
}
