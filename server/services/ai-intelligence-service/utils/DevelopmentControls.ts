export interface DevelopmentControlsConfig {
  enableDebugLogs: boolean;
  enableMockData: boolean;
  enableTestMode: boolean;
  enableDetailedAnalytics: boolean;
}

export class DevelopmentControls {
  private static instance: DevelopmentControls;
  private config: DevelopmentControlsConfig;

  private constructor() {
    this.config = {
      enableDebugLogs: process.env.NODE_ENV === 'development',
      enableMockData: false,
      enableTestMode: false,
      enableDetailedAnalytics: process.env.NODE_ENV === 'development'
    };
  }

  static getInstance(): DevelopmentControls {
    if (!DevelopmentControls.instance) {
      DevelopmentControls.instance = new DevelopmentControls();
    }
    return DevelopmentControls.instance;
  }

  checkRateLimit(userId?: string): { allowed: boolean; reason?: string; resetTime?: Date } {
    return { allowed: true };
  }

  recordRequest(userId?: string): void {
    // Record request for analytics
  }

  logUsageInfo(userId?: string, action?: string, size?: number): void {
    // Log usage information
  }

  getUsageStats(userId?: string): Record<string, any> {
    return {};
  }

  isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  shouldUseMockResponses(): boolean {
    return this.config.enableMockData;
  }

  resetUsageStats(userId?: string): void {
    // Reset usage statistics for specific user or all users
  }

  getConfig(): DevelopmentControlsConfig {
    return { ...this.config };
  }
}

export const defaultDevelopmentControls: DevelopmentControlsConfig = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enableMockData: false,
  enableTestMode: false,
  enableDetailedAnalytics: process.env.NODE_ENV === 'development'
};

export function createDevelopmentControls(overrides: Partial<DevelopmentControlsConfig> = {}): DevelopmentControlsConfig {
  return {
    ...defaultDevelopmentControls,
    ...overrides
  };
}

export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
}