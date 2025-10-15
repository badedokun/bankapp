# 🚀 Quick Deployment Reference Card
**Last Updated:** October 10, 2025 | **Full Guide:** [DEPLOYMENT_GUIDE_2025_10_10_WORKING.md](./DEPLOYMENT_GUIDE_2025_10_10_WORKING.md)

---

## ⚡ 30-Minute Deployment

### Prerequisites ✅
```bash
SSH: ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25
DB User: bisiadedokun
DB Pass: orokiipay2024
DB Port: 5433
URL: https://fmfb-34-59-143-25.nip.io/
```

---

## 🔧 Critical Configuration

### Backend .env (Server: /opt/bankapp/.env)
```bash
NODE_ENV=development           # ← MUST be development!
DB_PORT=5433                   # ← NOT 5432!
DB_PASSWORD=orokiipay2024      # ← No special chars!
DEFAULT_TENANT=fmfb
```

### Frontend .env (Local: /Users/bisiadedokun/bankapp/.env)
```bash
REACT_APP_API_URL=/api         # ← Relative URL!
REACT_APP_ENV=production
REACT_APP_TENANT_CODE=fmfb
```

### webpack.config.js (Line 5)
```javascript
require('dotenv').config();     // ← MUST have this!
```

---

## 📋 Deployment Steps

### 1️⃣ Database Setup (5 min)
```sql
-- Verify tenant exists with correct port
SELECT name, database_port, status FROM platform.tenants WHERE name='fmfb';
-- Expected: database_port = 5433, status = 'active'

-- If port wrong:
UPDATE platform.tenants SET database_port=5433 WHERE name='fmfb';
```

### 2️⃣ Backend Deploy (10 min)
```bash
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25
cd /opt/bankapp

# Build
npm run server:build

# Restart PM2
pm2 restart orokiipay-api

# Verify
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: fmfb" \
  -d '{"email":"admin@fmfb.com","password":"Admin-7-super"}'
```

### 3️⃣ Frontend Deploy (15 min)
```bash
# Local machine
cd /Users/bisiadedokun/bankapp
rm -rf dist/*
NODE_ENV=production npm run web:build

# Verify build
grep -o 'API_BASE_URL:"/api"' dist/main.*.bundle.js | head -1

# Deploy
tar -czf /tmp/frontend-dist.tar.gz -C dist .
scp -i ~/.ssh/orokiipay-bankapp /tmp/frontend-dist.tar.gz bisi.adedokun@34.59.143.25:/tmp/

# Extract on server
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25
cd /opt/bankapp
sudo rm -rf dist/*
sudo tar -xzf /tmp/frontend-dist.tar.gz -C dist/
```

---

## ✅ Verification Checklist

```bash
# Backend
[ ] curl http://localhost:3001/health → HTTP 200
[ ] curl http://localhost:3001/api/theme/fmfb → FMFB branding
[ ] Login API → HTTP 200 with JWT tokens

# Frontend
[ ] https://fmfb-34-59-143-25.nip.io/ → FMFB login page
[ ] Browser Network tab → X-Tenant-ID: fmfb (NOT platform!)
[ ] Login succeeds → Redirects to dashboard
```

---

## 🆘 Common Errors

| Error | Quick Fix |
|-------|-----------|
| "Tenant not found" | Check X-Tenant-ID in browser Network tab. Should be `fmfb`, not `platform`. Rebuild frontend. |
| DB connection refused | `sudo systemctl restart postgresql` |
| Password auth failed | `ALTER USER bisiadedokun WITH PASSWORD 'orokiipay2024';` |
| SSL error | Set `NODE_ENV=development` in .env |
| Wrong database port | `UPDATE platform.tenants SET database_port=5433 WHERE name='fmfb';` |
| Frontend calls localhost:3001 | Add `REACT_APP_API_URL=/api` to .env and rebuild |

---

## 🔍 Debug Commands

```bash
# PM2 Status
pm2 list
pm2 logs orokiipay-api --lines 50

# Check Environment
pm2 env 0 | grep -E "DB_|NODE_ENV|PORT"

# PostgreSQL
PGPASSWORD='orokiipay2024' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform -c "SELECT version();"

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Success Criteria

✅ Backend health check returns HTTP 200
✅ Theme API returns FMFB branding
✅ Login API returns JWT tokens
✅ Frontend shows FMFB logo (navy blue + gold)
✅ Browser login works → Dashboard loads
✅ Network tab shows `X-Tenant-ID: fmfb`

---

## 📞 Emergency Rollback

```bash
# Backend
pm2 stop orokiipay-api
sudo cp /opt/bankapp/.env.backup /opt/bankapp/.env
pm2 start orokiipay-api

# Frontend
sudo tar -xzf /opt/backups/frontend-working-YYYYMMDD.tar.gz -C /opt/bankapp/dist/
sudo systemctl reload nginx
```

---

**💡 Remember:** When in doubt, check [DEPLOYMENT_GUIDE_2025_10_10_WORKING.md](./DEPLOYMENT_GUIDE_2025_10_10_WORKING.md) for detailed explanations!
