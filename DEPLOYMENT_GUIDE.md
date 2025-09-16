# OrokiiPay Banking Application - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the OrokiiPay banking application to production servers. This process includes secure database setup, SCRAM-SHA-256 authentication, and complete application deployment.

## Prerequisites

### Local Requirements
- Node.js 20.19.5+
- npm with latest packages installed
- SSH access to target server
- Private SSH key: `~/.ssh/orokiipay-bankapp`

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum 4GB RAM, 2 CPU cores
- 20GB available disk space
- Root or sudo access

## Deployment Checklist

### Pre-Deployment
- [ ] Confirm target server IP address
- [ ] Verify SSH key access
- [ ] Backup existing database (if applicable)
- [ ] Test local build process
- [ ] Review environment configuration

### Post-Deployment
- [ ] Verify database connectivity
- [ ] Test application health endpoints
- [ ] Confirm SSL certificates (if applicable)
- [ ] Monitor application logs
- [ ] Update DNS/load balancer (if applicable)

## Step-by-Step Deployment Process

### 1. Server Connection Setup

```bash
# Test SSH connection
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP]

# Verify server specifications
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  echo 'OS Version:' && cat /etc/os-release | grep PRETTY_NAME
  echo 'Memory:' && free -h
  echo 'Disk Space:' && df -h
  echo 'CPU Info:' && nproc
"
```

### 2. Local Application Build

```bash
# Navigate to project directory
cd /Users/bisiadedokun/bankapp

# Clean previous builds
rm -rf node_modules/.cache dist .cache

# Install dependencies and build
npm ci
npm run server:build
npm run web:build

# Verify build artifacts
ls -la dist/
```

### 3. Create Deployment Archive

```bash
# Create deployment package
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='android/build' \
    --exclude='android/app/build' \
    --exclude='coverage' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    -czf bankapp-deployment-$(date +%Y%m%d-%H%M%S).tar.gz .

# Verify archive
ls -lh bankapp-deployment-*.tar.gz
```

### 4. Server Environment Setup

```bash
# Transfer deployment archive
scp -i ~/.ssh/orokiipay-bankapp bankapp-deployment-*.tar.gz bisi.adedokun@[SERVER_IP]:/tmp/

# Create application directory and setup environment
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  # Update system packages
  sudo apt-get update
  
  # Install Node.js 20
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # Install PM2 for process management
  sudo npm install -g pm2
  
  # Install PostgreSQL 15
  sudo apt-get install -y wget ca-certificates
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  echo 'deb http://apt.postgresql.org/pub/repos/apt/ \$(lsb_release -cs)-pgdg main' | sudo tee /etc/apt/sources.list.d/pgdg.list
  sudo apt-get update
  sudo apt-get install -y postgresql-15 postgresql-client-15
  
  # Create application directory
  sudo mkdir -p /opt/bankapp
  sudo chown \$USER:\$USER /opt/bankapp
"
```

### 5. Application Installation

```bash
# Extract and install application
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  cd /opt/bankapp
  tar -xzf /tmp/bankapp-deployment-*.tar.gz
  
  # Install production dependencies
  npm ci --include=dev
  npm run server:build
  
  # Clean up
  rm /tmp/bankapp-deployment-*.tar.gz
"
```

### 6. PostgreSQL Security Configuration

```bash
# Configure PostgreSQL with SCRAM-SHA-256 authentication
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  # Configure PostgreSQL port
  sudo sed -i \"s/#port = 5432/port = 5433/g\" /etc/postgresql/15/main/postgresql.conf
  
  # Enable SCRAM-SHA-256 password encryption
  sudo -u postgres psql -p 5433 -c \"ALTER SYSTEM SET password_encryption = 'scram-sha-256';\"
  sudo -u postgres psql -p 5433 -c \"SELECT pg_reload_conf();\"
  
  # Create database user with secure password
  sudo -u postgres psql -p 5433 -c \"CREATE USER bisiadedokun WITH CREATEDB LOGIN;\"
  sudo -u postgres psql -p 5433 -c \"ALTER USER bisiadedokun WITH ENCRYPTED PASSWORD 'orokiipay_secure_banking_2024!@#';\"
  
  # Create database
  sudo -u postgres psql -p 5433 -c \"CREATE DATABASE bank_app_platform OWNER bisiadedokun;\"
  
  # Configure SCRAM authentication
  sudo cp /etc/postgresql/15/main/pg_hba.conf /etc/postgresql/15/main/pg_hba.conf.backup
  
  # Update authentication method to SCRAM-SHA-256
  sudo bash -c \"cat >> /etc/postgresql/15/main/pg_hba.conf << EOF

# OrokiiPay Banking Application - SCRAM Authentication
local   all             bisiadedokun                            scram-sha-256
host    all             bisiadedokun    127.0.0.1/32            scram-sha-256
host    all             bisiadedokun    ::1/128                 scram-sha-256
EOF\"
  
  # Restart PostgreSQL
  sudo systemctl restart postgresql
  sudo systemctl enable postgresql
"
```

### 7. Database Migration

```bash
# Create fresh database backup from source (if applicable)
# Replace SOURCE_SERVER_IP with your source database server
pg_dump -h [SOURCE_SERVER_IP] -p 5433 -U bisiadedokun -d bank_app_platform > /tmp/bank_app_platform_backup_$(date +%Y%m%d_%H%M%S).sql

# Transfer backup to new server
scp -i ~/.ssh/orokiipay-bankapp /tmp/bank_app_platform_backup_*.sql bisi.adedokun@[SERVER_IP]:/tmp/

# Restore database on new server
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform < /tmp/bank_app_platform_backup_*.sql
  
  # Verify restoration
  PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform -c '\dt'
"
```

