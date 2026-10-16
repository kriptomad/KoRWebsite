import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/lib/data/content";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Products | Kay O'Connell Fishmongers",
  description: "Browse today's fresh catch, seasonal availability and nutritional information.",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <span className="section-eyebrow">The counter</span>
      <h1 className="mt-2 text-4xl font-bold text-brand-deep">Fresh from the slab</h1>
      <p className="mt-3 max-w-2xl text-brand-ink/70">
        Every item is landed at an Irish port and inspected by hand before it reaches the English Market counter.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
