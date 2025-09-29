-- Transaction Receipts and Records Management Schema
-- This migration creates tables for managing transaction receipts and comprehensive transaction records

-- Create transaction_receipts table
CREATE TABLE IF NOT EXISTS transaction_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(20) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL,
    sender_details JSONB NOT NULL,
    recipient_details JSONB NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    description TEXT,
    reference VARCHAR(50) NOT NULL,
    session_id VARCHAR(100),
    narration TEXT,
    receipt_file_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transaction_records table for comprehensive transaction tracking
CREATE TABLE IF NOT EXISTS transaction_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_category VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL,
    reference VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    recipient_details JSONB,
    metadata JSONB,
    tags TEXT[],
    location_data JSONB,
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create receipt_templates table for customizable receipt templates
CREATE TABLE IF NOT EXISTS receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    template_variables JSONB,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transaction_attachments table for storing related documents
CREATE TABLE IF NOT EXISTS transaction_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    attachment_type VARCHAR(50) NOT NULL, -- 'receipt', 'proof', 'invoice', 'document'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transaction_audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS transaction_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'receipt_generated'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL,
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for transaction_receipts
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_tenant_id ON transaction_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction_id ON transaction_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_receipt_number ON transaction_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_type ON transaction_receipts(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_date ON transaction_receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_reference ON transaction_receipts(reference);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_status ON transaction_receipts(status);

-- Create indexes for transaction_records
CREATE INDEX IF NOT EXISTS idx_transaction_records_tenant_id ON transaction_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_user_id ON transaction_records(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_account_id ON transaction_records(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_type ON transaction_records(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_records_category ON transaction_records(transaction_category);
CREATE INDEX IF NOT EXISTS idx_transaction_records_status ON transaction_records(status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_reference ON transaction_records(reference);
CREATE INDEX IF NOT EXISTS idx_transaction_records_created_at ON transaction_records(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_records_amount ON transaction_records(amount);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_transaction_records_recipient_details ON transaction_records USING GIN(recipient_details);
CREATE INDEX IF NOT EXISTS idx_transaction_records_metadata ON transaction_records USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_sender_details ON transaction_receipts USING GIN(sender_details);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_recipient_details ON transaction_receipts USING GIN(recipient_details);

-- Create indexes for receipt_templates
CREATE INDEX IF NOT EXISTS idx_receipt_templates_tenant_id ON receipt_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_type ON receipt_templates(transaction_type);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_active ON receipt_templates(is_active);

-- Create indexes for transaction_attachments
CREATE INDEX IF NOT EXISTS idx_transaction_attachments_tenant_id ON transaction_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_attachments_transaction_id ON transaction_attachments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_attachments_type ON transaction_attachments(attachment_type);

-- Create indexes for transaction_audit_log
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_tenant_id ON transaction_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_transaction_id ON transaction_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_action ON transaction_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_log_created_at ON transaction_audit_log(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transaction_records_account_date ON transaction_records(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_records_user_date ON transaction_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_records_type_status ON transaction_records(transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_tenant_date ON transaction_receipts(tenant_id, created_at DESC);

-- Add constraints
ALTER TABLE transaction_receipts
ADD CONSTRAINT chk_transaction_receipts_amount_positive CHECK (amount > 0),
ADD CONSTRAINT chk_transaction_receipts_fees_non_negative CHECK (fees >= 0),
ADD CONSTRAINT chk_transaction_receipts_total_amount_positive CHECK (total_amount > 0);

ALTER TABLE transaction_records
ADD CONSTRAINT chk_transaction_records_amount_positive CHECK (amount > 0),
ADD CONSTRAINT chk_transaction_records_fees_non_negative CHECK (fees >= 0),
ADD CONSTRAINT chk_transaction_records_total_amount_positive CHECK (total_amount > 0);

ALTER TABLE transaction_attachments
ADD CONSTRAINT chk_transaction_attachments_file_size_positive CHECK (file_size > 0);

-- Add updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transaction_receipts_updated_at
    BEFORE UPDATE ON transaction_receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_records_updated_at
    BEFORE UPDATE ON transaction_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipt_templates_updated_at
    BEFORE UPDATE ON receipt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_attachments_updated_at
    BEFORE UPDATE ON transaction_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW v_transaction_summary AS
SELECT
    tr.tenant_id,
    tr.account_id,
    tr.transaction_type,
    tr.status,
    DATE(tr.created_at) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(tr.amount) as total_amount,
    SUM(tr.fees) as total_fees,
    SUM(tr.total_amount) as grand_total,
    AVG(tr.amount) as average_amount
FROM transaction_records tr
GROUP BY
    tr.tenant_id,
    tr.account_id,
    tr.transaction_type,
    tr.status,
    DATE(tr.created_at);

-- Create view for recent transactions with account details
-- Note: This view will be created after the tenant accounts table is accessible
-- For now, creating a simplified view without JOIN
CREATE OR REPLACE VIEW v_recent_transactions AS
SELECT
    tr.id,
    tr.tenant_id,
    tr.user_id,
    tr.account_id,
    tr.transaction_type,
    tr.transaction_category,
    tr.amount,
    tr.fees,
    tr.total_amount,
    tr.currency,
    tr.status,
    tr.reference,
    tr.description,
    tr.recipient_details,
    tr.created_at,
    CASE
        WHEN tr.created_at >= NOW() - INTERVAL '1 hour' THEN 'very_recent'
        WHEN tr.created_at >= NOW() - INTERVAL '24 hours' THEN 'recent'
        WHEN tr.created_at >= NOW() - INTERVAL '7 days' THEN 'this_week'
        WHEN tr.created_at >= NOW() - INTERVAL '30 days' THEN 'this_month'
        ELSE 'older'
    END as recency
FROM transaction_records tr
ORDER BY tr.created_at DESC;

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_receipts TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_records TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_templates TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_attachments TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_audit_log TO app_user;

-- Add comments for documentation
COMMENT ON TABLE transaction_receipts IS 'Stores generated receipts for all transaction types';
COMMENT ON TABLE transaction_records IS 'Comprehensive transaction tracking table for all transfer types';
COMMENT ON TABLE receipt_templates IS 'Customizable receipt templates for different transaction types';
COMMENT ON TABLE transaction_attachments IS 'File attachments related to transactions';
COMMENT ON TABLE transaction_audit_log IS 'Audit trail for transaction changes and events';

COMMENT ON COLUMN transaction_receipts.receipt_number IS 'Unique receipt number in format RCP{YYYYMMDD}{SEQUENCE}';
COMMENT ON COLUMN transaction_records.recipient_details IS 'JSON object containing recipient information';
COMMENT ON COLUMN transaction_records.metadata IS 'Additional transaction metadata and context';
COMMENT ON COLUMN transaction_records.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN receipt_templates.template_variables IS 'Available variables for the template';