#!/usr/bin/env bash
# ==============================================================================
# FoodHub PostgreSQL Daily Automated Backup Script
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/foodhub}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/foodhub_db_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

CONTAINER_NAME="${POSTGRES_CONTAINER:-foodhub-postgres-prod}"
DB_USER="${POSTGRES_USER:-foodhub_prod_user}"
DB_NAME="${POSTGRES_DB:-foodhub_prod_db}"

mkdir -p "${BACKUP_DIR}"

echo "📦 Starting PostgreSQL backup for database '${DB_NAME}'..."

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "✅ Backup successfully created at: ${BACKUP_FILE}"
echo "File Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Retain backups for 30 days
echo "🧹 Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "foodhub_db_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "🎉 Database backup process completed!"
