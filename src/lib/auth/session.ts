import { createHmac, timingSafeEqual } from "crypto";

// Lightweight signed-cookie session for the admin demo area. This stands in
// for a full auth provider (NextAuth / Clerk / Supabase Auth) which a
// production deployment should use instead — see README "Known limitations".

const COOKIE_NAME = "koc_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET environment variable is required to sign admin sessions.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(roleName: string): string {
  const payload = JSON.stringify({ roleName, expiresAt: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined): { roleName: string } | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      roleName: string;
      expiresAt: number;
    };
    if (payload.expiresAt < Date.now()) return null;
    return { roleName: payload.roleName };
  } catch {
    return null;
  }
}

export function verifyPasscode(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  // TEMP DIAGNOSTIC (remove once Netlify passcode mismatch is resolved) — logs
  // only lengths/presence, never the actual secret values, to Netlify function logs.
  console.log(
    `[auth] ADMIN_PASSCODE set=${Boolean(expected)} expectedLen=${expected?.length ?? 0} candidateLen=${candidate.length}`,
  );
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { COOKIE_NAME, SESSION_TTL_MS };
