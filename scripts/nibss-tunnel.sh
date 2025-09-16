#!/bin/bash

# NIBSS API Tunnel Script
# Routes local NIBSS API requests through GCP server with whitelisted IP

echo "🚇 Setting up SSH tunnel for NIBSS API testing..."

# GCP Instance details
GCP_USER="bisiadedokun"
GCP_HOST="34.59.143.25"
LOCAL_PORT=8443
NIBSS_HOST="apitest.nibss-plc.com.ng"
NIBSS_PORT=443

# Kill any existing tunnel on the same port
echo "🔍 Checking for existing tunnels..."
lsof -ti:$LOCAL_PORT | xargs kill -9 2>/dev/null

# Create SSH tunnel
echo "📡 Creating SSH tunnel to GCP instance..."
echo "   Local: localhost:$LOCAL_PORT"
echo "   Remote: $NIBSS_HOST:$NIBSS_PORT"
echo "   Via: $GCP_HOST"

ssh -N -L $LOCAL_PORT:$NIBSS_HOST:$NIBSS_PORT $GCP_USER@$GCP_HOST &
TUNNEL_PID=$!

echo "✅ Tunnel established with PID: $TUNNEL_PID"
echo ""
echo "📝 Update your .env.local file:"
echo "   NIBSS_BASE_URL=https://localhost:$LOCAL_PORT"
echo ""
echo "⚠️  Note: You may need to disable SSL verification for localhost"
echo ""
echo "To stop the tunnel, run: kill $TUNNEL_PID"
echo "Or press Ctrl+C to stop this script"

# Keep script running
wait $TUNNEL_PID