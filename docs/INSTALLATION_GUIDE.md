# Installation & Environment Setup Guide

## 1. Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0 (`npm install -g pnpm`)
- Docker Desktop (for Postgres & Redis local instances)

## 2. Monorepo Setup
```bash
# Clone the repository
git clone https://github.com/foodhub/foodhub.git
cd foodhub

# Install all workspace dependencies
pnpm install

# Setup local environment variables
cp .env.example .env
```

## 3. Launch Services
```bash
# Option A: Start local PostgreSQL & Redis via Docker
pnpm docker:dev

# Option B: Run all 5 applications in Turborepo dev mode
pnpm dev
```
