import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/recipes", label: "Recipes" },
  { href: "/news", label: "News" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-deep/95 text-brand-cream backdrop-blur-md supports-[backdrop-filter]:bg-brand-deep/80">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide transition-opacity hover:opacity-80">
          {/* Placeholder brand mark — swap public/images/logo.svg for the real logo file when available */}
          <Image src="/images/logo.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" />
          {siteConfig.shortName}
        </Link>
        <ul className="flex gap-2 text-sm font-medium">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-4 py-2 transition-colors duration-200 hover:bg-white/10 hover:text-brand-gold"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
