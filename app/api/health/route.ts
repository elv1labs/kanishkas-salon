// app/api/health/route.ts
// Lightweight health-check endpoint — verifies database connectivity

import { checkDatabaseConnection } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic"; // never cache this route

export async function GET() {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
        return apiSuccess({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    }

    return apiError("Database disconnected", 503);
}
