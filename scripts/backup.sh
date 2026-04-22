#!/bin/sh
# scripts/backup.sh
# PostgreSQL automated backup with rotation and optional S3 upload.
#
# Retention policy:
#   - Keep last 7 daily backups
#   - Keep last 4 weekly backups (every Sunday)
#   - Upload to S3-compatible storage if AWS creds are set
#
# Required env vars:  PGHOST, PGUSER, PGPASSWORD, PGDATABASE
# Optional env vars:  BACKUP_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
#
# Usage:
#   ./scripts/backup.sh           # one-shot: backup + rotate + upload
#   ./scripts/backup.sh --loop    # run forever, backing up daily at 2 AM UTC

set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DAILY_RETENTION="${DAILY_RETENTION:-7}"
WEEKLY_RETENTION="${WEEKLY_RETENTION:-28}"  # 4 weeks in days
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday ... 7=Sunday

# Database connection (defaults match docker-compose.yml)
export PGHOST="${PGHOST:-db}"
export PGUSER="${PGUSER:-salon_user}"
export PGPASSWORD="${PGPASSWORD:-salon_pass_2026}"
export PGDATABASE="${PGDATABASE:-kanishkas_salon}"

mkdir -p "${BACKUP_DIR}/daily" "${BACKUP_DIR}/weekly"

# ── Core backup function ─────────────────────────────────────────────────────

do_backup() {
    DAILY_FILE="kanishkas_daily_${TIMESTAMP}.sql.gz"

    echo "[$(date)] Starting backup → ${DAILY_FILE}"

    pg_dump --no-owner --no-privileges | gzip > "${BACKUP_DIR}/daily/${DAILY_FILE}"

    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/daily/${DAILY_FILE}" | cut -f1)
    echo "[$(date)] Backup complete: ${DAILY_FILE} (${BACKUP_SIZE})"

    # Weekly snapshot on Sundays
    if [ "$DAY_OF_WEEK" = "7" ]; then
        WEEKLY_FILE="kanishkas_weekly_${TIMESTAMP}.sql.gz"
        cp "${BACKUP_DIR}/daily/${DAILY_FILE}" "${BACKUP_DIR}/weekly/${WEEKLY_FILE}"
        echo "[$(date)] Weekly snapshot created: ${WEEKLY_FILE}"
    fi

    # ── Rotate old backups ────────────────────────────────────────────────────
    DAILY_DELETED=$(find "${BACKUP_DIR}/daily" -name "kanishkas_daily_*.sql.gz" -mtime +${DAILY_RETENTION} -delete -print 2>/dev/null | wc -l)
    if [ "$DAILY_DELETED" -gt 0 ]; then
        echo "[$(date)] Rotated ${DAILY_DELETED} daily backup(s) older than ${DAILY_RETENTION} days"
    fi

    WEEKLY_DELETED=$(find "${BACKUP_DIR}/weekly" -name "kanishkas_weekly_*.sql.gz" -mtime +${WEEKLY_RETENTION} -delete -print 2>/dev/null | wc -l)
    if [ "$WEEKLY_DELETED" -gt 0 ]; then
        echo "[$(date)] Rotated ${WEEKLY_DELETED} weekly backup(s) older than ${WEEKLY_RETENTION} days"
    fi

    # ── Optional: upload to S3-compatible storage ─────────────────────────────
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
        echo "[$(date)] Uploading to S3: s3://${BACKUP_S3_BUCKET}/daily/${DAILY_FILE}"

        # Install awscli if not present (Alpine)
        if ! command -v aws >/dev/null 2>&1; then
            apk add --no-cache aws-cli 2>/dev/null || pip install awscli 2>/dev/null || {
                echo "[$(date)] WARNING: aws CLI not available, skipping S3 upload"
                return
            }
        fi

        aws s3 cp "${BACKUP_DIR}/daily/${DAILY_FILE}" "s3://${BACKUP_S3_BUCKET}/daily/${DAILY_FILE}" --quiet && \
            echo "[$(date)] S3 upload complete" || \
            echo "[$(date)] WARNING: S3 upload failed"

        if [ "$DAY_OF_WEEK" = "7" ]; then
            aws s3 cp "${BACKUP_DIR}/weekly/${WEEKLY_FILE}" "s3://${BACKUP_S3_BUCKET}/weekly/${WEEKLY_FILE}" --quiet && \
                echo "[$(date)] S3 weekly upload complete" || \
                echo "[$(date)] WARNING: S3 weekly upload failed"
        fi
    else
        echo "[$(date)] S3 not configured — backup saved locally only"
    fi

    # ── Summary ───────────────────────────────────────────────────────────────
    echo "[$(date)] Current backups:"
    echo "  Daily:"
    ls -lh "${BACKUP_DIR}/daily"/kanishkas_daily_*.sql.gz 2>/dev/null | awk '{print "    "$NF" ("$5")"}' || echo "    (none)"
    echo "  Weekly:"
    ls -lh "${BACKUP_DIR}/weekly"/kanishkas_weekly_*.sql.gz 2>/dev/null | awk '{print "    "$NF" ("$5")"}' || echo "    (none)"
}

# ── Entrypoint ────────────────────────────────────────────────────────────────

if [ "${1:-}" = "--loop" ]; then
    echo "[$(date)] Backup cron loop started. Will run daily at 02:00 UTC."
    while true; do
        HOUR=$(date -u +%H)
        MIN=$(date -u +%M)
        if [ "$HOUR" = "02" ] && [ "$MIN" = "00" ]; then
            TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
            DAY_OF_WEEK=$(date +%u)
            do_backup
            # Sleep 120s to avoid double-fire within the same minute
            sleep 120
        fi
        sleep 30
    done
else
    # One-shot mode
    do_backup
fi
