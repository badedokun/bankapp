#!/bin/bash
# OrokiiPay Banking Platform - Cloud Run + Static IP Setup
# Uses Global Load Balancer for static IP with serverless Cloud Run

set -e

# Configuration
PROJECT_ID="orokiipay-banking"
REGION="us-central1"
SERVICE_NAME="orokiipay-banking-service"
STATIC_IP_NAME="orokiipay-static-ip"
NEG_NAME="orokiipay-neg"
BACKEND_SERVICE_NAME="orokiipay-backend"
URL_MAP_NAME="orokiipay-url-map"
TARGET_PROXY_NAME="orokiipay-target-proxy"
FORWARDING_RULE_NAME="orokiipay-forwarding-rule"

echo "🚀 Starting OrokiiPay Cloud Run + Static IP Setup..."

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required GCP APIs..."
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry for container images
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create orokiipay-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="OrokiiPay Banking Platform container registry"

# Build and push container image
echo "🏗️ Building and pushing container image..."
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/orokiipay-repo/banking-app:latest .

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/orokiipay-repo/banking-app:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=3001 \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,PORT=3001" \
    --concurrency=1000 \
    --timeout=300

# Get Cloud Run service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo "📍 Cloud Run Service URL: $SERVICE_URL"

# Reserve Static External IP
echo "📍 Reserving Static IP Address..."
gcloud compute addresses create $STATIC_IP_NAME --global

# Get the static IP address
STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME --global --format="value(address)")
echo "✅ Static IP Reserved: $STATIC_IP"
echo "📋 NIBSS Whitelisting IP: $STATIC_IP"

# Create Network Endpoint Group for Cloud Run
echo "🌐 Creating Network Endpoint Group..."
gcloud compute network-endpoint-groups create $NEG_NAME \
    --region=$REGION \
    --network-endpoint-type=serverless \
    --cloud-run-service=$SERVICE_NAME

# Create Backend Service
echo "🔧 Creating Backend Service..."
gcloud compute backend-services create $BACKEND_SERVICE_NAME \
    --global \
    --protocol=HTTPS \
    --load-balancing-scheme=EXTERNAL

# Add Cloud Run NEG to backend service
gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
    --global \
    --network-endpoint-group=$NEG_NAME \
    --network-endpoint-group-region=$REGION

# Create URL Map
echo "🗺️ Creating URL Map..."
gcloud compute url-maps create $URL_MAP_NAME \
    --default-service=$BACKEND_SERVICE_NAME

# Create HTTPS Target Proxy (SSL certificate required)
echo "🔒 Creating HTTPS Target Proxy..."
# Note: SSL certificate must be created separately
gcloud compute target-https-proxies create $TARGET_PROXY_NAME \
    --url-map=$URL_MAP_NAME \
    --ssl-certificates=orokiipay-ssl-cert

# Create Global Forwarding Rule
echo "📡 Creating Global Forwarding Rule..."
gcloud compute forwarding-rules create $FORWARDING_RULE_NAME \
    --global \
    --target-https-proxy=$TARGET_PROXY_NAME \
    --address=$STATIC_IP_NAME \
    --ports=443

echo "🎉 Cloud Run + Static IP Setup Complete!"
echo ""
echo "📋 Deployment Information:"
echo "=========================="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Static IP: $STATIC_IP"
echo "Cloud Run Service: $SERVICE_NAME"
echo "Service URL: $SERVICE_URL"
echo ""
echo "🔑 Next Steps:"
echo "1. Create SSL certificate: gcloud compute ssl-certificates create orokiipay-ssl-cert --domains=yourdomain.com"
echo "2. Update DNS to point your domain to: $STATIC_IP"
echo "3. Configure Cloud SQL connection using Cloud SQL Proxy"
echo "4. Provide Static IP ($STATIC_IP) to NIBSS for API whitelisting"
echo ""
echo "🏗️ Architecture:"
echo "Internet -> Load Balancer ($STATIC_IP) -> Cloud Run (auto-scaling)"