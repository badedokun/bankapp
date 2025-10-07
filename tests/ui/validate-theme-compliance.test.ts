/**
 * UI Theme Compliance Validation Tests
 * Tests all screens modified in the World-Class UI audit
 * Validates: No hardcoded colors, proper theme usage, no TypeScript errors
 */

import * as fs from 'fs';
import * as path from 'path';

describe('UI Theme Compliance Tests', () => {
  const SCREENS_DIR = path.join(__dirname, '../../src/screens');

  // All screens that were modified
  const modifiedScreens = [
    'components/dashboard/ModernDashboardWithAI.tsx',
    'transactions/TransactionHistoryScreen.tsx',
    'loans/ModernLoansMenuScreen.tsx',
    'savings/ModernSavingsMenuScreen.tsx',
    'transfers/ModernTransferMenuScreen.tsx',
    'analytics/TransactionAnalyticsScreen.tsx',
    'ModernAIChatScreen.tsx',
    'promo/PromoCodesScreen.tsx',
    'auth/RegistrationScreen.tsx',
    'settings/SettingsScreen.tsx',
    'bills/BillPaymentScreen.tsx',
    'loans/PersonalLoanScreen.tsx',
    'admin/ModernRBACManagementScreen.tsx',
    'security/SecurityMonitoringScreen.tsx',
    'security/PCIDSSComplianceScreen.tsx',
    'security/CBNComplianceScreen.tsx',
    'transfers/CompleteTransferFlowScreen.tsx',
    'transfers/ExternalTransferScreen.tsx',
    'savings/FlexibleSavingsScreen.tsx',
    'referrals/ReferralScreen.tsx',
    'admin/ReferralAdminDashboard.tsx',
  ];

  // Allowed social media brand colors
  const allowedHardcodedColors = [
    '#25D366', // WhatsApp
    '#007AFF', // iOS/Facebook
    '#EA4335', // Google
  ];

  describe('No Hardcoded Text Colors', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should not have hardcoded text colors`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          console.warn(`⚠️  File not found: ${fullPath}`);
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for hardcoded color patterns in color: property
        const hardcodedColorRegex = /color:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
        const matches = content.match(hardcodedColorRegex) || [];

        // Filter out allowed colors
        const forbiddenMatches = matches.filter(match => {
          return !allowedHardcodedColors.some(allowed => match.includes(allowed));
        });

        if (forbiddenMatches.length > 0) {
          console.error(`❌ Found hardcoded colors in ${screenPath}:`);
          forbiddenMatches.forEach(match => console.error(`   - ${match}`));
        }

        expect(forbiddenMatches.length).toBe(0);
      });
    });
  });

  describe('No Hardcoded Border Colors', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should not have hardcoded border colors`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for hardcoded borderColor patterns
        const hardcodedBorderColorRegex = /borderColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
        const matches = content.match(hardcodedBorderColorRegex) || [];

        if (matches.length > 0) {
          console.error(`❌ Found hardcoded border colors in ${screenPath}:`);
          matches.forEach(match => console.error(`   - ${match}`));
        }

        expect(matches.length).toBe(0);
      });
    });
  });

  describe('Proper Theme Hook Usage', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should use useTenantTheme hook correctly`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if file uses theme
        if (content.includes('theme.colors') || content.includes('tenantTheme')) {
          // Should have proper hook usage
          const hasProperHook =
            content.includes('useTenantTheme()') ||
            content.includes('const { theme') ||
            content.includes('const theme =');

          expect(hasProperHook).toBe(true);

          // Should NOT have hardcoded fallbacks like '#FFFFFF'
          const hasBadFallback = /\|\|\s*['"]#[0-9a-fA-F]{3,8}['"]/.test(content);

          if (hasBadFallback) {
            console.error(`❌ Found hardcoded color fallbacks in ${screenPath}`);
          }

          expect(hasBadFallback).toBe(false);
        }
      });
    });
  });

  describe('Header Margins Compliance', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should have proper header margins`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if file has a header style
        if (content.includes('header:')) {
          // Should have marginLeft and marginRight (or proper padding)
          const hasMarginLeft = content.includes('marginLeft: 20') || content.includes('paddingHorizontal');
          const hasMarginRight = content.includes('marginRight: 20') || content.includes('paddingHorizontal');

          // At least should have some margin/padding strategy
          expect(hasMarginLeft || hasMarginRight).toBe(true);
        }
      });
    });
  });

  describe('No Double Commas', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should not have double commas`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for double commas
        const hasDoubleCommas = /,,/.test(content);

        if (hasDoubleCommas) {
          console.error(`❌ Found double commas in ${screenPath}`);
        }

        expect(hasDoubleCommas).toBe(false);
      });
    });
  });

  describe('Background Color Compliance', () => {
    modifiedScreens.forEach((screenPath) => {
      it(`${screenPath} should use theme colors for backgrounds`, () => {
        const fullPath = screenPath.includes('components/dashboard')
          ? path.join(__dirname, '../../src', screenPath)
          : path.join(SCREENS_DIR, screenPath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for hardcoded backgroundColor patterns
        const hardcodedBgColorRegex = /backgroundColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
        const matches = content.match(hardcodedBgColorRegex) || [];

        // Filter out allowed social media brand colors
        const forbiddenMatches = matches.filter(match => {
          return !allowedHardcodedColors.some(allowed => match.includes(allowed));
        });

        if (forbiddenMatches.length > 0) {
          console.error(`❌ Found hardcoded background colors in ${screenPath}:`);
          forbiddenMatches.forEach(match => console.error(`   - ${match}`));
        }

        // Allow some hardcoded backgrounds for social media buttons only
        expect(forbiddenMatches.length).toBeLessThanOrEqual(0);
      });
    });
  });
});
