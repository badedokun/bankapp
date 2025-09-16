# 🚀 Banking App - Quick Reference Card

## 📋 **BEFORE STARTING ANY DEVELOPMENT**
```bash
npm run db:migrate && npm run test:integration
```

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

## 📚 **FULL DOCUMENTATION**
- **Development Guide**: `docs/DEVELOPMENT_GUIDE.md`
- **Claude Code Guide**: `docs/CLAUDE_CODE_INTEGRATION.md`  
- **Project Overview**: `docs/PROJECT_OVERVIEW.md`

---
*Based on real experience achieving 100% test pass rate*