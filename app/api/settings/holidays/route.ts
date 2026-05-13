export const dynamic = "force-dynamic";
// app/api/settings/holidays/route.ts
// Holiday block CRUD — admin only
// GET: list all holiday blocks
// POST: create a holiday block

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, handlePrismaError, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const CreateHolidaySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  reason: z.string().max(200).optional().nullable(),
}).refine(
  (d) => new Date(d.endDate) >= new Date(d.startDate),
  { message: "endDate must be >= startDate", path: ["endDate"] }
);

// GET: List all holiday blocks (sorted by date)
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiError("Unauthorized", 401);
    const permError = await requirePermission(session, "manageSettings");
    if (permError) return permError;

    const holidays = await prisma.holidayBlock.findMany({
      orderBy: { startDate: "asc" },
    });

    return apiSuccess({ holidays });
  } catch (error) {
    return handlePrismaError(error, "GET /api/settings/holidays");
  }
}

// POST: Create a holiday block
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiError("Unauthorized", 401);
    const permError = await requirePermission(session, "manageSettings");
    if (permError) return permError;

    let body;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = CreateHolidaySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const holiday = await prisma.holidayBlock.create({
      data: {
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        reason: parsed.data.reason ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_HOLIDAY_BLOCK",
        entity: "HolidayBlock",
        entityId: holiday.id,
        details: { startDate: parsed.data.startDate, endDate: parsed.data.endDate, reason: parsed.data.reason },
      },
    });

    return apiSuccess({ holiday }, 201);
  } catch (error) {
    return handlePrismaError(error, "POST /api/settings/holidays");
  }
}
