# iOS Build Requirements Checklist

> **Assessment Date**: October 12, 2025
> **Current Status**: Ready for iOS setup
> **Estimated Setup Time**: 2-3 hours (mostly Xcode download)

---

## ✅ What You Already Have

### System Requirements (COMPLETE)
- ✅ **macOS 15.6.1 (Sequoia)** - Compatible with latest Xcode
- ✅ **Command Line Tools** - Already installed at `/Library/Developer/CommandLineTools`
- ✅ **Node.js 20+** - Already installed and working
- ✅ **React Native 0.81.1** - Project configured

### iOS Project Structure (COMPLETE)
- ✅ **iOS folder exists** - `ios/` directory with project files
- ✅ **Xcode project** - `ios/OrokiiPayApp.xcodeproj` configured
- ✅ **Podfile** - CocoaPods configuration file ready
- ✅ **App files** - AppDelegate.swift, Info.plist, LaunchScreen, etc.
- ✅ **Assets catalog** - Images.xcassets for app icons

---

## ❌ What You Need to Install/Configure

### 1. Xcode (REQUIRED - HIGHEST PRIORITY)

**Status**: ❌ Not installed (only Command Line Tools present)

**Why Needed**:
- Required to build iOS apps
- Provides iOS simulators
- Required for code signing and App Store submission
- Cannot build without it

**Installation Steps**:
```bash
# Option A: Mac App Store (Recommended - Free)
1. Open Mac App Store
2. Search for "Xcode"
3. Click "Get" or "Install"
4. Wait 30-60 minutes (Xcode is ~15 GB)

# Option B: Direct Download
1. Go to https://developer.apple.com/xcode/
2. Download Xcode 15.x or later
3. Install the .xip file

# After installation, set Xcode as active developer directory:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept

# Verify installation:
xcodebuild -version
# Should show: Xcode 15.x
```

**Download Size**: ~15 GB
**Install Time**: 30-60 minutes
**Disk Space Required**: ~40 GB (including simulators)

---

### 2. CocoaPods (REQUIRED)

**Status**: ❌ Not installed

**Why Needed**:
- iOS dependency manager (like npm for iOS)
- Required to install React Native iOS dependencies
- Required before first iOS build

**Installation Steps**:
```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
# Should show version 1.15.0 or later

# Initialize CocoaPods in your project
cd ios
pod install

# This will:
# - Download all iOS dependencies
# - Create OrokiiPayApp.xcworkspace file
# - Configure project for React Native
```

**Install Time**: 5-10 minutes
**First Run**: 10-15 minutes (downloads dependencies)

---

### 3. iOS Dependencies Libraries (REQUIRED FOR UI)

**Status**: ❌ Not installed

