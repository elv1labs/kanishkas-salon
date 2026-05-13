// lib/api-utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Standardized API response utilities following REST design principles.
//
// Implements:
//   • Consistent response envelope: { success, data?, error?, meta?, requestId }
//   • RFC 7807 Problem Details error format
//   • Request ID tracking via X-Request-Id header
//   • Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
//   • Structured error codes for machine-readable error handling
//   • Pagination helpers with hasNext/hasPrev
//   • Prisma error mapping to appropriate HTTP status codes
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getAuthSession } from "./auth";
import { hasPermissionAsync } from "./permissions";
import { Prisma } from "@prisma/client";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// ── Rate Limiting Helper ─────────────────────────────────────────────────────

/**
 * Apply rate limiting to an API request.
 * Returns null if allowed, or a 429 Response if rate-limited.
 *
 * @example
 * const rlError = applyRateLimit(req, "orders:create", { max: 10, windowMs: 60_000 });
 * if (rlError) return rlError;
 */
export function applyRateLimit(
  req: Request,
  action: string,
  opts: { max: number; windowMs: number }
): ReturnType<typeof NextResponse.json> | null {
  const ip = getClientIp(req);
  const identifier = `${action}:${ip}`;
  const result = rateLimit(identifier, opts);
  if (!result.success) {
    return apiRateLimited(undefined, {
      limit: opts.max,
      remaining: result.remaining,
      resetMs: result.retryAfterMs ?? opts.windowMs,
    });
  }
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────

/** Standardized API error codes for machine-readable error handling */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "DATABASE_ERROR";

/** Pagination metadata included in list responses */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Rate limit metadata for response headers */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetMs: number;
}

/** Standard API response envelope */
interface ApiResponseEnvelope {
  success: boolean;
  data?: any;
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    requestId: string;
    timestamp: string;
    /** Response time in milliseconds (added when timing is available) */
    responseTimeMs?: number;
  };
}

// ── Request ID Generation ────────────────────────────────────────────────────

/** Generate a unique request ID for tracing */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

// ── Response Headers ─────────────────────────────────────────────────────────

/** Build standard response headers */
function buildHeaders(
  requestId: string,
  rateLimit?: RateLimitInfo
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Request-Id": requestId,
    "X-Content-Type-Options": "nosniff",
  };

  if (rateLimit) {
    headers["X-RateLimit-Limit"] = String(rateLimit.limit);
    headers["X-RateLimit-Remaining"] = String(rateLimit.remaining);
    headers["X-RateLimit-Reset"] = String(
      Math.ceil((Date.now() + rateLimit.resetMs) / 1000)
    );
  }

  return headers;
}

// ── Success Responses ────────────────────────────────────────────────────────

/**
 * Return a standardized success response.
 *
 * @example
 * return apiSuccess({ appointments }, 200, { pagination: paginationMeta });
 */
export function apiSuccess(
  data: any,
  status = 200,
  options?: {
    pagination?: PaginationMeta;
    rateLimit?: RateLimitInfo;
    requestId?: string;
  }
) {
  const requestId = options?.requestId ?? generateRequestId();
  const headers = buildHeaders(requestId, options?.rateLimit);

  const envelope: ApiResponseEnvelope = {
    success: true,
    ...data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...(options?.pagination && { pagination: options.pagination }),
    },
  };

  return NextResponse.json(envelope, { status, headers });
}

// ── Error Responses ──────────────────────────────────────────────────────────

/** Map HTTP status codes to standardized error codes */
const STATUS_TO_ERROR_CODE: Record<number, ApiErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "UNPROCESSABLE_ENTITY",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

/**
 * Return a standardized error response following RFC 7807 Problem Details.
 *
 * @example
 * return apiError("User not found", 404);
 * return apiError("Validation failed", 400, validationErrors, "VALIDATION_ERROR");
 */
export function apiError(
  message: string,
  status = 400,
  details?: any,
  code?: ApiErrorCode,
  options?: {
    rateLimit?: RateLimitInfo;
    requestId?: string;
  }
) {
  const requestId = options?.requestId ?? generateRequestId();
  const headers = buildHeaders(requestId, options?.rateLimit);
  const errorCode = code ?? STATUS_TO_ERROR_CODE[status] ?? "INTERNAL_ERROR";

  const envelope: ApiResponseEnvelope = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(envelope, { status, headers });
}

/**
 * Convenience: 401 Unauthorized
 */
export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401, undefined, "UNAUTHORIZED");
}

/**
 * Convenience: 403 Forbidden
 */
export function apiForbidden(message = "Forbidden") {
  return apiError(message, 403, undefined, "FORBIDDEN");
}

/**
 * Convenience: 404 Not Found
 */
export function apiNotFound(message = "Not Found") {
  return apiError(message, 404, undefined, "NOT_FOUND");
}

/**
 * Convenience: 429 Rate Limited
 */
export function apiRateLimited(
  message = "Too many requests. Please try again later.",
  rateLimit?: RateLimitInfo
) {
  return apiError(message, 429, undefined, "RATE_LIMITED", { rateLimit });
}

/**
 * Convenience: 405 Method Not Allowed
 */
export function apiMethodNotAllowed(allowed: string[]) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED" as ApiErrorCode,
        message: `Method not allowed. Allowed: ${allowed.join(", ")}`,
      },
      meta: {
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 405,
      headers: {
        Allow: allowed.join(", "),
        "X-Request-Id": generateRequestId(),
      },
    }
  );
}

