-- ============================================================================
-- REFERRAL SYSTEM: Promotional Campaigns
-- ============================================================================
-- Purpose: Enable promotional code campaigns for marketing initiatives
-- Created: October 5, 2025
-- Phase: 1.4 - Promotional Campaigns
-- ============================================================================

CREATE TABLE rewards.promotional_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Campaign Details
    -- ========================================================================
    campaign_code VARCHAR(50) UNIQUE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_name VARCHAR(255), -- e.g., "Independence Day Promo", "New Year Bonus"

    -- ========================================================================
    -- Rewards Configuration
    -- ========================================================================
    points_reward INTEGER DEFAULT 0,
    bonus_cash DECIMAL(15,2) DEFAULT 0,
    bonus_percentage DECIMAL(5,2), -- e.g., 10.00 for 10% bonus on first deposit

    -- ========================================================================
    -- Usage Limits
    -- ========================================================================
    max_redemptions INTEGER, -- NULL = unlimited
    current_redemptions INTEGER DEFAULT 0,
    max_redemptions_per_user INTEGER DEFAULT 1,

    -- ========================================================================
    -- Schedule
    -- ========================================================================
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',

    -- ========================================================================
    -- Status
    -- ========================================================================
    status VARCHAR(20) DEFAULT 'scheduled'
        CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled')),

    -- ========================================================================
    -- Eligibility Criteria
    -- ========================================================================
    min_deposit_amount DECIMAL(15,2), -- Minimum deposit required to redeem
    max_deposit_amount DECIMAL(15,2), -- Maximum deposit for bonus calculation
    eligible_user_tiers TEXT[], -- ['silver', 'gold', 'platinum'] or NULL for all
    eligible_regions TEXT[], -- ['NG', 'GH', 'KE'] or NULL for all
    new_users_only BOOLEAN DEFAULT false,
    existing_users_only BOOLEAN DEFAULT false,
    min_account_age_days INTEGER, -- Account must be X days old

    -- ========================================================================
    -- Terms and Conditions
    -- ========================================================================
    terms_and_conditions TEXT,
    terms_url TEXT,
    terms_version VARCHAR(20) DEFAULT '1.0',

    -- ========================================================================
    -- Distribution Channels
    -- ========================================================================
    distribution_channels TEXT[] DEFAULT ARRAY['in_app', 'email', 'sms', 'social'],
    is_public BOOLEAN DEFAULT true, -- Can be seen in public campaign list
    requires_code_entry BOOLEAN DEFAULT true, -- Or auto-applied?

    -- ========================================================================
    -- Approval Workflow
    -- ========================================================================
    created_by UUID REFERENCES tenant.users(id),
    approved_by UUID REFERENCES tenant.users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    campaign_image_url TEXT,
    campaign_banner_url TEXT,
    metadata JSONB DEFAULT '{}',

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_promo_campaigns_code ON rewards.promotional_campaigns(campaign_code);
CREATE INDEX idx_promo_campaigns_status ON rewards.promotional_campaigns(status);
CREATE INDEX idx_promo_campaigns_dates ON rewards.promotional_campaigns(start_date, end_date);
CREATE INDEX idx_promo_campaigns_active ON rewards.promotional_campaigns(status, start_date, end_date)
    WHERE status = 'active';

-- ============================================================================
-- Table: Promo Code Redemptions
-- ============================================================================

CREATE TABLE rewards.promo_code_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- References
    -- ========================================================================
    campaign_id UUID NOT NULL REFERENCES rewards.promotional_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,

    -- ========================================================================
    -- Redemption Details
    -- ========================================================================
    code_used VARCHAR(50) NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    cash_bonus DECIMAL(15,2) DEFAULT 0,
    bonus_percentage_applied DECIMAL(5,2),
    deposit_amount DECIMAL(15,2), -- Amount user deposited to qualify

    -- ========================================================================
    -- Status
    -- ========================================================================
    redemption_status VARCHAR(20) DEFAULT 'pending'
        CHECK (redemption_status IN ('pending', 'approved', 'awarded', 'rejected', 'expired')),
    rejection_reason TEXT,

    -- ========================================================================
    -- Fulfillment
    -- ========================================================================
    awarded_at TIMESTAMP,
    point_transaction_id INTEGER, -- References rewards.point_transactions
    wallet_transaction_id UUID, -- References wallet transaction if cash bonus

    -- ========================================================================
    -- Source Tracking
    -- ========================================================================
    redemption_source VARCHAR(50) DEFAULT 'registration',
        -- registration, in_app, first_deposit, etc.
    device_type VARCHAR(20),
    platform VARCHAR(20),
    ip_address INET,

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    metadata JSONB DEFAULT '{}',

    -- ========================================================================
    -- Constraints
    -- ========================================================================
    UNIQUE(campaign_id, user_id) -- One redemption per user per campaign (unless max_redemptions_per_user > 1)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_promo_redemptions_campaign_id ON rewards.promo_code_redemptions(campaign_id);
