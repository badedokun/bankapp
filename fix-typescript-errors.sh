#!/bin/bash

# TypeScript Error Fix Script
# This script systematically fixes common TypeScript errors

echo "🔧 Starting TypeScript error fixes..."

# 1. Fix unused parameters by prefixing with underscore
echo "1️⃣ Fixing unused parameters..."

# Fix unused 'req', 'res', 'next' parameters in middleware
find server/middleware server/routes -name "*.ts" -type f | while read file; do
  # Replace unused parameters with underscore prefix
  sed -i '' 's/(\([^)]*\)\<req\>,/(\1_req,/g' "$file" 2>/dev/null
  sed -i '' 's/, *\<res\>,/, _res,/g' "$file" 2>/dev/null
  sed -i '' 's/, *\<next\>)/, _next)/g' "$file" 2>/dev/null
done

echo "✅ Fixed unused parameter warnings"

# 2. Fix 'unknown' error types
echo "2️⃣ Fixing unknown error types..."

# This is complex and needs manual review, so we'll create a list
npx tsc --noEmit 2>&1 | grep "TS18046" | cut -d'(' -f1 > /tmp/unknown-errors.txt
echo "   Found $(wc -l < /tmp/unknown-errors.txt) files with unknown error types"
echo "   (These need manual review - see /tmp/unknown-errors.txt)"

# 3. Fix 'not all code paths return value'
echo "3️⃣ Listing functions that need return statements..."
npx tsc --noEmit 2>&1 | grep "TS7030" | cut -d'(' -f1 > /tmp/return-path-errors.txt
echo "   Found $(wc -l < /tmp/return-path-errors.txt) functions (see /tmp/return-path-errors.txt)"

echo "✅ TypeScript fix script complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Fixed unused parameter warnings"
echo "   ⚠️  Unknown error types need manual review"
echo "   ⚠️  Missing return statements need manual review"
echo ""
echo "Run 'npx tsc --noEmit' to see remaining errors"
