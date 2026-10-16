import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { deletePost, listPosts, updatePost } from "@/lib/db/content-store";
import { postSchema } from "../route";

const patchSchema = postSchema.partial();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "posts.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid post update.", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  try {
    const before = (await listPosts()).find((p) => p._id === id);
    const updated = await updatePost(id, parsed.data);
    await logAuditEvent({
      actorRole: role!.name,
      action: "POST_UPDATED",
      targetSummary: `post:${updated.slug}`,
      ipAddress: clientIp(request),
    });
    revalidatePath("/news");
    revalidatePath(`/news/${updated.slug}`);
    if (before && before.slug !== updated.slug) revalidatePath(`/news/${before.slug}`);
    revalidatePath("/");
    return NextResponse.json({ post: updated });
  } catch {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "posts.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const post = (await listPosts()).find((p) => p._id === id);
  await deletePost(id);
  await logAuditEvent({
    actorRole: role!.name,
    action: "POST_DELETED",
    targetSummary: `post:${post?.slug ?? id}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/news");
  if (post) revalidatePath(`/news/${post.slug}`);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
