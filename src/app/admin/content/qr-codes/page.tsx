import { requirePermission } from "@/lib/auth/require-role";
import { listRecipes } from "@/lib/db/content-store";
import { QrCodeGenerator } from "@/components/admin/QrCodeGenerator";
import { siteConfig } from "@/lib/site-config";

export default async function QrCodesPage() {
  await requirePermission("recipes.manage");
  const recipes = await listRecipes();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Recipe QR Codes</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Generate a scannable QR code for each recipe&apos;s public page — handy for market stall signage, packaging, or print materials.
      </p>
      <div className="mt-8">
        <QrCodeGenerator recipes={recipes} siteUrl={siteConfig.url} />
      </div>
    </div>
  );
}
