#!/bin/bash

# Xcode Installation Script from .xip file
# Run this after downloading Xcode from Apple Developer website
# Usage: bash scripts/install-xcode-from-xip.sh [path-to-xcode.xip]

set -e  # Exit on error

echo "========================================="
echo "Xcode Installation from .xip File"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find .xip file
if [ -z "$1" ]; then
    echo "Searching for Xcode .xip file in Downloads folder..."
    XIP_FILE=$(find ~/Downloads -name "Xcode*.xip" -type f | head -1)

    if [ -z "$XIP_FILE" ]; then
        echo -e "${RED}❌ No Xcode .xip file found in Downloads folder${NC}"
        echo ""
        echo "Please provide the path to the .xip file:"
        echo "Usage: bash scripts/install-xcode-from-xip.sh /path/to/Xcode.xip"
        echo ""
        echo "Or download Xcode from:"
        echo "https://developer.apple.com/download/all/?q=xcode"
        exit 1
    fi
else
    XIP_FILE="$1"
fi

echo -e "${BLUE}Found .xip file: $XIP_FILE${NC}"
echo ""

# Check if file exists
if [ ! -f "$XIP_FILE" ]; then
    echo -e "${RED}❌ File not found: $XIP_FILE${NC}"
    exit 1
fi

# Get file size
FILE_SIZE=$(du -h "$XIP_FILE" | cut -f1)
echo "File size: $FILE_SIZE"
echo ""

# Extract .xip file
echo "Step 1: Extracting Xcode.xip..."
echo -e "${YELLOW}⚠️  This will take 10-20 minutes and use ~40 GB disk space${NC}"
echo "Please be patient..."
echo ""

cd "$(dirname "$XIP_FILE")"
xip -x "$(basename "$XIP_FILE")"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to extract .xip file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Extraction complete${NC}"
echo ""

# Move Xcode to Applications
echo "Step 2: Moving Xcode to /Applications..."

if [ -d "/Applications/Xcode.app" ]; then
    echo -e "${YELLOW}⚠️  Xcode already exists in /Applications${NC}"
    echo "Removing old version..."
    sudo rm -rf /Applications/Xcode.app
fi

sudo mv Xcode.app /Applications/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to move Xcode to /Applications${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Xcode installed to /Applications/Xcode.app${NC}"
echo ""

# Set Xcode as active developer directory
echo "Step 3: Setting Xcode as active developer directory..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to set Xcode developer directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Xcode developer directory set${NC}"
echo ""

# Accept Xcode license
echo "Step 4: Accepting Xcode license..."
sudo xcodebuild -license accept

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Please run: sudo xcodebuild -license${NC}"
fi

echo -e "${GREEN}✅ Xcode license accepted${NC}"
echo ""

# Install additional components
echo "Step 5: Installing additional Xcode components..."
echo "This may take a few minutes..."
sudo xcodebuild -runFirstLaunch

echo -e "${GREEN}✅ Additional components installed${NC}"
echo ""

# Verify installation
echo "========================================="
echo "Verification"
echo "========================================="
echo ""

echo "Xcode version:"
xcodebuild -version

echo ""
echo "Xcode path:"
xcode-select -p

echo ""
echo "Available simulators:"
xcrun simctl list devices available | grep "iPhone" | head -5

echo ""
echo "========================================="
echo "Xcode Installation Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Install CocoaPods:"
echo "   sudo gem install cocoapods"
echo ""
echo "2. Run iOS setup:"
echo "   bash scripts/setup-ios-development.sh"
echo ""
echo "Or run the complete automated setup:"
echo "   bash scripts/complete-ios-setup.sh"
echo ""

# Cleanup
echo "Cleanup: Would you like to delete the .xip file to free up space?"
echo "The .xip file is ${FILE_SIZE} and is no longer needed."
read -p "Delete ${XIP_FILE}? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$XIP_FILE"
    echo -e "${GREEN}✅ .xip file deleted${NC}"
else
    echo -e "${YELLOW}⚠️  .xip file kept at: $XIP_FILE${NC}"
fi

echo ""
echo "Installation complete!"
