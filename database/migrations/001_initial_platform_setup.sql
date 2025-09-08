-- Migration: 001_initial_platform_setup.sql
-- Description: Initial platform database setup for multi-tenant Money Transfer system
-- Version: 1.0
-- Date: 2025-09-04
-- Author: OrokiiPay Development Team

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path to include our schemas
ALTER DATABASE bank_app_platform SET search_path TO platform, audit, analytics, public;

-- Tenants table - Core tenant registry
CREATE TABLE platform.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    custom_domain VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'inactive', 'pending', 'provisioning')) DEFAULT 'pending',
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')) DEFAULT 'basic',
    region VARCHAR(50) NOT NULL DEFAULT 'nigeria-west',
    compliance_level VARCHAR(10) NOT NULL CHECK (compliance_level IN ('tier1', 'tier2', 'tier3')) DEFAULT 'tier2',
    
    -- Database configuration
    database_config JSONB NOT NULL DEFAULT '{
        "host": "localhost",
        "port": 5432,
        "ssl_mode": "require",
        "connection_pool_size": 20,
        "backup_schedule": "0 2 * * *"
    }'::jsonb,
    
    -- Business configuration
    configuration JSONB NOT NULL DEFAULT '{
        "businessRules": {
            "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"],
            "transactionLimits": {
                "daily": {"amount": 500000, "count": 100},
                "monthly": {"amount": 5000000, "count": 1000},
                "perTransaction": {"minimum": 100, "maximum": 500000}
            },
            "operatingHours": {
                "timezone": "Africa/Lagos",
                "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "startTime": "08:00",
                "endTime": "18:00"
            }
        },
        "paymentProviders": [
            {
                "id": "nibss",
                "name": "NIBSS",
                "enabled": true,
                "priority": 1,
                "configuration": {}
            }
        ],
        "featureFlags": {
            "aiAssistant": true,
            "voiceCommands": false,
            "biometricAuth": true,
            "offlineMode": true,
            "qrCodePayments": true,
            "bulkTransactions": false,
            "advancedAnalytics": false
        }
    }'::jsonb,
    
    -- AI configuration
    ai_configuration JSONB NOT NULL DEFAULT '{
        "enabled": true,
        "services": {
            "conversationalAI": {
                "enabled": true,
                "model": "gpt-4",
                "temperature": 0.7,
                "maxTokens": 500,
                "personality": {
                    "name": "AI Assistant",
                    "description": "Your helpful banking assistant",
                    "tone": "professional",
                    "greeting": "Hello! How can I help you with your banking today?"
                }
            },
            "fraudDetection": {
                "enabled": true,
                "sensitivity": "medium",
                "thresholds": {
                    "low_risk": 30,
                    "medium_risk": 60,
                    "high_risk": 80
                }
            },
            "voiceProcessing": {
                "enabled": false,
                "languages": ["en", "ha", "yo", "ig"],
                "accent": "nigerian"
            },
            "documentAI": {
                "enabled": false,
                "supportedDocuments": ["receipt", "id_card"]
            },
            "predictiveAnalytics": {
                "enabled": false,
                "features": ["balance_prediction", "spending_insights"]
            }
        },
        "models": {
            "offline": [],
            "cloud": ["fraud-detection", "nlp-basic"]
        }
    }'::jsonb,
    
    -- Branding and theming
    branding JSONB NOT NULL DEFAULT '{
        "companyName": "Default Bank",
        "logoUrl": "/assets/default-logo.png",
        "faviconUrl": "/assets/default-favicon.ico",
        "primaryColor": "#1976d2",
        "secondaryColor": "#f50057",
        "accentColor": "#ff9800",
        "backgroundColor": "#ffffff",
        "textColor": "#333333",
        "fontFamily": "Roboto",
        "borderRadius": 8,
        "appTitle": "Banking PoS",
        "tagline": "Your trusted payment solution",
        "darkMode": false,
        "locale": "en-NG",
        "currency": "NGN",
        "dateFormat": "DD/MM/YYYY",
        "timeFormat": "HH:mm"
    }'::jsonb,
    
    -- Security settings
    security_settings JSONB NOT NULL DEFAULT '{
        "mfa": {
            "required": true,
            "methods": ["sms", "email", "totp"],
            "exemptions": []
        },
        "sessionManagement": {
            "timeout": 1800,
            "maxConcurrentSessions": 5,
            "deviceBinding": true
        },
        "ipWhitelist": [],
        "geoRestrictions": {
            "allowedCountries": ["NG"],
            "blockedCountries": []
        },
        "fraudPrevention": {
            "enabled": true,
            "riskThreshold": 70,
            "actions": ["review", "block"]
        }
    }'::jsonb,
    
    -- Billing information
    billing_info JSONB NOT NULL DEFAULT '{
        "plan": "basic",
        "billingCycle": "monthly",
        "currency": "NGN",
        "subscriptionFee": 50000,
        "transactionFee": 50,
        "overage": {
            "transactionFee": 100,
            "userFee": 1000
        },
        "paymentMethod": {
            "type": "bank_transfer",
            "details": {}
        },
        "invoicing": {
            "email": "",
            "frequency": "monthly",
            "format": "pdf"
        }
    }'::jsonb,
    
    -- Compliance and regulatory
    compliance_settings JSONB NOT NULL DEFAULT '{
        "regulatoryRequirements": ["CBN", "PCI_DSS"],
        "dataRetentionPeriod": 2555,
        "auditLevel": "enhanced",
        "encryptionRequirements": {
            "algorithm": "AES-256-GCM",
            "keyLength": 256,
            "rotationFrequency": 90,
            "hsm": false
        }
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_by UUID,
    
    -- Constraints
    CONSTRAINT check_subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$'),
    CONSTRAINT check_name_format CHECK (name ~ '^[a-z0-9_-]+$')
);

