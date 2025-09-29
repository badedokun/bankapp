"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDevelopmentControls = exports.DevelopmentControls = void 0;
exports.createDevelopmentControls = createDevelopmentControls;
exports.isDebugMode = isDebugMode;
class DevelopmentControls {
    constructor() {
        this.config = {
            enableDebugLogs: process.env.NODE_ENV === 'development',
            enableMockData: false,
            enableTestMode: false,
            enableDetailedAnalytics: process.env.NODE_ENV === 'development'
        };
    }
    static getInstance() {
        if (!DevelopmentControls.instance) {
            DevelopmentControls.instance = new DevelopmentControls();
        }
        return DevelopmentControls.instance;
    }
    checkRateLimit(userId) {
        return { allowed: true };
    }
    recordRequest(userId) {
        // Record request for analytics
    }
    logUsageInfo(userId, action, size) {
        // Log usage information
    }
    getUsageStats(userId) {
        return {};
    }
    isDevelopmentMode() {
        return process.env.NODE_ENV === 'development';
    }
    shouldUseMockResponses() {
        return this.config.enableMockData;
    }
    resetUsageStats(userId) {
        // Reset usage statistics for specific user or all users
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.DevelopmentControls = DevelopmentControls;
exports.defaultDevelopmentControls = {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    enableMockData: false,
    enableTestMode: false,
    enableDetailedAnalytics: process.env.NODE_ENV === 'development'
};
function createDevelopmentControls(overrides = {}) {
    return {
        ...exports.defaultDevelopmentControls,
        ...overrides
    };
}
function isDebugMode() {
    return process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
}
