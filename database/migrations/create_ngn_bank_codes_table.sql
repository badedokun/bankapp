-- Nigerian Bank Codes Table
-- Contains official bank codes for Nigerian financial institutions
-- Source: Access Bank bank codes list

CREATE TABLE IF NOT EXISTS platform.ngn_bank_codes (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  bank_code_3 VARCHAR(3) NOT NULL UNIQUE,  -- 3-character code (e.g., '044', 'F12', 'H14')
  bank_code_6 VARCHAR(6),  -- 6-character code (to be populated later)
  bank_code_9 VARCHAR(9),  -- 9-character code (to be populated later)
  bank_type VARCHAR(50),  -- 'COMMERCIAL', 'MICROFINANCE', 'MORTGAGE', 'PAYMENT_SERVICE', 'FINTECH'
  status VARCHAR(20) DEFAULT 'ACTIVE',  -- 'ACTIVE', 'INACTIVE', 'MERGED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ngn_bank_code_3 ON platform.ngn_bank_codes(bank_code_3);
CREATE INDEX IF NOT EXISTS idx_ngn_bank_code_6 ON platform.ngn_bank_codes(bank_code_6);
CREATE INDEX IF NOT EXISTS idx_ngn_bank_code_9 ON platform.ngn_bank_codes(bank_code_9);
CREATE INDEX IF NOT EXISTS idx_ngn_bank_name ON platform.ngn_bank_codes(bank_name);
CREATE INDEX IF NOT EXISTS idx_ngn_bank_type ON platform.ngn_bank_codes(bank_type);
CREATE INDEX IF NOT EXISTS idx_ngn_bank_status ON platform.ngn_bank_codes(status);

-- Add comment
COMMENT ON TABLE platform.ngn_bank_codes IS 'Nigerian bank codes from CBN/NIBSS - supports 3, 6, and 9 character formats';
COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_3 IS '3-character bank code used in transfers (e.g., 044 for Access Bank)';
COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_6 IS '6-character bank code (to be populated)';
COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_9 IS '9-character bank code (inferred from 6-char or to be populated)';
