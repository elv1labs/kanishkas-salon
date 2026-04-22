// app/api/admin/site-images/route.ts
// Manage named site image slots (founder photo, Why Us, CTA background, etc.)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SITE_IMAGE_DEFAULTS: Record<string, { label: string; imageUrl: string; altText: string }> = {
  about_founder: {
    label: "About Page — Founder Portrait",
    imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=533&fit=crop&q=80",
    altText: "Kanishka Sen — Founder",
  },
  homepage_about: {
    label: "Homepage — About Section",
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=750&fit=crop&q=80",
    altText: "Salon interior",
  },
  why_us_photo: {
    label: "Homepage — Why Choose Us",
    imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop&q=80",
    altText: "Salon experience",
  },
  cta_background: {
    label: "Homepage — Booking CTA Background",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop&q=80",
    altText: "Book your salon experience",
  },
  homepage_hero_fallback: {
    label: "Homepage — Hero Fallback (when no slides)",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&q=80",
    altText: "Kanishka's Family Salon",
  },
};

async function requireEditor() {
  const session = await getAuthSession();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

// Auto-seed defaults if a key doesn't exist yet
async function ensureDefaults() {
  for (const [key, defaults] of Object.entries(SITE_IMAGE_DEFAULTS)) {
    await prisma.siteImage.upsert({
      where: { key },
      update: {},
      create: { key, ...defaults },
    });
  }
}

export async function GET() {
  await ensureDefaults();
  const images = await prisma.siteImage.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ images, defaults: Object.keys(SITE_IMAGE_DEFAULTS) });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { key, imageUrl, altText } = body ?? {};

  if (!key || typeof key !== "string") return NextResponse.json({ error: "key required" }, { status: 400 });
  if (!imageUrl || typeof imageUrl !== "string") return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  // Reject URLs that won't render as images (old /uploads/ prefix, Google Drive share links, etc.)
  const isValidImageUrl = (
    imageUrl.startsWith("/api/uploads/") ||
    (imageUrl.startsWith("https://") && !imageUrl.includes("drive.google.com") && !imageUrl.includes("docs.google.com"))
  );
  if (!isValidImageUrl) {
    return NextResponse.json(
      { error: "imageUrl must be a direct https:// link or an uploaded file path (/api/uploads/…). Google Drive share links are not supported." },
      { status: 400 },
    );
  }

  try {
    const image = await prisma.siteImage.upsert({
      where: { key },
      update: { imageUrl, altText: altText ?? null },
      create: {
        key,
        label: SITE_IMAGE_DEFAULTS[key]?.label ?? key,
        imageUrl,
        altText: altText ?? null,
      },
    });

    // Bust the caches for affected public pages
    try {
      revalidatePath("/about");
      revalidatePath("/");
    } catch (e) {
      console.warn("[site-images] revalidatePath warning:", e);
    }

    return NextResponse.json({ image });
  } catch (err) {
    console.error("[PUT /api/admin/site-images]", err);
    return NextResponse.json(
      { error: "Failed to update site image. Please try again." },
      { status: 500 },
    );
  }
}
