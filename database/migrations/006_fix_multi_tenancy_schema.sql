-- Multi-Tenancy Schema Fixes
-- Ensures all tenant-specific data is properly isolated and missing tables are created

-- ==================================================
-- 1. CREATE MISSING LOGIN_ATTEMPTS TABLE (TENANT SCOPE)
-- ==================================================

CREATE TABLE IF NOT EXISTS tenant.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    identifier VARCHAR(255) NOT NULL, -- email or username
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason VARCHAR(100),
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-tenancy enforcement
    FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_login_attempts_tenant_identifier (tenant_id, identifier),
    INDEX idx_login_attempts_tenant_ip (tenant_id, ip_address),
    INDEX idx_login_attempts_attempted_at (attempted_at)
);

-- ==================================================
-- 2. BILL PAYMENTS TABLES (TENANT SCOPE)
-- ==================================================

-- Bill Payment History (tenant-specific)
CREATE TABLE IF NOT EXISTS tenant.bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(200),
    amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'wallet',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-tenancy enforcement
    FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE,

    -- Constraints
    CHECK (amount > 0),
    CHECK (fees >= 0),
    CHECK (total_amount = amount + fees),
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Indexes
    INDEX idx_bill_payments_tenant_user (tenant_id, user_id),
    INDEX idx_bill_payments_reference (reference),
    INDEX idx_bill_payments_status (status),
    INDEX idx_bill_payments_created_at (created_at)
);

-- ==================================================
-- 3. ANALYTICS CACHE TABLES (TENANT SCOPE)
-- ==================================================

-- Dashboard analytics cache for performance
CREATE TABLE IF NOT EXISTS tenant.analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    cache_key VARCHAR(100) NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-tenancy enforcement
    FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE,

    -- Unique cache keys per tenant/user
    UNIQUE(tenant_id, user_id, cache_key),

    -- Indexes
    INDEX idx_analytics_cache_tenant_user (tenant_id, user_id),
    INDEX idx_analytics_cache_expires (expires_at)
);

-- ==================================================
-- 4. USER NOTIFICATION PREFERENCES (TENANT SCOPE)
-- ==================================================

-- Note: Notifications table already exists in tenant schema, but we need preferences
CREATE TABLE IF NOT EXISTS tenant.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
    notification_type VARCHAR(50) NOT NULL, -- transaction_alerts, balance_updates, etc.
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly, monthly
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-tenancy enforcement
    FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE,

    -- Unique preference per tenant/user/channel/type
    UNIQUE(tenant_id, user_id, channel, notification_type),

    -- Constraints
    CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),

    -- Indexes
    INDEX idx_notification_preferences_tenant_user (tenant_id, user_id),
    INDEX idx_notification_preferences_channel (channel)
);

-- ==================================================
-- 5. ACCOUNT MANAGEMENT ENHANCEMENTS (TENANT SCOPE)
-- ==================================================

-- Account access logs (tenant-specific)
CREATE TABLE IF NOT EXISTS tenant.account_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    wallet_id UUID,
    action VARCHAR(50) NOT NULL, -- view, update, freeze, unfreeze
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-tenancy enforcement
    FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_account_access_logs_tenant_user (tenant_id, user_id),
    INDEX idx_account_access_logs_wallet (wallet_id),
    INDEX idx_account_access_logs_created_at (created_at)
);

-- ==================================================
-- 6. PLATFORM-LEVEL TEMPLATES AND CONFIGURATIONS
-- ==================================================

-- Bill provider templates (platform-level, shared across tenants)
CREATE TABLE IF NOT EXISTS platform.bill_provider_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(50) UNIQUE NOT NULL,
    provider_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- electricity, water, internet, cable, etc.
    logo_url TEXT,
    validation_rules JSONB, -- account number format, etc.
    fee_structure JSONB, -- percentage, fixed, tiers
    api_config JSONB, -- integration configuration
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CHECK (category IN ('electricity', 'water', 'internet', 'cable', 'insurance', 'education', 'government')),

    -- Indexes
    INDEX idx_bill_provider_templates_category (category),
    INDEX idx_bill_provider_templates_active (is_active)
);

-- ==================================================
-- 7. DATA MIGRATION AND CLEANUP
-- ==================================================

-- Insert default bill providers if they don't exist
INSERT INTO platform.bill_provider_templates (provider_code, provider_name, category, validation_rules, fee_structure) VALUES
('IKEDC', 'Ikeja Electric', 'electricity', '{"account_length": {"min": 8, "max": 15}}', '{"type": "percentage", "rate": 0.01}'),
('EKEDC', 'Eko Electric', 'electricity', '{"account_length": {"min": 8, "max": 15}}', '{"type": "percentage", "rate": 0.01}'),
('AEDC', 'Abuja Electric', 'electricity', '{"account_length": {"min": 8, "max": 15}}', '{"type": "percentage", "rate": 0.01}'),
('PHEDC', 'Port Harcourt Electric', 'electricity', '{"account_length": {"min": 8, "max": 15}}', '{"type": "percentage", "rate": 0.01}'),
('MTN', 'MTN Nigeria', 'internet', '{"account_length": {"min": 10, "max": 11}}', '{"type": "fixed", "amount": 50}'),
('AIRTEL', 'Airtel Nigeria', 'internet', '{"account_length": {"min": 10, "max": 11}}', '{"type": "fixed", "amount": 50}'),
('GLO', 'Globacom Nigeria', 'internet', '{"account_length": {"min": 10, "max": 11}}', '{"type": "fixed", "amount": 50}'),
('DSTV', 'DStv', 'cable', '{"account_length": {"min": 8, "max": 12}}', '{"type": "percentage", "rate": 0.015}'),
('GOTV', 'GOtv', 'cable', '{"account_length": {"min": 8, "max": 12}}', '{"type": "percentage", "rate": 0.015}')
ON CONFLICT (provider_code) DO NOTHING;

-- ==================================================
-- 8. UPDATE TRIGGERS FOR TIMESTAMP MANAGEMENT
-- ==================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_bill_payments_updated_at
    BEFORE UPDATE ON tenant.bill_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON tenant.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_provider_templates_updated_at
    BEFORE UPDATE ON platform.bill_provider_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 9. GRANT PROPER PERMISSIONS
-- ==================================================

-- Grant permissions to application user (adjust username as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA tenant TO bisiadedokun;
GRANT SELECT ON ALL TABLES IN SCHEMA platform TO bisiadedokun;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA tenant TO bisiadedokun;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA platform TO bisiadedokun;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bisiadedokun;
ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT SELECT ON TABLES TO bisiadedokun;

COMMENT ON SCHEMA tenant IS 'Tenant-specific data - isolated per tenant';
COMMENT ON SCHEMA platform IS 'Platform-level shared data - templates, configurations, and cross-tenant utilities';

-- Migration completed
SELECT 'Multi-tenancy schema migration completed successfully' AS status;