// app/api/auth/reset-password/route.ts
// Validates the reset token and updates the user's password.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail, token },
      });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    // Hash the new password and update
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      }),
      // Delete the used token
      prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }),
      // Log the activity
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET",
          entity: "User",
          entityId: user.id,
          details: { method: "email_token" },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
