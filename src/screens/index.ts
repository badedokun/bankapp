/**
 * Screen Components Export Index
 * Centralized exports for all screen components
 */

// Auth screens
export { default as LoginScreen } from './auth/LoginScreen';

// Dashboard screens  
export { default as DashboardScreen } from './dashboard/DashboardScreen';

// Transfer screens
export { default as AITransferScreen } from './transfer/AITransferScreen';

// History screens
export { default as TransactionHistoryScreen } from './history/TransactionHistoryScreen';

// Settings screens
export { default as SettingsScreen } from './settings/SettingsScreen';

// Export types
export type { LoginScreenProps } from './auth/LoginScreen';
export type { DashboardScreenProps } from './dashboard/DashboardScreen';
export type { AITransferScreenProps } from './transfer/AITransferScreen';
export type { TransactionHistoryScreenProps } from './history/TransactionHistoryScreen';
export type { SettingsScreenProps } from './settings/SettingsScreen';