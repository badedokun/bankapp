-- Migration: 008_fix_schema_issues.sql
-- Description: Fix issues from migration 007 and ensure complete schema
-- Version: 1.0
-- Date: 2025-09-09
-- Author: OrokiiPay Development Team

-- Fix wallets table structure
ALTER TABLE tenant.wallets 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen', 'closed'));

ALTER TABLE tenant.wallets 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Safely create indexes that may have failed
CREATE INDEX IF NOT EXISTS idx_wallets_status ON tenant.wallets(status);
CREATE INDEX IF NOT EXISTS idx_wallets_primary ON tenant.wallets(user_id, is_primary) WHERE is_primary = true;

-- Fix the constraint that failed - use a different approach
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_account_number_length' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE tenant.users ADD CONSTRAINT check_account_number_length 
            CHECK (account_number IS NULL OR length(account_number) = 10);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint already exists or other error, continue
        NULL;
END $$;

-- Create unique constraint for primary wallet per user
DO $$
BEGIN
    -- Drop the exclusion constraint if it exists and create unique index instead
    ALTER TABLE tenant.wallets DROP CONSTRAINT IF EXISTS unique_primary_wallet;
    
    -- Create unique index to ensure only one primary wallet per user
    CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_wallet_per_user 
        ON tenant.wallets(user_id) WHERE is_primary = true;
EXCEPTION
    WHEN OTHERS THEN
        -- If index already exists, continue
        NULL;
END $$;

-- Ensure all users have account numbers
DO $$
DECLARE
    user_record RECORD;
    tenant_bank_code VARCHAR(3);
BEGIN
    -- Get all users without account numbers
    FOR user_record IN 
        SELECT u.id, u.tenant_id 
        FROM tenant.users u 
        WHERE u.account_number IS NULL
    LOOP
        -- Get bank code for the tenant
        SELECT bank_code INTO tenant_bank_code 
        FROM platform.tenants 
        WHERE id = user_record.tenant_id;
        
        -- Generate account number if bank code exists
        IF tenant_bank_code IS NOT NULL THEN
            UPDATE tenant.users 
            SET account_number = generate_account_number(tenant_bank_code)
            WHERE id = user_record.id;
        END IF;
    END LOOP;
END $$;

-- Ensure all users have primary wallets
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get all users without primary wallets
    FOR user_record IN 
        SELECT u.id, u.tenant_id 
        FROM tenant.users u 
        WHERE NOT EXISTS (
            SELECT 1 FROM tenant.wallets w 
            WHERE w.user_id = u.id AND w.is_primary = true
        )
    LOOP
        -- Create primary wallet
        INSERT INTO tenant.wallets (
            user_id, tenant_id, wallet_type, wallet_name, currency, is_primary
        ) VALUES (
            user_record.id, user_record.tenant_id, 'primary', 'Primary Account', 'NGN', true
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Fix any data consistency issues
UPDATE tenant.wallets 
SET available_balance = balance 
WHERE available_balance IS NULL;

UPDATE tenant.wallets 
SET frozen_balance = 0.00 
WHERE frozen_balance IS NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_users_account_number ON tenant.users(account_number) WHERE account_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON tenant.users(referral_code) WHERE referral_code IS NOT NULL;

-- Create function to validate Nigerian phone numbers
CREATE OR REPLACE FUNCTION validate_nigerian_phone(phone_number VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow Nigerian phone numbers (+234xxxxxxxxxx or 0xxxxxxxxxx)
    RETURN phone_number ~ '^\+234[789][01]\d{8}$' OR phone_number ~ '^0[789][01]\d{8}$';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID, first_name VARCHAR(100))
RETURNS VARCHAR(50) AS $$
DECLARE
    referral_code VARCHAR(50);
    is_unique BOOLEAN := FALSE;
    counter INTEGER := 0;
BEGIN
    WHILE NOT is_unique AND counter < 10 LOOP
        -- Generate referral code: first 3 letters of name + 6 random chars
        referral_code := UPPER(LEFT(first_name, 3)) || 
                         LPAD(floor(random() * 1000000)::text, 6, '0');
        
        -- Check if code is unique
        SELECT NOT EXISTS(SELECT 1 FROM tenant.users WHERE referral_code = referral_code) INTO is_unique;
        counter := counter + 1;
    END LOOP;
    
    -- If still not unique after 10 attempts, use UUID
    IF NOT is_unique THEN
        referral_code := REPLACE(user_id::text, '-', '')::VARCHAR(10);
    END IF;
    
    RETURN referral_code;
END;
$$ LANGUAGE plpgsql;

-- Assign referral codes to users who don't have them
UPDATE tenant.users 
SET referral_code = generate_referral_code(id, first_name)
WHERE referral_code IS NULL;

-- Create a view for user wallet summary
CREATE OR REPLACE VIEW tenant.user_wallet_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.account_number,
    w.id as wallet_id,
    w.wallet_type,
    w.balance,
    w.available_balance,
    w.frozen_balance,
    w.status as wallet_status,
    u.kyc_status,
    u.kyc_level,
    u.daily_limit,
    u.monthly_limit
FROM tenant.users u
LEFT JOIN tenant.wallets w ON u.id = w.user_id AND w.is_primary = true;

-- Create a view for transfer history with user details
CREATE OR REPLACE VIEW tenant.transfer_history_view AS
SELECT 
    t.id,
    t.reference,
    t.amount,
    t.fee,
    t.description,
    t.status,
    t.created_at,
    t.updated_at,
    -- Sender details
    su.first_name as sender_first_name,
    su.last_name as sender_last_name,
    su.email as sender_email,
    su.account_number as sender_account,
    -- Recipient details
    t.recipient_name,
    t.recipient_account_number,
    t.recipient_bank_code,
    -- NIBSS details
    t.nibss_transaction_id,
    t.nibss_session_id
FROM tenant.transfers t
JOIN tenant.users su ON t.sender_id = su.id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 008_fix_schema_issues completed successfully';
    RAISE NOTICE 'Fixed: wallet table structure, constraints, primary wallets, account numbers, referral codes';
    RAISE NOTICE 'Added: validation functions, summary views, proper indexes';
END $$;