import Link from "next/link";
import { requireAnyRole } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/rbac";
import { LogoutButton } from "@/components/admin/LogoutButton";

const TILES = [
  { href: "/admin/content/hero", title: "Hero Carousel Manager", permission: "content.publish" as const, description: "Control every slide shown in the homepage carousel." },
  { href: "/admin/content/products", title: "Product & Inventory Hub", permission: "products.manage" as const, description: "Add, edit, and remove products — pricing, provenance, nutrition, imagery." },
  { href: "/admin/content/recipes", title: "Culinary & Recipe Engine", permission: "recipes.manage" as const, description: "Build recipes with ingredients, method steps, and product bindings." },
  { href: "/admin/content/posts", title: "Editorial Journal", permission: "posts.manage" as const, description: "Publish market reports, seasonal updates, and chef interviews." },
  { href: "/admin/moderation", title: "Community Moderation Queue", permission: "comments.moderate" as const, description: "Approve, hide, or purge comments submitted on recipes and news." },
  { href: "/admin/roles", title: "Access Control Matrix", permission: "roles.manage" as const, description: "Create roles and assign granular permissions to staff." },
  { href: "/admin/audit", title: "Audit Log", permission: "audit.view" as const, description: "Review every administrative action with timestamp, role and IP." },
  { href: "/admin/privacy", title: "GDPR Erasure", permission: "gdpr.manage" as const, description: "Process Article 17 right-to-erasure requests." },
];

export default async function AdminDashboardPage() {
  const role = await requireAnyRole();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-deep">Owner&apos;s Command Dashboard</h1>
          <p className="mt-1 text-sm text-brand-ink/70">Signed in as {role.name}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {TILES.filter((tile) => hasPermission(role, tile.permission)).map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="font-semibold text-brand-deep">{tile.title}</h2>
            <p className="mt-1 text-sm text-brand-ink/70">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
