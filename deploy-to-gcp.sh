#!/bin/bash
# OrokiiPay Banking Platform - Complete GCP Deployment Script
# For new server: 34.59.143.25

set -e

echo "🚀 Starting OrokiiPay Banking Platform Deployment to new server..."

# Configuration
SERVER_IP="34.59.143.25"
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"

# Step 1: Prepare and transfer application
echo "📦 Preparing application for deployment..."
# Create deployment archive
tar --exclude='node_modules' --exclude='.git' --exclude='android/build' \
    --exclude='android/app/build' --exclude='coverage' --exclude='*.log' \
    -czf orokiipay-deployment.tar.gz .

echo "📦 Transferring application to server..."
scp -i "$SSH_KEY" orokiipay-deployment.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"

# Step 2: Create and execute remote deployment script
echo "🔧 Creating remote deployment script..."
cat > deploy-remote.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Setting up OrokiiPay on GCP instance..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20 (required by package.json)
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (using Docker's official installation script for better compatibility)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Install PostgreSQL client
echo "🗄️ Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/orokiipay
sudo chown $USER:$USER /opt/orokiipay

# Extract application
echo "📦 Extracting application..."
cd /opt/orokiipay
sudo tar -xzf /tmp/orokiipay-deployment.tar.gz -C /opt/orokiipay/
sudo chown -R $USER:$USER /opt/orokiipay/

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install --production

# Create production environment file
echo "⚙️ Creating FMFB production environment configuration..."
cat > /opt/orokiipay/.env << 'ENV_EOF'
# FMFB Production Configuration
NODE_ENV=production
PORT=3001
DEPLOYMENT_TYPE=fmfb_production

# Tenant Configuration - FMFB Only (Auto-configured via deployment type)
DEFAULT_TENANT=fmfb
TENANT_DETECTION_METHOD=default
ALLOW_TENANT_SWITCHING=false

# Database Configuration - SCRAM-SHA-256 Secured
DB_HOST=localhost
DB_PORT=5433
DB_USER=bisiadedokun
DB_PASSWORD=orokiipay_secure_banking_2024!@#
DB_NAME=bank_app_platform

# JWT Configuration - PLEASE UPDATE WITH YOUR SECURE KEYS
JWT_SECRET=orokiipay-super-secure-jwt-secret-key-minimum-32-characters-for-production-use-2024
REFRESH_TOKEN_SECRET=orokiipay-refresh-token-secret-key-different-from-jwt-secret-2024

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=orokiipay-session-secret-key-for-express-sessions-2024

# NIBSS API Configuration - FirstMidas Microfinance Bank Limited
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
NIBSS_API_KEY=o1rjrqtLdaZou7PQApzXQVHygLqEnoWi
NIBSS_CLIENT_ID=d86e0fe1-2468-4490-96bb-588e32af9a89
NIBSS_CLIENT_SECRET='~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa'
NIBSS_RESET_URL=https://apitest.nibss-plc.com.ng/v2/reset
NIBSS_ENVIRONMENT=sandbox
NIBSS_APP_NAME=NIP_MINI_SERVICE

# Application Configuration
APP_NAME=OrokiiPay Banking Platform
APP_VERSION=1.0.0
STATIC_IP=34.59.143.25

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/orokiipay/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://34.59.143.25,https://34.59.143.25
ENV_EOF

# Create log directory
sudo mkdir -p /var/log/orokiipay
sudo chown $USER:$USER /var/log/orokiipay

# Configure Nginx
echo "🌐 Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/orokiipay << 'NGINX_EOF'
server {
    listen 80;
    server_name 34.59.143.25;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /opt/orokiipay/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/orokiipay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/orokiipay.service << 'SERVICE_EOF'
[Unit]
Description=OrokiiPay Banking Platform
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/orokiipay
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/orokiipay /var/log/orokiipay

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
echo "🚀 Starting services..."
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl enable orokiipay
sudo systemctl start orokiipay

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001

echo "✅ FMFB Banking Platform deployment completed!"
echo ""
echo "📋 FMFB Deployment Summary:"
echo "=========================="
echo "🏦 Bank: First Midas Microfinance Bank (FMFB)"
echo "🌐 Application URL: http://34.59.143.25"
echo "🏥 Health Check: http://34.59.143.25/health"
echo "📊 API Base: http://34.59.143.25/api"
echo "🎯 Tenant: FMFB Production (auto-configured)"
echo ""
echo "🔧 Service Management:"
echo "sudo systemctl status orokiipay    # Check app status"
echo "sudo systemctl restart orokiipay   # Restart app"
echo "sudo journalctl -u orokiipay -f    # View app logs"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Update database credentials in /opt/orokiipay/.env"
echo "2. Update NIBSS API credentials in /opt/orokiipay/.env"
echo "3. Set up SSL certificate for HTTPS"
echo "4. Configure your actual database"
echo "5. Test all banking functionality"
echo ""
echo "📞 NIBSS Whitelisting IP: 34.59.143.25"

REMOTE_SCRIPT

# Step 3: Transfer and execute the remote script
echo "🚀 Transferring and executing deployment script on remote server..."
scp -i "$SSH_KEY" deploy-remote.sh "$SSH_USER@$SERVER_IP:/tmp/"
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

echo "✅ FMFB deployment completed successfully!"
echo ""
echo "🏦 Your FMFB Banking Platform is now accessible at:"
echo "   http://34.59.143.25"
echo ""
echo "🎯 Deployed with FMFB tenant configuration:"
echo "   - Automatic FMFB branding and logos"
echo "   - Time-based personalized greetings"
echo "   - FMFB-specific banking features"
echo ""
echo "🔧 To check the deployment status:"
echo "   ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 'sudo systemctl status orokiipay'"
echo ""
echo "📝 To view logs:"
echo "   ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 'sudo journalctl -u orokiipay -f'"