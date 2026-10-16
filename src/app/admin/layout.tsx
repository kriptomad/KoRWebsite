import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content/hero", label: "Hero Carousel" },
  { href: "/admin/content/products", label: "Products" },
  { href: "/admin/content/recipes", label: "Recipes" },
  { href: "/admin/content/qr-codes", label: "QR Codes" },
  { href: "/admin/content/posts", label: "Journal" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/roles", label: "Roles & Permissions" },
  { href: "/admin/users", label: "Staff Accounts" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/privacy", label: "GDPR Erasure" },
  { href: "/admin/settings", label: "Site Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav aria-label="Admin" className="mb-8 flex flex-wrap gap-4 border-b border-brand-deep/15 pb-4 text-sm">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href} className="font-semibold text-brand-deep hover:text-brand-gold-dark">
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
