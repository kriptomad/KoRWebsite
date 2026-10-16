import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission, PERMISSIONS_CATALOG } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/db/audit";
import { createRole, listRoles, updateRolePermissions } from "@/lib/db/roles";
import { isSameOrigin } from "@/lib/security/same-origin";

const createSchema = z.object({ name: z.string().min(1).max(60) });
const updateSchema = z.object({
  roleId: z.string().min(1),
  permissions: z.array(z.enum(PERMISSIONS_CATALOG.map((p) => p.id) as [string, ...string[]])),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ roles: await listRoles() });
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
    return NextResponse.json({ error: "A role name is required." }, { status: 400 });
  }

  const created = await createRole(parsed.data.name);
  await logAuditEvent({
    actorRole: role!.name,
    action: "ROLE_CREATED",
    targetSummary: `role:${created.name}`,
    ipAddress: clientIp(request),
  });
  return NextResponse.json({ role: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role permission update." }, { status: 400 });
  }

  const updated = await updateRolePermissions(parsed.data.roleId, parsed.data.permissions);
  await logAuditEvent({
    actorRole: role!.name,
    action: "ROLE_PERMISSIONS_UPDATED",
    targetSummary: `role:${updated.name}`,
    ipAddress: clientIp(request),
  });
  return NextResponse.json({ role: updated });
}
