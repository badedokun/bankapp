# iOS Build Status and Setup Guide

**Last Updated:** October 13, 2025 - End of Day
**Status:** 🔴 BLOCKED - New Architecture / Folly Compatibility Issue
**Progress:** ~90% - Build compiles for 3+ minutes before failing

## Overview

This document tracks the progress and issues encountered while setting up the iOS build for the OrokiiPay banking app.

## Current Status

### ✅ Successfully Completed

1. **React Native Reanimated**
   - Installed: `react-native-reanimated@3.6.3` (compatible with RN 0.81.1)
   - Babel configuration updated with reanimated plugin
   - iOS pod installed: RNReanimated (3.6.3)
   - Note: Version 3.16.4 was incompatible and caused build errors

2. **jsPDF Compatibility Fix**
   - Issue: jsPDF is web-only and cannot be bundled for React Native
   - Solution: Commented out top-level imports and used dynamic `require()` in PDF export function
   - File modified: `src/screens/history/TransactionHistoryScreen.tsx`
   - Changes:
     ```typescript
     // Before (lines 30-31):
     import jsPDF from 'jspdf';
     import autoTable from 'jspdf-autotable';

     // After:
     // jsPDF and autoTable are web-only and loaded dynamically when needed
     // import jsPDF from 'jspdf';
     // import autoTable from 'jspdf-autotable';

     // In exportToPDF function (lines 294-295):
     const jsPDF = require('jspdf').default;
     const autoTable = require('jspdf-autotable').default;
     ```

3. **Expo Integration**
   - Installed: `expo@54.0.13` (211 packages)
   - Installed: `expo-modules-core@3.0.21`
   - Installed: `expo-haptics@15.0.7`
   - Ran `pod install` successfully - 83 total pods

4. **Babel Configuration**
   - File: `babel.config.js`
   - Added plugins array with `react-native-reanimated/plugin`

### 🔴 CRITICAL BLOCKER

**Root Cause Identified:** React Native New Architecture (Fabric) + react-native-reanimated 3.6.3 + Missing Folly Coroutine Headers

**Error:** `fatal error: 'folly/coro/Coroutine.h' file not found`

**Why This Happens:**
1. React Native 0.81.1 enables New Architecture by default
2. react-native-reanimated 3.6.3 requires full Folly coroutine support when New Architecture is enabled
3. RCT-Folly version shipped with RN 0.81.1 doesn't include all required coroutine headers
4. expo@54.0.13 also depends on Fabric/New Architecture components

**Build Progress:** Build compiles successfully for ~3 minutes (83 pods, all native modules compile) before hitting the Folly header error.

**See Detailed Analysis:** `/Users/bisiadedokun/bankapp/docs/IOS_BUILD_TROUBLESHOOTING.md`

### 🔄 What We've Tried

1. **Disabled New Architecture in Info.plist** ❌
   - Changed `RCTNewArchEnabled` from `<true/>` to `<false/>`
   - Result: Setting kept getting reverted by build process

2. **Added `:fabric_enabled => false` to Podfile** ⚠️
   - Modified: `/Users/bisiadedokun/bankapp/ios/Podfile` (lines 20-26)
   - Result: Pod install still shows "Configuring with New Architecture"
   - Progress: Build goes much further but still fails

3. **Multiple Clean Rebuilds** ⚠️
   - Cleaned Pods, Podfile.lock, build directories 8+ times
   - Cleared Metro cache multiple times
   - Result: Consistent failure at same point

4. **Metro Bundler Cache Issues** ✅ RESOLVED
   - Cleared Metro cache: `rm -rf /tmp/metro-* node_modules/.cache`
   - Cleared watchman: `watchman watch-del-all`
   - Restarted Metro with `--reset-cache`
   - Status: Resolved

## Dependencies Installed

```json
{
  "react-native-reanimated": "^3.6.3",
  "expo": "^54.0.13",
  "expo-modules-core": "^3.0.21",
  "expo-haptics": "^15.0.7"
}
```

## iOS Pods Installed

Total: 83 pods including:
- RNReanimated (3.6.3)
- Expo (54.0.13)
- RNCAsyncStorage
- RNGestureHandler
- RNKeychain
- RNSVG
- RNScreens
- lottie-react-native
- react-native-config
- react-native-safe-area-context

## Key Learnings from Android Build

The Android APK build documentation (`DEVELOPMENT_GUIDE.md` lines 434-465) highlighted the importance of:
1. Using `--reset-cache` when rebuilding after dependency changes
2. Ensuring compatible dependency versions
3. Clearing Metro cache thoroughly

These lessons were applied to iOS but additional compatibility issues emerged.

## Environment

- React Native: 0.81.1
- iOS Simulator: iPhone 17 Pro (iOS 26.0)
- Xcode: Latest (from build output)
- Node: Latest
- CocoaPods: Installed and working

## Commands Used

```bash
# Install dependencies
npm install react-native-reanimated@3.6.3 --legacy-peer-deps
npm install expo-modules-core --legacy-peer-deps
npm install expo --legacy-peer-deps

# iOS setup
cd ios
pod install
cd ..

# Clear caches
rm -rf /tmp/metro-* /tmp/react-* /tmp/haste-* node_modules/.cache
watchman watch-del-all

# Build iOS
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"
npx react-native run-ios --simulator="iPhone 17 Pro"
```

## ⭐ RECOMMENDED NEXT STEPS FOR NEXT SESSION

**Priority 1: Try Environment Variable Approach**
```bash
cd /Users/bisiadedokun/bankapp/ios
export RCT_NEW_ARCH_ENABLED=0
rm -rf Pods Podfile.lock build
pod install
cd ..
npx react-native run-ios --simulator="iPhone 17 Pro"
```

**Priority 2: Build from Xcode to See Real Error**
```bash
open /Users/bisiadedokun/bankapp/ios/OrokiiPayApp.xcworkspace
```
Then Product → Build (⌘B) and check Issue Navigator for actual error (not misleading CLI output).

**Priority 3: Upgrade react-native-reanimated**
```bash
cd /Users/bisiadedokun/bankapp
npm install react-native-reanimated@3.15.6 --legacy-peer-deps
cd ios
rm -rf Pods Podfile.lock
pod install
```

**See Full Analysis:** `/Users/bisiadedokun/bankapp/docs/IOS_BUILD_TROUBLESHOOTING.md`

This comprehensive guide includes:
- 4 solution options with detailed steps
- Why each approach should work
- All commands needed
- File locations and configurations
- Debugging strategies

## Related Files

- `/Users/bisiadedokun/bankapp/babel.config.js` - Babel configuration
- `/Users/bisiadedokun/bankapp/ios/Podfile` - iOS dependencies
- `/Users/bisiadedokun/bankapp/ios/Podfile.lock` - Locked pod versions
- `/Users/bisiadedokun/bankapp/src/screens/history/TransactionHistoryScreen.tsx` - jsPDF fix
- `/Users/bisiadedokun/bankapp/package.json` - npm dependencies

## Production Status

While iOS build is in progress, the web version is fully functional:
- ✅ Web app deployed: https://fmfb-34-59-143-25.nip.io
- ✅ Database migrations complete
- ✅ Multi-tenant architecture working
- ✅ Server running in production

## References

- React Native 0.81 Documentation
- Expo Bare Workflow Guide
- react-native-reanimated Installation Guide
- Android Build Documentation: `docs/DEVELOPMENT_GUIDE.md` (lines 434-465)
