#!/bin/bash

# iOS Development Setup Script
# Run this script after installing Xcode from Mac App Store
# Usage: bash scripts/setup-ios-development.sh

set -e  # Exit on error

echo "========================================="
echo "iOS Development Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Xcode Installation
echo "Step 1: Checking Xcode installation..."
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed!${NC}"
    echo ""
    echo "Please install Xcode from the Mac App Store:"
    echo "1. Open Mac App Store"
    echo "2. Search for 'Xcode'"
    echo "3. Click 'Get' or 'Install'"
    echo "4. Wait for installation to complete (~1-2 hours)"
    echo "5. Run this script again"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Xcode is installed${NC}"
xcodebuild -version
echo ""

# Step 2: Accept Xcode License
echo "Step 2: Accepting Xcode license..."
sudo xcodebuild -license accept
echo -e "${GREEN}✅ Xcode license accepted${NC}"
echo ""

# Step 3: Set Xcode developer directory
echo "Step 3: Setting Xcode as active developer directory..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
echo -e "${GREEN}✅ Xcode developer directory set${NC}"
echo ""

# Step 4: Install CocoaPods
echo "Step 4: Installing CocoaPods..."
if command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods already installed${NC}"
    pod --version
else
    echo "Installing CocoaPods (this may take 5-10 minutes)..."
    sudo gem install cocoapods
    echo -e "${GREEN}✅ CocoaPods installed${NC}"
    pod --version
fi
echo ""

# Step 5: Update CocoaPods repo (optional but recommended)
echo "Step 5: Updating CocoaPods repository..."
echo "This may take a few minutes..."
pod repo update || echo -e "${YELLOW}⚠️  Pod repo update skipped (not critical)${NC}"
echo ""

# Step 6: Install iOS dependencies
echo "Step 6: Installing iOS dependencies..."
cd ios
echo "Running 'pod install' (first run takes 10-15 minutes)..."
pod install
cd ..
echo -e "${GREEN}✅ iOS dependencies installed${NC}"
echo ""

# Step 7: Verify installation
echo "========================================="
echo "Verification"
echo "========================================="
echo ""

echo "1. Xcode:"
xcodebuild -version

echo ""
echo "2. CocoaPods:"
pod --version

echo ""
echo "3. Workspace file:"
if [ -f "ios/OrokiiPayApp.xcworkspace" ]; then
    echo -e "${GREEN}✅ OrokiiPayApp.xcworkspace exists${NC}"
else
    echo -e "${RED}❌ OrokiiPayApp.xcworkspace not found${NC}"
fi

echo ""
echo "4. Mobile UI libraries:"
grep -E "(expo-linear-gradient|@react-native-community/blur)" package.json || echo -e "${RED}❌ Libraries not found${NC}"

echo ""
echo "5. Available iOS Simulators:"
xcrun simctl list devices available | grep "iPhone" | head -5

echo ""
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Open Xcode workspace:"
echo "   open ios/OrokiiPayApp.xcworkspace"
echo ""
echo "2. Configure signing in Xcode:"
echo "   - Select 'OrokiiPayApp' project"
echo "   - Select 'OrokiiPayApp' target"
echo "   - Go to 'Signing & Capabilities' tab"
echo "   - Enable 'Automatically manage signing'"
echo "   - Add your Apple ID account"
echo "   - Select your Team"
echo ""
echo "3. Build for iOS Simulator (FREE!):"
echo "   npx react-native run-ios --simulator=\"iPhone 15 Pro\""
echo ""
echo "Or click the Play ▶ button in Xcode!"
echo ""
