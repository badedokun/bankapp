/**
 * Customer Data Service
 * Handles customer-specific queries using real banking data
 * No mock data - all responses use actual customer information
 */
export interface CustomerQuery {
    type: 'balance' | 'transactions' | 'spending' | 'savings' | 'transfers' | 'bills' | 'general';
    userId: string;
    parameters?: Record<string, any>;
}
export interface CustomerDataResponse {
    answer: string;
    data: any;
    suggestions?: string[];
    requiresOpenAI: boolean;
}
export declare class CustomerDataService {
    /**
     * Classify the customer's query intent
     */
    static classifyQuery(message: string): CustomerQuery['type'];
    /**
     * Get customer balance with natural language response
     */
    static getBalance(userId: string, tenantId: string): Promise<CustomerDataResponse>;
    /**
     * Get recent transactions with natural language response
     */
    static getRecentTransactions(userId: string, tenantId: string, limit?: number): Promise<CustomerDataResponse>;
    /**
     * Analyze spending patterns with real data
     */
    static analyzeSpending(userId: string, tenantId: string, days?: number): Promise<CustomerDataResponse>;
    /**
     * Get savings information
     */
    static getSavingsInfo(userId: string, tenantId: string): Promise<CustomerDataResponse>;
    /**
     * Process customer query and return appropriate response
     */
    static processQuery(message: string, userId: string, tenantId: string, options?: {
        limit?: number;
    }): Promise<CustomerDataResponse>;
}
//# sourceMappingURL=CustomerDataService.d.ts.map