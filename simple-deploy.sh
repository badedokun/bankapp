#!/bin/bash
# Simple deployment update script for OrokiiPay
# Updates existing deployment on 34.59.143.25

set -e

SERVER_IP="34.59.143.25"
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"

echo "🚀 Updating OrokiiPay deployment on $SERVER_IP"

# First, let's commit our changes
echo "📝 Committing local changes..."
CURRENT_BRANCH=$(git branch --show-current)
git add -A
git commit -m "fix: Update deployment - $(date +%Y-%m-%d)" || true
git push origin "$CURRENT_BRANCH" || true

# Deploy using git pull on the server
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
set -e

echo "📦 Updating application from GitHub..."

# Check if bankapp directory exists, if not use orokiipay
if [ -d "/opt/bankapp" ]; then
    APP_DIR="/opt/bankapp"
elif [ -d "/opt/orokiipay" ]; then
    APP_DIR="/opt/orokiipay"
else
    echo "❌ Application directory not found!"
    exit 1
fi

cd "$APP_DIR"

# Backup current version
echo "💾 Backing up current version..."
sudo cp -r "$APP_DIR" "${APP_DIR}-backup-$(date +%Y%m%d-%H%M%S)"

# Update from git
echo "🔄 Pulling latest changes..."
git fetch origin

# Stash any local changes (like .env modifications)
echo "💾 Stashing local changes..."
git stash push -m "Auto-stash before deployment $(date +%Y%m%d-%H%M%S)"

# Use the branch from environment or default to feature/enhanced-ai-assistant
BRANCH="${DEPLOY_BRANCH:-feature/enhanced-ai-assistant}"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# CRITICAL: Fix GCP database password (git pull overwrites .env with local config)
echo "🔧 Fixing GCP database password..."
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=orokiipay2024/' .env
echo "✅ Database password updated to GCP production value"

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building server..."
npm run server:build

echo "🌐 Building frontend with FMFB configuration..."
DEFAULT_TENANT=fmfb WHITELISTED_TENANTS=fmfb DEPLOYMENT_TYPE=fmfb_production NODE_ENV=production npm run web:build

# Update database if backup exists
if [ -f "/tmp/bank_app_platform_backup_20250119.sql.gz" ]; then
    echo "🗄️ Restoring database backup..."
    gunzip -c /tmp/bank_app_platform_backup_20250119.sql.gz | psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform || true
fi

# Restart service
echo "🔄 Restarting application..."
if systemctl is-active --quiet orokiipay; then
    sudo systemctl restart orokiipay
    SERVICE_NAME="orokiipay"
elif systemctl is-active --quiet bankapp; then
    sudo systemctl restart bankapp
    SERVICE_NAME="bankapp"
else
    echo "⚠️ No active service found, starting with PM2..."
    # Set NODE_ENV=production for PM2
    pm2 delete bankapp 2>/dev/null || true
    NODE_ENV=production pm2 start npm --name bankapp -- run start:prod
    SERVICE_NAME="pm2"
fi

# Check status
echo "✅ Checking application status..."
if [ "$SERVICE_NAME" = "pm2" ]; then
    pm2 status
else
    sudo systemctl status "$SERVICE_NAME" --no-pager
fi

# Test the application
echo "🧪 Testing application health..."
curl -s http://localhost:3001/health | jq '.' || curl -s http://localhost:3001/health

echo "🎉 Deployment complete!"
echo ""
echo "📋 Access URLs:"
echo "🌐 HTTP: http://34.59.143.25"
echo "🔒 HTTPS: https://fmfb-34-59-143-25.nip.io"
echo "🔒 HTTPS: https://orokii-34-59-143-25.nip.io"
echo ""
echo "📝 To view logs:"
if [ "$SERVICE_NAME" = "pm2" ]; then
    echo "   pm2 logs bankapp"
else
    echo "   sudo journalctl -u $SERVICE_NAME -f"
fi

REMOTE_SCRIPT

echo "✅ Deployment script completed!"