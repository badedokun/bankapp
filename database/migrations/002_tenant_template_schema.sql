-- Migration: 002_tenant_template_schema.sql
-- Description: Template schema for individual tenant databases
-- Version: 1.0
-- Date: 2025-09-04
-- Author: OrokiiPay Development Team

-- Note: This template will be applied to each tenant-specific database
-- Database naming convention: tenant_{tenant_name}_mt (e.g., tenant_bank_a_mt)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS tenant;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default search path
-- ALTER DATABASE will be handled by setup script with actual database name

-- Store tenant metadata in each database
CREATE TABLE tenant.tenant_metadata (
    tenant_id UUID NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    schema_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure only one record exists
    CONSTRAINT single_tenant CHECK (tenant_id IS NOT NULL),
    UNIQUE (tenant_id)
);

-- Tenant-specific users table
CREATE TABLE tenant.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Basic user information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    
    -- Role and permissions
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'super_agent', 'agent', 'merchant', 'viewer')) DEFAULT 'agent',
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'pending', 'locked')) DEFAULT 'pending',
    permissions JSONB NOT NULL DEFAULT '[]',
    
    -- Nigerian-specific information
    bvn VARCHAR(11) UNIQUE,
    nin VARCHAR(11) UNIQUE,
    
    -- AI preferences and behavioral data
    ai_preferences JSONB NOT NULL DEFAULT '{
        "assistant_enabled": true,
        "voice_commands": false,
        "language": "en",
        "personality_type": "professional",
        "privacy_level": "standard",
        "data_sharing": {
            "analytics": true,
            "model_improvement": true,
            "personalization": true
        }
    }'::jsonb,
    behavioral_profile JSONB NOT NULL DEFAULT '{}',
    risk_profile VARCHAR(20) DEFAULT 'medium' CHECK (risk_profile IN ('low', 'medium', 'high', 'critical')),
    
    -- Security and authentication
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Multi-factor authentication
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[],
    mfa_methods VARCHAR(50)[] DEFAULT ARRAY['sms'],
    
    -- Biometric authentication
    biometric_enabled BOOLEAN NOT NULL DEFAULT false,
    biometric_templates JSONB DEFAULT '{}',
    
    -- Profile and preferences
    profile_data JSONB NOT NULL DEFAULT '{
        "avatar_url": null,
        "timezone": "Africa/Lagos",
        "date_format": "DD/MM/YYYY",
        "currency_format": "₦#,##0.00"
    }'::jsonb,
    notification_preferences JSONB NOT NULL DEFAULT '{
        "email": true,
        "sms": true,
        "push": true,
        "in_app": true,
        "categories": {
            "transactions": true,
            "security": true,
            "marketing": false,
            "system": true
        }
    }'::jsonb,
    
    -- Location and device tracking
    last_known_location JSONB,
    registered_devices JSONB DEFAULT '[]',
    
    -- Compliance and KYC
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
    kyc_level INTEGER DEFAULT 1 CHECK (kyc_level BETWEEN 1 AND 3),
    kyc_documents JSONB DEFAULT '{}',
    kyc_completed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Ensure tenant isolation
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL)
);

-- Create indexes for performance
CREATE UNIQUE INDEX idx_users_email_tenant ON tenant.users(email, tenant_id);
CREATE UNIQUE INDEX idx_users_phone_tenant ON tenant.users(phone_number, tenant_id);
CREATE INDEX idx_users_status ON tenant.users(status);
CREATE INDEX idx_users_role ON tenant.users(role);
CREATE INDEX idx_users_risk_profile ON tenant.users(risk_profile);
CREATE INDEX idx_users_kyc_status ON tenant.users(kyc_status);
CREATE INDEX idx_users_created_at ON tenant.users(created_at);

-- User sessions for security tracking
CREATE TABLE tenant.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    
    -- Device and location information
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    geolocation JSONB,
    
    -- Session management
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT false,
    risk_score DECIMAL(5,2) DEFAULT 0,
    
    -- AI analysis of session
    ai_risk_assessment JSONB DEFAULT '{}'
);

CREATE INDEX idx_user_sessions_user ON tenant.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON tenant.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON tenant.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_suspicious ON tenant.user_sessions(is_suspicious) WHERE is_suspicious = true;

