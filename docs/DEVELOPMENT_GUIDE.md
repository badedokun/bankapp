# Banking Application Development Guide

> **⚠️ CRITICAL**: This is a banking application handling real money transactions. No shortcuts allowed on testing or data integrity.

## 🎯 Quick Reference for New Developers/Agents

### Before Starting Development
```bash
# Essential pre-development checks
cp .env.local.example .env.local  # Set up local environment
npm run db:migrate                # Apply database migrations
npm run test:integration           # Verify existing functionality
npm run db:verify-schema          # Check table existence
node test-environment-config.js   # Verify environment configuration
```

### Core Development Principles
1. **Database-First**: Schema must exist before code that uses it
2. **Real Database Testing**: Never mock core banking operations
3. **Integration Testing**: Test with actual database, not mocks
4. **External Service Mocking**: Only mock external APIs (NIBSS, fraud detection)

---

## 🚨 Critical Lessons from Previous Development

### Major Issues Encountered
1. **Missing Database Tables** (`transaction_logs`, `recipients`)
   - **Impact**: 500 errors, failed tests, hours of debugging
   - **Root Cause**: Code generated before schema validation
   - **Prevention**: Always verify table existence before writing queries

2. **Test Data Validation Mismatches**
   - **Issue**: Tests used invalid formats (999M amount > 1M limit, 'wrong-pin' vs 4-digit requirement)
   - **Impact**: False test failures, confusion about validation rules
   - **Prevention**: Validate test data against actual API constraints

3. **Authentication Flow Complexity**
   - **Issue**: Password length validation (7 chars vs 8+ required)
   - **Impact**: All transfer tests failing due to auth issues
   - **Prevention**: Test authentication flow independently first

---

## 🌍 Environment Configuration System (NEW)

### Overview
The application now uses a **centralized environment configuration system** that automatically detects deployment environments and configures URLs accordingly. This eliminates the need for manual URL changes when switching between local development and cloud deployments.

### ⚠️ BREAKING CHANGE ALERT
**Previous hardcoded localhost references have been replaced with centralized configuration.**

### Key Features
- **🔍 Automatic Detection**: Detects local vs cloud environments
- **🔗 Smart URL Resolution**: Absolute URLs locally, relative URLs in cloud
- **🎯 Zero Configuration**: Switch environments without code changes
- **☁️ Multi-Cloud Support**: GCP, AWS, Vercel, Netlify, Heroku

### Environment Setup

#### For Local Development:
```bash
# Copy and configure local environment
cp .env.local.example .env.local
# Default values work for most cases - no editing required

# Start applications
npm run server  # API server on localhost:3001
npm run web     # Web app on localhost:3000
```

#### For Cloud Deployment:
```bash
# Copy and configure cloud environment
cp .env.cloud.example .env
# Edit with your cloud-specific values (database, secrets, etc.)
nano .env

# Deploy (environment URLs are handled automatically)
./deploy.sh
```

### Environment Configuration Files

| File | Purpose | Usage |
|------|---------|-------|
| `src/config/environment.ts` | Main frontend config | Automatic environment detection |
| `src/config/testEnvironment.js` | Test files config | Used by test files and CI/CD |
| `.env.local.example` | Local development template | Copy to `.env.local` |
| `.env.cloud.example` | Cloud deployment template | Copy to `.env` |
| `ENVIRONMENT_SETUP.md` | Detailed setup guide | Comprehensive documentation |

### URL Resolution Strategy

#### Local Development
- **API URLs**: `http://localhost:3001/api/endpoint`
- **Web URLs**: `http://localhost:3000/path`
- **WebSocket**: `ws://localhost:3000`

#### Cloud Deployment
- **API URLs**: `/api/endpoint` (relative to same domain)
- **Web URLs**: `/path` (relative to same domain)
- **WebSocket**: Relative WebSocket URLs

### Usage in Code

#### ✅ CORRECT - New Centralized Approach:
```javascript
import { buildApiUrl, buildWebUrl } from '../config/environment';

// Automatically resolves to correct URL for environment
const apiUrl = buildApiUrl('/api/transfers/initiate');
const webUrl = buildWebUrl('/dashboard');
```

#### ❌ INCORRECT - Old Hardcoded Approach:
```javascript
// DON'T DO THIS ANYMORE - This breaks cloud deployments
const apiUrl = 'http://localhost:3001/api/transfers/initiate';
const webUrl = 'http://localhost:3000/dashboard';
```

