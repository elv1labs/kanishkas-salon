#!/bin/bash
# scripts/backup.sh
# PostgreSQL backup script with 30-day retention.
# Usage: ./scripts/backup.sh
# Requires: PGHOST, PGUSER, PGPASSWORD, PGDATABASE env vars (or defaults to docker-compose values)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="kanishkas_backup_${TIMESTAMP}.sql.gz"

# Database connection (defaults match docker-compose.yml)
export PGHOST="${PGHOST:-db}"
export PGUSER="${PGUSER:-salon_user}"
export PGPASSWORD="${PGPASSWORD:-salon_pass_2026}"
export PGDATABASE="${PGDATABASE:-kanishkas_salon}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup → ${FILENAME}"

pg_dump --no-owner --no-privileges | gzip > "${BACKUP_DIR}/${FILENAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup complete: ${FILENAME} (${BACKUP_SIZE})"

# Rotate old backups
DELETED=$(find "${BACKUP_DIR}" -name "kanishkas_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Rotated ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date)] Current backups:"
ls -lh "${BACKUP_DIR}"/kanishkas_backup_*.sql.gz 2>/dev/null || echo "  (none)"
