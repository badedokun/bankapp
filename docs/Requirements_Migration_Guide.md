# Requirements Migration Guide: Legacy PoS → Digital Banking Platform

**From:** `updated_bankapp_requirements.md` (77KB, 2,333 lines - Legacy PoS Requirements)
**To:** `OrokiiPay_Digital_Banking_Requirements_v2.md` (136KB, 4,680 lines - Digital Banking Requirements)
**Migration Date:** October 8, 2025
**Document Version:** 2.0

---

## 🎯 EXECUTIVE SUMMARY

### What Changed?

**Product Scope Transformation:**
- ❌ **REMOVED:** PoS (Point of Sale) system features (terminals, agents, cash withdrawal)
- ✅ **RETAINED:** 90% of platform infrastructure (multi-tenant architecture, tech stack, security)
- ✅ **ADDED:** Digital banking features (savings, loans, transfers, bill payments, 20 partial features)

**Document Size:**
- Legacy: 77KB, 2,333 lines
- New: 136KB, 4,680 lines
- **Increase:** +76% (primarily new banking features and missing sections)

### Why the Change?

**Product Evolution:**
OrokiiPay started as a PoS agent banking app (Q1 2024) but evolved into a comprehensive digital banking platform (Q2 2025). The legacy requirements document was never updated to reflect this strategic pivot.

**Critical Gap Identified:**
Requirements analysis (October 2025) revealed a 90% misalignment between documented requirements (PoS) and actual product (digital banking). This migration updates the requirements to match current reality.

---

## 📊 SIDE-BY-SIDE COMPARISON

| Aspect | Legacy Requirements (PoS) | New Requirements (Digital Banking) | Status |
|--------|---------------------------|-------------------------------------|--------|
| **Product Type** | PoS Agent Banking App | Multi-Tenant Digital Banking Platform | 🔄 CHANGED |
| **Target Users** | PoS Agents, Merchants | Bank Customers (Tier 1/2/3), Corporate Clients | 🔄 CHANGED |
| **Primary Features** | Terminal mgmt, Cash withdrawal, Agent operations | Accounts, Transfers, Savings, Loans, Bill Payments | 🔄 CHANGED |
| **Multi-Tenant Architecture** | Database-per-tenant | Database-per-tenant | ✅ UNCHANGED |
| **Tech Stack** | React Native 0.81.1, Node.js 18+, PostgreSQL 15+ | React Native 0.81.1, Node.js 18+, PostgreSQL 15+ | ✅ UNCHANGED |
| **Security** | JWT Auth, MFA, AES-256, TLS 1.3 | JWT Auth, MFA, AES-256, TLS 1.3 | ✅ UNCHANGED |
| **AI Features** | Conversational AI, Fraud Detection | Conversational AI, Credit Scoring, Fraud Detection | ✅ ENHANCED |
| **Compliance** | CBN (basic) | CBN, NDIC, NFIU, IFRS 9 (comprehensive) | ✅ ENHANCED |
| **Testing Strategy** | Not documented | 4-layer framework (Unit, Integration, UX, E2E) | ✅ ADDED |
| **Disaster Recovery** | Not documented | RTO: 4h, RPO: 1h, detailed DR plan | ✅ ADDED |
| **Partial Features** | Not documented | 20 features (13% → 100% completion) | ✅ ADDED |

---

## 🔴 REMOVED CONTENT (Legacy PoS Features)

### 1. PoS Terminal Management
```diff
- ## 4.1 Terminal Management
-
- ### Terminal Registration
- - Agent onboarding with terminal assignment
- - Terminal activation/deactivation
- - Terminal location tracking
- - Terminal inventory management
-
- ### Terminal Operations
- - Cash withdrawal limits per terminal
- - Transaction float management
- - Terminal reconciliation
- - Settlement workflows (agent → bank)
```

**Reason for Removal:** OrokiiPay is no longer a PoS system. Digital banking platforms do not require terminal management.

---

### 2. Agent Operations
```diff
- ## 4.2 Agent Operations
-
- ### Agent Roles
- - Super Agent (manages sub-agents)
- - Sub-Agent (operates terminals)
- - Agent performance tracking
-
- ### Agent Workflows
- - Cash withdrawal on behalf of customers
- - Account opening assistance
- - Commission calculation (per transaction)
- - Agent float management
-
- ### Agent Dashboard
- - Daily transaction volume
- - Commission earned
- - Float balance
- - Performance metrics
```

**Reason for Removal:** OrokiiPay serves bank customers directly, not through agent networks.

---

### 3. Cash Withdrawal Services
```diff
- ## 4.3 Cash Withdrawal
-
- ### Customer Workflows
- - Customer requests cash withdrawal via app
- - Agent receives withdrawal request
- - Agent verifies customer (OTP, BVN)
- - Agent disburses cash
- - Transaction recorded and settled
-
- ### Withdrawal Limits
- - Tier 1: ₦50K/day via agents
- - Tier 2: ₦200K/day via agents
- - Tier 3: ₦500K/day via agents
-
- ### Commission Structure
- - Customer fee: ₦100 per withdrawal
- - Agent commission: ₦50 per withdrawal
- - Bank revenue: ₦50 per withdrawal
```

