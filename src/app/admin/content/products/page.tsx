import { requirePermission } from "@/lib/auth/require-role";
import { listProducts } from "@/lib/db/content-store";
import { ProductManager } from "@/components/admin/ProductManager";

export default async function ProductsContentPage() {
  await requirePermission("products.manage");
  const products = await listProducts();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Product &amp; Inventory Hub</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Full control over every product on the slab: provenance, season, allergens, pricing, nutrition, and imagery.
      </p>
      <div className="mt-8">
        <ProductManager initialProducts={products} />
      </div>
    </div>
  );
}
