#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Get all TypeScript errors
async function getTypescriptErrors() {
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1');
    const output = stdout || stderr;
    const lines = output.split('\n');

    const errors = [];
    for (const line of lines) {
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        const [, file, line, col, code, message] = match;
        errors.push({ file, line: parseInt(line), col: parseInt(col), code, message });
      }
    }

    return errors;
  } catch (error) {
    // tsc returns non-zero exit code when there are errors
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');

    const errors = [];
    for (const line of lines) {
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        const [, file, line, col, code, message] = match;
        errors.push({ file, line: parseInt(line), col: parseInt(col), code, message });
      }
    }

    return errors;
  }
}

// Fix unused variables by prefixing with underscore
function fixUnusedVariable(content, varName, lineNum) {
  const lines = content.split('\n');
  if (lineNum > 0 && lineNum <= lines.length) {
    const line = lines[lineNum - 1];

    // Don't fix if already has underscore
    if (line.includes(`_${varName}`)) {
      return content;
    }

    // Fix various patterns
    lines[lineNum - 1] = line
      .replace(new RegExp(`\\b(const|let|var)\\s+${varName}\\b`), `$1 _${varName}`)
      .replace(new RegExp(`\\(([^)]*)\\b${varName}\\b([^)]*)\\)`), (match, before, after) => {
        // Handle function parameters
        const params = (before + varName + after).split(',').map(p => p.trim());
        const fixedParams = params.map(p => {
          if (p.includes(varName) && !p.includes(`_${varName}`)) {
            return p.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
          }
          return p;
        });
        return `(${fixedParams.join(', ')})`;
      });

    return lines.join('\n');
  }
  return content;
}

// Fix implicit any types
function fixImplicitAny(content, lineNum) {
  const lines = content.split('\n');
  if (lineNum > 0 && lineNum <= lines.length) {
    const line = lines[lineNum - 1];

    // Add Request, Response, NextFunction types
    if (line.includes('req') && line.includes('res') && !line.includes(': Request') && !line.includes(': Response')) {
      lines[lineNum - 1] = line
        .replace(/\(req,\s*res,\s*next\)/, '(req: Request, res: Response, next: NextFunction)')
        .replace(/\(req,\s*res\)/, '(req: Request, res: Response)');
    }

    return lines.join('\n');
  }
  return content;
}

// Main processing
async function main() {
  console.log('🔍 Getting TypeScript errors...');
  const errors = await getTypescriptErrors();

  console.log(`📊 Found ${errors.length} errors`);

  // Group errors by file
  const errorsByFile = {};
  for (const error of errors) {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  }

  console.log(`📁 Errors in ${Object.keys(errorsByFile).length} files`);

  // Process each file
  for (const [file, fileErrors] of Object.entries(errorsByFile)) {
    // Skip node_modules and test files
    if (file.includes('node_modules') || file.includes('.test.') || file.includes('.spec.')) {
      continue;
    }

    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Sort errors by line number in reverse to avoid line number shifts
    const sortedErrors = fileErrors.sort((a, b) => b.line - a.line);

    for (const error of sortedErrors) {
      if (error.code === 'TS6133') {
        // Unused variable
        const match = error.message.match(/'([^']+)' is declared but its value is never read/);
        if (match) {
          const varName = match[1];
          const newContent = fixUnusedVariable(content, varName, error.line);
          if (newContent !== content) {
            content = newContent;
            modified = true;
            console.log(`  ✅ Fixed unused variable '${varName}' at ${file}:${error.line}`);
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`💾 Saved ${file}`);
    }
  }

  console.log('✨ Done!');
}

main().catch(console.error);
