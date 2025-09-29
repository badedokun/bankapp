-- Migration: 011_enhanced_transfers_payments.sql
-- Description: Enhanced Money Transfers and Payments System
-- Version: 1.0
-- Date: 2025-09-26
-- Author: OrokiiPay Development Team

-- This migration enhances the existing transfers infrastructure with:
-- 1. Internal transfers (same-bank)
-- 2. External transfers (NIBSS NIP)
-- 3. Bill payments system
-- 4. Scheduled payments
-- 5. International transfers (SWIFT)
-- 6. Enhanced transaction management

-- ============================================================================
-- ENHANCED TRANSFERS AND PAYMENTS SCHEMA
-- ============================================================================

-- Billers for bill payments
CREATE TABLE IF NOT EXISTS tenant.billers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Biller identification
    biller_code VARCHAR(20) UNIQUE NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'electricity', 'telecommunications', 'cable_tv', 'internet',
        'government', 'education', 'insurance', 'water', 'waste_management',
        'transportation', 'subscription_services', 'other'
    )),

    -- Biller configuration
    payment_methods JSONB NOT NULL DEFAULT '[]',
    fee_structure JSONB DEFAULT '{}',
    minimum_amount DECIMAL(15,2) DEFAULT 0.00,
    maximum_amount DECIMAL(15,2),

    -- Integration details
    api_endpoint VARCHAR(255),
    authentication_method VARCHAR(50),
    credentials_encrypted JSONB DEFAULT '{}',

    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    supports_validation BOOLEAN DEFAULT false,
    validation_endpoint VARCHAR(255),
    description TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_biller_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for billers
CREATE INDEX IF NOT EXISTS idx_billers_tenant_id ON tenant.billers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billers_code ON tenant.billers(biller_code);
CREATE INDEX IF NOT EXISTS idx_billers_category ON tenant.billers(category);
CREATE INDEX IF NOT EXISTS idx_billers_active ON tenant.billers(is_active);

-- ============================================================================

-- Bill Payments
CREATE TABLE IF NOT EXISTS tenant.bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Customer and account references
    customer_id UUID NOT NULL REFERENCES tenant.users(id),
    wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    biller_id UUID NOT NULL REFERENCES tenant.billers(id),

    -- Payment details
    customer_reference VARCHAR(100) NOT NULL, -- Customer's biller account number
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    fees DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount + fees) STORED,

    -- Payment references
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    biller_reference VARCHAR(100), -- Reference from biller system
    biller_transaction_id VARCHAR(255),

    -- Payment processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed',
        'cancelled', 'refunded', 'partial'
    )),

    -- Validation details
    customer_name VARCHAR(255), -- From biller validation
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_response JSONB DEFAULT '{}',

    -- Processing timeline
    initiated_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Error handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,

    -- Biller response data
    biller_response JSONB DEFAULT '{}',
    receipt_data JSONB DEFAULT '{}',

    -- Metadata
    payment_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_bill_payment_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for bill_payments
