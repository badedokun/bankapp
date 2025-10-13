# iOS Setup - Next Steps

> **Current Status**: Libraries installed ✅ | Xcode needed ❌ | CocoaPods needed ❌

## ✅ What's Already Done

1. **Mobile UI Libraries Installed**
   - ✅ `expo-linear-gradient@15.0.7` - Gradient backgrounds
   - ✅ `@react-native-community/blur@4.4.1` - iOS native blur effects

2. **Documentation Created**
   - ✅ iOS Development Guide
   - ✅ iOS Build Requirements Checklist
   - ✅ Mobile UI Compatibility Analysis
   - ✅ PROJECT_OVERVIEW.md updated

3. **Git Branches Ready**
   - ✅ `feature/mobile-android-build` - Android work (pushed to remote)
   - ✅ `feature/mobile-ios-build` - iOS work (pushed to remote)

---

## 🎯 Next Steps to Build iOS App

### Step 1: Install Xcode (~1 hour)

**Option A: Mac App Store (Recommended)**
```bash
# 1. Open Mac App Store
open -a "App Store"

# 2. Search for "Xcode" and click Install
# Download size: ~15 GB
# Install time: 30-60 minutes

# 3. After installation, accept license
sudo xcodebuild -license accept

# 4. Verify installation
xcodebuild -version
# Should show: Xcode 15.x or later
```

**Option B: Direct Download**
1. Go to https://developer.apple.com/xcode/
2. Download Xcode 15.x or later
3. Install the .xip file
4. Run license acceptance command above

**⏱️ Time Required**: 1-2 hours (mostly download time)

---

### Step 2: Install CocoaPods (~5 minutes)

```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
# Should show: 1.15.x or later

# Update CocoaPods repo (optional but recommended)
pod repo update
```

**⏱️ Time Required**: 5-10 minutes

---

### Step 3: Install iOS Dependencies (~15 minutes first time)

```bash
# Navigate to iOS directory
cd ios

# Install dependencies
pod install

# This will:
# - Download all iOS dependencies
# - Create OrokiiPayApp.xcworkspace file
# - Configure project for React Native

# Return to project root
cd ..
```

**⏱️ Time Required**: 10-15 minutes (first time)

**⚠️ Important**: After `pod install`, you MUST use `.xcworkspace` file, NOT `.xcodeproj`

---

### Step 4: Configure Signing (FREE Apple ID works!)

```bash
# Open Xcode workspace (NOT .xcodeproj!)
open ios/OrokiiPayApp.xcworkspace

# In Xcode:
# 1. Select "OrokiiPayApp" project in left sidebar
# 2. Select "OrokiiPayApp" target
# 3. Go to "Signing & Capabilities" tab
# 4. ✅ Enable "Automatically manage signing"
# 5. Click "Team" dropdown → "Add an Account"
# 6. Sign in with your Apple ID (free!)
# 7. Select your Team (your Apple ID will appear)
```

**⏱️ Time Required**: 5 minutes

**💰 Cost**: FREE for development and testing!

---

### Step 5: Build for iOS Simulator (FREE!)

```bash
# List available simulators
xcrun simctl list devices available | grep iPhone

# Build and run on simulator (no Apple account needed!)
npx react-native run-ios --simulator="iPhone 15 Pro"

# First build takes 5-8 minutes
# Subsequent builds: 1-2 minutes
```

**⏱️ First Build**: 5-8 minutes
**⏱️ Subsequent Builds**: 1-2 minutes

**💰 Cost**: FREE - No Apple Developer account required!

---

## 📊 Time & Cost Summary

### Development (Completely FREE!)
| Task | Time | Cost |
|------|------|------|
| Install Xcode | 1-2 hours | $0 |
| Install CocoaPods | 5-10 minutes | $0 |
| Run pod install | 10-15 minutes | $0 |
| Configure signing | 5 minutes | $0 |
| First build | 5-8 minutes | $0 |
| **Total** | **2-3 hours** | **$0** |

### Production (Optional - Later)
| Task | Time | Cost |
|------|------|------|
| Apple Developer Program | 24-48 hours approval | $99/year |
| TestFlight setup | 30 minutes | Included |
| App Store submission | 1-2 days review | Included |

**You can develop and test for FREE indefinitely using the iOS Simulator!**

---

## 🚀 Quick Start (After Xcode Installed)

```bash
# Complete setup in one go:
sudo gem install cocoapods
cd ios && pod install && cd ..
open ios/OrokiiPayApp.xcworkspace

# Then in Xcode:
# 1. Configure signing (your Apple ID)
# 2. Select iPhone 15 Pro simulator
# 3. Click Play ▶ button

# Or from terminal:
npx react-native run-ios --simulator="iPhone 15 Pro"
```

---

## 🎯 Current Blockers

1. **Xcode** - Must install from Mac App Store (1-2 hours)
2. **CocoaPods** - Install after Xcode (5 minutes)
3. **pod install** - Run after CocoaPods installed (10-15 minutes)

---

## ✅ Verification Commands

Run these after setup to verify everything works:

```bash
# 1. Verify Xcode
xcodebuild -version
# ✅ Should show: Xcode 15.x

# 2. Verify CocoaPods
pod --version
# ✅ Should show: 1.15.x

# 3. Verify workspace exists
ls ios/*.xcworkspace
# ✅ Should show: OrokiiPayApp.xcworkspace

# 4. Verify libraries installed
grep -E "(expo-linear-gradient|blur)" package.json
# ✅ Should show both libraries

# 5. Verify simulators available
xcrun simctl list devices available | grep "iPhone"
# ✅ Should show list of iPhone simulators
```

---

## 📱 Testing Options Summary

| Option | Cost | Device Needed | App Expiry | Best For |
|--------|------|---------------|------------|----------|
| **iOS Simulator** | FREE | No | Never | Development |
| **Physical Device (Free)** | FREE | Yes | 7 days | Quick device test |
| **Physical Device (Paid)** | $99/year | Yes | Never | Extended testing |
| **TestFlight** | $99/year | Yes | 90 days | Beta testing |
| **App Store** | $99/year | No | Never | Production |

**Recommendation**: Start with iOS Simulator (FREE, instant, no device needed)

---

## 🆘 Common Issues

### Issue: "xcodebuild requires Xcode"
**Solution**: Xcode not installed, only Command Line Tools. Install Xcode from Mac App Store.

### Issue: "pod: command not found"
**Solution**: CocoaPods not installed. Run `sudo gem install cocoapods`

### Issue: "Unable to resolve dependency tree"
**Solution**: Already handled! We used `--legacy-peer-deps` flag during installation.

### Issue: Opening .xcodeproj instead of .xcworkspace
**Solution**: After `pod install`, ALWAYS use `.xcworkspace` file:
```bash
# ❌ Wrong
open ios/OrokiiPayApp.xcodeproj

# ✅ Correct
open ios/OrokiiPayApp.xcworkspace
```

---

## 📞 Need Help?

- **iOS Development Guide**: `docs/IOS_DEVELOPMENT_GUIDE.md`
- **Build Requirements**: `docs/IOS_BUILD_REQUIREMENTS_CHECKLIST.md`
- **UI Compatibility**: `docs/ANDROID_UI_SYSTEM_COMPATIBILITY_ANALYSIS.md`

---

*Ready to start? Begin with Step 1: Install Xcode from Mac App Store!*
