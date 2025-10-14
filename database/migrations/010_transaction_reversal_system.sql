-- Migration: 010_transaction_reversal_system.sql
-- Description: Transaction Reversal System for CBN T+1/T+2 Compliance
-- Version: 1.0
-- Date: 2025-09-26
-- Author: OrokiiPay Development Team

-- This migration adds comprehensive transaction reversal capabilities
-- for real-time failure detection, automated reversals, and CBN compliance

-- ============================================================================
-- TRANSACTION REVERSAL CORE TABLES
-- ============================================================================

-- Failed Transactions Tracking
CREATE TABLE IF NOT EXISTS tenant.failed_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Reference to original transaction
    original_transaction_id UUID NOT NULL REFERENCES tenant.transfers(id),
    original_transfer_reference VARCHAR(100) NOT NULL,

    -- Transaction details
    sender_account_id UUID NOT NULL REFERENCES tenant.users(id),
    recipient_account_number VARCHAR(20),
    recipient_bank_code VARCHAR(3),
    recipient_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    fees DECIMAL(15,2) DEFAULT 0.00,

    -- Failure analysis
    failure_reason TEXT NOT NULL,
    failure_type VARCHAR(50) NOT NULL CHECK (failure_type IN (
        'network_timeout', 'routing_error', 'system_glitch', 'orphaned_debit',
        'api_failure', 'third_party_error', 'insufficient_funds_post_debit',
        'beneficiary_account_invalid', 'duplicate_transaction_error'
    )),
    detection_method VARCHAR(50) NOT NULL CHECK (detection_method IN (
        'real_time_monitoring', 'reconciliation_batch', 'customer_report',
        'manual_investigation', 'ai_pattern_detection'
    )),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN (
        'detected', 'investigating', 'pending_reversal', 'reversal_processing',
        'reversed', 'disputed', 'escalated', 'resolved'
    )),

    -- CBN compliance tracking
    detection_time TIMESTAMP DEFAULT NOW(),
    resolution_deadline TIMESTAMP, -- T+1 or T+2 deadline
    cbn_incident_reported BOOLEAN DEFAULT false,
    cbn_incident_reference VARCHAR(100),

    -- Metadata for AI analysis and auditing
    failure_metadata JSONB DEFAULT '{}',
    ai_analysis_data JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_failed_transaction_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for failed_transactions
CREATE INDEX IF NOT EXISTS idx_failed_transactions_tenant_id ON tenant.failed_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_original_id ON tenant.failed_transactions(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_sender ON tenant.failed_transactions(sender_account_id);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_status ON tenant.failed_transactions(status);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_detection_time ON tenant.failed_transactions(detection_time);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_deadline ON tenant.failed_transactions(resolution_deadline);
CREATE INDEX IF NOT EXISTS idx_failed_transactions_failure_type ON tenant.failed_transactions(failure_type);

-- ============================================================================

-- Transaction Reversals
CREATE TABLE IF NOT EXISTS tenant.transaction_reversals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Reference to failed transaction
    failed_transaction_id UUID NOT NULL REFERENCES tenant.failed_transactions(id),

    -- Reversal details
    reversal_type VARCHAR(20) NOT NULL CHECK (reversal_type IN (
        'automatic', 'manual', 'emergency', 'dispute_resolution'
    )),
    reversal_amount DECIMAL(15,2) NOT NULL,
    reversal_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Authorization details
    authorization_method VARCHAR(50) CHECK (authorization_method IN (
        'system_automated', 'operations_manual', 'manager_approval',
        'compliance_override', 'emergency_authorization'
    )),
    authorized_by UUID, -- Reference to staff user if manual
    authorization_timestamp TIMESTAMP,

    -- Processing timeline
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    notification_sent_at TIMESTAMP,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'authorized', 'processing', 'completed', 'failed', 'cancelled'
    )),

    -- Error handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,

    -- CBN compliance
    cbn_reported BOOLEAN DEFAULT false,
    cbn_report_timestamp TIMESTAMP,
    compliance_status VARCHAR(20) DEFAULT 'pending' CHECK (compliance_status IN (
        'pending', 'within_timeline', 'late', 'escalated'
    )),

    -- Metadata
    reversal_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_reversal_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for transaction_reversals
