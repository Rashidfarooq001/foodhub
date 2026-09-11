cloudflared tunnel route dns ZaykaBackend api.zaykafood.online
cat << 'EOF' > /root/.cloudflared/config.yml
tunnel: d0a9e2f2-9b29-4c00-b1cb-814d286afdaf
credentials-file: /root/.cloudflared/d0a9e2f2-9b29-4c00-b1cb-814d286afdaf.json

ingress:
  - hostname: api.zaykafood.online
    service: http://localhost:4000
  - service: http_status:404
EOF
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
systemctl status cloudflared
