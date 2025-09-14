# Environment Configuration Migration Guide

This guide helps you migrate existing deployments to use the new centralized environment configuration system.

## 🎯 Overview

**What Changed**: Hardcoded localhost URLs have been replaced with a centralized environment configuration system that automatically detects deployment environments and configures URLs accordingly.

**Why**: This eliminates the need for manual URL changes when switching between local development and cloud deployments, solving the "nightmare" of deployment configuration management.

## 📋 Migration Checklist

### ✅ Step 1: Backup Current Configuration
```bash
# Backup existing environment files
cp .env .env.backup.$(date +%Y%m%d)
cp .env.local .env.local.backup.$(date +%Y%m%d) 2>/dev/null || true

# Document current configuration
echo "Current API URL: $(grep REACT_APP_API_URL .env || echo 'Not set')"
echo "Current Web URL: $(grep REACT_APP_WEB_URL .env || echo 'Not set')"
```

### ✅ Step 2: Update Environment Templates
```bash
# For existing local development
cp .env.local.example .env.local

# For existing cloud deployment
cp .env.cloud.example .env
```

### ✅ Step 3: Migrate Environment Variables

#### From Old Format to New Format:

| Old Variable | New Variable | Notes |
|--------------|--------------|-------|
| `API_BASE_URL` | `REACT_APP_API_URL` | Now supports automatic detection |
| `WEB_BASE_URL` | `REACT_APP_WEB_URL` | Empty for relative URLs in cloud |
| Hardcoded localhost URLs | Centralized config | Automatically resolved |

#### Migration Examples:

**Local Development (.env.local):**
```bash
# Before (hardcoded)
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:3000

# After (new system)
REACT_APP_ENV=local
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEB_URL=http://localhost:3000
```

**Cloud Deployment (.env):**
```bash
# Before (mixed hardcoded/environment-specific)
API_BASE_URL=https://your-api-domain.com
WEB_BASE_URL=https://your-web-domain.com

# After (automatic detection - for same-domain deployments)
REACT_APP_ENV=development  # or production
REACT_APP_API_URL=         # Empty = relative URLs
REACT_APP_WEB_URL=         # Empty = relative URLs
CLOUD_PROVIDER=gcp         # or aws, heroku, vercel, netlify

# After (different domains)
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_WEB_URL=https://web.yourdomain.com
```

### ✅ Step 4: Update Code References

#### Update API Service Files:
```javascript
// Before - Hardcoded URLs
const API_BASE_URL = 'http://localhost:3001';
const apiUrl = `${API_BASE_URL}/api/endpoint`;

// After - Centralized Configuration
import { buildApiUrl } from '../config/environment';
const apiUrl = buildApiUrl('/api/endpoint');
```

#### Update Test Files:
```javascript
// Before - Hardcoded test URLs
const baseUrl = 'http://localhost:3001/api';

// After - Centralized test configuration
const { API_URL } = require('./src/config/testEnvironment');
const baseUrl = API_URL;
```

### ✅ Step 5: Validate Migration
```bash
# Test environment configuration
node test-environment-config.js

# Should show 100% success rate:
# ✅ Local URLs contain localhost
# ✅ Cloud URLs are relative (empty)
# ✅ Custom URLs match environment variables
# ✅ buildApiUrl handles relative URLs correctly
# ✅ buildApiUrl handles absolute URLs correctly
```

### ✅ Step 6: Test Deployment
```bash
# Test local development
npm run server & npm run web
# Verify: App loads at http://localhost:3000
# Verify: API calls work correctly

# Test cloud deployment
./deploy.sh
# Verify: Environment auto-detection works
# Verify: URLs resolve correctly in production
```

## 🔧 Deployment-Specific Migration

### Existing GCP Deployment
```bash
# Update .env for GCP
GOOGLE_CLOUD_PROJECT=your-project-id
REACT_APP_API_URL=           # Empty for same-domain
CLOUD_PROVIDER=gcp

# Deploy
gcloud app deploy
```

### Existing Vercel Deployment
```bash
# Update .env for Vercel
VERCEL=1                    # Auto-detected
REACT_APP_API_URL=          # Empty for same-domain

# Deploy
vercel deploy
```