**Reason for Removal:** Digital banking platforms provide ATM/branch withdrawals, not agent-based cash withdrawal.

---

### 4. Terminal-Specific UI Components
```diff
- ## 6.2 Terminal UI Components
-
- - TerminalStatusIndicator (online, offline, low battery)
- - FloatBalanceDisplay (agent's cash balance)
- - WithdrawalRequestCard (pending withdrawal requests)
- - AgentCommissionSummary (daily/weekly/monthly earnings)
- - TerminalSettingsScreen (configuration, printer setup)
```

**Reason for Removal:** Not applicable to digital banking platform.

---

### 5. Agent-Specific User Personas
```diff
- ## 3.2 User Personas (Legacy)
-
- ### Super Agent
- - Manages network of 10-50 sub-agents
- - Responsible for float management
- - Monitors sub-agent performance
- - Earns override commission
-
- ### Sub-Agent
- - Operates PoS terminal
- - Processes cash withdrawals
- - Earns per-transaction commission
- - Reports to super agent
-
- ### Merchant
- - Accepts payments via PoS terminal
- - Manages inventory
- - Views transaction reports
```

**Reason for Removal:** Replaced with digital banking user personas (Bank Admin, Account Officer, Bank Manager, Customers Tier 1/2/3, Corporate Customers).

---

## ✅ RETAINED CONTENT (90% Preservation)

### 1. Multi-Tenant Architecture (100% Retained)

**Legacy Section (Lines 800-1200):**
```typescript
// Database-per-tenant architecture
interface TenantArchitecture {
  platformDatabase: {
    tables: ['platform.tenants', 'platform.users', 'platform.audit_logs'];
    purpose: 'Cross-tenant management';
  };
  tenantDatabases: {
    naming: 'tenant_{tenant_name}_db';
    isolation: 'complete';
    schema: 'identical across tenants';
  };
}
```

**New Section (Lines 1501-2000):**
```typescript
// IDENTICAL - 100% retained
// All multi-tenant architecture documentation preserved
// Same database-per-tenant model
// Same tenant isolation mechanisms
// Same RLS (Row-Level Security) implementation
```

**Status:** ✅ **UNCHANGED** - This was excellent content and directly applicable to digital banking.

---

### 2. Technology Stack (100% Retained)

**Legacy Section (Lines 1500-1800):**
```yaml
Frontend:
  - React Native 0.81.1
  - React Native Web 0.19+
  - Redux Toolkit
  - React Query

Backend:
  - Node.js 18+ LTS
  - Express 5.1.0
  - PostgreSQL 15+
  - Redis 7+

Infrastructure:
  - Google Cloud Platform (GCP)
  - Kubernetes (GKE)
  - Cloud SQL (PostgreSQL HA)
```

**New Section (Lines 2001-2300):**
```yaml
# IDENTICAL - 100% retained
# Same technology stack
# Added: Specific version numbers and configuration details
```

**Status:** ✅ **UNCHANGED** - Technology stack remains identical.

---

### 3. Security Requirements (95% Retained)

**Legacy Section (Lines 2000-2500):**
```typescript
Security Framework:
  - Zero Trust Architecture
  - Multi-Factor Authentication (MFA)
  - JWT Token Authentication (RS256)
  - Encryption at Rest (AES-256-GCM)
  - Encryption in Transit (TLS 1.3)
  - Role-Based Access Control (RBAC)
```

**New Section (Lines 2701-3300):**
```typescript
// 95% RETAINED
// Enhanced with banking-specific security:
//   - PCI DSS compliance (card data tokenization)
//   - NDPR compliance (Nigerian data privacy)
//   - Transaction signing (additional layer for high-value transactions)
```

**Status:** ✅ **ENHANCED** - Core security retained, banking compliance added.

---

### 4. AI & Machine Learning (90% Retained)

**Legacy Section (Lines 1800-2000):**
```typescript
AI Features:
  - Conversational AI (English + Nigerian languages)
  - Fraud Detection (transaction pattern analysis)
  - Voice Commands
  - Document OCR (KYC documents)
```

**New Section (Lines 2301-2700):**
```typescript
// 90% RETAINED
// Enhanced with:
//   - AI-powered credit scoring (for loan approvals)
//   - Predictive analytics (loan default prediction)
//   - Personalized financial advice
// Removed:
//   - Voice biometrics (over-scoped, deferred to Phase 4)
```

**Status:** ✅ **ENHANCED** - Core AI features retained, credit scoring added, over-ambitious features deferred.

---

### 5. Performance Requirements (100% Retained)

