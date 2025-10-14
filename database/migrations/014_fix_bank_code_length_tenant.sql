-- Fix bank_code length in tenant database to support variable-length codes
-- Nigerian banks use different code lengths and formats:
-- - 3 characters: Traditional NIBSS codes (e.g., "011", "058", "ABC")
-- - 5 characters: Microfinance banks (e.g., "51333", "AB123")
-- - 6 characters: Some financial institutions (e.g., "123456", "BANK01")
-- - 9 characters: Extended codes (e.g., "ABC123XYZ")
-- VARCHAR(10) supports all formats - codes can be alphanumeric (A-Z, 0-9)

-- Drop views that depend on tenant.transfers.recipient_bank_code
DROP VIEW IF EXISTS tenant.transfer_history_view CASCADE;

-- Fix tenant.transfers table
ALTER TABLE tenant.transfers
ALTER COLUMN recipient_bank_code TYPE VARCHAR(10);

-- Recreate transfer_history_view if it existed
CREATE OR REPLACE VIEW tenant.transfer_history_view AS
SELECT
    t.*,
    u.email as sender_email,
    u.first_name || ' ' || u.last_name as sender_full_name
FROM tenant.transfers t
LEFT JOIN tenant.users u ON t.sender_id = u.id;

-- Also fix reversals table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'tenant'
        AND table_name = 'reversals'
    ) THEN
        ALTER TABLE tenant.reversals
        ALTER COLUMN recipient_bank_code TYPE VARCHAR(10);
    END IF;
END $$;
