/** Basic CSRF mitigation for cookie-authenticated mutating routes: reject
 * cross-origin requests by comparing the Origin header against the Host. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin requests from browsers always send Origin on fetch POST/PATCH
  try {
    const originHost = new URL(origin).host;
    const requestHost = request.headers.get("host");
    return originHost === requestHost;
  } catch {
    return false;
  }
}
