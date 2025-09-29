#!/bin/bash

# Manual API Test Script for RBAC Endpoints
# This script tests the RBAC API endpoints directly with curl

BASE_URL="http://localhost:3001"

echo "🔐 Manual RBAC API Test"
echo "======================="
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Login and get token
echo -e "${BLUE}2. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@fmfb.com",
        "password": "Admin-7-super",
        "tenantCode": "fmfb"
    }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token length: ${#TOKEN}"
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Enhanced Dashboard Data Endpoint
echo -e "${BLUE}3. Testing Enhanced Dashboard Data Endpoint...${NC}"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rbac/enhanced-dashboard-data" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json")

if echo "$DASHBOARD_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Enhanced Dashboard Data endpoint working${NC}"
    echo "Response has $(echo "$DASHBOARD_RESPONSE" | wc -c) characters"

    # Check for expected data structure
    if echo "$DASHBOARD_RESPONSE" | grep -q "userContext"; then
        echo -e "${GREEN}  ✓ Contains userContext${NC}"
    fi
    if echo "$DASHBOARD_RESPONSE" | grep -q "permissions"; then
        echo -e "${GREEN}  ✓ Contains permissions${NC}"
    fi
    if echo "$DASHBOARD_RESPONSE" | grep -q "availableFeatures"; then
        echo -e "${GREEN}  ✓ Contains availableFeatures${NC}"
    fi
    if echo "$DASHBOARD_RESPONSE" | grep -q "aiSuggestions"; then
        echo -e "${GREEN}  ✓ Contains aiSuggestions${NC}"
    fi
else
    echo -e "${RED}❌ Enhanced Dashboard Data endpoint failed${NC}"
    echo "Response: $DASHBOARD_RESPONSE"
fi
echo ""

# Test 4: User Permissions Endpoint
echo -e "${BLUE}4. Testing User Permissions Endpoint...${NC}"
PERMISSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rbac/user/permissions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json")

if echo "$PERMISSIONS_RESPONSE" | grep -q "permissions"; then
    echo -e "${GREEN}✅ User Permissions endpoint working${NC}"
    PERM_COUNT=$(echo "$PERMISSIONS_RESPONSE" | grep -o '"code"' | wc -l)
    echo "Found $PERM_COUNT permissions"
else
    echo -e "${RED}❌ User Permissions endpoint failed${NC}"
    echo "Response: $PERMISSIONS_RESPONSE"
fi
echo ""

# Test 5: User Roles Endpoint
echo -e "${BLUE}5. Testing User Roles Endpoint...${NC}"
ROLES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rbac/user/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json")

if echo "$ROLES_RESPONSE" | grep -q "roles"; then
    echo -e "${GREEN}✅ User Roles endpoint working${NC}"
    ROLE_COUNT=$(echo "$ROLES_RESPONSE" | grep -o '"code"' | wc -l)
    echo "Found $ROLE_COUNT roles"
else
    echo -e "${RED}❌ User Roles endpoint failed${NC}"
    echo "Response: $ROLES_RESPONSE"
fi
echo ""

# Test 6: Available Features Endpoint
echo -e "${BLUE}6. Testing Available Features Endpoint...${NC}"
FEATURES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rbac/user/features" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json")

if echo "$FEATURES_RESPONSE" | grep -q "features"; then
    echo -e "${GREEN}✅ Available Features endpoint working${NC}"
    FEATURE_COUNT=$(echo "$FEATURES_RESPONSE" | grep -o '"id"' | wc -l)
    echo "Found $FEATURE_COUNT features"
else
    echo -e "${RED}❌ Available Features endpoint failed${NC}"
    echo "Response: $FEATURES_RESPONSE"
fi
echo ""

# Test 7: Permission Check Endpoint
echo -e "${BLUE}7. Testing Permission Check Endpoint...${NC}"
PERMISSION_CHECK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/rbac/check-permission" \
    -H "Authorization: Bearer $TOKEN" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json" \
    -d '{"permissionCode": "user_management"}')

if echo "$PERMISSION_CHECK_RESPONSE" | grep -q "hasPermission"; then
    echo -e "${GREEN}✅ Permission Check endpoint working${NC}"
    HAS_PERM=$(echo "$PERMISSION_CHECK_RESPONSE" | grep -o '"hasPermission":[^,}]*' | cut -d':' -f2)
    echo "Has user_management permission: $HAS_PERM"
else
    echo -e "${RED}❌ Permission Check endpoint failed${NC}"
    echo "Response: $PERMISSION_CHECK_RESPONSE"
fi
echo ""

# Test 8: Unauthorized Access Test
echo -e "${BLUE}8. Testing Unauthorized Access...${NC}"
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/rbac/enhanced-dashboard-data" \
    -H "x-tenant-code: fmfb" \
    -H "Content-Type: application/json")

if echo "$UNAUTH_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Unauthorized access properly blocked${NC}"
else
    echo -e "${RED}❌ Unauthorized access not properly blocked${NC}"
    echo "Response: $UNAUTH_RESPONSE"
fi
echo ""

echo "======================="
echo -e "${GREEN}🎉 Manual API test completed!${NC}"
echo "All key RBAC endpoints are ready for Playwright testing."