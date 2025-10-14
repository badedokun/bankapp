# Phase 3: Multi-Currency Manual Testing Guide

## Test Environment Setup

**Frontend**: http://localhost:3000
**Backend**: http://localhost:3001
**Status**: ✅ Both servers running

## Test Accounts

### 1. FMFB (Nigeria - NGN)
- **Email**: admin@fmfb.com
- **Password**: Admin-7-super
- **Expected Currency**: ₦ (Naira)
- **Expected Balance**: ₦4,915,000
- **Locale**: en-NG

### 2. US Bank (USA - USD)
- **Email**: admin@usbank.com
- **Password**: Admin-7-super
- **Expected Currency**: $ (Dollar)
- **Expected Balance**: $50,000
- **Locale**: en-US

### 3. CA Bank (Canada - CAD)
- **Email**: admin@cabank.com
- **Password**: Admin-7-super
- **Expected Currency**: CA$ (Canadian Dollar)
- **Expected Balance**: CA$65,000
- **Locale**: en-CA

### 4. EU Bank (Europe - EUR)
- **Email**: admin@eubank.com
- **Password**: Admin-7-super
- **Expected Currency**: € (Euro)
- **Expected Balance**: €45,000
- **Locale**: de-DE

---

## Manual Test Checklist

### Test 1: Login & Dashboard Currency Display