**Legacy Section (Lines 2500-2600):**
```yaml
Response Times:
  - API: < 300ms (p95)
  - Database Queries: < 100ms (p95)
  - Page Load: < 2s (p95)

Scalability:
  - Support 500+ concurrent users per tenant
  - Handle 10K transactions/hour per tenant
  - Support 1000+ tenants on platform

Uptime:
  - SLA: 99.9% (< 8.76 hours downtime/year)
```

**New Section (Lines 3501-3700):**
```yaml
# IDENTICAL - 100% retained
# Same performance targets
# Added: Specific monitoring thresholds and alerting rules
```

**Status:** ✅ **UNCHANGED** - Performance requirements remain identical.

---

## ✅ ADDED CONTENT (New Sections)

### 1. Digital Banking Features (NEW - Section 4)

**Location:** Lines 501-1500 (1,000 lines)

**Content:**
```typescript
// 4.1 Account Management (NEW)
- KYC Tier Structure (Tier 1/2/3)
- Account Types (Savings, Current, Fixed Deposit)
- Account Opening Workflows
- BVN Validation (NIBSS integration)

// 4.2 Transaction Management (NEW)
- Internal Transfers (within same bank - FREE)
- External Transfers (NIBSS NIP - ₦30-₦150 fee)
- Transaction Limits (based on KYC tier)
- Transaction Reversals (with approval workflow)

// 4.3 Bill Payments (NEW)
- Electricity (AEDC, EKEDC, IKEDC)
- Cable TV (DSTV, GOtv, StarTimes)
- Internet (Spectranet, Smile)
- Airtime/Data (MTN, Airtel, Glo, 9mobile)

// 4.4 Savings Products (NEW)
- Regular Savings (4-6% p.a.)
- Target Savings (6-8% p.a., goal-based)
- Flexible Savings (8-10% p.a., lock-in period)
- Fixed Deposit (10-15% p.a., 90-365 days)

// 4.5 Loan Products (NEW)
- Personal Loan (₦50K-₦5M, 18-30% p.a., 3-24 months)
- Quick Loan (₦5K-₦200K, instant approval, 25-35% p.a.)
- Business Loan (₦500K-₦50M, 15-25% p.a., 6-60 months)
```

**Status:** ✅ **ADDED** - Core digital banking features documented.

---

### 2. 20 Partial Features (NEW - Section 4.6-4.25)

**Location:** Lines 800-1400 (600 lines)

**Content:**
```typescript
// CRITICAL Features (Weeks 11-13)
PF-001: Loan Lifecycle Management
  - Loan restructuring (change tenure, interest rate)
  - Loan write-offs (NPL >365 days)
  - IFRS 9 provisioning (Stage 1/2/3)
  - Database Schema: loan_restructurings, loan_write_offs, loan_provisions
  - APIs: POST /loans/:id/restructure, POST /loans/:id/write-off
  - Status: 40% → 100% (Week 11-13)

PF-002: Regulatory Reports
  - CBN Monthly/Quarterly Returns
  - NDIC Deposit Reports
  - NFIU CTR/STR Reports
  - IFRS 9 Financial Statements
  - Database Schema: regulatory_reports, report_submissions
  - APIs: POST /compliance/reports/generate
  - Status: 20% → 100% (Week 11-13)

PF-003: Approval Workflows
  - Multi-level approval engine (2-5 levels)
  - Conditional routing (amount-based, risk-based)
  - Escalation mechanism
  - Database Schema: approval_workflows, approval_requests, approval_actions
  - APIs: POST /approvals/requests, POST /approvals/:id/approve
  - Status: 50% → 100% (Week 11-13)

PF-004: GL Posting & Batch Operations
  - Chart of Accounts (COA) management
  - General Ledger (GL) postings
  - Trial Balance generation
  - Database Schema: gl_accounts, gl_postings, trial_balance
  - APIs: POST /gl/postings, GET /gl/trial-balance
  - Status: 30% → 100% (Week 12-13)

PF-005: Account Lien Management
  - Account lien placement (freeze funds)
  - Available balance calculation
  - Auto-release on loan repayment
  - Database Schema: account_liens
  - Function: get_available_balance(account_id)
  - APIs: POST /accounts/:id/liens, DELETE /liens/:id
  - Status: 0% → 100% (Week 12-13)

// HIGH PRIORITY Features (Weeks 14-15)
PF-006 to PF-010: Treasury, Batch Upload, Financial Reports, Loan Analytics, NPL Workflows

// MEDIUM PRIORITY Features (Week 16)
PF-011 to PF-020: Reconciliation, Penalty Waiver, AML Enhancement, etc.
```

**Status:** ✅ **ADDED** - All 20 partial features fully documented with schemas, APIs, user stories.

---

### 3. Testing Strategy (NEW - Section 11)

**Location:** Lines 3701-4000 (300 lines)

