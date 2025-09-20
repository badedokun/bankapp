#!/bin/bash

# Enhanced Android APK Build Script with Crash Fixes
# Addresses permissions, network security, and polyfill issues

set -e  # Exit on any error

echo "🚀 Building APK with Crash Fixes"
echo "================================"

# 1. Environment Setup
echo "📋 Step 1: Environment Setup"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "✅ Project structure validated"

# 2. JDK Setup
echo "📋 Step 2: JDK Setup"
if [ -f "$HOME/.sdkman/bin/sdkman-init.sh" ]; then
    source "$HOME/.sdkman/bin/sdkman-init.sh"
    sdk use java 21.0.4-tem 2>/dev/null || echo "⚠️  JDK 21 not found"
fi

# 3. Install Dependencies
echo "📋 Step 3: Installing Dependencies"
npm install --legacy-peer-deps

# 4. Generate Production Bundle
echo "📋 Step 4: Generating Production Bundle"
mkdir -p android/app/src/main/assets

npx react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --reset-cache

# 5. Build APK
echo "📋 Step 5: Building APK"
cd android

export GRADLE_OPTS="--enable-native-access=ALL-UNNAMED -Xmx4g"

./gradlew assembleRelease --stacktrace

cd ..

# 6. Create timestamped APK
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FIXED_APK="bankapp-crash-fixed-$TIMESTAMP.apk"

if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    cp "android/app/build/outputs/apk/release/app-release.apk" "$FIXED_APK"
    APK_SIZE=$(du -h "$FIXED_APK" | cut -f1)

    echo ""
    echo "🎉 APK Build Complete!"
    echo "====================="
    echo "✅ APK: $FIXED_APK ($APK_SIZE)"
    echo "🔧 Enhanced with:"
    echo "   - Network security config"
    echo "   - All required permissions"
    echo "   - HTTPS support for FMFB cloud"
    echo "   - Improved crash handling"
    echo ""
    echo "📱 Ready for device testing!"

else
    echo "❌ APK build failed"
    exit 1
fi

exit 0