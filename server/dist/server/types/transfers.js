"use strict";
// ============================================================================
// MONEY TRANSFERS & PAYMENTS TYPE DEFINITIONS
// ============================================================================
// Comprehensive TypeScript interfaces for the enhanced transfer system
// Supporting: Internal, External (NIBSS), Bill Payments, Scheduled, International
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.LimitExceededError = exports.InsufficientFundsError = exports.ValidationError = exports.TransferError = void 0;
// ============================================================================
// ERROR TYPES
// ============================================================================
class TransferError extends Error {
    constructor(code, message, details, retryable = false) {
        super(message);
        this.code = code;
        this.details = details;
        this.retryable = retryable;
        this.name = 'TransferError';
    }
}
exports.TransferError = TransferError;
class ValidationError extends TransferError {
    constructor(message, field, details) {
        super('VALIDATION_ERROR', message, details, false);
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class InsufficientFundsError extends TransferError {
    constructor(available, required) {
        super('INSUFFICIENT_FUNDS', `Insufficient funds. Available: ${available}, Required: ${required}`, { available, required }, false);
        this.name = 'InsufficientFundsError';
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
class LimitExceededError extends TransferError {
    constructor(limitType, limit, attempted) {
        super('LIMIT_EXCEEDED', `${limitType} limit exceeded. Limit: ${limit}, Attempted: ${attempted}`, { limitType, limit, attempted }, false);
        this.name = 'LimitExceededError';
    }
}
exports.LimitExceededError = LimitExceededError;
class ExternalServiceError extends TransferError {
    constructor(service, message, details) {
        super('EXTERNAL_SERVICE_ERROR', `External service error (${service}): ${message}`, { service, ...details }, true);
        this.name = 'ExternalServiceError';
    }
}
exports.ExternalServiceError = ExternalServiceError;
//# sourceMappingURL=transfers.js.map