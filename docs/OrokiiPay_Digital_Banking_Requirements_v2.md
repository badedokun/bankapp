# OrokiiPay Multi-Tenant Digital Banking Platform
## Complete Requirements Document v2.0

**Document Version:** 2.0
**Date:** October 8, 2025
**Status:** AUTHORITATIVE - Replaces legacy PoS requirements
**Product Evolution:** PoS System (legacy) → Digital Banking Platform (current)
**Prepared by:** OrokiiPay Product & Engineering Team

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 2025 | Legacy Team | Initial PoS system requirements |
| 2.0 | October 2025 | Product Team | Complete rewrite for digital banking platform |

**Distribution:**
- OrokiiPay Executive Team
- Development Team (All)
- FMFB Stakeholders
- Compliance Team
- Regulatory Consultants

---

# SECTION 1: EXECUTIVE SUMMARY

## 1.1 Product Vision

**OrokiiPay** is a world-class, AI-powered, multi-tenant digital banking platform designed specifically for the Nigerian banking sector. Built on a modern React Native + Web architecture with database-per-tenant isolation, OrokiiPay enables banks and microfinance institutions to offer comprehensive digital banking services to their customers through a single, unified platform.

**Mission:** Democratize access to digital banking in Nigeria by providing banks with enterprise-grade technology at SaaS economics.

**Value Proposition:**
- **For Banks:** Launch digital banking in days, not years (₦50K-₦500K/month vs ₦500M+ traditional core banking)
- **For Customers:** World-class banking experience with AI assistance, multi-language support, and 24/7 availability
- **For Platform:** Scalable SaaS model serving 100+ banks, 1M+ end customers, processing ₦100B+ monthly

## 1.2 Product Evolution: PoS → Digital Banking

**Historical Context:**

OrokiiPay started as a Point-of-Sale (PoS) agent banking application in early 2024. Through market feedback and strategic pivoting, the platform evolved into a comprehensive digital banking solution by mid-2025.

**Evolution Timeline:**
```
Q1 2024: PoS Agent Banking App (v0.1)
├─ PoS terminal management
├─ Agent float operations
└─ Cash withdrawal services

Q2-Q3 2024: Pivot to Digital Banking (v0.5)
├─ Digital account opening
├─ Internal transfers
└─ Basic savings products

Q4 2024 - Q1 2025: Multi-Tenant Platform (v0.8)
├─ Multi-tenant architecture
├─ NIBSS NIP integration
├─ AI-powered features
└─ Comprehensive loan system

Q2 2025: Enterprise Digital Banking (v1.0+)
├─ 70% feature completion
├─ FMFB production deployment
├─ Advanced compliance features
└─ World-class UI/UX (98.2% theme compliance)
```

**This Document:**
- ✅ Reflects current digital banking reality
- ✅ Removes legacy PoS requirements
- ✅ Incorporates 20 partial features (13% → 100%)
- ✅ Provides roadmap to 100% completion

## 1.3 Business Objectives

### Primary Objectives (2025-2027)

**Year 1 (2025):**
1. Achieve 100% platform completion (currently 70%)
2. Onboard 10 tenant banks (currently 1: FMFB)
3. Process ₦10B+ in monthly transaction volume
4. Generate ₦100M+ in annual revenue
5. Achieve CBN microfinance bank license compliance

**Year 2 (2026):**
1. Scale to 50 tenant banks
2. Reach 100K+ active bank customers
3. Process ₦50B+ monthly transaction volume
4. Generate ₦500M+ annual revenue
5. Launch advanced AI features (Phase 2)

**Year 3 (2027):**
1. Scale to 100+ tenant banks across Nigeria
2. Reach 1M+ active customers
3. Process ₦100B+ monthly transaction volume
4. Generate ₦1B+ annual revenue
5. Expand to West African markets

### Strategic Objectives

**Market Leadership:**
- Become the #1 multi-tenant digital banking platform in Nigeria
- Capture 30% of microfinance bank digital banking market
- Establish technology leadership in AI-powered banking

**Product Excellence:**
- Maintain 98%+ theme compliance (world-class UI)
- Achieve 99.9% platform uptime SLA
- <3 second transaction processing
- 90%+ customer satisfaction score

**Compliance Excellence:**
- 100% CBN regulatory compliance
- NDIC deposit insurance compliance
- NFIU AML/CFT compliance
- IFRS 9 financial reporting compliance

## 1.4 Target Market

### Primary Market: Nigerian Banking Sector

**Target Customer Segments:**

**1. Microfinance Banks (Primary - 60% of market)**
- 900+ microfinance banks in Nigeria
- Need: Digital banking without ₦500M+ core banking investment
- OrokiiPay Fit: Perfect - enterprise features at SaaS pricing
- Example: FMFB (First Microfinance Bank) - current tenant

**2. Tier-2 Commercial Banks (Secondary - 25% of market)**
- Mid-size banks needing digital innovation
- Need: Modern digital channels + mobile-first experience
- OrokiiPay Fit: Strong - multi-tenant scalability

**3. Fintech Companies (Tertiary - 15% of market)**
- Digital-first financial services
- Need: Banking-as-a-Service infrastructure
- OrokiiPay Fit: Good - API-first architecture

### Geographic Focus

**Phase 1 (2025):** Nigeria (all 36 states + FCT)
**Phase 2 (2026):** West Africa (Ghana, Kenya pilot)
**Phase 3 (2027):** Pan-African expansion

### Market Size & Opportunity

**Total Addressable Market (TAM):**
- 900 microfinance banks × ₦2M average subscription = ₦1.8B/year
- 50M unbanked Nigerians × ₦500 onboarding fee = ₦25B opportunity
- ₦500T annual Nigerian banking transactions × 0.1% fee = ₦500B/year

**Serviceable Available Market (SAM):**
- 300 digitally-ready MFBs × ₦3M subscription = ₦900M/year
- 10M digital banking customers × ₦100 annual fees = ₦1B/year

**Serviceable Obtainable Market (SOM - 3 years):**
- 100 tenant banks × ₦3M subscription = ₦300M/year
- 1M customers × ₦500 transaction fees/year = ₦500M/year
- Loan interest revenue share = ₦200M/year
- **Total Year 3 Revenue: ₦1B+**

## 1.5 Success Metrics

### Platform Metrics (Technical Excellence)

**Availability & Performance:**
- Platform uptime: 99.9% SLA (43 minutes downtime/month maximum)
- API response time: <500ms (p95)
- Transaction processing: <3 seconds end-to-end
- Database query performance: <100ms (p95)

**Scalability:**
- Concurrent users: 10,000+ without degradation
- Transaction throughput: 1,000 TPS peak
- Tenant capacity: 100+ banks on single platform instance
- Data volume: 100TB+ multi-tenant data management

**Quality:**
- Code coverage: >85% (4-layer testing framework)
- Bug density: <1 critical bug per 10,000 lines of code
- Security vulnerabilities: 0 high/critical severity
- Theme compliance: >98% (world-class UI/UX)

### Business Metrics (Commercial Success)

**Revenue Metrics:**
- Monthly Recurring Revenue (MRR): Track monthly
- Annual Recurring Revenue (ARR): Year 1 target ₦100M
- Average Revenue Per Tenant (ARPT): ₦3M/year
- Customer Acquisition Cost (CAC): <₦50K per tenant
- Lifetime Value (LTV): >₦50M per tenant (LTV:CAC = 1000:1)

**Customer Metrics:**
- Tenant count: Year 1 = 10, Year 2 = 50, Year 3 = 100
- Customer churn: <5% annually
- Net Promoter Score (NPS): >60
- Customer satisfaction (CSAT): >90%

**Transaction Metrics:**
- Transaction volume: ₦10B/month Year 1 → ₦100B/month Year 3
- Transaction count: 1M/month Year 1 → 10M/month Year 3
- Transaction success rate: >99%
- Average transaction value: ₦10,000

### Compliance Metrics (Regulatory Excellence)

**CBN Compliance:**
- Capital adequacy ratio (CAR): >10% (per tenant bank)
- Liquidity ratio: >20%
- Large exposure limit: <20% of capital
- Monthly returns: 100% on-time submission

**NDIC Compliance:**
- Deposit insurance premium: 100% timely payment
- Monthly deposit returns: 100% accuracy
- Insured deposit ratio: 100% coverage

**NFIU/AML Compliance:**
- Suspicious Transaction Reports (STR): <24 hours filing
- Currency Transaction Reports (CTR): 100% automated
- KYC compliance: 100% customer verification
- Transaction monitoring: 100% coverage with AI

**IFRS 9 Compliance:**
- Loan provisioning accuracy: 100% ECL methodology
- PAR tracking: Real-time PAR 30/60/90
- NPL classification: 100% automated per CBN standards

---

# SECTION 2: PRODUCT OVERVIEW

## 2.1 OrokiiPay Digital Banking Platform

### What OrokiiPay Is

**OrokiiPay is a multi-tenant, AI-powered digital banking platform that enables banks to offer comprehensive digital banking services to their customers.**

**Not a PoS System:**
OrokiiPay is NOT a Point-of-Sale (PoS) agent banking system. While the platform has PoS heritage (early 2024), it has fully evolved into a comprehensive digital banking solution.

**Key Characteristics:**

**1. Multi-Tenant SaaS Architecture**
- Database-per-tenant isolation (compliance-grade)
- Shared application layer (cost efficiency)
- Tenant-specific branding and configuration
- Self-service tenant onboarding

**2. Comprehensive Digital Banking**
- Personal savings accounts (Tier 1/2/3)
- Fixed deposit products
- Personal and business loans
- Internal and external transfers (NIBSS NIP)
- Bill payments (electricity, cable TV, airtime)
- Transaction history and statements

**3. AI-Powered Intelligence**
- Conversational banking assistant
- Multi-language support (English, Pidgin, Hausa, Yoruba, Igbo)
- Real-time fraud detection
- AI credit scoring
- Predictive analytics

**4. World-Class User Experience**
- 98.2% theme compliance across platform
- Responsive design (mobile-first, web-compatible)
- Accessibility features (screen readers, high contrast)
- Offline-first architecture for unreliable networks

**5. Enterprise Security & Compliance**
- Zero Trust Architecture
- Multi-factor authentication (SMS OTP, biometric)
- End-to-end encryption (AES-256-GCM)
- CBN, NDIC, NFIU, IFRS 9 compliance

## 2.2 Platform Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT BANKS                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  FMFB    │  │ Bank #2  │  │ Bank #3  │  │ Bank #N  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└───────┼─────────────┼─────────────┼─────────────┼─────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼──────────────────────────┐
        │   OrokiiPay Platform Layer             │
        │   (Multi-Tenant API Gateway)           │
        │   - Tenant detection & routing         │
        │   - JWT authentication                 │
        │   - Rate limiting                      │
        └─────────────┬──────────────────────────┘
                      │
        ┌─────────────▼──────────────────────────┐
        │   Application Services Layer           │
        │   ┌────────────┐  ┌────────────┐      │
        │   │ Auth       │  │ Transfers  │      │
        │   │ Service    │  │ Service    │      │
        │   └────────────┘  └────────────┘      │
        │   ┌────────────┐  ┌────────────┐      │
        │   │ Loan       │  │ Savings    │      │
        │   │ Service    │  │ Service    │      │
        │   └────────────┘  └────────────┘      │
        └─────────────┬──────────────────────────┘
                      │
        ┌─────────────▼──────────────────────────┐
        │   Data Layer (Multi-Tenant)            │
        │   ┌────────────────────────────────┐   │
        │   │ Platform Database              │   │
        │   │ - Tenants registry             │   │
        │   │ - Global configuration         │   │
        │   └────────────────────────────────┘   │
        │   ┌──────────┐ ┌──────────┐ ┌──────┐  │
        │   │ FMFB DB  │ │ Bank2 DB │ │BankN │  │
        │   │ (Tenant) │ │ (Tenant) │ │ (DB) │  │
        │   └──────────┘ └──────────┘ └──────┘  │
        └────────────────────────────────────────┘
