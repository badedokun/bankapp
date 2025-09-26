# 🔄 Transaction Reversal Service Implementation Plan

## 📋 **Service Architecture Overview**

### **Core Components to Build**

```typescript
// New service structure to add to your platform
server/services/
├── transaction-reversal-service/
│   ├── core/
│   │   ├── ReversalEngine.ts           // Main reversal logic
│   │   ├── ReconciliationService.ts    // Debit/Credit matching
│   │   ├── ReversalValidator.ts        // Business rules validation
│   │   └── TimelineEnforcer.ts         // CBN T+1/T+2 compliance
│   ├── detectors/
│   │   ├── FailureDetector.ts          // Real-time failure detection
│   │   ├── NetworkAnalyzer.ts          // Network timeout detection
│   │   └── SystemGlitchDetector.ts     // System error pattern detection
│   ├── processors/
│   │   ├── AutoReversalProcessor.ts    // Automatic reversals
│   │   ├── ManualReversalProcessor.ts  // Manual approval workflow
│   │   └── InterBankProcessor.ts       // NIBSS/Interswitch integration
│   ├── notifications/
│   │   ├── CustomerNotifier.ts         // SMS/Email notifications
│   │   ├── ComplianceReporter.ts       // CBN reporting
│   │   └── InternalAlerter.ts          // Operations team alerts
│   └── models/
│       ├── FailedTransaction.ts        // Data models
│       ├── ReversalRecord.ts
│       └── DisputeCase.ts
```

## 🔧 **Database Schema Extensions**

### **New Tables to Add (Multi-tenant)**

```sql
-- Failed Transactions Tracking
CREATE TABLE failed_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    original_transaction_id UUID NOT NULL,
    sender_account_id UUID NOT NULL,
    receiver_account_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    failure_reason TEXT NOT NULL,
    failure_type VARCHAR(50) NOT NULL, -- 'network_error', 'timeout', 'routing_error', 'system_glitch'
    detection_method VARCHAR(50) NOT NULL, -- 'automatic', 'manual', 'customer_report'
    status VARCHAR(20) DEFAULT 'detected', -- 'detected', 'pending_reversal', 'reversed', 'disputed'
    created_at TIMESTAMP DEFAULT NOW(),
    detected_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reversal Records
CREATE TABLE transaction_reversals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    failed_transaction_id UUID NOT NULL REFERENCES failed_transactions(id),
    reversal_type VARCHAR(20) NOT NULL, -- 'automatic', 'manual'
    reversal_amount DECIMAL(15,2) NOT NULL,
    authorization_method VARCHAR(50), -- 'system_auto', 'ops_manual', 'manager_approval'
    authorized_by UUID, -- Reference to staff user if manual
    reversal_reference VARCHAR(100) UNIQUE NOT NULL,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    notification_sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reconciliation Logs
CREATE TABLE reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reconciliation_type VARCHAR(30) NOT NULL, -- 'real_time', 'batch_eod'
    transactions_checked INTEGER NOT NULL,
    mismatches_found INTEGER NOT NULL,
    reversals_initiated INTEGER NOT NULL,
    run_started_at TIMESTAMP NOT NULL,
    run_completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dispute Cases
CREATE TABLE dispute_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    failed_transaction_id UUID NOT NULL REFERENCES failed_transactions(id),
    customer_id UUID NOT NULL,
    dispute_reference VARCHAR(100) UNIQUE NOT NULL,
    dispute_reason TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    assigned_to UUID, -- Operations team member
    resolution_timeline TIMESTAMP, -- CBN T+1 or T+2 deadline
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'escalated'
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Tracking
CREATE TABLE cbn_reversal_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reporting_period DATE NOT NULL,
    total_failures INTEGER NOT NULL,
    auto_reversals INTEGER NOT NULL,
    manual_reversals INTEGER NOT NULL,
    within_timeline INTEGER NOT NULL,
    beyond_timeline INTEGER NOT NULL,
    report_submitted_at TIMESTAMP,
    cbn_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged'
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Core Service Implementation**

### **1. Failure Detection Service**

```typescript
// server/services/transaction-reversal-service/detectors/FailureDetector.ts
import { AIIntelligenceService } from '../ai-intelligence-service';
import { AuditLogger } from '../security/audit-logger';

