export const dynamic = "force-dynamic";
// app/api/academy/enrollments/[id]/mark-paid/route.ts
// PATCH — admin marks enrollment payment as received
// Same validation shape as POST /api/appointments/mark-paid

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const PaymentMethodEnum = z.enum(["UPI", "CASH", "CARD"]);

const MarkPaidSchema = z.object({
    paymentMethod: PaymentMethodEnum,
    paymentAmount: z
        .number({ invalid_type_error: "paymentAmount must be a number" })
        .positive("paymentAmount must be positive"),
    transactionRef: z.string().max(200).optional(),
    paymentNote: z.string().max(500).optional(),
});

const STAFF_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!STAFF_ROLES.includes(session.user.role as UserRole)) {
            return NextResponse.json({ error: "Forbidden — only staff can mark payments" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = MarkPaidSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { paymentMethod, paymentAmount, transactionRef, paymentNote } = parsed.data;

        const enrollment = await prisma.courseEnrollment.findUnique({
            where: { id: params.id },
            include: { course: { select: { name: true } } },
        });

        if (!enrollment) {
            return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
        }
        if (enrollment.paymentStatus === "PAID") {
            return NextResponse.json({ error: "Payment has already been recorded" }, { status: 409 });
        }

        const updated = await prisma.courseEnrollment.update({
            where: { id: params.id },
            data: {
                paymentStatus: "PAID",
                paymentMethod,
                paymentAmount,
                paymentNote: paymentNote ?? transactionRef ?? null,
                paidAt: new Date(),
            },
        });

        // Notify client
        if (enrollment.userId) {
            await prisma.notification.create({
                data: {
                    userId: enrollment.userId,
                    type: "SYSTEM",
                    title: "Payment Received",
                    message: `Payment of ₹${paymentAmount.toLocaleString("en-IN")} for your "${enrollment.course.name}" enrollment has been recorded (${paymentMethod}).`,
                    actionUrl: "/dashboard/client/academy",
                    metadata: { enrollmentId: enrollment.id },
                },
            });
        }

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: "MARK_PAYMENT_PAID",
                entity: "CourseEnrollment",
                entityId: enrollment.id,
                details: { paymentMethod, paymentAmount, transactionRef, courseName: enrollment.course.name },
            },
        });

        return NextResponse.json(
            {
                success: true,
                enrollment: {
                    id: updated.id,
                    paymentStatus: updated.paymentStatus,
                    paymentMethod: updated.paymentMethod,
                    paymentAmount: updated.paymentAmount,
                    paidAt: updated.paidAt,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[PATCH /api/academy/enrollments/[id]/mark-paid]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
