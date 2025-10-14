-- ============================================================================
-- REFERRAL SYSTEM: Referral Shares Tracking
-- ============================================================================
-- Purpose: Track all referral code sharing activities for analytics
-- Created: October 5, 2025
-- Phase: 1.3 - Referral Sharing Audit
-- ============================================================================

CREATE TABLE tenant.referral_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- User and Code
    -- ========================================================================
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(12) NOT NULL,

    -- ========================================================================
    -- Share Method and Destination
    -- ========================================================================
    share_method VARCHAR(20) NOT NULL
        CHECK (share_method IN (
            'sms',
            'email',
            'whatsapp',
            'telegram',
            'copy_link',
            'social_facebook',
            'social_twitter',
            'social_instagram',
            'social_linkedin',
            'qr_code'
        )),
    share_destination VARCHAR(255), -- phone number, email, or NULL for link copy

    -- ========================================================================
    -- Tracking URL and UTM Parameters
    -- ========================================================================
    tracking_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    utm_params JSONB DEFAULT '{}',

    -- ========================================================================
    -- Engagement Tracking
    -- ========================================================================
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0, -- How many shares led to registrations
    last_clicked_at TIMESTAMP,
    first_conversion_at TIMESTAMP,

    -- ========================================================================
    -- Device and Location
    -- ========================================================================
    device_type VARCHAR(20), -- mobile, tablet, desktop
    platform VARCHAR(20), -- ios, android, web
    browser VARCHAR(50),
    ip_address INET,
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_referral_shares_user_id ON tenant.referral_shares(user_id);
CREATE INDEX idx_referral_shares_code ON tenant.referral_shares(referral_code);
CREATE INDEX idx_referral_shares_method ON tenant.referral_shares(share_method);
CREATE INDEX idx_referral_shares_shared_at ON tenant.referral_shares(shared_at DESC);
CREATE INDEX idx_referral_shares_conversions ON tenant.referral_shares(conversions_count) WHERE conversions_count > 0;

-- Composite index for analytics
CREATE INDEX idx_referral_shares_user_method_date ON tenant.referral_shares(user_id, share_method, shared_at);

-- ============================================================================
-- Function: Record Referral Share
-- ============================================================================
-- Creates a share record and generates tracking URL
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.record_referral_share(
    p_user_id UUID,
    p_share_method VARCHAR(20),
    p_share_destination VARCHAR(255) DEFAULT NULL,
    p_device_type VARCHAR(20) DEFAULT NULL,
    p_platform VARCHAR(20) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    share_id UUID,
    tracking_url TEXT,
    referral_code VARCHAR(12)
) AS $$
DECLARE
    v_referral_code VARCHAR(12);
    v_share_id UUID;
    v_tracking_url TEXT;
    v_base_url TEXT := 'https://app.fmfb.com/register'; -- TODO: Make configurable per tenant
BEGIN
    -- Get user's referral code
    SELECT users.referral_code INTO v_referral_code
    FROM tenant.users
    WHERE id = p_user_id;

    IF v_referral_code IS NULL THEN
        RAISE EXCEPTION 'User does not have a referral code';
    END IF;

    -- Generate tracking URL with UTM parameters
    v_tracking_url := format(
        '%s?ref=%s&utm_source=%s&utm_medium=referral&utm_campaign=user_referral',
        v_base_url,
        v_referral_code,
        p_share_method
    );

    -- Create share record
    INSERT INTO tenant.referral_shares (
        user_id,
        referral_code,
        share_method,
        share_destination,
        tracking_url,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        platform,
        metadata
    ) VALUES (
        p_user_id,
        v_referral_code,
        p_share_method,
        p_share_destination,
        v_tracking_url,
        p_share_method,
        'referral',
        'user_referral',
        p_device_type,
        p_platform,
        p_metadata
    )
    RETURNING id INTO v_share_id;

    -- Return results
    RETURN QUERY SELECT v_share_id, v_tracking_url, v_referral_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Track Share Click
