import { NextResponse } from "next/server";
import { getAuthSession } from "./auth";
import { Prisma } from "@prisma/client";

export function apiSuccess(data: any, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function apiError(message: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401);
}

export function apiForbidden(message = "Forbidden") {
  return apiError(message, 403);
}

export function apiNotFound(message = "Not Found") {
  return apiError(message, 404);
}

export async function parseJsonBody(req: Request): Promise<{ data: any; error: ReturnType<typeof apiError> | null }> {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch {
    return { data: null, error: apiError("Invalid JSON body", 400) };
  }
}

export function validatePagination(params: URLSearchParams, defaults?: { page?: number; limit?: number; maxLimit?: number }) {
  const page = parseInt(params.get('page') ?? String(defaults?.page ?? 1));
  const limit = parseInt(params.get('limit') ?? String(defaults?.limit ?? 10));
  const maxLimit = defaults?.maxLimit ?? 100;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(maxLimit, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
}

export function handlePrismaError(error: any, context?: string) {
  console.error(`[Prisma Error${context ? ` - ${context}` : ''}]`, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError("A record with this value already exists", 409);
    }
    if (error.code === "P2025") {
      return apiError("Record not found", 404);
    }
  }
  return apiError("Database error occurred", 500);
}

/**
 * Returns null if session is valid (authenticated).
 * Returns a NextResponse 401 error if not authenticated.
 * Usage: const err = await requireActiveSession(session); if (err) return err;
 */
export async function requireActiveSession(existingSession?: any): Promise<NextResponse | null> {
  const session = existingSession ?? await getAuthSession();
  if (!session?.user) {
    return apiUnauthorized();
  }
  return null;
}
