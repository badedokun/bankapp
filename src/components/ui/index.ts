/**
 * OrokiiPay UI Components
 * Central export point for all design system components
 * Updated with World-Class UI Design System components
 */

// ============================================================================
// WORLD-CLASS UI COMPONENTS (New)
// ============================================================================

// Typography Components
export {
  // Display
  DisplayLarge,
  DisplayMedium,
  DisplaySmall,
  // Headline
  HeadlineLarge,
  HeadlineMedium,
  HeadlineSmall,
  // Title
  TitleLarge,
  TitleMedium,
  TitleSmall,
  // Body
  BodyLarge,
  BodyMedium,
  BodySmall,
  // Label
  LabelLarge,
  LabelMedium,
  LabelSmall,
  // Amount
  Amount,
  // Utility
  Caption,
  Overline,
  Link,
  ErrorText,
  SuccessText,
} from './Typography';

// Modern Button Components
export {
  ModernButton,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  DangerButton,
  SuccessButton,
  GlassButton,
} from './ModernButton';

// Glass Card
export { GlassCard } from './GlassCard';

// Reusable Header Container
export { default as ReusableHeader } from './ReusableHeader';

// Modern Input Components
export {
  ModernTextInput,
  ModernAmountInput,
  ModernDropdown,
} from './ModernInputs';

// Skeleton Loaders
export {
  Skeleton,
  SkeletonCard,
  SkeletonTransaction,
  SkeletonTransactionList,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonProfile,
  SkeletonChart,
} from './SkeletonLoader';

// Empty States
export {
  EmptyState,
  EmptyTransactions,
  EmptySearch,
  EmptyNotifications,
  EmptySavings,
  EmptyCards,
  EmptyBills,
  EmptyRewards,
  EmptyReferrals,
  EmptyAnalytics,
} from './EmptyState';

// Error States
export {
  ErrorState,
  NetworkError,
  ServerError,
  PermissionError,
  ValidationError,
  NotFoundError,
  TransactionError,
  InsufficientFundsError,
  AccountSuspendedError,
  RateLimitError,
} from './ErrorState';

// ============================================================================
// EXISTING UI COMPONENTS (Legacy)
// ============================================================================

// Core UI Components
export { default as Avatar, AvatarGroup, CustomerAvatar } from './Avatar';
export { default as Badge, NotificationBadge, TransactionStatusBadge, AccountTypeBadge } from './Badge';
export { default as Card, TransactionCard, BalanceCard } from './Card';
export { default as Modal, ConfirmDialog, TransactionConfirmDialog, LoadingModal } from './Modal';

// Enhanced Components with Design System Integration
export {
  default as EnhancedButton,
  IconButton,
  FloatingActionButton,
  TransactionButton,
  ButtonGroup,
  QuickActionButton
} from './EnhancedButton';

export {
  default as EnhancedInput,
  PhoneInput,
  CurrencyInput,
  AccountNumberInput,
  PINInput,
  OTPInput
} from './EnhancedInput';

// Legacy Components (for backward compatibility)
export { default as Button } from './Button';
export { default as Input } from './Input';

// Component Types
export type {
  ButtonProps,
  InputProps
} from './Button';

// Re-export design system utilities
export { useTheme } from '../../hooks/useTheme';
export * from '../../design-system';

// Banking-specific component combinations
export const BankingComponents = {
  TransactionCard,
  TransactionConfirmDialog,
  TransactionButton,
  TransactionStatusBadge,
  AccountTypeBadge,
  CustomerAvatar,
  PhoneInput,
  CurrencyInput,
  AccountNumberInput,
  PINInput,
  OTPInput,
};

// Form components collection
export const FormComponents = {
  EnhancedInput,
  PhoneInput,
  CurrencyInput,
  AccountNumberInput,
  PINInput,
  OTPInput,
  EnhancedButton,
  ButtonGroup,
};

// Layout components collection
export const LayoutComponents = {
  Card,
  Modal,
  ConfirmDialog,
  LoadingModal,
  Avatar,
  Badge,
};

export default {
  // Core components
  Avatar,
  Badge,
  Card,
  Modal,
  
  // Enhanced components
  EnhancedButton,
  EnhancedInput,
  
  // Legacy components
  Button,
  Input,
  
  // Specialized components
  TransactionCard,
  TransactionButton,
  PhoneInput,
  CurrencyInput,
  PINInput,
  OTPInput,
  
  // Collections
  BankingComponents,
  FormComponents,
  LayoutComponents,
};