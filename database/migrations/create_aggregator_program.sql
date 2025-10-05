-- ============================================================================
-- REFERRAL SYSTEM: Aggregator/Influencer Program
-- ============================================================================
-- Purpose: Enable partnerships with aggregators and influencers
-- Created: October 5, 2025
-- Phase: 1.5 - Aggregator Program
-- ============================================================================

-- Create aggregators schema
CREATE SCHEMA IF NOT EXISTS aggregators;

-- ============================================================================
-- Table: Aggregator Partners
-- ============================================================================

CREATE TABLE aggregators.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Partner Details
    -- ========================================================================
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    contact_person VARCHAR(255),

    -- ========================================================================
    -- Custom Referral Code
    -- ========================================================================
    custom_code VARCHAR(50) UNIQUE NOT NULL,
    code_prefix VARCHAR(10), -- e.g., 'INFL' for influencers

    -- ========================================================================
    -- Compensation Configuration
    -- ========================================================================
    compensation_tier_id UUID, -- FK added later
    compensation_type VARCHAR(20) DEFAULT 'per_referral'
        CHECK (compensation_type IN ('per_referral', 'percentage', 'tiered', 'hybrid')),
    base_rate DECIMAL(15,2), -- Amount per referral or base percentage
    custom_rates JSONB DEFAULT '{}', -- Custom compensation structure

    -- ========================================================================
    -- Performance Tracking
    -- ========================================================================
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    funded_referrals INTEGER DEFAULT 0,
    pending_referrals INTEGER DEFAULT 0,

    -- ========================================================================
    -- Compensation Tracking
    -- ========================================================================
    total_compensation_earned DECIMAL(15,2) DEFAULT 0,
    total_compensation_paid DECIMAL(15,2) DEFAULT 0,
    pending_compensation DECIMAL(15,2) DEFAULT 0,

    -- ========================================================================
    -- Status
    -- ========================================================================
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'paused', 'suspended', 'terminated')),
    status_reason TEXT,

    -- ========================================================================
    -- Contract Details
    -- ========================================================================
    contract_start_date DATE,
    contract_end_date DATE,
    contract_document_url TEXT,
    contract_type VARCHAR(50), -- 'fixed_term', 'ongoing', 'campaign_based'

    -- ========================================================================
    -- Banking Details (for payouts)
    -- ========================================================================
    bank_name VARCHAR(255),
    account_number VARCHAR(20),
    account_name VARCHAR(255),
    bank_code VARCHAR(10),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',

    -- ========================================================================
    -- Social Media and Marketing
    -- ========================================================================
    social_media JSONB DEFAULT '{}', -- {twitter: '@username', instagram: '@username', etc.}
    website_url TEXT,
    audience_size INTEGER,
    niche VARCHAR(100), -- 'finance', 'tech', 'lifestyle', etc.

    -- ========================================================================
    -- KPIs and Targets
    -- ========================================================================
    monthly_target INTEGER, -- Target number of referrals per month
    quarterly_bonus DECIMAL(15,2), -- Bonus for hitting quarterly targets

    -- ========================================================================
    -- Approval Workflow
    -- ========================================================================
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    approval_notes TEXT,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    notes TEXT,
    tags TEXT[], -- ['influencer', 'corporate', 'high_value', etc.]
    metadata JSONB DEFAULT '{}',

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Table: Compensation Tiers
-- ============================================================================