-- Enhanced transactions table with AI features
CREATE TABLE tenant.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    
    -- Transaction identification
    reference VARCHAR(50) UNIQUE NOT NULL,
    external_reference VARCHAR(100),
    batch_id UUID, -- For bulk transactions
    parent_transaction_id UUID REFERENCES tenant.transactions(id), -- For split/linked transactions
    
    -- Transaction details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase', 
        'balance_inquiry', 'account_opening', 'loan_payment', 'investment',
        'pos_payment', 'qr_payment', 'bulk_transfer'
    )),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    original_amount DECIMAL(15,2),
    original_currency VARCHAR(3),
    
    -- Description and metadata
    description TEXT,
    merchant_category VARCHAR(50),
    transaction_tags TEXT[],
    
    -- Recipient information (for transfers and payments)
    recipient_name VARCHAR(255),
    recipient_account VARCHAR(50),
    recipient_bank VARCHAR(100),
    recipient_bank_code VARCHAR(10),
    recipient_details JSONB DEFAULT '{}',
    
    -- Sender information (for incoming transfers)
    sender_name VARCHAR(255),
    sender_account VARCHAR(50),
    sender_bank VARCHAR(100),
    sender_details JSONB DEFAULT '{}',
    
    -- Status and processing
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'blocked', 
        'reversed', 'disputed', 'settled', 'expired'
    )),
    substatus VARCHAR(50), -- More detailed status information
    processing_details JSONB NOT NULL DEFAULT '{}',
    failure_reason TEXT,
    failure_code VARCHAR(50),
    
    -- AI-specific fields
    ai_initiated BOOLEAN NOT NULL DEFAULT false,
    voice_initiated BOOLEAN NOT NULL DEFAULT false,
    ai_confidence DECIMAL(5,4),
    natural_language_command TEXT,
    ai_processing_metadata JSONB DEFAULT '{}',
    ai_recommendations JSONB DEFAULT '{}',
    
    -- Fraud detection and risk assessment
    fraud_score DECIMAL(5,2),
    fraud_factors JSONB DEFAULT '{}',
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB DEFAULT '{}',
    compliance_flags TEXT[] DEFAULT '{}',
    
    -- Payment provider details
    payment_provider VARCHAR(50),
    payment_method VARCHAR(50), -- card, bank_transfer, mobile_money, etc.
    provider_transaction_id VARCHAR(100),
    provider_response JSONB DEFAULT '{}',
    provider_fees DECIMAL(15,2) DEFAULT 0,
    
    -- Fees and charges breakdown
    total_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    charges JSONB DEFAULT '{
        "base_fee": 0,
        "percentage_fee": 0,
        "vat": 0,
        "stamp_duty": 0,
        "other_charges": {}
    }'::jsonb,
    
    -- Location and device information
    transaction_location JSONB,
    device_info JSONB DEFAULT '{}',
    channel VARCHAR(50) DEFAULT 'mobile', -- mobile, web, api, ussd, atm
    
    -- Reconciliation and settlement
    settlement_date DATE,
    settlement_batch VARCHAR(100),
    reconciliation_status VARCHAR(20) DEFAULT 'pending',
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    settled_at TIMESTAMP,
    
    -- Compliance and audit
    compliance_checked BOOLEAN DEFAULT false,
    compliance_score DECIMAL(5,2),
    
    -- Ensure tenant isolation and positive amounts
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL),
    CONSTRAINT check_positive_amount CHECK (amount > 0)
);

