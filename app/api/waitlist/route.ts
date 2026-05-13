// app/api/waitlist/route.ts
// Waitlist management — clients join when desired slot is full.
// Staff can view and manage waitlist entries.
//
// POST   /api/waitlist          — join waitlist (client or guest)
// GET    /api/waitlist          — list entries (staff: all, client: own)
// PATCH  /api/waitlist?id=xyz   — update status (staff only)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, validatePagination, buildPaginationMeta, requirePermission, checkPermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, WaitlistStatus } from "@prisma/client";
import { z } from "zod";
import { parseISO } from "date-fns";

// ── Schemas ────────────────────────────────────────────────────────────────────

const JoinWaitlistSchema = z.object({
  serviceId: z.string().min(1),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format: YYYY-MM-DD"),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  staffId: z.string().optional(),
  notes: z.string().max(300).optional(),
});

const UpdateWaitlistSchema = z.object({
  status: z.nativeEnum(WaitlistStatus),
});

// ── POST — join waitlist ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  try {
    const body = await req.json();
    const parsed = JoinWaitlistSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { serviceId, preferredDate, preferredTime, staffId, notes } = parsed.data;

    // Verify service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return apiError("Service not found", 404);

    // Check for duplicate waitlist entry
    const existing = await prisma.waitlist.findFirst({
      where: {
        clientId: session.user.id,
        serviceId,
        preferredDate: parseISO(preferredDate),
        status: WaitlistStatus.WAITING,
      },
    });
    if (existing) {
      return apiError("You're already on the waitlist for this date and service", 409);
    }

    const entry = await prisma.waitlist.create({
      data: {
        clientId: session.user.id,
        serviceId,
        preferredDate: parseISO(preferredDate),
        preferredTime: preferredTime ?? null,
        staffId: staffId ?? null,
        notes: notes ?? null,
      },
      include: {
        service: { select: { name: true } },
      },
    });

    return apiSuccess({ waitlist: entry }, 201);
  } catch (error) {
    console.error("[POST /api/waitlist]", error);
    return apiError("Failed to join waitlist", 500);
  }
}

// ── GET — list waitlist entries ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const role = session.user.role as UserRole;
  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = validatePagination(searchParams, { limit: 20 });
  const status = searchParams.get("status") as WaitlistStatus | null;
  const dateStr = searchParams.get("date");

  const isStaff = await checkPermission(session, "manageAppointments");

  const where: any = {};
  if (!isStaff) {
    // Clients see only their own entries
    where.clientId = session.user.id;
  }
  if (status) where.status = status;
  if (dateStr) where.preferredDate = parseISO(dateStr);

  try {
    const [entries, total] = await Promise.all([
      prisma.waitlist.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, phone: true, email: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.waitlist.count({ where }),
    ]);

    return apiSuccess({
      waitlist: entries,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error("[GET /api/waitlist]", error);
    return apiError("Failed to fetch waitlist", 500);
  }
}

// ── PATCH — update waitlist status (staff only) ────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const permError = await requirePermission(session, "manageAppointments");
  if (permError) return permError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("Missing waitlist entry ID", 400);

  try {
    const body = await req.json();
    const parsed = UpdateWaitlistSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const updateData: any = { status: parsed.data.status };
    if (parsed.data.status === WaitlistStatus.NOTIFIED) {
      updateData.notifiedAt = new Date();
    }
    if (parsed.data.status === WaitlistStatus.CONVERTED) {
      updateData.convertedAt = new Date();
    }

    const entry = await prisma.waitlist.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { name: true, phone: true, email: true } },
        service: { select: { name: true } },
      },
    });

    return apiSuccess({ waitlist: entry });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("Waitlist entry not found", 404);
    console.error("[PATCH /api/waitlist]", error);
    return apiError("Failed to update waitlist entry", 500);
  }
}
