export const dynamic = "force-dynamic";
// app/api/appointments/guest-book/route.ts
// Guest booking — allows clients to book without creating an account.
// Creates a minimal user behind the scenes (like the staff walk-in flow).
// Requires: name + phone. Email is optional.

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/notifications";
import { format } from "date-fns";

const GuestBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format: YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time format: HH:mm"),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 guest bookings per IP per hour
    const ip = getClientIp(req);
    const { success: rateLimitOk } = rateLimit(`guest-book:${ip}`, { max: 5, windowMs: 3_600_000 });
    if (!rateLimitOk) {
      return apiError("Too many booking attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const parsed = GuestBookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Validation failed";
      return apiError(firstError, 400, parsed.error.flatten());
    }

    const { name, phone, email, serviceId, staffId, date, startTime, notes } = parsed.data;
    const normalizedEmail = email?.toLowerCase().trim() || null;
    // User.email is required + unique in schema; generate a placeholder for guest users
    const userEmail = normalizedEmail || `guest-${phone}@kanishkas.local`;

    // Validate the service exists and is active
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
    });
    if (!service) {
      return apiError("Service not found or unavailable");
    }

    // Validate staff if specified
    if (staffId) {
      const staffExists = await prisma.user.findFirst({
        where: { id: staffId, isActive: true, staffProfile: { isNot: null } },
      });
      if (!staffExists) return apiError("Selected staff member is unavailable");
    }

    // Check slot availability
    const appointmentDate = new Date(date);
    const endTime = calculateEndTime(startTime, service.duration);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        date: appointmentDate,
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(staffId ? { staffId } : {}),
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflictingAppointment) {
      return apiError("This time slot is no longer available. Please choose another.");
    }

    // Find or create the guest user
    const user = await prisma.$transaction(async (tx) => {
      // Look for existing user by phone
      let existingUser = await tx.user.findFirst({
        where: { phone },
        select: { id: true, name: true },
      });

      if (existingUser) return existingUser;

      // Also check by email if provided
      if (normalizedEmail) {
        existingUser = await tx.user.findFirst({
          where: { email: userEmail },
          select: { id: true, name: true },
        });
        if (existingUser) return existingUser;
      }

      // Create a new guest user
      const newUser = await tx.user.create({
        data: {
          name,
          phone,
          email: userEmail,
          role: "CLIENT",
          isActive: true,
          // No password — guest accounts can set one later via "forgot password"
        },
        select: { id: true, name: true },
      });

      // Create client profile + loyalty account
      await tx.clientProfile.create({ data: { userId: newUser.id } });
      await tx.loyaltyAccount.create({ data: { userId: newUser.id } });

      return newUser;
    });

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId: user.id,
        serviceId,
        staffId: staffId || null,
        date: appointmentDate,
        startTime,
        endTime,
        status: "PENDING",
        notes: notes ? `[Guest] ${notes}` : "[Guest booking]",
        totalAmount: service.price,
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
        staff: { select: { name: true } },
      },
    });

    // Send notification (fire-and-forget)
    sendBookingNotification("created", {
      clientName: name,
      clientEmail: normalizedEmail,
      clientPhone: phone,
      serviceName: service.name,
      date,
      startTime,
      bookingRef: appointment.bookingRef,
      staffName: appointment.staff?.name,
    }).catch(console.error);

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "GUEST_BOOKING",
        entity: "Appointment",
        entityId: appointment.id,
        details: { method: "guest", phone, serviceName: service.name },
      },
    });

    return apiSuccess({
      appointment: {
        id: appointment.id,
        bookingRef: appointment.bookingRef,
        service: appointment.service.name,
        date: format(appointmentDate, "yyyy-MM-dd"),
        startTime,
        staff: appointment.staff?.name ?? "Any Available",
        price: Number(service.price),
      },
      isNewAccount: !user.name || user.name === name,
      message: "Booking confirmed! You can set a password anytime via the 'Forgot Password' link.",
    }, 201);
  } catch (error: any) {
    console.error("[POST /api/appointments/guest-book]", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}
