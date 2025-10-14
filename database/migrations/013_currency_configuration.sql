-- ============================================================
-- Migration 013: Currency Configuration
-- Master currency configuration and exchange rates
-- Description: Create currency_config and exchange_rates tables
-- Author: Claude Code Assistant
-- Date: 2025-09-30
-- ============================================================

BEGIN;

-- ============================================================
-- Currency Configuration Table
-- ============================================================

CREATE TABLE IF NOT EXISTS platform.currency_config (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  decimal_places SMALLINT DEFAULT 2 CHECK (decimal_places >= 0 AND decimal_places <= 8),
  symbol_position VARCHAR(10) DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')),
  enabled BOOLEAN DEFAULT true,
  countries JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert supported currencies
INSERT INTO platform.currency_config (code, name, symbol, decimal_places, symbol_position, countries, metadata) VALUES
  -- African Currencies
  ('NGN', 'Nigerian Naira', '₦', 2, 'before', '["NG"]'::jsonb, '{"region": "africa-west", "centralBank": "CBN"}'::jsonb),
  ('ZAR', 'South African Rand', 'R', 2, 'before', '["ZA"]'::jsonb, '{"region": "africa-south", "centralBank": "SARB"}'::jsonb),
  ('KES', 'Kenyan Shilling', 'KSh', 2, 'before', '["KE"]'::jsonb, '{"region": "africa-east", "centralBank": "CBK"}'::jsonb),
  ('GHS', 'Ghanaian Cedi', 'GH₵', 2, 'before', '["GH"]'::jsonb, '{"region": "africa-west", "centralBank": "BOG"}'::jsonb),

  -- North American Currencies
  ('USD', 'US Dollar', '$', 2, 'before', '["US"]'::jsonb, '{"region": "north-america", "centralBank": "Federal Reserve"}'::jsonb),
  ('CAD', 'Canadian Dollar', '$', 2, 'before', '["CA"]'::jsonb, '{"region": "north-america", "centralBank": "Bank of Canada"}'::jsonb),

  -- European Currencies
  ('EUR', 'Euro', '€', 2, 'before', '["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "GR"]'::jsonb, '{"region": "europe", "centralBank": "ECB"}'::jsonb),
  ('GBP', 'British Pound', '£', 2, 'before', '["GB"]'::jsonb, '{"region": "europe", "centralBank": "Bank of England"}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  updated_at = NOW();

-- Add comments
COMMENT ON TABLE platform.currency_config IS 'Master configuration for supported currencies worldwide';
COMMENT ON COLUMN platform.currency_config.code IS 'ISO 4217 3-letter currency code';
COMMENT ON COLUMN platform.currency_config.symbol IS 'Currency symbol (e.g., $, €, ₦)';
COMMENT ON COLUMN platform.currency_config.decimal_places IS 'Number of decimal places for currency (usually 2)';
COMMENT ON COLUMN platform.currency_config.symbol_position IS 'Position of symbol relative to amount (before/after)';
COMMENT ON COLUMN platform.currency_config.countries IS 'Array of ISO 3166-1 alpha-2 country codes';
COMMENT ON COLUMN platform.currency_config.metadata IS 'Additional currency metadata (region, central bank, etc.)';

-- ============================================================
-- Exchange Rates Table
-- ============================================================

CREATE TABLE IF NOT EXISTS platform.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL REFERENCES platform.currency_config(code),
  to_currency VARCHAR(3) NOT NULL REFERENCES platform.currency_config(code),
  rate DECIMAL(20, 8) NOT NULL CHECK (rate > 0),
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'central_bank', 'market')),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure from and to currencies are different
  CHECK (from_currency != to_currency)
);

