// i18n/request.ts
// Server-side locale detection + message loading for next-intl
// Uses cookie-based locale persistence (no URL prefix needed)

import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  // Read locale from cookie, fallback to default
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