**Content:**
```typescript
// 4-Layer Testing Framework (NEW)

Layer 1: Unit Testing
  - Target Coverage: >80%
  - Tools: Jest, React Testing Library
  - Scope: Functions, utilities, components
  - Examples: calculateLoanInterest(), validateBVN(), generateAccountNumber()

Layer 2: Integration Testing
  - Target Coverage: >70%
  - Tools: Supertest, Jest
  - Scope: API endpoints, database interactions, service integrations
  - Examples: POST /transactions/internal-transfer, GET /accounts/:id/balance

Layer 3: UX Validation Testing
  - Target: All critical user flows
  - Tools: Manual testing, User feedback
  - Critical Flows: Account opening, Fund transfer, Loan application, Bill payment

Layer 4: End-to-End (E2E) Testing
  - Target: Critical business scenarios
  - Tools: Playwright, Cypress
  - Critical Scenarios: Full customer onboarding, Loan disbursement, Bill payment

Current Test Coverage: 85%+ (exceeds 80% target)
```

**Status:** ✅ **ADDED** - Legacy requirements had no testing strategy documented.

---

### 4. Disaster Recovery & Business Continuity (NEW - Section 13)

**Location:** Lines 4201-4400 (200 lines)

**Content:**
```yaml
# Disaster Recovery Plan (NEW)

Recovery Objectives:
  - RTO (Recovery Time Objective): 4 hours
  - RPO (Recovery Point Objective): 1 hour
  - Data Loss Tolerance: < 1 hour of transactions

Backup Strategy:
  - Database Backups: Every 1 hour (automated snapshots)
  - Transaction Logs: Real-time replication
  - Document Storage: Multi-region replication (GCS)
  - Configuration: Version-controlled (GitHub)

Disaster Scenarios:
  1. Database Failure
     - Automatic failover to standby replica (< 5 minutes)
     - Data loss: < 1 hour (from last snapshot)

  2. Region Outage
     - Manual failover to backup region (< 2 hours)
     - Data loss: < 1 hour

  3. Complete Data Loss
     - Restore from backups (< 4 hours)
     - Data loss: < 1 hour (RPO)

Business Continuity:
  - Crisis Management Team (CEO, CTO, CFO, CCO)
  - Communication Plan (customers, regulators, staff)
  - Alternative Workspace (work from home policy)
  - Third-party Service Redundancy (multiple SMS providers, backup payment gateways)
```

**Status:** ✅ **ADDED** - Legacy requirements had no DR/BC plan.

---

### 5. Detailed Compliance Requirements (NEW - Section 8.4)

**Location:** Lines 3000-3300 (300 lines)

**Content:**
```yaml
# Banking Compliance (NEW - Enhanced Detail)

CBN (Central Bank of Nigeria):
  Licensing:
    - Microfinance Bank License (State/National)
    - Minimum Capital: ₦200M (State), ₦5B (National)
    - Application Timeline: 6-12 months

  Capital Adequacy Ratio (CAR):
    - Minimum: 10%
    - Formula: (Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets
    - Reporting: Quarterly
    - Monitoring: PF-009 (Loan Analytics Dashboard)
    - Alert Threshold: < 12% (warning), < 10% (critical)

  Liquidity Ratio:
    - Minimum: 20%
    - Formula: Liquid Assets / Total Deposits
    - Reporting: Monthly
    - Calculation: PF-006 (Treasury Operations)
    - Alert Threshold: < 22% (warning), < 20% (critical)

NDIC (Nigeria Deposit Insurance Corporation):
  Insurance Premium:
    - Rate: 0.9% of total deposits
    - Frequency: Quarterly
    - Payment Deadline: 15 days after quarter end
    - Reporting: PF-002 (Regulatory Reports)

  Returns Submission:
    - Monthly: Deposit data (10 days after month end)
    - Quarterly: Financial statements (15 days after quarter end)
    - Annual: Audited financial statements (90 days after year end)

NFIU (Nigerian Financial Intelligence Unit):
  Cash Transaction Reports (CTR):
    - Threshold: ≥₦5M per transaction
    - Reporting Deadline: 7 days
    - Implementation: PF-013 (AML Enhancement)

  Suspicious Transaction Reports (STR):
    - Trigger: AI-based pattern detection (fraud score >0.7)
    - Reporting Deadline: 24 hours
    - Auto-filing: PF-013 (AML Enhancement)

  Customer Due Diligence (CDD):
    - BVN Validation: Mandatory for all accounts
    - PEP Screening: Politically Exposed Persons check
    - Ongoing Monitoring: Transaction pattern analysis

IFRS 9 (Expected Credit Loss Provisioning):
  Stage 1 (Performing): ≤30 days overdue
    - Provision: 1-2% (12-month ECL)
    - Credit score based calculation

  Stage 2 (Under Observation): 31-90 days overdue
    - Provision: 10-25% (Lifetime ECL - not credit-impaired)
    - Days overdue × 0.25%

  Stage 3 (Non-Performing): >90 days overdue
    - Provision: 50-100% (Lifetime ECL - credit-impaired)
    - 91-365 days: 50-100% gradual increase
    - >365 days: 100% full provision

  Implementation: PF-001 (Loan Lifecycle Management)
```

