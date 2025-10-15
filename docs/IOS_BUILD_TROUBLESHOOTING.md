# iOS Build Troubleshooting Guide

**Last Updated:** 2025-10-13
**Status:** Build failing - New Architecture / Folly compatibility issue
**Progress:** ~90% complete - build compiles for ~3 minutes before failing

---

## Problem Summary

The iOS build for OrokiiPayApp (React Native 0.81.1) fails due to React Native's **New Architecture (Fabric)** being enabled by default, which causes compatibility issues with `react-native-reanimated@3.6.3`. The error is:

```
fatal error: 'folly/coro/Coroutine.h' file not found
```

### Why This Happens

1. **New Architecture is enabled by default** in React Native 0.81.1
2. **react-native-reanimated 3.6.3** requires full Folly coroutine support when New Architecture is enabled
3. **RCT-Folly** version shipped with RN 0.81.1 doesn't include all required coroutine headers
4. **expo@54.0.13** also depends on Fabric/New Architecture components

---

## Current Configuration

### Dependencies Installed
- React Native: `0.81.1`
- react-native-reanimated: `3.6.3` ✅
- expo: `54.0.13` ✅
- expo-modules-core: `3.0.21` ✅
- expo-haptics: `15.0.7` ✅
- CocoaPods: 83 pods installed ✅

### Files Modified

#### 1. `/Users/bisiadedokun/bankapp/ios/Podfile` (Lines 20-26)
```ruby
use_react_native!(
  :path => config[:reactNativePath],
  # An absolute path to your application root.
  :app_path => "#{Pod::Config.instance.installation_root}/..",
  # Disable New Architecture (Fabric)
  :fabric_enabled => false
)
```

#### 2. `/Users/bisiadedokun/bankapp/babel.config.js`
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

#### 3. `/Users/bisiadedokun/bankapp/src/screens/history/TransactionHistoryScreen.tsx` (Lines 30-32, 294-295)
- Commented out top-level `jsPDF` imports (web-only library)
- Added dynamic `require()` in PDF export function

### Android Configuration (for comparison)
- File: `/Users/bisiadedokun/bankapp/android/gradle.properties:45`
- Setting: `newArchEnabled=false` ✅ (Android has it disabled and works)

---

## What We've Tried

### Attempt 1: Disable New Architecture in Info.plist ❌
**File:** `/Users/bisiadedokun/bankapp/ios/OrokiiPayApp/Info.plist`
**What we did:** Changed `RCTNewArchEnabled` from `<true/>` to `<false/>`
**Result:** Setting kept getting reverted (possibly by Xcode or build process)

### Attempt 2: Add `:fabric_enabled => false` to Podfile ⚠️
**File:** `/Users/bisiadedokun/bankapp/ios/Podfile:20-26`
**What we did:** Added explicit flag to disable Fabric
**Result:** Pod install still shows "Configuring the target with the New Architecture"
**Progress:** Build goes much further (~3 minutes) but still fails

### Attempt 3: Clean rebuilds (multiple times) ⚠️
**Commands run:**
```bash
cd /Users/bisiadedokun/bankapp/ios
rm -rf Pods Podfile.lock build
pod install
cd ..
rm -rf ios/build
npx react-native run-ios --simulator="iPhone 17 Pro"
```
**Result:** Build compiles longer than before but still fails with same error pattern

---

## Build Output Analysis

### Misleading Error Messages
The build output shows lines prefixed with `error` that are **NOT actual errors**:
```
error export CLANG_WARN_DOCUMENTATION_COMMENTS=YES
error export CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER=NO
```

These are just compiler command invocations that React Native CLI incorrectly labels as errors.

### Actual Error Location
The real error is buried in the Xcode build logs, likely in:
- DerivedData: `/Users/bisiadedokun/Library/Developer/Xcode/DerivedData/OrokiiPayApp-aqmtcdmcssrmdtbrqasjzobzambf/`
- Target: `RNReanimated` pod
- File causing error: Fabric-related files in react-native-reanimated

---

## Recommended Solutions (in order of preference)

### ⭐ Option 1: Properly Disable New Architecture (RECOMMENDED)
The `:fabric_enabled => false` flag might not be sufficient. Try:

**A. Set environment variable before pod install:**
```bash
cd /Users/bisiadedokun/bankapp/ios
export RCT_NEW_ARCH_ENABLED=0
rm -rf Pods Podfile.lock build
pod install
```

**B. Check if `prepare_react_native_project!` is overriding settings:**
The Podfile line 9 calls `prepare_react_native_project!` which might enable New Architecture by default. May need to pass parameters to it.

**C. Build from Xcode directly to see real error:**
```bash
open /Users/bisiadedokun/bankapp/ios/OrokiiPayApp.xcworkspace
```
Then build from Xcode UI - this will show the actual compilation error without CLI misleading messages.

---

### Option 2: Upgrade react-native-reanimated
Upgrade to a version with better New Architecture support:

```bash
cd /Users/bisiadedokun/bankapp
npm install react-native-reanimated@3.15.6 --legacy-peer-deps
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx react-native run-ios --simulator="iPhone 17 Pro"
```

**Pros:**
- Version 3.15.6 has better Fabric/New Architecture support
- Handles missing Folly headers gracefully