CREATE INDEX idx_promo_redemptions_user_id ON rewards.promo_code_redemptions(user_id);
CREATE INDEX idx_promo_redemptions_status ON rewards.promo_code_redemptions(redemption_status);
CREATE INDEX idx_promo_redemptions_redeemed_at ON rewards.promo_code_redemptions(redeemed_at DESC);

-- ============================================================================
-- Trigger: Update Timestamps
-- ============================================================================

CREATE TRIGGER trigger_update_campaigns_timestamp
    BEFORE UPDATE ON rewards.promotional_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

-- ============================================================================
-- Function: Validate Promo Code
-- ============================================================================
-- Checks if a promo code is valid and can be redeemed by a user
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.validate_promo_code(
    p_code VARCHAR(50),
    p_user_id UUID
)
RETURNS TABLE(
    is_valid BOOLEAN,
    campaign_id UUID,
    campaign_name VARCHAR(255),
    points_reward INTEGER,
    cash_bonus DECIMAL(15,2),
    error_message TEXT
) AS $$
DECLARE
    v_campaign RECORD;
    v_user RECORD;
    v_redemption_count INTEGER;
BEGIN
    -- Get campaign
    SELECT * INTO v_campaign
    FROM rewards.promotional_campaigns
    WHERE campaign_code = p_code;

    -- Campaign not found
    IF v_campaign IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR, 0, 0.00, 'Invalid promo code';
        RETURN;
    END IF;

    -- Check status
    IF v_campaign.status != 'active' THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            format('Campaign is %s', v_campaign.status);
        RETURN;
    END IF;

    -- Check dates
    IF CURRENT_TIMESTAMP < v_campaign.start_date THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            format('Campaign starts on %s', v_campaign.start_date::DATE);
        RETURN;
    END IF;

    IF CURRENT_TIMESTAMP > v_campaign.end_date THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            'Campaign has ended';
        RETURN;
    END IF;

    -- Check max redemptions
    IF v_campaign.max_redemptions IS NOT NULL AND
       v_campaign.current_redemptions >= v_campaign.max_redemptions THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            'Campaign redemption limit reached';
        RETURN;
    END IF;

    -- Get user details
    SELECT * INTO v_user
    FROM tenant.users
    WHERE id = p_user_id;

    -- Check user-specific redemption limit
    SELECT COUNT(*) INTO v_redemption_count
    FROM rewards.promo_code_redemptions
    WHERE campaign_id = v_campaign.id
      AND user_id = p_user_id;

    IF v_redemption_count >= v_campaign.max_redemptions_per_user THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            'You have already redeemed this campaign';
        RETURN;
    END IF;

    -- Check new users only
    IF v_campaign.new_users_only AND
       v_user.created_at < v_campaign.start_date THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            'This campaign is for new users only';
        RETURN;
    END IF;

    -- Check existing users only
    IF v_campaign.existing_users_only AND
       v_user.created_at >= v_campaign.start_date THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            'This campaign is for existing users only';
        RETURN;
    END IF;

    -- Check account age
    IF v_campaign.min_account_age_days IS NOT NULL AND
       v_user.created_at > CURRENT_TIMESTAMP - (v_campaign.min_account_age_days || ' days')::INTERVAL THEN
        RETURN QUERY SELECT false, v_campaign.id, v_campaign.campaign_name, 0, 0.00,
            format('Account must be at least %s days old', v_campaign.min_account_age_days);
        RETURN;
    END IF;

    -- Check user tier eligibility
    IF v_campaign.eligible_user_tiers IS NOT NULL THEN
        -- TODO: Check user's tier against eligible_user_tiers array
        NULL;
    END IF;

    -- All checks passed
    RETURN QUERY SELECT
        true,
        v_campaign.id,
        v_campaign.campaign_name,
        v_campaign.points_reward,
        v_campaign.bonus_cash,
        'Valid'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Redeem Promo Code
