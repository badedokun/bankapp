# Environment Variables Changelog

> **🎯 For Development Team**: Complete reference of environment variable changes in the centralized configuration system.

## 📋 Summary of Changes

**What**: Replaced hardcoded localhost URLs with centralized environment configuration
**When**: September 2024
**Why**: Enable seamless deployments between local and cloud environments
**Impact**: Breaking change requiring environment migration

---

## 🔄 Variable Changes

### New Environment Variables

| Variable | Purpose | Example Values | Required |
|----------|---------|----------------|----------|
| `REACT_APP_ENV` | Environment type detection | `local`, `development`, `production` | Optional |
| `REACT_APP_API_URL` | Frontend API base URL | `http://localhost:3001` (local), `` (cloud) | Optional |
| `REACT_APP_WEB_URL` | Frontend web app URL | `http://localhost:3000` (local), `` (cloud) | Optional |
| `REACT_APP_WS_URL` | WebSocket connection URL | `ws://localhost:3000` (local), `` (cloud) | Optional |
| `CLOUD_PROVIDER` | Force cloud detection | `gcp`, `aws`, `vercel`, `netlify`, `heroku` | Optional |
| `IS_CLOUD_DEPLOYMENT` | Override environment detection | `true`, `false` | Optional |
| `TEST_API_URL` | Test suite API URL | `http://localhost:3001/api`, `/api` | Optional |
| `TEST_WEB_URL` | Test suite web URL | `http://localhost:3000`, `` | Optional |

### Deprecated/Removed Variables

| Variable | Status | Replacement | Migration Action |
|----------|--------|-------------|------------------|
| `API_BASE_URL` | ⚠️ Deprecated | `REACT_APP_API_URL` | Update in code |
| `WEB_BASE_URL` | ⚠️ Deprecated | `REACT_APP_WEB_URL` | Update in code |
| Hardcoded localhost URLs | ❌ Removed | Centralized config | Use `buildApiUrl()` |

### Modified Variables

| Variable | Before | After | Notes |
|----------|--------|-------|-------|
| `NODE_ENV` | Controls API behavior only | Also affects URL detection | Keep existing values |
| Database URLs | Unchanged | Unchanged | No migration needed |
| JWT secrets | Unchanged | Unchanged | No migration needed |

---

## 📁 Environment File Structure

### Before (Old Structure)
```
.env                    # Mixed local/production config
.env.local              # Local overrides
```

### After (New Structure)  
```
.env.local.example      # Local development template
.env.cloud.example      # Cloud deployment template  
.env.local              # Local development (copy from template)
.env                    # Production deployment (copy from template)
ENVIRONMENT_SETUP.md    # Detailed setup guide
MIGRATION_GUIDE.md      # Migration instructions
```

---

## 🔧 Configuration by Environment

### Local Development (.env.local)
```bash
# Environment detection
NODE_ENV=development
REACT_APP_ENV=local

# Application URLs (explicit for local)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_PORT=3001
REACT_APP_WEB_URL=http://localhost:3000
REACT_APP_WEB_PORT=3000
REACT_APP_WS_URL=ws://localhost:3000

# Database (unchanged)
DATABASE_URL=postgresql://user:password@localhost:5432/orokiipay_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=orokiipay_dev
POSTGRES_USER=user  
POSTGRES_PASSWORD=password

# Security (unchanged)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret-key

# Development tools
ENABLE_DEVTOOLS=true
ENABLE_LOGGER=true

# Testing URLs  
TEST_API_URL=http://localhost:3001/api
TEST_WEB_URL=http://localhost:3000
```

### Cloud Deployment (.env)
```bash
# Environment detection
NODE_ENV=production
REACT_APP_ENV=development  # or production

# Application URLs (empty = relative URLs for same-domain)
REACT_APP_API_URL=
REACT_APP_API_PORT=3001
REACT_APP_WS_URL=

# OR for different domains:
# REACT_APP_API_URL=https://api.yourdomain.com
# REACT_APP_WEB_URL=https://web.yourdomain.com

# Cloud detection (auto-detected but can be explicit)
CLOUD_PROVIDER=gcp  # or aws, vercel, netlify, heroku
GOOGLE_CLOUD_PROJECT=your-project-id

# Database (cloud-specific)
DATABASE_URL=postgresql://user:password@cloud-host:5432/orokiipay_prod
POSTGRES_HOST=cloud-database-host
POSTGRES_PORT=5432
POSTGRES_DB=orokiipay_prod
POSTGRES_USER=cloud_user
POSTGRES_PASSWORD=secure_cloud_password

# Security (production values)
JWT_SECRET=super-secure-production-jwt-secret
JWT_EXPIRES_IN=24h  
SESSION_SECRET=super-secure-production-session-secret

# Development tools (disabled in production)
ENABLE_DEVTOOLS=false
ENABLE_LOGGER=false

# Testing URLs (relative for cloud)
TEST_API_URL=/api
TEST_WEB_URL=
```

---

## 🏗️ Code Integration Changes

### API Service Updates
```typescript
// Before - Hardcoded URLs
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.orokii.com' 
  : 'http://localhost:3001';

// After - Centralized Configuration  
import { ENV_CONFIG, buildApiUrl } from '../config/environment';
const API_BASE_URL = ENV_CONFIG.API_BASE_URL;
const url = buildApiUrl('/api/endpoint');
```

