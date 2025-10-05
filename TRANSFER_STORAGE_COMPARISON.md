# Transfer Reference Storage - Actual Behavior

**Date**: 2025-10-03
**Test Results**: Live database queries

---

## Test Transfers

### 1. External/Inter-Bank Transfer
- **Reference**: `51301K6NYHVRVM797A65A44`
- **Amount**: ₦15,000.00
- **Recipient**: Jane Smith (0987654321)
- **Status**: successful

### 2. Same-Bank Transfer
- **Reference**: `51301K6NZ27JKCW204ECD76`
- **Amount**: ₦10,000.00
- **Recipient**: Test Account 4321 (0987654321)
- **Status**: successful

---

## Storage Location Findings

### ✅ Both Transfer Types Stored in SAME Table!

**Surprise Discovery**: Both external and same-bank transfers are stored in **`tenant.transfers`**, NOT in separate tables!

| Transfer Type | Expected Table | Actual Table | Reference Column |
|--------------|----------------|--------------|------------------|
| **External** | `tenant.transfers` | ✅ `tenant.transfers` | `reference` |
| **Same-Bank** | `tenant.internal_transfers` | ❌ `tenant.transfers` | `reference` |

---

## Reference `51301K6NZ27JKCW204ECD76` (Same-Bank Transfer)

### Storage Details:

#### 1. ✅ `tenant.transfers` table
```sql
id:                       9e1f5017-3970-4e5b-97b4-15e420865842
reference:                51301K6NZ27JKCW204ECD76  ✅
amount:                   10000.00
status:                   successful
recipient_account_number: 0987654321
recipient_name:           Test Account 4321
recipient_user_id:        NULL  ⚠️ (should be set for internal)
created_at:               2025-10-03 17:18:49.854378
```

#### 2. ✅ `tenant.transactions` table (Auto-synced)
```sql
id:        2ec2fe4a-5007-4251-b3e3-0d4a23123747
reference: 51301K6NZ27JKCW204ECD76  ✅
amount:    10000.00
type:      money_transfer
status:    pending
created_at: 2025-10-03 17:18:49.854378
```

#### 3. ❌ `tenant.internal_transfers` table
```
(0 rows) - NOT stored here!
```

#### 4. ❌ `tenant.wallet_transactions` table
```
(0 rows) - Reference not used in wallet transactions
```

---

## Current Implementation Analysis

### Route Used: `/api/transfers/initiate`

Both transfer types (external and same-bank) go through the **same route**:
- `POST /api/transfers/initiate`
- Code: `server/routes/transfers.ts`

**Flow**:
```typescript
1. Receive transfer request
2. Generate reference: generateTransferRef(tenantBankCode)
   → Result: "51301K6NZ27JKCW204ECD76"
3. Check if recipient is internal user:
   → Query: SELECT id FROM tenant.users WHERE account_number = $1
4. Set isInternalTransfer flag based on query result
5. INSERT INTO tenant.transfers (
     reference = "51301K6NZ27JKCW204ECD76",
     recipient_user_id = recipientUserId OR NULL,
     status = 'successful' OR 'pending'
   )
6. If internal: Credit recipient wallet immediately
7. If external: Queue for NIBSS processing
```

### Key Difference: `recipient_user_id`

**Same-Bank Transfer**:
- `recipient_user_id` should be set to the recipient's user ID
- Status: `successful` (instant)
- Wallet credited immediately

**External Transfer**:
- `recipient_user_id`: NULL
- Status: `pending` (NIBSS processing)
- Wallet credited after NIBSS confirmation

---

## Why `internal_transfers` Table Not Used?

The **`tenant.internal_transfers`** table exists but is **NOT being used** by the current implementation!

### Possible Reasons:

1. **Legacy Route Still Active**:
   - Old route `/api/transfers/initiate` handles both types
   - New route `/api/internal-transfers` (using `InternalTransferService`) may not be called by frontend

2. **Frontend Routing**:
   - Frontend calls `/api/transfers/initiate` for all transfers
   - Doesn't distinguish between internal and external at API level

3. **Duplicate Services**:
   - `InternalTransferService` → writes to `tenant.internal_transfers` ✅
   - Legacy route → writes to `tenant.transfers` for both types ✅

---

## Service Architecture

### Active Service (Currently Used)
```
Frontend → POST /api/transfers/initiate
           ↓
        server/routes/transfers.ts (Legacy route)
           ↓
        INSERT INTO tenant.transfers
           ↓
        Response: { reference: "51301K6NZ27JKCW204ECD76" }
```

