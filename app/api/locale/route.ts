// app/api/locale/route.ts
// Switch the user's locale preference via cookie
//
// POST /api/locale { locale: "en" | "hi" }

import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/i18n/config";

export async function POST(req: NextRequest) {
  try {
    const { locale } = await req.json();

    if (!locale || !locales.includes(locale as Locale)) {
      return NextResponse.json(
        { error: "Invalid locale. Supported: " + locales.join(", ") },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ locale, success: true });

    // Set locale cookie — 1 year expiry, httpOnly=false so client JS can read it
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
