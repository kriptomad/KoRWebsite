import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { createHeroSlide, listHeroSlides } from "@/lib/db/content-store";

const heroSlideSchema = z.object({
  headline: z.string().min(1).max(140),
  subheadline: z.string().max(240).optional().or(z.literal("")),
  ctaLabel: z.string().max(60).optional().or(z.literal("")),
  ctaHref: z.string().max(200).optional().or(z.literal("")),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1).max(200),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.publish")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ heroSlides: await listHeroSlides() });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.publish")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = heroSlideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hero slide data." }, { status: 400 });
  }

  const created = await createHeroSlide(parsed.data);
  await logAuditEvent({
    actorRole: role!.name,
    action: "HERO_SLIDE_CREATED",
    targetSummary: `hero:${created.headline}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/");
  return NextResponse.json({ heroSlide: created }, { status: 201 });
}
