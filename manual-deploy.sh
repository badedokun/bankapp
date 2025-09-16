#!/bin/bash
# OrokiiPay Banking Platform - Manual Deployment Script
# Run this directly on your GCP instance at 35.208.38.157

set -e

echo "🚀 Starting OrokiiPay Banking Platform Manual Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

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

# Download and extract application
echo "📦 Downloading OrokiiPay deployment package..."
curl -L -o /tmp/orokiipay-deployment.tar.gz "http://172.59.209.246:9090/orokiipay-deployment.tar.gz"

echo "📦 Extracting application to /opt/orokiipay..."
cd /opt/orokiipay
tar -xzf /tmp/orokiipay-deployment.tar.gz
chown -R $USER:$USER /opt/orokiipay/

echo "📦 Installing Node.js dependencies..."
npm install --production

# Create production environment file
echo "⚙️ Creating production environment configuration..."
cat > /opt/orokiipay/.env << 'ENV_EOF'
NODE_ENV=production
PORT=3001

# Database Configuration - PLEASE UPDATE WITH YOUR ACTUAL DATABASE DETAILS
DATABASE_URL=postgresql://orokiipay_user:secure_password_123@localhost:5432/orokiipay_production
DB_HOST=localhost
DB_USER=orokiipay_user
DB_PASSWORD=secure_password_123
DB_NAME=orokiipay_production
DB_PORT=5432

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
    server_name 34.134.124.178;

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

# Enable services
echo "🚀 Enabling services..."
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl enable orokiipay

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001

echo "✅ OrokiiPay Banking Platform infrastructure setup completed!"
echo ""
echo "🔧 Next Manual Steps:"
echo "======================"
echo "1. Copy orokiipay-deployment.tar.gz to the server"
echo "2. Extract: cd /opt/orokiipay && tar -xzf orokiipay-deployment.tar.gz"
echo "3. Install dependencies: cd /opt/orokiipay && npm install --production"
echo "4. Start application: sudo systemctl start orokiipay"
echo ""
echo "📊 Check Status:"
echo "sudo systemctl status orokiipay"
echo "sudo journalctl -u orokiipay -f"
echo ""
echo "🌐 Application will be available at: http://34.134.124.178"
echo "🏥 Health Check: http://34.134.124.178/health"