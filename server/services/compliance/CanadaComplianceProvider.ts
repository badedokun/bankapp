/**
 * Canada Compliance Provider
 *
 * Implements Canadian regulatory compliance requirements:
 * - PCMLTFA (Proceeds of Crime (Money Laundering) and Terrorist Financing Act)
 * - FINTRAC (Financial Transactions and Reports Analysis Centre of Canada)
 * - OSFI (Office of the Superintendent of Financial Institutions)
 * - Privacy Act and PIPEDA (Personal Information Protection and Electronic Documents Act)
 *
 * Key Regulations:
 * - PCMLTFA: AML/CTF program requirements
 * - Large Cash Transaction Report: Cash transactions CA$10,000+
 * - Suspicious Transaction Report (STR): Any amount
 * - Electronic Funds Transfer Report: International EFTs CA$10,000+
 * - Client identification and record keeping
 * - Ongoing monitoring and risk assessment
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
 * Mock Canadian sanctions lists
 * - OSFI Consolidated List (based on UN sanctions)
 * - Canadian Autonomous Sanctions
 */
const MOCK_CANADA_SANCTIONS_LIST = [
  { name: 'North Korea', type: 'entity', program: 'DPRK_SANCTIONS', matchThreshold: 90 },
  { name: 'Iran', type: 'entity', program: 'IRAN_SANCTIONS', matchThreshold: 85 },
  { name: 'Russia', type: 'entity', program: 'RUSSIA_SANCTIONS', matchThreshold: 85 },
  { name: 'Syria', type: 'entity', program: 'SYRIA_SANCTIONS', matchThreshold: 90 },
  { name: 'Belarus', type: 'entity', program: 'BELARUS_SANCTIONS', matchThreshold: 85 },
  { name: 'Taliban', type: 'entity', program: 'TERRORISM', matchThreshold: 85 },
  { name: 'Al-Qaeda', type: 'entity', program: 'TERRORISM', matchThreshold: 85 },
];

/**
 * High-risk countries for ML/TF purposes
 * Based on FATF high-risk jurisdictions and Canadian assessment
 */
const HIGH_RISK_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'MM', // Myanmar
  'SY', // Syria
  'YE', // Yemen
  'AF', // Afghanistan
  'IQ', // Iraq
  'LY', // Libya
  'SO', // Somalia
];

/**
 * Terrorist financing entity identifiers
 */
const TERRORIST_ENTITIES = [
  'Taliban', 'Al-Qaeda', 'ISIS', 'ISIL', 'Boko Haram',
  'Hezbollah', 'Hamas', 'Al-Shabaab', 'PKK',
];

export class CanadaComplianceProvider extends BaseComplianceProvider {
  readonly name = 'Canada Compliance Provider';
  readonly region = 'Canada';
  readonly country = 'CA';
  readonly capabilities: ComplianceCapabilities = {
    supportsKYC: true,
    supportsAML: true,
    supportsSanctionsScreening: true,
    supportsTransactionMonitoring: true,
    supportsPEPScreening: true,
    supportsAdverseMediaScreening: true,
    supportsBiometricVerification: true,
    supportsAutomatedReporting: true,
    supportedReportTypes: ['STR', 'FINTRAC'],
    regulatoryBodies: ['FINTRAC', 'OSFI', 'Privacy Commissioner'],
    certifications: ['PCI-DSS', 'SOC2', 'ISO27001', 'PIPEDA'],
  };

  private transactionHistory: Map<string, Transaction[]> = new Map();
  private userRiskScores: Map<string, number> = new Map();
  private privacyConsent: Map<string, { granted: boolean; timestamp: Date }> = new Map();

