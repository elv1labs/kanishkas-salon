// app/api/uploads/[...path]/route.ts
// Serves files from the uploads directory for Next.js standalone deployments.
//
// Next.js standalone (output: 'standalone') + `node server.js` intercepts
// requests with file extensions BEFORE routing them to app route handlers,
// so a route at `/uploads/[...path]` never fires. By placing this under
// `/api/uploads/`, static-file interception is bypassed (API routes are
// always handled by the JS runtime regardless of the URL's file extension).
//
// lib/storage.ts returns `/api/uploads/...` URLs instead of `/uploads/...`
// to ensure every uploaded image goes through this handler.
//
// Security notes:
//  • Path-traversal is blocked by rejecting segments containing `..` and
//    by verifying the resolved absolute path starts inside the uploads root.
//  • Only files with image extensions are served (Content-Type whitelist).
//  • Cache-Control matches the setting in next.config.js headers() so CDNs
//    still benefit from 1-year immutable caching.

export const dynamic = "force-dynamic"; // must be dynamic: reads files from disk at request time

import { NextRequest, NextResponse } from "next/server";
import { join, extname, normalize } from "path";
import { readFile, stat } from "fs/promises";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".gif":  "image/gif",
  ".avif": "image/avif",
  ".svg":  "image/svg+xml",
};

// Only serve files that have an allowed image extension.
const ALLOWED_EXTENSIONS = new Set(Object.keys(MIME));

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path;

  // Reject any segment containing `..` to prevent path traversal
  if (segments.some((s) => s.includes(".."))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Only allow segments that look like safe path components
  if (!segments.every((s) => /^[\w\-.]+$/.test(s))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const relativePath = normalize(segments.join("/"));
  const ext = extname(relativePath).toLowerCase();

  // Whitelist: only serve known image types
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const uploadsRoot = join(process.cwd(), "public", "uploads");
  const absPath = join(uploadsRoot, relativePath);

  // Final safety check: ensure path is inside uploads root
  if (!absPath.startsWith(uploadsRoot + "/") && absPath !== uploadsRoot) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const info = await stat(absPath);
    if (!info.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const data = await readFile(absPath);
    const contentType = MIME[ext]!;

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type":   contentType,
        "Cache-Control":  "public, max-age=31536000, immutable",
        "Content-Length": String(info.size),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
