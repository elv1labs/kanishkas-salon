// app/api/admin/hero-slides/route.ts
// CRUD for homepage hero slides

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Rejects URLs that look like they'll produce broken images.
 * Accepts:
 *   /api/uploads/...      — local filesystem uploads (correct prefix)
 *   https://...           — external public CDN/Unsplash images
 * Rejects:
 *   /uploads/...          — old prefix, file-serving route won't handle it
 *   drive.google.com      — share-page URLs, not direct image URLs
 *   anything else odd
 */
function isValidImageUrl(url: string): boolean {
  if (url.startsWith("/api/uploads/")) return true;
  if (url.startsWith("https://") && !url.includes("drive.google.com") && !url.includes("docs.google.com")) return true;
  return false;
}

const SlideSchema = z.object({
  imageUrl:    z.string().min(1, "Image URL required").refine(isValidImageUrl, {
    message: "Image URL must be a direct image link (https://…) or an uploaded file (/api/uploads/…). Google Drive share links are not supported.",
  }),
  eyebrow:     z.string().max(100).optional(),
  title:       z.string().min(1, "Title required").max(100),
  titleItalic: z.string().max(100).optional(),
  subtitle:    z.string().max(300).optional(),
  ctaLabel:    z.string().max(60).default("Book Appointment"),
  ctaHref:     z.string().max(200).default("/book"),
  sortOrder:   z.number().int().min(0).default(0),
  isActive:    z.boolean().default(true),
});

async function requireAdmin(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const slides = await prisma.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ slides });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const parsed = SlideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slide = await prisma.heroSlide.create({ data: parsed.data });
  return NextResponse.json({ slide }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const { id, ...rest } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const parsed = SlideSchema.partial().safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slide = await prisma.heroSlide.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ slide });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.heroSlide.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
