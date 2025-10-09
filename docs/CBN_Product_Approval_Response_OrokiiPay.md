# CBN PRODUCT APPROVAL APPLICATION
## OrokiiPay Multi-Tenant Digital Banking Platform

**Submitted by:** FirstMidas Microfinance Bank Limited (FMFB)
**Product Name:** OrokiiPay Digital Banking Platform
**Date:** October 8, 2025
**Application Reference:** [To be assigned by CBN]

---

## EXECUTIVE SUMMARY

FirstMidas Microfinance Bank Limited (FMFB) seeks approval from the Central Bank of Nigeria to deploy the OrokiiPay Multi-Tenant Digital Banking Platform. This platform provides comprehensive digital banking services including account management, fund transfers, savings products, loan products, bill payments, and AI-powered financial intelligence.

The platform is built with CBN compliance at its core, featuring robust security measures, comprehensive KYC/AML controls, transaction monitoring, and integration with NIBSS for interbank transfers.

---

## SECTION 1: DETAILED INFORMATION

### 1.a) EXTRACT OF BOARD RESOLUTION

**[To be provided by FMFB Board of Directors]**

**BOARD RESOLUTION NO:** [Number]
**DATE:** [Date]

**RESOLVED THAT:**

The Board of Directors of FirstMidas Microfinance Bank Limited hereby approves:

1. The deployment and roll-out of the OrokiiPay Digital Banking Platform as a core banking solution for FMFB
2. The engagement of OrokiiPay Technologies as the technical partner for platform development and maintenance
3. The integration with Nigeria Inter-Bank Settlement System (NIBSS) for interbank fund transfers
4. The implementation of the platform in phases as outlined in the project roadmap
5. The allocation of necessary capital and resources for platform deployment and operations
6. The establishment of a Digital Banking Operations team to manage the platform
7. Authorization for management to execute all necessary agreements with technical partners, NIBSS, and other service providers

**Signatures:**
- Chairman of the Board: _______________________
- Managing Director: _______________________
- Board Secretary: _______________________

**[Note: Actual board resolution to be attached with original signatures and company seal]**

---

### 1.b) PRODUCT OPERATIONAL DYNAMICS (END-TO-END) AND PRODUCT SPECIFICATIONS

#### **Product Overview**

OrokiiPay is a cloud-based, multi-tenant digital banking platform that provides:
- Mobile and web-based banking applications
- Core banking operations (accounts, transfers, payments)
- Advanced product offerings (savings, loans, investments)
- AI-powered financial intelligence and fraud detection
- Real-time transaction processing
- Integration with national payment infrastructure (NIBSS)

#### **End-to-End Operational Flow**

**1. Customer Onboarding**
```
Customer Registration → KYC Verification → BVN Validation →
Account Creation → Wallet Creation → Digital Onboarding Complete
```

**2. Fund Transfer Operations**
```
Customer Initiates Transfer → PIN/Biometric Authentication →
AI Fraud Detection Analysis → Balance/Limit Verification →
NIBSS Name Enquiry (External) → Transaction Processing →
Real-time Settlement → SMS/Push Notification → Receipt Generation
```

**3. Savings Product Operations**
```
Customer Selects Savings Product → Terms Acceptance →
Funding from Primary Account → Interest Calculation (Daily) →
Automated Interest Posting → Maturity Notification →
Withdrawal Processing
```

**4. Loan Product Operations**
```
Loan Application → Document Upload → AI Credit Scoring →
Credit Bureau Check → Management Approval →
Loan Disbursement → Repayment Schedule →
Automated Deductions → Loan Closure
```

#### **Technical Specifications**

| Component | Specification |
|-----------|--------------|
| **Architecture** | Multi-tenant, cloud-native (Google Cloud Platform) |
| **Frontend** | React Native (iOS/Android) + React Web (PWA) |
| **Backend** | Node.js (Express) + PostgreSQL 15 |
| **Security** | TLS 1.3, AES-256 encryption, JWT authentication |
| **API** | RESTful APIs with rate limiting and authentication |
| **Database** | Database-per-tenant isolation for security |
| **Hosting** | Google Cloud Platform (Nigeria region preferred) |
| **Uptime SLA** | 99.9% availability |
| **Disaster Recovery** | Automated backups every 6 hours, 30-day retention |
| **Performance** | <500ms API response time, <2s page load time |
| **Scalability** | Horizontal scaling, supports 100,000+ concurrent users |
| **Integration** | NIBSS (NIP), BVN validation, Credit bureaus |
| **Monitoring** | 24/7 system monitoring, SIEM integration |
| **Compliance** | CBN Guidelines, NDPR, PCI-DSS, AML/CFT |

#### **Transaction Processing Speeds**

| Transaction Type | Processing Time | Settlement Time |
|------------------|----------------|-----------------|
| Internal Transfer | <2 seconds | Instant (real-time) |
| External Transfer (NIBSS) | <10 seconds | Instant (T+0) |
| Bill Payment | <15 seconds | T+0 to T+1 |
| Account Opening | <5 minutes | Instant |
| Loan Disbursement | <1 hour | T+0 |

#### **System Capacity**

- **Transactions per second:** 1,000 TPS
- **Daily transaction volume:** Up to 10 million transactions
- **Concurrent users:** 100,000+
- **Data storage:** Unlimited (cloud-based)
- **Geographic coverage:** All 36 states + FCT

---

### 1.c) ONBOARDING PROCESS AND KYC REQUIREMENTS

#### **Customer Onboarding Process**

**Phase 1: Registration (2-3 minutes)**
1. Download OrokiiPay mobile app or access web platform
2. Enter mobile number and receive OTP verification
3. Enter personal details:
   - Full name (as per BVN)
   - Date of birth
   - Email address
   - Gender
   - Residential address
4. Create secure PIN and password
5. Set up biometric authentication (fingerprint/face ID)

**Phase 2: KYC Verification (3-5 minutes)**
1. Enter Bank Verification Number (BVN)
2. System validates BVN with NIBSS BVN database
3. System verifies name, date of birth, phone number match
4. Upload identification documents:
   - Valid government-issued ID (NIN, Driver's License, Intl Passport, Voter's Card)
   - Passport photograph (selfie with liveness detection)
   - Proof of address (utility bill <3 months old)
5. AI-powered document verification
6. Enhanced Due Diligence for high-risk customers

**Phase 3: Account Activation (Instant)**
1. System performs AML/CFT screening
2. Watchlist screening (PEP, sanctions lists)
3. Risk profiling based on customer data
4. Account tier assignment based on KYC level
5. Unique account number generation
6. Primary wallet creation
7. Welcome email and SMS sent
8. Instant account activation

#### **Account Tiers and KYC Requirements**

**Tier 1: Basic Account (Individual)**
- **KYC Requirements:**
  - BVN verification
  - Phone number (validated via OTP)
  - Name, date of birth, address
- **Limits:**
  - Maximum balance: ₦300,000
  - Daily transaction limit: ₦50,000
  - KYC Level: Simplified Due Diligence

**Tier 2: Standard Account (Individual)**
- **KYC Requirements:**
  - All Tier 1 requirements
  - Valid government-issued ID
  - Passport photograph
  - Proof of address
- **Limits:**
  - Maximum balance: ₦5,000,000
  - Daily transaction limit: ₦200,000
  - KYC Level: Customer Due Diligence (CDD)

**Tier 3: Premium Account (Individual)**
- **KYC Requirements:**
  - All Tier 2 requirements
  - Source of funds declaration
  - Employment details / Business information
  - Reference contact
  - Enhanced Due Diligence for high-net-worth individuals
- **Limits:**
  - Maximum balance: Unlimited
  - Daily transaction limit: ₦5,000,000
  - KYC Level: Enhanced Due Diligence (EDD)

**Business/Corporate Accounts**
- **KYC Requirements:**
  - Certificate of Incorporation (CAC)
  - CAC Form 2 and 7 (Particulars of directors)
  - Tax Identification Number (TIN)
  - Memorandum and Articles of Association
  - Board Resolution authorizing account opening
  - Valid ID of all directors and signatories
  - BVN of all directors and signatories
  - Business address verification
  - Ultimate Beneficial Owner (UBO) identification
  - Proof of business operations
- **Limits:**
  - Based on business risk assessment
  - Daily transaction limit: Customized per business needs
  - KYC Level: Enhanced Due Diligence (EDD)

#### **Merchant Onboarding (for Bill Payment Partners)**

**Requirements:**
1. Business registration (CAC certificate)
2. Tax clearance certificate
3. Business bank account verification
4. Directors' identification and BVN
5. Merchant agreement execution
6. API integration and testing
7. Compliance review and approval
8. Go-live approval

**Process Duration:** 5-10 business days

#### **Ongoing KYC Maintenance**

- Annual KYC update for all customers
- Transaction monitoring for unusual patterns
- Periodic Enhanced Due Diligence for high-risk customers
- Automatic flagging of dormant accounts
- Re-verification when customer details change
- Continuous screening against watchlists

---

### 1.d) FEATURES AND BENEFITS OF THE PRODUCT

#### **Core Banking Features**

**1. Digital Account Management**
- Instant account opening (100% digital)
- Multiple account types (Savings, Current, Fixed Deposit)
- Real-time balance updates
- Mini-statement and full statement generation
- Account freezing/unfreezing
- Multiple currency support (NGN, USD, EUR, GBP)

**2. Fund Transfer Services**
- Internal transfers (same bank) - Instant, Free
- External transfers (NIBSS integration) - Real-time, Competitive fees
- International transfers (via partners) - T+1
- Scheduled/recurring transfers
- Bulk payments for businesses
- Transfer beneficiary management
- Transfer history and tracking

**3. Bill Payment Services**
- Airtime and data purchase
- Electricity bill payments (AEDC, EKEDC, IKEDC, etc.)
- Cable TV subscriptions (DSTV, GOTV, Startimes)
- Internet service providers
- Government payments (taxes, fees)
- School fees payment
- Insurance premium payments

**4. Savings Products**
- **Regular Savings:** Flexible savings with 4-6% interest p.a.
- **High-Yield Savings:** Tiered interest rates up to 12% p.a.
- **Goal-Based Savings:** Targeted savings with milestone tracking
- **Locked Savings:** Time-locked deposits with premium rates up to 15% p.a.
- **Save-as-You-Transact:** Automatic savings on each transaction

**5. Loan Products**
- **Personal Loans:** Unsecured loans up to ₦500,000
- **Business Loans:** SME financing up to ₦5,000,000
- **Quick Loans:** Instant micro-loans up to ₦50,000 (AI-approved)
- **Overdraft Facility:** Pre-approved credit line
- Interest rates: 18-28% p.a. depending on credit score
- Tenure: 3-36 months
- No collateral for loans <₦500,000 (for qualified customers)

**6. AI-Powered Financial Intelligence**
- Conversational AI assistant
- Voice-activated banking commands
- Smart spending insights and analytics
- Personalized financial advice
- Fraud detection and alerts
- Automated savings recommendations
- Budget tracking and alerts

**7. Security Features**
- Biometric authentication (fingerprint, face ID)
- 4-digit transaction PIN
- Two-factor authentication (2FA)
- Device fingerprinting
- Real-time fraud monitoring
- Transaction notifications (SMS, push, email)
- Remote card/account blocking
- Session timeout and auto-logout

**8. Reporting and Analytics**
- Real-time transaction history
- Spending categorization
- Export to PDF/Excel
- Tax reporting summaries
- Custom date range reports
- Visual spending charts
- Monthly statements (automated)

