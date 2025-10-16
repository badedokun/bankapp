# AI Assistant Deployment Investigation
**Date**: October 15, 2025
**Issue**: AI Assistant features work locally but fail on GCP deployment

## Problem Statement

When accessing the application at https://fmfb-34-59-143-25.nip.io:
- Login works ✅
- Regular features work ✅
- AI Assistant features fail ❌
- Dashboard AI insights not loading ❌
- AI Chat page fails ❌

Browser console shows requests going to `/api/api/ai/...` (double `/api`)

## Evidence Collected

### 1. Nginx Access Logs (GCP)
```
172.59.209.78 - - [15/Oct/2025:21:23:41 +0000] "GET /api/api/ai/suggestions/smart HTTP/2.0" 404
172.59.209.78 - - [15/Oct/2025:21:23:57 +0000] "POST /api/api/ai/chat HTTP/2.0" 404
```

### 2. Git Status Comparison

**Local Machine:**
- Branch: `main`
- Latest commit: `7297b28` (Revert incorrect AI endpoint changes)
- AI features: **Working** ✅

**GCP Server:**
- Branch: `main`
- Latest commit: `adbc68a` (refactor: Use centralized TenantDetector)
- AI features: **Broken** ❌
- 2 commits behind local

### 3. Frontend Bundle Status (GCP)

**HTML Reference:**
```html
<script src="/main.3291ed8d9e086d3250af.bundle.js"></script>
```

**Latest Bundle File:**
```
dist/main.3f1f613716275e253386.bundle.js  (1.6M, Oct 15 20:08)
```

**Issue**: HTML not updated to reference latest bundle

### 4. Backend Routes Verification

**Local:**
```typescript
// server/routes/ai-chat.ts:664
router.get('/analytics/insights', authenticateToken, async (req, res) => {
```

**GCP:**
```typescript
// server/routes/ai-chat.ts:664
router.get('/analytics/insights', authenticateToken, async (req, res) => {
```

**Conclusion**: Backend routes are IDENTICAL ✅

### 5. buildApiUrl Logic Test

Created test script to verify URL construction:

**Results:**
```
LOCAL (API_BASE_URL = "http://localhost:3001"):
  buildApiUrl("ai/chat"): http://localhost:3001/api/ai/chat ✅

GCP (API_BASE_URL = "/api"):
  buildApiUrl("ai/chat"): /api/ai/chat ✅

Edge case (endpoint = "/api/ai/chat"):
  buildApiUrl("/api/ai/chat"): /api/api/ai/chat ❌❌❌
```

## Root Cause Hypothesis

The `buildApiUrl` function in `src/config/environment.ts` has the correct logic for both environments. However, **the deployed bundle on GCP contains code that's passing endpoints with `/api` already prefixed**.

### Key Questions Still Unanswered:

1. **Why does `/api/api/...` only happen on GCP?**
   - Same source code
   - Same git commit (adbc68a works locally)
   - Different result

2. **What's different about the GCP bundle?**
   - Built with same webpack config
   - Same environment detection logic
   - Yet produces different URLs

3. **Where is `/api` getting prefixed BEFORE buildApiUrl?**
   - Not found in current source code
   - Possibly in old bundle that hasn't been refreshed

## Proposed Investigation Steps

### Step 1: Verify Environment Detection
Add console logging to deployed bundle to see:
- What `ENV_CONFIG.API_BASE_URL` actually resolves to
- What `ENV_CONFIG.IS_CLOUD_DEPLOYMENT` is set to
- What endpoints are being passed to `buildApiUrl`

### Step 2: Check for Cached/Old Code
- Browser might be caching old bundle
- Service worker might be serving stale code
- HTML references wrong bundle

### Step 3: Compare Local vs GCP Webpack Build
- Check if webpack is injecting different values
- Verify NODE_ENV during build
- Check if REACT_APP_* environment variables differ

## Questions for User

Before applying ANY fix, we need to confirm:

1. When you test locally and it works, what URL are you accessing?
   - http://localhost:3000?
   - http://localhost:3001?
   - Other?

2. Can you open browser DevTools on the GCP site and check:
   - Network tab: What exact URL is the AI request going to?
   - Console tab: Any errors or warnings?
   - Application tab → Local Storage: Any stored API_BASE_URL?

3. Have you tried a hard refresh (Cmd+Shift+R) on the GCP site?

## Current Status

✅ **Confirmed Working:**
- Backend routes exist and respond correctly
- Login and authentication
- Non-AI features

❌ **Confirmed Broken:**
- AI endpoints receiving double `/api` prefix
- Only on GCP deployment
- Works fine locally with same code

⚠️ **Suspected Issue:**
- Old bundle cached somewhere
- OR environment variable difference during webpack build
- OR something in nginx configuration adding `/api`

## Next Steps

**DO NOT apply code changes until we confirm:**
1. The exact URL construction happening in the browser (via DevTools)
2. The actual API_BASE_URL value being used
3. Whether this is a build issue, cache issue, or actual code bug

---

**Note**: We already tried one "fix" that broke local deployment. We must be certain before changing anything else.
