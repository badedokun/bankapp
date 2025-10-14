-- ============================================================================
-- REFERRAL SYSTEM: User Profile Extensions
-- ============================================================================
-- Purpose: Add referral code generation and account status tracking to users
-- Created: October 5, 2025
-- Phase: 1.1 - User Profile Extensions
-- ============================================================================

-- Add referral code and account status columns to users table
ALTER TABLE tenant.users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'registered'
    CHECK (account_status IN ('registered', 'kyc_pending', 'kyc_verified', 'funded', 'active', 'suspended', 'closed')),
ADD COLUMN IF NOT EXISTS initial_deposit_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS initial_deposit_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS referral_opt_in BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(12);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON tenant.users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_account_status ON tenant.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON tenant.users(referred_by_code) WHERE referred_by_code IS NOT NULL;

-- ============================================================================
-- Function: Generate Unique Referral Code
-- ============================================================================
-- Generates an 8-character alphanumeric code (uppercase)
-- Ensures uniqueness by checking existing codes
-- Format: XXXXXXXX (e.g., 'A1B2C3D4')
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.generate_referral_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    code VARCHAR(12);
    code_exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code from random MD5 hash
        -- Using MD5 for randomness, taking first 8 chars, converting to uppercase
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM tenant.users WHERE referral_code = code
        ) INTO code_exists;

        -- Increment attempt counter
        attempts := attempts + 1;

        -- Return if unique or max attempts reached
        IF NOT code_exists THEN
            RETURN code;
        END IF;

        -- Fail-safe: prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Auto-Generate Referral Code on User Creation
-- ============================================================================
-- Automatically generates a referral code when a new user is created
-- Only generates if referral_code is NULL
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate referral code if not provided
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := tenant.generate_referral_code();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON tenant.users;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_referral_code
    BEFORE INSERT ON tenant.users
    FOR EACH ROW
    EXECUTE FUNCTION tenant.auto_generate_referral_code();

-- ============================================================================
-- Backfill: Generate Referral Codes for Existing Users
-- ============================================================================
-- This will generate codes for all existing users that don't have one
-- Safe to run multiple times (only updates NULL values)
-- ============================================================================

DO $$
DECLARE
    user_record RECORD;
    new_code VARCHAR(12);
    users_updated INTEGER := 0;
BEGIN
    -- Loop through users without referral codes
    FOR user_record IN
        SELECT id FROM tenant.users WHERE referral_code IS NULL
    LOOP
        -- Generate unique code
        new_code := tenant.generate_referral_code();

        -- Update user with new code
        UPDATE tenant.users
        SET referral_code = new_code
        WHERE id = user_record.id;

        users_updated := users_updated + 1;
    END LOOP;

    -- Log results
    RAISE NOTICE 'Backfilled referral codes for % existing users', users_updated;
END $$;

-- ============================================================================
-- Function: Validate Referral Code
-- ============================================================================
-- Checks if a referral code exists and is valid for use
-- Returns the user ID of the referrer if valid, NULL otherwise
-- ============================================================================

DROP FUNCTION IF EXISTS tenant.validate_referral_code(VARCHAR);

CREATE OR REPLACE FUNCTION tenant.validate_referral_code(p_code VARCHAR(12))
RETURNS TABLE(
    is_valid BOOLEAN,
    referrer_id UUID,
    referrer_name TEXT,
    referrer_tier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        true AS is_valid,
        u.id AS referrer_id,
        CONCAT(u.first_name, ' ', u.last_name)::TEXT AS referrer_name,
        COALESCE(
            (SELECT tier_name FROM rewards.tiers t
             INNER JOIN rewards.user_rewards ur ON t.id = ur.current_tier_id
             WHERE ur.user_id = u.id),
            'Bronze'
        )::TEXT AS referrer_tier
    FROM tenant.users u
    WHERE u.referral_code = p_code
      AND u.account_status NOT IN ('suspended', 'closed')
      AND u.referral_opt_in = true
    LIMIT 1;

    -- If no results, return invalid
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Update Account Status
-- ============================================================================
-- Helper function to update user account status with validation
-- Prevents invalid status transitions
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.update_account_status(
    p_user_id UUID,
    p_new_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(20);
    valid_transition BOOLEAN := false;
BEGIN
    -- Get current status
    SELECT account_status INTO current_status
    FROM tenant.users
    WHERE id = p_user_id;

    -- Validate status exists
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Define valid transitions
    -- registered → kyc_pending → kyc_verified → funded → active
    -- Any status can go to suspended or closed
    valid_transition := CASE
        WHEN p_new_status IN ('suspended', 'closed') THEN true
        WHEN current_status = 'registered' AND p_new_status IN ('kyc_pending', 'kyc_verified') THEN true
        WHEN current_status = 'kyc_pending' AND p_new_status IN ('kyc_verified', 'registered') THEN true
        WHEN current_status = 'kyc_verified' AND p_new_status IN ('funded', 'active') THEN true
        WHEN current_status = 'funded' AND p_new_status = 'active' THEN true
        WHEN current_status = 'active' AND p_new_status = 'funded' THEN true
        ELSE false
    END;

    -- Reject invalid transitions
    IF NOT valid_transition THEN
        RAISE EXCEPTION 'Invalid status transition: % → %', current_status, p_new_status;
    END IF;

    -- Update status
    UPDATE tenant.users
    SET account_status = p_new_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if migration was successful
DO $$
DECLARE
    users_with_codes INTEGER;
    total_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_with_codes FROM tenant.users WHERE referral_code IS NOT NULL;
    SELECT COUNT(*) INTO total_users FROM tenant.users;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'REFERRAL USER EXTENSIONS MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with referral codes: %', users_with_codes;
    RAISE NOTICE 'Coverage: %%%', ROUND((users_with_codes::DECIMAL / NULLIF(total_users, 0)) * 100, 2);
    RAISE NOTICE '============================================================';
END $$;

-- Test referral code generation
DO $$
DECLARE
    test_code VARCHAR(12);
    validation_result RECORD;
BEGIN
    -- Test code generation
    test_code := tenant.generate_referral_code();
    RAISE NOTICE 'Sample generated code: %', test_code;

    -- Test validation function (should return false for non-existent code)
    SELECT * INTO validation_result FROM tenant.validate_referral_code('TESTCODE');
    RAISE NOTICE 'Validation test (invalid code): is_valid=%', validation_result.is_valid;
END $$;

-- Show sample of generated codes
SELECT
    id,
    first_name,
    last_name,
    email,
    referral_code,
    account_status,
    created_at
FROM tenant.users
WHERE referral_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
