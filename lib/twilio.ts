// lib/twilio.ts
// SMS notifications via Twilio.
// Graceful degradation: if TWILIO_* env vars are not set, logs to console and returns false.

let twilioClient: any = null;

async function getTwilio() {
  if (twilioClient) return twilioClient;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const mod = await import("twilio");
    twilioClient = mod.default(sid, token);
    return twilioClient;
  } catch {
    console.warn("[Twilio] Package not installed — SMS sending disabled");
    return null;
  }
}

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER ?? "";

export async function sendSMS(opts: {
  /** E.164 format: +919876543210 */
  to: string;
  body: string;
}): Promise<boolean> {
  const client = await getTwilio();
  if (!client || !FROM_NUMBER) {
    console.log(
      `[SMS] Twilio not configured — skipping SMS to ${opts.to} | Body: "${opts.body.slice(0, 60)}…"`
    );
    return false;
  }
  try {
    const message = await client.messages.create({
      body: opts.body,
      from: FROM_NUMBER,
      to: opts.to,
    });
    console.log(`[SMS] Sent to ${opts.to} — SID: ${message.sid}`);
    return true;
  } catch (err: any) {
    console.error(`[Twilio] Failed to send SMS to ${opts.to}:`, err?.message ?? err);
    return false;
  }
}

export const SMSTemplates = {
  appointmentConfirmed: (
    clientName: string,
    service: string,
    date: string,
    time: string
  ) =>
    `Hi ${clientName}, your ${service} appointment at Kanishka's Family Salon is confirmed for ${date} at ${time}. See you soon! 💇`,

  appointmentReminder: (
    clientName: string,
    service: string,
    date: string,
    time: string
  ) =>
    `Hi ${clientName}, reminder: your ${service} appointment is tomorrow (${date}) at ${time}. Reply STOP to unsubscribe.`,

  appointmentCancelled: (clientName: string, service: string) =>
    `Hi ${clientName}, your ${service} appointment at Kanishka's Family Salon has been cancelled. Please call us to reschedule.`,

  appointmentCompleted: (clientName: string, service: string) =>
    `Thank you for visiting Kanishka's Family Salon, ${clientName}! We hope you loved your ${service}. Book again at kanishkassalon.com 💖`,

  orderConfirmed: (clientName: string, orderRef: string, total: string) =>
    `Hi ${clientName}, your order #${orderRef} (₹${total}) has been confirmed at Kanishka's Family Salon. We'll update you once shipped!`,

  loyaltyTierUpgrade: (clientName: string, tier: string) =>
    `🎉 Congratulations ${clientName}! You've reached ${tier} status at Kanishka's Family Salon. Enjoy exclusive rewards!`,
} as const;
