/**
 * Transfer Types for React Native + React Web
 * Based on UI mockups and backend requirements
 */

// Core transfer types
export type TransferType = 'internal' | 'external' | 'bill_payment' | 'international' | 'scheduled';

export type TransferStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type TransferFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Beneficiary management
export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  nickname?: string;
  isFrequent: boolean;
  lastUsed: Date;
  totalTransfers: number;
}

// Account information
export interface UserAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  accountType: string;
  currency: string;
  isDefault: boolean;
}

// Bank information
export interface Bank {
  code: string;
  name: string;
  sortCode?: string;
  logo?: string;
  isActive: boolean;
  transferFee: number;
  maxTransferLimit: number;
}

// Transfer request interfaces
export interface BaseTransferRequest {
  senderAccountId: string;
  recipientName: string;
  amount: number;
  description?: string;
  pin: string;
  scheduledDate?: Date;
  frequency?: TransferFrequency;
  endDate?: Date;
}

export interface InternalTransferRequest extends BaseTransferRequest {
  type: 'internal';
  recipientAccountNumber: string;
}

export interface ExternalTransferRequest extends BaseTransferRequest {
  type: 'external';
  recipientAccountNumber: string;
  recipientBankCode: string;
  saveBeneficiary?: boolean;
  beneficiaryNickname?: string;
}

export interface BillPaymentRequest extends BaseTransferRequest {
  type: 'bill_payment';
  billerId: string;
  billerName: string;
  customerReference: string;
  billCategory: string;
}

export interface InternationalTransferRequest extends BaseTransferRequest {
  type: 'international';
  recipientIban: string;
  recipientSwiftCode: string;
  recipientCountry: string;
  recipientCity: string;
  recipientAddress: string;
  purpose: string;
  sourceOfFunds: string;
}

export type TransferRequest =
  | InternalTransferRequest
  | ExternalTransferRequest
  | BillPaymentRequest
  | InternationalTransferRequest;

// Transfer response
export interface TransferResponse {
  id: string;
  reference: string;
  status: TransferStatus;
  amount: number;
  fees: number;
  totalAmount: number;
  recipient: {
    name: string;
    accountNumber: string;
    bankName?: string;
  };
  scheduledDate?: Date;
  processedAt?: Date;
  message: string;
}

// Transfer history
export interface TransferRecord {
  id: string;
  reference: string;
  type: TransferType;
  status: TransferStatus;
  amount: number;
  fees: number;
  description: string;
  recipient: {
    name: string;
    accountNumber: string;
    bankName?: string;
  };
  sender: {
    name: string;
    accountNumber: string;
  };
  createdAt: Date;
  processedAt?: Date;
  scheduledDate?: Date;
  failureReason?: string;
}

// Transfer limits
export interface TransferLimits {
  daily: {
    used: number;
    limit: number;
  };
  monthly: {
    used: number;
    limit: number;
  };
  perTransaction: {
    min: number;
    max: number;
  };
  currency: string;
}

// OTP verification
export interface OTPRequest {
  transferId: string;
  otpCode: string;
}

export interface OTPResponse {
  isValid: boolean;
  message: string;
  attemptsRemaining?: number;
}

// Bulk transfer
export interface BulkTransferItem {
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankCode?: string;
  amount: number;
  description?: string;
}

export interface BulkTransferRequest {
  senderAccountId: string;
  transfers: BulkTransferItem[];
  totalAmount: number;
  pin: string;
  scheduledDate?: Date;
}

// Transfer step tracking
export type TransferStep = 'select' | 'details' | 'review' | 'verify' | 'complete';

export interface TransferProgress {
  currentStep: TransferStep;
  completedSteps: TransferStep[];
  transferData: Partial<TransferRequest>;
  isValid: boolean;
  errors: Record<string, string>;
}

// Bill payment specific types
export interface Biller {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  logo?: string;
  isActive: boolean;
  fields: BillerField[];
  minAmount: number;
  maxAmount: number;
  fee: number;
}

export interface BillerField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface BillPaymentValidation {
  isValid: boolean;
  customerName?: string;
  customerInfo?: Record<string, any>;
  amountDue?: number;
  dueDate?: Date;
  error?: string;
}

// UI component props
export interface TransferStepProps {
  progress: TransferProgress;
  onNext: (data: Partial<TransferRequest>) => void;
  onBack: () => void;
  onCancel: () => void;
  accounts: UserAccount[];
  beneficiaries: Beneficiary[];
  banks: Bank[];
  limits: TransferLimits;
}

// API service interfaces
export interface TransferService {
  initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
  getTransferHistory(accountId: string, page: number, limit: number): Promise<TransferRecord[]>;
  getTransferDetails(transferId: string): Promise<TransferRecord>;
  cancelTransfer(transferId: string): Promise<boolean>;
  getBeneficiaries(userId: string): Promise<Beneficiary[]>;
  addBeneficiary(beneficiary: Omit<Beneficiary, 'id' | 'totalTransfers' | 'lastUsed'>): Promise<Beneficiary>;
  deleteBeneficiary(beneficiaryId: string): Promise<boolean>;
  getTransferLimits(accountId: string): Promise<TransferLimits>;
  validateRecipient(accountNumber: string, bankCode: string): Promise<{
    isValid: boolean;
    accountName?: string;
    bankName?: string;
  }>;
  requestOTP(transferId: string): Promise<boolean>;
  verifyOTP(request: OTPRequest): Promise<OTPResponse>;
}

// Error types
export class TransferError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TransferError';
  }
}

export class ValidationError extends TransferError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class InsufficientFundsError extends TransferError {
  constructor(available: number, required: number) {
    super(
      `Insufficient funds. Available: ${available}, Required: ${required}`,
      'INSUFFICIENT_FUNDS'
    );
    this.name = 'InsufficientFundsError';
  }
}

export class LimitExceededError extends TransferError {
  constructor(limit: number, attempted: number, limitType: string) {
    super(
      `${limitType} limit exceeded. Limit: ${limit}, Attempted: ${attempted}`,
      'LIMIT_EXCEEDED'
    );
    this.name = 'LimitExceededError';
  }
}