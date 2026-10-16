import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto rounded-t-[2.5rem] bg-brand-deep-dark text-brand-cream">
      <div className="mx-auto max-w-6xl px-6 py-12 text-sm">
        <p className="text-lg font-semibold text-brand-gold">{siteConfig.name}</p>
        <p className="mt-2 opacity-80">
          {siteConfig.localBusiness.streetAddress}, {siteConfig.localBusiness.addressLocality}, Ireland
        </p>
        <div className="mt-6 h-px w-full bg-white/10" />
        <p className="mt-6 opacity-60">© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <p className="mt-2 opacity-60">
          Developed by{" "}
          <a
            href="https://filitech.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-gold transition-colors hover:text-brand-gold-dark"
          >
            Filitech
          </a>
        </p>
      </div>
    </footer>
  );
}
