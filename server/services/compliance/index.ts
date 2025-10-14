/**
 * Compliance Module
 *
 * Exports all compliance providers and services
 */

// Core interfaces and base classes
export {
  BaseComplianceProvider,
  ComplianceProviderRegistry,
  complianceProviderRegistry
} from './IComplianceProvider';

export type {
  IComplianceProvider,
  User,
  IdentityDocument,
  Transaction,
  KYCRequest,
  KYCResult,
  AMLCheckRequest,
  AMLResult,
  SanctionsCheckRequest,
  SanctionsCheckResult,
  TransactionMonitoringRequest,
  TransactionMonitoringResult,
  ComplianceReport,
  ComplianceReportRequest,
  RegulatoryLimits,
  ComplianceCapabilities
} from './IComplianceProvider';

// Provider implementations
export { USAComplianceProvider } from './USAComplianceProvider';
export { EuropeComplianceProvider } from './EuropeComplianceProvider';
export { CanadaComplianceProvider } from './CanadaComplianceProvider';

// Orchestration service
export {
  ComplianceService,
  getComplianceService
} from './ComplianceService';
