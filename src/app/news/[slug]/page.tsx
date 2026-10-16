import { notFound } from "next/navigation";
import Image from "next/image";
import { BlockRenderer } from "@/components/blog/BlockRenderer";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPostBySlug, getPosts, getProducts } from "@/lib/data/content";
import { listApprovedComments } from "@/lib/db/comments";
import { buildMetadata, localBusinessJsonLd } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: `${post.title} | Kay O'Connell Fishmongers`,
    description: post.excerpt,
    path: `/news/${post.slug}`,
    imageUrl: post.coverImageUrl,
  });
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, products] = await Promise.all([getPostBySlug(slug), getProducts()]);
  if (!post) notFound();

  const comments = await listApprovedComments("post", post._id);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${siteConfig.url}${post.coverImageUrl}`,
    author: { "@type": "Organization", name: post.author },
    datePublished: post.publishedAt,
    publisher: localBusinessJsonLd(),
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={localBusinessJsonLd()} />

      <p className="section-eyebrow">{post.category.replace("-", " ")}</p>
      <h1 className="mt-2 text-4xl font-bold text-brand-deep">{post.title}</h1>
      <p className="mt-2 text-sm text-brand-ink/60">
        {post.author} ·{" "}
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}
        </time>
      </p>

      <div className="relative mt-6 h-80 w-full overflow-hidden rounded-3xl shadow-sm">
        <Image src={post.coverImageUrl} alt={post.coverImageAlt} fill sizes="100vw" className="object-cover" priority />
      </div>

      <div className="mt-8">
        <BlockRenderer blocks={post.blocks} products={products} />
      </div>

      <section aria-labelledby="comments-heading" className="mt-16 border-t border-brand-deep/10 pt-10">
        <h2 id="comments-heading" className="mb-4 text-2xl font-semibold text-brand-deep">
          Comments
        </h2>
        <CommentList comments={comments} />
        <div className="mt-8">
          <CommentForm targetType="post" targetId={post._id} />
        </div>
      </section>
    </article>
  );
}
