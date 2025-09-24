# MidasTap Savings & Loans Requirements

**Document Version:** 1.0
**Date:** September 23, 2025
**Source:** savings-loans-fmfb-req.docx

---

## Savings Products

### 1. Save As You Transact (SAYT)

**Description:** Allow users to save a portion each time they transact either withdrawal or transfer

**Requirements:**
- Minimum savings per transaction: ₦50
- No maximum per transaction
- Customer can withdraw during savings duration
- Withdrawal penalty: 1% of savings
- Minimum withdrawal amount: ₦1,000

---

### 2. Flexible Savings

**Description:** Enable users to save daily, weekly, monthly for various periods

**Requirements:**
- Saving frequency: Daily, Weekly, Monthly
- Admin-controlled interest rate (adjustable based on market conditions)
- VAT deductions on accrued interest at withdrawal
- No lock-in period
- Interest calculated and paid based on admin settings

---

### 3. Locked Savings

**Description:** Fixed-term savings at a determined annual interest rate

**Requirements:**
- Duration options: 12 to 24 months or more (customer selected)
- Withdrawal not possible until expiry date
- Interest payment: Monthly
- User can withdraw accrued interest monthly
- VAT deduction on accrued interest
- Fixed interest rate determined at account opening

---

### 4. Target Savings

**Description:** Automated goal-based savings with scheduled deductions

**Requirements:**
- Automated deductions: Daily, Weekly, Monthly
- Customer sets target amount and duration
- Auto-debit from main account to target savings account
- Savings goal tracking and progress notifications

---

## Loan Products

### 5. Loan Limit

**Description:** Starting loan amounts for new and existing customers

**Requirements:**
- First-time user: ₦2,000 initial loan
- Admin can override to ₦5,000 if necessary
- Gradual increase after successful repayments
- After 2-3 successful payments: Increase to ₦5,000
- Subsequent increases based on payment history

---

### 6. Credibility Check

**Description:** Loan eligibility verification system

**Requirements:**
- Instant Credit Bureau Check integration
- Subsequent loan credibility assessment
- Real-time approval/rejection based on credit score
- Maintain credit history within platform

---

### 7. Loan Increment

**Description:** Progressive loan limit increases

**Requirements:**
- After 2-3 successful payments: Increase from ₦2,000 to ₦5,000
- Gradual increases for subsequent loans
- Based on repayment performance
- Admin can manually adjust limits

---

### 8. Loan Duration

**Description:** Repayment period options

**Requirements:**
- Starting duration: 7 days (like Palmpay)
- After ₦1,000 loan paid twice within 7 days: Option for ₦3-5k for 2 weeks
- Progressive increases:
  - 2 weeks for ₦3-5k loans
  - 3 weeks for next tier
  - 1 month for established customers
- Maximum duration: 2 months (payable in 2 installments)
- Duration increases with loan amount

---

### 9. Interest Rate

**Description:** Interest charges on loans

**Requirements:**
- Fixed interest rate: 15% per month
- Admin can vary interest rate
- Interest calculated monthly
- Transparent interest breakdown shown to users

---

### 10. Service Fee

**Description:** Additional fees charged with interest

**Requirements:**
- Service charge: 2% (charged with interest)
- Admin should be able to remove service charge if necessary
- Clear disclosure of all fees before loan acceptance
- Service fee included in total repayment amount

---

### 11. Late Payment Fee

**Description:** Penalties for missed payment deadlines

**Requirements:**
- Late payment fee: 3.5% daily for non-payment
- Incremental charges for each day of default
- Clear notification of late fees before they apply
- Grace period considerations (admin configurable)

---

## Admin Configuration Requirements

### Interest Rate Management
- Ability to adjust savings interest rates based on market conditions
- Ability to vary loan interest rates
- Rate change history and audit trail

### Fee Management
- Toggle service charge on/off
- Adjust late payment fee percentages
- Configure minimum withdrawal amounts
- Set penalty rates for early withdrawals

### Loan Limit Management
- Override first-time user limits (₦2,000 to ₦5,000)
- Manually adjust customer loan limits
- Set global maximum loan amounts
- Configure loan increment thresholds

### VAT & Tax Configuration
- Configure VAT deduction percentages
- Withholding tax settings
- Tax calculation and reporting

---

## Technical Requirements

### Integration Points
1. **Credit Bureau Integration**
   - Real-time credit checks
   - Credit score retrieval
   - Default history verification

2. **Payment Processing**
   - Automated savings deductions
   - Loan disbursement
   - Repayment collection
   - Interest calculations

3. **Notification System**
   - Savings milestones
   - Loan approval/rejection
   - Repayment reminders
   - Late payment warnings

4. **Reporting & Analytics**
   - Savings portfolio overview
   - Loan performance metrics
   - Default rate tracking
   - Interest income reporting

---

## Compliance Requirements

1. **Customer Protection**
   - Clear terms and conditions
   - Transparent fee disclosure
   - Fair lending practices
   - Privacy protection

2. **Regulatory Compliance**
   - CBN lending guidelines
   - Interest rate caps compliance
   - KYC/AML requirements
   - Data protection (NDPR)

3. **Audit Trail**
   - All admin changes logged
   - Customer transaction history
   - Interest rate changes tracked
   - Fee modifications recorded

---

## Implementation Priority

### Phase 1 (High Priority)
- Flexible Savings
- Basic Loan System (₦2,000 - ₦5,000)
- Credit Bureau Integration
- Interest & Fee Calculation

### Phase 2 (Medium Priority)
- Locked Savings
- Target Savings
- Loan Increment Logic
- Late Payment System

### Phase 3 (Low Priority)
- Save As You Transact (SAYT)
- Advanced Analytics
- Automated Notifications
- Reporting Dashboard

---

*Document extracted from: savings-loans-fmfb-req.docx*
*MidasTap column requirements organized by category*