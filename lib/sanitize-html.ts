// lib/sanitize-html.ts
// Lightweight server-side HTML sanitizer for rendering user/admin-authored content.
// Strips dangerous tags (script, iframe, object, embed, form, style) and event handlers.
// Safe for blog post content that uses basic formatting HTML.

/**
 * Sanitizes HTML content by removing script tags, event handlers, and dangerous elements.
 * Keeps safe formatting tags: p, h1-h6, a, img, ul, ol, li, strong, em, br, div, span,
 * blockquote, table, thead, tbody, tr, td, th, pre, code, figure, figcaption, hr.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  let clean = html;

  // 1. Remove <script> tags and their contents (case-insensitive, handles multiline)
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove <iframe>, <object>, <embed>, <applet>, <form> tags and contents
  const dangerousTags = ["iframe", "object", "embed", "applet", "form", "base", "link"];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, "gi");
    clean = clean.replace(regex, "");
    // Also remove self-closing variants
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  // 3. Remove <style> tags and their contents
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 4. Remove all on* event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // 5. Remove javascript: and data: URLs from href/src/action attributes
  clean = clean.replace(/(href|src|action)\s*=\s*(?:"[^"]*javascript:[^"]*"|'[^']*javascript:[^']*')/gi, "$1=\"\"");
  clean = clean.replace(/(href|src|action)\s*=\s*(?:"[^"]*data:[^"]*"|'[^']*data:[^']*')/gi, "$1=\"\"");

  // 6. Remove meta refresh tags
  clean = clean.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, "");

  return clean;
}
