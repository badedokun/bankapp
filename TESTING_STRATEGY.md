# Nigerian Multi-Tenant Money Transfer System - Testing Strategy

## Overview

This comprehensive testing strategy covers all aspects of the AI-enhanced multi-tenant Nigerian Money Transfer system, ensuring robust quality assurance across frontend applications, backend microservices, AI components, and infrastructure.

## Testing Pyramid Architecture

```
                    /\
                   /  \
                  /E2E \    <- End-to-End Tests
                 /______\
                /        \
               /Integration\ <- Integration Tests  
              /__________\
             /            \
            /  Unit Tests  \ <- Unit Tests (Foundation)
           /________________\
```

## 1. Unit Testing Strategy

### Frontend Unit Testing (React Native & Web)

**Framework Stack:**
- **Jest**: Primary testing framework
- **React Testing Library**: Component testing
- **React Native Testing Library**: Native component testing
- **MSW (Mock Service Worker)**: API mocking
- **React Hook Testing Library**: Custom hooks testing

**Component Testing Structure:**
```typescript
// Example: AIButton.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AIButton } from '../components/AIButton';
import { AIService } from '../services/AIService';

jest.mock('../services/AIService');

describe('AIButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should trigger AI query on press', async () => {
    const mockAIService = AIService as jest.Mocked<typeof AIService>;
    mockAIService.processQuery.mockResolvedValue({ response: 'Test response' });

    const { getByTestId } = render(
      <AIButton query="Test query" onResponse={jest.fn()} />
    );

    fireEvent.press(getByTestId('ai-button'));
    
    await waitFor(() => {
      expect(mockAIService.processQuery).toHaveBeenCalledWith('Test query');
    });
  });

  test('should handle multi-language responses', async () => {
    const mockAIService = AIService as jest.Mocked<typeof AIService>;
    mockAIService.processQuery.mockResolvedValue({ 
      response: 'Test response',
      language: 'yo' // Yoruba
    });

    const onResponse = jest.fn();
    const { getByTestId } = render(
      <AIButton query="Test query" onResponse={onResponse} language="yo" />
    );

    fireEvent.press(getByTestId('ai-button'));
    
    await waitFor(() => {
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'yo' })
      );
    });
  });
});
```

**Multi-Tenant Testing:**
```typescript
// TenantContext.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { TenantProvider, useTenant } from '../contexts/TenantContext';

describe('TenantContext', () => {
  test('should provide correct tenant configuration', () => {
    const wrapper = ({ children }) => (
      <TenantProvider tenantId="bank-a" subdomain="bank-a">
        {children}
      </TenantProvider>
    );

    const { result } = renderHook(() => useTenant(), { wrapper });

    expect(result.current.tenantId).toBe('bank-a');
    expect(result.current.config.primaryColor).toBe('#007bff'); // Bank A primary color
    expect(result.current.config.features.aiEnabled).toBe(true);
  });
});
```

### Backend Unit Testing (Node.js Services)

**Framework Stack:**
- **Jest**: Primary testing framework
- **Supertest**: HTTP endpoint testing
- **Testcontainers**: Database testing
- **Sinon**: Stubbing and mocking
- **Faker**: Test data generation

**Service Testing Structure:**
```typescript
// AIFraudDetectionService.test.ts
import { AIFraudDetectionService } from '../services/AIFraudDetectionService';
import { TensorFlowClient } from '../clients/TensorFlowClient';
import { createMockTransaction } from '../__mocks__/transaction';

jest.mock('../clients/TensorFlowClient');

describe('AIFraudDetectionService', () => {
  let service: AIFraudDetectionService;
  let mockTFClient: jest.Mocked<TensorFlowClient>;

  beforeEach(() => {
    mockTFClient = new TensorFlowClient() as jest.Mocked<TensorFlowClient>;
    service = new AIFraudDetectionService(mockTFClient);
  });

  test('should detect fraudulent transaction patterns', async () => {
    const suspiciousTransaction = createMockTransaction({
      amount: 1000000, // Large amount
      location: 'Unknown',
      time: '03:00', // Unusual time
      merchant: 'New Merchant'
    });

    mockTFClient.predict.mockResolvedValue({
      fraudScore: 0.85,
      riskFactors: ['high_amount', 'unusual_time', 'new_merchant']
    });

    const result = await service.analyzeFraud(suspiciousTransaction, 'bank-a');

    expect(result.isFraudulent).toBe(true);
    expect(result.riskScore).toBe(0.85);
    expect(result.recommendedAction).toBe('BLOCK');
  });

  test('should handle multi-tenant fraud models', async () => {
    const transaction = createMockTransaction();

    mockTFClient.predict.mockResolvedValue({ fraudScore: 0.3 });

    await service.analyzeFraud(transaction, 'bank-b');

    expect(mockTFClient.predict).toHaveBeenCalledWith(
      expect.objectContaining({ tenantModel: 'bank_b_fraud_model' })
    );
  });
});
```

**Database Testing with Testcontainers:**
```typescript
// TenantRepository.test.ts
import { GenericContainer } from 'testcontainers';
import { TenantRepository } from '../repositories/TenantRepository';
import { createConnection } from '../database/connection';

describe('TenantRepository Integration', () => {
  let postgresContainer;
  let repository: TenantRepository;

  beforeAll(async () => {
    postgresContainer = await new GenericContainer('postgres:14')
      .withEnvironment({
        POSTGRES_DB: 'test_db',
        POSTGRES_USER: 'test_user',
        POSTGRES_PASSWORD: 'test_pass'
      })
      .withExposedPorts(5432)
      .start();

    const connection = await createConnection({
      host: postgresContainer.getHost(),
      port: postgresContainer.getMappedPort(5432),
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass'
    });

    repository = new TenantRepository(connection);
  });

  afterAll(async () => {
    await postgresContainer.stop();
  });

  test('should create tenant with proper isolation', async () => {
    const tenantData = {
      id: 'test-bank',
      name: 'Test Bank',
      subdomain: 'test-bank',
      tier: 'premium'
    };

    const tenant = await repository.createTenant(tenantData);
    
    expect(tenant.id).toBe('test-bank');
    expect(tenant.database_name).toBe('tenant_test_bank');
    
    // Verify database schema creation
    const schemas = await repository.getTenantSchemas(tenant.id);
    expect(schemas).toContain('transactions');
    expect(schemas).toContain('ai_conversations');
  });
});
```

### AI Model Unit Testing

**Framework Stack:**
- **TensorFlow.js**: Model testing
- **Jest**: Test runner
- **NumPy.js**: Data manipulation
- **Canvas Mock**: Image processing mocking

```typescript
// FraudDetectionModel.test.ts
import * as tf from '@tensorflow/tfjs-node';
import { FraudDetectionModel } from '../models/FraudDetectionModel';
import { createMockTransactionFeatures } from '../__mocks__/features';

describe('FraudDetectionModel', () => {
  let model: FraudDetectionModel;

  beforeAll(async () => {
    model = new FraudDetectionModel();
    await model.loadModel('./models/fraud_detection');
  });

  test('should predict fraud probability correctly', async () => {
    const features = createMockTransactionFeatures({
      amount: 50000,
      hourOfDay: 2,
      merchantRiskScore: 0.8,
      userHistoryScore: 0.2
    });

    const prediction = await model.predict(features);

    expect(prediction).toBeGreaterThan(0.7); // High fraud probability
    expect(prediction).toBeLessThanOrEqual(1.0);
  });

  test('should handle batch predictions', async () => {
    const featureBatch = [
      createMockTransactionFeatures({ amount: 1000 }), // Normal
      createMockTransactionFeatures({ amount: 100000 }), // Suspicious
      createMockTransactionFeatures({ amount: 2000 }) // Normal
    ];

    const predictions = await model.predictBatch(featureBatch);

    expect(predictions).toHaveLength(3);
    expect(predictions[1]).toBeGreaterThan(predictions[0]); // Suspicious > Normal
  });
});
```

## 2. Integration Testing Strategy

### API Integration Testing

