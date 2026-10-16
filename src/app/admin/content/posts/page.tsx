import { requirePermission } from "@/lib/auth/require-role";
import { listPosts, listProducts } from "@/lib/db/content-store";
import { PostManager } from "@/components/admin/PostManager";

export default async function PostsContentPage() {
  await requirePermission("posts.manage");
  const [posts, products] = await Promise.all([listPosts(), listProducts()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Editorial Journal</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Publish market reports, seasonal catch updates, and chef interviews with a flexible block layout.
      </p>
      <div className="mt-8">
        <PostManager initialPosts={posts} products={products} />
      </div>
    </div>
  );
}
