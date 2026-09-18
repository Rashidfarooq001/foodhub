#!/bin/bash
set -ex

echo "Starting Server Preparation (Direct Pre-built Deploy)..."

cd /root
rm -rf foodhub
mkdir -p foodhub
tar -xzf foodhub-dist.tar.gz -C foodhub

cd foodhub
cp /root/vps.env ./apps/backend/.env

# Install ONLY production dependencies to save RAM
export NODE_ENV=production
pnpm install --prod --frozen-lockfile

# Fail-Fast Migration Verification
echo "Verifying migrations against production database..."
export PRISMA_HIDE_UPDATE_MESSAGE=true

cd apps/backend
if ! npx prisma migrate deploy; then
  echo "CRITICAL ERROR: prisma migrate deploy failed."
  exit 1
fi

if ! npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code; then
  echo "CRITICAL ERROR: Schema drift detected after migrations! Deployment stopped."
  exit 1
fi
cd ../..

# Generate Prisma Client
pnpm --filter backend exec prisma generate

# Start Backend
cd apps/backend
pm2 delete zayka-backend  || true
pm2 start dist/src/main.js --name "zayka-backend" --max-memory-restart 500M
pm2 save

echo "Setup Complete!"