### Testing Environment Configuration
```bash
# Verify environment configuration works correctly
node test-environment-config.js

# Should show 100% success rate:
# ✅ Local URLs contain localhost
# ✅ Cloud URLs are relative (empty)
# ✅ Custom URLs match environment variables
# ✅ buildApiUrl handles relative URLs correctly
# ✅ buildApiUrl handles absolute URLs correctly
```

### Migration Guide
If you encounter hardcoded localhost URLs in your code:

1. **Replace hardcoded URLs**:
   ```javascript
   // Before
   const baseUrl = 'http://localhost:3001/api';
   
   // After
   import { ENV_CONFIG } from '../config/environment';
   const baseUrl = ENV_CONFIG.API_URL;
   ```

2. **Update test files**:
   ```javascript
   // Before
   const testUrl = 'http://localhost:3001/api';
   
   // After
   const { API_URL } = require('./src/config/testEnvironment');
   const testUrl = API_URL;
   ```

3. **Verify configuration**:
   ```bash
   npm run test:integration  # Ensure tests still pass
   node test-environment-config.js  # Verify environment switching
   ```

### Troubleshooting

#### API calls failing in cloud?
- **Check**: `REACT_APP_API_URL` should be empty for same-domain deployment
- **Solution**: Use relative URLs by leaving `REACT_APP_API_URL=` empty

#### Tests using wrong URLs?
- **Check**: Test files importing from `testEnvironment.js`
- **Solution**: Update tests to use centralized configuration

#### Debug environment detection:
```javascript
import { ENV_CONFIG } from './src/config/environment';
console.log('Environment Config:', ENV_CONFIG);
```

---

## 📋 Schema-First Development Checklist

### ✅ Before Writing Database Code
```bash
# Verify database state
psql -d bank_app_platform -c "\dt"  # List all tables
psql -d bank_app_platform -c "\d table_name"  # Check specific table structure

# Check migrations status
npm run db:status

# Apply pending migrations
npm run db:migrate
```

### ✅ Database Schema Validation
```sql
-- Essential tables for banking operations
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'tenant' 
AND table_name IN ('users', 'wallets', 'transfers', 'recipients', 'transaction_logs');

-- Verify column existence before using
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'transaction_pin_hash';
```

---

## 🧪 Testing Strategy (Banking-Specific)

### Core Testing Principles
```markdown
✅ DO: Use real database for all banking operations
✅ DO: Mock external services (NIBSS, fraud detection, payment gateways)
✅ DO: Test with valid business constraints (amounts, PIN formats)
✅ DO: Test authentication flows independently
❌ DON'T: Mock database operations for money transfers
❌ DON'T: Skip integration tests for critical paths
❌ DON'T: Use invalid test data that fails validation
```

### Test Data Guidelines
```javascript
// ✅ Valid test data
const validTransferRequest = {
  recipientAccountNumber: '1234567890',  // Exactly 10 digits
  recipientBankCode: '058',              // Exactly 3 digits  
  amount: 10000,                         // Between 100 and 1,000,000
  pin: '1234'                           // Exactly 4 digits
};

// ❌ Invalid test data that will fail
const invalidTransferRequest = {
  recipientAccountNumber: '123',         // Too short
  amount: 999999999,                     // Above 1M limit
  pin: 'wrong-pin'                      // Wrong format
};
```

### Test Structure Template
```javascript
describe('Banking Feature Tests', () => {
  beforeAll(async () => {
    // 1. Ensure database is migrated
    // 2. Set up test data with valid formats
    // 3. Authenticate and get valid tokens
  });

  beforeEach(async () => {
    // Reset only external service mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up test data
    // Close database connections
  });
});
```

---

## 🤖 Claude Code Integration Best Practices

### Pre-Generation Context Preparation
```markdown
# Always provide this context to Claude Code:

## Database Schema
- Share current schema.sql or migration files
- List all existing tables and their purposes
- Specify any missing tables that need to be created

## API Validation Rules
- Amount limits: ₦100 - ₦1,000,000
- PIN format: exactly 4 digits
- Account numbers: exactly 10 digits
- Bank codes: exactly 3 digits

## External Services
- Mock: NIBSS payment gateway
- Mock: Fraud detection service  
- Real: Database operations
- Real: Authentication system

## Testing Requirements
- Real database testing (no mocks for banking operations)
- Integration tests for all money transfer flows
- Test data must pass validation rules
```

### Effective Claude Code Prompts
```markdown
# ✅ Good Prompt
Generate transfer initiation route with these requirements:
- Database schema: tenant.transfers table exists with columns [id, sender_id, amount, status]
- Validation: amount between 100-1000000, PIN exactly 4 digits
- External services: Mock NIBSS (nibssService.initiateTransfer)
- Testing: Real database, valid test amounts, proper PIN format
- Error handling: Return appropriate HTTP status codes

# ❌ Poor Prompt
Create a transfer endpoint
```

