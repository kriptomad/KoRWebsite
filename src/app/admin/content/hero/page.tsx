import { requirePermission } from "@/lib/auth/require-role";
import { listHeroSlides } from "@/lib/db/content-store";
import { HeroSlideManager } from "@/components/admin/HeroSlideManager";

export default async function HeroContentPage() {
  await requirePermission("content.publish");
  const heroSlides = await listHeroSlides();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Hero Carousel Manager</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Control every slide shown in the homepage carousel — headline, copy, call to action, and image.
      </p>
      <div className="mt-8">
        <HeroSlideManager initialSlides={heroSlides} />
      </div>
    </div>
  );
}