-- Create indexes for performance
CREATE INDEX idx_tenants_status ON platform.tenants(status);
CREATE INDEX idx_tenants_subdomain ON platform.tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON platform.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_tier ON platform.tenants(tier);
CREATE INDEX idx_tenants_region ON platform.tenants(region);
CREATE INDEX idx_tenants_created_at ON platform.tenants(created_at);

-- Tenant billing table
CREATE TABLE platform.tenant_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Fee breakdown
    base_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    transaction_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    overage_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    ai_usage_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    support_fees DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Totals
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    
    -- Status and payment
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')) DEFAULT 'draft',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Usage statistics for billing
    usage_stats JSONB NOT NULL DEFAULT '{
        "transactions": 0,
        "api_calls": 0,
        "ai_requests": 0,
        "storage_gb": 0,
        "bandwidth_gb": 0,
        "active_users": 0
    }'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, billing_period_start)
);

CREATE INDEX idx_tenant_billing_tenant_period ON platform.tenant_billing(tenant_id, billing_period_start);
CREATE INDEX idx_tenant_billing_status ON platform.tenant_billing(status);
CREATE INDEX idx_tenant_billing_due_date ON platform.tenant_billing(due_date);

-- Tenant usage metrics for real-time tracking
CREATE TABLE platform.tenant_usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Transaction metrics
    transaction_count INTEGER NOT NULL DEFAULT 0,
    transaction_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
    failed_transactions INTEGER NOT NULL DEFAULT 0,
    
    -- API usage metrics
    api_calls INTEGER NOT NULL DEFAULT 0,
    api_errors INTEGER NOT NULL DEFAULT 0,
    average_response_time DECIMAL(8,2) DEFAULT 0,
    
    -- AI usage metrics
    ai_requests INTEGER NOT NULL DEFAULT 0,
    ai_processing_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    conversation_sessions INTEGER NOT NULL DEFAULT 0,
    fraud_assessments INTEGER NOT NULL DEFAULT 0,
    
    -- Resource usage
    storage_used BIGINT NOT NULL DEFAULT 0,
    bandwidth_used BIGINT NOT NULL DEFAULT 0,
    cpu_usage_hours DECIMAL(10,2) DEFAULT 0,
    memory_usage_gb_hours DECIMAL(10,2) DEFAULT 0,
    
    -- User activity
    active_users INTEGER NOT NULL DEFAULT 0,
    daily_logins INTEGER NOT NULL DEFAULT 0,
    unique_sessions INTEGER NOT NULL DEFAULT 0,
    
    -- Feature usage
    features_used JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, metric_date)
);

