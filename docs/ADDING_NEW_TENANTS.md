# Adding New Tenants - Multi-Tenant Bank Code Configuration

This guide explains how to add new tenants to the OrokiiPay platform with proper bank code configuration for same-bank transfers.

## Overview

The platform supports multiple banks using a single codebase. **All bank tenants require a bank code** for processing same-bank (intrabank) transfers between their customers.

Bank codes in Nigeria come in various lengths and formats (alphanumeric supported):

- **3 characters**: Traditional NIBSS codes (e.g., "011" Access Bank, "058" GTBank, "ABC")
- **5 characters**: Microfinance banks (e.g., "51333" FMFB, "AB123")
- **6 characters**: Some financial institutions (e.g., "123456", "BANK01")
- **9 characters**: Extended codes for specific services (e.g., "ABC123XYZ")

**Bank Code Format**: Codes can be **alphanumeric** (letters A-Z and numbers 0-9). The system supports codes up to 10 characters in length.

**Important**: While the system technically allows NULL bank codes (for development/demo tenants), all production bank tenants **MUST** have a valid bank code configured to support same-bank transfers.

## Step 1: Add Bank to `ngn_bank_codes` Table

First, add the bank to the Nigerian bank codes table with all applicable code variants:

```sql
-- Example: Adding GTBank (traditional 3-digit code)
INSERT INTO platform.ngn_bank_codes (
  bank_name,
  bank_code_3,
  bank_code_5,
  bank_code_6,
  bank_code_9,
  bank_type,
  status
) VALUES (
  'Guaranty Trust Bank Plc',
  '058',           -- 3-digit NIBSS code
  NULL,            -- No 5-digit variant
  NULL,            -- No 6-digit variant
  NULL,            -- No 9-digit variant
  'Commercial Bank',
  'ACTIVE'
);

-- Example: Adding a microfinance bank with 5-character code
INSERT INTO platform.ngn_bank_codes (
  bank_name,
  bank_code_3,
  bank_code_5,
  bank_code_6,
  bank_code_9,
  bank_type,
  status
) VALUES (
  'Example Microfinance Bank Limited',
  '514',           -- First 3 characters
  '51400',         -- Full 5-character code (numeric)
  NULL,
  NULL,
  'Microfinance Bank',
  'ACTIVE'
);

-- Example: Adding a bank with alphanumeric code
INSERT INTO platform.ngn_bank_codes (
  bank_name,
  bank_code_3,
  bank_code_5,
  bank_code_6,
  bank_code_9,
  bank_type,
  status
) VALUES (
  'Digital Bank Plc',
  'DB1',           -- 3-character alphanumeric
  NULL,
  'DBANK1',        -- 6-character alphanumeric
  NULL,
  'Digital Bank',
  'ACTIVE'
);
```

## Step 2: Update Tenant Record

Update the tenant's `bank_code` field to match one of the codes from `ngn_bank_codes`:

```sql
-- For tenants with same-bank transfer support
UPDATE platform.tenants
SET bank_code = '058'  -- Use the appropriate code (3, 5, 6, or 9 digits)
WHERE name = 'gtbank';

-- For tenants WITHOUT same-bank transfer support
UPDATE platform.tenants
SET bank_code = NULL
WHERE name = 'some-tenant';
```

## Step 3: Verification

Verify the configuration:

```sql
-- Check tenant configuration
SELECT t.name, t.display_name, t.bank_code,
       n.bank_name, n.bank_type
FROM platform.tenants t
LEFT JOIN platform.ngn_bank_codes n
  ON t.bank_code IN (n.bank_code_3, n.bank_code_5, n.bank_code_6, n.bank_code_9)
WHERE t.name = 'your-tenant-name';
```

## How It Works

### Frontend Flow
1. User selects "Same Bank Transfer"
2. Frontend calls `APIService.getProfile()` to get user's tenant info
3. Frontend uses `userProfile.tenant.bankCode` as the recipient bank code
4. Falls back to `theme.tenantCode` if bank code is unavailable

