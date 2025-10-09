# Database Backups - FMFB Tenant

**Date Created**: October 8, 2025
**Database**: `tenant_fmfb_db`
**Timestamp**: `20251008_134146`

---

## Backup Files

### SQL Format (Plain Text)

#### With Data (Full Backup)
- **File**: `fmfb_tenant_20251008_134146_with_data.sql` (86K)
- **Contents**: Complete database schema + all data
- **Restore**:
  ```bash
  psql -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db < database/backups/fmfb_tenant_20251008_134146_with_data.sql
  ```

#### Schema Only
- **File**: `fmfb_tenant_20251008_134146_schema_only.sql` (69K)
- **Contents**: Database structure only (no data)
- **Restore**:
  ```bash
  psql -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db < database/backups/fmfb_tenant_20251008_134146_schema_only.sql
  ```

---

### Custom Dump Format (Binary)

#### With Data (Full Backup)
- **File**: `fmfb_tenant_20251008_134146_with_data.dump` (105K)
- **Contents**: Complete database schema + all data (compressed)
- **Restore**:
  ```bash
  pg_restore -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db database/backups/fmfb_tenant_20251008_134146_with_data.dump
  ```

#### Schema Only
- **File**: `fmfb_tenant_20251008_134146_schema_only.dump` (90K)
- **Contents**: Database structure only (compressed)
- **Restore**:
  ```bash
  pg_restore -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db database/backups/fmfb_tenant_20251008_134146_schema_only.dump
  ```

---

## Database Contents

The FMFB tenant database includes:

### Core Banking Tables
- `tenant.users` - User accounts
- `tenant.wallets` - Digital wallets
- `tenant.transfers` - Money transfers (internal & external)
- `tenant.transactions` - Transaction ledger
- `tenant.internal_transfers` - Same-bank transfers

### Financial Operations
- `tenant.wallet_transactions` - Wallet debit/credit history
- `tenant.wallet_fundings` - Wallet top-ups
- `tenant.recipients` - Saved beneficiaries
- `tenant.scheduled_transfers` - Future-dated transfers
- `tenant.recurring_transfers` - Periodic transfers

### Compliance & Security
- `tenant.kyc_documents` - KYC verification files
- `tenant.fraud_alerts` - Fraud detection logs
- `tenant.login_attempts` - Security audit trail
- `tenant.user_activity_logs` - Activity monitoring

### AI & Intelligence
- `tenant.ai_*` - AI/ML tables for fraud detection and insights

### Administration
- `tenant.rbac_*` - Role-based access control
- `tenant.notification_preferences` - User settings
- `tenant.notifications` - Notification queue

---

## Important Notes

### Restore Prerequisites
1. Target database must exist:
   ```bash
   createdb -h localhost -p 5432 -U bisiadedokun tenant_fmfb_db
   ```

2. Database user must have proper permissions:
   ```bash
   psql -h localhost -p 5432 -U postgres
   GRANT ALL PRIVILEGES ON DATABASE tenant_fmfb_db TO bisiadedokun;
   ```

### Clean Restore (Drop existing data)
```bash
# Drop and recreate database
dropdb -h localhost -p 5432 -U bisiadedokun tenant_fmfb_db
createdb -h localhost -p 5432 -U bisiadedokun tenant_fmfb_db

# Restore from backup
psql -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db < database/backups/fmfb_tenant_20251008_134146_with_data.sql
```

### Partial Restore (Schema then Data)
```bash
# 1. Restore schema
psql -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db < database/backups/fmfb_tenant_20251008_134146_schema_only.sql

# 2. Import specific tables from full backup
pg_restore -h localhost -p 5432 -U bisiadedokun -d tenant_fmfb_db -t users -t wallets database/backups/fmfb_tenant_20251008_134146_with_data.dump
```

---

## Backup Details

### Database Information
- **PostgreSQL Version**: 14.x
- **Host**: localhost
- **Port**: 5432
- **Character Encoding**: UTF8
- **Collation**: en_US.UTF-8

### Schema Structure
- **Main Schema**: `tenant`
- **Platform Schema**: `platform` (via dblink/FDW)

### Key Schema Changes (Recent)
1. **Bank Code Extensions**:
   - Extended `bank_code` columns from VARCHAR(3) to VARCHAR(10)
   - Supports variable-length Nigerian bank codes (3, 5, 6, 9 characters)
   - Added FMFB bank code: "51333" (5-digit microfinance code)

2. **Transfer Enhancements**:
   - Added missing columns to `tenant.transfers`
   - Added secure ULID-based reference generation
   - Multi-tenant compliant validation

---

## Security

### Sensitive Data
These backups contain:
- ⚠️ User personal information (encrypted passwords)
- ⚠️ Financial transaction data
- ⚠️ KYC documents
- ⚠️ Account balances

### Recommendations
1. **Encrypt backups** before storing remotely
2. **Restrict access** to authorized personnel only
3. **Store securely** with proper permissions (chmod 600)
4. **Rotate backups** regularly (keep 7 daily, 4 weekly, 12 monthly)
5. **Test restores** periodically to ensure backup integrity

---

## Automated Backup Script

```bash
#!/bin/bash
# Daily backup script for FMFB tenant database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/Users/bisiadedokun/bankapp/database/backups"
DB_NAME="tenant_fmfb_db"

# Full backup (SQL)
PGPASSWORD='orokiipay_secure_banking_2024!@#' pg_dump \
  -h localhost -p 5432 -U bisiadedokun \
  -d $DB_NAME -F p \
  -f "${BACKUP_DIR}/fmfb_tenant_${TIMESTAMP}_with_data.sql"

# Schema only (SQL)
PGPASSWORD='orokiipay_secure_banking_2024!@#' pg_dump \
  -h localhost -p 5432 -U bisiadedokun \
  -d $DB_NAME -F p -s \
  -f "${BACKUP_DIR}/fmfb_tenant_${TIMESTAMP}_schema_only.sql"

# Compress and cleanup old backups (older than 30 days)
gzip "${BACKUP_DIR}/fmfb_tenant_${TIMESTAMP}_with_data.sql"
find "${BACKUP_DIR}" -name "fmfb_tenant_*" -mtime +30 -delete

echo "Backup completed: ${TIMESTAMP}"
```

---

## Contact

**Project**: OrokiiPay Multi-Tenant Banking Platform
**Tenant**: FMFB (Firstmidas Microfinance Bank)
**Environment**: Development
**Backup Created**: 2025-10-08 13:41:46