// ── Body Parsing ─────────────────────────────────────────────────────────────

/**
 * Safely parse JSON body from a request.
 * Returns `{ data, error }` — if `error` is non-null, return it immediately.
 *
 * @example
 * const { data: body, error: jsonError } = await parseJsonBody(req);
 * if (jsonError) return jsonError;
 */
export async function parseJsonBody(
  req: Request
): Promise<{ data: any; error: ReturnType<typeof apiError> | null }> {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: apiError("Invalid JSON body", 400, undefined, "BAD_REQUEST"),
    };
  }
}

// ── Pagination ───────────────────────────────────────────────────────────────

/**
 * Validate and extract pagination parameters from URL search params.
 * Returns `{ page, limit, skip }` with safe bounds.
 *
 * @example
 * const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 20 });
 */
export function validatePagination(
  params: URLSearchParams,
  defaults?: { page?: number; limit?: number; maxLimit?: number }
) {
  const page = parseInt(params.get("page") ?? String(defaults?.page ?? 1));
  const limit = parseInt(params.get("limit") ?? String(defaults?.limit ?? 10));
  const maxLimit = defaults?.maxLimit ?? 100;
  const safePage = Math.max(1, Number.isNaN(page) ? 1 : page);
  const safeLimit = Math.min(maxLimit, Math.max(1, Number.isNaN(limit) ? 1 : limit));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
}

/**
 * Build a standardized pagination metadata object from count results.
 *
 * @example
 * const pagination = buildPaginationMeta(page, limit, total);
 * return apiSuccess({ appointments }, 200, { pagination });
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

// ── Prisma Error Handling ────────────────────────────────────────────────────

/**
 * Map Prisma-specific errors to appropriate HTTP error responses.
 * Logs the full error server-side for debugging while returning
 * a sanitized message to the client.
 *
 * @example
 * catch (error) {
 *   return handlePrismaError(error, "POST /api/services");
 * }
 */
export function handlePrismaError(error: any, context?: string) {
  console.error(
    `[Prisma Error${context ? ` - ${context}` : ""}]`,
    error
  );

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(", ") ?? "field";
        return apiError(
          `A record with this ${target} already exists`,
          409,
          { constraint: target },
          "CONFLICT"
        );
      }
      case "P2025":
        // Record not found
        return apiError("Record not found", 404, undefined, "NOT_FOUND");
      case "P2003":
        // Foreign key constraint failure
        return apiError(
          "Referenced record does not exist",
          400,
          undefined,
          "BAD_REQUEST"
        );
      case "P2014":
        // Required relation violation
        return apiError(
          "Required related record is missing",
          400,
          undefined,
          "BAD_REQUEST"
        );
      default:
        return apiError(
          "Database operation failed",
          500,
          undefined,
          "DATABASE_ERROR"
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      "Invalid data provided",
      422,
      undefined,
      "UNPROCESSABLE_ENTITY"
    );
  }

  return apiError("Internal server error", 500, undefined, "INTERNAL_ERROR");
}

// ── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns null if session is valid (authenticated).
 * Returns a NextResponse 401 error if not authenticated.
 *
 * @example
 * const err = await requireActiveSession(session);
 * if (err) return err;
 */
export async function requireActiveSession(
  existingSession?: any
): Promise<NextResponse | null> {
  const session = existingSession ?? (await getAuthSession());
  if (!session?.user) {
    return apiUnauthorized();
  }
  return null;
}

/**
 * Returns null if the authenticated user has the given permission.
 * Returns a NextResponse 403 error if the user lacks the permission.
 * Uses the DB-backed permission system (lib/permissions.ts), so admin UI
 * changes take effect immediately.
 *
 * @example
 * const permError = await requirePermission(session, "manageServices");
 * if (permError) return permError;
 */
export async function requirePermission(
  existingSession: any,
  permission: string
): Promise<NextResponse | null> {
  if (!existingSession?.user) return apiUnauthorized();
  const hasIt = await hasPermissionAsync(
    existingSession.user.id,
    existingSession.user.role,
    permission
  );
  if (!hasIt) return apiForbidden();
  return null;
}

/**
 * Returns true/false whether the authenticated user has the given permission.
 * Async — uses DB-backed permission system.
 *
 * @example
 * const isStaff = await checkPermission(session, "manageAppointments");
 */
export async function checkPermission(
  existingSession: any,
  permission: string
): Promise<boolean> {
  if (!existingSession?.user) return false;
  return hasPermissionAsync(
    existingSession.user.id,
    existingSession.user.role,
    permission
  );
}

// ── Request Timing ───────────────────────────────────────────────────────────

/**
 * Create a request timer for performance tracking.
 * Call `timer.elapsed()` to get milliseconds since creation.
 *
 * @example
 * const timer = createRequestTimer();
 * // ... do work ...
 * console.log(`Request took ${timer.elapsed()}ms`);
 */
export function createRequestTimer() {
  const start = performance.now();
  return {
    elapsed: () => Math.round(performance.now() - start),
  };
}

// ── Input Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize a string for safe use in log messages (prevent log injection).
 */
export function sanitizeLogInput(input: string, maxLength = 200): string {
  return input.replace(/[\n\r\t]/g, " ").substring(0, maxLength);
}
