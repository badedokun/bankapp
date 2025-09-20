-- Migration: 005_tenant_assets_table.sql
-- Description: Create tenant assets table for storing branding data and Base64 assets
-- Version: 1.0
-- Date: 2025-09-05
-- Author: OrokiiPay Development Team

-- Create tenant_assets table for storing branding data
CREATE TABLE IF NOT EXISTS platform.tenant_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'hero_image', 'background', 'icon', 'stylesheet')),
    asset_name VARCHAR(100) NOT NULL,
    asset_data TEXT NOT NULL, -- Base64 encoded asset data
    mime_type VARCHAR(100) NOT NULL, -- e.g., 'image/png', 'image/svg+xml', 'text/css'
    file_size INTEGER NOT NULL, -- Size in bytes
    dimensions JSONB, -- For images: {"width": 200, "height": 100}
    metadata JSONB DEFAULT '{}', -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate assets for the same tenant
    UNIQUE(tenant_id, asset_type, asset_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_assets_tenant_type ON platform.tenant_assets(tenant_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_tenant_assets_name ON platform.tenant_assets(asset_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_assets_updated_at
    BEFORE UPDATE ON platform.tenant_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_assets_updated_at();

-- Update tenants table to include more comprehensive branding
ALTER TABLE platform.tenants 
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{
    "primary": "#4F46E5",
    "secondary": "#6366F1", 
    "accent": "#8B5CF6",
    "background": "#F9FAFB",
    "surface": "#FFFFFF",
    "text": "#1F2937",
    "textSecondary": "#6B7280",
    "success": "#10B981",
    "warning": "#F59E0B", 
    "error": "#EF4444",
    "info": "#3B82F6"
}',
ADD COLUMN IF NOT EXISTS brand_typography JSONB DEFAULT '{
    "primaryFont": "Inter, system-ui, sans-serif",
    "headingFont": "Inter, system-ui, sans-serif",
    "monoFont": "Monaco, Consolas, monospace"
}',
ADD COLUMN IF NOT EXISTS brand_assets JSONB DEFAULT '{}';

-- Create function to get tenant asset URL
CREATE OR REPLACE FUNCTION get_tenant_asset_url(p_tenant_id UUID, p_asset_type VARCHAR, p_asset_name VARCHAR DEFAULT 'default')
RETURNS VARCHAR AS $$
DECLARE
    asset_exists BOOLEAN;
BEGIN
    -- Check if asset exists
    SELECT EXISTS(
        SELECT 1 FROM platform.tenant_assets 
        WHERE tenant_id = p_tenant_id 
        AND asset_type = p_asset_type 
        AND asset_name = p_asset_name
    ) INTO asset_exists;
    
    -- Return API URL if asset exists
    IF asset_exists THEN
        RETURN '/api/tenants/' || p_tenant_id || '/assets/' || p_asset_type || '/' || p_asset_name;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;