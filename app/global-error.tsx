"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#FDFAF5",
        }}>
          <h1 style={{ color: "#1A1A1A", fontSize: "2rem", marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#5C4A32", marginBottom: "2rem", maxWidth: "400px" }}>
            We&apos;ve been notified and are looking into it.
            Please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#C9A84C",
              color: "#fff",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
