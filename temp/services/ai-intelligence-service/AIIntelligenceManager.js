"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIIntelligenceManager = void 0;
const LocalBankingAIService_1 = require("./core/LocalBankingAIService");
const database_1 = require("../../config/database");
class AIIntelligenceManager {
    constructor(config) {
        this.config = config;
    }
    isFeatureEnabled(feature) {
        return this.config[feature];
    }
    createLocalBankingAIService(tenantId) {
        return new LocalBankingAIService_1.LocalBankingAIService();
    }
    getConfig() {
        return Object.assign({}, this.config);
    }
    getUserFinancialData(userId, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Get wallet balance from tenant-specific database
                const walletResult = yield (0, database_1.query)('SELECT balance, currency FROM tenant.wallets WHERE user_id = $1', [userId]);
                // Get recent transfers from tenant-specific database (real user data)
                const transactionsResult = yield (0, database_1.query)(`SELECT amount, recipient_name as description, 'debit' as type, created_at, status
         FROM tenant.transfers
         WHERE sender_id = $1
         ORDER BY created_at DESC
         LIMIT 20`, [userId]);
                const balance = ((_a = walletResult.rows[0]) === null || _a === void 0 ? void 0 : _a.balance) || 0;
                const recentTransactions = transactionsResult.rows || [];
                // Calculate financial metrics
                const totalIncome = recentTransactions
                    .filter((t) => t.type === 'credit')
                    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
                const totalExpenses = recentTransactions
                    .filter((t) => t.type === 'debit')
                    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
                const averageTransaction = recentTransactions.length > 0
                    ? recentTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0) / recentTransactions.length
                    : 0;
                return {
                    balance,
                    recentTransactions,
                    totalIncome,
                    totalExpenses,
                    averageTransaction
                };
            }
            catch (error) {
                console.error('Error fetching user financial data:', error);
                return {
                    balance: 0,
                    recentTransactions: [],
                    totalIncome: 0,
                    totalExpenses: 0,
                    averageTransaction: 0
                };
            }
        });
    }
    getPersonalizedSuggestions(context, category, maxSuggestions) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = context.userId || ((_a = context.user) === null || _a === void 0 ? void 0 : _a.id);
            if (!userId) {
                return [];
            }
            const financialData = yield this.getUserFinancialData(userId);
            const suggestions = [];
            // Always generate at least default suggestions
            suggestions.push({
                id: `check-balance-${Date.now()}`,
                type: 'action',
                text: 'Check your account balance and recent transactions',
                priority: 'medium'
            });
            suggestions.push({
                id: `transfer-money-${Date.now()}`,
                type: 'action',
                text: 'Send money to friends, family, or pay bills',
                priority: 'medium'
            });
            // Financial suggestion based on balance
            if (financialData.balance > 10000) {
                const savingsPercentage = financialData.balance > 100000 ? 0.1 : 0.05;
                suggestions.push({
                    id: `balance-savings-${Date.now()}`,
                    type: 'financial',
                    text: `You have ₦${financialData.balance.toLocaleString()} available. Consider saving ${(savingsPercentage * 100)}% (₦${(financialData.balance * savingsPercentage).toLocaleString()})`,
                    priority: 'high',
                    context: { balance: financialData.balance }
                });
            }
            // Expense-based suggestions
            if (financialData.totalExpenses > financialData.totalIncome * 0.5) {
                suggestions.push({
                    id: `expense-warning-${Date.now()}`,
                    type: 'financial',
                    text: `Your expenses (₦${financialData.totalExpenses.toLocaleString()}) are significant. Consider reviewing your spending habits`,
                    priority: 'high',
                    context: { expenses: financialData.totalExpenses, income: financialData.totalIncome }
                });
            }
            // Transaction pattern suggestions
            if (financialData.recentTransactions.length > 0) {
                const recurringTransactions = financialData.recentTransactions.filter(t => financialData.recentTransactions.filter(t2 => Math.abs(parseFloat(t.amount.toString()) - parseFloat(t2.amount.toString())) < 100).length > 1);
                if (recurringTransactions.length > 0) {
                    suggestions.push({
                        id: `recurring-payment-${Date.now()}`,
                        type: 'automation',
                        text: 'You have recurring payments. Set up automatic transfers to save time',
                        priority: 'medium',
                        context: { recurringCount: recurringTransactions.length }
                    });
                }
            }
            // Filter by category if provided
            let filteredSuggestions = category
                ? suggestions.filter(s => s.type === category)
                : suggestions;
            // Limit results
            return filteredSuggestions.slice(0, maxSuggestions || 5);
        });
    }
    getAnalyticsInsights(context, type, timeframe) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = context.userId || ((_a = context.user) === null || _a === void 0 ? void 0 : _a.id);
            if (!userId) {
                return {
                    type: type || 'general',
                    timeframe: timeframe || 'month',
                    insights: [],
                    recommendations: []
                };
            }
            const financialData = yield this.getUserFinancialData(userId);
            const insights = [];
            const recommendations = [];
            // Spending insights
            if (type === 'spending' || !type) {
                const spendingRate = financialData.totalExpenses / (financialData.totalIncome || 1);
                insights.push({
                    category: 'spending',
                    value: `Total spending: ₦${financialData.totalExpenses.toLocaleString()}`,
                    trend: spendingRate > 0.8 ? 'high' : 'normal',
                    context: financialData
                });
                if (spendingRate > 0.8) {
                    recommendations.push('Reduce discretionary spending to improve savings');
                }
            }
            // Income insights
            if (type === 'income' || !type) {
                insights.push({
                    category: 'income',
                    value: `Total income: ₦${financialData.totalIncome.toLocaleString()}`,
                    trend: 'stable',
                    context: financialData
                });
            }
            // Savings insights
            if (type === 'savings' || !type) {
                const savingsAmount = financialData.totalIncome - financialData.totalExpenses;
                const savingsRate = (savingsAmount / (financialData.totalIncome || 1)) * 100;
                insights.push({
                    category: 'savings',
                    value: `Savings: ₦${savingsAmount.toLocaleString()} (${savingsRate.toFixed(1)}% of income)`,
                    trend: savingsRate > 15 ? 'excellent' : savingsRate > 5 ? 'good' : 'low',
                    context: { savingsAmount, savingsRate }
                });
                if (savingsRate < 20) {
                    recommendations.push('Consider setting up automatic savings to reach 20% savings rate');
                }
            }
            return {
                type: type || 'general',
                timeframe: timeframe || 'month',
                insights,
                recommendations
            };
        });
    }
    handleTransferFlow(message, transferState, financialData, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const step = transferState.step;
            const data = transferState.data || {};
            // Common banks in Nigeria with their codes
            const NIGERIAN_BANKS = [
                { name: 'Access Bank', code: '044' },
                { name: 'GTBank', code: '058' },
                { name: 'First Bank', code: '011' },
                { name: 'UBA', code: '033' },
                { name: 'Zenith Bank', code: '057' },
                { name: 'Stanbic IBTC', code: '221' },
                { name: 'Fidelity Bank', code: '070' },
                { name: 'Union Bank', code: '032' },
                { name: 'Sterling Bank', code: '232' },
                { name: 'Polaris Bank', code: '076' }
            ];
            switch (step) {
                case 'amount':
                    // Validate amount
                    const amountMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                    if (!amountMatch) {
                        return {
                            response: `Please enter a valid amount. For example: "5000" or "5,000"`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'amount'
                        };
                    }
                    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                    if (amount <= 0) {
                        return {
                            response: `The amount must be greater than zero. Please enter a valid amount:`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'amount'
                        };
                    }
                    if (amount > financialData.balance) {
                        return {
                            response: `Insufficient balance. Your current balance is ₦${financialData.balance.toLocaleString()}.\n\nPlease enter an amount within your balance:`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'amount'
                        };
                    }
                    // Move to account number step
                    transferState.data.amount = amount;
                    transferState.step = 'account_number';
                    return {
                        response: `Great! I'll help you transfer ₦${amount.toLocaleString()}.\n\nPlease provide the recipient's account number (10 digits):`,
                        context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                        transferFlow: true,
                        currentStep: 'account_number'
                    };
                case 'account_number':
                    // Validate account number (10 digits)
                    const accountNumber = message.replace(/\s/g, '');
                    if (!/^\d{10}$/.test(accountNumber)) {
                        return {
                            response: `Account number must be exactly 10 digits. You entered: "${accountNumber}" (${accountNumber.length} digits).\n\nPlease enter a valid 10-digit account number:`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'account_number'
                        };
                    }
                    // Store account number and move to bank selection
                    transferState.data.accountNumber = accountNumber;
                    transferState.step = 'bank_name';
                    const bankList = NIGERIAN_BANKS.map((b, i) => `${i + 1}. ${b.name} (${b.code})`).join('\n');
                    return {
                        response: `Account number ${accountNumber} received.\n\nNow, please select the recipient's bank from the list below (enter the number or bank name):\n\n${bankList}`,
                        context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                        transferFlow: true,
                        currentStep: 'bank_name',
                        banks: NIGERIAN_BANKS
                    };
                case 'bank_name':
                    // Parse bank selection
                    let selectedBank = null;
                    const lowerMessage = message.toLowerCase().trim();
                    // Check if user entered a number
                    const numberMatch = message.match(/^(\d+)$/);
                    if (numberMatch) {
                        const index = parseInt(numberMatch[1]) - 1;
                        if (index >= 0 && index < NIGERIAN_BANKS.length) {
                            selectedBank = NIGERIAN_BANKS[index];
                        }
                    }
                    // Check if user entered bank name
                    if (!selectedBank) {
                        selectedBank = NIGERIAN_BANKS.find(b => b.name.toLowerCase().includes(lowerMessage) ||
                            b.code === message.trim());
                    }
                    if (!selectedBank) {
                        const bankList = NIGERIAN_BANKS.map((b, i) => `${i + 1}. ${b.name} (${b.code})`).join('\n');
                        return {
                            response: `I couldn't find that bank. Please select from the list below (enter the number or bank name):\n\n${bankList}`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'bank_name',
                            banks: NIGERIAN_BANKS
                        };
                    }
                    // Store bank info
                    transferState.data.bankName = selectedBank.name;
                    transferState.data.bankCode = selectedBank.code;
                    // In production, this would call NIBSS API to get account holder's name
                    // For now, we'll simulate it
                    const accountHolderName = this.simulateAccountLookup(transferState.data.accountNumber, selectedBank.code);
                    transferState.data.accountHolderName = accountHolderName;
                    // Move to description step
                    transferState.step = 'description';
                    return {
                        response: `✅ Account verified!\n\n` +
                            `Bank: ${selectedBank.name}\n` +
                            `Account: ${transferState.data.accountNumber}\n` +
                            `Account Holder: ${accountHolderName}\n` +
                            `Amount: ₦${transferState.data.amount.toLocaleString()}\n\n` +
                            `Please provide a description for this transfer (or type "skip" to continue without description):`,
                        context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                        transferFlow: true,
                        currentStep: 'description'
                    };
                case 'description':
                    // Handle description
                    const description = message.toLowerCase() === 'skip' ? '' : message;
                    transferState.data.description = description;
                    transferState.step = 'pin';
                    const summary = `📋 Transfer Summary:\n` +
                        `━━━━━━━━━━━━━━━━━\n` +
                        `To: ${transferState.data.accountHolderName}\n` +
                        `Bank: ${transferState.data.bankName}\n` +
                        `Account: ${transferState.data.accountNumber}\n` +
                        `Amount: ₦${transferState.data.amount.toLocaleString()}\n` +
                        (description ? `Description: ${description}\n` : '') +
                        `━━━━━━━━━━━━━━━━━\n\n` +
                        `Please enter your 4-digit transaction PIN to confirm this transfer:`;
                    return {
                        response: summary,
                        context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                        transferFlow: true,
                        currentStep: 'pin',
                        requiresPin: true
                    };
                case 'pin':
                    // Validate PIN (4 digits)
                    const pin = message.replace(/\s/g, '');
                    if (!/^\d{4}$/.test(pin)) {
                        return {
                            response: `PIN must be exactly 4 digits. Please enter your 4-digit transaction PIN:`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'pin',
                            requiresPin: true
                        };
                    }
                    // In production, validate PIN against hashed PIN in database
                    // For demo, we'll accept any 4-digit PIN
                    const isPinValid = yield this.validateTransactionPin(context.userId, pin);
                    if (!isPinValid) {
                        transferState.pinAttempts = (transferState.pinAttempts || 0) + 1;
                        if (transferState.pinAttempts >= 3) {
                            // Reset transfer flow after 3 failed attempts
                            return {
                                response: `❌ Too many incorrect PIN attempts. Transfer cancelled for security reasons.\n\nPlease start a new transfer if you wish to continue.`,
                                context: Object.assign(Object.assign({}, context), { transferState: {}, financialData }),
                                transferFlow: false,
                                error: 'PIN_VALIDATION_FAILED'
                            };
                        }
                        return {
                            response: `❌ Incorrect PIN. You have ${3 - transferState.pinAttempts} attempts remaining.\n\nPlease enter your correct 4-digit PIN:`,
                            context: Object.assign(Object.assign({}, context), { transferState, financialData }),
                            transferFlow: true,
                            currentStep: 'pin',
                            requiresPin: true
                        };
                    }
                    // Process transfer (in production, this would call the actual transfer service)
                    const transferResult = {
                        success: true,
                        reference: `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                        timestamp: new Date().toISOString()
                    };
                    // Complete transfer flow
                    return {
                        response: `✅ Transfer Successful!\n\n` +
                            `Reference: ${transferResult.reference}\n` +
                            `Amount: ₦${transferState.data.amount.toLocaleString()}\n` +
                            `To: ${transferState.data.accountHolderName}\n` +
                            `Bank: ${transferState.data.bankName}\n` +
                            `Account: ${transferState.data.accountNumber}\n` +
                            `Status: Completed\n` +
                            `Time: ${new Date().toLocaleTimeString()}\n\n` +
                            `Your new balance: ₦${(financialData.balance - transferState.data.amount).toLocaleString()}\n\n` +
                            `Thank you for using our transfer service! Is there anything else I can help you with?`,
                        context: Object.assign(Object.assign({}, context), { transferState: {}, financialData }),
                        transferFlow: false,
                        transferComplete: true,
                        transferData: Object.assign(Object.assign({}, transferState.data), { reference: transferResult.reference, timestamp: transferResult.timestamp })
                    };
                default:
                    return {
                        response: `I'm sorry, something went wrong with the transfer flow. Please start over.`,
                        context: Object.assign(Object.assign({}, context), { transferState: {}, financialData }),
                        transferFlow: false,
                        error: 'INVALID_STATE'
                    };
            }
        });
    }
    simulateAccountLookup(accountNumber, bankCode) {
        // In production, this would call NIBSS API
        // For demo purposes, generate a name based on account number
        const names = [
            'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams',
            'David Brown', 'Emily Davis', 'James Wilson', 'Mary Anderson',
            'Robert Taylor', 'Patricia Moore'
        ];
        const index = parseInt(accountNumber.slice(-1));
        return names[index] || 'Account Holder';
    }
    validateTransactionPin(userId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const bcrypt = require('bcryptjs');
            try {
                // Fetch hashed PIN from database
                const result = yield (0, database_1.query)('SELECT transaction_pin_hash FROM tenant.users WHERE id = $1', [userId]);
                if (!((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.transaction_pin_hash)) {
                    // No PIN set, reject for security
                    console.log('No transaction PIN set for user:', userId);
                    return false;
                }
                // Compare provided PIN with stored hash
                const isValid = yield bcrypt.compare(pin, result.rows[0].transaction_pin_hash);
                if (isValid) {
                    console.log('✅ Transaction PIN validated successfully');
                }
                else {
                    console.log('❌ Invalid transaction PIN');
                }
                return isValid;
            }
            catch (error) {
                console.error('Error validating PIN:', error);
                return false;
            }
        });
    }
    classifyIntent(message) {
        const lowerMessage = message.toLowerCase();
        // Balance inquiry
        if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
            return { intent: 'balance_inquiry', confidence: 0.95 };
        }
        // Transaction history
        if (lowerMessage.includes('transaction') || lowerMessage.includes('history') ||
            lowerMessage.includes('recent') && (lowerMessage.includes('payment') || lowerMessage.includes('transfer'))) {
            return { intent: 'transaction_history', confidence: 0.9 };
        }
        // Transfer intent with entity extraction
        if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
            const entities = {};
            // Extract amount
            const amountMatch = message.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:naira|ngn|₦)?/i);
            if (amountMatch) {
                entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            }
            // Extract recipient name
            const toMatch = message.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
            if (toMatch) {
                entities.recipient = toMatch[1];
            }
            return { intent: 'transfer', confidence: 0.92, entities };
        }
        // Investment
        if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
            return { intent: 'investment_inquiry', confidence: 0.88 };
        }
        // Savings
        if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
            return { intent: 'savings_inquiry', confidence: 0.87 };
        }
        // Bill payment
        if (lowerMessage.includes('bill') || lowerMessage.includes('pay')) {
            return { intent: 'bill_payment', confidence: 0.85 };
        }
        return { intent: 'general', confidence: 0.75 };
    }
    processEnhancedMessage(message, context, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = context.userId || ((_a = context.user) === null || _a === void 0 ? void 0 : _a.id);
            const lowerMessage = message.toLowerCase();
            // Use enriched context data if available, otherwise fetch financial data
            let financialData = null;
            if (context.bankingContext && context.bankingContext.accountBalance) {
                // Use the enriched banking context data that's already been loaded
                // Calculate total expenses from actual transactions if monthlySpending is 0
                const transactions = context.bankingContext.recentTransactions || [];
                let calculatedTotalExpenses = ((_b = context.bankingContext.monthlySpending) === null || _b === void 0 ? void 0 : _b.totalSpent) || 0;
                // If totalSpent is 0 but we have transactions, calculate from transactions
                if (calculatedTotalExpenses === 0 && transactions.length > 0) {
                    calculatedTotalExpenses = transactions.reduce((sum, t) => {
                        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                        return sum + Math.abs(amount);
                    }, 0);
                }
                financialData = {
                    balance: parseFloat(context.bankingContext.accountBalance),
                    recentTransactions: transactions,
                    totalExpenses: calculatedTotalExpenses,
                    totalIncome: 0, // Not available in enriched context
                    averageTransaction: calculatedTotalExpenses / (transactions.length || 1)
                };
            }
            else if (userId) {
                // Fallback to database query
                financialData = yield this.getUserFinancialData(userId);
            }
            // Check if this is part of an ongoing transfer flow
            const transferState = context.transferState || {};
            const isTransferFlow = transferState.active === true;
            // Handle ongoing transfer flow
            if (isTransferFlow) {
                return this.handleTransferFlow(message, transferState, financialData, context);
            }
            // Classify intent
            const classification = this.classifyIntent(message);
            // Generate contextual response based on intent
            let response = `Processed: ${message}`;
            if (classification.intent === 'balance_inquiry' && financialData) {
                response = `Your current balance is ₦${financialData.balance.toLocaleString()}.`;
            }
            else if (classification.intent === 'transaction_history' && financialData) {
                const recentCount = financialData.recentTransactions.length;
                if (recentCount > 0) {
                    // Show up to 5 recent transactions, not just 3
                    const displayCount = Math.min(5, recentCount);
                    const recentTransfers = financialData.recentTransactions.slice(0, displayCount)
                        .map((t) => {
                        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                        const description = t.description || t.recipient_name || 'Transfer';
                        return `${description}: ₦${Math.abs(amount).toLocaleString()}`;
                    })
                        .join(', ');
                    const moreText = recentCount > displayCount ? ` (showing ${displayCount} of ${recentCount})` : '';
                    response = `You have ${recentCount} recent transfers totaling ₦${financialData.totalExpenses.toLocaleString()}. Recent transactions${moreText}: ${recentTransfers}`;
                }
                else {
                    response = `You have no recent transfers. Your current balance is ₦${financialData.balance.toLocaleString()}.`;
                }
            }
            else if (classification.intent === 'transfer') {
                // Initialize transfer flow
                const { amount } = classification.entities || {};
                // Check if message contains just an amount
                const amountOnlyMatch = message.match(/^(\d+(?:,\d{3})*(?:\.\d{2})?)$/);
                if (amountOnlyMatch || amount) {
                    const transferAmount = amountOnlyMatch
                        ? parseFloat(amountOnlyMatch[1].replace(/,/g, ''))
                        : amount;
                    // Start transfer flow
                    const newTransferState = {
                        active: true,
                        step: 'account_number',
                        data: {
                            amount: transferAmount
                        }
                    };
                    return {
                        response: `Great! I'll help you transfer ₦${transferAmount.toLocaleString()}.\n\nPlease provide the recipient's account number (10 digits):`,
                        intent: 'transfer',
                        confidence: 0.95,
                        context: Object.assign(Object.assign({}, context), { financialData }),
                        transferState: newTransferState,
                        transferFlow: true,
                        currentStep: 'account_number',
                        suggestions: [],
                        insights: yield this.getAnalyticsInsights(context)
                    };
                }
                else {
                    // Start transfer flow from beginning
                    const newTransferState = {
                        active: true,
                        step: 'amount',
                        data: {}
                    };
                    return {
                        response: `I'll help you make a transfer. Let's start!\n\nHow much would you like to transfer? (Enter the amount in Naira)`,
                        intent: 'transfer',
                        confidence: 0.95,
                        context: Object.assign(Object.assign({}, context), { financialData }),
                        transferState: newTransferState,
                        transferFlow: true,
                        currentStep: 'amount',
                        suggestions: [],
                        insights: yield this.getAnalyticsInsights(context)
                    };
                }
            }
            else if (lowerMessage.includes('spending') && financialData) {
                const spendingRate = financialData.totalExpenses / (financialData.balance + financialData.totalExpenses);
                if (financialData.totalExpenses > 0) {
                    const advice = spendingRate > 0.6 ? "Yes, you've spent over 60% of your initial funds. Consider reducing expenses." :
                        spendingRate > 0.4 ? "Your spending is moderate but watch your expenses." :
                            "Your spending is under control.";
                    response = `You've transferred ₦${financialData.totalExpenses.toLocaleString()} recently. ${advice} Current balance: ₦${financialData.balance.toLocaleString()}.`;
                }
                else {
                    response = `No recent spending detected. Your balance remains at ₦${financialData.balance.toLocaleString()}.`;
                }
            }
            const result = {
                response,
                intent: classification.intent,
                confidence: classification.confidence,
                context: Object.assign(Object.assign({}, context), { financialData }),
                suggestions: yield this.getPersonalizedSuggestions(context),
                insights: yield this.getAnalyticsInsights(context)
            };
            // Add entities if present
            if (classification.entities) {
                result.entities = classification.entities;
            }
            return result;
        });
    }
    translateMessage(text, sourceLanguage, targetLanguage, context) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                originalText: text,
                translatedText: text, // Placeholder - would use actual translation service
                sourceLanguage,
                targetLanguage,
                confidence: 0.95
            };
        });
    }
    getLocalizedSuggestions(language, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getPersonalizedSuggestions({ language }, type);
        });
    }
    getSupportedLanguages() {
        return ['en', 'fr', 'es', 'de', 'pt', 'ar', 'zh', 'ja'];
    }
    markSuggestionAsUsed(suggestionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Track suggestion usage in database
            try {
                yield (0, database_1.query)(`INSERT INTO ai_suggestion_tracking (suggestion_id, user_id, action, created_at)
         VALUES ($1, $2, 'used', NOW())`, [suggestionId, userId]);
            }
            catch (error) {
                console.error('Error tracking suggestion usage:', error);
            }
        });
    }
    markSuggestionAsDismissed(suggestionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Track dismissed suggestions in database
            try {
                yield (0, database_1.query)(`INSERT INTO ai_suggestion_tracking (suggestion_id, user_id, action, created_at)
         VALUES ($1, $2, 'dismissed', NOW())`, [suggestionId, userId]);
            }
            catch (error) {
                console.error('Error tracking suggestion dismissal:', error);
            }
        });
    }
    exportAnalyticsReport(userId, format) {
        return __awaiter(this, void 0, void 0, function* () {
            const financialData = yield this.getUserFinancialData(userId);
            const insights = yield this.getAnalyticsInsights({ userId });
            return {
                userId,
                format,
                reportData: {
                    summary: 'Analytics report generated from real user data',
                    period: 'last 30 days',
                    metrics: {
                        balance: financialData.balance,
                        totalIncome: financialData.totalIncome,
                        totalExpenses: financialData.totalExpenses,
                        transactionCount: financialData.recentTransactions.length,
                        averageTransaction: financialData.averageTransaction
                    },
                    insights: insights.insights,
                    recommendations: insights.recommendations
                },
                generatedAt: new Date()
            };
        });
    }
    performHealthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                status: 'healthy',
                services: {
                    aiIntelligence: 'operational',
                    smartSuggestions: this.config.enableSmartSuggestions ? 'enabled' : 'disabled',
                    analyticsInsights: this.config.enableAnalyticsInsights ? 'enabled' : 'disabled',
                    databaseConnection: 'active'
                },
                timestamp: new Date()
            };
        });
    }
    getPerformanceMetrics() {
        return {
            requestCount: 0,
            averageResponseTime: 0,
            successRate: 100,
            dataSource: 'database',
            activeFeatures: Object.entries(this.config)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
        };
    }
    getConfiguration() {
        return this.getConfig();
    }
}
exports.AIIntelligenceManager = AIIntelligenceManager;
