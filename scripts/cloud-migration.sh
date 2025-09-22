#!/bin/bash
# Complete Cloud Migration Script for Phase 2 AI Deployment
# Migrates database schema and data to cloud server

set -e

SERVER_IP="34.59.143.25"
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"

echo "🚀 Starting Phase 2 AI Cloud Migration to $SERVER_IP"

# Step 1: Create comprehensive database backup
echo "📦 Creating local database backup..."
BACKUP_DIR="./scripts/database/backups"
mkdir -p "$BACKUP_DIR"

# Backup with data
PGPASSWORD="orokiipay_secure_banking_2024!@#" pg_dump \
  -h localhost -p 5433 -U bisiadedokun \
  -d bank_app_platform \
  --clean --create --if-exists \
  > "$BACKUP_DIR/cloud-migration-platform-$(date +%Y%m%d-%H%M%S).sql"

PGPASSWORD="orokiipay_secure_banking_2024!@#" pg_dump \
  -h localhost -p 5433 -U bisiadedokun \
  -d tenant_fmfb_db \
  --clean --create --if-exists \
  > "$BACKUP_DIR/cloud-migration-tenant-$(date +%Y%m%d-%H%M%S).sql"

echo "✅ Database backups created"

# Step 2: Upload files to cloud server
echo "📤 Uploading migration files to cloud server..."
scp -i "$SSH_KEY" -r "$BACKUP_DIR" "$SSH_USER@$SERVER_IP:/tmp/"
scp -i "$SSH_KEY" -r "./scripts/database/migrations" "$SSH_USER@$SERVER_IP:/tmp/"

# Step 3: Execute migration on cloud server
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
set -e

echo "🗄️ Starting database migration on cloud server..."

# Set database connection details
export PGPASSWORD="orokiipay_secure_banking_2024!@#"
DB_HOST="localhost"
DB_PORT="5433"
DB_USER="bisiadedokun"

# Find the most recent backup files
PLATFORM_BACKUP=$(ls -t /tmp/backups/cloud-migration-platform-*.sql | head -1)
TENANT_BACKUP=$(ls -t /tmp/backups/cloud-migration-tenant-*.sql | head -1)

echo "📋 Migrating platform database..."
if [ -f "$PLATFORM_BACKUP" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -f "$PLATFORM_BACKUP"
    echo "✅ Platform database migrated"
else
    echo "❌ Platform backup not found"
fi

echo "📋 Migrating tenant database..."
if [ -f "$TENANT_BACKUP" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -f "$TENANT_BACKUP"
    echo "✅ Tenant database migrated"
else
    echo "❌ Tenant backup not found"
fi

# Verify database structure
echo "🔍 Verifying database migration..."
echo "Platform tables:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d bank_app_platform -c "\dt tenant.*" || true

echo "Tenant tables:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d tenant_fmfb_db -c "\dt tenant.*" || true

# Test FMFB user exists
echo "👤 Verifying FMFB admin user..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d tenant_fmfb_db -c "SELECT id, email FROM tenant.users WHERE email = 'admin@fmfb.com';" || true

echo "✅ Database migration verification complete"
REMOTE_SCRIPT

echo "🎉 Cloud database migration completed!"
echo ""
echo "📋 Next steps:"
echo "1. Restart cloud application services"
echo "2. Test API endpoints"
echo "3. Verify AI features are working"