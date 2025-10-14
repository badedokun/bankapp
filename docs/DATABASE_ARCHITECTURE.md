# OrokiiPay Database Architecture

**Version**: 1.0
**Date**: October 9, 2025
**Status**: ✅ **AUTHORITATIVE REFERENCE**

---

## 🎯 **Architecture Overview**

OrokiiPay uses a **database-per-tenant** isolation model to ensure complete data separation between tenants, as required by banking regulations and compliance standards.

### **Two-Database Model**

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        bank_app_platform (PostgreSQL)                 │  │
│  │  - Tenant registry                                    │  │
│  │  - Platform-wide configuration                        │  │
│  │  - Multi-tenant routing data                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────┐
                            │             │
                            ▼             ▼
        ┌─────────────────────────────────────────────┐
        │         TENANT LAYER                        │
        │  ┌──────────────────┐  ┌──────────────────┐ │
        │  │ tenant_fmfb_db   │  │ tenant_acme_db   │ │
        │  │ (FMFB Bank data) │  │ (ACME Bank data) │ │
        │  │                  │  │                  │ │
        │  │ - Users          │  │ - Users          │ │
        │  │ - Wallets        │  │ - Wallets        │ │
        │  │ - Transactions   │  │ - Transactions   │ │
        │  │ - Transfers      │  │ - Transfers      │ │
        │  │ - Disputes       │  │ - Disputes       │ │
        │  └──────────────────┘  └──────────────────┘ │
        └─────────────────────────────────────────────┘
```

---

## 📊 **Database 1: Platform Database**

### **Database Name**: `bank_app_platform`

### **Purpose**
- **Tenant Registry**: Stores information about all registered tenants
- **Platform Configuration**: System-wide settings and configurations
- **Routing Information**: Database connection details for each tenant
- **Platform-Level Data Only**: NO tenant-specific transactional data

### **Connection Details**
```typescript
Host: localhost
Port: 5432
User: bisiadedokun
Database: bank_app_platform
```

### **Connection Method**
```typescript
// Use dbManager for platform queries
import dbManager from '../config/multi-tenant-database';

const result = await dbManager.queryPlatform(
  'SELECT * FROM platform.tenants WHERE name = $1',
  [tenantName]
);
```

### **Schema Structure**

#### **`platform` Schema**

##### **Table: `platform.tenants`**
**Purpose**: Registry of all tenants in the system

**Key Columns**:
```sql
id                    UUID PRIMARY KEY
name                  VARCHAR(100) UNIQUE        -- Tenant slug (e.g., 'fmfb')
display_name          VARCHAR(255)               -- Human-readable name
database_name         VARCHAR(100)               -- Tenant's database name
database_host         VARCHAR(255)               -- Database host (usually 'localhost')
database_port         INTEGER                    -- Database port (usually 5432)
database_status       VARCHAR(50)                -- 'active', 'pending', 'suspended'
configuration         JSONB                      -- Tenant settings (locale, currency, timezone)
status                VARCHAR(50)                -- 'active', 'suspended', 'inactive'
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

**Example Query**:
```sql
SELECT id, name, database_name, database_host, database_port
FROM platform.tenants
WHERE name = 'fmfb' AND status = 'active';
```

**Example Row**:
```
id:              7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3
name:            fmfb
display_name:    FMFB Microfinance Bank
database_name:   tenant_fmfb_db
database_host:   localhost
database_port:   5432
database_status: active
configuration:   {"locale": "en-NG", "currency": "NGN", "timezone": "Africa/Lagos"}
```

##### **Table: `platform.tenant_assets`**
**Purpose**: Stores tenant branding assets (logos, icons)

**Key Columns**:
```sql
id                UUID PRIMARY KEY
tenant_id         UUID REFERENCES platform.tenants(id)
asset_type        VARCHAR(50)                -- 'logo', 'icon', 'background'
asset_format      VARCHAR(20)                -- 'svg', 'png', 'jpg'
asset_data        BYTEA                      -- Binary asset data
variant           VARCHAR(50)                -- 'default', 'light', 'dark'
```

---

## 📊 **Database 2: Tenant Databases**

### **Database Naming Convention**: `tenant_{slug}_db`

**Examples**:
- FMFB Bank: `tenant_fmfb_db`
- ACME Bank: `tenant_acme_db`

### **Purpose**
- **All Tenant-Specific Data**: Users, transactions, wallets, etc.
- **Complete Data Isolation**: Each tenant has a separate database
- **Regulatory Compliance**: Meets banking requirements for data separation

### **Connection Details** (Example: FMFB)
```typescript
Host: localhost
Port: 5432
User: bisiadedokun
Database: tenant_fmfb_db
```

