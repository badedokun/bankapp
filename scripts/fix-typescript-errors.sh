#!/bin/bash

# TypeScript Error Fixing Script
# Systematically fixes common TypeScript compilation errors

set -e

echo "🔍 TypeScript Error Fixer"
echo "========================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get initial error count
echo "📊 Counting initial errors..."
INITIAL_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
echo "Found $INITIAL_ERRORS errors"
echo ""

# Save all errors to a file for processing
echo "💾 Saving error list..."
npx tsc --noEmit 2>&1 > /tmp/ts-errors.txt

# Function to fix unused variables (TS6133)
fix_unused_variables() {
    echo "🔧 Fixing TS6133: Unused variables..."

    # Extract all TS6133 errors
    grep "error TS6133" /tmp/ts-errors.txt | while read -r line; do
        # Parse error: file(line,col): error TS6133: 'varName' is declared but its value is never read
        if [[ $line =~ ^(.+\.tsx?)\(([0-9]+),([0-9]+)\):.*\'([^\']+)\'.*never\ read ]]; then
            file="${BASH_REMATCH[1]}"
            linenum="${BASH_REMATCH[2]}"
            varname="${BASH_REMATCH[4]}"

            if [ -f "$file" ]; then
                # Skip if already prefixed with underscore
                if grep -q "_${varname}" "$file"; then
                    continue
                fi

                #  Replace variable name with _varname
                sed -i.bak "${linenum}s/\\b${varname}\\b/_${varname}/g" "$file"
                echo "  ✅ Fixed unused '$varname' in $file:$linenum"
            fi
        fi
    done
}

# Function to fix implicit any (TS7006)
fix_implicit_any() {
    echo "🔧 Fixing TS7006: Implicit any types..."

    # Find files with TS7006 errors
    grep "error TS7006" /tmp/ts-errors.txt | cut -d'(' -f1 | sort -u | while read -r file; do
        if [ ! -f "$file" ]; then
            continue
        fi

        # Check if file already has express imports
        if ! grep -q "import.*Request.*Response.*from.*express" "$file"; then
            # Add import at the top
            if grep -q "^import" "$file"; then
                # Add after first import
                sed -i.bak "1a\\
import { Request, Response, NextFunction } from 'express';
" "$file"
            else
                # Add as first line
                sed -i.bak "1i\\
import { Request, Response, NextFunction } from 'express';
" "$file"
            fi
            echo "  ✅ Added Express imports to $file"
        fi

        # Fix common patterns
        sed -i.bak 's/(req,\s*res,\s*next)/(req: Request, res: Response, next: NextFunction)/g' "$file"
        sed -i.bak 's/(req,\s*res)/(req: Request, res: Response)/g' "$file"
    done
}

# Function to fix unknown error type (TS18046)
fix_unknown_error() {
    echo "🔧 Fixing TS18046: Unknown error type..."

    # Find files with TS18046 errors
    grep "error TS18046" /tmp/ts-errors.txt | cut -d'(' -f1 | sort -u | while read -r file; do
        if [ ! -f "$file" ]; then
            continue
        fi

        # Fix common error patterns
        sed -i.bak 's/console\.error([^,]*,\s*error)/console.error(\1, (error as Error).message || error)/g' "$file"
        sed -i.bak 's/error\.message/(error as Error).message/g' "$file"
        sed -i.bak 's/error\.stack/(error as Error).stack/g' "$file"

        echo "  ✅ Fixed error types in $file"
    done
}

# Function to add missing returns (TS7030)
fix_missing_returns() {
    echo "🔧 Fixing TS7030: Missing return statements..."

    # This is more complex and requires manual inspection
    # We'll just report these
    COUNT=$(grep "error TS7030" /tmp/ts-errors.txt | wc -l | tr -d ' ')
    echo "  ℹ️  Found $COUNT functions with missing return statements"
    echo "  ℹ️  These require manual review to add 'return' or 'return undefined'"

    grep "error TS7030" /tmp/ts-errors.txt | cut -d'(' -f1 | sort -u > /tmp/ts7030-files.txt
    echo "  📝 List saved to /tmp/ts7030-files.txt"
}

# Main execution
echo "Starting automated fixes..."
echo ""

# Run fixers
fix_unused_variables
echo ""
fix_implicit_any
echo ""
fix_unknown_error
echo ""
fix_missing_returns
echo ""

# Clean up backup files
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -type f -delete

# Get final error count
echo "📊 Counting remaining errors..."
FINAL_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l | tr -d ' ')
FIXED=$((INITIAL_ERRORS - FINAL_ERRORS))

echo ""
echo "================================"
echo "✨ Summary"
echo "================================"
echo "Initial errors: $INITIAL_ERRORS"
echo "Final errors:   $FINAL_ERRORS"
echo "Fixed:          $FIXED"
echo ""

if [ $FINAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All TypeScript errors fixed!${NC}"
else
    echo -e "${YELLOW}⚠️  $FINAL_ERRORS errors remaining${NC}"
    echo "Run 'npx tsc --noEmit' to see remaining errors"
fi

echo ""
