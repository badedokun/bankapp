# OrokiiPay Banking Platform - GCP Deployment Guide

This guide covers the complete deployment of the OrokiiPay banking platform to Google Cloud Platform with static IP configuration for NIBSS API whitelisting.

## Prerequisites

1. Google Cloud Platform account with billing enabled
2. `gcloud` CLI installed and configured
3. Project with appropriate permissions
4. Domain name (optional, for SSL)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Load Balancer                                   │
│              Static IP: X.X.X.X                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                VPC Network                                   │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Compute Engine │    │   Cloud SQL     │                │
│  │   (App Server)  │    │  (PostgreSQL)   │                │
│  │                 │    │                 │                │
│  │  - Docker       │    │  - Multi-tenant │                │
│  │  - Nginx        │    │  - Encrypted    │                │
│  │  - SSL/TLS      │    │  - Backups      │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Infrastructure Setup

### 1.1 Run GCP Setup Script

```bash
# Make script executable
chmod +x deployment/gcp-setup.sh

# Run the infrastructure setup
./deployment/gcp-setup.sh
```

This script will:
- Create VPC network and subnet
- Reserve a static external IP address
- Set up firewall rules
- Create Cloud SQL PostgreSQL instance
- Deploy Compute Engine instance
- Configure IAM service accounts

### 1.2 Note the Static IP Address

The script will output the static IP address at the end. **Save this IP address** - you'll need to provide it to NIBSS for API whitelisting.

```
✅ Static IP Reserved: 34.123.45.67
📋 NIBSS Whitelisting IP: 34.123.45.67
```

## Step 2: Application Deployment

### 2.1 Connect to the GCP Instance

```bash
gcloud compute ssh orokiipay-app-server --zone=us-central1-a
```

### 2.2 Run Application Setup

```bash
# Download and run the deployment script
curl -O https://raw.githubusercontent.com/your-repo/deployment/deploy-app.sh
chmod +x deploy-app.sh
./deploy-app.sh
```

### 2.3 Upload Application Code

From your local machine, copy the application to GCP:

```bash
# Create a tarball of the application (excluding node_modules)
tar --exclude=node_modules --exclude=.git -czf orokiipay-app.tar.gz .

# Copy to GCP instance
gcloud compute scp orokiipay-app.tar.gz orokiipay-app-server:/tmp/ --zone=us-central1-a

# SSH into instance and extract
gcloud compute ssh orokiipay-app-server --zone=us-central1-a
sudo tar -xzf /tmp/orokiipay-app.tar.gz -C /opt/orokiipay/
sudo chown -R $USER:$USER /opt/orokiipay/
```

## Step 3: Database Configuration

### 3.1 Get Cloud SQL Connection Details

```bash
# Get the private IP of Cloud SQL instance
gcloud sql instances describe orokiipay-postgres --format="value(ipAddresses[0].ipAddress)"

# Get the generated password
gcloud sql users list --instance=orokiipay-postgres
```

### 3.2 Configure Environment Variables

```bash
cd /opt/orokiipay
cp .env.template .env

# Edit .env with your actual values
nano .env
```

Update the following values:
```env
DATABASE_URL=postgresql://appuser:GENERATED_PASSWORD@PRIVATE_IP:5432/orokiipay_production
DB_HOST=PRIVATE_IP_FROM_CLOUD_SQL
DB_PASSWORD=GENERATED_PASSWORD
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
NIBSS_API_KEY=your-nibss-api-key
NIBSS_INSTITUTION_CODE=your-institution-code
```

## Step 4: SSL Certificate Setup

### 4.1 Configure Domain (Optional)

If you have a domain name, point it to your static IP:
```
A Record: yourdomain.com → 34.123.45.67
```

### 4.2 Install SSL Certificate

```bash
# Using Let's Encrypt for free SSL
sudo certbot --nginx -d yourdomain.com

# Or for IP-only access, you can use self-signed certificates
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/orokiipay.key \
  -out /etc/ssl/certs/orokiipay.crt
```

## Step 5: Start the Application

