const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // VPS-hosted images served via the app's own domain
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp'],
  },
  async redirects() {
    return [
      {
        // Redirect legacy /uploads/* URLs to the API serving route.
        // lib/storage.ts now generates /api/uploads/* correctly, but any
        // records saved before that change (or external links) still use
        // the old path — this makes them work transparently.
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Uploaded images are content-addressable (timestamped unique names).
        // Cache them aggressively: 1 year, immutable — no re-validation needed.
        // Matches /api/uploads/:path* (served by our API route handler in standalone)
        // and the legacy /uploads/:path* path (served statically when files exist in public).
        source: '/:prefix(api\/)?uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public-facing API data (services, products, blog, gallery)
        // Short cache with stale-while-revalidate for fresh-ish content
        source: '/api/:path(services|products|blog|gallery|content|academy/courses|slots)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Security headers for all other routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  // Suppresses all Sentry logs in the build process
  silent: true,

  // Upload source maps only when SENTRY_AUTH_TOKEN is available (production builds)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Hides source maps from the client (they're uploaded to Sentry for deobfuscation)
  hideSourceMaps: true,

  // Tree-shake Sentry logger statements in production
  disableLogger: true,
});

