# NIBSS API Credentials & Integration Status

**Last Updated:** October 8, 2025
**Institution:** FirstMidas Microfinance Bank Limited (FMFB)
**Environment:** Sandbox/Test
**Status:** ⚠️ **Partially Configured - Authentication Issues**

---

## 📋 **NIBSS API Credentials Summary**

### **Current Configuration (from .env)**

| Parameter | Value | Status | Source |
|-----------|-------|--------|--------|
| **NIBSS Base URL** | `https://apitest.nibss-plc.com.ng` | ✅ Set | .env |
| **API Key** | `o1rjrqtLdaZou7PQApzXQVHygLqEnoWi` | ✅ Set | .env |
| **Client ID** | `d86e0fe1-2468-4490-96bb-588e32af9a89` | ✅ Set | .env |
| **Client Secret** | `~Ou8Q~NPF7jfauwivWFSDOviFex..VWCdqTSIdpa` | ✅ Set | .env |
| **Environment** | `sandbox` | ✅ Set | .env |
| **App Name** | `NIP_MINI_SERVICE` | ✅ Set | .env |
| **Reset URL** | `https://apitest.nibss-plc.com.ng/v2/reset` | ✅ Set | .env |
| **Timeout** | `30000` (30 seconds) | ✅ Set | .env |

### **Institution-Specific Configuration**

| Parameter | Value | Status | Source |
|-----------|-------|--------|--------|
| **Institution Code** | `090575` | ✅ Confirmed | NIBSS_CONNECTION_TEST_RESULTS.md |
| **Institution Name** | FirstMidas Microfinance Bank Limited | ✅ Confirmed | Multiple docs |
| **Mandate Reference** | `RC0220310/1349/0009291032` | ✅ Set | NIBSS_CONNECTION_TEST_RESULTS.md |
| **FCMB Biller ID** | `362` | ⚠️ Needs Verification | NIBSS_CONNECTION_TEST_RESULTS.md |
| **FMFB Biller ID (UUID)** | ❌ **MISSING** | ❌ Not Assigned | Multiple docs |

### **VPN Configuration (from NIBSS VPN Form)**

| Parameter | Value | Status |
|-----------|-------|--------|
| **NIBSS VPN Endpoint** | `196.6.103.25` | ✅ Documented |
| **NIBSS Host IP** | `196.6.103.10` | ✅ Documented |
| **VPN Device** | Cisco ASR 1000 Router | ✅ Documented |
| **IKE Version** | IKE v1/v2 | ✅ Documented |
| **IKE Encryption** | AES 256 | ✅ Documented |
| **Authentication Method** | SHA | ✅ Documented |
| **Diffie-Hellman Group** | 1, 2, or 5 | ✅ Documented |
| **SA Lifetime (IKE)** | 28800 seconds (8 hours) | ✅ Documented |
| **IPSEC Encryption** | AES 256 | ✅ Documented |
| **SA Lifetime (IPSEC)** | 1800 seconds (30 min) | ✅ Documented |
| **Perfect Forward Secrecy** | Yes/No | ⚠️ Needs Confirmation |
| **Pre-Shared Secret** | Via phone/Skype only | 🔒 Secure delivery |

### **Network Configuration**

| Parameter | Value | Status |
|-----------|-------|--------|
| **Whitelisted IP** | `34.59.143.25` | ⚠️ Needs Verification |
| **Production Server** | GCP Instance (34.59.143.25) | ✅ Active |
| **Network Connectivity** | NIBSS endpoints reachable | ✅ Confirmed |

---

## 🔐 **NIBSS Technical Contacts**

### **Primary Contacts (from VPN Form)**

| Contact Type | Name | Email | Phone |
|--------------|------|-------|-------|
| **Technical Contact** | Eseoghene Charles-Adeoye | eawe@nibss-plc.com.ng | 08028740677 |
| **Department** | Network and Security | - | - |
| **City/State** | Lagos, Lagos State | - | - |

### **Support Channels**