**Test Structure:**
```typescript
// TransactionAPI.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from '../__tests__/setup';

describe('/api/v2/transactions Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  test('should create transaction with AI fraud analysis', async () => {
    const transactionData = {
      amount: 5000,
      merchantId: 'merchant_123',
      currency: 'NGN',
      description: 'Test purchase'
    };

    const response = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer test_jwt_token')
      .send(transactionData)
      .expect(201);

    expect(response.body.transaction.id).toBeDefined();
    expect(response.body.fraudAnalysis.riskScore).toBeDefined();
    expect(response.body.fraudAnalysis.aiRecommendation).toBeDefined();
  });

  test('should enforce tenant isolation in transactions', async () => {
    // Create transaction for tenant A
    await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer bank_a_jwt')
      .send({ amount: 1000, merchantId: 'merchant_1' })
      .expect(201);

    // Try to access with tenant B credentials
    const response = await request(app)
      .get('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-b')
      .set('Authorization', 'Bearer bank_b_jwt')
      .expect(200);

    // Should not see tenant A's transactions
    expect(response.body.transactions).toHaveLength(0);
  });
});
```

### AI Service Integration Testing

```typescript
// AIConversationService.integration.test.ts
import { AIConversationService } from '../services/AIConversationService';
import { VectorDatabase } from '../database/VectorDatabase';
import { OpenAIClient } from '../clients/OpenAIClient';

describe('AIConversationService Integration', () => {
  let service: AIConversationService;
  let vectorDB: VectorDatabase;

  beforeAll(async () => {
    vectorDB = new VectorDatabase(process.env.TEST_VECTOR_DB_URL);
    service = new AIConversationService(vectorDB, new OpenAIClient());
    await vectorDB.connect();
  });

  test('should handle multi-language conversation', async () => {
    const yorubaQuery = "Bawo ni mo se le san owo mi?"; // How can I pay my money?
    
    const response = await service.processConversation({
      query: yorubaQuery,
      language: 'yo',
      tenantId: 'bank-a',
      userId: 'user_123'
    });

    expect(response.language).toBe('yo');
    expect(response.intent).toBe('payment_inquiry');
    expect(response.response).toContain('san'); // Yoruba word for pay
    expect(response.suggestedActions).toBeDefined();
  });

  test('should maintain conversation context', async () => {
    const conversationId = 'test_conversation_123';

    // First message
    await service.processConversation({
      query: "I want to make a payment",
      conversationId,
      tenantId: 'bank-a',
      userId: 'user_123'
    });

    // Follow-up message
    const response = await service.processConversation({
      query: "How much is the fee?",
      conversationId,
      tenantId: 'bank-a',
      userId: 'user_123'
    });

    expect(response.context.previousIntent).toBe('payment_request');
    expect(response.response).toContain('payment fee');
  });
});
```

### Database Integration Testing

```typescript
// MultiTenantDatabase.integration.test.ts
import { MultiTenantDatabaseService } from '../services/MultiTenantDatabaseService';
import { TenantMigrationService } from '../services/TenantMigrationService';

describe('Multi-Tenant Database Integration', () => {
  let dbService: MultiTenantDatabaseService;
  let migrationService: TenantMigrationService;

  test('should create isolated tenant databases', async () => {
    const tenantId = 'integration-test-bank';
    
    await dbService.createTenantDatabase(tenantId);
    
    // Verify database exists
    const exists = await dbService.tenantDatabaseExists(tenantId);
    expect(exists).toBe(true);

    // Verify schema is properly created
    const tables = await dbService.getTenantTables(tenantId);
    expect(tables).toContain('users');
    expect(tables).toContain('transactions');
    expect(tables).toContain('ai_conversations');
  });

  test('should enforce row-level security', async () => {
    const tenant1 = 'test-tenant-1';
    const tenant2 = 'test-tenant-2';

    // Create data for tenant 1
    await dbService.query(tenant1, 
      'INSERT INTO transactions (amount, user_id) VALUES (100, $1)', 
      ['user1']
    );

    // Try to access from tenant 2 context
    const result = await dbService.query(tenant2, 
      'SELECT * FROM transactions', 
      []
    );

    expect(result.rows).toHaveLength(0); // Should be empty due to RLS
  });
});
```

## 3. End-to-End Testing Strategy

### E2E Testing Framework

**Tools:**
- **Playwright**: Cross-browser testing
- **Detox**: React Native E2E testing
- **Docker Compose**: Environment setup
- **Kubernetes**: Production-like testing

**Web E2E Testing:**
```typescript
// e2e/multi-tenant-flow.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Multi-Tenant E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup tenant-specific environment
    await page.goto('https://bank-a-dev.localhost:3000');
  });

  test('should complete full transaction with AI assistance', async ({ page }) => {
    // Login
    await page.fill('[data-testid=username]', 'test@bank-a.com');
    await page.fill('[data-testid=password]', 'testpass123');
    await page.click('[data-testid=login-button]');

    // Wait for dashboard
    await expect(page.locator('[data-testid=dashboard]')).toBeVisible();

    // Start AI-assisted transaction
    await page.click('[data-testid=ai-chat-button]');
    await page.fill('[data-testid=ai-input]', 'I want to send money to John');
    await page.press('[data-testid=ai-input]', 'Enter');

    // AI should suggest transaction form
    await expect(page.locator('[data-testid=ai-suggestion]')).toContainText('transfer');
    await page.click('[data-testid=ai-suggestion-action]');

    // Fill transaction details
    await page.fill('[data-testid=recipient-account]', '1234567890');
    await page.fill('[data-testid=amount]', '5000');
    await page.fill('[data-testid=description]', 'Test payment');

    // Submit transaction
    await page.click('[data-testid=submit-transaction]');

    // Verify fraud analysis
    await expect(page.locator('[data-testid=fraud-analysis]')).toBeVisible();
    await expect(page.locator('[data-testid=risk-score]')).toContainText('Low Risk');

    // Confirm transaction
    await page.click('[data-testid=confirm-transaction]');

    // Verify success
    await expect(page.locator('[data-testid=transaction-success]')).toBeVisible();
    await expect(page.locator('[data-testid=transaction-id]')).not.toBeEmpty();
  });

  test('should maintain tenant branding throughout flow', async ({ page }) => {
    await page.goto('https://bank-a-dev.localhost:3000');
    
    // Verify Bank A branding
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color');
    });
    expect(primaryColor.trim()).toBe('#007bff'); // Bank A blue

    // Switch to Bank B tenant
    await page.goto('https://bank-b-dev.localhost:3000');
    
    // Verify Bank B branding
    const bankBColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color');
    });
    expect(bankBColor.trim()).toBe('#e31e24'); // Bank B red
  });
});
```

**Mobile E2E Testing (React Native):**
```typescript
// e2e/mobile-ai-flow.e2e.ts
import { by, device, element, expect } from 'detox';

describe('Mobile AI Features', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { 
        tenantId: 'bank-a',
        environment: 'test' 
      }
    });
  });

  it('should handle voice commands for transactions', async () => {
    // Navigate to voice command screen
    await element(by.id('voice-command-tab')).tap();
    
    // Start voice recording
    await element(by.id('start-voice-recording')).tap();
    
    // Simulate voice input (in real test, would use audio file)
    await device.sendUserNotification({
      trigger: {
        type: 'voice',
        text: 'Send 2000 naira to account 1234567890'
      }
    });

    // Verify AI processed the voice command
    await expect(element(by.id('voice-processing-result'))).toBeVisible();
    await expect(element(by.text('Transfer Request Detected'))).toBeVisible();

    // Verify transaction form is pre-filled
    await expect(element(by.id('amount-input'))).toHaveText('2000');
    await expect(element(by.id('recipient-input'))).toHaveText('1234567890');

    // Confirm transaction
    await element(by.id('confirm-voice-transaction')).tap();
    
    // Verify biometric authentication prompt
    await expect(element(by.text('Authenticate with fingerprint'))).toBeVisible();
  });

  it('should work offline and sync when online', async () => {
    // Go offline
    await device.setNetworkConditions({
      offline: true
    });

    // Create offline transaction
    await element(by.id('new-transaction-button')).tap();
    await element(by.id('amount-input')).typeText('1000');
    await element(by.id('offline-save-button')).tap();

    // Verify offline indicator
    await expect(element(by.id('offline-indicator'))).toBeVisible();
    await expect(element(by.text('Transaction saved offline'))).toBeVisible();

    // Go back online
    await device.setNetworkConditions({
      offline: false
    });

    // Wait for sync
    await waitFor(element(by.id('sync-complete-indicator')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify transaction was synced
    await element(by.id('transactions-tab')).tap();
    await expect(element(by.text('₦1,000.00'))).toBeVisible();
  });
});
```

