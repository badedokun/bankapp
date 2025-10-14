// ============================================================================
// MONEY TRANSFERS & PAYMENTS TYPE DEFINITIONS
// ============================================================================
// Comprehensive TypeScript interfaces for the enhanced transfer system
// Supporting: Internal, External (NIBSS), Bill Payments, Scheduled, International

export interface BaseTransfer {
    id: string;
    tenantId: string;
    customerId: string;
    amount: number;
    fees: number;
    totalAmount: number;
    reference: string;
    description?: string;
    status: TransferStatus;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}

export type TransferStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'reversed'
    | 'refunded';

export type TransferType =
    | 'internal'
    | 'external'
    | 'bill_payment'
    | 'international'
    | 'scheduled';

export type AuthorizationLevel = 'single' | 'dual';

// ============================================================================
// INTERNAL TRANSFERS
// ============================================================================

export interface InternalTransferRequest {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    currency: string;
    reference?: string;
    narration: string;
    authorizationLevel?: AuthorizationLevel;
    authorizedBy?: string;
}

export interface InternalTransfer extends BaseTransfer {
    userId: string;
    fromWalletId: string;
    toWalletId: string;
    transferType: 'internal';
    authorizationLevel: AuthorizationLevel;
    authorizedBy?: string;
    authorizationTimestamp?: Date;
}

// ============================================================================
// EXTERNAL TRANSFERS (NIBSS NIP)
// ============================================================================

export interface ExternalTransferRequest {
    sourceWalletId: string;
    senderAccountId?: string;
    recipientAccountNumber: string;
    recipientBankCode: string;
    recipientName?: string; // Will be validated via name enquiry
    amount: number;
    narration: string;
    description?: string;
    saveBeneficiary?: boolean;
    beneficiaryNickname?: string;
    pin?: string;
}

export interface ExternalTransfer extends BaseTransfer {
    senderId: string;
    recipientId?: string; // If saved beneficiary
    sourceAccountNumber: string;
    sourceBankCode: string;
    recipientAccountNumber: string;
    recipientBankCode: string;
    recipientName: string;

    // NIBSS specific fields
    nibssTransactionId?: string;
    nibssSessionId?: string;
    nibssResponseMessage?: string;
    nameEnquiryRef?: string;

    transferType: 'external';
    authorizationLevel: AuthorizationLevel;
    authorizedBy?: string;
    cutOffTime?: string; // Time format HH:MM
    retryCount: number;
    maxRetries: number;
    lastRetryAt?: Date;

    processedAt?: Date;
    failureReason?: string;
}

export interface NIBSSNameEnquiryRequest {
    accountNumber: string;
    bankCode: string;
}

export interface NIBSSNameEnquiryResponse {
    sessionID: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    responseCode: string;
    responseMessage: string;
}

export interface NIBSSFundTransferRequest {
    nameEnquiryRef: string;
    amount: number;
    narration: string;
    beneficiaryAccountNumber: string;
    beneficiaryBankCode: string;
    originatorAccountNumber: string;
    originatorBankCode: string;
    billerId: string;
    mandateReferenceNumber?: string;
}

export interface NIBSSFundTransferResponse {
    transactionId: string;
    responseCode: string;
    responseMessage: string;
    sessionID: string;
    amount: number;
    status: string;
}

// ============================================================================
// BILL PAYMENTS
// ============================================================================

export interface BillerInfo {
    id: string;
    tenantId: string;
    billerCode: string;
    billerName: string;
    name?: string; // Alias for billerName
    code?: string; // Alias for billerCode
    category: BillerCategory;
    paymentMethods: string[];
    feeStructure: Record<string, any>;
    minimumAmount: number;
    maximumAmount?: number;
    isActive: boolean;
    supportsValidation: boolean;
    description?: string;
    logo?: string;
    fields?: any;
}

export type BillerCategory =
    | 'electricity'
    | 'telecommunications'
    | 'cable_tv'
    | 'internet'
    | 'government'
    | 'education'
    | 'insurance'
    | 'water'
    | 'waste_management'
    | 'transportation'
    | 'subscription_services'
    | 'other';

