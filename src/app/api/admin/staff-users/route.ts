import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { createStaffUser, listStaffUsers } from "@/lib/db/staff-users";
import { logAuditEvent } from "@/lib/db/audit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const createSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(120),
  roleId: z.string().min(1),
  passcode: z.string().min(8).max(200),
});

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const staffUsers = await listStaffUsers();
  return NextResponse.json({ staffUsers });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in a valid email, name, role, and an 8+ character passcode." }, { status: 400 });
  }

  try {
    const staffUser = await createStaffUser(parsed.data);
    await logAuditEvent({
      actorRole: role!.name,
      action: "STAFF_USER_CREATED",
      targetSummary: `${staffUser.displayName} <${staffUser.email}>`,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ staffUser }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the staff user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