### Existing Heroku Deployment
```bash
# Update environment variables
heroku config:set REACT_APP_API_URL=""
heroku config:set CLOUD_PROVIDER=heroku

# Deploy
git push heroku main
```

### Existing AWS Deployment
```bash
# Update .env for AWS
AWS_LAMBDA_FUNCTION_NAME=your-function  # Auto-detected
REACT_APP_API_URL=                      # Empty for same-domain
CLOUD_PROVIDER=aws
```

## 🐛 Troubleshooting Migration Issues

### Issue: API calls failing after migration
**Problem**: Frontend can't reach backend API
**Solution**: 
```bash
# Check environment configuration
node -e "const env = require('./src/config/environment'); console.log('Config:', env.ENV_CONFIG);"

# For same-domain deployment, ensure API_URL is empty
grep REACT_APP_API_URL .env
# Should show: REACT_APP_API_URL=

# For different domains, ensure API_URL points to correct domain
```

### Issue: Environment not detected correctly
**Problem**: Wrong environment detection (local vs cloud)
**Solution**:
```bash
# Check environment variables
env | grep -E "(CLOUD_PROVIDER|VERCEL|HEROKU|GOOGLE_CLOUD_PROJECT|AWS_LAMBDA)"

# Force cloud detection if needed
echo "IS_CLOUD_DEPLOYMENT=true" >> .env
```

### Issue: Tests using wrong URLs
**Problem**: Tests still using hardcoded localhost
**Solution**:
```bash
# Find hardcoded test URLs
grep -r "localhost:300" tests/ src/ --include="*.js" --include="*.ts"

# Update tests to use centralized configuration
# Replace hardcoded URLs with testEnvironment imports
```

### Issue: Build failing after migration
**Problem**: Import errors or missing configuration
**Solution**:
```bash
# Clear build cache
rm -rf node_modules/.cache dist .cache .parcel-cache

# Verify environment files exist
ls -la .env* | grep -E "\.(local|cloud)\.example|\.env$"

# Rebuild
npm install
npm run build
```

## 📊 Rollback Plan

If migration issues occur, you can rollback:

### Quick Rollback:
```bash
# Restore backed up environment
cp .env.backup.$(date +%Y%m%d) .env
cp .env.local.backup.$(date +%Y%m%d) .env.local 2>/dev/null || true

# Redeploy with old configuration
./deploy.sh
```

### Full Rollback (if code changes made):
```bash
# Revert to previous git commit
git log --oneline -5  # Find commit before migration
git revert <migration-commit-hash>

# Redeploy
./deploy.sh
```

## 🎯 Migration Validation

After migration, verify these work correctly:

### ✅ Local Development
```bash
npm run server & npm run web
# ✅ App loads at http://localhost:3000
# ✅ API calls to http://localhost:3001 work
# ✅ Authentication flow works
# ✅ All major features functional
```

### ✅ Cloud Deployment
```bash
./deploy.sh
# ✅ App loads on production domain
# ✅ API calls use relative URLs
# ✅ No hardcoded localhost references
# ✅ Environment auto-detection works
# ✅ All major features functional
```

### ✅ Testing
```bash
npm run test:integration
# ✅ All tests pass
# ✅ No hardcoded URL errors
# ✅ Environment switching works

node test-environment-config.js
# ✅ 100% success rate on all environment tests
```

## 📞 Support

If you encounter issues during migration:

1. **Check the logs**: Look for environment configuration errors
2. **Run diagnostics**: Use `node test-environment-config.js`
3. **Review documentation**: See `ENVIRONMENT_SETUP.md` for detailed setup
4. **Check existing issues**: Review `docs/DEVELOPMENT_GUIDE.md` for common problems

## 🎉 Migration Complete

Once migration is successful, you'll have:

- ✅ **Zero-configuration deployments** between environments
- ✅ **Automatic environment detection** 
- ✅ **No more hardcoded localhost URLs**
- ✅ **Seamless switching** between local and cloud
- ✅ **Future-proof deployment strategy**

Your banking application is now ready for effortless deployments! 🚀