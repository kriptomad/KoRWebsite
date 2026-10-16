import sanitizeHtml from "sanitize-html";

/** Sanitizes CMS-authored rich text before rendering as HTML (defense in depth against stored XSS). */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "br", "h2", "h3", "blockquote"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
