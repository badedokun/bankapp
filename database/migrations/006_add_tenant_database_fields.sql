-- Migration: 006_add_tenant_database_fields.sql
-- Description: Add database connection fields to tenants table for proper isolation
-- Version: 1.0
-- Date: 2025-09-05
-- Author: OrokiiPay Development Team

-- Add database connection fields to tenants table
ALTER TABLE platform.tenants
ADD COLUMN IF NOT EXISTS database_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS database_host VARCHAR(255) DEFAULT 'localhost',
ADD COLUMN IF NOT EXISTS database_port INTEGER DEFAULT 5433,
ADD COLUMN IF NOT EXISTS connection_string TEXT,
ADD COLUMN IF NOT EXISTS database_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (database_status IN ('pending', 'provisioning', 'active', 'maintenance', 'error'));

-- Create index for database status
CREATE INDEX IF NOT EXISTS idx_tenants_database_status 
ON platform.tenants(database_status);

-- Add comment
COMMENT ON COLUMN platform.tenants.database_name IS 'Isolated database name for this tenant';
COMMENT ON COLUMN platform.tenants.connection_string IS 'PostgreSQL connection string for tenant database';
COMMENT ON COLUMN platform.tenants.database_status IS 'Current status of tenant database';