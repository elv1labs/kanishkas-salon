export const dynamic = "force-dynamic";
// app/api/settings/holidays/[id]/route.ts
// DELETE a single holiday block — admin only

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, apiNotFound, handlePrismaError, requirePermission } from "@/lib/api-utils";

// DELETE: Remove a holiday block
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiError("Unauthorized", 401);
    const permError = await requirePermission(session, "manageSettings");
    if (permError) return permError;

    const existing = await prisma.holidayBlock.findUnique({
      where: { id: params.id },
    });
    if (!existing) return apiNotFound("Holiday block not found");

    await prisma.holidayBlock.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_HOLIDAY_BLOCK",
        entity: "HolidayBlock",
        entityId: params.id,
        details: {
          startDate: existing.startDate.toISOString(),
          endDate: existing.endDate.toISOString(),
          reason: existing.reason,
        },
      },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/settings/holidays/[id]");
  }
}
