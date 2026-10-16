import type { Comment } from "@/types";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-brand-ink/60">Be the first to comment.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-brand-deep/10 bg-white p-4">
          <p className="text-sm font-semibold text-brand-deep">{comment.name}</p>
          <p className="mt-1 text-sm text-brand-ink/80">{comment.body}</p>
          <p className="mt-2 text-xs text-brand-ink/50">
            {new Date(comment.createdAt).toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </li>
      ))}
    </ul>
  );
}