CREATE INDEX IF NOT EXISTS idx_reversals_tenant_id ON tenant.transaction_reversals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reversals_failed_transaction ON tenant.transaction_reversals(failed_transaction_id);
CREATE INDEX IF NOT EXISTS idx_reversals_reference ON tenant.transaction_reversals(reversal_reference);
CREATE INDEX IF NOT EXISTS idx_reversals_status ON tenant.transaction_reversals(status);
CREATE INDEX IF NOT EXISTS idx_reversals_type ON tenant.transaction_reversals(reversal_type);
CREATE INDEX IF NOT EXISTS idx_reversals_processing_time ON tenant.transaction_reversals(processing_started_at, processing_completed_at);
CREATE INDEX IF NOT EXISTS idx_reversals_compliance_status ON tenant.transaction_reversals(compliance_status);

-- ============================================================================

-- Reconciliation Logs
CREATE TABLE IF NOT EXISTS tenant.reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Reconciliation details
    reconciliation_type VARCHAR(30) NOT NULL CHECK (reconciliation_type IN (
        'real_time_monitoring', 'hourly_batch', 'daily_batch', 'eod_reconciliation',
        'manual_investigation', 'weekly_deep_check'
    )),

    -- Processing statistics
    transactions_checked INTEGER NOT NULL DEFAULT 0,
    mismatches_found INTEGER NOT NULL DEFAULT 0,
    orphaned_debits_found INTEGER NOT NULL DEFAULT 0,
    reversals_initiated INTEGER NOT NULL DEFAULT 0,
    errors_encountered INTEGER NOT NULL DEFAULT 0,

    -- Time tracking
    run_started_at TIMESTAMP NOT NULL,
    run_completed_at TIMESTAMP,
    processing_duration_seconds INTEGER,

    -- Status and results
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN (
        'running', 'completed', 'failed', 'partially_completed', 'cancelled'
    )),

    -- Detailed results
    reconciliation_summary JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',

    -- Performance metrics
    average_check_time_ms DECIMAL(10,3),
    total_volume_processed DECIMAL(15,2),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_reconciliation_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for reconciliation_logs
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_tenant_id ON tenant.reconciliation_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_type ON tenant.reconciliation_logs(reconciliation_type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_status ON tenant.reconciliation_logs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_time_range ON tenant.reconciliation_logs(run_started_at, run_completed_at);
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_created_at ON tenant.reconciliation_logs(created_at);

-- ============================================================================

-- Dispute Cases
CREATE TABLE IF NOT EXISTS tenant.dispute_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Reference to failed transaction
    failed_transaction_id UUID NOT NULL REFERENCES tenant.failed_transactions(id),

    -- Customer information
    customer_id UUID NOT NULL REFERENCES tenant.users(id),
    dispute_reference VARCHAR(100) UNIQUE NOT NULL,

    -- Dispute details
    dispute_reason TEXT NOT NULL,
    customer_description TEXT,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN (
        'low', 'normal', 'high', 'urgent', 'critical'
    )),

    -- Assignment and tracking
    assigned_to UUID, -- Operations team member
    department VARCHAR(50) DEFAULT 'operations',
    escalation_level INTEGER DEFAULT 1,

    -- Timeline management
    resolution_timeline TIMESTAMP, -- CBN T+1 or T+2 deadline
    first_response_deadline TIMESTAMP,
    customer_followup_date TIMESTAMP,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN (
        'open', 'assigned', 'investigating', 'pending_customer',
        'pending_approval', 'resolved', 'escalated', 'closed'
    )),

    -- Resolution details
    resolution_summary TEXT,
    resolution_action VARCHAR(50),
    customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score BETWEEN 1 AND 5),

    -- Communication tracking
    communications_log JSONB DEFAULT '[]',
    internal_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_dispute_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for dispute_cases
