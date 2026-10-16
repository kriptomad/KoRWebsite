/** Basic CSRF mitigation for cookie-authenticated mutating routes: reject
 * cross-origin requests by comparing the Origin (or, as a fallback, Referer)
 * header against the Host. Fails closed — a state-changing request from a
 * browser always sends at least one of these headers, so if both are
 * missing we treat the request as untrusted rather than allowing it. */
export function isSameOrigin(request: Request): boolean {
  const requestHost = request.headers.get("host");
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === requestHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === requestHost;
    } catch {
      return false;
    }
  }

  return false;
}
