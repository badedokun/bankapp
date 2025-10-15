# Theme Loading Issue - Root Cause & Prevention

## Why Does the Theme Keep Breaking?

Every time the server crashes due to import errors, the frontend continues to run but can't fetch the theme from the crashed backend. This makes it appear that the theme is "lost".

## Root Causes

### 1. **Server Crashes**
When TypeScript compilation fails, the server crashes and stops responding to API requests:
- Theme API returns nothing
- Frontend shows default/fallback colors
- Logo fails to load

### 2. **Import Errors**
The most common cause of crashes:

**Wrong:**
```typescript
import { query } from '../../config/multi-tenant-database';
```

**Correct:**
```typescript
import { query } from '../../config/database';
```

### 3. **Browser Cache**
When server crashes, browser may cache the error state:
- Shows old/broken UI
- Needs hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

## Prevention Checklist

### Before Creating New Services:

✅ **Check Import Patterns**
Look at existing working services:
```bash
grep "import.*query" server/services/ai-intelligence-service/CustomerDataService.ts
# Result: import { query } from '../../config/database';
```

✅ **Use Correct Import**
```typescript
// ✅ CORRECT - For AI services
import { query } from '../../config/database';

// ✅ CORRECT - For route files
import dbManager from '../config/multi-tenant-database';

// ❌ WRONG - Don't use this
import { query } from '../../config/multi-tenant-database';
```

✅ **Test Compilation**
```bash
npm run server:build
# Should complete without errors
```

✅ **Check Server Logs**
```bash
tail -f /tmp/server-restart.log
# Should see: "🚀 OrokiiPay API Server started successfully!"
```

### After Making Changes:

✅ **Verify Server Started**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

✅ **Test Theme API**
```bash
curl http://localhost:3001/api/tenants/theme/fmfb -H 'X-Tenant-ID: fmfb'
# Should return theme JSON with brandName and colors
```

✅ **Hard Refresh Browser**
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + F5
```

## Quick Fix Steps

If theme disappears:

1. **Check Server**
   ```bash
   tail -50 /tmp/server-restart.log | grep -E "error|Error"
   ```

2. **Find Import Error**
   Look for: "Module has no exported member 'query'"

3. **Fix Import**
   ```typescript
   // Change this:
   import { query } from '../../config/multi-tenant-database';

   // To this:
   import { query } from '../../config/database';
   ```

4. **Wait for Restart**
   ```bash
   tail -f /tmp/server-restart.log
   # Wait for: "🚀 OrokiiPay API Server started successfully!"
   ```

5. **Hard Refresh Browser**
   Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)

## File-Specific Import Rules

### AI Intelligence Services (`server/services/ai-intelligence-service/`)
```typescript
import { query } from '../../config/database';
```
Examples:
- CustomerDataService.ts ✅
- ConversationalTransferService.ts ✅
- ConversationStateManager.ts (no DB imports needed)

### Route Files (`server/routes/`)
```typescript
import dbManager from '../config/multi-tenant-database';
// Use: dbManager.queryTenant(tenantId, sql, params)
```
Examples:
- transfers.ts ✅
- transactions.ts ✅
- wallets.ts ✅

### Direct Database Access
```typescript
import { query } from '../config/database';
```
Use for:
- Simple queries in AI services
- Non-tenant-specific queries
- Quick lookups

## Common Errors & Solutions

### Error 1: "Module has no exported member 'query'"
**Cause:** Wrong import path
**Fix:** Use `../../config/database` not `multi-tenant-database`

### Error 2: "theme is not defined"
**Cause:** Styles using theme without getStyles function
**Fix:** Convert to `const getStyles = (theme: any) => StyleSheet.create({...})`

### Error 3: Theme shows default colors
**Cause:** Server crashed, frontend using fallback
**Fix:** Fix server error, hard refresh browser

### Error 4: Logo not loading
**Cause:** Theme API not responding
**Fix:** Check server is running, restart if needed

## Testing Checklist

Before committing changes:

- [ ] Server compiles without errors
- [ ] Server starts successfully
- [ ] Theme API responds correctly
- [ ] Dashboard loads with correct colors
- [ ] Logo displays properly
- [ ] AI chat functional
- [ ] No console errors

## Emergency Recovery

If everything breaks:

```bash
# 1. Check what changed
git status

# 2. See server error
tail -100 /tmp/server-restart.log | grep -A 10 "error"

# 3. Quick fix - revert problematic file
git checkout HEAD -- path/to/broken/file.ts

# 4. Verify server restarts
curl http://localhost:3001/health

# 5. Hard refresh browser
Cmd+Shift+R
```

## Key Learnings

1. **Always check existing imports** before copying patterns
2. **Test compilation** before assuming it works
3. **Server crashes ≠ theme lost** - theme is fine, server just needs restart
4. **Browser cache** can show stale error states
5. **Import paths matter** - `database` vs `multi-tenant-database`

## Date Created

October 13, 2025

## Last Updated

October 13, 2025