**Why Needed**:
- Gradient backgrounds (CSS gradients don't work in React Native)
- Native blur effects (iOS advantage - beautiful glassmorphism!)
- Required by your UI design system

**Installation Steps**:
```bash
# 1. Install gradient library (CRITICAL - all screens use gradients)
npm install expo-linear-gradient

# 2. Install iOS native blur (OPTIONAL but highly recommended)
npm install @react-native-community/blur

# 3. Install iOS dependencies via CocoaPods
cd ios
pod install
cd ..

# Verify installation
cat package.json | grep -E "(expo-linear-gradient|blur)"
```

**Why Critical**: Your UI design system uses gradients extensively. Without this, all screens will fail to render.

---

### 4. Apple Developer Account (REQUIRED FOR DEVICES & APP STORE)

**Status**: ❓ Unknown

**Types**:

#### **FREE Account** (Sufficient for Development)
- ✅ Test on physical devices (iPhone/iPad)
- ✅ Use all iOS features
- ✅ Valid for 7 days (need to rebuild weekly)
- ❌ Cannot publish to App Store
- ❌ Cannot use TestFlight

**Setup**:
1. Go to Xcode → Preferences → Accounts
2. Click "+" → Add Apple ID
3. Sign in with your Apple ID (free)

#### **PAID Account** ($99/year - Required for Production)
- ✅ Everything in free account
- ✅ Publish to App Store
- ✅ TestFlight beta testing
- ✅ Push notifications
- ✅ In-app purchases
- ✅ No 7-day expiry

**Setup**:
1. Go to https://developer.apple.com/programs/
2. Enroll in Apple Developer Program ($99/year)
3. Wait 24-48 hours for approval
4. Add account to Xcode

**Recommendation for Now**: Start with FREE account, upgrade to PAID when ready for production.

---

### 5. Custom Fonts (REQUIRED IF USING CUSTOM FONTS)

**Status**: ❌ Not configured

**Why Needed**: Your UI design system specifies custom fonts

**Setup Steps**:
```bash
# 1. Check if you have custom font files
ls fonts/*.ttf fonts/*.otf 2>/dev/null

# If you have fonts, follow these steps:

# 2. Create fonts directory in iOS project
mkdir -p ios/OrokiiPayApp/Fonts

# 3. Copy font files
cp fonts/*.ttf ios/OrokiiPayApp/Fonts/ 2>/dev/null || echo "No TTF fonts"
cp fonts/*.otf ios/OrokiiPayApp/Fonts/ 2>/dev/null || echo "No OTF fonts"

# 4. Add to Xcode (MUST DO MANUALLY):
# - Open Xcode: open ios/OrokiiPayApp.xcworkspace
# - Right-click "OrokiiPayApp" folder → Add Files to "OrokiiPayApp"
# - Select all font files
# - ✅ Check "Copy items if needed"
# - ✅ Check "Add to targets: OrokiiPayApp"
# - Click "Add"

# 5. Update Info.plist (MUST DO MANUALLY):
# Open ios/OrokiiPayApp/Info.plist in Xcode
# Add this key-value pair:
# <key>UIAppFonts</key>
# <array>
#   <string>YourFont-Regular.ttf</string>
#   <string>YourFont-Bold.ttf</string>
#   <!-- Add all your font files -->
# </array>
```

**If You Don't Have Custom Fonts**: You can skip this and use system fonts (SF Pro on iOS)

---

### 6. iOS Permissions (REQUIRED FOR FEATURES)

**Status**: ⚠️ Needs configuration

**Why Needed**: iOS requires explicit permission declarations for:
- Camera (KYC document scanning)
- Photo Library (profile pictures)
- Face ID / Touch ID (biometric auth)
- Location (fraud detection)

**Configuration**:

Edit `ios/OrokiiPayApp/Info.plist` and add:

```xml
<!-- Camera Permission (for KYC) -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan your ID documents for verification</string>

<!-- Photo Library Permission -->
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to set your profile picture</string>

<!-- Face ID / Touch ID Permission -->
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID to securely authenticate your transactions</string>

<!-- Location Permission (optional, for fraud detection) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to enhance security and prevent fraud</string>
```

**Important**:
- Missing permissions will cause app rejection from App Store
- Add only permissions your app actually uses

---

## 📋 Complete Setup Checklist

### Phase 1: Install Required Software (Do First)

```bash
# 1. Install Xcode from Mac App Store
# - Download time: 30-60 minutes
# - Install time: 10-15 minutes
# ⏰ Total: ~1 hour

# 2. Accept Xcode license
sudo xcodebuild -license accept

# 3. Install CocoaPods
sudo gem install cocoapods
# ⏰ Time: 5 minutes

# 4. Install iOS libraries
npm install expo-linear-gradient
npm install @react-native-community/blur
# ⏰ Time: 2 minutes

# 5. Install iOS dependencies
cd ios && pod install && cd ..
# ⏰ First time: 10-15 minutes
```

**Total Phase 1 Time**: ~1.5 hours (mostly Xcode download)

---

### Phase 2: Configure Project

```bash
# 1. Open Xcode workspace (NOT .xcodeproj!)
open ios/OrokiiPayApp.xcworkspace

# 2. In Xcode, configure signing:
# - Select "OrokiiPayApp" project
# - Select "OrokiiPayApp" target
# - Go to "Signing & Capabilities" tab
# - ✅ Enable "Automatically manage signing"
# - Select your Team (Apple ID)

# 3. Add fonts (if you have custom fonts):
# - Right-click "OrokiiPayApp" → Add Files
# - Select font files from ios/OrokiiPayApp/Fonts
# - ✅ Check "Copy items if needed"
# - ✅ Check target "OrokiiPayApp"

# 4. Update Info.plist:
# - Open Info.plist in Xcode
# - Add UIAppFonts array (if using custom fonts)
# - Add permission keys listed above

# 5. Select a simulator:
# - At top of Xcode: Product → Destination
# - Select "iPhone 15 Pro" (or any simulator)
```

**Total Phase 2 Time**: 15-20 minutes

---

### Phase 3: First Build & Test

```bash
# Option A: Build from Xcode (Recommended for first build)
# - In Xcode, click the Play ▶ button
# - Or press Cmd + R
# - Wait 3-5 minutes for first build

# Option B: Build from terminal
npx react-native run-ios

# Select specific simulator:
npx react-native run-ios --simulator="iPhone 15 Pro"
```

**First Build Time**: 5-8 minutes
**Subsequent Builds**: 1-2 minutes

---

## 🎯 Priority Order (Do in This Sequence)

### CRITICAL (Must Do First)
1. ✅ Install Xcode (~1 hour)
2. ✅ Install CocoaPods (5 minutes)
3. ✅ Install gradient library (2 minutes)
4. ✅ Run `pod install` (10-15 minutes first time)

### HIGH PRIORITY (Do Next)
5. ✅ Configure signing in Xcode (5 minutes)
6. ✅ Add iOS permissions to Info.plist (5 minutes)
7. ✅ First build test (5-8 minutes)

### MEDIUM PRIORITY (Before Production)
8. ⚠️ Install blur library (for better UI)
9. ⚠️ Configure custom fonts (if applicable)
10. ⚠️ Test on physical device

### LOW PRIORITY (When Ready for App Store)
11. 📱 Enroll in Apple Developer Program ($99/year)
12. 📱 Configure App Store assets
13. 📱 Create TestFlight build
14. 📱 Submit for App Store review

---

## 🚀 Quick Start Commands (After Xcode Installed)

```bash
# Complete setup in one go:
npm install expo-linear-gradient @react-native-community/blur
cd ios && pod install && cd ..
open ios/OrokiiPayApp.xcworkspace

# Then in Xcode:
# 1. Configure signing (select your Apple ID)
# 2. Select iPhone 15 Pro simulator
# 3. Click Play ▶ button

# Or from terminal:
npx react-native run-ios --simulator="iPhone 15 Pro"
```

---

## ⚠️ Common Pitfalls to Avoid

### 1. ❌ Opening .xcodeproj Instead of .xcworkspace

**Wrong**:
```bash
open ios/OrokiiPayApp.xcodeproj  # ❌ DON'T DO THIS
```

**Correct**:
```bash
open ios/OrokiiPayApp.xcworkspace  # ✅ ALWAYS USE THIS
```

**Why**: After running `pod install`, you MUST use the `.xcworkspace` file. The `.xcodeproj` file won't include CocoaPods dependencies.

---

### 2. ❌ Not Running `pod install` After Installing Libraries

**Problem**: Installing npm packages is not enough for iOS

**Solution**:
```bash
# After EVERY npm install of a React Native library:
npm install some-library
cd ios && pod install && cd ..  # ALWAYS DO THIS
```

---

### 3. ❌ Forgetting to Add Permissions

**Problem**: App crashes when accessing camera/photos/etc.

**Solution**: Add ALL required permissions to Info.plist BEFORE testing those features

---

### 4. ❌ Not Accepting Xcode License

**Error**: `Agreeing to the Xcode/iOS license requires admin privileges`

**Solution**:
```bash
sudo xcodebuild -license accept
```

---

## 📊 Comparison: What You Need vs Android

| Requirement | Android | iOS | Status |
|-------------|---------|-----|--------|
| **Operating System** | Any OS | macOS only | ✅ Have Mac |
| **IDE** | Android Studio (optional) | Xcode (required) | ❌ Need Xcode |
| **Build Tool** | Gradle (included) | Xcode + CocoaPods | ❌ Need both |
| **Dependency Manager** | Gradle (included) | CocoaPods (install) | ❌ Need install |
| **Developer Account** | $25 one-time | $99/year | ⚠️ Free for dev |
| **Gradient Library** | Need install | Need install | ❌ Need install |
| **Blur Effects** | Not available | Native support! | ❌ Need install |
| **Build Time** | Faster (Gradle) | Slower (first time) | N/A |
| **App Size** | ~50 MB target | ~60 MB target | N/A |

---

## 💰 Cost Breakdown

### Required Costs
- ✅ **macOS Computer**: $0 (you have it)
- ✅ **Xcode**: $0 (free from App Store)
- ✅ **CocoaPods**: $0 (free)
- ✅ **Development on Simulator**: $0 (free)
- ✅ **Testing on Physical Device**: $0 (free with Apple ID)

### Optional Costs (Production Only)
- 💵 **Apple Developer Program**: $99/year (only if publishing to App Store)
- 💵 **Code Signing Certificate**: Included in $99/year
- 💵 **TestFlight**: Included in $99/year

**Total to Get Started**: $0
**Total for Production**: $99/year (one-time decision)

---

## ⏱️ Time Investment

### Initial Setup (One Time)
- Xcode download: 30-60 minutes
- Xcode installation: 10-15 minutes
- CocoaPods setup: 15-20 minutes
- First build: 5-8 minutes
- **Total**: ~2-3 hours (mostly waiting for Xcode)

### Regular Development (Daily)
- Build time: 1-2 minutes
- Testing on simulator: Instant
- Hot reload: Instant (with Metro)
- **Total**: Fast and smooth!

---

## 📝 Next Steps

### Immediate (Do Today)
1. ✅ Install Xcode from Mac App Store (start download now - it's big!)
2. ✅ While Xcode downloads, read the iOS Development Guide
3. ✅ After Xcode installs, run the setup commands above

### This Week
4. ✅ Build app on iOS simulator
5. ✅ Test all features on simulator
6. ✅ Fix any iOS-specific UI issues
7. ✅ Test on physical iPhone (if you have one)

### Before Production
8. 📱 Decide: App Store submission or not?
9. 📱 If yes: Enroll in Apple Developer Program
10. 📱 Create App Store assets (icon, screenshots)
11. 📱 TestFlight beta testing
12. 📱 App Store submission

---

## 🆘 Need Help?

### Resources
- **Official Guide**: [iOS Development Guide](./IOS_DEVELOPMENT_GUIDE.md)
- **Xcode Help**: https://developer.apple.com/xcode/
- **CocoaPods**: https://cocoapods.org/
- **React Native iOS**: https://reactnative.dev/docs/environment-setup

### Common Issues
- **Xcode won't install**: Check disk space (need 40 GB free)
- **Pod install fails**: Run `pod repo update` then try again
- **Build fails**: Clean build folder (Cmd + Shift + K in Xcode)
- **Simulator not showing**: Restart Xcode

---

## ✅ Verification Checklist

Run these commands to verify your setup:

```bash
# 1. Verify Xcode
xcodebuild -version
# Should show: Xcode 15.x

# 2. Verify CocoaPods
pod --version
# Should show: 1.15.x

# 3. Verify workspace exists
ls ios/*.xcworkspace
# Should show: OrokiiPayApp.xcworkspace

# 4. Verify libraries installed
grep -E "(expo-linear-gradient|blur)" package.json
# Should show both libraries

# 5. Verify simulators available
xcrun simctl list devices available | grep "iPhone"
# Should show list of iPhone simulators
```

**If all 5 checks pass**: You're ready to build! 🎉

---

## 🎯 Summary

### ✅ What Works Now
- macOS system compatible
- iOS project structure ready
- React Native configured

### ❌ What You Need
1. Install Xcode (~1 hour)
2. Install CocoaPods (5 min)
3. Install gradient/blur libraries (2 min)
4. Run pod install (15 min first time)
5. Configure signing in Xcode (5 min)

### ⏱️ Total Setup Time
- Active work: 30-40 minutes
- Download/install wait: 1-2 hours
- **Total**: 2-3 hours

### 💵 Cost to Start
- **$0** for development and testing
- **$99/year** only if publishing to App Store

---

**Ready to Start?** Begin with Step 1: Install Xcode from Mac App Store!

---

*Last Updated: October 12, 2025*
*See also: [iOS Development Guide](./IOS_DEVELOPMENT_GUIDE.md)*