### 8. Application Configuration

```bash
# Create production environment file
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  cd /opt/bankapp
  cat > .env << 'EOF'
# FMFB Production Configuration
NODE_ENV=production
PORT=3001
DEPLOYMENT_TYPE=fmfb_production

# Tenant Configuration - FMFB Only
DEFAULT_TENANT=fmfb
TENANT_DETECTION_METHOD=default
ALLOW_TENANT_SWITCHING=false

# Database Configuration - SCRAM-SHA-256 Secured
DB_HOST=localhost
DB_PORT=5433
DB_USER=bisiadedokun
DB_PASSWORD=orokiipay_secure_banking_2024!@#
DB_NAME=bank_app_platform

# JWT Configuration
JWT_SECRET=orokiipay-super-secret-jwt-key-for-production-change-this-to-secure-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=orokiipay-refresh-token-secret-for-production-change-this-too

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# CORS Configuration
ALLOWED_ORIGINS=https://[YOUR_DOMAIN],https://www.[YOUR_DOMAIN]

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
EOF

  # Set secure file permissions
  chmod 600 .env
"
```

### 9. Application Startup

```bash
# Start application with PM2
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  cd /opt/bankapp
  
  # Start application
  pm2 start npm --name bankapp -- run server
  
  # Save PM2 configuration
  pm2 save
  
  # Setup PM2 startup script
  pm2 startup systemd -u \$USER --hp /home/\$USER
  
  # Verify application status
  pm2 status
  pm2 logs bankapp --lines 20
"
```

### 10. Firewall and Security Setup

```bash
# Configure UFW firewall
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  sudo ufw --force enable
  sudo ufw allow ssh
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 3001/tcp
  
  # Show firewall status
  sudo ufw status verbose
"
```

### 11. Health Check and Verification

```bash
# Test database connectivity
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform -c 'SELECT current_user, current_database(), version();'
"

# Test application health endpoint
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  curl -s http://localhost:3001/health | jq '.'
"

# Check application logs
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP] "
  pm2 logs bankapp --lines 10
"
```

## Troubleshooting Guide

### Common Issues

#### 1. Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify port configuration
sudo netstat -tlnp | grep 5433

# Test manual connection
PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform
```

#### 2. Application Startup Issues
```bash
# Check PM2 logs
pm2 logs bankapp

# Restart application
pm2 restart bankapp

# Check environment variables
pm2 env 0
```

#### 3. Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/bankapp

# Check file permissions
ls -la /opt/bankapp/.env
```

## Security Checklist

### Database Security
- [ ] SCRAM-SHA-256 authentication enabled
- [ ] Strong password set for database user
- [ ] Trust authentication disabled
- [ ] PostgreSQL running on non-standard port (5433)
- [ ] Database backups secured

### Application Security
- [ ] Environment variables secured (600 permissions)
- [ ] JWT secrets changed from defaults
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Firewall rules active

### Server Security
- [ ] System packages updated
- [ ] SSH key-based authentication
- [ ] Firewall configured and active
- [ ] Application running as non-root user
- [ ] Log monitoring enabled

## Maintenance Commands

### Regular Maintenance
```bash
# Check application status
pm2 status

# View recent logs
pm2 logs bankapp --lines 50

# Restart application
pm2 restart bankapp

# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Check disk space
df -h

# Monitor database connections
PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

### Database Backup
```bash
# Create database backup
PGPASSWORD='orokiipay_secure_banking_2024!@#' pg_dump -h localhost -p 5433 -U bisiadedokun -d bank_app_platform > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /tmp/backup_*.sql

# Transfer backup to secure location
scp /tmp/backup_*.sql.gz user@backup-server:/backups/
```

## Environment-Specific Configurations

### Development
- NODE_ENV=development
- LOG_LEVEL=debug
- Detailed error messages enabled

### Staging
- NODE_ENV=staging
- LOG_LEVEL=info
- Similar to production but with test data

### Production
- NODE_ENV=production
- LOG_LEVEL=warn
- Error details hidden from client
- All security measures active

## Quick Reference

### Server Details Template
```
Server IP: [SERVER_IP]
SSH Key: ~/.ssh/orokiipay-bankapp
SSH User: bisi.adedokun
Application Path: /opt/bankapp
Database Port: 5433
Application Port: 3001
PM2 Process: bankapp
```

### Important File Locations
- Application: `/opt/bankapp/`
- Environment: `/opt/bankapp/.env`
- PostgreSQL Config: `/etc/postgresql/15/main/`
- PM2 Logs: `~/.pm2/logs/`
- System Logs: `/var/log/`

### Key Commands
```bash
# SSH to server
ssh -i ~/.ssh/orokiipay-bankapp bisi.adedokun@[SERVER_IP]

# Check app status
pm2 status

# View logs
pm2 logs bankapp

# Restart app
pm2 restart bankapp

# Database connection
PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d bank_app_platform
```

---

**Note**: Replace `[SERVER_IP]` with the actual server IP address and update passwords/secrets for each deployment environment.

**Last Updated**: $(date +"%Y-%m-%d")
**Version**: 1.0.0