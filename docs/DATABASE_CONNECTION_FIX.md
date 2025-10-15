# Database Connection Fix for Receipt Viewing

## Date: October 13, 2025

## Critical Issue Found

Transfers created via AI chat were not being found when trying to view receipts, resulting in 404 errors.

## Root Cause

The ConversationalTransferService and the transfers API endpoint were using **different database connections**:

1. **Transfer Creation** (ConversationalTransferService):
   - Used simple `query()` function from `/server/config/database.ts`
   - Connected to: `bank_app_platform` database (default platform DB)
   - Schema: `bank_app_platform.tenant.transfers`

2. **Receipt Retrieval** (transfers route):
   - Used `dbManager.queryTenant()` from `/server/config/multi-tenant-database.ts`
   - Connected to: Tenant-specific databases (e.g., `tenant_fmfb_db`)
   - Schema: `tenant_fmfb_db.tenant.transfers`

**Result**: Transfers were written to one database but read from another = 404 Not Found!

## Solution

Updated `ConversationalTransferService` to use the multi-tenant `dbManager` instead of the simple `query()` function.

### Changes Made

#### 1. Import Change
```typescript
// ❌ BEFORE
import { query } from '../../config/database';

// ✅ AFTER
import dbManager from '../../config/multi-tenant-database';
```

#### 2. Method Signature Updates
Added `tenantId` parameter to all methods:

```typescript
// processTransferConversation
static async processTransferConversation(
  message: string,
  userId: string,
  conversationId: string,
  tenantId: string  // ← Added
): Promise<ConversationalResponse>

// executeTransfer
private static async executeTransfer(
  userId: string,
  conversationId: string,
  data: Record<string, any>,
  tenantId: string  // ← Added
): Promise<ConversationalResponse>

// verifyPIN
private static async verifyPIN(
  userId: string,
  pin: string,
  tenantId: string  // ← Added
): Promise<boolean>

// checkBalance
private static async checkBalance(
  userId: string,
  amount: number,
  tenantId: string  // ← Added
): Promise<boolean>

// createTransfer
private static async createTransfer(
  userId: string,
  data: Record<string, any>,
  tenantId: string  // ← Added
): Promise<any>
```

#### 3. Database Query Updates

**verifyPIN**:
```typescript
// ❌ BEFORE
const result = await query(
  'SELECT transaction_pin_hash FROM tenant.users WHERE id = $1',
  [userId]
);

// ✅ AFTER
const result = await dbManager.queryTenant(tenantId,
  'SELECT transaction_pin_hash FROM tenant.users WHERE id = $1',
  [userId]
);
```

**checkBalance**:
```typescript
// ❌ BEFORE
const result = await query(
  'SELECT balance FROM tenant.wallets WHERE user_id = $1 AND wallet_type = $2',
  [userId, 'primary']
);

// ✅ AFTER
const result = await dbManager.queryTenant(tenantId,
  'SELECT balance FROM tenant.wallets WHERE user_id = $1 AND wallet_type = $2',
  [userId, 'primary']
);
```

**createTransfer - Get tenant bank code**:
```typescript
// ❌ BEFORE
const tenantResult = await query(
  'SELECT bank_code FROM platform.tenants WHERE id = $1',
  [tenantId]
);

// ✅ AFTER
const tenantResult = await dbManager.queryPlatform(
  'SELECT bank_code FROM platform.tenants WHERE id = $1',
  [tenantId]
);
```

**createTransfer - Insert transfer**:
```typescript
// ❌ BEFORE
const transferResult = await query(
  `INSERT INTO tenant.transfers (...) VALUES (...) RETURNING id, reference`,
  [...]
);

// ✅ AFTER
const transferResult = await dbManager.queryTenant(tenantId,
  `INSERT INTO tenant.transfers (...) VALUES (...) RETURNING id, reference`,
  [...]
);
```