### Inactive Service (Exists but Not Called)
```
Frontend → POST /api/internal-transfers
           ↓
        InternalTransferService.processTransfer()
           ↓
        INSERT INTO tenant.internal_transfers
           ↓
        Response: { reference: "51301K6NZ27JKCW204ECD76" }
```

---

## Wallet Balance Updates

### Current Implementation (Legacy Route)

**Same-Bank Transfer** (Line 558-600 in `server/routes/transfers.ts`):

```typescript
// Debit sender wallet
await query(`
  UPDATE tenant.wallets
  SET balance = balance - $1, updated_at = NOW()
  WHERE id = $2
`, [transferAmount, wallet.id]);

// Credit recipient wallet (if internal)
if (isInternalTransfer) {
  const recipientWalletResult = await query(`
    SELECT id, balance FROM tenant.wallets
    WHERE user_id = $1 AND tenant_id = $2 AND is_primary = true
  `, [recipientUserId, tenantId]);

  await query(`
    UPDATE tenant.wallets
    SET balance = balance + $1, updated_at = NOW()
    WHERE id = $2
  `, [transferAmount, recipientWallet.id]);
}
```

**Note**: Direct wallet updates, NO records in `tenant.wallet_transactions` table!

---

## Actual Storage Pattern

### Both Transfer Types → `tenant.transfers`

```sql
-- External Transfer
INSERT INTO tenant.transfers (
  reference,
  recipient_user_id,  -- NULL
  status              -- 'pending'
) VALUES (
  '51301K6NYHVRVM797A65A44',
  NULL,
  'pending'
);

-- Same-Bank Transfer
INSERT INTO tenant.transfers (
  reference,
  recipient_user_id,  -- Should be set (but NULL in your case)
  status              -- 'successful'
) VALUES (
  '51301K6NZ27JKCW204ECD76',
  NULL,  -- ⚠️ Should have recipient user ID!
  'successful'
);
```

---

## Issues Identified

### 1. ⚠️ `recipient_user_id` Not Set
**Expected**: Same-bank transfer should have `recipient_user_id` populated
**Actual**: `NULL` in both your transfers
**Impact**: Can't distinguish internal from external transfers in database

### 2. ⚠️ Duplicate Service Architecture
**Issue**: Two parallel systems for transfers:
- Legacy route `/api/transfers/initiate` (actively used)
- New service `InternalTransferService` (exists but unused)

### 3. ⚠️ No Wallet Transaction Records
**Issue**: Direct wallet updates without audit trail
- No records in `tenant.wallet_transactions`
- Hard to track individual debit/credit operations

---

## Recommendations

### Option 1: Fix Legacy Route
Update `server/routes/transfers.ts` to properly set `recipient_user_id`:

```typescript
// Around line 509
if (internalUserResult.rowCount > 0) {
  recipientUserId = internalUserResult.rows[0].id;  // ✅ This exists
  isInternalTransfer = true;
}

// Around line 551 - Fix the INSERT
const transferResult = await query(`
  INSERT INTO tenant.transfers (...)
  VALUES ($1, $2, $3, $4, ...)  // ✅ Make sure recipientUserId is passed
`, [
  userId, tenantId,
  isInternalTransfer ? null : recipientId,  // recipient_id (for saved recipients)
  isInternalTransfer ? recipientUserId : null,  // ✅ recipient_user_id
  reference, transferAmount, 0, description,
  recipientAccountNumber, recipientBankCode, recipientName,
  wallet.source_account, wallet.source_bank_code,
  isInternalTransfer ? 'successful' : 'pending'
]);
```

### Option 2: Migrate to New Services
Update frontend to use proper service routes:
- Internal transfers → `POST /api/internal-transfers` (InternalTransferService)
- External transfers → `POST /api/external-transfers` (ExternalTransferService)

---

## Summary

### Current State:
- ✅ **Both transfer types stored**: `tenant.transfers`
- ✅ **References generated**: Secure ULID format
- ✅ **Auto-synced**: `tenant.transactions`
- ⚠️ **Missing data**: `recipient_user_id` not set for same-bank
- ⚠️ **No audit trail**: `wallet_transactions` not used
- ⚠️ **Duplicate services**: Legacy + new services both exist

### Reference Storage:
```
External: tenant.transfers.reference ✅
Internal: tenant.transfers.reference ✅ (should be internal_transfers)
Both:     tenant.transactions.reference ✅ (synced)
```

**Bottom Line**: All transfers currently use the legacy route and store in `tenant.transfers`, regardless of type. The new `InternalTransferService` and `tenant.internal_transfers` table are not being used by the frontend.
