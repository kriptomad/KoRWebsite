"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/recipes", label: "Recipes" },
  { href: "/news", label: "News" },
];

export function SiteHeader({ logoUrl }: { logoUrl?: string | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-deep/95 text-brand-cream backdrop-blur-md supports-[backdrop-filter]:bg-brand-deep/80">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3 text-lg font-semibold tracking-wide transition-opacity hover:opacity-80"
        >
          <Image src={logoUrl || "/images/logo.svg"} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" unoptimized={Boolean(logoUrl)} />
          {siteConfig.shortName}
        </Link>
        <ul className="hidden gap-2 text-sm font-medium sm:flex">
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
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:hidden"
        >
          <span className="relative block h-4 w-5" aria-hidden>
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute left-0 top-3 h-0.5 w-5 bg-current transition-transform duration-200 ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </nav>
      {isMenuOpen ? (
        <ul id="mobile-nav-menu" className="flex flex-col gap-1 border-t border-white/10 px-6 py-3 text-sm font-medium sm:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-4 py-2.5 transition-colors duration-200 hover:bg-white/10 hover:text-brand-gold"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