## 4. Performance Testing Strategy

### Load Testing

**Tools:**
- **Artillery**: Load testing
- **K6**: Performance testing
- **JMeter**: Complex scenarios
- **Apache Bench**: Simple HTTP testing

```javascript
// load-tests/transaction-load.yml (Artillery)
config:
  target: 'https://api-dev.nibss-pos.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 600
      arrivalRate: 100
      name: "Sustained load"
  variables:
    tenants:
      - 'bank-a'
      - 'bank-b' 
      - 'bank-c'

scenarios:
  - name: "AI-Enhanced Transaction Flow"
    weight: 70
    flow:
      - post:
          url: "/api/v2/auth/login"
          json:
            username: "load_test_user_{{ $randomInt(1, 1000) }}@{{ $randomString(tenants) }}.com"
            password: "testpass123"
          capture:
            - json: "$.token"
              as: "authToken"
            - json: "$.tenantId"
              as: "tenantId"
      
      - post:
          url: "/api/v2/ai/fraud-check"
          headers:
            Authorization: "Bearer {{ authToken }}"
            X-Tenant-ID: "{{ tenantId }}"
          json:
            amount: "{{ $randomInt(100, 50000) }}"
            merchantId: "merchant_{{ $randomInt(1, 100) }}"
            location: "Lagos, Nigeria"
          capture:
            - json: "$.riskScore"
              as: "riskScore"
            - json: "$.recommendation"
              as: "recommendation"
      
      - post:
          url: "/api/v2/transactions"
          headers:
            Authorization: "Bearer {{ authToken }}"
            X-Tenant-ID: "{{ tenantId }}"
          json:
            amount: "{{ $randomInt(100, 50000) }}"
            currency: "NGN"
            merchantId: "merchant_{{ $randomInt(1, 100) }}"
            fraudAnalysis:
              riskScore: "{{ riskScore }}"
              recommendation: "{{ recommendation }}"
          expect:
            - statusCode: 201
            - contentType: json
            - hasProperty: "transaction.id"

  - name: "AI Conversation Load"
    weight: 30
    flow:
      - post:
          url: "/api/v2/ai/conversation"
          headers:
            X-Tenant-ID: "{{ $randomString(tenants) }}"
          json:
            query: "{{ $randomString(['How do I send money?', 'What is my balance?', 'Show transaction history', 'Help me pay bills']) }}"
            language: "{{ $randomString(['en', 'yo', 'ha', 'ig']) }}"
            userId: "user_{{ $randomInt(1, 1000) }}"
          expect:
            - statusCode: 200
            - hasProperty: "response"
            - hasProperty: "intent"
```

**Database Performance Testing:**
```sql
-- database-performance-test.sql
-- Test tenant isolation performance
BEGIN;
SET search_path TO tenant_bank_a;

EXPLAIN ANALYZE 
SELECT t.*, u.name as user_name 
FROM transactions t 
JOIN users u ON t.user_id = u.id 
WHERE t.created_at >= NOW() - INTERVAL '30 days'
AND t.amount > 1000
ORDER BY t.created_at DESC
LIMIT 100;

-- Test AI conversation search performance
EXPLAIN ANALYZE
SELECT c.*, 
       ts_rank_cd(to_tsvector('english', c.query || ' ' || c.response), 
                   plainto_tsquery('english', 'payment transfer')) as rank
FROM ai_conversations c
WHERE to_tsvector('english', c.query || ' ' || c.response) 
      @@ plainto_tsquery('english', 'payment transfer')
ORDER BY rank DESC, c.created_at DESC
LIMIT 50;

ROLLBACK;
```

### AI Performance Testing

```python
# ai_performance_test.py
import asyncio
import aiohttp
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor

class AIPerformanceTest:
    def __init__(self, base_url, concurrent_users=50):
        self.base_url = base_url
        self.concurrent_users = concurrent_users
        self.results = []

    async def test_fraud_detection_performance(self):
        """Test AI fraud detection under load"""
        tasks = []
        for _ in range(self.concurrent_users):
            task = asyncio.create_task(self.single_fraud_detection_request())
            tasks.append(task)
        
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        successful_requests = [r for r in results if not isinstance(r, Exception)]
        
        print(f"Fraud Detection Performance:")
        print(f"Total time: {end_time - start_time:.2f}s")
        print(f"Successful requests: {len(successful_requests)}/{len(results)}")
        print(f"Average response time: {np.mean([r['response_time'] for r in successful_requests]):.3f}s")
        print(f"95th percentile: {np.percentile([r['response_time'] for r in successful_requests], 95):.3f}s")

    async def single_fraud_detection_request(self):
        start_time = time.time()
        async with aiohttp.ClientSession() as session:
            payload = {
                "amount": np.random.randint(100, 50000),
                "merchantId": f"merchant_{np.random.randint(1, 100)}",
                "location": "Lagos, Nigeria",
                "time": "14:30",
                "userHistory": {
                    "averageAmount": np.random.randint(1000, 10000),
                    "transactionCount": np.random.randint(10, 500)
                }
            }
            
            async with session.post(
                f"{self.base_url}/api/v2/ai/fraud-check",
                json=payload,
                headers={"X-Tenant-ID": "gtbank"}
            ) as response:
                result = await response.json()
                response_time = time.time() - start_time
                
                return {
                    "response_time": response_time,
                    "status": response.status,
                    "risk_score": result.get("riskScore")
                }

if __name__ == "__main__":
    test = AIPerformanceTest("http://localhost:8080")
    asyncio.run(test.test_fraud_detection_performance())
```

## 5. Security Testing Strategy

### Authentication & Authorization Testing

```typescript
// security/auth.security.test.ts
import request from 'supertest';
import { app } from '../app';
import { JWTService } from '../services/JWTService';

describe('Security - Authentication & Authorization', () => {
  test('should reject requests without valid JWT', async () => {
    await request(app)
      .get('/api/v2/transactions')
      .expect(401)
      .expect(res => {
        expect(res.body.error).toBe('Authentication required');
      });
  });

  test('should reject expired JWT tokens', async () => {
    const expiredToken = JWTService.generateToken({ 
      userId: 'test_user',
      tenantId: 'gtbank'
    }, { expiresIn: '-1h' }); // Expired 1 hour ago

    await request(app)
      .get('/api/v2/transactions')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
      .expect(res => {
        expect(res.body.error).toContain('Token expired');
      });
  });

  test('should enforce tenant isolation in JWT claims', async () => {
    const grantBankToken = JWTService.generateToken({
      userId: 'user_123',
      tenantId: 'gtbank'
    });

    // Try to access Zenith Bank resources with GTBank token
    await request(app)
      .get('/api/v2/transactions')
      .set('Authorization', `Bearer ${grantBankToken}`)
      .set('X-Tenant-ID', 'bank-b')
      .expect(403)
      .expect(res => {
        expect(res.body.error).toContain('Tenant mismatch');
      });
  });

  test('should validate multi-factor authentication', async () => {
    const response = await request(app)
      .post('/api/v2/auth/mfa/initiate')
      .send({
        username: 'test@gtbank.com',
        password: 'validpassword'
      })
      .expect(200);

    const { mfaToken } = response.body;

    // Should require MFA completion for sensitive operations
    await request(app)
      .post('/api/v2/transactions')
      .set('Authorization', `Bearer ${mfaToken}`)
      .send({ amount: 100000, merchantId: 'merchant_1' })
      .expect(403)
      .expect(res => {
        expect(res.body.error).toContain('MFA required');
      });
  });
});
```

