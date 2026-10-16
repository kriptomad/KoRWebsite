import { NextResponse } from "next/server";
import { z } from "zod";
import { createComment } from "@/lib/db/comments";
import { logAuditEvent } from "@/lib/db/audit";

const commentSchema = z.object({
  targetType: z.enum(["recipe", "post"]),
  targetId: z.string().min(1).max(200),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("A valid email is required").max(200),
  body: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 400 });
  }

  const comment = await createComment(parsed.data);

  await logAuditEvent({
    actorRole: "public",
    action: "COMMENT_SUBMITTED",
    targetSummary: `${parsed.data.targetType}:${parsed.data.targetId}`,
    ipAddress: clientIp(request),
  });

  return NextResponse.json(
    { ok: true, comment: { id: comment.id, status: comment.status } },
    { status: 201 },
  );
}
