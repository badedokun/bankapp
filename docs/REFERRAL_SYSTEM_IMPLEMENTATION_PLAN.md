# Referral System Implementation Plan
**Version**: 1.0
**Branch**: feature/reward-system
**Start Date**: October 5, 2025
**Status**: In Progress

---

## 🎯 Objectives

Extend the current rewards system to include comprehensive referral functionality that meets all requirements from the Referral System Requirements Document.

### **Key Goals**:
1. ✅ Referral code generation and assignment
2. ✅ Code sharing functionality (SMS/Email/Social)
3. ✅ Referral tracking and relationship mapping
4. ✅ Configurable referral bonuses based on account status
5. ✅ Promotional campaign system
6. ✅ Aggregator/influencer program
7. ✅ Admin dashboard for management
8. ✅ Fraud detection and security

---

## 📋 Phase 1: Database Schema Extensions (Week 1)

### **1.1 User Profile Extensions**

**Migration**: `create_referral_user_extensions.sql`

```sql
-- Add referral code and account status to users table
ALTER TABLE tenant.users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'registered'
    CHECK (account_status IN ('registered', 'kyc_pending', 'kyc_verified', 'funded', 'active', 'suspended')),
ADD COLUMN IF NOT EXISTS initial_deposit_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS initial_deposit_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS referral_opt_in BOOLEAN DEFAULT true;

-- Create index for fast referral code lookup
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON tenant.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON tenant.users(account_status);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION tenant.generate_referral_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    code VARCHAR(12);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (uppercase)
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM tenant.users WHERE referral_code = code) INTO exists;

        -- Return if unique
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on user creation
CREATE OR REPLACE FUNCTION tenant.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := tenant.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_referral_code
    BEFORE INSERT ON tenant.users
    FOR EACH ROW
    EXECUTE FUNCTION tenant.auto_generate_referral_code();

-- Backfill referral codes for existing users
UPDATE tenant.users
SET referral_code = tenant.generate_referral_code()
WHERE referral_code IS NULL;
```

### **1.2 Enhanced Referrals Table**

**Migration**: `enhance_referrals_table.sql`

```sql
-- Drop existing referrals table if basic version exists
DROP TABLE IF EXISTS tenant.referrals CASCADE;

-- Create comprehensive referrals table
CREATE TABLE tenant.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationship
    referrer_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(12) NOT NULL,

    -- Source tracking
    referral_source VARCHAR(50), -- direct, aggregator, promo_campaign
    aggregator_id UUID, -- NULL for standard referrals
    campaign_id UUID, -- NULL for standard referrals

    -- Bonus tracking
    bonus_type VARCHAR(20) DEFAULT 'standard' CHECK (bonus_type IN ('standard', 'aggregator', 'promotional')),
    bonus_points INTEGER DEFAULT 0,
    bonus_cash DECIMAL(15,2) DEFAULT 0,
    bonus_status VARCHAR(20) DEFAULT 'pending' CHECK (bonus_status IN ('pending', 'awarded', 'expired', 'cancelled')),
    bonus_awarded_at TIMESTAMP,

    -- Referee status tracking
    referee_account_status VARCHAR(20) DEFAULT 'registered',
    referee_kyc_completed BOOLEAN DEFAULT false,
    referee_kyc_completed_at TIMESTAMP,
    referee_funded BOOLEAN DEFAULT false,
    referee_funded_amount DECIMAL(15,2) DEFAULT 0,
    referee_funded_at TIMESTAMP,
    referee_active BOOLEAN DEFAULT false,
    referee_activated_at TIMESTAMP,

    -- Eligibility and expiration
    eligible_for_bonus BOOLEAN DEFAULT false,
    eligibility_checked_at TIMESTAMP,
    expires_at TIMESTAMP, -- 90 days from registration

    -- Metadata
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id),
    CONSTRAINT unique_referee UNIQUE (referee_id)
);

-- Indexes
CREATE INDEX idx_referrals_referrer_id ON tenant.referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON tenant.referrals(referee_id);
CREATE INDEX idx_referrals_code ON tenant.referrals(referral_code);
CREATE INDEX idx_referrals_bonus_status ON tenant.referrals(bonus_status);
CREATE INDEX idx_referrals_created_at ON tenant.referrals(created_at);

-- Update timestamp trigger
CREATE TRIGGER trigger_update_referrals_timestamp
    BEFORE UPDATE ON tenant.referrals
    FOR EACH ROW
    EXECUTE FUNCTION tenant.update_updated_at_column();
```

