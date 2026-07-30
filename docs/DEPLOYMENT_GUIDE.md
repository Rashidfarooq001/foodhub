# FoodHub — Production Deployment Guide

**Ubuntu 24.04 LTS VPS · Docker Compose · Nginx Reverse Proxy · Let's Encrypt SSL**

---

## 1. VPS Infrastructure Requirements

| Resource | Minimum Specification | Recommended Production |
|---|---|---|
| OS | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS |
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 80 GB NVMe SSD | 160 GB NVMe SSD |
| Network | 1 Gbps port | 1 Gbps redundant |

---

## 2. Server Initial Setup & Hardening

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Configure Firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 3. Install Docker Engine & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## 3. Deployment Procedure

```bash
# 1. Clone repository to /var/www/foodhub
sudo mkdir -p /var/www/foodhub
sudo chown $USER:$USER /var/www/foodhub
git clone https://github.com/your-org/foodhub.git /var/www/foodhub
cd /var/www/foodhub

# 2. Populate Production Environment Secrets
cp .env.example .env
nano .env

# 3. Run Environment Startup Validation
npx ts-node scripts/env-check.ts

# 4. Start Production Containers via Docker Compose
docker-compose -f docker/docker-compose.prod.yml up -d --build

# 5. Execute Prisma Database Migrations
docker exec -it foodhub-backend-prod pnpm --filter backend prisma migrate deploy
```

---

## 4. Let's Encrypt SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Issue wildcard/subdomain certificates
sudo certbot --nginx -d customer.foodhub.com -d hotel.foodhub.com -d delivery.foodhub.com -d admin.foodhub.com -d api.foodhub.com

# Enable automatic cert renewal cron
sudo systemctl enable certbot.timer
```

---

## 5. Domain DNS Mapping

| Subdomain | Target IP | Record Type |
|---|---|---|
| `customer.foodhub.com` | VPS Public IP | `A` |
| `hotel.foodhub.com` | VPS Public IP | `A` |
| `delivery.foodhub.com` | VPS Public IP | `A` |
| `admin.foodhub.com` | VPS Public IP | `A` |
| `api.foodhub.com` | VPS Public IP | `A` |
