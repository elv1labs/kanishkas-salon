// middleware.ts
// Protects dashboard routes, redirects unauthenticated users, applies role-based routing,
// and enforces CSRF origin validation on state-changing API requests.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // ── CSRF protection for custom API routes ────────────────────────────
    // Skip NextAuth's own endpoints (they have built-in CSRF via csrfToken).
    // Skip health, uploads, and other public GET-only endpoints.
    if (
        pathname.startsWith("/api/") &&
        !pathname.startsWith("/api/auth/") &&
        !pathname.startsWith("/api/health") &&
        !pathname.startsWith("/api/uploads/")
    ) {
        const csrfError = validateCsrfOrigin(req);
        if (csrfError) {
            console.warn(`[CSRF] ${csrfError} — ${req.method} ${pathname}`);
            return NextResponse.json(
                { success: false, error: "Forbidden: invalid request origin" },
                { status: 403 }
            );
        }
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });


    // ---- Auth pages: redirect logged-in users to dashboard ----
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        if (token) {
            const dashboardUrl = getDashboardUrl(token.role as string);
            return NextResponse.redirect(new URL(dashboardUrl, req.url));
        }
        return NextResponse.next();
    }

    // ---- /admin: require authentication + ADMIN role ----
    if (pathname.startsWith("/admin")) {
        if (!token) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (token.error === "AccountDeactivated") {
            return NextResponse.redirect(new URL("/login?error=AccountDeactivated", req.url));
        }
        const role = token.role as string;
        if (role !== "ADMIN") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
        }
        return NextResponse.next();
    }

    // ---- /dashboard: require authentication ----
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check if user account is deactivated
        if (token.error === "AccountDeactivated") {
            return NextResponse.redirect(new URL("/login?error=AccountDeactivated", req.url));
        }

        const role = token.role as string;

        // Redirect /dashboard to role-specific dashboard
        if (pathname === "/dashboard") {
            return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
        }

        // Role-based access control for dashboard sub-routes
        // /dashboard/admin/* → redirect to the new /admin/* namespace
        if (pathname.startsWith("/dashboard/admin")) {
            if (role !== "ADMIN") return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
            const newPath = pathname.replace("/dashboard/admin", "/admin");
            return NextResponse.redirect(new URL(newPath || "/admin", req.url));
        }
        if (pathname.startsWith("/dashboard/owner") && !["ADMIN", "OWNER"].includes(role)) {
            return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
        }
        if (pathname.startsWith("/dashboard/receptionist") && !["ADMIN", "OWNER", "RECEPTIONIST"].includes(role)) {
            return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
        }
    }

    return NextResponse.next();
}

function getDashboardUrl(role: string): string {
    switch (role) {
        case "ADMIN":
            return "/admin";
        case "OWNER":
            return "/dashboard/owner";
        case "RECEPTIONIST":
            return "/dashboard/receptionist";
        case "CLIENT":
        default:
            return "/dashboard/client";
    }
}

export const config = {
    matcher: [
        "/api/:path*",
        "/admin/:path*",
        "/dashboard/:path*",
        "/login",
        "/register",
    ],
};

