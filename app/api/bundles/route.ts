// app/api/bundles/route.ts
// Service Bundle / Package deals
//
// GET  /api/bundles                — list active bundles (public) or all (admin)
// POST /api/bundles                — create bundle (admin)
// PATCH /api/bundles?id=xyz        — update bundle (admin)
// DELETE /api/bundles?id=xyz       — deactivate bundle (admin)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, validatePagination, buildPaginationMeta, requirePermission, checkPermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────────────────────────────

const BundleItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

const CreateBundleSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  imageUrl: z.string().optional(),
  bundlePrice: z.number().positive(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
  items: z.array(BundleItemSchema).min(2, "A bundle must have at least 2 services"),
});

const UpdateBundleSchema = CreateBundleSchema.partial();

// ── GET — list bundles ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  const role = session?.user?.role as UserRole | undefined;
  const isAdmin = role && await checkPermission(session, "manageServices");

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = validatePagination(searchParams, { limit: 20 });

  // Public: only active bundles within validity period
  // Admin: all bundles
  const where: any = {};
  if (!isAdmin) {
    where.isActive = true;
    where.OR = [
      { validUntil: null },
      { validUntil: { gte: new Date() } },
    ];
    where.AND = [
      {
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } },
        ],
      },
    ];
  }

  try {
    const [bundles, total] = await Promise.all([
      prisma.serviceBundle.findMany({
        where,
        include: {
          items: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  duration: true,
                  category: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.serviceBundle.count({ where }),
    ]);

    // Enrich with calculated fields
    const enriched = bundles.map((b) => {
      const originalPrice = b.items.reduce(
        (sum, item) => sum + Number(item.service.price) * item.quantity,
        0
      );
      const savings = originalPrice - Number(b.bundlePrice);
      const discountPercent =
        originalPrice > 0
          ? Math.round((savings / originalPrice) * 10000) / 100
          : 0;
      const totalDuration = b.items.reduce(
        (sum, item) => sum + item.service.duration * item.quantity,
        0
      );

      return {
        ...b,
        originalPrice: Math.round(originalPrice * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        discountPercent,
        totalDuration,
        isExpired: b.validUntil ? new Date(b.validUntil) < new Date() : false,
        isSoldOut: b.maxRedemptions ? b.timesRedeemed >= b.maxRedemptions : false,
      };
    });

    return apiSuccess({
      bundles: enriched,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error("[GET /api/bundles]", error);
    return apiError("Failed to fetch bundles", 500);
  }
}

// ── POST — create bundle (admin) ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const permError = await requirePermission(session, "manageServices");
  if (permError) return permError;

  try {
    const body = await req.json();
    const parsed = CreateBundleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { items, bundlePrice, ...bundleData } = parsed.data;

    // Verify all services exist and calculate original price
    const serviceIds = items.map((i) => i.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, price: true },
    });
    if (services.length !== serviceIds.length) {
      return apiError("One or more services not found", 404);
    }

    const originalPrice = items.reduce((sum, item) => {
      const service = services.find((s) => s.id === item.serviceId)!;
      return sum + Number(service.price) * item.quantity;
    }, 0);

    if (bundlePrice >= originalPrice) {
      return apiError("Bundle price must be less than original price for a discount", 400);
    }

    const discountPercent =
      originalPrice > 0
        ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 10000) / 100
        : 0;

    const bundle = await prisma.serviceBundle.create({
      data: {
        ...bundleData,
        bundlePrice,
        originalPrice,
        discountPercent,
        validFrom: bundleData.validFrom ? new Date(bundleData.validFrom) : null,
        validUntil: bundleData.validUntil ? new Date(bundleData.validUntil) : null,
        items: {
          create: items.map((item) => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            service: {
              select: { id: true, name: true, price: true, duration: true },
            },
          },
        },
      },
    });

    return apiSuccess({ bundle }, 201);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return apiError("A bundle with this slug already exists", 409);
    }
    console.error("[POST /api/bundles]", error);
    return apiError("Failed to create bundle", 500);
  }
}

// ── PATCH — update bundle (admin) ──────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const permError = await requirePermission(session, "manageServices");
  if (permError) return permError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("Missing bundle ID", 400);

  try {
    const body = await req.json();
    const parsed = UpdateBundleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { items, ...updateData } = parsed.data;
    const data: any = { ...updateData };

    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);

    // If items are being updated, recalculate prices
    if (items && items.length > 0) {
      const serviceIds = items.map((i) => i.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, price: true },
      });

      const originalPrice = items.reduce((sum, item) => {
        const service = services.find((s) => s.id === item.serviceId)!;
        return sum + Number(service.price) * item.quantity;
      }, 0);

      data.originalPrice = originalPrice;
      if (data.bundlePrice) {
        data.discountPercent =
          originalPrice > 0
            ? Math.round(((originalPrice - data.bundlePrice) / originalPrice) * 10000) / 100
            : 0;
      }

      // Delete old items and create new ones
      await prisma.serviceBundleItem.deleteMany({ where: { bundleId: id } });
      data.items = {
        create: items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
      };
    }

    const bundle = await prisma.serviceBundle.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            service: {
              select: { id: true, name: true, price: true, duration: true },
            },
          },
        },
      },
    });

    return apiSuccess({ bundle });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("Bundle not found", 404);
    console.error("[PATCH /api/bundles]", error);
    return apiError("Failed to update bundle", 500);
  }
}

// ── DELETE — deactivate bundle (admin) ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const permError = await requirePermission(session, "manageServices");
  if (permError) return permError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("Missing bundle ID", 400);

  try {
    // Soft-delete: deactivate instead of hard delete
    await prisma.serviceBundle.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Bundle deactivated" });
  } catch (error: any) {
    if (error?.code === "P2025") return apiError("Bundle not found", 404);
    console.error("[DELETE /api/bundles]", error);
    return apiError("Failed to delete bundle", 500);
  }
}
