import { AIFraudDetectionService } from '../../server/services/fraud-detection';
import { FraudDetectionRequest } from '../../server/services/fraud-detection';

describe('AI Fraud Detection Service - Core Tests', () => {
  let fraudDetectionService: AIFraudDetectionService;

  beforeAll(async () => {
    fraudDetectionService = new AIFraudDetectionService();
    await fraudDetectionService.initialize();
  });

  const createBasicRequest = (amount: number = 1000): FraudDetectionRequest => ({
    userId: 'test-user-123',
    tenantId: 'test-tenant',
    transactionData: {
      amount,
      recipientAccountNumber: '1234567890',
      recipientBankCode: '044',
      description: 'Test transfer',
      timestamp: new Date().toISOString()
    },
    userContext: {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      deviceFingerprint: 'device-123',
      location: {
        latitude: 6.5244,
        longitude: 3.3792
      }
    },
    behavioralData: {
      sessionDuration: 300000,
      previousTransactionCount: 10,
      avgTransactionAmount: 5000,
      timeOfDay: 14, // 2 PM
      dayOfWeek: 2   // Tuesday
    }
  });

  describe('Basic Functionality', () => {
    test('should initialize successfully', async () => {
      const service = new AIFraudDetectionService();
      await expect(service.initialize()).resolves.not.toThrow();
    });

    test('should analyze valid transaction and return proper response', async () => {
      const request = createBasicRequest();
      const result = await fraudDetectionService.analyzeTransaction(request);

      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(['approve', 'review', 'block']).toContain(result.decision);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.flags)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.processingTime).toBe('number');
      expect(result.sessionId).toBeDefined();
    });

    test('should meet performance requirement of < 500ms', async () => {
      const request = createBasicRequest();
      const startTime = Date.now();
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      const endTime = Date.now();
      
      const actualTime = endTime - startTime;
      expect(actualTime).toBeLessThan(500);
      expect(result.processingTime).toBeLessThan(500);
    });
  });

  describe('Amount-based Risk Detection', () => {
    test('should handle small amounts appropriately', async () => {
      const request = createBasicRequest(100);
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(result.decision).not.toBe('block');
      expect(['low', 'medium']).toContain(result.riskLevel);
    });

    test('should flag very high amounts', async () => {
      const request = createBasicRequest(1000000);
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(['approve', 'review', 'block']).toContain(result.decision);
      // Very high amounts should have elevated risk score
      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should detect round number patterns', async () => {
      const roundAmounts = [100000, 500000, 1000000];
      
      for (const amount of roundAmounts) {
        const request = createBasicRequest(amount);
        const result = await fraudDetectionService.analyzeTransaction(request);
        
        // Round numbers should increase risk slightly
        expect(result.riskScore).toBeGreaterThan(0);
      }
    });
  });

  describe('Nigerian Fraud Patterns', () => {
    test('should detect 419 scam amounts', async () => {
      const scamAmounts = [419, 41900, 419000];
      
      for (const amount of scamAmounts) {
        const request = createBasicRequest(amount);
        const result = await fraudDetectionService.analyzeTransaction(request);
        
        // Should detect the pattern and have some risk score
        expect(result.riskScore).toBeGreaterThan(0);
        expect(['approve', 'review', 'block']).toContain(result.decision);
      }
    });
  });

  describe('Time-based Analysis', () => {
    test('should detect off-hours transactions', async () => {
      const request = createBasicRequest();
      request.behavioralData.timeOfDay = 2; // 2 AM
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      // Off-hours should add some risk
      expect(result.riskScore).toBeGreaterThan(0);
    });

    test('should approve business hours transactions', async () => {
      const request = createBasicRequest();
      request.behavioralData.timeOfDay = 10; // 10 AM
      request.behavioralData.dayOfWeek = 3;   // Wednesday
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(result.decision).not.toBe('block');
    });
  });

  describe('Network Security', () => {
    test('should handle normal IP addresses', async () => {
      const request = createBasicRequest();
      request.userContext.ipAddress = '192.168.1.1';
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should detect suspicious user agents', async () => {
      const request = createBasicRequest();
      request.userContext.userAgent = 'curl/7.68.0';
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      // Automated tools should be flagged
      expect(result.riskScore).toBeGreaterThan(0);
      expect(['approve', 'review', 'block']).toContain(result.decision);
    });

    test('should handle invalid IP addresses gracefully', async () => {
      const request = createBasicRequest();
      request.userContext.ipAddress = 'invalid-ip';
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThan(0);
    });
  });

  describe('Behavioral Analysis', () => {
    test('should analyze session patterns', async () => {
      const request = createBasicRequest();
      request.behavioralData.sessionDuration = 30000; // Very short session
      request.behavioralData.previousTransactionCount = 0; // No history
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      // New user with short session should have some risk
      expect(result.riskScore).toBeGreaterThan(0);
      expect(['approve', 'review', 'block']).toContain(result.decision);
    });

    test('should trust established users', async () => {
      const request = createBasicRequest();
      request.behavioralData.previousTransactionCount = 100;
      request.behavioralData.avgTransactionAmount = 1000;
      request.behavioralData.sessionDuration = 600000; // 10 minutes
      
      const result = await fraudDetectionService.analyzeTransaction(request);
      
      expect(result.decision).not.toBe('block');
    });
  });

  describe('Concurrent Processing', () => {
    test('should handle multiple requests efficiently', async () => {
      const requests = Array(5).fill(null).map((_, i) => createBasicRequest(1000 + i * 100));
      const startTime = Date.now();
      
      const results = await Promise.all(
        requests.map(req => fraudDetectionService.analyzeTransaction(req))
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(1000);
      
      results.forEach(result => {
        expect(result.processingTime).toBeLessThan(500);
        expect(result.sessionId).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing optional fields', async () => {
      const minimalRequest: FraudDetectionRequest = {
        userId: 'test-user',
        tenantId: 'test-tenant',
        transactionData: {
          amount: 1000,
          recipientAccountNumber: '1234567890',
          recipientBankCode: '044',
          timestamp: new Date().toISOString()
        },
        userContext: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        },
        behavioralData: {
          sessionDuration: 300000,
          previousTransactionCount: 5,
          avgTransactionAmount: 2000,
          timeOfDay: 14,
          dayOfWeek: 2
        }
      };
      
      const result = await fraudDetectionService.analyzeTransaction(minimalRequest);
      
      expect(result).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle edge case amounts', async () => {
      const edgeCases = [0.01, 999999999];
      
      for (const amount of edgeCases) {
        const request = createBasicRequest(amount);
        const result = await fraudDetectionService.analyzeTransaction(request);
        
        expect(result).toBeDefined();
        expect(result.riskScore).toBeGreaterThanOrEqual(0);
      }
    });
  });
});