```

### Technology Stack Summary

**Frontend:**
- React Native 0.81.1 (iOS, Android native apps)
- React Native Web 0.19+ (Progressive Web App)
- Redux Toolkit + React Query (state management)
- Dynamic theming (tenant-specific branding)

**Backend:**
- Node.js 18+ with Express 5.1.0
- PostgreSQL 15+ (database-per-tenant)
- Redis 7+ (caching, session management)
- JWT authentication with role-based access

**Infrastructure:**
- Google Cloud Platform (GCP)
- Kubernetes orchestration
- Docker containerization
- Terraform infrastructure-as-code

**AI/ML:**
- OpenAI GPT-4 (conversational AI)
- TensorFlow (fraud detection, credit scoring)
- Custom Nigerian language models

**Integrations:**
- NIBSS NIP (interbank transfers)
- BVN validation (NIBSS)
- Credit Bureau (CRC)
- Biller aggregators

## 2.3 Key Differentiators

### What Makes OrokiiPay Unique

**1. True Multi-Tenancy (Unlike Competitors)**

| Feature | OrokiiPay | Traditional Core Banking | Competitors |
|---------|-----------|-------------------------|-------------|
| Deployment | Single platform, 100+ banks | Per-bank deployment | Limited multi-tenancy |
| Cost | ₦50K-₦500K/month | ₦500M+ capex | ₦5M-₦50M/month |
| Time to Launch | 24 hours | 12-24 months | 3-6 months |
| Data Isolation | Database-per-tenant | Single database | Schema-per-tenant |
| Compliance | Built-in (CBN, NDIC, NFIU) | Custom implementation | Partial |

**2. AI-Native Platform (First in Nigeria)**
- Conversational banking in 5 Nigerian languages
- Real-time fraud detection (>95% accuracy)
- AI credit scoring (instant loan decisions)
- Predictive cash flow analytics

**3. World-Class User Experience**
- 98.2% theme compliance (professional audit)
- Mobile-first, offline-capable
- <3 second transaction processing
- Accessibility features (WCAG 2.1 AA)

**4. Developer-Friendly Architecture**
- Single React Native codebase (web + mobile)
- 4-layer testing framework (85%+ coverage)
- Comprehensive API documentation
- Modern tech stack (not legacy COBOL)

**5. Nigerian Market Optimization**
- NIBSS NIP integration (interbank transfers)
- Multi-language support (English, Pidgin, local languages)
- Low-bandwidth optimization (works on 2G)
- Local payment methods (USSD, bank transfer, cards)

## 2.4 Current Implementation Status

### Overall Completion: 70%

**Completed Modules (✅ 100%):**
- Multi-tenant architecture
- User authentication (JWT + MFA)
- Account management (Tier 1/2/3)
- Internal transfers
- NIBSS NIP integration
- Bill payments (airtime, electricity, cable TV)
- Basic savings products
- Basic loan products
- Transaction history
- Tenant theming and branding

**Partially Implemented (🟡 13% - Target: 100%):**
- Loan lifecycle management (restructuring, write-offs, provisioning)
- Regulatory reporting (CBN, NDIC, NFIU, IFRS)
- Multi-level approval workflows
- GL posting and batch operations
- Account lien management
- Treasury operations
- Financial reporting (balance sheet, trial balance)
- Portfolio analytics (PAR tracking)
- NPL management workflows
- [+11 more features - see Section 14 for complete list]

**Planned (❌ Not Started - 17%):**
- International transfers
- Card management (debit/credit)
- Investment products
- Insurance products
- Agent banking module (future)

### Production Deployments

**Current Production Tenant:**
- **FMFB (First Microfinance Bank)** - Live since August 2025
  - 5,000+ active customers
  - ₦500M+ monthly transaction volume
  - 99.8% uptime (better than SLA)

**Pilot Tenants:**
- 3 microfinance banks in testing phase
- Expected go-live: November 2025

---

# SECTION 3: USER PERSONAS & ROLES

## 3.1 Platform Users (Multi-Tenant Roles)

### 3.1.1 Platform Administrator

**Role:** OrokiiPay platform owner/operator (cross-tenant access)

**Responsibilities:**
- Tenant onboarding and management
- Platform monitoring and performance
- System configuration and updates
- Global analytics and reporting
- Incident management and support

**Access Level:** Global (all tenants)

**Key Features:**
- Platform Admin Dashboard (P1-006)
- Tenant Management UI (P1-008)
- Platform Analytics Dashboard (P1-010)
- Billing Management (P1-012)
- System Configuration

**Technical Skills:** High (DevOps, system administration)

**User Journey:**
```
1. Login to platform admin portal
2. Monitor platform health across all tenants
3. Onboard new tenant bank
4. Configure tenant-specific settings
5. Generate platform-wide analytics
6. Manage billing and subscriptions
7. Handle escalated support tickets
```

### 3.1.2 Compliance Specialist (Platform Level)

**Role:** Regulatory compliance oversight across all tenants

**Responsibilities:**
- Regulatory report validation
- Compliance monitoring
- Audit trail review
- AML/CFT oversight
- License compliance verification

**Access Level:** Read-only across tenants

**Key Features:**
- Regulatory Reports Dashboard (PF-002)
- AML Transaction Monitoring (PF-013)
- Compliance Alerts System
- Audit Trail Viewer

---

## 3.2 Bank Users (Tenant-Specific Roles)

### 3.2.1 Bank Administrator

**Role:** Bank-level administrator (tenant admin)

**Organization:** FMFB, Bank #2, Bank #3, etc.

**Responsibilities:**
- Bank user management (create account officers, managers)
- Bank configuration and branding
- Transaction limit configuration
- Approval workflow setup
- Bank-level analytics and reporting

**Access Level:** Full access within tenant

**Key Features:**
- Bank Admin Dashboard
- User Management (create/edit/deactivate users)
- Role & Permissions Management
- Branding Configuration (logo, colors, theme)
- Transaction Limits Configuration
- Approval Workflow Builder
- Bank Analytics Dashboard

**User Journey:**
```
1. Login to bank admin portal (fmfb.orokiipay.com)
2. Review daily transaction summary
3. Create new account officer user
4. Configure approval workflow for loans >₦100K
5. Update transaction limits for Tier 2 customers
6. Generate monthly regulatory reports
7. Review and approve pending loan applications
```

**Typical Profile:**
- Name: Adebayo Ogunleye (Bank Operations Manager)
- Organization: FMFB
- Experience: 10+ years banking
- Tech Savvy: Medium
- Daily Usage: 4-6 hours

### 3.2.2 Account Officer

**Role:** Front-line bank staff serving customers

**Responsibilities:**
- Customer account opening (KYC verification)
- Customer support and issue resolution
- Transaction assistance
- Loan application processing
- Account upgrades (Tier 1 → Tier 2 → Tier 3)

**Access Level:** Customer read/write within assigned portfolio

**Key Features:**
- Customer Management Dashboard
- Account Opening Workflow
- KYC Document Verification
- Transaction History Viewer
- Loan Application Review
- Customer Support Chat
- Dispute Resolution

**User Journey:**
```
1. Customer walks into bank branch
2. Account officer logs into OrokiiPay portal
3. Initiates account opening workflow
4. Uploads customer KYC documents (BVN, ID, utility bill)
5. AI verifies documents in <2 minutes
6. Account created with Tier 1 limits
7. Issues welcome SMS to customer
8. Assists customer with first mobile app login
```

**Typical Profile:**
- Name: Chioma Nwosu (Customer Service Officer)
- Organization: FMFB
- Experience: 3 years banking
- Tech Savvy: Medium-High
- Daily Usage: 8 hours

### 3.2.3 Bank Manager

**Role:** Branch or bank-level management

**Responsibilities:**
- Team supervision (account officers)
- Approval workflows (loans, reversals, write-offs)
- Performance monitoring
- Risk management
- Customer escalations

**Access Level:** Read all customers, approve high-value transactions

**Key Features:**
- Manager Dashboard (team performance)
- Approval Queue (loans, reversals, write-offs)
- Portfolio Analytics
- Risk Monitoring Dashboard
- Team Performance Metrics

**User Journey:**
```
1. Login to manager portal
2. Review pending approvals queue (5 loan applications)
3. Review loan application for ₦500K (AI credit score: 720)
4. Check customer credit history
5. Approve loan with conditions
6. Review team performance (10 account officers)
7. Generate branch performance report
```

**Typical Profile:**
- Name: Ibrahim Yusuf (Branch Manager)
- Organization: FMFB
- Experience: 15 years banking
- Tech Savvy: Medium
- Daily Usage: 2-4 hours

---

## 3.3 End Customers (Bank Account Holders)

### 3.3.1 Customer - Tier 1 (Basic Account)

**Profile:** Entry-level digital banking customer

**KYC Requirements:**
- BVN (Bank Verification Number)
- Phone number
- Email (optional)

**Transaction Limits (CBN Guidelines):**
- Daily transaction limit: ₦50,000
- Single transaction limit: ₦50,000
- Cumulative balance: ₦300,000
- Monthly transaction volume: ₦200,000

**Available Features:**
- Account opening (digital)
- Internal transfers
- Airtime purchase
- Account balance inquiry
- Transaction history (30 days)

**User Journey:**
```
1. Download OrokiiPay app (fmfb.orokiipay.com)
2. Enter phone number → receive OTP
3. Enter BVN for verification
4. Create 4-digit PIN
5. Setup biometric (fingerprint/face)
6. Account opened in <3 minutes
7. Make first transfer (₦5,000)
8. Check balance via AI assistant
```

**Typical Profile:**
- Name: Ngozi Okafor
- Age: 25
- Occupation: Trader
- Banking Experience: First digital bank account
- Tech Savvy: Low-Medium
- Usage: 10-15 transactions/month

### 3.3.2 Customer - Tier 2 (Standard Account)

**Profile:** Verified customer with higher limits

**Additional KYC Requirements (beyond Tier 1):**
- Government-issued ID (National ID, Driver's License, Passport)
- Utility bill (proof of address)
- Passport photograph

**Transaction Limits:**
- Daily transaction limit: ₦200,000
- Single transaction limit: ₦200,000
- Cumulative balance: ₦1,000,000
- Monthly transaction volume: Unlimited

**Available Features (All Tier 1 + ):**
- External transfers (NIBSS NIP)
- Bill payments (electricity, cable TV, internet)
- Savings products (target savings, flexible savings)
- Personal loans (up to ₦100,000)
- Transaction history (1 year)
- Standing orders
- Transaction statements (PDF, email)

**User Journey:**
```
1. Existing Tier 1 customer visits branch
2. Account officer upgrades to Tier 2
3. Uploads additional KYC documents
4. AI verifies documents
5. Tier 2 activated in <10 minutes
6. Customer can now transfer to other banks (NIBSS)
7. Applies for ₦50,000 personal loan
8. AI credit score: 680 → loan approved in <5 minutes
```

**Typical Profile:**
- Name: Emeka Obi
- Age: 35
- Occupation: SME owner (electronics retailer)
- Banking Experience: 5 years traditional banking
- Tech Savvy: Medium-High
- Usage: 50+ transactions/month

### 3.3.3 Customer - Tier 3 (Premium Account)

**Profile:** High-value, fully verified customer

**Additional KYC Requirements (beyond Tier 2):**
- Reference letter from employer/business
- 6 months bank statements
- Tax identification number (TIN)
- Business registration (for business customers)

**Transaction Limits:**
- Daily transaction limit: ₦1,000,000
- Single transaction limit: ₦1,000,000
- Cumulative balance: Unlimited
- Monthly transaction volume: Unlimited

**Available Features (All Tier 1 & 2 + ):**
- Business loans (up to ₦5,000,000)
- Fixed deposits
- Investment products (future)
- Priority customer support
- Dedicated account officer
- Transaction history (unlimited)
- Customized alerts and reports
- API access (for business integration - future)

**User Journey:**
```
1. Tier 2 customer requests Tier 3 upgrade
2. Submits business documents
3. Account officer verifies documents
4. Branch manager approves upgrade
5. Tier 3 activated
6. Customer applies for ₦2M business loan
7. AI credit score + manual review
8. Loan approved with repayment plan
9. Funds disbursed in <24 hours
```

**Typical Profile:**
- Name: Adeola Adeyemi
- Age: 42
- Occupation: Business owner (fashion retail)
- Banking Experience: 10+ years
- Tech Savvy: High
- Usage: 200+ transactions/month, ₦5M+ monthly volume

### 3.3.4 Corporate Customer (Business Banking)

**Profile:** Business entities (SMEs, corporations)

**KYC Requirements:**
- CAC registration documents
- Tax identification number (TIN)
- Board resolution
- Directors' identification
- Business proof of address
- Financial statements (last 2 years)

**Transaction Limits:**
- Customized per business (₦10M+ daily)
- Multi-user access (up to 10 users per business)
- Maker-checker approval workflows

**Available Features:**
- Corporate accounts
- Bulk payments (salary, vendor payments)
- Multi-user access with roles
- Advanced reporting and reconciliation
- API integration (future)
- Treasury services (future)

**User Journey:**
```
1. Business submits corporate account application
2. Account officer collects and uploads documents
3. Compliance team verifies (2-5 days)
4. Bank manager approves
5. Corporate account created
6. Admin user onboarded
7. Admin creates additional users (accountant, cashier)
8. Processes bulk salary payment (50 employees)
9. Generates monthly transaction report
```

**Typical Profile:**
- Company: Graceland Enterprises Ltd
- Industry: Manufacturing
- Employees: 50
- Monthly Transaction Volume: ₦20M+
- Tech Savvy: High (dedicated IT staff)

---

## 3.4 Role-Based Access Control (RBAC)

### Permission Matrix

| Feature | Platform Admin | Bank Admin | Account Officer | Bank Manager | Customer T1 | Customer T2 | Customer T3 | Corporate |
|---------|----------------|------------|-----------------|--------------|-------------|-------------|-------------|-----------|
| **Account Management** |
| Open Account | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upgrade Account Tier | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Close Account | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Transactions** |
| Internal Transfer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| External Transfer (NIBSS) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Bill Payment | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Bulk Payments | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Transaction Reversal | ✅ | ✅ | Request | Approve | Request | Request | Request | Approve |
| **Loans** |
| Apply for Loan | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Approve Loan | ✅ | ✅ | <₦50K | >₦50K | ❌ | ❌ | ❌ | Maker-Checker |
| Loan Restructuring | ✅ | ✅ | Request | Approve | ❌ | ❌ | ❌ | ❌ |
| Loan Write-Off | ✅ | ✅ | ❌ | Approve | ❌ | ❌ | ❌ | ❌ |
| **Reports** |
| Transaction History | ✅ | ✅ | ✅ | ✅ | 30d | 1yr | Unlimited | Unlimited |
| Account Statement | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Regulatory Reports | ✅ | ✅ | ❌ | View | ❌ | ❌ | ❌ | ❌ |
| **Administration** |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Admin Only |
| Tenant Configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Platform Analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access
- ❌ No access
- View = Read-only access
- Request = Can request, needs approval
- Approve = Can approve requests
- Maker-Checker = Multi-level approval required

---

# SECTION 4: FUNCTIONAL REQUIREMENTS

## 4.1 Account Management

### 4.1.1 Digital Account Opening

**Description:** End-to-end digital account creation with KYC verification

**User Stories:**

**US-4.1.1.1: Customer Self-Service Account Opening (Tier 1)**
```
As a: New customer (unbanked Nigerian)
I want to: Open a bank account using just my phone
So that: I can access digital banking services in <5 minutes

Acceptance Criteria:
- Customer provides phone number and receives OTP
- Customer enters BVN for verification
- System validates BVN with NIBSS (automated)
- Customer creates 4-digit PIN
- Customer setup biometric (fingerprint or face ID)
- Account created with Tier 1 limits
- Welcome SMS sent to customer
- Account number generated (10 digits)
- Process completes in <3 minutes

Technical Requirements:
- Integration: NIBSS BVN validation API
- Security: PIN encrypted with AES-256-GCM
- Performance: <10 seconds BVN validation
- Offline: Queue account creation if offline, sync when online

Database Schema:
- Table: accounts
- Fields: id, account_number, customer_id, tier, status, created_at
```

**US-4.1.1.2: Account Officer Assisted Account Opening (Tier 2/3)**
```
As an: Account Officer
I want to: Create customer account with KYC document upload
So that: Customer can access higher transaction limits

Acceptance Criteria:
- Account officer enters customer details (name, phone, email, BVN)
- Uploads ID document (National ID, Driver's License, or Passport)
- Uploads utility bill (proof of address)
- AI verifies document authenticity (<2 minutes)
- Account officer reviews AI verification results
- Manager approval required for Tier 3
- Account created with appropriate tier limits
- Customer receives account details via SMS

Technical Requirements:
- AI/ML: Document OCR and verification (PF-016)
- Approval: Multi-level approval workflow (PF-003)
- Storage: Encrypted document storage (S3/GCS)
```

### 4.1.2 Account Tiers and Limits

**Tier Structure (CBN Guidelines):**

| Tier | KYC Requirements | Daily Limit | Balance Limit | Features |
|------|------------------|-------------|---------------|----------|
| **Tier 1** | BVN + Phone | ₦50,000 | ₦300,000 | Internal transfers, airtime |
| **Tier 2** | Tier 1 + ID + Utility Bill | ₦200,000 | ₦1,000,000 | External transfers, loans, savings |
| **Tier 3** | Tier 2 + Employer Ref + TIN | ₦1,000,000 | Unlimited | Business loans, fixed deposits, priority support |

**Tier Upgrade Workflow:**

```typescript
interface TierUpgradeRequest {
  customerId: string;
  currentTier: 1 | 2 | 3;
  targetTier: 1 | 2 | 3;
  documents: {
    idDocument?: File;        // Required for T1→T2
    utilityBill?: File;       // Required for T1→T2
    employerReference?: File; // Required for T2→T3
    tinCertificate?: File;    // Required for T2→T3
    bankStatements?: File[];  // Required for T2→T3 (6 months)
  };
  requestedBy: string; // Account officer or customer
  requestedAt: Date;
}

interface TierUpgradeApproval {
  requestId: string;
  approvedBy: string; // Account officer (T1→T2) or Manager (T2→T3)
  approvalLevel: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  aiVerificationScore?: number; // AI document verification score (0-100)
}
```

### 4.1.3 Account Status Management

**Account Statuses:**

```typescript
type AccountStatus =
  | 'active'           // Normal operations
  | 'dormant'          // No transactions in 6+ months
  | 'frozen'           // Temporarily suspended by bank
  | 'blocked'          // Blocked due to fraud/security
  | 'closed'           // Permanently closed
  | 'pending_closure'; // Closure requested, pending approval

interface AccountStatusChange {
  accountId: string;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  changedBy: string;      // User ID who made the change
  reason: string;         // Mandatory reason for status change
  approvalRequired: boolean;
  approvedBy?: string;    // Manager approval for sensitive changes
  effectiveDate: Date;
  reactivationDate?: Date; // For temporary blocks/freezes
}
```

**Status Transition Rules:**

```
active → dormant (automatic after 6 months inactivity)
active → frozen (manager action, fraud alert)
active → blocked (security system, AML alert)
active → pending_closure (customer request)
pending_closure → closed (manager approval)
frozen → active (manager action, issue resolved)
blocked → active (compliance approval, investigation complete)
dormant → active (customer initiates transaction)
closed → NOT REVERSIBLE (new account required)
```

### 4.1.4 Account Statements

**Statement Generation:**

**US-4.1.4.1: Customer Requests Account Statement**
```
As a: Customer (Tier 2/3)
I want to: Download account statement for specific date range
So that: I can track my transactions and income (for loan applications, tax purposes)

Acceptance Criteria:
- Customer selects date range (max 1 year)
- Customer selects format (PDF or CSV)
- Statement includes: account details, opening balance, transactions, closing balance
- PDF includes bank logo and customer details
- Statement generated in <30 seconds
- Statement sent to customer email
- Statement available for download in app

Technical Requirements:
- PDF Generation: PDFKit or Puppeteer
- Email: SendGrid or similar
- Storage: Temporary S3 storage (24-hour expiry)
- Performance: Async generation for large statements (>1000 transactions)
```

**Statement Format (PDF):**

```
┌────────────────────────────────────────────────────┐
│  [BANK LOGO]           FMFB                        │
│                  Account Statement                 │
│                                                    │
│  Account Name: Emeka Obi                          │
│  Account Number: 1234567890                       │
│  Period: January 1, 2025 - January 31, 2025      │
│  Generated: February 1, 2025                      │
├────────────────────────────────────────────────────┤
│  Opening Balance:                    ₦150,000.00  │
├────────────────────────────────────────────────────┤
│  Date      | Description    | Debit   | Credit   │
│  Jan 5     | Transfer to... | 10,000  |          │
│  Jan 10    | Salary credit  |         | 50,000   │
│  Jan 15    | NEPA bill      | 5,000   |          │
│  ...       | ...            | ...     | ...      │
├────────────────────────────────────────────────────┤
│  Total Debit:                        ₦85,000.00   │
│  Total Credit:                       ₦120,000.00  │
│  Closing Balance:                    ₦185,000.00  │
└────────────────────────────────────────────────────┘
```

### 4.1.5 Account Lien Management (Partial Feature #5)

**Status:** 🟡 Partially Implemented → ✅ 100% (Week 12-13)

**Description:** Ability to place holds/liens on customer accounts for loan securitization

**US-4.1.5.1: Place Account Lien for Loan**
```
As a: Bank Manager
I want to: Place a lien on customer savings account
So that: Loan is secured by customer's savings

Acceptance Criteria:
- Manager selects customer account
- Specifies lien amount (cannot exceed account balance)
- Links lien to loan application
- Lien prevents withdrawal beyond (balance - lien amount)
- Customer can still make deposits
- Customer sees lien details in app
- Lien automatically released when loan fully repaid
- Audit trail of all lien operations

Technical Requirements:
- Database: account_liens table (PF-005)
- Validation: Real-time balance checking before transactions
- Automation: Lien release on loan repayment completion
- Notifications: SMS alert to customer when lien placed/released
```

**Database Schema (PF-005):**

```sql
CREATE TABLE account_liens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  lien_amount DECIMAL(15,2) NOT NULL,
  lien_type VARCHAR(50) NOT NULL, -- 'loan_security', 'legal_order', 'administrative'
  reference_type VARCHAR(50), -- 'loan', 'court_order', null
  reference_id UUID, -- Loan ID if loan_security
  status VARCHAR(20) NOT NULL, -- 'active', 'released', 'expired'
  placed_by UUID NOT NULL REFERENCES users(id),
  placed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_by UUID REFERENCES users(id),
  released_at TIMESTAMP,
  release_reason TEXT,
  expiry_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id),
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_placed_by FOREIGN KEY (placed_by) REFERENCES users(id),
  CONSTRAINT fk_released_by FOREIGN KEY (released_by) REFERENCES users(id)
);

