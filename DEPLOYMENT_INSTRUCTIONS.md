# OrokiiPay Banking Platform - Deployment Instructions

## Overview
This guide will help you deploy the OrokiiPay banking platform to your GCP Compute Engine instance at **34.134.124.178** (bankapp-dev).

## Files Ready for Deployment

✅ **orokiipay-deployment.tar.gz** (3.3MB) - Complete production build
✅ **manual-deploy.sh** - Complete setup script for the server
✅ **deploy-to-gcp.sh** - Alternative automated deployment script

## Deployment Options

### Option 1: Manual File Transfer + Script Execution

Since SSH key authentication is not set up, you'll need to use an alternative approach:

#### Step 1: Upload the deployment package to the server
You have several options:

**Option A: Use Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Compute Engine > VM instances
3. Find your instance `bankapp-dev`
4. Click "SSH" to open the browser-based SSH terminal
5. In the SSH terminal, run:
   ```bash
   curl -L -o /tmp/orokiipay-deployment.tar.gz "https://github.com/your-repo/releases/download/v1.0/orokiipay-deployment.tar.gz"
   ```
   (You'll need to upload the file to GitHub releases or another file hosting service first)

**Option B: Use gcloud with file upload**
```bash
# From your local machine
gcloud compute scp orokiipay-deployment.tar.gz bankapp-dev:/tmp/ --zone=us-central1-a --project=orokiipay-bankapp
```

**Option C: Direct copy via Cloud Console File Manager**
1. Use the Google Cloud Console's file manager feature to upload the tar.gz file directly

#### Step 2: Upload and run the deployment script
1. Upload `manual-deploy.sh` to the server using the same method as above
2. Make it executable and run:
   ```bash
   chmod +x manual-deploy.sh
   sudo ./manual-deploy.sh
   ```

### Option 2: Direct Terminal Commands

If you can access the server terminal, run these commands in sequence:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Install nginx
sudo apt-get install -y nginx

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Create application directory
sudo mkdir -p /opt/orokiipay
sudo chown $USER:$USER /opt/orokiipay

# Extract application (assuming you've uploaded the tar.gz to /tmp)
cd /opt/orokiipay
tar -xzf /tmp/orokiipay-deployment.tar.gz
chown -R $USER:$USER /opt/orokiipay/

# Install Node.js dependencies
npm install --production

# Create production environment file
cat > /opt/orokiipay/.env << 'ENV_EOF'
NODE_ENV=production
PORT=3001

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

# Banking API Configuration - UPDATE WITH YOUR ACTUAL NIBSS CREDENTIALS
NIBSS_API_URL=https://api.nibss-plc.com.ng
NIBSS_API_KEY=your-actual-nibss-api-key-here
NIBSS_INSTITUTION_CODE=your-actual-institution-code-here

# Application Configuration
APP_NAME=OrokiiPay Banking Platform
APP_VERSION=1.0.0
STATIC_IP=34.134.124.178

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/orokiipay/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://34.134.124.178,https://34.134.124.178
ENV_EOF

# Create log directory
sudo mkdir -p /var/log/orokiipay
sudo chown $USER:$USER /var/log/orokiipay

# Configure Nginx
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
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl enable orokiipay
sudo systemctl start orokiipay

# Configure firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3001
```

## Post-Deployment Verification

After running the deployment, verify everything is working:

```bash
# Check application status
sudo systemctl status orokiipay

# Check application logs
sudo journalctl -u orokiipay -f

# Check nginx status
sudo systemctl status nginx

# Test the application
curl http://34.134.124.178/health
curl http://34.134.124.178/api/health
```

## Application Access

Once deployed, your OrokiiPay Banking Platform will be accessible at:

- **Main Application**: http://34.134.124.178
- **Health Check**: http://34.134.124.178/health
- **API Base**: http://34.134.124.178/api

## Important Next Steps

1. **Update Environment Variables**: Edit `/opt/orokiipay/.env` with your actual:
   - Database credentials
   - JWT secrets (generate new secure ones)
   - NIBSS API credentials
   - Any other production-specific configurations

2. **Set up SSL Certificate**: Configure HTTPS using Let's Encrypt or your preferred SSL provider

3. **Database Setup**: Configure your production database and update connection details

4. **NIBSS Integration**: Update API credentials and ensure IP whitelisting for 34.134.124.178

5. **Monitor Logs**: Set up log monitoring and alerting

## Troubleshooting

If you encounter issues:

1. **Service won't start**: Check logs with `sudo journalctl -u orokiipay -f`
2. **Port conflicts**: Ensure port 3001 is available
3. **Permission issues**: Ensure proper file ownership in `/opt/orokiipay`
4. **Nginx errors**: Test config with `sudo nginx -t`

## Support

For deployment support, check the application logs and ensure all environment variables are properly configured.