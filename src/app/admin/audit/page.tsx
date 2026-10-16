import { requirePermission } from "@/lib/auth/require-role";
import { listAuditLog } from "@/lib/db/audit";

export default async function AuditLogPage() {
  await requirePermission("audit.view");
  const entries = await listAuditLog();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Audit Log</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Every administrative action is logged with timestamp, role and IP address.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-brand-deep/15">
        <table className="w-full text-sm">
          <thead className="bg-brand-deep text-brand-cream">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">When</th>
              <th scope="col" className="px-4 py-2 text-left">Role</th>
              <th scope="col" className="px-4 py-2 text-left">Action</th>
              <th scope="col" className="px-4 py-2 text-left">Target</th>
              <th scope="col" className="px-4 py-2 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-brand-deep/10 odd:bg-brand-cream">
                <td className="px-4 py-2">{new Date(entry.createdAt).toLocaleString("en-IE")}</td>
                <td className="px-4 py-2">{entry.actorRole}</td>
                <td className="px-4 py-2">{entry.action}</td>
                <td className="px-4 py-2">{entry.targetSummary}</td>
                <td className="px-4 py-2">{entry.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="p-4 text-sm text-brand-ink/60">No audit events yet.</p> : null}
      </div>
    </div>
  );
}
