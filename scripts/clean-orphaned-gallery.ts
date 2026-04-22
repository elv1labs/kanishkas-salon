/**
 * scripts/clean-orphaned-gallery.ts
 * Finds GalleryItem records whose uploaded files are missing on disk and deletes them.
 * Safe: only removes records with /uploads/... paths where the file genuinely doesn't exist.
 * External URLs (https://...) are left untouched.
 *
 * Run: npx tsx scripts/clean-orphaned-gallery.ts
 * Dry-run: npx tsx scripts/clean-orphaned-gallery.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const PUBLIC_DIR = join(process.cwd(), "public");
const DRY_RUN = process.argv.includes("--dry-run");

function isLocalPath(url: string | null): boolean {
  return !!url && url.startsWith("/uploads/");
}

function fileExists(url: string): boolean {
  const filePath = join(PUBLIC_DIR, url);
  return existsSync(filePath);
}

async function main() {
  console.log(`\n🔍 Scanning gallery items for orphaned files…`);
  if (DRY_RUN) console.log("   (DRY RUN — nothing will be deleted)\n");

  const items = await prisma.galleryItem.findMany({
    select: { id: true, title: true, imageUrl: true, thumbnailUrl: true },
  });

  console.log(`   Found ${items.length} total gallery items in DB\n`);

  const orphaned: string[] = [];

  for (const item of items) {
    const imageLocal = isLocalPath(item.imageUrl);
    const thumbLocal = isLocalPath(item.thumbnailUrl);

    const imageMissing = imageLocal && !fileExists(item.imageUrl);
    const thumbMissing = thumbLocal && item.thumbnailUrl && !fileExists(item.thumbnailUrl);

    if (imageMissing) {
      // Primary image is gone — the record is useless
      orphaned.push(item.id);
      console.log(
        `  ❌ ORPHANED  id=${item.id.slice(-8)}\n` +
        `              title="${item.title ?? "(untitled)"}"\n` +
        `              missing: ${item.imageUrl}`
      );
    } else if (thumbMissing && item.thumbnailUrl) {
      // Primary image is fine, only thumb is missing — just clear thumbnailUrl
      console.log(
        `  ⚠️  THUMB ONLY  id=${item.id.slice(-8)} — clearing thumbnailUrl\n` +
        `              missing: ${item.thumbnailUrl}`
      );
      if (!DRY_RUN) {
        await prisma.galleryItem.update({
          where: { id: item.id },
          data: { thumbnailUrl: null },
        });
      }
    }
  }

  console.log(`\n📋 Summary:`);
  console.log(`   Total items scanned : ${items.length}`);
  console.log(`   Orphaned (to delete): ${orphaned.length}`);

  if (orphaned.length === 0) {
    console.log("\n✅ No orphaned records found. Gallery DB is clean.\n");
    return;
  }

  if (!DRY_RUN) {
    const result = await prisma.galleryItem.deleteMany({
      where: { id: { in: orphaned } },
    });
    console.log(`\n🗑️  Deleted ${result.count} orphaned gallery record(s).`);
  } else {
    console.log(`\n   (Dry run — run without --dry-run to delete these ${orphaned.length} records)`);
  }

  console.log("\n✅ Done.\n");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
