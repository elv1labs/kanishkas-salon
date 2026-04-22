// lib/whatsapp.ts
// WhatsApp Business API (Cloud API) integration
// Uses Meta's official Cloud API — requires:
//   1. Meta Business Account
//   2. WhatsApp Business phone number verified
//   3. Message templates approved in Meta Business Manager
//
// Environment variables:
//   WHATSAPP_API_TOKEN      — Permanent access token from Meta
//   WHATSAPP_PHONE_ID       — Phone number ID (not the phone number itself)
//   WHATSAPP_ENABLED        — "true" to enable (default: false for safety)
//
// Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api

const API_BASE = "https://graph.facebook.com/v21.0";

function getConfig() {
  return {
    token: process.env.WHATSAPP_API_TOKEN ?? "",
    phoneId: process.env.WHATSAPP_PHONE_ID ?? "",
    enabled: process.env.WHATSAPP_ENABLED === "true",
  };
}

/**
 * Format phone for WhatsApp API: must be E.164 without "+"
 * Indian numbers: "9876543210" → "919876543210"
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  // Already has country code
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  // Add India country code
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

// ── Core API call ──────────────────────────────────────────────────────────────

interface WhatsAppMessagePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "template" | "text";
  template?: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: "body" | "header";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
  text?: { body: string };
}

async function sendWhatsAppMessage(payload: WhatsAppMessagePayload): Promise<boolean> {
  const { token, phoneId, enabled } = getConfig();

  if (!enabled || !token || !phoneId) {
    console.log("[WhatsApp] Disabled or not configured — skipping message");
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error("[WhatsApp] API error:", res.status, error);
      return false;
    }

    const data = await res.json();
    console.log("[WhatsApp] Message sent:", data?.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
    return false;
  }
}

// ── Template Messages ──────────────────────────────────────────────────────────
// These must match approved templates in Meta Business Manager.
// Template names below are suggestions — adjust to match your actual approved templates.

/**
 * Send booking confirmation via WhatsApp template.
 * Template name: "appointment_confirmed" (must be approved in Meta Business Manager)
 * Body variables: {{1}} = client name, {{2}} = service, {{3}} = date, {{4}} = time, {{5}} = booking ref
 */
export async function sendBookingConfirmation(opts: {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  bookingRef: string;
}): Promise<boolean> {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: formatPhone(opts.to),
    type: "template",
    template: {
      name: "appointment_confirmed",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.clientName },
            { type: "text", text: opts.serviceName },
            { type: "text", text: opts.date },
            { type: "text", text: opts.time },
            { type: "text", text: opts.bookingRef },
          ],
        },
      ],
    },
  });
}

/**
 * Send appointment reminder via WhatsApp template.
 * Template name: "appointment_reminder"
 * Body variables: {{1}} = client name, {{2}} = service, {{3}} = date, {{4}} = time
 */
export async function sendAppointmentReminder(opts: {
  to: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
}): Promise<boolean> {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: formatPhone(opts.to),
    type: "template",
    template: {
      name: "appointment_reminder",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.clientName },
            { type: "text", text: opts.serviceName },
            { type: "text", text: opts.date },
            { type: "text", text: opts.time },
          ],
        },
      ],
    },
  });
}

/**
 * Send cancellation notification via WhatsApp template.
 * Template name: "appointment_cancelled"
 * Body variables: {{1}} = client name, {{2}} = service, {{3}} = reason
 */
export async function sendCancellationNotice(opts: {
  to: string;
  clientName: string;
  serviceName: string;
  reason?: string;
}): Promise<boolean> {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: formatPhone(opts.to),
    type: "template",
    template: {
      name: "appointment_cancelled",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.clientName },
            { type: "text", text: opts.serviceName },
            { type: "text", text: opts.reason ?? "No reason provided" },
          ],
        },
      ],
    },
  });
}

/**
 * Send a freeform text message (only works within 24h session window).
 * Use sparingly — template messages are preferred for reliability.
 */
export async function sendTextMessage(to: string, body: string): Promise<boolean> {
  return sendWhatsAppMessage({
    messaging_product: "whatsapp",
    to: formatPhone(to),
    type: "text",
    text: { body },
  });
}
