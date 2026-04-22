// app/api/auth/reset-password/route.ts
// Validates the reset token and updates the user's password.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-utils";
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
      return apiError(firstError);
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
      return apiError("Invalid or expired reset link. Please request a new one.");
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail, token },
      });
      return apiError("This reset link has expired. Please request a new one.");
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return apiNotFound("Account not found.");
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

    return apiSuccess({
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