CREATE INDEX IF NOT EXISTS idx_dispute_cases_tenant_id ON tenant.dispute_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_failed_transaction ON tenant.dispute_cases(failed_transaction_id);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_customer ON tenant.dispute_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_reference ON tenant.dispute_cases(dispute_reference);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_status ON tenant.dispute_cases(status);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_priority ON tenant.dispute_cases(priority);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_assigned_to ON tenant.dispute_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_timeline ON tenant.dispute_cases(resolution_timeline);

-- ============================================================================

-- CBN Compliance Reporting
CREATE TABLE IF NOT EXISTS tenant.cbn_reversal_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Reporting period
    reporting_period DATE NOT NULL,
    report_type VARCHAR(30) DEFAULT 'monthly' CHECK (report_type IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'ad_hoc'
    )),

    -- Summary statistics
    total_transactions_processed INTEGER NOT NULL DEFAULT 0,
    total_transaction_volume DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_failures_detected INTEGER NOT NULL DEFAULT 0,
    auto_reversals_count INTEGER NOT NULL DEFAULT 0,
    manual_reversals_count INTEGER NOT NULL DEFAULT 0,
    disputed_cases_count INTEGER NOT NULL DEFAULT 0,

    -- Compliance metrics
    within_t1_timeline INTEGER NOT NULL DEFAULT 0,
    within_t2_timeline INTEGER NOT NULL DEFAULT 0,
    beyond_timeline_count INTEGER NOT NULL DEFAULT 0,
    compliance_percentage DECIMAL(5,2),

    -- Financial impact
    total_amount_failed DECIMAL(15,2) DEFAULT 0.00,
    total_amount_reversed DECIMAL(15,2) DEFAULT 0.00,
    customer_impact_score DECIMAL(5,2),

    -- CBN submission details
    report_submitted_at TIMESTAMP,
    cbn_reference VARCHAR(100),
    cbn_acknowledgment_received BOOLEAN DEFAULT false,
    cbn_acknowledgment_date TIMESTAMP,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'approved', 'submitted',
        'acknowledged', 'rejected', 'resubmitted'
    )),

    -- Detailed data
    detailed_report_data JSONB DEFAULT '{}',
    executive_summary TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation and unique reporting periods
    CONSTRAINT check_cbn_report_tenant_id CHECK (tenant_id IS NOT NULL),
    UNIQUE(tenant_id, reporting_period, report_type)
);

-- Indexes for cbn_reversal_reports
CREATE INDEX IF NOT EXISTS idx_cbn_reports_tenant_id ON tenant.cbn_reversal_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cbn_reports_period ON tenant.cbn_reversal_reports(reporting_period);
CREATE INDEX IF NOT EXISTS idx_cbn_reports_status ON tenant.cbn_reversal_reports(status);
CREATE INDEX IF NOT EXISTS idx_cbn_reports_type ON tenant.cbn_reversal_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_cbn_reports_submitted ON tenant.cbn_reversal_reports(report_submitted_at);

-- ============================================================================

-- AI Pattern Analysis Results
CREATE TABLE IF NOT EXISTS tenant.ai_failure_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Analysis details
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'pattern_detection', 'risk_assessment', 'fraud_detection',
        'network_analysis', 'temporal_analysis', 'merchant_analysis'
    )),

    -- Time range analyzed
    analysis_period_start TIMESTAMP NOT NULL,
    analysis_period_end TIMESTAMP NOT NULL,
    transactions_analyzed INTEGER NOT NULL,

    -- AI results
    patterns_identified JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    confidence_score DECIMAL(5,2),

    -- Impact assessment
    potential_failures_prevented INTEGER DEFAULT 0,
    estimated_cost_savings DECIMAL(15,2) DEFAULT 0.00,

    -- Implementation tracking
    recommendations_implemented INTEGER DEFAULT 0,
    implementation_status VARCHAR(20) DEFAULT 'pending',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_ai_analysis_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for ai_failure_analysis
