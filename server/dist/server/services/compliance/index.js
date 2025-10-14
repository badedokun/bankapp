"use strict";
/**
 * Compliance Module
 *
 * Exports all compliance providers and services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplianceService = exports.ComplianceService = exports.CanadaComplianceProvider = exports.EuropeComplianceProvider = exports.USAComplianceProvider = exports.complianceProviderRegistry = exports.ComplianceProviderRegistry = exports.BaseComplianceProvider = void 0;
// Core interfaces and base classes
var IComplianceProvider_1 = require("./IComplianceProvider");
Object.defineProperty(exports, "BaseComplianceProvider", { enumerable: true, get: function () { return IComplianceProvider_1.BaseComplianceProvider; } });
Object.defineProperty(exports, "ComplianceProviderRegistry", { enumerable: true, get: function () { return IComplianceProvider_1.ComplianceProviderRegistry; } });
Object.defineProperty(exports, "complianceProviderRegistry", { enumerable: true, get: function () { return IComplianceProvider_1.complianceProviderRegistry; } });
// Provider implementations
var USAComplianceProvider_1 = require("./USAComplianceProvider");
Object.defineProperty(exports, "USAComplianceProvider", { enumerable: true, get: function () { return USAComplianceProvider_1.USAComplianceProvider; } });
var EuropeComplianceProvider_1 = require("./EuropeComplianceProvider");
Object.defineProperty(exports, "EuropeComplianceProvider", { enumerable: true, get: function () { return EuropeComplianceProvider_1.EuropeComplianceProvider; } });
var CanadaComplianceProvider_1 = require("./CanadaComplianceProvider");
Object.defineProperty(exports, "CanadaComplianceProvider", { enumerable: true, get: function () { return CanadaComplianceProvider_1.CanadaComplianceProvider; } });
// Orchestration service
var ComplianceService_1 = require("./ComplianceService");
Object.defineProperty(exports, "ComplianceService", { enumerable: true, get: function () { return ComplianceService_1.ComplianceService; } });
Object.defineProperty(exports, "getComplianceService", { enumerable: true, get: function () { return ComplianceService_1.getComplianceService; } });
//# sourceMappingURL=index.js.map