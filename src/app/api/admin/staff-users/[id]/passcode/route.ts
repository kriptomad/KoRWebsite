import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { isSameOrigin } from "@/lib/security/same-origin";
import { getStaffUserById, resetStaffPasscode } from "@/lib/db/staff-users";
import { logAuditEvent } from "@/lib/db/audit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const schema = z.object({
  newPasscode: z.string().min(8).max(200),
  requireChange: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  // Resetting someone else's credentials is Owner-only, not just anyone with
  // roles.manage — it's equivalent to handing out a new identity.
  const role = await getCurrentRole();
  if (role?.name !== "Owner") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a passcode of at least 8 characters." }, { status: 400 });
  }

  const staffUser = await getStaffUserById(id);
  if (!staffUser) {
    return NextResponse.json({ error: "Staff user not found." }, { status: 404 });
  }

  const updated = await resetStaffPasscode(id, parsed.data.newPasscode, { requireChange: parsed.data.requireChange });
  await logAuditEvent({
    actorRole: role.name,
    action: "STAFF_PASSCODE_RESET",
    targetSummary: `${updated.displayName} <${updated.email}>${parsed.data.requireChange ? " (temporary passcode issued)" : ""}`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ staffUser: updated });
}