-- Create indexes for optimal query performance
CREATE INDEX idx_transactions_tenant_user ON tenant.transactions(tenant_id, user_id);
CREATE INDEX idx_transactions_status ON tenant.transactions(status);
CREATE INDEX idx_transactions_type ON tenant.transactions(type);
CREATE INDEX idx_transactions_created_at ON tenant.transactions(created_at);
CREATE INDEX idx_transactions_reference ON tenant.transactions(reference);
CREATE INDEX idx_transactions_external_ref ON tenant.transactions(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX idx_transactions_fraud_score ON tenant.transactions(fraud_score) WHERE fraud_score IS NOT NULL;
CREATE INDEX idx_transactions_risk_level ON tenant.transactions(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_transactions_provider ON tenant.transactions(payment_provider);
CREATE INDEX idx_transactions_settlement ON tenant.transactions(settlement_date, reconciliation_status);
CREATE INDEX idx_transactions_amount_range ON tenant.transactions USING BTREE (amount);
CREATE INDEX idx_transactions_ai_initiated ON tenant.transactions(ai_initiated) WHERE ai_initiated = true;

-- Composite indexes for common query patterns
CREATE INDEX idx_transactions_user_status_date ON tenant.transactions(user_id, status, created_at);
CREATE INDEX idx_transactions_type_status_date ON tenant.transactions(type, status, created_at);

-- User wallets/accounts with AI insights
CREATE TABLE tenant.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Wallet identification
    wallet_number VARCHAR(20) UNIQUE NOT NULL,
    wallet_type VARCHAR(50) NOT NULL DEFAULT 'main' CHECK (wallet_type IN ('main', 'savings', 'business', 'investment')),
    wallet_name VARCHAR(100),
    
    -- Balance information
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    
    -- Multi-currency support
    foreign_balances JSONB DEFAULT '{}', -- {"USD": 100.50, "EUR": 75.25}
    
    -- Account limits and controls
    daily_limit DECIMAL(15,2) DEFAULT 500000,
    monthly_limit DECIMAL(15,2) DEFAULT 5000000,
    single_transaction_limit DECIMAL(15,2) DEFAULT 100000,
    minimum_balance DECIMAL(15,2) DEFAULT 0,
    
    -- AI-powered features and insights
    ai_insights JSONB DEFAULT '{
        "spending_patterns": {},
        "saving_recommendations": [],
        "fraud_alerts": [],
        "budget_analysis": {}
    }'::jsonb,
    predicted_balance DECIMAL(15,2),
    balance_prediction_date DATE,
    spending_categories JSONB DEFAULT '{}',
    financial_health_score DECIMAL(5,2),
    
    -- Behavioral finance insights
    spending_behavior JSONB DEFAULT '{
        "impulse_purchases": 0,
        "recurring_payments": [],
        "peak_spending_days": [],
        "average_transaction_size": 0
    }'::jsonb,
    
    -- Interest and rewards
    interest_rate DECIMAL(6,4) DEFAULT 0,
    reward_points INTEGER DEFAULT 0,
    cashback_earned DECIMAL(15,2) DEFAULT 0,
    
    -- Security and status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_frozen BOOLEAN NOT NULL DEFAULT false,
    freeze_reason VARCHAR(255),
    security_level VARCHAR(20) DEFAULT 'standard' CHECK (security_level IN ('basic', 'standard', 'premium', 'maximum')),
    
    -- Compliance and regulatory
    account_category VARCHAR(50) DEFAULT 'individual', -- individual, business, corporate
    regulatory_status VARCHAR(50) DEFAULT 'compliant',
    last_kyc_update TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    last_transaction_at TIMESTAMP,
    
    CONSTRAINT check_tenant_id CHECK (tenant_id IS NOT NULL),
    CONSTRAINT check_balance_positive CHECK (balance >= 0),
    CONSTRAINT check_available_balance CHECK (available_balance >= 0),
    UNIQUE(user_id, wallet_type)
);

CREATE INDEX idx_wallets_user_tenant ON tenant.wallets(user_id, tenant_id);
CREATE INDEX idx_wallets_type ON tenant.wallets(wallet_type);
CREATE INDEX idx_wallets_status ON tenant.wallets(is_active, is_frozen);
CREATE INDEX idx_wallets_balance ON tenant.wallets(balance);
CREATE INDEX idx_wallets_number ON tenant.wallets(wallet_number);

-- Wallet transactions ledger for detailed tracking
CREATE TABLE tenant.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES tenant.wallets(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES tenant.transactions(id),
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    
    -- Description and categorization
    description TEXT NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    
    -- Reference information
    reference VARCHAR(100),
    external_reference VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_amount_not_zero CHECK (amount != 0)
);

CREATE INDEX idx_wallet_transactions_wallet ON tenant.wallet_transactions(wallet_id, created_at);
CREATE INDEX idx_wallet_transactions_transaction ON tenant.wallet_transactions(transaction_id);
CREATE INDEX idx_wallet_transactions_type ON tenant.wallet_transactions(transaction_type);