### SQL Injection & NoSQL Injection Testing

```typescript
// security/injection.security.test.ts
describe('Security - Injection Attacks', () => {
  test('should prevent SQL injection in transaction queries', async () => {
    const maliciousPayload = "'; DROP TABLE transactions; --";
    
    await request(app)
      .get('/api/v2/transactions')
      .query({ merchantId: maliciousPayload })
      .set('Authorization', 'Bearer valid_token')
      .set('X-Tenant-ID', 'bank-a')
      .expect(400); // Should be rejected, not cause SQL error

    // Verify transactions table still exists
    const response = await request(app)
      .get('/api/v2/transactions')
      .set('Authorization', 'Bearer valid_token')
      .set('X-Tenant-ID', 'bank-a')
      .expect(200);

    expect(response.body.transactions).toBeDefined();
  });

  test('should prevent NoSQL injection in AI conversation search', async () => {
    const maliciousQuery = { "$ne": null };
    
    await request(app)
      .post('/api/v2/ai/conversation/search')
      .set('Authorization', 'Bearer valid_token')
      .send({ query: maliciousQuery })
      .expect(400)
      .expect(res => {
        expect(res.body.error).toContain('Invalid query format');
      });
  });
});
```

### Rate Limiting & DDoS Protection Testing

```typescript
// security/rate-limiting.security.test.ts
describe('Security - Rate Limiting', () => {
  test('should enforce API rate limits per tenant', async () => {
    const token = 'valid_gtbank_token';
    const requests = [];

    // Make requests beyond the rate limit (assume 100 req/min for premium tier)
    for (let i = 0; i < 120; i++) {
      requests.push(
        request(app)
          .get('/api/v2/health')
          .set('Authorization', `Bearer ${token}`)
          .set('X-Tenant-ID', 'bank-a')
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    expect(rateLimitedResponses[0].headers['retry-after']).toBeDefined();
  });

  test('should have different rate limits for different tenant tiers', async () => {
    const basicTierToken = 'valid_basic_tier_token';
    const premiumTierToken = 'valid_premium_tier_token';

    // Basic tier should have lower limits
    const basicRequests = await makeMultipleRequests(basicTierToken, 'basictier', 60);
    const basicRateLimited = basicRequests.filter(r => r.status === 429);

    // Premium tier should allow more requests
    const premiumRequests = await makeMultipleRequests(premiumTierToken, 'gtbank', 60);
    const premiumRateLimited = premiumRequests.filter(r => r.status === 429);

    expect(basicRateLimited.length).toBeGreaterThan(premiumRateLimited.length);
  });
});
```

### Data Encryption & Privacy Testing

```typescript
// security/encryption.security.test.ts
describe('Security - Data Encryption & Privacy', () => {
  test('should encrypt sensitive data in database', async () => {
    // Create a user with sensitive information
    const response = await request(app)
      .post('/api/v2/users')
      .set('Authorization', 'Bearer admin_token')
      .send({
        email: 'test@gtbank.com',
        phone: '+2348012345678',
        bvn: '12345678901',
        accountNumber: '1234567890'
      });

    // Directly check database to ensure data is encrypted
    const userRecord = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [response.body.user.id]
    );

    // Sensitive fields should be encrypted, not plain text
    expect(userRecord.rows[0].phone).not.toBe('+2348012345678');
    expect(userRecord.rows[0].bvn).not.toBe('12345678901');
    expect(userRecord.rows[0].account_number).not.toBe('1234567890');
    
    // But should be readable when retrieved through API
    const getResponse = await request(app)
      .get(`/api/v2/users/${response.body.user.id}`)
      .set('Authorization', 'Bearer valid_token');

    expect(getResponse.body.user.phone).toBe('+2348012345678');
  });

  test('should mask sensitive data in logs', async () => {
    const logCapture = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logCapture.push(args.join(' '));
    };

    try {
      await request(app)
        .post('/api/v2/transactions')
        .send({
          amount: 5000,
          recipientAccount: '1234567890',
          senderAccount: '0987654321',
          pin: '1234'
        });

      // Check that sensitive data is masked in logs
      const logsWithSensitiveData = logCapture.filter(log => 
        log.includes('1234567890') || 
        log.includes('0987654321') ||
        log.includes('"pin":"1234"')
      );

      expect(logsWithSensitiveData).toHaveLength(0);
      
      // But should contain masked versions
      const logsWithMaskedData = logCapture.filter(log =>
        log.includes('****567890') || log.includes('pin":"****"')
      );

      expect(logsWithMaskedData.length).toBeGreaterThan(0);
    } finally {
      console.log = originalLog;
    }
  });
});
```

## 6. AI-Specific Testing Strategy

### Model Accuracy & Bias Testing

```python
# ai_testing/model_validation.py
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import joblib

class FraudModelValidator:
    def __init__(self, model_path, test_data_path):
        self.model = joblib.load(model_path)
        self.test_data = pd.read_csv(test_data_path)

    def test_accuracy_by_demographics(self):
        """Test model accuracy across different demographic groups"""
        results = {}
        
        # Test across age groups
        for age_group in ['18-25', '26-40', '41-60', '60+']:
            subset = self.test_data[self.test_data['age_group'] == age_group]
            if len(subset) > 0:
                predictions = self.model.predict(subset.drop(['is_fraud', 'age_group'], axis=1))
                accuracy = (predictions == subset['is_fraud']).mean()
                results[f'accuracy_{age_group}'] = accuracy

        # Test across regions
        for region in ['Lagos', 'Abuja', 'Kano', 'Port Harcourt']:
            subset = self.test_data[self.test_data['region'] == region]
            if len(subset) > 0:
                predictions = self.model.predict(subset.drop(['is_fraud', 'region'], axis=1))
                accuracy = (predictions == subset['is_fraud']).mean()
                results[f'accuracy_{region}'] = accuracy

        return results

    def test_bias_detection(self):
        """Detect potential bias in fraud detection"""
        predictions = self.model.predict_proba(
            self.test_data.drop(['is_fraud'], axis=1)
        )[:, 1]  # Probability of fraud

        # Test for disparate impact
        for protected_class in ['gender', 'region', 'income_bracket']:
            if protected_class in self.test_data.columns:
                groups = self.test_data[protected_class].unique()
                fraud_rates = {}
                
                for group in groups:
                    group_data = self.test_data[self.test_data[protected_class] == group]
                    group_predictions = predictions[self.test_data[protected_class] == group]
                    fraud_rate = (group_predictions > 0.5).mean()
                    fraud_rates[group] = fraud_rate
                
                # Calculate disparate impact ratio
                max_rate = max(fraud_rates.values())
                min_rate = min(fraud_rates.values())
                disparate_impact_ratio = min_rate / max_rate if max_rate > 0 else 0
                
                print(f"{protected_class} - Disparate Impact Ratio: {disparate_impact_ratio:.3f}")
                print(f"Fraud rates by {protected_class}: {fraud_rates}")

    def test_adversarial_examples(self):
        """Test model robustness against adversarial examples"""
        # Generate adversarial examples by slightly modifying legitimate transactions
        legitimate_transactions = self.test_data[self.test_data['is_fraud'] == 0]
        
        adversarial_results = []
        
        for _, transaction in legitimate_transactions.sample(100).iterrows():
            original_features = transaction.drop(['is_fraud']).values.reshape(1, -1)
            original_prediction = self.model.predict_proba(original_features)[0, 1]
            
            # Add small perturbations
            for epsilon in [0.01, 0.05, 0.1]:
                noise = np.random.normal(0, epsilon, original_features.shape)
                adversarial_features = original_features + noise
                adversarial_prediction = self.model.predict_proba(adversarial_features)[0, 1]
                
                # Check if prediction flipped significantly
                prediction_change = abs(adversarial_prediction - original_prediction)
                adversarial_results.append({
                    'epsilon': epsilon,
                    'prediction_change': prediction_change,
                    'flipped': prediction_change > 0.3
                })
        
        flip_rate = np.mean([r['flipped'] for r in adversarial_results])
        print(f"Adversarial flip rate: {flip_rate:.3f}")
        
        return adversarial_results
```

