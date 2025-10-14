# Database Architecture Migration - Progress Report

**Date**: October 9, 2025, 23:40
**Status**: ✅ **Phase 1 Complete** - auth.ts + userService migrated

---

## 🎯 Migration Objective

Migrate all routes from wrong database (`bank_app_platform`) to correct database architecture (`tenant_fmfb_db` for tenant data, `bank_app_platform` for tenant registry only).

---

## ✅ Completed Work

### 1. **Backups Created** (October 9, 2025 19:09:28)

All databases backed up before migration:
- `bank_app_platform_20251009_190928_with_data.dump` (499K)
- `bank_app_platform_20251009_190928_schema_only.dump` (351K)
- `tenant_fmfb_db_20251009_190928_with_data.dump` (124K)
- `tenant_fmfb_db_20251009_190928_schema_only.dump` (108K)

### 2. **server/routes/auth.ts** - ✅ COMPLETE

**Git Commit**: `78e20a3` - "feat: Complete auth.ts and userService migration to correct database architecture"

**Changes Made**:

- Changed import:
  ```typescript
  // OLD
  import { query, transaction } from '../config/database';

  // NEW
  import dbManager from '../config/multi-tenant-database';
  ```

- **Routes Migrated** (8 endpoints):
  1. `POST /login` - Split platform/tenant queries, pool-based transactions
  2. `POST /refresh` - Tenant queries with platform lookup
  3. `POST /logout` - Tenant session deletion
  4. `POST /logout-all` - Tenant batch session deletion
  5. `GET /profile` - Tenant user query with platform tenant info
  6. `PUT /profile` - Tenant user update
  7. `POST /change-password` - Tenant password update
  8. `GET /sessions` - Tenant session list
  9. `POST /register` - Delegates to userService
  10. `POST /kyc/submit` - Delegates to userService

- **Patterns Established**:
  ```typescript
  // Platform queries (tenant lookup)
  await dbManager.queryPlatform(`
    SELECT id FROM platform.tenants WHERE name = $1
  `, [tenantId]);

  // Tenant queries
  await dbManager.queryTenant(tenantId, `
    SELECT * FROM tenant.users WHERE id = $1
  `, [userId]);

  // Transactions
  const tenantPool = await dbManager.getTenantPool(tenantId);
  const client = await tenantPool.connect();
  try {
    await client.query('BEGIN');
    // ... operations
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Split cross-database joins
  const userResult = await dbManager.queryTenant(tenantId, `
    SELECT * FROM tenant.users WHERE id = $1
  `, [userId]);

  const tenantResult = await dbManager.queryPlatform(`
    SELECT * FROM platform.tenants WHERE id = $1
  `, [tenantId]);

  // Merge in application code
  user.tenant_name = tenantResult.rows[0].tenant_name;
  ```

### 3. **server/services/users.ts** - ✅ COMPLETE

**Included in commit**: `78e20a3`

**Changes Made**:

- Changed import:
  ```typescript
  // OLD
  import { query } from '../config/database';

  // NEW
  import dbManager from '../config/multi-tenant-database';
  ```

- **Updated Methods**:
  1. `registerUser(userData)` - Added tenantId param, pool transactions
  2. `submitKYCDocuments(kycData)` - Added tenantId param, pool transactions
  3. `getUserProfile(tenantId, userId)` - Uses dbManager.queryTenant()
  4. `updateUserProfile(tenantId, userId, updates)` - Uses dbManager.queryTenant()
  5. `generateAccountNumber(tenantId, client)` - Platform query for bank code
  6. `processReferral(tenantId, userId, code, client)` - Tenant queries

- **Interface Updates**:
  ```typescript
  export interface KYCDocumentData {
    tenantId: string;  // ADDED
    userId: string;
    // ... other fields
  }
  ```

### 4. **server/routes/disputes.ts** - ✅ ALREADY CORRECT

This route was already using `dbManager.queryTenant()` - served as the reference pattern.

---

## 🚧 In Progress

### **server/routes/transfers.ts** - ⏳ ANALYZING

**Status**: Not started - analysis phase

**File Statistics**:
- **Lines**: 1,667
- **Database Calls**: 32 instances of `query(` or `transaction(`
- **Complexity**: High - uses transfer services + direct queries

**Query Distribution**:
```
Lines with query/transaction calls:
412:    await query('BEGIN');
415:    const walletResult = await query(...
426:      await query('ROLLBACK');
... (32 total calls across file)
```

**Key Challenges**:
1. Large transaction blocks with multiple queries
2. Uses external services (InternalTransferService, ExternalTransferService, etc.)
3. These services may also need migration
4. Complex business logic with NIBSS integration

**Migration Strategy (Proposed)**:
- [ ] First, update import statement
- [ ] Identify all transaction blocks (BEGIN/COMMIT/ROLLBACK)
- [ ] Convert to pool-based transactions
- [ ] Replace standalone `query()` calls with `dbManager.queryTenant()`
- [ ] Test each route individually
- [ ] Check if transfer services also need updating

---

## 📋 Pending Work

### 5. **server/routes/wallets.ts** - ⏸️ PENDING

**Status**: Not yet assessed

**Expected Work**:
- Similar patterns to auth.ts
- Likely uses `query()` from '../config/database'
- Will need full migration

### 6. **Data Verification/Migration** - ⏸️ PENDING

**Status**: After all routes are migrated

**Required Actions**:
- Verify user records exist in `tenant_fmfb_db.tenant.users`
- Check if data migration from `bank_app_platform.tenant.*` to `tenant_fmfb_db.tenant.*` is needed
- Verify all tenant-specific data is in correct database
- Test end-to-end login → disputes flow

---

## 📊 Migration Summary

| Component | Status | Database Calls | Complexity | Git Commit |
|-----------|--------|----------------|------------|------------|
| **Backups** | ✅ Complete | - | Low | Multiple |
| **auth.ts** | ✅ Complete | ~25 | High | 78e20a3 |
| **userService** | ✅ Complete | ~15 | Medium | 78e20a3 |
| **disputes.ts** | ✅ Already Correct | ~10 | Medium | Earlier |
| **transfers.ts** | ⏳ In Progress | 32 | Very High | - |
| **wallets.ts** | ⏸️ Pending | Unknown | Medium | - |
| **Data Migration** | ⏸️ Pending | - | High | - |

---

## 🔑 Key Learnings

1. **No `transactionTenant()` method** - Must use `getTenantPool()` + client
2. **Cross-database joins are impossible** - Must split queries and merge in app code
3. **All tenant data goes to tenant database** - Even if referenced from platform
4. **Platform database is ONLY for tenant registry** - No transactional data
5. **Transaction pattern is consistent** - pool → client → BEGIN → ops → COMMIT/ROLLBACK → release

---

## 🚀 Next Steps

1. **Assess transfers.ts complexity** - Determine if services also need migration
2. **Create transfer service migration plan** - If needed
3. **Migrate transfers.ts routes** - Using established patterns
4. **Migrate wallets.ts** - Should be straightforward after transfers
5. **Data verification** - Ensure consistency across databases
6. **End-to-end testing** - Full flow verification

---

## 📚 Related Documentation

- [DISPUTE_SYSTEM_ISSUE.md](./DISPUTE_SYSTEM_ISSUE.md) - Root cause analysis
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) - Full architecture reference
- [DATABASE_ARCHITECTURE_QUICK_REFERENCE.md](./DATABASE_ARCHITECTURE_QUICK_REFERENCE.md) - Quick lookup

---

**Last Updated**: October 9, 2025, 23:40
**Migration Lead**: Claude Code Assistant
