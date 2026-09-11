apt-get update
apt-get install -y certbot python3-certbot-nginx
cat << 'EOF' > /etc/nginx/sites-available/foodhub
server {
    listen 80;
    server_name api.zaykafood.online 148.113.6.63;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Real IP headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/foodhub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl reload nginx
certbot --nginx -d api.zaykafood.online --non-interactive --agree-tos -m rashidreshi42@gmail.com
