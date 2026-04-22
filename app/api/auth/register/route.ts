// app/api/auth/register/route.ts
// User registration endpoint — creates User + ClientProfile + LoyaltyAccount

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
        .optional(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
});

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 3 registrations per minute per IP
        const ip = getClientIp(req);
        const { success } = rateLimit(`register:${ip}`, { max: 3, windowMs: 60_000 });
        if (!success) {
            return NextResponse.json(
                { error: "Too many registration attempts. Please wait a minute." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parsed = RegisterSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { name, email, phone, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    ...(phone ? [{ phone }] : []),
                ],
            },
        });

        if (existing) {
            const field = existing.email === normalizedEmail ? "email" : "phone number";
            return NextResponse.json(
                { error: `An account with this ${field} already exists.` },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user + client profile + loyalty account in a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    phone: phone ?? null,
                    passwordHash,
                    role: "CLIENT",
                    isActive: true,
                },
            });

            await tx.clientProfile.create({
                data: { userId: newUser.id },
            });

            await tx.loyaltyAccount.create({
                data: { userId: newUser.id },
            });

            await tx.activityLog.create({
                data: {
                    userId: newUser.id,
                    action: "USER_REGISTER",
                    entity: "User",
                    entityId: newUser.id,
                    details: { method: "credentials" },
                },
            });

            return newUser;
        });

        return NextResponse.json(
            {
                message: "Account created successfully",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[POST /api/auth/register]", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
