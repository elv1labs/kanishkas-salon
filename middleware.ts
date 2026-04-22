// middleware.ts
// Protects dashboard routes, redirects unauthenticated users, applies role-based routing

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

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
        "/admin/:path*",
        "/dashboard/:path*",
        "/login",
        "/register",
    ],
};