**For FMFB (NGN):**
- [ ] Navigate to http://localhost:3000
- [ ] Login with admin@fmfb.com / Admin-7-super
- [ ] Verify logo shows "Firstmidas Microfinance Bank"
- [ ] Verify primary color is deep blue (#010080)
- [ ] **Check dashboard balance shows ₦ symbol**
- [ ] **Verify all monetary amounts use ₦**
- [ ] Check number format: 4,915,000 (comma separators)
- [ ] Screenshot: `test-results/fmfb-dashboard.png`

**For US Bank (USD):**
- [ ] Open new incognito/private window
- [ ] Navigate to http://localhost:3000
- [ ] Login with admin@usbank.com / Admin-7-super
- [ ] **Check dashboard balance shows $ symbol**
- [ ] **Verify all monetary amounts use $**
- [ ] Check number format: 50,000 (comma separators)
- [ ] Screenshot: `test-results/usbank-dashboard.png`

---

### Test 2: Transfer Screen Currency

**For FMFB (NGN):**
- [ ] Click "Transfer" or "Send Money"
- [ ] Click "Internal Transfer"
- [ ] **Verify amount input shows ₦ prefix**
- [ ] **Check transfer limits display in ₦**
- [ ] **Verify fee calculation shows ₦**
- [ ] Enter amount: 10000
- [ ] Verify display shows: ₦10,000
- [ ] Screenshot: `test-results/fmfb-transfer.png`

**For US Bank (USD):**
- [ ] Click "Transfer" or "Send Money"
- [ ] Click "Internal Transfer"
- [ ] **Verify amount input shows $ prefix**
- [ ] **Check transfer limits display in $**
- [ ] Enter amount: 1000
- [ ] Verify display shows: $1,000
- [ ] Screenshot: `test-results/usbank-transfer.png`

---

### Test 3: Transaction History Currency

**For FMFB (NGN):**
- [ ] Navigate to "History" or "Transactions"
- [ ] **Verify all transaction amounts show ₦**
- [ ] Check transaction list formatting
- [ ] Click on a transaction (if any exist)
- [ ] **Verify transaction details show ₦**
- [ ] Screenshot: `test-results/fmfb-history.png`

**For US Bank (USD):**
- [ ] Navigate to "History" or "Transactions"
- [ ] **Verify all transaction amounts show $**
- [ ] Screenshot: `test-results/usbank-history.png`

---

### Test 4: Savings & Loans Currency

**For FMFB (NGN):**
- [ ] Navigate to "Savings"
- [ ] **Check savings goals display ₦**
- [ ] **Verify interest rates show proper format**
- [ ] **Check minimum amounts show ₦**
- [ ] Navigate to "Loans"
- [ ] **Verify loan amounts show ₦**
- [ ] **Check loan limits display ₦**
- [ ] Screenshot: `test-results/fmfb-savings.png`

**For US Bank (USD):**
- [ ] Navigate to "Savings"
- [ ] **Check all amounts show $**
- [ ] Navigate to "Loans"
- [ ] **Verify all amounts show $**
- [ ] Screenshot: `test-results/usbank-loans.png`

---

### Test 5: Settings Currency Preferences

**For FMFB (NGN):**
- [ ] Navigate to "Settings"
- [ ] **Verify currency preference shows NGN**
- [ ] **Check locale shows en-NG**
- [ ] **Verify timezone shows Africa/Lagos**
- [ ] **Check spending limits show ₦**
- [ ] Screenshot: `test-results/fmfb-settings.png`

**For US Bank (USD):**
- [ ] Navigate to "Settings"
- [ ] **Verify currency preference shows USD**
- [ ] **Check locale shows en-US**
- [ ] **Verify timezone shows America/New_York**
- [ ] Screenshot: `test-results/usbank-settings.png`

---

### Test 6: AI Chat Currency (if available)

**For US Bank (USD):**
- [ ] Look for AI chat/assistant button
- [ ] Open AI chat interface
- [ ] Ask: "What is my balance?"
- [ ] **Verify AI response uses $ symbol**
- [ ] Ask: "Show my recent transactions"
- [ ] **Verify amounts in response use $**
- [ ] Screenshot: `test-results/usbank-ai-chat.png`

---

### Test 7: Cross-Currency Consistency

**For each tenant:**
- [ ] Check that NO other currency symbols appear
  - FMFB: Should NOT see $, €, £, CA$
  - US Bank: Should NOT see ₦, €, £, CA$
- [ ] Verify all monetary displays are consistent
- [ ] Check compact notation (e.g., ₦5M, $50K)
- [ ] Verify number formatting matches locale

---

## Test Results Template

### ✅ PASSED Tests
- [ ] Dashboard currency display
- [ ] Transfer screen currency
- [ ] Transaction history currency
- [ ] Savings/loans currency
- [ ] Settings currency preferences
- [ ] AI chat currency (if applicable)
- [ ] Cross-currency consistency

### ❌ FAILED Tests
_(Record any failures with screenshots)_

### 🐛 Issues Found
_(Document any bugs or inconsistencies)_

### 📸 Screenshots
All screenshots should be saved in: `/Users/bisiadedokun/bankapp/test-results/`

---

## Expected Outcomes

### Phase 3 Success Criteria:
1. ✅ Each tenant displays ONLY their configured currency
2. ✅ Currency symbols are correct (₦, $, CA$, €)
3. ✅ Number formatting matches locale (commas, decimals)
4. ✅ All screens show consistent currency
5. ✅ No hardcoded ₦ symbols visible on non-NGN tenants
6. ✅ AI responses use tenant's currency

### Platform Global Readiness Score:
- **Phase 1**: 85/100 (Infrastructure complete)
- **Phase 2**: 95/100 (UI internationalization complete)
- **Phase 3 Target**: 98/100 (Validation complete)

---

## How to Report Results

After completing manual testing, document your findings:

1. **Create test report**: `PHASE3_TEST_RESULTS.md`
2. **Include screenshots**: Attach all captured screenshots
3. **List issues**: Document any currency display problems
4. **Recommendations**: Suggest fixes for any failures

---

## Quick Start

```bash
# 1. Ensure servers are running
# Frontend: http://localhost:3000
# Backend: http://localhost:3001

# 2. Test FMFB (NGN)
# - Login: admin@fmfb.com / Admin-7-super
# - Verify: All amounts show ₦

# 3. Test US Bank (USD)
# - Login: admin@usbank.com / Admin-7-super
# - Verify: All amounts show $

# 4. Document findings in PHASE3_TEST_RESULTS.md
```

---

## Notes

- E2E automated tests have been created but require selector adjustments
- Manual testing provides visual confirmation of currency display
- Focus on USD tenant as primary validation (most different from NGN)
- Take screenshots for documentation