-- AI conversation history (anonymized for model improvement)
CREATE TABLE ai.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    
    -- Conversation metadata
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    message_count INTEGER NOT NULL DEFAULT 0,
    
    -- AI performance metrics
    average_confidence DECIMAL(5,4),
    total_processing_time DECIMAL(10,2), -- milliseconds
    successful_resolution BOOLEAN,
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    escalated_to_human BOOLEAN NOT NULL DEFAULT false,
    
    -- Language and context
    primary_language VARCHAR(10) NOT NULL DEFAULT 'en',
    detected_languages JSONB DEFAULT '{}',
    intents_identified TEXT[],
    entities_extracted JSONB DEFAULT '{}',
    
    -- No actual conversation content stored for privacy
    conversation_summary TEXT, -- AI-generated summary without PII
    sentiment_analysis JSONB DEFAULT '{}',
    topics_discussed TEXT[],
    
    -- Outcome and actions
    actions_completed JSONB DEFAULT '[]',
    follow_up_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_date ON ai.conversations(user_id, started_at);
CREATE INDEX idx_conversations_session ON ai.conversations(session_id);
CREATE INDEX idx_conversations_satisfaction ON ai.conversations(user_satisfaction) WHERE user_satisfaction IS NOT NULL;
CREATE INDEX idx_conversations_escalated ON ai.conversations(escalated_to_human) WHERE escalated_to_human = true;

-- Individual conversation messages (temporary storage)
CREATE TABLE ai.conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai.conversations(id) ON DELETE CASCADE,
    
    -- Message details
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'audio', 'image')),
    
    -- AI processing information
    intent VARCHAR(100),
    confidence DECIMAL(5,4),
    entities JSONB DEFAULT '{}',
    processing_time DECIMAL(8,2), -- milliseconds
    
    -- Message metadata
    language VARCHAR(10) DEFAULT 'en',
    voice_input BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Auto-delete after 30 days for privacy
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

CREATE INDEX idx_conversation_messages_conv ON ai.conversation_messages(conversation_id, created_at);
CREATE INDEX idx_conversation_messages_expires ON ai.conversation_messages(expires_at);

-- Fraud alerts and notifications
CREATE TABLE tenant.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id),
    transaction_id UUID REFERENCES tenant.transactions(id),
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'high_risk_transaction', 'unusual_pattern', 'velocity_check', 'location_anomaly',
        'device_mismatch', 'time_anomaly', 'amount_anomaly', 'recipient_risk'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    risk_score DECIMAL(5,2) NOT NULL,
    
    -- AI analysis
    ai_analysis JSONB NOT NULL DEFAULT '{}',
    contributing_factors JSONB NOT NULL DEFAULT '{}',
    similar_patterns JSONB DEFAULT '{}',
    recommended_actions TEXT[],
    
    -- Alert status and resolution
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive', 'escalated')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    
    -- Resolution tracking
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES tenant.users(id),
    resolution_notes TEXT,
    resolution_actions TEXT[],
    
    -- Notification tracking
    notifications_sent JSONB DEFAULT '{}',
    user_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_alerts_user ON tenant.fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_transaction ON tenant.fraud_alerts(transaction_id);
CREATE INDEX idx_fraud_alerts_status ON tenant.fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_severity ON tenant.fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_created ON tenant.fraud_alerts(created_at);

-- User behavioral patterns for AI learning (aggregated data only)
CREATE TABLE ai.user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    
    -- Pattern data (aggregated, no specific transaction details)
    pattern_date DATE NOT NULL,
    
    -- Transaction behavior
    transaction_velocity DECIMAL(8,4), -- transactions per hour
    average_transaction_amount DECIMAL(15,2),
    preferred_transaction_types TEXT[],
    peak_activity_hours INTEGER[], -- hours of day when most active (0-23)
    
    -- Location and device patterns
    typical_locations JSONB DEFAULT '{}', -- approximate locations (city level only)
    device_fingerprints TEXT[],
    preferred_channels VARCHAR(50)[], -- mobile, web, ussd, etc.
    
    -- App usage patterns
    session_duration_avg DECIMAL(8,2), -- minutes
    features_used JSONB DEFAULT '{}',
    navigation_patterns JSONB DEFAULT '{}',
    
    -- AI interaction patterns
    ai_usage_frequency DECIMAL(6,2),
    preferred_ai_language VARCHAR(10),
    voice_command_usage BOOLEAN DEFAULT false,
    satisfaction_trend DECIMAL(3,2),
    
    -- Risk and security patterns
    security_events INTEGER DEFAULT 0,
    mfa_usage_rate DECIMAL(5,4),
    suspicious_activities INTEGER DEFAULT 0,
    
    -- AI model features (anonymized numerical features)
    feature_vector DECIMAL(8,6)[] DEFAULT '{}',
    anomaly_score DECIMAL(5,4),
    behavior_cluster INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, pattern_date)
);

