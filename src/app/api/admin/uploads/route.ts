import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";

// Local disk-backed media upload for the CMS image fields (hero slides,
// products, recipes, posts). Files are written under public/uploads so they
// are served directly by Next.js — fine for this local/dev deployment; swap
// for a cloud object store (e.g. S3, Sanity assets) for a real production
// deployment with multiple instances / ephemeral filesystems.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "content.create")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPEG, or WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds the 5MB limit." }, { status: 400 });
  }

  // Filename is always server-generated (never derived from user input) to
  // avoid path traversal / overwrite attacks via a crafted original filename.
  const filename = `${randomUUID()}.${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), bytes);

  await logAuditEvent({
    actorRole: role!.name,
    action: "MEDIA_UPLOADED",
    targetSummary: filename,
    ipAddress: clientIp(request),
  });

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