### Conversational AI Testing

```typescript
// ai_testing/conversation.test.ts
import { ConversationalAI } from '../services/ConversationalAI';
import { LanguageProcessor } from '../services/LanguageProcessor';

describe('Conversational AI Testing', () => {
  let conversationalAI: ConversationalAI;

  beforeEach(() => {
    conversationalAI = new ConversationalAI();
  });

  test('should handle multiple Nigerian languages', async () => {
    const testCases = [
      { input: "How much money do I have?", language: "en", expectedIntent: "balance_inquiry" },
      { input: "Bawo ni mo se le ri owo mi?", language: "yo", expectedIntent: "balance_inquiry" },
      { input: "Nawa ne nuke a wajen kudina?", language: "ha", expectedIntent: "balance_inquiry" },
      { input: "Ego ole ka m nwere?", language: "ig", expectedIntent: "balance_inquiry" },
      { input: "How person go know him money?", language: "pcm", expectedIntent: "balance_inquiry" }
    ];

    for (const testCase of testCases) {
      const response = await conversationalAI.processQuery({
        query: testCase.input,
        language: testCase.language,
        tenantId: 'bank-a',
        userId: 'test_user'
      });

      expect(response.intent).toBe(testCase.expectedIntent);
      expect(response.language).toBe(testCase.language);
      expect(response.confidence).toBeGreaterThan(0.8);
    }
  });

  test('should maintain context across conversation turns', async () => {
    const conversationId = 'test_conversation';

    // First turn: Ask about sending money
    const turn1 = await conversationalAI.processQuery({
      query: "I want to send money to my friend",
      conversationId,
      tenantId: 'bank-a',
      userId: 'test_user'
    });

    expect(turn1.intent).toBe('money_transfer');
    expect(turn1.context.waitingFor).toContain('recipient');

    // Second turn: Provide recipient (should remember context)
    const turn2 = await conversationalAI.processQuery({
      query: "John Doe",
      conversationId,
      tenantId: 'bank-a',
      userId: 'test_user'
    });

    expect(turn2.context.recipient).toBe('John Doe');
    expect(turn2.context.waitingFor).toContain('amount');

    // Third turn: Provide amount
    const turn3 = await conversationalAI.processQuery({
      query: "5000 naira",
      conversationId,
      tenantId: 'bank-a',
      userId: 'test_user'
    });

    expect(turn3.context.amount).toBe(5000);
    expect(turn3.suggestedActions).toContainEqual(
      expect.objectContaining({ type: 'transfer', recipient: 'John Doe', amount: 5000 })
    );
  });

  test('should handle banking-specific intents accurately', async () => {
    const bankingQueries = [
      { query: "What's my account balance?", expectedIntent: "balance_inquiry", expectedEntities: [] },
      { query: "Send 1000 to 1234567890", expectedIntent: "money_transfer", expectedEntities: ["amount", "account_number"] },
      { query: "Show my last 10 transactions", expectedIntent: "transaction_history", expectedEntities: ["count"] },
      { query: "Pay my electricity bill", expectedIntent: "bill_payment", expectedEntities: ["bill_type"] },
      { query: "Block my card immediately", expectedIntent: "card_block", expectedEntities: [] },
      { query: "What are your transfer charges?", expectedIntent: "fee_inquiry", expectedEntities: ["service_type"] }
    ];

    for (const testCase of bankingQueries) {
      const response = await conversationalAI.processQuery({
        query: testCase.query,
        tenantId: 'bank-a',
        userId: 'test_user'
      });

      expect(response.intent).toBe(testCase.expectedIntent);
      
      for (const expectedEntity of testCase.expectedEntities) {
        expect(response.entities).toHaveProperty(expectedEntity);
      }
      
      expect(response.confidence).toBeGreaterThan(0.7);
    }
  });

  test('should provide appropriate fallback responses', async () => {
    const ambiguousQueries = [
      "What is the meaning of life?",
      "Tell me a joke",
      "What's the weather like?",
      "How do I cook rice?"
    ];

    for (const query of ambiguousQueries) {
      const response = await conversationalAI.processQuery({
        query,
        tenantId: 'bank-a',
        userId: 'test_user'
      });

      expect(response.intent).toBe('out_of_scope');
      expect(response.response).toContain('banking');
      expect(response.suggestedActions).toContainEqual(
        expect.objectContaining({ type: 'contact_support' })
      );
    }
  });
});
```

### Voice Processing Testing

