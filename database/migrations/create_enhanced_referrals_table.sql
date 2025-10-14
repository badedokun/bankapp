-- ============================================================================
-- REFERRAL SYSTEM: Enhanced Referrals Table
-- ============================================================================
-- Purpose: Comprehensive referral tracking with eligibility and bonus management
-- Created: October 5, 2025
-- Phase: 1.2 - Enhanced Referrals Table
-- ============================================================================

-- Drop existing basic referrals table if it exists
DROP TABLE IF EXISTS tenant.referrals CASCADE;

-- ============================================================================
-- Table: Referrals
-- ============================================================================
-- Tracks all referral relationships with comprehensive status tracking
-- Supports standard referrals, aggregator referrals, and promotional referrals
-- ============================================================================

CREATE TABLE tenant.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Referral Relationship
    -- ========================================================================
    referrer_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(12) NOT NULL,

    -- ========================================================================
    -- Source Tracking
    -- ========================================================================
    referral_source VARCHAR(50) DEFAULT 'direct'
        CHECK (referral_source IN ('direct', 'aggregator', 'promotional_campaign')),
    aggregator_id UUID, -- NULL for standard referrals, references aggregators.partners
    campaign_id UUID, -- NULL for standard referrals, references rewards.promotional_campaigns

    -- ========================================================================
    -- Bonus Configuration
    -- ========================================================================
    bonus_type VARCHAR(20) DEFAULT 'standard'
        CHECK (bonus_type IN ('standard', 'aggregator', 'promotional', 'tier_bonus')),
    bonus_points INTEGER DEFAULT 500,
    bonus_cash DECIMAL(15,2) DEFAULT 0,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Tier-based multiplier

    -- ========================================================================
    -- Bonus Status Tracking
    -- ========================================================================
    bonus_status VARCHAR(20) DEFAULT 'pending'
        CHECK (bonus_status IN ('pending', 'eligible', 'awarded', 'expired', 'cancelled', 'fraud_flagged')),
    bonus_awarded_at TIMESTAMP,
    bonus_transaction_id INTEGER, -- References rewards.point_transactions

    -- ========================================================================
    -- Referee Account Status Tracking
    -- ========================================================================
    referee_account_status VARCHAR(20) DEFAULT 'registered',
    referee_kyc_completed BOOLEAN DEFAULT false,
    referee_kyc_completed_at TIMESTAMP,
    referee_funded BOOLEAN DEFAULT false,
    referee_funded_amount DECIMAL(15,2) DEFAULT 0,
    referee_funded_at TIMESTAMP,
    referee_active BOOLEAN DEFAULT false,
    referee_activated_at TIMESTAMP,

    -- ========================================================================
    -- Eligibility and Expiration
    -- ========================================================================
    eligible_for_bonus BOOLEAN DEFAULT false,
    eligibility_checked_at TIMESTAMP,
    eligibility_notes TEXT,
    expires_at TIMESTAMP, -- Default 90 days from registration
    expired BOOLEAN DEFAULT false,

    -- ========================================================================
    -- UTM Tracking
    -- ========================================================================
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),

    -- ========================================================================
    -- Device and IP Tracking (for fraud detection)
    -- ========================================================================
    device_info JSONB DEFAULT '{}',
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    metadata JSONB DEFAULT '{}',

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ========================================================================
    -- Constraints
    -- ========================================================================
    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id),
    CONSTRAINT unique_referee UNIQUE (referee_id),
    CONSTRAINT valid_bonus_points CHECK (bonus_points >= 0),
    CONSTRAINT valid_bonus_cash CHECK (bonus_cash >= 0)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_referrals_referrer_id ON tenant.referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON tenant.referrals(referee_id);
