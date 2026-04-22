// app/api/appointments/route.ts
// Appointment booking & management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import { addMinutes, format, parseISO, isBefore, startOfDay, endOfDay } from "date-fns";
import { sendBookingNotification } from "@/lib/notifications";
import { awardLoyaltyPoints } from "@/lib/loyalty";

// ---- Validation schemas ----

const CreateAppointmentSchema = z.object({
  serviceId:   z.string().cuid(),
  staffId:     z.string().cuid().optional(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  notes:       z.string().max(500).optional(),
  totalAmount: z.number().optional(),  // ignored — always uses service.price
  // Walk-in fields (receptionist flow)
  isWalkin:    z.boolean().optional(),
  walkinName:  z.string().max(100).optional(),
  walkinPhone: z.string().max(20).optional().nullable(),
});

const UpdateAppointmentSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  staffId: z.string().cuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  staffNotes: z.string().max(1000).optional(),
  cancelReason: z.string().max(500).optional(),
});

// ---- GET: List appointments ----
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status") as AppointmentStatus | null;
    const staffId = searchParams.get("staffId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const isStaff = ([UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST] as readonly UserRole[]).includes(
      session.user.role as UserRole
    );

    const where: any = {};

    // Clients can only see their own appointments
    if (!isStaff) {
      where.clientId = session.user.id;
    } else {
      if (staffId) where.staffId = staffId;
    }

    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = startOfDay(parseISO(dateFrom));
      if (dateTo) where.date.lte = endOfDay(parseISO(dateTo));
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, image: true } },
          staff: { select: { id: true, name: true, image: true } },
          service: { select: { id: true, name: true, duration: true, price: true, imageUrl: true } },
          payment: { select: { status: true, amount: true, method: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---- POST: Create new appointment ----
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { serviceId, staffId, date, startTime, notes, isWalkin, walkinName, walkinPhone } = parsed.data;

    // ── Resolve clientId ────────────────────────────────────────────────────
    // For walk-in bookings made by a receptionist, find or create a guest user.
    // For normal bookings, use the current session user.
    let clientId = session.user.id;

    if (isWalkin && walkinName) {
      // Try to find existing user by phone first, then by name
      let walkinUser = walkinPhone
        ? await prisma.user.findFirst({ where: { phone: walkinPhone } })
        : null;

      if (!walkinUser) {
        // Create a minimal walk-in user account
        const guestEmail = walkinPhone
          ? `walkin.${walkinPhone.replace(/\D/g, "")}@walkin.kanishkas.in`
          : `walkin.${Date.now()}@walkin.kanishkas.in`;

        walkinUser = await prisma.user.upsert({
          where: { email: guestEmail },
          update: { name: walkinName },
          create: {
            name:     walkinName,
            email:    guestEmail,
            phone:    walkinPhone ?? null,
            role:     UserRole.CLIENT,
            isWalkIn: true,  // ← walk-in users cannot log in
          },
        });
      }
      clientId = walkinUser.id;
    }

    // Fetch service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found or unavailable" }, { status: 404 });
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, service.duration);
    const endTime = format(endDate, "HH:mm");

    // Check appointment date is not in the past
    if (isBefore(startDate, new Date())) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 }
      );
    }

    // Check appointment is within business hours
    const settings = await prisma.businessSettings.findFirst({
      select: { openTime: true, closeTime: true },
    });
    const openTime = settings?.openTime ?? "10:00";
    const closeTime = settings?.closeTime ?? "21:00";
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const startMin = hours * 60 + minutes;
    const endMin = startMin + service.duration;

    if (startMin < openMin || endMin > closeMin) {
      return NextResponse.json(
        { error: `Appointments must be between ${openTime} and ${closeTime}` },
        { status: 400 }
      );
    }

    // Check slot availability (no overlapping appointments for same staff)
    if (staffId) {
      const conflicting = await prisma.appointment.findFirst({
        where: {
          staffId,
          date: startOfDay(parseISO(date)),
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
          OR: [
            { startTime: { gte: startTime, lt: endTime } },
            { endTime: { gt: startTime, lte: endTime } },
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflicting) {
        return NextResponse.json(
          { error: "This time slot is already booked for the selected staff member" },
          { status: 409 }
        );
      }
    }

    // Determine deposit amount (if service requires one)
    const depositAmount = service.requiresDeposit ? service.depositAmount : null;

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId:          staffId ?? null,
        bookedByStaffId:  isWalkin ? session.user.id : null,  // ← receptionist who created this
        serviceId,
        date:             startOfDay(parseISO(date)),
        startTime,
        endTime,
        status:           AppointmentStatus.PENDING,
        notes,
        totalAmount:      service.price,
        depositAmount,
      } as any,
      include: {
        client:  { select: { id: true, name: true, email: true, phone: true } },
        staff:   { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });

    // Send confirmation notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment Request Received",
        message: `Your appointment for ${service.name} on ${date} at ${startTime} is pending confirmation.`,
        actionUrl: `/dashboard/client/appointments/${appointment.id}`,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_APPOINTMENT",
        entity: "Appointment",
        entityId: appointment.id,
        details: { serviceId, date, startTime },
      },
    });

    // Fire-and-forget: SMS + Email confirmation (stubs if env vars not set)
    sendBookingNotification("created", {
      clientName:  appointment.client.name ?? "Customer",
      clientEmail: appointment.client.email,
      clientPhone: appointment.client.phone,
      serviceName: appointment.service.name,
      date,
      startTime,
      bookingRef:  appointment.id.slice(-8).toUpperCase(),
      staffName:   appointment.staff?.name ?? undefined,
    }).catch(console.error);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/appointments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---- PATCH: Update appointment ----
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
    }

    const parsed = UpdateAppointmentSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const isStaff = ([UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST] as readonly UserRole[]).includes(
      session.user.role as UserRole
    );

    // Fetch existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { service: { select: { name: true, duration: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Clients can only cancel their own appointments
    if (!isStaff) {
      if (existing.clientId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (parsed.data.status && parsed.data.status !== AppointmentStatus.CANCELLED) {
        return NextResponse.json({ error: "You can only cancel appointments" }, { status: 403 });
      }
    }

    const updateData: any = {};
    const data = parsed.data;

    if (data.status) {
      updateData.status = data.status;
      if (data.status === AppointmentStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = data.cancelReason ?? null;
      }
      if (data.status === AppointmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
        // Award loyalty points (fire-and-forget)
        awardLoyaltyPoints(id).catch(console.error);
      }
    }

    if (data.staffId !== undefined) updateData.staffId = data.staffId;
    if (data.staffNotes) updateData.staffNotes = data.staffNotes;

    // Reschedule
    if (data.date && data.startTime) {
      const [hours, minutes] = data.startTime.split(":").map(Number);
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, existing.service.duration);
      const endTime = format(endDate, "HH:mm");

      if (isBefore(startDate, new Date())) {
        return NextResponse.json({ error: "Cannot reschedule to the past" }, { status: 400 });
      }

      updateData.date = startOfDay(parseISO(data.date));
      updateData.startTime = data.startTime;
      updateData.endTime = endTime;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        staff: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });

    // Notification for status changes
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
    }

    // Fire-and-forget: SMS + Email for status transitions
    if (data.status && appointment.client) {
      const statusToEvent: Partial<Record<AppointmentStatus, "confirmed" | "cancelled" | "completed" | "rescheduled">> = {
        [AppointmentStatus.CONFIRMED]:  "confirmed",
        [AppointmentStatus.CANCELLED]:  "cancelled",
        [AppointmentStatus.COMPLETED]:  "completed",
      };
      // Also detect reschedule (date or time changed)
      const isReschedule = !data.status && (data.date || data.startTime);
      const notifEvent = isReschedule ? "rescheduled" : statusToEvent[data.status as AppointmentStatus];

      if (notifEvent) {
        sendBookingNotification(notifEvent as any, {
          clientName:  appointment.client.name ?? "Customer",
          clientEmail: appointment.client.email,
          clientPhone: appointment.client.phone,
          serviceName: appointment.service.name,
          date:        format(appointment.date, "yyyy-MM-dd"),
          startTime:   appointment.startTime,
          bookingRef:  appointment.id.slice(-8).toUpperCase(),
        }, { cancelReason: data.cancelReason }).catch(console.error);
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_APPOINTMENT",
        entity: "Appointment",
        entityId: id,
        details: { fields: Object.keys(updateData) },
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error("[PATCH /api/appointments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