#### **Customer Benefits**

**For Individual Customers:**
1. **Convenience:** 24/7 banking from anywhere
2. **Speed:** Instant account opening, real-time transfers
3. **Cost Savings:** Lower fees vs traditional banking
4. **Financial Inclusion:** Access to credit and savings products
5. **AI Assistance:** Personalized financial guidance
6. **Security:** Multi-layer security protection
7. **Transparency:** Real-time transaction updates
8. **No Hidden Charges:** All fees disclosed upfront
9. **Competitive Interest Rates:** Higher returns on savings
10. **Accessibility:** Mobile, web, and USSD access

**For Business Customers:**
1. **Efficient Cash Management:** Real-time visibility
2. **Bulk Payment Processing:** Handle payroll, supplier payments
3. **API Integration:** Connect to business systems
4. **Multi-user Access:** Role-based permissions
5. **Detailed Reporting:** Transaction analytics
6. **Working Capital Loans:** Fast business financing
7. **Payment Collection:** Virtual accounts, payment links
8. **Reconciliation Tools:** Automated matching
9. **Scalability:** Grows with business needs
10. **Dedicated Support:** Priority customer service

**For FMFB (Financial Institution):**
1. **Digital Transformation:** Modern banking infrastructure
2. **Cost Reduction:** Lower operational costs vs branch banking
3. **Scalability:** Serve unlimited customers
4. **Regulatory Compliance:** Built-in CBN compliance
5. **Revenue Growth:** Multiple revenue streams
6. **Customer Insights:** Data-driven decision making
7. **Competitive Advantage:** Match fintech capabilities
8. **Risk Management:** Advanced fraud detection
9. **Operational Efficiency:** Automated processes
10. **Market Expansion:** Reach customers nationwide

#### **Value Proposition**

**For Underbanked/Unbanked Population:**
- Provides access to formal financial services
- No minimum balance requirements on basic accounts
- Low-cost transactions
- Financial literacy through AI assistant
- Micro-credit access for small businesses

**For Tech-Savvy Urban Population:**
- Modern, intuitive user interface
- Feature parity with international fintech apps
- AI-powered personalization
- Seamless multi-channel experience
- Advanced security and privacy controls

**For Diaspora Community:**
- Multi-currency support
- International transfer capabilities
- Remote account management
- Investment opportunities in Nigeria

---

### 1.e) SECURITY FEATURES OF THE PRODUCT

#### **1. Authentication Security**

**Multi-Factor Authentication (MFA):**
- Something you know: PIN, password
- Something you have: Mobile device, registered phone number
- Something you are: Biometric (fingerprint, facial recognition)

**Biometric Authentication:**
- Fingerprint scanner integration (iOS Touch ID, Android Fingerprint API)
- Facial recognition (iOS Face ID, Android Face Unlock)
- Liveness detection to prevent spoofing
- Encrypted biometric data storage on device (never transmitted)

**Session Management:**
- Automatic session timeout after 5 minutes of inactivity
- Concurrent session limit (max 2 active sessions)
- Device tracking and management
- Remote session termination capability
- Suspicious login alerts

#### **2. Data Security**

**Encryption:**
- **Data in Transit:** TLS 1.3 with Perfect Forward Secrecy
- **Data at Rest:** AES-256 encryption for all sensitive data
- **Database:** Encrypted columns for PII, PINs, financial data
- **Backups:** Encrypted backup files with secure key management
- **Key Management:** Hardware Security Module (HSM) for production keys

**Data Storage:**
- Database-per-tenant isolation (multi-tenant security)
- Encrypted transaction logs
- Secure credential storage (never plain text)
- PCI-DSS compliant card data handling
- Separate encrypted storage for documents

**Secure Communication:**
- Certificate pinning in mobile apps
- API request signing with HMAC-SHA256
- Token-based authentication (JWT)
- Short-lived access tokens (24 hours)
- Refresh token rotation

#### **3. Transaction Security**

**Pre-Transaction Validation:**
- PIN verification for all financial transactions
- Biometric confirmation for high-value transactions (>₦50,000)
- Daily and monthly transaction limit enforcement
- Available balance verification
- Duplicate transaction prevention

**Real-Time Fraud Detection:**
- AI-powered transaction analysis (<500ms)
- Behavioral biometrics (typing patterns, device usage)
- Geolocation verification
- Device fingerprinting
- Velocity checks (transaction frequency)
- Amount anomaly detection
- Risk scoring for every transaction

**Post-Transaction Monitoring:**
- Real-time transaction notifications
- Unusual activity alerts
- Automated transaction reversals for confirmed fraud
- 24/7 fraud monitoring team
- Customer transaction dispute mechanism

**Transaction Limits:**
- Per-transaction limits based on account tier
- Daily cumulative limits
- Monthly cumulative limits
- Merchant category restrictions
- Geographic restrictions (optional)

#### **4. Network Security**

**Infrastructure Protection:**
- Web Application Firewall (WAF)
- DDoS protection (Cloud Armor)
- Intrusion Detection System (IDS)
- Intrusion Prevention System (IPS)
- Network segmentation and isolation
- VPN for administrative access
- IP whitelisting for sensitive operations

**API Security:**
- API gateway with rate limiting
- OAuth 2.0 authentication
- API key rotation
- Request throttling and quotas
- Input validation and sanitization
- SQL injection prevention
- XSS protection

**Server Security:**
- Regular security patches and updates
- Hardened server configurations
- Antivirus and antimalware
- File integrity monitoring
- Privileged access management
- Audit logging of all admin actions

#### **5. Application Security**

**Secure Development:**
- Secure coding standards (OWASP Top 10)
- Code review and static analysis
- Dependency vulnerability scanning
- Regular penetration testing
- Bug bounty program
- Security testing in CI/CD pipeline

**Input Validation:**
- Server-side validation for all inputs
- Parameterized queries (SQL injection prevention)
- Output encoding (XSS prevention)
- File upload restrictions
- CAPTCHA for sensitive operations

**Error Handling:**
- Generic error messages (no sensitive data exposure)
- Detailed logging for debugging (secure log storage)
- Exception handling to prevent crashes
- Graceful degradation

#### **6. Compliance and Governance**

**Access Control:**
- Role-Based Access Control (RBAC)
- Principle of least privilege
- Separation of duties
- Mandatory access controls for sensitive data
- Regular access reviews and audits

**Audit Logging:**
- Comprehensive audit trail for all transactions
- Immutable audit logs
- Log retention for 7 years (regulatory requirement)
- Real-time log analysis
- SIEM integration for security monitoring

**Security Policies:**
- Information Security Policy
- Data Classification Policy
- Incident Response Policy
- Business Continuity Plan
- Disaster Recovery Plan
- Acceptable Use Policy
- Third-Party Risk Management Policy

#### **7. Customer Protection Features**

**Account Security:**
- Instant account freezing via app
- Remote device deauthorization
- Emergency hotline for fraud reporting
- Transaction reversal for unauthorized transactions
- Lost/stolen phone security mode

**Privacy Controls:**
- Granular privacy settings
- Data access transparency
- Data export capability
- Account deletion option
- Cookie consent management

**Customer Education:**
- Security tips and best practices
- Phishing awareness alerts
- In-app security tutorials
- Regular security newsletters

#### **8. Operational Security**

**Monitoring:**
- 24/7 Security Operations Center (SOC)
- Real-time threat intelligence
- Automated incident response
- Security dashboards and alerts
- Regular security assessments

**Incident Response:**
- Dedicated incident response team
- Defined incident response procedures
- Communication protocols
- Forensic analysis capabilities
- Regulatory reporting procedures

**Business Continuity:**
- High availability architecture (99.9% uptime SLA)
- Automated failover mechanisms
- Regular disaster recovery drills
- Geographically distributed backups
- RTO: 4 hours, RPO: 15 minutes

---

### 1.f) TRANSACTION LIMITS

#### **Individual Account Limits**

**Tier 1: Basic Account**
| Transaction Type | Single Transaction | Daily Limit | Monthly Limit |
|------------------|-------------------|-------------|---------------|
| Internal Transfer | ₦50,000 | ₦50,000 | ₦300,000 |
| External Transfer | ₦50,000 | ₦50,000 | ₦300,000 |
| Bill Payment | ₦20,000 | ₦50,000 | ₦200,000 |
| Cash Withdrawal | N/A (Digital only) | N/A | N/A |
| Account Balance | ₦300,000 (max) | - | - |
| POS/Card Payment | ₦20,000 | ₦50,000 | ₦300,000 |

**Tier 2: Standard Account**
| Transaction Type | Single Transaction | Daily Limit | Monthly Limit |
|------------------|-------------------|-------------|---------------|
| Internal Transfer | ₦1,000,000 | ₦200,000 | ₦5,000,000 |
| External Transfer | ₦1,000,000 | ₦200,000 | ₦5,000,000 |
| Bill Payment | ₦100,000 | ₦200,000 | ₦2,000,000 |
| Cash Withdrawal | ₦150,000 | ₦150,000 | ₦1,500,000 |
| Account Balance | ₦5,000,000 (max) | - | - |
| POS/Card Payment | ₦200,000 | ₦200,000 | ₦3,000,000 |
| Savings Deposit | ₦1,000,000 | Unlimited | Unlimited |
| Loan Eligibility | Up to ₦200,000 | - | - |

**Tier 3: Premium Account**
| Transaction Type | Single Transaction | Daily Limit | Monthly Limit |
|------------------|-------------------|-------------|---------------|
| Internal Transfer | ₦5,000,000 | ₦5,000,000 | Unlimited |
| External Transfer | ₦5,000,000 | ₦5,000,000 | Unlimited |
| Bill Payment | ₦500,000 | ₦1,000,000 | Unlimited |
| Cash Withdrawal | ₦500,000 | ₦500,000 | ₦5,000,000 |
| Account Balance | Unlimited | - | - |
| POS/Card Payment | ₦1,000,000 | ₦2,000,000 | Unlimited |
| Savings Deposit | Unlimited | Unlimited | Unlimited |
| Loan Eligibility | Up to ₦500,000 | - | - |

#### **Business/Corporate Account Limits**

**Small Business Account**
| Transaction Type | Single Transaction | Daily Limit | Monthly Limit |
|------------------|-------------------|-------------|---------------|
| Internal Transfer | ₦2,000,000 | ₦5,000,000 | Unlimited |
| External Transfer | ₦2,000,000 | ₦5,000,000 | Unlimited |
| Bill Payment | ₦500,000 | ₦2,000,000 | Unlimited |
| Bulk Payments | ₦5,000,000 | ₦10,000,000 | Unlimited |
| Payroll | ₦10,000,000 | ₦20,000,000 | Unlimited |
| Account Balance | Unlimited | - | - |
| Loan Eligibility | Up to ₦2,000,000 | - | - |

**Corporate Account**
| Transaction Type | Single Transaction | Daily Limit | Monthly Limit |
|------------------|-------------------|-------------|---------------|
| All Transactions | Customized based on business profile and risk assessment |
| Typical Range | ₦10,000,000 | ₦50,000,000 | Unlimited |
| Loan Eligibility | Up to ₦5,000,000 | - | - |

#### **Limit Override Provisions**

**Temporary Limit Increase:**
- Customer can request temporary limit increase
- Requires additional verification (OTP + biometric)
- Valid for 24 hours
- Maximum increase: 2x normal limit
- Logged for audit purposes

**Permanent Limit Increase:**
- Customer submits formal request
- Enhanced Due Diligence performed
- Risk assessment review
- Management approval required
- Upgrade to higher tier if eligible

