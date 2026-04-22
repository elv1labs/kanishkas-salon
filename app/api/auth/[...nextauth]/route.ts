// app/api/auth/[...nextauth]/route.ts
// NextAuth handler with brute-force rate limiting on login attempts.

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

// Wrap the POST handler to add rate limiting on login attempts.
// GET requests (CSRF token, session, etc.) pass through unmodified.
async function rateLimitedPost(req: NextRequest, ctx: any) {
  // Only rate-limit the credentials sign-in action (callback/credentials)
  const url = new URL(req.url);
  const isSignIn =
    url.pathname.includes("callback/credentials") ||
    url.pathname.endsWith("/callback/credentials");

  if (isSignIn) {
    const ip = getClientIp(req);
    const { success, retryAfterMs } = rateLimit(`login:${ip}`, {
      max: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!success) {
      const retryMinutes = Math.ceil((retryAfterMs ?? 0) / 60_000);
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((retryAfterMs ?? 0) / 1000)),
          },
        }
      );
    }
  }

  // Delegate to NextAuth
  return (handler as any)(req, ctx);
}

export { handler as GET };
export { rateLimitedPost as POST };
