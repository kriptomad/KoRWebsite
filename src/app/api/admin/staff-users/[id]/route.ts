import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { deleteStaffUser, getStaffUserById } from "@/lib/db/staff-users";
import { logAuditEvent } from "@/lib/db/audit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (session?.staffUserId === id) {
    return NextResponse.json({ error: "You cannot revoke your own account while signed in." }, { status: 400 });
  }

  const staffUser = await getStaffUserById(id);
  if (!staffUser) {
    return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
  }

  await deleteStaffUser(id);
  await logAuditEvent({
    actorRole: role!.name,
    action: "STAFF_USER_REVOKED",
    targetSummary: `${staffUser.displayName} <${staffUser.email}>`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}
