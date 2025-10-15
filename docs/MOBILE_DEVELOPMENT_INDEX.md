# 📱 Mobile Development - Complete Guide Index

**Last Updated**: October 15, 2025
**React Native Version**: 0.81.1
**Supported Platforms**: Web, iOS (13.0+), Android (API 34+)

---

## 📚 Document Overview

This index organizes all mobile development documentation for the OrokiiPay Banking Platform. Each guide serves a specific purpose and should be consulted in the order shown based on your development needs.

---

## 🗺️ Quick Navigation

### **For New Developers**
1. Start with [Cross-Platform Development Guide](#1-cross-platform-development-guide)
2. Read platform-specific guide for your target:
   - Building for Android? → [Android Guide](#2-android-development-guide)
   - Building for iOS? → [iOS Guide](#3-ios-development-guide)
3. Review [Design System Documentation](#related-documentation)

### **For Experienced Developers**
- **Adding a new feature?** → [Cross-Platform Guide](#1-cross-platform-development-guide)
- **Platform-specific bug?** → [Android](#2-android-development-guide) or [iOS Guide](#3-ios-development-guide)
- **Build/deployment issue?** → Platform-specific guides
- **Design system question?** → [Design System Docs](#related-documentation)

---

## 📖 Guide Summaries

### 1. Cross-Platform Development Guide
**📄 File**: [`CROSS_PLATFORM_DEVELOPMENT_GUIDE.md`](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md)

**Purpose**: Prevent web/mobile code conflicts and maintain shared business logic

**When to Use**:
- ✅ Before adding any new feature or screen
- ✅ When you need platform-specific implementations
- ✅ To understand file naming conventions (.web.tsx / .native.tsx)
- ✅ When reviewing pull requests
- ✅ To create abstraction components

**Key Topics**:
- Platform-specific file strategy
- Abstraction patterns (GradientView, ShadowCard, GlassCard)
- Separation of UI vs business logic
- Design system compliance across platforms
- Code review checklist
- Common pitfalls and solutions
- The 10 Commandments of cross-platform development

**Critical for**:
- Preventing web builds from breaking when mobile changes are made
- Preventing mobile builds from breaking when web changes are made
- Maintaining code quality across platforms

---

### 2. Android Development Guide
**📄 File**: [`ANDROID_DEVELOPMENT_GUIDE.md`](./ANDROID_DEVELOPMENT_GUIDE.md)

**Purpose**: Android-specific setup, patterns, and build processes

**When to Use**:
- ✅ Setting up Android development environment
- ✅ Building Android APKs (debug/release)
- ✅ Fixing Android-specific UI issues (StatusBar overlap)
- ✅ Troubleshooting Gradle build errors
- ✅ Configuring Android permissions
- ✅ Testing on Android devices/emulators

**Key Topics**:
- Environment setup (JDK, Android SDK, Gradle)
- **Critical Pattern**: StatusBar overlap fix (MUST apply to all screens)
- Building APKs (development and production)
- Multi-tenant builds for Android
- Common Gradle errors and solutions
- Android-specific testing checklist
- Performance optimization for Android

**Android-Specific Patterns**:
```typescript
// StatusBar overlap fix (Android only)
paddingTop: Platform.select({
  android: (StatusBar.currentHeight || 0) + 12,
  ios: 44,
  web: 0,
})
```

**Build Commands**:
```bash
cd android
./gradlew clean
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Production APK
```

---

### 3. iOS Development Guide
**📄 File**: [`IOS_DEVELOPMENT_GUIDE.md`](./IOS_DEVELOPMENT_GUIDE.md)

**Purpose**: iOS-specific setup, patterns, and build processes

**When to Use**:
- ✅ Setting up iOS development environment (macOS required)
- ✅ Building iOS apps (Simulator and TestFlight)
- ✅ Fixing iOS-specific UI issues (Safe Area, notch handling)
- ✅ Configuring Xcode and CocoaPods
- ✅ App Store submission preparation
- ✅ Testing on iOS devices/simulators

**Key Topics**:
- Environment setup (Xcode, CocoaPods)
- **Critical Pattern**: Safe Area handling for notch/Dynamic Island
- Native blur effects (iOS advantage over Android!)
- Building for iOS Simulator and physical devices
- TestFlight and App Store submission
- iOS permissions (Face ID, Camera, Location)
- Custom fonts configuration
- Haptic feedback implementation

**iOS-Specific Patterns**:
```typescript
// Safe Area handling (iOS)
<SafeAreaView style={styles.container}>
  {/* Content automatically handles notch/island */}
</SafeAreaView>

// Native blur (iOS advantage!)
<BlurView blurType="light" blurAmount={10}>
  {/* Beautiful glassmorphism */}
</BlurView>
```

**Build Commands**:
```bash
cd ios
pod install                     # Install dependencies
open OrokiiPayApp.xcworkspace   # Open in Xcode
npx react-native run-ios        # Run in simulator
```

---

## 🔄 How These Guides Work Together

### **Scenario 1: Adding a New Screen**

1. **Read Cross-Platform Guide** → Understand separation strategy
2. **Create platform-agnostic business logic**:
   ```typescript
   // useDashboardLogic.ts
   export const useDashboardLogic = () => {
     // Shared logic for all platforms
   }
   ```
3. **Create platform-specific UI** (if needed):
   ```
   DashboardScreen.web.tsx      # Web UI
   DashboardScreen.native.tsx   # Mobile UI
   ```
4. **Follow platform-specific patterns**:
   - Android: Apply StatusBar padding ([Android Guide](#2-android-development-guide))
   - iOS: Use SafeAreaView ([iOS Guide](#3-ios-development-guide))
5. **Test on both platforms**:
   ```bash
   npm run web      # Test web
   npm run android  # Test Android
   npm run ios      # Test iOS
   ```

---

### **Scenario 2: Fixing a Platform-Specific Bug**

#### **Android Bug**
1. Consult [Android Development Guide](#2-android-development-guide)
2. Check "Common Issues & Solutions" section
3. Apply Android-specific fix
4. Verify fix doesn't break web ([Cross-Platform Guide](#1-cross-platform-development-guide))

#### **iOS Bug**
1. Consult [iOS Development Guide](#3-ios-development-guide)
2. Check "Common Issues & Solutions" section
3. Apply iOS-specific fix
4. Verify fix doesn't break web ([Cross-Platform Guide](#1-cross-platform-development-guide))

#### **Web Bug**
1. Fix web code
2. Verify fix doesn't break mobile ([Cross-Platform Guide](#1-cross-platform-development-guide))
3. Test on Android and iOS

---

### **Scenario 3: Implementing Design System Component**

1. **Review Design System Requirements** ([World-Class UI Design System](../WORLD_CLASS_UI_DESIGN_SYSTEM.md))
2. **Check Cross-Platform Guide** for abstraction patterns
3. **Create abstraction component**:
   ```typescript
   // GradientView.tsx (interface)
   // GradientView.web.tsx (CSS gradients)
   // GradientView.native.tsx (LinearGradient)
   ```
4. **Follow platform-specific implementations**:
   - Web: CSS `backgroundImage: linear-gradient(...)`
   - Android/iOS: `react-native-linear-gradient`
5. **Test across all platforms**

---

## 📋 Development Workflow Checklist

### **Before Starting Development**

- [ ] Read [Cross-Platform Development Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md)
- [ ] Understand platform-specific file strategy
- [ ] Review [World-Class UI Design System](../WORLD_CLASS_UI_DESIGN_SYSTEM.md)
- [ ] Set up development environment:
  - [ ] Android: [Android Guide - Prerequisites](./ANDROID_DEVELOPMENT_GUIDE.md#prerequisites--environment-setup)
  - [ ] iOS: [iOS Guide - Prerequisites](./IOS_DEVELOPMENT_GUIDE.md#prerequisites--environment-setup)

### **During Development**

- [ ] Use platform-specific files (.web.tsx / .native.tsx) for UI differences
- [ ] Extract shared logic to separate hooks/services
- [ ] Use abstraction components (GradientView, ShadowCard, GlassCard)
- [ ] Follow design system (no hardcoded colors!)
- [ ] Apply platform-specific patterns:
  - [ ] Android: StatusBar padding
  - [ ] iOS: SafeAreaView
  - [ ] Web: CSS features

### **Before Committing**

- [ ] Run cross-platform build validation:
  ```bash
  npm run build:web      # Web build succeeds
  cd android && ./gradlew assembleDebug  # Android builds
  cd ios && pod install && npx react-native run-ios  # iOS builds
  ```
- [ ] Code review checklist ([Cross-Platform Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#code-review-checklist))
- [ ] No hardcoded colors or tenant IDs
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes

---

## 🚨 Common Issues - Quick Reference

### **Issue: "Web build broke after mobile changes"**
→ **Solution**: [Cross-Platform Guide - Pitfall 1](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#common-pitfalls)

### **Issue: "StatusBar overlapping header on Android"**
→ **Solution**: [Android Guide - StatusBar Pattern](./ANDROID_DEVELOPMENT_GUIDE.md#1-status-bar-overlap-fix-pattern)

### **Issue: "Notch/Dynamic Island not handled on iOS"**
→ **Solution**: [iOS Guide - Safe Area Handling](./IOS_DEVELOPMENT_GUIDE.md#1-safe-area-handling-ios-equivalent-of-android-statusbar)

### **Issue: "Gradients not showing on mobile"**
→ **Solution**: [Cross-Platform Guide - Gradient Abstraction](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#pattern-1-gradient-abstraction)

### **Issue: "Blur effects not working"**
→ **Solution**:
- iOS: [iOS Guide - Glassmorphism](./IOS_DEVELOPMENT_GUIDE.md#3-glassmorphism--blur-effects-better-ios-support)
- Android: Use fallback ([Cross-Platform Guide - GlassCard](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#pattern-3-glassmorphism-abstraction))

### **Issue: "Build failing with Gradle errors"**
→ **Solution**: [Android Guide - Common Issues](./ANDROID_DEVELOPMENT_GUIDE.md#common-issues--solutions)

### **Issue: "CocoaPods install failing"**
→ **Solution**: [iOS Guide - Pod Install Fails](./IOS_DEVELOPMENT_GUIDE.md#issue-1-pod-install-fails)

---

## 🎯 Platform Comparison Matrix

| Feature | Web | Android | iOS | Implementation |
|---------|-----|---------|-----|----------------|
| **CSS Gradients** | ✅ Native | ❌ Requires library | ❌ Requires library | [Cross-Platform Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#pattern-1-gradient-abstraction) |
| **Box Shadow** | ✅ Native | ❌ Use shadowColor props | ❌ Use shadowColor props | [Cross-Platform Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md#pattern-2-shadow-abstraction) |
| **Blur Effects** | ✅ `backdropFilter` | ❌ Limited support | ✅ Native `BlurView` | [iOS Guide](./IOS_DEVELOPMENT_GUIDE.md#3-glassmorphism--blur-effects-better-ios-support) |
| **StatusBar** | ❌ N/A | ✅ Requires padding | ✅ Auto with SafeArea | [Android](./ANDROID_DEVELOPMENT_GUIDE.md#1-status-bar-overlap-fix-pattern) / [iOS](./IOS_DEVELOPMENT_GUIDE.md#1-safe-area-handling-ios-equivalent-of-android-statusbar) |
| **Haptic Feedback** | ❌ Not available | ✅ `expo-haptics` | ✅ `expo-haptics` | [iOS Guide](./IOS_DEVELOPMENT_GUIDE.md#haptic-feedback) |
| **Custom Fonts** | ✅ Web fonts | ⚠️ Requires setup | ⚠️ Requires setup | [iOS Guide](./IOS_DEVELOPMENT_GUIDE.md#4-custom-fonts) |

---

## 📚 Related Documentation

### **Design System Documentation**
- [World-Class UI Design System](../WORLD_CLASS_UI_DESIGN_SYSTEM.md) - Comprehensive design principles
- [Modern UI Design System](../MODERN_UI_DESIGN_SYSTEM.md) - Component library and patterns

### **Build & Deployment**
- [Deployment Guide](./DEPLOYMENT_GUIDE_2025_10_10_WORKING.md) - Web deployment
- [Local Testing Guide](./LOCAL_TESTING_GUIDE.md) - Testing strategies

### **Architecture**
- [Development Guide](./DEVELOPMENT_GUIDE.md) - Overall project architecture
- [Database Architecture](./DATABASE_ARCHITECTURE_QUICK_REFERENCE.md) - Database structure

---

## 🔧 Setup Quick Links

### **Android Setup**
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verify setup
adb version
cd android && ./gradlew --version
```
**Full guide**: [Android Development Guide - Prerequisites](./ANDROID_DEVELOPMENT_GUIDE.md#prerequisites--environment-setup)

### **iOS Setup**
```bash
# Install Xcode (from Mac App Store)
# Install CocoaPods
sudo gem install cocoapods

# Setup project
cd ios
pod install
open OrokiiPayApp.xcworkspace
```
**Full guide**: [iOS Development Guide - Prerequisites](./IOS_DEVELOPMENT_GUIDE.md#prerequisites--environment-setup)

---

## 🎓 Learning Path

### **Week 1: Foundation**
1. Day 1-2: Read [Cross-Platform Development Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md)
2. Day 3-4: Set up environment ([Android](#android-setup) + [iOS](#ios-setup))
3. Day 5: Review [World-Class UI Design System](../WORLD_CLASS_UI_DESIGN_SYSTEM.md)

### **Week 2: Platform-Specific**
1. Day 1-3: Deep dive into [Android Development Guide](./ANDROID_DEVELOPMENT_GUIDE.md)
2. Day 4-5: Deep dive into [iOS Development Guide](./IOS_DEVELOPMENT_GUIDE.md)

### **Week 3: Practice**
1. Build a simple screen following all patterns
2. Test on all three platforms
3. Submit PR following code review checklist

---

## ✅ Pull Request Checklist

Before submitting any mobile PR:

- [ ] Reviewed [Cross-Platform Development Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md)
- [ ] Platform-specific code in separate files (.web.tsx / .native.tsx)
- [ ] Shared business logic extracted to hooks/services
- [ ] Design system compliant (no hardcoded colors)
- [ ] Platform-specific patterns applied:
  - [ ] Android: StatusBar padding
  - [ ] iOS: SafeAreaView
- [ ] Builds successfully:
  - [ ] `npm run build:web` ✅
  - [ ] `cd android && ./gradlew assembleDebug` ✅
  - [ ] `npx react-native run-ios` ✅
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tests pass (if applicable)

---

## 🆘 Getting Help

1. **Search this index** for your issue/topic
2. **Check the appropriate guide**:
   - Cross-platform question → [Cross-Platform Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md)
   - Android issue → [Android Guide](./ANDROID_DEVELOPMENT_GUIDE.md)
   - iOS issue → [iOS Guide](./IOS_DEVELOPMENT_GUIDE.md)
3. **Review common issues** in each guide
4. **Check related documentation** (Design System, Deployment)
5. **Still stuck?** Create an issue with:
   - Which platform(s) affected
   - Steps to reproduce
   - Relevant code snippets
   - Error messages/logs

---

## 📝 Document Maintenance

**Maintained by**: OrokiiPay Development Team
**Last Reviewed**: October 15, 2025
**Review Frequency**: Monthly or after major React Native version updates

### **When to Update**
- React Native version upgrade
- Major dependency changes
- New platform-specific patterns discovered
- Design system updates
- Build process changes

---

## 🚀 Quick Start Commands

```bash
# Web Development
npm run web

# Android Development
npm run android
# Or build APK
cd android && ./gradlew assembleDebug

# iOS Development
npm run ios
# Or open in Xcode
cd ios && open OrokiiPayApp.xcworkspace

# Clean everything
npm run clean
cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods && pod install && cd ..
```

---

**Remember**: When in doubt, check the [Cross-Platform Development Guide](./CROSS_PLATFORM_DEVELOPMENT_GUIDE.md) first!
