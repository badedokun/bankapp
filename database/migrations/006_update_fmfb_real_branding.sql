-- Migration: 006_update_fmfb_real_branding.sql
-- Description: Update FMFB tenant with real branding from their website
-- Version: 1.0
-- Date: 2025-09-05
-- Author: OrokiiPay Development Team

-- Update FMFB tenant with real branding colors and typography
UPDATE platform.tenants 
SET 
    display_name = 'Firstmidas Microfinance Bank Limited',
    brand_colors = '{
        "primary": "#010080",
        "secondary": "#DAA520", 
        "accent": "#FFFFFF",
        "background": "#F9FAFB",
        "surface": "#FFFFFF",
        "text": "#1F2937",
        "textSecondary": "#6B7280",
        "success": "#10B981",
        "warning": "#F59E0B", 
        "error": "#EF4444",
        "info": "#3B82F6",
        "gold": "#DAA520",
        "navy": "#010080"
    }',
    brand_typography = '{
        "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif",
        "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif",
        "monoFont": "Monaco, Consolas, monospace"
    }',
    branding = '{
        "logoUrl": "/api/tenants/assets/logo/default",
        "faviconUrl": "/api/tenants/assets/favicon/default",
        "tagline": "Your Success, Our Business",
        "colors": {
            "primary": "#010080",
            "secondary": "#DAA520",
            "accent": "#FFFFFF",
            "background": "#F9FAFB",
            "surface": "#FFFFFF",
            "error": "#EF4444",
            "warning": "#F59E0B",
            "info": "#3B82F6",
            "success": "#10B981",
            "text": "#1F2937",
            "textSecondary": "#6B7280"
        },
        "typography": {
            "fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif",
            "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"
        },
        "layout": {
            "borderRadius": "8px",
            "spacing": "16px"
        }
    }',
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'fmfb';

-- Store the FMFB logo as Base64 in tenant_assets
-- Note: The actual Base64 data will be inserted via a separate script due to size
-- This is a placeholder for the structure