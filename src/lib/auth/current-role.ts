import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getRoleByName } from "@/lib/db/roles";
import type { Role } from "@/types";

/** Resolves the current admin's Role (with live permissions) from the signed session cookie. */
export async function getCurrentRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  if (!session) return null;

  const role = await getRoleByName(session.roleName);
  return role ?? null;
}