### **1.3 Referral Sharing Audit**

**Migration**: `create_referral_shares_table.sql`

```sql
CREATE TABLE tenant.referral_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(12) NOT NULL,

    -- Share method and destination
    share_method VARCHAR(20) NOT NULL CHECK (share_method IN ('sms', 'email', 'whatsapp', 'telegram', 'copy_link', 'social_facebook', 'social_twitter', 'social_instagram')),
    share_destination VARCHAR(255), -- phone number, email, or NULL for link copy

    -- Tracking
    tracking_url TEXT,
    utm_params JSONB DEFAULT '{}',
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,

    -- Timestamps
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_clicked_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_referral_shares_user_id ON tenant.referral_shares(user_id);
CREATE INDEX idx_referral_shares_code ON tenant.referral_shares(referral_code);
CREATE INDEX idx_referral_shares_method ON tenant.referral_shares(share_method);
CREATE INDEX idx_referral_shares_shared_at ON tenant.referral_shares(shared_at);
```

### **1.4 Promotional Campaigns**

**Migration**: `create_promotional_campaigns.sql`

```sql
CREATE TABLE rewards.promotional_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Campaign details
    campaign_code VARCHAR(50) UNIQUE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    event_name VARCHAR(255),

    -- Rewards
    points_reward INTEGER DEFAULT 0,
    bonus_cash DECIMAL(15,2) DEFAULT 0,
    bonus_percentage DECIMAL(5,2), -- e.g., 10.00 for 10% bonus

    -- Limits
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    max_redemptions_per_user INTEGER DEFAULT 1,

    -- Schedule
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'ended', 'cancelled')),

    -- Eligibility criteria
    min_deposit_amount DECIMAL(15,2),
    eligible_user_tiers TEXT[], -- ['silver', 'gold', 'platinum']
    eligible_regions TEXT[], -- ['NG', 'GH', 'KE']
    new_users_only BOOLEAN DEFAULT false,

    -- Terms
    terms_and_conditions TEXT,
    terms_url TEXT,

    -- Distribution
    distribution_channels TEXT[] DEFAULT ARRAY['in_app', 'email', 'sms'],

    -- Metadata
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_promo_campaigns_code ON rewards.promotional_campaigns(campaign_code);
CREATE INDEX idx_promo_campaigns_status ON rewards.promotional_campaigns(status);
CREATE INDEX idx_promo_campaigns_dates ON rewards.promotional_campaigns(start_date, end_date);

-- Redemptions table
CREATE TABLE rewards.promo_code_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    campaign_id UUID NOT NULL REFERENCES rewards.promotional_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,

    -- Redemption details
    code_used VARCHAR(50) NOT NULL,
    points_awarded INTEGER DEFAULT 0,
    cash_bonus DECIMAL(15,2) DEFAULT 0,

    -- Status
    redemption_status VARCHAR(20) DEFAULT 'pending' CHECK (redemption_status IN ('pending', 'approved', 'awarded', 'rejected')),
    rejection_reason TEXT,

    -- Timestamps
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_at TIMESTAMP,

    -- Metadata
    redemption_source VARCHAR(50), -- registration, in_app, etc.
    metadata JSONB DEFAULT '{}',

    -- Constraints
    UNIQUE(campaign_id, user_id)
);

-- Indexes
CREATE INDEX idx_promo_redemptions_campaign_id ON rewards.promo_code_redemptions(campaign_id);
CREATE INDEX idx_promo_redemptions_user_id ON rewards.promo_code_redemptions(user_id);
CREATE INDEX idx_promo_redemptions_status ON rewards.promo_code_redemptions(redemption_status);
```

