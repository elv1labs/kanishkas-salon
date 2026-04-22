import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return apiError("Please enter a valid email address.", 400);
        }

        // Upsert — silently succeed if already subscribed
        await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: { updatedAt: new Date() },
            create: { email },
        });

        return apiSuccess({ subscribed: true });
    } catch (err: any) {
        // If the table doesn't exist yet, fall back gracefully
        if (err?.code === "P2021") {
            return apiSuccess({ subscribed: true }); // silent — run migration to create table
        }
        console.error("[newsletter]", err);
        return apiError("Something went wrong. Please try again.", 500);
    }
}
