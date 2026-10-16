"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Post, PostBlock, PostCategory, Product } from "@/types";

interface Draft {
  title: string;
  excerpt: string;
  category: PostCategory;
  author: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: string;
  blocks: PostBlock[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_DRAFT: Draft = {
  title: "",
  excerpt: "",
  category: "market-report",
  author: "",
  coverImageUrl: "",
  coverImageAlt: "",
  publishedAt: today(),
  blocks: [{ _type: "richText", html: "" }],
};

export function PostManager({ initialPosts, products }: { initialPosts: Post[]; products: Product[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(post: Post) {
    setEditingId(post._id);
    setDraft({
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      coverImageUrl: post.coverImageUrl,
      coverImageAlt: post.coverImageAlt,
      publishedAt: post.publishedAt.slice(0, 10),
      blocks: post.blocks.length ? post.blocks : [{ _type: "richText", html: "" }],
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function updateBlock(index: number, block: PostBlock) {
    setDraft((d) => ({ ...d, blocks: d.blocks.map((b, i) => (i === index ? block : b)) }));
  }

  function removeBlock(index: number) {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    setDraft((d) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...d, blocks };
    });
  }

  function addBlock(type: PostBlock["_type"]) {
    const next: PostBlock =
      type === "richText"
        ? { _type: "richText", html: "" }
        : type === "pullQuote"
          ? { _type: "pullQuote", quote: "", attribution: "" }
          : type === "imageGrid"
            ? { _type: "imageGrid", images: [] }
            : type === "mediaText"
              ? { _type: "mediaText", imageUrl: "", imageAlt: "", heading: "", body: "", imagePosition: "left" }
              : { _type: "productCard", productSlug: products[0]?.slug ?? "" };
    setDraft((d) => ({ ...d, blocks: [...d.blocks, next] }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.excerpt.trim() || !draft.author.trim() || !draft.coverImageUrl) {
      setError("Title, excerpt, author, and cover image are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, publishedAt: new Date(draft.publishedAt).toISOString() };
      const response = await fetch(editingId ? `/api/admin/posts/${editingId}` : "/api/admin/posts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Could not save the post.");
        return;
      }
      const saved: Post = body.post;
      setPosts((prev) => (editingId ? prev.map((p) => (p._id === saved._id ? saved : p)) : [...prev, saved]));
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this post?")) return;
    const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (response.ok) {
      setPosts((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    }
  }

  return (
    <div className="space-y-10">
      <ul className="space-y-3">
        {posts.map((post) => (
          <li
            key={post._id}
            className="flex items-center gap-4 rounded-lg border border-brand-deep/15 bg-white p-4 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of uploaded/local image */}
            <img src={post.coverImageUrl} alt="" className="h-16 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-brand-deep">{post.title}</p>
              <p className="truncate text-sm text-brand-ink/60">
                {post.category.replace("-", " ")} · {post.author}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => startEdit(post)}
                className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(post._id)}
                className="rounded border border-red-700/30 px-3 py-1 font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {posts.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No posts yet — publish the first one below.</p>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-brand-deep">{editingId ? "Edit post" : "Publish a new post"}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Title *</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-brand-deep">Excerpt *</span>
            <textarea
              value={draft.excerpt}
              onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Category</span>
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as PostCategory }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            >
              <option value="market-report">Market Report</option>
              <option value="seasonal-catch">Seasonal Catch</option>
              <option value="chef-interview">Chef Interview</option>
              <option value="culinary-guide">Culinary Guide</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Author *</span>
            <input
              value={draft.author}
              onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Published date</span>
            <input
              type="date"
              value={draft.publishedAt}
              onChange={(e) => setDraft((d) => ({ ...d, publishedAt: e.target.value }))}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            />
          </label>
        </div>

        <ImageUploadField
          label="Cover image"
          value={draft.coverImageUrl}
          alt={draft.coverImageAlt}
          onValueChange={(url) => setDraft((d) => ({ ...d, coverImageUrl: url }))}
          onAltChange={(alt) => setDraft((d) => ({ ...d, coverImageAlt: alt }))}
          required
        />

        <fieldset className="rounded-lg border border-brand-deep/15 p-4">
          <legend className="px-1 text-sm font-semibold text-brand-deep">Content blocks</legend>
          <div className="space-y-4">
            {draft.blocks.map((block, index) => (
              <div key={index} className="rounded border border-brand-deep/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-gold-dark">
                    {block._type}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                      className="rounded border border-brand-deep/20 px-2 text-brand-deep disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === draft.blocks.length - 1}
                      className="rounded border border-brand-deep/20 px-2 text-brand-deep disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="rounded border border-red-700/30 px-2 text-red-700 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {block._type === "richText" ? (
                  <textarea
                    value={block.html}
                    onChange={(e) => updateBlock(index, { _type: "richText", html: e.target.value })}
                    placeholder="HTML content (sanitized before publishing — e.g. <p>...</p>)"
                    rows={4}
                    className="w-full rounded border border-brand-deep/20 px-3 py-1.5 font-mono text-xs"
                  />
                ) : null}

                {block._type === "pullQuote" ? (
                  <div className="space-y-2">
                    <input
                      value={block.quote}
                      onChange={(e) => updateBlock(index, { ...block, quote: e.target.value })}
                      placeholder="Quote"
                      className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                    />
                    <input
                      value={block.attribution ?? ""}
                      onChange={(e) => updateBlock(index, { ...block, attribution: e.target.value })}
                      placeholder="Attribution (optional)"
                      className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                    />
                  </div>
                ) : null}

                {block._type === "imageGrid" ? (
                  <div className="space-y-3">
                    {block.images.map((image, imgIndex) => (
                      <ImageUploadField
                        key={imgIndex}
                        label={`Image ${imgIndex + 1}`}
                        value={image.url}
                        alt={image.alt}
                        onValueChange={(url) =>
                          updateBlock(index, {
                            ...block,
                            images: block.images.map((img, i) => (i === imgIndex ? { ...img, url } : img)),
                          })
                        }
                        onAltChange={(alt) =>
                          updateBlock(index, {
                            ...block,
                            images: block.images.map((img, i) => (i === imgIndex ? { ...img, alt } : img)),
                          })
                        }
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(index, { ...block, images: [...block.images, { url: "", alt: "" }] })
                      }
                      className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
                    >
                      + Add image
                    </button>
                  </div>
                ) : null}

                {block._type === "productCard" ? (
                  <select
                    value={block.productSlug}
                    onChange={(e) => updateBlock(index, { _type: "productCard", productSlug: e.target.value })}
                    className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                  >
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                {block._type === "mediaText" ? (
                  <div className="space-y-3">
                    <div className="flex gap-4 text-sm">
                      <span className="font-semibold text-brand-deep">Image position:</span>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={block.imagePosition === "left"}
                          onChange={() => updateBlock(index, { ...block, imagePosition: "left" })}
                        />
                        Left
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={block.imagePosition === "right"}
                          onChange={() => updateBlock(index, { ...block, imagePosition: "right" })}
                        />
                        Right
                      </label>
                    </div>
                    <ImageUploadField
                      label="Image"
                      value={block.imageUrl}
                      alt={block.imageAlt}
                      onValueChange={(url) => updateBlock(index, { ...block, imageUrl: url })}
                      onAltChange={(alt) => updateBlock(index, { ...block, imageAlt: alt })}
                    />
                    <input
                      value={block.heading ?? ""}
                      onChange={(e) => updateBlock(index, { ...block, heading: e.target.value })}
                      placeholder="Heading (optional)"
                      className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                    />
                    <textarea
                      value={block.body}
                      onChange={(e) => updateBlock(index, { ...block, body: e.target.value })}
                      placeholder="Text that sits beside the image"
                      rows={4}
                      className="w-full rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addBlock("richText")}
              className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              + Rich text
            </button>
            <button
              type="button"
              onClick={() => addBlock("mediaText")}
              className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              + Image &amp; text
            </button>
            <button
              type="button"
              onClick={() => addBlock("pullQuote")}
              className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              + Pull quote
            </button>
            <button
              type="button"
              onClick={() => addBlock("imageGrid")}
              className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              + Image grid
            </button>
            <button
              type="button"
              onClick={() => addBlock("productCard")}
              className="rounded-full border border-brand-deep/30 px-3 py-1 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              + Product card
            </button>
          </div>
        </fieldset>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-deep px-5 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-deep-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Publish post"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-brand-deep/30 px-5 py-2 text-sm font-semibold text-brand-deep hover:bg-brand-deep/10"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
