export interface DevelopmentControls {
  enableDebugLogs: boolean;
  enableMockData: boolean;
  enableTestMode: boolean;
  enableDetailedAnalytics: boolean;
}

export const defaultDevelopmentControls: DevelopmentControls = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enableMockData: false,
  enableTestMode: false,
  enableDetailedAnalytics: process.env.NODE_ENV === 'development'
};

export function createDevelopmentControls(overrides: Partial<DevelopmentControls> = {}): DevelopmentControls {
  return {
    ...defaultDevelopmentControls,
    ...overrides
  };
}

export function isDebugMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
}