-- Index for fast lien checking during transactions
CREATE INDEX idx_account_liens_active
ON account_liens(account_id, status)
WHERE status = 'active';

-- Function to get available balance (balance - liens)
CREATE OR REPLACE FUNCTION get_available_balance(p_account_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_balance DECIMAL(15,2);
  v_total_liens DECIMAL(15,2);
BEGIN
  SELECT balance INTO v_balance FROM accounts WHERE id = p_account_id;
  SELECT COALESCE(SUM(lien_amount), 0) INTO v_total_liens
  FROM account_liens
  WHERE account_id = p_account_id AND status = 'active';

  RETURN v_balance - v_total_liens;
END;
$$ LANGUAGE plpgsql;
```

---

## 4.2 Transaction Processing

### 4.2.1 Internal Transfers (Same Bank)

**Description:** Real-time transfers between accounts within same tenant bank (free, instant)

**US-4.2.1.1: Customer Initiates Internal Transfer**
```
As a: Customer (any tier)
I want to: Transfer money to another customer in my bank
So that: I can send money to family/friends instantly for free

Acceptance Criteria:
- Customer enters recipient account number
- System validates recipient exists (same bank)
- System displays recipient name for confirmation
- Customer enters amount (subject to tier limits)
- Customer enters optional narration (up to 100 characters)
- Customer authorizes with PIN or biometric
- Transfer processed in <3 seconds
- Both parties receive SMS confirmation
- Transaction appears in history immediately
- Transaction is reversible within 24 hours (with approval)

Technical Requirements:
- Validation: Real-time balance checking
- Security: PIN/biometric verification
- Performance: <3 seconds end-to-end
- Atomicity: Database transaction (sender debit + recipient credit)
- Audit: Full audit trail with IP, device, location
- Notifications: SMS via Termii or similar
```

**Internal Transfer Flow:**

```typescript
interface InternalTransferRequest {
  senderAccountId: string;
  recipientAccountNumber: string; // 10 digits
  amount: number;                 // In Naira
  narration?: string;             // Optional, max 100 chars
  pin?: string;                   // 4-digit PIN (encrypted)
  biometric?: BiometricData;      // Fingerprint or face ID
  deviceInfo: {
    deviceId: string;
    ipAddress: string;
    location?: GeoLocation;
  };
}

interface InternalTransferResponse {
  success: boolean;
  transactionId: string;
  reference: string;              // Unique transaction reference
  status: 'completed' | 'pending' | 'failed';
  senderBalance: number;          // New balance after debit
  message: string;
  timestamp: Date;
}

// Backend validation and processing
async function processInternalTransfer(
  request: InternalTransferRequest,
  tenantId: string
): Promise<InternalTransferResponse> {

  // 1. Validate sender account exists and is active
  const senderAccount = await getAccount(request.senderAccountId, tenantId);
  if (!senderAccount || senderAccount.status !== 'active') {
    throw new Error('Invalid sender account');
  }

  // 2. Validate recipient account exists in same tenant
  const recipientAccount = await getAccountByNumber(
    request.recipientAccountNumber,
    tenantId
  );
  if (!recipientAccount || recipientAccount.status !== 'active') {
    throw new Error('Invalid recipient account');
  }

  // 3. Validate sender has sufficient available balance
  const availableBalance = await getAvailableBalance(request.senderAccountId);
  if (availableBalance < request.amount) {
    throw new Error('Insufficient balance');
  }

  // 4. Validate transaction within sender tier limits
  const tierLimits = getTierLimits(senderAccount.tier);
  if (request.amount > tierLimits.singleTransactionLimit) {
    throw new Error(`Amount exceeds tier limit of ₦${tierLimits.singleTransactionLimit}`);
  }

  // 5. Verify PIN or biometric
  const authValid = await verifyAuthentication(
    request.senderAccountId,
    request.pin,
    request.biometric
  );
  if (!authValid) {
    throw new Error('Invalid PIN or biometric');
  }

  // 6. AI fraud detection check
  const fraudScore = await AIFraudService.assessTransaction({
    accountId: request.senderAccountId,
    amount: request.amount,
    recipientId: recipientAccount.id,
    deviceInfo: request.deviceInfo,
    transactionType: 'internal_transfer',
  });

  if (fraudScore > 0.8) {
    // Block high-risk transaction
    await createSecurityAlert({
      accountId: request.senderAccountId,
      alertType: 'fraud_detection',
      fraudScore,
      transactionDetails: request,
    });
    throw new Error('Transaction blocked for security review');
  }

  // 7. Process transaction (atomic database transaction)
  const transaction = await db.transaction(async (trx) => {
    // Debit sender
    await trx('accounts')
      .where({ id: request.senderAccountId })
      .decrement('balance', request.amount);

    // Credit recipient
    await trx('accounts')
      .where({ id: recipientAccount.id })
      .increment('balance', request.amount);

    // Create transaction record
    const txnRecord = await trx('transactions').insert({
      tenant_id: tenantId,
      reference: generateTxnReference(tenantId),
      type: 'internal_transfer',
      sender_account_id: request.senderAccountId,
      recipient_account_id: recipientAccount.id,
      amount: request.amount,
      fee: 0, // Internal transfers are free
      narration: request.narration,
      status: 'completed',
      device_info: request.deviceInfo,
      fraud_score: fraudScore,
      completed_at: new Date(),
    }).returning('*');

    return txnRecord[0];
  });

  // 8. Send notifications (async, non-blocking)
  await Promise.all([
    sendSMS({
      to: senderAccount.phone,
      message: `Debit: ₦${request.amount}. Recipient: ${recipientAccount.name}. Balance: ₦${senderAccount.balance - request.amount}. Ref: ${transaction.reference}`,
    }),
    sendSMS({
      to: recipientAccount.phone,
      message: `Credit: ₦${request.amount}. From: ${senderAccount.name}. Balance: ₦${recipientAccount.balance + request.amount}. Ref: ${transaction.reference}`,
    }),
  ]);

  // 9. Return success response
  return {
    success: true,
    transactionId: transaction.id,
    reference: transaction.reference,
    status: 'completed',
    senderBalance: senderAccount.balance - request.amount,
    message: 'Transfer successful',
    timestamp: transaction.completed_at,
  };
}
```

### 4.2.2 External Transfers (NIBSS NIP)

**Description:** Interbank transfers via Nigeria Inter-Bank Settlement System (NIBSS)

**Status:** ✅ Implemented (currently in production for FMFB)

**US-4.2.2.1: Customer Initiates External Transfer**
```
As a: Customer (Tier 2/3)
I want to: Transfer money to account in another bank
So that: I can pay suppliers, family members who bank elsewhere

Acceptance Criteria:
- Customer selects "Transfer to Other Bank"
- Enters recipient account number (10 digits)
- Selects recipient bank from list (all Nigerian banks)
- System performs name inquiry via NIBSS (shows recipient name)
- Customer confirms recipient name
- Enters amount (₦10 minimum, subject to tier limits)
- Transaction fee displayed (₦10-₦50 based on amount)
- Customer authorizes with PIN/biometric
- Transaction processed via NIBSS NIP in <30 seconds
- Customer receives transaction receipt
- Both parties receive SMS notifications
- Transaction is traceable via NIBSS reference

Technical Requirements:
- Integration: NIBSS NIP API (production)
- Security: Encrypted channel (TLS 1.3)
- Performance: <30 seconds end-to-end
- Retry: Auto-retry on timeout (max 3 attempts)
- Fallback: Offline queue if NIBSS unavailable
- Monitoring: Real-time NIBSS status monitoring
```

**NIBSS NIP Integration Architecture:**

```typescript
interface NIBSSTransferRequest {
  senderAccount: string;          // Sender account number
  recipientAccount: string;       // Recipient account number (10 digits)
  recipientBankCode: string;      // CBN bank code (3 digits)
  amount: number;                 // Amount in Naira (kobo * 100)
  narration: string;              // Transaction narration
  originatorName: string;         // Sender name
  sessionId: string;              // Unique session identifier
  channelCode: string;            // '1' for mobile, '2' for web
}

interface NIBSSNameInquiryResponse {
  responseCode: string;           // '00' = success
  accountName: string;            // Recipient account name
  accountNumber: string;
  bankCode: string;
  sessionId: string;
}

interface NIBSSTransferResponse {
  responseCode: string;           // '00' = success, others = failure
  responseDescription: string;
  nibssReference: string;         // NIBSS unique reference
  amount: number;
  sessionId: string;
}

// NIBSS Service Implementation
class NIBSSService {
  private baseUrl: string = process.env.NIBSS_NIP_URL;
  private institutionCode: string = process.env.NIBSS_INSTITUTION_CODE; // Bank-specific
  private encryptionKey: string = process.env.NIBSS_ENCRYPTION_KEY;

  // Name inquiry (verify recipient before transfer)
  async nameInquiry(
    accountNumber: string,
    bankCode: string
  ): Promise<NIBSSNameInquiryResponse> {
    const request = {
      sessionId: generateSessionId(),
      destinationInstitutionCode: bankCode,
      accountNumber: accountNumber,
      channelCode: '1', // Mobile
    };

    // Encrypt request
    const encryptedRequest = this.encrypt(request);

    // Send to NIBSS
    const response = await axios.post(
      `${this.baseUrl}/name-inquiry`,
      encryptedRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Institution-Code': this.institutionCode,
        },
        timeout: 15000, // 15 seconds
      }
    );

    // Decrypt and return response
    return this.decrypt(response.data);
  }

  // Process transfer
  async processTransfer(
    request: NIBSSTransferRequest
  ): Promise<NIBSSTransferResponse> {
    // Encrypt request
    const encryptedRequest = this.encrypt(request);

    // Send to NIBSS
    const response = await axios.post(
      `${this.baseUrl}/transfer`,
      encryptedRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Institution-Code': this.institutionCode,
        },
        timeout: 30000, // 30 seconds
      }
    );

    // Decrypt and return response
    return this.decrypt(response.data);
  }

  // Encryption helper
  private encrypt(data: any): string {
    // AES-256 encryption with NIBSS key
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decryption helper
  private decrypt(encrypted: string): any {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}
```

**Transaction Fee Structure:**

```typescript
const NIBSS_FEE_STRUCTURE = {
  // OrokiiPay platform fees (charged to customer)
  platformFees: {
    tier1: 0,      // Tier 1 cannot make external transfers
    tier2: {
      '0-5000': 10,        // ₦10 fee for transfers up to ₦5,000
      '5001-50000': 25,    // ₦25 fee for ₦5,001 - ₦50,000
      '50001+': 50,        // ₦50 fee for ₦50,001+
    },
    tier3: {
      '0-5000': 10,
      '5001-50000': 25,
      '50001+': 50,
    },
  },

  // NIBSS charges (paid by OrokiiPay to NIBSS)
  nibssCharges: {
    '0-5000': 10,
    '5001-50000': 25,
    '50001+': 50,
  },
};

function calculateNIBSSFee(amount: number, tier: number): number {
  if (tier === 1) return 0; // Tier 1 cannot transfer externally

  const tierFees = NIBSS_FEE_STRUCTURE.platformFees[`tier${tier}`];

  if (amount <= 5000) return tierFees['0-5000'];
  if (amount <= 50000) return tierFees['5001-50000'];
  return tierFees['50001+'];
}
```

### 4.2.3 Bill Payments

**Description:** Pay utility bills (electricity, cable TV, internet, airtime)

**Status:** ✅ Implemented (production for FMFB)

**Supported Billers:**

**Electricity:**
- EKEDC (Eko Electricity Distribution Company)
- IKEDC (Ikeja Electric)
- AEDC (Abuja Electricity Distribution Company)
- PHED (Port Harcourt Electricity Distribution)
- KEDCO (Kano Electricity Distribution Company)
- [+20 more DISCOs across Nigeria]

**Cable TV:**
- DSTV
- GOtv
- Startimes

**Internet:**
- Smile Telecoms
- Spectranet
- Swift

**Airtime:**
- MTN
- Airtel
- Glo
- 9mobile

**US-4.2.3.1: Customer Pays Electricity Bill**
```
As a: Customer (Tier 2/3)
I want to: Pay my electricity bill using my account
So that: I don't have to visit payment centers or use physical cash

Acceptance Criteria:
- Customer selects "Pay Bill" → "Electricity"
- Selects electricity company (e.g., EKEDC)
- Enters meter number (11 digits)
- System validates meter number (name inquiry)
- Displays customer name and address for confirmation
- Enters amount (minimum ₦500)
- Transaction fee displayed (₦0-₦100 biller-dependent)
- Customer authorizes with PIN/biometric
- Payment processed in <10 seconds
- Customer receives e-receipt
- Token sent via SMS (for prepaid meters)
- Transaction appears in history

Technical Requirements:
- Integration: Biller aggregator API (Quickteller, Flutterwave Bills)
- Validation: Real-time meter number verification
- Performance: <10 seconds end-to-end
- Retry: Auto-retry on timeout
- Notifications: SMS with token (prepaid) or receipt (postpaid)
```

**Bill Payment Architecture:**

```typescript
interface BillPaymentRequest {
  customerId: string;
  billerCategory: 'electricity' | 'cable_tv' | 'internet' | 'airtime';
  billerCode: string;             // Biller identifier (e.g., 'EKEDC')
  customerReference: string;      // Meter number, smartcard number, phone number
  amount: number;
  pin?: string;
  biometric?: BiometricData;
}

interface BillPaymentResponse {
  success: boolean;
  reference: string;
  token?: string;                 // For prepaid electricity
  receiptNumber?: string;
  message: string;
  billerResponse: any;
}

// Bill payment service (using aggregator)
class BillPaymentService {
  private aggregatorUrl: string = process.env.BILL_AGGREGATOR_URL;
  private apiKey: string = process.env.BILL_AGGREGATOR_API_KEY;

  // Validate customer reference (meter number, smartcard, etc.)
  async validateCustomer(
    billerCode: string,
    customerReference: string
  ): Promise<{ valid: boolean; customerName: string; address?: string }> {
    const response = await axios.post(
      `${this.aggregatorUrl}/validate`,
      {
        billerCode,
        customerReference,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return {
      valid: response.data.responseCode === '00',
      customerName: response.data.customerName,
      address: response.data.customerAddress,
    };
  }

  // Process bill payment
  async processPayment(
    request: BillPaymentRequest
  ): Promise<BillPaymentResponse> {
    // 1. Validate customer balance
    const account = await getAccount(request.customerId);
    if (account.balance < request.amount) {
      throw new Error('Insufficient balance');
    }

    // 2. Validate customer reference
    const validation = await this.validateCustomer(
      request.billerCode,
      request.customerReference
    );
    if (!validation.valid) {
      throw new Error('Invalid customer reference');
    }

    // 3. Debit customer account
    await db('accounts')
      .where({ id: request.customerId })
      .decrement('balance', request.amount);

    // 4. Send payment to biller
    const billerResponse = await axios.post(
      `${this.aggregatorUrl}/payment`,
      {
        billerCode: request.billerCode,
        customerReference: request.customerReference,
        amount: request.amount,
        reference: generateTxnReference(),
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    // 5. Extract token (for prepaid electricity)
    const token = billerResponse.data.token;

    // 6. Send SMS with token
    if (token) {
      await sendSMS({
        to: account.phone,
        message: `Electricity token: ${token}. Amount: ₦${request.amount}. Ref: ${billerResponse.data.reference}`,
      });
    }

    // 7. Return success
    return {
      success: true,
      reference: billerResponse.data.reference,
      token,
      message: 'Payment successful',
      billerResponse: billerResponse.data,
    };
  }
}
```

### 4.2.4 Transaction Reversals (Partial Feature - PHASE 2A)

**Status:** 🟡 Partially Implemented → ✅ 100% (Phase 2A: Weeks 17-20)

**Description:** Ability to reverse erroneous transactions with approval workflow

**US-4.2.4.1: Customer Requests Transaction Reversal**
```
As a: Customer
I want to: Request reversal of an erroneous transaction
So that: I can recover funds sent to wrong account

Acceptance Criteria:
- Customer selects transaction from history
- Clicks "Request Reversal"
- Provides reason for reversal
- Reversal request submitted to bank
- Account officer reviews request
- Manager approves reversal (if valid)
- Reversal processed (original transaction reversed)
- Both parties notified (sender and recipient)
- Funds returned to sender account
- Full audit trail maintained

Technical Requirements:
- Approval workflow: Multi-level (PF-003)
- Reversal types: Full reversal, partial reversal
- Time limit: Within 24 hours of transaction
- Notification: SMS/email to both parties
- Audit: Complete reversal audit trail
```

**Reversal Workflow:**

```
Customer Request → Account Officer Review → Manager Approval → System Execution
     ↓                     ↓                      ↓                    ↓
  Pending          Under Review             Approved             Completed
                        ↓                      ↓                    ↓
                   (May Reject)           (May Reject)        (Irreversible)
```

**Database Schema (PHASE 2A):**

```sql
CREATE TABLE transaction_reversals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  original_transaction_id UUID NOT NULL REFERENCES transactions(id),
  reversal_type VARCHAR(50) NOT NULL, -- 'full', 'partial'
  reversal_amount DECIMAL(15,2) NOT NULL,
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  executed_at TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- 'pending', 'under_review', 'approved', 'rejected', 'completed'
  rejection_reason TEXT,
  reversal_transaction_id UUID REFERENCES transactions(id), -- Generated when reversal executed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4.3 Savings Products

### 4.3.1 Regular Savings Account

**Description:** Standard savings account with interest (automatically created on account opening)

**Features:**
- Unlimited deposits
- Unlimited withdrawals (subject to tier limits)
- Monthly interest calculation (prorated daily)
- Interest credited monthly (last day of month)
- Minimum balance: ₦0

**Interest Calculation:**

```typescript
interface SavingsInterestConfig {
  annualInterestRate: number;  // e.g., 5% p.a. (tenant-configurable)
  interestFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually';
  minimumBalanceForInterest: number; // e.g., ₦1,000
  compounding: boolean;        // True = compound interest
}

// Calculate daily interest (accrued, paid monthly)
function calculateDailyInterest(
  balance: number,
  annualRate: number,
  daysInYear: number = 365
): number {
  const dailyRate = annualRate / daysInYear;
  return balance * dailyRate;
}

// Example: ₦100,000 balance, 5% annual rate
// Daily interest = 100,000 * (0.05 / 365) = ₦13.70 per day
// Monthly interest (30 days) = ₦13.70 * 30 = ₦411
```

### 4.3.2 Target Savings (Goal-Based Savings)

**Description:** Savings plan with specific goal and timeline

**US-4.3.2.1: Customer Creates Target Savings Goal**
```
As a: Customer (Tier 2/3)
I want to: Create a savings goal for specific purpose
So that: I can save towards rent, school fees, business capital, etc.

Acceptance Criteria:
- Customer creates target savings goal
- Provides goal name (e.g., "Rent for 2026")
- Sets target amount (e.g., ₦500,000)
- Sets target date (e.g., December 31, 2025)
- Optionally sets auto-debit schedule (weekly, monthly)
- System calculates recommended savings amount
- Customer makes initial deposit
- Goal created and tracked in dashboard
- Progress notifications sent (25%, 50%, 75%, 100%)
- Withdrawal restricted until goal reached or maturity

Technical Requirements:
- Database: target_savings table
- Automation: Scheduled auto-debit (cron job)
- Notifications: SMS on milestones
- Withdrawal: Locked until maturity or goal reached
```

**Target Savings Schema:**

```sql
CREATE TABLE target_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  goal_name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE NOT NULL,
  auto_debit_enabled BOOLEAN DEFAULT false,
  auto_debit_amount DECIMAL(15,2),
  auto_debit_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  auto_debit_day INTEGER,           -- Day of week (1-7) or month (1-31)
  status VARCHAR(20) NOT NULL,      -- 'active', 'completed', 'cancelled', 'matured'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  matured_at TIMESTAMP,
  interest_rate DECIMAL(5,2),       -- Optional interest (tenant-configurable)
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id),
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Track deposits to target savings
CREATE TABLE target_savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_savings_id UUID NOT NULL REFERENCES target_savings(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'interest'
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  narration TEXT
);
```

### 4.3.3 Flexible Savings

**Description:** Lock-and-unlock savings with penalty-free withdrawals

**Features:**
- Lock funds for specific period (7 days, 30 days, 90 days)
- Higher interest rate than regular savings
- Penalty-free withdrawal after lock period
- Early withdrawal allowed with penalty (forfeit interest)
- Automatic rollover option

**Example:**
```
Customer deposits ₦100,000 in 90-day flexible savings
Interest rate: 8% p.a. (vs 5% regular savings)
After 90 days: ₦100,000 + (₦100,000 × 0.08 × 90/365) = ₦101,973
Early withdrawal (Day 30): ₦100,000 (principal only, interest forfeited)
```

### 4.3.4 Fixed Deposit

**Description:** High-interest savings with fixed term and no withdrawals

**Features:**
- Fixed term: 3 months, 6 months, 12 months
- Higher interest rate (10-15% p.a.)
- No withdrawals until maturity
- Early termination penalty (50-100% interest forfeit)
- Automatic renewal option
- Certificate of deposit issued

**US-4.3.4.1: Customer Creates Fixed Deposit**
```
As a: Customer (Tier 3)
I want to: Create fixed deposit for 1 year
So that: I can earn higher interest on savings I don't need immediately

Acceptance Criteria:
- Customer selects "Fixed Deposit"
- Chooses term (3, 6, or 12 months)
- Views interest rate for selected term
- Enters deposit amount (minimum ₦50,000)
- Views maturity date and total expected return
- Confirms deposit
- Funds locked until maturity
- Certificate of deposit generated
- SMS confirmation sent
- At maturity, principal + interest credited to account
- Customer notified 7 days before maturity

Technical Requirements:
- Database: fixed_deposits table
- Automation: Maturity processing (daily cron job)
- Notifications: Maturity reminder (7 days before)
- Certificate: PDF generation
```

**Fixed Deposit Schema:**

```sql
CREATE TABLE fixed_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  term_months INTEGER NOT NULL, -- 3, 6, 12
  start_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  maturity_amount DECIMAL(15,2) NOT NULL, -- Principal + interest
  status VARCHAR(20) NOT NULL,   -- 'active', 'matured', 'terminated'
  auto_renew BOOLEAN DEFAULT false,
  matured_at TIMESTAMP,
  certificate_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id),
  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

**Interest Rate Matrix (Tenant-Configurable):**

| Term | Interest Rate (p.a.) |
|------|----------------------|
| 3 months | 10% |
| 6 months | 12% |
| 12 months | 15% |

---

## 4.4 Loan Products

### 4.4.1 Personal Loans

**Description:** Unsecured personal loans for salaried workers and self-employed

**Loan Characteristics:**
- Loan amount: ₦10,000 - ₦500,000 (based on credit score)
- Interest rate: 18-36% p.a. (risk-based pricing)
- Tenor: 1-12 months
- Repayment: Monthly installments
- Security: Unsecured (no collateral)
- Credit check: AI credit scoring + Credit Bureau (CRC)

**US-4.4.1.1: Customer Applies for Personal Loan**
```
As a: Customer (Tier 2/3)
I want to: Apply for personal loan online
So that: I can access quick funds without visiting bank

Acceptance Criteria:
- Customer selects "Apply for Loan" → "Personal Loan"
- Enters loan amount (₦10K - ₦500K)
- Selects repayment period (1-12 months)
- System shows interest rate and monthly repayment
- Customer uploads supporting documents (optional: salary slip, bank statement)
- AI credit scoring runs in background (<5 minutes)
- Loan decision: Instant approval, manual review, or rejection
- If approved, loan agreement generated
- Customer signs agreement (e-signature)
- Funds disbursed to account in <1 hour (instant approval) or <24 hours (manual review)

Technical Requirements:
- AI/ML: Credit scoring model (fraud detection, income estimation)
- Integration: Credit Bureau (CRC) - credit history check
- Approval: Auto-approval <₦50K, manual review >₦50K
- Disbursement: Instant (credit customer account)
- Contract: PDF loan agreement with e-signature
```

**AI Credit Scoring:**

```typescript
interface CreditScoringInput {
  customerId: string;
  loanAmount: number;
  loanTenor: number; // months
  transactionHistory: Transaction[]; // Last 6 months
  savingsHistory: SavingsTransaction[];
  employmentInfo?: {
    employerName: string;
    monthlySalary: number;
    employmentDuration: number; // months
  };
  creditBureauReport?: CreditBureauReport;
}

interface CreditScoringOutput {
  creditScore: number;          // 0-1000 (higher = better)
  riskCategory: 'low' | 'medium' | 'high' | 'very_high';
  approvalRecommendation: 'approve' | 'manual_review' | 'reject';
  maxLoanAmount: number;        // AI-recommended max amount
  recommendedInterestRate: number; // Risk-based pricing
  factors: {
    transactionVolume: number;  // Score 0-100
    savingsPattern: number;     // Score 0-100
    employmentStability: number; // Score 0-100
    creditHistory: number;      // Score 0-100
    fraudRisk: number;          // Score 0-100
  };
}

// AI Credit Scoring Service
class AICreditScoringService {
  async scoreCustomer(input: CreditScoringInput): Promise<CreditScoringOutput> {
    // 1. Analyze transaction history
    const transactionScore = this.analyzeTransactions(input.transactionHistory);

    // 2. Analyze savings behavior
    const savingsScore = this.analyzeSavings(input.savingsHistory);

    // 3. Employment stability
    const employmentScore = this.analyzeEmployment(input.employmentInfo);

    // 4. Credit Bureau check
    const creditHistoryScore = await this.checkCreditBureau(input.customerId);

    // 5. Fraud risk assessment
    const fraudScore = await this.assessFraudRisk(input);

    // 6. Calculate composite credit score
    const creditScore = (
      transactionScore * 0.25 +
      savingsScore * 0.20 +
      employmentScore * 0.25 +
      creditHistoryScore * 0.20 +
      (100 - fraudScore) * 0.10 // Lower fraud score = better
    ) * 10; // Scale to 0-1000

    // 7. Determine risk category
    const riskCategory = this.getRiskCategory(creditScore);

    // 8. Approval recommendation
    const approvalRecommendation = this.getApprovalRecommendation(
      creditScore,
      input.loanAmount
    );

    // 9. Calculate max loan amount and interest rate
    const maxLoanAmount = this.calculateMaxLoanAmount(creditScore, input);
    const recommendedInterestRate = this.calculateInterestRate(riskCategory);

    return {
      creditScore,
      riskCategory,
      approvalRecommendation,
      maxLoanAmount,
      recommendedInterestRate,
      factors: {
        transactionVolume: transactionScore,
        savingsPattern: savingsScore,
        employmentStability: employmentScore,
        creditHistory: creditHistoryScore,
        fraudRisk: fraudScore,
      },
    };
  }

  private getRiskCategory(score: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 750) return 'low';
    if (score >= 600) return 'medium';
    if (score >= 400) return 'high';
    return 'very_high';
  }

  private getApprovalRecommendation(
    score: number,
    amount: number
  ): 'approve' | 'manual_review' | 'reject' {
    if (score < 400) return 'reject';
    if (score >= 700 && amount <= 50000) return 'approve'; // Auto-approve
    if (score >= 600) return 'manual_review';
    return 'reject';
  }

  private calculateInterestRate(riskCategory: string): number {
    const rates = {
      low: 18,        // 18% p.a.
      medium: 24,     // 24% p.a.
      high: 30,       // 30% p.a.
      very_high: 36,  // 36% p.a.
    };
    return rates[riskCategory];
  }
}
```

### 4.4.2 Quick Loans (Instant Approval)

**Description:** Small, short-term loans with instant AI approval

**Loan Characteristics:**
- Loan amount: ₦5,000 - ₦50,000 (AI-determined)
- Interest rate: 5-10% flat (not p.a.)
- Tenor: 7-30 days (short-term)
- Repayment: Lump sum or 2 installments
- Approval: 100% automated (AI + rules engine)
- Disbursement: Instant (<2 minutes)

**Quick Loan Flow:**

```
Customer Request (₦20K, 30 days)
        ↓
AI Credit Score (720/1000)
        ↓
Auto-Approval (₦20K approved)
        ↓
E-Agreement Signed
        ↓
Instant Disbursement (<2 min)
        ↓
Auto-Debit Repayment (on due date)
```

### 4.4.3 Business Loans

**Description:** Larger loans for SME business owners (Tier 3 customers)

**Loan Characteristics:**
- Loan amount: ₦100,000 - ₦5,000,000
- Interest rate: 15-28% p.a. (risk-based)
- Tenor: 6-36 months
- Security: May require collateral or lien on savings
- Approval: Manual review required
- Disbursement: 1-3 business days after approval

**US-4.4.3.1: Business Owner Applies for Business Loan**
```
As a: Customer (Tier 3, business owner)
I want to: Apply for business loan to expand my retail shop
So that: I can purchase more inventory and grow my business

Acceptance Criteria:
- Customer selects "Business Loan"
- Enters loan amount (₦100K - ₦5M)
- Uploads business documents (CAC, TIN, financial statements)
- AI analyzes business performance
- Loan officer reviews application manually
- Branch manager approves (>₦500K) or head office approves (>₦2M)
- Loan agreement signed (physical or e-signature)
- Collateral registered (if required)
- Funds disbursed in 1-3 days
- Repayment via standing order (monthly)

Technical Requirements:
- Approval workflow: Multi-level (PF-003)
- Document storage: Encrypted S3/GCS
- Collateral: Account lien integration (PF-005)
- Disbursement: Scheduled (not instant)
```

### 4.4.4 Loan Lifecycle Management (Partial Feature #1 - CRITICAL)

**Status:** 🟡 Partially Implemented → ✅ 100% (Week 11-13)

**Description:** Complete loan lifecycle from disbursement to write-off

**Missing Components (Current Gap):**

**4.4.4.1 Loan Restructuring**

**Description:** Modify loan terms for customers facing repayment difficulties

**US-4.4.4.1: Customer Requests Loan Restructuring**
```
As a: Customer with active loan
I want to: Request restructuring of my loan (extend tenor, reduce installment)
So that: I can avoid default due to temporary financial difficulty

Acceptance Criteria:
- Customer requests restructuring on loan
- Provides reason (job loss, business loss, health issue, etc.)
- Proposes new repayment plan
- Account officer reviews request
- Manager approves restructuring
- New loan agreement generated
- Loan terms updated (new tenor, new installment)
- Customer notified
- Restructuring recorded in CBN reports

Technical Requirements:
- Database: loan_restructurings table (PF-001)
- Approval: Multi-level workflow (PF-003)
- Calculation: Recalculate amortization schedule
- Reporting: CBN restructured loans report (PF-002)
```

**Database Schema (PF-001):**

```sql
CREATE TABLE loan_restructurings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id),
  restructuring_reason TEXT NOT NULL,
  original_tenor INTEGER NOT NULL,
  new_tenor INTEGER NOT NULL,
  original_monthly_payment DECIMAL(15,2) NOT NULL,
  new_monthly_payment DECIMAL(15,2) NOT NULL,
  original_maturity_date DATE NOT NULL,
  new_maturity_date DATE NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4.4.4.2 Loan Write-Offs**

**Description:** Write off bad loans (NPLs) after all recovery efforts exhausted

**US-4.4.4.2: Bank Manager Writes Off Non-Performing Loan**
```
As a: Bank Manager
I want to: Write off loan that customer cannot repay
So that: We can clean up our balance sheet and comply with CBN regulations

Acceptance Criteria:
- Manager selects loan for write-off
- Loan must be >180 days overdue (CBN guideline)
- Provides write-off reason and justification
- Head office approves write-off
- Loan status updated to "written_off"
- Customer account credited (removes liability)
- Write-off recorded in GL (expense account)
- Write-off reported to CBN in monthly returns

Technical Requirements:
- Database: loan_write_offs table (PF-001)
- Approval: Head office level (PF-003)
- GL Posting: Debit loan loss expense, Credit loan account (PF-004)
- Reporting: CBN write-offs report (PF-002)
```

**Database Schema (PF-001):**

```sql
CREATE TABLE loan_write_offs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id),
  write_off_amount DECIMAL(15,2) NOT NULL,
  outstanding_principal DECIMAL(15,2) NOT NULL,
  outstanding_interest DECIMAL(15,2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  write_off_reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  written_off_at TIMESTAMP,
  gl_posting_id UUID, -- Link to GL posting (PF-004)
  status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4.4.4.3 IFRS 9 Loan Provisioning**

**Description:** Calculate and record loan provisions per IFRS 9 Expected Credit Loss (ECL)

**IFRS 9 Stages:**

```
Stage 1 (Performing):
- Days overdue: 0-30
- Provision: 1-2% of outstanding
- Classification: Performing loan

Stage 2 (Underperforming):
- Days overdue: 31-90
- Provision: 10-25% of outstanding
- Classification: Loan Under Observation

Stage 3 (Non-Performing):
- Days overdue: 91+
- Provision: 50-100% of outstanding
- Classification: Non-Performing Loan (NPL)
```

**Provisioning Calculation:**

```typescript
interface LoanProvisioningInput {
  loanId: string;
  outstandingPrincipal: number;
  outstandingInterest: number;
  daysOverdue: number;
  creditScore: number;
  collateralValue?: number;
}

interface LoanProvisioningOutput {
  stage: 1 | 2 | 3;
  provisionRate: number;      // Percentage
  provisionAmount: number;    // Amount to provision
  classification: string;
}

function calculateIFRS9Provision(
  input: LoanProvisioningInput
): LoanProvisioningOutput {
  let stage: 1 | 2 | 3;
  let provisionRate: number;
  let classification: string;

  // Determine stage based on days overdue
  if (input.daysOverdue <= 30) {
    stage = 1;
    provisionRate = input.creditScore >= 700 ? 0.01 : 0.02; // 1-2%
    classification = 'Performing';
  } else if (input.daysOverdue <= 90) {
    stage = 2;
    provisionRate = 0.10 + (input.daysOverdue - 31) * 0.0025; // 10-25%
    classification = 'Under Observation';
  } else {
    stage = 3;
    // Adjust provision based on collateral
    const unsecuredAmount = input.collateralValue
      ? Math.max(0, input.outstandingPrincipal - input.collateralValue)
      : input.outstandingPrincipal;

    if (input.daysOverdue > 365) {
      provisionRate = 1.00; // 100% provision
    } else {
      provisionRate = 0.50 + (input.daysOverdue - 91) * 0.0018; // 50-100%
    }
    classification = 'Non-Performing Loan (NPL)';
  }

  const provisionAmount = input.outstandingPrincipal * provisionRate;

  return {
    stage,
    provisionRate,
    provisionAmount,
    classification,
  };
}
```

**Database Schema (PF-001):**

```sql
CREATE TABLE loan_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id),
  provision_date DATE NOT NULL,
  ifrs9_stage INTEGER NOT NULL, -- 1, 2, or 3
  outstanding_principal DECIMAL(15,2) NOT NULL,
  outstanding_interest DECIMAL(15,2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  provision_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0100 = 1%
  provision_amount DECIMAL(15,2) NOT NULL,
  cumulative_provision DECIMAL(15,2) NOT NULL,
  classification VARCHAR(50) NOT NULL, -- 'Performing', 'Under Observation', 'NPL'
  gl_posting_id UUID, -- Link to GL posting (PF-004)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automatically calculate monthly provisions
CREATE OR REPLACE FUNCTION calculate_monthly_loan_provisions(p_tenant_id UUID)
RETURNS TABLE(loan_id UUID, provision_amount DECIMAL(15,2)) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id AS loan_id,
    l.outstanding_principal *
      CASE
        WHEN l.days_overdue <= 30 THEN 0.01
        WHEN l.days_overdue <= 90 THEN 0.10 + (l.days_overdue - 31) * 0.0025
        ELSE LEAST(1.00, 0.50 + (l.days_overdue - 91) * 0.0018)
      END AS provision_amount
  FROM loans l
  WHERE l.tenant_id = p_tenant_id
    AND l.status IN ('active', 'overdue', 'defaulted');
END;
$$ LANGUAGE plpgsql;
```

---

## 4.5 Customer Service & Support

### 4.5.1 In-App Chat Support

**Description:** Real-time customer support via in-app chat

**Features:**
- Live chat with account officers
- Automated chatbot for common questions
- Attachment support (screenshots, documents)
- Chat history

### 4.5.2 AI Banking Assistant

**Description:** Conversational AI assistant for customer queries

**Capabilities:**
- Balance inquiries via voice/text
- Transaction history search
- Bill payment assistance
- Loan information
- Multi-language support (English, Pidgin, Hausa, Yoruba, Igbo)

---

## 4.6 Partial Features - Complete Integration

**This section documents the 20 partially implemented features being completed in Weeks 11-16**

### Summary of Partial Features

| ID | Feature Name | Current % | Target % | Priority | Weeks |
|----|--------------|-----------|----------|----------|-------|
| PF-001 | Loan Lifecycle Management | 40% | 100% | CRITICAL | 11-13 |
| PF-002 | Regulatory Reports | 20% | 100% | CRITICAL | 11-13 |
| PF-003 | Approval Workflows | 50% | 100% | HIGH | 11-13 |
| PF-004 | GL Posting & Batch Ops | 30% | 100% | HIGH | 12-13 |
| PF-005 | Account Lien Management | 0% | 100% | CRITICAL | 12-13 |
| PF-006 | Treasury Operations | 25% | 100% | MEDIUM | 14-15 |
| PF-007 | Batch Customer Upload | 30% | 100% | MEDIUM | 14-15 |
| PF-008 | Financial Reports | 40% | 100% | HIGH | 14-15 |
| PF-009 | Loan Analytics (PAR) | 35% | 100% | HIGH | 15 |
| PF-010 | NPL Workflow System | 30% | 100% | HIGH | 15 |
| PF-011-020 | [Additional features] | Various | 100% | MEDIUM-LOW | 16 |

**Complete details of each partial feature are documented in:**
- `/docs/Partial_Features_Completion_Sprint_Strategy.md` (comprehensive 85-page strategy)
- `/docs/Partial_Features_Sprint_Quick_Reference.md` (executive summary)
- `/docs/Partial_Features_Roadmap_Integration.csv` (project plan)

**Integration with Functional Requirements:**
- All partial features are integrated into this requirements document
- Database schemas provided in relevant sections
- User stories and acceptance criteria defined
- Technical requirements specified

---

# SECTION 5: MULTI-TENANT ARCHITECTURE

**Note:** This section is preserved from the legacy requirements with minor terminology updates (PoS → Banking). The multi-tenant architecture is platform-agnostic and applies equally to digital banking.

## 5.1 Multi-Tenancy Model: Database-Per-Tenant

### Architecture Overview

**OrokiiPay implements a hybrid multi-tenant architecture** combining database-per-tenant for sensitive financial data with shared services for common functionality, adhering to banking industry best practices for data isolation and regulatory compliance.

```typescript
interface MultiTenantArchitecture {
  tenancyModel: 'database-per-tenant';
  dataIsolation: 'complete';              // Each bank has separate database
  serviceIsolation: 'shared-with-context'; // Shared app layer with tenant context
  computeIsolation: 'containerized';       // Kubernetes pods
  networkIsolation: 'tenant-specific';     // Separate VPCs/namespaces
}
```

### Database Architecture

```
┌─────────────────────────────────────────┐
│   OrokiiPay Platform Database          │
│   - Tenant registry                     │
│   - Global configurations               │
│   - Platform-level users                │
│   - Billing & subscriptions             │
│   - Platform analytics                  │
└─────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  FMFB        │  │  Bank #2     │  │  Bank #N     │
│  Database    │  │  Database    │  │  Database    │
│  (Tenant)    │  │  (Tenant)    │  │  (Tenant)    │
│              │  │              │  │              │
│  - accounts  │  │  - accounts  │  │  - accounts  │
│  - txns      │  │  - txns      │  │  - txns      │
│  - loans     │  │  - loans     │  │  - loans     │
│  - users     │  │  - users     │  │  - users     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Tenant Entity Structure

```typescript
interface Tenant {
  id: string;                    // Unique tenant identifier (UUID)
  name: string;                  // Bank name (e.g., "FMFB")
  displayName: string;           // Display name (e.g., "First Microfinance Bank")
  slug: string;                  // URL slug (e.g., "fmfb")
  subdomain: string;             // Subdomain (fmfb.orokiipay.com)
  customDomain?: string;         // Optional custom domain (banking.fmfb.ng)
  status: 'active' | 'suspended' | 'inactive' | 'trial';
  tier: 'starter' | 'professional' | 'enterprise';
  region: string;                // Geographic region (e.g., "nigeria-west")

  // Database configuration
  database: {
    connectionString: string;     // Tenant-specific database
    encryptionKey: string;       // Tenant-specific encryption key
    backupSchedule: string;      // Backup frequency (daily, hourly)
  };

  // Business configuration
  configuration: {
    branding: TenantBranding;
    businessRules: BusinessRules;
    paymentProviders: PaymentProvider[];
    featureFlags: FeatureFlags;
    limits: TransactionLimits;
  };

  // Compliance and regulatory
  compliance: {
    cbnLicenseNumber?: string;
    ndicRegistrationNumber?: string;
    regulatoryRequirements: string[];
    dataRetentionPeriod: number; // days
    auditLevel: 'basic' | 'enhanced' | 'comprehensive';
  };

  // Billing
  billing: {
    subscriptionPlan: 'starter' | 'professional' | 'enterprise';
    monthlyFee: number;
    transactionFeePercentage: number;
    billingCycle: 'monthly' | 'annual';
    paymentMethod: 'bank_transfer' | 'card' | 'invoice';
  };

  createdAt: Date;
  updatedAt: Date;
}
```

## 5.2 Tenant Isolation & Security

### Database-Level Isolation

**Complete Separation:**
- Each tenant has separate PostgreSQL database
- No cross-tenant queries possible
- Independent schema migrations
- Separate backups and restores

**Row-Level Security (RLS) - Defense in Depth:**

```sql
-- Enable RLS on all tenant tables (backup security layer)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Prevent cross-tenant access (if somehow querying wrong DB)
CREATE POLICY tenant_isolation_accounts ON accounts
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_transactions ON transactions
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_loans ON loans
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Application-Level Isolation

**Tenant Context Middleware:**

```typescript
// Tenant detection and context setting
export class TenantMiddleware {
  static async detectAndSetTenant(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Detect tenant from subdomain, domain, or JWT token
      const tenantId = await this.detectTenant(req);

      if (!tenantId) {
        return res.status(400).json({
          error: 'TENANT_REQUIRED',
          message: 'Tenant identification required',
        });
      }

      // 2. Validate tenant exists and is active
      const tenant = await TenantRegistry.getTenant(tenantId);

      if (!tenant || tenant.status !== 'active') {
        return res.status(403).json({
          error: 'TENANT_INACTIVE',
          message: 'Invalid or inactive tenant',
        });
      }

      // 3. Get tenant-specific database connection
      const tenantDb = await DatabaseConnectionManager.getTenantDatabase(tenantId);

      // 4. Set tenant context in request
      req.tenantId = tenantId;
      req.tenant = tenant;
      req.tenantDb = tenantDb;

      // 5. Set database session variable (defense in depth for RLS)
      await tenantDb.query(
        'SET app.current_tenant_id = $1',
        [tenantId]
      );

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({
        error: 'TENANT_MIDDLEWARE_ERROR',
        message: 'Failed to process tenant context',
      });
    }
  }

  static async detectTenant(req: Request): Promise<string | null> {
    // Method 1: Subdomain detection (preferred)
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return await TenantRegistry.getTenantIdBySubdomain(subdomain);
      }
    }

    // Method 2: Custom header
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) return tenantHeader;

    // Method 3: JWT token tenant claim
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.tenantId) {
        return decoded.tenantId;
      }
    }

    return null;
  }
}
```

## 5.3 Tenant Management Service

### Tenant Onboarding

**Self-Service Bank Onboarding:**

```typescript
interface TenantOnboardingRequest {
  bankName: string;
  bankType: 'microfinance' | 'commercial' | 'fintech';
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  businessDetails: {
    cbnLicenseNumber?: string;
    ndicRegistrationNumber?: string;
    cacRegistrationNumber: string;
    taxIdNumber: string;
  };
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
}