export interface BillPaymentRequest {
    billerId: string;
    customerReference: string; // Customer's account/meter number with biller
    amount: number;
    walletId: string;
    validateCustomer?: boolean;
    senderAccountId?: string;
    description?: string;
    pin?: string;
}

export interface BillPayment extends BaseTransfer {
    walletId: string;
    billerId: string;
    customerReference: string;
    paymentReference: string;
    billerReference?: string;
    billerTransactionId?: string;

    // Validation details
    customerName?: string;
    validationStatus: 'pending' | 'valid' | 'invalid' | 'failed';
    validationResponse: Record<string, any>;

    // Processing timeline
    initiatedAt: Date;
    processedAt?: Date;
    completedAt?: Date;

    // Error handling
    retryCount: number;
    lastRetryAt?: Date;

    // Biller response
    billerResponse: Record<string, any>;
    receiptData: Record<string, any>;
}

export interface BillerValidationRequest {
    billerCode: string;
    customerReference: string;
}

export interface BillerValidationResponse {
    isValid: boolean;
    customerName?: string;
    customerInfo?: Record<string, any>;
    minimumAmount?: number;
    maximumAmount?: number;
    validationMessage?: string;
    error?: string;
    amountDue?: number;
}

// ============================================================================
// SCHEDULED PAYMENTS
// ============================================================================

export interface ScheduledPaymentRequest {
    paymentName: string;
    paymentType: TransferType;
    sourceWalletId: string;
    paymentTemplate: PaymentTemplate;
    scheduleConfig: ScheduleConfig;
    balanceConditions?: BalanceCondition[];
    maxExecutions?: number;
    expiresAt?: Date;
    notificationPreferences?: NotificationPreference[];
}

export interface ScheduledPayment {
    id: string;
    tenantId: string;
    customerId: string;
    sourceWalletId: string;
    paymentName: string;
    paymentType: TransferType;
    paymentTemplate: PaymentTemplate;

    // Schedule configuration
    scheduleType: ScheduleType;
    scheduleConfig: ScheduleConfig;
    nextExecutionDate: Date;
    lastExecutionDate?: Date;
    executionCount: number;
    maxExecutions?: number;

    // Conditions and limits
    balanceConditions: BalanceCondition[];
    amountLimits: Record<string, any>;

    // Status and control
    status: ScheduledPaymentStatus;

    // AI enhancement
    aiOptimizationEnabled: boolean;
    optimalTimingSuggestions: Record<string, any>;

    // Error handling
    consecutiveFailures: number;
    maxFailures: number;
    lastFailureReason?: string;

    // Notifications
    notificationPreferences: NotificationPreference[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}

export type ScheduleType =
    | 'one_time'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

// Legacy type alias for backward compatibility
export type TransferFrequency =
    | 'once'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

export type ScheduledPaymentStatus =
    | 'active'
    | 'paused'
    | 'cancelled'
    | 'completed'
    | 'expired';

export interface ScheduleConfig {
    interval?: number; // For custom intervals
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    monthOfYear?: number; // 1-12 for yearly
    time?: string; // HH:MM format
    timezone?: string;
}

export interface PaymentTemplate {
    type: TransferType;
    data: InternalTransferRequest | ExternalTransferRequest | BillPaymentRequest | InternationalTransferRequest;
}

export interface BalanceCondition {
    minimumBalance: number;
    action: 'skip' | 'pause' | 'notify';
}

export interface NotificationPreference {
    type: 'email' | 'sms' | 'push' | 'in_app';
    events: ('execution' | 'failure' | 'completion' | 'cancellation')[];
    enabled: boolean;
}

export interface ScheduledPaymentExecution {
    id: string;
    tenantId: string;
    scheduledPaymentId: string;
    executedPaymentId?: string;
    scheduledFor: Date;
    executedAt: Date;
    executionStatus: 'success' | 'failed' | 'skipped' | 'cancelled';
    amountExecuted?: number;
    feesCharged?: number;
    failureReason?: string;
    conditionsMet: Record<string, any>;
    balanceAtExecution?: number;
    executionMetadata: Record<string, any>;
    createdAt: Date;
}

// ============================================================================
// INTERNATIONAL TRANSFERS (SWIFT)
// ============================================================================

export interface InternationalTransferRequest {
    sourceWalletId: string;
    senderAccountId?: string; // Legacy field
    amount: number;
    sourceCurrency: string;
    destinationCurrency: string;