**createTransfer - Update wallet**:
```typescript
// ❌ BEFORE
await query(
  'UPDATE tenant.wallets SET balance = balance - $1 WHERE ...',
  [data.amount, userId, 'primary']
);

// ✅ AFTER
await dbManager.queryTenant(tenantId,
  'UPDATE tenant.wallets SET balance = balance - $1 WHERE ...',
  [data.amount, userId, 'primary']
);
```

#### 4. Route Updates

Updated `/server/routes/ai-chat.ts` to extract and pass `tenantId`:

```typescript
// Extract tenantId from authenticated user
const userId = (req as any).user?.id || 'anonymous';
const tenantId = (req as any).user?.tenantId || 'default';  // ← Added

// Pass tenantId to service
const transferResponse = await ConversationalTransferService.processTransferConversation(
  message,
  userId,
  conversationId,
  tenantId  // ← Added
);
```

## Files Changed

1. `/server/services/ai-intelligence-service/ConversationalTransferService.ts`
   - Changed import from `query` to `dbManager`
   - Updated all method signatures to include `tenantId`
   - Replaced all `query()` calls with `dbManager.queryTenant()` or `dbManager.queryPlatform()`

2. `/server/routes/ai-chat.ts`
   - Extract `tenantId` from `req.user`
   - Pass `tenantId` to `processTransferConversation()` calls

## Multi-Tenant Database Architecture

### Platform Database (`bank_app_platform`)
- Contains: Tenant registry, system config, shared data
- Accessed via: `dbManager.queryPlatform()`
- Schema: `platform.*`

### Tenant-Specific Databases
- Contains: Tenant-specific data (users, wallets, transfers, etc.)
- Accessed via: `dbManager.queryTenant(tenantId, ...)`
- Schema: `tenant.*`
- Examples:
  - `tenant_fmfb_db` for FMFB tenant
  - `tenant_other_db` for other tenants

### Connection Flow

```
User Request → authenticateToken → Extract userId + tenantId
                                         ↓
                                 dbManager looks up tenant DB
                                         ↓
                              Connect to tenant-specific DB
                                         ↓
                                 Execute queries in tenant schema
```

## Testing

After this fix:

1. ✅ Create transfer via AI chat
2. ✅ Transfer is saved to correct tenant database
3. ✅ Click "View receipt"
4. ✅ Receipt is retrieved from same tenant database
5. ✅ Receipt displays successfully

### Test Steps

```bash
# 1. Complete a transfer via AI chat
# Expected: Transfer succeeds with reference like 5133301K7FV38PJB4A8CAFC65

# 2. Check console logs
💾 Captured transfer reference: 5133301K7FV38PJB4A8CAFC65

# 3. Click "View receipt"
🧾 View receipt clicked. Last reference: 5133301K7FV38PJB4A8CAFC65
🔍 Fetching receipt for reference: 5133301K7FV38PJB4A8CAFC65
📞 Calling API with reference: 5133301K7FV38PJB4A8CAFC65
✅ Receipt data received: { ... }

# 4. Verify receipt displays with all details
```

## Benefits

1. **Data Consistency**: Transfers and receipts use the same database
2. **Multi-Tenant Compliance**: Each tenant's data stays in their dedicated database
3. **Regulatory Compliance**: Complete data isolation between tenants
4. **Scalability**: Each tenant can have their own database instance

## Related Documentation

- [Receipt Viewing Fix](./AI_RECEIPT_VIEWING_FIX.md)
- [Conversational Transfer Flow](./CONVERSATIONAL_TRANSFER_FLOW.md)
- [Multi-Tenant Architecture](../server/config/multi-tenant-database.ts)

## Deployment Notes

- Changes are hot-reloaded in development (nodemon)
- No database migrations needed
- No schema changes required
- Only code logic changes

## Future Improvements

Consider centralizing database access to prevent this type of issue:

1. Create a `DatabaseService` wrapper
2. All services use the wrapper
3. Wrapper ensures correct tenant database is always used
4. Add runtime checks to warn if wrong database connection is used
