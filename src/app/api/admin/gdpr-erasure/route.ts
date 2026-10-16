import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/db/audit";
import { purgeCommentsByEmail } from "@/lib/db/comments";
import { isSameOrigin } from "@/lib/security/same-origin";

const erasureSchema = z.object({
  email: z.string().trim().email().max(200),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Staff-initiated per FRD 6 "GDPR Article 17 Compliance": gated behind the
// gdpr.manage permission rather than exposed as a public endpoint, since an
// unauthenticated erasure-by-email endpoint would let anyone purge another
// person's data (OWASP A01: Broken Access Control).
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "gdpr.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = erasureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const purgedCount = await purgeCommentsByEmail(parsed.data.email);

  await logAuditEvent({
    actorRole: role!.name,
    action: "GDPR_ERASURE",
    targetSummary: `email:${parsed.data.email} (${purgedCount} records)`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ ok: true, purgedCount });
}
