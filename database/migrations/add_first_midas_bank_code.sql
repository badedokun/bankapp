-- Add First Midas Microfinance Bank Code
-- Bank Code: 513 (first 3 digits of 51333)
-- Date: 2025-10-03

-- Insert First Midas Microfinance Bank
INSERT INTO platform.ngn_bank_codes (bank_name, bank_code_3, bank_type, status)
VALUES ('FIRST MIDAS MICROFINANCE BANK', '513', 'MICROFINANCE', 'ACTIVE')
ON CONFLICT (bank_code_3) DO NOTHING;

-- Update FMFB tenant with bank code
UPDATE platform.tenants
SET bank_code = '513'
WHERE name = 'fmfb';

-- Verification queries
-- SELECT bank_name, bank_code_3, bank_type FROM platform.ngn_bank_codes WHERE bank_code_3 = '513';
-- SELECT name, bank_code FROM platform.tenants WHERE name = 'fmfb';
