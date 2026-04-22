// lib/rate-limit.ts
// In-memory sliding window rate limiter for self-hosted Docker deployments.
// No external dependencies (Redis, Upstash, etc.) required.
//
// Usage:
//   const { success, remaining } = rateLimit(identifier, { max: 5, windowMs: 60_000 });
//   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs * 2; // Keep a generous buffer
  Array.from(store.entries()).forEach(([key, entry]) => {
    // Remove entries with no recent activity
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  });
}

export function rateLimit(
  identifier: string,
  opts: { max: number; windowMs: number }
): { success: boolean; remaining: number; retryAfterMs?: number } {
  const { max, windowMs } = opts;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up periodically
  cleanup(windowMs);

  // Get or create entry
  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Trim timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check if under the limit
  if (entry.timestamps.length >= max) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      success: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    success: true,
    remaining: max - entry.timestamps.length,
  };
}

// ── Convenience: extract client IP from Next.js request ──────────────────────
export function getClientIp(req: Request): string {
  const forwarded = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  const real = req.headers.get("x-real-ip");
  return forwarded || real || "unknown";
}
