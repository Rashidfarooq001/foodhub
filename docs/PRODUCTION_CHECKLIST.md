# FoodHub — Production Go-Live Readiness Checklist

---

## 1. Security & Compliance Checklist
- [x] Helmet HTTP security headers active in backend
- [x] CORS restricted to explicit frontend domains (`ALLOWED_ORIGINS`)
- [x] Confidential fields (`passwordHash`, `refreshTokenHash`, `secretKey`) stripped by `ResponseSanitizeInterceptor`
- [x] Request correlation ID (`X-Request-ID`) attached across all endpoints
- [x] File upload validation active (5MB max limit, MIME type whitelist)
- [x] JWT refresh token rotation and token revocation operational
- [x] Rate limiting active on auth endpoints (`5 req / 60s`)

---

## 2. Infrastructure & Containerization Checklist
- [x] Multi-stage Dockerfiles configured for Backend and 4 Next.js apps
- [x] Docker Compose production manifest (`docker-compose.prod.yml`) verified
- [x] Healthchecks configured for Postgres, Redis, and Backend API
- [x] Persistent named volumes configured for database and cache
- [x] Nginx reverse proxy configured for 5 subdomains with HTTP/2 & Gzip
- [x] WebSocket (`/socket.io/`) proxy upgrade headers verified

---

## 3. Testing & QA Acceptance
- [x] Monorepo Type-Check (`pnpm type-check` 👉 **17/17 passed**)
- [x] Jest Unit & Integration Test Suites 👉 **55/55 tests passed**
- [x] Playwright Cross-browser E2E Configured (`playwright.config.ts`)
- [x] Monorepo Production Build (`pnpm build` 👉 **11/11 apps built successfully**)

---

## 4. Disaster Recovery & Backup Checklist
- [x] Automated daily database backup script (`scripts/db-backup.sh`)
- [x] Interactive point-in-time restore script (`scripts/db-restore.sh`)
- [x] Environment variable validator (`scripts/env-check.ts`)
- [x] GitHub Actions CI/CD workflow (`.github/workflows/ci-cd.yml`)
