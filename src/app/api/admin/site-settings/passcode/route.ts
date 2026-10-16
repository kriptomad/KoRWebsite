import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { logAuditEvent } from "@/lib/db/audit";
import { setMasterPasscode, verifyMasterPasscode } from "@/lib/db/site-settings";
import { isSameOrigin } from "@/lib/security/same-origin";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const patchSchema = z.object({
  currentPasscode: z.string().min(1).max(200),
  newPasscode: z.string().min(8).max(200),
});

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  // Only the Owner may change the master recovery passcode — it's the
  // account of last resort, not a regular permission-gated setting.
  const role = await getCurrentRole();
  if (role?.name !== "Owner") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { currentPasscode, newPasscode } = parsed.data;
  if (!(await verifyMasterPasscode(currentPasscode))) {
    return NextResponse.json({ error: "Current passcode is incorrect." }, { status: 401 });
  }

  await setMasterPasscode(newPasscode);
  await logAuditEvent({
    actorRole: role.name,
    action: "MASTER_PASSCODE_CHANGED",
    targetSummary: "Owner master passcode updated",
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true });
}