class TenantOnboardingService {
  async onboardTenant(
    request: TenantOnboardingRequest
  ): Promise<TenantOnboardingResult> {

    // 1. Validate onboarding request
    await this.validateOnboardingRequest(request);

    // 2. Create tenant record in platform database
    const tenant = await this.createTenantRecord(request);

    // 3. Provision tenant-specific database
    await this.provisionTenantDatabase(tenant.id);

    // 4. Run tenant database migrations
    await this.runTenantMigrations(tenant.id);

    // 5. Seed tenant configuration
    await this.seedTenantConfiguration(tenant.id, request);

    // 6. Create admin user for tenant
    const adminUser = await this.createTenantAdminUser(
      tenant.id,
      request.adminUser
    );

    // 7. Setup subdomain and SSL certificate
    const subdomain = await this.setupTenantSubdomain(tenant);

    // 8. Send welcome email with credentials
    await this.sendWelcomeEmail(tenant, adminUser, subdomain);

    // 9. Create billing subscription
    await this.createBillingSubscription(tenant);

    return {
      success: true,
      tenantId: tenant.id,
      subdomain: subdomain.url,
      adminEmail: adminUser.email,
      message: 'Tenant onboarded successfully',
    };
  }

  private async provisionTenantDatabase(tenantId: string): Promise<void> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_db`;

    // Create database
    await platformDb.query(`CREATE DATABASE ${dbName}`);

    // Grant permissions
    await platformDb.query(`
      GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${DB_USER}
    `);
  }
}
```

## 5.4 Tenant Branding & Theming

### Dynamic Branding System

```typescript
interface TenantBranding {
  // Logo and images
  logoUrl: string;                  // Primary logo
  logoSmallUrl?: string;            // Small logo (mobile header)
  faviconUrl?: string;              // Browser favicon
  splashScreenUrl?: string;         // Mobile app splash screen

  // Colors
  primaryColor: string;             // Main brand color (e.g., #1a365d for GTBank blue)
  secondaryColor?: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;

  // Typography
  fontFamily?: string;              // Custom font (e.g., 'Montserrat')

  // Company info
  companyName: string;
  companyTagline?: string;
  supportEmail: string;
  supportPhone: string;
  website?: string;

  // App customization
  appName?: string;                 // Custom app name (default: bank name)
  welcomeMessage?: string;

  // Email templates
  emailHeader?: string;
  emailFooter?: string;
}

// React Native dynamic theming
export const useTenantTheme = () => {
  const { tenant } = useTenant();

  return useMemo(() => ({
    colors: {
      primary: tenant.branding.primaryColor,
      secondary: tenant.branding.secondaryColor || tenant.branding.primaryColor,
      background: tenant.branding.backgroundColor,
      text: tenant.branding.textColor,
      accent: tenant.branding.accentColor || tenant.branding.primaryColor,
    },
    fonts: {
      regular: tenant.branding.fontFamily || 'System',
    },
    logo: tenant.branding.logoUrl,
  }), [tenant]);
};
```

## 5.5 Tenant Configuration Management

### Business Rules Configuration

```typescript
interface TenantBusinessRules {
  // Transaction limits (per tier)
  transactionLimits: {
    tier1: {
      dailyLimit: number;
      singleTransactionLimit: number;
      monthlyLimit: number;
    };
    tier2: {
      dailyLimit: number;
      singleTransactionLimit: number;
      monthlyLimit: number;
    };
    tier3: {
      dailyLimit: number;
      singleTransactionLimit: number;
      monthlyLimit: number;
    };
  };

  // Interest rates
  interestRates: {
    savings: number;              // Annual rate (e.g., 5%)
    fixedDeposit3M: number;
    fixedDeposit6M: number;
    fixedDeposit12M: number;
    personalLoanMin: number;
    personalLoanMax: number;
  };

  // Fees
  fees: {
    internalTransfer: number;     // Free (0)
    externalTransfer: {
      tier1: number;              // Cannot transfer
      tier2: number;              // ₦10-₦50
      tier3: number;              // ₦10-₦50
    };
    smsNotification: number;      // ₦4 per SMS
    accountMaintenance: {
      tier1: number;              // Free
      tier2: number;              // Free
      tier3: number;              // ₦500/month
    };
  };

  // Approval thresholds
  approvalThresholds: {
    loanApproval: {
      autoApprove: number;        // e.g., <₦50K
      managerApproval: number;    // ₦50K - ₦500K
      headOfficeApproval: number; // >₦500K
    };
    transactionReversal: {
      accountOfficer: number;     // e.g., <₦10K
      managerApproval: number;    // >₦10K
    };
  };

  // Compliance settings
  compliance: {
    kycRequired: boolean;
    bvnRequired: boolean;
    creditBureauCheckRequired: boolean;
    maximumLoanToValueRatio: number; // e.g., 80%
  };
}
```

---

# SECTION 6: TECHNOLOGY STACK

## 6.1 Frontend Technologies

### React Native (Mobile Native Apps)

**Version:** 0.81.1 (current production version)

**Platform Support:**
- iOS 13.4+
- Android 8.0+ (API Level 26+)

**Key Libraries:**

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.81.1",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/stack": "^6.3.17",
    "@reduxjs/toolkit": "^1.9.5",
    "@tanstack/react-query": "^4.29.19",
    "react-native-reanimated": "^3.3.0",
    "react-native-gesture-handler": "^2.12.0",
    "react-native-svg": "^13.10.0",
    "react-native-vector-icons": "^9.2.0",
    "react-native-biometrics": "^3.0.1",
    "axios": "^1.4.0"
  }
}
```

### React Native Web (Progressive Web App)

**Version:** 0.19+

**Features:**
- Single codebase for web and mobile
- Responsive design (mobile-first)
- Progressive Web App (PWA) capabilities
- Offline support (Service Workers)

**Build Configuration:**

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: ['react-native-web'],
          },
        },
      },
    ],
  },
};
```

