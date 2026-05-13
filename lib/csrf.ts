// lib/csrf.ts
// Origin-based CSRF protection for custom API routes.
// Validates that state-changing requests (POST, PATCH, PUT, DELETE)
// originate from our own domain by checking the Origin or Referer header.
//
// This is the recommended approach for SPA/fetch-based clients per OWASP:
// https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#verifying-origin-with-standard-headers

const ALLOWED_ORIGINS = new Set<string>();

function getAllowedOrigins(): Set<string> {
  if (ALLOWED_ORIGINS.size > 0) return ALLOWED_ORIGINS;

  // Build the set from env vars (done once, cached)
  const nextauthUrl = process.env.NEXTAUTH_URL;
  if (nextauthUrl) {
    try {
      const url = new URL(nextauthUrl);
      ALLOWED_ORIGINS.add(url.origin); // e.g. "https://kanishkassalon.com"
    } catch { /* ignore malformed */ }
  }

  // Always allow localhost in development
  if (process.env.NODE_ENV !== "production") {
    ALLOWED_ORIGINS.add("http://localhost:3000");
    ALLOWED_ORIGINS.add("http://127.0.0.1:3000");
  }

  // Explicit additional origins (comma-separated)
  const extra = process.env.CSRF_ALLOWED_ORIGINS;
  if (extra) {
    extra.split(",").forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) ALLOWED_ORIGINS.add(trimmed);
    });
  }

  return ALLOWED_ORIGINS;
}

/**
 * Validates the request origin for CSRF protection.
 * Returns `null` if the request is safe, or an error message string if blocked.
 *
 * Only checks state-changing methods: POST, PATCH, PUT, DELETE.
 * GET/HEAD/OPTIONS are always allowed (safe methods per HTTP spec).
 */
export function validateCsrfOrigin(req: Request): string | null {
  const method = req.method.toUpperCase();

  // Safe methods — no CSRF risk
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const allowed = getAllowedOrigins();

  // Check Origin header first (most reliable)
  if (origin) {
    if (allowed.has(origin)) return null;
    return `CSRF blocked: origin '${origin}' is not allowed`;
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (allowed.has(refOrigin)) return null;
      return `CSRF blocked: referer origin '${refOrigin}' is not allowed`;
    } catch {
      return "CSRF blocked: malformed referer header";
    }
  }

  // No Origin or Referer — block by default for safety.
  // Legitimate browser fetch/XHR always sends Origin on cross-origin requests
  // and same-origin POST requests in modern browsers.
  // However, some non-browser clients (curl, Postman, mobile apps) may not
  // send these headers, so we allow a bypass for server-to-server calls
  // that include our cron secret.
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return null;
  }

  // In development, allow requests without origin (e.g. curl, Postman)
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return "CSRF blocked: missing Origin and Referer headers";
}
