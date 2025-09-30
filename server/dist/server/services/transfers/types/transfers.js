"use strict";
// ============================================================================
// MONEY TRANSFERS & PAYMENTS TYPE DEFINITIONS
// ============================================================================
// Comprehensive TypeScript interfaces for the enhanced transfer system
// Supporting: Internal, External (NIBSS), Bill Payments, Scheduled, International
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalServiceError = exports.LimitExceededError = exports.InsufficientFundsError = exports.ValidationError = exports.TransferError = void 0;
// ============================================================================
// ERROR TYPES
// ============================================================================
var TransferError = /** @class */ (function (_super) {
    __extends(TransferError, _super);
    function TransferError(code, message, details, retryable) {
        if (retryable === void 0) { retryable = false; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.details = details;
        _this.retryable = retryable;
        _this.name = 'TransferError';
        return _this;
    }
    return TransferError;
}(Error));
exports.TransferError = TransferError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, field, details) {
        var _this = _super.call(this, 'VALIDATION_ERROR', message, details, false) || this;
        _this.field = field;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(TransferError));
exports.ValidationError = ValidationError;
var InsufficientFundsError = /** @class */ (function (_super) {
    __extends(InsufficientFundsError, _super);
    function InsufficientFundsError(available, required) {
        var _this = _super.call(this, 'INSUFFICIENT_FUNDS', "Insufficient funds. Available: ".concat(available, ", Required: ").concat(required), { available: available, required: required }, false) || this;
        _this.name = 'InsufficientFundsError';
        return _this;
    }
    return InsufficientFundsError;
}(TransferError));
exports.InsufficientFundsError = InsufficientFundsError;
var LimitExceededError = /** @class */ (function (_super) {
    __extends(LimitExceededError, _super);
    function LimitExceededError(limitType, limit, attempted) {
        var _this = _super.call(this, 'LIMIT_EXCEEDED', "".concat(limitType, " limit exceeded. Limit: ").concat(limit, ", Attempted: ").concat(attempted), { limitType: limitType, limit: limit, attempted: attempted }, false) || this;
        _this.name = 'LimitExceededError';
        return _this;
    }
    return LimitExceededError;
}(TransferError));
exports.LimitExceededError = LimitExceededError;
var ExternalServiceError = /** @class */ (function (_super) {
    __extends(ExternalServiceError, _super);
    function ExternalServiceError(service, message, details) {
        var _this = _super.call(this, 'EXTERNAL_SERVICE_ERROR', "External service error (".concat(service, "): ").concat(message), __assign({ service: service }, details), true) || this;
        _this.name = 'ExternalServiceError';
        return _this;
    }
    return ExternalServiceError;
}(TransferError));
exports.ExternalServiceError = ExternalServiceError;
