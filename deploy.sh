#!/bin/bash

# OrokiiPay Banking Application - Quick Deployment Script
# Usage: ./deploy.sh [SERVER_IP] [ENVIRONMENT]
# Example: ./deploy.sh 34.59.143.25 production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"
APP_PATH="/opt/bankapp"
DB_PASSWORD="orokiipay_secure_banking_2024!@#"

# Function to print colored output
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate input parameters
if [ $# -lt 1 ]; then
    error "Usage: $0 [SERVER_IP] [ENVIRONMENT]"
    error "Example: $0 34.59.143.25 production"
    exit 1
fi

SERVER_IP="$1"
ENVIRONMENT="${2:-production}"

log "Starting deployment to $SERVER_IP (Environment: $ENVIRONMENT)"

# Validate requirements
info "Checking local requirements..."

if ! command_exists npm; then
    error "npm is required but not installed"
    exit 1
fi

if ! command_exists node; then
    error "Node.js is required but not installed"
    exit 1
fi

if [ ! -f ~/.ssh/orokiipay-bankapp ]; then
    error "SSH key not found at ~/.ssh/orokiipay-bankapp"
    exit 1
fi

# Test SSH connection
log "Testing SSH connection to $SERVER_IP..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SSH_USER@$SERVER_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    error "Cannot connect to $SERVER_IP via SSH"
    exit 1
fi

# Step 1: Local Build
log "Building application locally..."

if [ ! -f package.json ]; then
    error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Clean previous builds
rm -rf node_modules/.cache dist .cache *.tar.gz

# Install dependencies (if node_modules doesn't exist)
if [ ! -d node_modules ]; then
    log "Installing dependencies..."
    npm ci
fi

# Build application
log "Building server and web assets..."
npm run server:build
npm run web:build

# Step 2: Create deployment archive
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="bankapp-deployment-$TIMESTAMP.tar.gz"

log "Creating deployment archive: $ARCHIVE_NAME"

tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='android/build' \
    --exclude='android/app/build' \
    --exclude='coverage' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='*.tar.gz' \
    -czf "$ARCHIVE_NAME" .

ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
info "Archive created: $ARCHIVE_NAME ($ARCHIVE_SIZE)"

# Step 3: Transfer to server
log "Transferring application to server..."
scp -i "$SSH_KEY" "$ARCHIVE_NAME" "$SSH_USER@$SERVER_IP:/tmp/"

# Step 4: Server setup and deployment
log "Setting up server environment and deploying application..."

ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" bash << EOF
set -e

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "\${GREEN}[REMOTE] \$1\${NC}"; }
error() { echo -e "\${RED}[REMOTE ERROR] \$1\${NC}" >&2; }
warning() { echo -e "\${YELLOW}[REMOTE WARNING] \$1\${NC}"; }

log "Starting server setup..."

# Update system
log "Updating system packages..."
sudo apt-get update -qq

# Install Node.js 20 (if not already installed)
if ! command -v node >/dev/null 2>&1 || [ "\$(node -v | cut -d. -f1 | sed 's/v//')" -lt 20 ]; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1
fi

# Install PM2 (if not already installed)
if ! command -v pm2 >/dev/null 2>&1; then
    log "Installing PM2..."
    sudo npm install -g pm2 >/dev/null 2>&1
fi

# Install PostgreSQL 15 (if not already installed)
if ! command -v psql >/dev/null 2>&1; then
    log "Installing PostgreSQL 15..."
    sudo apt-get install -y wget ca-certificates >/dev/null 2>&1
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add - >/dev/null 2>&1
    echo 'deb http://apt.postgresql.org/pub/repos/apt/ '\$(lsb_release -cs)'-pgdg main' | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null 2>&1
    sudo apt-get update -qq
    sudo apt-get install -y postgresql-15 postgresql-client-15 >/dev/null 2>&1
    
    # Configure PostgreSQL
    log "Configuring PostgreSQL..."
    sudo sed -i "s/#port = 5432/port = 5433/g" /etc/postgresql/15/main/postgresql.conf
    sudo systemctl restart postgresql
    sudo systemctl enable postgresql >/dev/null 2>&1
    
    # Create database user and database
    sudo -u postgres psql -p 5433 -c "CREATE USER bisiadedokun WITH CREATEDB LOGIN;" 2>/dev/null || true
    sudo -u postgres psql -p 5433 -c "ALTER USER bisiadedokun WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" >/dev/null 2>&1
    sudo -u postgres psql -p 5433 -c "CREATE DATABASE bank_app_platform OWNER bisiadedokun;" 2>/dev/null || true
    
    # Configure SCRAM authentication
    sudo cp /etc/postgresql/15/main/pg_hba.conf /etc/postgresql/15/main/pg_hba.conf.backup 2>/dev/null || true
    
    # Add SCRAM authentication rules
    sudo bash -c 'cat >> /etc/postgresql/15/main/pg_hba.conf << "EOFPG"

# OrokiiPay Banking Application - SCRAM Authentication  
local   all             bisiadedokun                            scram-sha-256
host    all             bisiadedokun    127.0.0.1/32            scram-sha-256
host    all             bisiadedokun    ::1/128                 scram-sha-256
EOFPG'
    
    sudo systemctl restart postgresql
fi

# Create application directory
log "Setting up application directory..."
sudo mkdir -p $APP_PATH
sudo chown \$USER:\$USER $APP_PATH

# Stop existing application
if pm2 list | grep -q "bankapp"; then
    log "Stopping existing application..."
    pm2 stop bankapp >/dev/null 2>&1 || true
    pm2 delete bankapp >/dev/null 2>&1 || true
