// lib/api-performance.ts
// ─────────────────────────────────────────────────────────────────────────────
// Performance optimization utilities for API routes.
//
// Implements recommendations from application-performance-optimization skill:
//   • Response timing and logging
//   • Cache control helpers for API routes
//   • Database query optimization patterns
//   • Resource hint generation for frontend
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

// ── Cache Control Helpers ────────────────────────────────────────────────────

/**
 * Cache presets for different API response types.
 * Use these to set consistent Cache-Control headers across routes.
 */
export const CACHE_PRESETS = {
  /** No caching — for authenticated or dynamic data */
  noCache: "no-store, no-cache, must-revalidate",

  /** Short cache for semi-static public data (services, products listings) */
  publicShort: "public, s-maxage=60, stale-while-revalidate=300",

  /** Medium cache for infrequently changing public data (blog, gallery) */
  publicMedium: "public, s-maxage=300, stale-while-revalidate=600",

  /** Long cache for static assets (uploaded images) */
  immutable: "public, max-age=31536000, immutable",
} as const;

/**
 * Add cache headers to a NextResponse.
 *
 * @example
 * const response = apiSuccess({ services });
 * return withCacheHeaders(response, CACHE_PRESETS.publicShort);
 */
export function withCacheHeaders(
  response: NextResponse,
  cacheControl: string,
  additionalHeaders?: Record<string, string>
): NextResponse {
  response.headers.set("Cache-Control", cacheControl);

  // Set Vary header for proper CDN caching
  response.headers.set("Vary", "Accept, Accept-Encoding, Authorization");

  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// ── Performance Logging ──────────────────────────────────────────────────────

/**
 * Log slow API requests for performance monitoring.
 * Requests exceeding the threshold are logged with timing details.
 *
 * @example
 * const timer = createRequestTimer();
 * // ... handler logic ...
 * logSlowRequest("GET /api/services", timer.elapsed(), 500);
 */
export function logSlowRequest(
  route: string,
  durationMs: number,
  thresholdMs = 1000
): void {
  if (durationMs > thresholdMs) {
    console.warn(
      `[SLOW API] ${route} took ${durationMs}ms (threshold: ${thresholdMs}ms)`
    );
  }
}

// ── Database Query Optimization ──────────────────────────────────────────────

/**
 * Standard select fields for user references in API responses.
 * Use these instead of `include` to avoid over-fetching.
 *
 * @example
 * prisma.appointment.findMany({
 *   include: { client: { select: USER_SELECT_FIELDS.minimal } }
 * });
 */
export const USER_SELECT_FIELDS = {
  /** Minimal user fields for references */
  minimal: {
    id: true,
    name: true,
    image: true,
  },
  /** Standard user fields for display */
  standard: {
    id: true,
    name: true,
    email: true,
    phone: true,
    image: true,
  },
  /** Public profile fields */
  publicProfile: {
    id: true,
    name: true,
    image: true,
    staffProfile: {
      select: {
        designation: true,
        specializations: true,
        bio: true,
        isAvailable: true,
      },
    },
  },
} as const;

/**
 * Standard select fields for service references.
 */
export const SERVICE_SELECT_FIELDS = {
  minimal: {
    id: true,
    name: true,
    slug: true,
    price: true,
    duration: true,
  },
  listing: {
    id: true,
    name: true,
    slug: true,
    shortDesc: true,
    description: true,
    category: true,
    price: true,
    priceMax: true,
    duration: true,
    imageUrl: true,
    isFeatured: true,
    isPopular: true,
    isActive: true,
    sortOrder: true,
    tags: true,
  },
} as const;

// ── Frontend Performance Hints ───────────────────────────────────────────────

/**
 * Generate resource hints for the HTML head.
 * Used by server components to optimize page load.
 */
export const RESOURCE_HINTS = {
  /** DNS prefetch for external domains used by the app */
  dnsPrefetch: [
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://images.unsplash.com",
    "https://www.google.com",       // Maps embed
    "https://maps.googleapis.com",
  ],
  /** Preconnect for critical external origins */
  preconnect: [
    { href: "https://fonts.googleapis.com", crossOrigin: "anonymous" },
    { href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  ],
} as const;

// ── Image Optimization Constants ─────────────────────────────────────────────

/**
 * Recommended image sizes for different contexts.
 * Use with Next.js <Image> `sizes` prop or for `srcset` generation.
 */
export const IMAGE_SIZES = {
  /** Thumbnail in cards/grids */
  thumbnail: { width: 400, height: 300 },
  /** Card image */
  card: { width: 600, height: 400 },
  /** Hero/banner image */
  hero: { width: 1600, height: 900 },
  /** Gallery item */
  gallery: { width: 800, height: 600 },
  /** Avatar/profile */
  avatar: { width: 300, height: 300 },
  /** Full-width section background */
  background: { width: 1920, height: 1080 },
} as const;

/**
 * Responsive image sizes string for common layouts.
 * Use as the `sizes` prop on <Image> components.
 */
export const RESPONSIVE_SIZES = {
  /** Full-width hero images */
  hero: "100vw",
  /** Two-column grid items */
  halfWidth: "(max-width: 768px) 100vw, 50vw",
  /** Three-column grid items */
  thirdWidth: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Four-column grid items */
  quarterWidth: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
  /** Sidebar/card thumbnail */
  thumbnail: "(max-width: 640px) 100vw, 300px",
} as const;