**Velocity Controls:**
- Maximum 5 transactions per hour
- Maximum 20 transactions per day
- Maximum 100 transactions per month
- Breaches trigger fraud review

---

### 1.g) AML/CFT MEASURES PUT IN PLACE

#### **1. Customer Due Diligence (CDD)**

**Know Your Customer (KYC):**
- Mandatory BVN verification for all customers
- Government-issued ID verification
- Proof of address verification
- Source of funds declaration for high-value accounts
- Beneficial ownership identification for corporate accounts
- Regular KYC updates (annual review)

**Enhanced Due Diligence (EDD):**
Triggered for:
- Politically Exposed Persons (PEPs)
- High-net-worth individuals (accounts >₦10,000,000)
- High-risk countries or jurisdictions
- Unusual transaction patterns
- Cash-intensive businesses
- Foreign nationals

EDD Requirements:
- Additional documentation
- Source of wealth verification
- Business relationship purpose
- Face-to-face verification
- Senior management approval
- Enhanced ongoing monitoring

**Simplified Due Diligence (SDD):**
- Applied to Tier 1 accounts only
- Low transaction limits
- Continuous monitoring
- Automatic upgrade prompt when limits exceeded

#### **2. Transaction Monitoring**

**Automated Monitoring System:**
- Real-time transaction screening
- Pattern recognition algorithms
- Anomaly detection (deviation from normal behavior)
- Rule-based alerts for suspicious activities
- AI/ML-based risk scoring

**Suspicious Activity Indicators:**
- Transactions just below reporting thresholds (structuring)
- Rapid movement of funds (layering)
- Multiple accounts used by one person
- Unusually large cash deposits/withdrawals
- Frequent international transfers to high-risk countries
- Transactions inconsistent with customer profile
- Dormant account suddenly active with large transactions
- Round-figure transactions (possible money laundering)
- Frequent transfers between unrelated parties

**Threshold Monitoring:**
- Single transaction ≥₦5,000,000: Automatic review
- Cumulative daily transactions ≥₦10,000,000: Alert
- Multiple transactions to same beneficiary: Pattern analysis
- Cash transactions ≥₦2,000,000: Enhanced documentation

#### **3. Watchlist Screening**

**Screening Against:**
- UN Security Council Sanctions Lists
- OFAC (Office of Foreign Assets Control) lists
- EU Sanctions Lists
- National Terrorism Watchlists
- Politically Exposed Persons (PEP) databases
- Adverse media databases
- Local law enforcement watch lists

**Screening Frequency:**
- At account opening (mandatory)
- Real-time screening for every transaction
- Daily batch screening of all existing customers
- Immediate screening when watchlists updated

**Name Matching:**
- Fuzzy matching algorithms (handles spelling variations)
- Alias and AKA identification
- Multiple script support (handling different alphabets)
- False positive reduction mechanisms

#### **4. Reporting Requirements**

**Suspicious Transaction Report (STR):**
- Filed with Nigerian Financial Intelligence Unit (NFIU)
- Within 7 days of identification
- Covers attempted transactions as well
- Customer not notified (tipping-off prevention)
- Ongoing monitoring after STR filing

**Currency Transaction Report (CTR):**
- For cash transactions ≥₦5,000,000
- Filed within 7 days of transaction
- Includes all transaction details
- Customer identification information

**Terrorist Financing Report:**
- Immediate reporting (within 24 hours)
- Even for small amounts
- Direct to NFIU and law enforcement
- Enhanced investigation protocols

#### **5. Risk-Based Approach**

**Customer Risk Rating:**

**Low Risk:**
- Nigerian nationals with standard employment
- Transactions within normal patterns
- Complete KYC documentation
- No adverse findings
- Monitoring: Annual review

**Medium Risk:**
- Self-employed individuals
- Cross-border transactions
- Higher transaction volumes
- Incomplete documentation
- Monitoring: Quarterly review

**High Risk:**
- PEPs and their close associates
- Cash-intensive businesses
- High-risk jurisdictions
- Large/complex transactions
- Adverse media mentions
- Monitoring: Monthly review + real-time alerts

**Transaction Risk Assessment:**
- Product risk (e.g., wire transfers higher risk than bill payments)
- Geographic risk (high-risk countries)
- Channel risk (remote onboarding vs branch)
- Customer risk rating
- Historical behavior

#### **6. Record Keeping**

**Document Retention:**
- Customer identification: 7 years after account closure
- Transaction records: 7 years from transaction date
- Correspondence: 7 years
- STR documentation: 7 years after filing
- Audit trails: 7 years

**Audit Trail Requirements:**
- Complete chain of custody for all documents
- Tamper-proof logging
- Authorized access only
- Regular backup and archival
- Retrieval capability within 24 hours

#### **7. Staff Training**

**Mandatory AML/CFT Training:**
- Initial training for all staff (within 30 days of joining)
- Annual refresher training
- Role-specific training (higher for compliance team)
- Case studies and red flags identification
- Regulatory updates training

**Training Content:**
- AML/CFT laws and regulations
- Money laundering typologies
- Terrorist financing indicators
- Internal policies and procedures
- Reporting obligations
- Penalties for non-compliance

**Training Tracking:**
- Attendance records
- Assessment scores
- Certification issuance
- Remedial training for poor performers

#### **8. Governance and Oversight**

**Compliance Officer:**
- Dedicated Money Laundering Reporting Officer (MLRO)
- Direct reporting to Board
- Independent authority
- Adequate resources and budget
- Regular Board reporting

**AML/CFT Committee:**
- Quarterly meetings
- Reviews suspicious activities
- Policy updates
- Regulatory change implementation
- Audit findings review

**Independent Audit:**
- Annual AML/CFT audit by external auditors
- Compliance testing
- Effectiveness assessment
- Recommendations for improvement

#### **9. Technology Controls**

**System Features:**
- Automated sanctions screening
- Transaction monitoring rules engine
- Risk scoring algorithms
- Alert management system
- Case management for investigations
- Regulatory reporting automation
- Audit trail and logging

**Data Analytics:**
- Big data analysis for pattern detection
- Network analysis (identifying related parties)
- Behavioral analytics
- Predictive modeling for risk assessment

---

### 1.h) COST IMPLICATIONS OF PRODUCT DEPLOYMENT

#### **Initial Development and Setup Costs**

| Cost Item | Description | Amount (₦) |
|-----------|-------------|-----------|
| **1. Platform Development** | Custom development, testing, and deployment | 50,000,000 |
| **2. Infrastructure Setup** | Cloud infrastructure (GCP), servers, databases | 15,000,000 |
| **3. NIBSS Integration** | API integration, testing, certification | 5,000,000 |
| **4. BVN Integration** | NIBSS BVN API setup and configuration | 2,000,000 |
| **5. Security Infrastructure** | HSM, WAF, DDoS protection, SSL certificates | 8,000,000 |
| **6. Compliance Systems** | AML/CFT monitoring, reporting tools | 10,000,000 |
| **7. Mobile App Development** | iOS and Android native apps | 12,000,000 |
| **8. Web Platform** | Responsive web application (PWA) | 8,000,000 |
| **9. AI/ML Systems** | Fraud detection, credit scoring, chatbot | 15,000,000 |
| **10. Testing and QA** | Comprehensive testing, penetration testing | 7,000,000 |
| **11. User Documentation** | User manuals, help systems, training materials | 3,000,000 |
| **12. Regulatory Compliance** | CBN approval, legal reviews, certifications | 5,000,000 |
| **13. Staff Training** | Technical and operational training | 4,000,000 |
| **14. Marketing Materials** | Branding, promotional materials, campaigns | 6,000,000 |
| **15. Contingency (10%)** | Unexpected costs and overruns | 15,000,000 |
| **TOTAL INITIAL INVESTMENT** | | **₦165,000,000** |

#### **Annual Operating Costs (Year 1)**

| Cost Item | Description | Monthly (₦) | Annual (₦) |
|-----------|-------------|-------------|-----------|
| **1. Cloud Hosting** | GCP infrastructure, bandwidth, storage | 2,500,000 | 30,000,000 |
| **2. NIBSS Transaction Fees** | Per-transaction charges for NIP transfers | 500,000 | 6,000,000 |
| **3. BVN Verification** | Per-verification charges (est. 10,000 verifications/month) | 250,000 | 3,000,000 |
| **4. SMS Notifications** | Transaction alerts, OTPs (est. 100,000/month) | 300,000 | 3,600,000 |
| **5. Technical Support** | 24/7 support team (8 engineers) | 4,000,000 | 48,000,000 |
| **6. Security Operations** | SOC, monitoring, incident response (4 staff) | 2,000,000 | 24,000,000 |
| **7. Compliance Team** | AML/CFT officers, compliance (3 staff) | 1,500,000 | 18,000,000 |
| **8. Customer Support** | Call center, email, chat support (10 agents) | 3,000,000 | 36,000,000 |
| **9. Software Licenses** | Security tools, monitoring, analytics | 800,000 | 9,600,000 |
| **10. SSL Certificates** | Security certificates renewal | 100,000 | 1,200,000 |
| **11. Professional Services** | External audits, pentesting, consulting | 500,000 | 6,000,000 |
| **12. Backup and DR** | Disaster recovery, backup storage | 400,000 | 4,800,000 |
| **13. Marketing and Growth** | Customer acquisition, promotions | 2,000,000 | 24,000,000 |
| **14. Training and Development** | Staff training, certifications | 300,000 | 3,600,000 |
| **15. Insurance** | Cyber insurance, liability coverage | 250,000 | 3,000,000 |
| **16. Maintenance and Updates** | Platform updates, bug fixes, enhancements | 1,500,000 | 18,000,000 |
| **17. Legal and Regulatory** | Compliance costs, regulatory fees | 400,000 | 4,800,000 |
| **TOTAL ANNUAL OPERATING COST** | | **20,300,000** | **₦243,600,000** |

#### **Projected Growth Costs (Years 2-5)**

| Year | Infrastructure Scale-Up | Additional Staff | Marketing | Annual Total |
|------|------------------------|------------------|-----------|--------------|
| Year 2 | ₦10,000,000 | ₦20,000,000 | ₦30,000,000 | ₦303,600,000 |
| Year 3 | ₦15,000,000 | ₦25,000,000 | ₦40,000,000 | ₦323,600,000 |
| Year 4 | ₦20,000,000 | ₦30,000,000 | ₦50,000,000 | ₦343,600,000 |
| Year 5 | ₦25,000,000 | ₦35,000,000 | ₦60,000,000 | ₦363,600,000 |

#### **5-Year Total Cost Projection**

| Component | Amount (₦) |
|-----------|-----------|
| Initial Investment (Year 0) | 165,000,000 |
| Year 1 Operating Costs | 243,600,000 |
| Year 2 Total Costs | 303,600,000 |
| Year 3 Total Costs | 323,600,000 |
| Year 4 Total Costs | 343,600,000 |
| Year 5 Total Costs | 363,600,000 |
| **5-YEAR TOTAL COST** | **₦1,742,000,000** |
| **Average Annual Cost** | **₦348,400,000** |

#### **Cost per Customer Analysis**

**Year 1 Projections:**
- Target customers: 50,000
- Total Year 1 cost: ₦408,600,000 (Initial + Operating)
- Cost per customer: ₦8,172

**Year 5 Projections:**
- Target customers: 500,000
- Total Year 5 cost: ₦363,600,000
- Cost per customer: ₦727

**Cost Efficiency Improvement:** 91% reduction in per-customer cost

