#!/bin/bash
# OrokiiPay Banking Platform - Application Deployment Script
# Deploys the banking app to GCP Compute Engine instance

set -e

echo "🚀 Starting OrokiiPay Application Deployment..."

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

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

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx for reverse proxy
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Create application directory
sudo mkdir -p /opt/orokiipay
sudo chown $USER:$USER /opt/orokiipay
cd /opt/orokiipay

# Clone or copy application code (placeholder for actual deployment)
echo "📁 Setting up application directory..."
echo "# Application code will be deployed here" > README.md

# Create nginx configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/orokiipay << 'EOF'
server {
    listen 80;
    server_name _;

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
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Enable nginx configuration
sudo ln -sf /etc/nginx/sites-available/orokiipay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create systemd service for the application
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/orokiipay.service << 'EOF'
[Unit]
Description=OrokiiPay Banking Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/orokiipay
ExecStart=/usr/bin/docker-compose up
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create docker-compose.yml for production
echo "📋 Creating Docker Compose configuration..."
tee docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://appuser:${DB_PASSWORD}@${DB_HOST}:5432/orokiipay_production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    driver: bridge
EOF

# Create environment file template
echo "📝 Creating environment template..."
tee .env.template << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://appuser:DB_PASSWORD@DB_HOST:5432/orokiipay_production
DB_HOST=10.x.x.x
DB_PASSWORD=GENERATED_PASSWORD

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_HERE

# Banking API Configuration
NIBSS_API_URL=https://api.nibss-plc.com.ng
NIBSS_API_KEY=YOUR_NIBSS_API_KEY
NIBSS_INSTITUTION_CODE=YOUR_INSTITUTION_CODE

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=YOUR_SESSION_SECRET_HERE

# Application Configuration
APP_NAME=OrokiiPay Banking Platform
APP_VERSION=1.0.0
EOF

# Install SSL certificate with Let's Encrypt (Certbot)
echo "🔒 Installing SSL certificate..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "✅ Application deployment setup complete!"
echo ""
echo "📋 Manual Steps Required:"
echo "========================="
echo "1. Copy application code to /opt/orokiipay"
echo "2. Configure environment variables in .env file"
echo "3. Update docker-compose.yml with correct database connection"
echo "4. Run: sudo systemctl enable orokiipay"
echo "5. Run: sudo systemctl start orokiipay"
echo "6. Configure SSL: sudo certbot --nginx -d yourdomain.com"
echo ""
echo "🌐 Application will be available at:"
echo "HTTP: http://YOUR_STATIC_IP"
echo "HTTPS: https://yourdomain.com (after SSL setup)"