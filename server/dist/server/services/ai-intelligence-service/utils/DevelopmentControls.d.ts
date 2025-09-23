export interface DevelopmentControlsConfig {
    enableDebugLogs: boolean;
    enableMockData: boolean;
    enableTestMode: boolean;
    enableDetailedAnalytics: boolean;
}
export declare class DevelopmentControls {
    private static instance;
    private config;
    private constructor();
    static getInstance(): DevelopmentControls;
    checkRateLimit(userId?: string): {
        allowed: boolean;
        reason?: string;
        resetTime?: Date;
    };
    recordRequest(userId?: string): void;
    logUsageInfo(userId?: string, action?: string, size?: number): void;
    getUsageStats(userId?: string): Record<string, any>;
    isDevelopmentMode(): boolean;
    shouldUseMockResponses(): boolean;
    resetUsageStats(userId?: string): void;
    getConfig(): DevelopmentControlsConfig;
}
export declare const defaultDevelopmentControls: DevelopmentControlsConfig;
export declare function createDevelopmentControls(overrides?: Partial<DevelopmentControlsConfig>): DevelopmentControlsConfig;
export declare function isDebugMode(): boolean;
//# sourceMappingURL=DevelopmentControls.d.ts.map