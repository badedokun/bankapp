# Claude Code Integration Guide for Banking Applications

> **🎯 Goal**: Maximize Claude Code effectiveness while minimizing debugging time on banking applications.

## 📋 Quick Reference Card

### Before Calling Claude Code
```bash
npm run db:migrate && npm run db:verify && npm run test:integration
```

### Essential Context to Always Provide
1. **Database Schema** (current table structure)
2. **API Validation Rules** (amount limits, format requirements)
3. **External Service Contracts** (what to mock vs real)
4. **Testing Approach** (real DB vs mocks)

### Red Flags to Avoid
- ❌ "Create a banking feature" (too vague)
- ❌ Generating code before schema validation
- ❌ Mocking database operations for money transfers
- ❌ Using invalid test data in examples

---

## 🚀 Proven Success Patterns

### Context Preparation Template
```markdown
# Banking Feature Request for Claude Code

## Current Database Schema
```sql
-- Essential tables that exist:
CREATE TABLE tenant.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  transaction_pin_hash VARCHAR  -- Note: Column exists
);

CREATE TABLE tenant.wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  balance DECIMAL(15,2),
  source_account VARCHAR(10)
);

CREATE TABLE tenant.transfers (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  amount DECIMAL(15,2),
  status VARCHAR DEFAULT 'pending'
);

-- Tables that DO NOT exist yet:
-- recipients (need to create or mock)
-- transaction_logs (need to create or mock)
```

## API Validation Constraints
- **Amount**: Between ₦100 and ₦1,000,000
- **PIN**: Exactly 4 digits (0000-9999)
- **Account Number**: Exactly 10 digits
- **Bank Code**: Exactly 3 digits

## External Service Integration
**Mock These (External APIs):**
- NIBSS payment gateway: `nibssService.initiateTransfer()`
- Fraud detection: `fraudDetectionService.analyzeTransaction()`

**Keep Real (Core Banking):**
- Database operations (users, wallets, transfers)
- Authentication/authorization
- Business logic validation

## Testing Requirements
- Use real database for all banking operations
- Mock external services only
- Test data must pass API validation rules
- Cover both success and error scenarios
```

### Effective Prompt Examples

#### ✅ Excellent Prompt
```markdown
Generate a transfer initiation endpoint with these specifications:

**Database Schema**: 
- `tenant.transfers` table exists with columns: id, sender_id, recipient_id, amount, status, created_at
- `tenant.wallets` table exists with: id, user_id, balance, source_account
- `recipients` table DOES NOT exist - please comment out or mock recipients functionality

**API Validation**:
- Amount: 100 to 1,000,000 (use isFloat({ min: 100, max: 1000000 }))
- PIN: exactly 4 digits (use isLength({ min: 4, max: 4 }))
- Account numbers: exactly 10 digits

**External Services**:
- Mock NIBSS: `nibssService.initiateTransfer()` returns { success: true, transactionId: 'NIBSS_123' }
- Mock fraud detection: `fraudDetectionService.analyzeTransaction()` returns { decision: 'approve', riskScore: 15 }

**Testing**:
- Write integration tests using real database
- Use valid test data: amount: 10000, pin: '1234', accountNumber: '1234567890'
- Test insufficient balance with amount: 1000000 (max allowed)

**Error Handling**:
- 400 for validation errors
- 401 for invalid PIN
- 403 for fraud blocks
- 500 for database errors
```

#### ❌ Poor Prompt
```markdown
Create transfer functionality for my banking app
```

---

## 🛠️ Pre-Generation Validation Scripts

### Database Schema Checker
```bash
#!/bin/bash
# scripts/validate-schema.sh

echo "🔍 Validating database schema before code generation..."

# Check essential tables exist
REQUIRED_TABLES=("users" "wallets" "transfers")
MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
  result=$(psql -d bank_app_platform -t -c "SELECT to_regclass('tenant.$table');")
  if [[ $result == *"null"* ]]; then
    MISSING_TABLES+=($table)
  fi
done

if [ ${#MISSING_TABLES[@]} -ne 0 ]; then
  echo "❌ Missing tables: ${MISSING_TABLES[*]}"
  echo "💡 Run: npm run db:migrate"
  exit 1
else
  echo "✅ All required tables exist"
fi

# Check critical columns
echo "🔍 Checking critical columns..."
pin_column=$(psql -d bank_app_platform -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='transaction_pin_hash';")
if [[ -z "$pin_column" ]]; then
  echo "⚠️  Warning: transaction_pin_hash column missing - PIN validation will need workaround"
fi

echo "✅ Schema validation complete"
```

### Context Generator Script
```bash
#!/bin/bash
# scripts/generate-context.sh

echo "📋 Generating Claude Code context..."

echo "## Current Database Schema" > claude-context.md
pg_dump -d bank_app_platform --schema-only --no-owner >> claude-context.md

echo -e "\n## API Validation Rules" >> claude-context.md
cat << EOF >> claude-context.md
- Amount: ₦100 - ₦1,000,000
- PIN: 4 digits exactly
- Account Number: 10 digits exactly  
- Bank Code: 3 digits exactly
EOF

echo -e "\n## External Services to Mock" >> claude-context.md
cat << EOF >> claude-context.md
- nibssService.initiateTransfer()
- fraudDetectionService.analyzeTransaction()
EOF

echo "✅ Context file generated: claude-context.md"
```

