# Partial Features Implementation Checklist (Weeks 11-16)

**Sprint Duration:** 6 weeks (42 days)
**Team:** 2 Backend Developers + 1 Frontend Developer + 0.5 QA Engineer
**Budget:** ₦12M
**Goal:** Complete 20 partial features from 13% → 100%

---

## 🎯 SPRINT OVERVIEW

| Week | Focus | Features | Hours | Status |
|------|-------|----------|-------|--------|
| **Week 11** | Foundation & Schemas | PF-001, PF-002, PF-003, PF-005 | 68h | ⬜ Not Started |
| **Week 12** | Core APIs & Logic | PF-001, PF-002, PF-003, PF-004, PF-005 | 112h | ⬜ Not Started |
| **Week 13** | UI & Integration | PF-001, PF-002, PF-003, PF-004, PF-007 | 120h | ⬜ Not Started |
| **Week 14** | High Priority | PF-006, PF-007, PF-008, PF-016, PF-018 | 84h | ⬜ Not Started |
| **Week 15** | Analytics & Workflows | PF-009, PF-010, PF-017, PF-019, PF-020 | 72h | ⬜ Not Started |
| **Week 16** | Polish & Documentation | PF-011 to PF-015 | 124h | ⬜ Not Started |

**Milestone Gates:**
- ✅ Week 13: All CRITICAL features (5/20) → 100%
- ✅ Week 15: All HIGH priority features (10/20) → 100%
- ✅ Week 16: ALL features (20/20) → 100%

---

## 📅 WEEK 11: FOUNDATION & SCHEMAS (68 hours)

**Focus:** Database schema design, compliance research, architecture planning

### Monday (Week 11, Day 1)

**Morning Session (9:00 AM - 12:00 PM)**

- [ ] **Kick-off Meeting (All Team)** - 2 hours
  - [ ] Review sprint objectives and success criteria
  - [ ] Assign features to developers
  - [ ] Set up communication channels (Slack, daily standup time)
  - [ ] Review development environment setup
  - [ ] Confirm database access (tenant_fmfb_db, platform database)

- [ ] **Backend Dev 1: PF-001 Loan Lifecycle Schema Design** - 1 hour
  - [ ] Review existing `loans` table structure
  - [ ] Design `loan_restructurings` table (id, loan_id, old_tenure, new_tenure, old_rate, new_rate, reason, approved_by, created_at)
  - [ ] Design `loan_write_offs` table (id, loan_id, amount, reason, approved_by, written_off_at)
  - [ ] Design `loan_provisions` table (id, loan_id, stage, provision_rate, provision_amount, calculated_at)
  - [ ] Document schema in SQL migration file

**Afternoon Session (1:00 PM - 5:00 PM)**

- [ ] **Backend Dev 2: PF-002 Regulatory Reports Research** - 4 hours
  - [ ] Download CBN reporting templates (monthly returns, quarterly returns)
  - [ ] Review NDIC deposit insurance report format
  - [ ] Study NFIU CTR/STR submission requirements
  - [ ] Research IFRS 9 financial statement structure
  - [ ] Document report specifications (fields, formats, deadlines)
  - [ ] Create `regulatory_reports` table schema

- [ ] **Backend Dev 1: PF-005 Account Lien Schema** - 3 hours
  - [ ] Design `account_liens` table (id, tenant_id, account_id, lien_amount, lien_type, reference_type, reference_id, status, placed_by, placed_at, released_by, released_at)
  - [ ] Create `get_available_balance(account_id)` PostgreSQL function
  - [ ] Write SQL migration file (database/migrations/019_account_liens.sql)

- [ ] **Frontend Dev: Environment Setup** - 4 hours
  - [ ] Pull latest code from `feature/transfer-transactions-mgmt` branch
  - [ ] Install dependencies (`npm install`)
  - [ ] Set up local database connection to `tenant_fmfb_db`
  - [ ] Verify API endpoints are accessible (Postman collection)
  - [ ] Review design mockups for partial features UI

---

### Tuesday (Week 11, Day 2)

**Backend Dev 1** (8 hours)
- [ ] **PF-003: Approval Workflows Schema** - 4 hours
  - [ ] Design `approval_workflows` table (id, name, entity_type, conditions, levels, escalation_rules)
  - [ ] Design `approval_requests` table (id, workflow_id, entity_id, entity_type, requested_by, current_level, status)
  - [ ] Design `approval_actions` table (id, request_id, approver_id, action, comment, acted_at)
  - [ ] Design `approval_delegates` table (id, user_id, delegate_to, start_date, end_date)
  - [ ] Write SQL migration file (database/migrations/020_approval_workflows.sql)

- [ ] **PF-001: IFRS 9 Provisioning Logic Pseudocode** - 4 hours
  - [ ] Document IFRS 9 stage calculation algorithm
  - [ ] Define provision rates (Stage 1: 1-2%, Stage 2: 10-25%, Stage 3: 50-100%)
  - [ ] Create flowchart for NPL classification
  - [ ] Write unit test cases for provisioning calculation

**Backend Dev 2** (8 hours)
- [ ] **PF-002: Regulatory Report Schemas** - 4 hours
  - [ ] Design `report_submissions` table (id, tenant_id, report_type, period_start, period_end, submitted_at, submitted_by)
  - [ ] Design `compliance_metrics` table (id, tenant_id, metric_name, value, calculated_at)
  - [ ] Create database views for CAR (Capital Adequacy Ratio) calculation
  - [ ] Create database views for Liquidity Ratio calculation

- [ ] **PF-004: GL Posting Schema** - 4 hours
  - [ ] Design `gl_accounts` table (id, tenant_id, account_code, account_name, account_type, parent_account, is_active)
  - [ ] Design `gl_postings` table (id, tenant_id, account_id, debit, credit, reference_type, reference_id, posted_at)
  - [ ] Design `gl_batches` table (id, tenant_id, batch_date, total_debit, total_credit, status, posted_by)
  - [ ] Design `trial_balance` table (id, tenant_id, period_end, account_id, balance)

**Frontend Dev** (8 hours)
- [ ] **UI Component Library Review** - 4 hours
  - [ ] Review existing UI components (`src/components/ui/`)
  - [ ] Identify reusable components for partial features (Table, Form, Modal, Card)
  - [ ] Document missing components needed (ApprovalStatusBadge, LoanStageIndicator, ReportExportButton)

- [ ] **Design System Alignment** - 4 hours
  - [ ] Review tenant theming system (FMFB color scheme)
  - [ ] Create color palette for compliance status (green: compliant, yellow: warning, red: non-compliant)
  - [ ] Design icons for approval workflow states (pending, approved, rejected, escalated)

---

### Wednesday (Week 11, Day 3)

**Backend Dev 1** (8 hours)
- [ ] **PF-001: Create SQL Migration** - 3 hours
  - [ ] Write `database/migrations/021_loan_lifecycle.sql`
  - [ ] Include: loan_restructurings, loan_write_offs, loan_provisions tables
  - [ ] Add indexes on loan_id, tenant_id, created_at
  - [ ] Add foreign key constraints

- [ ] **PF-005: Create SQL Migration** - 3 hours
  - [ ] Write `database/migrations/019_account_liens.sql`
  - [ ] Include: account_liens table
  - [ ] Create `get_available_balance(p_account_id UUID)` function
  - [ ] Create trigger to prevent transactions if available balance < 0

- [ ] **Code Review & Testing** - 2 hours
  - [ ] Self-review SQL migrations (syntax, constraints, indexes)
  - [ ] Test migrations on local database (`npm run migrate`)
  - [ ] Verify table creation and function execution

**Backend Dev 2** (8 hours)
- [ ] **PF-002: Create SQL Migration** - 3 hours
  - [ ] Write `database/migrations/022_regulatory_reports.sql`
  - [ ] Include: regulatory_reports, report_submissions, compliance_metrics tables
  - [ ] Create database views: `vw_capital_adequacy`, `vw_liquidity_ratio`, `vw_npl_ratio`