| Channel | Contact | Purpose |
|---------|---------|---------|
| **Technical Implementation** | technicalimplementation@nibss-plc.com.ng | OAuth/API issues |
| **Certification** | certification@nibss-plc.com.ng | Production certification |
| **Help Center** | https://contactcentre.nibss-plc.com.ng/support/home | General support |

---

## 🔍 **Current Integration Status**

### ✅ **What's Working**

1. **Network Connectivity**
   - ✅ Server can reach NIBSS endpoints
   - ✅ All API URLs respond (though with auth errors)
   - ✅ No network/firewall blocking

2. **Configuration Completeness**
   - ✅ All 7 primary parameters configured
   - ✅ Institution code identified (090575)
   - ✅ Mandate reference obtained
   - ✅ VPN configuration documented

3. **Code Implementation**
   - ✅ NIBSS service classes implemented
   - ✅ OAuth authentication service ready
   - ✅ Fallback to API key auth implemented
   - ✅ Multiple authentication strategies coded

### ❌ **What's NOT Working**

1. **OAuth Token Generation**
   - ❌ Endpoint `/oauth/token` returns 404
   - ❌ Alternative endpoint `/v2/auth/token` untested
   - ❌ Correct OAuth endpoint path unknown
   - **Error:** `"no Route matched with those values"`

2. **API Authentication**
   - ❌ All API calls return 401 Unauthorized
   - ❌ Bearer token authentication failing
   - ❌ API key authentication failing
   - ❌ Multiple header combinations tried, all failed

3. **Missing Critical Information**
   - ❌ **FMFB Biller ID (UUID)** - Required for fund transfers
   - ⚠️ **IP Whitelisting Status** - Unclear if 34.59.143.25 is active
   - ⚠️ **Direct Debit Profiling** - Completion status unknown
   - ⚠️ **OAuth Endpoint Path** - Correct endpoint unknown

---

## 🚨 **Critical Blockers**

### **Blocker 1: OAuth Endpoint**
**Issue:** Cannot obtain JWT token due to incorrect OAuth endpoint
**Impact:** All API calls fail with 401 Unauthorized
**Priority:** 🔴 Critical
**Owner:** NIBSS Support (needs clarification)

**Endpoints Tried:**
- ❌ `/oauth/token` → 404
- ❌ `/oauth2/token` → 404
- ⏳ `/v2/auth/token` → Not tested yet
- ⏳ `/v2/oauth/token` → Not tested yet
- ⏳ `/api/oauth/token` → Not tested yet

### **Blocker 2: Missing Biller ID**
**Issue:** FMFB Biller ID (UUID format) not assigned
**Impact:** Cannot process fund transfers or balance enquiries
**Priority:** 🔴 Critical
**Owner:** NIBSS Direct Debit team

**Status:**
- Have: FCMB Biller ID (362) - May not be correct for FMFB
- Need: FMFB-specific UUID Biller ID
- Example format: `ADC19BDC-7D3A-4C00-4F7B-08DA06684F59`

### **Blocker 3: IP Whitelisting**
**Issue:** Unclear if IP 34.59.143.25 is properly whitelisted
**Impact:** All API calls may be blocked at network level
**Priority:** 🟡 High
**Owner:** NIBSS Network Team

**Required:**
- Confirmation that 34.59.143.25 is whitelisted
- VPN setup completion (if required)
- Network access verification

---

## 📝 **Required Actions**

### **Immediate (This Week)**

