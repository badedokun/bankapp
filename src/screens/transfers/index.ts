/**
 * Transfer Screens Export Index
 * Centralizes all transfer-related screens and components
 */

// Main transfer screens
export { default as ModernTransferMenuScreen } from './ModernTransferMenuScreen';
// export { default as InternalTransferScreen } from './InternalTransferScreen'; // File doesn't exist
export { default as ExternalTransferScreen } from './ExternalTransferScreen';
export { default as CompleteTransferFlowScreen } from './CompleteTransferFlowScreen';

// Legacy AI transfer screen (keep for backward compatibility)
// export { default as AITransferScreen } from '../transfer/AITransferScreen'; // File doesn't exist

// Re-export transfer components for convenience
export { default as TransferHeader } from '../../components/transfers/TransferHeader';
export { default as TransferTabs } from '../../components/transfers/TransferTabs';
export { default as AccountSelector } from '../../components/transfers/AccountSelector';
export { default as BeneficiarySelector } from '../../components/transfers/BeneficiarySelector';

// Export transfer types
export * from '../../types/transfers';