import { requirePermission } from "@/lib/auth/require-role";
import { getSiteSettings } from "@/lib/db/site-settings";
import { LogoManager } from "@/components/admin/LogoManager";

export default async function SiteSettingsPage() {
  await requirePermission("roles.manage");
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Site Settings</h1>
      <p className="mt-1 text-sm text-brand-ink/70">Brand-wide settings for the public site.</p>
      <div className="mt-8">
        <LogoManager initialLogoUrl={settings.logoUrl} />
      </div>
    </div>
  );
}
