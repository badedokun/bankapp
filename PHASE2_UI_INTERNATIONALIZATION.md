# Phase 2: UI/UX Internationalization Implementation Plan

**Start Date**: September 30, 2025
**Estimated Duration**: 2 weeks
**Goal**: Complete UI/UX internationalization for all components

---

## 🎯 Objectives

1. Update all 34 remaining files with hardcoded currency (`₦`)
2. Update all date formatting to use dynamic locale
3. Integrate i18n translations in key components
4. Test multi-currency functionality across all screens
5. Fix pre-existing TypeScript compilation errors

---

## 📋 Phase 2 Tasks Breakdown

### Week 1: Component Currency & Date Updates

#### Day 1-2: Batch Currency Updates

**Target**: Update 34 files with hardcoded `₦` symbol

**Files to Update** (by priority):

**High Priority - Dashboard & Core Components** (10 files):
1. `src/components/dashboard/ModernDashboardWithAI.tsx`
2. `src/components/dashboard/ModernDashboardScreen.tsx`
3. `src/components/dashboard/EnhancedDashboardScreen.tsx`
4. `src/components/dashboard/BankingStatsGrid.tsx`
5. `src/components/dashboard/RecentActivityPanel.tsx`
6. `src/components/dashboard/TransactionLimitsPanel.tsx`
7. `src/screens/dashboard/ModernDashboardScreen.tsx`
8. `src/screens/ModernAIChatScreen.tsx`
9. `src/components/ai/AIChatInterface.tsx`
10. `src/screens/history/TransactionHistoryScreen.tsx`

**Medium Priority - Transfer Components** (7 files):
11. `src/screens/transfers/ModernTransferMenuScreen.tsx`
12. `src/screens/transfers/InternalTransferScreen.tsx`
13. `src/screens/transfers/ExternalTransferScreen.tsx`
14. `src/screens/transfers/CompleteTransferFlowScreen.tsx`
15. `src/screens/transfer/AITransferScreen.tsx`
16. `src/screens/bills/BillPaymentScreen.tsx`
17. `src/components/transfers/TransferHeader.tsx` (if needed)

**Medium Priority - Savings Components** (3 files):
18. `src/screens/savings/ModernSavingsMenuScreen.tsx`
19. `src/screens/savings/SavingsScreen.tsx`
20. `src/screens/savings/FlexibleSavingsScreen.tsx`

**Medium Priority - Loans Components** (3 files):
21. `src/screens/loans/ModernLoansMenuScreen.tsx`
22. `src/screens/loans/LoansScreen.tsx`
23. `src/screens/loans/PersonalLoanScreen.tsx`

**Lower Priority - Settings & Transactions** (4 files):
24. `src/screens/settings/SettingsScreen.tsx`
25. `src/screens/transactions/TransactionDetailsScreen.tsx`
26. `src/screens/transactions/__tests__/TransactionHistoryScreen.test.tsx`
27. `src/screens/dashboard/__tests__/DashboardScreen.test.tsx`

**Utility & UI Components** (7 files):
28. `src/utils/security.ts`
29. `src/utils/receiptGenerator.ts`
30. `src/components/ui/EnhancedInput.tsx`
31. `src/components/ui/Modal.tsx`
32. `src/components/ui/Card.tsx`
33. `src/components/ui/EnhancedButton.tsx`
34. `src/design-system/widgets.ts`

**Pattern to Apply**:
```typescript
// Before:
const formatted = `₦${amount.toLocaleString('en-NG')}`;

// After:
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useTenantTheme } from '../../context/TenantThemeContext';

const { theme } = useTenantTheme();
const formatted = formatCurrency(amount, theme.currency, { locale: theme.locale });
```

**Estimated Time**: 16 hours (2 days)

---

#### Day 3-4: Date Formatting Updates

**Target**: Replace all hardcoded `'en-NG'` locale in date formatting

**Search Pattern**:
```typescript
// Find all:
toLocaleDateString('en-NG')
toLocaleString('en-NG')
new Date().toLocaleDateString('en-NG')
```

**Update Pattern**:
```typescript
// Before:
const dateStr = date.toLocaleDateString('en-NG');

// After:
import { formatDate } from '../../utils/locale';
import { useTenantTheme } from '../../context/TenantThemeContext';

const { theme } = useTenantTheme();
const dateStr = formatDate(date, theme.locale, { timezone: theme.timezone });
```

**Files Likely to Have Date Formatting**:
- Dashboard components (showing recent activity)
- Transaction history screens
- Transfer screens (scheduled transfers)
- Savings/Loans screens (maturity dates)
- Settings screens (account opening date)

**Estimated Time**: 12 hours (2 days)

---

### Week 2: Testing & Documentation

#### Day 5-7: Component Testing

**Testing Strategy**:

1. **Manual Testing per Currency**:
   - Test FMFB tenant (NGN) - Baseline
   - Test US Bank tenant (USD) - North America
   - Test CA Bank tenant (CAD) - North America
   - Test EU Bank tenant (EUR) - Europe

2. **Screens to Test**:
   - Login → Dashboard
   - Dashboard → View balances (currency symbols)
   - Transfers → Create transfer (amount input, currency display)
   - Transaction History → View transactions (currency formatting)
   - Savings → View savings plans (currency display)
   - Loans → View loans (currency display)
   - Settings → View account info (date formatting)

3. **What to Verify**:
   - ✅ Currency symbols display correctly ($, €, ₦, £, etc.)
   - ✅ Number formatting respects locale (1,234.56 vs 1.234,56)
   - ✅ Date formatting respects locale (MM/DD/YYYY vs DD/MM/YYYY)
   - ✅ No hardcoded ₦ symbols visible
   - ✅ No console errors
   - ✅ Amounts calculate correctly