### **1.5 Aggregator/Influencer Program**

**Migration**: `create_aggregator_program.sql`

```sql
-- Create aggregators schema
CREATE SCHEMA IF NOT EXISTS aggregators;

-- Aggregator partners table
CREATE TABLE aggregators.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Partner details
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),

    -- Custom referral code
    custom_code VARCHAR(50) UNIQUE NOT NULL,

    -- Compensation
    compensation_tier_id UUID,
    compensation_type VARCHAR(20) DEFAULT 'per_referral' CHECK (compensation_type IN ('per_referral', 'percentage', 'tiered')),
    base_rate DECIMAL(15,2), -- Amount per referral or base percentage

    -- Performance tracking
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    funded_referrals INTEGER DEFAULT 0,
    total_compensation_earned DECIMAL(15,2) DEFAULT 0,
    total_compensation_paid DECIMAL(15,2) DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended', 'terminated')),

    -- Contract details
    contract_start_date DATE,
    contract_end_date DATE,
    contract_document_url TEXT,

    -- Banking details (for payouts)
    bank_name VARCHAR(255),
    account_number VARCHAR(20),
    account_name VARCHAR(255),

    -- Metadata
    social_media JSONB DEFAULT '{}', -- {twitter: '@username', instagram: '@username'}
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compensation tiers
CREATE TABLE aggregators.compensation_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tier details
    tier_name VARCHAR(100) NOT NULL,
    tier_level INTEGER NOT NULL,

    -- Thresholds
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER, -- NULL for highest tier

    -- Compensation rates
    payment_per_referral DECIMAL(15,2),
    payment_per_1000 DECIMAL(15,2),
    percentage_of_revenue DECIMAL(5,2),

    -- Bonus
    tier_bonus DECIMAL(15,2) DEFAULT 0, -- One-time bonus on reaching tier

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tier_level)
);

-- Insert default compensation tiers
INSERT INTO aggregators.compensation_tiers (tier_name, tier_level, min_referrals, max_referrals, payment_per_referral, tier_bonus) VALUES
('Starter', 1, 0, 99, 500.00, 0),
('Bronze', 2, 100, 499, 750.00, 10000.00),
('Silver', 3, 500, 999, 1000.00, 50000.00),
('Gold', 4, 1000, 4999, 1250.00, 100000.00),
('Platinum', 5, 5000, NULL, 1500.00, 500000.00);

-- Payouts table
CREATE TABLE aggregators.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Partner reference
    partner_id UUID NOT NULL REFERENCES aggregators.partners(id) ON DELETE CASCADE,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_label VARCHAR(50), -- 'January 2025', 'Q1 2025'

    -- Metrics
    referral_count INTEGER DEFAULT 0,
    active_count INTEGER DEFAULT 0,
    funded_count INTEGER DEFAULT 0,

    -- Compensation calculation
    compensation_tier VARCHAR(100),
    base_compensation DECIMAL(15,2) DEFAULT 0,
    bonus_compensation DECIMAL(15,2) DEFAULT 0,
    total_compensation DECIMAL(15,2) DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),

    -- Approval workflow
    submitted_by UUID,
    submitted_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,

    -- Payment
    paid_at TIMESTAMP,
    payment_reference VARCHAR(255),
    payment_method VARCHAR(50), -- bank_transfer, check, etc.

    -- Metadata
    calculation_details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_aggregators_partners_code ON aggregators.partners(custom_code);
CREATE INDEX idx_aggregators_partners_status ON aggregators.partners(status);
CREATE INDEX idx_aggregators_payouts_partner_id ON aggregators.payouts(partner_id);
CREATE INDEX idx_aggregators_payouts_status ON aggregators.payouts(status);
CREATE INDEX idx_aggregators_payouts_period ON aggregators.payouts(period_start, period_end);
```

