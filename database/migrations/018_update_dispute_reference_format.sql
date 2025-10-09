-- ============================================================================
-- Migration 018: Update Dispute Reference Format
-- Description: Add tenant prefix and localized date format to dispute numbers
-- Created: 2025-10-08
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS tenant.generate_dispute_number();

-- Create updated function with tenant prefix and locale support
CREATE OR REPLACE FUNCTION tenant.generate_dispute_number(
  tenant_code TEXT DEFAULT 'DFLT',
  tenant_locale TEXT DEFAULT 'en-US'
)
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_num INT;
  dispute_num TEXT;
  date_pattern TEXT;
BEGIN
  -- Determine date format based on locale
  -- Nigeria (en-NG), Europe (en-GB, fr-FR, de-DE, etc.): YYYYDDMM (Year-Day-Month)
  -- US (en-US), Default: YYYYMMDD (Year-Month-Day)

  IF tenant_locale LIKE 'en-NG%' OR    -- Nigeria
     tenant_locale LIKE 'en-GB%' OR    -- UK
     tenant_locale LIKE 'en-EU%' OR    -- Europe generic
     tenant_locale LIKE 'fr-%' OR      -- France
     tenant_locale LIKE 'de-%' OR      -- Germany
     tenant_locale LIKE 'es-%' OR      -- Spain
     tenant_locale LIKE 'it-%' OR      -- Italy
     tenant_locale LIKE 'nl-%' OR      -- Netherlands
     tenant_locale LIKE 'pt-%' OR      -- Portugal
     tenant_locale LIKE 'pl-%' OR      -- Poland
     tenant_locale LIKE 'sv-%' THEN    -- Sweden
    -- Format: YYYYDDMM (Year-Day-Month)
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYDD') || TO_CHAR(CURRENT_DATE, 'MM');
    date_pattern := 'DSP-' || UPPER(tenant_code) || '-' || date_part || '-%';
  ELSE
    -- Format: YYYYMMDD (Year-Month-Day) - US and default
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    date_pattern := 'DSP-' || UPPER(tenant_code) || '-' || date_part || '-%';
  END IF;

  -- Get next sequence number for today (scoped by tenant and date format)
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(dispute_number FROM length(date_pattern) - 3 FOR 4)
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM tenant.transaction_disputes
  WHERE dispute_number LIKE date_pattern;

  -- Generate dispute number with zero-padded sequence
  -- Format: DSP-{TENANT}-{DATE}-{SEQUENCE}
  dispute_num := 'DSP-' || UPPER(tenant_code) || '-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN dispute_num;
END;
$$ LANGUAGE plpgsql;

-- Update comment
COMMENT ON FUNCTION tenant.generate_dispute_number IS 'Generates tenant-prefixed dispute reference with localized date format (YYYYDDMM for Nigeria/Europe, YYYYMMDD for US)';

-- Example usage:
-- SELECT tenant.generate_dispute_number('FMFB', 'en-NG');  -- Returns: DSP-FMFB-20250810-0001 (Oct 8, 2025)
-- SELECT tenant.generate_dispute_number('ACME', 'en-US');  -- Returns: DSP-ACME-20251008-0001 (Oct 8, 2025)

-- ============================================================================
-- End of Migration 018
-- ============================================================================