CREATE INDEX IF NOT EXISTS idx_ai_analysis_tenant_id ON tenant.ai_failure_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON tenant.ai_failure_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_period ON tenant.ai_failure_analysis(analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_confidence ON tenant.ai_failure_analysis(confidence_score);

-- ============================================================================
-- ENHANCED EXISTING TABLES
-- ============================================================================

-- Add reversal tracking columns to existing transfers table
ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS reversal_status VARCHAR(20)
    DEFAULT 'none' CHECK (reversal_status IN ('none', 'marked_for_reversal', 'reversal_pending', 'reversed'));

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS reversal_id UUID
    REFERENCES tenant.transaction_reversals(id);

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS failure_detected_at TIMESTAMP;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(20)
    DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'reconciled', 'mismatched', 'investigating'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transfers_reversal_status ON tenant.transfers(reversal_status);
CREATE INDEX IF NOT EXISTS idx_transfers_reconciliation_status ON tenant.transfers(reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_transfers_failure_detected ON tenant.transfers(failure_detected_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate CBN compliance deadline
CREATE OR REPLACE FUNCTION calculate_cbn_deadline(
    transaction_amount DECIMAL(15,2),
    detection_time TIMESTAMP DEFAULT NOW()
) RETURNS TIMESTAMP AS $$
DECLARE
    working_days INTEGER;
    deadline TIMESTAMP;
BEGIN
    -- High value transactions (> 1M NGN) get T+1, others get T+2
    working_days := CASE
        WHEN transaction_amount > 1000000 THEN 1
        ELSE 2
    END;

    -- Calculate deadline excluding weekends
    deadline := detection_time;
    WHILE working_days > 0 LOOP
        deadline := deadline + INTERVAL '1 day';
        -- Skip weekends (Saturday = 6, Sunday = 0)
        IF EXTRACT(DOW FROM deadline) NOT IN (0, 6) THEN
            working_days := working_days - 1;
        END IF;
    END LOOP;

    -- Set deadline to end of business day (5 PM)
    deadline := DATE_TRUNC('day', deadline) + INTERVAL '17 hours';

    RETURN deadline;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set CBN deadline on failed transaction creation
CREATE OR REPLACE FUNCTION set_cbn_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and set CBN compliance deadline
    NEW.resolution_deadline := calculate_cbn_deadline(NEW.amount, NEW.detection_time);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply CBN deadline trigger
DROP TRIGGER IF EXISTS auto_set_cbn_deadline ON tenant.failed_transactions;
CREATE TRIGGER auto_set_cbn_deadline
    BEFORE INSERT ON tenant.failed_transactions
    FOR EACH ROW EXECUTE FUNCTION set_cbn_deadline();

-- Function to generate unique reversal references
CREATE OR REPLACE FUNCTION generate_reversal_reference()
RETURNS VARCHAR(100) AS $$
DECLARE
    reference VARCHAR(100);
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate reference: REV-YYYYMMDD-HHMMSS-XXXXXX
        reference := 'REV-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' ||
                    LPAD(floor(random() * 1000000)::text, 6, '0');

        -- Check uniqueness
        SELECT NOT EXISTS(
            SELECT 1 FROM tenant.transaction_reversals
            WHERE reversal_reference = reference
        ) INTO is_unique;
    END LOOP;

    RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate reversal reference
CREATE OR REPLACE FUNCTION auto_generate_reversal_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reversal_reference IS NULL THEN
        NEW.reversal_reference := generate_reversal_reference();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply reversal reference trigger
DROP TRIGGER IF EXISTS auto_reversal_reference ON tenant.transaction_reversals;
CREATE TRIGGER auto_reversal_reference
    BEFORE INSERT ON tenant.transaction_reversals
    FOR EACH ROW EXECUTE FUNCTION auto_generate_reversal_reference();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_reversal_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_failed_transactions_timestamp ON tenant.failed_transactions;
CREATE TRIGGER update_failed_transactions_timestamp
    BEFORE UPDATE ON tenant.failed_transactions
    FOR EACH ROW EXECUTE FUNCTION update_reversal_timestamps();

DROP TRIGGER IF EXISTS update_transaction_reversals_timestamp ON tenant.transaction_reversals;
CREATE TRIGGER update_transaction_reversals_timestamp
    BEFORE UPDATE ON tenant.transaction_reversals
    FOR EACH ROW EXECUTE FUNCTION update_reversal_timestamps();

DROP TRIGGER IF EXISTS update_dispute_cases_timestamp ON tenant.dispute_cases;
CREATE TRIGGER update_dispute_cases_timestamp
    BEFORE UPDATE ON tenant.dispute_cases
    FOR EACH ROW EXECUTE FUNCTION update_reversal_timestamps();

DROP TRIGGER IF EXISTS update_cbn_reports_timestamp ON tenant.cbn_reversal_reports;
CREATE TRIGGER update_cbn_reports_timestamp
    BEFORE UPDATE ON tenant.cbn_reversal_reports
    FOR EACH ROW EXECUTE FUNCTION update_reversal_timestamps();

-- ============================================================================
-- VIEWS FOR REPORTING AND MONITORING
-- ============================================================================

-- Active failures requiring attention
CREATE OR REPLACE VIEW tenant.active_failures AS
SELECT
    ft.*,
    u.email as sender_email,
    u.full_name as sender_name,
    tr.status as reversal_status,
    tr.reversal_reference,
    CASE
        WHEN ft.resolution_deadline < NOW() THEN 'OVERDUE'
        WHEN ft.resolution_deadline < NOW() + INTERVAL '4 hours' THEN 'URGENT'
        WHEN ft.resolution_deadline < NOW() + INTERVAL '1 day' THEN 'WARNING'
        ELSE 'NORMAL'
    END as urgency_level
FROM tenant.failed_transactions ft
JOIN tenant.users u ON ft.sender_account_id = u.id
LEFT JOIN tenant.transaction_reversals tr ON ft.id = tr.failed_transaction_id
WHERE ft.status IN ('detected', 'investigating', 'pending_reversal')
ORDER BY ft.resolution_deadline ASC;

-- CBN compliance dashboard
CREATE OR REPLACE VIEW tenant.cbn_compliance_summary AS
SELECT
    DATE_TRUNC('day', ft.detection_time) as failure_date,
    COUNT(*) as total_failures,
    COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) as completed_reversals,
    COUNT(CASE WHEN ft.resolution_deadline > NOW() THEN 1 END) as within_deadline,
    COUNT(CASE WHEN ft.resolution_deadline <= NOW() AND tr.status != 'completed' THEN 1 END) as overdue,
    ROUND(
        (COUNT(CASE WHEN ft.resolution_deadline > NOW() OR tr.status = 'completed' THEN 1 END) * 100.0) /
        NULLIF(COUNT(*), 0), 2
    ) as compliance_percentage
FROM tenant.failed_transactions ft
LEFT JOIN tenant.transaction_reversals tr ON ft.id = tr.failed_transaction_id
WHERE ft.detection_time >= DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('day', ft.detection_time)
ORDER BY failure_date DESC;

-- ============================================================================
-- SECURITY AND AUDIT ENHANCEMENTS
-- ============================================================================

-- Enhanced audit logging for reversal operations
CREATE TABLE IF NOT EXISTS tenant.reversal_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Operation details
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
        'FAILURE_DETECTED', 'REVERSAL_INITIATED', 'REVERSAL_APPROVED',
        'REVERSAL_COMPLETED', 'REVERSAL_FAILED', 'DISPUTE_CREATED',
        'CBN_REPORT_GENERATED', 'MANUAL_OVERRIDE', 'SYSTEM_OVERRIDE'
    )),

    -- References
    transaction_id UUID,
    reversal_id UUID,
    dispute_id UUID,

    -- User context
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,

    -- Operation details
    operation_description TEXT NOT NULL,
    operation_metadata JSONB DEFAULT '{}',

    -- Security context
    authentication_method VARCHAR(50),
    session_id VARCHAR(255),
    api_endpoint VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_reversal_audit_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_reversal_audit_tenant_id ON tenant.reversal_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reversal_audit_operation ON tenant.reversal_audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_reversal_audit_user ON tenant.reversal_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reversal_audit_created_at ON tenant.reversal_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_reversal_audit_transaction ON tenant.reversal_audit_logs(transaction_id);

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tenant.failed_transactions IS 'Tracks failed transactions requiring reversal or investigation';
COMMENT ON TABLE tenant.transaction_reversals IS 'Records of transaction reversal operations and their status';
COMMENT ON TABLE tenant.reconciliation_logs IS 'Automated reconciliation process logs and statistics';
COMMENT ON TABLE tenant.dispute_cases IS 'Customer dispute cases related to failed transactions';
COMMENT ON TABLE tenant.cbn_reversal_reports IS 'CBN compliance reports for regulatory submission';
COMMENT ON TABLE tenant.ai_failure_analysis IS 'AI-powered analysis of transaction failure patterns';
COMMENT ON TABLE tenant.reversal_audit_logs IS 'Comprehensive audit trail for all reversal operations';

