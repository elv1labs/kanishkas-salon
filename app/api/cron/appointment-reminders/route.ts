// app/api/cron/appointment-reminders/route.ts
// Sends reminder notifications (email + SMS) for tomorrow's appointments.
// Designed to be called once daily via cron (e.g. 8 PM every day).
//
// Security: Protected by CRON_SECRET env var.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { sendEmail, EmailTemplates } from "@/lib/resend";
import { sendSMS, SMSTemplates } from "@/lib/twilio";
import { startOfDay, addDays, endOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return apiUnauthorized();
  }

  try {
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Fetch tomorrow's confirmed appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: tomorrowStart, lte: tomorrowEnd },
        status: "CONFIRMED",
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { name: true, duration: true, price: true } },
        staff: { select: { name: true } },
      },
    });

    if (appointments.length === 0) {
      return apiSuccess({ message: "No appointments tomorrow", sent: 0 });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const appt of appointments) {
      if (!appt.client) continue;

      const dateStr = format(appt.date, "EEEE, d MMMM yyyy");
      const serviceName = appt.service.name;
      const staffName = appt.staff?.name ?? "our team";

      // Check if reminder already sent (idempotency)
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId: appt.client.id,
          type: "APPOINTMENT_REMINDER",
          actionUrl: `/dashboard/client/appointments`,
          createdAt: { gte: startOfDay(new Date()) },
          title: { contains: appt.bookingRef },
        },
      });

      if (alreadySent) continue;

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: appt.client.id,
          type: "APPOINTMENT_REMINDER",
          title: `📅 Reminder: ${serviceName} tomorrow`,
          message: `Your appointment for ${serviceName} with ${staffName} is scheduled for ${dateStr} at ${appt.startTime}. Booking ref: ${appt.bookingRef}`,
          actionUrl: "/dashboard/client/appointments",
        },
      });

      // Send email reminder (fire-and-forget)
      if (appt.client.email) {
        try {
          const tmpl = EmailTemplates.appointmentReminder({
            clientName: appt.client.name ?? "Customer",
            service: serviceName,
            date: dateStr,
            time: appt.startTime,
          });
          await sendEmail({
            to: appt.client.email,
            subject: `📅 Reminder: ${serviceName} tomorrow at ${appt.startTime}`,
            html: tmpl.html,
          });
        } catch (e) {
          errors.push(`Email failed for ${appt.client.email}: ${e}`);
        }
      }

      // Send SMS reminder (fire-and-forget)
      if (appt.client.phone) {
        try {
          const smsBody = SMSTemplates.appointmentReminder(
            appt.client.name ?? "Customer",
            serviceName,
            dateStr,
            appt.startTime,
          );
          await sendSMS({ to: `+91${appt.client.phone}`, body: smsBody });
        } catch (e) {
          errors.push(`SMS failed for ${appt.client.phone}: ${e}`);
        }
      }

      sent++;
    }

    return apiSuccess({
      message: `Sent ${sent} reminder(s) for ${appointments.length} appointment(s) tomorrow`,
      sent,
      total: appointments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[CRON] appointment-reminders error:", error);
    return apiError("Internal server error", 500);
  }
}
