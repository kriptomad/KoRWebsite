import { NextResponse } from "next/server";
import { z } from "zod";
import { COOKIE_NAME, SESSION_TTL_MS, createSessionToken, verifyPasscode } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/db/audit";

const loginSchema = z.object({
  passcode: z.string().min(1).max(200),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!verifyPasscode(parsed.data.passcode)) {
    return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
  }

  // Demo auth: a valid passcode signs in as Owner (see session.ts header comment).
  const token = createSessionToken("Owner");
  await logAuditEvent({
    actorRole: "Owner",
    action: "ADMIN_LOGIN",
    targetSummary: "Admin session started",
    ipAddress: clientIp(request),
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
