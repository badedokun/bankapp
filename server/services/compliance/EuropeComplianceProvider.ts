/**
 * Europe Compliance Provider
 *
 * Implements EU regulatory compliance requirements:
 * - AML5 Directive (5th Anti-Money Laundering Directive)
 * - PSD2 (Payment Services Directive 2) with SCA
 * - GDPR (General Data Protection Regulation)
 * - EU Sanctions Framework
 * - National FIU reporting requirements
 *
 * Key Regulations:
 * - AML5: Enhanced customer due diligence, beneficial ownership registers
 * - PSD2: Strong Customer Authentication for electronic payments
 * - GDPR: Data protection and privacy requirements
 * - EU Sanctions: Consolidated list of persons, groups, and entities
 * - 4AMLD: Risk-based approach to AML/CTF
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
 * Mock EU Consolidated Sanctions List
 * In production, this would be loaded from official EU sanctions database
 */
const MOCK_EU_SANCTIONS_LIST = [
  { name: 'Belarus', type: 'entity', program: 'BELARUS', matchThreshold: 90 },
  { name: 'Russia', type: 'entity', program: 'RUSSIA', matchThreshold: 85 },
  { name: 'Syria', type: 'entity', program: 'SYRIA', matchThreshold: 90 },
  { name: 'North Korea', type: 'entity', program: 'DPRK', matchThreshold: 90 },
  { name: 'Iran', type: 'entity', program: 'IRAN', matchThreshold: 85 },
  { name: 'Taliban', type: 'entity', program: 'TERRORISM', matchThreshold: 85 },
];

/**
 * High-risk third countries (FATF and EU assessment)
 */
const HIGH_RISK_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'MM', // Myanmar
  'SY', // Syria
  'YE', // Yemen
  'AF', // Afghanistan
  'PK', // Pakistan
  'TR', // Turkey (enhanced due diligence)
];

/**
 * EU Member States (for cross-border monitoring)
 */
const EU_MEMBER_STATES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
];

export class EuropeComplianceProvider extends BaseComplianceProvider {
  readonly name = 'Europe Compliance Provider';
  readonly region = 'Europe';
  readonly country = 'EU';
  readonly capabilities: ComplianceCapabilities = {
    supportsKYC: true,
    supportsAML: true,
    supportsSanctionsScreening: true,
    supportsTransactionMonitoring: true,
    supportsPEPScreening: true,
    supportsAdverseMediaScreening: true,
    supportsBiometricVerification: true,
    supportsAutomatedReporting: true,
    supportedReportTypes: ['STR', 'EDD'],
    regulatoryBodies: ['EBA', 'ECB', 'National FIUs', 'FATF'],
    certifications: ['PCI-DSS', 'SOC2', 'ISO27001', 'GDPR'],
  };

  private transactionHistory: Map<string, Transaction[]> = new Map();
  private userRiskScores: Map<string, number> = new Map();
  private consentRecords: Map<string, { granted: boolean; timestamp: Date }> = new Map();