CREATE INDEX idx_tenant_usage_tenant_date ON platform.tenant_usage_metrics(tenant_id, metric_date);
CREATE INDEX idx_tenant_usage_date ON platform.tenant_usage_metrics(metric_date);

-- AI model registry for tenant-specific and shared models
CREATE TABLE platform.ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('conversational', 'fraud_detection', 'nlp', 'voice', 'vision', 'document')),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('cloud', 'edge', 'hybrid')),
    
    -- Ownership and sharing
    tenant_id UUID REFERENCES platform.tenants(id) ON DELETE CASCADE,
    is_shared BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    
    -- Model metadata
    model_url TEXT,
    config_url TEXT,
    model_size BIGINT NOT NULL,
    model_format VARCHAR(20) DEFAULT 'tensorflow',
    
    -- Performance metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    latency DECIMAL(8,2),
    throughput DECIMAL(10,2),
    
    -- Language and localization
    supported_languages TEXT[] DEFAULT ARRAY['en'],
    regional_optimization VARCHAR(50) DEFAULT 'nigeria',
    
    -- Status and lifecycle
    status VARCHAR(20) NOT NULL CHECK (status IN ('training', 'validating', 'ready', 'deprecated', 'archived')) DEFAULT 'training',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Training information
    training_data_size BIGINT,
    training_duration INTEGER,
    training_cost DECIMAL(10,2),
    training_completed_at TIMESTAMP,
    
    -- Versioning and deployment
    parent_model_id UUID REFERENCES platform.ai_models(id),
    deployment_config JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(name, version, tenant_id)
);

CREATE INDEX idx_ai_models_tenant_type ON platform.ai_models(tenant_id, type);
CREATE INDEX idx_ai_models_type_status ON platform.ai_models(type, status);
CREATE INDEX idx_ai_models_shared ON platform.ai_models(is_shared) WHERE is_shared = true;
CREATE INDEX idx_ai_models_public ON platform.ai_models(is_public) WHERE is_public = true;

-- AI conversation analytics (aggregated, no PII)
CREATE TABLE analytics.ai_conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    conversation_date DATE NOT NULL,
    
    -- Volume metrics
    total_conversations INTEGER NOT NULL DEFAULT 0,
    successful_resolutions INTEGER NOT NULL DEFAULT 0,
    escalated_conversations INTEGER NOT NULL DEFAULT 0,
    abandoned_conversations INTEGER NOT NULL DEFAULT 0,
    
    -- Performance metrics
    average_confidence DECIMAL(5,4),
    average_response_time DECIMAL(8,2),
    average_conversation_length DECIMAL(6,2),
    
    -- Language usage
    language_usage JSONB NOT NULL DEFAULT '{}',
    
    -- Intent distribution
    intent_distribution JSONB NOT NULL DEFAULT '{}',
    
    -- User satisfaction
    user_satisfaction DECIMAL(3,2),
    satisfaction_responses INTEGER DEFAULT 0,
    escalation_rate DECIMAL(5,4),
    
    -- Error tracking
    parsing_errors INTEGER DEFAULT 0,
    service_errors INTEGER DEFAULT 0,
    timeout_errors INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversation_tenant_date ON analytics.ai_conversation_analytics(tenant_id, conversation_date);