-- ============================================================================
-- Redeems a promotional code for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.redeem_promo_code(
    p_user_id UUID,
    p_code VARCHAR(50),
    p_deposit_amount DECIMAL(15,2) DEFAULT NULL,
    p_redemption_source VARCHAR(50) DEFAULT 'in_app'
)
RETURNS TABLE(
    success BOOLEAN,
    redemption_id UUID,
    points_awarded INTEGER,
    cash_bonus DECIMAL(15,2),
    message TEXT
) AS $$
DECLARE
    v_validation RECORD;
    v_campaign RECORD;
    v_redemption_id UUID;
    v_final_points INTEGER;
    v_final_cash DECIMAL(15,2);
    v_calculated_bonus DECIMAL(15,2);
BEGIN
    -- Validate code
    SELECT * INTO v_validation
    FROM rewards.validate_promo_code(p_code, p_user_id);

    IF NOT v_validation.is_valid THEN
        RETURN QUERY SELECT false, NULL::UUID, 0, 0.00, v_validation.error_message;
        RETURN;
    END IF;

    -- Get campaign details
    SELECT * INTO v_campaign
    FROM rewards.promotional_campaigns
    WHERE id = v_validation.campaign_id;

    -- Calculate rewards
    v_final_points := v_campaign.points_reward;

    -- Calculate percentage-based cash bonus
    IF v_campaign.bonus_percentage IS NOT NULL AND p_deposit_amount IS NOT NULL THEN
        v_calculated_bonus := (p_deposit_amount * v_campaign.bonus_percentage / 100);

        -- Cap at max_deposit_amount if specified
        IF v_campaign.max_deposit_amount IS NOT NULL THEN
            v_calculated_bonus := LEAST(
                v_calculated_bonus,
                v_campaign.max_deposit_amount * v_campaign.bonus_percentage / 100
            );
        END IF;

        v_final_cash := v_calculated_bonus;
    ELSE
        v_final_cash := v_campaign.bonus_cash;
    END IF;

    -- Create redemption record
    INSERT INTO rewards.promo_code_redemptions (
        campaign_id,
        user_id,
        code_used,
        points_awarded,
        cash_bonus,
        bonus_percentage_applied,
        deposit_amount,
        redemption_status,
        redemption_source
    ) VALUES (
        v_campaign.id,
        p_user_id,
        p_code,
        v_final_points,
        v_final_cash,
        v_campaign.bonus_percentage,
        p_deposit_amount,
        'approved', -- Auto-approve for now
        p_redemption_source
    )
    RETURNING id INTO v_redemption_id;

    -- Award points if any
    IF v_final_points > 0 THEN
        INSERT INTO rewards.point_transactions (
            user_id,
            points,
            transaction_type,
            action_type,
            description,
            metadata
        ) VALUES (
            p_user_id,
            v_final_points,
            'earn',
            'promo_code',
            format('Promotional campaign: %s', v_campaign.campaign_name),
            jsonb_build_object(
                'campaign_id', v_campaign.id,
                'campaign_code', p_code,
                'redemption_id', v_redemption_id
            )
        );

        -- Update user's total points
        UPDATE rewards.user_rewards
        SET total_points = total_points + v_final_points,
            lifetime_points = lifetime_points + v_final_points,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;

        -- Update redemption status
        UPDATE rewards.promo_code_redemptions
        SET redemption_status = 'awarded',
            awarded_at = CURRENT_TIMESTAMP
        WHERE id = v_redemption_id;
    END IF;

    -- Update campaign redemption count
    UPDATE rewards.promotional_campaigns
    SET current_redemptions = current_redemptions + 1
    WHERE id = v_campaign.id;

    -- Return success
    RETURN QUERY SELECT
        true,
        v_redemption_id,
        v_final_points,
        v_final_cash,
        format('Successfully redeemed %s', v_campaign.campaign_name)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get Campaign Statistics
