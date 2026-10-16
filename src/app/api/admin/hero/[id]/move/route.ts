import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { moveHeroSlide } from "@/lib/db/content-store";

const moveSchema = z.object({ direction: z.enum(["up", "down"]) });

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.publish")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = moveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid move direction." }, { status: 400 });
  }

  const { id } = await params;
  const heroSlides = await moveHeroSlide(id, parsed.data.direction);
  await logAuditEvent({
    actorRole: role!.name,
    action: "HERO_SLIDE_REORDERED",
    targetSummary: `hero:${id}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/");
  return NextResponse.json({ heroSlides });
}
