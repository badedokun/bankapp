# Nigerian Multi-Tenant Money Transfer System - Environment Setup Guide

## Overview

This guide will walk you through setting up the complete development, staging, and production environments for the AI-enhanced multi-tenant Nigerian Money Transfer system.

## 📋 Prerequisites

### System Requirements

**Development Environment:**
- **Operating System**: macOS 12+, Ubuntu 20.04+, or Windows 11 with WSL2
- **Memory**: Minimum 16GB RAM (32GB recommended for AI workloads)
- **Storage**: 100GB+ SSD storage
- **CPU**: Intel i7/AMD Ryzen 7 or equivalent (8+ cores recommended)

**Production Environment:**
- **Kubernetes Cluster**: Version 1.25+
- **Node Specifications**:
  - General workloads: 4 vCPU, 8GB RAM minimum per node
  - AI workloads: 8 vCPU, 16GB RAM, GPU support (NVIDIA Tesla T4 or better)
  - Database nodes: 8 vCPU, 32GB RAM, SSD storage

### Required Software

**Core Development Tools:**
```bash
# Node.js (version 18+ LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Kubernetes tools
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

**AI/ML Tools:**
```bash
# Python for ML workflows
sudo apt-get install python3.9 python3.9-pip python3.9-venv

# TensorFlow CLI
pip3 install tensorflow tensorflow-serving-api

# MLflow
pip3 install mlflow

# NVIDIA Docker (for GPU support)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$(. /etc/os-release;echo $ID$VERSION_ID)/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install nvidia-docker2
sudo systemctl restart docker
```

## 🔧 Development Environment Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/oroki-pay/moneytransfer-multitenant-ai.git
cd moneytransfer-multitenant-ai

# Initialize submodules (if any)
git submodule update --init --recursive
```

### 2. Environment Configuration

**Create Environment Files:**

```bash
# Copy example environment files
cp .env.example .env.development
cp .env.example .env.staging  
cp .env.example .env.production

# Edit development environment
nano .env.development
```

**Development Environment Variables (.env.development):**
```bash
# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME="OrokiiPay Money Transfer Development"
LOG_LEVEL=debug

# Database Configuration
DATABASE_URL=postgresql://mt_dev:dev_password@localhost:5432/orokii_mt_dev
PLATFORM_DATABASE_URL=postgresql://platform:platform_pass@localhost:5432/orokii_mt_platform
REDIS_URL=redis://localhost:6379

# AI Service Configuration
OPENAI_API_KEY=sk-your-openai-key-here
AI_SERVICE_URL=http://localhost:3010
FRAUD_SERVICE_URL=http://localhost:3011
VECTOR_DB_URL=http://localhost:8080

# Nigerian Payment Gateways (Sandbox)
NIBSS_API_URL=https://sandbox.nibss-plc.com.ng/api/v1
NIBSS_API_KEY=nibss_sandbox_key
INTERSWITCH_API_URL=https://sandbox.interswitchng.com/api/v1
INTERSWITCH_API_KEY=interswitch_sandbox_key

# Security Configuration  
JWT_SECRET=your-super-secret-jwt-key-for-development
ENCRYPTION_KEY=32-char-encryption-key-for-dev
BCRYPT_ROUNDS=10

# Multi-tenant Configuration
DEFAULT_TENANT=development
TENANT_DETECTION_METHOD=subdomain
ENABLE_TENANT_ISOLATION=true

# AI Configuration
ENABLE_AI_FEATURES=true
ENABLE_CONVERSATIONAL_AI=true
ENABLE_FRAUD_DETECTION=true
ENABLE_VOICE_PROCESSING=true
AI_MODEL_CACHE_DIR=./ai-models/cache

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_OFFLINE_MODE=true
ENABLE_QR_PAYMENTS=true
ENABLE_BULK_TRANSACTIONS=true

# Monitoring and Observability
ENABLE_PROMETHEUS_METRICS=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
LOG_FORMAT=json

# Rate Limiting (Development - more permissive)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Database Setup

**Start PostgreSQL with Docker:**
```bash
# Start development databases
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for databases to be ready
sleep 10