-- ============================================================================
-- Returns performance metrics for a campaign
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.get_campaign_stats(p_campaign_id UUID)
RETURNS TABLE(
    total_redemptions BIGINT,
    total_points_awarded BIGINT,
    total_cash_awarded DECIMAL(15,2),
    avg_points_per_redemption DECIMAL(10,2),
    redemptions_today BIGINT,
    redemptions_this_week BIGINT,
    redemptions_this_month BIGINT,
    conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_redemptions,
        COALESCE(SUM(points_awarded), 0)::BIGINT AS total_points_awarded,
        COALESCE(SUM(cash_bonus), 0) AS total_cash_awarded,
        ROUND(COALESCE(AVG(points_awarded), 0), 2) AS avg_points_per_redemption,
        COUNT(*) FILTER (WHERE redeemed_at >= CURRENT_DATE)::BIGINT AS redemptions_today,
        COUNT(*) FILTER (WHERE redeemed_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT AS redemptions_this_week,
        COUNT(*) FILTER (WHERE redeemed_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT AS redemptions_this_month,
        CASE
            WHEN (SELECT max_redemptions FROM rewards.promotional_campaigns WHERE id = p_campaign_id) > 0
            THEN ROUND(
                (COUNT(*)::DECIMAL / (SELECT max_redemptions FROM rewards.promotional_campaigns WHERE id = p_campaign_id)) * 100,
                2
            )
            ELSE 0
        END AS conversion_rate
    FROM rewards.promo_code_redemptions
    WHERE campaign_id = p_campaign_id
      AND redemption_status IN ('approved', 'awarded');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Auto-Expire Old Campaigns
-- ============================================================================
-- Automatically sets ended campaigns to 'ended' status
-- Should be run via scheduled job
-- ============================================================================

CREATE OR REPLACE FUNCTION rewards.auto_expire_campaigns()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE rewards.promotional_campaigns
    SET status = 'ended',
        updated_at = CURRENT_TIMESTAMP
    WHERE status IN ('active', 'scheduled', 'paused')
      AND end_date < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Sample Campaigns (Optional - for testing)
-- ============================================================================

INSERT INTO rewards.promotional_campaigns (
    campaign_code,
    campaign_name,
    description,
    event_name,
    points_reward,
    bonus_cash,
    max_redemptions,
    max_redemptions_per_user,
    start_date,
    end_date,
    status,
    new_users_only,
    terms_and_conditions
) VALUES
(
    'WELCOME2025',
    'Welcome Bonus 2025',
    'New users get 1000 bonus points on registration',
    'New User Welcome',
    1000,
    0,
    10000,
    1,
    '2025-01-01 00:00:00',
    '2025-12-31 23:59:59',
    'active',
    true,
    'Valid for new users only. Points awarded upon successful registration and KYC verification.'
),
(
    'NEWYEAR50',
    'New Year 50% Deposit Bonus',
    'Get 50% bonus on your first deposit up to ₦10,000',
    'New Year Promotion',
    0,
    0,
    5000,
    1,
    '2025-01-01 00:00:00',
    '2025-01-31 23:59:59',
    'active',
    false,
    'Deposit minimum ₦5,000 to qualify. Bonus capped at ₦5,000 (50% of ₦10,000 max deposit).'
);

-- Set bonus percentage for second campaign
UPDATE rewards.promotional_campaigns
SET bonus_percentage = 50.00,
    min_deposit_amount = 5000.00,
    max_deposit_amount = 10000.00
WHERE campaign_code = 'NEWYEAR50';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    v_campaigns_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_campaigns_count FROM rewards.promotional_campaigns;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'PROMOTIONAL CAMPAIGNS MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Tables created: 2';
    RAISE NOTICE '  - rewards.promotional_campaigns';
    RAISE NOTICE '  - rewards.promo_code_redemptions';
    RAISE NOTICE 'Functions created: 4';
    RAISE NOTICE 'Triggers created: 1';
    RAISE NOTICE 'Indexes created: 8';
    RAISE NOTICE 'Sample campaigns created: %', v_campaigns_count;
    RAISE NOTICE '============================================================';
END $$;