    // Recipient details
    recipientName: string;
    recipientAddress: string;
    recipientCountry: string; // ISO country code
    recipientCity?: string;
    recipientBankName: string;
    recipientBankSwift: string;
    recipientSwiftCode?: string; // Alias for recipientBankSwift
    recipientAccountNumber: string;
    recipientIban?: string;

    // Correspondent bank (if required)
    correspondentBankSwift?: string;
    correspondentBankName?: string;

    // Transfer purpose and compliance
    transferPurpose: string;
    purpose?: string; // Alias for transferPurpose
    sourceOfFunds?: string;
    purposeCode?: string;
    regulatoryReference?: string;
    complianceDocuments?: string[]; // File URLs
    description?: string;
    pin?: string;
}

export interface InternationalTransfer extends BaseTransfer {
    sourceWalletId: string;
    sourceCurrency: string;
    destinationCurrency: string;
    exchangeRate?: number;
    destinationAmount?: number;

    // Fees breakdown
    transferFee: number;
    exchangeFee: number;
    correspondentBankFee: number;
    totalFees: number;

    // Recipient details
    recipientName: string;
    recipientAddress: string;
    recipientCountry: string;
    recipientBankName: string;
    recipientBankSwift: string;
    recipientAccountNumber: string;
    recipientIban?: string;

    // Correspondent bank details
    correspondentBankSwift?: string;
    correspondentBankName?: string;

    // Transfer purpose and compliance
    transferPurpose: string;
    purposeCode?: string;
    regulatoryReference?: string;
    complianceDocuments: string[];

    // SWIFT processing
    swiftMessageType: string;
    swiftReference?: string;
    swiftStatus: SWIFTStatus;
    swiftResponse: Record<string, any>;

    // Timeline
    processingStartedAt?: Date;
    sentToSwiftAt?: Date;
    completedAt?: Date;

    // Error handling
    returnReason?: string;

    transferMetadata: Record<string, any>;
}

export type SWIFTStatus =
    | 'pending'
    | 'processing'
    | 'sent_to_swift'
    | 'in_transit'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'returned';

// ============================================================================
// TRANSACTION RECEIPTS
// ============================================================================

export interface TransactionReceipt {
    id: string;
    tenantId: string;
    transactionId: string;
    transactionType: TransferType;
    customerId: string;
    receiptNumber: string;
    receiptType: string;
    receiptData: Record<string, any>;
    formattedReceipt?: string;
    pdfUrl?: string;
    qrCodeData?: string;

    // Delivery tracking
    deliveryMethods: string[];
    deliveryStatus: Record<string, any>;
    deliveryAttempts: number;

    // Verification
    verificationCode?: string;
    verificationUrl?: string;
    isVerified: boolean;

