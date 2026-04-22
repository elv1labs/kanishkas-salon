// app/api/auth/forgot-password/route.ts
// Initiates the password reset flow — generates a token and sends a reset email.
// Always returns 200 to avoid revealing whether an email exists in the system.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail, EmailTemplates } from "@/lib/resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 reset requests per minute per IP
    const ip = getClientIp(req);
    const { success } = rateLimit(`forgot-pw:${ip}`, { max: 3, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json(
        { error: "Too many reset requests. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Look up the user — but always return 200 regardless
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (user && user.isActive) {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Create the verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // Send the reset email (fire-and-forget)
      const resetUrl = `${process.env.NEXTAUTH_URL ?? "https://kanishkassalon.com"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const tmpl = EmailTemplates.passwordReset({
        clientName: user.name ?? "Customer",
        resetUrl,
      });
      sendEmail({ to: email, ...tmpl }).catch(console.error);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
