/** Minimal SVG sanitizer for admin-uploaded logo/media images.
 *
 * SVG is an XML+script-capable format: a malicious file can embed <script>,
 * event-handler attributes (onload, onclick, ...), or javascript: URIs that
 * execute when the file is opened directly in a browser tab (defacement /
 * stored-XSS vector even though it's served from a separate storage origin).
 * This strips the dangerous constructs while leaving normal vector artwork
 * intact. It is not a full XML parser — for untrusted, high-stakes input a
 * dedicated library (e.g. DOMPurify with an SVG profile) would be stronger,
 * but this covers the realistic attack surface for an admin-only upload.
 */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\son\w+\s*=\s*"(?:[^"\\]|\\.)*"/gi, "")
    .replace(/\son\w+\s*=\s*'(?:[^'\\]|\\.)*'/gi, "")
    .replace(/(xlink:href|href)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!ENTITY[\s\S]*?>/gi, "");
}
