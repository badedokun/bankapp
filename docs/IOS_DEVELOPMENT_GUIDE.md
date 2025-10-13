# iOS Development Guide

> **Last Updated**: October 12, 2025
> **React Native Version**: 0.81.1
> **Target iOS Version**: iOS 13.0+

This guide provides essential patterns, best practices, and troubleshooting steps for developing and building iOS apps for the OrokiiPay Banking App as development progresses.

---

## Table of Contents

1. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
2. [Critical iOS Patterns](#critical-ios-patterns)
3. [Building iOS Apps](#building-ios-apps)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Testing Checklist](#testing-checklist)
6. [Multi-Tenancy Considerations](#multi-tenancy-considerations)
7. [Performance Optimization](#performance-optimization)
8. [App Store Preparation](#app-store-preparation)
9. [Troubleshooting Reference](#troubleshooting-reference)

---

## Prerequisites & Environment Setup

### Required Tools

```bash
# macOS (REQUIRED - iOS development only works on Mac)
macOS 12.0 (Monterey) or later

# Xcode (REQUIRED)
Xcode 14.0 or later (from Mac App Store)

# Command Line Tools
xcode-select --install

# CocoaPods (for iOS dependency management)
sudo gem install cocoapods

# Node.js
node >= 20

# Watchman (for file watching)
brew install watchman
```

### Verify Setup

```bash
# Check Xcode installation
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer

# Check CocoaPods
pod --version
# Should show version 1.11.0 or later

# Check iOS Simulators
xcrun simctl list devices available
# Should list available iOS simulators

# Check physical devices
xcrun xctrace list devices
# Lists connected iOS devices
```

### Initial iOS Project Setup

```bash
cd ios

# Install CocoaPods dependencies
pod install
# This creates OrokiiPayApp.xcworkspace

# IMPORTANT: Always open the .xcworkspace file, NOT .xcodeproj
open OrokiiPayApp.xcworkspace
```

---

## Critical iOS Patterns

### 1. Safe Area Handling (iOS Equivalent of Android StatusBar)

**Problem**: iOS devices have notches, Dynamic Island, and home indicators that need proper spacing.

**Solution**: Use `SafeAreaView` from React Native or handle safe areas manually.

#### Implementation Pattern

```typescript
import { SafeAreaView, Platform, View } from 'react-native';

// ✅ Recommended: Use SafeAreaView
<SafeAreaView style={styles.container}>
  <View style={styles.content}>
    {/* Your content here */}
  </View>
</SafeAreaView>

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    // Additional padding if needed
  }
});
```

#### Advanced: Manual Safe Area Control

For more granular control:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MyScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,        // Notch/Dynamic Island
      paddingBottom: insets.bottom,   // Home indicator
      paddingLeft: insets.left,       // Safe area edges
      paddingRight: insets.right,
    }}>
      {/* Content */}
    </View>
  );
};
```

#### StatusBar Configuration

```typescript
import { StatusBar } from 'react-native';

// For screens with dark backgrounds
<StatusBar
  barStyle="light-content"     // White status bar icons
  backgroundColor="transparent"
/>

// For screens with light backgrounds
<StatusBar
  barStyle="dark-content"      // Dark status bar icons
  backgroundColor="transparent"
/>
```

**Key Differences from Android**:
- ✅ No need for `StatusBar.currentHeight` (iOS handles this automatically)
- ✅ Use `SafeAreaView` or `useSafeAreaInsets` for proper spacing
- ✅ StatusBar styling is simpler on iOS

---

### 2. Gradient Backgrounds (Same Issue as Android)

**Problem**: CSS `linear-gradient()` doesn't work in React Native.

**Solution**: Use `react-native-linear-gradient` or `expo-linear-gradient`

#### Implementation

```typescript
import LinearGradient from 'react-native-linear-gradient';
// Or for Expo projects:
// import { LinearGradient } from 'expo-linear-gradient';

// ✅ iOS-compatible gradient
<LinearGradient
  colors={[theme.colors.primary, theme.colors.secondary]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.container}
>
  {children}
</LinearGradient>
```

**Installation**:
```bash
# For non-Expo projects
npm install react-native-linear-gradient
cd ios && pod install && cd ..

# For Expo projects
npm install expo-linear-gradient
```

---

### 3. Glassmorphism / Blur Effects (BETTER iOS SUPPORT)

**Great News**: iOS has native blur support through `BlurView`!

#### Implementation

```typescript
import { BlurView } from '@react-native-community/blur';

// ✅ iOS native blur (looks amazing!)
<BlurView
  style={styles.blurContainer}
  blurType="light"        // 'light', 'dark', 'xlight', 'prominent', 'regular'
  blurAmount={10}
  reducedTransparencyFallbackColor="white"
>
  {/* Glass card content */}
</BlurView>

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',  // Important for borderRadius to work
  }
});
```

**Installation**:
```bash
npm install @react-native-community/blur
cd ios && pod install && cd ..
```

**iOS Blur Types**:
- `light` - Light blur with semi-transparent white
- `dark` - Dark blur with semi-transparent black
- `xlight` - Extra light blur
- `prominent` - Adapts to system appearance
- `regular` - Standard blur

**Fallback for Cross-Platform**:
```typescript
// Universal glass effect component
const GlassCard = ({ children }) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView style={styles.glass} blurType="light" blurAmount={10}>
        {children}
      </BlurView>
    );
  }

  // Android/Web fallback
  return (
    <View style={[styles.glass, styles.glassFallback]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glass: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  glassFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  }
});
```

---

### 4. Custom Fonts

**Setup Required**: Add fonts to iOS project

#### Steps

1. **Add font files to iOS project**:
```bash
# Create fonts directory
mkdir -p ios/OrokiiPayApp/Fonts

