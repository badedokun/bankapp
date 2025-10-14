# iOS Setup Instructions - Quick Start

> **⚠️ IMPORTANT**: Xcode must be installed manually from Mac App Store first!

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Xcode from Mac App Store (MANUAL - ~1-2 hours)

**You must do this manually:**

1. Open **Mac App Store** app
2. Search for **"Xcode"**
3. Click **"Get"** or **"Install"**
4. Wait for download and installation (~15 GB, 30-60 minutes)

**⏱️ Time**: 1-2 hours (mostly download)
**💰 Cost**: FREE

---

### Step 2: Run the Automated Setup Script (~15-20 minutes)

After Xcode installation completes, run our automated script:

```bash
# Run the setup script
bash scripts/setup-ios-development.sh
```

**This script will automatically:**
- ✅ Verify Xcode installation
- ✅ Accept Xcode license
- ✅ Set Xcode as active developer directory
- ✅ Install CocoaPods
- ✅ Run `pod install` to setup iOS dependencies
- ✅ Create `OrokiiPayApp.xcworkspace`
- ✅ Verify all installations

**⏱️ Time**: 15-20 minutes
**💰 Cost**: FREE

---

### Step 3: Build and Run (~5-8 minutes first time)

#### Option A: Build from Terminal (Recommended)

```bash
# Build and run on iPhone 15 Pro simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

#### Option B: Build from Xcode

```bash
# Open Xcode workspace
open ios/OrokiiPayApp.xcworkspace

# In Xcode:
# 1. Select "OrokiiPayApp" scheme
# 2. Select "iPhone 15 Pro" simulator
# 3. Click Play ▶ button (or press Cmd+R)
```

**⏱️ First Build**: 5-8 minutes
**⏱️ Subsequent Builds**: 1-2 minutes
**💰 Cost**: FREE

---

## 📊 Total Time & Cost

| Task | Time | Cost | Manual? |
|------|------|------|---------|
| Install Xcode | 1-2 hours | $0 | ✅ Yes (Mac App Store) |
| Run setup script | 15-20 minutes | $0 | ❌ No (automated) |
| First build | 5-8 minutes | $0 | ❌ No (automated) |
| **TOTAL** | **2-3 hours** | **$0** | - |

---

## 🆘 Troubleshooting

### Issue: Script fails with "Xcode not installed"
**Solution**: Install Xcode from Mac App Store first (Step 1)

### Issue: "sudo: a password is required"
**Solution**: The script will prompt for your Mac password. This is normal and required for:
- Accepting Xcode license
- Installing CocoaPods
- Setting Xcode developer directory

### Issue: "pod install" takes forever
**Solution**: First run can take 10-15 minutes as it downloads all iOS dependencies. Be patient!

### Issue: "Unable to find simulator"
**Solution**: List available simulators:
```bash
xcrun simctl list devices available | grep iPhone
```

Then use one of the listed names:
```bash
npx react-native run-ios --simulator="iPhone 14"
```

---

## ✅ Verification

After setup, verify everything is working:

```bash
# 1. Xcode installed
xcodebuild -version
# Should show: Xcode 15.x or later

# 2. CocoaPods installed
pod --version
# Should show: 1.15.x or later

# 3. Workspace created
ls ios/*.xcworkspace
# Should show: OrokiiPayApp.xcworkspace

# 4. Libraries installed
grep -E "(expo-linear-gradient|blur)" package.json
# Should show both libraries

# 5. Simulators available
xcrun simctl list devices available | grep "iPhone"
# Should show list of iPhone simulators
```

---

## 📱 Testing Options

| Option | Cost | Setup Time | Best For |
|--------|------|------------|----------|
| **iOS Simulator** | FREE | 0 minutes | Development (RECOMMENDED) |
| **Physical Device (Free Account)** | FREE | 5 minutes | Quick device test (7-day expiry) |
| **Physical Device (Paid Account)** | $99/year | 5 minutes | Extended testing |
| **TestFlight** | $99/year | 30 minutes | Beta testing |
| **App Store** | $99/year | 1-2 days | Production |

**Recommendation**: Start with iOS Simulator (FREE, instant, no device needed)

---

## 🎯 Current Status

Based on your system scan:
- ✅ macOS 15.6.1 (Sequoia) - Compatible
- ✅ Command Line Tools - Installed
- ✅ Node.js 20+ - Installed
- ✅ React Native 0.81.1 - Configured
- ✅ iOS project structure - Complete
- ✅ Mobile UI libraries - Installed
  - `expo-linear-gradient@15.0.7`
  - `@react-native-community/blur@4.4.1`
- ❌ **Xcode** - NOT installed (REQUIRED)
- ❌ **CocoaPods** - NOT installed (will be installed by script)

---

## 📞 Need More Help?

Detailed documentation available:
- `docs/IOS_DEVELOPMENT_GUIDE.md` - Complete iOS development guide
- `docs/IOS_BUILD_REQUIREMENTS_CHECKLIST.md` - Requirements checklist
- `docs/IOS_SETUP_NEXT_STEPS.md` - Detailed step-by-step guide
- `docs/ANDROID_UI_SYSTEM_COMPATIBILITY_ANALYSIS.md` - Mobile UI patterns

---

## 🚀 Ready to Start?

1. **Open Mac App Store** and install Xcode
2. While waiting, grab a coffee ☕ (1-2 hours)
3. After Xcode installs, run: `bash scripts/setup-ios-development.sh`
4. Then build: `npx react-native run-ios`

**That's it!** 🎉

---

*For questions or issues, refer to the detailed documentation in the `docs/` folder.*