### Test File Updates
```javascript
// Before - Hardcoded test URLs
const baseUrl = 'http://localhost:3001/api';

// After - Centralized test configuration
const { API_URL } = require('./src/config/testEnvironment');
const baseUrl = API_URL;
```

### Environment Detection Logic
```typescript
// Automatic environment detection
export const isCloudEnvironment = (): boolean => {
  // Check for cloud provider environment variables
  if (process.env.CLOUD_PROVIDER ||
      process.env.VERCEL ||
      process.env.NETLIFY || 
      process.env.HEROKU ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.GOOGLE_CLOUD_PROJECT) {
    return true;
  }
  
  // Browser-based detection
  if (typeof window !== 'undefined') {
    return window.location.hostname !== 'localhost';
  }
  
  // Node.js environment detection
  return process.env.NODE_ENV === 'production';
};
```

---

## 🎯 Environment-Specific Behaviors

### Local Development
- **URL Resolution**: Absolute URLs (http://localhost:3001/api/endpoint)
- **Environment Detection**: Based on localhost hostname and NODE_ENV
- **WebSocket**: ws://localhost:3000
- **Database**: Local PostgreSQL instance
- **Dev Tools**: Enabled

### Cloud Deployment (Same Domain)
- **URL Resolution**: Relative URLs (/api/endpoint)
- **Environment Detection**: Based on cloud provider variables
- **WebSocket**: Relative WebSocket URLs  
- **Database**: Cloud database instances
- **Dev Tools**: Disabled

### Cloud Deployment (Different Domains)
- **URL Resolution**: Absolute URLs to specific domains
- **API Domain**: https://api.yourdomain.com/api/endpoint
- **Web Domain**: https://web.yourdomain.com/dashboard
- **Environment Detection**: Based on explicit configuration
- **Cross-origin**: CORS properly configured

---

## 🧪 Testing Configuration

### Test Environment Variables
```javascript
// src/config/testEnvironment.js
module.exports = {
  API_BASE_URL: getApiUrl(),      // Auto-detected
  WEB_BASE_URL: getWebUrl(),      // Auto-detected  
  API_URL: getApiUrl() + '/api',  // Computed
  buildApiUrl: (endpoint) => { /* Smart URL building */ },
  buildWebUrl: (path) => { /* Smart URL building */ }
};
```

### Test Validation
```bash
# Verify environment configuration
node test-environment-config.js

# Expected output:
# ✅ Local URLs contain localhost
# ✅ Cloud URLs are relative (empty)
# ✅ Custom URLs match environment variables
# ✅ buildApiUrl handles relative URLs correctly
# ✅ buildApiUrl handles absolute URLs correctly
# 📊 Success Rate: 100%
```

---

## 🔍 Debugging Environment Issues

### Debug Environment Detection
```javascript
// Add to your code for debugging
import { ENV_CONFIG } from './src/config/environment';
console.log('Environment Config:', ENV_CONFIG);
console.log('Cloud Environment:', isCloudEnvironment());
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_ENV: process.env.REACT_APP_ENV,
  CLOUD_PROVIDER: process.env.CLOUD_PROVIDER,
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT
});
```

### Common Debug Commands
```bash
# Check environment variables
env | grep -E "(REACT_APP_|NODE_ENV|CLOUD_)"

# Verify configuration files
ls -la .env* | grep -E "\.(local|cloud)\.example|\.env$"

# Test URL building
node -e "const env = require('./src/config/environment'); console.log(env.buildApiUrl('/test'));"
```

---

## 📊 Migration Impact Assessment

### Files Changed
- `src/config/environment.ts` - New centralized config
- `src/config/testEnvironment.js` - New test config  
- `src/services/api.ts` - Updated to use centralized config
- Multiple test files - Updated to use testEnvironment
- `.env.local.example` - New local template
- `.env.cloud.example` - New cloud template

### Deployment Changes Required
- Environment variable migration
- Configuration file updates
- Testing validation
- Documentation updates

### Backward Compatibility
- ⚠️ **Breaking Change**: Hardcoded URLs no longer work
- ⚠️ **Migration Required**: All deployments need environment updates
- ✅ **Database**: No changes required
- ✅ **Security**: No changes required  

---

## 📞 Developer Support

### Quick Reference Commands
```bash
# Setup new environment
cp .env.local.example .env.local    # Local
cp .env.cloud.example .env          # Cloud

# Validate configuration  
node test-environment-config.js

# Debug environment
node -e "console.log(require('./src/config/environment').ENV_CONFIG);"

# Migration help
cat MIGRATION_GUIDE.md
```

### Documentation Resources
- **[ENVIRONMENT_SETUP.md](../ENVIRONMENT_SETUP.md)** - Detailed setup guide
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Step-by-step migration
- **[docs/DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Development workflows

### Support Checklist
- [ ] Copy appropriate .env template
- [ ] Update environment variables
- [ ] Run configuration validation
- [ ] Test local development
- [ ] Test cloud deployment
- [ ] Verify all features work
- [ ] Update team documentation

---

**🎯 Key Takeaway**: The new centralized environment configuration eliminates deployment complexity while maintaining full functionality across all environments. All hardcoded URLs have been replaced with automatic environment detection and smart URL resolution.