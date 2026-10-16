import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getCurrentRole } from "@/lib/auth/current-role";
import { isSameOrigin } from "@/lib/security/same-origin";
import { changeOwnPasscode } from "@/lib/db/staff-users";
import { logAuditEvent } from "@/lib/db/audit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const schema = z.object({
  currentPasscode: z.string().min(1).max(200),
  newPasscode: z.string().min(8).max(200),
});

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session?.staffUserId) {
    return NextResponse.json({ error: "Not signed in to a staff account." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide your current passcode and a new one (8+ characters)." }, { status: 400 });
  }

  const { currentPasscode, newPasscode } = parsed.data;
  const staffUser = await changeOwnPasscode(session.staffUserId, currentPasscode, newPasscode);
  if (!staffUser) {
    return NextResponse.json({ error: "Current passcode is incorrect." }, { status: 401 });
  }

  const role = await getCurrentRole();
  await logAuditEvent({
    actorRole: role?.name ?? "Staff",
    action: "STAFF_PASSCODE_CHANGED",
    targetSummary: `${staffUser.displayName} <${staffUser.email}> changed their own passcode`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}