1. **Contact NIBSS Technical Support** 📧
   - **Email:** technicalimplementation@nibss-plc.com.ng
   - **CC:** certification@nibss-plc.com.ng
   - **Subject:** "FirstMidas MFB - OAuth Endpoint & Biller ID Request"

   **Questions to Ask:**
   ```
   Dear NIBSS Technical Support,

   We are FirstMidas Microfinance Bank Limited (Institution Code: 090575)
   integrating with NIBSS APIs in the test environment.

   We need assistance with the following:

   1. OAuth Token Endpoint:
      - What is the correct OAuth/JWT token endpoint for sandbox?
      - We tried /oauth/token and /oauth2/token (both 404)
      - What is the correct authentication flow?

   2. Biller ID Assignment:
      - What is our assigned Biller ID (UUID format) for FMFB?
      - We have FCMB Biller ID (362) but need FMFB-specific ID
      - Has Direct Debit profiling been completed for FMFB?

   3. IP Whitelisting:
      - Can you confirm IP 34.59.143.25 is whitelisted?
      - Do we need VPN setup before API access?

   4. Credentials Validation:
      - Can you verify our CLIENT_ID is active: d86e0fe1-2468-4490-96bb-588e32af9a89
      - Is institution code 090575 properly configured?

   Our current credentials:
   - Client ID: d86e0fe1-2468-4490-96bb-588e32af9a89
   - Institution Code: 090575
   - Mandate Reference: RC0220310/1349/0009291032
   - Test IP: 34.59.143.25

   Thank you for your assistance.

   Best regards,
   OrokiiPay Development Team
   ```

2. **Test Alternative OAuth Endpoints** 🧪
   ```bash
   # Test all possible OAuth endpoint variations
   curl -X POST https://apitest.nibss-plc.com.ng/v2/auth/token ...
   curl -X POST https://apitest.nibss-plc.com.ng/v2/oauth/token ...
   curl -X POST https://apitest.nibss-plc.com.ng/api/oauth/token ...
   curl -X POST https://apitest.nibss-plc.com.ng/auth/token ...
   ```

3. **Review VPN Requirements** 🔒
   - Check if VPN setup is mandatory for API access
   - Review NIBSS VPN Form requirements
   - Coordinate with NIBSS network team if needed

### **Short-Term (Next 2 Weeks)**

1. **Complete Direct Debit Profiling**
   - Verify FMFB registration status
   - Obtain all required institutional IDs
   - Document mandate reference activation

2. **Update Environment Configuration**
   ```bash
   # Add missing parameters to .env once obtained
   NIBSS_BILLER_ID=<UUID from NIBSS>
   NIBSS_INSTITUTION_CODE=090575
   NIBSS_OAUTH_ENDPOINT=<correct endpoint from NIBSS>
   NIBSS_MANDATE_REFERENCE=RC0220310/1349/0009291032
   ```

3. **Implement JWT Token Service** (once endpoint known)
   - Update `nibss-auth.ts` with correct OAuth endpoint
   - Implement token caching and auto-refresh
   - Add comprehensive error handling

### **Medium-Term (Next Month)**

1. **Complete NIBSS Integration Testing**
   - Name Enquiry API
   - Fund Transfer API
   - Transaction Status Query
   - Balance Enquiry

2. **Move to Production**
   - Obtain production credentials
   - Update .env for production
   - Complete certification process
   - Update whitelisted IP if needed

---

## 🧪 **Test Results Summary**

### **From NIBSS_API_TEST_REPORT.md (Sept 24, 2025)**

| Test | Endpoint | Result | Status |
|------|----------|--------|--------|
| Name Enquiry | `/nipservice/v1/nip/nameenquiry` | 401 Unauthorized | ❌ Failed |
| Bank List | `/nipservice/v1/banks` | 401 Unauthorized | ❌ Failed |
| OAuth Token | `/oauth/token` | 404 Not Found | ❌ Failed |
| OAuth Token | `/oauth2/token` | 404 Not Found | ❌ Failed |
| Health Check | `/health` | 404 Not Found | ❌ Failed |

### **From NIBSS_CONNECTION_TEST_RESULTS.md (Sept 25, 2025)**

| Component | Status | Notes |
|-----------|--------|-------|
| Network Connectivity | ✅ Working | All endpoints reachable |
| Configuration | ✅ Complete | 7/7 parameters set |
| Institution Identity | ✅ Confirmed | Code 090575 documented |
| API Response | ✅ Working | Proper error messages returned |
| Authentication | ❌ Failed | OAuth endpoint incorrect |

---

## 📚 **Implementation Files**

### **Service Files**
- `server/services/nibss.ts` - Main NIBSS service (interfaces only, partial)
- `server/services/nibss-auth.ts` - OAuth authentication service (complete)
- `server/services/nibss-mock.ts` - Mock service for testing
- `server/services/nibss-proxy.ts` - Proxy service
- `server/services/payment-gateways/NIBSSProvider.ts` - Payment gateway implementation