**Cons:**
- Newer version may have different behavior
- Need to test animations still work

---

### Option 3: Patch Podfile to Disable Folly Coroutines
Add this to the `post_install` block in Podfile (after line 33):

```ruby
post_install do |installer|
  # Existing react_native_post_install...
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false,
  )

  # Disable Folly coroutines to avoid missing header error
  installer.pods_project.targets.each do |target|
    if target.name == 'RCT-Folly'
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAVE_COROUTINES=0'
      end
    end
  end
end
```

Then:
```bash
cd /Users/bisiadedokun/bankapp/ios
rm -rf Pods Podfile.lock
pod install
```

---

### Option 4: Remove Expo (if not needed)
If Expo features aren't actively used, removing it simplifies the dependency tree:

```bash
cd /Users/bisiadedokun/bankapp
npm uninstall expo expo-modules-core expo-haptics
cd ios
rm -rf Pods Podfile.lock
pod install
```

---

## Key Files & Locations

### Project Files
- **Podfile:** `/Users/bisiadedokun/bankapp/ios/Podfile`
- **Info.plist:** `/Users/bisiadedokun/bankapp/ios/OrokiiPayApp/Info.plist`
- **Package.json:** `/Users/bisiadedokun/bankapp/package.json`
- **Babel config:** `/Users/bisiadedokun/bankapp/babel.config.js`

### Build Artifacts
- **DerivedData:** `/Users/bisiadedokun/Library/Developer/Xcode/DerivedData/OrokiiPayApp-aqmtcdmcssrmdtbrqasjzobzambf/`
- **Codegen output:** `/Users/bisiadedokun/bankapp/ios/build/generated/ios/`
- **Pod cache:** `/Users/bisiadedokun/bankapp/ios/Pods/`

### Simulator
- **Name:** iPhone 17 Pro
- **iOS Version:** 26.0
- **ID:** 29DCD834-04B7-47DB-A8FD-C2CB9F0AD280

---

## Useful Commands

### Check pod installation status
```bash
cd /Users/bisiadedokun/bankapp/ios
cat Podfile.lock | grep -E "(react-native-reanimated|Expo|RCT-Folly)"
```

### Clean everything and start fresh
```bash
cd /Users/bisiadedokun/bankapp
rm -rf ios/Pods ios/Podfile.lock ios/build
rm -rf node_modules/.cache
rm -rf ~/Library/Developer/Xcode/DerivedData/OrokiiPayApp-*
cd ios
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"
pod install
```

### Build with verbose output
```bash
cd /Users/bisiadedokun/bankapp/ios
xcodebuild -workspace OrokiiPayApp.xcworkspace \
  -scheme OrokiiPayApp \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  clean build 2>&1 | tee build.log
```

Then search the build.log for the actual error:
```bash
grep -E "error:|fatal error:" build.log
```

---

## Important Notes

1. **The build compiles for ~3 minutes** - this is good progress! We're much closer than before.

2. **React Native CLI output is misleading** - lines starting with `error` are often just compiler commands, not actual errors.

3. **Android build works fine** - Android has `newArchEnabled=false` in gradle.properties and builds successfully. iOS should be consistent.

4. **Info.plist RCTNewArchEnabled kept reverting** - Something (Xcode? build process?) was changing it back to `<true/>`. The Podfile approach is more reliable.

5. **`:fabric_enabled => false` might not be enough** - The `prepare_react_native_project!` call on line 9 of Podfile might be overriding this setting.

---

## Next Agent: Start Here

1. **First, try Option 1A** - Set `RCT_NEW_ARCH_ENABLED=0` environment variable before pod install

2. **If that doesn't work, open Xcode** and build from the IDE to see the real error message:
   ```bash
   open /Users/bisiadedokun/bankapp/ios/OrokiiPayApp.xcworkspace
   ```
   Then Product → Build (⌘B) and check the actual error in the Issue Navigator.

3. **If still stuck, try Option 2** - Upgrade react-native-reanimated to 3.15.6

4. **Document findings** in this file for future reference

---

## Related Documentation

- Android build documentation: `/Users/bisiadedokun/bankapp/docs/DEVELOPMENT_GUIDE.md` (lines 434-465)
- iOS build status: `/Users/bisiadedokun/bankapp/docs/IOS_BUILD_STATUS.md`
- React Native 0.81 New Architecture docs: https://reactnative.dev/docs/0.81/new-architecture-intro

---

## Session Context

**Date:** 2025-10-13
**Time spent:** ~3 hours investigating
**Build attempts:** 6+ full rebuilds
**Pod installs:** 8+ times
**Key insight:** The issue is specifically the New Architecture + react-native-reanimated 3.6.3 + Folly coroutine headers

**What works:**
- ✅ Dependencies installed correctly
- ✅ Babel configured with reanimated plugin
- ✅ Pods install successfully (83 pods)
- ✅ Build starts and compiles for ~3 minutes
- ✅ Android version builds and runs

**What doesn't work:**
- ❌ Build fails before linking phase
- ❌ New Architecture won't fully disable
- ❌ Error messages are misleading/unhelpful

Good luck with the next session! The solution is close - we just need to properly disable New Architecture or make reanimated compatible with it. 🚀