---

## 🧪 Post-Generation Validation Checklist

### Immediate Testing (< 2 minutes)
```bash
# 1. Verify tables exist
npm run db:verify-schema

# 2. Basic API health check  
curl -X POST localhost:3001/api/transfers/initiate \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | grep -q "error\|success"

# 3. Run integration tests
npm run test:integration
```

### Code Quality Check (< 1 minute)
```bash
npm run lint && npm run typecheck
```

### Database Operation Verification
```sql
-- Check if generated code references existing tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('transfers', 'recipients', 'transaction_logs');

-- Verify no hardcoded test data in migrations
SELECT * FROM transfers WHERE description LIKE '%test%' OR amount = 999999999;
```

---

## 🚨 Common Anti-Patterns & Fixes

### Anti-Pattern 1: Missing Table References
```javascript
// ❌ Generated code that will fail
await query(`
  INSERT INTO transaction_logs (transfer_id, event_type, message)
  VALUES ($1, 'TRANSFER_COMPLETED', $2)
`, [transferId, message]);

// ✅ Fixed version
console.log(`Transfer completed: ${transferId} - ${message}`);
// TODO: Create transaction_logs table or implement proper logging
```

### Anti-Pattern 2: Invalid Test Data
```javascript
// ❌ Test data that fails validation
const testData = {
  amount: 999999999,        // Above 1M limit
  pin: 'wrong-pin',        // Wrong format
  accountNumber: '123'     // Too short
};

// ✅ Valid test data
const testData = {
  amount: 1000000,         // Maximum allowed
  pin: '9999',            // Wrong PIN but valid format
  accountNumber: '0000000000'  // Invalid but proper length
};
```

### Anti-Pattern 3: Mocking Core Banking Operations
```javascript
// ❌ Mocking database operations
jest.mock('../database', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ id: '123' }] })
}));

// ✅ Mock only external services
jest.mock('../services/nibss', () => ({
  nibssService: {
    initiateTransfer: jest.fn().mockResolvedValue({ success: true })
  }
}));
```

---

## 📊 Success Metrics & Monitoring

### Development Velocity Targets
- **Schema-to-Working-Code**: < 30 minutes
- **Test Writing**: < 15 minutes  
- **Debug-to-Fix**: < 10 minutes per issue
- **Full Feature Completion**: < 2 hours

### Quality Gates
```bash
# All must pass before considering feature complete
npm run test:integration     # 100% pass rate required
npm run test:coverage        # Banking routes >70% coverage
npm run security:scan        # No critical vulnerabilities
npm run performance:test     # <2s response time for transfers
```

### Code Generation Effectiveness Score
```markdown
Rate your Claude Code session (1-10):

Schema Preparation: __/10
- 10: Complete schema, all tables verified
- 5: Partial schema, some missing tables noted
- 1: No schema validation

Prompt Quality: __/10  
- 10: Specific requirements, validation rules, test examples
- 5: General requirements, some context
- 1: Vague request

Post-Generation Issues: __/10
- 10: Code works immediately, no debugging needed
- 5: Minor fixes needed (test data, validation)
- 1: Major debugging required (missing tables, wrong logic)

Target Score: 8.5+/10 average
```

---

## 🎓 Team Training & Onboarding

### New Developer Checklist
- [ ] Read this guide completely
- [ ] Set up database validation scripts
- [ ] Practice generating context files
- [ ] Complete one full Claude Code session with supervision
- [ ] Review common debugging patterns

### Team Knowledge Sharing
```markdown
# Weekly Claude Code Review Session

## What Worked Well This Week
- Schema validation caught X issues early
- Context preparation reduced debugging by Y hours  
- Integration testing found Z critical bugs

## Improvements for Next Week
- Update schema validation scripts
- Add new validation rules discovered
- Share effective prompts that worked

## Anti-Patterns Observed
- Document any new anti-patterns discovered
- Update this guide with fixes
```

---

## 🔮 Advanced Techniques

### Progressive Enhancement Approach
```markdown
# Phase 1: Core Functionality (Claude Code)
- Basic CRUD operations
- Essential validations
- Happy path testing

# Phase 2: Error Handling (Claude Code + Manual)
- Edge cases and error scenarios
- Comprehensive validation
- Security considerations  

# Phase 3: Performance & Polish (Manual)
- Optimization
- Advanced error handling
- Production hardening
```

### Context Versioning
```bash
# Save successful contexts for reuse
cp claude-context.md contexts/transfers-v1.0-success.md

# Version control for context files
git add docs/contexts/
git commit -m "docs: Add successful transfer route context template"
```

---

*Last updated: After achieving 14/14 transfer tests passing with Claude Code assistance*

*Success Rate: 100% test pass rate achieved using these guidelines*