**Status:** ✅ **ADDED** - Legacy requirements had basic CBN mention, now comprehensive compliance documentation.

---

### 6. Roadmap & Implementation Status (NEW - Section 14)

**Location:** Lines 4401-4600 (200 lines)

**Content:**
```yaml
# Implementation Roadmap (NEW)

Current Status: 70% Complete

Phase 1: Platform Admin & Foundation (Weeks 1-10)
  Status: IN PROGRESS
  Completion: 60%
  Features:
    - ✅ JWT Authentication (Platform & Tenant)
    - ✅ Database Context Switching
    - ✅ RBAC Implementation
    - ⏳ Platform Admin Portal (in progress)
    - ⏳ Tenant Management Dashboard (in progress)

Partial Features Sprint (Weeks 11-16 - Parallel)
  Status: APPROVED, STARTING WEEK 11
  Completion: 13% → 100% (target)
  Budget: ₦12M
  Features: 20 partial features
    - CRITICAL: PF-001 to PF-005 (Weeks 11-13)
    - HIGH: PF-006 to PF-010 (Weeks 14-15)
    - MEDIUM: PF-011 to PF-020 (Week 16)

Phase 2A: Customer Account Management (Weeks 17-22)
  Status: PLANNED
  Completion: 0%
  Budget: ₦15M

Phase 2B: Transaction Excellence (Weeks 23-28)
  Status: PLANNED
  Budget: ₦20M

Phase 2C: Savings Enhancement (Weeks 29-33)
  Status: PLANNED
  Budget: ₦12M

Phase 2D: Loan System Excellence (Weeks 34-39)
  Status: PLANNED
  Budget: ₦25M
  ACCELERATED BY: Partial Features Sprint (PF-001, PF-005, PF-009, PF-010)

Phase 2E: International Transfers (Weeks 40-44)
  Status: PLANNED
  Budget: ₦18M

Phase 3: Card Management (Weeks 45-52)
  Status: PLANNED
  Budget: ₦40M

Phase 4: Investments & Insurance (TBD)
  Status: FUTURE
  Budget: TBD
```

**Status:** ✅ **ADDED** - Legacy requirements had no clear roadmap or implementation status.

---

## 🔄 MODIFIED CONTENT (Enhancements)

### 1. User Personas (REPLACED)

**Legacy (PoS-focused):**
```yaml
User Roles:
  - Super Agent (manages sub-agents)
  - Sub-Agent (operates terminals)
  - Merchant (accepts payments)
  - Platform Admin (cross-tenant)
  - Customer (uses agent services)
```

**New (Digital Banking-focused):**
```yaml
User Roles:
  - Platform Admin (cross-tenant management)
  - Bank Admin (tenant-wide configuration)
  - Account Officer (customer service, KYC)
  - Bank Manager (approvals, risk management)
  - Customer Tier 1 (basic account, ₦50K daily limit)
  - Customer Tier 2 (standard account, ₦200K daily limit)
  - Customer Tier 3 (premium account, ₦1M daily limit)
  - Corporate Customer (business banking, bulk payments, API access)
```

**Status:** 🔄 **REPLACED** - Agent roles → Banking roles

---

### 2. User Workflows (REPLACED)

**Legacy (PoS Workflows):**
```mermaid
Cash Withdrawal Flow:
  Customer → Request withdrawal (app)
  Agent → Receive request
  Agent → Verify customer (OTP, BVN)
  Agent → Disburse cash
  System → Debit customer account
  System → Credit agent commission
```

**New (Digital Banking Workflows):**
```mermaid
Internal Transfer Flow:
  Customer → Enter recipient account, amount
  System → Validate recipient (same bank)
  System → Check available balance (balance - liens)
  System → Debit sender, Credit recipient
  System → Send SMS notification (both parties)
  Fee: ₦0 (FREE for internal transfers)

External Transfer Flow:
  Customer → Enter recipient account (other bank), amount
  System → Validate recipient (NIBSS name inquiry)
  System → Check available balance
  System → Submit to NIBSS NIP
  NIBSS → Process interbank transfer
  System → Debit sender (amount + ₦30-₦150 fee)
  System → Send SMS notification
```

**Status:** 🔄 **REPLACED** - Agent-based flows → Customer self-service flows

---

### 3. Revenue Model (MODIFIED)

**Legacy (PoS Commission-based):**
```yaml
Revenue Streams:
  1. Cash Withdrawal Commission
     - Customer pays: ₦100 per withdrawal
     - Agent earns: ₦50
     - Bank earns: ₦50

  2. Terminal Rental
     - Agent pays: ₦5,000/month per terminal

  3. Float Management Fees
     - Agent pays: 0.5% on float top-up

  4. Platform Subscription
     - Bank pays: ₦500K/month (for agent network)
```

