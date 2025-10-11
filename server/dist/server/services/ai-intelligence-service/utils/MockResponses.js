"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIResponseGenerator = exports.mockResponses = void 0;
exports.getMockResponse = getMockResponse;
exports.getAllMockIntents = getAllMockIntents;
exports.mockResponses = {
    account_balance: {
        intent: 'account_balance',
        response: 'Your current account balance is ₦150,000.00. This includes your main wallet balance.',
        confidence: 0.95,
        suggestions: ['View transaction history', 'Transfer money', 'Check savings']
    },
    transaction_history: {
        intent: 'transaction_history',
        response: 'Here are your recent transactions: You received ₦25,000 yesterday and made a transfer of ₦5,000 to John Doe.',
        confidence: 0.92,
        suggestions: ['Filter by date', 'Export transactions', 'View details']
    },
    transfer_money: {
        intent: 'transfer_money',
        response: 'I can help you transfer money. Please provide the recipient details and amount.',
        confidence: 0.88,
        suggestions: ['Use saved recipients', 'Schedule transfer', 'Check transfer limits']
    },
    default: {
        intent: 'general',
        response: 'I\'m here to help with your banking needs. You can ask about account balance, transactions, transfers, and more.',
        confidence: 0.7,
        suggestions: ['Check balance', 'View transactions', 'Transfer money']
    }
};
function getMockResponse(intent) {
    return exports.mockResponses[intent] || exports.mockResponses.default;
}
function getAllMockIntents() {
    return Object.keys(exports.mockResponses).filter(key => key !== 'default');
}
class MockAIResponseGenerator {
    static generateConversationalResponse(message, context) {
        return {
            message: `I understand you said: "${message}". How can I assist you with your banking needs?`,
            intent: 'general',
            confidence: 0.75,
            suggestions: ['Check balance', 'View transactions', 'Transfer money'],
            context
        };
    }
    static generateSmartSuggestions(category, limit) {
        const suggestions = [
            { id: '1', type: 'transfer', text: 'Pay utility bills', priority: 'high' },
            { id: '2', type: 'savings', text: 'Save for emergency fund', priority: 'medium' },
            { id: '3', type: 'investment', text: 'Review investment options', priority: 'low' }
        ];
        return suggestions.slice(0, limit);
    }
    static generateAnalyticsInsights(type, timeframe) {
        return {
            type,
            timeframe,
            insights: [
                { category: 'spending', value: 'Your spending increased by 15% this month' },
                { category: 'income', value: 'Regular income pattern detected' },
                { category: 'savings', value: 'You saved 20% of your income' }
            ],
            recommendations: [
                'Consider setting up automatic savings',
                'Review recurring expenses'
            ]
        };
    }
}
exports.MockAIResponseGenerator = MockAIResponseGenerator;
//# sourceMappingURL=MockResponses.js.map