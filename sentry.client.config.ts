// sentry.client.config.ts
// Initializes Sentry on the client side for error tracking in the browser.
// DSN is loaded from NEXT_PUBLIC_SENTRY_DSN env variable.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable when DSN is configured — gracefully degrades otherwise
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay — capture 1% of sessions, 100% of error sessions
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Don't send PII by default
  sendDefaultPii: false,

  environment: process.env.NODE_ENV ?? "development",
});
