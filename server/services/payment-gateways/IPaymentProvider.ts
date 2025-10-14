/**
 * Payment Provider Interface
 *
 * Abstraction layer for regional payment networks:
 * - NIBSS (Nigeria)
 * - ACH/FedWire (USA)
 * - SEPA (Europe)
 * - Interac (Canada)
 * - SWIFT (International)
 */

export interface AccountValidationRequest {
  accountNumber: string;
  bankCode: string;
  bankCodeType: 'NIBSS' | 'SWIFT' | 'ROUTING' | 'TRANSIT' | 'SORT_CODE';
  currency?: string;
  region?: string;
}

export interface AccountValidationResult {
  isValid: boolean;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  errorMessage?: string;
  errorCode?: string;
}

export interface TransferRequest {
  // Source account
  fromAccountNumber: string;
  fromAccountName: string;
  fromBankCode?: string;

  // Destination account
  toAccountNumber: string;
  toAccountName?: string;
  toBankCode: string;
  toBankName?: string;

  // Transfer details
  amount: number;
  currency: string;
  narration: string;
  reference: string;

  // Metadata
  transferType: 'internal' | 'external' | 'international';
  region?: string;
  userId?: string;
  tenantId?: string;

  // Additional fields for specific providers
  metadata?: Record<string, any>;
}

export interface TransferResponse {
  success: boolean;
  transactionReference: string;
  providerReference?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  errorCode?: string;
  fee?: number;
  totalAmount?: number;
  estimatedCompletionTime?: Date;
}

export interface TransferStatusRequest {
  transactionReference: string;
  providerReference?: string;
}

export interface TransferStatusResponse {
  transactionReference: string;
  providerReference?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  amount?: number;
  currency?: string;
  completedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface BankListRequest {
  country?: string;
  currency?: string;
  region?: string;
}

export interface BankInfo {
  bankCode: string;
  bankName: string;
  bankCodeType: 'NIBSS' | 'SWIFT' | 'ROUTING' | 'TRANSIT' | 'SORT_CODE';
  country: string;
  currency?: string;
  swiftCode?: string;
  active: boolean;
}

export interface TransferLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  currency: string;
}

export interface ProviderCapabilities {
  supportsAccountValidation: boolean;
  supportsInstantTransfer: boolean;
  supportsScheduledTransfer: boolean;
  supportsInternationalTransfer: boolean;
  supportedCurrencies: string[];
  supportedCountries: string[];
  averageProcessingTime: string; // e.g., "instant", "1-2 hours", "1-3 days"
}

/**
 * Core Payment Provider Interface
 * All regional payment providers must implement this interface
 */
export interface IPaymentProvider {
  /**
   * Provider identification
   */
  readonly name: string;
  readonly region: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Validate account number and retrieve account details
   */
  validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;

  /**
   * Initiate a fund transfer
   */
  initiateTransfer(request: TransferRequest): Promise<TransferResponse>;

  /**
   * Check the status of a transfer
   */
  getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;

  /**
   * Get list of supported banks
   */
  getBankList(request?: BankListRequest): Promise<BankInfo[]>;

  /**
   * Get transfer limits for the provider
   */
  getTransferLimits(currency: string): Promise<TransferLimits>;

  /**
   * Validate if the provider supports a specific operation
   */
  isSupported(operation: 'validate' | 'transfer' | 'status' | 'banks', context?: any): boolean;

  /**
   * Calculate transfer fee
   */
  calculateFee(amount: number, currency: string, transferType: string): Promise<number>;
}

/**
 * Base abstract class for payment providers
 * Provides common functionality that all providers can extend
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly name: string;
  abstract readonly region: string;
  abstract readonly capabilities: ProviderCapabilities;

  protected config: Record<string, any> = {};
  protected initialized: boolean = false;

  async initialize(config: Record<string, any>): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Payment provider ${this.name} not initialized`);
    }
  }

  abstract validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult>;
  abstract initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
  abstract getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse>;
  abstract getBankList(request?: BankListRequest): Promise<BankInfo[]>;
  abstract getTransferLimits(currency: string): Promise<TransferLimits>;
  abstract calculateFee(amount: number, currency: string, transferType: string): Promise<number>;

  isSupported(operation: 'validate' | 'transfer' | 'status' | 'banks', context?: any): boolean {
    switch (operation) {
      case 'validate':
        return this.capabilities.supportsAccountValidation;
      case 'transfer':
        return true; // All providers must support basic transfer
      case 'status':
        return true; // All providers must support status check
      case 'banks':
        return true; // All providers must provide bank list
      default:
        return false;
    }
  }
}

/**
 * Provider Registry
 * Manages available payment providers and routes requests to the appropriate provider
 */
export class PaymentProviderRegistry {
  private providers: Map<string, IPaymentProvider> = new Map();

  /**
   * Register a payment provider
   */
  register(provider: IPaymentProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IPaymentProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Get provider for a specific region
   */
  getProviderForRegion(region: string): IPaymentProvider | undefined {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      if (provider.region.toLowerCase() === region.toLowerCase()) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get provider for a specific currency
   */
  getProviderForCurrency(currency: string): IPaymentProvider | undefined {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      if (provider.capabilities.supportedCurrencies.includes(currency)) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider based on bank code type
   */
  getProviderForBankCodeType(bankCodeType: string): IPaymentProvider | undefined {
    const providerMap: Record<string, string> = {
      'NIBSS': 'nibss',
      'ROUTING': 'ach',
      'SWIFT': 'swift',
      'TRANSIT': 'interac',
      'SORT_CODE': 'faster-payments'
    };

    const providerName = providerMap[bankCodeType];
    return providerName ? this.getProvider(providerName) : undefined;
  }
}

// Global registry instance
export const paymentProviderRegistry = new PaymentProviderRegistry();