### **1.6 Referral Configuration**

**Migration**: `create_referral_configuration.sql`

```sql
CREATE TABLE rewards.referral_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Standard referral rewards
    standard_referral_points INTEGER DEFAULT 500,
    standard_referral_cash DECIMAL(15,2) DEFAULT 0,
    referee_welcome_points INTEGER DEFAULT 100, -- Bonus for new user

    -- Eligibility criteria
    require_kyc_verification BOOLEAN DEFAULT true,
    require_minimum_deposit BOOLEAN DEFAULT true,
    minimum_deposit_amount DECIMAL(15,2) DEFAULT 5000.00,
    eligibility_grace_period_days INTEGER DEFAULT 90,

    -- Limits
    max_referrals_per_user INTEGER DEFAULT 100,
    max_referrals_per_day INTEGER DEFAULT 10,
    max_share_actions_per_hour INTEGER DEFAULT 5,

    -- Tier bonuses (multipliers)
    bronze_tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    silver_tier_multiplier DECIMAL(3,2) DEFAULT 1.50,
    gold_tier_multiplier DECIMAL(3,2) DEFAULT 2.00,
    platinum_tier_multiplier DECIMAL(3,2) DEFAULT 2.50,
    diamond_tier_multiplier DECIMAL(3,2) DEFAULT 3.00,

    -- Terms and conditions
    terms_version VARCHAR(20) DEFAULT '1.0',
    terms_last_updated TIMESTAMP,
    terms_url TEXT,

    -- Feature flags
    enable_referral_program BOOLEAN DEFAULT true,
    enable_code_sharing BOOLEAN DEFAULT true,
    enable_aggregator_program BOOLEAN DEFAULT false,
    enable_promotional_campaigns BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id)
);

-- Insert default configuration for FMFB tenant
INSERT INTO rewards.referral_configuration (tenant_id)
SELECT id FROM platform.tenants WHERE subdomain = 'fmfb'
ON CONFLICT (tenant_id) DO NOTHING;
```

---

## 📋 Phase 2: Backend Services (Week 2)

### **2.1 ReferralService**

**File**: `server/services/ReferralService.ts`

**Responsibilities**:
- Generate and validate referral codes
- Record referral relationships
- Track referral eligibility
- Award referral bonuses
- Get referral statistics

**Key Methods**:
```typescript
class ReferralService {
  async generateReferralCode(userId: string): Promise<string>;
  async getUserReferralCode(userId: string): Promise<string>;
  async validateReferralCode(code: string): Promise<ValidationResult>;
  async recordReferral(refereeId: string, referralCode: string, metadata: any): Promise<Referral>;
  async checkReferralEligibility(referralId: string): Promise<EligibilityResult>;
  async awardReferralBonus(referralId: string): Promise<BonusResult>;
  async getReferralStats(userId: string): Promise<ReferralStats>;
  async getReferralHistory(userId: string, options: PaginationOptions): Promise<Referral[]>;
}
```

### **2.2 PromoCodeService**

**File**: `server/services/PromoCodeService.ts`

**Responsibilities**:
- Create and manage promotional campaigns
- Validate promo codes
- Track redemptions
- Calculate campaign performance

**Key Methods**:
```typescript
class PromoCodeService {
  async createCampaign(data: CampaignData): Promise<Campaign>;
  async updateCampaign(id: string, data: Partial<CampaignData>): Promise<Campaign>;
  async validatePromoCode(code: string): Promise<Campaign | null>;
  async redeemPromoCode(userId: string, code: string): Promise<RedemptionResult>;
  async getCampaignStats(campaignId: string): Promise<CampaignStats>;
  async getActiveCampaigns(): Promise<Campaign[]>;
  async expireOldCampaigns(): Promise<number>;
}
```

### **2.3 AggregatorService**

**File**: `server/services/AggregatorService.ts`

**Responsibilities**:
- Manage aggregator partners
- Track aggregator performance
- Calculate compensation
- Generate payout reports