# Run database migrations
npm run db:migrate:dev
npm run db:seed:dev
```

**Create Development Tenants:**
```bash
# Create sample tenants for development
npm run tenant:create -- --id=bank-a --name="Bank A Dev" --subdomain=bank-a-dev --tier=enterprise
npm run tenant:create -- --id=bank-b --name="Bank B Dev" --subdomain=bank-b-dev --tier=premium
npm run tenant:create -- --id=bank-c --name="Bank C Dev" --subdomain=bank-c-dev --tier=basic
```

### 4. AI Services Setup

**Download AI Models:**
```bash
# Create AI models directory
mkdir -p ai-models/{conversational,fraud-detection,nlp,voice}

# Download pre-trained models (this would be automated in production)
./scripts/download-ai-models.sh --env development
```

**Start AI Services:**
```bash
# Start TensorFlow Serving for fraud detection
docker run -d --name tf-serving-fraud \
  -p 8501:8501 \
  -v $(pwd)/ai-models/fraud-detection:/models/fraud_detection \
  -e MODEL_NAME=fraud_detection \
  tensorflow/serving:2.13.0

# Start Weaviate vector database
docker run -d --name weaviate-dev \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  -e DEFAULT_VECTORIZER_MODULE=text2vec-transformers \
  -e ENABLE_MODULES=text2vec-transformers,qna-transformers \
  semitechnologies/weaviate:1.21.2
```

### 5. Frontend Development Setup

**React Native Setup:**
```bash
cd apps/mobile

# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# In separate terminals:
# Start iOS simulator
npm run ios

# Start Android emulator  
npm run android
```

**Web Setup:**
```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev

# Access at: http://localhost:3000
```

### 6. Backend Services Setup

**Start Core Services:**
```bash
# In separate terminals, start each service:

# API Gateway
cd services/api-gateway
npm install && npm run dev

# AI Intelligence Service  
cd services/ai-intelligence-service
npm install && npm run dev

# Transaction Service
cd services/transaction-service  
npm install && npm run dev

# Fraud Detection Service
cd services/fraud-service
npm install && npm run dev

# Auth Service
cd services/auth-service
npm install && npm run dev

# Tenant Service
cd services/tenant-service
npm install && npm run dev
```

## 🚀 Quick Start with Docker Compose

For rapid development setup, use Docker Compose:

```bash
# Start complete development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Services available at:
# - Web App: http://localhost:3000
# - API Gateway: http://localhost:8080  
# - AI Services: http://localhost:3010
# - Database: localhost:5432
# - Redis: localhost:6379
# - Vector DB: http://localhost:8080
```

## ⚙️ IDE and Development Tools Setup

### VS Code Configuration

**Required Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "ms-azuretools.vscode-docker",
    "hashicorp.terraform",
    "ms-python.python",
    "ms-toolsai.jupyter"
  ]
}
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.yaml": "yaml",
    "*.yml": "yaml"
  },
  "python.defaultInterpreterPath": "./venv/bin/python",
  "kubernetes.kubeconfig": "~/.kube/config"
}
```

### Git Configuration

**Setup Git Hooks:**
```bash
# Install pre-commit hooks
npm install -g husky lint-staged
npx husky install

# Setup commit message validation
echo '#!/bin/sh\nnpx --no-install commitlint --edit $1' > .husky/commit-msg
chmod +x .husky/commit-msg
```

**Git Configuration:**
```bash
# Configure Git for the project
git config core.autocrlf false
git config pull.rebase false
git config branch.autoSetupMerge always
git config branch.autoSetupRebase always

# Set up commit signing (recommended)
git config commit.gpgsign true
git config user.signingkey YOUR_GPG_KEY_ID
```

## 🧪 Testing Environment Setup

### Unit and Integration Tests

```bash
# Install test dependencies
npm install --save-dev jest @types/jest supertest @testing-library/react-native

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run AI-specific tests
npm run test:ai

# Run security tests  
npm run test:security
```

### E2E Testing Setup

```bash
# Install Playwright for E2E tests
npm install --save-dev @playwright/test

# Setup E2E test environment
npx playwright install

# Run E2E tests
npm run test:e2e
```

