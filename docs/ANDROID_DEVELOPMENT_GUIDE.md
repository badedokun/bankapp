# Android Development Guide

> **Last Updated**: October 12, 2025
> **React Native Version**: 0.81.1
> **Target SDK**: Android 14 (API 34)

This guide provides essential patterns, best practices, and troubleshooting steps for developing and building Android APKs for the OrokiiPay Banking App as development progresses.

---

## Table of Contents

1. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
2. [Critical Android Patterns](#critical-android-patterns)
3. [Building APKs](#building-apks)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Testing Checklist](#testing-checklist)
6. [Multi-Tenancy Considerations](#multi-tenancy-considerations)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting Reference](#troubleshooting-reference)

---

## Prerequisites & Environment Setup

### Required Tools

```bash
# Node.js
node >= 20

# Java Development Kit (Required for Android builds)
JDK 17 (Recommended: OpenJDK 17)

# Android SDK
Android SDK Platform 34
Android Build Tools 34.0.0

# Environment Variables (Add to ~/.zshrc or ~/.bash_profile)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
```

### Verify Setup

```bash
# Check Java installation
java -version  # Should show version 17.x.x

# Check Android SDK
echo $ANDROID_HOME  # Should show path to Android SDK
adb version  # Should show Android Debug Bridge version

# Check Gradle
cd android && ./gradlew --version
```

---

## Critical Android Patterns

### 1. Status Bar Overlap Fix Pattern

**Problem**: Android's translucent status bar causes app headers and back buttons to be covered by the system status bar (time, battery, signal indicators).

**Solution**: Apply this pattern to **ALL screens with headers**:

#### Implementation Pattern

```typescript
import { Platform, StatusBar } from 'react-native';

// In your component styles
const styles = StyleSheet.create({
  // Apply to the topmost container/header
  header: {
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 0) + 12,  // Dynamic padding
      ios: 44,                                        // iOS safe area
      web: 0,                                         // No padding needed
      default: 0,
    }),
    // ... other styles
  },
});

// Add StatusBar component to your JSX (at the top of your component)
<StatusBar
  translucent
  backgroundColor="transparent"
  barStyle="light-content"  // or "dark-content"
/>
```

#### When to Use Each Bar Style

```typescript
// Use "light-content" (white icons) for DARK backgrounds
<StatusBar barStyle="light-content" />
// Examples: Dashboard, Transfer screens, Product screens

// Use "dark-content" (dark icons) for LIGHT backgrounds
<StatusBar barStyle="dark-content" />
// Examples: Login screen, Settings (if light themed)
```

#### Complete Example

```typescript
import React from 'react';
import {
  View,
  Text,
  StatusBar,
  Platform,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function MyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* CRITICAL: Add StatusBar component */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header with proper padding */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Screen Title</Text>
      </View>

      {/* Rest of your content */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    // CRITICAL: Apply this pattern to all headers
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 0) + 12,
      ios: 44,
      web: 0,
      default: 0,
    }),
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#2d3561',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
```

#### Files Already Fixed

✅ All screens have been updated with this pattern:
- `src/components/dashboard/ModernDashboardWithAI.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/transfers/ModernTransferMenuScreen.tsx`
- `src/screens/transfers/TransferMoneyScreen.tsx`
- `src/screens/products/ProductsScreen.tsx`
- `src/screens/settings/SettingsScreen.tsx`
- `src/screens/analytics/TransactionAnalyticsScreen.tsx`
- `src/screens/transactions/TransactionDetailsScreen.tsx`
- And more...

### 2. Navigation Best Practices

#### Avoid Navigation Bypassing

**❌ Bad Practice**:
```typescript
// Don't use direct screen navigation for multi-step flows
<TouchableOpacity onPress={() => navigation.navigate('TransferMoney')}>
  <Text>Money Transfer</Text>
</TouchableOpacity>
```

**✅ Good Practice**:
```typescript
// Use menu/intermediate screens for complex flows
<TouchableOpacity onPress={() => navigation.navigate('TransferMenu')}>
  <Text>Money Transfer</Text>
</TouchableOpacity>
```

#### Register All Screens in Navigator

```typescript
// src/navigation/AppNavigator.tsx
<Stack.Screen
  name="TransferMenu"
  component={ModernTransferMenuScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="TransferMoney"
  component={TransferMoneyScreen}
  options={{ headerShown: false }}
/>
```

---

## Building APKs

### Development Build (Debug APK)

```bash
cd android

# Clean build (recommended for first build or after dependency changes)
./gradlew clean
./gradlew assembleDebug

# APK location
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Production Build (Release APK)

```bash
cd android

# Using production environment variables
ENVFILE=.env.fmfb.production ./gradlew assembleRelease

# APK location
# android/app/build/outputs/apk/release/app-release.apk
```

### Multi-Tenant Builds

```bash
# FMFB tenant production build
ENVFILE=.env.fmfb.production ./gradlew assembleRelease

# OrokiiPay tenant production build
ENVFILE=.env.orokiipay.production ./gradlew assembleRelease
```

### Installing APK

```bash
# Install on connected device/emulator
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Or drag and drop to Android emulator
# Or transfer to device via Google Drive, email, etc.
```

---

## Common Issues & Solutions

### Issue 1: react-native-reanimated Dependency Error

**Error Message**:
```
Error: The package 'react-native-reanimated' doesn't seem to be linked...
```

**Solutions**:

#### Option A: Install react-native-reanimated (Recommended)
```bash
npm install react-native-reanimated
cd android && ./gradlew clean
```

#### Option B: Remove Usage (If Not Needed)
```bash
# Search for usage
grep -r "react-native-reanimated" src/

# Remove imports and usage, then:
cd android && ./gradlew clean
```

### Issue 2: Gradle Build Fails - Missing Environment Variables

**Error Message**:
```
Error: Config file .env.fmfb.production not found
```

**Solution**:
```bash
# Ensure .env file exists in project root
ls -la .env.fmfb.production

# If missing, create from template
cp .env.example .env.fmfb.production

# Required variables:
TENANT_ID=fmfb
API_URL=https://your-api-url.com
```

### Issue 3: Metro Bundler Port Conflict

**Error Message**:
```
Error: listen EADDRINUSE: address already in use :::8081
```

**Solution**:
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start Metro on different port
npx react-native start --port 8082
```

### Issue 4: Android Gradle Daemon Memory Issues

**Error Message**:
```
Expiring Daemon because JVM heap space is exhausted
```

**Solution**:

Create/edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### Issue 5: StatusBar Not Showing on Android

**Symptoms**: Status bar is invisible or white rectangle appears

**Solution**:
```typescript
// Ensure you have both translucent AND backgroundColor
<StatusBar
  translucent            // Required for Android
  backgroundColor="transparent"
  barStyle="light-content"
/>

// And proper padding in styles
paddingTop: Platform.select({
  android: (StatusBar.currentHeight || 0) + 12,
  ios: 44,
  web: 0,
  default: 0,
}),
```

### Issue 6: Back Button Not Working

**Cause**: Overlapping elements or incorrect z-index

**Solution**:
```typescript
// Ensure back button is not covered
backButton: {
  zIndex: 10,  // Ensure it's on top
  position: 'relative',
  // Add visible background for debugging
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
}
```

---

## Testing Checklist

### Before Building APK

- [ ] All StatusBar patterns applied to new screens
- [ ] No `console.log` statements in production code
- [ ] All navigation flows tested
- [ ] Environment variables configured
- [ ] No hardcoded tenant IDs or URLs
- [ ] Multi-tenancy verification complete

### During Build

- [ ] Clean build completed: `./gradlew clean`
- [ ] No build errors in terminal
- [ ] APK file generated in correct location
- [ ] APK file size is reasonable (~20-40 MB)

### After Build - Manual Testing

#### Status Bar Testing
- [ ] Status bar visible on all screens
- [ ] Status bar icons readable (light/dark contrast)
- [ ] Headers not overlapping status bar
- [ ] Back buttons clickable and properly positioned

#### Navigation Testing
- [ ] All screen transitions work
- [ ] Back button navigation works
- [ ] Deep linking works (if applicable)
- [ ] Bottom tab navigation works

#### Functionality Testing
- [ ] Login flow works
- [ ] Dashboard loads correctly
- [ ] Transfer flows work end-to-end
- [ ] Transaction history displays
- [ ] Settings accessible
- [ ] Analytics/insights load

#### UI/UX Testing
- [ ] Scrolling works on all scrollable screens
- [ ] Keyboard doesn't cover input fields
- [ ] Loading states display correctly
- [ ] Error messages display correctly
- [ ] Success confirmations work

#### Performance Testing
- [ ] App opens in < 3 seconds
- [ ] Screens transition smoothly
- [ ] No memory leaks (test by navigating repeatedly)
- [ ] No ANR (Application Not Responding) errors

---

## Multi-Tenancy Considerations

### Environment Variables Pattern

**Never hardcode tenant data**. Always use environment variables:

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

```bash
# FMFB tenant
ENVFILE=.env.fmfb.production ./gradlew assembleRelease

# OrokiiPay tenant
ENVFILE=.env.orokiipay.production ./gradlew assembleRelease

# Development tenant
ENVFILE=.env.development ./gradlew assembleDebug
```

### Theme Verification

Before building, verify theme configuration:

```typescript
// src/tenants/TenantContext.tsx
const theme = useTenantTheme();

// Verify these are dynamic, not hardcoded:
theme.colors.primary
theme.brandLogo
theme.brandName
```

---

## Performance Optimization

### 1. Reduce APK Size

```bash
# Enable ProGuard (already configured in app/build.gradle)
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
}
```

### 2. Optimize Images

```bash
# Use WebP format for images
# Use appropriate resolutions:
# - mdpi: 1x
# - hdpi: 1.5x
# - xhdpi: 2x
# - xxhdpi: 3x
# - xxxhdpi: 4x
```

### 3. Lazy Loading

```typescript
// Lazy load heavy components
const TransactionHistory = React.lazy(() => import('./TransactionHistory'));

// Use Suspense
<React.Suspense fallback={<LoadingSpinner />}>
  <TransactionHistory />
</React.Suspense>
```

### 4. Optimize Renders

```typescript
// Use React.memo for expensive components
export default React.memo(ExpensiveComponent);

// Use useCallback for event handlers
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

---

## Troubleshooting Reference

### Debug Mode

```bash
# Enable debug logging
adb logcat ReactNativeJS:I "*:S"

# Clear logs and monitor
adb logcat -c && adb logcat ReactNativeJS:I "*:S"

# Filter for errors
adb logcat ReactNativeJS:I "*:E" "*:S"
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Execution failed for task ':app:mergeDebugResources'` | Duplicate resources | Clean: `./gradlew clean` |
| `Could not determine the dependencies of task ':app:compileDebugJavaWithJavac'` | Gradle sync issue | Delete `.gradle` folder, rebuild |
| `Failed to install the app` | Old APK cached | Uninstall app, rebuild |
| `Unable to load script` | Metro bundler not running | Start Metro: `npm start` |
| `Task :app:installDebug FAILED` | Device not connected | Check: `adb devices` |

### Reset Everything

```bash
# Nuclear option - reset everything
cd android
./gradlew clean

# Delete build folders
rm -rf android/app/build
rm -rf android/build

# Clear Metro cache
rm -rf /tmp/metro-*
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
cd android && ./gradlew assembleDebug
```

---

## Quick Reference: New Screen Checklist

When adding a new screen to the app:

1. **Add StatusBar Component**
   ```typescript
   <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
   ```

2. **Apply Header Padding**
   ```typescript
   paddingTop: Platform.select({
     android: (StatusBar.currentHeight || 0) + 12,
     ios: 44,
     web: 0,
     default: 0,
   })
   ```

3. **Register in Navigator**
   ```typescript
   <Stack.Screen name="MyScreen" component={MyScreen} />
   ```

4. **Use SafeAreaView**
   ```typescript
   <SafeAreaView style={styles.container}>
   ```

5. **Avoid Hardcoding**
   - No hardcoded colors (use `theme.colors.*`)
   - No hardcoded tenant IDs (use `Config.TENANT_ID`)
   - No hardcoded API URLs (use `Config.API_URL`)

6. **Test on Android**
   - Build APK and test on device
   - Verify status bar visibility
   - Test all navigation flows

---

## Additional Resources

- [React Native Android Docs](https://reactnative.dev/docs/android-setup)
- [Android Developer Documentation](https://developer.android.com/)
- [Project Development Guide](./DEVELOPMENT_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE_2025_10_10_WORKING.md)
- [Local Testing Guide](./LOCAL_TESTING_GUIDE.md)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0.0 | Initial guide created |
| | | - Status bar pattern documented |
| | | - Build process documented |
| | | - Common issues and solutions added |

---

**Maintained by**: OrokiiPay Development Team
**Last Reviewed**: October 12, 2025