**Key Methods**:
```typescript
class AggregatorService {
  async createAggregator(data: AggregatorData): Promise<Aggregator>;
  async updateAggregator(id: string, data: Partial<AggregatorData>): Promise<Aggregator>;
  async assignCustomCode(aggregatorId: string, code: string): Promise<void>;
  async getAggregatorPerformance(aggregatorId: string): Promise<Performance>;
  async calculateCompensation(aggregatorId: string, period: DateRange): Promise<CompensationResult>;
  async generatePayoutReport(aggregatorId: string, period: DateRange): Promise<PayoutReport>;
  async approvePayout(payoutId: string, approverId: string): Promise<Payout>;
  async processPayout(payoutId: string): Promise<PaymentResult>;
}
```

### **2.4 FraudDetectionService**

**File**: `server/services/FraudDetectionService.ts`

**Responsibilities**:
- Detect circular referrals
- Check velocity limits
- Validate device fingerprints
- Flag suspicious activity

**Key Methods**:
```typescript
class FraudDetectionService {
  async detectCircularReferrals(userId: string): Promise<boolean>;
  async checkVelocity(userId: string, action: string): Promise<VelocityCheck>;
  async validateDeviceFingerprint(userId: string, fingerprint: string): Promise<boolean>;
  async flagSuspiciousActivity(userId: string, reason: string, metadata: any): Promise<void>;
  async getSuspiciousReferrals(): Promise<Referral[]>;
}
```

---

## 📋 Phase 3: API Endpoints (Week 3)

### **3.1 Referral Management Endpoints**

**File**: `server/routes/referrals.ts`

```typescript
// User endpoints
GET    /api/referrals/my-code              // Get user's referral code
POST   /api/referrals/share                // Track code sharing
GET    /api/referrals/stats                // Get referral statistics
GET    /api/referrals/history              // Get referral history

// Validation endpoint (public)
POST   /api/referrals/validate             // Validate referral code

// Admin endpoints
GET    /api/referrals                      // List all referrals (paginated)
GET    /api/referrals/:id                  // Get referral details
PATCH  /api/referrals/:id/status           // Update referral status
POST   /api/referrals/:id/award-bonus      // Manually award bonus
GET    /api/referrals/suspicious           // Get flagged referrals
```

### **3.2 Promotional Campaign Endpoints**

**File**: `server/routes/promoCampaigns.ts`

```typescript
// User endpoints
GET    /api/campaigns/active               // Get active campaigns
POST   /api/campaigns/redeem               // Redeem promo code

// Admin endpoints
POST   /api/campaigns                      // Create campaign
GET    /api/campaigns                      // List campaigns
GET    /api/campaigns/:id                  // Get campaign details
PATCH  /api/campaigns/:id                  // Update campaign
DELETE /api/campaigns/:id                  // Cancel campaign
GET    /api/campaigns/:id/stats            // Campaign performance
POST   /api/campaigns/:id/activate         // Activate campaign
POST   /api/campaigns/:id/pause            // Pause campaign
```

### **3.3 Aggregator Management Endpoints**

**File**: `server/routes/aggregators.ts`

```typescript
// Admin endpoints only
POST   /api/aggregators                    // Create aggregator
GET    /api/aggregators                    // List aggregators
GET    /api/aggregators/:id                // Get aggregator details
PATCH  /api/aggregators/:id                // Update aggregator
DELETE /api/aggregators/:id                // Terminate aggregator
GET    /api/aggregators/:id/performance    // Performance metrics
POST   /api/aggregators/:id/assign-code    // Assign custom code
GET    /api/aggregators/:id/payouts        // Payout history
POST   /api/aggregators/payouts/generate   // Generate payouts for period
POST   /api/aggregators/payouts/:id/approve // Approve payout
POST   /api/aggregators/payouts/:id/pay    // Mark as paid
```

### **3.4 Referral Configuration Endpoints**

**File**: `server/routes/referralConfig.ts`

