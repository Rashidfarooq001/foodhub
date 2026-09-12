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

# Generate Prisma Client
pnpm --filter backend exec prisma generate

# Start Backend
cd apps/backend
pm2 delete zayka-backend || true
pm2 start dist/src/main.js --name "zayka-backend" --max-memory-restart 500M
pm2 save

echo "Setup Complete!"
