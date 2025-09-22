export interface DevelopmentControls {
    enableDebugLogs: boolean;
    enableMockData: boolean;
    enableTestMode: boolean;
    enableDetailedAnalytics: boolean;
}
export declare const defaultDevelopmentControls: DevelopmentControls;
export declare function createDevelopmentControls(overrides?: Partial<DevelopmentControls>): DevelopmentControls;
export declare function isDebugMode(): boolean;
//# sourceMappingURL=DevelopmentControls.d.ts.map