import { requirePermission } from "@/lib/auth/require-role";
import { listPendingComments } from "@/lib/db/comments";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default async function ModerationPage() {
  await requirePermission("comments.moderate");
  const comments = await listPendingComments();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Community Moderation Queue</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Comments submitted via the frictionless name/email flow wait here until approved.
      </p>
      <div className="mt-8">
        <ModerationQueue comments={comments} />
      </div>
    </div>
  );
}