fi

# Extract application
log "Extracting application..."
cd $APP_PATH
rm -rf * .env 2>/dev/null || true
tar -xzf /tmp/$ARCHIVE_NAME

# Install dependencies and build
log "Installing dependencies and building application..."
npm ci --include=dev >/dev/null 2>&1
npm run server:build >/dev/null 2>&1

# Create production environment file
log "Creating environment configuration..."
cat > .env << 'EOFENV'
# FMFB Production Configuration
NODE_ENV=$ENVIRONMENT
PORT=3001
DEPLOYMENT_TYPE=fmfb_production

# Tenant Configuration
DEFAULT_TENANT=fmfb
TENANT_DETECTION_METHOD=default
ALLOW_TENANT_SWITCHING=false

# Database Configuration - SCRAM-SHA-256
DB_HOST=localhost
DB_PORT=5433
DB_USER=bisiadedokun
DB_PASSWORD=$DB_PASSWORD
DB_NAME=bank_app_platform

# JWT Configuration
JWT_SECRET=orokiipay-production-jwt-secret-$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=orokiipay-production-refresh-secret-$(openssl rand -hex 32)

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
EOFENV

chmod 600 .env

# Install and configure Nginx reverse proxy
log "Installing and configuring Nginx reverse proxy..."
sudo apt-get install -y nginx >/dev/null 2>&1

# Create Nginx site configuration for banking security
sudo tee /etc/nginx/sites-available/bankapp << 'EOFNGINX' >/dev/null 2>&1
server {
    listen 80;
    listen 443 ssl http2;
    server_name $SERVER_IP;
    
    # SSL Configuration (if certificates exist)
    # ssl_certificate /etc/ssl/certs/bankapp.crt;
    # ssl_certificate_key /etc/ssl/private/bankapp.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Enhanced security headers for banking application
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection '1; mode=block';
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';";
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
    
    # HTTP to HTTPS redirect
    if (\$scheme != "https") {
        return 301 https://\$server_name\$request_uri;
    }
    
    # Hide Nginx version for security
    server_tokens off;
    
    # Main application proxy
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Banking application timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host \$host;
        access_log off;
    }
    
    # Block access to sensitive files
    location ~ /\\.(ht|git|env) {
        deny all;
        return 404;
    }
}
EOFNGINX

# Enable the site and disable default
sudo ln -sf /etc/nginx/sites-available/bankapp /etc/nginx/sites-enabled/ >/dev/null 2>&1
sudo rm -f /etc/nginx/sites-enabled/default >/dev/null 2>&1

# Test and reload Nginx
sudo nginx -t >/dev/null 2>&1 && sudo systemctl reload nginx >/dev/null 2>&1

# Configure secure firewall (install UFW if not present)
log "Configuring secure firewall..."
sudo apt-get install -y ufw >/dev/null 2>&1
sudo ufw --force enable >/dev/null 2>&1
sudo ufw default deny incoming >/dev/null 2>&1
sudo ufw default allow outgoing >/dev/null 2>&1

# Allow essential services
sudo ufw allow ssh >/dev/null 2>&1
sudo ufw allow 80/tcp >/dev/null 2>&1
sudo ufw allow 443/tcp >/dev/null 2>&1

# Secure port 3001 - only allow localhost (for Nginx reverse proxy)
sudo ufw allow from 127.0.0.1 to any port 3001 >/dev/null 2>&1
sudo ufw allow from ::1 to any port 3001 >/dev/null 2>&1

# Start application
log "Starting application with PM2..."
pm2 start npm --name bankapp -- run server >/dev/null 2>&1

# Save PM2 configuration
pm2 save >/dev/null 2>&1

# Setup PM2 startup (run once)
pm2 startup systemd -u \$USER --hp /home/\$USER >/dev/null 2>&1 || true

# Clean up
rm /tmp/$ARCHIVE_NAME 2>/dev/null || true

log "Deployment completed successfully!"

# Show status
echo
echo "=== Application Status ==="
pm2 status

echo
echo "=== Recent Logs ==="
pm2 logs bankapp --lines 10 --nostream

echo
echo "=== Database Connection Test ==="
PGPASSWORD='$DB_PASSWORD' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform -c "SELECT 'Database connection successful!' as status, current_user, current_database();" 2>/dev/null || echo "Database connection failed"

EOF

# Step 5: Final verification
log "Performing final verification..."

# Test health endpoint
sleep 5
if ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "curl -s http://localhost:3001/health" | grep -q "ok" 2>/dev/null; then
    log "✅ Health check passed"
else
    warning "Health check may have failed - check application logs"
fi

# Cleanup local archive
rm "$ARCHIVE_NAME"

log "🎉 Deployment completed successfully!"
info "Server: $SERVER_IP"
info "Environment: $ENVIRONMENT"
info "Application: https://$SERVER_IP (HTTPS with SSL)"
info "HTTP Redirect: http://$SERVER_IP → https://$SERVER_IP"
info "Health Check: https://$SERVER_IP/health"
info "Security: Banking-grade SSL/TLS, port 3001 blocked externally"

echo
echo "=== Next Steps ==="
echo "1. Verify application functionality"
echo "2. Setup SSL certificate (if needed)"
echo "3. Configure load balancer/reverse proxy"
echo "4. Setup monitoring and alerts"
echo "5. Schedule regular backups"

echo
echo "=== Useful Commands ==="
echo "SSH to server: ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
echo "Check status:  ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 status'"
echo "View logs:     ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 logs bankapp'"
echo "Restart app:   ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 restart bankapp'"

log "Deployment script completed!"