### **Connection Method**
```typescript
// ALWAYS use dbManager.queryTenant() for tenant data
import dbManager from '../config/multi-tenant-database';

// Extract tenant from request
const tenant = (req as any).tenant;

// Query tenant database
const result = await dbManager.queryTenant(
  tenant.id,                                    // Tenant ID from platform.tenants
  'SELECT * FROM tenant.users WHERE id = $1',  // Query for tenant schema
  [userId]
);
```

### **Schema Structure**

#### **`tenant` Schema**

##### **Table: `tenant.users`**
**Purpose**: User accounts for this specific tenant

**Key Columns**:
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE
phone_number      VARCHAR(20)
first_name        VARCHAR(100)
last_name         VARCHAR(100)
role              VARCHAR(50)                -- 'customer', 'admin', 'staff'
password_hash     VARCHAR(255)
status            VARCHAR(50)                -- 'active', 'suspended', 'pending'
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

##### **Table: `tenant.wallets`**
**Purpose**: User wallet balances

**Key Columns**:
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES tenant.users(id)
account_number    VARCHAR(20) UNIQUE
balance           DECIMAL(15, 2)
currency          VARCHAR(3)
status            VARCHAR(50)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

##### **Table: `tenant.transfers`**
**Purpose**: Money transfer transactions

**Key Columns**:
```sql
id                UUID PRIMARY KEY
reference         VARCHAR(50) UNIQUE         -- Customer-facing reference
reference_number  VARCHAR(100) UNIQUE        -- Internal transaction ID
user_id           UUID REFERENCES tenant.users(id)
amount            DECIMAL(15, 2)
fee               DECIMAL(15, 2)
total_amount      DECIMAL(15, 2)
recipient_name    VARCHAR(255)
recipient_account_number VARCHAR(50)
recipient_bank_code VARCHAR(10)
status            VARCHAR(50)                -- 'pending', 'success', 'failed'
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

##### **Table: `tenant.transaction_disputes`**
**Purpose**: User-submitted transaction disputes

**Key Columns**:
```sql
id                    UUID PRIMARY KEY
dispute_number        VARCHAR(50) UNIQUE     -- DSP-FMFB-20250910-0001
transaction_id        UUID
transaction_reference VARCHAR(100)
user_id               UUID REFERENCES tenant.users(id)
user_email            VARCHAR(255)
dispute_reason        TEXT
dispute_category      VARCHAR(50)            -- 'fraud', 'error', 'failed_transaction'
status                VARCHAR(50)            -- 'pending', 'under_review', 'resolved'
priority              VARCHAR(50)            -- 'urgent', 'high', 'normal', 'low'
created_at            TIMESTAMP
resolved_at           TIMESTAMP
resolved_by           UUID
```

##### **Table: `tenant.dispute_activity_log`**
**Purpose**: Audit trail for dispute lifecycle

**Key Columns**:
```sql
id                    UUID PRIMARY KEY
dispute_id            UUID REFERENCES tenant.transaction_disputes(id)
activity_type         VARCHAR(50)            -- 'created', 'status_changed', 'assigned'
performed_by          UUID
performed_by_name     VARCHAR(255)
performed_by_role     VARCHAR(50)
notes                 TEXT
created_at            TIMESTAMP
```

##### **Function: `tenant.generate_dispute_number()`**
**Purpose**: Generate unique, locale-aware dispute reference numbers

**Signature**:
```sql
CREATE OR REPLACE FUNCTION tenant.generate_dispute_number(
  tenant_code TEXT DEFAULT 'DFLT',
  tenant_locale TEXT DEFAULT 'en-US'
)
RETURNS TEXT
```

**Example Usage**:
```sql
-- Nigeria (day-month format)
SELECT tenant.generate_dispute_number('FMFB', 'en-NG');
-- Result: DSP-FMFB-20250910-0001

-- USA (month-day format)
SELECT tenant.generate_dispute_number('ACME', 'en-US');
-- Result: DSP-ACME-20251009-0001
```

---

## 🔧 **Connection Manager: `MultiTenantDatabaseManager`**

### **Location**: `server/config/multi-tenant-database.ts`

### **Purpose**
Manages database connection pools for the platform and all tenants.

### **Key Methods**

#### **1. Query Platform Database**
```typescript
dbManager.queryPlatform(queryText: string, params: any[])
```

**Use When**:
- Fetching tenant registry information
- Accessing platform-wide configuration
- Getting tenant database connection details

**Example**:
```typescript
const tenantInfo = await dbManager.queryPlatform(
  'SELECT * FROM platform.tenants WHERE name = $1',
  ['fmfb']
);
```

#### **2. Query Tenant Database**
```typescript
dbManager.queryTenant(tenantId: string, queryText: string, params: any[])
```

**Use When**:
- Accessing user data
- Fetching transactions, wallets, transfers
- Querying tenant-specific tables

**Example**:
```typescript
const tenant = (req as any).tenant;  // From middleware