CREATE TABLE aggregators.compensation_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Tier Details
    -- ========================================================================
    tier_name VARCHAR(100) NOT NULL,
    tier_level INTEGER NOT NULL UNIQUE,
    tier_description TEXT,

    -- ========================================================================
    -- Thresholds
    -- ========================================================================
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER, -- NULL for highest tier

    -- ========================================================================
    -- Compensation Rates
    -- ========================================================================
    payment_per_referral DECIMAL(15,2),
    payment_per_active_referral DECIMAL(15,2), -- Bonus for active accounts
    payment_per_funded_referral DECIMAL(15,2), -- Bonus for funded accounts
    payment_per_1000 DECIMAL(15,2), -- Bulk rate per 1000 referrals
    percentage_of_revenue DECIMAL(5,2), -- Revenue share percentage

    -- ========================================================================
    -- Tier Bonus
    -- ========================================================================
    tier_bonus DECIMAL(15,2) DEFAULT 0, -- One-time bonus on reaching tier
    tier_bonus_paid BOOLEAN DEFAULT false,

    -- ========================================================================
    -- Benefits
    -- ========================================================================
    benefits TEXT[], -- ['Priority support', 'Dedicated account manager', etc.]

    -- ========================================================================
    -- Timestamps
    -- ========================================================================
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default compensation tiers
INSERT INTO aggregators.compensation_tiers (
    tier_name,
    tier_level,
    tier_description,
    min_referrals,
    max_referrals,
    payment_per_referral,
    payment_per_active_referral,
    payment_per_funded_referral,
    tier_bonus,
    benefits
) VALUES
(
    'Starter',
    1,
    'Entry level aggregator tier',
    0,
    99,
    500.00,
    250.00,
    250.00,
    0,
    ARRAY['Basic support', 'Monthly reports']
),
(
    'Bronze',
    2,
    'Bronze aggregator tier with enhanced rates',
    100,
    499,
    750.00,
    375.00,
    375.00,
    10000.00,
    ARRAY['Priority support', 'Weekly reports', 'Marketing materials']
),
(
    'Silver',
    3,
    'Silver aggregator tier with premium rates',
    500,
    999,
    1000.00,
    500.00,
    500.00,
    50000.00,
    ARRAY['Dedicated support', 'Daily reports', 'Custom marketing', 'Quarterly bonus']
),
(
    'Gold',
    4,
    'Gold aggregator tier for high performers',
    1000,
    4999,
    1250.00,
    625.00,
    625.00,
    100000.00,
    ARRAY['Account manager', 'Real-time dashboard', 'Co-branded materials', 'Revenue share']
),
(
    'Platinum',
    5,
    'Platinum aggregator tier for top partners',
    5000,
    NULL,
    1500.00,
    750.00,
    750.00,
    500000.00,
    ARRAY['Executive support', 'Custom integrations', 'Joint campaigns', 'Performance bonuses']
);

-- ============================================================================
-- Add Foreign Key Constraints
-- ============================================================================
-- Add after all tables are created to avoid ordering issues

ALTER TABLE aggregators.partners
ADD CONSTRAINT fk_partners_compensation_tier
FOREIGN KEY (compensation_tier_id) REFERENCES aggregators.compensation_tiers(id);

-- ============================================================================
-- Table: Aggregator Payouts
-- ============================================================================

CREATE TABLE aggregators.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- ========================================================================
    -- Partner Reference
    -- ========================================================================
    partner_id UUID NOT NULL REFERENCES aggregators.partners(id) ON DELETE CASCADE,

    -- ========================================================================
    -- Period
    -- ========================================================================
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_label VARCHAR(50), -- 'January 2025', 'Q1 2025', 'Week 1 Oct'
    period_type VARCHAR(20) DEFAULT 'monthly'
        CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'annual', 'custom')),

    -- ========================================================================
    -- Metrics
    -- ========================================================================
    referral_count INTEGER DEFAULT 0,
    active_count INTEGER DEFAULT 0,
    funded_count INTEGER DEFAULT 0,
    new_referrals_this_period INTEGER DEFAULT 0,

    -- ========================================================================
    -- Compensation Calculation
    -- ========================================================================
    compensation_tier VARCHAR(100),
    base_compensation DECIMAL(15,2) DEFAULT 0,
    bonus_compensation DECIMAL(15,2) DEFAULT 0,
    tier_bonus DECIMAL(15,2) DEFAULT 0,
    revenue_share DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    total_compensation DECIMAL(15,2) DEFAULT 0,

    -- ========================================================================
    -- Calculation Details
    -- ========================================================================
    calculation_formula TEXT,
    calculation_breakdown JSONB DEFAULT '{}',

    -- ========================================================================
    -- Status
    -- ========================================================================
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('draft', 'pending', 'submitted', 'approved', 'rejected', 'paid', 'cancelled')),

    -- ========================================================================
    -- Approval Workflow
    -- ========================================================================
    submitted_by UUID,
    submitted_at TIMESTAMP,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,

    -- ========================================================================
    -- Payment
    -- ========================================================================
    payment_date DATE,
    payment_reference VARCHAR(255),
    payment_method VARCHAR(50),
    payment_proof_url TEXT,

    -- ========================================================================
    -- Metadata
    -- ========================================================================
    notes TEXT,
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