-- ============================================================================
-- Increments click count when tracking URL is accessed
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.track_share_click(
    p_tracking_url TEXT,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE tenant.referral_shares
    SET clicks_count = clicks_count + 1,
        last_clicked_at = CURRENT_TIMESTAMP
    WHERE tracking_url = p_tracking_url;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Track Share Conversion
-- ============================================================================
-- Increments conversion count when a share leads to registration
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.track_share_conversion(
    p_referral_code VARCHAR(12),
    p_utm_source VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    -- Update the most recent share record for this code and method
    UPDATE tenant.referral_shares
    SET conversions_count = conversions_count + 1,
        first_conversion_at = COALESCE(first_conversion_at, CURRENT_TIMESTAMP)
    WHERE referral_code = p_referral_code
      AND (p_utm_source IS NULL OR utm_source = p_utm_source)
      AND id = (
          SELECT id FROM tenant.referral_shares
          WHERE referral_code = p_referral_code
            AND (p_utm_source IS NULL OR utm_source = p_utm_source)
          ORDER BY shared_at DESC
          LIMIT 1
      );

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get Share Analytics
-- ============================================================================
-- Returns sharing statistics for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.get_share_analytics(p_user_id UUID)
RETURNS TABLE(
    total_shares BIGINT,
    total_clicks BIGINT,
    total_conversions BIGINT,
    conversion_rate DECIMAL(5,2),
    top_share_method VARCHAR(20),
    shares_last_7_days BIGINT,
    shares_last_30_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_shares,
        COALESCE(SUM(clicks_count), 0)::BIGINT AS total_clicks,
        COALESCE(SUM(conversions_count), 0)::BIGINT AS total_conversions,
        CASE
            WHEN COALESCE(SUM(clicks_count), 0) > 0
            THEN ROUND((COALESCE(SUM(conversions_count), 0)::DECIMAL / SUM(clicks_count)) * 100, 2)
            ELSE 0
        END AS conversion_rate,
        (
            SELECT share_method
            FROM tenant.referral_shares
            WHERE user_id = p_user_id
            GROUP BY share_method
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) AS top_share_method,
        COUNT(*) FILTER (WHERE shared_at >= CURRENT_TIMESTAMP - INTERVAL '7 days')::BIGINT AS shares_last_7_days,
        COUNT(*) FILTER (WHERE shared_at >= CURRENT_TIMESTAMP - INTERVAL '30 days')::BIGINT AS shares_last_30_days
    FROM tenant.referral_shares
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get Top Sharing Channels
-- ============================================================================
-- Returns most effective sharing channels across all users
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.get_top_sharing_channels()
RETURNS TABLE(
    share_method VARCHAR(20),
    total_shares BIGINT,
    total_clicks BIGINT,
    total_conversions BIGINT,
    conversion_rate DECIMAL(5,2),
    avg_clicks_per_share DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rs.share_method,
        COUNT(*)::BIGINT AS total_shares,
        COALESCE(SUM(rs.clicks_count), 0)::BIGINT AS total_clicks,
        COALESCE(SUM(rs.conversions_count), 0)::BIGINT AS total_conversions,
        CASE
            WHEN COALESCE(SUM(rs.clicks_count), 0) > 0
            THEN ROUND((COALESCE(SUM(rs.conversions_count), 0)::DECIMAL / SUM(rs.clicks_count)) * 100, 2)
            ELSE 0
        END AS conversion_rate,
        ROUND(COALESCE(AVG(rs.clicks_count), 0), 2) AS avg_clicks_per_share
    FROM tenant.referral_shares rs
    GROUP BY rs.share_method
    ORDER BY total_conversions DESC, total_clicks DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Update Referral on Conversion
-- ============================================================================
-- When a new referral is created, update the share conversion tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.update_share_on_referral_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Track conversion in the share record
    PERFORM tenant.track_share_conversion(
        NEW.referral_code,
        NEW.utm_source
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_share_on_referral
    AFTER INSERT ON tenant.referrals
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_share_on_referral_creation();

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'REFERRAL SHARES TABLE MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Table created: tenant.referral_shares';
    RAISE NOTICE 'Functions created: 5';
    RAISE NOTICE 'Triggers created: 1';
    RAISE NOTICE 'Indexes created: 6';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Share methods supported: 10';
    RAISE NOTICE '  - SMS, Email, WhatsApp, Telegram';
    RAISE NOTICE '  - Facebook, Twitter, Instagram, LinkedIn';
    RAISE NOTICE '  - Copy Link, QR Code';
    RAISE NOTICE '============================================================';
END $$;
