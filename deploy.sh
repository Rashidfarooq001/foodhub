#!/bin/bash
# FoodHub Enterprise Automated Deployment Script
# 
# Usage: ./deploy.sh
# Note: Ensure this is run from the root of the foodhub directory on your VPS.

echo "======================================"
echo "🚀 Starting FoodHub Production Deploy "
echo "======================================"

# 1. Pull latest code
echo "📦 Pulling latest changes from main branch..."
git fetch origin
git checkout main
git pull origin main

# 2. Install dependencies
echo "📥 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

# 3. Build the backend
echo "🏗️ Building the backend..."
pnpm --filter backend build

# 4. Safely deploy database migrations
echo "🗄️ Running database migrations..."
pnpm --filter backend prisma:deploy

# 5. Restart application
echo "🔄 Restarting application process..."
# Assuming you are using PM2 to manage the backend process.
# If your pm2 process is named differently, update 'foodhub-backend' below.
if pm2 list | grep -q "foodhub-backend"; then
    pm2 restart foodhub-backend
else
    echo "⚠️ PM2 process 'foodhub-backend' not found. Starting a new process..."
    pm2 start apps/backend/dist/src/main.js --name "foodhub-backend" --time
fi

# 6. Build frontends if they are also hosted on this VPS
# (Uncomment the lines below if you build frontends here instead of Vercel)
# echo "🏗️ Building admin dashboard..."
# pnpm --filter admin-dashboard build
# echo "🔄 Restarting admin dashboard..."
# pm2 restart foodhub-admin || pm2 start "pnpm --filter admin-dashboard start" --name "foodhub-admin" --time

echo "======================================"
echo "✅ Deployment completed successfully! "
echo "======================================"
