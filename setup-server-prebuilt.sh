#!/bin/bash
set -ex

echo "Starting Server Preparation (Pre-Built Deployment)..."

# 1. Update and install prerequisites
apt-get update
apt-get install -y curl git nginx redis-server ufw

# Ensure Redis is running
systemctl enable redis-server
systemctl start redis-server

# 2. Install Node.js 22
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# 3. Install PM2 and pnpm
npm install -g pnpm pm2

# 4. Configure Firewall (UFW)
ufw --force enable
ufw allow 22/tcp
ufw allow 20065/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 4000/tcp
ufw deny 6379/tcp
ufw reload

# 5. Extract Pre-Built Files
cd /root
rm -rf foodhub
tar -xzf foodhub-prebuilt.tar.gz

# 6. Setup Environment
cp /root/vps.env ./foodhub/apps/backend/.env

# 7. Start with PM2
cd foodhub/apps/backend
pm2 delete zayka-backend || true
pm2 start dist/src/main.js --name "zayka-backend" --max-memory-restart 500M
pm2 save
pm2 startup | tail -n 1 | bash || true

# 8. Configure Nginx
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
