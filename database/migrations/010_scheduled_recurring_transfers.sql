-- Migration: Scheduled and Recurring Transfers
-- Creates tables for handling scheduled and recurring transfers

-- Scheduled Transfers Table
CREATE TABLE IF NOT EXISTS tenant.scheduled_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    from_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    to_wallet_number VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NGN',
    reference VARCHAR(50) UNIQUE NOT NULL,
    narration TEXT,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    transfer_id UUID,
    error_message TEXT,
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring Transfers Table
CREATE TABLE IF NOT EXISTS tenant.recurring_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    from_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    to_wallet_number VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'NGN',
    reference VARCHAR(50) NOT NULL,
    narration TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    next_execution_date TIMESTAMP NOT NULL,
    last_execution_date TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_transfers_status_date
    ON tenant.scheduled_transfers(status, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_scheduled_transfers_user
    ON tenant.scheduled_transfers(user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_transfers_wallet
    ON tenant.scheduled_transfers(from_wallet_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transfers_status_date
    ON tenant.recurring_transfers(status, next_execution_date);

CREATE INDEX IF NOT EXISTS idx_recurring_transfers_user
    ON tenant.recurring_transfers(user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_transfers_wallet
    ON tenant.recurring_transfers(from_wallet_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_scheduled_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_transfers_updated_at
    BEFORE UPDATE ON tenant.scheduled_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_transfers_updated_at();

CREATE TRIGGER update_recurring_transfers_updated_at
    BEFORE UPDATE ON tenant.recurring_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_transfers_updated_at();

COMMENT ON TABLE tenant.scheduled_transfers IS 'Stores one-time scheduled transfers';
COMMENT ON TABLE tenant.recurring_transfers IS 'Stores recurring/periodic transfers';
