import { requirePermission } from "@/lib/auth/require-role";
import { GdprErasureForm } from "@/components/admin/GdprErasureForm";

export default async function PrivacyPage() {
  await requirePermission("gdpr.manage");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">GDPR Article 17 — Right to Erasure</h1>
      <p className="mt-1 max-w-xl text-sm text-brand-ink/70">
        Scrubs the name, email, and comment body of every record tied to the given email address. This
        action is irreversible and is recorded in the audit log.
      </p>
      <div className="mt-8">
        <GdprErasureForm />
      </div>
    </div>
  );
}