# Copy font files
cp fonts/*.ttf ios/OrokiiPayApp/Fonts/
cp fonts/*.otf ios/OrokiiPayApp/Fonts/
```

2. **Add fonts to Xcode project**:
   - Open `ios/OrokiiPayApp.xcworkspace` in Xcode
   - Right-click on `OrokiiPayApp` folder
   - Select "Add Files to OrokiiPayApp"
   - Select your font files
   - ✅ Check "Copy items if needed"
   - ✅ Check "Add to targets: OrokiiPayApp"

3. **Update Info.plist**:
```xml
<!-- ios/OrokiiPayApp/Info.plist -->
<key>UIAppFonts</key>
<array>
  <string>YourFont-Regular.ttf</string>
  <string>YourFont-Bold.ttf</string>
  <string>YourFont-Italic.ttf</string>
  <!-- Add all your font files here -->
</array>
```

4. **Verify fonts are available**:
```typescript
// In your app
import { Text } from 'react-native';

<Text style={{ fontFamily: 'YourFont-Regular' }}>
  Test Text
</Text>

// To list all available fonts (development only):
import * as Font from 'expo-font';
console.log('Available fonts:', Font.isLoaded('YourFont-Regular'));
```

---

### 5. iOS Permissions

**Required for Banking App Features**:

#### Info.plist Permissions

```xml
<!-- ios/OrokiiPayApp/Info.plist -->

<!-- Camera (for document scanning, KYC) -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan your documents for verification</string>

<!-- Photo Library (for profile pictures) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to set your profile picture</string>

<!-- Face ID / Touch ID (for biometric authentication) -->
<key>NSFaceIDUsageDescription</key>
<string>We use Face ID to securely authenticate your transactions</string>

<!-- Location (if needed for fraud detection) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to enhance security and prevent fraud</string>

<!-- Contacts (if needed for transfer recipients) -->
<key>NSContactsUsageDescription</key>
<string>We need access to your contacts to help you send money to friends</string>

<!-- Notifications (for transaction alerts) -->
<key>NSUserNotificationAlertStyle</key>
<string>alert</string>
```

---

### 6. Navigation & Gestures

**iOS-Specific Navigation Patterns**:

#### Swipe Back Gesture

iOS users expect to swipe from the left edge to go back:

```typescript
// Enable swipe-back gesture (default in React Navigation)
<Stack.Navigator
  screenOptions={{
    gestureEnabled: true,           // Enable swipe back
    gestureDirection: 'horizontal', // Swipe direction
    headerShown: false,
  }}
>
  <Stack.Screen name="Screen1" component={Screen1} />
</Stack.Navigator>
```

#### Haptic Feedback

iOS has excellent haptic feedback:

```typescript
import * as Haptics from 'expo-haptics';

// Light impact (for selections)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (for notifications)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact (for important actions)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Warning notification
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

---

## Building iOS Apps

### Development Build (iOS Simulator)

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npx react-native run-ios

# Or specify simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# List available simulators
xcrun simctl list devices available
```

### Debug Build (Physical Device)

**Prerequisites**:
- Apple Developer account (free or paid)
- Device connected via USB or WiFi

**Steps**:

1. **Open Xcode workspace**:
```bash
cd ios
open OrokiiPayApp.xcworkspace
```

2. **Configure signing**:
   - Select `OrokiiPayApp` project in Xcode
   - Select `OrokiiPayApp` target
   - Go to "Signing & Capabilities" tab
   - Enable "Automatically manage signing"
   - Select your Team (Apple Developer account)

3. **Select device**:
   - At the top of Xcode, select your connected device from the dropdown

4. **Build and run**:
   - Click the Play (▶) button in Xcode
   - Or press `Cmd + R`

### Production Build (TestFlight / App Store)

#### Step 1: Configure App Information

**Update `Info.plist`**:
```xml
<key>CFBundleDisplayName</key>
<string>OrokiiPay</string>

<key>CFBundleIdentifier</key>
<string>com.orokiipay.banking</string>

<key>CFBundleVersion</key>
<string>1</string>

<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

#### Step 2: Create Archive

1. **Open Xcode**:
```bash
cd ios
open OrokiiPayApp.xcworkspace
```

2. **Select "Any iOS Device" or "Generic iOS Device"** from device dropdown

3. **Clean build folder**:
   - Menu: Product → Clean Build Folder (Shift + Cmd + K)

4. **Archive**:
   - Menu: Product → Archive (Cmd + Shift + B)
   - Wait for archive to complete (5-10 minutes)

5. **Organizer window opens**:
   - Select your archive
   - Click "Distribute App"
   - Select "App Store Connect"
   - Follow the wizard

#### Step 3: Upload to App Store Connect

- Choose upload method: "Upload" or "Export"
- For TestFlight: Select "Upload"
- Wait for processing (15-60 minutes)

#### Step 4: TestFlight Testing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to TestFlight tab
4. Add internal/external testers
5. Distribute build

---

## Common Issues & Solutions

### Issue 1: Pod Install Fails

**Error**: `Unable to find a specification for...`

**Solution**:
```bash
# Update CocoaPods repo
pod repo update

# Clean pods
cd ios
rm -rf Pods
rm Podfile.lock

# Reinstall
pod install --repo-update
```

### Issue 2: Build Fails with "Module not found"

**Error**: `Module 'SomeLibrary' not found`

**Solution**:
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean build
cd ios
xcodebuild clean

# Reinstall pods
pod deintegrate
pod install

# Rebuild
cd ..
npx react-native run-ios
```

### Issue 3: Signing Certificate Issues

**Error**: `No signing certificate found`

**Solution**:

1. Open Xcode
2. Go to Xcode → Preferences → Accounts
3. Add your Apple ID if not present
4. Select your account → Manage Certificates
5. Click "+" and add "Apple Development" certificate
6. In project settings, enable "Automatically manage signing"

### Issue 4: App Icon Not Showing

**Problem**: App shows default white icon

**Solution**:

1. Create app icon set (1024x1024 PNG)
2. Use [App Icon Generator](https://appicon.co/) to generate all sizes
3. In Xcode, select `Images.xcassets` → `AppIcon`
4. Drag generated icons to appropriate slots
5. Clean and rebuild

### Issue 5: Fonts Not Loading

**Problem**: Custom fonts show default font

**Solution**:

1. Verify font files are in Xcode project
2. Check Info.plist has `UIAppFonts` array with correct filenames
3. Verify exact font name:
```bash
# Use Font Book app on Mac
# Or use this command:
fc-scan --format "%{family}\n" YourFont.ttf
```

4. Use exact PostScript name in code:
```typescript
fontFamily: 'YourFontName-Bold'  // Not just 'YourFontName Bold'
```

### Issue 6: Simulator Not Loading

**Error**: Simulator hangs at black screen

**Solution**:
```bash
# Reset Metro cache
npx react-native start --reset-cache

# Delete and reinstall app on simulator
xcrun simctl uninstall booted com.yourapp.bundle

# Rebuild
npx react-native run-ios
```

### Issue 7: Real Device Build Fails

**Error**: `Could not launch "AppName"`

**Solution**:

1. Verify device is unlocked and trusted
2. Check iOS version compatibility (iOS 13.0+)
3. Ensure "Developer Mode" enabled on device:
   - Settings → Privacy & Security → Developer Mode → ON
4. Trust developer certificate:
   - Settings → General → VPN & Device Management
   - Trust your developer profile

---

## Testing Checklist

### Pre-Build Testing

- [ ] All screens use SafeAreaView or safe area insets
- [ ] StatusBar barStyle set appropriately (light/dark content)
- [ ] Gradient backgrounds use LinearGradient component
- [ ] Custom fonts configured in Xcode and Info.plist
- [ ] All animations use `useNativeDriver: true` where possible
- [ ] Required permissions added to Info.plist
- [ ] App icon and launch screen configured
- [ ] No console.log statements in production code
- [ ] Multi-tenancy verified (no hardcoded tenant IDs)

### During Build

- [ ] Clean build completed: `xcodebuild clean`
- [ ] No build errors or warnings
- [ ] CocoaPods dependencies installed correctly
- [ ] Signing configured properly
- [ ] Archive created successfully

### Post-Build Testing

#### Simulator Testing
- [ ] Install on multiple iPhone simulators (SE, 14, 15 Pro)
- [ ] Test on multiple iPad simulators
- [ ] Verify safe area handling on all device sizes
- [ ] Test notch/Dynamic Island devices (iPhone 14 Pro, 15 Pro)
- [ ] Verify landscape orientation (if supported)

#### Physical Device Testing
- [ ] Install on real iPhone/iPad
- [ ] Test on devices with notch (iPhone X and later)
- [ ] Test on devices without notch (iPhone SE)
- [ ] Verify Face ID/Touch ID authentication
- [ ] Test all permissions (camera, photos, location)
- [ ] Verify haptic feedback works
- [ ] Test with poor network connectivity
- [ ] Test with airplane mode
- [ ] Battery usage testing (leave app running 1 hour)

#### Functionality Testing
- [ ] Login flow works
- [ ] Dashboard loads correctly
- [ ] Transfer flows work end-to-end
- [ ] Transaction history displays
- [ ] Settings accessible
- [ ] Analytics/insights load
- [ ] Biometric authentication works
- [ ] Push notifications work (if implemented)

#### UI/UX Testing
- [ ] All gradients display correctly
- [ ] Blur effects work beautifully (iOS advantage!)
- [ ] Custom fonts render correctly
- [ ] Scrolling smooth on all screens
- [ ] Swipe-back gesture works
- [ ] Haptic feedback feels right
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Success confirmations work
- [ ] Safe area properly handled on all devices

#### Performance Testing
- [ ] App launches in < 3 seconds
- [ ] Screens transition smoothly (60 FPS)
- [ ] No memory leaks (test by navigating repeatedly)
- [ ] No frame drops during animations
- [ ] App size reasonable (target: < 60 MB)

---

## Multi-Tenancy Considerations

### Environment Variables

**Never hardcode tenant data**. Use environment variables or configuration:

```typescript
// ❌ Bad Practice
const tenantId = 'fmfb';
const apiUrl = 'https://api.fmfb.com';

// ✅ Good Practice
import Config from 'react-native-config';

const tenantId = Config.TENANT_ID;
const apiUrl = Config.API_URL;
```

### Tenant-Specific Builds

**Configure build schemes in Xcode**:

1. Duplicate "Release" scheme
2. Rename to "Release-FMFB"
3. Add custom build settings
4. Set environment variables

**Or use build configurations**:
```bash
# FMFB tenant
ENVFILE=.env.fmfb.production npx react-native run-ios --configuration Release

# OrokiiPay tenant
ENVFILE=.env.orokiipay.production npx react-native run-ios --configuration Release
```

---

## Performance Optimization

### 1. Optimize Images

```bash
# Use WebP format (supported on iOS)
# Or use PNG with proper compression

# Asset catalog optimizations
# Xcode automatically optimizes images in .xcassets
```

### 2. Enable Hermes JavaScript Engine

Hermes is faster and uses less memory:

**Already enabled by default in React Native 0.70+**

Verify in `ios/Podfile`:
```ruby
use_react_native!(
  :path => config[:reactNativePath],
  :hermes_enabled => true,  # Should be true
)
```

### 3. Optimize Animations

```typescript
// Always use native driver for transform and opacity
Animated.timing(animValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // Critical for performance
}).start();

// Never use native driver for layout properties
// (width, height, marginTop, etc.)
```

### 4. Lazy Loading

```typescript
// Lazy load heavy screens
const TransactionHistory = React.lazy(() => import('./TransactionHistory'));

<Suspense fallback={<LoadingSpinner />}>
  <TransactionHistory />
</Suspense>
```

### 5. Memory Management

```typescript
// Clean up listeners and timers
useEffect(() => {
  const subscription = someEventEmitter.addListener('event', handler);

  return () => {
    subscription.remove();  // Prevent memory leaks
  };
}, []);
```

---

## App Store Preparation

### Required Assets

#### App Icon
- **Size**: 1024x1024 pixels
- **Format**: PNG (no transparency)
- **Tools**: [App Icon Generator](https://appicon.co/)

#### Screenshots (Required Sizes)
- **6.7" Display** (iPhone 15 Pro Max): 1290 x 2796 pixels
- **6.5" Display** (iPhone 14 Plus): 1284 x 2778 pixels
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 pixels

#### App Preview Video (Optional but Recommended)
- **Duration**: 15-30 seconds
- **Format**: MOV or MP4
- **Orientation**: Portrait or Landscape

### App Store Listing

**App Name**: OrokiiPay - Smart Banking

**Subtitle**: Fast, secure, rewarding banking

**Description**:
```
Transform your banking experience with OrokiiPay - the smart, secure, and rewarding way to manage your money.

KEY FEATURES:
💸 Instant Transfers - Send money to any bank account in seconds
💰 Smart Savings - Automated savings goals with rewards
📊 Insights - AI-powered spending analytics
🎁 Rewards - Earn points for every transaction
🔐 Secure - Bank-level encryption and biometric authentication
📱 Beautiful Design - Modern, intuitive interface

WHY CHOOSE OROKIIPAY?
✨ No hidden fees - transparent pricing
⚡ Lightning fast - transfers complete in seconds
🎯 Personalized - AI learns your spending habits
🏆 Rewarding - earn points redeemable for cashback
🛡️ Secure - military-grade encryption

LICENSED & REGULATED
OrokiiPay is fully licensed and regulated by the Central Bank of Nigeria.

Download now and experience the future of banking!
```

**Keywords**: banking, money transfer, savings, mobile banking, digital wallet, fintech, payments, cashback, rewards

**Category**: Finance

**Age Rating**: 4+

**Privacy Policy URL**: Required

**Support URL**: Required

---

## Troubleshooting Reference

### Debug Commands

```bash
# View iOS device logs
idevicesyslog

# Or use Console app on Mac
# Connect device → Select device → Start streaming

# View simulator logs
xcrun simctl spawn booted log stream --level debug

# Check React Native logs
npx react-native log-ios

# Clear Metro cache
npx react-native start --reset-cache

# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Reset simulator
xcrun simctl erase all
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Command PhaseScriptExecution failed` | Build script error | Check pod install, clean build |
| `Undefined symbols for architecture` | Missing library | Check Podfile, reinstall pods |
| `No such module 'ModuleName'` | Import error | Clean derived data, rebuild |
| `Could not find iPhone` | Device not detected | Check USB cable, trust device |
| `Code signing error` | Certificate issue | Fix in Xcode signing settings |
| `Duplicate symbols` | Duplicate libraries | Check Podfile for conflicts |

### Performance Monitoring

```bash
# Monitor memory usage
xcrun xctrace list devices
xcrun xctrace record --template 'Time Profiler' --device <device-id>

# Check app size
ls -lh ios/build/Build/Products/Release-iphoneos/OrokiiPayApp.app

# Analyze bundle
npx react-native-bundle-visualizer
```

---

## Quick Reference: New Screen Checklist

When adding a new screen:

1. **Add Safe Area Handling**
   ```typescript
   <SafeAreaView style={styles.container}>
   ```

2. **Configure StatusBar**
   ```typescript
   <StatusBar barStyle="light-content" backgroundColor="transparent" />
   ```

3. **Use LinearGradient for Backgrounds**
   ```typescript
   <LinearGradient colors={[theme.primary, theme.secondary]}>
   ```

4. **Use BlurView for Glass Effects** (iOS advantage!)
   ```typescript
   <BlurView blurType="light" blurAmount={10}>
   ```

5. **Avoid Hardcoding**
   - No hardcoded colors (use `theme.colors.*`)
   - No hardcoded tenant IDs (use `Config.TENANT_ID`)
   - No hardcoded API URLs (use `Config.API_URL`)

6. **Test on iOS**
   - Build and test on simulator
   - Test on physical device
   - Verify safe area handling
   - Test swipe-back gesture

---

## iOS Advantages Over Android

### Better Features on iOS

1. **Native Blur Effects** 🎨
   - Beautiful glassmorphism with BlurView
   - Multiple blur types (light, dark, prominent)
   - Better visual quality than Android

2. **Haptic Feedback** 📳
   - More precise haptic engine
   - Better feedback quality
   - More haptic types available

3. **Performance** ⚡
   - Generally smoother animations
   - Better memory management
   - Faster JavaScript execution

4. **Design Consistency** 🎯
   - Unified design across all iOS devices
   - Predictable safe area handling
   - Consistent gesture navigation

---

## Additional Resources

- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup?platform=ios)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [iOS App Distribution Guide](https://developer.apple.com/distribution/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0.0 | Initial iOS development guide created |
| | | - Setup and prerequisites documented |
| | | - Safe area patterns established |
| | | - Build process documented |
| | | - Common issues and solutions added |

---

**Maintained by**: OrokiiPay Development Team
**Last Reviewed**: October 12, 2025
**Related Documents**:
- [Android Development Guide](./ANDROID_DEVELOPMENT_GUIDE.md)
- [Project Overview](./PROJECT_OVERVIEW.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
