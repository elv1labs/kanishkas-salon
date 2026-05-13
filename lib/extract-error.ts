// lib/extract-error.ts
// ─────────────────────────────────────────────────────────────────────────────
// Safely extract a human-readable error message from API responses.
//
// The API envelope returns `{ error: { code, message, details } }`.
// Client code that naïvely does `data.error` will get the object, which
// renders as "[object Object]".  This helper normalises any shape to a string.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a human-readable error string from an API response body.
 *
 * Handles:
 *  - `{ error: { message: "…" } }`  → returns "…"
 *  - `{ error: "plain string" }`    → returns "plain string"
 *  - `{ error: { code: "…" } }`    → returns "…"
 *  - anything else                  → returns the fallback
 *
 * @example
 * const data = await res.json();
 * if (!res.ok) throw new Error(extractApiError(data, "Save failed"));
 */
export function extractApiError(data: any, fallback = "Something went wrong"): string {
  const err = data?.error;
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    if (typeof err.message === "string") return err.message;
    if (typeof err.code === "string") return err.code;
  }
  return fallback;
}
