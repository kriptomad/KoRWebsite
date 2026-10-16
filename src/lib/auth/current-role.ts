import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getRoleById, getRoleByName } from "@/lib/db/roles";
import { getStaffUserById } from "@/lib/db/staff-users";
import type { Role, StaffUser } from "@/types";

/** Resolves the current admin's Role (with live permissions) from the signed session cookie.
 * For per-user sessions (staffUserId present), this re-checks that the staff
 * user still exists on every call — so revoking access takes effect
 * immediately, not just on the next login attempt. */
export async function getCurrentRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  if (session.staffUserId) {
    const staffUser = await getStaffUserById(session.staffUserId);
    if (!staffUser) return null; // revoked or deleted
    return (await getRoleById(staffUser.roleId)) ?? null;
  }

  const role = await getRoleByName(session.roleName);
  return role ?? null;
}

/** Resolves the current per-user staff account from the session cookie, or
 * null for master-passcode (Owner) logins which aren't tied to one. Used to
 * check mustChangePasscode before letting a forced-reset account in. */
export async function getCurrentStaffUser(): Promise<StaffUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session?.staffUserId) return null;
  return (await getStaffUserById(session.staffUserId)) ?? null;
}
