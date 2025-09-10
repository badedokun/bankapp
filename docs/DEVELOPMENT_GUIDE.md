# Banking Application Development Guide

> **⚠️ CRITICAL**: This is a banking application handling real money transactions. No shortcuts allowed on testing or data integrity.

## 🎯 Quick Reference for New Developers/Agents

### Before Starting Development
```bash
# Essential pre-development checks
npm run db:migrate          # Apply database migrations
npm run test:integration     # Verify existing functionality
npm run db:verify-schema     # Check table existence
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
curl -X POST localhost:3001/api/transfers/initiate \
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

### Code Review Checklist
- [ ] Database schema validated
- [ ] Tests use real database for banking operations  
- [ ] External services properly mocked
- [ ] Test data follows validation rules
- [ ] Error handling includes proper HTTP status codes
- [ ] Authentication flow tested independently
- [ ] No hardcoded credentials or test data in production code

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