// app/api/settings/public/route.ts
// Public endpoint — returns non-sensitive business settings for client-side use.
// No authentication required.

import { apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.businessSettings.findFirst({
      select: {
        salonName: true,
        tagline: true,
        phone: true,
        email: true,
        address: true,
        googleMapsUrl: true,
        googleMapsEmbed: true,
        instagramUrl: true,
        facebookUrl: true,
        whatsappNumber: true,
        openTime: true,
        closeTime: true,
        upiId: true,
        upiQrImageUrl: true,
      },
    });

    return apiSuccess({ settings: settings ?? {} });
  } catch (error) {
    console.error("[GET /api/settings/public]", error);
    return apiSuccess({ settings: {} });
  }
}
