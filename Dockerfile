FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install all deps including sharp's native bindings for linux/musl (Alpine)
RUN npm ci --include=optional

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# sharp requires libvips at build time on Alpine
RUN apk add --no-cache openssl vips-dev fftw-dev build-base
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# libvips runtime dependency for sharp
RUN apk add --no-cache openssl vips

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# sharp native bindings from the builder stage
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

# Pre-create the upload directory tree so the volume mount has a valid target
# (Docker requires the mount point to exist in the image)
RUN mkdir -p \
      public/uploads/gallery/thumbs \
      public/uploads/products/thumbs \
      public/uploads/services/thumbs \
      public/uploads/staff/thumbs \
      public/uploads/general/thumbs && \
    chmod -R 755 public/uploads

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

# Metadata
LABEL org.opencontainers.image.title="Kanishka's Family Salon & Academy"
LABEL org.opencontainers.image.description="Full-stack salon management platform"

EXPOSE 3000

# Health check — Docker will mark container as unhealthy if this fails 3 times
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
