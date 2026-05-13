export const dynamic = "force-dynamic";
// app/api/appointments/[id]/route.ts
// Individual appointment — GET detail, PATCH (status/reschedule/reassign), DELETE (cancel)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import { addMinutes, format, parseISO, isBefore, startOfDay } from "date-fns";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  handlePrismaError,
} from "@/lib/api-utils";
import { sendBookingNotification } from "@/lib/notifications";
import { awardLoyaltyPoints } from "@/lib/loyalty";

const UpdateAppointmentSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  staffId: z.string().cuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  staffNotes: z.string().max(1000).optional(),
  cancelReason: z.string().max(500).optional(),
});

const STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.RECEPTIONIST,
];

// Shared include shape
const APPOINTMENT_INCLUDE = {
  client: { select: { id: true, name: true, email: true, phone: true, image: true } },
  staff: { select: { id: true, name: true, image: true } },
  service: { select: { id: true, name: true, duration: true, price: true, imageUrl: true } },
  payment: { select: { id: true, status: true, amount: true, method: true, paidAt: true, transactionRef: true, paymentNote: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Single appointment detail ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });

    if (!appointment) return apiNotFound("Appointment not found");

    // Clients can only view their own
    const isStaff = STAFF_ROLES.includes(session.user.role as UserRole);
    if (!isStaff && appointment.clientId !== session.user.id) {
      return apiForbidden();
    }

    return apiSuccess({ appointment });
  } catch (error) {
    return handlePrismaError(error, "GET /api/appointments/[id]");
  }
}

// ---- PATCH: Update appointment (status, reschedule, reassign) ----
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const isStaff = STAFF_ROLES.includes(session.user.role as UserRole);

    // Fetch existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true, duration: true } } },
    });

    if (!existing) return apiNotFound("Appointment not found");

    // Clients can only cancel their own appointments
    if (!isStaff) {
      if (existing.clientId !== session.user.id) return apiForbidden();
      if (parsed.data.status && parsed.data.status !== AppointmentStatus.CANCELLED) {
        return apiForbidden("You can only cancel appointments");
      }
    }

    const updateData: Record<string, any> = {};
    const data = parsed.data;

    // ── Status transitions ──
    if (data.status) {
      updateData.status = data.status;
      if (data.status === AppointmentStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = data.cancelReason ?? null;
      }
      if (data.status === AppointmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
        awardLoyaltyPoints(id).catch(console.error);
      }
    }

    // ── Staff reassignment ──
    if (data.staffId !== undefined) updateData.staffId = data.staffId;
    if (data.staffNotes) updateData.staffNotes = data.staffNotes;

    // ── Reschedule ──
    if (data.date && data.startTime) {
      const [hours, minutes] = data.startTime.split(":").map(Number);
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, existing.service.duration);
      const endTime = format(endDate, "HH:mm");

      if (isBefore(startDate, new Date())) {
        return apiError("Cannot reschedule to the past");
      }

      // Check for conflicts with new slot
      if (data.staffId || existing.staffId) {
        const targetStaffId = data.staffId ?? existing.staffId;
        const conflicting = await prisma.appointment.findFirst({
          where: {
            staffId: targetStaffId,
            id: { not: id },
            date: startOfDay(parseISO(data.date)),
            status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
            OR: [
              { startTime: { gte: data.startTime, lt: endTime } },
              { endTime: { gt: data.startTime, lte: endTime } },
              { AND: [{ startTime: { lte: data.startTime } }, { endTime: { gte: endTime } }] },
            ],
          },
        });
        if (conflicting) {
          return apiError("This time slot is already booked for the selected staff member", 409);
        }
      }

      updateData.date = startOfDay(parseISO(data.date));
      updateData.startTime = data.startTime;
      updateData.endTime = endTime;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: APPOINTMENT_INCLUDE,
    });

    // ── Notification for status changes ──
    if (data.status) {
      const statusMessages: Record<string, string> = {
        CONFIRMED: `Your appointment for ${existing.service.name} has been confirmed.`,
        CANCELLED: `Your appointment for ${existing.service.name} has been cancelled.`,
        COMPLETED: `Your appointment for ${existing.service.name} is complete. Thank you for visiting!`,
        NO_SHOW: `You missed your appointment for ${existing.service.name}. Please contact us to reschedule.`,
      };

      if (statusMessages[data.status]) {
        await prisma.notification.create({
          data: {
            userId: existing.clientId,
            type: data.status === "CANCELLED" ? "APPOINTMENT_CANCELLED" : "APPOINTMENT_CONFIRMED",
            title: `Appointment ${data.status.charAt(0) + data.status.slice(1).toLowerCase()}`,
            message: statusMessages[data.status],
            actionUrl: `/dashboard/client/appointments`,
          },
        });
      }

      // Fire-and-forget SMS/Email
      const statusToEvent: Partial<Record<AppointmentStatus, "confirmed" | "cancelled" | "completed">> = {
        [AppointmentStatus.CONFIRMED]: "confirmed",
        [AppointmentStatus.CANCELLED]: "cancelled",
        [AppointmentStatus.COMPLETED]: "completed",
      };
      const notifEvent = statusToEvent[data.status as AppointmentStatus];
      if (notifEvent && appointment.client) {
        sendBookingNotification(notifEvent as any, {
          clientName: appointment.client.name ?? "Customer",
          clientEmail: appointment.client.email,
          clientPhone: appointment.client.phone,
          serviceName: appointment.service.name,
          date: format(appointment.date, "yyyy-MM-dd"),
          startTime: appointment.startTime,
          bookingRef: appointment.id.slice(-8).toUpperCase(),
        }, { cancelReason: data.cancelReason }).catch(console.error);
      }
    }

    // ── Audit log ──
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_APPOINTMENT",
        entity: "Appointment",
        entityId: id,
        details: { fields: Object.keys(updateData) },
      },
    });

    return apiSuccess({ appointment });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/appointments/[id]");
  }
}

// ---- DELETE: Cancel appointment (soft-delete) ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;
    const isStaff = STAFF_ROLES.includes(session.user.role as UserRole);

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true } } },
    });

    if (!existing) return apiNotFound("Appointment not found");

    // Clients can only cancel their own
    if (!isStaff && existing.clientId !== session.user.id) {
      return apiForbidden();
    }

    // Already cancelled
    if (existing.status === AppointmentStatus.CANCELLED) {
      return apiError("Appointment is already cancelled");
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: "Cancelled by admin",
      },
    });

    await prisma.notification.create({
      data: {
        userId: existing.clientId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your appointment for ${existing.service.name} has been cancelled.`,
        actionUrl: `/dashboard/client/appointments`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CANCEL_APPOINTMENT",
        entity: "Appointment",
        entityId: id,
        details: { name: existing.service.name },
      },
    });

    return apiSuccess({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/appointments/[id]");
  }
}
