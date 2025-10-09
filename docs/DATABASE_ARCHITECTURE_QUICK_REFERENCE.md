# Database Architecture - Quick Reference Card

**Last Updated**: October 9, 2025

---

## ⚡ **Quick Decision Tree**

### "Which database should I use?"

```
Are you querying tenant-specific data?
│
├─ YES → Use tenant database (tenant_fmfb_db)
│         Method: dbManager.queryTenant(tenant.id, ...)
│         Examples: users, wallets, transactions, transfers, disputes
│
└─ NO  → Use platform database (bank_app_platform)
          Method: dbManager.queryPlatform(...)
          Examples: tenant registry, platform config
```

---

## 📋 **Code Templates**

### **Template 1: Query Tenant Data**
```typescript
import dbManager from '../config/multi-tenant-database';

router.get('/api/endpoint', authenticateToken, async (req, res) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;  // ✅ Always extract tenant

  const result = await dbManager.queryTenant(
    tenant.id,                         // ✅ Tenant ID
    'SELECT * FROM tenant.table WHERE user_id = $1',
    [userId]
  );

  res.json({ data: result.rows });
});
```

### **Template 2: Query Platform Data**
```typescript
import dbManager from '../config/multi-tenant-database';

const tenantInfo = await dbManager.queryPlatform(
  'SELECT * FROM platform.tenants WHERE name = $1',
  [tenantSlug]
);
```

---

## 🚨 **Common Mistakes**

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `query('SELECT * FROM tenant.users')` | `dbManager.queryTenant(tenant.id, 'SELECT * FROM tenant.users')` |
| `queryPlatform('SELECT * FROM tenant.transfers')` | `dbManager.queryTenant(tenant.id, 'SELECT * FROM tenant.transfers')` |
| `INSERT INTO platform.transactions` | `INSERT INTO tenant.transactions` via `queryTenant()` |

---

## 📊 **Database Cheat Sheet**

| Data Type | Database | Schema | Example Table |
|-----------|----------|--------|---------------|
| Tenant Registry | `bank_app_platform` | `platform` | `platform.tenants` |
| User Accounts | `tenant_fmfb_db` | `tenant` | `tenant.users` |
| Wallets | `tenant_fmfb_db` | `tenant` | `tenant.wallets` |
| Transactions | `tenant_fmfb_db` | `tenant` | `tenant.transactions` |
| Transfers | `tenant_fmfb_db` | `tenant` | `tenant.transfers` |
| Disputes | `tenant_fmfb_db` | `tenant` | `tenant.transaction_disputes` |

---

## 🔧 **Troubleshooting**

### Error: "relation tenant.xxx does not exist"
**Fix**: You're querying the wrong database. Use `dbManager.queryTenant()` instead of `dbManager.queryPlatform()`

### Error: "function tenant.xxx does not exist"
**Fix**: Run migrations on the tenant database (not platform database)

### Error: "Tenant not found"
**Fix**: Check `platform.tenants` table, verify tenant status is 'active'

---

## 📚 **Full Documentation**

For complete details, read: [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)

---

**Remember**:
- Platform database = Tenant registry ONLY
- Tenant database = ALL tenant-specific data
- ALWAYS use dbManager for multi-tenant queries
