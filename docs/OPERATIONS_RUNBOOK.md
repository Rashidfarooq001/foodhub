# FoodHub — Operations & Incident Response Runbook

---

## 1. Application Monitoring & Health Probes

| Check Type | Target URL | Expected Response | Remediation Action |
|---|---|---|---|
| Liveness Probe | `GET /health` | `200 OK` | Restart backend container |
| DB Connectivity | `GET /health/db` | `200 OK` | Check Postgres container logs & memory |
| Redis Cache | `GET /health/redis` | `200 OK` | Restart Redis service |
| Readiness Probe | `GET /health/ready` | `200 OK` | Inspect container stack health |

---

## 2. Common Operational Tasks

### A. View Container Logs
```bash
# Backend logs
docker logs -f foodhub-backend-prod --tail 100

# Nginx access/error logs
docker logs -f foodhub-nginx-prod --tail 100
```

### B. Execute Database Backup & Verification
```bash
# Trigger automated backup
bash scripts/db-backup.sh

# Point-in-time database restore
bash scripts/db-restore.sh /var/backups/foodhub/foodhub_db_backup_20260730_120000.sql.gz
```

### C. Zero-Downtime Application Update (Rollout)
```bash
git pull origin main
docker-compose -f docker/docker-compose.prod.yml up -d --build --no-deps backend
```

---

## 3. Incident Escalation & Response Matrix

| Severity | Definition | Response SLA | Mitigation Protocol |
|---|---|---|---|
| **SEV-1** | Core API or DB down (No orders processed) | < 15 mins | 1. Rollback container<br>2. Failover DB<br>3. Enable maintenance page |
| **SEV-2** | Payment gateway failing or Socket.IO disconnects | < 30 mins | 1. Fallback to COD<br>2. Restart Socket.IO gateway |
| **SEV-3** | Single frontend app slow or image upload failure | < 2 hours | Inspect Nginx cache & R2 status |
