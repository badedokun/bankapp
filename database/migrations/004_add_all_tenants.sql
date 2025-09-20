-- Migration: 004_add_all_tenants.sql
-- Description: Add all tenant configurations for multi-tenant support
-- Version: 1.0
-- Date: 2025-09-05
-- Author: OrokiiPay Development Team

-- Insert Bank A tenant
INSERT INTO platform.tenants (
    name,
    display_name,
    subdomain,
    custom_domain,
    status,
    tier,
    region,
    compliance_level,
    configuration,
    branding,
    ai_configuration,
    security_settings
) VALUES (
    'bank-a',
    'Bank A Demo',
    'bank-a',
    'bank-a.orokii.com',
    'active',
    'premium',
    'nigeria-west',
    'tier2',
    '{"businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"amount": 200000, "count": 50}}}, "featureFlags": {"aiAssistant": true, "biometricAuth": false}}',
    '{"logoUrl": "/assets/brands/bank-a/logo.png", "colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}}',
    '{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}',
    '{"mfa": {"required": false}}'
)
ON CONFLICT (name) DO NOTHING;

-- Insert Bank B tenant  
INSERT INTO platform.tenants (
    name,
    display_name,
    subdomain,
    custom_domain,
    status,
    tier,
    region,
    compliance_level,
    configuration,
    branding,
    ai_configuration,
    security_settings
) VALUES (
    'bank-b',
    'Bank B Demo', 
    'bank-b',
    'bank-b.orokii.com',
    'active',
    'basic',
    'nigeria-west', 
    'tier1',
    '{"businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"amount": 50000, "count": 10}}}, "featureFlags": {"aiAssistant": false}}',
    '{"logoUrl": "/assets/brands/bank-b/logo.png", "colors": {"primary": "#DC2626", "secondary": "#EF4444"}}',
    '{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}',
    '{"mfa": {"required": false}}'
)
ON CONFLICT (name) DO NOTHING;

-- Insert Bank C tenant
INSERT INTO platform.tenants (
    name,
    display_name,
    subdomain,
    custom_domain,
    status,
    tier,
    region,
    compliance_level,
    configuration,
    branding,
    ai_configuration,
    security_settings
) VALUES (
    'bank-c',
    'Bank C Demo',
    'bank-c', 
    'bank-c.orokii.com',
    'active',
    'enterprise',
    'nigeria-west',
    'tier3',
    '{"businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"amount": 500000, "count": 100}}}, "featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}}',
    '{"logoUrl": "/assets/brands/bank-c/logo.png", "colors": {"primary": "#059669", "secondary": "#10B981"}}',
    '{"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}',
    '{"mfa": {"required": true}}'
)
ON CONFLICT (name) DO NOTHING;

-- Insert default tenant for SaaS mode
INSERT INTO platform.tenants (
    name,
    display_name,
    subdomain,
    custom_domain,
    status,
    tier,
    region,
    compliance_level,
    configuration,
    branding,
    ai_configuration,
    security_settings
) VALUES (
    'default',
    'Multi-Tenant Banking Platform',
    'default',
    'orokii.com',
    'active',
    'enterprise',
    'nigeria-west',
    'tier3',
    '{"businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"amount": 1000000, "count": 500}}}, "featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}}',
    '{"logoUrl": "/assets/brands/default/logo.png", "colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}}',
    '{"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}',
    '{"mfa": {"required": true}}'
)
ON CONFLICT (name) DO NOTHING;