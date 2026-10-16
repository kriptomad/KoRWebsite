"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Comment } from "@/types";

export function ModerationQueue({ comments }: { comments: Comment[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "hide" | "purge") {
    setPendingId(id);
    await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPendingId(null);
    router.refresh();
  }

  if (comments.length === 0) {
    return <p className="text-sm text-brand-ink/60">No pending comments.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-brand-deep/15 bg-white p-4">
          <p className="text-sm font-semibold text-brand-deep">
            {comment.name} <span className="font-normal text-brand-ink/50">({comment.email})</span>
          </p>
          <p className="mt-1 text-sm text-brand-ink/80">{comment.body}</p>
          <p className="mt-1 text-xs text-brand-ink/50">
            On {comment.targetType} · {new Date(comment.createdAt).toLocaleString("en-IE")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pendingId === comment.id}
              onClick={() => act(comment.id, "approve")}
              className="rounded-full bg-brand-deep px-4 py-1.5 text-xs font-semibold text-brand-cream hover:bg-brand-deep-light disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={pendingId === comment.id}
              onClick={() => act(comment.id, "hide")}
              className="rounded-full border border-brand-deep/30 px-4 py-1.5 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10 disabled:opacity-60"
            >
              Hide
            </button>
            <button
              type="button"
              disabled={pendingId === comment.id}
              onClick={() => act(comment.id, "purge")}
              className="rounded-full border border-red-700/30 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Purge
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
