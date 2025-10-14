# NIBSS API Connection Test Report

**Test Date:** September 24, 2025
**Tested From:** GCP Server 34.59.143.25 (Whitelisted IP)
**API Base URL:** https://apitest.nibss-plc.com.ng
**Status:** ⚠️ Authentication Issues Identified

---

## Executive Summary

Successfully confirmed that our whitelisted IP (34.59.143.25) can reach NIBSS API endpoints. However, all authentication methods tested returned `401 Unauthorized`. Investigation revealed that we need a JWT Bearer token obtained through OAuth, but the OAuth endpoint is returning 404. Additionally, we're missing critical configuration from NIBSS Direct Debit profiling.

---

## Test Environment

### Current Credentials (from .env)
```
NIBSS_BASE_URL=https://apitest.nibss-plc.com.ng
NIBSS_API_KEY=o1rjrqtLdaZou7PQApzXQVHygLqEnoWi
NIBSS_CLIENT_ID=d86e0fe1-2468-4490-96bb-588e32af9a89
NIBSS_CLIENT_SECRET=~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa
NIBSS_ENVIRONMENT=sandbox
NIBSS_APP_NAME=NIP_MINI_SERVICE
```

### Test Server
- **IP Address:** 34.59.143.25 (Whitelisted with NIBSS)
- **Institution:** FirstMidas Microfinance Bank Limited
- **Network:** Confirmed connectivity to NIBSS endpoints

---

## Authentication Methods Tested

### Test 1: Bearer Token with API Key
```bash
curl -X POST https://apitest.nibss-plc.com.ng/nipservice/v1/nip/nameenquiry \
  -H "Authorization: Bearer o1rjrqtLdaZou7PQApzXQVHygLqEnoWi" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "0112345678",
    "channelCode": "1",
    "destinationInstitutionCode": "999998",
    "transactionId": "000034220924120000123456789012"
  }'
```

**Result:** `{"message":"Unauthorized"}` (401)

---

### Test 2: API-Key Header
```bash
curl -X POST https://apitest.nibss-plc.com.ng/nipservice/v1/nip/nameenquiry \
  -H "API-Key: o1rjrqtLdaZou7PQApzXQVHygLqEnoWi" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Result:** `{"message":"Unauthorized"}` (401)

---

### Test 3: x-api-key Header
```bash
curl -X POST https://apitest.nibss-plc.com.ng/nipservice/v1/nip/nameenquiry \
  -H "x-api-key: o1rjrqtLdaZou7PQApzXQVHygLqEnoWi" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Result:** `{"message":"Unauthorized"}` (401)

---

### Test 4: OAuth Token Endpoint
```bash
curl -X POST https://apitest.nibss-plc.com.ng/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=d86e0fe1-2468-4490-96bb-588e32af9a89&client_secret=~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa"
```

**Result:** `{"message":"no Route matched with those values"}` (404)

---

## Root Cause Analysis

### 1. Authentication Flow Misunderstanding
According to `PRODUCTION_TRANSFER_ENDPOINTS.md`, the correct authentication flow is:

1. **Obtain JWT Token** using CLIENT_ID + CLIENT_SECRET via OAuth
2. **Use JWT Token** in `Authorization: Bearer {jwt_token}` header for API calls

**Problem:** OAuth endpoint is returning 404 - endpoint may be incorrect or not available in test environment

### 2. Missing Configuration from NIBSS Direct Debit Profiling

According to documentation, we need:
- ✅ CLIENT_ID (have: `d86e0fe1-2468-4490-96bb-588e32af9a89`)
- ✅ CLIENT_SECRET (have: `~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa`)
- ❌ **Biller ID** (UUID) - Required for Fund Transfer and Balance Enquiry
- ❌ **Institution Code** (6-digit) - FirstMidas bank code
- ❌ **Mandate Reference Numbers** - Required for debit authorization
- ❌ **JWT Token Endpoint** - Correct OAuth endpoint

---

## Required Actions

### Immediate Actions (Contact NIBSS Support)

**Primary Contact:** technicalimplementation@nibss-plc.com.ng
**Secondary Contact:** certification@nibss-plc.com.ng
**Help Center:** https://contactcentre.nibss-plc.com.ng/support/home

