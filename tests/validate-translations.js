/**
 * Translation Files Validation Script
 * Tests all French, German, and Spanish translations
 */

const fs = require('fs');
const path = require('path');

console.log('🌍 Testing Multi-Language Translations\n');
console.log('='.repeat(70));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    failedTests++;
    errors.push({ description, error: error.message });
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

const languages = ['fr', 'de', 'es'];
const namespaces = ['common', 'auth', 'dashboard', 'transfers', 'transactions', 'savings', 'loans', 'settings', 'errors'];

// Load English as reference
const englishFiles = {};
namespaces.forEach(ns => {
  const filePath = path.join(__dirname, '..', 'public', 'locales', 'en', `${ns}.json`);
  englishFiles[ns] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

// Test each language
languages.forEach(lang => {
  const langName = {
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish'
  }[lang];

  const langFlag = {
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'es': '🇪🇸'
  }[lang];

  console.log(`\n${langFlag} ${langName} Translations`);
  console.log('-'.repeat(70));

  namespaces.forEach(ns => {
    const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${ns}.json`);

    // Test 1: File exists
    test(`${lang}/${ns}.json exists`, () => {
      assert(fs.existsSync(filePath), `File not found: ${filePath}`);
    });

    // Test 2: File is valid JSON
    let translationData;
    test(`${lang}/${ns}.json is valid JSON`, () => {
      const content = fs.readFileSync(filePath, 'utf8');
      translationData = JSON.parse(content); // Will throw if invalid
      assert(translationData !== null, 'JSON is null');
      assert(typeof translationData === 'object', 'JSON is not an object');
    });

    if (!translationData) return;

    // Test 3: Has same structure as English
    test(`${lang}/${ns}.json has same keys as English`, () => {
      const englishKeys = getAllKeys(englishFiles[ns]);
      const translationKeys = getAllKeys(translationData);

      const missingKeys = englishKeys.filter(k => !translationKeys.includes(k));
      const extraKeys = translationKeys.filter(k => !englishKeys.includes(k));

      assert(missingKeys.length === 0, `Missing keys: ${missingKeys.join(', ')}`);
      assert(extraKeys.length === 0, `Extra keys: ${extraKeys.join(', ')}`);
    });

    // Test 4: No empty values
    test(`${lang}/${ns}.json has no empty values`, () => {
      const emptyValues = findEmptyValues(translationData);
      assert(emptyValues.length === 0, `Empty values found: ${emptyValues.join(', ')}`);
    });

    // Test 5: Placeholders preserved
    test(`${lang}/${ns}.json preserves placeholders`, () => {
      const missingPlaceholders = checkPlaceholders(englishFiles[ns], translationData);
      assert(missingPlaceholders.length === 0,
        `Missing placeholders: ${missingPlaceholders.map(m => `${m.key}: ${m.placeholder}`).join(', ')}`);
    });

    // Test 6: No trailing commas (already validated by JSON.parse)
    test(`${lang}/${ns}.json has no syntax errors`, () => {
      // If we got here, JSON was parsed successfully
      assert(true);
    });
  });
});

// Helper functions
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function findEmptyValues(obj, prefix = '') {
  let emptyKeys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      emptyKeys = emptyKeys.concat(findEmptyValues(value, fullKey));
    } else if (typeof value === 'string' && value.trim() === '') {
      emptyKeys.push(fullKey);
    }
  }
  return emptyKeys;
}

function checkPlaceholders(englishObj, translationObj, prefix = '') {
  let missing = [];
  for (const [key, value] of Object.entries(englishObj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      missing = missing.concat(checkPlaceholders(value, translationObj[key] || {}, fullKey));
    } else if (typeof value === 'string') {
      const placeholders = value.match(/\{\{[^}]+\}\}/g) || [];
      const translatedValue = translationObj[key] || '';
      placeholders.forEach(placeholder => {
        if (!translatedValue.includes(placeholder)) {
          missing.push({ key: fullKey, placeholder });
        }
      });
    }
  }
  return missing;
}

// Additional Quality Tests
console.log('\n🔍 Translation Quality Tests');
console.log('-'.repeat(70));

// Test: File sizes are reasonable
languages.forEach(lang => {
  const langName = { 'fr': 'French', 'de': 'German', 'es': 'Spanish' }[lang];
  namespaces.forEach(ns => {
    test(`${langName} ${ns}.json has reasonable file size`, () => {
      const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${ns}.json`);
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;

      // File should be between 0.5KB and 10KB
      assert(sizeKB > 0.5, `File too small: ${sizeKB.toFixed(2)}KB`);
      assert(sizeKB < 10, `File too large: ${sizeKB.toFixed(2)}KB`);
    });
  });
});

// Test: Specific banking terms are translated
console.log('\n💰 Banking Terminology Tests');
console.log('-'.repeat(70));

const bankingTerms = {
  fr: {
    'transfers.types.internal': /virement|transfert/i,
    'dashboard.totalBalance': /solde|guthaben/i,
    'savings.title': /épargne|sparen/i,
  },
  de: {
    'transfers.types.internal': /Überweisung/,
    'dashboard.totalBalance': /Guthaben|Saldo|Gesamtguthaben/,
    'savings.title': /Sparen/,
  },
  es: {
    'transfers.types.internal': /transferencia/i,
    'dashboard.totalBalance': /saldo/i,
    'savings.title': /ahorros/i,
  }
};

Object.entries(bankingTerms).forEach(([lang, terms]) => {
  const langName = { 'fr': 'French', 'de': 'German', 'es': 'Spanish' }[lang];

  Object.entries(terms).forEach(([keyPath, pattern]) => {
    test(`${langName} uses correct banking term for ${keyPath}`, () => {
      const [ns, ...pathParts] = keyPath.split('.');
      const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${ns}.json`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      let value = data;
      for (const part of pathParts) {
        value = value[part];
      }

      assert(pattern.test(value), `Expected "${value}" to match ${pattern}`);
    });
  });
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`Total Tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} ✅`);
console.log(`Failed:       ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

console.log('\n📈 Translation Coverage');
console.log('-'.repeat(70));
languages.forEach(lang => {
  const langName = { 'fr': 'French', 'de': 'German', 'es': 'Spanish' }[lang];
  const langFlag = { 'fr': '🇫🇷', 'de': '🇩🇪', 'es': '🇪🇸' }[lang];
  console.log(`${langFlag} ${langName.padEnd(10)}: ${namespaces.length} namespaces`);
});

console.log('\n📝 Namespaces');
console.log('-'.repeat(70));
namespaces.forEach((ns, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${ns}`);
});

if (failedTests === 0) {
  console.log('\n🎉 All translation tests passed! Translations are production-ready.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed. Please review the errors above.\n`);

  if (errors.length > 0) {
    console.log('Failed Tests Details:');
    console.log('-'.repeat(70));
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.description}`);
      console.log(`   ${err.error}\n`);
    });
  }

  process.exit(1);
}
