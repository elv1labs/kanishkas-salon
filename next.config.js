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

module.exports = nextConfig
