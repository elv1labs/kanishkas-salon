// lib/resend.ts
// Email notifications via Resend.
// Graceful degradation: if RESEND_API_KEY is not set, logs to console and returns false.

let resendClient: any = null;

function getResend() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const { Resend } = require("resend");
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch {
    return null;
  }
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "noreply@kanishkassalon.com";
const SALON_NAME =
  process.env.NEXT_PUBLIC_SALON_NAME ?? "Kanishka's Family Salon & Academy";
const SALON_PHONE =
  process.env.NEXT_PUBLIC_SALON_PHONE ?? "+91 9171230292";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://kanishkassalon.com";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(
      `[Email] RESEND_API_KEY not set — skipping email to ${
        Array.isArray(opts.to) ? opts.to.join(", ") : opts.to
      } | Subject: "${opts.subject}"`
    );
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: opts.from ?? FROM_ADDRESS,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      console.error("[Resend] Send error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Resend] Unexpected error:", err);
    return false;
  }
}

// ── Shared layout wrapper ────────────────────────────────────────────────────

function layout(contentHtml: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:4px;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#2C1810;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#C9A84C;font-family:Georgia,serif;font-size:22px;font-weight:400;letter-spacing:1px;">
              ${SALON_NAME}
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${contentHtml}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5f0eb;padding:20px 32px;text-align:center;border-top:1px solid #e8ddd4;">
            <p style="margin:0;font-size:11px;color:#8B7355;">
              ${SALON_NAME} &middot; ${SALON_PHONE}
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#aaa;">
              You received this email because you booked with us.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="color:#8B7355;font-size:13px;width:140px;padding:10px 12px;">${label}</td>
    <td style="color:#2C1810;font-weight:600;padding:10px 12px;">${value}</td>
  </tr>`;
}

function primaryButton(label: string, href: string): string {
  return `<p style="margin-top:24px;">
    <a href="${href}"
       style="background:#C9A84C;color:#ffffff;padding:12px 24px;border-radius:2px;
              text-decoration:none;font-weight:600;font-size:14px;">
      ${label}
    </a>
  </p>`;
}

// ── Email Templates ──────────────────────────────────────────────────────────

export const EmailTemplates = {
  appointmentConfirmed: (opts: {
    clientName: string;
    service: string;
    date: string;
    time: string;
    bookingRef: string;
    staffName?: string;
  }) => ({
    subject: `✅ Appointment Confirmed — ${opts.service}`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Appointment Confirmed
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
      <p style="color:#5C4A32;line-height:1.6;">
        Your <strong>${opts.service}</strong> appointment has been confirmed. We look forward to seeing you!
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f5f0;border-radius:4px;margin:16px 0;">
        ${detailRow("Service", opts.service)}
        ${detailRow("Date", opts.date)}
        ${detailRow("Time", opts.time)}
        ${opts.staffName ? detailRow("Stylist", opts.staffName) : ""}
        ${detailRow("Booking Ref", `#${opts.bookingRef}`)}
      </table>
      <p style="color:#5C4A32;line-height:1.6;font-size:13px;">
        Please arrive 5–10 minutes early. To cancel, call us at least 2 hours in advance.
      </p>
      ${primaryButton("View My Appointments", `${BASE_URL}/dashboard/client/appointments`)}
    `),
  }),

  appointmentCancelled: (opts: {
    clientName: string;
    service: string;
    date: string;
    time: string;
    reason?: string;
  }) => ({
    subject: `❌ Appointment Cancelled — ${opts.service}`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Appointment Cancelled
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
      <p style="color:#5C4A32;line-height:1.6;">
        Your <strong>${opts.service}</strong> appointment on <strong>${opts.date}</strong> at
        <strong>${opts.time}</strong> has been cancelled.
      </p>
      ${opts.reason ? `<p style="color:#5C4A32;line-height:1.6;">Reason: ${opts.reason}</p>` : ""}
      <p style="color:#5C4A32;line-height:1.6;">
        To rebook, please visit our website or call us.
      </p>
      ${primaryButton("Book Again", `${BASE_URL}/book`)}
    `),
  }),

  appointmentReminder: (opts: {
    clientName: string;
    service: string;
    date: string;
    time: string;
  }) => ({
    subject: `⏰ Reminder: ${opts.service} Tomorrow`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Appointment Reminder
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
      <p style="color:#5C4A32;line-height:1.6;">
        Just a reminder that your <strong>${opts.service}</strong> appointment is coming up:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f5f0;border-radius:4px;margin:16px 0;">
        ${detailRow("Date", opts.date)}
        ${detailRow("Time", opts.time)}
      </table>
      <p style="color:#5C4A32;line-height:1.6;font-size:13px;">
        Please arrive 5–10 minutes early. We look forward to seeing you! 💇
      </p>
      ${primaryButton("View My Appointments", `${BASE_URL}/dashboard/client/appointments`)}
    `),
  }),

  orderConfirmed: (opts: {
    clientName: string;
    orderRef: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  }) => ({
    subject: `🛍️ Order Confirmed — #${opts.orderRef}`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Order Confirmed
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
      <p style="color:#5C4A32;line-height:1.6;">
        Thank you for your order! Here's a summary:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#f9f5f0;border-radius:4px;margin:16px 0;">
        ${opts.items
          .map((item) =>
            detailRow(
              item.name,
              `${item.quantity} × ₹${item.price.toLocaleString("en-IN")}`
            )
          )
          .join("")}
        <tr>
          <td colspan="2" style="border-top:1px solid #e8ddd4;padding:10px 12px;">
            <strong style="color:#2C1810;">
              Total: ₹${opts.total.toLocaleString("en-IN")}
            </strong>
          </td>
        </tr>
      </table>
      <p style="color:#5C4A32;line-height:1.6;font-size:13px;">
        Payment will be collected at delivery. We'll notify you once your order is shipped.
      </p>
      ${primaryButton("Track My Order", `${BASE_URL}/dashboard/client/orders`)}
    `),
  }),

  welcomeEmail: (opts: { clientName: string }) => ({
    subject: `Welcome to ${SALON_NAME}! 💖`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Welcome, ${opts.clientName}!
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">
        We're so happy to have you as part of the ${SALON_NAME} family.
        Explore our services, book appointments, and enjoy exclusive loyalty rewards.
      </p>
      ${primaryButton("Explore Services", `${BASE_URL}/services`)}
    `),
  }),

  passwordReset: (opts: { clientName: string; resetUrl: string }) => ({
    subject: `🔑 Password Reset — ${SALON_NAME}`,
    html: layout(`
      <h2 style="color:#2C1810;font-family:Georgia,serif;font-size:20px;margin-top:0;">
        Password Reset Request
      </h2>
      <p style="color:#5C4A32;line-height:1.6;">Hi <strong>${opts.clientName}</strong>,</p>
      <p style="color:#5C4A32;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one:
      </p>
      ${primaryButton("Reset My Password", opts.resetUrl)}
      <p style="color:#5C4A32;line-height:1.6;font-size:13px;margin-top:24px;">
        ⏰ This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color:#aaa;font-size:11px;margin-top:16px;">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${opts.resetUrl}" style="color:#C9A84C;word-break:break-all;">${opts.resetUrl}</a>
      </p>
    `),
  }),
} as const;