CREATE INDEX idx_ai_conversation_date ON analytics.ai_conversation_analytics(conversation_date);

-- AI fraud detection analytics
CREATE TABLE analytics.ai_fraud_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    
    -- Volume metrics
    total_assessments INTEGER NOT NULL DEFAULT 0,
    transactions_assessed INTEGER NOT NULL DEFAULT 0,
    
    -- Risk distribution
    low_risk_count INTEGER NOT NULL DEFAULT 0,
    medium_risk_count INTEGER NOT NULL DEFAULT 0,
    high_risk_count INTEGER NOT NULL DEFAULT 0,
    critical_risk_count INTEGER NOT NULL DEFAULT 0,
    
    -- Accuracy metrics (when ground truth is available)
    true_positives INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    true_negatives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    false_positive_rate DECIMAL(5,4),
    false_negative_rate DECIMAL(5,4),
    model_accuracy DECIMAL(5,4),
    
    -- Performance metrics
    average_processing_time DECIMAL(8,2),
    p99_processing_time DECIMAL(8,2),
    
    -- Actions taken
    blocked_transactions INTEGER NOT NULL DEFAULT 0,
    approved_transactions INTEGER NOT NULL DEFAULT 0,
    flagged_for_review INTEGER NOT NULL DEFAULT 0,
    additional_auth_required INTEGER NOT NULL DEFAULT 0,
    
    -- Model information
    primary_model_version VARCHAR(50),
    model_performance_score DECIMAL(5,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_fraud_tenant_date ON analytics.ai_fraud_analytics(tenant_id, analysis_date);
CREATE INDEX idx_ai_fraud_date ON analytics.ai_fraud_analytics(analysis_date);

-- Comprehensive audit log table
CREATE TABLE audit.tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    
    -- Service and operation information
    service_name VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    
    -- User and session information
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    session_id VARCHAR(255),
    
    -- Request information
    request_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('create', 'read', 'update', 'delete', 'auth', 'transaction', 'admin', 'system')),
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- Data and changes
    before_data JSONB,
    after_data JSONB,
    details JSONB NOT NULL DEFAULT '{}',
    
    -- AI analysis of the audit event
    ai_analysis JSONB,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    anomaly_score DECIMAL(5,4),
    compliance_flags TEXT[],
    
    -- Status and resolution
    status VARCHAR(20) DEFAULT 'logged' CHECK (status IN ('logged', 'reviewed', 'investigated', 'resolved')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Performance metrics
    response_time DECIMAL(8,2),
    response_code INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning for better performance (by date)
-- Note: This would be set up as needed in production

CREATE INDEX idx_tenant_audit_tenant_created ON audit.tenant_audit_logs(tenant_id, created_at);
CREATE INDEX idx_tenant_audit_service_operation ON audit.tenant_audit_logs(service_name, operation);
CREATE INDEX idx_tenant_audit_user ON audit.tenant_audit_logs(user_id, created_at);
CREATE INDEX idx_tenant_audit_risk_level ON audit.tenant_audit_logs(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_tenant_audit_event_type ON audit.tenant_audit_logs(event_type, created_at);
CREATE INDEX idx_tenant_audit_resource ON audit.tenant_audit_logs(resource_type, resource_id);

-- Platform configuration for AI services and system settings
CREATE TABLE platform.platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('ai', 'security', 'payment', 'system', 'feature')) DEFAULT 'system',
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,
    environment VARCHAR(20) DEFAULT 'all' CHECK (environment IN ('development', 'staging', 'production', 'all')),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

CREATE INDEX idx_platform_config_key ON platform.platform_config(config_key);
CREATE INDEX idx_platform_config_type ON platform.platform_config(config_type);
CREATE INDEX idx_platform_config_active ON platform.platform_config(is_active) WHERE is_active = true;

-- Insert default platform configuration
INSERT INTO platform.platform_config (config_key, config_value, config_type, description) VALUES
('ai_models_config', '{
    "fraud_detection": {
        "default_model": "nigerian_fraud_v2.1",
        "fallback_model": "global_fraud_v1.8",
        "confidence_threshold": 0.85,
        "batch_size": 32,
        "max_latency_ms": 500
    },
    "conversational": {
        "default_model": "gpt-4",
        "nigerian_model": "nigerian_nlp_v1.2",
        "max_tokens": 2000,
        "temperature": 0.7,
        "supported_languages": ["en", "ha", "yo", "ig", "pcm"]
    },
    "voice_processing": {
        "speech_to_text": "whisper-large-v2",
        "text_to_speech": "nigerian_tts_v1.0",
        "accent_adaptation": true,
        "noise_reduction": true
    }
}', 'ai', 'AI models configuration and parameters'),

('payment_providers_config', '{
    "nibss": {
        "name": "Nigeria Inter-Bank Settlement System",
        "api_version": "v1",
        "sandbox_url": "https://sandbox.nibss-plc.com.ng/api/v1",
        "production_url": "https://api.nibss-plc.com.ng/v1",
        "timeout_ms": 30000,
        "retry_attempts": 3
    },
    "interswitch": {
        "name": "Interswitch",
        "api_version": "v1",
        "sandbox_url": "https://sandbox.interswitchng.com/api/v1",
        "production_url": "https://api.interswitchng.com/v1",
        "timeout_ms": 25000,
        "retry_attempts": 3
    }
}', 'payment', 'Payment providers configuration'),

('security_defaults', '{
    "jwt_expiry": 3600,
    "refresh_token_expiry": 604800,
    "max_login_attempts": 5,
    "lockout_duration": 900,
    "password_policy": {
        "min_length": 8,
        "require_uppercase": true,
        "require_lowercase": true,
        "require_numbers": true,
        "require_special": true,
        "max_age_days": 90
    },
    "encryption": {
        "algorithm": "AES-256-GCM",
        "key_rotation_days": 90
    }
}', 'security', 'Default security settings'),

('feature_flags_global', '{
    "ai_assistant": true,
    "voice_commands": true,
    "fraud_detection": true,
    "biometric_auth": true,
    "offline_mode": true,
    "qr_payments": true,
    "bulk_transactions": false,
    "advanced_analytics": true,
    "multi_language": true,
    "real_time_notifications": true
}', 'feature', 'Global feature flags'),

('rate_limits', '{
    "basic": {
        "requests_per_minute": 100,
        "burst_size": 150,
        "ai_requests_per_hour": 500
    },
    "premium": {
        "requests_per_minute": 500,
        "burst_size": 750,
        "ai_requests_per_hour": 2000
    },
    "enterprise": {
        "requests_per_minute": 1000,
        "burst_size": 1500,
        "ai_requests_per_hour": 10000
    }
}', 'system', 'Rate limiting configuration by tenant tier'),

('nigerian_banking_config', '{
    "supported_banks": [
        {"code": "011", "name": "Bank Alpha", "swift": "BKALNGNP"},
        {"code": "058", "name": "Guaranty Trust Bank", "swift": "GTBINGLA"},
        {"code": "057", "name": "Bank Beta", "swift": "BKBETNGLA"},
        {"code": "033", "name": "United Bank for Africa", "swift": "UNAFNGLA"},
        {"code": "214", "name": "Bank Gamma", "swift": "BKGAMNGNP"}
    ],
    "business_hours": {
        "timezone": "Africa/Lagos",
        "banking_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "start_time": "08:00",
        "end_time": "16:00"
    },
    "holidays": [
        "2025-01-01",
        "2025-03-31",
        "2025-04-01",
        "2025-05-01",
        "2025-06-12",
        "2025-10-01",
        "2025-12-25",
        "2025-12-26"
    ],
    "regulatory": {
        "cbn_code": "CBN",
        "max_single_transaction": 5000000,
        "daily_cumulative_limit": 20000000,
        "kyc_requirements": ["bvn", "nin", "address_verification"]
    }
}', 'system', 'Nigerian banking system configuration');

-- Function to get current tenant ID (for RLS)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log tenant changes
CREATE OR REPLACE FUNCTION log_tenant_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_type TEXT;
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        change_type := 'create';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        change_type := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        change_type := 'delete';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit.tenant_audit_logs (
        tenant_id,
        service_name,
        operation,
        event_type,
        resource_type,
        resource_id,
        before_data,
        after_data,
        details
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        'platform',
        'tenant_' || change_type,
        'admin',
        'tenant',
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate billing for tenant
CREATE OR REPLACE FUNCTION calculate_tenant_billing(
    p_tenant_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    base_fee DECIMAL(15,2),
    transaction_fees DECIMAL(15,2),
    overage_fees DECIMAL(15,2),
    ai_usage_fees DECIMAL(15,2),
    total_amount DECIMAL(15,2)
) AS $$
DECLARE
    tenant_tier TEXT;
    billing_config JSONB;
    usage_stats RECORD;
BEGIN
    -- Get tenant tier and billing configuration
    SELECT t.tier, t.billing_info INTO tenant_tier, billing_config
    FROM platform.tenants t
    WHERE t.id = p_tenant_id;
    
    -- Get usage statistics for the period
    SELECT 
        COALESCE(SUM(transaction_count), 0) as transactions,
        COALESCE(SUM(ai_requests), 0) as ai_requests,
        COALESCE(SUM(storage_used), 0) as storage_bytes,
        COALESCE(SUM(active_users), 0) as total_users
    INTO usage_stats
    FROM platform.tenant_usage_metrics
    WHERE tenant_id = p_tenant_id 
    AND metric_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate fees based on tenant tier and usage
    RETURN QUERY
    SELECT 
        (billing_config->>'subscriptionFee')::DECIMAL(15,2) as base_fee,
        usage_stats.transactions * (billing_config->>'transactionFee')::DECIMAL(15,2) as transaction_fees,
        CASE 
            WHEN usage_stats.transactions > 1000 THEN 
                (usage_stats.transactions - 1000) * (billing_config->'overage'->>'transactionFee')::DECIMAL(15,2)
            ELSE 0
        END as overage_fees,
        usage_stats.ai_requests * 0.01 as ai_usage_fees, -- ₦0.01 per AI request
        (billing_config->>'subscriptionFee')::DECIMAL(15,2) + 
        usage_stats.transactions * (billing_config->>'transactionFee')::DECIMAL(15,2) +
        CASE 
            WHEN usage_stats.transactions > 1000 THEN 
                (usage_stats.transactions - 1000) * (billing_config->'overage'->>'transactionFee')::DECIMAL(15,2)
            ELSE 0
        END +
        usage_stats.ai_requests * 0.01 as total_amount;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Apply triggers
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON platform.tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_billing_updated_at 
    BEFORE UPDATE ON platform.tenant_billing 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at 
    BEFORE UPDATE ON platform.ai_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_config_updated_at 
    BEFORE UPDATE ON platform.platform_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER log_tenant_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON platform.tenants
    FOR EACH ROW EXECUTE FUNCTION log_tenant_changes();

-- Enable Row Level Security where appropriate
ALTER TABLE platform.tenant_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.ai_conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.ai_fraud_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (would be customized based on authentication system)
CREATE POLICY tenant_billing_isolation ON platform.tenant_billing
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_usage_isolation ON platform.tenant_usage_metrics
    USING (tenant_id = get_current_tenant_id());

-- Create roles for different access levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_platform_admin') THEN
        CREATE ROLE pos_platform_admin;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_tenant_admin') THEN
        CREATE ROLE pos_tenant_admin;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_agent') THEN
        CREATE ROLE pos_agent;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_readonly') THEN
        CREATE ROLE pos_readonly;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_api_service') THEN
        CREATE ROLE pos_api_service;
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA platform, audit, analytics TO pos_platform_admin, pos_tenant_admin, pos_agent, pos_readonly, pos_api_service;

-- Platform admin - full access
GRANT ALL ON ALL TABLES IN SCHEMA platform, audit, analytics TO pos_platform_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA platform, audit, analytics TO pos_platform_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA platform, audit, analytics TO pos_platform_admin;

-- Tenant admin - limited access to tenant-specific data
GRANT SELECT, INSERT, UPDATE ON platform.tenant_billing, platform.tenant_usage_metrics TO pos_tenant_admin;
GRANT SELECT ON platform.tenants, analytics.ai_conversation_analytics, analytics.ai_fraud_analytics TO pos_tenant_admin;
GRANT INSERT ON audit.tenant_audit_logs TO pos_tenant_admin;

-- API service - specific permissions for application services
GRANT SELECT ON ALL TABLES IN SCHEMA platform, analytics TO pos_api_service;
GRANT INSERT, UPDATE ON platform.tenant_usage_metrics, platform.tenant_billing TO pos_api_service;
GRANT INSERT ON audit.tenant_audit_logs, analytics.ai_conversation_analytics, analytics.ai_fraud_analytics TO pos_api_service;

-- Add comments for documentation
COMMENT ON SCHEMA platform IS 'Core platform tables for multi-tenant management';
COMMENT ON SCHEMA audit IS 'Audit logging and compliance tracking';
COMMENT ON SCHEMA analytics IS 'Analytics and reporting tables';

COMMENT ON TABLE platform.tenants IS 'Master tenant registry with configuration';
COMMENT ON TABLE platform.tenant_billing IS 'Tenant billing records and invoicing';
COMMENT ON TABLE platform.tenant_usage_metrics IS 'Real-time tenant usage tracking';
COMMENT ON TABLE platform.ai_models IS 'AI model registry and metadata';
COMMENT ON TABLE analytics.ai_conversation_analytics IS 'Aggregated AI conversation metrics';
COMMENT ON TABLE analytics.ai_fraud_analytics IS 'AI fraud detection performance metrics';
COMMENT ON TABLE audit.tenant_audit_logs IS 'Comprehensive audit trail';
COMMENT ON TABLE platform.platform_config IS 'Platform-wide configuration settings';

-- Create initial admin tenant for system management
INSERT INTO platform.tenants (
    name, 
    display_name, 
    subdomain, 
    status, 
    tier, 
    compliance_level,
    branding,
    ai_configuration
) VALUES (
    'system-admin',
    'System Administration',
    'admin',
    'active',
    'enterprise',
    'tier3',
    jsonb_build_object(
        'companyName', 'NIBSS PoS Admin',
        'primaryColor', '#1565c0',
        'appTitle', 'PoS Admin Console'
    ),
    jsonb_build_object(
        'enabled', true,
        'services', jsonb_build_object(
            'conversationalAI', jsonb_build_object('enabled', true),
            'fraudDetection', jsonb_build_object('enabled', true, 'sensitivity', 'high'),
            'voiceProcessing', jsonb_build_object('enabled', true),
            'documentAI', jsonb_build_object('enabled', true),
            'predictiveAnalytics', jsonb_build_object('enabled', true)
        )
    )
);

-- Create development tenant for testing
INSERT INTO platform.tenants (
    name,
    display_name,
    subdomain,
    status,
    tier,
    branding
) VALUES (
    'development',
    'Development Environment',
    'dev',
    'active',
    'enterprise',
    jsonb_build_object(
        'companyName', 'Development Bank',
        'primaryColor', '#ff9800',
        'appTitle', 'Dev PoS System'
    )
);

-- Performance optimization
ANALYZE platform.tenants;
ANALYZE platform.tenant_billing;
ANALYZE platform.tenant_usage_metrics;
ANALYZE platform.ai_models;

-- Vacuum to optimize storage
VACUUM ANALYZE;