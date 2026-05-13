#!/bin/bash
set -e

# ── Fix Docker volume permissions ─────────────────────────────────────────────
# Docker named volumes mount as root. Ensure the upload tree is writable
# by the nextjs user (UID 1001) before dropping privileges.
echo "==> Fixing upload directory permissions..."
for dir in gallery products services staff general; do
  mkdir -p /app/public/uploads/$dir/thumbs
done
chown -R 1001:1001 /app/public/uploads

# ── Database schema sync ──────────────────────────────────────────────────────
echo "==> Running database migrations..."
gosu 1001:1001 npx prisma migrate deploy 2>&1 || {
  echo "⚠️  Migration failed — attempting schema push as fallback..."
  gosu 1001:1001 npx prisma db push 2>&1 || {
    echo "⚠️  Schema sync failed — starting with existing schema"
  }
}

# ── Start application as non-root ─────────────────────────────────────────────
echo "==> Starting application as nextjs (UID 1001)..."
exec gosu 1001:1001 node server.js
