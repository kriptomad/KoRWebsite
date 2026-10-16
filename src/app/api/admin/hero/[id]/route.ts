import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { deleteHeroSlide, updateHeroSlide } from "@/lib/db/content-store";

const patchSchema = z.object({
  headline: z.string().min(1).max(140).optional(),
  subheadline: z.string().max(240).optional().or(z.literal("")),
  ctaLabel: z.string().max(60).optional().or(z.literal("")),
  ctaHref: z.string().max(200).optional().or(z.literal("")),
  imageUrl: z.string().min(1).optional(),
  imageAlt: z.string().min(1).max(200).optional(),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.publish")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hero slide update." }, { status: 400 });
  }

  const { id } = await params;
  try {
    const updated = await updateHeroSlide(id, parsed.data);
    await logAuditEvent({
      actorRole: role!.name,
      action: "HERO_SLIDE_UPDATED",
      targetSummary: `hero:${updated.headline}`,
      ipAddress: clientIp(request),
    });
    revalidatePath("/");
    return NextResponse.json({ heroSlide: updated });
  } catch {
    return NextResponse.json({ error: "Hero slide not found." }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.publish")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  await deleteHeroSlide(id);
  await logAuditEvent({
    actorRole: role!.name,
    action: "HERO_SLIDE_DELETED",
    targetSummary: `hero:${id}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
