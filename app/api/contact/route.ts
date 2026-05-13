export const dynamic = "force-dynamic";
// app/api/contact/route.ts
// Contact form submission API — saves to DB + admin listing

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { ContactStatus } from "@prisma/client";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    apiRateLimited,
    parseJsonBody,
    validatePagination,
    buildPaginationMeta,
    handlePrismaError,
    requireActiveSession,
    requirePermission,
} from "@/lib/api-utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// ---- Validation schemas ----
const ContactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
    phone: z.string().min(10, "Please enter a valid phone number").max(15, "Phone number is too long"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

const UpdateContactSchema = z.object({
    id: z.string().cuid("Invalid submission ID"),
    status: z.nativeEnum(ContactStatus, { errorMap: () => ({ message: "Invalid status value" }) }),
    response: z.string().max(2000, "Response is too long").optional(),
});

// ---- POST: Submit contact form ----
export async function POST(req: NextRequest) {
    // Rate limit: 5 contact submissions per minute per IP
    const ip = getClientIp(req);
    const { success: rlOk } = rateLimit(`contact:${ip}`, { max: 5, windowMs: 60_000 });
    if (!rlOk) {
        return apiRateLimited("Too many submissions. Please wait a minute.");
    }

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0] || "Invalid input";
        return apiError(firstError, 400, parsed.error.flatten());
    }

    try {
        const { name, phone, email, message } = parsed.data;

        // Extract IP address
        const forwarded = req.headers.get("x-forwarded-for");
        const ipAddress = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

        const submission = await prisma.contactSubmission.create({
            data: {
                name,
                phone,
                email: email || null,
                message,
                ipAddress,
            },
        });

        return apiSuccess({
            success: true,
            message: "Thank you for your message! We'll get back to you shortly.",
            id: submission.id,
        }, 201);
    } catch (error) {
        return handlePrismaError(error, "POST /api/contact");
    }
}

// ---- GET: List contact submissions (admin/owner/receptionist) ----
export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session) return apiError("Authentication required", 401);

        const permError = await requirePermission(session, "viewClients");
        if (permError) return permError;

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams);
        const status = searchParams.get("status") as ContactStatus | null;

        const where: any = {};
        if (status) {
            // Validate status value
            if (!Object.values(ContactStatus).includes(status)) {
                return apiError(`Invalid status filter. Valid values: ${Object.values(ContactStatus).join(", ")}`, 400);
            }
            where.status = status;
        }

        const [submissions, total] = await Promise.all([
            prisma.contactSubmission.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.contactSubmission.count({ where }),
        ]);

        return apiSuccess({
            submissions,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/contact");
    }
}

// ---- PATCH: Update submission status (admin/owner/receptionist) ----
export async function PATCH(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        if (!session) return apiError("Authentication required", 401);

        const permError = await requirePermission(session, "viewClients");
        if (permError) return permError;

        const parsed = UpdateContactSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { id, status, response } = parsed.data;

        const updateData: any = { status };
        if (status === ContactStatus.RESPONDED) {
            updateData.respondedAt = new Date();
            updateData.respondedBy = session!.user.id;
            if (response) updateData.response = response;
        }
        if (status === ContactStatus.READ) {
            updateData.isRead = true;
        }

        const submission = await prisma.contactSubmission.update({
            where: { id },
            data: updateData,
        });

        return apiSuccess(submission);
    } catch (error) {
        return handlePrismaError(error, "PATCH /api/contact");
    }
}
