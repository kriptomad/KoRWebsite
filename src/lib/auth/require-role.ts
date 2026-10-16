import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import type { Permission, Role } from "@/types";

/** Server-side guard for admin pages: redirects to login if unauthenticated or lacking permission. */
export async function requirePermission(permission: Permission): Promise<Role> {
  const role = await getCurrentRole();
  if (!role) redirect("/admin/login");
  if (!hasPermission(role, permission)) redirect("/admin");
  return role;
}

export async function requireAnyRole(): Promise<Role> {
  const role = await getCurrentRole();
  if (!role) redirect("/admin/login");
  return role;
}