## 🔒 Security Configuration

### SSL/TLS Setup (Development)

```bash
# Generate self-signed certificates for development
mkdir -p certs

openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
  -subj "/C=NG/ST=Lagos/L=Lagos/O=NIBSS/CN=localhost"

# Add to environment
echo "SSL_KEY_PATH=./certs/key.pem" >> .env.development
echo "SSL_CERT_PATH=./certs/cert.pem" >> .env.development
```

### Secret Management

```bash
# Install secret management tools
npm install --save-dev dotenv-vault

# Initialize vault (for production secrets)
npx dotenv-vault new
```

## 📊 Monitoring Setup (Development)

### Prometheus and Grafana

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001 (admin/admin)
# - Jaeger: http://localhost:16686
```

### Log Aggregation

```bash
# Start ELK stack for development
docker-compose -f docker-compose.logging.yml up -d

# Access Kibana: http://localhost:5601
```

## 🌍 Multi-Tenant Development Workflow

### Testing Different Tenants

```bash
# Access different tenant subdomains (add to /etc/hosts):
echo "127.0.0.1 bank-a-dev.localhost" >> /etc/hosts
echo "127.0.0.1 bank-b-dev.localhost" >> /etc/hosts
echo "127.0.0.1 bank-c-dev.localhost" >> /etc/hosts

# Test tenant isolation:
curl -H "X-Tenant-ID: bank-a" http://localhost:8080/api/v2/health
curl -H "X-Tenant-ID: bank-b" http://localhost:8080/api/v2/health
```

### Tenant-Specific Development

```bash
# Switch development context to specific tenant
export DEVELOPMENT_TENANT=bank-a
npm run dev:tenant

# Run tenant-specific tests
npm run test:tenant -- --tenant=bank-a

# Generate tenant-specific data
npm run seed:tenant -- --tenant=bank-a --type=transactions
```

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Issues:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U mt_dev -d orokii_mt_dev -c "\dt"

# Reset database
npm run db:reset:dev
```

**2. AI Services Not Starting:**
```bash
# Check GPU availability (if using)
nvidia-smi

# Check TensorFlow Serving logs
docker logs tf-serving-fraud

# Restart AI services
docker-compose restart ai-intelligence-service
```

**3. Port Conflicts:**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :8080

# Kill processes using ports
sudo fuser -k 8080/tcp
```

**4. Memory Issues:**
```bash
# Check memory usage
free -h

# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory > 8GB+

# Reduce service replicas for development
export DEV_REPLICA_COUNT=1
```

### Getting Help

**Documentation:**
- API Documentation: http://localhost:8080/api/docs
- Development Wiki: https://wiki.orokii.com/dev
- Architecture Decision Records: ./docs/adr/

**Support Channels:**
- Internal Slack: #orokii-dev
- Email: dev-support@orokii.com
- Issue Tracker: https://github.com/oroki-pay/moneytransfer-multitenant-ai/issues

### Performance Optimization

**Development Performance:**
```bash
# Enable TypeScript incremental compilation
echo '{"extends": "./tsconfig.json", "compilerOptions": {"incremental": true}}' > tsconfig.dev.json

# Use Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Enable npm cache
npm config set cache ~/.npm-cache

# Use pnpm for faster installs (optional)
npm install -g pnpm
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All services start without errors
- [ ] Database connections successful
- [ ] AI services respond to health checks
- [ ] Frontend loads on all tenant subdomains
- [ ] API endpoints return expected responses
- [ ] Tests pass (unit, integration, E2E)
- [ ] Monitoring dashboards show data
- [ ] Log aggregation working
- [ ] Multi-tenant isolation verified

**Quick Verification Script:**
```bash
./scripts/verify-setup.sh
```

This will run through all components and report any issues.

---

**Next Steps:**
1. Review the implementation guides (Books 1-3)
2. Set up your preferred IDE with recommended extensions  
3. Run the verification script
4. Start developing your first feature
5. Join the development team meetings and code reviews

For production deployment, refer to the deployment checklist and infrastructure guides.