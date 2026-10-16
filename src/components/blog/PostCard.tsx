import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types";

const CATEGORY_LABELS: Record<Post["category"], string> = {
  "market-report": "Market Report",
  "seasonal-catch": "Seasonal Catch",
  "chef-interview": "Chef Interview",
  "culinary-guide": "Culinary Guide",
};

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group block overflow-hidden rounded-3xl border border-brand-deep/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={post.coverImageUrl}
          alt={post.coverImageAlt}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 ease-[var(--ease-brand)] group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-gold-dark shadow-sm backdrop-blur">
          {CATEGORY_LABELS[post.category]}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-brand-deep">{post.title}</h3>
        <p className="mt-1 text-sm text-brand-ink/70">{post.excerpt}</p>
      </div>
    </Link>
  );
}
