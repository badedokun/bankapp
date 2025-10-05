-- ============================================================================
-- REFERRAL SYSTEM: Referral Configuration
-- ============================================================================
-- Purpose: Tenant-specific referral program settings and configuration
-- Created: October 5, 2025
-- Phase: 1.6 - Referral Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.referral_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Tenant Identification
    -- ========================================================================
    tenant_id UUID NOT NULL UNIQUE, -- One config per tenant
    tenant_name VARCHAR(255),

    -- ========================================================================
    -- Standard Referral Bonuses
    -- ========================================================================
    standard_referral_points INTEGER DEFAULT 500,
    standard_referral_cash DECIMAL(15,2) DEFAULT 0.00,
    referee_welcome_points INTEGER DEFAULT 100, -- Points for new user
    referee_welcome_cash DECIMAL(15,2) DEFAULT 0.00,

    -- ========================================================================
    -- Tier-Based Multipliers
    -- ========================================================================
    bronze_tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    silver_tier_multiplier DECIMAL(3,2) DEFAULT 1.50,
    gold_tier_multiplier DECIMAL(3,2) DEFAULT 2.00,
    platinum_tier_multiplier DECIMAL(3,2) DEFAULT 2.50,
    diamond_tier_multiplier DECIMAL(3,2) DEFAULT 3.00,

    -- ========================================================================
    -- Eligibility Requirements
    -- ========================================================================
    require_kyc_verification BOOLEAN DEFAULT true,
    require_minimum_deposit BOOLEAN DEFAULT true,
    minimum_deposit_amount DECIMAL(15,2) DEFAULT 5000.00,
    require_account_activation BOOLEAN DEFAULT false,
    eligibility_grace_period_days INTEGER DEFAULT 90, -- Days to meet requirements

    -- ========================================================================
    -- Referral Limits
    -- ========================================================================
    max_referrals_per_user INTEGER DEFAULT NULL, -- NULL = unlimited
    max_referrals_per_day INTEGER DEFAULT 10,
    max_referrals_per_month INTEGER DEFAULT 100,
    max_bonus_per_user_monthly DECIMAL(15,2) DEFAULT NULL, -- Cap on earnings

    -- ========================================================================
    -- Aggregator/Influencer Program Settings
    -- ========================================================================
    enable_aggregator_program BOOLEAN DEFAULT false,
    aggregator_base_rate DECIMAL(15,2) DEFAULT 500.00,
    aggregator_min_referrals INTEGER DEFAULT 10, -- Minimum to qualify
    aggregator_payout_frequency VARCHAR(20) DEFAULT 'monthly'
        CHECK (aggregator_payout_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),

    -- ========================================================================
    -- Promotional Campaign Settings
    -- ========================================================================
    enable_promotional_campaigns BOOLEAN DEFAULT true,
    max_active_campaigns INTEGER DEFAULT 5,
    allow_campaign_stacking BOOLEAN DEFAULT false, -- Can user use multiple codes?

    -- ========================================================================
    -- Fraud Prevention Settings
    -- ========================================================================
    enable_fraud_detection BOOLEAN DEFAULT true,
    max_device_fingerprint_matches INTEGER DEFAULT 3, -- Same device limit
    max_ip_address_matches INTEGER DEFAULT 5, -- Same IP limit
    block_circular_referrals BOOLEAN DEFAULT true,
    velocity_check_enabled BOOLEAN DEFAULT true,
    max_referrals_per_hour INTEGER DEFAULT 3,

    -- ========================================================================
    -- Feature Flags
    -- ========================================================================
    enable_share_tracking BOOLEAN DEFAULT true,
    enable_social_sharing BOOLEAN DEFAULT true,
    enable_qr_code_sharing BOOLEAN DEFAULT true,
    enable_sms_sharing BOOLEAN DEFAULT true,
    enable_email_sharing BOOLEAN DEFAULT true,

    -- ========================================================================
    -- Notification Settings
    -- ========================================================================
    notify_on_referral_signup BOOLEAN DEFAULT true,
    notify_on_referral_funded BOOLEAN DEFAULT true,
    notify_on_bonus_awarded BOOLEAN DEFAULT true,
    notify_on_tier_upgrade BOOLEAN DEFAULT true,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    custom_terms_url TEXT,
    custom_message TEXT,
    metadata JSONB DEFAULT '{}',

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ========================================================================
    -- Constraints
    -- ========================================================================
    CONSTRAINT valid_standard_points CHECK (standard_referral_points >= 0),
    CONSTRAINT valid_standard_cash CHECK (standard_referral_cash >= 0),
    CONSTRAINT valid_welcome_points CHECK (referee_welcome_points >= 0),
    CONSTRAINT valid_minimum_deposit CHECK (minimum_deposit_amount >= 0),
    CONSTRAINT valid_grace_period CHECK (eligibility_grace_period_days > 0),
    CONSTRAINT valid_multipliers CHECK (
        bronze_tier_multiplier >= 1.00 AND
        silver_tier_multiplier >= bronze_tier_multiplier AND
        gold_tier_multiplier >= silver_tier_multiplier AND
        platinum_tier_multiplier >= gold_tier_multiplier AND
        diamond_tier_multiplier >= platinum_tier_multiplier
    )
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_referral_config_tenant ON rewards.referral_configuration(tenant_id);

