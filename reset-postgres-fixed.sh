#!/bin/bash

# Reset PostgreSQL postgres user password using single-user mode
# This requires sudo access

set -e

PG_VERSION="17"
PG_BIN="/Library/PostgreSQL/${PG_VERSION}/bin"
PG_DATA_DIR="/Library/PostgreSQL/${PG_VERSION}/data"
NEW_POSTGRES_PASSWORD="Super-admin-7"

echo "🔧 PostgreSQL Password Reset (Single-User Mode)"
echo "================================================"
echo ""
echo "This will reset the postgres user password to: ${NEW_POSTGRES_PASSWORD}"
echo ""
echo "⚠️  You will be asked for your Mac password (sudo)"
echo ""

# Step 1: Stop PostgreSQL server
echo "🛑 Step 1: Stopping PostgreSQL server..."
cd /tmp
sudo -u postgres "${PG_BIN}/pg_ctl" stop -D "${PG_DATA_DIR}" -m fast || true
sleep 2
echo "✅ PostgreSQL stopped"

# Step 2: Reset postgres password using single-user mode
echo "🔐 Step 2: Resetting postgres password..."
echo "ALTER USER postgres WITH PASSWORD '${NEW_POSTGRES_PASSWORD}';" | sudo -u postgres "${PG_BIN}/postgres" --single -D "${PG_DATA_DIR}" postgres
echo "✅ Password reset command executed"

# Step 3: Start PostgreSQL server from /tmp directory
echo "🚀 Step 3: Starting PostgreSQL server..."
cd /tmp
sudo -u postgres "${PG_BIN}/pg_ctl" start -D "${PG_DATA_DIR}" -l /tmp/postgres_start.log
sleep 3
echo "✅ PostgreSQL started"

# Check if server is actually running
if ! sudo -u postgres "${PG_BIN}/pg_ctl" status -D "${PG_DATA_DIR}" | grep -q "server is running"; then
    echo "❌ PostgreSQL failed to start. Log output:"
    cat /tmp/postgres_start.log
    exit 1
fi

# Step 4: Test connection
echo ""
echo "🧪 Step 4: Testing postgres connection..."
if PGPASSWORD="${NEW_POSTGRES_PASSWORD}" psql -U postgres -d postgres -c "SELECT 'Connection successful!' as status;" 2>/dev/null | grep -q "Connection successful"; then
    echo "✅ Connection test PASSED for postgres user"

    # Step 5: Now create bisiadedokun user
    echo ""
    echo "👤 Step 5: Creating bisiadedokun user..."
    PGPASSWORD="${NEW_POSTGRES_PASSWORD}" psql -U postgres -d postgres -f /Users/bisiadedokun/bankapp/create-db-user.sql

    echo ""
    echo "🎉 SUCCESS!"
    echo ""
    echo "Passwords set:"
    echo "- postgres user: ${NEW_POSTGRES_PASSWORD}"
    echo "- bisiadedokun user: orokiipay_secure_banking_2024!@#"
    echo ""
    echo "The .env file is already configured correctly."
    echo "The server should now connect successfully!"
else
    echo "❌ Connection test FAILED"
    echo "Please check PostgreSQL logs at /tmp/postgres_start.log"
    exit 1
fi