#### **Capital Requirements**

**Initial Capital Required:** ₦200,000,000
- Development and deployment: ₦165,000,000
- Working capital buffer (3 months operating): ₦60,000,000 (rounded up)

**Source of Funds:**
- FMFB equity: ₦100,000,000 (50%)
- Bank loan/credit facility: ₦75,000,000 (37.5%)
- Strategic partner investment: ₦25,000,000 (12.5%)

---

### 1.i) TRANSACTION FEE STRUCTURE AND OTHER CHARGES

#### **Fund Transfer Fees**

**Internal Transfers (Same Bank)**
| Amount Range | Fee | Customer Benefit |
|--------------|-----|------------------|
| All amounts | ₦0 (FREE) | Encourages platform usage |

**External Transfers (Other Banks via NIBSS)**
| Amount Range | Fee | NIBSS Cost | Net Revenue |
|--------------|-----|-----------|----------|
| ₦1 - ₦5,000 | ₦10 | ₦3.75 (fixed) | ₦6.25 |
| ₦5,001 - ₦50,000 | ₦25 | ₦3.75 (fixed) | ₦21.25 |
| ₦50,001 - ₦500,000 | ₦50 | ₦3.75 (fixed) | ₦46.25 |
| ₦500,001+ | ₦100 | ₦3.75 (fixed) | ₦96.25 |

**International Transfers**
| Destination | Fee | Processing Time |
|-------------|-----|-----------------|
| West Africa (ECOWAS) | 1.5% (min ₦500) | T+1 |
| Other Africa | 2.0% (min ₦1,000) | T+1 to T+2 |
| Europe/US | 2.5% (min ₦1,500) | T+2 to T+3 |
| Asia/Others | 3.0% (min ₦2,000) | T+2 to T+3 |

#### **Bill Payment Fees**

**Airtime and Data Purchase**
| Service | Fee | Commission Earned |
|---------|-----|-------------------|
| Airtime purchase (all networks) | ₦0 (FREE) | 2% from telco |
| Data bundle purchase | ₦0 (FREE) | 2.5% from telco |

**Utility Payments**
| Service | Fee | Commission Earned |
|---------|-----|-------------------|
| Electricity (AEDC, EKEDC, etc.) | ₦50 per transaction | 0.5% from biller |
| Cable TV (DSTV, GOTV, Startimes) | ₦100 per transaction | 1% from biller |
| Internet/ISP payments | ₦50 per transaction | 0.5% from biller |

**Government Payments**
| Service | Fee |
|---------|-----|
| Tax payments | ₦100 per transaction |
| Government fees/licenses | ₦100 per transaction |

#### **Account Maintenance Charges**

**Individual Accounts**
| Account Tier | Monthly Fee | Condition for Waiver |
|--------------|-------------|----------------------|
| Tier 1 (Basic) | ₦0 (FREE) | Always free |
| Tier 2 (Standard) | ₦100/month | Waived if 5+ transactions/month |
| Tier 3 (Premium) | ₦500/month | Waived if ₦100,000+ average balance |

**Business Accounts**
| Account Type | Monthly Fee | Condition for Waiver |
|--------------|-------------|----------------------|
| Small Business | ₦1,000/month | Waived if 20+ transactions/month |
| Corporate | ₦5,000/month | Waived if ₦1,000,000+ average balance |

#### **Savings Product Fees**

**Regular Savings**
| Fee Type | Charge |
|----------|--------|
| Account opening | ₦0 (FREE) |
| Monthly maintenance | ₦0 (FREE) |
| Withdrawal fee | ₦0 (FREE) - unlimited withdrawals |
| Premature closure | ₦0 (FREE) |

**High-Yield Savings**
| Fee Type | Charge |
|----------|--------|
| Account opening | ₦0 (FREE) |
| Monthly maintenance | ₦50/month (waived if balance >₦50,000) |
| Withdrawal fee | 1 free per month, ₦200 thereafter |
| Premature closure | 1% of balance (min ₦500) |

**Goal-Based Savings**
| Fee Type | Charge |
|----------|--------|
| Account opening | ₦0 (FREE) |
| Monthly maintenance | ₦0 (FREE) |
| Withdrawal fee (before goal reached) | 2% of withdrawal amount |
| Goal completion bonus | ₦0 (bonus interest paid) |

**Locked Savings (Fixed Deposit)**
| Fee Type | Charge |
|----------|--------|
| Account opening | ₦0 (FREE) |
| Monthly maintenance | ₦0 (FREE) |
| Early withdrawal penalty | 3% of principal + forfeiture of interest |
| Maturity withdrawal | ₦0 (FREE) |

#### **Loan Product Fees**

**Personal Loans**
| Fee Type | Charge | Notes |
|----------|--------|-------|
| Application fee | ₦500 | One-time, non-refundable |
| Processing fee | 1% of loan amount | Max ₦5,000 |
| Disbursement fee | ₦0 (FREE) | |
| Management fee | 0.5% per month on outstanding | Included in monthly payment |
| Late payment fee | ₦500 per day | Max ₦5,000 |
| Early repayment fee | ₦0 (FREE) | Encouraged |

**Business Loans**
| Fee Type | Charge | Notes |
|----------|--------|-------|
| Application fee | ₦2,000 | One-time, non-refundable |
| Processing fee | 2% of loan amount | Max ₦50,000 |
| Collateral appraisal | ₦10,000 - ₦50,000 | For secured loans only |
| Legal documentation | ₦5,000 - ₦20,000 | For formal agreements |
| Management fee | 0.75% per month | Included in monthly payment |
| Late payment fee | ₦1,000 per day | Max ₦10,000 |

**Quick Loans (Instant Micro-Loans)**
| Fee Type | Charge |
|----------|--------|
| All fees | Included in interest rate (5% per month) |
| Late payment | ₦200 per day (max ₦2,000) |

#### **Card Services (Future Implementation)**

**ATM Card**
| Service | Fee |
|---------|-----|
| Card issuance | ₦1,000 (one-time) |
| Annual maintenance | ₦1,000/year |
| Card replacement (lost/stolen) | ₦1,000 |
| PIN reset | ₦200 |

**Virtual Card (for Online Payments)**
| Service | Fee |
|---------|-----|
| Card creation | ₦0 (FREE) |
| Monthly maintenance | ₦0 (FREE) |
| International transaction fee | 1% of transaction amount |

#### **Account Management Fees**

**Statement Charges**
| Service | Fee |
|---------|-----|
| E-statement (email/app) | ₦0 (FREE) |
| Printed statement (self-service) | ₦0 (FREE) |
| Printed statement (branch) | ₦500 per request |
| Historical statement (>1 year) | ₦1,000 per year |

**Other Charges**
| Service | Fee |
|---------|-----|
| Reference letter | ₦2,000 |
| Account closure | ₦500 |
| Dormant account reactivation | ₦1,000 |
| Stop payment instruction | ₦500 per instruction |
| Cheque book (if applicable) | ₦2,000 per book (50 leaves) |

#### **Penalty Charges**

**Transaction-Related**
| Penalty Type | Charge |
|--------------|--------|
| Insufficient funds | ₦100 per failed transaction |
| Duplicate transaction | ₦0 (refunded automatically) |
| Disputed transaction (if customer error) | ₦500 investigation fee |
| Unauthorized account access | ₦0 (FMFB absorbs costs) |

**Limit-Related**
| Penalty Type | Charge |
|--------------|--------|
| Exceeding daily limit | Transaction blocked (no charge) |
| Exceeding monthly limit | Transaction blocked (no charge) |

#### **Fee Waiver Programs**

**Student Accounts**
- All fees waived for verified students (with student ID)
- Free account for duration of studies
- Free transfers, no maintenance fees

**Low-Income/Vulnerable Groups**
- Tier 1 accounts remain completely free
- Subsidized fees for identified vulnerable populations
- Partnership with NGOs for financial inclusion

**High-Value Customers**
- Premium accounts (balance >₦1,000,000) - all fees waived
- VIP customer status - negotiated fee structure
- Relationship pricing for high-volume business accounts

#### **Promotional Pricing (Launch Period)**

**First 6 Months After Launch:**
- All external transfers: 50% discount
- No account maintenance fees
- First loan application fee waived
- Referral bonus: ₦500 per successful referral (both parties)

**First 100,000 Customers:**
- Lifetime 25% discount on all fees
- Early adopter benefits
- Premium features unlocked

---

### 1.j) REVENUE SHARING FORMULA AMONG THE PARTIES INVOLVED

#### **Parties Involved in Revenue Sharing**

1. **FirstMidas Microfinance Bank (FMFB)** - Primary financial institution
2. **OrokiiPay Technologies** - Technology partner and platform provider
3. **NIBSS** - Interbank settlement infrastructure provider
4. **Billers/Merchants** - Utility companies, telcos, cable TV providers
5. **Third-Party Service Providers** - BVN verification, credit bureaus, SMS providers

---

#### **1. Transfer Fee Revenue Sharing**

**External Transfers (via NIBSS)**

Example: ₦50,000 transfer (Customer pays ₦25 fee)

| Party | Share | Amount | Percentage | Justification |
|-------|-------|--------|------------|---------------|
| **Customer Payment** | - | ₦25.00 | 100% | Total fee collected |
| **NIBSS** | Fixed fee | ₦3.75 | 15% | NIP transaction charge (mandated) |
| **FMFB** | Net revenue | ₦10.625 | 42.5% | Risk bearer, capital provider, compliance |
| **OrokiiPay** | Technology fee | ₦10.625 | 42.5% | Platform maintenance, hosting, support |
| **Total Distribution** | - | ₦25.00 | 100% | - |

**Annual Projection (Year 1):**
- Estimated external transfers: 500,000 transactions
- Average fee: ₦40 per transaction
- Total revenue: ₦20,000,000
- NIBSS cost: ₦1,875,000 (fixed ₦3.75 × 500,000)
- Net revenue: ₦18,125,000
- FMFB share: ₦9,062,500 (50% of net)
- OrokiiPay share: ₦9,062,500 (50% of net)

**International Transfers**

Example: $500 transfer to USA (2.5% fee = $12.50 or ₦10,000 at ₦800/$)

| Party | Share | Amount | Percentage | Justification |
|-------|-------|--------|------------|---------------|
| **Customer Payment** | - | ₦10,000 | 100% | Total fee collected |
| **Correspondent Bank** | Wire fee | ₦4,000 | 40% | International swift charges |
| **Forex Spread** | FX margin | ₦1,000 | 10% | Foreign exchange conversion margin |
| **Net Revenue** | - | ₦5,000 | 50% | Available for sharing |
| **FMFB** | Net revenue | ₦2,500 | 25% | Foreign exchange, compliance, risk |
| **OrokiiPay** | Technology fee | ₦2,500 | 25% | Platform integration |
| **Total Distribution** | - | ₦10,000 | 100% | - |

---

#### **2. Bill Payment Commission Sharing**

**Airtime and Data Purchase**

Example: ₦5,000 airtime purchase (Commission from telco: 2% = ₦100)

| Party | Share | Amount | Percentage | Justification |
|-------|-------|--------|------------|---------------|
| **Telco Payment to Platform** | - | ₦100 | 100% | Total commission |
| **FMFB** | Commission | ₦50 | 50% | Customer relationship, settlement |
| **OrokiiPay** | Technology fee | ₦50 | 50% | API integration, maintenance |
| **Total Distribution** | - | ₦100 | 100% | - |

