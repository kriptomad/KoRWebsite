import { PostCard } from "@/components/blog/PostCard";
import { getPosts } from "@/lib/data/content";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "News & Stories | Kay O'Connell Fishmongers",
  description: "Market reports, seasonal catch announcements, chef interviews and culinary guides.",
  path: "/news",
});

export default async function NewsPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <span className="section-eyebrow">The journal</span>
      <h1 className="mt-2 text-4xl font-bold text-brand-deep">News &amp; Stories</h1>
      <p className="mt-3 max-w-2xl text-brand-ink/70">
        Dispatches from the English Market slab — landings, people and the dishes they inspire.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
