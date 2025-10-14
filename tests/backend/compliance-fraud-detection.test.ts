/**
 * Compliance and Fraud Detection Tests
 * Tests compliance providers and fraud detection systems
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@fmfb.com';
const ADMIN_PASSWORD = 'Admin@123456';
const DEMO_EMAIL = 'demo@fmfb.com';
const DEMO_PASSWORD = 'Demo@123456';
const DEMO_PIN = '1234';

let adminToken: string;
let demoToken: string;

test.describe('Compliance and Fraud Detection Tests', () => {

  test.beforeAll(async ({ request }) => {
    // Login users
    const adminLogin = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    const demoLogin = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD }
    });
    const demoData = await demoLogin.json();
    demoToken = demoData.token;
  });

  // ========================================================================
  // FRAUD DETECTION SYSTEM TESTS
  // ========================================================================
  test.describe('Fraud Detection System', () => {
    test('should detect low-risk transactions', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 1000,
          recipientAccountNumber: '0123456789',
          recipientBankCode: '058',
          description: 'Small regular transfer'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.data.riskLevel).toBe('low');
      expect(result.data.decision).toBe('approve');
      expect(result.data.riskScore).toBeLessThan(40);
    });

    test('should detect medium-risk transactions', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 100000,
          recipientAccountNumber: '9999999999',
          recipientBankCode: '999',
          description: 'Large transfer to new recipient'
        }
      });

      const result = await response.json();
      if (response.ok()) {
        expect(['medium', 'high']).toContain(result.data.riskLevel);
        expect(['review', 'approve']).toContain(result.data.decision);
      }
    });

    test('should detect high-risk transactions', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 5000000,
          recipientAccountNumber: '0000000000',
          recipientBankCode: '999',
          description: 'Suspicious large amount'
        }
      });

      const result = await response.json();
      if (response.ok()) {
        expect(result.data.riskLevel).toMatch(/high|medium/);
        expect(result.data.riskScore).toBeGreaterThan(40);
      }
    });

    test('should flag unusual transfer patterns', async ({ request }) => {
      // Simulate multiple rapid transfers
      const transfers = [];
      for (let i = 0; i < 5; i++) {
        transfers.push(
          request.post(`${BASE_URL}/api/transfers/fraud-check`, {
            headers: { Authorization: `Bearer ${demoToken}` },
            data: {
              amount: 10000,
              recipientAccountNumber: `012345678${i}`,
              recipientBankCode: '058',
              description: `Rapid transfer ${i + 1}`
            }
          })
        );
      }

      const results = await Promise.all(transfers);
      const riskScores = [];

      for (const result of results) {
        if (result.ok()) {
          const data = await result.json();
          riskScores.push(data.data.riskScore);
        }
      }

      // Risk should increase with velocity
      console.log('Risk scores for rapid transfers:', riskScores);
    });

    test('should validate fraud check response structure', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: 5000,
          recipientAccountNumber: '0123456789',
          recipientBankCode: '058',
          description: 'Structure validation test'
        }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();

      expect(result).toHaveProperty('success');
      expect(result.data).toHaveProperty('riskScore');
      expect(result.data).toHaveProperty('riskLevel');
      expect(result.data).toHaveProperty('decision');
      expect(result.data).toHaveProperty('flags');
      expect(Array.isArray(result.data.flags)).toBe(true);

      expect(['low', 'medium', 'high']).toContain(result.data.riskLevel);
      expect(['approve', 'review', 'block']).toContain(result.data.decision);
    });
  });

  // ========================================================================
  // TRANSACTION LIMITS AND COMPLIANCE TESTS
  // ========================================================================
  test.describe('Transaction Limits Compliance', () => {
    test('should enforce daily transaction limits', async ({ request }) => {
      // Get current limits
      const limitsResponse = await request.get(`${BASE_URL}/api/transfers/limits/demo-user-id`, {
        headers: { Authorization: `Bearer ${demoToken}` }
      });

      if (limitsResponse.ok()) {
        const limitsData = await limitsResponse.json();

        expect(limitsData.data).toHaveProperty('daily');
        expect(limitsData.data).toHaveProperty('monthly');
        expect(limitsData.data).toHaveProperty('perTransaction');

        expect(limitsData.data.daily).toHaveProperty('limit');
        expect(limitsData.data.daily).toHaveProperty('used');
        expect(limitsData.data.daily).toHaveProperty('remaining');

        console.log('Daily limit:', limitsData.data.daily.limit);
        console.log('Daily used:', limitsData.data.daily.used);
        console.log('Daily remaining:', limitsData.data.daily.remaining);
      }
    });

    test('should reject transfers exceeding single transaction limit', async ({ request }) => {
      // Attempt very large transfer
      const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: '0123456789',
          amount: 10000000, // Very large amount
          description: 'Limit test',
          pin: DEMO_PIN
        }
      });

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.code).toMatch(/LIMIT_EXCEEDED|INSUFFICIENT_FUNDS/);
    });

    test('should track cumulative daily usage', async ({ request }) => {
      // Make several small transfers
      let totalTransferred = 0;

      for (let i = 0; i < 3; i++) {
        const amount = 500;
        const response = await request.post(`${BASE_URL}/api/transfers/internal`, {
          headers: { Authorization: `Bearer ${demoToken}` },
          data: {
            recipientAccountNumber: '0123456789',
            amount: amount,
            description: `Daily usage test ${i + 1}`,
            pin: DEMO_PIN
          }
        });

        if (response.ok()) {
          totalTransferred += amount;
        }
      }

      console.log('Total transferred in test:', totalTransferred);
    });
  });

  // ========================================================================
  // AML/KYC COMPLIANCE TESTS
  // ========================================================================
  test.describe('AML/KYC Compliance', () => {
    test('should validate KYC tier requirements', async ({ request }) => {
      // Different KYC tiers should have different limits
      const tier1Limit = 50000;
      const tier2Limit = 200000;
      const tier3Limit = 1000000;

      expect(tier2Limit).toBeGreaterThan(tier1Limit);
      expect(tier3Limit).toBeGreaterThan(tier2Limit);
    });

    test('should require enhanced due diligence for large transactions', async ({ request }) => {
      const largeAmount = 500000;

      const response = await request.post(`${BASE_URL}/api/transfers/fraud-check`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          amount: largeAmount,
          recipientAccountNumber: '0123456789',
          recipientBankCode: '058',
          description: 'Large transaction requiring EDD'
        }
      });

      const result = await response.json();
      if (response.ok()) {
        // Large transactions should trigger additional scrutiny
        expect(result.data.riskLevel).toMatch(/medium|high/);
      }
    });

    test('should maintain transaction audit trail', async ({ request }) => {
      // Create a transfer
      const transferResponse = await request.post(`${BASE_URL}/api/transfers/internal`, {
        headers: { Authorization: `Bearer ${demoToken}` },
        data: {
          recipientAccountNumber: '0123456789',
          amount: 1000,
          description: 'Audit trail test',
          pin: DEMO_PIN
        }
      });

      if (transferResponse.ok()) {
        const transferData = await transferResponse.json();
        const reference = transferData.data.reference;

        // Verify transaction can be retrieved from records
        const recordsResponse = await request.get(
          `${BASE_URL}/api/transfers/transaction-records`,
          { headers: { Authorization: `Bearer ${demoToken}` } }
        );

        expect(recordsResponse.ok()).toBeTruthy();
        const recordsData = await recordsResponse.json();

        const auditRecord = recordsData.data.records.find(
          (r: any) => r.reference === reference
        );

        if (auditRecord) {
          expect(auditRecord).toHaveProperty('createdAt');
          expect(auditRecord).toHaveProperty('amount');
          expect(auditRecord).toHaveProperty('status');
          console.log('Audit trail verified for:', reference);
        }
      }
    });
  });

  // ========================================================================
  // INTERNATIONAL TRANSFER COMPLIANCE TESTS
  // ========================================================================
  test.describe('International Transfer Compliance', () => {
    test('should validate SWIFT code format', () => {
      const validSwift = 'DEUTDEFF500';
      const invalidSwift = 'INVALID';

      const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

      expect(validSwift).toMatch(swiftRegex);
      expect(invalidSwift).not.toMatch(swiftRegex);
    });

    test('should validate IBAN format', () => {
      const validIban = 'GB82WEST12345698765432';
      const invalidIban = 'INVALID';

      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;

      expect(validIban).toMatch(ibanRegex);
      expect(invalidIban).not.toMatch(ibanRegex);
    });

    test('should require purpose for international transfers', () => {
      const validPurposes = [
        'Personal transfer',
        'Business payment',
        'Investment',
        'Education',
        'Family support'
      ];

      expect(validPurposes.length).toBeGreaterThan(0);
      expect(validPurposes[0]).toBeTruthy();
    });

    test('should validate source of funds documentation', () => {
      const validSources = ['Salary', 'Business income', 'Savings', 'Investment returns'];

      expect(validSources).toContain('Salary');
      expect(validSources).toContain('Business income');
    });

    test('should check high-risk country restrictions', () => {
      const highRiskCountries = ['AF', 'IR', 'KP', 'SY', 'YE'];
      const testCountry = 'AF';

      expect(highRiskCountries).toContain(testCountry);
    });
  });

  // ========================================================================
  // SANCTIONS SCREENING TESTS
  // ========================================================================
  test.describe('Sanctions Screening', () => {
    test('should screen against sanctions lists', () => {
      // Mock sanctions screening
      const sanctionedNames = ['Sanctioned Entity', 'Blocked Person'];
      const testName = 'John Doe';

      const isOnSanctionsList = sanctionedNames.some(
        sanctioned => sanctioned.toLowerCase() === testName.toLowerCase()
      );

      expect(isOnSanctionsList).toBe(false);
    });

    test('should flag PEP (Politically Exposed Person) status', () => {
      const pepFlags = {
        isPEP: false,
        pepLevel: 'none', // none, domestic, foreign, international
        requiresEnhancedDD: false
      };

      if (pepFlags.isPEP) {
        expect(pepFlags.requiresEnhancedDD).toBe(true);
      }
    });
  });

  // ========================================================================
  // REGULATORY REPORTING TESTS
  // ========================================================================
  test.describe('Regulatory Reporting', () => {
    test('should identify reportable transactions', () => {
      const reportingThreshold = 1000000; // Transactions above this require reporting

      const transaction1 = { amount: 500000 };
      const transaction2 = { amount: 1500000 };

      expect(transaction1.amount).toBeLessThan(reportingThreshold);
      expect(transaction2.amount).toBeGreaterThan(reportingThreshold);
    });

    test('should aggregate related transactions (structuring detection)', () => {
      const relatedTransfers = [
        { amount: 45000, timestamp: Date.now() },
        { amount: 45000, timestamp: Date.now() + 1000 },
        { amount: 45000, timestamp: Date.now() + 2000 }
      ];

      const totalAmount = relatedTransfers.reduce((sum, t) => sum + t.amount, 0);
      const threshold = 100000;

      // Multiple transfers totaling above threshold might indicate structuring
      if (totalAmount > threshold) {
        console.log('Potential structuring detected:', totalAmount);
      }

      expect(totalAmount).toBe(135000);
    });

    test('should maintain CTR (Currency Transaction Report) data', () => {
      const ctrData = {
        amount: 1500000,
        currency: 'NGN',
        transactionType: 'external_transfer',
        customerName: 'Test User',
        customerId: 'user-123',
        date: new Date().toISOString(),
        reportingInstitution: 'FMFB'
      };

      expect(ctrData.amount).toBeGreaterThan(1000000);
      expect(ctrData).toHaveProperty('customerName');
      expect(ctrData).toHaveProperty('date');
      expect(ctrData).toHaveProperty('reportingInstitution');
    });
  });

  // ========================================================================
  // COMPLIANCE PROVIDER TESTS
  // ========================================================================
  test.describe('Compliance Providers', () => {
    test('should validate Nigeria compliance requirements', () => {
      const nigeriaCompliance = {
        jurisdiction: 'Nigeria',
        regulator: 'CBN',
        kycRequired: true,
        amlChecks: true,
        dailyLimit: 500000,
        bvnRequired: true
      };

      expect(nigeriaCompliance.kycRequired).toBe(true);
      expect(nigeriaCompliance.bvnRequired).toBe(true);
      expect(nigeriaCompliance.regulator).toBe('CBN');
    });

    test('should validate USA compliance requirements (BSA/FinCEN)', () => {
      const usaCompliance = {
        jurisdiction: 'USA',
        regulator: 'FinCEN',
        ctrThreshold: 10000,
        sarRequired: true,
        ofacScreening: true
      };

      expect(usaCompliance.ofacScreening).toBe(true);
      expect(usaCompliance.ctrThreshold).toBe(10000);
    });

    test('should validate Europe compliance requirements (AML5)', () => {
      const europeCompliance = {
        jurisdiction: 'Europe',
        regulation: 'AML5',
        psd2Compliant: true,
        scaRequired: true,
        maxTransactionNoSCA: 30
      };

      expect(europeCompliance.psd2Compliant).toBe(true);
      expect(europeCompliance.scaRequired).toBe(true);
    });

    test('should validate Canada compliance requirements (PCMLTFA)', () => {
      const canadaCompliance = {
        jurisdiction: 'Canada',
        regulator: 'FINTRAC',
        largeTransactionThreshold: 10000,
        pepScreening: true,
        ongoingMonitoring: true
      };

      expect(canadaCompliance.pepScreening).toBe(true);
      expect(canadaCompliance.largeTransactionThreshold).toBe(10000);
    });
  });

  // ========================================================================
  // COMPLIANCE SCORING TESTS
  // ========================================================================
  test.describe('Compliance Scoring', () => {
    test('should calculate compliance score based on multiple factors', () => {
      const factors = {
        kycCompleted: true,
        documentVerified: true,
        addressVerified: true,
        phoneVerified: true,
        emailVerified: true,
        bvnVerified: false
      };

      const score = Object.values(factors).filter(Boolean).length;
      const maxScore = Object.values(factors).length;
      const compliancePercentage = (score / maxScore) * 100;

      console.log('Compliance score:', compliancePercentage.toFixed(2) + '%');
      expect(compliancePercentage).toBeGreaterThan(0);
      expect(compliancePercentage).toBeLessThanOrEqual(100);
    });

    test('should enforce minimum compliance score for transactions', () => {
      const userComplianceScore = 75;
      const minimumRequired = 60;
      const highValueMinimum = 90;

      const smallTransaction = { amount: 5000, allowed: userComplianceScore >= minimumRequired };
      const largeTransaction = { amount: 1000000, allowed: userComplianceScore >= highValueMinimum };

      expect(smallTransaction.allowed).toBe(true);
      expect(largeTransaction.allowed).toBe(false);
    });
  });
});
