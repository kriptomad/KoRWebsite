import { requirePermission } from "@/lib/auth/require-role";
import { listRoles } from "@/lib/db/roles";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";

export default async function RolesPage() {
  await requirePermission("roles.manage");
  const roles = await listRoles();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Access Control Matrix</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Build custom operational roles and assign granular permission scopes to staff.
      </p>
      <div className="mt-8">
        <PermissionMatrix roles={roles} />
      </div>
    </div>
  );
}
