/**
 * OrokiiPay UI Components
 * Central export point for all design system components
 */

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