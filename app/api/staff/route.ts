export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handlePrismaError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
    try {
        const staff = await prisma.user.findMany({
            where: { staffProfile: { isNot: null }, isActive: true },
            select: {
                id: true,
                name: true,
                image: true,
                staffProfile: {
                    select: {
                        designation: true,
                        specializations: true,
                        isAvailable: true,
                        bio: true,
                    },
                },
            },
        });
        return apiSuccess({ staff });
    } catch (error) {
        return handlePrismaError(error, "GET /api/staff");
    }
}
