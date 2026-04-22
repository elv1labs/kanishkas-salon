/**
 * scripts/patch-images.ts
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/patch-images.ts
 *
 * Patches gallery items (broken /gallery/*.jpg → Unsplash URLs)
 * and products (null thumbnailUrl → Unsplash product images)
 * WITHOUT touching any other data.
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── Gallery patches ────────────────────────────────────────────────────────────
// Maps partial title → Unsplash image URL
const GALLERY_IMAGE_MAP: Record<string, string> = {
  "Bridal Makeup — Meenakshi":    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=1000&fit=crop&q=80",
  "Balayage Transformation":      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=1000&fit=crop&q=80",
  "Gold Facial Glow":             "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=1000&fit=crop&q=80",
  "Bridal Hairstyle — Priya":     "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1000&fit=crop&q=80",
  "Nail Art — Floral Design":     "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=1000&fit=crop&q=80",
  "Salon Interior":               "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&q=80",
  "Keratin Before & After":       "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=1000&fit=crop&q=80",
  "Academy Training Session":     "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=1000&fit=crop&q=80",
  // Fallback for any item with a /gallery/ path not in the map
};

const GALLERY_FALLBACK = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=1000&fit=crop&q=80";

// ── Product thumbnail patches ──────────────────────────────────────────────────
// Maps product name (partial match) → Unsplash thumbnail
const PRODUCT_IMAGE_MAP: Array<{ match: string; url: string }> = [
  { match: "Vitamin C",     url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&q=80" },
  { match: "Hair Mask",     url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop&q=80" },
  { match: "Primer",        url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&q=80" },
  { match: "Nail Lacquer",  url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&q=80" },
  { match: "Retinol",       url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&q=80" },
  { match: "Keratin",       url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop&q=80" },
  { match: "Kajal",         url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&q=80" },
  { match: "Pedicure",      url: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=600&fit=crop&q=80" },
  // Generic product fallbacks by category
  { match: "SKINCARE",      url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&q=80" },
  { match: "HAIR_CARE",     url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop&q=80" },
  { match: "MAKEUP",        url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&q=80" },
  { match: "NAIL_CARE",     url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&q=80" },
];

const PRODUCT_FALLBACK = "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=600&h=600&fit=crop&q=80";

async function main() {
  console.log("\n🖼️  Patching gallery images...");

  // Fix gallery items with /gallery/ paths
  const galleryItems = await prisma.galleryItem.findMany({
    where: { imageUrl: { startsWith: "/gallery/" } },
  });

  console.log(`   Found ${galleryItems.length} items with local /gallery/ paths`);

  for (const item of galleryItems) {
    const newUrl =
      (item.title && GALLERY_IMAGE_MAP[item.title]) ??
      GALLERY_FALLBACK;

    await prisma.galleryItem.update({
      where: { id: item.id },
      data: { imageUrl: newUrl },
    });
    console.log(`   ✓ ${item.title ?? item.id} → ${newUrl.substring(0, 60)}...`);
  }

  console.log("\n🛍️  Patching product thumbnails...");

  const products = await prisma.product.findMany({
    where: { thumbnailUrl: null },
  });

  console.log(`   Found ${products.length} products with no thumbnail`);

  for (const product of products) {
    // Find best URL match by product name first, then category
    let url = PRODUCT_FALLBACK;
    for (const { match, url: matchUrl } of PRODUCT_IMAGE_MAP) {
      if (
        product.name.toLowerCase().includes(match.toLowerCase()) ||
        product.category === match
      ) {
        url = matchUrl;
        break;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { thumbnailUrl: url },
    });
    console.log(`   ✓ ${product.name} → ${url.substring(0, 60)}...`);
  }

  console.log("\n✅ Image patch complete!\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