```typescript
// ai_testing/voice.test.ts
describe('Voice Processing AI', () => {
  test('should handle Nigerian accent variations', async () => {
    const voiceFiles = [
      'test_audio/nigerian_english_accent.wav',
      'test_audio/yoruba_accent_english.wav', 
      'test_audio/hausa_accent_english.wav',
      'test_audio/igbo_accent_english.wav',
      'test_audio/pidgin_english.wav'
    ];

    for (const audioFile of voiceFiles) {
      const transcription = await voiceProcessor.transcribe(audioFile, {
        language: 'en-NG', // Nigerian English
        accent: 'nigerian'
      });

      expect(transcription.confidence).toBeGreaterThan(0.7);
      expect(transcription.text).toBeDefined();
      expect(transcription.text.length).toBeGreaterThan(0);
    }
  });

  test('should process voice commands for banking operations', async () => {
    const voiceCommand = 'test_audio/send_money_command.wav'; // "Send two thousand naira to account 1234567890"
    
    const result = await voiceProcessor.processCommand(voiceCommand);
    
    expect(result.intent).toBe('money_transfer');
    expect(result.entities.amount).toBe(2000);
    expect(result.entities.recipient_account).toBe('1234567890');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

## 7. Multi-Tenant Testing Strategy

### Tenant Isolation Testing

```typescript
// multi_tenant/isolation.test.ts
describe('Multi-Tenant Isolation', () => {
  test('should completely isolate tenant data', async () => {
    // Create data for Tenant A
    const tenantAResponse = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer gtbank_token')
      .send({ amount: 1000, merchantId: 'merchant_A' });

    // Create data for Tenant B  
    const tenantBResponse = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-b')
      .set('Authorization', 'Bearer zenith_token')
      .send({ amount: 2000, merchantId: 'merchant_B' });

    // Tenant A should only see their data
    const tenantAData = await request(app)
      .get('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer gtbank_token');

    expect(tenantAData.body.transactions).toHaveLength(1);
    expect(tenantAData.body.transactions[0].amount).toBe(1000);

    // Tenant B should only see their data
    const tenantBData = await request(app)
      .get('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-b')
      .set('Authorization', 'Bearer zenith_token');

    expect(tenantBData.body.transactions).toHaveLength(1);
    expect(tenantBData.body.transactions[0].amount).toBe(2000);
  });

  test('should isolate AI models per tenant', async () => {
    // Train/configure different fraud models for different tenants
    await aiModelService.updateTenantModel('gtbank', {
      fraudThreshold: 0.7,
      features: ['amount', 'time', 'location', 'merchant_history']
    });

    await aiModelService.updateTenantModel('zenithbank', {
      fraudThreshold: 0.8,
      features: ['amount', 'user_behavior', 'device_fingerprint']
    });

    // Same transaction should get different fraud scores based on tenant model
    const transactionData = {
      amount: 50000,
      time: '02:00',
      location: 'Unknown',
      merchant: 'New Merchant'
    };

    const gtbankAnalysis = await request(app)
      .post('/api/v2/ai/fraud-check')
      .set('X-Tenant-ID', 'bank-a')
      .send(transactionData);

    const zenithAnalysis = await request(app)
      .post('/api/v2/ai/fraud-check')
      .set('X-Tenant-ID', 'bank-b')
      .send(transactionData);

    // Should use different models and potentially different results
    expect(gtbankAnalysis.body.modelVersion).toContain('gtbank');
    expect(zenithAnalysis.body.modelVersion).toContain('zenithbank');
  });

  test('should enforce tenant-specific rate limits', async () => {
    // Premium tenant (GTBank) should have higher limits
    const gtbankRequests = await Promise.all(
      Array(100).fill().map(() =>
        request(app)
          .get('/api/v2/health')
          .set('X-Tenant-ID', 'bank-a')
          .set('Authorization', 'Bearer gtbank_token')
      )
    );

    // Basic tenant should have lower limits
    const basicTenantRequests = await Promise.all(
      Array(100).fill().map(() =>
        request(app)
          .get('/api/v2/health')
          .set('X-Tenant-ID', 'basic-tenant')
          .set('Authorization', 'Bearer basic_token')
      )
    );

    const gtbankRateLimited = gtbankRequests.filter(r => r.status === 429);
    const basicRateLimited = basicTenantRequests.filter(r => r.status === 429);

    expect(basicRateLimited.length).toBeGreaterThan(gtbankRateLimited.length);
  });
});
```

### Tenant Configuration Testing

```typescript
// multi_tenant/configuration.test.ts
describe('Tenant Configuration', () => {
  test('should apply tenant-specific branding and features', async () => {
    // Test GTBank configuration
    const gtbankConfig = await request(app)
      .get('/api/v2/tenant/config')
      .set('X-Tenant-ID', 'bank-a');

    expect(gtbankConfig.body.branding.primaryColor).toBe('#007bff');
    expect(gtbankConfig.body.branding.logo).toContain('gtbank');
    expect(gtbankConfig.body.features.aiEnabled).toBe(true);
    expect(gtbankConfig.body.features.voiceProcessing).toBe(true);

    // Test basic tier tenant configuration
    const basicConfig = await request(app)
      .get('/api/v2/tenant/config')
      .set('X-Tenant-ID', 'basic-tenant');

    expect(basicConfig.body.features.aiEnabled).toBe(false);
    expect(basicConfig.body.features.voiceProcessing).toBe(false);
    expect(basicConfig.body.limits.monthlyTransactions).toBe(1000);
  });

  test('should validate tenant-specific business rules', async () => {
    // GTBank might have different transaction limits
    const gtbankLargeTransaction = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer gtbank_token')
      .send({ amount: 2000000, merchantId: 'merchant_1' }); // 2M Naira

    expect(gtbankLargeTransaction.status).toBe(201);

    // Basic tier tenant should be rejected for the same amount
    const basicLargeTransaction = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'basic-tenant')
      .set('Authorization', 'Bearer basic_token')
      .send({ amount: 2000000, merchantId: 'merchant_1' });

    expect(basicLargeTransaction.status).toBe(400);
    expect(basicLargeTransaction.body.error).toContain('exceeds limit');
  });
});
```

## 8. Compliance & Regulatory Testing

### PCI DSS Compliance Testing

```typescript
// compliance/pci_dss.test.ts
describe('PCI DSS Compliance', () => {
  test('should not store prohibited card data', async () => {
    const transactionRequest = {
      cardNumber: '4111111111111111', // Test card
      expiryDate: '12/25',
      cvv: '123',
      amount: 1000
    };

    await request(app)
      .post('/api/v2/transactions/card')
      .send(transactionRequest);

    // Check database to ensure card data is not stored
    const storedTransaction = await db.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1'
    );

    expect(storedTransaction.rows[0].card_number).toBeUndefined();
    expect(storedTransaction.rows[0].cvv).toBeUndefined();
    expect(storedTransaction.rows[0].card_token).toBeDefined(); // Only tokenized reference
  });

  test('should encrypt data in transit and at rest', async () => {
    // Test HTTPS enforcement
    const httpResponse = await request(app.listen())
      .get('/')
      .expect(res => {
        // Should redirect HTTP to HTTPS or return security headers
        expect(
          res.headers['strict-transport-security'] || 
          res.status === 301
        ).toBeTruthy();
      });
  });

  test('should implement proper access controls', async () => {
    // Test that sensitive endpoints require proper authentication
    const sensitiveEndpoints = [
      '/api/v2/admin/users',
      '/api/v2/admin/transactions',
      '/api/v2/admin/audit-logs'
    ];

    for (const endpoint of sensitiveEndpoints) {
      // Should reject without admin token
      await request(app)
        .get(endpoint)
        .set('Authorization', 'Bearer regular_user_token')
        .expect(403);

      // Should allow with admin token
      await request(app)
        .get(endpoint)
        .set('Authorization', 'Bearer admin_token')
        .expect(res => {
          expect([200, 401]).toContain(res.status); // 200 or 401 (if admin token invalid)
        });
    }
  });
});
```

### CBN Compliance Testing

```typescript
// compliance/cbn.test.ts
describe('CBN (Central Bank of Nigeria) Compliance', () => {
  test('should enforce daily transaction limits', async () => {
    const largeAmount = 1000000; // 1M Naira
    
    const response = await request(app)
      .post('/api/v2/transactions')
      .set('X-Tenant-ID', 'bank-a')
      .set('Authorization', 'Bearer user_token')
      .send({ 
        amount: largeAmount,
        merchantId: 'merchant_1',
        userTier: 'tier_1' // Basic BVN verified
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('daily limit');
  });

  test('should require enhanced verification for high-value transactions', async () => {
    const highValueAmount = 2000000; // 2M Naira

    const response = await request(app)
      .post('/api/v2/transactions')
      .send({ 
        amount: highValueAmount,
        merchantId: 'merchant_1'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('enhanced verification required');
    expect(response.body.requiredDocuments).toContain('source_of_funds');
  });

  test('should maintain proper audit trail for regulatory reporting', async () => {
    await request(app)
      .post('/api/v2/transactions')
      .send({ 
        amount: 500000,
        merchantId: 'merchant_1',
        purpose: 'business_payment'
      });

    // Check that audit log entries are created
    const auditLogs = await db.query(
      'SELECT * FROM audit_logs WHERE action_type = $1 ORDER BY created_at DESC',
      ['transaction_create']
    );

    expect(auditLogs.rows.length).toBeGreaterThan(0);
    expect(auditLogs.rows[0]).toMatchObject({
      user_id: expect.any(String),
      action_type: 'transaction_create',
      amount: 500000,
      compliance_flags: expect.any(Object)
    });
  });
});
```

## 9. Monitoring & Observability Testing

### Health Check Testing

```typescript
// monitoring/health.test.ts
describe('Health Checks & Monitoring', () => {
  test('should provide comprehensive health status', async () => {
    const response = await request(app)
      .get('/api/v2/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      services: {
        database: { status: 'up', responseTime: expect.any(Number) },
        redis: { status: 'up', responseTime: expect.any(Number) },
        aiService: { status: 'up', responseTime: expect.any(Number) },
        fraudService: { status: 'up', responseTime: expect.any(Number) }
      },
      metrics: {
        uptime: expect.any(Number),
        memoryUsage: expect.any(Number),
        cpuUsage: expect.any(Number)
      }
    });
  });

  test('should expose Prometheus metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect(200)
      .expect('Content-Type', /text\/plain/);

    // Check for key metrics
    expect(response.text).toContain('http_requests_total');
    expect(response.text).toContain('transaction_processing_duration');
    expect(response.text).toContain('ai_fraud_detection_accuracy');
    expect(response.text).toContain('tenant_active_users');
  });

  test('should provide detailed readiness and liveness probes', async () => {
    // Liveness probe - basic functionality
    await request(app)
      .get('/api/v2/health/live')
      .expect(200);

    // Readiness probe - ready to serve traffic
    const readinessResponse = await request(app)
      .get('/api/v2/health/ready')
      .expect(200);

    expect(readinessResponse.body.ready).toBe(true);
    expect(readinessResponse.body.checks).toMatchObject({
      database: 'pass',
      migrations: 'pass',
      aiModels: 'pass'
    });
  });
});
```

### Logging & Tracing Testing

```typescript
// monitoring/logging.test.ts
describe('Logging & Distributed Tracing', () => {
  test('should generate structured logs with trace IDs', async () => {
    const logCapture = [];
    const originalInfo = console.info;
    console.info = (logEntry) => {
      logCapture.push(JSON.parse(logEntry));
    };

    try {
      const response = await request(app)
        .post('/api/v2/transactions')
        .set('X-Request-ID', 'test-trace-123')
        .send({ amount: 1000, merchantId: 'merchant_1' });

      const transactionLogs = logCapture.filter(log => 
        log.traceId === 'test-trace-123' && 
        log.operation === 'transaction_create'
      );

      expect(transactionLogs.length).toBeGreaterThan(0);
      expect(transactionLogs[0]).toMatchObject({
        level: 'info',
        traceId: 'test-trace-123',
        operation: 'transaction_create',
        tenantId: expect.any(String),
        userId: expect.any(String),
        amount: 1000,
        processingTime: expect.any(Number)
      });
    } finally {
      console.info = originalInfo;
    }
  });

  test('should not log sensitive information', async () => {
    const logCapture = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logCapture.push(args.join(' '));
    };

    try {
      await request(app)
        .post('/api/v2/auth/login')
        .send({ 
          username: 'test@gtbank.com',
          password: 'secretpassword123',
          pin: '1234'
        });

      const sensitiveDataInLogs = logCapture.some(log =>
        log.includes('secretpassword123') || 
        log.includes('pin":"1234"') ||
        log.includes('password":"')
      );

      expect(sensitiveDataInLogs).toBe(false);
    } finally {
      console.log = originalLog;
    }
  });
});
```

## 10. Continuous Integration Testing Pipeline

### Test Pipeline Configuration

```yaml
# .github/workflows/ci-test-pipeline.yml
name: CI Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
        
    - name: Upload unit test coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/unit/lcov.info
        flags: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
      redis:
        image: redis:7
      weaviate:
        image: semitechnologies/weaviate:1.21.2
        env:
          AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
          PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
        ports:
          - 8080:8080
          
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Setup test databases
      run: npm run test:setup:integration
      
    - name: Run integration tests
      run: npm run test:integration
      timeout-minutes: 30
      
    - name: Upload integration test coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/integration/lcov.info
        flags: integration-tests

  ai-model-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-python@v4
      with:
        python-version: '3.9'
        
    - name: Install Python dependencies
      run: |
        pip install -r ai-services/requirements.txt
        pip install -r ai-services/requirements-test.txt
        
    - name: Download test models
      run: |
        mkdir -p ai-models/test
        # Download lightweight test models
        python scripts/download-test-models.py
        
    - name: Run AI model validation tests
      run: python -m pytest ai-services/tests/ -v --cov=ai-services
      
    - name: Run model bias detection tests
      run: python ai-services/tests/bias_detection_test.py
      
    - name: Run adversarial robustness tests
      run: python ai-services/tests/adversarial_test.py

  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run security vulnerability scan
      run: npm audit --audit-level high
      
    - name: Run SAST security tests
      run: npm run test:security:sast
      
    - name: Run dependency security tests  
      run: npm run test:security:deps
      
    - name: Run container security scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'nibss-pos:latest'
        format: 'sarif'
        output: 'trivy-results.sarif'
        
    - name: Upload security scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests, ai-model-tests]
    
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright browsers
      run: npx playwright install --with-deps ${{ matrix.browser }}
      
    - name: Start test environment
      run: |
        docker-compose -f docker-compose.test.yml up -d
        npm run wait-for-services
        
    - name: Run E2E tests
      run: npx playwright test --project=${{ matrix.browser }}
      
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-results-${{ matrix.browser }}
        path: test-results/
        
    - name: Stop test environment
      run: docker-compose -f docker-compose.test.yml down

  performance-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start performance test environment
      run: docker-compose -f docker-compose.perf.yml up -d
      
    - name: Run load tests
      run: |
        npm install -g artillery
        artillery run load-tests/transaction-load.yml
        
    - name: Run AI performance tests
      run: python ai-services/performance/ai_performance_test.py
      
    - name: Generate performance report
      run: npm run generate:performance-report
      
    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-reports/

  compliance-tests:
    runs-on: ubuntu-latest
    needs: [security-tests]
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run PCI DSS compliance tests
      run: npm run test:compliance:pci
      
    - name: Run CBN compliance tests
      run: npm run test:compliance:cbn
      
    - name: Run data privacy compliance tests
      run: npm run test:compliance:privacy
      
    - name: Generate compliance report
      run: npm run generate:compliance-report
      
    - name: Upload compliance results
      uses: actions/upload-artifact@v3
      with:
        name: compliance-results
        path: compliance-reports/

  mobile-tests:
    runs-on: macos-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup React Native environment
      run: |
        brew install watchman
        sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer
        
    - name: Install dependencies
      run: |
        cd apps/mobile
        npm ci
        cd ios && pod install && cd ..
        
    - name: Run iOS tests
      run: |
        cd apps/mobile
        npx detox build --configuration ios.sim.debug
        npx detox test --configuration ios.sim.debug --headless
        
    - name: Run Android tests (if Android emulator available)
      run: |
        cd apps/mobile
        npx detox build --configuration android.emu.debug
        npx detox test --configuration android.emu.debug --headless
      continue-on-error: true # Android emulator not always available in CI