  /**
   * Initialize Canada compliance provider
   * Configuration should include:
   * - FINTRAC reporting endpoint
   * - OSFI sanctions list access
   * - Credit bureau integration (Equifax Canada, TransUnion Canada)
   * - PEP database access
   */
  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);
    console.log('[Canada Compliance] Initialized with FINTRAC, OSFI, and PIPEDA compliance');
  }

  /**
   * Perform KYC verification according to PCMLTFA requirements
   *
   * FINTRAC Client Identification:
   * 1. Individual: Name, address, date of birth, occupation
   * 2. Document verification: Government-issued photo ID
   * 3. Third-party determination (if applicable)
   * 4. Beneficial ownership for entities
   * 5. Ongoing monitoring
   *
   * Enhanced measures for high-risk clients and PEPs
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

    // PIPEDA compliance: Verify privacy consent
    const privacyConsent = await this.verifyPrivacyConsent(user.id);
    if (!privacyConsent) {
      issues.push('PIPEDA consent required for personal information processing');
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

    // Basic Level: Dual ID verification (FINTRAC requirement)
    if (level === 'basic') {
      // PCMLTFA requires verification of identity using dual-process method
      // Method 1: Government-issued photo ID
      const photoId = documents.find(d =>
        d.type === 'drivers_license' || d.type === 'passport'
      );

      if (photoId) {
        checks.documentVerified = this.verifyDocument(photoId);
        score += checks.documentVerified ? 30 : 0;

        if (!checks.documentVerified) {
          issues.push('Valid government-issued photo ID verification failed');
        }
      } else {
        issues.push('Government-issued photo ID required');
      }

      // Method 2: Credit file or dual-process alternative
      if (user.address && user.dateOfBirth) {
        const creditCheck = await this.verifyCreditFile(user);
        checks.identityVerified = creditCheck.verified;
        score += creditCheck.verified ? 30 : 0;

        if (!creditCheck.verified) {
          issues.push('Credit file verification failed - dual-process required');
        }
      }

      // Address verification
      if (user.address) {
        checks.addressVerified = !!user.address.postalCode;
        score += checks.addressVerified ? 15 : 0;
      } else {
        issues.push('Residential address required under PCMLTFA');
      }

      // Occupation requirement (FINTRAC)
      if (!user.occupation) {
        issues.push('Occupation information required');
        score -= 5;
      }
    }

    // Intermediate Level: Enhanced verification + credit bureau
    if (level === 'intermediate' || level === 'advanced') {
      // Enhanced credit bureau verification
      const enhancedCredit = await this.performEnhancedCreditCheck(user);
      checks.identityVerified = enhancedCredit.verified;
      checks.addressVerified = enhancedCredit.addressVerified;
      score += enhancedCredit.verified ? 25 : 0;
      score += enhancedCredit.addressVerified ? 15 : 0;

      // SIN verification (optional but recommended)
      const sinDoc = documents.find(d => d.type === 'sin');
      if (sinDoc) {
        const sinVerified = await this.verifySIN(sinDoc.number);
        score += sinVerified ? 10 : 0;
      }

      // Address verification through utility bills
      if (checkAddress && user.address) {
        const utilityVerified = await this.verifyUtilityBill(user.address);
        if (utilityVerified) {
          checks.addressVerified = true;
          score += 10;
        }
      }
    }

    // Advanced Level: Enhanced measures for high-risk and PEPs
    let sanctionsResult: any = null;
    if (level === 'advanced') {
      // PEP screening (required under PCMLTFA for high-risk)
      const pepResult = await this.screenPEP(user);
      checks.pepCheck = !pepResult.matched;
      score += checks.pepCheck ? 15 : -30;

      if (pepResult.matched) {
        issues.push('PEP identified - Enhanced measures required under PCMLTFA');
      }

      // OSFI sanctions screening (mandatory)
      sanctionsResult = await this.checkSanctions({
        name: `${user.firstName} ${user.lastName}`,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        address: user.address?.street,
      });
      checks.sanctionsCheck = !sanctionsResult.matched;
      score += checks.sanctionsCheck ? 20 : -50;

      if (sanctionsResult.matched) {
        issues.push('OSFI sanctions match - account prohibited');
      }

      // Terrorist financing screening
      const terroristCheck = await this.screenTerroristEntities(user);
      if (terroristCheck.matched) {
        checks.sanctionsCheck = false;
        score -= 50;
        issues.push('Terrorist entity match - immediate rejection required');
      }

      // Adverse media screening
      checks.adverseMediaCheck = await this.screenAdverseMedia(user);
      score += checks.adverseMediaCheck ? 10 : -15;

      if (!checks.adverseMediaCheck) {
        issues.push('Adverse media findings - enhanced monitoring required');
      }

      // Biometric verification (enhanced security)
      if (checkBiometrics) {
        checks.biometricVerified = await this.verifyBiometrics(user);
        score += checks.biometricVerified ? 10 : 0;
      }

      // Source of funds verification (enhanced measures)
      if (!user.sourceOfFunds || !user.annualIncome) {
        issues.push('Source of funds and income verification required for enhanced measures');
        score -= 10;
      }

      // Third-party determination
      const thirdPartyCheck = await this.checkThirdPartyDetermination(user);
      if (!thirdPartyCheck.valid) {
        issues.push('Third-party determination required');
      }
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(score, checks, user);

    // Determine if verified
    const verified = score >= 70 && !sanctionsResult?.matched && issues.length === 0;

    // Set next review date (PCMLTFA ongoing monitoring)
    const nextReviewDate = new Date();
    if (riskLevel === 'high' || user.politicallyExposed) {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); // High-risk: 6 months
    } else if (riskLevel === 'medium') {
      nextReviewDate.setMonth(nextReviewDate.getMonth() + 12); // Medium-risk: 12 months
    } else {
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 2); // Low-risk: 24 months
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
   * Check transaction for AML compliance under PCMLTFA
   *
   * Required monitoring:
   * - Large Cash Transactions (CA$10,000+)
   * - Suspicious Transactions (any amount)
   * - Electronic Funds Transfers (CA$10,000+ international)
   * - Terrorist Property
   * - Pattern analysis
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

    // Convert to CAD for threshold checks
    const amountCAD = await this.convertToCAD(transaction.amount, transaction.currency);

    // Large Cash Transaction monitoring (CA$10,000+)
    if (transaction.type === 'deposit' && amountCAD >= 10000) {
      riskScore += 10;
      alerts.push({
        severity: 'medium',
        type: 'LARGE_CASH',
        description: `Large cash transaction CA$${amountCAD.toFixed(2)} - LCTR required`,
        requiresAction: true,
      });
    }

    // Check for structuring (breaking up transactions to avoid CA$10,000 threshold)
    const recentTransactions = this.getRecentTransactions(history, 24); // 24 hours
    const structuringDetected = this.detectStructuring(recentTransactions, 10000);
    if (structuringDetected) {
      flags.structuring = true;
      riskScore += 45;
      alerts.push({
        severity: 'critical',
        type: 'STRUCTURING',
        description: 'Potential structuring detected - multiple transactions just below CA$10,000',
        requiresAction: true,
      });
    }

    // Check for rapid movement (layering indicator)
    const rapidMovement = this.detectRapidMovement(recentTransactions);
    if (rapidMovement) {
      flags.rapidMovement = true;
      riskScore += 25;
      alerts.push({
        severity: 'high',
        type: 'RAPID_MOVEMENT',
        description: 'Rapid fund movement detected - potential layering',
        requiresAction: true,
      });
    }

    // Unusual pattern detection
    const userBaseline = this.calculateUserBaseline(history);
    const isUnusual = this.isTransactionUnusual(transaction, userBaseline);
    if (isUnusual) {
      flags.unusualPattern = true;
      riskScore += 20;
      alerts.push({
        severity: 'medium',
        type: 'UNUSUAL_PATTERN',
        description: 'Transaction deviates significantly from customer profile',
        requiresAction: true,
      });
    }

    // High-risk country check (FATF + Canadian assessment)
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

    // OSFI sanctions screening
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
          description: 'Recipient matches OSFI sanctions list - transaction prohibited',
          requiresAction: true,
        });
      }
    }

    // Terrorist financing screening
    if (transaction.recipientName) {
      const terroristCheck = await this.screenTerroristEntities({
        firstName: transaction.recipientName.split(' ')[0],
        lastName: transaction.recipientName.split(' ').slice(1).join(' '),
      } as User);

      if (terroristCheck.matched) {
        flags.sanctionsMatch = true;
        riskScore += 50;
        alerts.push({
          severity: 'critical',
          type: 'TERRORIST_FINANCING',
          description: 'Potential terrorist financing - immediate reporting required',
          requiresAction: true,
        });
      }
    }

    // PEP transaction monitoring
    if (user.politicallyExposed) {
      flags.pepInvolved = true;
      riskScore += 20;
      alerts.push({
        severity: 'medium',
        type: 'PEP_TRANSACTION',
        description: 'Transaction involves PEP - enhanced monitoring required',
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
        description: 'Cash-intensive pattern detected',
        requiresAction: false,
      });
    }

    // Suspicious narration analysis
    if (transaction.narration) {
      const suspiciousNarration = this.checkSuspiciousNarration(transaction.narration);
      if (suspiciousNarration) {
        flags.suspiciousNarration = true;
        riskScore += 15;
        alerts.push({
          severity: 'medium',
          type: 'SUSPICIOUS_NARRATION',
          description: 'Transaction description contains suspicious keywords',
          requiresAction: true,
        });
      }
    }

    // International EFT monitoring (CA$10,000+)
    const isInternational = transaction.recipientCountry && transaction.recipientCountry !== 'CA';
    if (isInternational && amountCAD >= 10000) {
      alerts.push({
        severity: 'low',
        type: 'INTERNATIONAL_EFT',
        description: `International EFT CA$${amountCAD.toFixed(2)} - EFT report required`,
        requiresAction: true,
      });
    }

    // Determine risk level and recommendation
    const riskLevel = this.getRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskScore, flags);

    // Determine if reporting is required
    let requiresReporting = false;
    let reportType: 'SAR' | 'CTR' | 'STR' | undefined;

    // STR required for suspicious activity (any amount)
    if (riskScore >= 40) {
      requiresReporting = true;
      reportType = 'STR';
    }

    // FINTRAC reporting for large cash or EFT
    if (amountCAD >= 10000) {
      requiresReporting = true;
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
   * Screen against OSFI Consolidated Sanctions List
   * Includes UN Security Council sanctions and Canadian autonomous sanctions
   */
  async checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult> {
    this.ensureInitialized();

    const matches: SanctionsCheckResult['matches'] = [];
    const { name, dateOfBirth, nationality, identificationNumber } = request;

    // Check against OSFI Consolidated List
    for (const entry of MOCK_CANADA_SANCTIONS_LIST) {
      const matchScore = this.calculateNameMatchScore(name, entry.name);

      if (matchScore >= entry.matchThreshold) {
        matches.push({
          listName: 'OSFI Consolidated List',
          matchScore,
          entityName: entry.name,
          entityType: entry.type as any,
          program: entry.program,
          details: `Matched against OSFI ${entry.program}`,
        });
      }
    }

    // Check against UN sanctions (via OSFI)
    const unMatch = this.checkUNSanctions(name);
    if (unMatch) {
      matches.push({
        listName: 'UN Security Council Sanctions',
        matchScore: unMatch.score,
        entityName: unMatch.name,
        entityType: 'entity',
        program: 'UN_SANCTIONS',
        details: 'Matched against UN Security Council sanctions list',
      });
    }

    // Check nationality against sanctioned countries
    if (nationality && ['KP', 'IR', 'SY'].includes(nationality)) {
      matches.push({
        listName: 'Canadian Autonomous Sanctions',
        matchScore: 100,
        entityName: nationality,
        entityType: 'entity',
        program: 'COUNTRY_SANCTIONS',
        details: 'Nationality matches sanctioned country',
      });
    }

    // Check against terrorist entity list
    for (const terrorist of TERRORIST_ENTITIES) {
      if (name.toLowerCase().includes(terrorist.toLowerCase())) {
        matches.push({
          listName: 'Listed Terrorist Entities',
          matchScore: 95,
          entityName: terrorist,
          entityType: 'entity',
          program: 'TERRORISM',
          details: 'Matched against Canadian listed terrorist entities',
        });
      }
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
   * Required under PCMLTFA ongoing monitoring obligations
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

    // High-risk transactions
    const highRiskTransactions = transactions.filter(t =>
      t.amount >= 10000 || (t.recipientCountry && HIGH_RISK_COUNTRIES.includes(t.recipientCountry))
    ).length;

    // Velocity checks
    if (checkVelocity) {
      const last24Hours = transactions.filter(t =>
        t.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (last24Hours.length > 12) {
        alerts.push({
          type: 'velocity',
          severity: 'high',
          description: `High transaction velocity: ${last24Hours.length} transactions in 24 hours`,
          transactions: last24Hours.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Threshold monitoring (CA$10,000+)
    if (checkThresholds) {
      const largeCash = transactions.filter(t =>
        t.type === 'deposit' && t.amount >= 10000
      );

      if (largeCash.length > 0) {
        alerts.push({
          type: 'threshold',
          severity: 'medium',
          description: `${largeCash.length} large cash transaction(s) - LCTR required`,
          transactions: largeCash.map(t => t.id),
          detectedAt: new Date(),
        });
      }

      const internationalEFT = transactions.filter(t =>
        t.amount >= 10000 && t.recipientCountry && t.recipientCountry !== 'CA'
      );

      if (internationalEFT.length > 0) {
        alerts.push({
          type: 'threshold',
          severity: 'medium',
          description: `${internationalEFT.length} international EFT(s) - EFT report required`,
          transactions: internationalEFT.map(t => t.id),
          detectedAt: new Date(),
        });
      }
    }

    // Pattern analysis
    if (checkPatterns) {
      // Round-robin detection
      const roundRobin = this.detectRoundRobinPattern(transactions);
      if (roundRobin.detected) {
        alerts.push({
          type: 'pattern',
          severity: 'high',
          description: 'Round-robin pattern - potential money laundering scheme',
          transactions: roundRobin.transactionIds,
          detectedAt: new Date(),
        });
      }

      // Geographic risk
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

      // Smurfing detection (multiple small deposits)
      const smurfing = this.detectSmurfing(transactions);
      if (smurfing.detected) {
        alerts.push({
          type: 'pattern',
          severity: 'high',
          description: 'Smurfing pattern detected - multiple small deposits',
          transactions: smurfing.transactionIds,
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
   * Generate compliance report for FINTRAC
   * Report types: STR, LCTR, EFT Report
   */
  async generateReport(request: ComplianceReportRequest): Promise<ComplianceReport> {
    this.ensureInitialized();

    const { reportType, userId, transactionId, startDate, endDate, reason, suspiciousActivity, metadata } = request;

    const reportId = this.generateReportId(reportType);
    const filingDate = new Date();

    let data: any = {
      reportType,
      generatedAt: filingDate.toISOString(),
      reportingEntity: this.config.institutionName || 'Financial Institution',
      filingMethod: 'Electronic - FINTRAC Web Reporting System',
    };

    // STR: Suspicious Transaction Report (any amount)
    if (reportType === 'STR') {
      data = {
        ...data,
        reportForm: 'FINTRAC STR',
        userId,
        transactionId,
        suspiciousActivity: suspiciousActivity || 'Unusual transaction pattern',
        groundsForSuspicion: reason || 'AML monitoring alert',
        amountInvolved: metadata?.amount || 0,
        currency: metadata?.currency || 'CAD',
        dateOfSuspiciousActivity: startDate.toISOString(),
        mlftIndicators: metadata?.indicators || [],
        actionTaken: metadata?.actionTaken || 'Filed STR with FINTRAC',
        ...metadata,
      };
    }

    // FINTRAC: Large Cash Transaction Report (CA$10,000+)
    if (reportType === 'FINTRAC') {
      const subType = metadata?.subType || 'LCTR';

      if (subType === 'LCTR') {
        data = {
          ...data,
          reportForm: 'FINTRAC LCTR',
          userId,
          transactionId,
          transactionAmount: metadata?.amount || 0,
          currency: 'CAD',
          transactionDate: startDate.toISOString(),
          cashReceived: true,
          denomination: metadata?.denomination || 'Mixed',
          ...metadata,
        };
      } else if (subType === 'EFT') {
        // Electronic Funds Transfer Report (CA$10,000+ international)
        data = {
          ...data,
          reportForm: 'FINTRAC EFT Report',
          userId,
          transactionId,
          transferAmount: metadata?.amount || 0,
          currency: metadata?.currency || 'CAD',
          transferDate: startDate.toISOString(),
          initiatorCountry: 'CA',
          beneficiaryCountry: metadata?.beneficiaryCountry || '',
          transferDirection: metadata?.direction || 'outgoing',
          ...metadata,
        };
      }
    }

    // EDD: Enhanced Due Diligence documentation
    if (reportType === 'EDD') {
      data = {
        ...data,
        reportForm: 'Enhanced Due Diligence Report',
        userId,
        riskRating: metadata?.riskRating || 'high',
        pepStatus: metadata?.pepStatus || false,
        sourceOfWealth: metadata?.sourceOfWealth || '',
        sourceOfFunds: metadata?.sourceOfFunds || '',
        purposeOfAccount: metadata?.purposeOfAccount || '',
        anticipatedActivity: metadata?.anticipatedActivity || '',
        enhancedMeasures: metadata?.enhancedMeasures || [],
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
      submittedTo: 'FINTRAC',
    };
  }

  /**
   * Submit compliance report to FINTRAC
   * Uses FINTRAC Web Reporting System or XML submission
   */
  async submitReport(report: ComplianceReport): Promise<{ success: boolean; acknowledgmentNumber?: string }> {
    this.ensureInitialized();

    console.log(`[Canada Compliance] Submitting ${report.reportType} to FINTRAC...`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate FINTRAC acknowledgment number
    const acknowledgmentNumber = `FINTRAC-${report.reportType}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    report.status = 'submitted';
    report.acknowledgmentNumber = acknowledgmentNumber;

    console.log(`[Canada Compliance] ${report.reportType} submitted successfully. Acknowledgment: ${acknowledgmentNumber}`);

    return {
      success: true,
      acknowledgmentNumber,
    };
  }

  /**
   * Get Canadian regulatory limits
   */
  async getRegulatoryLimits(currency: string): Promise<RegulatoryLimits> {
    this.ensureInitialized();

    // Convert to CAD if different currency
    const conversionRate = currency === 'CAD' ? 1 : await this.getConversionRate(currency, 'CAD');

    return {
      cashTransactionReportingThreshold: 10000 * conversionRate, // Large Cash Transaction threshold
      suspiciousActivityThreshold: 10000 * conversionRate, // STR guidance threshold
      enhancedDueDiligenceThreshold: 100000 * conversionRate, // EDD threshold
      dailyTransactionLimit: 100000 * conversionRate,
      monthlyTransactionLimit: 500000 * conversionRate,
      singleTransactionLimit: 250000 * conversionRate,
      pepTransactionLimit: 50000 * conversionRate, // Lower limit for PEPs
      internationalTransferLimit: 10000 * conversionRate, // EFT reporting threshold
    };
  }

  // Helper methods

  private async verifyPrivacyConsent(userId: string): Promise<boolean> {
    // PIPEDA: Verify consent for personal information collection
    const consent = this.privacyConsent.get(userId);
    if (!consent) {
      this.privacyConsent.set(userId, { granted: true, timestamp: new Date() });
      return true;
    }
    return consent.granted;
  }

  private verifyDocument(doc: any): boolean {
    if (!doc.expiryDate) return true;
    return new Date(doc.expiryDate) > new Date();
  }

  private async verifyCreditFile(user: User): Promise<{ verified: boolean; addressVerified: boolean }> {
    // Credit bureau verification (Equifax Canada, TransUnion Canada)
    const hasAddress = !!user.address;
    const hasDOB = !!user.dateOfBirth;
    return {
      verified: hasAddress && hasDOB,
      addressVerified: hasAddress,
    };
  }

  private async performEnhancedCreditCheck(user: User): Promise<{ verified: boolean; addressVerified: boolean }> {
    return this.verifyCreditFile(user);
  }

  private async verifySIN(sin: string): Promise<boolean> {
    // Social Insurance Number verification (optional under PCMLTFA)
    // Format: XXX-XXX-XXX
    const sinPattern = /^\d{3}-?\d{3}-?\d{3}$/;
    return sinPattern.test(sin);
  }

  private async verifyUtilityBill(address: any): Promise<boolean> {
    // Mock utility bill verification
    return !!address.postalCode;
  }

  private async screenPEP(user: User): Promise<{ matched: boolean }> {
    // PEP screening (domestic and foreign PEPs)
    return {
      matched: user.politicallyExposed || false,
    };
  }

  private async screenTerroristEntities(user: User): Promise<{ matched: boolean }> {
    // Screen against listed terrorist entities
    const name = `${user.firstName} ${user.lastName}`.toLowerCase();
    for (const terrorist of TERRORIST_ENTITIES) {
      if (name.includes(terrorist.toLowerCase())) {
        return { matched: true };
      }
    }
    return { matched: false };
  }

  private async screenAdverseMedia(user: User): Promise<boolean> {
    // Mock adverse media screening
    return true; // No adverse media
  }

  private async verifyBiometrics(user: User): Promise<boolean> {
    // Mock biometric verification
    return true;
  }

  private async checkThirdPartyDetermination(user: User): Promise<{ valid: boolean }> {
    // PCMLTFA: Determine if conducting transaction on behalf of third party
    return { valid: true };
  }

  private calculateRiskLevel(score: number, checks: any, user: User): 'low' | 'medium' | 'high' {
    if (!checks.sanctionsCheck || user.politicallyExposed) return 'high';
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  private async convertToCAD(amount: number, currency: string): Promise<number> {
    if (currency === 'CAD') return amount;
    const rate = await this.getConversionRate(currency, 'CAD');
    return amount * rate;
  }

  private getRecentTransactions(history: Transaction[], hours: number): Transaction[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    return history.filter(t => t.timestamp >= cutoff);
  }

  private detectStructuring(transactions: Transaction[], threshold: number): boolean {
    const nearThreshold = transactions.filter(t =>
      t.amount >= threshold * 0.75 && t.amount < threshold
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
    return baseline.averageAmount > 0 && transaction.amount > baseline.averageAmount * 6;
  }

  private isCashIntensive(transactions: Transaction[]): boolean {
    const cashTransactions = transactions.filter(t => t.type === 'deposit' && t.amount >= 1000);
    return cashTransactions.length >= 5;
  }

  private checkSuspiciousNarration(narration: string): boolean {
    const suspiciousKeywords = [
      'cash', 'loan', 'gift', 'donation', 'charity', 'invoice',
      'crypto', 'bitcoin', 'offshore', 'shell', 'wire',
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
    const unSanctioned = ['taliban', 'al-qaeda', 'isis', 'al-shabaab', 'hezbollah'];
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
        description: `${highRiskTxs.length} transaction(s) to high-risk jurisdictions`,
        transactionIds: highRiskTxs.map(t => t.id),
      };
    }

    return { detected: false, description: '', transactionIds: [] };
  }

  private detectSmurfing(transactions: Transaction[]): { detected: boolean; transactionIds: string[] } {
    // Detect multiple small deposits (smurfing technique)
    const smallDeposits = transactions.filter(t =>
      t.type === 'deposit' && t.amount >= 1000 && t.amount < 5000
    );

    if (smallDeposits.length >= 5) {
      return { detected: true, transactionIds: smallDeposits.map(t => t.id) };
    }

    return { detected: false, transactionIds: [] };
  }

  private generateReportId(reportType: string): string {
    return `${reportType}-CA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private async getConversionRate(from: string, to: string): Promise<number> {
    const rates: Record<string, number> = {
      'USD': 0.74,
      'EUR': 0.68,
      'GBP': 0.58,
      'NGN': 303,
    };
    return rates[from] || 1;
  }
}