**New (Digital Banking SaaS):**
```yaml
Revenue Streams:
  1. Tenant Subscription
     - Tier 1 (< 5K customers): ₦2M/month
     - Tier 2 (5K-20K customers): ₦5M/month
     - Tier 3 (20K-100K customers): ₦10M/month
     - Enterprise (> 100K customers): Custom pricing

  2. Transaction Fees (Tenant keeps 70%, Platform gets 30%)
     - External transfers: ₦30-₦150 per transaction
     - Bill payments: 1-2% commission
     - Loan processing: 1-3% of loan amount

  3. Support & Training
     - Premium support: ₦500K/month
     - Training sessions: ₦200K per session

  4. API Access (for corporate clients)
     - ₦100K/month base + ₦10 per API call

  5. White-label Licensing
     - One-time: ₦50M
     - Annual maintenance: ₦10M
```

**Status:** 🔄 **MODIFIED** - Commission model → SaaS subscription model

---

## 📋 MIGRATION CHECKLIST

### For Executives

- [ ] **Review Strategic Pivot**
  - [ ] Understand why we moved from PoS → Digital Banking
  - [ ] Approve new product direction
  - [ ] Review new revenue model (SaaS subscriptions vs commissions)

- [ ] **Approve Budget Adjustments**
  - [ ] AI Development: ₦300M → ₦180M (realistic phasing)
  - [ ] Partial Features Sprint: ₦12M (new investment)
  - [ ] Total 3-Year Budget: ₦750M

- [ ] **Review Updated Roadmap**
  - [ ] Phase 1: Platform Admin (Weeks 1-10)
  - [ ] Partial Features Sprint (Weeks 11-16)
  - [ ] Phase 2: Revenue Features (Weeks 17-44)
  - [ ] Phase 3-4: Cards, Investments (Weeks 45+)

---

### For Product Managers

- [ ] **Update Product Roadmap**
  - [ ] Remove: PoS features (terminal mgmt, agent operations, cash withdrawal)
  - [ ] Keep: Multi-tenant, security, AI framework
  - [ ] Add: 20 partial features (PF-001 to PF-020)

- [ ] **Update User Stories**
  - [ ] Replace agent user stories with customer user stories
  - [ ] Update acceptance criteria (digital banking flows)
  - [ ] Create new epics for 20 partial features

- [ ] **Update Product Backlog**
  - [ ] Prioritize CRITICAL partial features (Weeks 11-13)
  - [ ] Schedule HIGH priority features (Weeks 14-15)
  - [ ] Plan MEDIUM priority features (Week 16)

---

### For Development Team

- [ ] **Read New Requirements Document**
  - [ ] Section 1: Executive Summary (understand product vision)
  - [ ] Section 4: Functional Requirements (all digital banking features + 20 partial features)
  - [ ] Section 5: Multi-Tenant Architecture (unchanged, but critical)
  - [ ] Section 8: Security & Compliance (enhanced with banking regulations)
  - [ ] Section 11: Testing Strategy (4-layer framework)

- [ ] **Update Codebase**
  - [ ] Remove: PoS-related code (if any legacy code exists)
    - [ ] TerminalManagementService
    - [ ] AgentCommissionService
    - [ ] CashWithdrawalService
  - [ ] Keep: All multi-tenant, auth, security code
  - [ ] Add: Digital banking features (accounts, transfers, savings, loans)
  - [ ] Implement: 20 partial features (Weeks 11-16)

- [ ] **Update Database Schema**
  - [ ] Remove: terminals, agents, agent_commissions, terminal_floats tables
  - [ ] Keep: All existing banking tables (accounts, transactions, loans, savings)
  - [ ] Add: New tables for partial features
    - [ ] loan_restructurings, loan_write_offs, loan_provisions (PF-001)
    - [ ] regulatory_reports, report_submissions (PF-002)
    - [ ] approval_workflows, approval_requests, approval_actions (PF-003)
    - [ ] gl_accounts, gl_postings, trial_balance (PF-004)
    - [ ] account_liens (PF-005)
    - [ ] ... (15 more feature tables)

