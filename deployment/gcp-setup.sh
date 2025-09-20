#!/bin/bash
# OrokiiPay Banking Platform - GCP Deployment Script
# Creates VPC, static IP, and infrastructure for NIBSS integration

set -e

# Configuration
PROJECT_ID="orokiipay-banking"
REGION="us-central1"
ZONE="us-central1-a"
VPC_NAME="orokiipay-vpc"
SUBNET_NAME="orokiipay-subnet"
STATIC_IP_NAME="orokiipay-static-ip"
INSTANCE_NAME="orokiipay-app-server"
DB_INSTANCE_NAME="orokiipay-postgres"
SERVICE_ACCOUNT_NAME="orokiipay-service-account"

echo "🚀 Starting OrokiiPay GCP Deployment..."

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required GCP APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable dns.googleapis.com

# Create VPC Network
echo "🌐 Creating VPC Network..."
gcloud compute networks create $VPC_NAME \
    --subnet-mode=custom \
    --bgp-routing-mode=regional

# Create Subnet
echo "🏗️ Creating Subnet..."
gcloud compute networks subnets create $SUBNET_NAME \
    --network=$VPC_NAME \
    --range=10.0.0.0/24 \
    --region=$REGION

# Reserve Static External IP
echo "📍 Reserving Static IP Address..."
gcloud compute addresses create $STATIC_IP_NAME \
    --region=$REGION

# Get the static IP address
STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --region=$REGION --format="value(address)")
echo "✅ Static IP Reserved: $STATIC_IP"
echo "📋 NIBSS Whitelisting IP: $STATIC_IP"

# Create Firewall Rules
echo "🔥 Creating Firewall Rules..."
gcloud compute firewall-rules create allow-http-https \
    --network=$VPC_NAME \
    --allow=tcp:80,tcp:443,tcp:3001 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=web-server

gcloud compute firewall-rules create allow-ssh \
    --network=$VPC_NAME \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=web-server

# Create Service Account
echo "👤 Creating Service Account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="OrokiiPay Banking Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Create Cloud SQL Instance
echo "🗄️ Creating PostgreSQL Database..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=$REGION \
    --network=$VPC_NAME \
    --no-assign-ip \
    --enable-ip-alias

# Create database and user
gcloud sql databases create orokiipay_production --instance=$DB_INSTANCE_NAME
gcloud sql users create appuser --instance=$DB_INSTANCE_NAME --password=$(openssl rand -base64 32)

# Create Compute Engine Instance
echo "💻 Creating Compute Engine Instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,subnet=$SUBNET_NAME,address=$STATIC_IP \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=web-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20231213,mode=rw,size=20,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-balanced \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any

echo "🎉 GCP Infrastructure Setup Complete!"
echo ""
echo "📋 Deployment Information:"
echo "=========================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Static IP: $STATIC_IP"
echo "Instance Name: $INSTANCE_NAME"
echo "Database: $DB_INSTANCE_NAME"
echo ""
echo "🔑 Next Steps:"
echo "1. SSH into the instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "2. Install Docker and deploy the application"
echo "3. Configure SSL certificate"
echo "4. Provide Static IP ($STATIC_IP) to NIBSS for API whitelisting"