#!/bin/bash
set -ex

echo "Starting Server Preparation (No-Build Remote Deployment)..."

apt-get update
apt-get install -y curl git nginx redis-server ufw

systemctl enable redis-server
systemctl start redis-server

if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
npm install -g pnpm pm2

ufw --force enable
ufw allow 22/tcp
ufw allow 20065/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 4000/tcp
ufw deny 6379/tcp
ufw reload

cd /root
if [ ! -d "foodhub" ]; then
    git clone https://github.com/Rashidfarooq001/foodhub.git
fi
cd foodhub
git fetch origin main
git reset --hard origin/main

cp /root/vps.env ./apps/backend/.env
export NODE_OPTIONS="--max-old-space-size=600"
pnpm install --frozen-lockfile

# Generate prisma client using minimal memory
pnpm --filter backend exec prisma generate

# Remove all other apps from the workspace so they don't consume memory during build
sed -i '/apps\/*/d' pnpm-workspace.yaml
sed -i '1s/^/packages:\n  - "apps\/backend"\n  - "packages\/*"\n/' pnpm-workspace.yaml

# Build ONLY the backend with turbo disabled
cd apps/backend
npm run build

pm2 delete zayka-backend || true
pm2 start dist/src/main.js --name "zayka-backend" --max-memory-restart 500M
pm2 save
pm2 startup | tail -n 1 | bash || true

cat > /etc/nginx/sites-available/zayka-backend << 'EOF'
server {
    listen 80;
    server_name aic.cloud;
    
    location = /api/v1/health {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10m;
    }
    
    location /orders/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
    
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/zayka-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
echo "Setup Complete!"
