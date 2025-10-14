# Dispute System Issue - Root Cause Analysis

**Date**: October 9, 2025
**Status**: 🔴 **CRITICAL ARCHITECTURAL ISSUE IDENTIFIED**

---

## 🎯 **Issue Summary**

Dispute submission fails with "User not found" error, but the root cause is a **system-wide database architecture mismatch**.

---

## 🔍 **Root Cause**

### **Current Implementation (INCORRECT)**
All routes are using the old `query()` function from `server/config/database.ts` which connects to `bank_app_platform`:

**Routes using WRONG database connection:**
1. `server/routes/auth.ts` → `import { query } from '../config/database'`
2. `server/routes/transfers.ts` → `import { query, transaction } from '../config/database'`
3. `server/routes/wallets.ts` → `import { query } from '../config/database'`
4. `server/routes/disputes.ts` → Currently UPDATED to use `dbManager.queryTenant()` ✅

### **The Problem**
- **bank_app_platform** database contains:
  - `tenant.users` with user ID `19769e1e-b7c7-437a-b0c4-c242d82e8e3f`
  - `tenant.transfers`, `tenant.wallets`, etc.

- **tenant_fmfb_db** database contains:
  - `tenant.users` with user ID `70ea05fb-ae9f-4812-8fb0-9f18de394888`
  - `tenant.transfers`, `tenant.wallets`, etc.

### **Why Disputes Fails**
1. **Login** queries `bank_app_platform` → returns user ID `19769e1e-b7c7-437a-b0c4-c242d82e8e3f`
2. **Disputes** (now fixed) queries `tenant_fmfb_db` with that user ID → **User not found**!
3. **Other routes** (transfers, wallets) query `bank_app_platform` → **They work** because they use the same wrong database

---

## 📊 **Data Location Verification**

### **User in bank_app_platform**
```sql
SELECT id, email FROM bank_app_platform.tenant.users WHERE email = 'admin@fmfb.com';
-- Result: 19769e1e-b7c7-437a-b0c4-c242d82e8e3f | admin@fmfb.com
```

### **User in tenant_fmfb_db**
```sql
SELECT id, email FROM tenant_fmfb_db.tenant.users WHERE email = 'admin@fmfb.com';
-- Result: 70ea05fb-ae9f-4812-8fb0-9f18de394888 | admin@fmfb.com
```

---

## 🏗️ **Correct Architecture (from DATABASE_ARCHITECTURE.md)**

### **What SHOULD happen:**
1. **Platform Database** (`bank_app_platform`)
   - ONLY tenant registry in `platform.tenants`
   - NO tenant-specific transactional data
   - Connection: `dbManager.queryPlatform()`

2. **Tenant Databases** (`tenant_fmfb_db`, etc.)
   - ALL tenant-specific data: users, wallets, transfers, disputes
   - Connection: `dbManager.queryTenant(tenant.id, ...)`

---

## ⚠️ **Impact**

### **Routes Currently Working (using WRONG database)**
- ✅ Login (auth.ts)
- ✅ Transfers (transfers.ts)
- ✅ Wallets (wallets.ts)
- ✅ All other routes using `query()` from database.ts

### **Routes Broken (using CORRECT database)**
- ❌ Disputes (disputes.ts) - now uses `dbManager.queryTenant()`

---

## 🛠️ **Solution Options**

### **Option 1: Migrate ALL Routes to Correct Architecture** ✅ **RECOMMENDED**
**Pros:**
- Follows proper multi-tenant isolation
- Complies with banking regulations
- Aligns with DATABASE_ARCHITECTURE.md
- Future-proof and scalable

**Cons:**
- Requires updating ALL routes
- Need to migrate data from bank_app_platform to tenant_fmfb_db
- More complex migration

**Implementation:**
1. Update all routes to use `dbManager.queryTenant()`
2. Migrate existing data from `bank_app_platform.tenant.*` to `tenant_fmfb_db.tenant.*`
3. Verify all features work with tenant-specific databases

### **Option 2: Revert Disputes to Use Wrong Database** ❌ **NOT RECOMMENDED**
**Pros:**
- Quick fix for disputes
- Everything works immediately

**Cons:**
- Violates architectural principles
- Breaks tenant isolation
- Regulatory compliance issues
- Technical debt accumulates

---

## 📝 **Recommended Action Plan**

1. **Immediate Fix (Temporary):**
   - Revert disputes.ts to use `query()` from database.ts
   - Run dispute migrations on bank_app_platform
   - Document this as technical debt

2. **Long-term Fix (Required):**
   - Create data migration plan
   - Update ALL routes to use `dbManager.queryTenant()`
   - Migrate data to tenant-specific databases
   - Update documentation

---

## 📚 **Related Documents**
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) - Correct architecture
- [DATABASE_ARCHITECTURE_QUICK_REFERENCE.md](./DATABASE_ARCHITECTURE_QUICK_REFERENCE.md) - Quick guide

---

**Next Steps**: Decide which option to pursue and create detailed migration plan.