- [ ] **PF-004: Create SQL Migration** - 3 hours
  - [ ] Write `database/migrations/023_gl_posting.sql`
  - [ ] Include: gl_accounts, gl_postings, gl_batches, trial_balance tables
  - [ ] Seed default Chart of Accounts (Assets, Liabilities, Equity, Income, Expenses)

- [ ] **Code Review & Testing** - 2 hours
  - [ ] Self-review SQL migrations
  - [ ] Test migrations on local database
  - [ ] Verify view calculations are correct (CAR, Liquidity Ratio)

**Frontend Dev** (8 hours)
- [ ] **PF-001: Loan Lifecycle UI Mockups** - 4 hours
  - [ ] Design loan details page layout (loan info, payment schedule, provisioning status)
  - [ ] Design loan restructuring modal (tenure input, interest rate input, reason textarea)
  - [ ] Design loan write-off confirmation dialog
  - [ ] Design IFRS 9 provisioning breakdown (Stage 1/2/3, provision amounts)

- [ ] **PF-002: Regulatory Reports UI Mockups** - 4 hours
  - [ ] Design reports dashboard (list of available reports, submission status)
  - [ ] Design report generation form (report type, period selection, export format)
  - [ ] Design compliance metrics dashboard (CAR, Liquidity Ratio, NPL Ratio gauges)

---

### Thursday (Week 11, Day 4)

**Backend Dev 1** (8 hours)
- [ ] **PF-003: Create SQL Migration** - 3 hours
  - [ ] Write `database/migrations/020_approval_workflows.sql`
  - [ ] Include: approval_workflows, approval_requests, approval_actions, approval_delegates tables
  - [ ] Seed default workflows (loan approvals, transaction reversals, limit changes)

- [ ] **PF-003: Approval Workflow Engine Pseudocode** - 4 hours
  - [ ] Document workflow trigger logic (amount-based, risk-based routing)
  - [ ] Define escalation mechanism (timeout → auto-escalate to next level)
  - [ ] Write algorithm for delegation resolution (check delegates first)
  - [ ] Create state machine diagram (pending → in_progress → approved/rejected)

- [ ] **Code Review** - 1 hour
  - [ ] Review PF-003 SQL migration
  - [ ] Test migration on local database

**Backend Dev 2** (8 hours)
- [ ] **PF-004: Chart of Accounts Seeding** - 4 hours
  - [ ] Create seed file: `database/seeds/001_chart_of_accounts.sql`
  - [ ] Define default GL accounts:
    - [ ] Assets: Cash (1000), Loans (1100), Fixed Assets (1200)
    - [ ] Liabilities: Customer Deposits (2000), Payables (2100)
    - [ ] Equity: Share Capital (3000), Retained Earnings (3100)
    - [ ] Income: Interest Income (4000), Fee Income (4100)
    - [ ] Expenses: Salaries (5000), Depreciation (5100), Provisions (5200)

- [ ] **PF-006: Treasury Operations Schema** - 4 hours
  - [ ] Design `treasury_accounts` table (id, tenant_id, account_name, account_type, balance)
  - [ ] Design `liquidity_tracking` table (id, tenant_id, date, total_deposits, liquid_assets, liquidity_ratio)
  - [ ] Design `settlement_transactions` table (id, tenant_id, transaction_id, settlement_date, status)

**Frontend Dev** (8 hours)
- [ ] **PF-003: Approval Workflows UI Mockups** - 4 hours
  - [ ] Design approval request card (entity details, requester, approval levels)
  - [ ] Design approval action buttons (Approve, Reject, Escalate)
  - [ ] Design approval history timeline (who approved, when, comments)
  - [ ] Design delegation management screen

- [ ] **PF-004: GL Posting UI Mockups** - 4 hours
  - [ ] Design Chart of Accounts tree view (expandable account hierarchy)
  - [ ] Design manual journal entry form (debit/credit, account selection, reference)
  - [ ] Design trial balance report table (account, debit, credit, balance)

---

### Friday (Week 11, Day 5)

**Backend Dev 1** (8 hours)
- [ ] **Week 11 Code Review & Consolidation** - 4 hours
  - [ ] Review all SQL migrations created this week (019-021)
  - [ ] Run migrations on fresh database to ensure no errors
  - [ ] Document migration order and dependencies
  - [ ] Create rollback scripts for each migration

- [ ] **PF-001: Unit Test Setup** - 4 hours
  - [ ] Create test file: `server/__tests__/services/loanLifecycle.test.ts`
  - [ ] Write test cases for IFRS 9 provisioning calculation
  - [ ] Set up test database fixtures (sample loans with varying overdue days)

**Backend Dev 2** (8 hours)
- [ ] **Week 11 Code Review & Consolidation** - 4 hours
  - [ ] Review all SQL migrations created this week (022-023)
  - [ ] Test regulatory report database views (vw_capital_adequacy, vw_liquidity_ratio)
  - [ ] Verify Chart of Accounts seeding script

- [ ] **PF-002: Unit Test Setup** - 4 hours
  - [ ] Create test file: `server/__tests__/services/regulatoryReports.test.ts`
  - [ ] Write test cases for CAR calculation
  - [ ] Write test cases for Liquidity Ratio calculation

**Frontend Dev** (8 hours)
- [ ] **Component Development - Shared Components** - 8 hours
  - [ ] Create `ApprovalStatusBadge.tsx` (pending, approved, rejected, escalated)
  - [ ] Create `LoanStageIndicator.tsx` (Stage 1/2/3 with color coding)
  - [ ] Create `ReportExportButton.tsx` (PDF, Excel, CSV export)
  - [ ] Create `ComplianceMetricGauge.tsx` (CAR, Liquidity Ratio visualization)
  - [ ] Write unit tests for each component

**Team Activity** (2 hours)
- [ ] **Weekly Review Meeting (Friday 4:00 PM)** - 1 hour
  - [ ] Demo completed database schemas
  - [ ] Review compliance research findings
  - [ ] Discuss blockers and challenges
  - [ ] Plan Week 12 tasks

- [ ] **Week 11 Status Update to Leadership** - 1 hour
  - [ ] Document completed tasks (schemas, migrations, research)
  - [ ] Report progress metrics (hours spent, deliverables completed)
  - [ ] Flag any risks or dependencies

---

## 📅 WEEK 12: CORE APIS & BUSINESS LOGIC (112 hours)

**Focus:** Backend API development, business logic implementation, service layer

### Monday (Week 12, Day 6)

