#!/bin/bash

# Script to reset PostgreSQL password for bisiadedokun user
# This script requires sudo access

set -e

NEW_PASSWORD="orokiipay_secure_banking_2024!@#"
PG_VERSION="17"
PG_DATA_DIR="/Library/PostgreSQL/${PG_VERSION}/data"
PG_HBA_CONF="${PG_DATA_DIR}/pg_hba.conf"
PG_HBA_BACKUP="${PG_DATA_DIR}/pg_hba.conf.backup"

echo "🔧 PostgreSQL Password Reset Script"
echo "===================================="
echo ""
echo "This script will:"
echo "1. Backup pg_hba.conf"
echo "2. Temporarily enable trust authentication"
echo "3. Restart PostgreSQL"
echo "4. Set password for bisiadedokun user"
echo "5. Restore authentication settings"
echo "6. Restart PostgreSQL again"
echo ""
echo "⚠️  You will be asked for your Mac password (sudo)"
echo ""

# Step 1: Backup pg_hba.conf
echo "📋 Step 1: Backing up pg_hba.conf..."
sudo cp "${PG_HBA_CONF}" "${PG_HBA_BACKUP}"
echo "✅ Backup created"

# Step 2: Modify pg_hba.conf to allow trust authentication
echo "🔓 Step 2: Enabling trust authentication temporarily..."
sudo sed -i.tmp 's/^host.*all.*all.*127.0.0.1\/32.*/host    all             all             127.0.0.1\/32            trust/' "${PG_HBA_CONF}"
sudo sed -i.tmp 's/^host.*all.*all.*::1\/128.*/host    all             all             ::1\/128                 trust/' "${PG_HBA_CONF}"
echo "✅ Trust authentication enabled"

# Step 3: Restart PostgreSQL
echo "🔄 Step 3: Restarting PostgreSQL..."
sudo -u postgres /Library/PostgreSQL/${PG_VERSION}/bin/pg_ctl restart -D "${PG_DATA_DIR}" -l /tmp/postgres_restart.log
sleep 3
echo "✅ PostgreSQL restarted"

# Step 4: Set password for bisiadedokun user
echo "🔐 Step 4: Setting password for bisiadedokun user..."

# First, check if user exists
USER_EXISTS=$(psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='bisiadedokun'")

if [ "$USER_EXISTS" = "1" ]; then
    echo "   User bisiadedokun exists, updating password..."
    psql -U postgres -d postgres -c "ALTER USER bisiadedokun WITH PASSWORD '${NEW_PASSWORD}';"
else
    echo "   User bisiadedokun doesn't exist, creating with password..."
    psql -U postgres -d postgres -c "CREATE USER bisiadedokun WITH SUPERUSER CREATEDB CREATEROLE PASSWORD '${NEW_PASSWORD}';"
fi

echo "✅ Password set successfully"

# Step 5: Restore pg_hba.conf
echo "🔒 Step 5: Restoring authentication settings..."
sudo cp "${PG_HBA_BACKUP}" "${PG_HBA_CONF}"
echo "✅ Authentication settings restored"

# Step 6: Restart PostgreSQL again
echo "🔄 Step 6: Restarting PostgreSQL with restored settings..."
sudo -u postgres /Library/PostgreSQL/${PG_VERSION}/bin/pg_ctl restart -D "${PG_DATA_DIR}" -l /tmp/postgres_restart.log
sleep 3
echo "✅ PostgreSQL restarted"

# Test the connection
echo ""
echo "🧪 Testing connection..."
if PGPASSWORD="${NEW_PASSWORD}" psql -U bisiadedokun -d postgres -c "SELECT 'Connection successful!' as status;" 2>/dev/null | grep -q "Connection successful"; then
    echo "✅ Connection test PASSED"
    echo ""
    echo "🎉 SUCCESS! Password has been set to: ${NEW_PASSWORD}"
    echo ""
    echo "Next steps:"
    echo "1. The .env file will be updated automatically"
    echo "2. The server will restart and connect successfully"
else
    echo "❌ Connection test FAILED"
    echo "Please check the PostgreSQL logs for errors"
    exit 1
fi