### State Management

**Redux Toolkit + React Query**

```typescript
// Redux Toolkit for global state
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    user: userReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// React Query for server state
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

## 6.2 Backend Technologies

### Node.js + Express

**Version:** Node.js 18+ LTS, Express 5.1.0

**Server Architecture:**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant middleware (CRITICAL)
app.use(TenantMiddleware.detectAndSetTenant);

// Authentication middleware
app.use(AuthMiddleware.verifyJWT);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/savings', savingsRoutes);
// ... more routes

// Error handling
app.use(ErrorMiddleware.handleErrors);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`OrokiiPay API server running on port ${PORT}`);
});
```

### Database: PostgreSQL 15+

**Multi-Tenant Database Architecture:**

```sql
-- Platform database
CREATE DATABASE orokiipay_platform;

-- Tenant databases (database-per-tenant)
CREATE DATABASE tenant_fmfb_db;
CREATE DATABASE tenant_bank2_db;
CREATE DATABASE tenant_bankN_db;
```

**Connection Pooling:**

```typescript
import { Pool } from 'pg';

class DatabaseConnectionManager {
  private static pools: Map<string, Pool> = new Map();

  static async getTenantPool(tenantId: string): Promise<Pool> {
    if (!this.pools.has(tenantId)) {
      const tenant = await TenantRegistry.getTenant(tenantId);

      const pool = new Pool({
        connectionString: tenant.database.connectionString,
        max: 20,                    // Max connections per tenant
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pools.set(tenantId, pool);
    }

    return this.pools.get(tenantId)!;
  }
}
```