CREATE INDEX IF NOT EXISTS idx_bill_payments_tenant_id ON tenant.bill_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_customer ON tenant.bill_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_wallet ON tenant.bill_payments(wallet_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_biller ON tenant.bill_payments(biller_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_reference ON tenant.bill_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bill_payments_status ON tenant.bill_payments(status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_date_range ON tenant.bill_payments(created_at, completed_at);

-- ============================================================================

-- Scheduled Payments
CREATE TABLE IF NOT EXISTS tenant.scheduled_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Customer and payment details
    customer_id UUID NOT NULL REFERENCES tenant.users(id),
    source_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),

    -- Schedule configuration
    payment_name VARCHAR(100) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN (
        'internal_transfer', 'external_transfer', 'bill_payment', 'international_transfer'
    )),

    -- Payment template (stores the payment details)
    payment_template JSONB NOT NULL,

    -- Schedule configuration
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN (
        'one_time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    )),
    schedule_config JSONB NOT NULL, -- Day of week/month, interval, etc.

    -- Execution tracking
    next_execution_date TIMESTAMP NOT NULL,
    last_execution_date TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    max_executions INTEGER, -- NULL for unlimited

    -- Conditions and limits
    balance_conditions JSONB DEFAULT '{}', -- Minimum balance required, etc.
    amount_limits JSONB DEFAULT '{}',

    -- Status and control
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'cancelled', 'completed', 'expired'
    )),

    -- AI enhancement
    ai_optimization_enabled BOOLEAN DEFAULT false,
    optimal_timing_suggestions JSONB DEFAULT '{}',

    -- Error handling
    consecutive_failures INTEGER DEFAULT 0,
    max_failures INTEGER DEFAULT 3,
    last_failure_reason TEXT,

    -- Notifications
    notification_preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,

    -- Ensure tenant isolation
    CONSTRAINT check_scheduled_payment_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for scheduled_payments
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_tenant_id ON tenant.scheduled_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_customer ON tenant.scheduled_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_next_execution ON tenant.scheduled_payments(next_execution_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status ON tenant.scheduled_payments(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_type ON tenant.scheduled_payments(payment_type);

-- ============================================================================

-- Scheduled Payment Executions Log
CREATE TABLE IF NOT EXISTS tenant.scheduled_payment_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- References
    scheduled_payment_id UUID NOT NULL REFERENCES tenant.scheduled_payments(id),
    executed_payment_id UUID, -- Reference to actual payment/transfer

    -- Execution details
    scheduled_for TIMESTAMP NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    execution_status VARCHAR(20) NOT NULL CHECK (execution_status IN (
        'success', 'failed', 'skipped', 'cancelled'
    )),

    -- Results
    amount_executed DECIMAL(15,2),
    fees_charged DECIMAL(15,2),
    failure_reason TEXT,

    -- Conditions evaluation
    conditions_met JSONB DEFAULT '{}',
    balance_at_execution DECIMAL(15,2),

    -- Metadata
    execution_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_execution_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for scheduled_payment_executions
CREATE INDEX IF NOT EXISTS idx_executions_tenant_id ON tenant.scheduled_payment_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executions_scheduled_payment ON tenant.scheduled_payment_executions(scheduled_payment_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON tenant.scheduled_payment_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_executions_date ON tenant.scheduled_payment_executions(executed_at);

-- ============================================================================

-- Transaction Receipts
CREATE TABLE IF NOT EXISTS tenant.transaction_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Transaction reference
    transaction_id UUID NOT NULL, -- Can reference transfers, bill_payments, etc.
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'internal_transfer', 'external_transfer', 'bill_payment',
        'wallet_funding', 'international_transfer'
    )),

    -- Customer details
    customer_id UUID NOT NULL REFERENCES tenant.users(id),

    -- Receipt details
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    receipt_type VARCHAR(20) DEFAULT 'digital',

    -- Receipt content
    receipt_data JSONB NOT NULL,
    formatted_receipt TEXT,
    pdf_url TEXT,
    qr_code_data TEXT, -- For verification

    -- Delivery tracking
    delivery_methods JSONB DEFAULT '[]', -- ['email', 'sms', 'push', 'download']
    delivery_status JSONB DEFAULT '{}',
    delivery_attempts INTEGER DEFAULT 0,

    -- Verification
    verification_code VARCHAR(50),
    verification_url TEXT,
    is_verified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,

    -- Ensure tenant isolation
    CONSTRAINT check_receipt_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for transaction_receipts
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON tenant.transaction_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction ON tenant.transaction_receipts(transaction_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_receipts_customer ON tenant.transaction_receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON tenant.transaction_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON tenant.transaction_receipts(created_at);

-- ============================================================================

-- International Transfers (SWIFT)
CREATE TABLE IF NOT EXISTS tenant.international_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Customer and source account
    customer_id UUID NOT NULL REFERENCES tenant.users(id),
    source_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),

    -- Transfer details
    reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    source_currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    destination_currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(15,6),
    destination_amount DECIMAL(15,2),

    -- Fees breakdown
    transfer_fee DECIMAL(15,2) DEFAULT 0.00,
    exchange_fee DECIMAL(15,2) DEFAULT 0.00,
    correspondent_bank_fee DECIMAL(15,2) DEFAULT 0.00,
    total_fees DECIMAL(15,2) GENERATED ALWAYS AS (transfer_fee + exchange_fee + correspondent_bank_fee) STORED,

    -- Recipient details
    recipient_name VARCHAR(255) NOT NULL,
    recipient_address TEXT,
    recipient_country VARCHAR(2) NOT NULL, -- ISO country code
    recipient_bank_name VARCHAR(255) NOT NULL,
    recipient_bank_swift VARCHAR(11) NOT NULL,
    recipient_account_number VARCHAR(50) NOT NULL,
    recipient_iban VARCHAR(34),

    -- Correspondent bank details
    correspondent_bank_swift VARCHAR(11),
    correspondent_bank_name VARCHAR(255),

    -- Transfer purpose and compliance
    transfer_purpose VARCHAR(100) NOT NULL,
    purpose_code VARCHAR(10),
    regulatory_reference VARCHAR(100),
    compliance_documents JSONB DEFAULT '[]',

    -- SWIFT processing
    swift_message_type VARCHAR(10) DEFAULT 'MT103',
    swift_reference VARCHAR(35),
    swift_status VARCHAR(20) DEFAULT 'pending',
    swift_response JSONB DEFAULT '{}',

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'sent_to_swift', 'in_transit',
        'completed', 'failed', 'cancelled', 'returned'
    )),

    -- Timeline
    processing_started_at TIMESTAMP,
    sent_to_swift_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Error handling
    failure_reason TEXT,
    return_reason TEXT,

    -- Metadata
    transfer_metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure tenant isolation
    CONSTRAINT check_international_transfer_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Indexes for international_transfers
