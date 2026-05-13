// app/api/health/route.ts
// Lightweight health-check endpoint — verifies database connectivity
// Used by: Docker healthcheck, load balancer, uptime monitors

import { checkDatabaseConnection } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
        return apiError("Database disconnected", 503);
    }

    let dbStats: Record<string, number> | null = null;
    try {
        const [userCount, appointmentCount, orderCount] = await Promise.all([
            prisma.user.count().catch(() => 0),
            prisma.appointment.count().catch(() => 0),
            prisma.order.count().catch(() => 0),
        ]);
        dbStats = { users: userCount, appointments: appointmentCount, orders: orderCount };
    } catch {
        dbStats = null;
    }

    return apiSuccess({
        status: "ok",
        version: process.env.npm_package_version ?? "1.0.0",
        environment: process.env.NODE_ENV ?? "development",
        database: "connected",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        ...(dbStats && { counts: dbStats }),
        timestamp: new Date().toISOString(),
    });
}