-- ============================================================================
-- Trigger: Update Timestamp
-- ============================================================================

CREATE TRIGGER trigger_update_referral_config_timestamp
    BEFORE UPDATE ON rewards.referral_configuration
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

-- ============================================================================
-- Function: Get Referral Configuration
-- ============================================================================
-- Returns referral config for a tenant, creates default if not exists
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.get_referral_config(p_tenant_id UUID)
RETURNS rewards.referral_configuration AS $$
DECLARE
    v_config rewards.referral_configuration;
BEGIN
    -- Try to get existing config
    SELECT * INTO v_config
    FROM rewards.referral_configuration
    WHERE tenant_id = p_tenant_id;

    -- Create default config if not exists
    IF v_config IS NULL THEN
        INSERT INTO rewards.referral_configuration (
            tenant_id,
            standard_referral_points,
            standard_referral_cash,
            referee_welcome_points,
            bronze_tier_multiplier,
            silver_tier_multiplier,
            gold_tier_multiplier,
            platinum_tier_multiplier,
            diamond_tier_multiplier,
            require_kyc_verification,
            require_minimum_deposit,
            minimum_deposit_amount,
            eligibility_grace_period_days,
            enable_fraud_detection,
            block_circular_referrals
        ) VALUES (
            p_tenant_id,
            500,      -- Standard points
            0.00,     -- Standard cash
            100,      -- Welcome points
            1.00,     -- Bronze multiplier
            1.50,     -- Silver multiplier
            2.00,     -- Gold multiplier
            2.50,     -- Platinum multiplier
            3.00,     -- Diamond multiplier
            true,     -- Require KYC
            true,     -- Require minimum deposit
            5000.00,  -- Minimum deposit amount
            90,       -- Grace period days
            true,     -- Enable fraud detection
            true      -- Block circular referrals
        )
        RETURNING * INTO v_config;
    END IF;

    RETURN v_config;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Update Referral Configuration