export class FailureDetector {
    constructor(
        private aiService: AIIntelligenceService,
        private auditLogger: AuditLogger
    ) {}

    async detectFailures(tenantId: string): Promise<FailedTransaction[]> {
        // Real-time detection logic
        const suspiciousTransactions = await this.findOrphanedDebits(tenantId);
        const networkFailures = await this.detectNetworkTimeouts(tenantId);
        const systemGlitches = await this.detectSystemErrors(tenantId);

        // AI-enhanced pattern detection
        const aiAnalysis = await this.aiService.analyzeTransactionPatterns({
            transactions: [...suspiciousTransactions, ...networkFailures, ...systemGlitches],
            context: 'failure_detection'
        });

        return this.consolidateFailures(aiAnalysis);
    }

    private async findOrphanedDebits(tenantId: string): Promise<any[]> {
        // Query for debits without corresponding credits (last 5 minutes)
        return await db.query(`
            SELECT t1.* FROM transactions t1
            LEFT JOIN transactions t2 ON (
                t1.reference_id = t2.reference_id 
                AND t1.amount = -t2.amount 
                AND t1.tenant_id = t2.tenant_id
            )
            WHERE t1.tenant_id = $1 
            AND t1.amount < 0 
            AND t2.id IS NULL 
            AND t1.created_at > NOW() - INTERVAL '5 minutes'
            AND t1.status = 'completed'
        `, [tenantId]);
    }
}
```

### **2. Reconciliation Service**

```typescript
// server/services/transaction-reversal-service/core/ReconciliationService.ts
export class ReconciliationService {
    async performRealTimeReconciliation(tenantId: string): Promise<ReconciliationResult> {
        const startTime = new Date();
        
        try {
            // Step 1: Get all transactions from last reconciliation
            const transactions = await this.getUnreconciledTransactions(tenantId);
            
            // Step 2: Match debits with credits
            const mismatches = await this.findMismatches(transactions);
            
            // Step 3: Mark for reversal
            const reversalCandidates = await this.validateReversalCandidates(mismatches);
            
            // Step 4: Log reconciliation
            await this.logReconciliation(tenantId, {
                transactionsChecked: transactions.length,
                mismatchesFound: mismatches.length,
                reversalsInitiated: reversalCandidates.length,
                startTime,
                endTime: new Date()
            });

            return {
                success: true,
                reversalCandidates,
                statistics: {
                    checked: transactions.length,
                    mismatches: mismatches.length
                }
            };
        } catch (error) {
            await this.handleReconciliationError(tenantId, error);
            throw error;
        }
    }

    async performBatchReconciliation(tenantId: string): Promise<void> {
        // End-of-day batch reconciliation
        // More thorough checking with longer time windows
    }
}
```

### **3. Reversal Engine**

```typescript
// server/services/transaction-reversal-service/core/ReversalEngine.ts
export class ReversalEngine {
    async processReversal(
        failedTransaction: FailedTransaction,
        reversalType: 'automatic' | 'manual'
    ): Promise<ReversalResult> {
        
        // Step 1: Validate reversal eligibility
        const validation = await this.validateReversalEligibility(failedTransaction);
        if (!validation.eligible) {
            throw new Error(`Reversal not eligible: ${validation.reason}`);
        }

        // Step 2: Create reversal record
        const reversalRecord = await this.createReversalRecord(failedTransaction, reversalType);

        try {
            // Step 3: Execute reversal transaction
            const reversalTransaction = await this.executeReversal(failedTransaction, reversalRecord);

            // Step 4: Update account balances
            await this.updateAccountBalance(
                failedTransaction.senderAccountId,
                failedTransaction.amount,
                'credit'
            );

            // Step 5: Update transaction statuses
            await this.updateTransactionStatuses(failedTransaction, reversalRecord);

            // Step 6: Send notifications
            await this.sendReversalNotifications(failedTransaction, reversalRecord);

            // Step 7: CBN compliance reporting
            await this.updateComplianceRecords(failedTransaction, reversalRecord);

            return {
                success: true,
                reversalRecord,
                reversalTransaction
            };

        } catch (error) {
            await this.handleReversalFailure(reversalRecord, error);
            throw error;
        }
    }