CREATE INDEX idx_user_behavior_user_date ON ai.user_behavior_patterns(user_id, pattern_date);
CREATE INDEX idx_user_behavior_date ON ai.user_behavior_patterns(pattern_date);
CREATE INDEX idx_user_behavior_cluster ON ai.user_behavior_patterns(behavior_cluster);

-- Notifications and alerts
CREATE TABLE tenant.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'transaction_completed', 'transaction_failed', 'security_alert', 'fraud_alert',
        'ai_insight', 'system_maintenance', 'account_update', 'payment_reminder',
        'kyc_required', 'limit_exceeded', 'promotional'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- AI-generated content
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    personalization_level VARCHAR(20) DEFAULT 'standard' CHECK (personalization_level IN ('none', 'basic', 'standard', 'advanced')),
    ai_confidence DECIMAL(5,4),
    
    -- Rich content and actions
    rich_content JSONB DEFAULT '{}', -- images, buttons, etc.
    action_buttons JSONB DEFAULT '[]',
    deep_link VARCHAR(255),
    
    -- Delivery configuration
    channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['in_app'],
    delivery_preferences JSONB DEFAULT '{}',
    
    -- Delivery status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'expired')),
    
    -- Timing
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    -- Context and relationships
    related_transaction_id UUID REFERENCES tenant.transactions(id),
    related_alert_id UUID REFERENCES tenant.fraud_alerts(id),
    category VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_status ON tenant.notifications(user_id, status);
CREATE INDEX idx_notifications_type ON tenant.notifications(type);
CREATE INDEX idx_notifications_priority ON tenant.notifications(priority);
CREATE INDEX idx_notifications_scheduled ON tenant.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_created ON tenant.notifications(created_at);

-- Document storage for KYC and compliance
CREATE TABLE tenant.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    
    -- Document details
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'national_id', 'drivers_license', 'passport', 'voters_card', 'birth_certificate',
        'utility_bill', 'bank_statement', 'salary_slip', 'tax_certificate',
        'business_registration', 'other'
    )),
    document_number VARCHAR(100),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- AI processing results
    ai_processed BOOLEAN DEFAULT false,
    ai_extracted_data JSONB DEFAULT '{}',
    ai_confidence_score DECIMAL(5,4),
    ai_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_verification_status IN ('pending', 'verified', 'failed', 'manual_review')),
    
    -- Verification and approval
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    verified_by UUID REFERENCES tenant.users(id),
    verified_at TIMESTAMP,
    expiry_date DATE,
    
    -- Security and encryption
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(100),
    file_hash VARCHAR(64), -- SHA-256 hash for integrity
    
    -- Metadata
    upload_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user ON tenant.documents(user_id);
CREATE INDEX idx_documents_type ON tenant.documents(document_type);
CREATE INDEX idx_documents_verification ON tenant.documents(verification_status);
CREATE INDEX idx_documents_ai_processed ON tenant.documents(ai_processed, ai_verification_status);

-- Function to generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TRIGGER AS $$
DECLARE
    tenant_prefix VARCHAR(10);