const users = await dbManager.queryTenant(
  tenant.id,
  'SELECT * FROM tenant.users WHERE email = $1',
  [email]
);
```

#### **3. Get Tenant Pool**
```typescript
dbManager.getTenantPool(tenantId: string): Promise<Pool>
```

**Use When**:
- Need direct access to tenant's connection pool
- Performing complex transactions

**Example**:
```typescript
const pool = await dbManager.getTenantPool(tenant.id);
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple queries...
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
} finally {
  client.release();
}
```

---

## 🚨 **Critical Rules & Best Practices**

### **Rule 1: NEVER Store Tenant Data in Platform Database**
❌ **WRONG**:
```sql
-- DO NOT store user transactions in bank_app_platform
INSERT INTO platform.transactions ...
```

✅ **CORRECT**:
```sql
-- Store transactions in tenant-specific database
INSERT INTO tenant.transactions ...
```

**Why**: Banking regulations require complete data isolation between tenants.

---

### **Rule 2: ALWAYS Use Correct Connection Method**

❌ **WRONG**:
```typescript
// Don't use raw query for tenant data
import { query } from '../config/database';
const users = await query('SELECT * FROM tenant.users');
```

✅ **CORRECT**:
```typescript
// Use dbManager.queryTenant() for tenant data
import dbManager from '../config/multi-tenant-database';
const tenant = (req as any).tenant;
const users = await dbManager.queryTenant(
  tenant.id,
  'SELECT * FROM tenant.users WHERE id = $1',
  [userId]
);
```

---

### **Rule 3: Verify Tenant Context in All Routes**

✅ **CORRECT**:
```typescript
router.post('/api/disputes', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;  // ✅ Extract tenant

  // Use tenant.id for all queries
  const result = await dbManager.queryTenant(
    tenant.id,
    'INSERT INTO tenant.transaction_disputes ...',
    [...]
  );
});
```

---

### **Rule 4: Know Your Database**

| Task | Database | Method | Example |
|------|----------|--------|---------|
| Get tenant info | `bank_app_platform` | `queryPlatform()` | Fetch tenant config |
| Get user data | `tenant_fmfb_db` | `queryTenant()` | Fetch user profile |
| Get transactions | `tenant_fmfb_db` | `queryTenant()` | Fetch transfer history |
| Get disputes | `tenant_fmfb_db` | `queryTenant()` | Fetch user disputes |
| Get wallets | `tenant_fmfb_db` | `queryTenant()` | Fetch wallet balance |

---

## 🔍 **Common Scenarios**

### **Scenario 1: User Login**

**Step 1**: Resolve tenant from request
```typescript
// Middleware extracts tenant slug from domain/header
const tenantSlug = 'fmfb';
```

**Step 2**: Get tenant info from platform database
```typescript
const tenantInfo = await dbManager.queryPlatform(
  'SELECT * FROM platform.tenants WHERE name = $1',
  [tenantSlug]
);
```

**Step 3**: Query user from tenant database
```typescript
const userResult = await dbManager.queryTenant(
  tenantInfo.rows[0].id,
  'SELECT * FROM tenant.users WHERE email = $1',
  [email]
);
```

---

### **Scenario 2: Submit Transaction Dispute**

**Step 1**: Extract tenant from request
```typescript
const tenant = (req as any).tenant;  // Set by middleware
```

**Step 2**: Get user info from tenant database
```typescript
const userResult = await dbManager.queryTenant(
  tenant.id,
  'SELECT email, phone_number FROM tenant.users WHERE id = $1',
  [userId]
);
```

**Step 3**: Generate dispute number using tenant function
```typescript
const disputeNumberResult = await dbManager.queryTenant(
  tenant.id,
  'SELECT tenant.generate_dispute_number($1::text, $2::text) as dispute_number',
  [tenant.name.toUpperCase(), tenant.configuration.locale]
);
```

**Step 4**: Insert dispute in tenant database
```typescript
const result = await dbManager.queryTenant(
  tenant.id,
  'INSERT INTO tenant.transaction_disputes (...) VALUES (...)',
  [disputeNumber, transactionId, ...]
);
```

---

### **Scenario 3: Get Transfer History**

```typescript
router.get('/api/transfers/history', authenticateToken, async (req, res) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;

  // Query tenant database for transfers
  const transfers = await dbManager.queryTenant(
    tenant.id,
    `SELECT * FROM tenant.transfers
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, 50]
  );

  res.json({ transfers: transfers.rows });
});
```

---

## ❌ **Common Mistakes to Avoid**

### **Mistake 1: Querying Wrong Database**
```typescript
// ❌ WRONG: Looking for tenant data in platform database
const transfers = await dbManager.queryPlatform(
  'SELECT * FROM tenant.transfers WHERE user_id = $1',
  [userId]
);
// Error: relation "tenant.transfers" does not exist
```

**Fix**: Use correct database
```typescript
// ✅ CORRECT: Query tenant database
const transfers = await dbManager.queryTenant(
  tenant.id,
  'SELECT * FROM tenant.transfers WHERE user_id = $1',
  [userId]
);
```

---

### **Mistake 2: Using Raw Query Instead of dbManager**
```typescript
// ❌ WRONG: Direct database query
import { query } from '../config/database';
const result = await query('SELECT * FROM tenant.users');
```

**Fix**: Use dbManager
```typescript
// ✅ CORRECT: Use multi-tenant manager
import dbManager from '../config/multi-tenant-database';
const result = await dbManager.queryTenant(tenant.id, 'SELECT * FROM tenant.users');
```

---

### **Mistake 3: Mixing Platform and Tenant Data**
```typescript
// ❌ WRONG: Trying to join across databases
const result = await dbManager.queryPlatform(`
  SELECT u.*, t.display_name
  FROM tenant.users u
  JOIN platform.tenants t ON t.id = u.tenant_id
`);
// Error: Cannot join across different databases
```

**Fix**: Query separately
```typescript
// ✅ CORRECT: Query each database separately
const tenant = await dbManager.queryPlatform(
  'SELECT * FROM platform.tenants WHERE id = $1',
  [tenantId]
);

const users = await dbManager.queryTenant(
  tenantId,
  'SELECT * FROM tenant.users'
);
```

---

## 🗺️ **Database Schema Reference**

### **Platform Database Schema**
```
bank_app_platform
└── platform (schema)
    ├── tenants
    ├── tenant_assets
    ├── system_config
    └── audit_logs
```

### **Tenant Database Schema**
```
tenant_fmfb_db
└── tenant (schema)
    ├── users
    ├── wallets
    ├── transactions
    ├── transfers
    ├── transaction_disputes
    ├── dispute_activity_log
    ├── beneficiaries
    ├── cards
    ├── loans
    ├── notifications
    ├── audit_trail
    └── [functions]
        ├── generate_dispute_number()
        └── calculate_wallet_balance()
```

---

## 📋 **Quick Reference Checklist**

When writing database queries, ask yourself:

- [ ] Am I querying tenant-specific data? → Use `dbManager.queryTenant()`
- [ ] Am I querying platform data? → Use `dbManager.queryPlatform()`
- [ ] Do I have the tenant object from request? → `const tenant = (req as any).tenant`
- [ ] Am I using the correct tenant ID? → `tenant.id`
- [ ] Am I querying the `tenant` schema? → `SELECT * FROM tenant.users`
- [ ] Did I verify the database exists? → Check `platform.tenants.database_name`

---

## 🔐 **Security & Compliance**

### **Data Isolation**
- Each tenant's data is physically separated in different databases
- No possibility of cross-tenant data leakage
- Meets CBN (Central Bank of Nigeria) and PCI DSS requirements

### **Connection Pooling**
- Platform database: 20 max connections
- Each tenant database: 10 max connections
- Automatic cleanup of idle connections every 60 seconds

### **Audit Trail**
- All queries logged with tenant context
- Database connection events tracked
- Failed connection attempts recorded

---

## 📚 **Related Documentation**

- [Project Overview](./PROJECT_OVERVIEW.md) - System architecture overview
- [Multi-Tenant Setup](./MULTI_TENANT_SETUP.md) - Tenant provisioning guide
- [Dispute System Setup](./DISPUTE_SYSTEM_SETUP.md) - Dispute feature documentation
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint reference

---

## 🆘 **Troubleshooting**

### **Error: "function tenant.generate_dispute_number does not exist"**
**Cause**: Migrations not run on tenant database
**Fix**: Run migrations 017 and 018 on the tenant database
```bash
psql -d tenant_fmfb_db -f database/migrations/017_transaction_disputes.sql
psql -d tenant_fmfb_db -f database/migrations/018_update_dispute_reference_format.sql
```

### **Error: "relation tenant.transfers does not exist"**
**Cause**: Querying platform database instead of tenant database
**Fix**: Use `dbManager.queryTenant()` instead of `dbManager.queryPlatform()`

### **Error: "Tenant not found or inactive"**
**Cause**: Tenant not registered in platform.tenants or status is not 'active'
**Fix**: Verify tenant exists in platform database
```sql
SELECT * FROM platform.tenants WHERE name = 'fmfb';
```

### **Error: "Tenant database connection failed"**
**Cause**: Wrong database port or database doesn't exist
**Fix**: Verify connection details in platform.tenants
```sql
UPDATE platform.tenants
SET database_port = 5432, database_host = 'localhost'
WHERE name = 'fmfb';
```

---

**Last Updated**: October 9, 2025
**Maintained By**: OrokiiPay Engineering Team
**Questions**: Refer to Project Overview or contact system architect
