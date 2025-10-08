-- Add missing columns to tenant.transfers table to match code expectations
-- The table was created with a simplified schema but the code expects the full schema

-- Add missing columns
ALTER TABLE tenant.transfers
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS recipient_id UUID,
ADD COLUMN IF NOT EXISTS reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS source_account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS source_bank_code VARCHAR(10), -- VARCHAR(10) to support variable-length codes
ADD COLUMN IF NOT EXISTS recipient_user_id UUID,
ADD COLUMN IF NOT EXISTS nibss_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nibss_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nibss_response_message TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Populate tenant_id from existing data (get from sender)
UPDATE tenant.transfers t
SET tenant_id = u.tenant_id
FROM tenant.users u
WHERE t.sender_id = u.id AND t.tenant_id IS NULL;

-- Make reference unique if not already
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_reference ON tenant.transfers(reference);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transfers_tenant_id ON tenant.transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_id ON tenant.transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_user_id ON tenant.transfers(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_nibss_transaction_id ON tenant.transfers(nibss_transaction_id);
