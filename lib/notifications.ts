// lib/notifications.ts
// Unified notification facade — SMS (Twilio) + Email (Resend)
// Fire-and-forget: never throws, always resolves.
//
// Usage:
//   await sendBookingNotification("created",    appointment)
//   await sendBookingNotification("rescheduled", appointment)
//   await sendBookingNotification("cancelled",   appointment, { cancelReason: "..." })
//   await sendBookingNotification("completed",   appointment)

import { sendSMS, SMSTemplates } from "@/lib/twilio";
import { sendEmail, EmailTemplates } from "@/lib/resend";
import { format, parseISO } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationEvent =
  | "created"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "reminder";

export interface AppointmentNotificationContext {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  date: string;       // ISO date string, e.g. "2026-03-30"
  startTime: string;  // "HH:mm"
  bookingRef?: string;
  staffName?: string;
  cancelReason?: string;
}

export interface NotificationResult {
  smsSent:   boolean;
  emailSent: boolean;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "EEEE, d MMMM yyyy");
  } catch {
    return isoDate;
  }
}

// ── Rescheduled SMS template ──────────────────────────────────────────────────
// (Twilio lib has templates; adding rescheduled here in the facade)

function rescheduledSMS(clientName: string, service: string, date: string, time: string): string {
  const salonName  = process.env.NEXT_PUBLIC_SALON_NAME  ?? "Kanishka's Salon";
  const salonPhone = process.env.NEXT_PUBLIC_SALON_PHONE ?? "+919171230292";
  return (
    `Hi ${clientName}, your ${service} appointment has been rescheduled ` +
    `to ${date} at ${time}. ` +
    `${salonName} | ${salonPhone}`
  );
}

