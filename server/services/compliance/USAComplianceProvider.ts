/**
 * USA Compliance Provider
 *
 * Implements US regulatory compliance requirements:
 * - Bank Secrecy Act (BSA)
 * - USA PATRIOT Act
 * - FinCEN regulations
 * - OFAC sanctions screening
 * - OCC/FDIC/SEC oversight
 *
 * Key Regulations:
 * - BSA: Anti-money laundering program requirements
 * - CTR: Currency Transaction Reports for cash transactions >$10,000
 * - SAR: Suspicious Activity Reports for suspicious transactions >$5,000
 * - CIP: Customer Identification Program under PATRIOT Act
 * - OFAC: Office of Foreign Assets Control sanctions screening
 */

import {
  BaseComplianceProvider,
  KYCRequest,
  KYCResult,
  AMLCheckRequest,
  AMLResult,
  SanctionsCheckRequest,
  SanctionsCheckResult,
  TransactionMonitoringRequest,
  TransactionMonitoringResult,
  ComplianceReport,
  ComplianceReportRequest,
  RegulatoryLimits,
  ComplianceCapabilities,
  User,
  Transaction,
} from './IComplianceProvider';

/**
 * Mock OFAC SDN (Specially Designated Nationals) list
 * In production, this would be loaded from official OFAC data
 */
const MOCK_OFAC_SDN_LIST = [
  { name: 'Al-Qaeda', type: 'entity', program: 'SDGT', matchThreshold: 85 },
  { name: 'Taliban', type: 'entity', program: 'SDGT', matchThreshold: 85 },
  { name: 'Iranian Revolutionary Guard', type: 'entity', program: 'IRAN', matchThreshold: 80 },
  { name: 'North Korea', type: 'entity', program: 'DPRK', matchThreshold: 90 },
  { name: 'Crimea', type: 'entity', program: 'UKRAINE-EO13685', matchThreshold: 85 },
];

/**
 * High-risk countries for AML purposes (FATF high-risk jurisdictions)
 */
const HIGH_RISK_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'MM', // Myanmar
  'SY', // Syria
  'YE', // Yemen
  'AF', // Afghanistan
  'IQ', // Iraq
];

export class USAComplianceProvider extends BaseComplianceProvider {
  readonly name = 'USA Compliance Provider';
  readonly region = 'USA';
  readonly country = 'US';
  readonly capabilities: ComplianceCapabilities = {
    supportsKYC: true,
    supportsAML: true,
    supportsSanctionsScreening: true,
    supportsTransactionMonitoring: true,
    supportsPEPScreening: true,
    supportsAdverseMediaScreening: true,
    supportsBiometricVerification: true,
    supportsAutomatedReporting: true,
    supportedReportTypes: ['SAR', 'CTR', 'FBAR'],
    regulatoryBodies: ['FinCEN', 'OFAC', 'OCC', 'FDIC', 'SEC'],
    certifications: ['PCI-DSS', 'SOC2', 'ISO27001', 'GLBA'],
  };

  private transactionHistory: Map<string, Transaction[]> = new Map();
  private userRiskScores: Map<string, number> = new Map();

