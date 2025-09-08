#!/bin/bash

# Script to migrate all JavaScript files to TypeScript in the server directory

echo "🔄 Starting migration of JavaScript files to TypeScript..."

# Function to rename JS to TS
migrate_file() {
    local js_file=$1
    local ts_file="${js_file%.js}.ts"
    
    if [ -f "$js_file" ]; then
        echo "  📝 Migrating: $js_file → $ts_file"
        mv "$js_file" "$ts_file"
        
        # Basic replacements for common patterns
        sed -i '' "s/const express = require('express')/import express from 'express'/g" "$ts_file"
        sed -i '' "s/const { /import { /g" "$ts_file"
        sed -i '' "s/} = require(/} from /g" "$ts_file"
        sed -i '' "s/module.exports = /export default /g" "$ts_file"
        sed -i '' "s/module.exports\./export /g" "$ts_file"
        sed -i '' "s/require('/import '/g" "$ts_file"
        sed -i '' "s/')/'/g" "$ts_file"
    fi
}

# Migrate all JavaScript files
echo "📂 Migrating server files..."

# Config files
migrate_file "server/config/database.js"
migrate_file "server/config/multi-tenant-database.js"

# Middleware files
migrate_file "server/middleware/auth.js"
migrate_file "server/middleware/errorHandler.js"
migrate_file "server/middleware/tenant.js"

# Route files
migrate_file "server/routes/assets.js"
migrate_file "server/routes/auth.js"
migrate_file "server/routes/tenants.js"
migrate_file "server/routes/transfers.js"
migrate_file "server/routes/users.js"
migrate_file "server/routes/wallets.js"

# Main server file
migrate_file "server/index.js"

# Script files
echo "📂 Migrating script files..."
migrate_file "scripts/setup-database.js"
migrate_file "scripts/setup-sqlite.js"
migrate_file "scripts/provision-tenant-database.js"
migrate_file "scripts/upload_fmfb_logo.js"

echo ""
echo "✅ Migration complete! All JavaScript files have been renamed to TypeScript."
echo ""
echo "⚠️  IMPORTANT: Manual fixes are required:"
echo "   1. Add proper type annotations to function parameters and return types"
echo "   2. Import types from the server/types/index.d.ts file"
echo "   3. Fix any TypeScript compilation errors"
echo "   4. Update import paths in files that import these modules"
echo ""
echo "Run 'npm run build:server' to compile TypeScript files."