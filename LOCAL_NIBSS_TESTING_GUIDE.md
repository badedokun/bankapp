# Local NIBSS Testing Guide

> **Complete setup for testing NIBSS API integration in your local development environment**

## 🎯 **Problem Solved**

NIBSS has whitelisted your GCP server IP (34.59.143.25), but you need to test locally during development. This guide provides three approaches to test NIBSS integration without deploying to GCP every time.

## 🛠️ **Setup (Already Completed)**

The environment has been configured with:
- ✅ NIBSS credentials integrated into local environment
- ✅ Mock service for offline development
- ✅ SSH tunnel scripts for real API testing
- ✅ Environment switching between modes

## 📋 **Testing Approaches**

### **1. Mock Mode (Recommended for Development)**

**Best for:** Daily development, unit testing, rapid iteration

```bash
# Already configured in your .env.local
NIBSS_USE_MOCK=true
```

**Features:**
- ✅ Zero network dependencies
- ✅ Instant responses
- ✅ Realistic bank data (19 Nigerian banks)
- ✅ Predictable test scenarios
- ✅ Works offline

**Usage:**
```bash
npm run dev  # Your app will use mock NIBSS responses
```

### **2. SSH Tunnel Mode (Real API Testing)**

**Best for:** Integration testing, API endpoint validation

```bash
# Terminal 1: Start tunnel
./scripts/nibss-tunnel.sh

# Terminal 2: Update environment and test
export NIBSS_BASE_URL=https://localhost:8443
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

**Features:**
- ✅ Routes through your whitelisted GCP IP
- ✅ Real NIBSS API responses
- ✅ Tests actual authentication flow
- ⚠️ Requires SSH access to GCP server

### **3. Direct Mode (Production Only)**

**Best for:** Final deployment testing

```bash
# Only works when deployed to GCP with IP 34.59.143.25
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
```

## 🚀 **Quick Start Commands**

```bash
# Test current setup
node test-local-nibss.js

# Start development with mock NIBSS
npm run dev

# Start SSH tunnel (separate terminal)
./scripts/nibss-tunnel.sh

# Switch to tunnel mode
export NIBSS_BASE_URL=https://localhost:8443
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

## 📊 **Test Script Output**

The `test-local-nibss.js` script validates:
- ✅ Environment configuration
- ❌ Direct connection (expected to fail - not whitelisted)
- ✅/❌ SSH tunnel connection (depends on tunnel status)
- ✅ Mock service functionality

## 🔧 **Environment Variables**

### **Local Development (.env.local)**
```bash
# Mock mode (default)
NIBSS_USE_MOCK=true
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng

# SSH Tunnel mode
# NIBSS_BASE_URL=https://localhost:8443
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

### **GCP Production (.env)**
```bash
NIBSS_USE_MOCK=false
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
```

## 📝 **Mock Service Features**

The mock service provides realistic responses for:

- **Bank List**: 19 major Nigerian banks
- **Name Enquiry**: Random Nigerian names
- **Transfer Initiation**: Success/pending responses
- **Transaction Status**: Success/failed/pending states

## 🔍 **Debugging Tips**

### **SSH Tunnel Issues**
```bash
# Check if tunnel is running
lsof -i :8443

# Kill existing tunnel
pkill -f "ssh.*8443"

# Restart tunnel
./scripts/nibss-tunnel.sh
```

### **SSL Certificate Issues**
```bash
# For local testing only
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### **Mock Service Not Working**
```bash
# Ensure environment variable is set
echo $NIBSS_USE_MOCK  # Should output: true

# Check service implementation
node -e "console.log(require('./server/services/nibss-mock.ts'))"
```

## ⚡ **Development Workflow**

1. **Start with Mock Mode**
   - Rapid development and testing
   - No network dependencies
   - Consistent test data

2. **Move to SSH Tunnel**
   - Test real API integration
   - Validate authentication
   - Test with actual NIBSS responses

3. **Deploy to GCP**
   - Final production testing
   - Real IP whitelisting verification
   - End-to-end validation

## 📞 **Next Steps**

1. **Get NIBSS API Documentation**
   - Request endpoint specifications from NIBSS
   - Get sample requests/responses
   - Understand authentication flow

2. **Update Service Implementation**
   - Implement correct endpoints once known
   - Update authentication headers
   - Add proper error handling

3. **End-to-End Testing**
   - Test full transfer flow
   - Validate all NIBSS operations
   - Production deployment verification

---

**✅ Your local NIBSS testing environment is now fully configured and ready for development!**