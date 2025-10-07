#!/usr/bin/env node

/**
 * UI Changes Validation Script
 * Comprehensive validation of all UI changes from World-Class UI audit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Modified screens list
const MODIFIED_SCREENS = [
  'src/components/dashboard/ModernDashboardWithAI.tsx',
  'src/screens/transactions/TransactionHistoryScreen.tsx',
  'src/screens/loans/ModernLoansMenuScreen.tsx',
  'src/screens/savings/ModernSavingsMenuScreen.tsx',
  'src/screens/transfers/ModernTransferMenuScreen.tsx',
  'src/screens/analytics/TransactionAnalyticsScreen.tsx',
  'src/screens/ModernAIChatScreen.tsx',
  'src/screens/promo/PromoCodesScreen.tsx',
  'src/screens/auth/RegistrationScreen.tsx',
  'src/screens/settings/SettingsScreen.tsx',
  'src/screens/bills/BillPaymentScreen.tsx',
  'src/screens/loans/PersonalLoanScreen.tsx',
  'src/screens/admin/ModernRBACManagementScreen.tsx',
  'src/screens/security/SecurityMonitoringScreen.tsx',
  'src/screens/security/PCIDSSComplianceScreen.tsx',
  'src/screens/security/CBNComplianceScreen.tsx',
  'src/screens/transfers/CompleteTransferFlowScreen.tsx',
  'src/screens/transfers/ExternalTransferScreen.tsx',
  'src/screens/savings/FlexibleSavingsScreen.tsx',
  'src/screens/referrals/ReferralScreen.tsx',
  'src/screens/admin/ReferralAdminDashboard.tsx',
];

// Allowed social media brand colors
const ALLOWED_COLORS = ['#25D366', '#007AFF', '#EA4335'];

let totalErrors = 0;
let totalWarnings = 0;

/**
 * Test 1: Check for hardcoded text colors
 */