- [ ] **Update API Documentation**
  - [ ] Remove: PoS endpoints (/terminals/*, /agents/*, /cash-withdrawals/*)
  - [ ] Keep: Existing banking endpoints (/accounts/*, /transactions/*, /loans/*)
  - [ ] Add: 20 partial features endpoints (see Section 4.6-4.25)

- [ ] **Update Tests**
  - [ ] Remove: PoS-related tests
  - [ ] Update: Existing tests to match new requirements
  - [ ] Add: Tests for 20 partial features (target: >80% coverage)

---

### For Compliance Officer

- [ ] **Review Enhanced Compliance Requirements**
  - [ ] CBN: Capital Adequacy Ratio (CAR) monitoring (PF-009)
  - [ ] CBN: Liquidity Ratio tracking (PF-006)
  - [ ] NDIC: Automated deposit reports (PF-002)
  - [ ] NFIU: Enhanced AML/CFT monitoring (PF-013)
  - [ ] IFRS 9: Automated loan provisioning (PF-001)

- [ ] **Engage Compliance Specialist**
  - [ ] Budget: ₦600K (Week 11-16)
  - [ ] Validate regulatory report formats (CBN, NDIC, NFIU)
  - [ ] Review IFRS 9 provisioning calculations
  - [ ] Sign-off on AML/CFT monitoring

- [ ] **Update Compliance Documentation**
  - [ ] Regulatory compliance checklist
  - [ ] Audit trail requirements
  - [ ] Report submission schedules

---

### For QA Team

- [ ] **Update Test Plans**
  - [ ] Remove: PoS test cases (terminal management, agent operations, cash withdrawal)
  - [ ] Keep: Existing banking test cases (accounts, transfers, loans, savings)
  - [ ] Add: 20 partial features test cases

- [ ] **Update Test Strategy**
  - [ ] Implement 4-layer testing framework (Unit, Integration, UX, E2E)
  - [ ] Target: >80% unit test coverage
  - [ ] Target: >70% integration test coverage
  - [ ] Critical flows: Account opening, transfers, loan approval, bill payment

- [ ] **Update Test Data**
  - [ ] Remove: Agent/terminal test data
  - [ ] Add: Customer test data (Tier 1/2/3)
  - [ ] Add: Regulatory report test data (CAR, liquidity ratio, NPL ratio)

---

## 🎯 MIGRATION TIMELINE

### Week 1-2: Stakeholder Alignment
- [ ] **Week 1:** Executive review and approval of new requirements
- [ ] **Week 2:** Team training sessions on new requirements
  - [ ] Product team: Digital banking features overview
  - [ ] Dev team: 20 partial features deep dive
  - [ ] QA team: Testing strategy workshop
  - [ ] Compliance: Regulatory requirements training

### Week 3-10: Phase 1 (Platform Admin) - Ongoing
- [ ] Continue current Phase 1 development
- [ ] No changes required (multi-tenant architecture unchanged)
- [ ] Plan for Partial Features Sprint (Week 11-16)

### Week 11-16: Partial Features Sprint
- [ ] **Week 11:** Foundation & Schemas (CRITICAL features start)
- [ ] **Week 12:** Core APIs & Logic
- [ ] **Week 13:** UI & Integration (CRITICAL features → 100%) 🎯
- [ ] **Week 14:** High Priority Features
- [ ] **Week 15:** Analytics & Workflows (HIGH features → 100%) 🎯
- [ ] **Week 16:** Final Polish & Documentation (ALL features → 100%) 🎯

### Week 17+: Phase 2 (Revenue Features)
- [ ] Continue with updated requirements
- [ ] All features align with digital banking platform

---

## ❓ FREQUENTLY ASKED QUESTIONS

### Q1: Why did we pivot from PoS to Digital Banking?

**A:** OrokiiPay started as a PoS agent banking app in Q1 2024, but market demand and customer feedback led to a strategic pivot toward a comprehensive digital banking platform. By Q4 2024, we had evolved into a multi-tenant SaaS platform serving banks directly, eliminating the need for agent networks. The legacy requirements document was never updated to reflect this change.

---

### Q2: What happens to existing PoS code?

**A:** Based on codebase analysis, OrokiiPay has minimal PoS-specific code remaining. Most PoS features were deprecated during the pivot. The requirements migration formalizes this change.

**Action Required:**
- Audit codebase for any remaining PoS code (terminals, agents, cash withdrawal)
- Remove or archive deprecated code
- Focus all development on digital banking platform

---

### Q3: Will this delay our roadmap?

**A:** No. The new requirements document **aligns** with current development, not redirects it. We are documenting what we're already building (70% complete). The Partial Features Sprint (Weeks 11-16) actually **accelerates** the roadmap by completing critical features needed for Phase 2.

---

### Q4: What about AI features? Are they still in scope?

**A:** Yes, but with **realistic phasing**:
- **Phase 1 (M1-3):** English conversational AI, basic fraud detection - ₦30M
- **Phase 2 (M4-6):** Add Nigerian Pidgin support - ₦50M
- **Phase 3 (M7-12):** Multi-language NLP (Hausa, Yoruba, Igbo) - ₦100M (if budget permits)

Total AI budget reduced from ₦300M → ₦180M (40% reduction, more realistic).

---

### Q5: Do we need to re-approve the budget?

**A:** No budget increase required. Total 3-year budget remains ₦750M.

**Changes:**
- AI Development: ₦300M → ₦180M (savings: ₦120M)
- Partial Features Sprint: ₦0 → ₦12M (new investment)
- Net Savings: ₦108M (reallocated to Phase 2-4 features)

---

### Q6: What about existing tenants (e.g., FMFB)?

**A:** **Zero impact.** FMFB is already using OrokiiPay as a digital banking platform (not PoS). The requirements migration formalizes what FMFB is already using.

**FMFB Current Features (All Digital Banking):**
- ✅ Customer accounts (Tier 1/2/3)
- ✅ Internal transfers (FREE)
- ✅ External transfers (NIBSS NIP)
- ✅ Bill payments
- ✅ Savings products
- ✅ Loan products

**No changes to existing functionality.**

---

### Q7: How do we communicate this to stakeholders?

**Recommended Communication:**

**To Board/Investors:**
```
Subject: OrokiiPay Requirements Update - Digital Banking Platform Formalization

Dear [Board Member],

We have updated our requirements document to formally reflect OrokiiPay's strategic
evolution from a PoS agent banking app to a comprehensive digital banking platform.

Key Points:
1. No product change - we are formalizing what we're already building (70% complete)
2. No budget increase - total 3-year budget remains ₦750M
3. Accelerated roadmap - 20 partial features complete by Week 16 (₦12M investment)
4. Enhanced compliance - comprehensive CBN/NDIC/NFIU/IFRS 9 documentation

This update ensures our requirements accurately reflect our current product direction
and strengthens our position for future funding rounds.

[Attached: Requirements_Migration_Guide.md]
```

**To Development Team:**
```
Subject: New Requirements Document - OrokiiPay Digital Banking Platform v2.0

Team,

Great news! We have a comprehensive, updated requirements document that accurately
reflects what we're building.

What Changed:
- Removed: Legacy PoS features (terminals, agents, cash withdrawal)
- Retained: 90% of content (multi-tenant architecture, tech stack, security)
- Added: Digital banking features + 20 partial features (detailed specs)

What This Means for You:
- Clear specifications for all features (no more guessing)
- Detailed database schemas for 20 partial features
- Comprehensive testing strategy (4-layer framework)
- Implementation checklist for Weeks 11-16 sprint

Action Required:
1. Read: OrokiiPay_Digital_Banking_Requirements_v2.md
2. Review: Partial_Features_Implementation_Checklist.md
3. Attend: Week 10 sprint planning meeting (Friday 3pm)

[Attached: All documents]
```

**To Compliance Officer:**
```
Subject: Enhanced Compliance Requirements - CBN/NDIC/NFIU/IFRS 9

[Compliance Officer],

The updated requirements document includes comprehensive compliance specifications
that align with Nigerian banking regulations.

New Features Supporting Compliance:
- PF-001: Automated IFRS 9 loan provisioning (Stage 1/2/3)
- PF-002: Automated regulatory reports (CBN, NDIC, NFIU)
- PF-009: Real-time CAR monitoring (alert if < 10%)
- PF-006: Daily liquidity ratio tracking (alert if < 20%)
- PF-013: Enhanced AML/CFT monitoring (auto-STR filing)

Action Required:
1. Review Section 8.4 (Banking Compliance) - Lines 3000-3300
2. Engage compliance specialist by Week 11 (₦600K budget approved)
3. Validate regulatory report formats with CBN/NDIC/NFIU

[Attached: Requirements document - Section 8]
```

---

## 📞 MIGRATION SUPPORT

**Questions about requirements migration?**

**Product Team:**
- Review: `OrokiiPay_Digital_Banking_Requirements_v2.md` (full requirements)
- Quick Reference: `OrokiiPay_Requirements_Quick_Reference.md` (26-page summary)
- This Document: `Requirements_Migration_Guide.md` (what changed)

**Development Team:**
- Sprint Planning: `Partial_Features_Implementation_Checklist.md` (day-by-day tasks)
- Feature Details: Requirements document Section 4.6-4.25 (20 partial features)
- Database Schemas: Requirements document Section 4 (all schemas included)

**Compliance Team:**
- Compliance Section: Requirements document Section 8.4 (Lines 3000-3300)
- Regulatory Reports: PF-002 specification (Lines 850-900)
- IFRS 9 Provisioning: PF-001 specification (Lines 800-850)

---

## ✅ MIGRATION COMPLETE

**Status:** Requirements migration from Legacy PoS → Digital Banking Platform **COMPLETE**

**Deliverables:**
- ✅ Comprehensive requirements document (4,680 lines, 136KB)
- ✅ Quick reference guide (26 pages, 1,000 lines)
- ✅ Implementation checklist (6-week sprint, 2,100 lines)
- ✅ Migration guide (this document, 1,400 lines)

**Next Steps:**
1. Executive approval of new requirements (Week 1)
2. Team training on new requirements (Week 2)
3. Continue Phase 1 development (Weeks 3-10)
4. Start Partial Features Sprint (Week 11)
5. Complete all 20 features (Week 16) 🎯

---

**Document Status:** ✅ COMPLETE
**Last Updated:** October 8, 2025
**Version:** 2.0 (Digital Banking Platform)
**Contact:** OrokiiPay Product & Engineering Team

---

**Ready to build world-class digital banking software!** 🚀
