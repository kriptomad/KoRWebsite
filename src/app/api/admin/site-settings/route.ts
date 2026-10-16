import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { setLogoUrl } from "@/lib/db/site-settings";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const patchSchema = z.object({
  logoUrl: z.string().trim().min(1).nullable(),
});

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "roles.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const settings = await setLogoUrl(parsed.data.logoUrl);
  await logAuditEvent({
    actorRole: role!.name,
    action: "SITE_LOGO_UPDATED",
    targetSummary: settings.logoUrl ?? "reset to default",
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ settings });
}
