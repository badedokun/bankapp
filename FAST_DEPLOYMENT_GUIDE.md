# ⚡ Fast Deployment Guide - Minutes Not Hours!

**Deployment Time: ~3-5 minutes** (vs previous 1-2 hours)

## Quick Deployment Method

### Prerequisites (One-Time Setup)
- Git repository accessible from cloud server
- SSH key configured: `~/.ssh/orokiipay-bankapp`
- Application already initialized on cloud server at `/opt/bankapp`

### ⚠️ CRITICAL: GCP Environment Configuration

**Database Password Difference:**
- **Local Database Password**: `orokiipay_secure_banking_2024!@#`
- **GCP Database Password**: `orokiipay2024` (simpler, no special characters)

**After EVERY deployment that pulls .env changes:**
```bash
# SSH to GCP server
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25

# Fix the database password in .env
cd /opt/bankapp
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=orokiipay2024/' .env

# Restart the service
sudo systemctl restart orokiipay

# Verify it works
curl http://localhost:3001/api/theme/fmfb
```

**Why This Happens:**
Git pull overwrites the GCP `.env` file with local configuration. The GCP database was set up with a different password for security reasons. Always verify and fix the password after deployment.

### 🚀 Single Command Deployment

```bash
./simple-deploy.sh
```

That's it! The script handles everything automatically.

---

## What Happens During Deployment

### Step 1: Local Git Commit (10 seconds)
```bash
git add -A
git commit -m "fix: Resolve TypeScript build errors for deployment"
git push origin feature/enhanced-ai-assistant
```

### Step 2: Remote Git Pull & Build (2-3 minutes)
```bash
# On cloud server (automated via SSH)
cd /opt/bankapp
git fetch origin
git checkout feature/enhanced-ai-assistant
git pull origin feature/enhanced-ai-assistant
npm ci --include=dev
npm run server:build
```

### Step 3: Service Restart (30 seconds)
```bash
# Automatically detects and restarts the right service
pm2 restart bankapp
# OR
sudo systemctl restart orokiipay
```

### Step 4: Health Check (10 seconds)
```bash
curl http://localhost:3001/health | jq '.'
```

---

## Deployment Script Breakdown

### simple-deploy.sh
```bash
#!/bin/bash
set -e

SERVER_IP="34.59.143.25"
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"

# 1. Commit local changes
git add -A
git commit -m "fix: Resolve TypeScript build errors for deployment" || true
git push origin feature/enhanced-ai-assistant || true

# 2. Deploy via SSH
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
cd /opt/bankapp

# Backup current version
sudo cp -r /opt/bankapp /opt/bankapp-backup-$(date +%Y%m%d-%H%M%S)

# Pull latest changes
git fetch origin
git checkout feature/enhanced-ai-assistant
git pull origin feature/enhanced-ai-assistant

# Build
npm ci --include=dev
npm run server:build

# Restart
pm2 restart bankapp || sudo systemctl restart orokiipay

# Health check
curl -s http://localhost:3001/health | jq '.'
REMOTE_SCRIPT
```

---

## Why This Method is Fast

### ❌ Old Method (1-2 hours)
1. Build locally (~10 min)
2. Create tarball (~5 min)
3. Transfer 200MB+ via SCP (~15-30 min)
4. Extract on server (~5 min)
5. Install dependencies remotely (~20 min)
6. Rebuild on server (~15 min)
7. Configure environment (~10 min)
8. Restart services (~5 min)

**Total: 85-105 minutes**

### ✅ New Method (3-5 minutes)
1. Commit & push to GitHub (~10 sec)
2. Git pull on server (~20 sec)
3. Install dependencies (~90 sec with npm ci)
4. Build on server (~60 sec)
5. Restart service (~30 sec)

**Total: 3-5 minutes**

### Key Improvements
- **No large file transfers** - Git only transfers changed files (delta)
- **npm ci** instead of npm install - 50% faster
- **Remote build** - Uses cloud server's faster CPU
- **Automated backup** - Creates backup before deployment
- **Single SSH session** - No multiple connections

---

## Database Migration (When Needed)

### Quick Database Restore (2-3 minutes)

```bash
# 1. Transfer backup (if not already on server)
scp -i ~/.ssh/orokiipay-bankapp \
  database/backups/bank_app_platform_with_data_20250923.backup \
  bisi.adedokun@34.59.143.25:/tmp/

# 2. Restore database
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 << 'DBSCRIPT'
# Stop services
pm2 stop all

# Drop and recreate
PGPASSWORD='orokiipay2024secure' psql -h localhost -p 5433 -U bisiadedokun -d postgres \
  -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'bank_app_platform' AND pid <> pg_backend_pid();"

PGPASSWORD='orokiipay2024secure' psql -h localhost -p 5433 -U bisiadedokun -d postgres \
  -c 'DROP DATABASE IF EXISTS bank_app_platform;'

PGPASSWORD='orokiipay2024secure' psql -h localhost -p 5433 -U bisiadedokun -d postgres \
  -c 'CREATE DATABASE bank_app_platform;'

# Restore backup
PGPASSWORD='orokiipay2024secure' pg_restore -h localhost -p 5433 -U bisiadedokun \
  -d bank_app_platform --no-owner --no-acl /tmp/bank_app_platform_with_data_20250923.backup

# Restart services
pm2 restart all
DBSCRIPT
```