### Caching: Redis 7+

**Use Cases:**
- Session management
- JWT token blacklist
- Rate limiting
- Query result caching
- Real-time data (account balances)

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Tenant-namespaced caching
class TenantCache {
  static async set(
    tenantId: string,
    key: string,
    value: any,
    ttlSeconds: number = 300
  ): Promise<void> {
    const namspacedKey = `tenant:${tenantId}:${key}`;
    await redis.setex(
      namspacedKey,
      ttlSeconds,
      JSON.stringify(value)
    );
  }

  static async get(
    tenantId: string,
    key: string
  ): Promise<any | null> {
    const namspacedKey = `tenant:${tenantId}:${key}`;
    const cached = await redis.get(namspacedKey);
    return cached ? JSON.parse(cached) : null;
  }
}
```

## 6.3 Infrastructure & DevOps

### Cloud Platform: Google Cloud Platform (GCP)

**Services Used:**
- **Compute:** Google Kubernetes Engine (GKE)
- **Database:** Cloud SQL for PostgreSQL
- **Storage:** Google Cloud Storage (GCS)
- **CDN:** Cloud CDN
- **Monitoring:** Cloud Monitoring & Logging
- **Secrets:** Secret Manager

### Container Orchestration: Kubernetes

**Cluster Architecture:**

```yaml
# Production cluster configuration
apiVersion: v1
kind: Namespace
metadata:
  name: orokiipay-production
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orokiipay-api
  namespace: orokiipay-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orokiipay-api
  template:
    metadata:
      labels:
        app: orokiipay-api
    spec:
      containers:
      - name: api
        image: gcr.io/orokiipay/api:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: url
        ports:
        - containerPort: 5000
```

### CI/CD: GitHub Actions

```yaml
name: OrokiiPay CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t gcr.io/orokiipay/api:${{ github.sha }} .
      - name: Push to GCR
        run: |
          docker push gcr.io/orokiipay/api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to GKE
        run: |
          kubectl set image deployment/orokiipay-api \
            api=gcr.io/orokiipay/api:${{ github.sha }}
          kubectl rollout status deployment/orokiipay-api
```

---

# SECTION 7: AI & MACHINE LEARNING

## 7.1 Conversational AI Banking Assistant

### Architecture Overview

**AI Stack:**
- **LLM:** OpenAI GPT-4 Turbo (fine-tuned for Nigerian banking)
- **Voice:** Whisper API (speech-to-text)
- **TTS:** ElevenLabs (text-to-speech with Nigerian accents)
- **NLP:** Custom Nigerian language models

### Multi-Language Support

**Supported Languages:**
1. English (Nigerian)
2. Pidgin English
3. Hausa
4. Yoruba
5. Igbo

**Example Conversational Flow:**

```
User (voice/text): "I wan send 5000 naira give my brother" (Pidgin)

AI Assistant:
- Detects language: Pidgin English
- Parses intent: Money transfer
- Extracts entities: Amount (₦5,000), Recipient (brother)
- Checks recent beneficiaries named "brother"
- Response: "I see say you don send money give Chukwu Obi (080-XXX-XX12)
  last week. Na am you wan send ₦5,000 again?"

User: "Yes"

AI Assistant: Initiates transfer workflow

User confirms with PIN/biometric → Transfer completed
```

## 7.2 AI Credit Scoring

**Model Details:**
- Algorithm: Gradient Boosting (XGBoost)
- Training Data: 100K+ loan applications (anonymized)
- Features: 50+ variables (transaction history, savings patterns, demographics)
- Accuracy: 85% (validated against actual defaults)
- Update Frequency: Monthly retraining

**Features Used:**

```python
CREDIT_SCORING_FEATURES = {
  # Transaction behavior (40% weight)
  'avg_monthly_transaction_volume': float,
  'transaction_frequency': int,
  'transaction_consistency': float,  # Std deviation
  'merchant_diversity': int,

  # Savings behavior (20% weight)
  'avg_monthly_savings': float,
  'savings_consistency': float,
  'has_fixed_deposit': bool,

  # Employment & income (25% weight)
  'estimated_monthly_income': float,
  'income_stability': float,
  'employment_duration_months': int,

  # Credit history (15% weight)
  'previous_loans_count': int,
  'previous_loan_default_rate': float,
  'credit_bureau_score': int,

  # Risk factors (weights)
  'fraud_risk_score': float,
  'age': int,
  'account_age_months': int,
}
```

## 7.3 Real-Time Fraud Detection

**ML Model:**
- Algorithm: Isolation Forest + Neural Network ensemble
- Training: Continuous learning from flagged transactions
- Latency: <500ms per transaction
- False Positive Rate: <2%

**Fraud Signals:**

```typescript
interface FraudDetectionSignals {
  // Transaction anomalies
  unusualAmount: boolean;          // Amount outside normal range
  unusualTime: boolean;            // Transaction at odd hours
  unusualFrequency: boolean;       // Too many transactions
  unusualRecipient: boolean;       // New/suspicious recipient

  // Device anomalies
  newDevice: boolean;              // First time device
  deviceLocationMismatch: boolean; // Device location != user location
  multipleDevices: boolean;        // Multiple devices simultaneously

  // Behavioral anomalies
  typingPatternAnomaly: boolean;   // Different typing rhythm
  navigationPatternAnomaly: boolean; // Unusual app usage pattern

  // Network anomalies
  vpnDetected: boolean;
  proxyDetected: boolean;
  ipReputationLow: boolean;
}

// Real-time fraud scoring
function calculateFraudScore(signals: FraudDetectionSignals): number {
  let score = 0;

  if (signals.unusualAmount) score += 0.15;
  if (signals.unusualTime) score += 0.10;
  if (signals.unusualFrequency) score += 0.15;
  if (signals.unusualRecipient) score += 0.20;
  if (signals.newDevice) score += 0.10;
  if (signals.deviceLocationMismatch) score += 0.15;
  if (signals.multipleDevices) score += 0.10;
  if (signals.vpnDetected) score += 0.05;

  return Math.min(score, 1.0); // Cap at 1.0 (100%)
}

// Fraud decision engine
function handleFraudDecision(score: number): FraudAction {
  if (score < 0.3) return 'allow';              // Low risk
  if (score < 0.6) return 'step_up_auth';       // Medium risk - require OTP
  if (score < 0.8) return 'manual_review';      // High risk - hold for review
  return 'block';                                // Very high risk - block
}
```

---

# SECTION 8: SECURITY & COMPLIANCE

## 8.1 Zero Trust Architecture

**Principles:**
1. Never trust, always verify
2. Assume breach
3. Verify explicitly
4. Use least privileged access
5. Segment access

**Implementation:**

```typescript
// Every API request goes through security layers
Request → TLS 1.3 Encryption
       → Rate Limiting
       → Tenant Isolation
       → JWT Verification
       → Role-Based Access Control (RBAC)
       → Fraud Detection
       → Transaction Processing
```

## 8.2 Authentication & Authorization

### Multi-Factor Authentication (MFA)

**Supported Methods:**
1. SMS OTP (primary)
2. Biometric (fingerprint, face ID)
3. TOTP (future - Google Authenticator)

**MFA Flow:**

```
Login Attempt
    ↓
Username + Password
    ↓
SMS OTP sent
    ↓
User enters OTP
    ↓
Biometric verification (optional)
    ↓
JWT token issued (24h expiry)
```

### JWT Token Structure

```typescript
interface JWTPayload {
  // User identification
  userId: string;
  email: string;
  phoneNumber: string;

  // Tenant context
  tenantId: string;
  tenantSlug: string;

  // Authorization
  role: 'customer' | 'account_officer' | 'manager' | 'admin' | 'platform_admin';
  permissions: string[];

  // Account info
  accountTier: 1 | 2 | 3;
  accountId: string;