CREATE INDEX IF NOT EXISTS idx_international_transfers_tenant_id ON tenant.international_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_international_transfers_customer ON tenant.international_transfers(customer_id);
CREATE INDEX IF NOT EXISTS idx_international_transfers_reference ON tenant.international_transfers(reference);
CREATE INDEX IF NOT EXISTS idx_international_transfers_status ON tenant.international_transfers(status);
CREATE INDEX IF NOT EXISTS idx_international_transfers_swift_ref ON tenant.international_transfers(swift_reference);
CREATE INDEX IF NOT EXISTS idx_international_transfers_country ON tenant.international_transfers(recipient_country);

-- ============================================================================
-- ENHANCED EXISTING TABLES
-- ============================================================================

-- Enhance existing transfers table with additional columns
ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS transfer_type VARCHAR(20)
    DEFAULT 'external' CHECK (transfer_type IN ('internal', 'external'));

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS authorization_level VARCHAR(10)
    DEFAULT 'single' CHECK (authorization_level IN ('single', 'dual'));

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS authorized_by UUID;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS authorization_timestamp TIMESTAMP;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS cut_off_time TIME;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP;

-- Add receipt reference
ALTER TABLE tenant.transfers ADD COLUMN IF NOT EXISTS receipt_id UUID
    REFERENCES tenant.transaction_receipts(id);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transfers_type ON tenant.transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_transfers_authorization ON tenant.transfers(authorization_level);
CREATE INDEX IF NOT EXISTS idx_transfers_authorized_by ON tenant.transfers(authorized_by);

-- ============================================================================

-- Enhance wallets table for better transfer support
ALTER TABLE tenant.wallets ADD COLUMN IF NOT EXISTS daily_transfer_limit DECIMAL(15,2) DEFAULT 100000.00;

ALTER TABLE tenant.wallets ADD COLUMN IF NOT EXISTS monthly_transfer_limit DECIMAL(15,2) DEFAULT 500000.00;

ALTER TABLE tenant.wallets ADD COLUMN IF NOT EXISTS daily_transfer_count INTEGER DEFAULT 0;

ALTER TABLE tenant.wallets ADD COLUMN IF NOT EXISTS daily_transfer_amount DECIMAL(15,2) DEFAULT 0.00;

ALTER TABLE tenant.wallets ADD COLUMN IF NOT EXISTS last_transfer_reset_date DATE DEFAULT CURRENT_DATE;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to generate unique payment references
CREATE OR REPLACE FUNCTION generate_payment_reference(prefix VARCHAR(10))
RETURNS VARCHAR(100) AS $$
DECLARE
    reference VARCHAR(100);
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate reference: PREFIX-YYYYMMDD-HHMMSS-XXXXXX
        reference := prefix || '-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' ||
                    LPAD(floor(random() * 1000000)::text, 6, '0');

        -- Check uniqueness across all payment tables
        SELECT NOT EXISTS(
            SELECT 1 FROM tenant.bill_payments WHERE payment_reference = reference
            UNION ALL
            SELECT 1 FROM tenant.transfers WHERE reference = reference
            UNION ALL
            SELECT 1 FROM tenant.international_transfers WHERE reference = reference
        ) INTO is_unique;
    END LOOP;

    RETURN reference;
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(100) AS $$
DECLARE
    receipt_num VARCHAR(100);
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate receipt: RCP-YYYYMMDD-HHMMSS-XXXXXX
        receipt_num := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' ||
                      LPAD(floor(random() * 1000000)::text, 6, '0');

        -- Check uniqueness
        SELECT NOT EXISTS(
            SELECT 1 FROM tenant.transaction_receipts WHERE receipt_number = receipt_num
        ) INTO is_unique;
    END LOOP;

    RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate payment references trigger
