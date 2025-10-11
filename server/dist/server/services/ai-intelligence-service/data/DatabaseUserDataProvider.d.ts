export declare class DatabaseUserDataProvider {
    private tenantId?;
    constructor(tenantId?: string);
    getUserData(userId: string): Promise<any>;
    getUserTransactionHistory(userId: string): Promise<any[]>;
    getUserProfile(userId: string): Promise<any>;
    getUserBehaviorPatterns(userId: string): Promise<any>;
}
//# sourceMappingURL=DatabaseUserDataProvider.d.ts.map