**Annual Projection (Year 1):**
- Estimated airtime purchases: 1,000,000 transactions
- Average commission: ₦80 per transaction
- Total commission: ₦80,000,000
- FMFB share: ₦40,000,000 (50%)
- OrokiiPay share: ₦40,000,000 (50%)

**Electricity Bill Payments**

Example: ₦20,000 electricity payment (Customer pays ₦50 fee + 0.5% biller commission = ₦100)

| Party | Share | Amount | Percentage | Justification |
|-------|-------|--------|------------|---------------|
| **Customer Fee** | - | ₦50 | 33.3% | Transaction fee from customer |
| **Biller Commission** | - | ₦100 | 66.7% | Commission from electricity company |
| **Total Revenue** | - | ₦150 | 100% | Combined revenue |
| | | | | |
| **FMFB** | Net revenue | ₦75 | 50% | Settlement, customer service |
| **OrokiiPay** | Technology fee | ₦75 | 50% | Platform, biller API integration |
| **Total Distribution** | - | ₦150 | 100% | - |

---

#### **3. Savings Product Revenue Sharing**

**Interest Spread on Deposits**

Example: ₦1,000,000 in customer savings (FMFB lends at 20% p.a., pays customer 10% p.a.)

| Component | Annual Amount | Monthly Amount | Notes |
|-----------|---------------|----------------|-------|
| **FMFB Lending Income** | ₦200,000 (20%) | ₦16,667 | Income from lending customer deposits |
| **Customer Interest Paid** | ₦100,000 (10%) | ₦8,333 | Interest paid to saver |
| **Net Interest Margin** | ₦100,000 (10%) | ₦8,333 | Available for distribution |
| | | | |
| **FMFB Share** | ₦50,000 | ₦4,167 | 50% - Capital risk, regulatory compliance |
| **OrokiiPay Share** | ₦50,000 | ₦4,167 | 50% - Technology platform, automation |
| **Total Distribution** | ₦100,000 | ₦8,333 | 100% |

**Annual Projection (Year 1):**
- Estimated savings deposits: ₦500,000,000
- Net interest margin: 10%
- Total NIM: ₦50,000,000
- FMFB share: ₦25,000,000 (50%)
- OrokiiPay share: ₦25,000,000 (50%)

---

#### **4. Loan Product Revenue Sharing**

**Interest Income and Fees**

Example: ₦200,000 personal loan at 24% p.a. for 12 months

| Revenue Component | Amount | Distribution |
|-------------------|--------|--------------|
| **Interest Income (24% p.a.)** | ₦48,000 | |
| - FMFB | ₦24,000 | 50% (capital risk, default risk) |
| - OrokiiPay | ₦24,000 | 50% (AI credit scoring, platform) |
| **Processing Fee (1%)** | ₦2,000 | |
| - FMFB | ₦1,000 | 50% (underwriting, compliance) |
| - OrokiiPay | ₦1,000 | 50% (application processing) |
| **Management Fee (0.5% monthly)** | ₦12,000 | |
| - FMFB | ₦6,000 | 50% (loan servicing, collections) |
| - OrokiiPay | ₦6,000 | 50% (automated payment processing) |
| **Total Revenue** | ₦62,000 | |
| **FMFB Total** | ₦31,000 | 50% |
| **OrokiiPay Total** | ₦31,000 | 50% |

**Annual Projection (Year 1):**
- Estimated loan book: ₦200,000,000
- Average interest rate: 24%
- Total interest income: ₦48,000,000
- Total fees: ₦8,000,000
- Total revenue: ₦56,000,000
- FMFB share: ₦28,000,000 (50%)
- OrokiiPay share: ₦28,000,000 (50%)

---

#### **5. Account Maintenance Fee Sharing**

Example: Tier 2 account (₦100/month maintenance fee)

| Party | Share | Amount | Percentage | Justification |
|-------|-------|--------|------------|---------------|
| **Customer Payment** | - | ₦100 | 100% | Monthly maintenance fee |
| **FMFB** | Revenue | ₦50 | 50% | Regulatory compliance, customer service |
| **OrokiiPay** | Platform fee | ₦50 | 50% | Account hosting, app maintenance, support |
| **Total Distribution** | - | ₦100 | 100% | - |

**Annual Projection (Year 1):**
- Estimated active accounts: 30,000 (paying maintenance)
- Average monthly fee: ₦80 (after waivers)
- Total annual revenue: ₦28,800,000
- FMFB share: ₦14,400,000 (50%)
- OrokiiPay share: ₦14,400,000 (50%)

---

#### **6. Third-Party Service Provider Payments (Pass-Through)**

These are costs, not revenue sharing:

**BVN Verification**
- Cost per verification: ₦50
- Paid to: NIBSS
- Borne by: FMFB (absorbed as customer acquisition cost)

**SMS Notifications**
- Cost per SMS: ₦3
- Paid to: SMS aggregator
- Borne by: FMFB (50%), OrokiiPay (50%)

**Credit Bureau Checks**
- Cost per check: ₦200
- Paid to: CRC Credit Bureau
- Borne by: FMFB (deducted from loan processing fee)

---

#### **Consolidated Revenue Sharing Summary**

**FMFB (FirstMidas Microfinance Bank):**
- Transfer fees (after NIBSS): 50% of net revenue
- Bill payment commissions: 50%
- Interest spread: 50%
- Loan fees and interest: 50%
- Account maintenance: 50%
- **Weighted Average Share: ~50% (of net revenue after third-party costs)**

**OrokiiPay Technologies:**
- Transfer fees (after NIBSS): 50% of net revenue
- Bill payment commissions: 50%
- Interest spread: 50%
- Loan fees and interest: 50%
- Account maintenance: 50%
- **Weighted Average Share: ~50% (of net revenue after third-party costs)**

**Third Parties (NIBSS, Billers, etc.):**
- NIBSS transfer fees: ₦3.75 fixed per transaction (~9% of average transfer fee)
- Biller commissions: Paid by billers (not from customer fees)
- **Third Party Costs: ~9% of gross transfer revenue**

---

#### **Annual Revenue Projection (Year 1) - Consolidated**

| Revenue Source | Total Revenue | Third Party Cost | Net Revenue | FMFB Share (50%) | OrokiiPay Share (50%) |
|----------------|---------------|------------------|-------------|------------------|-----------------------|
| **1. Transfer Fees** | ₦20,000,000 | ₦1,875,000 | ₦18,125,000 | ₦9,062,500 | ₦9,062,500 |
| **2. Bill Payment Commissions** | ₦100,000,000 | ₦0 | ₦100,000,000 | ₦50,000,000 | ₦50,000,000 |
| **3. Savings Interest Spread** | ₦50,000,000 | ₦0 | ₦50,000,000 | ₦25,000,000 | ₦25,000,000 |
| **4. Loan Income** | ₦56,000,000 | ₦0 | ₦56,000,000 | ₦28,000,000 | ₦28,000,000 |
| **5. Account Maintenance** | ₦28,800,000 | ₦0 | ₦28,800,000 | ₦14,400,000 | ₦14,400,000 |
| **6. Other Fees** | ₦15,000,000 | ₦0 | ₦15,000,000 | ₦7,500,000 | ₦7,500,000 |
| **TOTAL REVENUE** | **₦269,800,000** | **₦1,875,000** | **₦267,925,000** | **₦133,962,500** | **₦133,962,500** |
| **Percentage of Total** | **100%** | **0.7%** | **99.3%** | **49.65%** | **49.65%** |

---

#### **Profit Distribution After Operating Costs**

**Year 1 Scenario:**
- Total Revenue: ₦269,800,000
- Total Operating Costs: ₦243,600,000
- **Net Profit: ₦26,200,000**

**Profit Sharing (50-50 Split):**
- FMFB: ₦13,100,000 (50% - equal partnership)
- OrokiiPay: ₦13,100,000 (50% - equal partnership)

**Return on Investment (ROI):**
- FMFB investment: ₦100,000,000
- FMFB Year 1 profit: ₦13,100,000
- **FMFB ROI: 13.1%**

- OrokiiPay investment: ₦50,000,000 (development costs)
- OrokiiPay Year 1 profit: ₦13,100,000
- **OrokiiPay ROI: 26.2%**

---

#### **Revenue Sharing Agreement Terms**

**1. Review Period:**
- Revenue sharing percentages reviewed annually
- Adjustments based on actual costs, volumes, and market conditions
- Either party can request review with 60-day notice

**2. Minimum Guarantees:**
- OrokiiPay guaranteed minimum of ₦5,000,000/month regardless of revenue
- 50-50 revenue share maintained across all revenue streams
- Guarantees reassessed annually

**3. Performance Incentives:**
- OrokiiPay: Additional 2% bonus if system uptime >99.9%
- OrokiiPay: Additional 3% bonus if customer satisfaction >4.5/5
- FMFB: Additional share if customer acquisition targets exceeded

**4. Cost Sharing:**
- Infrastructure costs: 50% FMFB, 50% OrokiiPay
- Marketing costs: 50% FMFB, 50% OrokiiPay
- Regulatory/compliance costs: 100% FMFB (as licensed institution)
- Technology development: 100% OrokiiPay (as technology partner)

---

### 1.k) DETAILED TRANSACTIONS SETTLEMENT ARRANGEMENTS

#### **1. Internal Transfer Settlement (Same Bank)**

**Process Flow:**
```
Customer Initiates Transfer → Authentication → Balance Check →
Debit Sender Wallet → Credit Recipient Wallet → Notification → Settlement Complete
```

**Settlement Characteristics:**
- **Settlement Time:** Instant (real-time)
- **Settlement Method:** Database transaction (ACID compliance)
- **Reversibility:** Within 24 hours with both party consent
- **Reconciliation:** Automated daily reconciliation
- **Settlement Account:** Internal ledger entries, no external settlement

**Database Transaction Flow:**
1. BEGIN TRANSACTION
2. Validate sender balance
3. Validate recipient account
4. Debit sender wallet: `UPDATE wallets SET balance = balance - amount WHERE user_id = sender`
5. Credit recipient wallet: `UPDATE wallets SET balance = balance + amount WHERE user_id = recipient`
6. Insert transaction record
7. COMMIT TRANSACTION (or ROLLBACK on error)

**Reconciliation:**
- Real-time balance verification
- End-of-day ledger balancing
- Exception handling for failed transactions
- Automated reversal of errors
- Audit trail maintained for 7 years

---

#### **2. External Transfer Settlement (NIBSS/NIP)**

**Process Flow:**
```
Customer Initiates Transfer → Authentication → Name Enquiry (NIBSS) →
Fraud Check → Balance Check → Debit Customer → NIBSS Fund Transfer →
NIBSS Settlement → Status Query → Notification → Reconciliation
```

**Settlement Characteristics:**
- **Settlement Time:** Real-time (T+0)
- **Settlement Method:** NIBSS Instant Payment (NIP)
- **Operating Hours:** 24/7/365
- **Settlement Account:** FMFB settlement account at NIBSS
- **Reconciliation:** Real-time with NIBSS, batch confirmation

**Detailed Settlement Steps:**

**Step 1: Name Enquiry (Pre-Authorization)**
- FMFB sends name enquiry request to NIBSS
- NIBSS routes to destination bank
- Destination bank returns account holder name
- Customer confirms beneficiary name
- Session ID generated for tracking

**Step 2: Fund Transfer Authorization**
- FMFB debits customer account
- FMFB sends fund transfer instruction to NIBSS
- NIBSS validates:
  - FMFB settlement account balance
  - Transaction reference uniqueness
  - Beneficiary bank code validity
  - Amount within limits

