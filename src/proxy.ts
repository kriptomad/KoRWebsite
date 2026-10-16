import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const COMMENT_LIMIT = 3;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes (FRD 4.5)

export function proxy(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const result = checkRateLimit(`comment:${ip}`, COMMENT_LIMIT, COMMENT_WINDOW_MS);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many comments submitted. Please try again later." },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/comments"],
};