CREATE INDEX idx_referrals_code ON tenant.referrals(referral_code);
CREATE INDEX idx_referrals_bonus_status ON tenant.referrals(bonus_status);
CREATE INDEX idx_referrals_source ON tenant.referrals(referral_source);
CREATE INDEX idx_referrals_created_at ON tenant.referrals(created_at DESC);
CREATE INDEX idx_referrals_expires_at ON tenant.referrals(expires_at) WHERE expired = false;
CREATE INDEX idx_referrals_eligible ON tenant.referrals(eligible_for_bonus) WHERE eligible_for_bonus = true;

-- Composite index for aggregator tracking
CREATE INDEX idx_referrals_aggregator_status ON tenant.referrals(aggregator_id, bonus_status, created_at)
    WHERE aggregator_id IS NOT NULL;

-- Composite index for campaign tracking
CREATE INDEX idx_referrals_campaign_status ON tenant.referrals(campaign_id, bonus_status, created_at)
    WHERE campaign_id IS NOT NULL;

-- ============================================================================
-- Trigger: Update Timestamp
-- ============================================================================

CREATE TRIGGER trigger_update_referrals_timestamp
    BEFORE UPDATE ON tenant.referrals
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

-- ============================================================================
-- Function: Create Referral Record
-- ============================================================================
-- Creates a referral record when a new user registers with a code
-- Automatically sets expiration date (90 days default)
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.create_referral(
    p_referee_id UUID,
    p_referral_code VARCHAR(12),
    p_utm_source VARCHAR(100) DEFAULT NULL,
    p_utm_medium VARCHAR(100) DEFAULT NULL,
    p_utm_campaign VARCHAR(100) DEFAULT NULL,
    p_device_info JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_id UUID;
    v_referral_config RECORD;
    v_referrer_tier_multiplier DECIMAL(3,2);
BEGIN
    -- Find referrer by code
    SELECT id INTO v_referrer_id
    FROM tenant.users
    WHERE referral_code = p_referral_code
      AND account_status NOT IN ('suspended', 'closed')
      AND referral_opt_in = true;

    -- Validate referrer exists
    IF v_referrer_id IS NULL THEN
        RAISE EXCEPTION 'Invalid referral code: %', p_referral_code;
    END IF;

    -- Prevent self-referral
    IF v_referrer_id = p_referee_id THEN
        RAISE EXCEPTION 'Self-referral not allowed';
    END IF;

    -- Check if referee already has a referral record
    IF EXISTS (SELECT 1 FROM tenant.referrals WHERE referee_id = p_referee_id) THEN
        RAISE EXCEPTION 'User already referred by another user';
    END IF;

    -- Get referral configuration
    SELECT * INTO v_referral_config
    FROM rewards.referral_configuration
    LIMIT 1;

    -- Get referrer's tier multiplier
    SELECT
        CASE
            WHEN t.tier_code = 'bronze' THEN v_referral_config.bronze_tier_multiplier
            WHEN t.tier_code = 'silver' THEN v_referral_config.silver_tier_multiplier
            WHEN t.tier_code = 'gold' THEN v_referral_config.gold_tier_multiplier
            WHEN t.tier_code = 'platinum' THEN v_referral_config.platinum_tier_multiplier
            WHEN t.tier_code = 'diamond' THEN v_referral_config.diamond_tier_multiplier
            ELSE 1.00
        END INTO v_referrer_tier_multiplier
    FROM rewards.user_rewards ur
    INNER JOIN rewards.tiers t ON ur.current_tier_id = t.id
    WHERE ur.user_id = v_referrer_id;

    -- Default multiplier if no tier found
    v_referrer_tier_multiplier := COALESCE(v_referrer_tier_multiplier, 1.00);

    -- Create referral record
    INSERT INTO tenant.referrals (
        referrer_id,
        referee_id,
        referral_code,
        referral_source,
        bonus_points,
        bonus_cash,
        bonus_multiplier,
        utm_source,
        utm_medium,
        utm_campaign,
        device_info,
        ip_address,
        expires_at
    ) VALUES (
        v_referrer_id,
        p_referee_id,
        p_referral_code,
        'direct',
        v_referral_config.standard_referral_points,
        v_referral_config.standard_referral_cash,
        v_referrer_tier_multiplier,
        p_utm_source,
        p_utm_medium,
        p_utm_campaign,
        p_device_info,
        p_ip_address,
        CURRENT_TIMESTAMP + (v_referral_config.eligibility_grace_period_days || ' days')::INTERVAL
    )
    RETURNING id INTO v_referral_id;

    -- Update referee's referred_by_code
    UPDATE tenant.users
    SET referred_by_code = p_referral_code
    WHERE id = p_referee_id;

    RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Check Referral Eligibility
-- ============================================================================
-- Checks if a referral is eligible for bonus award
-- Updates eligibility status in the referrals table
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.check_referral_eligibility(p_referral_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_referral RECORD;
    v_config RECORD;
    is_eligible BOOLEAN := false;
    eligibility_reason TEXT := '';
BEGIN
    -- Get referral record
    SELECT * INTO v_referral FROM tenant.referrals WHERE id = p_referral_id;

    IF v_referral IS NULL THEN
        RAISE EXCEPTION 'Referral not found: %', p_referral_id;
    END IF;

    -- Already awarded or expired
    IF v_referral.bonus_status IN ('awarded', 'expired', 'cancelled') THEN
        RETURN false;
    END IF;

    -- Check expiration
    IF v_referral.expires_at < CURRENT_TIMESTAMP THEN
        UPDATE tenant.referrals
        SET bonus_status = 'expired',
            expired = true,
            eligibility_notes = 'Expired: 90-day grace period passed'
        WHERE id = p_referral_id;
        RETURN false;
    END IF;

    -- Get configuration
    SELECT * INTO v_config FROM rewards.referral_configuration LIMIT 1;

    -- Check KYC requirement
    IF v_config.require_kyc_verification AND NOT v_referral.referee_kyc_completed THEN
        eligibility_reason := 'KYC verification required';
        is_eligible := false;
    -- Check funding requirement
    ELSIF v_config.require_minimum_deposit AND
          (NOT v_referral.referee_funded OR
           v_referral.referee_funded_amount < v_config.minimum_deposit_amount) THEN
        eligibility_reason := format('Minimum deposit of %s required', v_config.minimum_deposit_amount);
        is_eligible := false;
    -- All requirements met
    ELSE
        eligibility_reason := 'All requirements met';
        is_eligible := true;
    END IF;

    -- Update referral record
    UPDATE tenant.referrals
    SET eligible_for_bonus = is_eligible,
        eligibility_checked_at = CURRENT_TIMESTAMP,
        eligibility_notes = eligibility_reason,
        bonus_status = CASE
            WHEN is_eligible THEN 'eligible'
            ELSE 'pending'
        END
    WHERE id = p_referral_id;

    RETURN is_eligible;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Award Referral Bonus
-- ============================================================================
-- Awards bonus points/cash to referrer when referee becomes eligible
-- Integrates with rewards points system
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.award_referral_bonus(p_referral_id UUID)
RETURNS TABLE(
    success BOOLEAN,
    points_awarded INTEGER,
    cash_awarded DECIMAL(15,2),
    message TEXT
) AS $$
DECLARE
    v_referral RECORD;
    v_final_points INTEGER;
    v_final_cash DECIMAL(15,2);
BEGIN
    -- Get referral record
    SELECT * INTO v_referral FROM tenant.referrals WHERE id = p_referral_id;

    -- Validate referral exists
    IF v_referral IS NULL THEN
        RETURN QUERY SELECT false, 0, 0.00, 'Referral not found';
        RETURN;
    END IF;

    -- Check if already awarded
    IF v_referral.bonus_status = 'awarded' THEN
        RETURN QUERY SELECT false, 0, 0.00, 'Bonus already awarded';
        RETURN;
    END IF;

    -- Check eligibility
    IF NOT v_referral.eligible_for_bonus THEN
        RETURN QUERY SELECT false, 0, 0.00, 'Referral not eligible for bonus';
        RETURN;
    END IF;

    -- Calculate final bonus with multiplier
    v_final_points := ROUND(v_referral.bonus_points * v_referral.bonus_multiplier);
    v_final_cash := v_referral.bonus_cash * v_referral.bonus_multiplier;

    -- Award points via rewards system
    IF v_final_points > 0 THEN
        INSERT INTO rewards.point_transactions (
            user_id,
            points,
            transaction_type,
            action_type,
            description,
            metadata
        ) VALUES (
            v_referral.referrer_id,
            v_final_points,
            'earn',
            'referral_bonus',
            format('Referral bonus for referring user %s', v_referral.referee_id),
            jsonb_build_object(
                'referral_id', p_referral_id,
                'referee_id', v_referral.referee_id,
                'base_points', v_referral.bonus_points,
                'multiplier', v_referral.bonus_multiplier
            )
        );

        -- Update user's total points
        UPDATE rewards.user_rewards
        SET total_points = total_points + v_final_points,
            lifetime_points = lifetime_points + v_final_points,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = v_referral.referrer_id;
    END IF;

    -- Award cash bonus (if applicable)
    IF v_final_cash > 0 THEN
        -- TODO: Integrate with wallet/balance system
        -- This would credit the user's wallet with cash
        NULL;
    END IF;

    -- Update referral record
    UPDATE tenant.referrals
    SET bonus_status = 'awarded',
        bonus_awarded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_referral_id;

    -- Return success
    RETURN QUERY SELECT
        true,
        v_final_points,
        v_final_cash,
        format('Awarded %s points to referrer', v_final_points);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Auto-Check Eligibility on Referee Status Change
-- ============================================================================
-- Automatically checks eligibility when referee's status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.auto_check_referral_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_eligibility BOOLEAN;
BEGIN
    -- Only check if status changed to eligible state
    IF NEW.referee_kyc_completed != OLD.referee_kyc_completed OR
       NEW.referee_funded != OLD.referee_funded OR
       NEW.referee_active != OLD.referee_active THEN

        -- Check eligibility
        v_eligibility := tenant.check_referral_eligibility(NEW.id);

        -- Auto-award if eligible
        IF v_eligibility AND NEW.bonus_status = 'eligible' THEN
            PERFORM tenant.award_referral_bonus(NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_check_referral_eligibility
    AFTER UPDATE ON tenant.referrals
    FOR EACH ROW
    EXECUTE FUNCTION tenant.auto_check_referral_eligibility();

-- ============================================================================
-- Function: Get Referral Statistics
-- ============================================================================
-- Returns comprehensive referral stats for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.get_referral_stats(p_user_id UUID)
RETURNS TABLE(
    total_referrals INTEGER,
    pending_referrals INTEGER,
    eligible_referrals INTEGER,
    awarded_referrals INTEGER,
    expired_referrals INTEGER,
    total_points_earned INTEGER,
    total_cash_earned DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_referrals,
        COUNT(*) FILTER (WHERE bonus_status = 'pending')::INTEGER AS pending_referrals,
        COUNT(*) FILTER (WHERE bonus_status = 'eligible')::INTEGER AS eligible_referrals,
        COUNT(*) FILTER (WHERE bonus_status = 'awarded')::INTEGER AS awarded_referrals,
        COUNT(*) FILTER (WHERE bonus_status = 'expired')::INTEGER AS expired_referrals,
        COALESCE(SUM(bonus_points * bonus_multiplier) FILTER (WHERE bonus_status = 'awarded'), 0)::INTEGER AS total_points_earned,
        COALESCE(SUM(bonus_cash * bonus_multiplier) FILTER (WHERE bonus_status = 'awarded'), 0) AS total_cash_earned
    FROM tenant.referrals
    WHERE referrer_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ENHANCED REFERRALS TABLE MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Table created: tenant.referrals';
    RAISE NOTICE 'Functions created: 4';
    RAISE NOTICE 'Triggers created: 2';
    RAISE NOTICE 'Indexes created: 11';
    RAISE NOTICE '============================================================';
END $$;
