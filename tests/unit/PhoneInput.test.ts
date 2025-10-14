/**
 * PhoneInput Component Unit Tests
 * Tests libphonenumber-js integration and international phone validation
 */

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

describe('PhoneInput Component - libphonenumber-js Integration', () => {

  describe('Library Installation and Imports', () => {
    test('libphonenumber-js should be installed and importable', () => {
      expect(parsePhoneNumber).toBeDefined();
      expect(isValidPhoneNumber).toBeDefined();
      expect(typeof parsePhoneNumber).toBe('function');
      expect(typeof isValidPhoneNumber).toBe('function');
    });
  });

  describe('Nigerian Phone Numbers (+234)', () => {
    const testCases = [
      { number: '+2348012345678', expected: true, description: 'Valid MTN number' },
      { number: '+2348123456789', expected: true, description: 'Valid Airtel number' },
      { number: '+2347012345678', expected: true, description: 'Valid Glo number' },
      { number: '+2349012345678', expected: true, description: 'Valid 9mobile number' },
      { number: '+234801234567', expected: false, description: 'Too short' },
      { number: '+23480123456789', expected: false, description: 'Too long' },
      { number: '+2341234567890', expected: false, description: 'Invalid prefix' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'NG');
        expect(result).toBe(expected);
      });
    });

    test('Should format Nigerian number correctly', () => {
      const phoneNumber = parsePhoneNumber('+2348012345678', 'NG');
      expect(phoneNumber).toBeDefined();
      expect(phoneNumber.formatNational()).toBe('0801 234 5678');
      expect(phoneNumber.formatInternational()).toBe('+234 801 234 5678');
      expect(phoneNumber.country).toBe('NG');
    });
  });

  describe('USA/Canada Phone Numbers (+1)', () => {
    const testCases = [
      { number: '+14155552671', expected: true, description: 'Valid US number' },
      { number: '+16475551234', expected: true, description: 'Valid Canada number' },
      { number: '+1800555000', expected: false, description: 'Too short' },
      { number: '+141555526711', expected: false, description: 'Too long' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'US');
        expect(result).toBe(expected);
      });
    });

    test('Should format US number correctly', () => {
      const phoneNumber = parsePhoneNumber('+14155552671', 'US');
      expect(phoneNumber).toBeDefined();
      expect(phoneNumber.formatNational()).toBe('(415) 555-2671');
      expect(phoneNumber.formatInternational()).toBe('+1 415-555-2671');
    });
  });

  describe('UK Phone Numbers (+44)', () => {
    const testCases = [
      { number: '+447911123456', expected: true, description: 'Valid mobile' },
      { number: '+442071838750', expected: true, description: 'Valid landline' },
      { number: '+4479111234', expected: false, description: 'Too short' },
      { number: '+4479111234567', expected: false, description: 'Too long' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'GB');
        expect(result).toBe(expected);
      });
    });
  });

  describe('German Phone Numbers (+49)', () => {
    const testCases = [
      { number: '+4915112345678', expected: true, description: 'Valid mobile' },
      { number: '+493012345678', expected: true, description: 'Valid landline Berlin' },
      { number: '+49151123456', expected: false, description: 'Too short' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'DE');
        expect(result).toBe(expected);
      });
    });

    test('Should format German number correctly', () => {
      const phoneNumber = parsePhoneNumber('+4915112345678', 'DE');
      expect(phoneNumber).toBeDefined();
      expect(phoneNumber.formatNational()).toBe('0151 12345678');
      expect(phoneNumber.country).toBe('DE');
    });
  });

  describe('French Phone Numbers (+33)', () => {
    const testCases = [
      { number: '+33612345678', expected: true, description: 'Valid mobile' },
      { number: '+33142345678', expected: true, description: 'Valid landline Paris' },
      { number: '+3361234567', expected: false, description: 'Too short' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'FR');
        expect(result).toBe(expected);
      });
    });

    test('Should format French number correctly', () => {
      const phoneNumber = parsePhoneNumber('+33612345678', 'FR');
      expect(phoneNumber).toBeDefined();
      expect(phoneNumber.formatNational()).toBe('06 12 34 56 78');
      expect(phoneNumber.country).toBe('FR');
    });
  });

  describe('Spanish Phone Numbers (+34)', () => {
    const testCases = [
      { number: '+34612345678', expected: true, description: 'Valid mobile' },
      { number: '+34912345678', expected: true, description: 'Valid landline Madrid' },
      { number: '+3461234567', expected: false, description: 'Too short' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'ES');
        expect(result).toBe(expected);
      });
    });
  });

  describe('South African Phone Numbers (+27)', () => {
    const testCases = [
      { number: '+27821234567', expected: true, description: 'Valid mobile' },
      { number: '+27211234567', expected: true, description: 'Valid landline' },
      { number: '+2782123456', expected: false, description: 'Too short' },
    ];

    testCases.forEach(({ number, expected, description }) => {
      test(`${description}: ${number}`, () => {
        const result = isValidPhoneNumber(number, 'ZA');
        expect(result).toBe(expected);
      });
    });
  });

  describe('Phone Number Metadata', () => {
    test('Should extract phone number type', () => {
      const mobile = parsePhoneNumber('+2348012345678', 'NG');
      const fixedLine = parsePhoneNumber('+14155552671', 'US');

      expect(mobile.getType()).toBe('MOBILE');
      expect(fixedLine.getType()).toMatch(/FIXED_LINE|FIXED_LINE_OR_MOBILE/);
    });

    test('Should provide URI format', () => {
      const phoneNumber = parsePhoneNumber('+2348012345678', 'NG');
      expect(phoneNumber.getURI()).toBe('tel:+2348012345678');
    });

    test('Should identify country from number', () => {
      const ngNumber = parsePhoneNumber('+2348012345678');
      const usNumber = parsePhoneNumber('+14155552671');

      expect(ngNumber.country).toBe('NG');
      expect(usNumber.country).toBe('US');
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid formats gracefully', () => {
      expect(() => {
        isValidPhoneNumber('invalid', 'NG');
      }).not.toThrow();

      expect(isValidPhoneNumber('invalid', 'NG')).toBe(false);
    });

    test('Should handle empty strings', () => {
      expect(isValidPhoneNumber('', 'NG')).toBe(false);
    });

    test('Should handle undefined country code', () => {
      const result = isValidPhoneNumber('+2348012345678');
      expect(result).toBe(true); // Should auto-detect
    });

    test('Should throw on unparseable number', () => {
      expect(() => {
        parsePhoneNumber('abc123', 'NG');
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('Should handle numbers with spaces', () => {
      const result = isValidPhoneNumber('+234 801 234 5678', 'NG');
      expect(result).toBe(true);
    });

    test('Should handle numbers with dashes', () => {
      const result = isValidPhoneNumber('+234-801-234-5678', 'NG');
      expect(result).toBe(true);
    });

    test('Should handle numbers with parentheses', () => {
      const result = isValidPhoneNumber('+1 (415) 555-2671', 'US');
      expect(result).toBe(true);
    });

    test('Should reject numbers with letters', () => {
      const result = isValidPhoneNumber('+234801234567A', 'NG');
      expect(result).toBe(false);
    });
  });

  describe('Multiple Countries Support', () => {
    test('Should validate numbers from all 9 supported countries', () => {
      const validNumbers = [
        { number: '+2348012345678', country: 'NG' as const },
        { number: '+14155552671', country: 'US' as const },
        { number: '+447911123456', country: 'GB' as const },
        { number: '+27821234567', country: 'ZA' as const },
        { number: '+254712123456', country: 'KE' as const },
        { number: '+233244123456', country: 'GH' as const },
        { number: '+4915112345678', country: 'DE' as const },
        { number: '+33612345678', country: 'FR' as const },
        { number: '+34612345678', country: 'ES' as const },
      ];

      validNumbers.forEach(({ number, country }) => {
        expect(isValidPhoneNumber(number, country)).toBe(true);
      });
    });
  });

  describe('Performance Tests', () => {
    test('Should validate 1000 numbers quickly', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        isValidPhoneNumber('+2348012345678', 'NG');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 1000 validations in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