**Backend Dev 1** (8 hours)
- [ ] **PF-001: Loan Restructuring API** - 8 hours
  - [ ] Create service: `server/services/loans/LoanLifecycleService.ts`
  - [ ] Implement `restructureLoan(loanId, newTenure, newRate, reason, approvedBy)` method
    - [ ] Validate loan exists and is active
    - [ ] Insert record into `loan_restructurings` table
    - [ ] Update `loans` table (tenure, interest_rate)
    - [ ] Recalculate payment schedule
    - [ ] Log audit trail
  - [ ] Create API endpoint: `POST /api/v1/loans/:id/restructure`
  - [ ] Write validation middleware (tenure: 3-60 months, rate: 1-50%)
  - [ ] Write unit tests (3 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-002: CAR Calculation Service** - 8 hours
  - [ ] Create service: `server/services/compliance/RegulatoryReportsService.ts`
  - [ ] Implement `calculateCAR(tenantId, periodEnd)` method
    - [ ] Calculate Tier 1 Capital (share capital, retained earnings)
    - [ ] Calculate Tier 2 Capital (subordinated debt, loan loss reserves)
    - [ ] Calculate Risk-Weighted Assets (loans × risk weight)
    - [ ] Return CAR = (Tier 1 + Tier 2) / RWA
  - [ ] Create database function: `calculate_car(p_tenant_id, p_period_end)`
  - [ ] Write unit tests (CAR > 10% = compliant, < 10% = non-compliant)

**Frontend Dev** (8 hours)
- [ ] **PF-001: Loan Details Page** - 8 hours
  - [ ] Create screen: `src/screens/loans/LoanDetailsScreen.tsx`
  - [ ] Implement loan info card (loan amount, tenure, interest rate, status)
  - [ ] Implement payment schedule table (due date, amount, status)
  - [ ] Implement provisioning breakdown (Stage 1/2/3, provision amount)
  - [ ] Add "Restructure Loan" button (opens modal)
  - [ ] Add "Write Off Loan" button (with confirmation dialog)
  - [ ] Integrate with API: `GET /api/v1/loans/:id`

---

### Tuesday (Week 12, Day 7)

**Backend Dev 1** (8 hours)
- [ ] **PF-001: Loan Write-Off API** - 4 hours
  - [ ] Implement `writeOffLoan(loanId, amount, reason, approvedBy)` method
    - [ ] Validate loan is NPL (>365 days overdue)
    - [ ] Insert record into `loan_write_offs` table
    - [ ] Update `loans` table (status = 'written_off')
    - [ ] Create GL posting (Debit: Loan Loss Expense, Credit: Loans)
    - [ ] Update provision to 100%
  - [ ] Create API endpoint: `POST /api/v1/loans/:id/write-off`
  - [ ] Write unit tests (2 test cases)

- [ ] **PF-001: IFRS 9 Provisioning API** - 4 hours
  - [ ] Implement `calculateIFRS9Provision(loan)` method
    - [ ] Calculate days overdue
    - [ ] Determine stage (≤30: Stage 1, 31-90: Stage 2, >90: Stage 3)
    - [ ] Calculate provision rate based on stage
    - [ ] Insert record into `loan_provisions` table
  - [ ] Create scheduled job: `jobs/calculateDailyProvisions.ts` (runs daily at 11:59 PM)
  - [ ] Create API endpoint: `GET /api/v1/loans/:id/provisioning`

**Backend Dev 2** (8 hours)
- [ ] **PF-002: Liquidity Ratio Calculation Service** - 4 hours
  - [ ] Implement `calculateLiquidityRatio(tenantId, date)` method
    - [ ] Calculate Liquid Assets (cash + near-cash)
    - [ ] Calculate Total Deposits (customer deposits)
    - [ ] Return Liquidity Ratio = Liquid Assets / Total Deposits
  - [ ] Create database function: `calculate_liquidity_ratio(p_tenant_id, p_date)`
  - [ ] Write unit tests (Ratio > 20% = compliant, < 20% = warning)

- [ ] **PF-002: NPL Ratio Calculation Service** - 4 hours
  - [ ] Implement `calculateNPLRatio(tenantId, periodEnd)` method
    - [ ] Calculate NPL Amount (loans with >90 days overdue)
    - [ ] Calculate Total Loans
    - [ ] Return NPL Ratio = NPL Amount / Total Loans
  - [ ] Create database function: `calculate_npl_ratio(p_tenant_id, p_period_end)`
  - [ ] Write unit tests (Ratio < 5% = healthy, 5-10% = watch, >10% = critical)

**Frontend Dev** (8 hours)
- [ ] **PF-001: Loan Restructuring Modal** - 4 hours
  - [ ] Create component: `src/components/loans/LoanRestructuringModal.tsx`
  - [ ] Implement form fields (new tenure, new interest rate, reason)
  - [ ] Add validation (tenure: 3-60 months, rate: 1-50%)
  - [ ] Implement form submission (call `POST /api/v1/loans/:id/restructure`)
  - [ ] Show success/error messages
  - [ ] Close modal on success and refresh loan details

- [ ] **PF-001: Loan Write-Off Dialog** - 4 hours
  - [ ] Create component: `src/components/loans/LoanWriteOffDialog.tsx`
  - [ ] Implement confirmation message (bold warning about irreversible action)
  - [ ] Add reason textarea (required, min 20 characters)
  - [ ] Implement confirmation (call `POST /api/v1/loans/:id/write-off`)
  - [ ] Show success/error messages

---

### Wednesday (Week 12, Day 8)

**Backend Dev 1** (8 hours)
- [ ] **PF-005: Account Lien Placement API** - 4 hours
  - [ ] Create service: `server/services/accounts/AccountLienService.ts`
  - [ ] Implement `placeLien(accountId, amount, lienType, referenceId, placedBy)` method
    - [ ] Validate account has sufficient balance
    - [ ] Insert record into `account_liens` table
    - [ ] Log audit trail
  - [ ] Create API endpoint: `POST /api/v1/accounts/:id/liens`
  - [ ] Write unit tests (2 test cases)

- [ ] **PF-005: Account Lien Release API** - 4 hours
  - [ ] Implement `releaseLien(lienId, releasedBy)` method
    - [ ] Update `account_liens` table (status = 'released', released_at, released_by)
    - [ ] Log audit trail
  - [ ] Create API endpoint: `DELETE /api/v1/liens/:id`
  - [ ] Implement auto-release trigger (when loan is fully repaid)
  - [ ] Write unit tests (2 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-004: GL Account Management API** - 4 hours
  - [ ] Create service: `server/services/accounting/GLAccountService.ts`
  - [ ] Implement `createGLAccount(accountCode, accountName, accountType, parentAccount)` method
  - [ ] Implement `getChartOfAccounts(tenantId)` method (hierarchical tree structure)
  - [ ] Create API endpoints:
    - [ ] `POST /api/v1/gl/accounts` (create GL account)
    - [ ] `GET /api/v1/gl/accounts` (list all GL accounts)
    - [ ] `GET /api/v1/gl/accounts/:id` (get GL account details)
  - [ ] Write unit tests (3 test cases)

- [ ] **PF-004: GL Posting API** - 4 hours
  - [ ] Implement `createGLPosting(accountId, debit, credit, referenceType, referenceId)` method
    - [ ] Validate debit/credit balance (total debit = total credit in transaction)
    - [ ] Insert record into `gl_postings` table
    - [ ] Update account balance
  - [ ] Implement `createGLBatch(postings[], batchDate)` method (batch posting)
  - [ ] Create API endpoint: `POST /api/v1/gl/postings`
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-002: Regulatory Reports Dashboard** - 8 hours
  - [ ] Create screen: `src/screens/compliance/RegulatoryReportsDashboard.tsx`
  - [ ] Implement report list table (report name, period, submission date, status)
  - [ ] Implement compliance metrics gauges (CAR, Liquidity Ratio, NPL Ratio)
    - [ ] Use `ComplianceMetricGauge` component created in Week 11
    - [ ] Color coding: Green (compliant), Yellow (warning), Red (non-compliant)
  - [ ] Add "Generate Report" button (opens report generation modal)
  - [ ] Integrate with API: `GET /api/v1/compliance/reports`

---

### Thursday (Week 12, Day 9)

**Backend Dev 1** (8 hours)
- [ ] **PF-003: Approval Workflow Engine - Part 1** - 8 hours
  - [ ] Create service: `server/services/approvals/ApprovalWorkflowService.ts`
  - [ ] Implement `createApprovalRequest(workflowId, entityId, entityType, requestedBy)` method
    - [ ] Fetch workflow configuration
    - [ ] Determine initial approval level (based on conditions)
    - [ ] Insert record into `approval_requests` table
    - [ ] Send notification to approver
  - [ ] Implement `approveRequest(requestId, approverId, comment)` method
    - [ ] Validate approver has permission
    - [ ] Insert record into `approval_actions` table (action = 'approved')
    - [ ] Check if all levels approved → update request status to 'approved'
    - [ ] Otherwise, move to next level
  - [ ] Write unit tests (2 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-004: Trial Balance Generation** - 4 hours
  - [ ] Implement `generateTrialBalance(tenantId, periodEnd)` method
    - [ ] Calculate balance for each GL account (debit - credit)
    - [ ] Verify total debits = total credits
    - [ ] Insert records into `trial_balance` table
  - [ ] Create API endpoint: `POST /api/v1/gl/trial-balance`
  - [ ] Create API endpoint: `GET /api/v1/gl/trial-balance/:periodEnd` (retrieve trial balance)
  - [ ] Write unit tests (1 test case)

- [ ] **PF-006: Treasury Liquidity Tracking** - 4 hours
  - [ ] Create service: `server/services/treasury/TreasuryService.ts`
  - [ ] Implement `trackDailyLiquidity(tenantId, date)` method
    - [ ] Calculate total deposits
    - [ ] Calculate liquid assets (cash + bank balances)
    - [ ] Calculate liquidity ratio
    - [ ] Insert record into `liquidity_tracking` table
    - [ ] Alert if liquidity ratio < 20% (CBN threshold)
  - [ ] Create scheduled job: `jobs/calculateDailyLiquidity.ts` (runs daily at midnight)
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-002: Report Generation Modal** - 4 hours
  - [ ] Create component: `src/components/compliance/ReportGenerationModal.tsx`
  - [ ] Implement form fields (report type dropdown, period start/end datepickers, export format)
  - [ ] Add validation (period must be complete month/quarter)
  - [ ] Implement form submission (call `POST /api/v1/compliance/reports/generate`)
  - [ ] Show loading state during report generation
  - [ ] Provide download link when report is ready

- [ ] **PF-003: Approval Request Card** - 4 hours
  - [ ] Create component: `src/components/approvals/ApprovalRequestCard.tsx`
  - [ ] Implement entity details display (loan, transaction, limit change)
  - [ ] Implement approval levels timeline (Level 1 → Level 2 → Level 3)
  - [ ] Add approval action buttons (Approve, Reject, Escalate)
  - [ ] Show approval history (who approved, when, comments)

---

### Friday (Week 12, Day 10)

**Backend Dev 1** (8 hours)
- [ ] **PF-003: Approval Workflow Engine - Part 2** - 4 hours
  - [ ] Implement `rejectRequest(requestId, approverId, reason)` method
    - [ ] Insert record into `approval_actions` table (action = 'rejected')
    - [ ] Update request status to 'rejected'
    - [ ] Send notification to requester
  - [ ] Implement `escalateRequest(requestId, escalatedBy, reason)` method
    - [ ] Move to next approval level
    - [ ] Send notification to next approver
  - [ ] Implement delegation resolution (check `approval_delegates` table)
  - [ ] Write unit tests (3 test cases)

- [ ] **Week 12 Integration Testing** - 4 hours
  - [ ] Test PF-001 APIs end-to-end (restructure → provisioning update)
  - [ ] Test PF-005 APIs end-to-end (place lien → verify available balance)
  - [ ] Test PF-003 approval workflow (create request → approve → escalate)

**Backend Dev 2** (8 hours)
- [ ] **PF-002: Report Generation Service** - 4 hours
  - [ ] Implement `generateCBNMonthlyReturn(tenantId, period)` method
    - [ ] Query data from database views
    - [ ] Format data according to CBN template
    - [ ] Generate PDF report (using puppeteer or pdfkit)
    - [ ] Store report in Cloud Storage
    - [ ] Insert record into `report_submissions` table
  - [ ] Implement `generateNDICDepositReport(tenantId, period)` method
  - [ ] Write unit tests (2 test cases)

- [ ] **Week 12 Integration Testing** - 4 hours
  - [ ] Test PF-002 report generation end-to-end (CAR calculation → PDF export)
  - [ ] Test PF-004 GL posting (create account → post transaction → trial balance)
  - [ ] Test PF-006 liquidity tracking (calculate daily → alert if < 20%)

**Frontend Dev** (8 hours)
- [ ] **PF-003: Approval Workflows Screen** - 4 hours
  - [ ] Create screen: `src/screens/approvals/ApprovalWorkflowsScreen.tsx`
  - [ ] Implement filter tabs (Pending, Approved, Rejected, All)
  - [ ] Implement approval request list (use `ApprovalRequestCard` component)
  - [ ] Implement pagination (10 requests per page)
  - [ ] Integrate with API: `GET /api/v1/approvals/requests`

- [ ] **Week 12 Frontend Integration Testing** - 4 hours
  - [ ] Test PF-001 loan restructuring flow (open modal → submit → verify update)
  - [ ] Test PF-002 report generation flow (select report → generate → download)
  - [ ] Test PF-003 approval flow (approve request → verify status change)

**Team Activity** (2 hours)
- [ ] **Weekly Review Meeting (Friday 4:00 PM)** - 1 hour
  - [ ] Demo completed APIs (Postman collection)
  - [ ] Review integration test results
  - [ ] Discuss Week 13 UI development priorities
  - [ ] Address any blockers

- [ ] **Week 12 Status Update to Leadership** - 1 hour
  - [ ] Document completed APIs (PF-001, PF-002, PF-003, PF-004, PF-005, PF-006 backends)
  - [ ] Report test coverage metrics (target: >80% unit tests)
  - [ ] Flag any API performance issues

---

## 📅 WEEK 13: UI & INTEGRATION (120 hours)

**Focus:** Frontend UI completion, end-to-end integration, testing

### Monday (Week 13, Day 11)

**Backend Dev 1** (8 hours)
- [ ] **PF-007: Batch Customer Upload - Backend** - 8 hours
  - [ ] Create service: `server/services/customers/BatchCustomerUploadService.ts`
  - [ ] Implement `validateCSV(file)` method
    - [ ] Validate CSV headers (required fields: first_name, last_name, email, phone, bvn)
    - [ ] Validate data types and formats (email, phone, BVN)
    - [ ] Check for duplicates (BVN, email, phone)
    - [ ] Return validation errors by row number
  - [ ] Implement `processCSV(file, uploadedBy)` method
    - [ ] Validate BVN with NIBSS
    - [ ] Create customer accounts
    - [ ] Generate account numbers
    - [ ] Send welcome emails/SMS
    - [ ] Track success/failure per row
  - [ ] Create API endpoints:
    - [ ] `POST /api/v1/customers/batch-upload` (upload CSV)
    - [ ] `GET /api/v1/customers/batch-uploads/:id/status` (check progress)
  - [ ] Write unit tests (3 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-008: Financial Reports - Balance Sheet** - 8 hours
  - [ ] Create service: `server/services/accounting/FinancialReportsService.ts`
  - [ ] Implement `generateBalanceSheet(tenantId, periodEnd)` method
    - [ ] Assets: Current Assets (Cash, Loans) + Fixed Assets
    - [ ] Liabilities: Current Liabilities (Deposits) + Long-term Liabilities
    - [ ] Equity: Share Capital + Retained Earnings
    - [ ] Verify: Assets = Liabilities + Equity
  - [ ] Generate PDF report (balance sheet format)
  - [ ] Create API endpoint: `POST /api/v1/reports/balance-sheet`
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-004: Chart of Accounts Screen** - 8 hours
  - [ ] Create screen: `src/screens/accounting/ChartOfAccountsScreen.tsx`
  - [ ] Implement tree view for account hierarchy (parent → child accounts)
  - [ ] Implement expandable/collapsible nodes
  - [ ] Add "Create Account" button (opens modal)
  - [ ] Implement account search/filter
  - [ ] Show account details (code, name, type, balance)
  - [ ] Integrate with API: `GET /api/v1/gl/accounts`

---

### Tuesday (Week 13, Day 12)

**Backend Dev 1** (8 hours)
- [ ] **PF-007: Batch Upload Job Queue** - 4 hours
  - [ ] Implement async job using Bull queue
  - [ ] Create job: `jobs/processBatchCustomerUpload.ts`
  - [ ] Handle large CSV files (up to 10,000 rows)
  - [ ] Implement progress tracking (rows processed / total rows)
  - [ ] Send email notification on completion

- [ ] **PF-003: Approval Workflow Triggers** - 4 hours
  - [ ] Integrate approval workflows with loan approval process
    - [ ] Trigger approval workflow when loan amount > ₦100K
  - [ ] Integrate with transaction reversal process
    - [ ] Require manager approval for reversals
  - [ ] Integrate with limit change process
  - [ ] Write integration tests (3 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-008: Profit & Loss Report** - 4 hours
  - [ ] Implement `generateProfitAndLoss(tenantId, periodStart, periodEnd)` method
    - [ ] Revenue: Interest Income + Fee Income
    - [ ] Expenses: Salaries + Depreciation + Provisions + Operating Expenses
    - [ ] Net Income = Revenue - Expenses
  - [ ] Generate PDF report (P&L format)
  - [ ] Create API endpoint: `POST /api/v1/reports/profit-and-loss`
  - [ ] Write unit tests (1 test case)

- [ ] **PF-018: Posting Management Enhancement** - 4 hours
  - [ ] Implement bulk posting reversal
  - [ ] Implement posting approval workflow (for manual journal entries)
  - [ ] Add posting templates (common transaction types)
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-004: Manual Journal Entry Form** - 4 hours
  - [ ] Create component: `src/components/accounting/JournalEntryForm.tsx`
  - [ ] Implement debit/credit line items (dynamic add/remove rows)
  - [ ] Validate total debit = total credit
  - [ ] Implement account selection dropdown (searchable)
  - [ ] Add reference field (transaction ID, document number)
  - [ ] Implement form submission (call `POST /api/v1/gl/postings`)

- [ ] **PF-004: Trial Balance Screen** - 4 hours
  - [ ] Create screen: `src/screens/accounting/TrialBalanceScreen.tsx`
  - [ ] Implement period selector (month/quarter/year)
  - [ ] Implement trial balance table (account, debit, credit, balance)
  - [ ] Show totals row (verify debit = credit)
  - [ ] Add export button (PDF, Excel)
  - [ ] Integrate with API: `GET /api/v1/gl/trial-balance/:periodEnd`

---

### Wednesday (Week 13, Day 13)

**Backend Dev 1** (8 hours)
- [ ] **PF-001: Loan Repayment Integration** - 4 hours
  - [ ] Update loan repayment service to:
    - [ ] Recalculate IFRS 9 provisioning after payment
    - [ ] Auto-release account lien if loan fully repaid
    - [ ] Update loan status (performing → NPL → written_off based on days overdue)
  - [ ] Write integration tests (2 test cases)

- [ ] **PF-005: Available Balance Integration** - 4 hours
  - [ ] Update transaction service to check available balance (not just account balance)
  - [ ] Prevent transactions if available balance < transaction amount
  - [ ] Update account balance API to return available balance
  - [ ] Write integration tests (2 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-002: Scheduled Report Generation** - 4 hours
  - [ ] Create scheduled jobs for regulatory reports:
    - [ ] Monthly reports (run on 1st of month for previous month)
    - [ ] Quarterly reports (run on 1st of quarter for previous quarter)
  - [ ] Implement auto-submission to CBN/NDIC (if API available)
  - [ ] Send email alerts to compliance officer

- [ ] **PF-004: EOD Reconciliation** - 4 hours
  - [ ] Implement `runEODReconciliation(tenantId, date)` method
    - [ ] Reconcile transactions with GL postings
    - [ ] Generate daily trial balance
    - [ ] Flag discrepancies
  - [ ] Create scheduled job: `jobs/runEODReconciliation.ts` (runs daily at 11:59 PM)
  - [ ] Write integration tests (1 test case)

**Frontend Dev** (8 hours)
- [ ] **PF-007: Batch Customer Upload Screen** - 8 hours
  - [ ] Create screen: `src/screens/customers/BatchCustomerUploadScreen.tsx`
  - [ ] Implement CSV file upload (drag & drop)
  - [ ] Show CSV validation errors (by row number)
  - [ ] Implement progress bar (rows processed / total)
  - [ ] Show upload results (success count, failure count, error details)
  - [ ] Provide download link for error report (CSV with error messages)
  - [ ] Integrate with API: `POST /api/v1/customers/batch-upload`

---

### Thursday (Week 13, Day 14)

**Backend Dev 1** (8 hours)
- [ ] **Week 13 Critical Features Testing** - 4 hours
  - [ ] End-to-end test: Loan lifecycle (disbursement → repayment → provisioning → write-off)
  - [ ] End-to-end test: Approval workflow (create → approve → escalate → reject)
  - [ ] End-to-end test: Account lien (place → verify balance → release)
  - [ ] Performance test: Batch customer upload (10,000 rows)

- [ ] **API Documentation** - 4 hours
  - [ ] Document all PF-001 APIs (Swagger/OpenAPI)
  - [ ] Document all PF-003 APIs
  - [ ] Document all PF-005 APIs
  - [ ] Update Postman collection

**Backend Dev 2** (8 hours)
- [ ] **Week 13 Critical Features Testing** - 4 hours
  - [ ] End-to-end test: Regulatory reports (CAR → report generation → PDF export)
  - [ ] End-to-end test: GL posting (journal entry → trial balance)
  - [ ] End-to-end test: Financial reports (balance sheet, P&L)
  - [ ] Performance test: Report generation (large dataset - 100K transactions)

- [ ] **API Documentation** - 4 hours
  - [ ] Document all PF-002 APIs (Swagger/OpenAPI)
  - [ ] Document all PF-004 APIs
  - [ ] Document all PF-008 APIs
  - [ ] Update Postman collection

**Frontend Dev** (8 hours)
- [ ] **PF-008: Financial Reports Screen** - 8 hours
  - [ ] Create screen: `src/screens/accounting/FinancialReportsScreen.tsx`
  - [ ] Implement report type tabs (Balance Sheet, Profit & Loss, Trial Balance)
  - [ ] Implement period selector (month/quarter/year)
  - [ ] Implement report preview (table format)
  - [ ] Add export buttons (PDF, Excel)
  - [ ] Integrate with APIs:
    - [ ] `POST /api/v1/reports/balance-sheet`
    - [ ] `POST /api/v1/reports/profit-and-loss`

---

### Friday (Week 13, Day 15) - **MILESTONE: CRITICAL Features → 100%**

**Backend Dev 1** (8 hours)
- [ ] **Critical Features Bug Fixes** - 4 hours
  - [ ] Review and fix bugs from testing (PF-001, PF-003, PF-005)
  - [ ] Address performance issues
  - [ ] Refactor code for readability

- [ ] **Code Review & Merge** - 4 hours
  - [ ] Self-review all code changes
  - [ ] Create pull request for PF-001, PF-003, PF-005
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**Backend Dev 2** (8 hours)
- [ ] **Critical Features Bug Fixes** - 4 hours
  - [ ] Review and fix bugs from testing (PF-002, PF-004, PF-008)
  - [ ] Address report generation performance issues
  - [ ] Optimize database queries

- [ ] **Code Review & Merge** - 4 hours
  - [ ] Self-review all code changes
  - [ ] Create pull request for PF-002, PF-004, PF-008
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**Frontend Dev** (8 hours)
- [ ] **UI Polish & Bug Fixes** - 4 hours
  - [ ] Review all completed screens for UX issues
  - [ ] Fix layout issues (responsiveness, mobile view)
  - [ ] Add loading states and error handling
  - [ ] Improve accessibility (ARIA labels, keyboard navigation)

- [ ] **Code Review & Merge** - 4 hours
  - [ ] Self-review all code changes
  - [ ] Create pull request for all UI components
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**QA Engineer** (8 hours)
- [ ] **Week 13 QA Testing** - 8 hours
  - [ ] Regression testing on all CRITICAL features
  - [ ] UI/UX testing (cross-browser: Chrome, Safari, Firefox)
  - [ ] Mobile testing (iOS, Android)
  - [ ] Create bug reports for any issues found
  - [ ] Verify bug fixes

**Team Activity** (2 hours)
- [ ] **MILESTONE REVIEW (Friday 3:00 PM)** - 2 hours
  - [ ] **Demo all 5 CRITICAL features to executives**
    - [ ] PF-001: Loan Lifecycle Management ✅
    - [ ] PF-002: Regulatory Reports ✅
    - [ ] PF-003: Approval Workflows ✅
    - [ ] PF-004: GL Posting & Batch Operations ✅
    - [ ] PF-005: Account Lien Management ✅
  - [ ] **Review success criteria:**
    - [ ] All 5 CRITICAL features → 100% complete
    - [ ] Regulatory reports operational
    - [ ] Test coverage > 80%
    - [ ] No critical bugs
  - [ ] **Celebrate Week 13 milestone!** 🎉
  - [ ] Plan Week 14 (HIGH priority features)

---

## 📅 WEEK 14: HIGH PRIORITY FEATURES (84 hours)

**Focus:** Treasury operations, batch operations, financial reporting enhancements

### Monday (Week 14, Day 16)

**Backend Dev 1** (8 hours)
- [ ] **PF-016: Business Management Enhancement** - 8 hours
  - [ ] Implement automated EOD (End of Day) processing
    - [ ] Calculate interest accruals for all accounts
    - [ ] Update account balances
    - [ ] Generate daily reports
  - [ ] Create scheduled job: `jobs/runEODProcess.ts`
  - [ ] Add manual EOD trigger (for catch-up processing)
  - [ ] Write unit tests (2 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-006: Treasury Account Management** - 8 hours
  - [ ] Extend TreasuryService with account management
  - [ ] Implement `createTreasuryAccount(accountName, accountType)` method
  - [ ] Implement `getTreasuryDashboard(tenantId)` method
    - [ ] Show total cash position
    - [ ] Show daily liquidity ratio
    - [ ] Show settlement status
  - [ ] Create API endpoints:
    - [ ] `POST /api/v1/treasury/accounts`
    - [ ] `GET /api/v1/treasury/dashboard`
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-006: Treasury Dashboard** - 8 hours
  - [ ] Create screen: `src/screens/treasury/TreasuryDashboardScreen.tsx`
  - [ ] Implement cash position card (total cash, breakdown by account)
  - [ ] Implement liquidity ratio gauge (with threshold indicator at 20%)
  - [ ] Implement settlement status table (pending, completed, failed)
  - [ ] Add date range filter
  - [ ] Integrate with API: `GET /api/v1/treasury/dashboard`

---

### Tuesday (Week 14, Day 17)

**Backend Dev 1** (8 hours)
- [ ] **PF-016: EOD Reports Generation** - 4 hours
  - [ ] Generate daily summary report (total deposits, withdrawals, balance)
  - [ ] Generate daily transaction volume report
  - [ ] Email reports to bank management
  - [ ] Write unit tests (1 test case)

- [ ] **PF-018: Posting Templates** - 4 hours
  - [ ] Create posting templates for common transactions
    - [ ] Loan disbursement (Debit: Loans, Credit: Cash)
    - [ ] Loan repayment (Debit: Cash, Credit: Loans + Interest Income)
    - [ ] Deposit (Debit: Cash, Credit: Customer Deposits)
    - [ ] Withdrawal (Debit: Customer Deposits, Credit: Cash)
  - [ ] Implement `applyPostingTemplate(templateId, amount, referenceId)` method
  - [ ] Write unit tests (2 test cases)

**Backend Dev 2** (8 hours)
- [ ] **PF-006: Settlement Tracking** - 8 hours
  - [ ] Implement `trackSettlement(transactionId, settlementDate)` method
  - [ ] Create scheduled job to auto-settle transactions (T+0 for internal, T+1 for external)
  - [ ] Implement settlement reconciliation (match with bank statements)
  - [ ] Alert on settlement failures
  - [ ] Create API endpoint: `GET /api/v1/treasury/settlements`
  - [ ] Write unit tests (2 test cases)

**Frontend Dev** (8 hours)
- [ ] **PF-007: Batch Upload Enhancements** - 4 hours
  - [ ] Add CSV template download (with sample data)
  - [ ] Implement field mapping (allow custom CSV headers)
  - [ ] Add batch upload history (list of previous uploads)
  - [ ] Show upload details (uploaded by, date, success/failure counts)

- [ ] **PF-008: Financial Reports Enhancements** - 4 hours
  - [ ] Add comparison view (current period vs previous period)
  - [ ] Add chart visualizations (revenue trend, expense breakdown)
  - [ ] Implement drill-down (click on account → show transactions)
  - [ ] Add scheduled reports (auto-generate monthly/quarterly)

---

### Wednesday (Week 14, Day 18)

**Backend Dev 1** (8 hours)
- [ ] **Integration Testing: Week 14 Features** - 4 hours
  - [ ] Test PF-016 EOD process end-to-end
  - [ ] Test PF-018 posting templates
  - [ ] Performance test: EOD process with 100K accounts

- [ ] **Bug Fixes & Refactoring** - 4 hours
  - [ ] Fix any bugs found in testing
  - [ ] Refactor EOD process for performance
  - [ ] Add logging and monitoring

**Backend Dev 2** (8 hours)
- [ ] **Integration Testing: PF-006** - 4 hours
  - [ ] Test treasury operations end-to-end
  - [ ] Test settlement tracking and reconciliation
  - [ ] Performance test: Settlement processing with 10K transactions

- [ ] **Bug Fixes & Refactoring** - 4 hours
  - [ ] Fix any bugs found in testing
  - [ ] Optimize database queries for treasury dashboard
  - [ ] Add caching for frequently accessed data

**Frontend Dev** (8 hours)
- [ ] **UI Testing & Polish** - 8 hours
  - [ ] Test all Week 14 screens (Treasury Dashboard, Batch Upload, Financial Reports)
  - [ ] Fix UI bugs and responsiveness issues
  - [ ] Add loading states and error handling
  - [ ] Improve UX based on feedback

---

### Thursday (Week 14, Day 19)

**Backend Dev 1** (6 hours)
- [ ] **API Documentation** - 3 hours
  - [ ] Document PF-016, PF-018 APIs (Swagger)
  - [ ] Update Postman collection

- [ ] **Code Review & Merge** - 3 hours
  - [ ] Create pull request for PF-016, PF-018
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**Backend Dev 2** (6 hours)
- [ ] **API Documentation** - 3 hours
  - [ ] Document PF-006 APIs (Swagger)
  - [ ] Update Postman collection

- [ ] **Code Review & Merge** - 3 hours
  - [ ] Create pull request for PF-006
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**Frontend Dev** (6 hours)
- [ ] **Code Review & Merge** - 6 hours
  - [ ] Create pull request for all Week 14 UI changes
  - [ ] Address code review comments
  - [ ] Merge to `feature/partial-features` branch

**QA Engineer** (6 hours)
- [ ] **Week 14 QA Testing** - 6 hours
  - [ ] Regression testing on Week 14 features
  - [ ] UI/UX testing
  - [ ] Create bug reports
  - [ ] Verify bug fixes

**Team Activity** (2 hours)
- [ ] **Weekly Review Meeting (Thursday 4:00 PM)** - 2 hours
  - [ ] Demo Week 14 features
  - [ ] Review progress (10/20 features complete)
  - [ ] Plan Week 15 (Analytics & Workflows)
  - [ ] Address any blockers

---

## 📅 WEEK 15: ANALYTICS & WORKFLOWS (72 hours)

**Focus:** Loan analytics (PAR), NPL workflows, group lending, automation

### Monday-Friday (Week 15, Days 20-24)

**Backend Dev 1** (40 hours)
- [ ] **PF-009: Loan Analytics (PAR) - 24 hours**
  - [ ] Implement `calculatePAR30(tenantId, date)` method (loans 30+ days overdue)
  - [ ] Implement `calculatePAR60(tenantId, date)` method (loans 60+ days overdue)
  - [ ] Implement `calculatePAR90(tenantId, date)` method (loans 90+ days overdue)
  - [ ] Implement `calculateTotalRiskAsset(tenantId, date)` method
  - [ ] Create analytics dashboard API: `GET /api/v1/loans/analytics`
  - [ ] Create scheduled job to calculate daily analytics
  - [ ] Write unit tests (4 test cases)

- [ ] **PF-010: NPL Workflow System - 16 hours**
  - [ ] Implement auto-classification (loans >90 days → NPL status)
  - [ ] Create recovery workflow (assignment to recovery officer, follow-up tasks)
  - [ ] Implement NPL dashboard (total NPL amount, NPL ratio, recovery rate)
  - [ ] Create API endpoints:
    - [ ] `GET /api/v1/loans/npl` (list NPLs)
    - [ ] `POST /api/v1/loans/:id/assign-recovery` (assign to recovery officer)
    - [ ] `POST /api/v1/loans/:id/recovery-action` (log recovery action)
  - [ ] Write unit tests (3 test cases)

**Backend Dev 2** (40 hours)
- [ ] **PF-017: Group Lending Support - 16 hours**
  - [ ] Design `group_accounts` table (group_id, group_name, members[], created_at)
  - [ ] Design `group_savings` table (group_id, account_id, balance)
  - [ ] Implement `createGroupAccount(groupName, members[])` method
  - [ ] Implement group savings collection
  - [ ] Create API endpoints:
    - [ ] `POST /api/v1/groups` (create group)
    - [ ] `GET /api/v1/groups/:id` (get group details)
    - [ ] `POST /api/v1/groups/:id/savings` (group savings contribution)
  - [ ] Write unit tests (2 test cases)

- [ ] **PF-019: Loan Repayment Automation - 12 hours**
  - [ ] Implement auto-debit for loan repayments (on due date)
  - [ ] Create scheduled job: `jobs/processLoanRepayments.ts` (runs daily)
  - [ ] Implement retry mechanism for failed auto-debits
  - [ ] Send SMS alerts (3 days before due date, on due date, after missed payment)
  - [ ] Write unit tests (2 test cases)

- [ ] **PF-020: Credit Risk Exposure Tracking - 12 hours**
  - [ ] Implement `calculateCreditRiskExposure(tenantId)` method
    - [ ] Total loan portfolio
    - [ ] Concentration risk (top 10 borrowers)
    - [ ] Industry/sector exposure
  - [ ] Create API endpoint: `GET /api/v1/risk/credit-exposure`
  - [ ] Write unit tests (1 test case)

**Frontend Dev** (40 hours)
- [ ] **PF-009: Loan Analytics Dashboard - 16 hours**
  - [ ] Create screen: `src/screens/loans/LoanAnalyticsDashboard.tsx`
  - [ ] Implement PAR gauges (PAR 30, PAR 60, PAR 90)
  - [ ] Implement total risk asset card
  - [ ] Implement loan portfolio breakdown chart (by status, by product)
  - [ ] Implement trend chart (PAR over time)
  - [ ] Integrate with API: `GET /api/v1/loans/analytics`

- [ ] **PF-010: NPL Dashboard - 12 hours**
  - [ ] Create screen: `src/screens/loans/NPLDashboard.tsx`
  - [ ] Implement NPL list table (loan details, days overdue, amount, recovery officer)
  - [ ] Implement NPL summary cards (total NPL, NPL ratio, recovery rate)
  - [ ] Implement recovery actions log (timeline of recovery actions)
  - [ ] Add "Assign Recovery Officer" button
  - [ ] Integrate with API: `GET /api/v1/loans/npl`

- [ ] **PF-017: Group Accounts Screen - 12 hours**
  - [ ] Create screen: `src/screens/groups/GroupAccountsScreen.tsx`
  - [ ] Implement group list table
  - [ ] Implement create group form (group name, member selection)
  - [ ] Implement group details page (members, savings balance, transactions)
  - [ ] Integrate with API: `GET /api/v1/groups`

**QA Engineer** (12 hours)
- [ ] **Week 15 QA Testing**
  - [ ] Test PF-009 (analytics calculations, dashboard visualization)
  - [ ] Test PF-010 (NPL classification, recovery workflow)
  - [ ] Test PF-017 (group account creation, savings collection)
  - [ ] Test PF-019 (auto-debit, retry mechanism, SMS alerts)
  - [ ] Test PF-020 (credit risk calculations)
  - [ ] Create bug reports and verify fixes

**Team Activity** (2 hours)
- [ ] **MILESTONE REVIEW (Friday 4:00 PM)** - 2 hours
  - [ ] **Demo HIGH priority features (15/20 features complete)**
  - [ ] Review analytics dashboards
  - [ ] Review NPL workflow
  - [ ] Plan Week 16 (final polish + MEDIUM priority features)

---

## 📅 WEEK 16: FINAL POLISH & DOCUMENTATION (124 hours)

**Focus:** Complete remaining 5 MEDIUM priority features, testing, documentation

### Monday-Thursday (Week 16, Days 25-28)

**Backend Dev 1** (32 hours)
- [ ] **PF-012: Penalty Waiver Workflow - 8 hours**
  - [ ] Integrate with PF-003 (approval workflows)
  - [ ] Create penalty waiver request (with reason)
  - [ ] Require manager approval
  - [ ] Update loan record on approval
  - [ ] Create API endpoint: `POST /api/v1/loans/:id/waive-penalty`
  - [ ] Write unit tests (2 test cases)

- [ ] **PF-015: Amortization Schedules - 8 hours**
  - [ ] Implement `generateAmortizationSchedule(principal, rate, tenure)` method
  - [ ] Calculate monthly payment amount
  - [ ] Calculate principal/interest breakdown for each payment
  - [ ] Create API endpoint: `GET /api/v1/loans/:id/amortization-schedule`
  - [ ] Write unit tests (2 test cases)

- [ ] **Documentation & Testing - 16 hours**
  - [ ] Update API documentation (Swagger) for all partial features
  - [ ] Write README for partial features sprint
  - [ ] Comprehensive integration testing (all 20 features)
  - [ ] Performance testing (load testing with realistic data volumes)

**Backend Dev 2** (32 hours)
- [ ] **PF-011: Data Migration Reconciliation - 8 hours**
  - [ ] Implement automated reconciliation after data migration
  - [ ] Compare source vs destination record counts
  - [ ] Identify missing/duplicate records
  - [ ] Generate reconciliation report
  - [ ] Create API endpoint: `POST /api/v1/migrations/:id/reconcile`
  - [ ] Write unit tests (1 test case)

- [ ] **PF-013: AML Report Enhancement - 8 hours**
  - [ ] Enhance AML monitoring with additional patterns:
    - [ ] Velocity checking (multiple transactions in short time)
    - [ ] Round-tripping (money movement patterns)
    - [ ] Geographic risk (high-risk countries)
  - [ ] Improve STR auto-filing logic
  - [ ] Create API endpoint: `GET /api/v1/compliance/aml/alerts`
  - [ ] Write unit tests (2 test cases)

- [ ] **Documentation & Testing - 16 hours**
  - [ ] Update compliance documentation (CBN, NDIC, NFIU requirements)
  - [ ] Create compliance checklist for production deployment
  - [ ] End-to-end testing for all regulatory reports
  - [ ] Security audit (SQL injection, XSS, CSRF protection)

**Frontend Dev** (32 hours)
- [ ] **PF-014: Card Dispute Enhancement - 8 hours**
  - [ ] Improve card dispute resolution UI
  - [ ] Add dispute status tracking (submitted, investigating, resolved)
  - [ ] Add document upload for dispute evidence
  - [ ] Integrate with API: `GET /api/v1/cards/:id/disputes`

- [ ] **UI Polish & Accessibility - 12 hours**
  - [ ] Review all 20 partial features screens for consistency
  - [ ] Fix any remaining UI bugs
  - [ ] Improve accessibility (WCAG 2.1 AA compliance)
  - [ ] Add keyboard shortcuts for common actions
  - [ ] Optimize performance (lazy loading, code splitting)

- [ ] **Documentation & Testing - 12 hours**
  - [ ] Create user guide for partial features
  - [ ] Create screen recordings/GIFs for documentation
  - [ ] Comprehensive UI/UX testing (all flows)
  - [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
  - [ ] Mobile testing (iOS, Android)

**QA Engineer** (20 hours)
- [ ] **Final QA Testing - 20 hours**
  - [ ] Regression testing on ALL 20 features
  - [ ] Integration testing (feature interactions)
  - [ ] Performance testing (response times, load capacity)
  - [ ] Security testing (authentication, authorization, data access)
  - [ ] Create final bug report
  - [ ] Verify all bugs are fixed

---

### Friday (Week 16, Day 29) - **FINAL MILESTONE: ALL Features → 100%**

**Backend Dev 1** (8 hours)
- [ ] **Final Code Review & Cleanup** - 4 hours
  - [ ] Remove console.log statements
  - [ ] Remove unused code/imports
  - [ ] Ensure consistent code formatting (Prettier)
  - [ ] Ensure consistent error handling

- [ ] **Production Readiness** - 4 hours
  - [ ] Environment variable documentation
  - [ ] Database migration scripts reviewed
  - [ ] Rollback plan documented
  - [ ] Monitoring and alerting configured

**Backend Dev 2** (8 hours)
- [ ] **Final Code Review & Cleanup** - 4 hours
  - [ ] Ensure all database indexes are optimal
  - [ ] Review database query performance
  - [ ] Ensure all API responses follow consistent format
  - [ ] Ensure all error messages are user-friendly

- [ ] **Production Readiness** - 4 hours
  - [ ] Compliance checklist completed
  - [ ] Regulatory report formats validated with CBN/NDIC
  - [ ] Backup and restore procedures tested
  - [ ] Disaster recovery plan documented

**Frontend Dev** (8 hours)
- [ ] **Final Code Review & Cleanup** - 4 hours
  - [ ] Remove console.log statements
  - [ ] Optimize bundle size (code splitting, tree shaking)
  - [ ] Ensure all images are optimized
  - [ ] Ensure all API calls have proper error handling

- [ ] **Production Readiness** - 4 hours
  - [ ] Production build tested (npm run build)
  - [ ] Environment configuration documented
  - [ ] Analytics tracking verified
  - [ ] User guide finalized

**QA Engineer** (8 hours)
- [ ] **Final QA Sign-off** - 8 hours
  - [ ] Final regression testing
  - [ ] Verify all critical bugs are fixed
  - [ ] Smoke testing on production-like environment
  - [ ] Create QA sign-off report

**Compliance Specialist** (4 hours)
- [ ] **Compliance Sign-off** - 4 hours
  - [ ] Review all regulatory reports (CBN, NDIC, NFIU)
  - [ ] Verify IFRS 9 provisioning calculations
  - [ ] Verify AML/CFT monitoring
  - [ ] Create compliance sign-off report

**Team Activity** (4 hours)
- [ ] **FINAL SPRINT REVIEW & DEMO (Friday 2:00 PM - 6:00 PM)** - 4 hours
  - [ ] **Demo ALL 20 features to executives**
    - [ ] CRITICAL: PF-001 to PF-005 ✅
    - [ ] HIGH: PF-006 to PF-010 ✅
    - [ ] MEDIUM: PF-011 to PF-020 ✅
  - [ ] **Review success criteria:**
    - [ ] ✅ ALL 20 features → 100% complete
    - [ ] ✅ Test coverage > 80%
    - [ ] ✅ No critical bugs
    - [ ] ✅ Compliance sign-off obtained
    - [ ] ✅ Production-ready
  - [ ] **Sprint Retrospective:**
    - [ ] What went well?
    - [ ] What could be improved?
    - [ ] Lessons learned
  - [ ] **CELEBRATE SPRINT COMPLETION!** 🎉🎉🎉
  - [ ] Plan production deployment (Week 17)

---

## ✅ SPRINT COMPLETION CRITERIA

### Technical Completion
- [ ] All 20 features implemented (backend + frontend)
- [ ] Test coverage > 80% (unit + integration)
- [ ] All critical and high-priority bugs fixed
- [ ] API documentation complete (Swagger)
- [ ] Code reviewed and merged to main branch

### Quality Assurance
- [ ] QA sign-off obtained
- [ ] Regression testing passed
- [ ] Performance testing passed (response times < 300ms p95)
- [ ] Security testing passed (no critical vulnerabilities)
- [ ] Cross-browser/mobile testing passed

### Compliance
- [ ] Compliance specialist sign-off obtained
- [ ] Regulatory report formats validated
- [ ] IFRS 9 calculations verified
- [ ] AML/CFT monitoring verified
- [ ] CBN/NDIC/NFIU requirements met

### Documentation
- [ ] API documentation complete
- [ ] User guide complete
- [ ] Technical documentation complete
- [ ] Deployment runbook complete
- [ ] Rollback plan documented

### Production Readiness
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Monitoring and alerting configured
- [ ] Backup and restore procedures tested
- [ ] Disaster recovery plan documented

---

## 🚨 ESCALATION TRIGGERS

**STOP WORK AND ESCALATE IF:**
1. Any CRITICAL feature blocked for > 3 days
2. Test coverage drops below 80%
3. Critical bug discovered with no resolution path
4. Compliance specialist not available by Week 11
5. Regulatory report format unavailable from CBN/NDIC

**ESCALATE TO CTO IF:**
1. Velocity < 30 story points/week for 2 consecutive weeks
2. Budget variance > 10%
3. Team member unavailable (sick, resigned)
4. Third-party API integration failure (NIBSS, SMS provider)

**ESCALATE TO CEO IF:**
1. CBN/NDIC regulatory requirement changes
2. Compliance sign-off rejected
3. Production deployment risk > 50%

---

## 📞 DAILY STANDUP TEMPLATE

**Time:** 9:00 AM (15 minutes)

**Format:**
Each team member answers:
1. What did I complete yesterday?
2. What will I work on today?
3. Are there any blockers?

**Example:**
```
Backend Dev 1:
- Yesterday: Completed PF-001 loan restructuring API, wrote 3 unit tests
- Today: Start PF-001 loan write-off API, complete IFRS 9 provisioning logic
- Blockers: Waiting for compliance specialist to validate provisioning rates

Backend Dev 2:
- Yesterday: Completed PF-002 CAR calculation, created database function
- Today: Start PF-002 liquidity ratio calculation, write unit tests
- Blockers: None

Frontend Dev:
- Yesterday: Completed loan details page, implemented payment schedule table
- Today: Create loan restructuring modal, implement form validation
- Blockers: None

QA Engineer:
- Yesterday: Set up test environment, created test plan
- Today: Start testing PF-001 APIs, create bug reports
- Blockers: Need Postman collection from backend devs
```

---

## 📊 PROGRESS TRACKING

### Weekly Progress Report Template

**Week [X] Progress Report**

**Completed This Week:**
- [ ] Feature 1 (100%)
- [ ] Feature 2 (75%)

**Planned vs Actual:**
- Planned: 40 hours
- Actual: 38 hours
- Variance: -5%

**Blockers Resolved:**
- Blocker 1: Resolved by [solution]

**Active Blockers:**
- Blocker 2: [description, impact, plan to resolve]

**Risks:**
- Risk 1: [description, probability, mitigation]

**Next Week Plan:**
- [ ] Complete Feature 2 (25% remaining)
- [ ] Start Feature 3
- [ ] Start Feature 4

---

**Sprint Status:** ⬜ Not Started
**Last Updated:** October 8, 2025
**Next Review:** Week 10 (Sprint Kick-off)
**Document Owner:** OrokiiPay Development Team

---

**Ready to start? Let's complete these 20 partial features and ship world-class banking software!** 🚀
