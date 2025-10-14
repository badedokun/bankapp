"use strict";
// ============================================================================
// INTERNAL TRANSFERS SERVICE
// ============================================================================
// Same-bank instant transfers with real-time processing and balance updates
// Features: Instant settlement, transaction limits, dual authorization, audit trail
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalTransferService = void 0;
var transfers_1 = require("../../types/transfers");
var InternalTransferService = /** @class */ (function () {
    function InternalTransferService(db) {
        this.db = db;
    }
    /**
     * Process an internal transfer between wallets within the same tenant
     */
    InternalTransferService.prototype.processTransfer = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var client, validation, _a, fromWallet, toWallet, customer, reference, _b, transferId, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.db.connect()];
                    case 1:
                        client = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 14, 16, 17]);
                        return [4 /*yield*/, client.query('BEGIN')];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, this.validateTransfer({
                                customerId: '', // Will be determined from wallet
                                walletId: request.fromWalletId,
                                amount: request.amount,
                                transferType: 'internal'
                            })];
                    case 4:
                        validation = _c.sent();
                        if (!validation.isValid) {
                            throw new transfers_1.ValidationError(validation.validationErrors.join(', '));
                        }
                        return [4 /*yield*/, this.getWalletDetails(client, request.fromWalletId, request.toWalletId)];
                    case 5:
                        _a = _c.sent(), fromWallet = _a.fromWallet, toWallet = _a.toWallet, customer = _a.customer;
                        // Step 3: Validate tenant isolation (both wallets must be in same tenant)
                        if (fromWallet.tenant_id !== toWallet.tenant_id) {
                            throw new transfers_1.ValidationError('Cross-tenant transfers are not allowed');
                        }
                        // Step 4: Check balance and limits
                        return [4 /*yield*/, this.validateBalanceAndLimits(client, fromWallet, request.amount)];
                    case 6:
                        // Step 4: Check balance and limits
                        _c.sent();
                        _b = request.reference;
                        if (_b) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.generateTransferReference()];
                    case 7:
                        _b = (_c.sent());
                        _c.label = 8;
                    case 8:
                        reference = _b;
                        return [4 /*yield*/, this.createTransferRecord(client, {
                                fromWallet: fromWallet,
                                toWallet: toWallet,
                                customer: customer,
                                request: request,
                                reference: reference
                            })];
                    case 9:
                        transferId = _c.sent();
                        // Step 7: Execute the transfer (update balances)
                        return [4 /*yield*/, this.executeTransfer(client, {
                                fromWalletId: request.fromWalletId,
                                toWalletId: request.toWalletId,
                                amount: request.amount,
                                transferId: transferId,
                                reference: reference
                            })];
                    case 10:
                        // Step 7: Execute the transfer (update balances)
                        _c.sent();
                        // Step 8: Update daily transfer tracking
                        return [4 /*yield*/, this.updateTransferTracking(client, fromWallet.id, request.amount)];
                    case 11:
                        // Step 8: Update daily transfer tracking
                        _c.sent();
                        // Step 9: Create audit trail
                        return [4 /*yield*/, this.createAuditTrail(client, {
                                transferId: transferId,
                                customerId: customer.id,
                                action: 'INTERNAL_TRANSFER_COMPLETED',
                                details: {
                                    fromWallet: fromWallet.wallet_name,
                                    toWallet: toWallet.wallet_name,
                                    amount: request.amount,
                                    reference: reference
                                }
                            })];
                    case 12:
                        // Step 9: Create audit trail
                        _c.sent();
                        return [4 /*yield*/, client.query('COMMIT')];
                    case 13:
                        _c.sent();
                        return [2 /*return*/, {
                                success: true,
                                transactionId: transferId,
                                reference: reference,
                                status: 'completed',
                                message: 'Internal transfer completed successfully',
                                data: {
                                    fromWallet: fromWallet.wallet_name,
                                    toWallet: toWallet.wallet_name,
                                    amount: request.amount,
                                    fees: 0, // Internal transfers are typically free
                                    completedAt: new Date()
                                }
                            }];
                    case 14:
                        error_1 = _c.sent();
                        return [4 /*yield*/, client.query('ROLLBACK')];
                    case 15:
                        _c.sent();
                        if (error_1 instanceof transfers_1.TransferError) {
                            throw error_1;
                        }
                        throw new transfers_1.TransferError('TRANSFER_PROCESSING_ERROR', "Failed to process internal transfer: ".concat(error_1.message), error_1, true);
                    case 16:
                        client.release();
                        return [7 /*endfinally*/];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate transfer request and check limits
     */
    InternalTransferService.prototype.validateTransfer = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var client, validationErrors, walletQuery, walletResult, wallet, dailyQuery, dailyResult, dailyUsed, dailyLimit, dailyRemaining, monthlyQuery, monthlyResult, monthlyUsed, monthlyLimit, monthlyRemaining, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, 7, 8]);
                        validationErrors = [];
                        // Basic amount validation
                        if (request.amount <= 0) {
                            validationErrors.push('Transfer amount must be greater than zero');
                        }
                        walletQuery = "\n                SELECT w.*, u.id as user_id, u.tenant_id\n                FROM tenant.wallets w\n                JOIN tenant.users u ON w.user_id = u.id\n                WHERE w.id = $1 AND w.status = 'active'\n            ";
                        return [4 /*yield*/, client.query(walletQuery, [request.walletId])];
                    case 3:
                        walletResult = _a.sent();
                        if (walletResult.rows.length === 0) {
                            validationErrors.push('Source wallet not found or inactive');
                            return [2 /*return*/, {
                                    isValid: false,
                                    validationErrors: validationErrors,
                                    availableBalance: 0,
                                    dailyLimitRemaining: 0,
                                    monthlyLimitRemaining: 0
                                }];
                        }
                        wallet = walletResult.rows[0];
                        // Check available balance
                        if (wallet.available_balance < request.amount) {
                            validationErrors.push('Insufficient available balance');
                        }
                        dailyQuery = "\n                SELECT COALESCE(SUM(amount), 0) as daily_used\n                FROM tenant.internal_transfers\n                WHERE from_wallet_id = $1\n                AND status = 'completed'\n                AND created_at >= CURRENT_DATE\n            ";
                        return [4 /*yield*/, client.query(dailyQuery, [wallet.id])];
                    case 4:
                        dailyResult = _a.sent();
                        dailyUsed = parseFloat(dailyResult.rows[0].daily_used);
                        dailyLimit = parseFloat(wallet.daily_limit) || 500000;
                        dailyRemaining = dailyLimit - dailyUsed;
                        if (request.amount > dailyRemaining) {
                            validationErrors.push("Daily transfer limit exceeded. Remaining: \u20A6".concat(dailyRemaining.toLocaleString()));
                        }
                        monthlyQuery = "\n                SELECT COALESCE(SUM(amount), 0) as monthly_used\n                FROM tenant.internal_transfers\n                WHERE from_wallet_id = $1\n                AND status = 'completed'\n                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)\n            ";
                        return [4 /*yield*/, client.query(monthlyQuery, [wallet.id])];
                    case 5:
                        monthlyResult = _a.sent();
                        monthlyUsed = parseFloat(monthlyResult.rows[0].monthly_used);
                        monthlyLimit = parseFloat(wallet.monthly_limit) || 5000000;
                        monthlyRemaining = monthlyLimit - monthlyUsed;
                        if (request.amount > monthlyRemaining) {
                            validationErrors.push("Monthly transfer limit exceeded. Remaining: \u20A6".concat(monthlyRemaining.toLocaleString()));
                        }
                        return [2 /*return*/, {
                                isValid: validationErrors.length === 0,
                                validationErrors: validationErrors,
                                availableBalance: parseFloat(wallet.available_balance),
                                dailyLimitRemaining: dailyRemaining,
                                monthlyLimitRemaining: monthlyRemaining,
                                suggestedActions: validationErrors.length > 0 ? [
                                    'Consider transferring a smaller amount',
                                    'Wait for daily limits to reset',
                                    'Contact support to increase limits'
                                ] : undefined
                            }];
                    case 6:
                        error_2 = _a.sent();
                        throw new transfers_1.TransferError('VALIDATION_ERROR', "Failed to validate transfer: ".concat(error_2.message), error_2);
                    case 7:
                        client.release();
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get transfer status
     */
    InternalTransferService.prototype.getTransferStatus = function (transactionId) {
        return __awaiter(this, void 0, void 0, function () {
            var client, query, result, transfer, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, 5, 6]);
                        query = "\n                SELECT it.*,\n                       fw.wallet_name as from_wallet_name,\n                       tw.wallet_name as to_wallet_name,\n                       CONCAT(u.first_name, ' ', u.last_name) as customer_name\n                FROM tenant.internal_transfers it\n                JOIN tenant.wallets fw ON it.from_wallet_id = fw.id\n                JOIN tenant.wallets tw ON it.to_wallet_id = tw.id\n                JOIN tenant.users u ON it.user_id = u.id\n                WHERE it.id = $1\n            ";
                        return [4 /*yield*/, client.query(query, [transactionId])];
                    case 3:
                        result = _a.sent();
                        if (result.rows.length === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    status: 'failed',
                                    message: 'Transfer not found',
                                    errors: ['Transaction not found']
                                }];
                        }
                        transfer = result.rows[0];
                        return [2 /*return*/, {
                                success: true,
                                transactionId: transfer.id,
                                reference: transfer.reference,
                                status: transfer.status,
                                message: "Transfer is ".concat(transfer.status),
                                data: {
                                    fromWallet: transfer.from_wallet_name,
                                    toWallet: transfer.to_wallet_name,
                                    amount: parseFloat(transfer.amount),
                                    description: transfer.description,
                                    createdAt: transfer.created_at,
                                    customerName: transfer.customer_name
                                }
                            }];
                    case 4:
                        error_3 = _a.sent();
                        throw new transfers_1.TransferError('STATUS_CHECK_ERROR', "Failed to get transfer status: ".concat(error_3.message), error_3);
                    case 5:
                        client.release();
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancel transfer (only pending transfers can be cancelled)
     */
    InternalTransferService.prototype.cancelTransfer = function (transactionId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var client, checkQuery, checkResult, transfer, updateQuery, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.connect()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, 9, 10]);
                        return [4 /*yield*/, client.query('BEGIN')];
                    case 3:
                        _a.sent();
                        checkQuery = "\n                SELECT * FROM tenant.internal_transfers\n                WHERE id = $1 AND status = 'pending'\n            ";
                        return [4 /*yield*/, client.query(checkQuery, [transactionId])];
                    case 4:
                        checkResult = _a.sent();
                        if (checkResult.rows.length === 0) {
                            throw new transfers_1.ValidationError('Transfer not found or cannot be cancelled');
                        }
                        transfer = checkResult.rows[0];
                        updateQuery = "\n                UPDATE tenant.internal_transfers\n                SET status = 'cancelled', description = $2\n                WHERE id = $1\n            ";
                        return [4 /*yield*/, client.query(updateQuery, [transactionId, "".concat(transfer.description, " - Cancelled: ").concat(reason)])];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, client.query('COMMIT')];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                transactionId: transactionId,
                                status: 'cancelled',
                                message: 'Transfer cancelled successfully'
                            }];
                    case 7:
                        error_4 = _a.sent();
                        return [4 /*yield*/, client.query('ROLLBACK')];
                    case 8:
                        _a.sent();
                        throw error_4;
                    case 9:
                        client.release();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retry transfer (not applicable for internal transfers as they're instant)
     */
    InternalTransferService.prototype.retryTransfer = function (transactionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new transfers_1.ValidationError('Internal transfers are processed instantly and cannot be retried');
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    InternalTransferService.prototype.getWalletDetails = function (client, fromWalletId, toWalletId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, fromWallet, toWallet, customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n            SELECT w.*, u.id as user_id,\n                   CONCAT(u.first_name, ' ', u.last_name) as full_name,\n                   u.tenant_id\n            FROM tenant.wallets w\n            JOIN tenant.users u ON w.user_id = u.id\n            WHERE w.id = ANY($1) AND w.status = 'active'\n        ";
                        return [4 /*yield*/, client.query(query, [[fromWalletId, toWalletId]])];
                    case 1:
                        result = _a.sent();
                        if (result.rows.length !== 2) {
                            throw new transfers_1.ValidationError('One or both wallets not found or inactive');
                        }
                        fromWallet = result.rows.find(function (w) { return w.id === fromWalletId; });
                        toWallet = result.rows.find(function (w) { return w.id === toWalletId; });
                        if (!fromWallet || !toWallet) {
                            throw new transfers_1.ValidationError('Wallet configuration error');
                        }
                        customer = result.rows.find(function (w) { return w.id === fromWalletId; });
                        return [2 /*return*/, { fromWallet: fromWallet, toWallet: toWallet, customer: customer }];
                }
            });
        });
    };
    InternalTransferService.prototype.validateBalanceAndLimits = function (client, wallet, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var today, dailyUsed, dailyLimit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check available balance
                        if (parseFloat(wallet.available_balance) < amount) {
                            throw new transfers_1.InsufficientFundsError(parseFloat(wallet.available_balance), amount);
                        }
                        today = new Date().toISOString().split('T')[0];
                        if (!(wallet.last_transfer_reset_date !== today)) return [3 /*break*/, 2];
                        return [4 /*yield*/, client.query("\n                UPDATE tenant.wallets\n                SET daily_transfer_count = 0,\n                    daily_transfer_amount = 0,\n                    last_transfer_reset_date = CURRENT_DATE\n                WHERE id = $1\n            ", [wallet.id])];
                    case 1:
                        _a.sent();
                        wallet.daily_transfer_amount = 0;
                        wallet.daily_transfer_count = 0;
                        _a.label = 2;
                    case 2:
                        dailyUsed = parseFloat(wallet.daily_transfer_amount || 0);
                        dailyLimit = parseFloat(wallet.daily_transfer_limit || 100000);
                        if (dailyUsed + amount > dailyLimit) {
                            throw new transfers_1.LimitExceededError('Daily transfer amount', dailyLimit, dailyUsed + amount);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    InternalTransferService.prototype.generateTransferReference = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, random;
            return __generator(this, function (_a) {
                timestamp = Date.now();
                random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                return [2 /*return*/, "INT-".concat(timestamp, "-").concat(random)];
            });
        });
    };
    InternalTransferService.prototype.createTransferRecord = function (client, data) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n            INSERT INTO tenant.internal_transfers (\n                user_id, from_wallet_id, to_wallet_id, reference, amount,\n                description, status, created_at\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())\n            RETURNING id\n        ";
                        values = [
                            data.customer.user_id,
                            data.request.fromWalletId,
                            data.request.toWalletId,
                            data.reference,
                            data.request.amount,
                            data.request.narration,
                            'completed' // Internal transfers are instant
                        ];
                        return [4 /*yield*/, client.query(query, values)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows[0].id];
                }
            });
        });
    };
    InternalTransferService.prototype.executeTransfer = function (client, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Debit from source wallet
                    return [4 /*yield*/, client.query("\n            UPDATE tenant.wallets\n            SET available_balance = available_balance - $1,\n                ledger_balance = ledger_balance - $1,\n                updated_at = NOW()\n            WHERE id = $2\n        ", [data.amount, data.fromWalletId])];
                    case 1:
                        // Debit from source wallet
                        _a.sent();
                        // Credit to destination wallet
                        return [4 /*yield*/, client.query("\n            UPDATE tenant.wallets\n            SET available_balance = available_balance + $1,\n                ledger_balance = ledger_balance + $1,\n                updated_at = NOW()\n            WHERE id = $2\n        ", [data.amount, data.toWalletId])];
                    case 2:
                        // Credit to destination wallet
                        _a.sent();
                        // Log transaction details for both wallets
                        return [4 /*yield*/, this.logWalletTransaction(client, {
                                walletId: data.fromWalletId,
                                type: 'debit',
                                amount: data.amount,
                                reference: data.reference,
                                description: "Internal transfer to wallet",
                                transferId: data.transferId
                            })];
                    case 3:
                        // Log transaction details for both wallets
                        _a.sent();
                        return [4 /*yield*/, this.logWalletTransaction(client, {
                                walletId: data.toWalletId,
                                type: 'credit',
                                amount: data.amount,
                                reference: data.reference,
                                description: "Internal transfer from wallet",
                                transferId: data.transferId
                            })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InternalTransferService.prototype.updateTransferTracking = function (client, walletId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client.query("\n            UPDATE tenant.wallets\n            SET daily_transfer_count = daily_transfer_count + 1,\n                daily_transfer_amount = daily_transfer_amount + $1\n            WHERE id = $2\n        ", [amount, walletId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InternalTransferService.prototype.logWalletTransaction = function (client, data) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n            INSERT INTO tenant.wallet_transactions (\n                wallet_id, transaction_type, amount, reference,\n                description, transfer_id, created_at\n            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())\n        ";
                        // Create wallet_transactions table if it doesn't exist
                        return [4 /*yield*/, client.query("\n            CREATE TABLE IF NOT EXISTS tenant.wallet_transactions (\n                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n                wallet_id UUID NOT NULL REFERENCES tenant.wallets(id),\n                transaction_type VARCHAR(20) NOT NULL,\n                amount DECIMAL(15,2) NOT NULL,\n                reference VARCHAR(100) NOT NULL,\n                description TEXT,\n                transfer_id UUID,\n                created_at TIMESTAMP DEFAULT NOW()\n            )\n        ")];
                    case 1:
                        // Create wallet_transactions table if it doesn't exist
                        _a.sent();
                        return [4 /*yield*/, client.query(query, [
                                data.walletId,
                                data.type,
                                data.amount,
                                data.reference,
                                data.description,
                                data.transferId
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    InternalTransferService.prototype.createAuditTrail = function (client, data) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n            INSERT INTO tenant.user_activity_logs (\n                user_id, activity_type, description, metadata, created_at\n            ) VALUES ($1, $2, $3, $4, NOW())\n        ";
                        return [4 /*yield*/, client.query(query, [
                                data.customerId,
                                data.action,
                                "Internal transfer completed: ".concat(data.details.amount, " from ").concat(data.details.fromWallet, " to ").concat(data.details.toWallet),
                                JSON.stringify(data.details)
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user's internal transfers history
     */
    InternalTransferService.prototype.getTransferHistory = function (customerId_1) {
        return __awaiter(this, arguments, void 0, function (customerId, options) {
            var client, _a, page, _b, limit, status_1, startDate, endDate, offset, whereClause, queryParams, paramIndex, query, result, countQuery, countResult, total, error_5;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.db.connect()];
                    case 1:
                        client = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, 6, 7]);
                        _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.limit, limit = _b === void 0 ? 20 : _b, status_1 = options.status, startDate = options.startDate, endDate = options.endDate;
                        offset = (page - 1) * limit;
                        whereClause = 'WHERE it.user_id = $1';
                        queryParams = [customerId];
                        paramIndex = 2;
                        if (status_1) {
                            whereClause += " AND it.status = $".concat(paramIndex);
                            queryParams.push(status_1);
                            paramIndex++;
                        }
                        if (startDate) {
                            whereClause += " AND it.created_at >= $".concat(paramIndex);
                            queryParams.push(startDate);
                            paramIndex++;
                        }
                        if (endDate) {
                            whereClause += " AND it.created_at <= $".concat(paramIndex);
                            queryParams.push(endDate);
                            paramIndex++;
                        }
                        query = "\n                SELECT it.*,\n                       fw.wallet_name as from_wallet_name,\n                       tw.wallet_name as to_wallet_name\n                FROM tenant.internal_transfers it\n                JOIN tenant.wallets fw ON it.from_wallet_id = fw.id\n                JOIN tenant.wallets tw ON it.to_wallet_id = tw.id\n                ".concat(whereClause, "\n                ORDER BY it.created_at DESC\n                LIMIT $").concat(paramIndex, " OFFSET $").concat(paramIndex + 1, "\n            ");
                        queryParams.push(limit, offset);
                        return [4 /*yield*/, client.query(query, queryParams)];
                    case 3:
                        result = _c.sent();
                        countQuery = "\n                SELECT COUNT(*) as total\n                FROM tenant.internal_transfers it\n                ".concat(whereClause.replace(/LIMIT.*/, ''), "\n            ");
                        return [4 /*yield*/, client.query(countQuery, queryParams.slice(0, -2))];
                    case 4:
                        countResult = _c.sent();
                        total = parseInt(countResult.rows[0].total);
                        return [2 /*return*/, {
                                data: result.rows.map(function (transfer) { return ({
                                    id: transfer.id,
                                    reference: transfer.reference,
                                    amount: parseFloat(transfer.amount),
                                    fromWallet: transfer.from_wallet_name,
                                    toWallet: transfer.to_wallet_name,
                                    description: transfer.description,
                                    status: transfer.status,
                                    createdAt: transfer.created_at
                                }); }),
                                pagination: {
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    totalPages: Math.ceil(total / limit),
                                    hasNext: page * limit < total,
                                    hasPrev: page > 1
                                }
                            }];
                    case 5:
                        error_5 = _c.sent();
                        throw new transfers_1.TransferError('HISTORY_FETCH_ERROR', "Failed to fetch transfer history: ".concat(error_5.message), error_5);
                    case 6:
                        client.release();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return InternalTransferService;
}());
exports.InternalTransferService = InternalTransferService;
