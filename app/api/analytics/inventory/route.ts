export const dynamic = "force-dynamic";
// app/api/analytics/inventory/route.ts
// Inventory analytics — low-stock alerts, out-of-stock items, and stock summary.

import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError, requirePermission } from "@/lib/api-utils";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageProducts");
    if (permError) return permError;

    // All active products with stock info
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        stock: true,
        lowStockAlert: true,
        price: true,
        thumbnailUrl: true,
      },
      orderBy: { stock: "asc" },
    });

    const outOfStock = products.filter(p => p.stock <= 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert);
    const healthy = products.filter(p => p.stock > p.lowStockAlert);

    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + (p.stock * Number(p.price)),
      0
    );

    return apiSuccess({
      summary: {
        totalProducts,
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        healthyCount: healthy.length,
        totalStockValue: Math.round(totalStockValue),
      },
      outOfStock: outOfStock.map(p => ({
        id: p.id, name: p.name, slug: p.slug, category: p.category,
        stock: p.stock, threshold: p.lowStockAlert, thumbnailUrl: p.thumbnailUrl,
      })),
      lowStock: lowStock.map(p => ({
        id: p.id, name: p.name, slug: p.slug, category: p.category,
        stock: p.stock, threshold: p.lowStockAlert, thumbnailUrl: p.thumbnailUrl,
      })),
    });
  } catch (error: any) {
    console.error("[GET /api/analytics/inventory]", error);
    return apiError("Internal server error", 500);
  }
}
