/**
 * Screen Components Export Index
 * Centralized exports for all screen components
 */

// Auth screens
export { default as LoginScreen } from './auth/LoginScreen';

// Dashboard screens
export { default as ModernDashboardScreen } from './dashboard/ModernDashboardScreen';

// Transfer screens
export { default as ModernTransferMenuScreen } from './transfers/ModernTransferMenuScreen';
export { CompleteTransferFlowScreen } from './transfers/CompleteTransferFlowScreen';
export { default as CompleteTransferFlow } from './transfers/CompleteTransferFlow';
export { ExternalTransferScreen } from './transfers/ExternalTransferScreen';

// History screens
export { default as TransactionHistoryScreen } from './history/TransactionHistoryScreen';

// Transaction screens
export { default as TransactionDetailsScreen } from './transactions/TransactionDetailsScreen';

// Settings screens
export { default as SettingsScreen } from './settings/SettingsScreen';

// AI screens
export { default as ModernAIChatScreen } from './ModernAIChatScreen';

// Admin screens
export { default as ModernRBACManagementScreen } from './admin/ModernRBACManagementScreen';

// Bill Payment screens
export { default as BillPaymentScreen } from './bills/BillPaymentScreen';

// Savings screens
export { default as ModernSavingsMenuScreen } from './savings/ModernSavingsMenuScreen';
export { default as FlexibleSavingsScreen } from './savings/FlexibleSavingsScreen';

// Loans screens
export { default as ModernLoansMenuScreen } from './loans/ModernLoansMenuScreen';
export { default as PersonalLoanScreen } from './loans/PersonalLoanScreen';

// Export types
export type { LoginScreenProps } from './auth/LoginScreen';
export type { CompleteTransferFlowScreenProps } from './transfers/CompleteTransferFlowScreen';
export type { TransactionHistoryScreenProps } from './history/TransactionHistoryScreen';
export type { TransactionDetailsScreenProps } from './transactions/TransactionDetailsScreen';
export type { SettingsScreenProps } from './settings/SettingsScreen';