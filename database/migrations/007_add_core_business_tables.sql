-- Migration: 007_add_core_business_tables.sql
-- Description: Add core business tables for money transfer operations
-- Version: 1.0
-- Date: 2025-09-09
-- Author: OrokiiPay Development Team

-- This migration adds all the missing tables required by our NIBSS integration
-- and core money transfer functionality

-- Add missing columns to existing users table
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS account_number VARCHAR(20) UNIQUE;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS transaction_pin_hash VARCHAR(255);
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS daily_limit DECIMAL(15,2) DEFAULT 100000.00;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS monthly_limit DECIMAL(15,2) DEFAULT 500000.00;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS profile_address JSONB;
ALTER TABLE tenant.users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- Add bank_code column to tenants table (in platform schema)
ALTER TABLE platform.tenants ADD COLUMN IF NOT EXISTS bank_code VARCHAR(3) UNIQUE;

-- Wallets table for user account management
CREATE TABLE IF NOT EXISTS tenant.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    wallet_type VARCHAR(50) NOT NULL CHECK (wallet_type IN ('primary', 'savings', 'current', 'business', 'escrow')),
    wallet_name VARCHAR(255),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen', 'closed')),
    wallet_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure tenant isolation
    CONSTRAINT check_wallet_tenant_id CHECK (tenant_id IS NOT NULL),
    
    -- Ensure only one primary wallet per user
    CONSTRAINT unique_primary_wallet EXCLUDE (user_id WITH =) WHERE (is_primary = true)
);

-- Create indexes for wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON tenant.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tenant_id ON tenant.wallets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON tenant.wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON tenant.wallets(status);
CREATE INDEX IF NOT EXISTS idx_wallets_primary ON tenant.wallets(user_id, is_primary) WHERE is_primary = true;

-- Recipients table for saved transfer recipients
CREATE TABLE IF NOT EXISTS tenant.recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(3) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure tenant isolation
    CONSTRAINT check_recipient_tenant_id CHECK (tenant_id IS NOT NULL),
    
    -- Prevent duplicate recipients for same user
    UNIQUE(user_id, account_number, bank_code)
);

-- Create indexes for recipients
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON tenant.recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_account_number ON tenant.recipients(account_number);
CREATE INDEX IF NOT EXISTS idx_recipients_bank_code ON tenant.recipients(bank_code);

-- Transfers table for all money transfer operations
CREATE TABLE IF NOT EXISTS tenant.transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES tenant.users(id),
    tenant_id UUID NOT NULL,
    recipient_id UUID REFERENCES tenant.recipients(id),
    
    -- Transfer details
    reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    
    -- Source account details
    source_account_number VARCHAR(20) NOT NULL,
    source_bank_code VARCHAR(3) NOT NULL,
    
    -- Recipient account details
    recipient_account_number VARCHAR(20) NOT NULL,
    recipient_bank_code VARCHAR(3) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    
    -- NIBSS integration fields
    nibss_transaction_id VARCHAR(255),
    nibss_session_id VARCHAR(255),
    nibss_response_message TEXT,
    
    -- Transfer status and processing
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'reversed', 'cancelled')),
    failure_reason TEXT,
    processed_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure tenant isolation
    CONSTRAINT check_transfer_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Create indexes for transfers
CREATE INDEX IF NOT EXISTS idx_transfers_sender_id ON tenant.transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_id ON tenant.transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON tenant.transfers(reference);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON tenant.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON tenant.transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_nibss_transaction_id ON tenant.transfers(nibss_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date_range ON tenant.transfers(sender_id, created_at);

-- Transaction logs for detailed transfer tracking
CREATE TABLE IF NOT EXISTS tenant.transaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES tenant.transfers(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transaction logs
CREATE INDEX IF NOT EXISTS idx_transaction_logs_transfer_id ON tenant.transaction_logs(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_event_type ON tenant.transaction_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON tenant.transaction_logs(created_at);

-- KYC documents table for user verification
CREATE TABLE IF NOT EXISTS tenant.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('nin', 'passport', 'drivers_license', 'voters_card', 'bvn')),
    document_number VARCHAR(50) NOT NULL,
    document_image_url TEXT,
    selfie_image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'expired')),
    verification_response JSONB,
    verification_score DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for KYC documents
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON tenant.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON tenant.kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_type ON tenant.kyc_documents(document_type);

-- User activity logs for security and compliance
CREATE TABLE IF NOT EXISTS tenant.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON tenant.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON tenant.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON tenant.user_activity_logs(created_at);

-- Referrals table for referral program
CREATE TABLE IF NOT EXISTS tenant.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES tenant.users(id),
    referee_id UUID NOT NULL REFERENCES tenant.users(id),
    referral_code VARCHAR(50) NOT NULL,
    bonus_amount DECIMAL(15,2) DEFAULT 100.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent self-referral and duplicate referrals
    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id),
    UNIQUE(referrer_id, referee_id)
);

-- Create indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON tenant.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON tenant.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON tenant.referrals(referral_code);

-- Internal transfers table for inter-wallet transfers
CREATE TABLE IF NOT EXISTS tenant.internal_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    from_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    to_wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent transfers between same wallet
    CONSTRAINT different_wallets CHECK (from_wallet_id != to_wallet_id)
);