CREATE OR REPLACE FUNCTION auto_generate_payment_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_reference IS NULL THEN
        NEW.payment_reference := generate_payment_reference('PAY');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply payment reference trigger to bill_payments
DROP TRIGGER IF EXISTS auto_payment_reference ON tenant.bill_payments;
CREATE TRIGGER auto_payment_reference
    BEFORE INSERT ON tenant.bill_payments
    FOR EACH ROW EXECUTE FUNCTION auto_generate_payment_reference();

-- Auto-generate receipt numbers trigger
CREATE OR REPLACE FUNCTION auto_generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply receipt number trigger
DROP TRIGGER IF EXISTS auto_receipt_number ON tenant.transaction_receipts;
CREATE TRIGGER auto_receipt_number
    BEFORE INSERT ON tenant.transaction_receipts
    FOR EACH ROW EXECUTE FUNCTION auto_generate_receipt_number();

-- Function to update scheduled payment next execution date
CREATE OR REPLACE FUNCTION update_next_execution_date()
RETURNS TRIGGER AS $$
DECLARE
    next_date TIMESTAMP;
    config JSONB;
BEGIN
    config := NEW.schedule_config;

    CASE NEW.schedule_type
        WHEN 'daily' THEN
            next_date := NEW.last_execution_date + INTERVAL '1 day';
        WHEN 'weekly' THEN
            next_date := NEW.last_execution_date + INTERVAL '1 week';
        WHEN 'monthly' THEN
            next_date := NEW.last_execution_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            next_date := NEW.last_execution_date + INTERVAL '3 months';
        WHEN 'yearly' THEN
            next_date := NEW.last_execution_date + INTERVAL '1 year';
        ELSE
            next_date := NULL; -- For one_time payments
    END CASE;

    NEW.next_execution_date := next_date;
    NEW.execution_count := NEW.execution_count + 1;

    -- Check if max executions reached
    IF NEW.max_executions IS NOT NULL AND NEW.execution_count >= NEW.max_executions THEN
        NEW.status := 'completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply next execution trigger
DROP TRIGGER IF EXISTS update_execution_schedule ON tenant.scheduled_payments;
CREATE TRIGGER update_execution_schedule
    BEFORE UPDATE ON tenant.scheduled_payments
    FOR EACH ROW
    WHEN (OLD.last_execution_date IS DISTINCT FROM NEW.last_execution_date)
    EXECUTE FUNCTION update_next_execution_date();

-- Function to reset daily transfer limits
CREATE OR REPLACE FUNCTION reset_daily_transfer_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset daily counters if date has changed
    IF NEW.last_transfer_reset_date < CURRENT_DATE THEN
        NEW.daily_transfer_count := 0;
        NEW.daily_transfer_amount := 0.00;
        NEW.last_transfer_reset_date := CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply daily limit reset trigger
DROP TRIGGER IF EXISTS reset_daily_limits ON tenant.wallets;
CREATE TRIGGER reset_daily_limits
    BEFORE UPDATE ON tenant.wallets
    FOR EACH ROW EXECUTE FUNCTION reset_daily_transfer_limits();

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_payment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to new tables
DROP TRIGGER IF EXISTS update_billers_timestamp ON tenant.billers;
CREATE TRIGGER update_billers_timestamp
    BEFORE UPDATE ON tenant.billers
    FOR EACH ROW EXECUTE FUNCTION update_payment_timestamps();

DROP TRIGGER IF EXISTS update_bill_payments_timestamp ON tenant.bill_payments;
CREATE TRIGGER update_bill_payments_timestamp
    BEFORE UPDATE ON tenant.bill_payments
    FOR EACH ROW EXECUTE FUNCTION update_payment_timestamps();

DROP TRIGGER IF EXISTS update_scheduled_payments_timestamp ON tenant.scheduled_payments;
CREATE TRIGGER update_scheduled_payments_timestamp
    BEFORE UPDATE ON tenant.scheduled_payments
    FOR EACH ROW EXECUTE FUNCTION update_payment_timestamps();

DROP TRIGGER IF EXISTS update_international_transfers_timestamp ON tenant.international_transfers;
CREATE TRIGGER update_international_transfers_timestamp
    BEFORE UPDATE ON tenant.international_transfers
    FOR EACH ROW EXECUTE FUNCTION update_payment_timestamps();

-- ============================================================================
-- VIEWS FOR REPORTING AND MONITORING
-- ============================================================================

