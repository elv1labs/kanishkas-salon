// sentry.server.config.ts
// Initializes Sentry on the server side for error tracking in API routes & SSR.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Don't send PII by default
  sendDefaultPii: false,

  environment: process.env.NODE_ENV ?? "development",
});
