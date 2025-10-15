#!/usr/bin/env node

/**
 * TypeScript Error Fixer
 * Automatically fixes common TypeScript compilation errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get TypeScript errors
function getTypeScriptErrors() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf-8' });
    return [];
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');
    const errors = [];

    for (const line of lines) {
      // Parse: file.ts(line,col): error TS#### : message
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        const [, file, lineNum, col, code, message] = match;
        errors.push({
          file,
          line: parseInt(lineNum),
          col: parseInt(col),
          code,
          message,
        });
      }
    }

    return errors;
  }
}

// Fix TS6133: Unused variables
function fixUnusedVariables(errors) {
  log('\n🔧 Fixing TS6133: Unused variables...', 'blue');
  let fixed = 0;

  const ts6133Errors = errors.filter(e => e.code === 'TS6133');
  const fileGroups = {};

  // Group errors by file
  for (const error of ts6133Errors) {
    if (!fileGroups[error.file]) {
      fileGroups[error.file] = [];
    }
    fileGroups[error.file].push(error);
  }

  // Process each file
  for (const [file, fileErrors] of Object.entries(fileGroups)) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Sort by line number in reverse to avoid offset issues
    fileErrors.sort((a, b) => b.line - a.line);

    for (const error of fileErrors) {
      const match = error.message.match(/'([^']+)' is declared but its value is never read/);
      if (!match) continue;

      const varName = match[1];
      const lineIndex = error.line - 1;

      if (lineIndex < 0 || lineIndex >= lines.length) continue;

      const line = lines[lineIndex];

      // Skip if already prefixed
      if (line.includes(`_${varName}`) || line.includes(`// @ts-ignore`)) continue;

      // Fix the variable name
      const newLine = line
        .replace(new RegExp(`\\b(const|let|var)\\s+${varName}\\b`), `$1 _${varName}`)
        .replace(new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)`), (match, before, after) => {
          return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        })
        .replace(new RegExp(`{([^}]*)\\b${varName}\\b([^}]*)}\\s*=`), (match) => {
          return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        });

      if (newLine !== line) {
        lines[lineIndex] = newLine;
        fixed++;
        log(`  ✅ Fixed '${varName}' in ${file}:${error.line}`, 'green');
      }
    }

    // Write back if changes were made
    if (lines.join('\n') !== content) {
      fs.writeFileSync(file, lines.join('\n'), 'utf-8');
    }
  }

  log(`  📊 Fixed ${fixed} unused variable(s)`, fixed > 0 ? 'green' : 'yellow');
  return fixed;
}

// Fix TS7006: Implicit any types
function fixImplicitAny(errors) {
  log('\n🔧 Fixing TS7006: Implicit any types...', 'blue');
  let fixed = 0;

  const ts7006Errors = errors.filter(e => e.code === 'TS7006');
  const files = [...new Set(ts7006Errors.map(e => e.file))];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Add import if not present
    if (!content.includes("import") || !content.match(/import.*Request.*Response.*from.*['"]express['"]/)) {
      if (content.includes("import")) {
        // Add after first import block
        const firstImportEnd = content.indexOf('\n', content.indexOf('import'));
        content = content.slice(0, firstImportEnd + 1) +
                  "import { Request, Response, NextFunction } from 'express';\n" +
                  content.slice(firstImportEnd + 1);
      } else {
        content = "import { Request, Response, NextFunction } from 'express';\n\n" + content;
      }
    }

    // Fix function parameters
    content = content
      .replace(/\(req,\s*res,\s*next\)\s*(:|=>)/g, '(req: Request, res: Response, next: NextFunction)$1')
      .replace(/\(req,\s*res\)\s*(:|=>)/g, '(req: Request, res: Response)$1')
      .replace(/function\s*\(\s*req,\s*res,\s*next\s*\)/g, 'function(req: Request, res: Response, next: NextFunction)')
      .replace(/function\s*\(\s*req,\s*res\s*\)/g, 'function(req: Request, res: Response)');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      fixed++;
      log(`  ✅ Fixed implicit any in ${file}`, 'green');
    }
  }

  log(`  📊 Fixed ${fixed} file(s) with implicit any types`, fixed > 0 ? 'green' : 'yellow');
  return fixed;
}

// Fix TS18046: Unknown error type
function fixUnknownError(errors) {
  log('\n🔧 Fixing TS18046: Unknown error type...', 'blue');
  let fixed = 0;

  const ts18046Errors = errors.filter(e => e.code === 'TS18046');
  const files = [...new Set(ts18046Errors.map(e => e.file))];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Fix error.message, error.stack, etc.
    content = content
      .replace(/\berror\.message\b/g, '(error as Error).message')
      .replace(/\berror\.stack\b/g, '(error as Error).stack')
      .replace(/\berror\.name\b/g, '(error as Error).name')
      .replace(/console\.error\(([^,)]+),\s*error\)/g, 'console.error($1, (error as Error).message || error)');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      fixed++;
      log(`  ✅ Fixed unknown error type in ${file}`, 'green');
    }
  }

  log(`  📊 Fixed ${fixed} file(s) with unknown error types`, fixed > 0 ? 'green' : 'yellow');
  return fixed;
}

// Report TS7030: Missing returns (requires manual fix)
function reportMissingReturns(errors) {
  log('\n📝 TS7030: Missing return statements (requires manual review)...', 'blue');

  const ts7030Errors = errors.filter(e => e.code === 'TS7030');

  if (ts7030Errors.length === 0) {
    log('  ✅ No missing return statements found', 'green');
    return;
  }

  log(`  ℹ️  Found ${ts7030Errors.length} function(s) with missing return statements`, 'yellow');

  const fileGroups = {};
  for (const error of ts7030Errors) {
    if (!fileGroups[error.file]) {
      fileGroups[error.file] = [];
    }
    fileGroups[error.file].push(error.line);
  }

  for (const [file, lines] of Object.entries(fileGroups)) {
    log(`  📄 ${file}: lines ${lines.join(', ')}`, 'cyan');
  }

  log('\n  💡 Tip: Add "return" statements at the end of these async functions', 'yellow');
}

// Main
async function main() {
  log('═══════════════════════════════════════', 'cyan');
  log('  TypeScript Error Fixer', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  log('🔍 Analyzing TypeScript errors...');
  const initialErrors = getTypeScriptErrors();
  log(`📊 Found ${initialErrors.length} errors\n`, 'yellow');

  if (initialErrors.length === 0) {
    log('🎉 No errors found! Your code is already error-free!', 'green');
    return;
  }

  // Categorize errors
  const errorCounts = {};
  for (const error of initialErrors) {
    errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
  }

  log('📊 Error breakdown:');
  for (const [code, count] of Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    log(`  ${code}: ${count}`, 'cyan');
  }

  // Run fixers
  let totalFixed = 0;
  totalFixed += fixUnusedVariables(initialErrors);
  totalFixed += fixImplicitAny(initialErrors);
  totalFixed += fixUnknownError(initialErrors);
  reportMissingReturns(initialErrors);

  // Check final state
  log('\n🔍 Verifying fixes...');
  const finalErrors = getTypeScriptErrors();
  const remaining = finalErrors.length;
  const fixed = initialErrors.length - remaining;

  log('\n═══════════════════════════════════════', 'cyan');
  log('  Summary', 'cyan');
  log('═══════════════════════════════════════', 'cyan');
  log(`Initial errors:  ${initialErrors.length}`, 'yellow');
  log(`Errors fixed:    ${fixed}`, fixed > 0 ? 'green' : 'yellow');
  log(`Remaining:       ${remaining}`, remaining === 0 ? 'green' : 'yellow');
  log('═══════════════════════════════════════\n', 'cyan');

  if (remaining === 0) {
    log('🎉 All errors fixed! Your code now compiles without errors!', 'green');
  } else if (fixed > 0) {
    log(`✨ Fixed ${fixed} error(s). Run 'npx tsc --noEmit' to see remaining issues.`, 'yellow');
  } else {
    log('⚠️  No automatic fixes could be applied. Manual intervention required.', 'red');
  }
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