    private async validateReversalEligibility(
        transaction: FailedTransaction
    ): Promise<ValidationResult> {
        // Business rules validation
        const rules = [
            this.checkTimeWindow(transaction), // Must be within reasonable time
            this.checkAccountStatus(transaction), // Accounts must be active
            this.checkBalanceAvailability(transaction), // For manual reversals
            this.checkDuplicateReversal(transaction), // Prevent double reversals
            this.checkComplianceRules(transaction) // CBN compliance
        ];

        const results = await Promise.all(rules);
        const failed = results.filter(r => !r.passed);

        return {
            eligible: failed.length === 0,
            reason: failed.map(f => f.reason).join(', ')
        };
    }
}
```

### **4. AI-Enhanced Intelligence Integration**

```typescript
// Integration with your existing AI service
export class TransactionReversalAI {
    async analyzeFailurePatterns(
        transactions: FailedTransaction[]
    ): Promise<AIAnalysisResult> {
        return await this.aiService.analyze({
            prompt: `Analyze these failed banking transactions for patterns:
            ${JSON.stringify(transactions)}
            
            Identify:
            1. Common failure reasons
            2. Network patterns (VPN/proxy issues)
            3. Time-based patterns
            4. Merchant/beneficiary patterns
            5. Risk indicators
            6. Recommendations for prevention`,
            context: 'transaction_failure_analysis'
        });
    }

    async predictReversalSuccess(
        failedTransaction: FailedTransaction
    ): Promise<ReversalPrediction> {
        // Use AI to predict reversal success probability
        // Helps prioritize manual review cases
    }
}
```

## 📱 **API Endpoints to Add**

```typescript
// server/routes/transaction-reversals.ts
router.post('/api/v1/transactions/reversals/detect', async (req, res) => {
    // Trigger manual failure detection
});

router.get('/api/v1/transactions/reversals', async (req, res) => {
    // Get reversal history with pagination
});

router.post('/api/v1/transactions/reversals/:id/approve', async (req, res) => {
    // Manual approval for reversals requiring authorization
});

router.get('/api/v1/transactions/reversals/disputes', async (req, res) => {
    // Get dispute cases
});

router.post('/api/v1/transactions/reversals/disputes', async (req, res) => {
    // Create new dispute case
});

router.get('/api/v1/transactions/reversals/compliance/cbn', async (req, res) => {
    // CBN compliance reporting
});
```

## 🔔 **Notification Integration**

```typescript
// Integration with your existing notification system
export class ReversalNotificationService {
    async notifyCustomer(reversal: ReversalRecord): Promise<void> {
        const message = `Your transaction of ₦${reversal.reversalAmount} has been reversed due to a failed transfer. Reference: ${reversal.reversalReference}`;
        
        // SMS notification
        await this.smsService.send({
            to: reversal.customerPhone,
            message
        });

        // Email notification
        await this.emailService.send({
            to: reversal.customerEmail,
            subject: 'Transaction Reversal Confirmation',
            template: 'transaction_reversal',
            data: { reversal }
        });

        // In-app notification
        await this.pushNotificationService.send({
            userId: reversal.customerId,
            title: 'Transaction Reversed',
            body: message,
            data: { reversalId: reversal.id }
        });
    }

    async notifyOperationsTeam(dispute: DisputeCase): Promise<void> {
        // Alert operations team for manual cases
    }
}
```

## 🛡️ **Security & Compliance Integration**

### **Audit Trail Enhancement**

```typescript
// Enhanced audit logging for reversals
export class ReversalAuditLogger {
    async logReversalEvent(event: ReversalEvent): Promise<void> {
        await this.auditLogger.log({
            tenantId: event.tenantId,
            eventType: 'TRANSACTION_REVERSAL',
            action: event.action, // 'DETECTED', 'INITIATED', 'COMPLETED', 'FAILED'
            resourceId: event.transactionId,
            userId: event.userId,
            metadata: {
                amount: event.amount,
                reversalType: event.reversalType,
                reason: event.reason,
                complianceImpact: event.complianceImpact
            },
            timestamp: new Date(),
            severity: this.calculateSeverity(event)
        });
    }
}
```

### **CBN Compliance Integration**

```typescript
// Enhance your existing CBN compliance service
export class CBNReversalCompliance {
    async reportFailedTransaction(
        failedTransaction: FailedTransaction
    ): Promise<void> {
        // Automatic CBN incident reporting for significant failures
        if (this.requiresCBNReporting(failedTransaction)) {
            await this.cbnComplianceService.submitIncidentReport({
                type: 'FAILED_ELECTRONIC_PAYMENT',
                transactionRef: failedTransaction.originalTransactionId,
                amount: failedTransaction.amount,
                failureReason: failedTransaction.failureReason,
                detectionTime: failedTransaction.detectedAt,
                resolutionTarget: this.calculateResolutionTarget(failedTransaction)
            });
        }
    }