```typescript
// Admin endpoints only
GET    /api/referrals/config               // Get configuration
PATCH  /api/referrals/config               // Update configuration
GET    /api/referrals/config/history       // Configuration change history
```

---

## 📋 Phase 4: Frontend Integration (Week 4)

### **4.1 Registration Flow Update**

**File**: `src/screens/auth/RegistrationScreen.tsx`

**Changes**:
- Add optional "Referral Code" field
- Validate code in real-time
- Show referrer's name if code is valid
- Add optional "Promo Code" field
- Display promo code benefits

### **4.2 User Profile - Referral Section**

**File**: `src/screens/profile/ReferralScreen.tsx`

**Features**:
- Display user's referral code prominently
- Share buttons (SMS, Email, WhatsApp, Social, Copy Link)
- Referral statistics (total, pending, active)
- Referral history list
- Tier-based bonus information

### **4.3 Promotional Campaigns Screen**

**File**: `src/screens/promotions/PromotionsScreen.tsx`

**Features**:
- List active campaigns
- Campaign details modal
- Redeem code input
- Redemption success animation

### **4.4 Admin Dashboard**

**Files**: `src/screens/admin/referrals/*`

**Screens**:
- Referral Dashboard (KPIs, charts)
- Referral Configuration
- Aggregator Management
- Campaign Management
- Payout Management
- Reporting

---

## 📋 Implementation Checklist

### **Week 1: Database Foundation** ✅
- [ ] Create user profile extensions migration
- [ ] Create enhanced referrals table migration
- [ ] Create referral shares table migration
- [ ] Create promotional campaigns migration
- [ ] Create aggregator program migration
- [ ] Create referral configuration migration
- [ ] Test all migrations on dev database
- [ ] Backfill referral codes for existing users

### **Week 2: Backend Services** 🔄
- [ ] Implement ReferralService
- [ ] Implement PromoCodeService
- [ ] Implement AggregatorService
- [ ] Implement FraudDetectionService
- [ ] Write unit tests for all services
- [ ] Update RewardService to integrate with referrals

### **Week 3: API Layer** ⏳
- [ ] Create referral routes
- [ ] Create promo campaign routes
- [ ] Create aggregator routes
- [ ] Create config routes
- [ ] Add validation schemas (Zod)
- [ ] Add authorization middleware
- [ ] Write API integration tests

### **Week 4: Frontend** ⏳
- [ ] Update registration flow
- [ ] Create ReferralScreen
- [ ] Create PromotionsScreen
- [ ] Create admin dashboard screens
- [ ] Add share functionality
- [ ] Add deep linking support
- [ ] Write E2E tests

### **Week 5: Testing & Refinement** ⏳
- [ ] Integration testing
- [ ] Performance testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Deployment preparation

---

## 🎯 Success Metrics

### **Technical Metrics**:
- [ ] All database migrations run successfully
- [ ] 100% of services have unit tests (>80% coverage)
- [ ] All API endpoints return < 500ms
- [ ] Zero critical security vulnerabilities
- [ ] Mobile app builds successfully (iOS + Android)

### **Functional Metrics**:
- [ ] Users can generate and share referral codes
- [ ] Referral bonuses awarded correctly
- [ ] Promotional campaigns can be created and redeemed
- [ ] Aggregator performance tracked accurately
- [ ] Admin dashboard shows real-time data

### **Business Metrics** (Post-Launch):
- [ ] 20% of users share their referral code
- [ ] 10% referral conversion rate (code used → active account)
- [ ] 15% of new users come from referrals
- [ ] Average 1.5 referrals per active referrer

---

## 📝 Next Steps

1. **Review and Approve Plan** - Stakeholder sign-off
2. **Start Week 1** - Database migrations
3. **Daily Standups** - Track progress
4. **Weekly Demos** - Show working features
5. **Launch Preparation** - Week 5

---

**Document Status**: Draft
**Last Updated**: October 5, 2025
**Author**: Development Team
**Approvers**: Product, Engineering, Legal, Finance