BEGIN
    -- Get tenant prefix from tenant_metadata
    SELECT UPPER(LEFT(tenant_name, 3)) INTO tenant_prefix 
    FROM tenant.tenant_metadata LIMIT 1;
    
    -- Generate reference if not provided
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference = COALESCE(tenant_prefix, 'TXN') || TO_CHAR(NOW(), 'YYYYMMDD') || 
                       LPAD(NEXTVAL('tenant.transaction_ref_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate wallet number
CREATE OR REPLACE FUNCTION generate_wallet_number()
RETURNS TRIGGER AS $$
DECLARE
    tenant_prefix VARCHAR(10);
    wallet_number VARCHAR(20);
BEGIN
    -- Get tenant prefix
    SELECT UPPER(LEFT(tenant_name, 3)) INTO tenant_prefix 
    FROM tenant.tenant_metadata LIMIT 1;
    
    -- Generate wallet number if not provided
    IF NEW.wallet_number IS NULL OR NEW.wallet_number = '' THEN
        wallet_number = COALESCE(tenant_prefix, 'WLT') || TO_CHAR(NOW(), 'YYYYMM') || 
                       LPAD(NEXTVAL('tenant.wallet_number_seq')::TEXT, 8, '0');
        NEW.wallet_number = wallet_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update available balance based on reserved and pending balances
    NEW.available_balance = NEW.balance - NEW.reserved_balance - NEW.pending_balance;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create wallet transaction entry
CREATE OR REPLACE FUNCTION create_wallet_transaction()
RETURNS TRIGGER AS $$
DECLARE
    wallet_record RECORD;
BEGIN
    -- Only for completed transactions that affect wallet balance
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Find the user's main wallet
        SELECT * INTO wallet_record 
        FROM tenant.wallets 
        WHERE user_id = NEW.user_id AND wallet_type = 'main' 
        LIMIT 1;
        
        IF FOUND THEN
            -- Create wallet transaction record
            INSERT INTO tenant.wallet_transactions (
                wallet_id,
                transaction_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description,
                reference
            ) VALUES (
                wallet_record.id,
                NEW.id,
                CASE WHEN NEW.type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase') 
                     THEN 'debit' ELSE 'credit' END,
                NEW.amount,
                wallet_record.balance,
                wallet_record.balance + CASE WHEN NEW.type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase') 
                                            THEN -NEW.amount ELSE NEW.amount END,
                NEW.description,
                NEW.reference
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired conversation messages
    DELETE FROM ai.conversation_messages WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired notifications
    DELETE FROM tenant.notifications WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old sessions (older than 30 days)
    DELETE FROM tenant.user_sessions WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Archive old transactions (older than 7 years, keeping only essential data)
    -- This would typically move data to an archive table
    
END;
$$ LANGUAGE plpgsql;

-- Create sequences
CREATE SEQUENCE tenant.transaction_ref_seq START 1;
CREATE SEQUENCE tenant.wallet_number_seq START 1;

-- Apply triggers
CREATE TRIGGER generate_transaction_reference_trigger 
    BEFORE INSERT ON tenant.transactions 
    FOR EACH ROW EXECUTE FUNCTION generate_transaction_reference();

CREATE TRIGGER generate_wallet_number_trigger 
    BEFORE INSERT ON tenant.wallets 
    FOR EACH ROW EXECUTE FUNCTION generate_wallet_number();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON tenant.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_balance_trigger 
    BEFORE INSERT OR UPDATE ON tenant.wallets 
    FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON tenant.wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON tenant.transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER create_wallet_transaction_trigger
    AFTER UPDATE ON tenant.transactions
    FOR EACH ROW EXECUTE FUNCTION create_wallet_transaction();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON tenant.documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_alerts_updated_at 
    BEFORE UPDATE ON tenant.fraud_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for sensitive tables
ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.documents ENABLE ROW LEVEL SECURITY;

-- Create roles for different access levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_admin') THEN
        CREATE ROLE tenant_admin;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_agent') THEN
        CREATE ROLE tenant_agent;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_viewer') THEN
        CREATE ROLE tenant_viewer;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tenant_api') THEN
        CREATE ROLE tenant_api;
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA tenant, ai, analytics, audit TO tenant_admin, tenant_agent, tenant_viewer, tenant_api;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA tenant, ai, analytics TO tenant_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tenant, ai, analytics TO tenant_admin;

GRANT SELECT, INSERT, UPDATE ON tenant.transactions, tenant.wallets, tenant.notifications TO tenant_agent;
GRANT SELECT ON tenant.users, ai.conversations TO tenant_agent;

GRANT SELECT ON ALL TABLES IN SCHEMA tenant, ai, analytics TO tenant_viewer;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA tenant, ai, analytics TO tenant_api;

-- Add table comments
COMMENT ON TABLE tenant.users IS 'Tenant-specific user accounts with AI preferences';
COMMENT ON TABLE tenant.transactions IS 'All transaction records with AI fraud detection';
COMMENT ON TABLE tenant.wallets IS 'User wallet accounts with AI insights';
COMMENT ON TABLE ai.conversations IS 'AI conversation analytics (no PII)';
COMMENT ON TABLE tenant.fraud_alerts IS 'Fraud detection alerts and investigations';
COMMENT ON TABLE tenant.notifications IS 'User notifications and communications';
COMMENT ON TABLE tenant.documents IS 'Document storage for KYC and compliance';

-- Create indexes for better query performance
ANALYZE tenant.users;
ANALYZE tenant.transactions;
ANALYZE tenant.wallets;
ANALYZE ai.conversations;

-- Final cleanup and optimization
VACUUM ANALYZE;