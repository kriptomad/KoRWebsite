import { requirePermission } from "@/lib/auth/require-role";
import { listRoles } from "@/lib/db/roles";
import { listStaffUsers } from "@/lib/db/staff-users";
import { StaffUserManager } from "@/components/admin/StaffUserManager";

export default async function StaffUsersPage() {
  await requirePermission("roles.manage");
  const [staffUsers, roles] = await Promise.all([listStaffUsers(), listRoles()]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-deep">Staff Accounts</h1>
      <p className="mt-1 text-sm text-brand-ink/70">
        Create individual logins for your team and revoke access instantly when someone leaves — each account signs
        in with its own email and passcode, separate from the Owner master passcode.
      </p>
      <div className="mt-8">
        <StaffUserManager initialStaffUsers={staffUsers} roles={roles} />
      </div>
    </div>
  );
}