    createdAt: Date;
    expiresAt?: Date;
}

export interface ReceiptGenerationRequest {
    transactionId: string;
    transactionType: TransferType;
    deliveryMethods: ('email' | 'sms' | 'push' | 'download')[];
    includeQRCode?: boolean;
    generatePDF?: boolean;
}

// ============================================================================
// UNIFIED TRANSACTION VIEW
// ============================================================================

export interface UnifiedTransaction {
    transactionType: TransferType;
    id: string;
    customerId: string;
    amount: number;
    fees: number;
    totalAmount: number;
    reference: string;
    description?: string;
    status: TransferStatus;
    createdAt: Date;
    recipientName?: string;
    billerName?: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// TRANSFER LIMITS AND VALIDATION
// ============================================================================

export interface TransferLimits {
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    dailyCount: number;
    dailyAmount: number;
    lastResetDate: Date;
}

export interface TransferValidationRequest {
    customerId: string;
    walletId: string;
    amount: number;
    transferType: TransferType;
}

export interface TransferValidationResult {
    isValid: boolean;
    validationErrors: string[];
    availableBalance: number;
    dailyLimitRemaining: number;
    monthlyLimitRemaining: number;
    suggestedActions?: string[];
}

// ============================================================================
// TRANSFER PROCESSING RESULTS
// ============================================================================

export interface TransferResult<T = any> {
    success: boolean;
    id?: string;
    transactionId?: string;
    reference?: string;
    status: TransferStatus;
    message: string;
    amount?: number;
    fees?: number;
    totalAmount?: number;
    recipient?: any;
    data?: T;
    errors?: string[];
    warnings?: string[];
    estimatedCompletionTime?: Date;
    receiptId?: string;
    scheduledDate?: Date;
}

export interface ProcessingError {
    code: string;
    message: string;
    field?: string;
    retryable: boolean;
    suggestedAction?: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface TransferNotification {
    id: string;
    tenantId: string;
    customerId: string;
    transactionId: string;
    transactionType: TransferType;
    notificationType: 'success' | 'failure' | 'pending' | 'warning';
    title: string;
    message: string;
    channels: NotificationChannel[];
    data: Record<string, any>;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    createdAt: Date;
    sentAt?: Date;
    deliveredAt?: Date;
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'voice';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PaginatedRequest {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface TransferListRequest extends PaginatedRequest {
    customerId?: string;
    transferType?: TransferType;
    status?: TransferStatus;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ITransferService {
    processTransfer(request: any): Promise<TransferResult>;
    validateTransfer(request: TransferValidationRequest): Promise<TransferValidationResult>;
    getTransferStatus(transactionId: string): Promise<TransferResult>;
    cancelTransfer(transactionId: string, reason: string): Promise<TransferResult>;
    retryTransfer(transactionId: string): Promise<TransferResult>;
}

export interface IBillerService {
    getBillers(category?: BillerCategory): Promise<BillerInfo[]>;
    validateCustomer(request: BillerValidationRequest): Promise<BillerValidationResponse>;
    processBillPayment(request: BillPaymentRequest): Promise<TransferResult>;
}

export interface IScheduledPaymentService {
    createScheduledPayment(request: ScheduledPaymentRequest): Promise<TransferResult>;
    pauseScheduledPayment(id: string): Promise<TransferResult>;
    resumeScheduledPayment(id: string): Promise<TransferResult>;
    cancelScheduledPayment(id: string): Promise<TransferResult>;
    executeScheduledPayments(): Promise<void>;
}

export interface IReceiptService {
    generateReceipt(request: ReceiptGenerationRequest): Promise<TransactionReceipt>;
    getReceipt(receiptNumber: string): Promise<TransactionReceipt>;
    verifyReceipt(verificationCode: string): Promise<boolean>;
    resendReceipt(receiptId: string, methods: string[]): Promise<boolean>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class TransferError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: any,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'TransferError';
    }
}

export class ValidationError extends TransferError {
    constructor(message: string, public field?: string, details?: any) {
        super('VALIDATION_ERROR', message, details, false);
        this.name = 'ValidationError';
    }
}

export class InsufficientFundsError extends TransferError {
    constructor(available: number, required: number) {
        super(
            'INSUFFICIENT_FUNDS',
            `Insufficient funds. Available: ${available}, Required: ${required}`,
            { available, required },
            false
        );
        this.name = 'InsufficientFundsError';
    }
}

export class LimitExceededError extends TransferError {
    constructor(limitType: string, limit: number, attempted: number) {
        super(
            'LIMIT_EXCEEDED',
            `${limitType} limit exceeded. Limit: ${limit}, Attempted: ${attempted}`,
            { limitType, limit, attempted },
            false
        );
        this.name = 'LimitExceededError';
    }
}

export class ExternalServiceError extends TransferError {
    constructor(service: string, message: string, details?: any) {
        super(
            'EXTERNAL_SERVICE_ERROR',
            `External service error (${service}): ${message}`,
            { service, ...details },
            true
        );
        this.name = 'ExternalServiceError';
    }
}

// ============================================================================
// TYPE ALIASES FOR BACKWARDS COMPATIBILITY
// ============================================================================

// Aliases for legacy service compatibility
export type TransferResponse = TransferResult;
export type Biller = BillerInfo;
export type BillerField = BillerValidationRequest;
export type BillPaymentValidation = BillerValidationResponse;