```

### Test Reporting and Quality Gates

```yaml
# Quality gates configuration
quality-gates:
  coverage:
    unit-tests: 85%
    integration-tests: 75%
    e2e-tests: 60%
  
  performance:
    response-time-p95: 500ms
    throughput: 1000 req/sec
    error-rate: <1%
  
  security:
    critical-vulnerabilities: 0
    high-vulnerabilities: 0
    medium-vulnerabilities: <5
  
  ai-model:
    accuracy: >95%
    bias-score: <0.1
    adversarial-robustness: >90%
  
  compliance:
    pci-dss: 100%
    cbn-requirements: 100%
    data-privacy: 100%
```

## 11. Test Environment Management

### Docker Test Environment

```dockerfile
# Dockerfile.test
FROM node:18-alpine

# Install test dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    postgresql-client \
    redis \
    curl

# Install global test tools
RUN npm install -g artillery k6 playwright

# Set up Python environment for AI tests
RUN pip3 install tensorflow pytest numpy pandas sklearn

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose test ports
EXPOSE 3000 3001 8080

# Default test command
CMD ["npm", "run", "test:all"]
```

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:14
    environment:
      POSTGRES_DB: nibss_pos_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./database/test-data:/docker-entrypoint-initdb.d

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  weaviate-test:
    image: semitechnologies/weaviate:1.21.2
    environment:
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-transformers'
    ports:
      - "8081:8080"

  tensorflow-serving-test:
    image: tensorflow/serving:2.13.0
    environment:
      MODEL_NAME: fraud_detection_test
    volumes:
      - ./ai-models/test:/models
    ports:
      - "8502:8501"

  app-test:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/nibss_pos_test
      REDIS_URL: redis://redis-test:6379
      VECTOR_DB_URL: http://weaviate-test:8080
      AI_SERVICE_URL: http://tensorflow-serving-test:8501
    depends_on:
      - postgres-test
      - redis-test
      - weaviate-test
      - tensorflow-serving-test
    ports:
      - "3001:3000"

volumes:
  postgres_test_data:
```

### Test Data Management

