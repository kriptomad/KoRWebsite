import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { createPost, listPosts } from "@/lib/db/content-store";

const blockSchema = z.discriminatedUnion("_type", [
  z.object({ _type: z.literal("richText"), html: z.string().min(1).max(20000) }),
  z.object({ _type: z.literal("pullQuote"), quote: z.string().min(1).max(600), attribution: z.string().max(120).optional() }),
  z.object({
    _type: z.literal("imageGrid"),
    images: z.array(z.object({ url: z.string().min(1), alt: z.string().min(1).max(200) })).min(1).max(8),
  }),
  z.object({ _type: z.literal("productCard"), productSlug: z.string().min(1).max(80) }),
  z.object({
    _type: z.literal("mediaText"),
    imageUrl: z.string().min(1),
    imageAlt: z.string().min(1).max(200),
    heading: z.string().max(140).optional(),
    body: z.string().min(1).max(4000),
    imagePosition: z.enum(["left", "right"]),
  }),
]);

export const postSchema = z.object({
  slug: z.string().max(80).optional(),
  title: z.string().min(1).max(140),
  excerpt: z.string().min(1).max(400),
  category: z.enum(["market-report", "seasonal-catch", "chef-interview", "culinary-guide"]),
  author: z.string().min(1).max(100),
  coverImageUrl: z.string().min(1),
  coverImageAlt: z.string().min(1).max(200),
  publishedAt: z.string().min(1),
  blocks: z.array(blockSchema).min(1),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "posts.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ posts: await listPosts() });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "posts.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post data.", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await createPost(parsed.data);
  await logAuditEvent({
    actorRole: role!.name,
    action: "POST_CREATED",
    targetSummary: `post:${created.slug}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/news");
  revalidatePath("/");
  return NextResponse.json({ post: created }, { status: 201 });
}
