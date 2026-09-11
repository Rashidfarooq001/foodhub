#!/bin/bash
# ZaykaFood VPS Deployment Script
# Designed for 1vCPU / 1GB RAM Ubuntu Server

set -e

echo "Starting Deployment..."

# 1. Pull latest code
echo "Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# 3. Build backend
echo "Building backend..."
pnpm --filter backend exec prisma generate
pnpm --filter backend run build

# 4. Apply migrations (if needed, using deploy)
echo "Deploying database migrations..."
pnpm --filter backend exec prisma migrate deploy

# 5. Restart PM2
echo "Restarting backend..."
pm2 restart zayka-backend || pm2 start apps/backend/dist/src/main.js --name "zayka-backend" --max-memory-restart 600M --env production

# 6. Save PM2 state for reboot
pm2 save

# 7. Reload Nginx (if configured)
# sudo systemctl reload nginx

echo "Deployment completed. Checking health..."
sleep 5
curl -s http://localhost:4000/api/v1/health || echo "Health check failed!"
echo ""
