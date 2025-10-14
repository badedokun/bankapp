/**
 * i18n Configuration Validation Script
 * Tests i18next configuration and language switching capability
 */

const fs = require('fs');
const path = require('path');

console.log('⚙️  Testing i18n Configuration\n');
console.log('='.repeat(70));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    failedTests++;
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

// Test 1: i18n config file exists
console.log('\n📁 Configuration Files');
console.log('-'.repeat(70));

let i18nConfig;
test('i18n config file exists', () => {
  const configPath = path.join(__dirname, '..', 'src', 'i18n', 'config.ts');
  assert(fs.existsSync(configPath), 'Config file not found');
});

test('i18n config is readable', () => {
  const configPath = path.join(__dirname, '..', 'src', 'i18n', 'config.ts');
  const content = fs.readFileSync(configPath, 'utf8');
  assert(content.length > 0, 'Config file is empty');
  i18nConfig = content;
});

// Test 2: Supported languages configuration
console.log('\n🌍 Language Configuration');
console.log('-'.repeat(70));

test('Supports French (fr)', () => {
  assert(i18nConfig.includes("'fr'"), 'French not in supported languages');
});

test('Supports German (de)', () => {
  assert(i18nConfig.includes("'de'"), 'German not in supported languages');
});

test('Supports Spanish (es)', () => {
  assert(i18nConfig.includes("'es'"), 'Spanish not in supported languages');
});

test('Supports English (en)', () => {
  assert(i18nConfig.includes("'en'"), 'English not in supported languages');
});

test('Has fallback language configuration', () => {
  assert(i18nConfig.includes('fallbackLng'), 'Fallback language not configured');
});

// Test 3: Namespaces configuration
console.log('\n📦 Namespace Configuration');
console.log('-'.repeat(70));

const expectedNamespaces = ['common', 'auth', 'dashboard', 'transfers', 'transactions', 'savings', 'loans', 'settings', 'errors'];

expectedNamespaces.forEach(ns => {
  test(`Namespace configured: ${ns}`, () => {
    assert(i18nConfig.includes(`'${ns}'`), `Namespace ${ns} not found in config`);
  });
});

test('Has defaultNS configuration', () => {
  assert(i18nConfig.includes('defaultNS'), 'Default namespace not configured');
});

// Test 4: Backend configuration
console.log('\n🔧 Backend Configuration');
console.log('-'.repeat(70));

test('Has backend configuration', () => {
  assert(i18nConfig.includes('backend'), 'Backend not configured');
});

test('Has loadPath configuration', () => {
  assert(i18nConfig.includes('loadPath'), 'Load path not configured');
});

test('LoadPath uses correct pattern', () => {
  assert(i18nConfig.includes('{{lng}}'), 'Language placeholder not in loadPath');
  assert(i18nConfig.includes('{{ns}}'), 'Namespace placeholder not in loadPath');
});

// Test 5: Directory structure
console.log('\n📂 Directory Structure');
console.log('-'.repeat(70));

const languages = ['en', 'fr', 'de', 'es'];
const namespaces = ['common', 'auth', 'dashboard', 'transfers', 'transactions', 'savings', 'loans', 'settings', 'errors'];

test('Public locales directory exists', () => {
  const localesPath = path.join(__dirname, '..', 'public', 'locales');
  assert(fs.existsSync(localesPath), 'Locales directory not found');
});

languages.forEach(lang => {
  test(`Language directory exists: ${lang}`, () => {
    const langPath = path.join(__dirname, '..', 'public', 'locales', lang);
    assert(fs.existsSync(langPath), `${lang} directory not found`);
  });
});

// Test 6: All translation files are loadable
console.log('\n📥 Translation File Loadability');
console.log('-'.repeat(70));

let loadedFiles = 0;
languages.forEach(lang => {
  namespaces.forEach(ns => {
    test(`Can load ${lang}/${ns}.json`, () => {
      const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${ns}.json`);
      assert(fs.existsSync(filePath), 'File not found');

      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content); // Will throw if invalid
      assert(Object.keys(json).length > 0, 'File has no content');

      loadedFiles++;
    });
  });
});

console.log(`\n   Successfully loaded ${loadedFiles} translation files`);

// Test 7: Package dependencies
console.log('\n📦 Package Dependencies');
console.log('-'.repeat(70));

let packageJson;
test('package.json exists', () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  assert(fs.existsSync(packagePath), 'package.json not found');
  const content = fs.readFileSync(packagePath, 'utf8');
  packageJson = JSON.parse(content);
});

test('i18next is installed', () => {
  const hasI18next = packageJson.dependencies?.i18next || packageJson.devDependencies?.i18next;
  assert(hasI18next, 'i18next not found in dependencies');
});

test('react-i18next is installed', () => {
  const hasReactI18next = packageJson.dependencies?.['react-i18next'] || packageJson.devDependencies?.['react-i18next'];
  assert(hasReactI18next, 'react-i18next not found in dependencies');
});

test('libphonenumber-js is installed', () => {
  const hasLibPhoneNumber = packageJson.dependencies?.['libphonenumber-js'] || packageJson.devDependencies?.['libphonenumber-js'];
  assert(hasLibPhoneNumber, 'libphonenumber-js not found in dependencies');
});

// Test 8: Language coverage completeness
console.log('\n📊 Language Coverage');
console.log('-'.repeat(70));

test('All languages have complete namespace coverage', () => {
  let missingFiles = [];

  languages.forEach(lang => {
    namespaces.forEach(ns => {
      const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${ns}.json`);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(`${lang}/${ns}.json`);
      }
    });
  });

  assert(missingFiles.length === 0, `Missing files: ${missingFiles.join(', ')}`);
});

test('Translation files are consistent across languages', () => {
  // Each language should have same number of files
  const fileCounts = {};

  languages.forEach(lang => {
    const langPath = path.join(__dirname, '..', 'public', 'locales', lang);
    const files = fs.readdirSync(langPath).filter(f => f.endsWith('.json'));
    fileCounts[lang] = files.length;
  });

  const counts = Object.values(fileCounts);
  const allEqual = counts.every(c => c === counts[0]);

  assert(allEqual, `Inconsistent file counts: ${JSON.stringify(fileCounts)}`);
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`Total Tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} ✅`);
console.log(`Failed:       ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

console.log('\n📈 Configuration Status');
console.log('-'.repeat(70));
console.log(`Languages:    ${languages.length} (${languages.join(', ')})`);
console.log(`Namespaces:   ${namespaces.length}`);
console.log(`Total Files:  ${loadedFiles}`);
console.log(`Expected:     ${languages.length * namespaces.length}`);

if (failedTests === 0) {
  console.log('\n🎉 All i18n configuration tests passed! System is ready for multi-language support.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}