### Post-Generation Validation Checklist
```bash
# Immediate validation after code generation
npm run test:integration    # Run against real database
npm run lint               # Check code quality
npm run typecheck          # Verify TypeScript types

# Database verification
psql -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'transfers'"

# API endpoint testing
curl -X POST http://localhost:3001/api/transfers/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 10000, "pin": "1234", ...}'
```

---

## 🔧 Debugging Banking Applications

### 500 Error Investigation Priority
1. **Database Table Existence**
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_name = 'missing_table';
   ```

2. **Column/Constraint Issues**
   ```sql
   \d table_name  -- PostgreSQL describe table
   ```

3. **Foreign Key Violations**
   ```sql
   SELECT constraint_name, table_name FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY';
   ```

4. **Transaction Isolation Issues**
   - Check for uncommitted transactions
   - Verify proper BEGIN/COMMIT/ROLLBACK usage

### Authentication Issues Debug Steps
1. Check password length validation (8+ characters required)
2. Verify tenant ID format and existence
3. Test JWT token generation and validation
4. Confirm user exists in database with correct tenant association

### Test Failure Investigation
1. **Validation Errors (400)**: Check if test data matches API validation rules
2. **Authentication Errors (401)**: Verify login credentials and token format
3. **Database Errors (500)**: Check table/column existence first
4. **Business Logic Errors**: Verify business rules (balance, limits, constraints)

---

## 📊 Success Metrics

### Test Coverage Targets
- **Critical Banking Operations**: 90%+ coverage
- **Transfer Routes**: 70%+ coverage (achieved: 68.26%)
- **Authentication**: 60%+ coverage
- **Overall Branch Coverage**: 30%+ (currently: 23.66%)

### Performance Benchmarks
- **Transfer Initiation**: < 2 seconds
- **Fraud Detection**: < 500ms
- **Database Operations**: < 100ms average
- **Test Suite**: < 30 seconds total

---

## 🚀 Development Workflow

### Daily Development Process
```bash
# Morning startup
git pull origin main
npm run db:migrate
npm run test:integration
npm start

# Before committing
npm run test
npm run lint
npm run typecheck
npm run build

# Before pushing
npm run test:coverage
git add . && git commit -m "feat: descriptive message"
git push origin feature-branch
```

### Android APK Build Process
```bash
# CRITICAL: Use JDK 21 (JDK 24 causes CMake errors)
source "/Users/bisiadedokun/.sdkman/bin/sdkman-init.sh"
sdk use java 21.0.4-tem

# Verify Java version
java -version  # Should show JDK 21

# Clean and build APK
./android/gradlew clean -p android
./android/gradlew assembleDebug -p android

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Java Version Compatibility Matrix
| JDK Version | Status | Notes |
|------------|--------|--------|
| JDK 21 | ✅ Recommended | Perfect compatibility with react-native-screens |
| JDK 17 | ✅ Compatible | Also works well |
| JDK 24 | ❌ FAILS | CMake "restricted method" error with JEP 472 |

#### APK Build Troubleshooting
1. **CMake "Restricted Method" Error**: Switch to JDK 21
2. **Gradle Permission Issues**: Ensure `./android/gradlew` is executable
3. **Build Cache Issues**: Run `./android/gradlew clean -p android` first
4. **Native Module Conflicts**: Check react-native-screens compatibility

### Code Review Checklist
- [ ] Database schema validated
- [ ] Tests use real database for banking operations  
- [ ] External services properly mocked
- [ ] Test data follows validation rules
- [ ] Error handling includes proper HTTP status codes
- [ ] Authentication flow tested independently
- [ ] No hardcoded credentials or test data in production code
- [ ] APK builds successfully with JDK 21 (for Android releases)

---

## 📞 Emergency Debugging Guide

### Production Issue Response
1. **Check database connectivity and table existence**
2. **Verify recent migration status**
3. **Check external service availability (NIBSS, fraud detection)**
4. **Review recent code changes affecting banking operations**
5. **Monitor transaction logs for patterns**

### Common Fixes
```bash
# Database connection issues
npm run db:reconnect

# Schema sync issues  
npm run db:migrate:reset
npm run db:migrate

# Test data cleanup
npm run db:seed:reset
npm run test:setup
```

---

*Last updated after achieving 100% test pass rate for transfer routes (14/14 tests passing)*