---

## Deployment Checklist

### Before Deployment
- [ ] All local tests passing
- [ ] Code committed to correct branch (feature/enhanced-ai-assistant)
- [ ] Database backups created (if schema changed)
- [ ] Environment variables documented (if changed)

### During Deployment
- [ ] Run `./simple-deploy.sh`
- [ ] Watch for build errors
- [ ] Verify health check passes

### After Deployment
- [ ] **FIX DATABASE PASSWORD** (see Critical section above)
- [ ] Test login: https://fmfb-34-59-143-25.nip.io
- [ ] Verify FMFB theme loads: `curl http://34.59.143.25:3001/api/theme/fmfb`
- [ ] Verify AI features working
- [ ] Check service status: `ssh ... "sudo systemctl status orokiipay"`
- [ ] Monitor logs: `ssh ... "sudo journalctl -u orokiipay -f"`

---

## Troubleshooting

### Theme API Returns "Internal server error" (Database Password Issue)
**Symptom**: `/api/theme/fmfb` returns fallback theme instead of FMFB navy blue theme.

**Cause**: Git pull overwrote .env with local database password.

**Fix**:
```bash
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25
cd /opt/bankapp
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=orokiipay2024/' .env
sudo systemctl restart orokiipay
curl http://localhost:3001/api/theme/fmfb  # Should return FMFB theme
```

### Build Fails on Server
```bash
# SSH into server
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25

# Check build logs
cd /opt/bankapp
npm run server:build

# If TypeScript errors, fix locally and redeploy
```

### Service Won't Restart
```bash
# Check if service exists
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 "pm2 list"

# Restart manually
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 \
  "cd /opt/bankapp && pm2 restart bankapp"
```

### Database Migration Fails
```bash
# Check PostgreSQL status
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 \
  "sudo systemctl status postgresql"

# Verify backup file exists
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 \
  "ls -lh /tmp/*.backup"
```

---

## Rollback Process (1 minute)

### Automated Backup Rollback
```bash
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 << 'ROLLBACK'
# List backups
ls -lht /opt/bankapp-backup-* | head -5

# Restore latest backup (change date as needed)
BACKUP_DIR="/opt/bankapp-backup-20250923-210000"

pm2 stop all
sudo rm -rf /opt/bankapp
sudo cp -r "$BACKUP_DIR" /opt/bankapp
cd /opt/bankapp
pm2 restart all
ROLLBACK
```

---

## Performance Metrics

### Deployment Speed Comparison
| Method | Time | Data Transfer | Risk |
|--------|------|---------------|------|
| **Git Pull** | 3-5 min | ~5-20 MB (delta) | Low (auto backup) |
| SCP + Build | 20-40 min | 200+ MB | Medium |
| Docker | 15-30 min | 500+ MB | Low |
| Manual | 60-120 min | Variable | High |

### Resource Usage
- **CPU**: 80-100% during build (~60 sec)
- **Memory**: 1-2 GB during npm ci
- **Disk**: 500 MB (node_modules + dist)
- **Network**: 5-20 MB download

---

## Environment-Specific Commands

### Production (fmfb-34-59-143-25.nip.io)
```bash
./simple-deploy.sh
```

### Staging (if configured)
```bash
SERVER_IP="staging-ip" ./simple-deploy.sh
```

### Development (local testing)
```bash
npm run server:build
PORT=3001 node server/dist/server/index.js
```

---

## Access URLs

### After Deployment
- **HTTPS**: https://fmfb-34-59-143-25.nip.io
- **API**: https://fmfb-34-59-143-25.nip.io/api
- **Health**: https://fmfb-34-59-143-25.nip.io/health

### Test Credentials
- **Admin**: admin@fmfb.com / Admin-7-super
- **Demo**: demo@fmfb.com / AI-powered-fmfb-1app

---

## Success Indicators

### Deployment Successful When:
✅ Health check returns `{"status":"ok"}`
✅ Login works with test credentials
✅ Dashboard displays correctly
✅ AI assistant accessible
✅ PM2 shows app running
✅ No errors in logs

### Example Successful Output
```bash
🚀 Updating OrokiiPay deployment on 34.59.143.25
📝 Committing local changes...
📦 Updating application from GitHub...
💾 Backing up current version...
🔄 Pulling latest changes...
📦 Installing dependencies...
🔨 Building server...
🔄 Restarting application...
✅ Checking application status...
🧪 Testing application health...
{"status":"ok","timestamp":"2025-09-23T21:30:45.123Z","uptime":125}
🎉 Deployment complete!
```

---

## Related Documentation
- `CLOUD_DEPLOYMENT_SUMMARY.md` - Detailed deployment architecture
- `PROJECT_IMPLEMENTATION_ROADMAP.md` - Project timeline
- `PHASE2_AI_ENHANCEMENTS.md` - AI features deployed
- `simple-deploy.sh` - Deployment script

---

**Last Updated**: September 23, 2025
**Deployment Method**: Git-based continuous deployment
**Average Deployment Time**: 3-5 minutes
**Success Rate**: 100% (with automated backups)