-- Create indexes for internal transfers
CREATE INDEX IF NOT EXISTS idx_internal_transfers_user_id ON tenant.internal_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_from_wallet ON tenant.internal_transfers(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_to_wallet ON tenant.internal_transfers(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_internal_transfers_reference ON tenant.internal_transfers(reference);

-- Wallet fundings table for wallet funding operations
CREATE TABLE IF NOT EXISTS tenant.wallet_fundings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),
    reference VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    funding_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for wallet fundings
CREATE INDEX IF NOT EXISTS idx_wallet_fundings_user_id ON tenant.wallet_fundings(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_fundings_wallet_id ON tenant.wallet_fundings(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_fundings_reference ON tenant.wallet_fundings(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_fundings_status ON tenant.wallet_fundings(status);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_wallets_updated_at ON tenant.wallets;
CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON tenant.wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipients_updated_at ON tenant.recipients;
CREATE TRIGGER update_recipients_updated_at 
    BEFORE UPDATE ON tenant.recipients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfers_updated_at ON tenant.transfers;
CREATE TRIGGER update_transfers_updated_at 
    BEFORE UPDATE ON tenant.transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing tenant data with bank codes (sample data for testing)
UPDATE platform.tenants SET bank_code = '090' WHERE name = 'fmfb' AND bank_code IS NULL;
UPDATE platform.tenants SET bank_code = '100' WHERE name = 'orokiipay' AND bank_code IS NULL;
UPDATE platform.tenants SET bank_code = '101' WHERE name = 'demo_bank' AND bank_code IS NULL;

-- Add constraints for data integrity
ALTER TABLE tenant.users ADD CONSTRAINT IF NOT EXISTS check_account_number_length 
    CHECK (account_number IS NULL OR length(account_number) = 10);

-- Create a function to generate unique account numbers
CREATE OR REPLACE FUNCTION generate_account_number(tenant_bank_code VARCHAR(3))
RETURNS VARCHAR(10) AS $$
DECLARE
    account_num VARCHAR(10);
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate 7-digit random suffix
        account_num := tenant_bank_code || LPAD(floor(random() * 10000000)::text, 7, '0');
        
        -- Check if account number is unique
        SELECT NOT EXISTS(SELECT 1 FROM tenant.users WHERE account_number = account_num) INTO is_unique;
    END LOOP;
    
    RETURN account_num;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically assign account numbers on user creation
CREATE OR REPLACE FUNCTION assign_account_number()
RETURNS TRIGGER AS $$
DECLARE
    tenant_bank_code VARCHAR(3);
BEGIN
    -- Get bank code for the tenant
    SELECT bank_code INTO tenant_bank_code 
    FROM platform.tenants 
    WHERE id = NEW.tenant_id;
    
    -- Generate account number if not provided
    IF NEW.account_number IS NULL AND tenant_bank_code IS NOT NULL THEN
        NEW.account_number := generate_account_number(tenant_bank_code);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS auto_assign_account_number ON tenant.users;
CREATE TRIGGER auto_assign_account_number
    BEFORE INSERT ON tenant.users
    FOR EACH ROW EXECUTE FUNCTION assign_account_number();

-- Create a function to automatically create primary wallet on user creation
CREATE OR REPLACE FUNCTION create_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Create primary wallet for new user
    INSERT INTO tenant.wallets (
        user_id, tenant_id, wallet_type, wallet_name, currency, is_primary
    ) VALUES (
        NEW.id, NEW.tenant_id, 'primary', 'Primary Account', 'NGN', true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS auto_create_primary_wallet ON tenant.users;
CREATE TRIGGER auto_create_primary_wallet
    AFTER INSERT ON tenant.users
    FOR EACH ROW EXECUTE FUNCTION create_primary_wallet();

-- Add comments for documentation
COMMENT ON TABLE tenant.wallets IS 'User wallet accounts for storing balances';
COMMENT ON TABLE tenant.transfers IS 'All money transfer transactions via NIBSS';
COMMENT ON TABLE tenant.recipients IS 'Saved recipient accounts for transfers';
COMMENT ON TABLE tenant.kyc_documents IS 'KYC verification documents and status';
COMMENT ON TABLE tenant.user_activity_logs IS 'User activity tracking for security';
COMMENT ON TABLE tenant.transaction_logs IS 'Detailed transfer transaction logs';
COMMENT ON TABLE tenant.referrals IS 'User referral program tracking';
COMMENT ON TABLE tenant.internal_transfers IS 'Inter-wallet transfers within user accounts';
COMMENT ON TABLE tenant.wallet_fundings IS 'Wallet funding operations';

-- Migration completion
INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name, schema_version, updated_at)
VALUES (
    (SELECT id FROM platform.tenants LIMIT 1), 
    'migration_007', 
    '1.1', 
    CURRENT_TIMESTAMP
) ON CONFLICT (tenant_id) DO UPDATE SET 
    schema_version = '1.1', 
    updated_at = CURRENT_TIMESTAMP;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 007_add_core_business_tables completed successfully';
    RAISE NOTICE 'Added tables: wallets, transfers, recipients, kyc_documents, user_activity_logs, transaction_logs, referrals, internal_transfers, wallet_fundings';
    RAISE NOTICE 'Added triggers: auto account number generation, primary wallet creation, updated_at triggers';
END $$;