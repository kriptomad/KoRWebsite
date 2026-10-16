import Image from "next/image";
import type { PostBlock, Product } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";
import { sanitizeRichText } from "@/lib/security/sanitize-html";

export function BlockRenderer({ blocks, products }: { blocks: PostBlock[]; products: Product[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((block, index) => (
        <Block key={index} block={block} products={products} />
      ))}
    </div>
  );
}

function Block({ block, products }: { block: PostBlock; products: Product[] }) {
  switch (block._type) {
    case "richText":
      return (
        <div
          className="prose max-w-none text-brand-ink [&_a]:text-brand-deep [&_a]:underline"
          // Content is sanitized server-side before rendering (see sanitizeRichText).
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.html) }}
        />
      );
    case "pullQuote":
      return (
        <blockquote className="rounded-2xl border-l-4 border-brand-gold bg-brand-cream px-6 py-5 text-xl italic text-brand-deep">
          “{block.quote}”
          {block.attribution ? <footer className="mt-2 text-sm not-italic opacity-70">— {block.attribution}</footer> : null}
        </blockquote>
      );
    case "imageGrid":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.images.map((image) => (
            <div key={image.url} className="relative h-56 overflow-hidden rounded-2xl">
              <Image src={image.url} alt={image.alt} fill sizes="50vw" className="object-cover" />
            </div>
          ))}
        </div>
      );
    case "mediaText":
      return (
        <div
          className={`flex flex-col items-center gap-6 md:gap-10 ${
            block.imagePosition === "right" ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-3xl md:h-80 md:w-1/2">
            <Image src={block.imageUrl} alt={block.imageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="md:w-1/2">
            {block.heading ? <h3 className="text-xl font-bold text-brand-deep">{block.heading}</h3> : null}
            <p className="mt-2 whitespace-pre-line text-brand-ink/80">{block.body}</p>
          </div>
        </div>
      );
    case "productCard": {
      const product = products.find((p) => p.slug === block.productSlug);
      if (!product) return null;
      return (
        <div className="max-w-sm">
          <ProductCard product={product} />
        </div>
      );
    }
    default:
      return null;
  }
}
