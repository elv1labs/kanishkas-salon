// app/api/reviews/google-prompt/route.ts
// Google Review prompt — sends a personalized review request to clients
// after a completed appointment.
//
// POST /api/reviews/google-prompt — trigger review prompt for a client
//   { clientId, appointmentId, channel: "whatsapp" | "sms" | "email" }
//
// GET /api/reviews/google-prompt/config — get current review link config

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Google Places review URL format
// Replace with actual Place ID from Google Business Profile
const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL
  || "https://g.page/r/kanishkas-family-salon/review";

const SALON_NAME = "Kanishka's Family Salon & Academy";

const PromptSchema = z.object({
  clientId: z.string().min(1),
  appointmentId: z.string().min(1).optional(),
  channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
});

// ── POST — send Google review prompt ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const permError = await requirePermission(session, "manageAppointments");
  if (permError) return permError;

  try {
    const body = await req.json();
    const parsed = PromptSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { clientId, appointmentId, channel } = parsed.data;

    // Get client details
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, phone: true, email: true },
    });
    if (!client) return apiError("Client not found", 404);

    // Get appointment details if provided
    let serviceName = "your visit";
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: { select: { name: true } } },
      });
      if (appointment) {
        serviceName = appointment.service.name;
      }
    }

    const firstName = client.name.split(" ")[0];
    const reviewMessage = `Hi ${firstName}! 🌟\n\nThank you for choosing ${SALON_NAME}. We hope you loved your ${serviceName}!\n\nWould you take a moment to share your experience? Your feedback helps us grow.\n\n⭐ Leave a Google Review: ${GOOGLE_REVIEW_URL}\n\nThank you so much! 💛\n— Team Kanishka's`;

    const result: Record<string, boolean> = {};

    // Send via requested channel
    if (channel === "whatsapp" && client.phone) {
      try {
        const { sendTextMessage } = await import("@/lib/whatsapp");
        await sendTextMessage(client.phone, reviewMessage);
        result.whatsapp = true;
      } catch (err) {
        console.error("[Google Review] WhatsApp send failed:", err);
        result.whatsapp = false;
      }
    }

    if (channel === "sms" && client.phone) {
      try {
        const twilio = await import("twilio");
        const twilioClient = twilio.default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await twilioClient.messages.create({
          body: `Hi ${firstName}! Thank you for visiting ${SALON_NAME}. Please leave a Google review: ${GOOGLE_REVIEW_URL}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: client.phone,
        });
        result.sms = true;
      } catch (err) {
        console.error("[Google Review] SMS send failed:", err);
        result.sms = false;
      }
    }

    if (channel === "email" && client.email && !client.email.endsWith("@kanishkas.local")) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Kanishka's Salon <hello@kanishkas.in>",
          to: client.email,
          subject: `How was your ${serviceName}? ⭐`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #C9A84C; margin: 0 0 16px;">Hi ${firstName}! 🌟</h2>
              <p>Thank you for choosing <strong>${SALON_NAME}</strong>. We hope you loved your <em>${serviceName}</em>!</p>
              <p>Would you take a moment to share your experience? Your feedback means the world to us.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${GOOGLE_REVIEW_URL}" 
                   style="display: inline-block; padding: 14px 28px; background: #C9A84C; color: #fff; text-decoration: none; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; font-size: 13px;">
                  ⭐ Leave a Google Review
                </a>
              </div>
              <p style="color: #888; font-size: 13px;">Thank you so much! 💛<br>— Team Kanishka's</p>
            </div>
          `,
        });
        result.email = true;
      } catch (err) {
        console.error("[Google Review] Email send failed:", err);
        result.email = false;
      }
    }

    // Log the prompt as a notification
    try {
      await prisma.notification.create({
        data: {
          userId: clientId,
          type: "PROMOTIONAL",
          title: "Review Request Sent",
          message: `Google review prompt sent via ${channel}`,
          isRead: false,
        },
      });
    } catch {
      // Non-critical — don't fail the request
    }

    return apiSuccess({
      sent: result,
      reviewUrl: GOOGLE_REVIEW_URL,
    });
  } catch (error) {
    console.error("[POST /api/reviews/google-prompt]", error);
    return apiError("Failed to send review prompt", 500);
  }
}

// ── GET — review config ────────────────────────────────────────────────────────

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  return apiSuccess({
    reviewUrl: GOOGLE_REVIEW_URL,
    salonName: SALON_NAME,
    channels: {
      whatsapp: !!process.env.WHATSAPP_ENABLED && process.env.WHATSAPP_ENABLED === "true",
      sms: !!process.env.TWILIO_ACCOUNT_SID,
      email: !!process.env.RESEND_API_KEY,
    },
  });
}