function rescheduledEmail(opts: {
  clientName: string;
  service:    string;
  date:       string;
  time:       string;
}) {
  return {
    subject: `📅 Appointment Rescheduled — ${opts.service}`,
    html: /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:4px;overflow:hidden;max-width:100%;">
              <tr>
                <td style="background:#2C1810;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#C9A84C;font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:1px;">
                    Kanishka's Family Salon &amp; Academy
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
                    Appointment Rescheduled
                  </h2>
                  <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
                  <p style="color:#5C4A32;line-height:1.6;">
                    Your <strong>${opts.service}</strong> appointment has been rescheduled to:
                  </p>
                  <table width="100%" cellpadding="12" style="background:#f9f5f0;border-radius:4px;margin:16px 0;">
                    <tr>
                      <td style="color:#8B7355;font-size:13px;width:140px;">New Date &amp; Time</td>
                      <td style="color:#2C1810;font-weight:600;">${opts.date} at ${opts.time}</td>
                    </tr>
                  </table>
                  <p style="color:#5C4A32;line-height:1.6;">
                    Please arrive 5–10 minutes early. If you need to cancel, call us at least 2 hours in advance.
                  </p>
                  <p style="margin-top:24px;">
                    <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard/client/appointments"
                       style="background:#C9A84C;color:#ffffff;padding:12px 24px;border-radius:2px;text-decoration:none;font-weight:600;font-size:14px;">
                      View My Appointments
                    </a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f5f0eb;padding:20px 32px;text-align:center;border-top:1px solid #e8ddd4;">
                  <p style="margin:0;font-size:11px;color:#8B7355;">
                    ${process.env.NEXT_PUBLIC_SALON_NAME ?? "Kanishka's Family Salon"} &middot;
                    ${process.env.NEXT_PUBLIC_SALON_PHONE ?? "+91 9171230292"}
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// ── Core notification sender ──────────────────────────────────────────────────

/**
 * Send booking event notifications via both SMS and email concurrently.
 * Fire-and-forget — never throws, always resolves.
 */
export async function sendBookingNotification(
  event: NotificationEvent,
  ctx: AppointmentNotificationContext,
  opts?: { cancelReason?: string }
): Promise<NotificationResult> {
  const { clientName, clientEmail, clientPhone, serviceName, date, startTime, bookingRef, staffName } = ctx;

  const displayDate = formatDate(date);

  let smsSent   = false;
  let emailSent = false;

  try {
    const tasks: Promise<boolean>[] = [];

    switch (event) {
      // ── Created ─────────────────────────────────────────────────────────────
      case "created": {
        if (clientPhone) {
          tasks.push(
            sendSMS({ to: clientPhone, body: (() => {
              const salonName  = process.env.NEXT_PUBLIC_SALON_NAME  ?? "Kanishka's Salon";
              const salonPhone = process.env.NEXT_PUBLIC_SALON_PHONE ?? "+919171230292";
              return `Hi ${clientName}, your ${serviceName} appointment is confirmed for ${displayDate} at ${startTime}. Ref: ${bookingRef ?? ""}. ${salonName} | ${salonPhone}`;
            })() }).catch(() => false)
          );
        }
        if (clientEmail && bookingRef) {
          const tmpl = EmailTemplates.appointmentConfirmed({
            clientName, service: serviceName, date: displayDate,
            time: startTime, bookingRef, staffName,
          });
          tasks.push(sendEmail({ to: clientEmail, ...tmpl }).catch(() => false));
        }
        break;
      }

      // ── Rescheduled ──────────────────────────────────────────────────────────
      case "rescheduled": {
        if (clientPhone) {
          tasks.push(
            sendSMS({ to: clientPhone, body: rescheduledSMS(clientName, serviceName, displayDate, startTime) })
              .catch(() => false)
          );
        }
        if (clientEmail) {
          const tmpl = rescheduledEmail({ clientName, service: serviceName, date: displayDate, time: startTime });
          tasks.push(sendEmail({ to: clientEmail, ...tmpl }).catch(() => false));
        }
        break;
      }

      // ── Cancelled ────────────────────────────────────────────────────────────
      case "cancelled": {
        if (clientPhone) {
          tasks.push(
            sendSMS({ to: clientPhone, body: SMSTemplates.appointmentCancelled(clientName, serviceName) })
              .catch(() => false)
          );
        }
        if (clientEmail) {
          const tmpl = EmailTemplates.appointmentCancelled({
            clientName, service: serviceName, date: displayDate,
            time: startTime, reason: opts?.cancelReason,
          });
          tasks.push(sendEmail({ to: clientEmail, ...tmpl }).catch(() => false));
        }
        break;
      }

      // ── Completed ────────────────────────────────────────────────────────────
      case "completed": {
        if (clientPhone) {
          tasks.push(
            sendSMS({ to: clientPhone, body: SMSTemplates.appointmentCompleted(clientName, serviceName) })
              .catch(() => false)
          );
        }
        // No completion email currently — can be added later
        break;
      }

      // ── Reminder ─────────────────────────────────────────────────────────────
      case "reminder": {
        if (clientPhone) {
          tasks.push(
            sendSMS({ to: clientPhone, body: SMSTemplates.appointmentReminder(clientName, serviceName, displayDate, startTime) })
              .catch(() => false)
          );
        }
        if (clientEmail) {
          const tmpl = EmailTemplates.appointmentReminder({
            clientName, service: serviceName, date: displayDate, time: startTime,
          });
          tasks.push(sendEmail({ to: clientEmail, ...tmpl }).catch(() => false));
        }
        break;
      }
    }

    const results = await Promise.allSettled(tasks);
    // First task is SMS (if added), second is email (if added)
    if (clientPhone && tasks.length > 0) {
      smsSent = results[0]?.status === "fulfilled" && results[0]?.value === true;
    }
    if (clientEmail && tasks.length > (clientPhone ? 1 : 0)) {
      const emailIdx = clientPhone ? 1 : 0;
      emailSent = results[emailIdx]?.status === "fulfilled" && results[emailIdx]?.value === true;
    }
  } catch (err) {
    console.error(`[sendBookingNotification] Uncaught error (event=${event}):`, err);
  }

  return { smsSent, emailSent };
}