    private calculateResolutionTarget(transaction: FailedTransaction): Date {
        // CBN mandates T+1 or T+2 working days
        const workingDays = transaction.amount > 1000000 ? 1 : 2; // High value = T+1
        return this.addWorkingDays(transaction.detectedAt, workingDays);
    }
}
```

## 📊 **Dashboard Integration**

### **Add to Your Existing Admin Dashboard**

```typescript
// New dashboard widgets for transaction reversals
export const ReversalDashboardWidgets = {
    // Real-time reversal metrics
    ReversalMetrics: () => (
        <div className="reversal-metrics">
            <MetricCard title="Pending Reversals" value={pendingCount} />
            <MetricCard title="Auto Reversals Today" value={autoReversalsToday} />
            <MetricCard title="Manual Reviews" value={manualReviewCount} />
            <MetricCard title="CBN Compliance" value={compliancePercentage} />
        </div>
    ),

    // Failure pattern analysis
    FailurePatterns: () => (
        <ChartWidget 
            title="Failure Patterns" 
            data={failurePatternData}
            type="bar"
        />
    ),

    // Dispute case management
    DisputeQueue: () => (
        <DisputeTable disputes={activeDisputes} />
    )
};
```

## ⚡ **Performance Targets**

Based on your existing performance achievements:

- **Failure Detection**: < 30 seconds (real-time monitoring)
- **Auto Reversal Processing**: < 2 minutes 
- **Manual Reversal Approval**: < 5 minutes
- **Customer Notification**: < 1 minute after reversal
- **CBN Compliance Reporting**: < 15 minutes
- **Reconciliation Performance**: < 100ms per transaction check

## 🧪 **Testing Strategy**

```typescript
// Add to your existing test suite
describe('Transaction Reversal Service', () => {
    describe('Failure Detection', () => {
        it('should detect orphaned debits within 5 minutes');
        it('should identify network timeout failures');
        it('should flag system glitch patterns');
    });

    describe('Reversal Processing', () => {
        it('should process automatic reversals under 2 minutes');
        it('should handle manual approval workflows');
        it('should prevent duplicate reversals');
    });

    describe('CBN Compliance', () => {
        it('should meet T+1 timeline for high-value transactions');
        it('should meet T+2 timeline for standard transactions');
        it('should generate compliant incident reports');
    });
});
```

## 🎯 **Implementation Timeline**

### **Week 1: Core Infrastructure**
- Set up service structure and database migrations
- Implement failure detection service
- Basic reconciliation engine

### **Week 2: Reversal Processing**
- Implement automatic reversal engine
- Manual approval workflows
- Notification integration

### **Week 3: AI & Compliance Integration**
- AI-enhanced failure pattern detection
- CBN compliance reporting
- Dashboard integration
- Comprehensive testing

## 🔄 **Integration with Your Voice AI**

Your existing AI assistant can announce reversal notifications:

```typescript
// Voice announcement for reversals
await this.aiService.speak({
    text: "A failed transaction has been automatically reversed. ₦5,000 has been credited back to your account. Reference number: TXR-2025-001234.",
    voice: "professional",
    language: "en-NG" // Nigerian English
});
```

This implementation leverages all your existing infrastructure while adding the sophisticated transaction reversal capabilities required by Nigerian banking regulations. The service integrates seamlessly with your multi-tenant architecture, security framework, AI services, and compliance systems.