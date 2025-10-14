/**
 * Payment Gateways Module
 *
 * Exports all payment gateway providers and services
 */

// Core interfaces and base classes
export {
  BasePaymentProvider,
  PaymentProviderRegistry,
  paymentProviderRegistry
} from './IPaymentProvider';

export type {
  IPaymentProvider,
  AccountValidationRequest,
  AccountValidationResult,
  TransferRequest,
  TransferResponse,
  TransferStatusRequest,
  TransferStatusResponse,
  BankListRequest,
  BankInfo,
  TransferLimits,
  ProviderCapabilities
} from './IPaymentProvider';

// Provider implementations
export { NIBSSProvider } from './NIBSSProvider';
export { ACHProvider } from './ACHProvider';
export { SEPAProvider } from './SEPAProvider';
export { InteracProvider } from './InteracProvider';

// Orchestration service
export {
  PaymentGatewayService,
  getPaymentGatewayService
} from './PaymentGatewayService';
