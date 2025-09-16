#!/bin/bash
# OrokiiPay Banking Platform - Quick PM2 Deployment
# Run this single script on your server for instant deployment

set -e

echo "🚀 OrokiiPay Quick Deploy Starting..."

# Install PM2 globally
sudo npm install -g pm2

# Stop any existing services
sudo systemctl stop orokiipay || true
sudo systemctl disable orokiipay || true

# Clean up and prepare
sudo rm -rf /opt/orokiipay
sudo mkdir -p /opt/orokiipay
cd /opt/orokiipay

# Download and extract application
echo "📦 Downloading application..."
curl -L -o orokiipay-deployment.tar.gz "https://github.com/your-repo/releases/download/latest/orokiipay-deployment.tar.gz"
tar -xzf orokiipay-deployment.tar.gz

# Install dependencies
npm install --production

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://orokiipay_user:secure_password_123@localhost:5432/orokiipay_production
APP_NAME=OrokiiPay Banking Platform
STATIC_IP=34.134.124.178
JWT_SECRET=orokiipay-super-secure-jwt-secret-key-minimum-32-characters-for-production-use-2024
ALLOWED_ORIGINS=http://34.134.124.178,https://34.134.124.178
EOF

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'orokiipay',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/orokiipay/error.log',
    out_file: '/var/log/orokiipay/out.log',
    log_file: '/var/log/orokiipay/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/orokiipay
sudo chown -R $USER:$USER /var/log/orokiipay

# Configure Nginx (simple version)
sudo tee /etc/nginx/sites-available/orokiipay << 'EOF'
server {
    listen 80;
    server_name 34.134.124.178;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/orokiipay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ OrokiiPay Banking Platform deployed successfully!"
echo "🌐 Application URL: http://34.134.124.178"
echo "📊 PM2 Status: pm2 status"
echo "📝 Logs: pm2 logs orokiipay"