  /**
   * Initialize Europe compliance provider
   * Configuration should include:
   * - National FIU endpoint for STR filing
   * - eIDAS trust service provider
   * - EU sanctions list API
   * - PEP database access (e.g., World-Check, Refinitiv)
   */
  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);
    console.log('[EU Compliance] Initialized with EBA, ECB, and National FIU integration');
  }

  /**
   * Perform KYC verification according to AML5 Directive
   * Requirements:
   * 1. Customer identification and verification
   * 2. Beneficial ownership identification (UBO)
   * 3. Purpose and nature of business relationship
   * 4. Ongoing monitoring
   * 5. Enhanced due diligence for high-risk customers
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

    // GDPR compliance: Verify consent for data processing
    const consentGranted = await this.verifyGDPRConsent(user.id);
    if (!consentGranted) {
      issues.push('GDPR consent required for KYC data processing');
      return {
        success: false,
        level,
        verified: false,
        score: 0,
        checks,
        riskLevel: 'high',
        issues,
      };
    }

    // Basic Level: National ID verification (eIDAS compliant)
    if (level === 'basic') {
      // Check for national ID or passport
      const nationalId = documents.find(d =>
        d.type === 'national_id' || d.type === 'passport'
      );

      if (nationalId) {
        // Verify using eIDAS trust services
        checks.identityVerified = await this.verifyEIDAS(nationalId);
        checks.documentVerified = this.verifyDocument(nationalId);
        score += checks.identityVerified ? 35 : 0;
        score += checks.documentVerified ? 15 : 0;

        if (!checks.identityVerified) {
          issues.push('eIDAS identity verification failed');
        }
      } else {
        issues.push('Valid EU national ID or passport required');
      }

      // Address verification (utility bill or bank statement)
      if (user.address) {
        checks.addressVerified = true;
        score += 20;
      }
    }

    // Intermediate Level: Enhanced identity verification + PSD2 SCA
    if (level === 'intermediate' || level === 'advanced') {
      // Strong Customer Authentication (PSD2 requirement)
      const scaCompleted = await this.performSCA(user);
      if (scaCompleted) {
        score += 20;
      } else {
        issues.push('PSD2 Strong Customer Authentication required');
      }

      // Verify address through official records
      if (checkAddress && user.address) {
        checks.addressVerified = await this.verifyAddressOfficial(user.address);
        score += checks.addressVerified ? 15 : 0;
      }

      // Biometric verification (eIDAS Level of Assurance: Substantial)
      if (checkBiometrics) {
        checks.biometricVerified = await this.verifyBiometrics(user);
        score += checks.biometricVerified ? 10 : 0;
      }
    }

    // Advanced Level: Enhanced Due Diligence (AML5 requirements)
    let sanctionsResult: any = null;
    if (level === 'advanced') {
      // PEP screening (mandatory under AML5)
      const pepResult = await this.screenPEP(user);
      checks.pepCheck = !pepResult.matched;
      score += checks.pepCheck ? 15 : -25;

      if (pepResult.matched) {
        issues.push('PEP identified - Enhanced Due Diligence required');
      }

      // EU sanctions screening
      sanctionsResult = await this.checkSanctions({
        name: `${user.firstName} ${user.lastName}`,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        address: user.address?.street,
      });
      checks.sanctionsCheck = !sanctionsResult.matched;
      score += checks.sanctionsCheck ? 15 : -50;

      if (sanctionsResult.matched) {
        issues.push('EU sanctions match - account opening prohibited');
      }

      // Adverse media screening (AML5 requirement)
      checks.adverseMediaCheck = await this.screenAdverseMedia(user);
      score += checks.adverseMediaCheck ? 10 : -15;

      if (!checks.adverseMediaCheck) {
        issues.push('Adverse media findings require review');
      }

      // Beneficial ownership verification (AML5)
      if (user.occupation === 'business_owner') {
        const uboVerified = await this.verifyBeneficialOwnership(user);
        if (!uboVerified) {
          issues.push('Beneficial ownership verification required');
          score -= 10;
        }
      }

      // Source of funds verification (risk-based approach)
      if (!user.sourceOfFunds) {
        issues.push('Source of funds declaration required for EDD');
        score -= 5;
      }
    }

    // Calculate risk level based on AML5 risk-based approach
    const riskLevel = this.calculateRiskLevel(score, checks, user);

    // Determine if verified
    const verified = score >= 70 && !sanctionsResult?.matched && issues.length === 0;

    // Set next review date (AML5 requirement for ongoing monitoring)
    const nextReviewDate = new Date();
    if (riskLevel === 'high') {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); // High-risk: 6 months
    } else if (riskLevel === 'medium') {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 12); // Medium-risk: 12 months
    } else {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 24); // Low-risk: 24 months
    }

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
   * Check transaction for AML compliance under AML5 Directive
   * Risk-based approach focusing on:
   * - Cross-border transactions (especially outside EU)
   * - High-value transactions (€15,000+)
   * - Transactions with high-risk countries
   * - Complex or unusual transaction patterns
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

    // AML5: Cross-border transaction monitoring
    const isCrossBorder = transaction.recipientCountry &&
                          !EU_MEMBER_STATES.includes(transaction.recipientCountry);

    if (isCrossBorder) {
      riskScore += 15;
      alerts.push({
        severity: 'medium',
        type: 'CROSS_BORDER',
        description: `Cross-border transaction outside EU: ${transaction.recipientCountry}`,
        requiresAction: false,
      });
    }

    // Check for transaction structuring (€10,000+ reporting threshold)
    const recentTransactions = this.getRecentTransactions(history, 7);
    const structuringDetected = this.detectStructuring(recentTransactions, 10000);
    if (structuringDetected) {
      flags.structuring = true;
      riskScore += 35;
      alerts.push({
        severity: 'critical',
        type: 'STRUCTURING',
        description: 'Multiple transactions detected just below €10,000 reporting threshold',
        requiresAction: true,
      });
    }

    // Check for rapid movement of funds (layering indicator)
    const rapidMovement = this.detectRapidMovement(recentTransactions);
    if (rapidMovement) {
      flags.rapidMovement = true;
      riskScore += 25;
      alerts.push({
        severity: 'high',
        type: 'RAPID_MOVEMENT',
        description: 'Rapid fund movement detected - potential layering activity',
        requiresAction: true,
      });
    }

    // Unusual pattern detection (deviation from baseline)
    const userBaseline = this.calculateUserBaseline(history);
    const isUnusual = this.isTransactionUnusual(transaction, userBaseline);
    if (isUnusual) {
      flags.unusualPattern = true;
      riskScore += 15;
      alerts.push({
        severity: 'medium',
        type: 'UNUSUAL_PATTERN',
        description: 'Transaction pattern deviates from customer baseline',
        requiresAction: false,
      });
    }

    // High-risk country check (FATF list + EU assessment)
    if (transaction.recipientCountry && HIGH_RISK_COUNTRIES.includes(transaction.recipientCountry)) {
      flags.highRiskCountry = true;
      riskScore += 30;
      alerts.push({
        severity: 'high',
        type: 'HIGH_RISK_JURISDICTION',
        description: `Transaction involves high-risk third country: ${transaction.recipientCountry}`,
        requiresAction: true,
      });
    }

    // EU sanctions screening
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
          description: 'Recipient matches EU consolidated sanctions list',
          requiresAction: true,
        });
      }
    }

    // PEP transaction monitoring (AML5 enhanced due diligence)
    if (user.politicallyExposed) {
      flags.pepInvolved = true;
      riskScore += 20;
      alerts.push({
        severity: 'medium',
        type: 'PEP_TRANSACTION',
        description: 'Transaction involves Politically Exposed Person - EDD required',
        requiresAction: true,
      });
    }

    // Cash-intensive business patterns
    const cashIntensive = this.isCashIntensive(recentTransactions);
    if (cashIntensive) {
      flags.cashIntensive = true;
      riskScore += 15;
      alerts.push({
        severity: 'medium',
        type: 'CASH_INTENSIVE',
        description: 'Cash-intensive transaction pattern detected',
        requiresAction: false,
      });
    }

    // Suspicious narration analysis
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

    // PSD2: Strong Customer Authentication check for electronic payments >€30
    if (transaction.amount > 30 && transaction.type === 'payment') {
      const scaRequired = await this.checkSCAREquirement(transaction);
      if (!scaRequired) {
        riskScore += 5;
        alerts.push({
          severity: 'low',
          type: 'PSD2_SCA',
          description: 'PSD2 Strong Customer Authentication may be required',
          requiresAction: false,
        });
      }
    }

    // Determine risk level and recommendation
    const riskLevel = this.getRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskScore, flags);

    // Determine if reporting is required (National FIU)
    let requiresReporting = false;
    let reportType: 'SAR' | 'CTR' | 'STR' | undefined;

    // STR (Suspicious Transaction Report) required for suspicious activity
    if (riskScore >= 40 && transaction.amount >= 15000) {
      requiresReporting = true;
      reportType = 'STR';
    }

    // Store risk score
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
   * Screen against EU Consolidated Sanctions List and UN sanctions
   * Mandatory under EU Common Foreign and Security Policy
   */
  async checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult> {
    this.ensureInitialized();

    const matches: SanctionsCheckResult['matches'] = [];
    const { name, dateOfBirth, nationality, identificationNumber } = request;

    // Check against EU Consolidated List
    for (const entry of MOCK_EU_SANCTIONS_LIST) {
      const matchScore = this.calculateNameMatchScore(name, entry.name);

      if (matchScore >= entry.matchThreshold) {
        matches.push({
          listName: 'EU Consolidated List',
          matchScore,
          entityName: entry.name,
          entityType: entry.type as any,
          program: entry.program,
          details: `Matched against EU ${entry.program} sanctions program`,
        });
      }
    }

    // Check nationality against sanctioned countries
    if (nationality && ['BY', 'RU', 'SY', 'KP', 'IR'].includes(nationality)) {
      matches.push({
        listName: 'EU Country Sanctions',
        matchScore: 100,
        entityName: nationality,
        entityType: 'entity',
        program: 'COUNTRY_SANCTIONS',
        details: 'Nationality matches EU sanctioned country',
      });
    }

    // Check against UN sanctions list
    const unSanctionsMatch = this.checkUNSanctions(name);
    if (unSanctionsMatch) {
      matches.push({
        listName: 'UN Sanctions List',
        matchScore: unSanctionsMatch.score,
        entityName: unSanctionsMatch.name,
        entityType: 'entity',
        program: 'UN_SANCTIONS',
        details: 'Matched against United Nations sanctions list',
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
   * Required under AML5 Directive for ongoing monitoring
   */
  async monitorTransactions(request: TransactionMonitoringRequest): Promise<TransactionMonitoringResult> {
    this.ensureInitialized();

    const { userId, lookbackPeriod, checkPatterns, checkVelocity, checkThresholds } = request;
    const alerts: TransactionMonitoringResult['alerts'] = [];

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

    // High-risk transactions (>€10,000 or high-risk countries)
    const highRiskTransactions = transactions.filter(t =>
      t.amount >= 10000 || (t.recipientCountry && HIGH_RISK_COUNTRIES.includes(t.recipientCountry))
    ).length;

    // Velocity checks (AML5 risk indicator)
    if (checkVelocity) {
      const last24Hours = transactions.filter(t =>
        t.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (last24Hours.length > 15) {
        alerts.push({
          type: 'velocity',
          severity: 'high',
          description: `High transaction velocity: ${last24Hours.length} transactions in 24 hours`,
          transactions: last24Hours.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Threshold monitoring (€10,000+ cross-border reporting)
    if (checkThresholds) {
      const crossBorderLarge = transactions.filter(t =>
        t.amount >= 10000 && t.recipientCountry && !EU_MEMBER_STATES.includes(t.recipientCountry)
      );

      if (crossBorderLarge.length > 0) {
        alerts.push({
          type: 'threshold',
          severity: 'medium',
          description: `${crossBorderLarge.length} cross-border transaction(s) exceed €10,000 threshold`,
          transactions: crossBorderLarge.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Pattern analysis
    if (checkPatterns) {
      // Round-robin pattern detection
      const roundRobin = this.detectRoundRobinPattern(transactions);
      if (roundRobin.detected) {
        alerts.push({
          type: 'pattern',
          severity: 'high',
          description: 'Round-robin pattern detected - potential layering scheme',
          transactions: roundRobin.transactionIds,
          detectedAt: new Date(),
        });
      }

      // Geographic risk analysis
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

      // Third-party payment patterns
      const thirdPartyPattern = this.detectThirdPartyPayments(transactions);
      if (thirdPartyPattern.detected) {
        alerts.push({
          type: 'counterparty',
          severity: 'medium',
          description: 'Frequent third-party payments detected',
          transactions: thirdPartyPattern.transactionIds,
          detectedAt: new Date(),
        });
      }
    }

    // Determine recommendation based on AML5 risk-based approach
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
   * Generate compliance report (STR or EDD)
   * Filed with National FIU
   */
  async generateReport(request: ComplianceReportRequest): Promise<ComplianceReport> {
    this.ensureInitialized();

    const { reportType, userId, transactionId, startDate, endDate, reason, suspiciousActivity, metadata } = request;

    const reportId = this.generateReportId(reportType);
    const filingDate = new Date();
    const nationalFIU = this.config.nationalFIU || 'National Financial Intelligence Unit';

    let data: any = {
      reportType,
      generatedAt: filingDate.toISOString(),
      reportingInstitution: this.config.institutionName || 'Financial Institution',
      filingMethod: 'Electronic',
      gdprCompliant: true, // GDPR compliance flag
    };

    // STR: Suspicious Transaction Report
    if (reportType === 'STR') {
      data = {
        ...data,
        userId,
        transactionId,
        suspiciousActivity: suspiciousActivity || 'Unusual transaction pattern detected',
        reason: reason || 'AML5 monitoring alert',
        amountInvolved: metadata?.amount || 0,
        currency: metadata?.currency || 'EUR',
        dateOfSuspiciousActivity: startDate.toISOString(),
        crossBorder: metadata?.crossBorder || false,
        highRiskCountry: metadata?.highRiskCountry || false,
        pepInvolved: metadata?.pepInvolved || false,
        ...metadata,
      };
    }

    // EDD: Enhanced Due Diligence Report
    if (reportType === 'EDD') {
      data = {
        ...data,
        userId,
        customerRiskRating: metadata?.riskRating || 'high',
        pepStatus: metadata?.pepStatus || false,
        sanctionsScreening: metadata?.sanctionsScreening || 'completed',
        sourceOfWealth: metadata?.sourceOfWealth || 'undetermined',
        beneficialOwners: metadata?.beneficialOwners || [],
        businessRelationshipPurpose: metadata?.businessPurpose || '',
        anticipatedActivity: metadata?.anticipatedActivity || '',
        enhancedMonitoringPeriod: metadata?.monitoringPeriod || '6 months',
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
      submittedTo: nationalFIU,
    };
  }

  /**
   * Submit compliance report to National FIU
   * Each EU member state has its own FIU
   */
  async submitReport(report: ComplianceReport): Promise<{ success: boolean; acknowledgmentNumber?: string }> {
    this.ensureInitialized();

    const nationalFIU = this.config.nationalFIU || 'National FIU';
    console.log(`[EU Compliance] Submitting ${report.reportType} to ${nationalFIU}...`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate acknowledgment number
    const acknowledgmentNumber = `EU-${report.reportType}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    report.status = 'submitted';
    report.acknowledgmentNumber = acknowledgmentNumber;

    console.log(`[EU Compliance] ${report.reportType} submitted successfully. Acknowledgment: ${acknowledgmentNumber}`);

    return {
      success: true,
      acknowledgmentNumber,
    };
  }

  /**
   * Get EU regulatory limits
   */
  async getRegulatoryLimits(currency: string): Promise<RegulatoryLimits> {
    this.ensureInitialized();

    // Convert to EUR if different currency
    const conversionRate = currency === 'EUR' ? 1 : await this.getConversionRate(currency, 'EUR');

    return {
      cashTransactionReportingThreshold: 10000 * conversionRate, // €10,000 reporting threshold
      suspiciousActivityThreshold: 15000 * conversionRate, // STR threshold
      enhancedDueDiligenceThreshold: 50000 * conversionRate, // EDD required
      dailyTransactionLimit: 100000 * conversionRate,
      monthlyTransactionLimit: 500000 * conversionRate,
      singleTransactionLimit: 250000 * conversionRate,
      pepTransactionLimit: 30000 * conversionRate, // Lower limit for PEPs
      internationalTransferLimit: 150000 * conversionRate,
    };
  }

  // Helper methods

  private async verifyGDPRConsent(userId: string): Promise<boolean> {
    // GDPR: Verify explicit consent for data processing
    const consent = this.consentRecords.get(userId);
    if (!consent) {
      // In production, would check consent management system
      this.consentRecords.set(userId, { granted: true, timestamp: new Date() });
      return true;
    }
    return consent.granted;
  }

  private async verifyEIDAS(document: any): Promise<boolean> {
    // Mock eIDAS electronic identification verification
    // In production, would connect to eIDAS nodes
    if (!document.issuingCountry || !EU_MEMBER_STATES.includes(document.issuingCountry)) {
      return false;
    }
    return document.verified;
  }

  private verifyDocument(doc: any): boolean {
    if (!doc.expiryDate) return true;
    return new Date(doc.expiryDate) > new Date();
  }

  private async performSCA(user: User): Promise<boolean> {
    // PSD2 Strong Customer Authentication
    // Requires 2 of 3: knowledge, possession, inherence
    // Mock implementation - would use actual SCA in production
    return !!user.phoneNumber; // Simplified check
  }

  private async verifyAddressOfficial(address: any): Promise<boolean> {
    // Verify address through official records
    // In production, would check electoral roll, utility records, etc.
    return !!address.postalCode && !!address.city;
  }

  private async verifyBiometrics(user: User): Promise<boolean> {
    // eIDAS Level of Assurance: Substantial or High
    // Mock biometric verification
    return true;
  }

  private async screenPEP(user: User): Promise<{ matched: boolean }> {
    // PEP screening required under AML5
    return {
      matched: user.politicallyExposed || false,
    };
  }

  private async screenAdverseMedia(user: User): Promise<boolean> {
    // Adverse media screening (AML5 requirement)
    // Mock implementation - would search news databases
    return true; // No adverse media
  }

  private async verifyBeneficialOwnership(user: User): Promise<boolean> {
    // AML5: Beneficial ownership registers
    // Mock UBO verification
    return true;
  }

  private calculateRiskLevel(score: number, checks: any, user: User): 'low' | 'medium' | 'high' {
    if (!checks.sanctionsCheck || user.politicallyExposed) return 'high';
    if (!checks.adverseMediaCheck) return 'high';
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
    const nearThreshold = transactions.filter(t =>
      t.amount >= threshold * 0.8 && t.amount < threshold
    );
    return nearThreshold.length >= 3;
  }

  private detectRapidMovement(transactions: Transaction[]): boolean {
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal' || t.type === 'transfer');
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
    return baseline.averageAmount > 0 && transaction.amount > baseline.averageAmount * 5;
  }

  private isCashIntensive(transactions: Transaction[]): boolean {
    const cashTransactions = transactions.filter(t => t.type === 'deposit' && t.amount >= 1000);
    return cashTransactions.length >= 5;
  }

  private checkSuspiciousNarration(narration: string): boolean {
    const suspiciousKeywords = [
      'cash', 'loan', 'gift', 'donation', 'invoice', 'crypto',
      'bitcoin', 'offshore', 'shell', 'bearer'
    ];
    const lower = narration.toLowerCase();
    return suspiciousKeywords.some(keyword => lower.includes(keyword));
  }

  private async checkSCAREquirement(transaction: Transaction): Promise<boolean> {
    // PSD2 SCA exemptions
    if (transaction.amount <= 30) return false; // Low-value exemption
    return true; // SCA required
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
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    if (n1.includes(n2) || n2.includes(n1)) return 90;
    if (n1 === n2) return 100;

    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    const matches = words1.filter(w => words2.includes(w)).length;
    const maxWords = Math.max(words1.length, words2.length);

    return (matches / maxWords) * 100;
  }

  private checkUNSanctions(name: string): { score: number; name: string } | null {
    // Mock UN sanctions check
    const unSanctioned = ['taliban', 'al-qaeda', 'isis', 'al-shabaab'];
    const lower = name.toLowerCase();

    for (const entity of unSanctioned) {
      if (lower.includes(entity)) {
        return { score: 95, name: entity };
      }
    }
    return null;
  }

  private getSanctionsRiskLevel(score: number, matches: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 95) return 'critical';
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  private detectRoundRobinPattern(transactions: Transaction[]): { detected: boolean; transactionIds: string[] } {
    const transfers = transactions.filter(t => t.type === 'transfer');
    if (transfers.length < 3) return { detected: false, transactionIds: [] };

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
        description: `${highRiskTxs.length} transaction(s) to high-risk third countries`,
        transactionIds: highRiskTxs.map(t => t.id),
      };
    }

    return { detected: false, description: '', transactionIds: [] };
  }

  private detectThirdPartyPayments(transactions: Transaction[]): { detected: boolean; transactionIds: string[] } {
    // Detect frequent payments to third parties (not direct beneficiaries)
    const payments = transactions.filter(t => t.type === 'payment');
    if (payments.length >= 5) {
      return { detected: true, transactionIds: payments.map(t => t.id) };
    }
    return { detected: false, transactionIds: [] };
  }

  private generateReportId(reportType: string): string {
    return `${reportType}-EU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private async getConversionRate(from: string, to: string): Promise<number> {
    const rates: Record<string, number> = {
      'USD': 1.18,
      'GBP': 0.86,
      'CAD': 1.47,
      'CHF': 1.08,
    };
    return rates[from] || 1;
  }
}
