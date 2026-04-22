// app/api/upload/route.ts
// Multipart image upload endpoint.
//
// Accepts: POST multipart/form-data  { file: File, folder?: string }
// Returns: { imageUrl, thumbnailUrl, width, height, sizeBytes, originalMime }
//
// Pipeline:
//   1. Auth check (RECEPTIONIST, ADMIN, OWNER)
//   2. Validate MIME + size before reading bytes
//   3. sharp: resize → WebP full-size (max 1600px, q82) + thumbnail (400×400, q70)
//   4. Write to /public/uploads/<folder>/  and  /public/uploads/<folder>/thumbs/
//   5. Return root-relative URLs  →  browser serves them as static files

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { validateImage, saveImage, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/lib/storage";

// Folders that are allowed as upload targets (whitelist to prevent path traversal)
const ALLOWED_FOLDERS = ["gallery", "products", "services", "staff", "general"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

function isAllowedFolder(folder: string): folder is AllowedFolder {
  return (ALLOWED_FOLDERS as readonly string[]).includes(folder);
}

export async function POST(req: NextRequest) {
  // ── 1. Authentication ───────────────────────────────────────────────────
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const role = session.user.role as UserRole;
  const canUpload =
    hasPermission(role, "manageGallery") || hasPermission(role, "manageSettings");

  if (!canUpload) {
    return NextResponse.json(
      { error: "Insufficient permissions to upload media" },
      { status: 403 },
    );
  }

  // ── 2. Parse multipart form ──────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "No file provided. Send a 'file' field in the form data." },
      { status: 400 },
    );
  }

  // Folder routing — defaults to "gallery"
  const rawFolder = (formData.get("folder") as string | null) ?? "gallery";
  const folder: AllowedFolder = isAllowedFolder(rawFolder) ? rawFolder : "gallery";

  // ── 3. Validate before reading bytes ────────────────────────────────────
  const validation = validateImage(file, MAX_FILE_SIZE_BYTES / (1024 * 1024));
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // ── 4. Process + save ───────────────────────────────────────────────────
  try {
    const result = await saveImage(file, folder);

    return NextResponse.json(
      {
        url: result.imageUrl,          // kept for backward compatibility with gallery dashboard
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        originalMime: result.originalMime,
        folder,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[POST /api/upload]", message);
    return NextResponse.json(
      { error: "Failed to process and save the image. Please try again." },
      { status: 500 },
    );
  }
}

// Expose allowed types for client-side validation hints
export async function GET() {
  return NextResponse.json({
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    allowedFolders: [...ALLOWED_FOLDERS],
  });
}