  // Token metadata
  iat: number;  // Issued at
  exp: number;  // Expires at (24 hours)
  jti: string;  // JWT ID (for revocation)
}
```

## 8.3 Data Encryption

### Encryption at Rest

**Database:**
- PostgreSQL transparent data encryption (TDE)
- Column-level encryption for sensitive fields (PINs, card numbers)
- Tenant-specific encryption keys

```typescript
// Encrypt sensitive data before storing
class EncryptionService {
  static async encryptPIN(
    pin: string,
    tenantId: string
  ): Promise<string> {
    const key = await this.getTenantEncryptionKey(tenantId);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    let encrypted = cipher.update(pin, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
```

### Encryption in Transit

- **TLS 1.3:** All API communication
- **Certificate Pinning:** Mobile apps
- **HTTPS Everywhere:** Web application

## 8.4 Banking Compliance

### 8.4.1 CBN (Central Bank of Nigeria) Compliance

**Requirements:**

**1. Microfinance Bank Licensing:**
- Minimum capital requirement: ₦200M (unit), ₦1B (state), ₦5B (national)
- Capital Adequacy Ratio (CAR): Minimum 10%
- Liquidity Ratio: Minimum 20%
- Large Exposure Limit: <20% of capital to single borrower

**OrokiiPay Implementation:**

```typescript
// Automated CBN compliance monitoring
class CBNComplianceMonitor {
  async checkCapitalAdequacyRatio(tenantId: string): Promise<ComplianceResult> {
    // CAR = (Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets

    const capital = await this.getTier1AndTier2Capital(tenantId);
    const rwa = await this.getRiskWeightedAssets(tenantId);

    const car = (capital.tier1 + capital.tier2) / rwa;
    const minimumCAR = 0.10; // 10%

    return {
      compliant: car >= minimumCAR,
      actualRatio: car,
      minimumRatio: minimumCAR,
      message: car >= minimumCAR
        ? `CAR of ${(car * 100).toFixed(2)}% meets CBN requirement`
        : `CAR of ${(car * 100).toFixed(2)}% below CBN minimum of 10%`,
    };
  }
}
```

**2. Monthly Returns to CBN:**
- Regulatory returns submission (form MFB01-09)
- Due: 10th of following month
- Automated report generation (PF-002)

### 8.4.2 NDIC (Nigeria Deposit Insurance Corporation) Compliance

**Requirements:**

**1. Deposit Insurance Premium:**
- Premium rate: 0.9% of total deposits per annum
- Payment: Quarterly

**2. Monthly Deposit Returns:**
- Report all customer deposits
- Classify by deposit type (savings, fixed, current)

**OrokiiPay Implementation:**

```sql
-- Automated NDIC deposit reporting (PF-002)
CREATE OR REPLACE FUNCTION generate_ndic_monthly_return(
  p_tenant_id UUID,
  p_month DATE
)
RETURNS TABLE(
  deposit_type VARCHAR,
  number_of_accounts BIGINT,
  total_deposits DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.account_type,
    COUNT(DISTINCT a.id) as number_of_accounts,
    SUM(a.balance) as total_deposits
  FROM accounts a
  WHERE a.tenant_id = p_tenant_id
    AND a.status = 'active'
    AND DATE_TRUNC('month', a.created_at) <= p_month
  GROUP BY a.account_type;
END;
$$ LANGUAGE plpgsql;
```

### 8.4.3 NFIU (Nigerian Financial Intelligence Unit) - AML/CFT Compliance

**Requirements:**

**1. Know Your Customer (KYC):**
- 3-tier KYC structure (implemented: Tier 1/2/3)
- BVN verification mandatory
- ID document verification

**2. Suspicious Transaction Reporting (STR):**
- Report within 24 hours of detection
- AI-powered transaction monitoring

**3. Currency Transaction Reporting (CTR):**
- Report cash transactions ≥₦5M
- Report multiple related transactions ≥₦5M (structuring detection)

**OrokiiPay Implementation:**

```typescript
// AML transaction monitoring (PF-013)
class AMLMonitoringService {
  async monitorTransaction(
    transaction: Transaction
  ): Promise<AMLResult> {
    const alerts: AMLAlert[] = [];

    // 1. Check for large transactions (CTR threshold)
    if (transaction.amount >= 5000000) {
      alerts.push({
        type: 'CTR',
        message: 'Transaction exceeds ₦5M CTR threshold',
        severity: 'medium',
      });
    }

    // 2. Check for structuring (multiple transactions to avoid threshold)
    const relatedTransactions = await this.getRelatedTransactions(
      transaction.accountId,
      24 // hours
    );
    const totalAmount = relatedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    if (totalAmount >= 5000000 && relatedTransactions.length >= 3) {
      alerts.push({
        type: 'STRUCTURING',
        message: 'Possible structuring detected',
        severity: 'high',
      });
    }

    // 3. AI-powered suspicious pattern detection
    const suspiciousScore = await AIFraudService.assessAMLRisk(transaction);

    if (suspiciousScore > 0.7) {
      alerts.push({
        type: 'STR',
        message: 'Suspicious transaction pattern detected',
        severity: 'critical',
      });

      // Auto-file STR
      await this.fileSTR(transaction, suspiciousScore);
    }

    return {
      flagged: alerts.length > 0,
      alerts,
    };
  }

  async fileSTR(
    transaction: Transaction,
    suspicionScore: number
  ): Promise<void> {
    await db('suspicious_transaction_reports').insert({
      transaction_id: transaction.id,
      tenant_id: transaction.tenantId,
      reported_at: new Date(),
      suspicion_score: suspicionScore,
      status: 'filed',
      filed_with_nfiu: true,
      nfiu_reference: await this.sendToNFIU(transaction),
    });
  }
}
```

### 8.4.4 IFRS 9 (International Financial Reporting Standards) Compliance

**Requirements:**

**Expected Credit Loss (ECL) Provisioning:**
- Stage 1 (0-30 days overdue): 1-2% provision
- Stage 2 (31-90 days overdue): 10-25% provision
- Stage 3 (90+ days overdue - NPL): 50-100% provision

**OrokiiPay Implementation:**

```sql
-- IFRS 9 monthly provisioning (PF-001)
CREATE TABLE loan_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id),
  provision_date DATE NOT NULL,
  ifrs9_stage INTEGER NOT NULL, -- 1, 2, or 3
  provision_rate DECIMAL(5,4) NOT NULL,
  provision_amount DECIMAL(15,2) NOT NULL,
  cumulative_provision DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Automated Monthly Provisioning:**

```typescript
// Run on 1st of every month
async function runMonthlyLoanProvisioning(tenantId: string): Promise<void> {
  const loans = await db('loans')
    .where({ tenant_id: tenantId, status: 'active' });

  for (const loan of loans) {
    const provision = calculateIFRS9Provision({
      loanId: loan.id,
      outstandingPrincipal: loan.outstanding_principal,
      outstandingInterest: loan.outstanding_interest,
      daysOverdue: loan.days_overdue,
      creditScore: await getCreditScore(loan.customer_id),
    });

    await db('loan_provisions').insert({
      tenant_id: tenantId,
      loan_id: loan.id,
      provision_date: new Date(),
      ifrs9_stage: provision.stage,
      provision_rate: provision.provisionRate,
      provision_amount: provision.provisionAmount,
      cumulative_provision: await getCumulativeProvision(loan.id),
    });

    // Post to GL (PF-004)
    await GLPostingService.postProvision({
      tenantId,
      amount: provision.provisionAmount,
      loanId: loan.id,
    });
  }
}
```

---

# SECTION 9: INTEGRATION REQUIREMENTS

## 9.1 NIBSS NIP Integration (Nigeria Inter-Bank Settlement System)

**Status:** ✅ Implemented (Production for FMFB)

**Purpose:** Enable customers to transfer money to accounts in other Nigerian banks

**Technical Details:**

**API Endpoints:**
- Name Inquiry: `POST /nip/name-inquiry`
- Fund Transfer: `POST /nip/transfer`
- Transaction Status: `GET /nip/status/{reference}`

**Security:**
- AES-256 encryption
- TLS 1.3
- Institution-specific credentials

**Transaction Flow:**

```
1. Customer enters recipient account + bank
2. OrokiiPay → NIBSS Name Inquiry API
3. NIBSS validates account, returns account name
4. Customer confirms recipient
5. OrokiiPay → NIBSS Fund Transfer API
6. NIBSS processes transfer
7. NIBSS → Recipient bank credits account
8. NIBSS → OrokiiPay confirmation
9. OrokiiPay notifies sender (SMS)
```

**Performance:**
- Name inquiry: <5 seconds
- Transfer processing: <30 seconds
- Success rate: >98%

## 9.2 BVN Validation (NIBSS)

**Purpose:** Verify customer Bank Verification Number for KYC

**API:** NIBSS BVN Verification Service

**Use Cases:**
- Account opening (Tier 1/2/3)
- Account tier upgrade
- Loan applications

**Data Returned:**
```json
{
  "bvn": "22334455667",
  "firstName": "Emeka",
  "lastName": "Obi",
  "dateOfBirth": "1985-05-15",
  "phoneNumber": "08012345678",
  "photoBase64": "...",
  "verified": true
}
```

## 9.3 Credit Bureau Integration (CRC - Credit Registry)

**Purpose:** Check customer credit history before loan approval

**API:** CRC Web Service

**Data Requested:**
- Credit score (0-1000)
- Existing loans
- Default history
- Court judgments

**Integration Point:**
- Loan application process
- AI credit scoring enhancement

## 9.4 Biller Aggregators

**Electricity Billers:**
- EKEDC, IKEDC, AEDC, PHED, KEDCO, [+20 more]

**Cable TV:**
- DSTV, GOtv, Startimes

**Internet:**
- Smile, Spectranet, Swift

**Telecoms (Airtime/Data):**
- MTN, Airtel, Glo, 9mobile

**Aggregator Platform:** Quickteller / Flutterwave Bills

**Transaction Flow:**
```
1. Customer selects biller
2. Enters customer reference (meter number, smartcard, phone)
3. OrokiiPay → Aggregator API (validate customer)
4. Aggregator → Biller (validates)
5. OrokiiPay debits customer account
6. OrokiiPay → Aggregator (payment)
7. Aggregator → Biller (settlement)
8. Biller credits customer (token for prepaid electricity)
9. OrokiiPay sends SMS with token/receipt
```

## 9.5 SMS Provider Integration

**Provider:** Termii / InfoBip

**Use Cases:**
- OTP for authentication
- Transaction notifications
- Account alerts
- Loan reminders

**Volume:** ~50,000 SMS/month (FMFB)

**Cost:** ₦4 per SMS

---

# SECTION 10: PERFORMANCE REQUIREMENTS

## 10.1 Response Time Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| API Response (GET) | <300ms | <500ms |
| API Response (POST) | <500ms | <1s |
| Database Query | <50ms | <100ms |
| Internal Transfer | <3s | <5s |
| External Transfer (NIBSS) | <20s | <30s |
| Bill Payment | <10s | <15s |
| Account Opening | <3min | <5min |
| Loan Decision (AI) | <5min | <10min |

## 10.2 Scalability Targets

**Concurrent Users:**
- Per Tenant: 1,000+ simultaneous users
- Platform-wide: 10,000+ simultaneous users across 100 tenants

**Transaction Throughput:**
- 1,000 TPS (transactions per second) peak capacity
- 500 TPS sustained load

**Data Volume:**
- 100TB+ multi-tenant data
- 1 billion+ transactions per year

## 10.3 Availability & Uptime

**SLA:** 99.9% uptime (8.76 hours downtime/year max)

**Planned Maintenance:**
- Weekly maintenance window: Sunday 2:00-4:00 AM WAT
- Maximum 2 hours/week

**Disaster Recovery:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour

---

# SECTION 11: TESTING STRATEGY

## 11.1 4-Layer Testing Framework

**Current Implementation:** ✅ 85%+ code coverage

### Layer 1: Unit Tests

**Coverage:** >80% per module

**Tools:**
- Frontend: Jest + React Testing Library
- Backend: Jest + Supertest

**Example:**

```typescript
// Unit test for credit scoring
describe('AICreditScoringService', () => {
  it('should return high credit score for customer with good history', async () => {
    const input = {
      customerId: 'cust-123',
      loanAmount: 50000,
      loanTenor: 6,
      transactionHistory: goodTransactionHistory,
      savingsHistory: consistentSavings,
    };

    const result = await AICreditScoringService.scoreCustomer(input);

    expect(result.creditScore).toBeGreaterThan(700);
    expect(result.riskCategory).toBe('low');
    expect(result.approvalRecommendation).toBe('approve');
  });
});
```

### Layer 2: Integration Tests

**Coverage:** >70% of API endpoints

**Tools:** Jest + Supertest + Test Database

**Example:**

```typescript
// Integration test for transaction reversal
describe('POST /api/v1/transactions/:id/reverse', () => {
  it('should reverse transaction with manager approval', async () => {
    // 1. Create test transaction
    const transaction = await createTestTransaction({
      amount: 10000,
      type: 'internal_transfer',
    });

    // 2. Request reversal (customer)
    const reversalRequest = await request(app)
      .post(`/api/v1/transactions/${transaction.id}/reverse`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        reason: 'Sent to wrong account',
      })
      .expect(201);

    expect(reversalRequest.body.status).toBe('pending');

    // 3. Approve reversal (manager)
    const approval = await request(app)
      .post(`/api/v1/reversals/${reversalRequest.body.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    // 4. Verify reversal completed
    expect(approval.body.status).toBe('completed');

    // 5. Verify funds returned
    const account = await getAccount(transaction.senderAccountId);
    expect(account.balance).toBe(initialBalance);
  });
});
```

### Layer 3: UX Validation Tests

**Coverage:** Critical user flows

**Tools:** Detox (mobile), Cypress (web)

**Example:**

```typescript
// UX validation: Account opening flow
describe('Account Opening Flow', () => {
  it('should complete account opening in <3 minutes', async () => {
    const startTime = Date.now();

    // 1. Enter phone number
    await element(by.id('phone-input')).typeText('08012345678');
    await element(by.text('Continue')).tap();

    // 2. Enter OTP
    await waitFor(element(by.text('Enter OTP'))).toBeVisible();
    await element(by.id('otp-input')).typeText('123456');

    // 3. Enter BVN
    await element(by.id('bvn-input')).typeText('22334455667');
    await element(by.text('Verify')).tap();

    // 4. Wait for BVN verification
    await waitFor(element(by.text('Verified'))).toBeVisible();

    // 5. Create PIN
    await element(by.id('pin-input')).typeText('1234');
    await element(by.id('pin-confirm')).typeText('1234');

    // 6. Setup biometric
    await element(by.text('Setup Biometric')).tap();
    await device.matchFace(); // Simulated

    // 7. Account created
    await waitFor(element(by.text('Account Created'))).toBeVisible();

    const duration = (Date.now() - startTime) / 1000;
    expect(duration).toBeLessThan(180); // <3 minutes
  });
});
```

### Layer 4: End-to-End Tests

**Coverage:** Critical business flows

**Tools:** Playwright + Headless browsers

**Example:**

```typescript
// E2E test: Complete money transfer flow
test('should transfer money from account A to account B', async ({ page }) => {
  // 1. Login as sender
  await page.goto('https://fmfb.orokiipay.com');
  await page.fill('[name="phoneNumber"]', '08012345678');
  await page.fill('[name="pin"]', '1234');
  await page.click('button[type="submit"]');

  // 2. Navigate to transfers
  await page.click('text=Transfer');
  await page.click('text=Send Money');

  // 3. Enter recipient details
  await page.fill('[name="accountNumber"]', '1234567890');
  await waitFor('[data-testid="recipient-name"]').toBeVisible();

  // 4. Enter amount
  await page.fill('[name="amount"]', '5000');

  // 5. Confirm transfer
  await page.click('text=Continue');
  await page.fill('[name="pin"]', '1234');
  await page.click('text=Confirm');

  // 6. Verify success
  await expect(page.locator('text=Transfer Successful')).toBeVisible();

  // 7. Verify notification sent (check via API)
  const notifications = await apiClient.get('/notifications');
  expect(notifications.data).toContainEqual(
    expect.objectContaining({
      type: 'transaction_debit',
      amount: 5000,
    })
  );
});
```

## 11.2 Multi-Tenant Isolation Testing

**Critical Tests:**

```typescript
// Tenant isolation test
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    // 1. Create account in Tenant A
    const accountA = await createAccount({ tenantId: 'fmfb' });

    // 2. Try to access from Tenant B
    const response = await request(app)
      .get(`/api/v1/accounts/${accountA.id}`)
      .set('Authorization', `Bearer ${tenantBToken}`)
      .expect(403);

    expect(response.body.error).toBe('TENANT_ACCESS_DENIED');
  });

  it('should prevent cross-tenant queries', async () => {
    // Attempt direct database query with wrong tenant context
    await expect(
      db('accounts')
        .where({ id: accountA.id })
        .andWhere({ tenant_id: 'bank2' })
    ).rejects.toThrow('No access');
  });
});
```

## 11.3 Performance Testing

**Tools:** Artillery.io, k6

**Load Test Configuration:**

```yaml
# artillery-load-test.yml
config:
  target: "https://api.orokiipay.com"
  phases:
    - duration: 60
      arrivalRate: 10      # 10 users/second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50      # 50 users/second
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100     # 100 users/second
      name: "Peak load"