```typescript
// test-utils/data-factory.ts
import { faker } from '@faker-js/faker';

export class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      phone: faker.phone.number('+234##########'),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      bvn: faker.datatype.number({ min: 10000000000, max: 99999999999 }).toString(),
      tier: faker.helpers.arrayElement(['basic', 'premium', 'enterprise']),
      isActive: true,
      createdAt: faker.date.past(),
      tenantId: faker.helpers.arrayElement(['gtbank', 'zenithbank', 'ubabank']),
      ...overrides
    };
  }

  static createTransaction(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 100, max: 100000 }),
      currency: 'NGN',
      type: faker.helpers.arrayElement(['transfer', 'payment', 'withdrawal']),
      status: faker.helpers.arrayElement(['pending', 'completed', 'failed']),
      merchantId: faker.datatype.uuid(),
      description: faker.lorem.sentence(),
      location: faker.address.city() + ', Nigeria',
      createdAt: faker.date.past(),
      userId: faker.datatype.uuid(),
      tenantId: faker.helpers.arrayElement(['gtbank', 'zenithbank', 'ubabank']),
      ...overrides
    };
  }

  static createAIConversation(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      query: faker.helpers.arrayElement([
        'How do I send money?',
        'What is my balance?',
        'Show my transactions',
        'Help me pay bills'
      ]),
      response: faker.lorem.paragraph(),
      intent: faker.helpers.arrayElement([
        'balance_inquiry',
        'money_transfer', 
        'transaction_history',
        'bill_payment'
      ]),
      confidence: faker.datatype.float({ min: 0.7, max: 1.0 }),
      language: faker.helpers.arrayElement(['en', 'yo', 'ha', 'ig', 'pcm']),
      userId: faker.datatype.uuid(),
      tenantId: faker.helpers.arrayElement(['gtbank', 'zenithbank', 'ubabank']),
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  static createFraudAlert(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      transactionId: faker.datatype.uuid(),
      riskScore: faker.datatype.float({ min: 0.5, max: 1.0 }),
      riskFactors: faker.helpers.arrayElements([
        'high_amount',
        'unusual_time',
        'new_merchant',
        'location_mismatch',
        'velocity_check'
      ]),
      recommendation: faker.helpers.arrayElement(['APPROVE', 'REVIEW', 'BLOCK']),
      aiModelVersion: 'fraud_detection_v2.1',
      createdAt: faker.date.past(),
      tenantId: faker.helpers.arrayElement(['gtbank', 'zenithbank', 'ubabank']),
      ...overrides
    };
  }

  // Generate bulk test data
  static generateBulkData(count: number, factory: Function) {
    return Array.from({ length: count }, () => factory());
  }

  // Create tenant-specific test data
  static createTenantTestData(tenantId: string, counts = {}) {
    const defaultCounts = {
      users: 100,
      transactions: 1000,
      conversations: 200,
      fraudAlerts: 50
    };
    
    const finalCounts = { ...defaultCounts, ...counts };

    return {
      users: this.generateBulkData(finalCounts.users, () => 
        this.createUser({ tenantId })
      ),
      transactions: this.generateBulkData(finalCounts.transactions, () =>
        this.createTransaction({ tenantId })
      ),
      conversations: this.generateBulkData(finalCounts.conversations, () =>
        this.createAIConversation({ tenantId })
      ),
      fraudAlerts: this.generateBulkData(finalCounts.fraudAlerts, () =>
        this.createFraudAlert({ tenantId })
      )
    };
  }
}
```

## 12. Test Automation and Maintenance

### Automated Test Generation

```typescript
// test-automation/api-test-generator.ts
import { OpenAPIV3 } from 'openapi-types';
import * as yaml from 'yaml';
import * as fs from 'fs';

export class APITestGenerator {
  private openApiSpec: OpenAPIV3.Document;

  constructor(specPath: string) {
    const specContent = fs.readFileSync(specPath, 'utf8');
    this.openApiSpec = yaml.parse(specContent);
  }

  generateTestSuite(): string {
    let testCode = `// Auto-generated API tests
import request from 'supertest';
import { app } from '../app';
import { TestDataFactory } from '../test-utils/data-factory';

describe('Auto-generated API Tests', () => {
`;

    for (const [path, pathItem] of Object.entries(this.openApiSpec.paths || {})) {
      for (const [method, operation] of Object.entries(pathItem || {})) {
        if (typeof operation === 'object' && operation.operationId) {
          testCode += this.generateTestCase(path, method, operation);
        }
      }
    }

    testCode += '});';
    return testCode;
  }

  private generateTestCase(path: string, method: string, operation: any): string {
    const testName = `should handle ${method.toUpperCase()} ${path}`;
    const statusCode = this.getExpectedStatusCode(operation);
    
    return `
  test('${testName}', async () => {
    ${this.generateTestData(operation)}
    
    const response = await request(app)
      .${method}('${path}')
      ${this.generateHeaders(operation)}
      ${this.generateRequestBody(operation)}
      .expect(${statusCode});
    
    ${this.generateResponseValidation(operation)}
  });
`;
  }

  private generateTestData(operation: any): string {
    // Generate test data based on operation parameters
    let dataGeneration = '';
    
    if (operation.requestBody) {
      dataGeneration += 'const testData = TestDataFactory.createTransaction();';
    }
    
    return dataGeneration;
  }

  private generateHeaders(operation: any): string {
    let headers = '';
    
    if (operation.security) {
      headers += `.set('Authorization', 'Bearer test_token')`;
    }
    
    if (operation.parameters?.some((p: any) => p.name === 'X-Tenant-ID')) {
      headers += `.set('X-Tenant-ID', 'gtbank')`;
    }
    
    return headers;
  }

  private generateRequestBody(operation: any): string {
    if (operation.requestBody && ['post', 'put', 'patch'].includes(method)) {
      return '.send(testData)';
    }
    return '';
  }

  private generateResponseValidation(operation: any): string {
    let validation = '';
    
    const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema;
    if (responseSchema) {
      validation += 'expect(response.body).toBeDefined();';
      
      if (responseSchema.properties) {
        for (const [prop, schema] of Object.entries(responseSchema.properties)) {
          validation += `\n    expect(response.body).toHaveProperty('${prop}');`;
        }
      }
    }
    
    return validation;
  }

  private getExpectedStatusCode(operation: any): number {
    const responses = operation.responses || {};
    
    if (responses['200']) return 200;
    if (responses['201']) return 201;
    if (responses['204']) return 204;
    
    return 200; // default
  }
}

// Usage
const generator = new APITestGenerator('./api-specification.yaml');
const testCode = generator.generateTestSuite();
fs.writeFileSync('./tests/generated/api.test.ts', testCode);
```

### Test Maintenance Scripts

```bash
#!/bin/bash
# scripts/maintain-tests.sh

echo "🧹 Maintaining test suite..."

# Remove outdated test files
echo "Removing outdated test files..."
find tests/ -name "*.test.ts" -mtime +90 -delete

# Update test snapshots
echo "Updating test snapshots..."
npm run test:update-snapshots

# Clean up test databases
echo "Cleaning up test databases..."
docker-compose -f docker-compose.test.yml down --volumes
docker-compose -f docker-compose.test.yml up -d postgres-test
sleep 10

# Regenerate API tests from latest spec
echo "Regenerating API tests..."
npm run generate:api-tests

# Run test coverage analysis
echo "Analyzing test coverage..."
npm run test:coverage:analyze

# Update test documentation
echo "Updating test documentation..."
npm run docs:generate:tests

# Check for missing tests
echo "Checking for missing test coverage..."
npm run test:check-missing

echo "✅ Test maintenance complete!"
```

## 13. Conclusion

This comprehensive testing strategy ensures the Nigerian Multi-Tenant PoS system maintains the highest quality standards across all components:

### Key Testing Principles:

1. **Multi-Layered Testing**: Unit → Integration → E2E → Performance → Security
2. **AI-First Approach**: Dedicated testing for AI components, bias detection, model validation
3. **Tenant Isolation**: Rigorous testing of multi-tenant data isolation and configuration
4. **Security-Centric**: Comprehensive security testing including PCI DSS and CBN compliance
5. **Performance Assurance**: Load testing for high-volume Nigerian payment scenarios
6. **Automated Quality Gates**: CI/CD pipeline with strict quality thresholds
7. **Regulatory Compliance**: Specialized tests for Nigerian banking regulations

### Success Metrics:

- **Test Coverage**: >85% unit, >75% integration, >60% E2E
- **Performance**: <500ms P95 response time, >1000 req/sec throughput
- **Security**: Zero critical vulnerabilities, 100% compliance tests passing  
- **AI Quality**: >95% model accuracy, <0.1 bias score
- **Reliability**: <1% test failure rate, <5% flaky test percentage

### Continuous Improvement:

- Weekly test strategy reviews
- Monthly performance benchmark updates
- Quarterly security test enhancement
- Bi-annual AI bias auditing
- Annual compliance validation

This strategy provides a robust foundation for delivering a secure, scalable, and compliant Nigerian Money Transfer system with advanced AI capabilities.