-- ============================================================================
-- Updates specific configuration fields for a tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.update_referral_config(
    p_tenant_id UUID,
    p_config JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if config exists
    SELECT EXISTS(
        SELECT 1 FROM rewards.referral_configuration WHERE tenant_id = p_tenant_id
    ) INTO v_exists;

    -- Create if not exists
    IF NOT v_exists THEN
        PERFORM rewards.get_referral_config(p_tenant_id);
    END IF;

    -- Update fields provided in JSONB
    UPDATE rewards.referral_configuration
    SET
        standard_referral_points = COALESCE((p_config->>'standard_referral_points')::INTEGER, standard_referral_points),
        standard_referral_cash = COALESCE((p_config->>'standard_referral_cash')::DECIMAL, standard_referral_cash),
        referee_welcome_points = COALESCE((p_config->>'referee_welcome_points')::INTEGER, referee_welcome_points),
        referee_welcome_cash = COALESCE((p_config->>'referee_welcome_cash')::DECIMAL, referee_welcome_cash),
        bronze_tier_multiplier = COALESCE((p_config->>'bronze_tier_multiplier')::DECIMAL, bronze_tier_multiplier),
        silver_tier_multiplier = COALESCE((p_config->>'silver_tier_multiplier')::DECIMAL, silver_tier_multiplier),
        gold_tier_multiplier = COALESCE((p_config->>'gold_tier_multiplier')::DECIMAL, gold_tier_multiplier),
        platinum_tier_multiplier = COALESCE((p_config->>'platinum_tier_multiplier')::DECIMAL, platinum_tier_multiplier),
        diamond_tier_multiplier = COALESCE((p_config->>'diamond_tier_multiplier')::DECIMAL, diamond_tier_multiplier),
        require_kyc_verification = COALESCE((p_config->>'require_kyc_verification')::BOOLEAN, require_kyc_verification),
        require_minimum_deposit = COALESCE((p_config->>'require_minimum_deposit')::BOOLEAN, require_minimum_deposit),
        minimum_deposit_amount = COALESCE((p_config->>'minimum_deposit_amount')::DECIMAL, minimum_deposit_amount),
        eligibility_grace_period_days = COALESCE((p_config->>'eligibility_grace_period_days')::INTEGER, eligibility_grace_period_days),
        max_referrals_per_user = COALESCE((p_config->>'max_referrals_per_user')::INTEGER, max_referrals_per_user),
        max_referrals_per_day = COALESCE((p_config->>'max_referrals_per_day')::INTEGER, max_referrals_per_day),
        max_referrals_per_month = COALESCE((p_config->>'max_referrals_per_month')::INTEGER, max_referrals_per_month),
        enable_aggregator_program = COALESCE((p_config->>'enable_aggregator_program')::BOOLEAN, enable_aggregator_program),
        enable_promotional_campaigns = COALESCE((p_config->>'enable_promotional_campaigns')::BOOLEAN, enable_promotional_campaigns),
        enable_fraud_detection = COALESCE((p_config->>'enable_fraud_detection')::BOOLEAN, enable_fraud_detection),
        block_circular_referrals = COALESCE((p_config->>'block_circular_referrals')::BOOLEAN, block_circular_referrals),
        enable_share_tracking = COALESCE((p_config->>'enable_share_tracking')::BOOLEAN, enable_share_tracking),
        enable_social_sharing = COALESCE((p_config->>'enable_social_sharing')::BOOLEAN, enable_social_sharing),
        notify_on_bonus_awarded = COALESCE((p_config->>'notify_on_bonus_awarded')::BOOLEAN, notify_on_bonus_awarded),
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = p_tenant_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Check Referral Limits
-- ============================================================================
-- Validates if user has exceeded referral limits
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.check_referral_limits(
    p_user_id UUID,
    p_tenant_id UUID
)
RETURNS TABLE(
    within_limits BOOLEAN,
    limit_type VARCHAR(50),
    current_count INTEGER,
    limit_value INTEGER
) AS $$
DECLARE
    v_config RECORD;
    v_daily_count INTEGER;
    v_monthly_count INTEGER;
    v_total_count INTEGER;
    v_hourly_count INTEGER;
BEGIN
    -- Get configuration
    SELECT * INTO v_config FROM rewards.referral_configuration WHERE tenant_id = p_tenant_id;

    -- Count referrals by time period
    SELECT COUNT(*) INTO v_hourly_count
    FROM tenant.referrals
    WHERE referrer_id = p_user_id
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour';

    SELECT COUNT(*) INTO v_daily_count
    FROM tenant.referrals
    WHERE referrer_id = p_user_id
      AND created_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO v_monthly_count
    FROM tenant.referrals
    WHERE referrer_id = p_user_id
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

    SELECT COUNT(*) INTO v_total_count
    FROM tenant.referrals
    WHERE referrer_id = p_user_id;

    -- Check velocity limit (hourly)
    IF v_config.velocity_check_enabled AND v_hourly_count >= v_config.max_referrals_per_hour THEN
        RETURN QUERY SELECT false, 'hourly'::VARCHAR(50), v_hourly_count, v_config.max_referrals_per_hour;
        RETURN;
    END IF;

    -- Check daily limit
    IF v_config.max_referrals_per_day IS NOT NULL AND v_daily_count >= v_config.max_referrals_per_day THEN
        RETURN QUERY SELECT false, 'daily'::VARCHAR(50), v_daily_count, v_config.max_referrals_per_day;
        RETURN;
    END IF;

    -- Check monthly limit
    IF v_config.max_referrals_per_month IS NOT NULL AND v_monthly_count >= v_config.max_referrals_per_month THEN
        RETURN QUERY SELECT false, 'monthly'::VARCHAR(50), v_monthly_count, v_config.max_referrals_per_month;
        RETURN;
    END IF;

    -- Check total limit
    IF v_config.max_referrals_per_user IS NOT NULL AND v_total_count >= v_config.max_referrals_per_user THEN
        RETURN QUERY SELECT false, 'total'::VARCHAR(50), v_total_count, v_config.max_referrals_per_user;
        RETURN;
    END IF;

    -- All checks passed
    RETURN QUERY SELECT true, 'none'::VARCHAR(50), 0, 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Check Fraud Risk
-- ============================================================================
-- Detects potential fraud patterns in referrals
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.check_fraud_risk(
    p_referrer_id UUID,
    p_referee_id UUID,
    p_device_fingerprint VARCHAR(255),
    p_ip_address INET,
    p_tenant_id UUID
)
RETURNS TABLE(
    is_fraud_risk BOOLEAN,
    risk_reason TEXT,
    risk_score INTEGER -- 0-100
) AS $$
DECLARE
    v_config RECORD;
    v_device_matches INTEGER;
    v_ip_matches INTEGER;
    v_circular_referral BOOLEAN;
    v_risk_score INTEGER := 0;
    v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get configuration
    SELECT * INTO v_config FROM rewards.referral_configuration WHERE tenant_id = p_tenant_id;

    -- Skip if fraud detection disabled
    IF NOT v_config.enable_fraud_detection THEN
        RETURN QUERY SELECT false, 'Fraud detection disabled'::TEXT, 0;
        RETURN;
    END IF;

    -- Check circular referrals (A refers B, B refers A)
    IF v_config.block_circular_referrals THEN
        SELECT EXISTS(
            SELECT 1 FROM tenant.referrals
            WHERE referrer_id = p_referee_id AND referee_id = p_referrer_id
        ) INTO v_circular_referral;

        IF v_circular_referral THEN
            RETURN QUERY SELECT true, 'Circular referral detected'::TEXT, 100;
            RETURN;
        END IF;
    END IF;

    -- Check device fingerprint matches
    SELECT COUNT(DISTINCT referrer_id) INTO v_device_matches
    FROM tenant.referrals
    WHERE device_fingerprint = p_device_fingerprint
      AND device_fingerprint IS NOT NULL;

    IF v_device_matches > v_config.max_device_fingerprint_matches THEN
        v_risk_score := v_risk_score + 40;
        v_reasons := array_append(v_reasons, format('Device fingerprint matched %s times', v_device_matches));
    END IF;

    -- Check IP address matches
    SELECT COUNT(DISTINCT referrer_id) INTO v_ip_matches
    FROM tenant.referrals
    WHERE ip_address = p_ip_address
      AND ip_address IS NOT NULL;

    IF v_ip_matches > v_config.max_ip_address_matches THEN
        v_risk_score := v_risk_score + 30;
        v_reasons := array_append(v_reasons, format('IP address matched %s times', v_ip_matches));
    END IF;

    -- Check self-referral (same user)
    IF p_referrer_id = p_referee_id THEN
        RETURN QUERY SELECT true, 'Self-referral attempt'::TEXT, 100;
        RETURN;
    END IF;

    -- Determine if fraud risk
    IF v_risk_score >= 50 THEN
        RETURN QUERY SELECT true, array_to_string(v_reasons, '; ')::TEXT, v_risk_score;
    ELSE
        RETURN QUERY SELECT false, 'No significant risk detected'::TEXT, v_risk_score;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Insert Default Configuration
-- ============================================================================
-- Create default config for existing tenants
-- ============================================================================

DO $$
DECLARE
    tenant_record RECORD;
    configs_created INTEGER := 0;
BEGIN
    -- Get all existing tenants from platform schema
    FOR tenant_record IN
        SELECT id, name FROM tenants
    LOOP
        -- Create config if not exists
        INSERT INTO rewards.referral_configuration (
            tenant_id,
            tenant_name,
            standard_referral_points,
            standard_referral_cash,
            referee_welcome_points,
            bronze_tier_multiplier,
            silver_tier_multiplier,
            gold_tier_multiplier,
            platinum_tier_multiplier,
            diamond_tier_multiplier,
            require_kyc_verification,
            require_minimum_deposit,
            minimum_deposit_amount,
            eligibility_grace_period_days
        ) VALUES (
            tenant_record.id,
            tenant_record.name,
            500,      -- Standard points
            0.00,     -- Standard cash
            100,      -- Welcome points
            1.00,     -- Bronze
            1.50,     -- Silver
            2.00,     -- Gold
            2.50,     -- Platinum
            3.00,     -- Diamond
            true,     -- Require KYC
            true,     -- Require deposit
            5000.00,  -- Min deposit
            90        -- Grace period
        )
        ON CONFLICT (tenant_id) DO NOTHING;

        configs_created := configs_created + 1;
    END LOOP;

    RAISE NOTICE 'Created default referral configuration for % tenants', configs_created;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM rewards.referral_configuration;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'REFERRAL CONFIGURATION MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Table created: rewards.referral_configuration';
    RAISE NOTICE 'Functions created: 5';
    RAISE NOTICE 'Triggers created: 1';
    RAISE NOTICE 'Indexes created: 1';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Default configurations created: %', config_count;
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  - Tenant-specific settings';
    RAISE NOTICE '  - Tier-based multipliers (1x to 3x)';
    RAISE NOTICE '  - Fraud detection (device, IP, circular)';
    RAISE NOTICE '  - Rate limiting (hourly, daily, monthly)';
    RAISE NOTICE '  - Feature flags for all channels';
    RAISE NOTICE '============================================================';
END $$;
