#!/bin/bash
# OrokiiPay Banking Platform - One Command Deployment
# Copy and paste this entire script into your GCP instance terminal

set -e

echo "🚀 OrokiiPay One-Command Deployment Starting..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Install PostgreSQL client
echo "🗄️ Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Stop any existing services
echo "🛑 Stopping existing services..."
sudo systemctl stop orokiipay || true
sudo systemctl disable orokiipay || true
pm2 delete orokiipay || true

# Clean up and prepare
echo "🧹 Cleaning up previous installation..."
sudo rm -rf /opt/orokiipay
sudo mkdir -p /opt/orokiipay
sudo chown $USER:$USER /opt/orokiipay
cd /opt/orokiipay

# Create a minimal Node.js application structure for testing
echo "📦 Creating application structure..."
mkdir -p server dist/server
cat > server/index.js << 'APP_EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    application: 'OrokiiPay Banking Platform',
    version: '1.0.0'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    api: 'ready',
    timestamp: new Date().toISOString() 
  });
});

// Basic banking API endpoints (mock for testing)
app.get('/api/accounts', (req, res) => {
  res.json({ message: 'OrokiiPay Banking API - Accounts endpoint ready' });
});

app.get('/api/transactions', (req, res) => {
  res.json({ message: 'OrokiiPay Banking API - Transactions endpoint ready' });
});

// Serve static files (React app)
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all handler: send back React's index.html file
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OrokiiPay Banking Platform</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .status { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 5px 0; border-left: 4px solid #2196F3; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏦 OrokiiPay Banking Platform</h1>
          <p>Secure Multi-Tenant Banking Solution</p>
        </div>
        <div class="status">
          ✅ Application is running successfully!
        </div>
        <h3>Available Endpoints:</h3>
        <div class="endpoint"><strong>GET /health</strong> - Application health check</div>
        <div class="endpoint"><strong>GET /api/health</strong> - API health check</div>
        <div class="endpoint"><strong>GET /api/accounts</strong> - Banking accounts API</div>
        <div class="endpoint"><strong>GET /api/transactions</strong> - Banking transactions API</div>
        <p><strong>Server Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OrokiiPay Banking Platform running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 API Base: http://0.0.0.0:${PORT}/api`);
});
APP_EOF

# Copy to dist directory
cp server/index.js dist/server/index.js

# Create package.json
cat > package.json << 'PKG_EOF'
{
  "name": "orokiipay-banking-platform",
  "version": "1.0.0",
  "description": "OrokiiPay Multi-Tenant Banking Platform",
  "main": "dist/server/index.js",
  "scripts": {
    "start": "node dist/server/index.js",
    "server": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
PKG_EOF

# Install dependencies
echo "📦 Installing application dependencies..."
npm install --production

# Create environment file
echo "⚙️ Creating production environment..."
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=3001
APP_NAME=OrokiiPay Banking Platform
APP_VERSION=1.0.0
STATIC_IP=34.134.124.178
ALLOWED_ORIGINS=http://34.134.124.178,https://34.134.124.178

# Database Configuration - UPDATE WITH YOUR ACTUAL DATABASE DETAILS
DATABASE_URL=postgresql://orokiipay_user:secure_password_123@localhost:5432/orokiipay_production
DB_HOST=localhost
DB_USER=orokiipay_user
DB_PASSWORD=secure_password_123
DB_NAME=orokiipay_production
DB_PORT=5432

# JWT Configuration - UPDATE WITH YOUR SECURE KEYS
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

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/orokiipay/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENV_EOF

# Create log directory
sudo mkdir -p /var/log/orokiipay
sudo chown $USER:$USER /var/log/orokiipay

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECO_EOF'
module.exports = {
  apps: [{
    name: 'orokiipay',
    script: 'dist/server/index.js',
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
ECO_EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/orokiipay << 'NGINX_EOF'
server {
    listen 80;
    server_name 34.134.124.178;

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

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
NGINX_EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/orokiipay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t && sudo systemctl restart nginx

# Start application with PM2
echo "🚀 Starting OrokiiPay with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | sudo bash || true

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001

echo ""
echo "✅ OrokiiPay Banking Platform deployed successfully!"
echo ""
echo "🌐 Application URL: http://34.134.124.178"
echo "🏥 Health Check: http://34.134.124.178/health"
echo "📊 API Health: http://34.134.124.178/api/health"
echo ""
echo "📊 PM2 Status: pm2 status"
echo "📝 PM2 Logs: pm2 logs orokiipay"
echo "🔄 PM2 Restart: pm2 restart orokiipay"
echo ""
echo "🔧 Nginx Status: sudo systemctl status nginx"
echo "📋 Check Application: curl http://localhost:3001/health"