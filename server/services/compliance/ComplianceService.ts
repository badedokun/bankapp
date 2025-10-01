/**
 * Compliance Service
 *
 * Orchestration layer that manages all compliance providers
 * and routes requests to the appropriate provider based on:
 * - Country
 * - Region
 * - Tenant configuration
 * - Regulatory requirements
 */

import { Pool } from 'pg';
import {
  IComplianceProvider,
  ComplianceProviderRegistry,
  complianceProviderRegistry,
  KYCRequest,
  KYCResult,
  AMLCheckRequest,
  AMLResult,
  SanctionsCheckRequest,
  SanctionsCheckResult,
  TransactionMonitoringRequest,
  TransactionMonitoringResult,
  ComplianceReportRequest,
  ComplianceReport,
  RegulatoryLimits,
  User,
  Transaction
} from './IComplianceProvider';
import { USAComplianceProvider } from './USAComplianceProvider';
import { EuropeComplianceProvider } from './EuropeComplianceProvider';
import { CanadaComplianceProvider } from './CanadaComplianceProvider';

interface TenantComplianceConfig {
  tenantId: string;
  tenantName: string;
  country: string;
  region: string;
  currency: string;
  preferredProvider?: string;
  complianceLevel: 'basic' | 'standard' | 'enhanced';
}

export class ComplianceService {
  private registry: ComplianceProviderRegistry;
  private db: Pool;
  private initialized: boolean = false;

  constructor(db: Pool) {
    this.db = db;
    this.registry = complianceProviderRegistry;
  }

