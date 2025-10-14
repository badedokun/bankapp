/**
 * Phone Validation Library Test Script
 * Tests libphonenumber-js integration
 */

const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

console.log('🧪 Testing libphonenumber-js Integration\n');
console.log('=' .repeat(60));

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

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Test 1: Library Installation
console.log('\n📦 Library Installation Tests');
console.log('-'.repeat(60));

test('libphonenumber-js should be installed', () => {
  assert(typeof parsePhoneNumber === 'function', 'parsePhoneNumber not found');
  assert(typeof isValidPhoneNumber === 'function', 'isValidPhoneNumber not found');
});

// Test 2: Nigerian Numbers
console.log('\n🇳🇬 Nigerian Phone Numbers (+234)');
console.log('-'.repeat(60));

test('Valid MTN number: +2348012345678', () => {
  assert(isValidPhoneNumber('+2348012345678', 'NG'), 'Should be valid');
});

test('Valid Airtel number: +2348123456789', () => {
  assert(isValidPhoneNumber('+2348123456789', 'NG'), 'Should be valid');
});

test('Valid Glo number: +2347012345678', () => {
  assert(isValidPhoneNumber('+2347012345678', 'NG'), 'Should be valid');
});

test('Invalid - too short: +234801234567', () => {
  assert(!isValidPhoneNumber('+234801234567', 'NG'), 'Should be invalid');
});

test('Format Nigerian number correctly', () => {
  const phoneNumber = parsePhoneNumber('+2348012345678', 'NG');
  assertEquals(phoneNumber.formatNational(), '0801 234 5678', 'Wrong national format');
  assertEquals(phoneNumber.formatInternational(), '+234 801 234 5678', 'Wrong international format');
  assertEquals(phoneNumber.country, 'NG', 'Wrong country');
});

// Test 3: USA/Canada Numbers
console.log('\n🇺🇸 USA/Canada Phone Numbers (+1)');
console.log('-'.repeat(60));

test('Valid US number: +14155552671', () => {
  assert(isValidPhoneNumber('+14155552671', 'US'), 'Should be valid');
});

test('Valid Canada number: +16475551234', () => {
  assert(isValidPhoneNumber('+16475551234', 'US'), 'Should be valid');
});

test('Format US number correctly', () => {
  const phoneNumber = parsePhoneNumber('+14155552671', 'US');
  assertEquals(phoneNumber.formatNational(), '(415) 555-2671', 'Wrong format');
});

// Test 4: UK Numbers
console.log('\n🇬🇧 UK Phone Numbers (+44)');
console.log('-'.repeat(60));

test('Valid UK mobile: +447911123456', () => {
  assert(isValidPhoneNumber('+447911123456', 'GB'), 'Should be valid');
});

test('Valid UK landline: +442071838750', () => {
  assert(isValidPhoneNumber('+442071838750', 'GB'), 'Should be valid');
});

// Test 5: German Numbers
console.log('\n🇩🇪 German Phone Numbers (+49)');
console.log('-'.repeat(60));

test('Valid German mobile: +4915112345678', () => {
  assert(isValidPhoneNumber('+4915112345678', 'DE'), 'Should be valid');
});

test('Valid German landline: +493012345678', () => {
  assert(isValidPhoneNumber('+493012345678', 'DE'), 'Should be valid');
});

test('Format German number correctly', () => {
  const phoneNumber = parsePhoneNumber('+4915112345678', 'DE');
  assertEquals(phoneNumber.formatNational(), '01511 2345678', 'Wrong format');
  assertEquals(phoneNumber.country, 'DE', 'Wrong country');
});

// Test 6: French Numbers
console.log('\n🇫🇷 French Phone Numbers (+33)');
console.log('-'.repeat(60));

test('Valid French mobile: +33612345678', () => {
  assert(isValidPhoneNumber('+33612345678', 'FR'), 'Should be valid');
});

test('Valid French landline: +33142345678', () => {
  assert(isValidPhoneNumber('+33142345678', 'FR'), 'Should be valid');
});

