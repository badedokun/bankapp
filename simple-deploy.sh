#!/bin/bash

# Simple Banking Application Deployment Script
# For new server: 34.59.143.25

set -e

echo "🚀 Starting Banking Application Deployment..."

# Configuration
SERVER_IP="34.59.143.25"
SSH_KEY="~/.ssh/orokiipay-bankapp"
SSH_USER="bisi.adedokun"

# Step 1: Build application locally
echo "📦 Building application locally..."
npm run server:build
npm run web:build

# Step 2: Create deployment archive
echo "📦 Creating deployment archive..."
tar --exclude='node_modules' --exclude='.git' --exclude='android/build' \
    --exclude='android/app/build' --exclude='coverage' --exclude='*.log' \
    -czf bankapp-deployment.tar.gz .

echo "📦 Transferring application to server..."
scp -i "$SSH_KEY" bankapp-deployment.tar.gz "$SSH_USER@$SERVER_IP:/tmp/"

# Step 3: Create remote setup script
echo "🔧 Creating remote setup script..."
cat > remote-setup.sh << 'REMOTE_EOF'
#!/bin/bash
set -e

echo "🚀 Setting up Banking Application on server..."

# Update system
sudo apt-get update

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Install nginx
sudo apt-get install -y nginx

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/bankapp
sudo chown $USER:$USER /opt/bankapp

# Extract application
echo "📦 Extracting application..."
cd /opt/bankapp
tar -xzf /tmp/bankapp-deployment.tar.gz

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Create environment file
echo "⚙️ Creating environment file..."
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=3001

# Database Configuration - UPDATE WITH YOUR ACTUAL DATABASE DETAILS
DB_HOST=localhost
DB_USER=bankapp_user
DB_PASSWORD=secure_password_here
DB_NAME=bank_app_platform
DB_PORT=5432

# JWT Configuration - UPDATE WITH YOUR SECURE KEYS
JWT_SECRET=your-super-secure-jwt-secret-change-this-to-something-very-long-and-random
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too

# Banking API Configuration
NIBSS_API_URL=https://api.nibss.com
FRAUD_DETECTION_API_URL=https://fraud-api.example.com

# Application Configuration
LOG_LEVEL=info
ENV_EOF

# Create PM2 configuration
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
module.exports = {
  apps: [{
    name: 'bankapp',
    script: 'dist/server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
ECOSYSTEM_EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bankapp << 'NGINX_EOF'
server {
    listen 80;
    server_name 34.59.143.25;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

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
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bankapp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001

# Start services
echo "🚀 Starting services..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

echo "✅ Banking Application deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "🌐 Application URL: http://34.59.143.25"
echo "🏥 Health Check: http://34.59.143.25/health"
echo "📊 API Base: http://34.59.143.25/api"
echo ""
echo "🔧 Service Management:"
echo "pm2 status                    # Check app status"
echo "pm2 restart bankapp          # Restart app"
echo "pm2 logs bankapp             # View app logs"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Update database credentials in /opt/bankapp/.env"
echo "2. Update NIBSS API credentials in /opt/bankapp/.env"
echo "3. Set up SSL certificate for HTTPS"
echo "4. Configure your actual database"
echo "5. Test all banking functionality"

REMOTE_EOF

# Step 4: Transfer and execute setup script
echo "🚀 Transferring and executing setup script..."
scp -i "$SSH_KEY" remote-setup.sh "$SSH_USER@$SERVER_IP:/tmp/"
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "chmod +x /tmp/remote-setup.sh && /tmp/remote-setup.sh"

# Cleanup
rm -f bankapp-deployment.tar.gz remote-setup.sh

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your Banking Application is now accessible at:"
echo "   http://34.59.143.25"
echo ""
echo "🔧 To check the application status:"
echo "   ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 'pm2 status'"
echo ""
echo "📝 To view logs:"
echo "   ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@34.59.143.25 'pm2 logs bankapp'"