### Backend Flow
1. Transfer API receives `recipientBankCode` from frontend
2. Validates bank code length (supports up to 10 characters)
3. Inserts into `tenant.transfers` table with the bank code
4. Processes transfer using NIBSS or internal logic

### Database Validation
- Trigger `validate_tenant_bank_code` ensures bank codes exist in `ngn_bank_codes`
- **NULL values are allowed** for tenants without same-bank transfer support
- Invalid codes are rejected with clear error messages

## Multi-Tenant Safety

The solution is **fully multi-tenant**:

✅ **Generic Database Schema**
- `platform.tenants.bank_code` supports VARCHAR(10) for any length
- `tenant.transfers.recipient_bank_code` supports VARCHAR(10)
- `platform.ngn_bank_codes` has columns for 3, 5, 6, and 9-digit codes

✅ **Dynamic Frontend Code**
- Uses `userProfile.tenant.bankCode` (no hardcoded values)
- Falls back to theme context for flexibility
- Works for any tenant configuration

✅ **Flexible Backend API**
- Profile API returns `tenant.bankCode` for any tenant
- Transfer API accepts variable-length bank codes
- Validation supports all code lengths

✅ **NULL Safety (for Development/Demo Only)**
- NULL is allowed for development/demo tenants during setup
- **All production bank tenants MUST have valid bank codes**
- Same-bank transfers require tenant bank code
- Interbank transfers use recipient's selected bank

## Examples

### FMFB (Microfinance Bank - 5 digits)
```sql
-- Bank code entry
INSERT INTO platform.ngn_bank_codes VALUES (
  'Firstmidas Microfinance Bank Limited',
  '513', '51333', NULL, NULL, 'Microfinance Bank', 'ACTIVE'
);

-- Tenant configuration
UPDATE platform.tenants SET bank_code = '51333' WHERE name = 'fmfb';
```

### GTBank (Commercial Bank - 3 characters)
```sql
-- Bank code entry
INSERT INTO platform.ngn_bank_codes VALUES (
  'Guaranty Trust Bank Plc',
  '058', NULL, NULL, NULL, 'Commercial Bank', 'ACTIVE'
);

-- Tenant configuration
UPDATE platform.tenants SET bank_code = '058' WHERE name = 'gtbank';
```

### Digital Bank (Alphanumeric Code - 6 characters)
```sql
-- Bank code entry with alphanumeric code
INSERT INTO platform.ngn_bank_codes VALUES (
  'Digital Bank Plc',
  'DB1', NULL, 'DBANK1', NULL, 'Digital Bank', 'ACTIVE'
);

-- Tenant configuration using alphanumeric code
UPDATE platform.tenants SET bank_code = 'DBANK1' WHERE name = 'digitalbank';
```

### Development/Demo Tenant (Optional)
```sql
-- For development or demo tenants that don't need same-bank transfers
-- NULL is allowed but NOT recommended for production bank tenants
UPDATE platform.tenants SET bank_code = NULL WHERE name = 'demo-bank';
```

**Note**: All production bank tenants should have a valid bank code configured.

## Troubleshooting

### Error: "Invalid bank code: XXX. Must exist in ngn_bank_codes table"
**Solution**: Add the bank code to `platform.ngn_bank_codes` table first.

### Error: "value too long for type character varying(3)"
**Solution**: Run migration `014_fix_bank_code_length.sql` to extend column to VARCHAR(10).

### Same-bank transfers not working
**Solution**: Ensure tenant has valid `bank_code` set and exists in `ngn_bank_codes`.

### Frontend shows "undefined" for bank code
**Solution**: Check that profile API returns `tenant.bankCode` field. Run migration `015_add_fmfb_bank_code.sql` if missing.

## Related Files

- **Migration**: `database/migrations/015_add_fmfb_bank_code.sql`
- **Frontend**: `src/screens/transfers/CompleteTransferFlow.tsx` (line 149-177)
- **Backend**: `server/routes/auth.ts` (line 342-390)
- **Database Schema**: `database/migrations/014_fix_bank_code_length.sql`