-- ============================================================================
-- INITIAL DATA AND TESTING
-- ============================================================================

-- Create initial CBN report for current month (if needed)
INSERT INTO tenant.cbn_reversal_reports (
    tenant_id,
    reporting_period,
    report_type,
    status,
    executive_summary
)
SELECT
    t.id,
    DATE_TRUNC('month', NOW())::DATE,
    'monthly',
    'draft',
    'Initial Transaction Reversal System setup - automated report generation active'
FROM platform.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant.cbn_reversal_reports
    WHERE tenant_id = t.id
    AND reporting_period = DATE_TRUNC('month', NOW())::DATE
    AND report_type = 'monthly'
);

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Update tenant metadata
INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name, schema_version, updated_at)
VALUES (
    (SELECT id FROM platform.tenants LIMIT 1),
    'transaction_reversal_system',
    '2.0',
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id) DO UPDATE SET
    schema_version = '2.0',
    updated_at = CURRENT_TIMESTAMP;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Migration 010_transaction_reversal_system completed successfully!';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Added Tables:';
    RAISE NOTICE '  - failed_transactions (failure detection and tracking)';
    RAISE NOTICE '  - transaction_reversals (reversal operations)';
    RAISE NOTICE '  - reconciliation_logs (automated reconciliation)';
    RAISE NOTICE '  - dispute_cases (customer dispute management)';
    RAISE NOTICE '  - cbn_reversal_reports (regulatory compliance)';
    RAISE NOTICE '  - ai_failure_analysis (AI pattern detection)';
    RAISE NOTICE '  - reversal_audit_logs (comprehensive audit trail)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added Functions:';
    RAISE NOTICE '  - calculate_cbn_deadline() (T+1/T+2 compliance)';
    RAISE NOTICE '  - generate_reversal_reference() (unique references)';
    RAISE NOTICE '  - Auto-triggers for timestamps and references';
    RAISE NOTICE '';
    RAISE NOTICE 'Added Views:';
    RAISE NOTICE '  - active_failures (monitoring dashboard)';
    RAISE NOTICE '  - cbn_compliance_summary (compliance reporting)';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '  - transfers (added reversal tracking columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'Transaction Reversal System is ready for implementation!';
    RAISE NOTICE 'Next: Implement the service layer components.';
    RAISE NOTICE '==========================================================';
END $$;