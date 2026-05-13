export const dynamic = "force-dynamic";
// app/api/content/route.ts
// SiteContent API — manages key/value site content records

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  apiSuccess,
  apiError,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";
import { z } from "zod";

const UpsertContentSchema = z.object({
  key: z.string().min(1).max(200),
  title: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const BulkUpsertSchema = z.object({
  items: z.array(UpsertContentSchema).min(1).max(50),
});

// GET: Fetch site content records
// ?key=home_hero  → single record
// ?keys=k1,k2    → multiple records
// (no params)    → all records
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    const permError = await requirePermission(session, "manageContent");
    if (permError) return permError;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const keys = searchParams.get("keys");

    if (key) {
      const content = await prisma.siteContent.findUnique({ where: { key } });
      return apiSuccess({ content });
    }

    if (keys) {
      const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);
      const items = await prisma.siteContent.findMany({
        where: { key: { in: keyList } },
        orderBy: { key: "asc" },
      });
      // Return as object keyed by content key for easy lookup
      const contentMap = Object.fromEntries(items.map((item) => [item.key, item]));
      return apiSuccess({ content: contentMap, items });
    }

    // All records
    const items = await prisma.siteContent.findMany({
      orderBy: { key: "asc" },
    });
    return apiSuccess({ items, total: items.length });
  } catch (error) {
    return handlePrismaError(error, "GET /api/content");
  }
}

// PATCH: Upsert a single content record or bulk upsert
// Body: { key, title?, content?, imageUrl?, metadata? }  (single)
// Body: { items: [...] }  (bulk)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    const permError = await requirePermission(session, "manageContent");
    if (permError) return permError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    // Detect bulk vs single
    if (typeof body === "object" && body !== null && "items" in body) {
      // Bulk upsert
      const parsed = BulkUpsertSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("Validation failed", 400, parsed.error.flatten());
      }

      const results = await Promise.all(
        parsed.data.items.map((item) =>
          prisma.siteContent.upsert({
            where: { key: item.key },
            create: {
              key: item.key,
              title: item.title ?? null,
              content: item.content ?? null,
              imageUrl: item.imageUrl ?? null,
              metadata: (item.metadata ?? undefined) as any,
              updatedById: session.user.id,
            },
            update: {
              title: item.title,
              content: item.content,
              imageUrl: item.imageUrl,
              metadata: (item.metadata ?? undefined) as any,
              updatedById: session.user.id,
            },
          })
        )
      );

      // Log
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_SITE_CONTENT",
          entity: "SiteContent",
          details: { keys: parsed.data.items.map((i) => i.key), count: results.length },
        },
      });

      return apiSuccess({ items: results, count: results.length });
    }

    // Single upsert
    const parsed = UpsertContentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { key, title, content, imageUrl, metadata } = parsed.data;

    const record = await prisma.siteContent.upsert({
      where: { key },
      create: {
        key,
        title: title ?? null,
        content: content ?? null,
        imageUrl: imageUrl ?? null,
        metadata: (metadata ?? undefined) as any,
        updatedById: session.user.id,
      },
      update: {
        title,
        content,
        imageUrl,
        metadata: (metadata ?? undefined) as any,
        updatedById: session.user.id,
      },
    });

    // Log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_SITE_CONTENT",
        entity: "SiteContent",
        entityId: record.id,
        details: { key, fields: Object.keys(parsed.data) },
      },
    });

    return apiSuccess({ content: record });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/content");
  }
}

// DELETE: Remove a content record by key
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    const permError = await requirePermission(session, "manageContent");
    if (permError) return permError;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return apiError("key query parameter is required", 400);
    }

    await prisma.siteContent.delete({ where: { key } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_SITE_CONTENT",
        entity: "SiteContent",
        details: { key },
      },
    });

    return apiSuccess({ deleted: true, key });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/content");
  }
}
