// lib/storage.ts
// Unified local-filesystem image storage with sharp processing.
//
// Design decisions:
//  • Category-based paths  (/uploads/gallery/  /uploads/products/  etc.)
//    so directories are predictable, not date-fragmented.
//  • sharp converts every upload to WebP (30-70 % smaller than JPEG/PNG).
//  • A thumbnail (400 px wide) is always generated alongside the full image.
//  • EXIF metadata is stripped to protect client privacy and reduce file size.
//  • All paths returned are root-relative ("/uploads/...") — no hostname
//    baked in, so the app works behind any domain or reverse-proxy.
//  • The function is async and throws on failure so callers can handle errors
//    uniformly.

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import sharp from "sharp";

// ── Constants ────────────────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Full-size image: max 1600 px on the longest edge, quality 82 (sweet spot).
const FULL_WIDTH  = 1600;
const FULL_HEIGHT = 1600;
const FULL_QUALITY = 82;

// Thumbnail: fixed 400 px wide, cropped to 400×400 square. Quality 70 is
// enough for a grid thumbnail displayed at ≤ 300 px on screen.
const THUMB_WIDTH  = 400;
const THUMB_HEIGHT = 400;
const THUMB_QUALITY = 70;

// ── Types ────────────────────────────────────────────────────────────────────

export interface SaveImageResult {
  /** Root-relative URL of the full-size WebP, e.g. "/uploads/gallery/abc.webp" */
  imageUrl: string;
  /** Root-relative URL of the 400×400 WebP thumbnail */
  thumbnailUrl: string;
  /** Final file size of the full-size WebP in bytes */
  sizeBytes: number;
  /** Original MIME type that was uploaded */
  originalMime: string;
  /** Width of the processed full-size image */
  width: number;
  /** Height of the processed full-size image */
  height: number;
}

export interface ValidateImageResult {
  valid: boolean;
  error?: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validates image MIME type and size **before** reading the full buffer.
 * Call this with the metadata from the incoming File/Blob before calling saveImage.
 */
export function validateImage(
  file: { type: string; size: number },
  maxMB = 10,
): ValidateImageResult {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type}' is not allowed. Upload JPG, PNG, WebP, AVIF, or GIF.`,
    };
  }
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${maxMB} MB.`,
    };
  }
  return { valid: true };
}

/**
 * Processes an image file with sharp and saves two WebP variants to disk:
 *   1. Full-size  — max 1600×1600, quality 82, in /public/uploads/<folder>/
 *   2. Thumbnail  — 400×400 crop,  quality 70, in /public/uploads/<folder>/thumbs/
 *
 * Both files have unique names derived from a cryptographically random 8-byte
 * hex string to prevent collisions and enumeration.
 *
 * @param file   File object from the incoming FormData
 * @param folder Top-level upload folder, e.g. "gallery", "products", "staff"
 * @returns SaveImageResult with public URLs and metadata
 */
export async function saveImage(file: File, folder = "general"): Promise<SaveImageResult> {
  const bytes = await file.arrayBuffer();
  const inputBuffer = Buffer.from(bytes);

  // Unique base name — timestamp + 8 random hex chars
  const uid = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const baseName  = `${uid}.webp`;
  const thumbName = `${uid}-thumb.webp`;

  const baseDir  = join(process.cwd(), "public", "uploads", folder);
  const thumbDir = join(baseDir, "thumbs");

  // Ensure directories exist (no-op if they already do)
  await mkdir(baseDir,  { recursive: true });
  await mkdir(thumbDir, { recursive: true });

  // ── Process full-size image ──────────────────────────────────────────────
  const pipeline = sharp(inputBuffer, { failOn: "error" })
    .rotate()                         // auto-rotate from EXIF orientation
    .resize(FULL_WIDTH, FULL_HEIGHT, {
      fit: "inside",                  // never upscale, preserve aspect ratio
      withoutEnlargement: true,
    })
    // Note: sharp strips EXIF/GPS by default when withMetadata() is not called
    .webp({ quality: FULL_QUALITY, effort: 4 }); // effort 4 = good compression without slowness

  const { data: fullData, info } = await pipeline.toBuffer({ resolveWithObject: true });
  await writeFile(join(baseDir, baseName), fullData);

  // ── Process thumbnail ─────────────────────────────────────────────────────
  const thumbData = await sharp(inputBuffer, { failOn: "error" })
    .rotate()
    .resize(THUMB_WIDTH, THUMB_HEIGHT, {
      fit: "cover",                   // square crop centred
      position: "attention",          // smart-crop: focus on salient region
    })
    // EXIF stripped by default
    .webp({ quality: THUMB_QUALITY, effort: 3 })
    .toBuffer();
  await writeFile(join(thumbDir, thumbName), thumbData);

  // Normalise path separators for Windows dev machines (no-op on Linux)
  // Use /api/uploads/ prefix so the Next.js API route handler serves the file,
  // bypassing the static-file interceptor which cannot serve runtime uploads
  // in Next.js standalone (output: 'standalone') deployments.
  const imageUrl     = `/api/uploads/${folder}/${baseName}`.replace(/\\/g, "/");
  const thumbnailUrl = `/api/uploads/${folder}/thumbs/${thumbName}`.replace(/\\/g, "/");

  return {
    imageUrl,
    thumbnailUrl,
    sizeBytes: info.size,
    originalMime: file.type,
    width: info.width,
    height: info.height,
  };
}