**Estimated Time**: 12 hours (3 days)

---

#### Day 8-10: Documentation & Cleanup

**Documentation Tasks**:

1. **Create PHASE2_COMPLETION_SUMMARY.md**
   - List all files updated
   - Before/after comparisons
   - Testing results
   - Known issues

2. **Update PHASE1_GLOBAL_DEPLOYMENT_IMPLEMENTATION.md**
   - Mark Phase 2 tasks as complete
   - Update completion checklist

3. **Create MULTI_CURRENCY_TESTING_GUIDE.md**
   - How to test different tenants
   - How to switch currencies
   - Common issues and solutions

**Cleanup Tasks**:

1. **Fix TypeScript Compilation Errors**:
   - Address RBAC middleware type errors
   - Fix transfer service type mismatches
   - Ensure clean `npm run server:build`

2. **Remove Console Logs**:
   - Remove debug console.log statements
   - Keep only error logging

3. **Code Review**:
   - Ensure consistent import statements
   - Verify all components use `useTenantTheme()`
   - Check for any missed hardcoded values

**Estimated Time**: 12 hours (3 days)

---

## 🔄 Implementation Approach

### Approach 1: Manual Updates (Recommended for Quality)

**Pros**:
- Full control over each change
- Can handle edge cases
- Better for understanding code
- Lower risk of breaking changes

**Cons**:
- Time-consuming (16+ hours)
- Repetitive work
- Prone to human error

**Recommended For**: High-priority components (Dashboard, Transfers)

---

### Approach 2: Semi-Automated Updates

**Script**: Create a Node.js script to assist with updates

```javascript
// update-currency.js
const fs = require('fs');
const path = require('path');

const files = [
  'src/components/dashboard/ModernDashboardWithAI.tsx',
  // ... all 34 files
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports if not present
  if (!content.includes('formatCurrency')) {
    const importLine = "import { formatCurrency, getCurrencySymbol } from '../../utils/currency';\\n";
    content = content.replace(
      /(import.*from.*react.*;)/,
      `$1\\n${importLine}`
    );
  }

  if (!content.includes('useTenantTheme')) {
    const importLine = "import { useTenantTheme } from '../../context/TenantThemeContext';\\n";
    content = content.replace(
      /(import.*from.*react.*;)/,
      `$1\\n${importLine}`
    );
  }

  // Replace hardcoded currency patterns
  content = content.replace(
    /`₦\${([^}]+).toLocaleString\('en-NG'[^)]*\)}`/g,
    'formatCurrency($1, theme.currency, { locale: theme.locale })'
  );

  content = content.replace(
    /'₦'/g,
    'getCurrencySymbol(theme.currency)'
  );

  // Add useTenantTheme hook if not present
  if (content.includes('formatCurrency') && !content.includes('const { theme } = useTenantTheme()')) {
    content = content.replace(
      /(const \w+ = \(\) => {)/,
      `$1\\n  const { theme } = useTenantTheme();`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${filePath}`);
}

files.forEach(updateFile);
```

**Pros**:
- Faster than manual (4-6 hours)
- Consistent changes
- Reduces human error

**Cons**:
- May not handle all edge cases
- Requires manual review after
- Regex can be fragile

**Recommended For**: Lower-priority components (UI widgets, utilities)

---

## 📊 Success Metrics

**Phase 2 Completion Criteria**:

- [ ] All 34 files updated with dynamic currency
- [ ] All date formatting uses dynamic locale
- [ ] Zero hardcoded ₦ symbols in components
- [ ] Zero hardcoded 'en-NG' in date formatting
- [ ] Multi-currency testing completed (4 tenants)
- [ ] TypeScript compilation clean (no errors)
- [ ] All tests passing
- [ ] Documentation complete

**Quality Metrics**:

- [ ] Code review completed
- [ ] No console errors in browser
- [ ] Amounts display correctly in all currencies
- [ ] Dates format correctly in all locales
- [ ] No visual regressions

---

## 🎯 Phase 2 Deliverables

1. **Code Updates**:
   - 34 files updated with dynamic currency
   - Date formatting updates across all components
   - Clean TypeScript compilation

2. **Testing**:
   - Multi-currency testing completed
   - 4 test tenants validated (NGN, USD, CAD, EUR)
   - Screenshots of each tenant

3. **Documentation**:
   - PHASE2_COMPLETION_SUMMARY.md
   - MULTI_CURRENCY_TESTING_GUIDE.md
   - Updated README with deployment instructions

4. **Git Commits**:
   - Batch 1: Dashboard components update
   - Batch 2: Transfer/Savings/Loans components
   - Batch 3: UI components and utilities
   - Batch 4: Date formatting updates
   - Final: Phase 2 completion commit

---

## 🚀 Next Steps After Phase 2

**Phase 3 (Optional)**: Multi-Language Support
- French translations
- German translations
- Spanish translations
- Language switcher in settings
- RTL support (if needed)

**Phase 4 (Optional)**: Advanced Features
- Real-time exchange rates
- Currency conversion in transfers
- Multi-wallet support (different currencies)
- Currency preference per user

---

## 📝 Notes

- Phase 2 focuses on **completing what Phase 1 started**
- Priority is **quality over speed**
- Each batch of updates should be **tested before committing**
- Keep **backward compatibility** with existing data
- Document **any breaking changes**

**Estimated Total Time**: 52 hours (2 weeks)
**Critical Path**: Currency updates → Testing → Documentation
**Blocker**: None (all dependencies from Phase 1 complete)

---

**Ready to Start**: Yes ✅
**Prerequisites Met**: Yes ✅
**Team Approval**: Pending