  /**
   * Initialize all compliance providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize USA Compliance Provider
    const usaProvider = new USAComplianceProvider();
    await usaProvider.initialize({
      fincenApiKey: process.env.FINCEN_API_KEY,
      ofacApiKey: process.env.OFAC_API_KEY,
      complyAdvantageKey: process.env.COMPLY_ADVANTAGE_KEY,
      creditBureauKey: process.env.CREDIT_BUREAU_KEY,
      environment: process.env.COMPLIANCE_ENV || 'sandbox'
    });
    this.registry.register(usaProvider);

    // Initialize Europe Compliance Provider
    const europeProvider = new EuropeComplianceProvider();
    await europeProvider.initialize({
      ebaApiKey: process.env.EBA_API_KEY,
      fiuApiKey: process.env.EU_FIU_API_KEY,
      eidasProvider: process.env.EIDAS_PROVIDER,
      sanctionsApiKey: process.env.EU_SANCTIONS_API_KEY,
      environment: process.env.COMPLIANCE_ENV || 'sandbox'
    });
    this.registry.register(europeProvider);

    // Initialize Canada Compliance Provider
    const canadaProvider = new CanadaComplianceProvider();
    await canadaProvider.initialize({
      fintracApiKey: process.env.FINTRAC_API_KEY,
      osfiApiKey: process.env.OSFI_API_KEY,
      creditBureauKey: process.env.CANADA_CREDIT_BUREAU_KEY,
      environment: process.env.COMPLIANCE_ENV || 'sandbox'
    });
    this.registry.register(canadaProvider);

    this.initialized = true;
    console.log('✅ Compliance Service initialized with 3 regional providers');
  }

  /**
   * Get tenant compliance configuration from database
   */
  private async getTenantConfig(tenantId: string): Promise<TenantComplianceConfig | null> {
    try {
      const result = await this.db.query(
        `SELECT id, name, currency, region
         FROM platform.tenants
         WHERE id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const tenant = result.rows[0];

      // Determine country from region
      const regionCountryMap: Record<string, string> = {
        'africa-west': 'NG',
        'africa-east': 'NG',
        'africa-south': 'ZA',
        'north-america-east': 'US',
        'north-america-west': 'US',
        'north-america-central': 'CA',
        'europe-west': 'EU',
        'europe-central': 'EU',
        'europe-east': 'EU'
      };

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        currency: tenant.currency || 'NGN',
        region: tenant.region || 'africa-west',
        country: regionCountryMap[tenant.region] || 'NG',
        complianceLevel: 'standard'
      };
    } catch (error) {
      console.error('Error fetching tenant config:', error);
      return null;
    }
  }

  /**
   * Select appropriate compliance provider based on context
   */
  async selectProvider(context: {
    tenantId?: string;
    country?: string;
    region?: string;
    preferredProvider?: string;
  }): Promise<IComplianceProvider | null> {
    this.ensureInitialized();

    // 1. Use preferred provider if specified
    if (context.preferredProvider) {
      const provider = this.registry.getProvider(context.preferredProvider);
      if (provider) return provider;
    }

    // 2. Get tenant configuration
    if (context.tenantId) {
      const tenantConfig = await this.getTenantConfig(context.tenantId);
      if (tenantConfig) {
        context.country = context.country || tenantConfig.country;
        context.region = context.region || tenantConfig.region;
      }
    }

    // 3. Select by country (most specific)
    if (context.country) {
      const provider = this.registry.getProviderForCountry(context.country);
      if (provider) return provider;
    }

    // 4. Select by region
    if (context.region) {
      const regionMap: Record<string, string> = {
        'africa-west': 'Nigeria',
        'africa-east': 'Nigeria',
        'africa-south': 'South Africa',
        'north-america-east': 'USA',
        'north-america-west': 'USA',
        'north-america-central': 'Canada',
        'europe-west': 'Europe',
        'europe-central': 'Europe',
        'europe-east': 'Europe'
      };

      const providerRegion = regionMap[context.region];
      if (providerRegion) {
        const provider = this.registry.getProviderForRegion(providerRegion);
        if (provider) return provider;
      }
    }

    // 5. Default to USA provider (most comprehensive)
    return this.registry.getProvider('usa-compliance');
  }

  /**
   * Perform KYC verification
   */
  async performKYC(
    request: KYCRequest,
    tenantId?: string
  ): Promise<KYCResult> {
    const provider = await this.selectProvider({
      tenantId,
      country: request.user.countryOfResidence
    });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportsKYC) {
      throw new Error(`${provider.name} does not support KYC verification`);
    }

    return await provider.performKYC(request);
  }

  /**
   * Check transaction for AML compliance
   */
  async checkAML(
    request: AMLCheckRequest,
    tenantId?: string
  ): Promise<AMLResult> {
    const provider = await this.selectProvider({
      tenantId,
      country: request.user.countryOfResidence
    });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportsAML) {
      throw new Error(`${provider.name} does not support AML checks`);
    }

    return await provider.checkAML(request);
  }

  /**
   * Screen against sanctions lists
   */
  async checkSanctions(
    request: SanctionsCheckRequest,
    tenantId?: string
  ): Promise<SanctionsCheckResult> {
    const provider = await this.selectProvider({
      tenantId,
      country: request.nationality
    });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportsSanctionsScreening) {
      throw new Error(`${provider.name} does not support sanctions screening`);
    }

    return await provider.checkSanctions(request);
  }

  /**
   * Monitor user transactions
   */
  async monitorTransactions(
    request: TransactionMonitoringRequest,
    tenantId?: string
  ): Promise<TransactionMonitoringResult> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportsTransactionMonitoring) {
      throw new Error(`${provider.name} does not support transaction monitoring`);
    }

    return await provider.monitorTransactions(request);
  }

  /**
   * Generate compliance report
   */
  async generateReport(
    request: ComplianceReportRequest,
    tenantId?: string
  ): Promise<ComplianceReport> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportedReportTypes.includes(request.reportType)) {
      throw new Error(`${provider.name} does not support ${request.reportType} reports`);
    }

    return await provider.generateReport(request);
  }

  /**
   * Submit compliance report to regulatory body
   */
  async submitReport(
    report: ComplianceReport,
    tenantId?: string
  ): Promise<{ success: boolean; acknowledgmentNumber?: string }> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    if (!provider.capabilities.supportsAutomatedReporting) {
      throw new Error(`${provider.name} does not support automated reporting`);
    }

    return await provider.submitReport(report);
  }

  /**
   * Get regulatory limits
   */
  async getRegulatoryLimits(
    currency: string,
    tenantId?: string
  ): Promise<RegulatoryLimits> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      throw new Error('No compliance provider available for this request');
    }

    return await provider.getRegulatoryLimits(currency);
  }

  /**
   * Get required KYC level for operation
   */
  async getRequiredKYCLevel(
    operation: 'transfer' | 'withdrawal' | 'deposit',
    amount: number,
    currency: string,
    tenantId?: string
  ): Promise<'basic' | 'intermediate' | 'advanced'> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      return 'basic'; // Fallback
    }

    return await provider.getRequiredKYCLevel(operation, amount, currency);
  }

  /**
   * Check if operation is compliant
   */
  async isOperationCompliant(
    operation: string,
    context: any,
    tenantId?: string
  ): Promise<boolean> {
    const provider = await this.selectProvider({ tenantId });

    if (!provider) {
      return false;
    }

    return await provider.isCompliant(operation, context);
  }

  /**
   * Get available compliance providers for tenant
   */
  async getAvailableProviders(tenantId: string): Promise<IComplianceProvider[]> {
    const tenantConfig = await this.getTenantConfig(tenantId);
    if (!tenantConfig) {
      return [];
    }

    const allProviders = this.registry.getAllProviders();
    return allProviders.filter(provider =>
      provider.country === tenantConfig.country ||
      provider.region === tenantConfig.region
    );
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(providerName: string) {
    const provider = this.registry.getProvider(providerName);
    return provider?.capabilities;
  }

  /**
   * Perform comprehensive compliance check
   * Combines KYC, AML, and Sanctions screening
   */
  async performComprehensiveCheck(
    user: User,
    transaction: Transaction,
    tenantId?: string
  ): Promise<{
    kyc: KYCResult;
    aml: AMLResult;
    sanctions: SanctionsCheckResult;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    approved: boolean;
    reason?: string;
  }> {
    const provider = await this.selectProvider({
      tenantId,
      country: user.countryOfResidence
    });

    if (!provider) {
      throw new Error('No compliance provider available');
    }

    // Perform KYC
    const kyc = await provider.performKYC({
      userId: user.id,
      user,
      level: 'intermediate',
      documents: user.identityDocuments || [],
      checkBiometrics: false,
      checkAddress: true,
      checkEmployment: false
    });

    // Perform AML check
    const aml = await provider.checkAML({
      transaction,
      user,
      checkType: 'pre_transaction'
    });

    // Perform sanctions screening
    const sanctions = await provider.checkSanctions({
      name: `${user.firstName} ${user.lastName}`,
      dateOfBirth: user.dateOfBirth,
      nationality: user.nationality,
      address: user.address ?
        `${user.address.street}, ${user.address.city}, ${user.address.country}` :
        undefined
    });

    // Calculate overall risk
    const riskScores = {
      'low': 0,
      'medium': 1,
      'high': 2,
      'critical': 3
    };

    const maxRisk = Math.max(
      riskScores[kyc.riskLevel],
      riskScores[aml.riskLevel],
      riskScores[sanctions.riskLevel]
    );

    const overallRisk = Object.keys(riskScores).find(
      key => riskScores[key as keyof typeof riskScores] === maxRisk
    ) as 'low' | 'medium' | 'high' | 'critical';

    // Determine approval
    const approved =
      kyc.verified &&
      aml.passed &&
      !sanctions.matched &&
      aml.recommendation !== 'reject' &&
      overallRisk !== 'critical';

    const reason = !approved ?
      !kyc.verified ? 'KYC verification failed' :
      !aml.passed ? 'AML check failed' :
      sanctions.matched ? 'Sanctions list match' :
      'High risk transaction' :
      undefined;

    return {
      kyc,
      aml,
      sanctions,
      overallRisk,
      approved,
      reason
    };
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Compliance Service not initialized. Call initialize() first.');
    }
  }

  /**
   * Get registry for direct access (advanced use)
   */
  getRegistry(): ComplianceProviderRegistry {
    return this.registry;
  }
}

// Export singleton instance
let complianceServiceInstance: ComplianceService | null = null;

export function getComplianceService(db: Pool): ComplianceService {
  if (!complianceServiceInstance) {
    complianceServiceInstance = new ComplianceService(db);
  }
  return complianceServiceInstance;
}
