/**
 * Interac Payment Provider
 *
 * Interac e-Transfer implementation for Canada
 * Supports:
 * - Interac e-Transfer
 * - Account verification
 * - Canadian bank transfers
 * - Instant transfers (typically under 30 minutes)
 *
 * Integration: Interac Network
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  BasePaymentProvider,
  AccountValidationRequest,
  AccountValidationResult,
  TransferRequest,
  TransferResponse,
  TransferStatusRequest,
  TransferStatusResponse,
  BankListRequest,
  BankInfo,
  TransferLimits,
  ProviderCapabilities
} from './IPaymentProvider';

interface InteracConfig {
  baseUrl: string;
  accessCode: string;
  partnerId: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
}

interface CanadianBankAccount {
  institutionNumber: string; // 3 digits
  transitNumber: string; // 5 digits
  accountNumber: string; // 7-12 digits
}

interface InteracValidationResponse {
  valid: boolean;
  accountName?: string;
  institutionName?: string;
  accountStatus?: string;
}

interface InteracTransferResponse {
  transactionId: string;
  referenceNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedDelivery?: string;
}

export class InteracProvider extends BasePaymentProvider {
  readonly name = 'Interac';
  readonly region = 'Canada';
  readonly capabilities: ProviderCapabilities = {
    supportsAccountValidation: true,
    supportsInstantTransfer: true, // Interac e-Transfer is near-instant
    supportsScheduledTransfer: false, // Not supported by Interac e-Transfer
    supportsInternationalTransfer: false,
    supportedCurrencies: ['CAD'],
    supportedCountries: ['CA'],
    averageProcessingTime: 'instant to 30 minutes'
  };

  private client: AxiosInstance | null = null;
  private interacConfig: InteracConfig | null = null;

  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);

    this.interacConfig = {
      baseUrl: config.baseUrl || process.env.INTERAC_BASE_URL || 'https://api.interac.ca',
      accessCode: config.accessCode || process.env.INTERAC_ACCESS_CODE || '',
      partnerId: config.partnerId || process.env.INTERAC_PARTNER_ID || '',
      secretKey: config.secretKey || process.env.INTERAC_SECRET_KEY || '',
      environment: config.environment || 'sandbox'
    };

    this.client = axios.create({
      baseURL: this.interacConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-ID': this.interacConfig.partnerId,
        'X-Access-Code': this.interacConfig.accessCode
      }
    });
  }

  /**
   * Validate Canadian bank account
   * Format: Institution Number (3) + Transit Number (5) + Account Number (7-12)
   */
  async validateAccount(request: AccountValidationRequest): Promise<AccountValidationResult> {
    this.ensureInitialized();

    try {
      if (!this.client || !this.interacConfig) {
        throw new Error('Interac client not initialized');
      }

      const account = this.parseCanadianAccount(request.accountNumber);

      if (!account) {
        return {
          isValid: false,
          errorMessage: 'Invalid Canadian account format. Expected: Institution(3)-Transit(5)-Account(7-12)',
          errorCode: 'INVALID_FORMAT'
        };
      }

      // Validate institution number (must be 3 digits)
      if (account.institutionNumber.length !== 3) {
        return {
          isValid: false,
          errorMessage: 'Institution number must be 3 digits',
          errorCode: 'INVALID_INSTITUTION'
        };
      }

      // Validate transit number (must be 5 digits)
      if (account.transitNumber.length !== 5) {
        return {
          isValid: false,
          errorMessage: 'Transit number must be 5 digits',
          errorCode: 'INVALID_TRANSIT'
        };
      }

      // Validate account number (7-12 digits)
      if (account.accountNumber.length < 7 || account.accountNumber.length > 12) {
        return {
          isValid: false,
          errorMessage: 'Account number must be 7-12 digits',
          errorCode: 'INVALID_ACCOUNT'
        };
      }

      // Verify institution number is valid
      const bankName = this.getBankNameFromInstitution(account.institutionNumber);
      if (bankName === 'Unknown Bank') {
        return {
          isValid: false,
          errorMessage: 'Invalid or unsupported institution number',
          errorCode: 'INVALID_INSTITUTION'
        };
      }

      // In production, call Interac validation API
      const response = await this.mockInteracValidation(account);

      return {
        isValid: true,
        accountName: response.accountName,
        accountNumber: this.maskAccountNumber(account.accountNumber),
        bankName
      };
    } catch (error: any) {
      return {
        isValid: false,
        errorMessage: error.message || 'Account validation error',
        errorCode: 'INTERAC_ERROR'
      };
    }
  }

  /**
   * Initiate Interac e-Transfer
   */
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    this.ensureInitialized();

    try {
      if (!this.client || !this.interacConfig) {
        throw new Error('Interac client not initialized');
      }

      // Validate currency
      if (request.currency !== 'CAD') {
        return {
          success: false,
          transactionReference: request.reference,
          status: 'failed',
          message: 'Interac only supports CAD currency',
          errorCode: 'INVALID_CURRENCY'
        };
      }

      // Check Interac daily limit
      const limits = await this.getTransferLimits('CAD');
      if (request.amount > limits.dailyLimit) {
        return {
          success: false,
          transactionReference: request.reference,
          status: 'failed',
          message: `Amount exceeds Interac daily limit of CA$${limits.dailyLimit.toLocaleString()}`,
          errorCode: 'LIMIT_EXCEEDED'
        };
      }

      const fee = await this.calculateFee(request.amount, request.currency, request.transferType);
      const totalAmount = request.amount + fee;

      // Parse account numbers
      const fromAccount = this.parseCanadianAccount(request.fromAccountNumber);
      const toAccount = this.parseCanadianAccount(request.toAccountNumber);

      if (!fromAccount || !toAccount) {
        return {
          success: false,
          transactionReference: request.reference,
          status: 'failed',
          message: 'Invalid Canadian account format',
          errorCode: 'INVALID_ACCOUNT_FORMAT'
        };
      }

      // Interac e-Transfer payload
      const payload = {
        sender: {
          name: request.fromAccountName,
          institutionNumber: fromAccount.institutionNumber,
          transitNumber: fromAccount.transitNumber,
          accountNumber: fromAccount.accountNumber
        },
        recipient: {
          name: request.toAccountName,
          email: request.metadata?.email || '', // Interac often uses email for recipient
          institutionNumber: toAccount.institutionNumber,
          transitNumber: toAccount.transitNumber,
          accountNumber: toAccount.accountNumber
        },
        amount: {
          value: request.amount.toFixed(2),
          currency: 'CAD'
        },
        message: request.narration.substring(0, 255), // Interac allows longer messages
        referenceNumber: request.reference,
        securityQuestion: request.metadata?.securityQuestion || null,
        securityAnswer: request.metadata?.securityAnswer || null
      };

      const signature = this.generateSignature(payload);

      // Simulate Interac processing
      // In production, this would call Interac API
      const estimatedCompletionTime = new Date();
      estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 15); // Typically 15-30 minutes

      return {
        success: true,
        transactionReference: request.reference,
        providerReference: `INTERAC-${Date.now()}`,
        status: 'processing',
        message: 'Interac e-Transfer initiated. Typically completed within 30 minutes',
        fee,
        totalAmount,
        estimatedCompletionTime
      };
    } catch (error: any) {
      return {
        success: false,
        transactionReference: request.reference,
        status: 'failed',
        message: error.message || 'Interac transfer error',
        errorCode: 'INTERAC_ERROR'
      };
    }
  }

  /**
   * Get Interac transfer status
   */
  async getTransferStatus(request: TransferStatusRequest): Promise<TransferStatusResponse> {
    this.ensureInitialized();

    try {
      // In production, query Interac for transfer status
      // For now, return mock status
      return {
        transactionReference: request.transactionReference,
        providerReference: request.providerReference,
        status: 'processing',
        metadata: {
          transferType: 'Interac e-Transfer',
          estimatedCompletion: 'instant to 30 minutes',
          note: 'Most Interac e-Transfers are completed within 30 minutes. Recipient will receive notification when funds are available.'
        }
      };
    } catch (error: any) {
      return {
        transactionReference: request.transactionReference,
        status: 'failed',
        failureReason: error.message
      };
    }
  }

  /**
   * Get list of Canadian banks
   */
  async getBankList(request?: BankListRequest): Promise<BankInfo[]> {
    // Static list of major Canadian banks with their institution numbers
    return [
      {
        bankCode: '0003',
        bankName: 'Royal Bank of Canada (RBC)',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'ROYCCAT2',
        active: true
      },
      {
        bankCode: '0004',
        bankName: 'Toronto-Dominion Bank (TD)',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'TDOMCATTTOR',
        active: true
      },
      {
        bankCode: '0002',
        bankName: 'Bank of Nova Scotia (Scotiabank)',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'NOSCCATT',
        active: true
      },
      {
        bankCode: '0001',
        bankName: 'Bank of Montreal (BMO)',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'BOFMCAM2',
        active: true
      },
      {
        bankCode: '0010',
        bankName: 'Canadian Imperial Bank of Commerce (CIBC)',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'CIBCCATT',
        active: true
      },
      {
        bankCode: '0006',
        bankName: 'National Bank of Canada',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'BNDCCAMMINT',
        active: true
      },
      {
        bankCode: '0016',
        bankName: 'HSBC Bank Canada',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'HKBCCATT',
        active: true
      },
      {
        bankCode: '0039',
        bankName: 'Laurentian Bank',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'BLCMCAT1',
        active: true
      },
      {
        bankCode: '0815',
        bankName: 'Tangerine Bank',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'INSCCATTTOR',
        active: true
      },
      {
        bankCode: '0509',
        bankName: 'EQ Bank',
        bankCodeType: 'TRANSIT',
        country: 'CA',
        currency: 'CAD',
        swiftCode: 'EQBKCATTTOR',
        active: true
      }
    ];
  }

  /**
   * Get Interac transfer limits
   */
  async getTransferLimits(currency: string): Promise<TransferLimits> {
    if (currency !== 'CAD') {
      throw new Error('Interac only supports CAD currency');
    }

    // Interac e-Transfer limits (set by Interac)
    return {
      minAmount: 0.01,
      maxAmount: 25000, // CA$25,000 per transaction (Interac limit)
      dailyLimit: 10000, // CA$10,000 per day (common bank limit)
      monthlyLimit: 100000, // CA$100,000 per month
      currency: 'CAD'
    };
  }

  /**
   * Calculate Interac transfer fee
   */
  async calculateFee(amount: number, currency: string, transferType: string): Promise<number> {
    if (currency !== 'CAD') {
      throw new Error('Interac only supports CAD currency');
    }

    // Interac e-Transfer fees
    // Most banks charge CA$1.00 - CA$1.50 per transfer
    if (transferType === 'internal') {
      return 0; // Free for internal transfers within same institution
    } else {
      return 1.50; // CA$1.50 for Interac e-Transfer
    }
  }

  /**
   * Parse Canadian bank account format
   * Accepts formats:
   * - 003-12345-1234567 (with dashes)
   * - 003 12345 1234567 (with spaces)
   * - 00312345001234567 (continuous)
   */
  private parseCanadianAccount(accountString: string): CanadianBankAccount | null {
    // Remove spaces and dashes
    const cleaned = accountString.replace(/[\s-]/g, '');

    // Check minimum length (3 + 5 + 7 = 15)
    if (cleaned.length < 15 || cleaned.length > 20) {
      return null;
    }

    // Extract components
    const institutionNumber = cleaned.substring(0, 3);
    const transitNumber = cleaned.substring(3, 8);
    const accountNumber = cleaned.substring(8);

    // Validate all are numeric
    if (!/^\d+$/.test(institutionNumber) || !/^\d+$/.test(transitNumber) || !/^\d+$/.test(accountNumber)) {
      return null;
    }

    return {
      institutionNumber,
      transitNumber,
      accountNumber
    };
  }

  /**
   * Get bank name from institution number
   */
  private getBankNameFromInstitution(institutionNumber: string): string {
    const institutionMap: Record<string, string> = {
      '0001': 'BMO',
      '0002': 'Scotiabank',
      '0003': 'RBC',
      '0004': 'TD',
      '0006': 'National Bank',
      '0010': 'CIBC',
      '0016': 'HSBC',
      '0039': 'Laurentian Bank',
      '0815': 'Tangerine',
      '0509': 'EQ Bank'
    };
    return institutionMap[institutionNumber] || 'Unknown Bank';
  }

  /**
   * Mock Interac account validation
   * In production, this would call Interac validation API
   */
  private async mockInteracValidation(account: CanadianBankAccount): Promise<InteracValidationResponse> {
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      valid: true,
      accountName: 'John Doe', // Mock account name
      institutionName: this.getBankNameFromInstitution(account.institutionNumber),
      accountStatus: 'active'
    };
  }

  /**
   * Generate request signature for Interac API
   */
  private generateSignature(payload: any): string {
    if (!this.interacConfig) {
      throw new Error('Interac config not initialized');
    }

    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.interacConfig.secretKey)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Mask account number for security
   */
  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    const lastFour = accountNumber.slice(-4);
    return `****${lastFour}`;
  }
}
