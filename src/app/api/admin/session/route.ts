import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, SESSION_TTL_MS, createSessionToken } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/db/audit";
import { getRoleById } from "@/lib/db/roles";
import { verifyStaffCredentials } from "@/lib/db/staff-users";
import { verifyMasterPasscode } from "@/lib/db/site-settings";
import { isSameOrigin } from "@/lib/security/same-origin";

const loginSchema = z.object({
  email: z.string().trim().optional(),
  passcode: z.string().min(1).max(200),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function sessionResponse(token: string) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}

export async function POST(request: Request) {
  // CSRF: reject a login POST silently forged from another origin (the
  // attacker's page can't read the response, but this stops login-CSRF /
  // session-fixation attempts that try to sign the victim into a known
  // attacker-controlled staff account).
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { email, passcode } = parsed.data;
  const ipAddress = clientIp(request);

  // Per-user staff login: each staff account has its own email + passcode,
  // so the Owner can revoke one person's access without affecting anyone else.
  if (email) {
    const staffUser = await verifyStaffCredentials(email, passcode);
    if (!staffUser) {
      await logAuditEvent({
        actorRole: "public",
        action: "ADMIN_LOGIN_FAILED",
        targetSummary: `email:${email}`,
        ipAddress,
      });
      return NextResponse.json({ error: "Invalid email or passcode." }, { status: 401 });
    }
    const role = await getRoleById(staffUser.roleId);
    const token = createSessionToken(role?.name ?? "Staff", staffUser.id);
    await logAuditEvent({
      actorRole: role?.name ?? "Staff",
      action: "ADMIN_LOGIN",
      targetSummary: `${staffUser.displayName} <${staffUser.email}> signed in`,
      ipAddress,
    });
    return sessionResponse(token);
  }

  // Legacy master passcode: signs in as Owner. Kept as a recovery path so the
  // Owner is never locked out, even before any staff accounts exist.
  if (!(await verifyMasterPasscode(passcode))) {
    await logAuditEvent({
      actorRole: "public",
      action: "ADMIN_LOGIN_FAILED",
      targetSummary: "Owner master passcode attempt",
      ipAddress,
    });
    return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
  }
  const token = createSessionToken("Owner");
  await logAuditEvent({
    actorRole: "Owner",
    action: "ADMIN_LOGIN",
    targetSummary: "Owner master passcode sign-in",
    ipAddress,
  });
  return sessionResponse(token);
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
