FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl libvips libfftw3-dev g++ make pkg-config python3 && \
  rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --include=optional

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl libvips-dev libfftw3-dev build-essential && \
  rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl libvips gosu && \
  rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

# Non-root user for security — created BEFORE upload dirs so chown applies
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Pre-create the upload directory tree so the volume mount has a valid target
# (Docker requires the mount point to exist in the image)
# Owned by nextjs so the app can write uploads at runtime
RUN mkdir -p \
      public/uploads/gallery/thumbs \
      public/uploads/products/thumbs \
      public/uploads/services/thumbs \
      public/uploads/staff/thumbs \
      public/uploads/general/thumbs && \
    chown -R nextjs:nodejs public/uploads

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Ensure the entire app is owned by nextjs
RUN chown -R nextjs:nodejs /app
# NOTE: We do NOT switch to USER nextjs here.
# The entrypoint starts as root to fix Docker volume perms, then drops to nextjs.

# Metadata
LABEL org.opencontainers.image.title="Kanishka's Family Salon & Academy"
LABEL org.opencontainers.image.description="Full-stack salon management platform"

EXPOSE 3000

# Health check — Docker will mark container as unhealthy if this fails 3 times
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
