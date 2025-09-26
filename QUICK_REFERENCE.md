# 🚀 Banking App - Quick Reference Card

## 📋 **BEFORE STARTING ANY DEVELOPMENT**
```bash
npm run db:migrate && npm run test:integration
```

## 🚨 **CRITICAL: PLATFORM ADMIN ARCHITECTURE**
**UNIFIED APPLICATION APPROACH** (Industry Best Practice - Slack, GitHub, GitLab)

- ✅ **Same Application**: Single React Native + Web codebase for all users
- ✅ **Same Database**: Single PostgreSQL with role-based query scoping
- ✅ **Subdomain Access**: `admin.orokiipay.com` vs `{tenant}.orokiipay.com`
- ✅ **JWT Context**: Role-based UI rendering (`platform_admin` flag)

**📚 REFERENCE DOCS:**
- `TENANT_MANAGEMENT_SAAS_UNIFIED.md` - Complete architecture spec
- `FRONTEND_UNIFIED_IMPLEMENTATION.md` - Implementation roadmap

**❌ DO NOT create separate apps or databases for platform admin!**

## 🤖 **BEFORE USING CLAUDE CODE**
1. **Read**: `docs/CLAUDE_CODE_INTEGRATION.md`
2. **Verify Schema**: Check table existence first
3. **Prepare Context**: Include database schema, validation rules, external services
4. **Use Proven Prompts**: Follow successful examples from the guide

## 🧪 **BANKING APP TESTING RULES**
- ✅ **Real Database**: For all banking operations (users, wallets, transfers)
- ✅ **Mock External APIs**: NIBSS, fraud detection services only
- ❌ **Never Mock**: Database operations, authentication, core banking logic

## 🔢 **API VALIDATION CONSTRAINTS**
- **Amount**: ₦100 - ₦1,000,000
- **PIN**: Exactly 4 digits (0000-9999)
- **Account Number**: Exactly 10 digits
- **Bank Code**: Exactly 3 digits

## 🗄️ **DATABASE TABLES STATUS**
- ✅ `tenant.users` - Users and auth
- ✅ `tenant.wallets` - Account balances  
- ✅ `tenant.transfers` - Transfer records
- ❌ `tenant.recipients` - **MOCKED** (table doesn't exist)
- ❌ `transaction_logs` - **MOCKED** (table doesn't exist)

## 🆘 **QUICK DEBUGGING**
### 500 Errors
1. Check table existence: `\dt` in psql
2. Verify column names: `\d table_name`
3. Check foreign keys and constraints

### Test Failures  
1. Validate test data against API rules
2. Check authentication (password 8+ chars)
3. Verify database cleanup

### Authentication Issues
1. Password must be 8+ characters
2. Valid tenant ID required
3. JWT tokens properly formatted

## 🌐 **PRODUCTION DOMAINS (SSL ENABLED)**
| **Domain** | **Tenant** | **Purpose** |
|------------|------------|-------------|
| `https://fmfb-34-59-143-25.nip.io` | `fmfb` | FMFB Banking |
| `https://orokii-34-59-143-25.nip.io` | `default` | OrokiiPay Platform |
| `https://banking-34-59-143-25.nip.io` | Any | Generic Banking |

**SSL Status**: ✅ All domains have trusted Let's Encrypt certificates (no browser warnings!)

### **TENANT SWITCHING**
```bash
# Switch to FMFB Banking
DEPLOYMENT_TYPE=fmfb_production

# Switch to OrokiiPay Platform
DEPLOYMENT_TYPE=saas_production

# Switch to Development Mode
DEPLOYMENT_TYPE=development
```

## 🔒 **RATE LIMITING (Environment-Based)**
| Environment | General Requests | Auth/Login | Notes |
|-------------|------------------|------------|-------|
| **Development/QA** | 1000 per 15min | **100 per 15min** | ✅ Relaxed for testing |
| **Production** | 100 per 15min | **5 per 15min** | 🔒 Strict security |

**To Enable Production Limits:**
```bash
NODE_ENV=production npm run server
```

**Current Behavior:**
- If `NODE_ENV` not set or `development`: **RELAXED** limits (100 logins per 15min)
- If `NODE_ENV=production`: **STRICT** limits (5 logins per 15min)

## 🔐 **NIBSS API CONFIGURATION**
```bash
# FirstMidas Microfinance Bank Limited
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
NIBSS_API_KEY=o1rjrqtLdaZou7PQApzXQVHygLqEnoWi
NIBSS_CLIENT_ID=d86e0fe1-2468-4490-96bb-588e32af9a89
NIBSS_CLIENT_SECRET='~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa'
NIBSS_RESET_URL=https://apitest.nibss-plc.com.ng/v2/reset
NIBSS_ENVIRONMENT=sandbox
NIBSS_APP_NAME=NIP_MINI_SERVICE
NIBSS_INSTITUTION_CODE=090575
NIBSS_MANDATE_REFERENCE=RC0220310/1349/0009291032
FCMB_BILLER_ID=362
# Whitelisted GCP IP: 34.59.143.25
```

## 📱 **ANDROID APK BUILD**
```bash
# Use JDK 21 (CRITICAL - JDK 24 fails with CMake errors)
source "/Users/bisiadedokun/.sdkman/bin/sdkman-init.sh"
sdk use java 21.0.4-tem

# Build APK
./android/gradlew clean -p android
./android/gradlew assembleDebug -p android
```
**APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk`

### ⚠️ **JDK Compatibility**
- ✅ **JDK 21**: Works perfectly (recommended)
- ✅ **JDK 17**: Also compatible
- ❌ **JDK 24**: CMake "restricted method" error with react-native-screens

## 📊 **CURRENT STATUS**
- **Transfer Tests**: 14/14 passing (100%) ✅
- **Coverage**: 47.97% overall, 68.26% transfer routes
- **Critical Path**: Money transfers fully tested and working
- **APK Build**: ✅ Working with JDK 21

## 🚀 **FAST DEPLOYMENT**
```bash
# Deploy to production in 3-5 minutes
./simple-deploy.sh

# View deployment guide
cat FAST_DEPLOYMENT_GUIDE.md
```

## 📋 **PHASE 3 ROADMAP (Next Implementation)**
- **NIBSS Production Integration** (6 weeks) - Name Enquiry, Fund Transfer, TSQ
- **Savings & Loans Platform** (6 weeks) - 4 savings products, progressive loan system
- **Integration & Testing** (4 weeks) - 65 test scenarios
- **See**: `PHASE3_IMPLEMENTATION_PLAN.md` for complete 16-week plan

## 📚 **FULL DOCUMENTATION**
- **Development Guide**: `docs/DEVELOPMENT_GUIDE.md`
- **Claude Code Guide**: `docs/CLAUDE_CODE_INTEGRATION.md`
- **Project Overview**: `PROJECT_OVERVIEW.md`
- **Roadmap**: `PROJECT_IMPLEMENTATION_ROADMAP.md`
- **Phase 2 AI**: `PHASE2_AI_ENHANCEMENTS.md`
- **Phase 3 Plan**: `PHASE3_IMPLEMENTATION_PLAN.md`
- **NIBSS Endpoints**: `PRODUCTION_TRANSFER_ENDPOINTS.md`
- **Savings/Loans**: `docs/saving-loans-req.md`

---
*Last Updated: September 24, 2025*
*Version: 2.0 - Added Phase 3 roadmap, deployment guide, comprehensive docs*