### 5.1 Build and Start Services

```bash
cd /opt/orokiipay

# Build the application
npm run server:build

# Start the application service
sudo systemctl enable orokiipay
sudo systemctl start orokiipay

# Check status
sudo systemctl status orokiipay
```

### 5.2 Verify Deployment

```bash
# Check if application is running
curl -f http://localhost:3001/health

# Check nginx status
sudo systemctl status nginx

# Check application logs
sudo journalctl -u orokiipay -f
```

## Step 6: NIBSS Integration Setup

### 6.1 Whitelist Static IP

Contact NIBSS with the following information:
- **Static IP Address**: `34.123.45.67` (from Step 1.2)
- **Institution Code**: Your registered institution code
- **API Endpoints**: List of endpoints your app will call
- **IP Purpose**: Production banking application server

### 6.2 Test NIBSS Connectivity

```bash
# Test from your GCP instance
curl -X POST https://api.nibss-plc.com.ng/test-endpoint \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## Step 7: Monitoring and Security

### 7.1 Set Up Monitoring

```bash
# Install monitoring agents
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
```

### 7.2 Configure Firewall

```bash
# Verify firewall rules are restrictive
gcloud compute firewall-rules list --filter="network:orokiipay-vpc"

# Update if needed to restrict access
gcloud compute firewall-rules update allow-http-https \
  --source-ranges=0.0.0.0/0  # Adjust as needed for your security requirements
```

## Step 8: Backup and Maintenance

### 8.1 Database Backups

```bash
# Cloud SQL automatic backups are enabled by default
# Verify backup configuration
gcloud sql instances describe orokiipay-postgres --format="value(settings.backupConfiguration)"
```

### 8.2 Application Updates

```bash
# Create deployment script for updates
cat > /opt/orokiipay/update-app.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Updating OrokiiPay application..."

# Stop the service
sudo systemctl stop orokiipay

# Backup current version
sudo cp -r /opt/orokiipay /opt/orokiipay-backup-$(date +%Y%m%d-%H%M%S)

# Deploy new version (replace with your update mechanism)
# git pull origin main
# or upload new tarball

# Rebuild application
npm run server:build

# Start service
sudo systemctl start orokiipay

echo "✅ Application updated successfully"
EOF

chmod +x /opt/orokiipay/update-app.sh
```

## Troubleshooting

### Common Issues

1. **Application won't start**: Check logs with `sudo journalctl -u orokiipay -f`
2. **Database connection failed**: Verify Cloud SQL private IP and credentials
3. **SSL certificate issues**: Check nginx configuration and domain DNS
4. **NIBSS API calls failing**: Verify IP is whitelisted and API keys are correct

### Health Checks

```bash
# Application health
curl -f http://localhost:3001/health

# Database connectivity
sudo -u postgres psql -h CLOUD_SQL_IP -U appuser -d orokiipay_production -c "SELECT 1;"

# Nginx status
sudo nginx -t && sudo systemctl status nginx
```

## Security Considerations

1. **Always use HTTPS** for production banking applications
2. **Regularly update** system packages and dependencies
3. **Monitor logs** for suspicious activities
4. **Implement proper backup** and disaster recovery procedures
5. **Use strong passwords** and rotate them regularly
6. **Limit firewall rules** to only necessary ports and IP ranges

## Cost Optimization

- **Use preemptible instances** for development/staging
- **Configure auto-shutdown** for non-production instances  
- **Monitor Cloud SQL** usage and optimize instance size
- **Set up billing alerts** to avoid unexpected charges

---

## Summary

After completing this deployment:

1. ✅ Banking application running on GCP with static IP
2. ✅ Secure HTTPS connection with SSL certificate
3. ✅ PostgreSQL database with proper security
4. ✅ Static IP address ready for NIBSS whitelisting
5. ✅ Monitoring and logging configured
6. ✅ Backup and update procedures in place

**Static IP for NIBSS**: `34.123.45.67`

The banking platform is now production-ready and can handle secure financial transactions with proper NIBSS integration.