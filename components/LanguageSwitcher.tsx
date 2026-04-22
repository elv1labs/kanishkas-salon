"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

/**
 * Compact language switcher — toggles between EN and हिन्दी.
 * Sets a cookie via /api/locale and reloads the page.
 */
export default function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState<Locale>(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/locale=(\w+)/);
      return (match?.[1] as Locale) || "en";
    }
    return "en";
  });

  const nextLocale: Locale = currentLocale === "en" ? "hi" : "en";

  const switchLocale = async () => {
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });

      setCurrentLocale(nextLocale);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("Failed to switch locale:", err);
    }
  };

  return (
    <button
      onClick={switchLocale}
      disabled={isPending}
      title={`Switch to ${localeNames[nextLocale]}`}
      aria-label={`Switch language to ${localeNames[nextLocale]}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.25)",
        borderRadius: 3,
        cursor: isPending ? "wait" : "pointer",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: "#C9A84C",
        transition: "all 0.2s",
        opacity: isPending ? 0.6 : 1,
        whiteSpace: "nowrap",
        fontFamily: "var(--ff-body, 'DM Sans', system-ui, sans-serif)",
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          e.currentTarget.style.background = "rgba(201,168,76,0.15)";
          e.currentTarget.style.borderColor = "#C9A84C";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
      }}
    >
      <span style={{ fontSize: 13 }}>{localeFlags[nextLocale]}</span>
      {localeNames[nextLocale]}
    </button>
  );
}