-- All transactions unified view
CREATE OR REPLACE VIEW tenant.all_transactions AS
SELECT
    'internal_transfer' as transaction_type,
    it.id,
    it.user_id as customer_id,
    it.amount,
    0 as fees,
    it.amount as total_amount,
    it.reference,
    it.description,
    it.status,
    it.created_at,
    NULL as recipient_name,
    NULL as biller_name
FROM tenant.internal_transfers it

UNION ALL

SELECT
    'external_transfer' as transaction_type,
    t.id,
    t.sender_id as customer_id,
    t.amount,
    t.fee as fees,
    t.amount + t.fee as total_amount,
    t.reference,
    t.description,
    t.status,
    t.created_at,
    t.recipient_name,
    NULL as biller_name
FROM tenant.transfers t

UNION ALL

SELECT
    'bill_payment' as transaction_type,
    bp.id,
    bp.customer_id,
    bp.amount,
    bp.fees,
    bp.total_amount,
    bp.payment_reference as reference,
    'Bill Payment' as description,
    bp.status,
    bp.created_at,
    bp.customer_name as recipient_name,
    b.biller_name
FROM tenant.bill_payments bp
JOIN tenant.billers b ON bp.biller_id = b.id

UNION ALL

SELECT
    'international_transfer' as transaction_type,
    it.id,
    it.customer_id,
    it.amount,
    it.total_fees as fees,
    it.amount + it.total_fees as total_amount,
    it.reference,
    it.transfer_purpose as description,
    it.status,
    it.created_at,
    it.recipient_name,
    NULL as biller_name
FROM tenant.international_transfers it;

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tenant.billers IS 'Bill payment service providers and their configurations';
COMMENT ON TABLE tenant.bill_payments IS 'Bill payment transactions and processing records';
COMMENT ON TABLE tenant.scheduled_payments IS 'Automated scheduled payment configurations';
COMMENT ON TABLE tenant.scheduled_payment_executions IS 'Log of scheduled payment execution attempts';
COMMENT ON TABLE tenant.transaction_receipts IS 'Digital receipts for all transaction types';
COMMENT ON TABLE tenant.international_transfers IS 'International money transfers via SWIFT';

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Add common Nigerian billers
INSERT INTO tenant.billers (
    tenant_id, biller_code, biller_name, category, payment_methods, is_active
) VALUES
-- Get tenant ID for FMFB
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'EKEDC', 'Eko Electricity Distribution Company', 'electricity', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'IKEDC', 'Ikeja Electric Distribution Company', 'electricity', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'MTN', 'MTN Nigeria', 'telecommunications', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'AIRTEL', 'Airtel Nigeria', 'telecommunications', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'GLO', 'Globacom Nigeria', 'telecommunications', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'DSTV', 'DStv Nigeria', 'cable_tv', '["online", "api"]', true),
((SELECT id FROM platform.tenants WHERE code = 'fmfb' LIMIT 1), 'GOTV', 'GOtv Nigeria', 'cable_tv', '["online", "api"]', true);

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Update tenant metadata
INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name, schema_version, updated_at)
VALUES (
    (SELECT id FROM platform.tenants LIMIT 1),
    'enhanced_transfers_payments',
    '2.1',
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id) DO UPDATE SET
    schema_version = '2.1',
    updated_at = CURRENT_TIMESTAMP;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Migration 011_enhanced_transfers_payments completed successfully!';
    RAISE NOTICE '==========================================================';
    RAISE NOTICE 'Added Tables:';
    RAISE NOTICE '  - billers (bill payment providers)';
    RAISE NOTICE '  - bill_payments (bill payment transactions)';
    RAISE NOTICE '  - scheduled_payments (automated payment scheduling)';
    RAISE NOTICE '  - scheduled_payment_executions (execution logs)';
    RAISE NOTICE '  - transaction_receipts (digital receipts)';
    RAISE NOTICE '  - international_transfers (SWIFT transfers)';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '  - transfers (added transfer_type, authorization, retry logic)';
    RAISE NOTICE '  - wallets (added daily/monthly limits and tracking)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added Functions:';
    RAISE NOTICE '  - generate_payment_reference() (unique payment references)';
    RAISE NOTICE '  - generate_receipt_number() (unique receipt numbers)';
    RAISE NOTICE '  - Auto-triggers for schedules and limits';
    RAISE NOTICE '';
    RAISE NOTICE 'Added Views:';
    RAISE NOTICE '  - all_transactions (unified transaction view)';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Data:';
    RAISE NOTICE '  - Nigerian billers (EKEDC, MTN, DStv, etc.)';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Money Transfers & Payments System is ready!';
    RAISE NOTICE 'Next: Implement the service layer components.';
    RAISE NOTICE '==========================================================';
END $$;