**Step 3: NIBSS Settlement Process**
- NIBSS debits FMFB settlement account
- NIBSS credits destination bank settlement account
- Settlement is immediate and irrevocable
- NIBSS generates transaction reference
- Response code sent to FMFB

**Step 4: Beneficiary Credit**
- Destination bank receives credit notification
- Destination bank credits beneficiary account
- Destination bank sends confirmation to NIBSS
- NIBSS forwards confirmation to FMFB

**Step 5: Status Confirmation**
- FMFB queries transaction status (if no confirmation received)
- NIBSS provides authoritative status
- Transaction marked as successful, failed, or pending
- Customer notified of final status

**Settlement Timeline:**
- Name Enquiry response: <3 seconds
- Fund Transfer processing: <10 seconds
- Settlement completion: <30 seconds
- Total end-to-end: <60 seconds

**Response Codes:**
- `00`: Successful
- `01`: Refer to bank
- `05`: Do not honor
- `12`: Invalid transaction
- `51`: Insufficient funds
- `91`: Issuer/switch inoperative
- `96`: System malfunction

---

#### **3. NIBSS Settlement Account Management**

**FMFB Settlement Account:**
- **Account Number:** [To be assigned by NIBSS]
- **Account Type:** Settlement Account
- **Currency:** Nigerian Naira (NGN)
- **Institution Code:** 090575

**Funding Requirements:**
- **Minimum Prefund Balance:** ₦50,000,000
- **Alert Threshold:** ₦10,000,000
- **Auto-topup Trigger:** ₦5,000,000
- **Target Balance:** ₦100,000,000

**Daily Settlement Cycle:**

**Morning (8:00 AM):**
- Review overnight transaction volume
- Check settlement account balance
- Fund settlement account if below target
- Review pending/failed transactions

**Intraday (Hourly):**
- Monitor real-time settlement account balance
- Alert if balance drops below threshold
- Trigger auto-topup if needed
- Track cumulative debits and credits

**Evening (6:00 PM):**
- Reconcile day's transactions
- Match NIBSS statement with internal records
- Investigate discrepancies
- Prepare settlement report

**End of Day (11:59 PM):**
- Final reconciliation
- Generate daily settlement report
- Archive transaction logs
- Set up for next day

**Reconciliation Process:**

**Real-Time Reconciliation:**
- Each transaction tracked with unique reference
- NIBSS response matched to internal transaction
- Discrepancies flagged immediately
- Automated retry for failed transactions

**Batch Reconciliation (Daily):**
1. Download NIBSS transaction file (CSV/XML)
2. Compare with internal transaction database
3. Match by: Transaction reference, amount, timestamp
4. Identify:
   - Transactions in NIBSS but not in FMFB system (investigate)
   - Transactions in FMFB but not in NIBSS (retry or reverse)
   - Amount mismatches (investigate)
5. Generate exception report
6. Investigate and resolve discrepancies within 24 hours

**Exception Handling:**

**Scenario 1: Transaction Successful at FMFB, Failed at NIBSS**
- FMFB debited customer, NIBSS rejected
- **Action:** Reverse customer debit within 4 hours
- Customer notified of failed transaction
- Refund processed automatically

**Scenario 2: Transaction Successful at NIBSS, No Confirmation to FMFB**
- NIBSS settled, but FMFB didn't receive confirmation
- **Action:** Query transaction status via TSQ (Transaction Status Query)
- Update internal records based on authoritative NIBSS status
- Notify customer if successful

**Scenario 3: Duplicate Transaction**
- Customer charged twice for same transaction
- **Action:** Identify duplicate via reference number
- Reverse duplicate transaction
- Refund customer within 24 hours

**Scenario 4: NIBSS System Downtime**
- NIBSS unavailable during transaction
- **Action:** Queue transaction for retry
- Retry every 5 minutes for up to 2 hours
- If still failing, reverse customer debit
- Notify customer and suggest retry later

---

#### **4. Bill Payment Settlement**

**Settlement Arrangements with Billers:**

**Airtime/Data (Telcos):**
- **Settlement Model:** Pre-paid wallet with telco
- **Settlement Frequency:** Daily reconciliation, weekly topup
- **Process:**
  1. FMFB maintains pre-paid wallet with telco aggregator (e.g., ₦10,000,000)
  2. Customer purchases airtime via OrokiiPay
  3. OrokiiPay sends recharge request to aggregator
  4. Aggregator debits FMFB wallet, credits customer number
  5. Daily reconciliation: Total purchases vs wallet debits
  6. Weekly topup of FMFB wallet based on usage patterns

**Electricity (DISCOs):**
- **Settlement Model:** Post-paid settlement (T+1)
- **Settlement Frequency:** Daily settlement, weekly payout
- **Process:**
  1. Customer pays electricity bill via OrokiiPay
  2. FMFB holds payment in suspense account
  3. OrokiiPay sends payment notification to DISCO
  4. DISCO confirms credit to customer meter
  5. Daily batch settlement: FMFB transfers aggregate to DISCO
  6. DISCO sends commission back to FMFB

**Cable TV (Multichoice, etc.):**
- **Settlement Model:** Real-time settlement via API
- **Settlement Frequency:** Instant subscription activation
- **Process:**
  1. Customer pays for cable subscription
  2. OrokiiPay sends payment to cable provider API
  3. Cable provider confirms payment and activates subscription
  4. Real-time settlement via designated settlement account
  5. Daily reconciliation for all transactions

**Government Payments:**
- **Settlement Model:** Direct remittance to TSA (Treasury Single Account)
- **Settlement Frequency:** Same-day settlement
- **Process:**
  1. Customer pays government fee/tax
  2. FMFB collects payment
  3. FMFB remits to designated government account within 24 hours
  4. FMFB retains collection fee (e.g., ₦100 per transaction)

---

#### **5. Loan Disbursement and Repayment Settlement**

**Loan Disbursement:**
1. Loan approved by credit committee/AI system
2. Loan amount debited from FMFB loan book account
3. Customer wallet credited with net amount (after deducting fees)
4. Settlement is instant (database transaction)
5. Loan balance recorded in loans table
6. Repayment schedule generated

**Loan Repayment:**

**Automated Repayment (Standing Order):**
1. Repayment due date triggers scheduled job
2. System checks customer primary wallet balance
3. If sufficient balance:
   - Debit customer wallet
   - Credit loan repayment account
   - Update loan balance
   - Generate receipt
4. If insufficient balance:
   - Flag as missed payment
   - Send reminder notification
   - Apply late payment fee after grace period (3 days)

**Manual Repayment:**
1. Customer initiates repayment via app
2. Select loan to repay
3. Enter amount (minimum: monthly installment)
4. Authenticate with PIN/biometric
5. Debit wallet, credit loan account
6. Update loan balance
7. Generate receipt

**Early Repayment:**
- No penalty
- Reduces interest payable
- Pro-rata interest calculation up to repayment date
- Remaining principal cleared
- Loan marked as closed

---

#### **6. Interest Posting Settlement (Savings Products)**

**Regular Savings Interest:**
- **Accrual:** Daily interest accrual
- **Posting:** Monthly interest posting
- **Process:**
  1. Daily: Calculate interest = (Daily Balance × Annual Rate) / 365
  2. Daily: Record accrued interest in interest_accruals table
  3. Last day of month: Sum all daily accruals
  4. Apply withholding tax (10%) if interest >₦100,000/year
  5. Credit customer savings account with net interest
  6. Generate interest statement

**High-Yield/Locked Savings Interest:**
- **Accrual:** Daily interest accrual (tiered rates)
- **Posting:** Quarterly interest posting (or at maturity for locked)
- **Process:**
  1. Daily tier check: Adjust interest rate based on balance tiers
  2. Calculate daily interest using current tier rate
  3. Record accrued interest
  4. Posting date: Sum accruals, apply tax, credit account
  5. For locked savings: Credit at maturity only

**Interest Rate Tiers Example:**
- ₦0 - ₦100,000: 8% p.a.
- ₦100,001 - ₦500,000: 10% p.a.
- ₦500,001 - ₦1,000,000: 12% p.a.
- ₦1,000,001+: 15% p.a.

---

#### **7. Dispute Resolution and Chargeback Settlement**

**Customer Dispute Process:**

**Step 1: Dispute Filing (T+0)**
- Customer files dispute via app or customer service
- Dispute categories: Unauthorized transaction, wrong amount, duplicate charge, non-receipt of service
- Transaction automatically flagged for investigation
- Funds held in suspense if applicable

**Step 2: Investigation (T+1 to T+5)**
- FMFB reviews transaction logs
- Check for: Customer authentication, transaction approvals, NIBSS confirmations
- Contact beneficiary bank (for external transfers)
- Review with biller (for bill payments)
- Gather evidence

**Step 3: Resolution (T+5 to T+10)**

**Scenario A: Customer is Right**
- Transaction reversed
- Customer refunded within 24 hours of resolution
- Any fees charged are also refunded
- Apology issued

**Scenario B: Customer is Wrong**
- Evidence presented to customer
- Transaction stands
- No refund
- Investigation fee (₦500) may apply if dispute was frivolous

**Scenario C: Unclear/Disputed**
- Escalate to senior management
- May involve NIBSS dispute resolution if interbank
- CBN escalation if unresolved after 30 days
- Provisional credit to customer pending final resolution

**Chargeback Settlement (NIBSS Disputes):**

**Receiving Chargeback (FMFB customer is beneficiary):**
1. NIBSS notifies FMFB of chargeback request from originating bank
2. FMFB investigates if customer received funds
3. If funds were received and not refunded:
   - FMFB debits customer account
   - FMFB credits NIBSS settlement account
   - NIBSS refunds originating bank
4. If customer account insufficient:
   - FMFB absorbs loss
   - Pursue recovery from customer

**Initiating Chargeback (FMFB customer is sender):**
1. Customer reports failed transfer (e.g., sent to wrong account)
2. FMFB investigates
3. If eligible for chargeback:
   - FMFB sends chargeback request to NIBSS
   - NIBSS notifies destination bank
   - Destination bank reverses transaction
   - Funds returned via NIBSS
   - FMFB credits customer
4. Timeline: Up to 30 days

---

#### **8. Settlement Reporting**

**Daily Reports:**
1. **Transaction Volume Report**
   - Total transactions by type
   - Success vs failure rates
   - Average transaction size

2. **Settlement Balance Report**
   - Opening balance (NIBSS settlement account)
   - Total debits (outgoing transfers)
   - Total credits (incoming transfers)
   - Closing balance

3. **Reconciliation Report**
   - Matched transactions
   - Unmatched transactions
   - Pending transactions
   - Discrepancies

4. **Exception Report**
   - Failed transactions
   - Reversed transactions
   - Disputed transactions
   - Manual interventions

**Weekly Reports:**
1. **Settlement Analysis**
   - Net settlement position (inflows vs outflows)
   - Settlement account funding requirements
   - Transaction trends

2. **Biller Settlement Report**
   - Commission earned by biller type
   - Settlement pending
   - Settlement completed

**Monthly Reports:**
1. **Comprehensive Settlement Report**
   - All transaction types
   - Revenue by source
   - Settlement efficiency metrics
   - Compliance reporting

2. **Regulatory Reporting**
   - CBN returns
   - NIBSS transaction statistics
   - Large transaction reporting

---

#### **9. Settlement Risk Mitigation**

**Liquidity Risk:**
- **Mitigation:** Maintain 2x daily average settlement requirement in NIBSS account
- **Monitoring:** Real-time balance alerts
- **Contingency:** Standby credit facility with parent bank

