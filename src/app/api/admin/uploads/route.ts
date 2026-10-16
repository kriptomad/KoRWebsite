import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { sanitizeSvg } from "@/lib/security/sanitize-svg";
import { logAuditEvent } from "@/lib/db/audit";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";

// Media upload for the CMS image fields (hero slides, products, recipes,
// posts, site logo). Serverless hosts (Netlify/Vercel Functions) ship a
// read-only deployment bundle, so local disk is only usable in dev — when
// Supabase is configured, uploads go to Supabase Storage instead, which both
// persists across deploys and is servable via a public URL.

const MEDIA_BUCKET = "media";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

// Verify the file's actual bytes match its declared type rather than trusting
// the client-supplied Content-Type/extension alone (OWASP A04: an attacker
// could otherwise upload an arbitrary file disguised with an image MIME type).
function hasValidSignature(extension: string, bytes: Buffer): boolean {
  switch (extension) {
    case "png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "jpg":
      return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case "webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    case "svg": {
      const head = bytes.subarray(0, 500).toString("utf8").trimStart();
      return /^(<\?xml|<svg)/i.test(head);
    }
    default:
      return false;
  }
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

async function uploadToSupabase(filename: string, bytes: Buffer, contentType: string): Promise<string> {
  const client = supabaseAdmin!;
  const attempt = () => client.storage.from(MEDIA_BUCKET).upload(filename, bytes, { contentType, upsert: false });

  let { error } = await attempt();
  if (error && /bucket not found/i.test(error.message)) {
    // First upload on a fresh Supabase project — create the public bucket once, then retry.
    await client.storage.createBucket(MEDIA_BUCKET, { public: true });
    ({ error } = await attempt());
  }
  if (error) throw error;

  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
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
      { error: "Unsupported image type. Use PNG, JPEG, WebP, or SVG." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds the 5MB limit." }, { status: 400 });
  }

  let bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(extension, bytes)) {
    return NextResponse.json({ error: "File content doesn't match its declared image type." }, { status: 400 });
  }

  if (extension === "svg") {
    // Strip embeddable scripts/event-handlers before this ever reaches disk
    // or object storage — defuses stored-XSS/defacement via a malicious SVG.
    bytes = Buffer.from(sanitizeSvg(bytes.toString("utf8")), "utf8");
  }

  // Filename is always server-generated (never derived from user input) to
  // avoid path traversal / overwrite attacks via a crafted original filename.
  const filename = `${randomUUID()}.${extension}`;

  let url: string;
  if (isSupabaseConfigured && supabaseAdmin) {
    url = await uploadToSupabase(filename, bytes, file.type);
  } else {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), bytes);
    url = `/uploads/${filename}`;
  }

  await logAuditEvent({
    actorRole: role!.name,
    action: "MEDIA_UPLOADED",
    targetSummary: filename,
    ipAddress: clientIp(request),
  });


  return NextResponse.json({ url }, { status: 201 });
}