scenarios:
  - name: "Money Transfer Flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            phoneNumber: "{{ $randomPhoneNumber() }}"
            pin: "1234"
          capture:
            - json: "$.token"
              as: "authToken"

      - post:
          url: "/api/v1/transactions/transfer"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            recipientAccount: "{{ $randomAccountNumber() }}"
            amount: "{{ $randomInt(1000, 50000) }}"
            narration: "Test transfer"
```

**Performance Criteria:**
- Average response time: <500ms
- 95th percentile: <1s
- 99th percentile: <3s
- Error rate: <1%

---

# SECTION 12: DEPLOYMENT & OPERATIONS

## 12.1 Deployment Architecture

### Blue-Green Deployment

```
Production Traffic (100%)
        ↓
    Load Balancer
        ↓
   ┌────────────────┐
   │  Blue Cluster  │  ← Current production (v1.5.0)
   │  (Active)      │
   └────────────────┘

   ┌────────────────┐
   │  Green Cluster │  ← New version (v1.6.0)
   │  (Standby)     │
   └────────────────┘

Deployment Process:
1. Deploy v1.6.0 to Green cluster
2. Run smoke tests on Green
3. Switch 10% traffic to Green (canary)
4. Monitor for 30 minutes
5. Switch 100% traffic to Green
6. Keep Blue as rollback target for 24 hours
```

### Database Migrations

**Strategy:** Zero-Downtime Migrations

```typescript
// Migration example: Add new column
exports.up = async function(knex) {
  // 1. Add column as nullable first
  await knex.schema.table('accounts', (table) => {
    table.string('tax_id_number').nullable();
  });

  // 2. Backfill data (if needed)
  // Run in background, not blocking deployment

  // 3. Future migration: Make column required (after backfill)
};

exports.down = async function(knex) {
  await knex.schema.table('accounts', (table) => {
    table.dropColumn('tax_id_number');
  });
};
```

**Migration Process:**
```
1. Deploy code with nullable column support
2. Run migration (add column)
3. Backfill data asynchronously
4. Verify data integrity
5. Deploy code update (use new column)
6. Future: Make column NOT NULL (optional)
```

## 12.2 Monitoring & Alerting

### Application Monitoring

**Tools:**
- Application: Google Cloud Monitoring
- Logs: Cloud Logging + structured logging
- Traces: Cloud Trace (distributed tracing)
- Errors: Sentry

**Key Metrics:**

```typescript
// Metrics tracked
const METRICS = {
  // Performance
  'api.response_time': 'histogram',
  'database.query_time': 'histogram',
  'nibss.nip_duration': 'histogram',

  // Availability
  'api.requests_total': 'counter',
  'api.errors_total': 'counter',
  'api.success_rate': 'gauge',

  // Business metrics
  'transactions.total': 'counter',
  'transactions.value': 'counter',
  'loans.approved': 'counter',
  'loans.disbursed_value': 'counter',

  // Security
  'auth.failed_logins': 'counter',
  'fraud.alerts_triggered': 'counter',
};
```

### Alerting Rules

```yaml
# alerting-rules.yml
groups:
  - name: critical_alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: DatabaseDown
        expr: up{job="database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"

      - alert: NIBSSTimeout
        expr: rate(nibss_timeout_errors[10m]) > 0.1
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "High NIBSS timeout rate"

      - alert: FraudSpikeDetected
        expr: rate(fraud_alerts_total[5m]) > 10
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Unusual spike in fraud alerts"
```

---

# SECTION 13: DISASTER RECOVERY & BUSINESS CONTINUITY

## 13.1 Backup Strategy

### Database Backups

**Platform Database:**
- Frequency: Hourly automated backups
- Retention: 30 days point-in-time recovery
- Storage: Google Cloud SQL automated backups

**Tenant Databases:**
- Frequency: Daily automated backups (per tenant)
- Retention: 30 days
- On-demand: Manual backup before migrations

**Backup Verification:**
```typescript
// Weekly backup restoration test (automated)
async function verifyBackupIntegrity(tenantId: string): Promise<void> {
  // 1. Create test database from backup
  const backupDb = await restoreFromLatestBackup(tenantId);

  // 2. Verify data integrity
  const accountCount = await backupDb('accounts').count();
  const transactionCount = await backupDb('transactions').count();

  // 3. Run validation queries
  const validation = await runValidationQueries(backupDb);

  // 4. Alert if issues detected
  if (!validation.success) {
    await sendAlert({
      severity: 'critical',
      message: `Backup verification failed for ${tenantId}`,
      details: validation.errors,
    });
  }

  // 5. Clean up test database
  await dropDatabase(backupDb);
}
```

## 13.2 Recovery Procedures

### Recovery Time Objective (RTO): 4 hours

### Recovery Point Objective (RPO): 1 hour

**Disaster Scenarios & Procedures:**

**Scenario 1: Database Failure**
```
RTO: 2 hours
RPO: 1 hour (last backup)

Procedure:
1. Alert triggered: Database health check fails
2. Operations team notified (PagerDuty)
3. Assess damage (corrupted data? Hardware failure?)
4. Decision:
   - If recoverable: Repair database (1-2 hours)
   - If not recoverable: Restore from backup (2-3 hours)
5. Restore from latest backup:
   - Platform DB: <30 minutes
   - All tenant DBs: <2 hours (parallel restoration)
6. Verify data integrity
7. Resume operations
8. Post-mortem analysis
```

**Scenario 2: Complete Region Failure (GCP Region Down)**
```
RTO: 4 hours
RPO: 1 hour

Procedure:
1. Detect region failure
2. Activate DR region (standby cluster)
3. Restore databases in DR region from backups
4. Update DNS to point to DR region
5. Verify all services operational
6. Communicate with customers
7. Monitor stability for 24 hours
8. Plan migration back to primary region
```

## 13.3 Business Continuity Plan

### Critical Services Priority

**Tier 1 (Must restore first):**
1. Authentication service
2. Account balance inquiry
3. Transaction processing (internal transfers)

**Tier 2 (Restore within 2 hours):**
1. External transfers (NIBSS)
2. Bill payments
3. Loan applications

**Tier 3 (Restore within 4 hours):**
1. Analytics dashboards
2. Reporting
3. Admin features

---

# SECTION 14: ROADMAP & IMPLEMENTATION STATUS

## 14.1 Current Implementation Status: 70%

**Completed (✅ 100%):**
- Multi-tenant architecture
- User authentication (JWT + MFA)
- Account management (Tier 1/2/3)
- Internal transfers
- External transfers (NIBSS NIP)
- Bill payments
- Basic savings products
- Basic loan products
- Transaction history
- Tenant theming and branding

**Partially Implemented (🟡 13% → 100% by Week 16):**
- [20 features - see Section 4.6 and Partial Features documents]

**Planned (❌ 17%):**
- International transfers
- Card management
- Investment products
- Insurance products

## 14.2 Phase 1: Platform Admin (Weeks 11-16)

**Goal:** Complete platform administration capabilities

**Tasks:**
- P1-001: JWT role claims enhancement
- P1-002: RBAC permission framework
- P1-003: Platform admin authentication
- P1-004: Multi-tenant database context
- P1-005: Tenant-scoped authentication
- P1-006: Platform admin dashboard
- P1-007: Admin navigation
- P1-008: Tenant management UI
- P1-009: Tenant configuration UI
- P1-010: Platform analytics dashboard
- P1-011: Platform-wide reporting
- P1-012: Billing system integration
- P1-013: Platform monitoring dashboard
- P1-014: Admin user management
- P1-015: Platform testing suite

**Deliverables:**
- Complete platform admin portal
- Tenant self-service onboarding
- Billing and subscription management

**Status:** 40% complete (ongoing)

## 14.3 Partial Features Sprint (Weeks 11-16 - Parallel)

**Goal:** Complete all 20 partially implemented features

**Budget:** ₦12M

**Team:** 2 Backend + 1 Frontend + 0.5 QA

**Critical Features (Weeks 11-13):**
1. Loan Lifecycle Management (100%)
2. Regulatory Reports (100%)
3. Approval Workflows (100%)
4. GL Posting & Batch Operations (100%)
5. Account Lien Management (100%)

**High Priority Features (Weeks 14-15):**
6-10. [Treasury, Batch Customer Upload, Financial Reports, Loan Analytics, NPL Management]

**Medium Priority Features (Week 16):**
11-20. [Reconciliation, Penalty Waiver, AML Enhancement, etc.]

**Status:** Approved, starting Week 11

## 14.4 Phase 2A: Transaction Reversals (Weeks 17-20)

**Goal:** Complete transaction reversal system

**Features:**
- Reversal request workflow
- Multi-level approval
- Automated reversal processing
- Dispute management

## 14.5 Phase 2B: NIBSS Production Readiness (Weeks 19-23)

**Goal:** Production-grade NIBSS integration

**Enhancements:**
- Enhanced error handling
- Retry mechanisms
- Real-time status monitoring
- Reconciliation automation

## 14.6 Phase 2C: Savings Products Enhancement (Weeks 17-23)

**Goal:** Complete savings product suite

**Features:**
- Target savings automation
- Flexible savings with penalties
- Fixed deposit maturity automation
- Interest calculation engine

## 14.7 Phase 2D: Loan Products Enhancement (Weeks 21-27)

**Goal:** Enterprise-grade loan system

**Features:**
- Loan lifecycle (restructuring, write-offs)
- IFRS 9 provisioning
- NPL management
- Portfolio analytics
- Business loans

## 14.8 Phase 3: Advanced Features (Weeks 23-34)

**Goals:**
- Advanced analytics
- AI enhancements
- International transfers (future)
- Investment products (future)

## 14.9 Future Phases (2026+)

**Phase 4:** Card Management
**Phase 5:** Agent Banking Module
**Phase 6:** Investment & Insurance Products
**Phase 7:** Pan-African Expansion

---

# SECTION 15: SUCCESS METRICS & KPIs

## 15.1 Platform Metrics

### Availability & Performance
- **Uptime:** 99.9% SLA (currently: 99.8% FMFB)
- **API Response Time:** <500ms (p95)
- **Transaction Processing:** <3s
- **NIBSS Success Rate:** >98%

### Scale & Capacity
- **Concurrent Users:** 10,000+ platform-wide
- **Transaction Throughput:** 1,000 TPS peak
- **Tenants:** 100+ banks by Year 3
- **End Customers:** 1M+ by Year 3

## 15.2 Business Metrics

### Revenue (Year 1-3 Targets)

| Metric | Year 1 (2025) | Year 2 (2026) | Year 3 (2027) |
|--------|---------------|---------------|---------------|
| Tenant Banks | 10 | 50 | 100 |
| Subscription Revenue | ₦30M | ₦180M | ₦360M |
| Transaction Revenue | ₦50M | ₦250M | ₦500M |
| Loan Interest Share | ₦20M | ₦70M | ₦140M |
| **Total Revenue** | **₦100M** | **₦500M** | **₦1B** |

### Customer Metrics
- **NPS (Net Promoter Score):** >60
- **CSAT (Customer Satisfaction):** >90%
- **Churn Rate:** <5% annually
- **Active Users:** 80% MAU/Total Users

## 15.3 Compliance Metrics

### Regulatory Compliance
- **CBN Returns:** 100% on-time submission
- **NDIC Premium:** 100% timely payment
- **NFIU STR:** <24 hours filing
- **IFRS 9 Provisioning:** 100% accuracy

### Security Metrics
- **Security Incidents:** 0 data breaches
- **Fraud Detection Rate:** >95%
- **False Positive Rate:** <2%
- **Penetration Test:** Pass quarterly audits

---

# APPENDICES

## Appendix A: Glossary

**AML:** Anti-Money Laundering
**BVN:** Bank Verification Number
**CAR:** Capital Adequacy Ratio
**CBN:** Central Bank of Nigeria
**CFT:** Combating the Financing of Terrorism
**CRC:** Credit Registry Corporation (Credit Bureau)
**CTR:** Currency Transaction Report
**ECL:** Expected Credit Loss
**IFRS:** International Financial Reporting Standards
**JWT:** JSON Web Token
**KYC:** Know Your Customer
**MFA:** Multi-Factor Authentication
**NDIC:** Nigeria Deposit Insurance Corporation
**NFIU:** Nigerian Financial Intelligence Unit
**NIBSS:** Nigeria Inter-Bank Settlement System
**NIP:** NIBSS Instant Payment
**NPL:** Non-Performing Loan
**OTP:** One-Time Password
**PAR:** Portfolio at Risk
**RBAC:** Role-Based Access Control
**RLS:** Row-Level Security
**RPO:** Recovery Point Objective
**RTO:** Recovery Time Objective
**SLA:** Service Level Agreement
**STR:** Suspicious Transaction Report
**TLS:** Transport Layer Security

## Appendix B: Reference Documents

1. `/docs/Partial_Features_Completion_Sprint_Strategy.md` - 85-page strategy for completing 20 partial features
2. `/docs/Partial_Features_Sprint_Quick_Reference.md` - Executive summary of partial features sprint
3. `/docs/Partial_Features_Roadmap_Integration.csv` - Project plan and budget
4. `/docs/Requirements_Modernization_Strategy.md` - PoS → Digital Banking modernization strategy
5. `/docs/OrokiiPay_vs_BankOne_Detailed_Feature_Matrix.md` - Competitive feature analysis
6. `/docs/OrokiiPay_Project_Plan.csv` - Complete project roadmap

## Appendix C: API Specifications

**Base URL:** `https://api.orokiipay.com/v1`

**Authentication:** Bearer token (JWT)

**Headers:**
```
Authorization: Bearer {jwt_token}
X-Tenant-ID: {tenant_id} (optional, extracted from JWT)
Content-Type: application/json
```

**Sample Endpoints:**
```
POST   /auth/login
POST   /auth/register
GET    /accounts/:id
POST   /transactions/transfer
POST   /transactions/nibss-transfer
POST   /bills/pay
GET    /loans
POST   /loans/apply
```

**Full API Documentation:** Available at `/docs/api/`

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | October 8, 2025 | Product Team | Complete rewrite: PoS → Digital Banking, added 20 partial features, comprehensive requirements |
| 1.0 | June 2025 | Legacy Team | Initial PoS requirements (deprecated) |

---

## Approval & Sign-Off

**Document Status:** DRAFT → REVIEW → **APPROVED**

**Approvers:**

- [ ] **CEO / Founder:** _________________ Date: _______
- [ ] **CTO / Tech Lead:** _________________ Date: _______
- [ ] **Product Manager:** _________________ Date: _______
- [ ] **Compliance Officer:** _________________ Date: _______
- [ ] **FMFB Stakeholder:** _________________ Date: _______

**Effective Date:** Upon final approval

**Review Cycle:** Quarterly (next review: January 2026)

---

**END OF DOCUMENT**

**OrokiiPay Digital Banking Platform Requirements v2.0**

**Total Pages:** ~150 pages equivalent
**Total Sections:** 15 major sections + 3 appendices
**Status:** Authoritative - Replaces all legacy requirements
**Distribution:** Confidential - OrokiiPay Team & Stakeholders Only

---
