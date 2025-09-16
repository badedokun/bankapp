#!/bin/bash

# Local NIBSS Setup Script
# Configures local environment for NIBSS API testing

echo "🏠 Setting up Local NIBSS Testing Environment"
echo "============================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.local.example .env.local

    # Add NIBSS credentials if they exist in main .env
    if [ -f ".env" ] && grep -q "NIBSS_API_KEY=" .env; then
        echo ""
        echo "🔐 Copying NIBSS credentials from main .env file..."

        # Extract NIBSS credentials from main .env
        NIBSS_BASE_URL=$(grep "^NIBSS_BASE_URL=" .env | cut -d '=' -f2)
        NIBSS_API_KEY=$(grep "^NIBSS_API_KEY=" .env | cut -d '=' -f2)
        NIBSS_CLIENT_ID=$(grep "^NIBSS_CLIENT_ID=" .env | cut -d '=' -f2)
        NIBSS_CLIENT_SECRET=$(grep "^NIBSS_CLIENT_SECRET=" .env | cut -d '=' -f2)

        # Update .env.local with actual credentials
        sed -i '' "s|NIBSS_BASE_URL=.*|NIBSS_BASE_URL=$NIBSS_BASE_URL|" .env.local
        sed -i '' "s|NIBSS_API_KEY=.*|NIBSS_API_KEY=$NIBSS_API_KEY|" .env.local
        sed -i '' "s|NIBSS_CLIENT_ID=.*|NIBSS_CLIENT_ID=$NIBSS_CLIENT_ID|" .env.local
        sed -i '' "s|NIBSS_CLIENT_SECRET=.*|NIBSS_CLIENT_SECRET=$NIBSS_CLIENT_SECRET|" .env.local

        echo "   ✅ NIBSS credentials copied to .env.local"
    fi
else
    echo "📄 .env.local already exists"
fi

# Enable mock mode by default for local testing
echo ""
echo "🎭 Configuring mock mode for local development..."
grep -q "NIBSS_USE_MOCK=" .env.local && sed -i '' 's/NIBSS_USE_MOCK=.*/NIBSS_USE_MOCK=true/' .env.local || echo "NIBSS_USE_MOCK=true" >> .env.local

echo "✅ Local environment configured!"

echo ""
echo "📋 Available Testing Modes:"
echo "========================="
echo ""
echo "1. 🎭 Mock Mode (Recommended for Development)"
echo "   - Fastest and most reliable"
echo "   - No network dependencies"
echo "   - Already configured in your .env.local"
echo ""
echo "2. 🚇 SSH Tunnel Mode (For Real API Testing)"
echo "   - Requires SSH access to your GCP server"
echo "   - Routes requests through whitelisted IP"
echo "   - Run: ./scripts/nibss-tunnel.sh"
echo ""
echo "3. 🌍 Direct Mode (Production Only)"
echo "   - Only works from whitelisted IP (34.59.143.25)"
echo "   - For GCP deployment testing"
echo ""

echo ""
echo "🚀 Quick Start Commands:"
echo "======================"
echo "# Test current setup"
echo "node test-local-nibss.js"
echo ""
echo "# Start SSH tunnel (if needed)"
echo "./scripts/nibss-tunnel.sh"
echo ""
echo "# Run your application with mock NIBSS"
echo "npm run dev"
echo ""

echo "✅ Setup complete! You can now test NIBSS integration locally."