**Questions to Ask NIBSS:**

1. **OAuth Endpoint Confirmation**
   - What is the correct OAuth/JWT token endpoint for test environment?
   - Is it `/oauth2/token` or different?
   - What authentication method should be used? (client_credentials, password, etc.)

2. **Direct Debit Profiling Status**
   - Has FirstMidas Microfinance Bank completed Direct Debit profiling?
   - What is our assigned Biller ID (UUID)?
   - What is FirstMidas institution code (6-digit)?

3. **Mandate Reference Numbers**
   - How do we obtain mandate reference numbers for test accounts?
   - Are there test mandate references available for sandbox?

4. **Test Credentials Validation**
   - Can NIBSS verify our CLIENT_ID and CLIENT_SECRET are active?
   - Is IP 34.59.143.25 properly whitelisted?

### Technical Implementation Needed

Once we have correct OAuth endpoint and Biller ID:

1. **Implement JWT Token Service**
   ```typescript
   // server/services/nibss-auth.ts
   async function getJWTToken(): Promise<string> {
     // Use CLIENT_ID + CLIENT_SECRET to obtain JWT
     // Cache token with expiry
     // Auto-refresh before expiry
   }
   ```

2. **Update NIBSS Service**
   ```typescript
   // server/services/nibss.ts
   const token = await getJWTToken();
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

3. **Add Configuration**
   ```bash
   # .env additions needed
   NIBSS_BILLER_ID=ADC19BDC-7D3A-4C00-4F7B-08DA06684F59
   NIBSS_INSTITUTION_CODE=999001  # Replace with FirstMidas code
   NIBSS_OAUTH_ENDPOINT=https://apitest.nibss-plc.com.ng/oauth/token
   ```

---

## Documentation References

- **API Endpoints:** `PRODUCTION_TRANSFER_ENDPOINTS.md`
- **Implementation Plan:** `PHASE3_IMPLEMENTATION_PLAN.md`
- **Project Overview:** `PROJECT_OVERVIEW.md`
- **Quick Reference:** `QUICK_REFERENCE.md`

---

## Test Success Criteria

✅ **Confirmed Working:**
- Network connectivity from 34.59.143.25 to NIBSS
- Whitelisted IP can reach NIBSS endpoints
- CLIENT_ID and CLIENT_SECRET format correct

❌ **Not Working:**
- JWT token generation (OAuth endpoint 404)
- API authentication (all methods return 401)
- Direct Debit profiling incomplete

⏳ **Pending:**
- Biller ID assignment
- Institution code confirmation
- Mandate reference numbers
- Correct OAuth endpoint

---

## Next Steps Checklist

- [ ] Contact NIBSS technical support with questions above
- [ ] Verify Direct Debit profiling status for FirstMidas
- [ ] Obtain correct OAuth/JWT token endpoint
- [ ] Get Biller ID (UUID) assignment
- [ ] Confirm FirstMidas 6-digit institution code
- [ ] Request test mandate reference numbers
- [ ] Implement JWT token service once endpoint confirmed
- [ ] Re-test Name Enquiry with proper JWT token
- [ ] Document successful authentication flow
- [ ] Proceed with Phase 3 NIBSS integration

---

## Appendix: Complete Transaction Flow (Once Authentication Working)

### 1. Obtain JWT Token
```
POST {OAUTH_ENDPOINT}
Body: grant_type=client_credentials&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
Response: { access_token: "eyJ...", expires_in: 3600 }
```

### 2. Name Enquiry
```
POST /nipservice/v1/nip/nameenquiry
Authorization: Bearer {jwt_token}
Response: { sessionID: "...", accountName: "..." }
```

### 3. Fund Transfer
```
POST /nipservice/v1/nip/fundstransfer
Authorization: Bearer {jwt_token}
Body: { ..., nameEnquiryRef: sessionID, billerId: BILLER_ID }
Response: { responseCode: "00", transactionId: "..." }
```

### 4. Transaction Status Query
```
POST /nipservice/v1/nip/tsq
Authorization: Bearer {jwt_token}
Body: { transactionId: "..." }
Response: { responseCode: "00" }
```

---

**Report Status:** Ready for NIBSS Technical Support Review
**Next Update:** After NIBSS support response with missing configuration