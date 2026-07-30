#!/usr/bin/env bash
# ==============================================================================
# FoodHub PostgreSQL Point-in-Time Restore Script
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${POSTGRES_CONTAINER:-foodhub-postgres-prod}"
DB_USER="${POSTGRES_USER:-foodhub_prod_user}"
DB_NAME="${POSTGRES_DB:-foodhub_prod_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file '${BACKUP_FILE}' not found!"
    exit 1
fi

echo "⚠️ WARNING: This will drop and restore all data in '${DB_NAME}' from '${BACKUP_FILE}'."
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore aborted by user."
    exit 0
fi

echo "🔄 Restoring database..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "✅ PostgreSQL restore process completed successfully!"