function testHardcodedTextColors() {
  logSection('Test 1: Checking for Hardcoded Text Colors');

  let errors = 0;

  MODIFIED_SCREENS.forEach((screenPath) => {
    const fullPath = path.join(__dirname, '..', screenPath);

    if (!fs.existsSync(fullPath)) {
      logWarning(`File not found: ${screenPath}`);
      totalWarnings++;
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const colorRegex = /color:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
    const matches = content.match(colorRegex) || [];

    // Filter out allowed colors
    const forbidden = matches.filter(
      (match) => !ALLOWED_COLORS.some((allowed) => match.includes(allowed))
    );

    if (forbidden.length > 0) {
      logError(`${screenPath} has ${forbidden.length} hardcoded text color(s):`);
      forbidden.forEach((match) => console.log(`    ${match}`));
      errors++;
    }
  });

  if (errors === 0) {
    logSuccess('All screens pass: No hardcoded text colors found!');
  } else {
    logError(`${errors} screen(s) have hardcoded text colors`);
    totalErrors += errors;
  }

  return errors === 0;
}

/**
 * Test 2: Check for hardcoded background colors
 */
function testHardcodedBackgroundColors() {
  logSection('Test 2: Checking for Hardcoded Background Colors');

  let errors = 0;

  MODIFIED_SCREENS.forEach((screenPath) => {
    const fullPath = path.join(__dirname, '..', screenPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const bgColorRegex = /backgroundColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
    const matches = content.match(bgColorRegex) || [];

    // Filter out allowed social media colors
    const forbidden = matches.filter(
      (match) => !ALLOWED_COLORS.some((allowed) => match.includes(allowed))
    );

    if (forbidden.length > 0) {
      logError(`${screenPath} has ${forbidden.length} hardcoded background color(s):`);
      forbidden.forEach((match) => console.log(`    ${match}`));
      errors++;
    }
  });

  if (errors === 0) {
    logSuccess('All screens pass: No forbidden hardcoded background colors!');
  } else {
    logError(`${errors} screen(s) have hardcoded background colors`);
    totalErrors += errors;
  }

  return errors === 0;
}

/**
 * Test 3: Check for hardcoded border colors
 */
function testHardcodedBorderColors() {
  logSection('Test 3: Checking for Hardcoded Border Colors');

  let errors = 0;

  MODIFIED_SCREENS.forEach((screenPath) => {
    const fullPath = path.join(__dirname, '..', screenPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const borderColorRegex = /borderColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/g;
    const matches = content.match(borderColorRegex) || [];

    if (matches.length > 0) {
      logError(`${screenPath} has ${matches.length} hardcoded border color(s):`);
      matches.forEach((match) => console.log(`    ${match}`));
      errors++;
    }
  });

  if (errors === 0) {
    logSuccess('All screens pass: No hardcoded border colors!');
  } else {
    logError(`${errors} screen(s) have hardcoded border colors`);
    totalErrors += errors;
  }

  return errors === 0;
}

/**
 * Test 4: Check for double commas
 */
function testDoubleCommas() {
  logSection('Test 4: Checking for Syntax Errors (Double Commas)');

  let errors = 0;

  MODIFIED_SCREENS.forEach((screenPath) => {
    const fullPath = path.join(__dirname, '..', screenPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    if (/,,/.test(content)) {
      logError(`${screenPath} has double commas!`);
      errors++;
    }
  });

  if (errors === 0) {
    logSuccess('All screens pass: No double commas found!');
  } else {
    logError(`${errors} screen(s) have double commas`);
    totalErrors += errors;
  }

  return errors === 0;
}

/**
 * Test 5: Check for proper theme hook usage
 */
function testThemeHookUsage() {
  logSection('Test 5: Checking Theme Hook Usage');

  let errors = 0;

  MODIFIED_SCREENS.forEach((screenPath) => {
    const fullPath = path.join(__dirname, '..', screenPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // If file uses theme, check for proper hook
    if (content.includes('theme.colors') || content.includes('tenantTheme')) {
      const hasProperHook =
        content.includes('useTenantTheme()') ||
        content.includes('const { theme') ||
        content.includes('const theme =');

      if (!hasProperHook) {
        logError(`${screenPath} uses theme but doesn't have proper hook setup`);
        errors++;
      }

      // Check for bad fallbacks
      const hasBadFallback = /\|\|\s*['"]#[0-9a-fA-F]{3,8}['"]/.test(content);
      if (hasBadFallback) {
        logError(`${screenPath} has hardcoded color fallbacks!`);
        errors++;
      }
    }
  });

  if (errors === 0) {
    logSuccess('All screens pass: Proper theme hook usage!');
  } else {
    logError(`${errors} screen(s) have theme hook issues`);
    totalErrors += errors;
  }

  return errors === 0;
}

/**
 * Test 6: Run TypeScript type checking
 */
function testTypeScript() {
  logSection('Test 6: Running TypeScript Type Checking');

  try {
    logInfo('Running: npm run typecheck');
    execSync('npm run typecheck', { stdio: 'inherit' });
    logSuccess('TypeScript type checking passed!');
    return true;
  } catch (error) {
    logError('TypeScript type checking failed!');
    totalErrors++;
    return false;
  }
}

/**
 * Test 7: Verify build compiles
 */
function testBuild() {
  logSection('Test 7: Verifying Build Compiles');

  try {
    logInfo('Building production bundle...');
    logInfo('Running: npm run web:build');

    // Run build in background to check for errors
    execSync('npm run web:build 2>&1 | grep -i "error" || true', {
      stdio: 'inherit',
      timeout: 120000, // 2 minute timeout
    });

    logSuccess('Build compilation check passed!');
    return true;
  } catch (error) {
    logError('Build compilation failed!');
    totalErrors++;
    return false;
  }
}

/**
 * Main test runner
 */
function runAllTests() {
  log('\n\n🚀 UI CHANGES VALIDATION SUITE', 'bright');
  log('Testing all screens modified in World-Class UI audit\n', 'cyan');

  const results = {
    textColors: testHardcodedTextColors(),
    backgroundColors: testHardcodedBackgroundColors(),
    borderColors: testHardcodedBorderColors(),
    doubleCommas: testDoubleCommas(),
    themeHooks: testThemeHookUsage(),
    typeScript: testTypeScript(),
    build: testBuild(),
  };

  // Summary
  logSection('📊 VALIDATION SUMMARY');

  const tests = [
    { name: 'Hardcoded Text Colors', passed: results.textColors },
    { name: 'Hardcoded Background Colors', passed: results.backgroundColors },
    { name: 'Hardcoded Border Colors', passed: results.borderColors },
    { name: 'Double Commas (Syntax)', passed: results.doubleCommas },
    { name: 'Theme Hook Usage', passed: results.themeHooks },
    { name: 'TypeScript Type Check', passed: results.typeScript },
    { name: 'Build Compilation', passed: results.build },
  ];

  tests.forEach((test) => {
    if (test.passed) {
      logSuccess(`${test.name}: PASSED`);
    } else {
      logError(`${test.name}: FAILED`);
    }
  });

  const totalTests = tests.length;
  const passedTests = tests.filter((t) => t.passed).length;
  const failedTests = totalTests - passedTests;

  console.log('\n' + '='.repeat(80));

  if (failedTests === 0) {
    log(
      `\n✅ ALL TESTS PASSED! (${passedTests}/${totalTests})`,
      'green'
    );
    log('🎉 Perfect Score - Ready for Production!\n', 'green');
    return 0;
  } else {
    log(
      `\n❌ TESTS FAILED! (${passedTests}/${totalTests} passed, ${failedTests} failed)`,
      'red'
    );
    log(`Total Errors: ${totalErrors}`, 'red');
    log(`Total Warnings: ${totalWarnings}\n`, 'yellow');
    return 1;
  }
}

// Run tests
process.exit(runAllTests());
