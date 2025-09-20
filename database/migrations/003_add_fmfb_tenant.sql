-- Migration: 003_add_fmfb_tenant.sql
-- Description: Add FMFB tenant configuration
-- Version: 1.0
-- Date: 2025-09-05
-- Author: OrokiiPay Development Team

-- Insert FMFB tenant
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
    'fmfb',
    'Firstmidas Microfinance Bank',
    'fmfb',
    'fmfb.orokii.com',
    'active',
    'enterprise',
    'nigeria-west',
    'tier3',
    '{
        "businessRules": {
            "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"],
            "transactionLimits": {
                "daily": {"amount": 1000000, "count": 200},
                "monthly": {"amount": 10000000, "count": 2000},
                "perTransaction": {"minimum": 100, "maximum": 1000000}
            },
            "operatingHours": {
                "start": "06:00",
                "end": "22:00",
                "timezone": "Africa/Lagos",
                "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
            },
            "kyc": {
                "required": true,
                "levels": ["tier1", "tier2", "tier3"],
                "documents": ["nin", "bvn", "passport", "drivers_license"]
            }
        },
        "featureFlags": {
            "aiAssistant": true,
            "biometricAuth": true,
            "cardManagement": true,
            "loanManagement": true,
            "investmentProducts": true,
            "internationalTransfer": false,
            "cryptoTrading": false,
            "advancedAnalytics": true
        },
        "integrations": {
            "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"},
            "bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"},
            "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"},
            "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}
        }
    }',
    '{
        "logoUrl": "/assets/brands/fmfb/logo.png",
        "faviconUrl": "/assets/brands/fmfb/favicon.ico",
        "colors": {
            "primary": "#2E8B57",
            "secondary": "#FFD700",
            "accent": "#FF6B35",
            "background": "#F8F9FA",
            "surface": "#FFFFFF",
            "error": "#DC3545",
            "warning": "#FFC107",
            "info": "#17A2B8",
            "success": "#28A745",
            "text": "#212529",
            "textSecondary": "#6C757D"
        },
        "typography": {
            "fontFamily": "Inter, system-ui, sans-serif",
            "headingFontFamily": "Poppins, Inter, sans-serif"
        },
        "layout": {
            "borderRadius": "8px",
            "spacing": "16px"
        },
        "customCss": "",
        "assets": {
            "heroImage": "/assets/brands/fmfb/hero.jpg",
            "backgroundPattern": "/assets/brands/fmfb/pattern.svg"
        }
    }',
    '{
        "model": "gpt-4",
        "maxTokens": 1000,
        "temperature": 0.7,
        "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security.",
        "features": {
            "transactionAnalysis": true,
            "spendingInsights": true,
            "goalSetting": true,
            "budgetAdvice": true,
            "fraudDetection": true,
            "conversationalBanking": true
        },
        "languages": ["english", "yoruba", "hausa", "igbo"],
        "personality": "professional_friendly"
    }',
    '{
        "mfa": {
            "required": true,
            "methods": ["sms", "email", "authenticator", "biometric"],
            "timeout": 300
        },
        "sessionManagement": {
            "timeout": 1800,
            "maxConcurrentSessions": 3,
            "requireReauth": true
        },
        "passwordPolicy": {
            "minLength": 12,
            "requireUppercase": true,
            "requireLowercase": true,
            "requireNumbers": true,
            "requireSpecialChars": true,
            "expiryDays": 90,
            "preventReuse": 12
        },
        "deviceManagement": {
            "maxDevices": 5,
            "requireApproval": true,
            "trustDeviceDays": 30
        },
        "fraudPrevention": {
            "velocityChecks": true,
            "geolocationValidation": true,
            "deviceFingerprinting": true,
            "behaviorAnalysis": true
        }
    }'
)
ON CONFLICT (name) 
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    custom_domain = EXCLUDED.custom_domain,
    status = EXCLUDED.status,
    tier = EXCLUDED.tier,
    configuration = EXCLUDED.configuration,
    branding = EXCLUDED.branding,
    ai_configuration = EXCLUDED.ai_configuration,
    security_settings = EXCLUDED.security_settings,
    updated_at = CURRENT_TIMESTAMP;