-- Create unique index for currency pairs (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_pair_active
  ON platform.exchange_rates(from_currency, to_currency, valid_from)
  WHERE is_active = true;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON platform.exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to ON platform.exchange_rates(to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_valid ON platform.exchange_rates(valid_from, valid_until);

-- Insert sample exchange rates (approximate rates as of Sept 2025)
-- Note: In production, these should be updated via API from reliable FX sources
INSERT INTO platform.exchange_rates (from_currency, to_currency, rate, source) VALUES
  -- NGN conversions
  ('NGN', 'USD', 0.0013, 'manual'),
  ('USD', 'NGN', 769.00, 'manual'),
  ('NGN', 'EUR', 0.0012, 'manual'),
  ('EUR', 'NGN', 833.00, 'manual'),
  ('NGN', 'GBP', 0.0010, 'manual'),
  ('GBP', 'NGN', 1000.00, 'manual'),

  -- Major currency pairs
  ('USD', 'EUR', 0.92, 'manual'),
  ('EUR', 'USD', 1.09, 'manual'),
  ('USD', 'GBP', 0.79, 'manual'),
  ('GBP', 'USD', 1.27, 'manual'),
  ('USD', 'CAD', 1.36, 'manual'),
  ('CAD', 'USD', 0.74, 'manual'),
  ('EUR', 'GBP', 0.86, 'manual'),
  ('GBP', 'EUR', 1.16, 'manual'),

  -- African currency pairs
  ('NGN', 'ZAR', 0.025, 'manual'),
  ('ZAR', 'NGN', 40.00, 'manual'),
  ('NGN', 'KES', 0.17, 'manual'),
  ('KES', 'NGN', 5.90, 'manual'),
  ('NGN', 'GHS', 0.11, 'manual'),
  ('GHS', 'NGN', 9.10, 'manual')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE platform.exchange_rates IS 'Foreign exchange rates for currency conversion';
COMMENT ON COLUMN platform.exchange_rates.rate IS 'Exchange rate (1 from_currency = rate * to_currency)';
COMMENT ON COLUMN platform.exchange_rates.source IS 'Source of exchange rate data';
COMMENT ON COLUMN platform.exchange_rates.valid_from IS 'Start of validity period for this rate';
COMMENT ON COLUMN platform.exchange_rates.valid_until IS 'End of validity period (NULL = indefinite)';

-- ============================================================
-- Helper Functions
-- ============================================================

-- Function to get current exchange rate
CREATE OR REPLACE FUNCTION platform.get_exchange_rate(
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3)
)
RETURNS DECIMAL(20, 8) AS $$
DECLARE
  v_rate DECIMAL(20, 8);
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;

  -- Get most recent active rate
  SELECT rate INTO v_rate
  FROM platform.exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;

  -- If no rate found, return NULL
  IF v_rate IS NULL THEN
    RAISE NOTICE 'No exchange rate found for % to %', p_from_currency, p_to_currency;
    RETURN NULL;
  END IF;

  RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION platform.get_exchange_rate IS 'Get current exchange rate between two currencies';

-- Function to convert amount between currencies
CREATE OR REPLACE FUNCTION platform.convert_currency(
  p_amount DECIMAL,
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3)
)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL(20, 8);
BEGIN
  -- Get exchange rate
  v_rate := platform.get_exchange_rate(p_from_currency, p_to_currency);

  -- If no rate found, return NULL
  IF v_rate IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convert and return
  RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION platform.convert_currency IS 'Convert amount from one currency to another using current exchange rate';

COMMIT;

-- ============================================================
-- Verification Queries
-- ============================================================

-- List all supported currencies
SELECT
  code,
  name,
  symbol,
  decimal_places,
  symbol_position,
  jsonb_array_length(countries) AS country_count,
  enabled,
  metadata->>'region' AS region,
  metadata->>'centralBank' AS central_bank
FROM platform.currency_config
ORDER BY code;

-- Sample exchange rate query
SELECT
  from_currency,
  to_currency,
  rate,
  source,
  valid_from,
  is_active
FROM platform.exchange_rates
WHERE is_active = true
ORDER BY from_currency, to_currency
LIMIT 20;

-- Test conversion function
SELECT
  '100 NGN to USD' AS conversion,
  platform.convert_currency(100, 'NGN', 'USD') AS result
UNION ALL
SELECT
  '100 USD to NGN',
  platform.convert_currency(100, 'USD', 'NGN')
UNION ALL
SELECT
  '100 USD to EUR',
  platform.convert_currency(100, 'USD', 'EUR');
