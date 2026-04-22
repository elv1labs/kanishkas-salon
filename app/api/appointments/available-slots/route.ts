// app/api/appointments/available-slots/route.ts
// Returns available time slots for a given service, optional staff, and date.
// Considers: business hours, staff working hours, staff breaks,
// staff availability blocks, and existing appointments.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: "serviceId and date are required" },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const requestedDate = parseISO(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json({ availableSlots: [] });
    }

    // 1. Fetch service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      select: { duration: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 2. Fetch business settings for open/close times
    const settings = await prisma.businessSettings.findFirst({
      select: { openTime: true, closeTime: true },
    });
    const openTime = settings?.openTime ?? "10:00";
    const closeTime = settings?.closeTime ?? "21:00";

    // 3. Determine the effective time window
    let effectiveStart = openTime;
    let effectiveEnd = closeTime;
    let breakStart: string | null = null;
    let breakEnd: string | null = null;

    // 4. If staff is specified, narrow the window to their schedule
    if (staffId) {
      const staffProfile = await prisma.staffProfile.findUnique({
        where: { userId: staffId },
        select: {
          workStartTime: true,
          workEndTime: true,
          workingDays: true,
          breakStart: true,
          breakEnd: true,
          isAvailable: true,
        },
      });

      if (!staffProfile || !staffProfile.isAvailable) {
        return NextResponse.json({ availableSlots: [] });
      }

      // Check if staff works on this day of week
      const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const dayOfWeek = dayNames[requestedDate.getDay()];
      if (!staffProfile.workingDays.includes(dayOfWeek)) {
        return NextResponse.json({ availableSlots: [] });
      }

      // Use the later start and earlier end
      effectiveStart = laterTime(openTime, staffProfile.workStartTime);
      effectiveEnd = earlierTime(closeTime, staffProfile.workEndTime);
      breakStart = staffProfile.breakStart;
      breakEnd = staffProfile.breakEnd;

      // 5. Check staff availability blocks (exclusions) for this date
      const blocks = await prisma.staffAvailabilityBlock.findMany({
        where: {
          staffProfile: { userId: staffId },
          date: {
            gte: startOfDay(requestedDate),
            lte: endOfDay(requestedDate),
          },
        },
        select: { startTime: true, endTime: true },
      });

      // We'll subtract these from available slots below
      var staffBlocks = blocks; // eslint-disable-line no-var
    }

    // 6. Fetch existing booked appointments for this date (and optionally staff)
    const appointmentWhere: any = {
      date: startOfDay(requestedDate),
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
    };
    if (staffId) {
      appointmentWhere.staffId = staffId;
    }

    const bookedAppointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      select: { startTime: true, endTime: true },
    });

    // 7. Generate slot grid (30-min intervals)
    const allSlots = generateSlots(effectiveStart, effectiveEnd, 30);

    // 8. Filter out slots that conflict
    const isToday = requestedDate.toDateString() === new Date().toDateString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const availableSlots = allSlots.filter((slotStart) => {
      // Calculate slot end based on service duration
      const slotEnd = addMinutesToTime(slotStart, service.duration);

      // Slot must end before or at closing time
      if (timeToMinutes(slotEnd) > timeToMinutes(effectiveEnd)) return false;

      // If today, slot must be in the future (with 30 min buffer)
      if (isToday) {
        const bufferTime = addMinutesToTime(currentTimeStr, 30);
        if (timeToMinutes(slotStart) < timeToMinutes(bufferTime)) return false;
      }

      // Check break overlap
      if (breakStart && breakEnd) {
        if (timesOverlap(slotStart, slotEnd, breakStart, breakEnd)) return false;
      }

      // Check staff availability blocks
      if (typeof staffBlocks !== "undefined") {
        for (const block of staffBlocks) {
          if (timesOverlap(slotStart, slotEnd, block.startTime, block.endTime)) return false;
        }
      }

      // Check appointment conflicts
      for (const appt of bookedAppointments) {
        if (timesOverlap(slotStart, slotEnd, appt.startTime, appt.endTime)) return false;
      }

      return true;
    });

    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error("[GET /api/appointments/available-slots]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Utility functions ──────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

function generateSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  for (let m = startMin; m < endMin; m += intervalMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return start1 < end2 && start2 < end1;
}

function laterTime(a: string, b: string): string {
  return timeToMinutes(a) >= timeToMinutes(b) ? a : b;
}

function earlierTime(a: string, b: string): string {
  return timeToMinutes(a) <= timeToMinutes(b) ? a : b;
}
