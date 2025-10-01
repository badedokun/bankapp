-- ============================================================
-- Migration 012: Global Deployment Support
-- Add currency, locale, timezone to platform.tenants
-- Description: Enable multi-currency, multi-locale, multi-timezone support
-- Author: Claude Code Assistant
-- Date: 2025-09-30
-- ============================================================

BEGIN;

-- Add new columns to platform.tenants for global support
ALTER TABLE platform.tenants
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN'
    CHECK (currency IN ('NGN', 'USD', 'EUR', 'GBP', 'CAD', 'ZAR', 'KES', 'GHS')),
  ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en-NG'
    CHECK (locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS number_format JSONB DEFAULT '{"decimal": ".", "thousands": ",", "precision": 2}'::jsonb;

-- Update existing FMFB tenant with explicit values
UPDATE platform.tenants
SET
  currency = 'NGN',
  locale = 'en-NG',
  timezone = 'Africa/Lagos',
  date_format = 'DD/MM/YYYY',
  number_format = '{"decimal": ".", "thousands": ",", "precision": 2}'::jsonb
WHERE name = 'fmfb';

-- Create index for currency lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_tenants_currency ON platform.tenants(currency);
CREATE INDEX IF NOT EXISTS idx_tenants_locale ON platform.tenants(locale);

-- Add helpful comments for documentation
COMMENT ON COLUMN platform.tenants.currency IS 'ISO 4217 currency code (NGN, USD, EUR, GBP, CAD, ZAR, KES, GHS)';
COMMENT ON COLUMN platform.tenants.locale IS 'BCP 47 locale code (e.g., en-US, en-NG, fr-CA, de-DE)';
COMMENT ON COLUMN platform.tenants.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Africa/Lagos)';
COMMENT ON COLUMN platform.tenants.date_format IS 'Display format for dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)';
COMMENT ON COLUMN platform.tenants.number_format IS 'Number formatting configuration (decimal separator, thousands separator, precision)';

-- Extend region CHECK constraint to support global regions
ALTER TABLE platform.tenants
  DROP CONSTRAINT IF EXISTS tenants_region_check;

ALTER TABLE platform.tenants
  ADD CONSTRAINT tenants_region_check CHECK (region IN (
    -- Africa
    'africa-west', 'africa-east', 'africa-south', 'africa-north', 'africa-central',
    -- North America
    'north-america-east', 'north-america-west', 'north-america-central',
    -- Europe
    'europe-west', 'europe-central', 'europe-east', 'europe-north', 'europe-south',
    -- Asia Pacific
    'asia-pacific-east', 'asia-pacific-southeast', 'asia-pacific-south',
    -- Middle East
    'middle-east',
    -- South America
    'south-america-east', 'south-america-west',
    -- Legacy (for backward compatibility - will be migrated)
    'nigeria-west'
  ));

-- Update legacy region value to new standard
UPDATE platform.tenants
SET region = 'africa-west'
WHERE region = 'nigeria-west';

-- Add updated_at timestamp update
UPDATE platform.tenants
SET updated_at = NOW()
WHERE currency IS NOT NULL;

COMMIT;

-- ============================================================
-- Verification Queries (for testing)
-- ============================================================

-- Verify tenant configuration
SELECT
  name,
  subdomain,
  currency,
  locale,
  timezone,
  date_format,
  region,
  created_at,
  updated_at
FROM platform.tenants
ORDER BY created_at DESC;

-- Verify indexes created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tenants'
  AND schemaname = 'platform'
ORDER BY indexname;

-- Check constraints
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'platform.tenants'::regclass
  AND contype = 'c'
ORDER BY conname;