**Operational Risk:**
- **Mitigation:** Automated settlement processes, minimal manual intervention
- **Monitoring:** Transaction success rates, system uptime
- **Contingency:** Manual fallback procedures, alternative payment channels

**Fraud Risk:**
- **Mitigation:** AI fraud detection before settlement
- **Monitoring:** Real-time transaction monitoring
- **Contingency:** Instant transaction reversal capability

**Counterparty Risk:**
- **Mitigation:** NIBSS acts as central counterparty (eliminates bilateral risk)
- **Monitoring:** N/A (NIBSS guaranteed settlement)
- **Contingency:** NIBSS settlement guarantee fund

**System Risk:**
- **Mitigation:** High availability architecture (99.9% uptime)
- **Monitoring:** 24/7 system monitoring
- **Contingency:** Disaster recovery site, transaction queueing

---

---

### 1.l) PRODUCT RISKS AND MITIGANTS

**Settlement Risk**
- **Risk:** Failure to complete settlement after funds debited
- **Mitigant:** NIBSS acts as central counterparty; automated rollback on failure; settlement guarantee fund

**Financial Risk**
- **Risk:** Loan defaults, fraud losses
- **Mitigant:** AI credit scoring; collateral for large loans; fraud detection system; loan loss provisions (5% of loan book)

**Legal Risk**
- **Risk:** Non-compliance with regulations; contract disputes
- **Mitigant:** Dedicated compliance team; regular legal audits; CBN-approved terms & conditions; ADR mechanisms

**Reputation Risk**
- **Risk:** System downtime; data breaches; service failures
- **Mitigant:** 99.9% uptime SLA; multi-layer security; 24/7 customer support; crisis management plan; insurance coverage

**Exchange Rate Risk**
- **Risk:** FX volatility on international transactions
- **Mitigant:** Real-time FX rates; customer承confirmation before execution; FX hedging for large transactions

**Liquidity Risk**
- **Risk:** Insufficient funds for settlement
- **Mitigant:** ₦50M minimum settlement balance; daily monitoring; standby credit facility; automated alerts

**Cybersecurity Risk**
- **Risk:** Hacking, DDoS, data breaches
- **Mitigant:** WAF, IDS/IPS, encryption, penetration testing, SOC monitoring, cyber insurance (₦500M coverage)

**Operational Risk**
- **Risk:** System failures, human error
- **Mitigant:** Automated processes; dual approval for critical operations; DR/BC plans; 4-hour RTO

---

### 1.m) ROLES AND RESPONSIBILITIES OF PARTIES

**FirstMidas Microfinance Bank (FMFB)**
- Regulatory compliance and CBN reporting
- Capital provision and liquidity management
- Customer onboarding and KYC/AML
- Settlement account management (NIBSS)
- Customer service and dispute resolution
- Risk management and fraud monitoring
- Marketing and customer acquisition

**OrokiiPay Technologies**
- Platform development and maintenance
- Infrastructure hosting (GCP)
- System uptime and performance (99.9% SLA)
- Security implementation and monitoring
- API integrations (NIBSS, billers, BVN)
- Technical support (24/7)
- Software updates and enhancements
- Data backup and disaster recovery

**NIBSS**
- Interbank fund transfer processing (NIP)
- BVN verification services
- Settlement and reconciliation
- Transaction routing between banks
- Dispute resolution (interbank)

**Billers/Merchants**
- Service delivery confirmation
- Commission payment to FMFB
- API availability and uptime
- Customer subscription/payment confirmation
- Dispute resolution (service-related)

**Third-Party Services**
- **SMS Provider:** OTP and notification delivery
- **Credit Bureau:** Credit history reports for loans
- **Cloud Provider (GCP):** Infrastructure and hosting
- **Security Vendors:** Penetration testing, vulnerability scanning

---

### 1.n) DISPUTE RESOLUTION MECHANISM

**Level 1: Customer Service (T+0 to T+3)**
- Customer files dispute via app, email, or hotline (080-OROKIIPAY)
- Ticket generated automatically
- Initial response within 24 hours
- Investigation by support team
- Resolution target: 72 hours for simple disputes

**Level 2: Escalation (T+3 to T+10)**
- Unresolved disputes escalated to management
- Detailed investigation involving all parties
- Evidence gathering (transaction logs, recordings, documents)
- Management decision within 7 days

**Level 3: Alternative Dispute Resolution (T+10 to T+30)**
- Mediation by neutral third party
- Lagos Court of Arbitration or designated arbitrator
- Binding arbitration if mediation fails
- Decision within 20 days

**Level 4: Regulatory Escalation (T+30+)**
- Complaint filed with CBN Consumer Protection Department
- CBN investigation and directive
- FMFB compliance with CBN directive mandatory

**Interbank Disputes (NIBSS-related)**
- Handled through NIBSS Dispute Resolution Committee
- 30-day resolution timeline
- NIBSS decision is binding on member banks

---

### 1.o) QUALIFICATION OF OFI PERSONNEL

**Digital Banking Operations Team**

| Role | Required Qualification | Count |
|------|----------------------|-------|
| **Head of Digital Banking** | MBA + 10 years banking experience | 1 |
| **IT Security Manager** | CISSP/CISM + 7 years security experience | 1 |
| **Compliance Officer (MLRO)** | Law/Accounting degree + AML certification | 1 |
| **Database Administrator** | B.Sc Computer Science + Oracle/PostgreSQL cert | 2 |
| **DevOps Engineers** | B.Sc + AWS/GCP certification | 2 |
| **Customer Support Leads** | B.Sc + Banking experience | 2 |
| **Support Agents** | OND/HND + Customer service training | 10 |

**Training Program**
- Initial: 4-week intensive training (platform, compliance, customer service)
- Ongoing: Monthly training sessions
- Certifications: AML, cybersecurity, customer service
- External: CBN-approved training programs

---

### 1.p) CYBERSECURITY POLICY

**Key Policies:**

1. **Access Control Policy**
   - Role-based access (RBAC)
   - Multi-factor authentication mandatory
   - Password complexity: 12+ characters, special chars, numbers
   - Password rotation: Every 90 days
   - Failed login lockout: 5 attempts

2. **Data Protection Policy**
   - AES-256 encryption at rest
   - TLS 1.3 encryption in transit
   - PII encryption in database
   - Encrypted backups
   - Data retention: 7 years

3. **Incident Response Policy**
   - 24/7 Security Operations Center (SOC)
   - Incident severity levels (P1 to P4)
   - P1 (Critical): Response within 15 minutes
   - Customer notification within 24 hours of data breach
   - CBN notification within 2 hours of significant incident

4. **Vulnerability Management**
   - Monthly vulnerability scans
   - Quarterly penetration testing
   - Critical patches within 24 hours
   - Annual security audit

5. **Third-Party Security**
   - Vendor security assessment
   - Data Processing Agreements (DPAs)
   - Annual vendor audits
   - Access review quarterly

6. **Employee Security**
   - Background checks mandatory
   - Security awareness training (quarterly)
   - Clean desk policy
   - NDA and acceptable use agreements
   - Separation procedures for terminated staff

---

### 1.q) DATA PRIVACY AND THIRD-PARTY ACCESS

**Data Privacy Consent**
- Explicit consent obtained during registration
- Granular permissions for specific data uses
- Opt-in for marketing communications
- Right to data portability
- Right to erasure (subject to legal retention requirements)

**Third Parties with Access to Customer Information**

| Third Party | Data Accessed | Purpose | Access Level | Safeguards |
|-------------|--------------|---------|--------------|------------|
| **NIBSS** | Name, BVN, Account number, Phone | BVN validation, Fund transfers | Read-only via API | DPA signed, CBN-regulated |
| **Credit Bureau** | Name, BVN, Loan history | Credit scoring for loans | Read/Write via API | DPA signed, Encrypted transmission |
| **SMS Provider** | Phone number, Transaction details | OTP and alerts | Write-only | Tokenized customer IDs, DPA signed |
| **Cloud Provider (GCP)** | Encrypted database, Application logs | Infrastructure hosting | No access to decrypted data | Encryption keys held by FMFB, Google Cloud security |
| **Security Auditors** | Application code, System logs | Security audits | Temporary read-only | NDA signed, Supervised access |

**Data Minimization:** Only necessary data shared; full PII never transmitted to third parties

---

### 1.r) TESTING AND QUALITY ASSURANCE REPORT

**Pre-Launch Testing (Completed September 2025)**

| Test Type | Coverage | Pass Rate | Issues Found | Status |
|-----------|----------|-----------|--------------|--------|
| Unit Tests | 297 tests | 100% | 0 | ✅ Complete |
| Integration Tests | API endpoints, Database | 98% | 3 (resolved) | ✅ Complete |
| UAT (User Acceptance) | 50 users, 2 weeks | 92% satisfaction | 8 UI issues (fixed) | ✅ Complete |
| Security Penetration | OWASP Top 10 | No critical/high | 2 medium (fixed) | ✅ Complete |
| Load Testing | 10,000 concurrent users | 99.8% success | Passed | ✅ Complete |
| NIBSS Integration | Sandbox testing | 95% success | Network timeouts (retry logic added) | ✅ Complete |

**Summary:** Platform passed all quality gates. Ready for pilot phase.

---

### 1.s) PILOT PHASE REPORT

**Pilot Plan (Proposed)**

| Phase | Duration | Participants | Scope | Success Metrics |
|-------|----------|-------------|-------|-----------------|
| **Phase 1** | 4 weeks | 500 FMFB staff & families | All features except loans | >90% satisfaction, <5 critical bugs |
| **Phase 2** | 8 weeks | 5,000 selected customers | All features | >85% satisfaction, <10 critical bugs |
| **Phase 3** | 12 weeks | 20,000 customers (Lagos/Abuja) | Full launch | >80% satisfaction, operational stability |

**Pilot Objectives:**
- Validate system stability under real load
- Test customer onboarding flow
- Verify NIBSS integration in production
- Gather user feedback for improvements
- Train customer support team with real scenarios

**Go/No-Go Criteria for Full Launch:**
- System uptime >99.5%
- Transaction success rate >98%
- Customer satisfaction >85%
- No unresolved critical security issues
- Compliance review passed
- CBN approval received

**Pilot Report:** [To be completed after pilot phase]

---

### 1.t) ENCRYPTION METHOD

**Data in Transit:**
- Protocol: TLS 1.3 with Perfect Forward Secrecy (PFS)
- Cipher Suites: AES-256-GCM, ChaCha20-Poly1305
- Certificate: 2048-bit RSA or 256-bit ECC
- Certificate Pinning: Enabled in mobile apps

**Data at Rest:**
- Database: AES-256 encryption for sensitive columns (PII, PINs, financial data)
- File Storage: AES-256 encryption for uploaded documents
- Backups: Encrypted with AES-256, separate key management

**Key Management:**
- Production keys stored in Hardware Security Module (HSM)
- Key rotation: Annual for data encryption keys
- Master keys: 4096-bit RSA, stored in HSM
- Key access: Limited to 2 authorized personnel, dual authorization required

**Password/PIN Hashing:**
- Algorithm: bcrypt with 12 rounds (cost factor)
- PINs: Hashed before storage, never transmitted in plain text
- Biometric data: Stored on device only, never transmitted

---

### 1.u) EXTRA CAPITAL REQUIREMENT

**Risk-Based Capital Assessment:**

