export interface SmartSuggestion {
    id: string;
    type: 'action' | 'insight' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    metadata?: Record<string, any>;
}
export interface SmartSuggestionsContext {
    userId: string;
    tenantId?: string;
    currentBalance?: number;
    recentTransactions?: any[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}
export declare class SmartSuggestionsEngine {
    private dataProvider;
    constructor(tenantId?: string);
    generateSuggestions(context: SmartSuggestionsContext): Promise<SmartSuggestion[]>;
    private getUserDataFromDatabase;
    private getDailySummary;
    private detectRecurringPayments;
    private getDefaultSuggestions;
    static getPersonalizedSuggestions(request: any): Promise<SmartSuggestion[]>;
}
//# sourceMappingURL=SmartSuggestionsEngine.d.ts.map