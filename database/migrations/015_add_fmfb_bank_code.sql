-- Add support for 5-character bank codes and insert FMFB
-- Nigerian banks use various code lengths and formats:
-- - 3 characters: Traditional NIBSS codes (e.g., "011", "058", "AAA")
-- - 5 characters: Microfinance banks (e.g., "51333" FMFB, "ABC12")
-- - 6 characters: Some financial institutions (e.g., "123456", "BANK01")
-- - 9 characters: Extended codes (alphanumeric supported)

-- Step 1: Add bank_code_5 column to support 5-digit codes
ALTER TABLE platform.ngn_bank_codes
ADD COLUMN IF NOT EXISTS bank_code_5 VARCHAR(5);

-- Step 2: Add index for bank_code_5
CREATE INDEX IF NOT EXISTS idx_ngn_bank_code_5 ON platform.ngn_bank_codes(bank_code_5);

-- Step 3: Drop the foreign key constraint that requires exact 3-digit match
ALTER TABLE platform.tenants
DROP CONSTRAINT IF EXISTS fk_tenants_bank_code;

-- Step 4: Insert Firstmidas Microfinance Bank
INSERT INTO platform.ngn_bank_codes (
  bank_name,
  bank_code_3,
  bank_code_5,
  bank_code_6,
  bank_code_9,
  bank_type,
  status
) VALUES (
  'Firstmidas Microfinance Bank Limited',
  '513',           -- 3-digit code (first 3 digits)
  '51333',         -- Full 5-digit code
  NULL,            -- No 6-digit variant
  NULL,            -- No 9-digit variant
  'Microfinance Bank',
  'ACTIVE'
) ON CONFLICT (bank_code_3) DO UPDATE
SET
  bank_name = EXCLUDED.bank_name,
  bank_code_5 = EXCLUDED.bank_code_5,
  bank_type = EXCLUDED.bank_type,
  status = EXCLUDED.status;

-- Step 5: Update FMFB tenant to use the 5-digit code
UPDATE platform.tenants
SET bank_code = '51333'
WHERE name = 'fmfb';

-- Step 6: Create a validation function for bank codes
-- Multi-tenant safe: Allows NULL for tenants without same-bank transfer support
CREATE OR REPLACE FUNCTION platform.validate_bank_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL bank codes (tenant may not support same-bank transfers)
  IF NEW.bank_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Validate non-NULL bank codes against ngn_bank_codes table
  IF NOT EXISTS (
    SELECT 1 FROM platform.ngn_bank_codes
    WHERE bank_code_3 = NEW.bank_code
       OR bank_code_5 = NEW.bank_code
       OR bank_code_6 = NEW.bank_code
       OR bank_code_9 = NEW.bank_code
  ) THEN
    RAISE EXCEPTION 'Invalid bank code: %. Must exist in ngn_bank_codes table.', NEW.bank_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to validate bank codes on insert/update
DROP TRIGGER IF EXISTS validate_tenant_bank_code ON platform.tenants;
CREATE TRIGGER validate_tenant_bank_code
  BEFORE INSERT OR UPDATE OF bank_code ON platform.tenants
  FOR EACH ROW
  EXECUTE FUNCTION platform.validate_bank_code();