test('Format French number correctly', () => {
  const phoneNumber = parsePhoneNumber('+33612345678', 'FR');
  assertEquals(phoneNumber.formatNational(), '06 12 34 56 78', 'Wrong format');
  assertEquals(phoneNumber.country, 'FR', 'Wrong country');
});

// Test 7: Spanish Numbers
console.log('\n🇪🇸 Spanish Phone Numbers (+34)');
console.log('-'.repeat(60));

test('Valid Spanish mobile: +34612345678', () => {
  assert(isValidPhoneNumber('+34612345678', 'ES'), 'Should be valid');
});

test('Valid Spanish landline: +34912345678', () => {
  assert(isValidPhoneNumber('+34912345678', 'ES'), 'Should be valid');
});

// Test 8: South African Numbers
console.log('\n🇿🇦 South African Phone Numbers (+27)');
console.log('-'.repeat(60));

test('Valid South African mobile: +27821234567', () => {
  assert(isValidPhoneNumber('+27821234567', 'ZA'), 'Should be valid');
});

test('Valid South African landline: +27211234567', () => {
  assert(isValidPhoneNumber('+27211234567', 'ZA'), 'Should be valid');
});

// Test 9: Kenyan Numbers
console.log('\n🇰🇪 Kenyan Phone Numbers (+254)');
console.log('-'.repeat(60));

test('Valid Kenyan mobile: +254712123456', () => {
  assert(isValidPhoneNumber('+254712123456', 'KE'), 'Should be valid');
});

// Test 10: Ghanaian Numbers
console.log('\n🇬🇭 Ghanaian Phone Numbers (+233)');
console.log('-'.repeat(60));

test('Valid Ghanaian mobile: +233244123456', () => {
  assert(isValidPhoneNumber('+233244123456', 'GH'), 'Should be valid');
});

// Test 11: Phone Number Metadata
console.log('\n📊 Phone Number Metadata');
console.log('-'.repeat(60));

test('Extract phone number type', () => {
  const mobile = parsePhoneNumber('+2348012345678', 'NG');
  const type = mobile.getType();
  // Type metadata may not be available for all numbers
  assert(type === undefined || type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE', 'Type should be undefined or valid');
});

test('Provide URI format', () => {
  const phoneNumber = parsePhoneNumber('+2348012345678', 'NG');
  assertEquals(phoneNumber.getURI(), 'tel:+2348012345678', 'Wrong URI format');
});

test('Identify country from number', () => {
  const ngNumber = parsePhoneNumber('+2348012345678');
  assertEquals(ngNumber.country, 'NG', 'Should detect Nigeria');
});

// Test 12: Error Handling
console.log('\n⚠️  Error Handling');
console.log('-'.repeat(60));

test('Handle invalid formats gracefully', () => {
  const result = isValidPhoneNumber('invalid', 'NG');
  assertEquals(result, false, 'Should return false for invalid');
});

test('Handle empty strings', () => {
  const result = isValidPhoneNumber('', 'NG');
  assertEquals(result, false, 'Should return false for empty');
});

test('Handle numbers with spaces', () => {
  assert(isValidPhoneNumber('+234 801 234 5678', 'NG'), 'Should handle spaces');
});

test('Handle numbers with dashes', () => {
  assert(isValidPhoneNumber('+234-801-234-5678', 'NG'), 'Should handle dashes');
});

test('Reject numbers with letters', () => {
  assert(!isValidPhoneNumber('+234801234567A', 'NG'), 'Should reject letters');
});

// Test 13: Performance
console.log('\n⚡ Performance Tests');
console.log('-'.repeat(60));

test('Validate 1000 numbers quickly', () => {
  const startTime = Date.now();

  for (let i = 0; i < 1000; i++) {
    isValidPhoneNumber('+2348012345678', 'NG');
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`   Duration: ${duration}ms for 1000 validations`);
  assert(duration < 1000, `Too slow: ${duration}ms (should be < 1000ms)`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total Tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} ✅`);
console.log(`Failed:       ${failedTests} ❌`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! libphonenumber-js is working correctly.\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}