| Risk Category | Capital Allocation | Rationale |
|---------------|-------------------|-----------|
| **Operational Risk** | ₦20,000,000 | Technology failures, errors, fraud |
| **Credit Risk** | ₦30,000,000 | Loan defaults (15% of loan book) |
| **Market Risk** | ₦5,000,000 | FX exposure on international transfers |
| **Cybersecurity Reserve** | ₦15,000,000 | Data breach, cyber incidents |
| **Settlement Risk** | ₦10,000,000 | NIBSS settlement delays/failures |
| **Regulatory Buffer** | ₦20,000,000 | Compliance fines, remediation costs |
| **TOTAL ADDITIONAL CAPITAL** | **₦100,000,000** | 10% of annual operating costs |

**Capital Adequacy:**
- Minimum Capital: ₦100,000,000
- Current FMFB Capital: [To be confirmed by FMFB - assumed adequate as microfinance bank]
- Additional Capital for Digital Banking: ₦100,000,000
- **Total Capital Requirement:** ₦100,000,000 (additional)

**Source of Additional Capital:**
- FMFB retained earnings: ₦50,000,000
- Shareholders' injection: ₦50,000,000

---

### 1.v) COMPLIANCE WITH NIGERIA DATA PROTECTION REGULATION (NDPR)

**NDPR Compliance Measures:**

**1. Legal Basis for Processing**
- Consent obtained explicitly during registration
- Legitimate interest for fraud prevention and security
- Contractual necessity for service delivery
- Legal obligation for AML/KYC compliance

**2. Data Subject Rights**
- Right to access: Customer portal for data download
- Right to rectification: Profile update functionality
- Right to erasure: Account deletion option (subject to 7-year retention for financial records)
- Right to portability: Data export in CSV/JSON format
- Right to object: Opt-out of marketing

**3. Privacy by Design**
- Data minimization: Only collect necessary data
- Purpose limitation: Data used only for stated purposes
- Storage limitation: Automated deletion after retention period
- Encryption and pseudonymization

**4. Data Protection Officer (DPO)**
- **Name:** [To be designated by FMFB]
- **Contact:** dpo@fmfb.com.ng
- **Responsibilities:** NDPR compliance, breach notification, training

**5. Data Breach Notification**
- NITDA notification: Within 72 hours
- Customer notification: Within 7 days (if high risk to rights)
- Documentation: Breach register maintained

**6. Privacy Policy**
- Publicly available on website and app
- Plain language, accessible format
- Regular updates, version control

**7. Audit Trail**
- Data access logs: Who accessed what data, when
- Consent records: Timestamp and IP address
- Data sharing logs: Third parties and data shared

**8. NITDA Registration**
- **Status:** [Application pending / Registered]
- **Registration Number:** [To be assigned]

**Evidence of Compliance:**
- Privacy policy document (Appendix A)
- DPA with third parties (Appendix B)
- Data inventory and risk assessment (Appendix C)
- Staff training records (Appendix D)
- NITDA registration certificate (Appendix E - pending)

---

## SECTION 2: DRAFT AGREEMENTS AND SLAs

### 2.a) Technical Partners

**OrokiiPay Technologies Service Level Agreement**

**Parties:**
- FirstMidas Microfinance Bank Limited (Client)
- OrokiiPay Technologies Limited (Service Provider)

**Service Scope:**
- Platform hosting and maintenance
- Software updates and enhancements
- Technical support (24/7)
- Security monitoring
- Disaster recovery

**Service Levels:**
- **Uptime SLA:** 99.9% (43 minutes downtime per month max)
- **API Response Time:** <500ms (95th percentile)
- **Support Response:** P1 (15 min), P2 (1 hour), P3 (4 hours), P4 (24 hours)
- **Backup Frequency:** Every 6 hours
- **RTO:** 4 hours
- **RPO:** 15 minutes

**Revenue Sharing:** As per Section 1.j

**Term:** 5 years, renewable

**Termination:** 90 days notice; immediate for material breach

**[Full draft agreement available upon request]**

---

### 2.b) Participating Banks

**Inter-Bank Agreement (via NIBSS)**

**Parties:**
- FirstMidas Microfinance Bank Limited
- All NIBSS member banks (indirect agreement through NIBSS membership)

**Scope:**
- Fund transfers via NIP
- Name enquiry services
- Settlement and reconciliation

**Settlement Terms:**
- Real-time settlement (T+0)
- NIBSS settlement guarantee
- Daily reconciliation

**Fees:**
- As per NIBSS published tariffs
- Current NIP fees: ₦3.75 fixed per transaction (as of July 2023)

**Dispute Resolution:**
- NIBSS Dispute Resolution Committee
- 30-day resolution timeline

**[NIBSS membership agreement governs - no separate bilateral agreements]**

---

### 2.c) Central Switch (NIBSS)

**NIBSS NIP Participant Agreement**

**Status:** [To be signed / Signed]

**Institution Code:** 090575

**Services:**
- Nigeria Instant Payment (NIP)
- BVN Validation
- Name Enquiry
- Transaction Status Query

**Settlement Account:**
- Account Number: [To be assigned]
- Minimum Balance: ₦50,000,000

**Technical Requirements:**
- VPN connectivity (Section 1.c VPN form)
- API integration (certified)
- ISO 8583 message format
- Real-time transaction processing

**Fees:**
- As per NIBSS published schedule
- Setup fee: [Amount TBD]
- Monthly subscription: [Amount TBD]
- Per-transaction fees: Variable

**[Full agreement to be executed with NIBSS]**

---

### 2.d) Merchants/Billers

**Biller Integration Agreement (Template)**

**Parties:**
- FirstMidas Microfinance Bank Limited
- [Biller Name - e.g., IKEDC, Multichoice, MTN]

**Services:**
- Customer bill payment processing
- Real-time payment confirmation
- Customer account validation

**Commission Structure:**
- Biller pays FMFB: 0.5% - 2% of transaction value
- Payment terms: Weekly settlement
- Minimum commission: ₦50 per transaction

**Technical Integration:**
- API-based integration
- SSL/TLS encryption
- Authentication via API keys
- Real-time status confirmation

**Service Levels:**
- API uptime: 99% minimum
- Response time: <5 seconds
- Dispute resolution: 48 hours

**Term:** 2 years, auto-renewable

**[Individual agreements to be signed with each biller]**

---

### 2.e) Any Other Parties

**Cloud Services Agreement - Google Cloud Platform**
- **Service:** Infrastructure hosting
- **SLA:** 99.95% uptime
- **Security:** ISO 27001, SOC 2 compliant
- **Data Residency:** Data stored in Google Cloud regions, encrypted
- **Term:** Pay-as-you-go, monthly billing

**SMS Provider Agreement**
- **Service:** OTP and transaction alerts
- **Cost:** ₦3 per SMS
- **Delivery:** 95% within 10 seconds
- **Term:** 1 year, auto-renewable

**Credit Bureau Agreement - CRC Credit Bureau**
- **Service:** Credit history reports
- **Cost:** ₦200 per report
- **Response Time:** Real-time API
- **Term:** Annual subscription

---

## SECTION 3: FOREIGN EXCHANGE FUNDING SOURCES

**Applicability:** International transfer feature

**Current Status:** Not immediately applicable; domestic focus in Phase 1

**Future Implementation (Phase 2):**

**Source 1: Correspondent Banking**
- Partner with international correspondent bank
- Pre-funded nostro accounts (USD, EUR, GBP)
- SWIFT network for cross-border transfers

**Source 2: Money Transfer Operators (MTOs)**
- Partnership with licensed MTOs (e.g., MoneyGram, Western Union)
- White-label international transfer service
- MTO handles FX and international settlement

**Source 3: CBN Authorized Dealers**
- Purchase FX from authorized dealer banks
- Compliance with CBN FX regulations
- Documentation: Form A for transfers >$10,000

**Regulatory Compliance:**
- CBN FX regulations compliance
- Anti-money laundering controls
- Transfer limits: As per CBN guidelines
- Documentation requirements: Form A, invoice, etc.

**[Detailed implementation plan to be submitted before international transfer launch]**

---

## SECTION 4: OTHER RELEVANT INFORMATION

### Phased Rollout Strategy

**Phase 1 (Months 1-3): Core Banking**
- Account opening and KYC
- Internal transfers
- External transfers (NIBSS)
- Basic savings accounts
- Bill payments

**Phase 2 (Months 4-6): Lending**
- Personal loans
- Quick loans (AI-powered)
- Credit scoring integration

**Phase 3 (Months 7-9): Advanced Products**
- Business loans
- Investment products
- High-yield savings
- Goal-based savings

**Phase 4 (Months 10-12): Scale & Optimize**
- International transfers
- Merchant payments (POS)
- API for third-party integrations
- White-label for other MFBs

### Corporate Social Responsibility

**Financial Inclusion Initiatives:**
- Free accounts for low-income earners (Tier 1)
- Financial literacy programs via AI assistant
- Partnership with NGOs for vulnerable populations
- USSD banking for feature phone users (future)

### Innovation and Competitive Advantage

**AI-Powered Banking:**
- Conversational AI assistant
- Credit scoring without traditional collateral
- Fraud detection in <500ms
- Personalized financial advice

**Customer Experience:**
- 100% digital onboarding (<5 minutes)
- Real-time transfers 24/7/365
- Multi-channel access (mobile, web, USSD planned)
- World-class UI/UX design

---

## APPENDICES

**Appendix A:** Privacy Policy (separate document)
**Appendix B:** Data Processing Agreements with third parties (separate documents)
**Appendix C:** Risk Assessment Report (separate document)
**Appendix D:** Board Resolution (to be provided by FMFB)
**Appendix E:** NITDA Registration Certificate (pending)
**Appendix F:** Technical Architecture Diagram (separate document)
**Appendix G:** Disaster Recovery Plan (separate document)
**Appendix H:** Business Continuity Plan (separate document)
**Appendix I:** Penetration Test Report (separate document, confidential)
**Appendix J:** Financial Projections (5-year) (separate document)

---

## DECLARATIONS

**We, FirstMidas Microfinance Bank Limited, hereby declare that:**

1. All information provided in this application is true, accurate, and complete to the best of our knowledge.

2. We understand and accept full responsibility for regulatory compliance with all CBN guidelines and Nigerian laws.

3. We commit to operating the OrokiiPay Digital Banking Platform in accordance with the highest standards of banking practice and customer protection.

4. We will implement all security measures, risk mitigants, and operational controls as described in this application.

5. We will maintain adequate capital reserves to support the operations and absorb potential risks associated with digital banking services.

6. We will promptly report any material incidents, breaches, or compliance issues to the Central Bank of Nigeria.

7. We commit to the phased rollout approach and will not proceed to subsequent phases without CBN approval.

8. We agree to submit to CBN supervision, audits, and examinations as required.

---

**FOR: FIRSTMIDAS MICROFINANCE BANK LIMITED**

**Managing Director/CEO:**

Signature: _______________________
Name: _______________________
Date: _______________________

**Board Chairman:**

Signature: _______________________
Name: _______________________
Date: _______________________

**Company Seal:**

[Affix company seal]

---

**SUBMISSION DATE:** October 8, 2025

**SUBMISSION TO:**
Director, Other Financial Institutions Supervision Department
Central Bank of Nigeria
Plot 33, Abubakar Tafawa Balewa Way
Central Business District
Abuja, Nigeria

**FOR CBN USE ONLY**

Application Received: _______________
Reference Number: _______________
Assigned Officer: _______________
Status: _______________

---

**END OF DOCUMENT**

**Total Pages:** 85
**Document Control:** Version 1.0 - October 8, 2025
**Classification:** Confidential - Regulatory Submission