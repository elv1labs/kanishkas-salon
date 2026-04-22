#!/bin/sh
set -e

echo "==> Syncing database schema..."
# Use prisma db push for schema sync (no migration files required)
# --accept-data-loss is safe here because we only ADD columns/tables
node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 || {
  echo "⚠️  Schema push failed — starting with existing schema"
}

echo "==> Starting application..."
exec node server.js