-- Partners indexes
CREATE INDEX idx_aggregators_partners_code ON aggregators.partners(custom_code);
CREATE INDEX idx_aggregators_partners_email ON aggregators.partners(email);
CREATE INDEX idx_aggregators_partners_status ON aggregators.partners(status);
CREATE INDEX idx_aggregators_partners_tier ON aggregators.partners(compensation_tier_id);

-- Payouts indexes
CREATE INDEX idx_aggregators_payouts_partner_id ON aggregators.payouts(partner_id);
CREATE INDEX idx_aggregators_payouts_status ON aggregators.payouts(status);
CREATE INDEX idx_aggregators_payouts_period ON aggregators.payouts(period_start, period_end);
CREATE INDEX idx_aggregators_payouts_payment_date ON aggregators.payouts(payment_date);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER trigger_update_partners_timestamp
    BEFORE UPDATE ON aggregators.partners
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

CREATE TRIGGER trigger_update_tiers_timestamp
    BEFORE UPDATE ON aggregators.compensation_tiers
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

CREATE TRIGGER trigger_update_payouts_timestamp
    BEFORE UPDATE ON aggregators.payouts
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();

-- ============================================================================
-- Function: Calculate Aggregator Compensation
-- ============================================================================

CREATE OR REPLACE FUNCTION aggregators.calculate_compensation(
    p_partner_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE(
    total_compensation DECIMAL(15,2),
    base_compensation DECIMAL(15,2),
    bonus_compensation DECIMAL(15,2),
    tier_bonus DECIMAL(15,2),
    referral_count INTEGER,
    active_count INTEGER,
    funded_count INTEGER,
    tier_name VARCHAR(100)
) AS $$
DECLARE
    v_partner RECORD;
    v_tier RECORD;
    v_referrals INTEGER;
    v_active INTEGER;
    v_funded INTEGER;
    v_base DECIMAL(15,2);
    v_bonus DECIMAL(15,2);
    v_tier_bonus DECIMAL(15,2);
    v_total DECIMAL(15,2);
BEGIN
    -- Get partner details
    SELECT * INTO v_partner FROM aggregators.partners WHERE id = p_partner_id;

    IF v_partner IS NULL THEN
        RAISE EXCEPTION 'Partner not found: %', p_partner_id;
    END IF;

    -- Count referrals in period
    SELECT
        COUNT(*) FILTER (WHERE created_at BETWEEN p_period_start AND p_period_end),
        COUNT(*) FILTER (WHERE referee_active AND created_at BETWEEN p_period_start AND p_period_end),
        COUNT(*) FILTER (WHERE referee_funded AND created_at BETWEEN p_period_start AND p_period_end)
    INTO v_referrals, v_active, v_funded
    FROM tenant.referrals
    WHERE aggregator_id = p_partner_id;

    -- Get compensation tier
    SELECT * INTO v_tier
    FROM aggregators.compensation_tiers
    WHERE id = v_partner.compensation_tier_id;

    -- Calculate base compensation
    v_base := COALESCE(
        (v_referrals * v_tier.payment_per_referral) +
        (v_active * v_tier.payment_per_active_referral) +
        (v_funded * v_tier.payment_per_funded_referral),
        0
    );

    -- Calculate bonus (10% of base for high performers)
    v_bonus := CASE
        WHEN v_partner.monthly_target IS NOT NULL AND v_referrals >= v_partner.monthly_target
        THEN v_base * 0.10
        ELSE 0
    END;

    -- Check tier bonus eligibility
    v_tier_bonus := CASE
        WHEN v_partner.total_referrals >= v_tier.min_referrals
             AND NOT v_tier.tier_bonus_paid
        THEN v_tier.tier_bonus
        ELSE 0
    END;

    v_total := v_base + v_bonus + v_tier_bonus;

    -- Return results
    RETURN QUERY SELECT
        v_total,
        v_base,
        v_bonus,
        v_tier_bonus,
        v_referrals,
        v_active,
        v_funded,
        v_tier.tier_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Generate Monthly Payouts
-- ============================================================================

CREATE OR REPLACE FUNCTION aggregators.generate_monthly_payouts(
    p_year INTEGER,
    p_month INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_partner RECORD;
    v_period_start DATE;
    v_period_end DATE;
    v_compensation RECORD;
    v_payout_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Calculate period
    v_period_start := make_date(p_year, p_month, 1);
    v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Loop through active partners
    FOR v_partner IN
        SELECT * FROM aggregators.partners WHERE status = 'active'
    LOOP
        -- Calculate compensation
        SELECT * INTO v_compensation
        FROM aggregators.calculate_compensation(
            v_partner.id,
            v_period_start,
            v_period_end
        );

        -- Only create payout if there's compensation to pay
        IF v_compensation.total_compensation > 0 THEN
            INSERT INTO aggregators.payouts (
                partner_id,
                period_start,
                period_end,
                period_label,
                period_type,
                referral_count,
                active_count,
                funded_count,
                compensation_tier,
                base_compensation,
                bonus_compensation,
                tier_bonus,
                total_compensation,
                status
            ) VALUES (
                v_partner.id,
                v_period_start,
                v_period_end,
                to_char(v_period_start, 'Month YYYY'),
                'monthly',
                v_compensation.referral_count,
                v_compensation.active_count,
                v_compensation.funded_count,
                v_compensation.tier_name,
                v_compensation.base_compensation,
                v_compensation.bonus_compensation,
                v_compensation.tier_bonus,
                v_compensation.total_compensation,
                'pending'
            );

            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Approve Payout
-- ============================================================================

CREATE OR REPLACE FUNCTION aggregators.approve_payout(
    p_payout_id UUID,
    p_approver_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_payout RECORD;
BEGIN
    SELECT * INTO v_payout FROM aggregators.payouts WHERE id = p_payout_id;

    IF v_payout IS NULL THEN
        RAISE EXCEPTION 'Payout not found: %', p_payout_id;
    END IF;

    IF v_payout.status != 'pending' THEN
        RAISE EXCEPTION 'Payout is not in pending status';
    END IF;

    UPDATE aggregators.payouts
    SET status = 'approved',
        approved_by = p_approver_id,
        approved_at = CURRENT_TIMESTAMP,
        notes = COALESCE(p_notes, notes)
    WHERE id = p_payout_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    v_tiers_count INTEGER;
    v_partners_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tiers_count FROM aggregators.compensation_tiers;
    SELECT COUNT(*) INTO v_partners_count FROM aggregators.partners;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'AGGREGATOR PROGRAM MIGRATION COMPLETE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Schema created: aggregators';
    RAISE NOTICE 'Tables created: 3';
    RAISE NOTICE '  - aggregators.partners';
    RAISE NOTICE '  - aggregators.compensation_tiers';
    RAISE NOTICE '  - aggregators.payouts';
    RAISE NOTICE 'Default compensation tiers: %', v_tiers_count;
    RAISE NOTICE 'Functions created: 4';
    RAISE NOTICE 'Triggers created: 3';
    RAISE NOTICE 'Indexes created: 8';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Compensation Tiers:';
    RAISE NOTICE '  1. Starter (0-99 refs): ₦500/ref';
    RAISE NOTICE '  2. Bronze (100-499 refs): ₦750/ref + ₦10k bonus';
    RAISE NOTICE '  3. Silver (500-999 refs): ₦1,000/ref + ₦50k bonus';
    RAISE NOTICE '  4. Gold (1,000-4,999 refs): ₦1,250/ref + ₦100k bonus';
    RAISE NOTICE '  5. Platinum (5,000+ refs): ₦1,500/ref + ₦500k bonus';
    RAISE NOTICE '============================================================';
END $$;
