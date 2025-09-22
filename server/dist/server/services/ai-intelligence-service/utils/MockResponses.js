"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockResponses = void 0;
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
//# sourceMappingURL=MockResponses.js.map