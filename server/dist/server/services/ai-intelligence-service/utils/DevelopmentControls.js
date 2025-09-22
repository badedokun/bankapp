"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDevelopmentControls = void 0;
exports.createDevelopmentControls = createDevelopmentControls;
exports.isDebugMode = isDebugMode;
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
//# sourceMappingURL=DevelopmentControls.js.map