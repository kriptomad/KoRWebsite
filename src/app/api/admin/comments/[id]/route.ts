import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/db/audit";
import { moderateComment } from "@/lib/db/comments";
import { isSameOrigin } from "@/lib/security/same-origin";

const actionSchema = z.object({
  action: z.enum(["approve", "hide", "purge"]),
});

const STATUS_BY_ACTION = {
  approve: "approved",
  hide: "hidden",
  purge: "purged",
} as const;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "comments.moderate")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { id } = await params;
  const status = STATUS_BY_ACTION[parsed.data.action];
  await moderateComment(id, status);

  await logAuditEvent({
    actorRole: role!.name,
    action: `COMMENT_${parsed.data.action.toUpperCase()}`,
    targetSummary: `comment:${id}`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true, status });
}