  /**
   * Initialize USA compliance provider
   * Configuration should include API keys for:
   * - ComplyAdvantage (sanctions screening)
   * - Dow Jones (PEP screening)
   * - LexisNexis (identity verification)
   * - Experian/Equifax/TransUnion (credit bureau checks)
   */
  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);
    console.log('[USA Compliance] Initialized with FinCEN, OFAC, and OCC integration');
  }

  /**
   * Perform KYC verification according to US CIP requirements
   * Under the PATRIOT Act Section 326, financial institutions must:
   * 1. Verify customer identity using documents
   * 2. Check government lists (OFAC SDN, FBI Most Wanted)
   * 3. Form reasonable belief that identity is accurate
   */
  async performKYC(request: KYCRequest): Promise<KYCResult> {
    this.ensureInitialized();

    const { user, level, documents, checkBiometrics, checkAddress } = request;
    const checks = {
      identityVerified: false,
      addressVerified: false,
      documentVerified: false,
      biometricVerified: false,
      pepCheck: false,
      sanctionsCheck: false,
      adverseMediaCheck: false,
    };

    let score = 0;
    const issues: string[] = [];

    // Basic Level: SSN verification and ID document
    if (level === 'basic') {
      // Check for SSN
      const ssnDoc = documents.find(d => d.type === 'ssn');
      if (ssnDoc) {
        // Mock SSN verification against Social Security Administration
        checks.identityVerified = this.verifySSN(ssnDoc.number);
        score += checks.identityVerified ? 30 : 0;
        if (!checks.identityVerified) {
          issues.push('SSN verification failed');
        }
      } else {
        issues.push('SSN required for US KYC');
      }

      // Check primary ID document
      const primaryId = documents.find(d =>
        d.type === 'drivers_license' || d.type === 'passport'
      );
      if (primaryId) {
        checks.documentVerified = this.verifyDocument(primaryId);
        score += checks.documentVerified ? 20 : 0;
      } else {
        issues.push('Valid government-issued ID required');
      }
    }

    // Intermediate Level: Credit bureau check + address verification
    if (level === 'intermediate' || level === 'advanced') {
      // Mock credit bureau check (Experian/Equifax/TransUnion)
      const creditCheck = await this.performCreditBureauCheck(user);
      checks.identityVerified = creditCheck.verified;
      checks.addressVerified = creditCheck.addressVerified;
      score += creditCheck.verified ? 30 : 0;
      score += creditCheck.addressVerified ? 20 : 0;

      if (!creditCheck.verified) {
        issues.push('Credit bureau verification failed');
      }
    }

    // Advanced Level: Enhanced due diligence
    let sanctionsResult: any = null;
    if (level === 'advanced') {
      // PEP screening (required for high-value accounts)
      const pepResult = await this.screenPEP(user);
      checks.pepCheck = !pepResult.matched;
      score += checks.pepCheck ? 15 : -20;

      if (pepResult.matched) {
        issues.push('PEP match requires enhanced due diligence');
      }

      // OFAC sanctions screening (mandatory for all accounts)
      sanctionsResult = await this.checkSanctions({
        name: `${user.firstName} ${user.lastName}`,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        address: user.address?.street,
      });
      checks.sanctionsCheck = !sanctionsResult.matched;
      score += checks.sanctionsCheck ? 15 : -50;

      if (sanctionsResult.matched) {
        issues.push('OFAC sanctions match - account opening prohibited');
      }

      // Adverse media screening
      checks.adverseMediaCheck = await this.screenAdverseMedia(user);
      score += checks.adverseMediaCheck ? 10 : -10;

      // Biometric verification if requested
      if (checkBiometrics) {
        checks.biometricVerified = await this.verifyBiometrics(user);
        score += checks.biometricVerified ? 10 : 0;
      }
    }

    // Calculate risk level based on checks
    const riskLevel = this.calculateRiskLevel(score, checks, user);

    // Determine if verified
    const verified = score >= 70 && !sanctionsResult?.matched && issues.length === 0;

    // Set next review date (annually for standard accounts, quarterly for high-risk)
    const nextReviewDate = new Date();
    nextReviewDate.setMonth(nextReviewDate.getMonth() + (riskLevel === 'high' ? 3 : 12));

    return {
      success: verified,
      level,
      verified,
      verificationDate: verified ? new Date() : undefined,
      score: Math.max(0, Math.min(100, score)),
      checks,
      riskLevel,
      issues: issues.length > 0 ? issues : undefined,
      nextReviewDate,
    };
  }

  /**
   * Check transaction for AML compliance under Bank Secrecy Act
   * Monitors for:
   * - Structuring (breaking up transactions to avoid CTR filing)
   * - Rapid movement of funds
   * - Transactions with high-risk countries
   * - Unusual patterns
   */
  async checkAML(request: AMLCheckRequest): Promise<AMLResult> {
    this.ensureInitialized();

    const { transaction, user, checkType } = request;
    const flags: AMLResult['flags'] = {};
    const alerts: AMLResult['alerts'] = [];
    let riskScore = 0;

    // Get user's transaction history
    const history = this.transactionHistory.get(user.id) || [];
    history.push(transaction);
    this.transactionHistory.set(user.id, history);

    // Check for structuring (multiple transactions just below $10,000 CTR threshold)
    const recentTransactions = this.getRecentTransactions(history, 7); // Last 7 days
    const structuringDetected = this.detectStructuring(recentTransactions, 10000);
    if (structuringDetected) {
      flags.structuring = true;
      riskScore += 40;
      alerts.push({
        severity: 'critical',
        type: 'STRUCTURING',
        description: 'Multiple transactions detected just below CTR threshold ($10,000)',
        requiresAction: true,
      });
    }

    // Check for rapid movement of funds
    const rapidMovement = this.detectRapidMovement(recentTransactions);
    if (rapidMovement) {
      flags.rapidMovement = true;
      riskScore += 25;
      alerts.push({
        severity: 'high',
        type: 'RAPID_MOVEMENT',
        description: 'Funds moving through account rapidly (potential layering)',
        requiresAction: true,
      });
    }

    // Check for unusual patterns based on user's historical behavior
    const userBaseline = this.calculateUserBaseline(history);
    const isUnusual = this.isTransactionUnusual(transaction, userBaseline);
    if (isUnusual) {
      flags.unusualPattern = true;
      riskScore += 15;
      alerts.push({
        severity: 'medium',
        type: 'UNUSUAL_PATTERN',
        description: 'Transaction deviates significantly from user baseline',
        requiresAction: false,
      });
    }

    // Check if transaction involves high-risk country
    if (transaction.recipientCountry && HIGH_RISK_COUNTRIES.includes(transaction.recipientCountry)) {
      flags.highRiskCountry = true;
      riskScore += 30;
      alerts.push({
        severity: 'high',
        type: 'HIGH_RISK_JURISDICTION',
        description: `Transaction involves high-risk country: ${transaction.recipientCountry}`,
        requiresAction: true,
      });
    }

    // OFAC sanctions screening for recipient
    if (transaction.recipientName) {
      const sanctionsCheck = await this.checkSanctions({
        name: transaction.recipientName,
        nationality: transaction.recipientCountry,
      });

      if (sanctionsCheck.matched) {
        flags.sanctionsMatch = true;
        riskScore += 50;
        alerts.push({
          severity: 'critical',
          type: 'SANCTIONS_MATCH',
          description: 'Recipient matches OFAC sanctions list',
          requiresAction: true,
        });
      }
    }

    // Check if PEP is involved
    if (user.politicallyExposed) {
      flags.pepInvolved = true;
      riskScore += 20;
      alerts.push({
        severity: 'medium',
        type: 'PEP_TRANSACTION',
        description: 'Transaction involves Politically Exposed Person',
        requiresAction: false,
      });
    }

    // Check for cash-intensive business patterns
    const cashIntensive = this.isCashIntensive(recentTransactions);
    if (cashIntensive) {
      flags.cashIntensive = true;
      riskScore += 15;
      alerts.push({
        severity: 'medium',
        type: 'CASH_INTENSIVE',
        description: 'User exhibits cash-intensive business patterns',
        requiresAction: false,
      });
    }

    // Check narration for suspicious keywords
    if (transaction.narration) {
      const suspiciousNarration = this.checkSuspiciousNarration(transaction.narration);
      if (suspiciousNarration) {
        flags.suspiciousNarration = true;
        riskScore += 10;
        alerts.push({
          severity: 'low',
          type: 'SUSPICIOUS_NARRATION',
          description: 'Transaction description contains suspicious keywords',
          requiresAction: false,
        });
      }
    }

    // Determine risk level and recommendation
    const riskLevel = this.getRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskScore, flags);

    // Determine if reporting is required
    let requiresReporting = false;
    let reportType: 'SAR' | 'CTR' | 'STR' | undefined;

    // CTR required for cash transactions >$10,000
    if (transaction.amount >= 10000 && transaction.currency === 'USD') {
      requiresReporting = true;
      reportType = 'CTR';
    }

    // SAR required for suspicious activity >$5,000
    if (riskScore >= 40 && transaction.amount >= 5000) {
      requiresReporting = true;
      reportType = 'SAR';
    }

    // Store risk score for future reference
    this.userRiskScores.set(user.id, riskScore);

    return {
      passed: riskScore < 50,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      flags,
      alerts,
      recommendation,
      requiresReporting,
      reportType,
    };
  }

  /**
   * Screen against OFAC Specially Designated Nationals (SDN) list
   * Mandatory for all US financial institutions
   */
  async checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult> {
    this.ensureInitialized();

    const matches: SanctionsCheckResult['matches'] = [];
    const { name, dateOfBirth, nationality, identificationNumber } = request;

    // Check against OFAC SDN list
    for (const entry of MOCK_OFAC_SDN_LIST) {
      const matchScore = this.calculateNameMatchScore(name, entry.name);

      if (matchScore >= entry.matchThreshold) {
        matches.push({
          listName: 'OFAC SDN',
          matchScore,
          entityName: entry.name,
          entityType: entry.type as any,
          program: entry.program,
          details: `Matched against OFAC ${entry.program} program`,
        });
      }
    }

    // Check nationality against sanctioned countries
    if (nationality && HIGH_RISK_COUNTRIES.includes(nationality)) {
      matches.push({
        listName: 'OFAC Country Sanctions',
        matchScore: 100,
        entityName: nationality,
        entityType: 'entity',
        program: 'COUNTRY_SANCTIONS',
        details: 'Nationality matches sanctioned country',
      });
    }

    // Check against sectoral sanctions (e.g., Russian financial institutions)
    if (name.toLowerCase().includes('russia') || name.toLowerCase().includes('crimea')) {
      matches.push({
        listName: 'OFAC Sectoral Sanctions',
        matchScore: 85,
        entityName: name,
        entityType: 'entity',
        program: 'UKRAINE-EO13662',
        details: 'Potential match with sectoral sanctions',
      });
    }

    const matched = matches.length > 0;
    const highestScore = matched ? Math.max(...matches.map(m => m.matchScore)) : 0;
    const riskLevel = this.getSanctionsRiskLevel(highestScore, matches);

    return {
      matched,
      matches,
      riskLevel,
      requiresReview: matched || highestScore >= 70,
    };
  }

  /**
   * Monitor user transactions for suspicious patterns
   * Required under Bank Secrecy Act
   */
  async monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult> {
    this.ensureInitialized();

    const { userId, lookbackPeriod, checkPatterns, checkVelocity, checkThresholds } = request;
    const alerts: TransactionMonitoringResult['alerts'] = [];

    // Get user's transaction history
    const allTransactions = this.transactionHistory.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackPeriod);

    const transactions = allTransactions.filter(t => t.timestamp >= cutoffDate);

    // Calculate statistics
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
    const largestTransaction = totalTransactions > 0 ? Math.max(...transactions.map(t => t.amount)) : 0;
    const uniqueCounterparties = new Set(transactions.map(t => t.toAccount || t.recipientName)).size;
    const highRiskTransactions = transactions.filter(t =>
      t.amount >= 10000 || (t.recipientCountry && HIGH_RISK_COUNTRIES.includes(t.recipientCountry))
    ).length;

    // Velocity checks
    if (checkVelocity) {
      const last24Hours = transactions.filter(t =>
        t.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (last24Hours.length > 10) {
        alerts.push({
          type: 'velocity',
          severity: 'high',
          description: `High transaction velocity: ${last24Hours.length} transactions in 24 hours`,
          transactions: last24Hours.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Threshold checks
    if (checkThresholds) {
      const largeTransactions = transactions.filter(t => t.amount >= 10000);
      if (largeTransactions.length > 0) {
        alerts.push({
          type: 'threshold',
          severity: 'medium',
          description: `${largeTransactions.length} transaction(s) exceed CTR threshold ($10,000)`,
          transactions: largeTransactions.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Pattern analysis
    if (checkPatterns) {
      // Check for round-robin patterns (rapid transfers through multiple accounts)
      const roundRobin = this.detectRoundRobinPattern(transactions);
      if (roundRobin.detected) {
        alerts.push({
          type: 'pattern',
          severity: 'high',
          description: 'Round-robin transaction pattern detected (potential money laundering)',
          transactions: roundRobin.transactionIds,
          detectedAt: new Date(),
        });
      }

      // Check for geographic anomalies
      const geographicRisk = this.detectGeographicAnomalies(transactions);
      if (geographicRisk.detected) {
        alerts.push({
          type: 'geographic',
          severity: 'medium',
          description: geographicRisk.description,
          transactions: geographicRisk.transactionIds,
          detectedAt: new Date(),
        });
      }
    }

    // Determine recommendation
    let recommendation: TransactionMonitoringResult['recommendation'];
    const criticalAlerts = alerts.filter(a => a.severity === 'high').length;

    if (criticalAlerts >= 2 || highRiskTransactions > 5) {
      recommendation = 'file_report';
    } else if (criticalAlerts === 1 || alerts.length >= 3) {
      recommendation = 'enhanced_monitoring';
    } else if (alerts.length > 0) {
      recommendation = 'enhanced_monitoring';
    } else {
      recommendation = 'continue_monitoring';
    }

    return {
      alerts,
      statistics: {
        totalTransactions,
        totalVolume,
        averageTransaction,
        largestTransaction,
        uniqueCounterparties,
        highRiskTransactions,
      },
      recommendation,
    };
  }

  /**
   * Generate compliance report (SAR, CTR, or FBAR)
   */
  async generateReport(request: ComplianceReportRequest): Promise<ComplianceReport> {
    this.ensureInitialized();

    const { reportType, userId, transactionId, startDate, endDate, reason, suspiciousActivity, metadata } = request;

    const reportId = this.generateReportId(reportType);
    const filingDate = new Date();

    let data: any = {
      reportType,
      generatedAt: filingDate.toISOString(),
      reportingInstitution: this.config.institutionName || 'Banking Institution',
      filingMethod: 'Electronic',
    };

    // SAR: Suspicious Activity Report (FinCEN Form 111)
    if (reportType === 'SAR') {
      data = {
        ...data,
        formNumber: 'FinCEN Form 111',
        userId,
        transactionId,
        suspiciousActivity: suspiciousActivity || 'Unusual transaction pattern detected',
        reason: reason || 'AML monitoring alert',
        amountInvolved: metadata?.amount || 0,
        dateOfSuspiciousActivity: startDate.toISOString(),
        lawEnforcementContact: false,
        ...metadata,
      };
    }

    // CTR: Currency Transaction Report
    if (reportType === 'CTR') {
      data = {
        ...data,
        formNumber: 'FinCEN Form 112',
        userId,
        transactionId,
        transactionAmount: metadata?.amount || 0,
        transactionDate: startDate.toISOString(),
        transactionType: metadata?.transactionType || 'Cash',
        multipleTransactions: metadata?.multipleTransactions || false,
        ...metadata,
      };
    }

    // FBAR: Foreign Bank Account Report
    if (reportType === 'FBAR') {
      data = {
        ...data,
        formNumber: 'FinCEN Form 114',
        userId,
        foreignAccounts: metadata?.foreignAccounts || [],
        maximumAccountValue: metadata?.maximumAccountValue || 0,
        reportingPeriod: { startDate, endDate },
        ...metadata,
      };
    }

    return {
      reportId,
      reportType,
      filingDate,
      reportingPeriod: { startDate, endDate },
      status: 'draft',
      data,
      submittedTo: this.getSubmissionTarget(reportType),
    };
  }

  /**
   * Submit compliance report to FinCEN
   * In production, this would use FinCEN's BSA E-Filing System
   */
  async submitReport(report: ComplianceReport): Promise<{ success: boolean; acknowledgmentNumber?: string }> {
    this.ensureInitialized();

    // Mock submission to FinCEN BSA E-Filing System
    console.log(`[USA Compliance] Submitting ${report.reportType} to FinCEN...`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock BSA E-Filing acknowledgment number
    const acknowledgmentNumber = `BSA-${report.reportType}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Update report status
    report.status = 'submitted';
    report.acknowledgmentNumber = acknowledgmentNumber;

    console.log(`[USA Compliance] ${report.reportType} submitted successfully. Acknowledgment: ${acknowledgmentNumber}`);

    return {
      success: true,
      acknowledgmentNumber,
    };
  }

  /**
   * Get USA regulatory limits
   */
  async getRegulatoryLimits(currency: string): Promise<RegulatoryLimits> {
    this.ensureInitialized();

    // Convert to USD if different currency
    const conversionRate = currency === 'USD' ? 1 : await this.getConversionRate(currency, 'USD');

    return {
      cashTransactionReportingThreshold: 10000 * conversionRate, // CTR threshold
      suspiciousActivityThreshold: 5000 * conversionRate, // SAR threshold
      enhancedDueDiligenceThreshold: 50000 * conversionRate, // EDD required
      dailyTransactionLimit: 100000 * conversionRate,
      monthlyTransactionLimit: 500000 * conversionRate,
      singleTransactionLimit: 250000 * conversionRate,
      pepTransactionLimit: 25000 * conversionRate, // Lower limit for PEPs
      internationalTransferLimit: 100000 * conversionRate,
    };
  }

  // Helper methods

  private verifySSN(ssn: string): boolean {
    // Mock SSN verification - would call Social Security Administration in production
    // Basic format check: XXX-XX-XXXX
    const ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnPattern.test(ssn) && !ssn.startsWith('000') && !ssn.startsWith('666');
  }

  private verifyDocument(doc: any): boolean {
    // Mock document verification
    if (!doc.expiryDate) return true;
    return new Date(doc.expiryDate) > new Date();
  }

  private async performCreditBureauCheck(user: User): Promise<{ verified: boolean; addressVerified: boolean }> {
    // Mock credit bureau check (Experian/Equifax/TransUnion)
    // In production, this would call credit bureau APIs
    const hasAddress = !!user.address;
    const hasDOB = !!user.dateOfBirth;

    return {
      verified: hasAddress && hasDOB,
      addressVerified: hasAddress,
    };
  }

  private async screenPEP(user: User): Promise<{ matched: boolean }> {
    // Mock PEP screening using Dow Jones or World-Check
    // Check if user is marked as politically exposed
    return {
      matched: user.politicallyExposed || false,
    };
  }

  private async screenAdverseMedia(user: User): Promise<boolean> {
    // Mock adverse media screening
    // In production, would search news databases for negative associations
    return true; // No adverse media found
  }

  private async verifyBiometrics(user: User): Promise<boolean> {
    // Mock biometric verification
    // In production, would use face recognition or fingerprint matching
    return true;
  }

  private calculateRiskLevel(score: number, checks: any, user: User): 'low' | 'medium' | 'high' {
    if (!checks.sanctionsCheck || user.politicallyExposed) return 'high';
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  private getRecentTransactions(history: Transaction[], days: number): Transaction[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(t => t.timestamp >= cutoff);
  }

  private detectStructuring(transactions: Transaction[], threshold: number): boolean {
    // Detect if multiple transactions are just below threshold (structuring/smurfing)
    const nearThreshold = transactions.filter(t =>
      t.amount >= threshold * 0.8 && t.amount < threshold
    );
    return nearThreshold.length >= 3;
  }

  private detectRapidMovement(transactions: Transaction[]): boolean {
    // Detect if funds are moving in and out quickly (layering)
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal' || t.type === 'transfer');

    // If many deposits followed quickly by withdrawals
    return deposits.length >= 3 && withdrawals.length >= 3;
  }

  private calculateUserBaseline(history: Transaction[]): { averageAmount: number; typicalTypes: Set<string> } {
    if (history.length === 0) return { averageAmount: 0, typicalTypes: new Set() };

    const total = history.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = total / history.length;
    const typicalTypes = new Set(history.map(t => t.type));

    return { averageAmount, typicalTypes };
  }

  private isTransactionUnusual(transaction: Transaction, baseline: { averageAmount: number }): boolean {
    // Transaction is unusual if it's 5x the average
    return baseline.averageAmount > 0 && transaction.amount > baseline.averageAmount * 5;
  }

  private isCashIntensive(transactions: Transaction[]): boolean {
    const cashTransactions = transactions.filter(t =>
      t.type === 'deposit' && t.amount >= 1000
    );
    return cashTransactions.length >= 5;
  }

  private checkSuspiciousNarration(narration: string): boolean {
    const suspiciousKeywords = [
      'cash', 'loan', 'gift', 'donation', 'charity', 'invoice',
      'drugs', 'weapons', 'offshore', 'cryptocurrency', 'bitcoin'
    ];
    const lower = narration.toLowerCase();
    return suspiciousKeywords.some(keyword => lower.includes(keyword));
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private getRecommendation(score: number, flags: AMLResult['flags']): AMLResult['recommendation'] {
    if (flags.sanctionsMatch || flags.structuring) return 'reject';
    if (score >= 60) return 'escalate';
    if (score >= 40) return 'review';
    return 'approve';
  }

  private calculateNameMatchScore(name1: string, name2: string): number {
    // Simple Levenshtein distance-based matching
    // In production, would use sophisticated fuzzy matching algorithms
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    if (n1.includes(n2) || n2.includes(n1)) return 90;
    if (n1 === n2) return 100;

    // Basic word matching
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    const matches = words1.filter(w => words2.includes(w)).length;
    const maxWords = Math.max(words1.length, words2.length);

    return (matches / maxWords) * 100;
  }

  private getSanctionsRiskLevel(score: number, matches: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 95) return 'critical';
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  private detectRoundRobinPattern(transactions: Transaction[]): { detected: boolean; transactionIds: string[] } {
    // Detect rapid transfers through multiple accounts
    const transfers = transactions.filter(t => t.type === 'transfer');
    if (transfers.length < 3) return { detected: false, transactionIds: [] };

    // Check if transfers happen in quick succession
    const timeDiffs = [];
    for (let i = 1; i < transfers.length; i++) {
      const diff = transfers[i].timestamp.getTime() - transfers[i-1].timestamp.getTime();
      timeDiffs.push(diff);
    }

    const avgDiff = timeDiffs.reduce((sum, d) => sum + d, 0) / timeDiffs.length;
    const oneHour = 60 * 60 * 1000;

    if (avgDiff < oneHour) {
      return { detected: true, transactionIds: transfers.map(t => t.id) };
    }

    return { detected: false, transactionIds: [] };
  }

  private detectGeographicAnomalies(transactions: Transaction[]): { detected: boolean; description: string; transactionIds: string[] } {
    const highRiskTxs = transactions.filter(t =>
      t.recipientCountry && HIGH_RISK_COUNTRIES.includes(t.recipientCountry)
    );

    if (highRiskTxs.length > 0) {
      return {
        detected: true,
        description: `${highRiskTxs.length} transaction(s) to high-risk jurisdictions`,
        transactionIds: highRiskTxs.map(t => t.id),
      };
    }

    return { detected: false, description: '', transactionIds: [] };
  }

  private generateReportId(reportType: string): string {
    return `${reportType}-US-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private getSubmissionTarget(reportType: string): string {
    switch (reportType) {
      case 'SAR':
      case 'CTR':
        return 'FinCEN BSA E-Filing System';
      case 'FBAR':
        return 'FinCEN FBAR System';
      default:
        return 'FinCEN';
    }
  }

  private async getConversionRate(from: string, to: string): Promise<number> {
    // Mock currency conversion - would use real forex API in production
    const rates: Record<string, number> = {
      'EUR': 0.85,
      'GBP': 0.73,
      'CAD': 1.25,
      'NGN': 411,
    };
    return rates[from] || 1;
  }
}