### **Configuration Files**
- `.env` - Environment configuration (7 NIBSS parameters)
- `.env.example` - Example configuration template

### **Test Files**
- `test-nibss-connection.js` - Connection testing script
- `test-nibss-auth.js` - Authentication testing script
- `test-nibss-validation.js` - Comprehensive validation test
- `test-local-nibss.js` - Local testing script

### **Documentation Files**
- `NIBSS_API_TEST_REPORT.md` - Detailed test results (Sept 24)
- `NIBSS_CONNECTION_TEST_RESULTS.md` - Connection status (Sept 25)
- `NIBSS_CREDENTIALS_AND_STATUS.md` - This document
- `docs/NIBSS VPN Form1.doc` - VPN configuration form
- `LOCAL_NIBSS_TESTING_GUIDE.md` - Local testing guide
- `PRODUCTION_TRANSFER_ENDPOINTS.md` - API endpoint documentation

---

## 🎯 **Success Criteria**

### **Phase 1: Authentication (Immediate)**
- [ ] Obtain correct OAuth endpoint from NIBSS
- [ ] Successfully generate JWT token
- [ ] Verify token works with Name Enquiry API
- [ ] Document complete authentication flow

### **Phase 2: Configuration (Short-term)**
- [ ] Obtain FMFB Biller ID (UUID)
- [ ] Confirm IP whitelisting status
- [ ] Verify Direct Debit profiling completion
- [ ] Update all environment variables

### **Phase 3: Integration (Medium-term)**
- [ ] Name Enquiry API working
- [ ] Fund Transfer API working
- [ ] Transaction Status Query working
- [ ] Balance Enquiry working
- [ ] Error handling comprehensive
- [ ] Production credentials obtained

### **Phase 4: Production (Long-term)**
- [ ] Complete NIBSS certification
- [ ] Production environment configured
- [ ] VPN setup completed (if required)
- [ ] Go-live approval from NIBSS
- [ ] Production monitoring in place

---

## 📊 **Configuration Completeness**

**Current Status: 70% Complete**

| Category | Items | Complete | Percentage |
|----------|-------|----------|------------|
| **Basic Config** | 7 | 7/7 | 100% ✅ |
| **Institution Config** | 3 | 2/3 | 67% ⚠️ |
| **Network Config** | 2 | 1/2 | 50% ⚠️ |
| **Authentication** | 3 | 0/3 | 0% ❌ |
| **VPN Setup** | 5 | 5/5 | 100% ✅ |
| **OVERALL** | 20 | 15/20 | **75%** |

**Missing Items:**
1. ❌ FMFB Biller ID (UUID)
2. ❌ OAuth endpoint path
3. ⚠️ IP whitelisting confirmation
4. ❌ JWT token generation
5. ❌ API authentication working

---

## 🔗 **Quick Reference Links**

- **NIBSS Support:** https://contactcentre.nibss-plc.com.ng/support/home
- **Technical Email:** technicalimplementation@nibss-plc.com.ng
- **Certification Email:** certification@nibss-plc.com.ng
- **Technical Contact:** Eseoghene Charles-Adeoye (eawe@nibss-plc.com.ng)
- **Phone:** +234 802 874 0677

---

## 📅 **Timeline**

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Contact NIBSS Support | Week of Oct 8 | ⏳ Pending |
| Receive OAuth Endpoint | Week of Oct 15 | ⏳ Pending |
| Receive Biller ID | Week of Oct 15 | ⏳ Pending |
| Complete Authentication | Week of Oct 22 | ⏳ Pending |
| Integration Testing | Week of Oct 29 | ⏳ Pending |
| Production Credentials | Week of Nov 5 | ⏳ Pending |
| Production Go-Live | Week of Nov 12 | ⏳ Pending |

---

**Last Updated:** October 8, 2025
**Next Review:** After NIBSS support response
**Document Owner:** OrokiiPay Development Team
**Priority:** 🔴 Critical - Blocking Phase 2B (NIBSS Production Integration)