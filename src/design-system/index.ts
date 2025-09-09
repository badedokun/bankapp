/**
 * OrokiiPay Design System - Main Export
 * Comprehensive design system for multi-tenant banking platform
 */

// Core design system
export * from './tokens';
export * from './theme';
export * from './components';
export * from './widgets';

// Re-export main theme functions for easy access
export {
  createBaseTheme,
  createTenantTheme,
  defaultThemes,
  themeToCSSProperties,
  themeToReactNativeStyles,
  breakpoints,
  mediaQueries,
} from './theme';

// Re-export component style creators
export {
  createButtonStyles,
  createInputStyles,
  createCardStyles,
  createBadgeStyles,
  createAvatarStyles,
  createTransactionItemStyles,
} from './components';

// Re-export widget style creators
export {
  createDatePickerStyles,
  createPhoneFormatterStyles,
  createCurrencyFormatterStyles,
  createAccountFormatterStyles,
  createPinInputStyles,
  createFileUploadStyles,
  createSearchWidgetStyles,
  widgetUtils,
} from './widgets';

// Re-export tokens for direct access
export {
  baseTokens,
  bankingTokens,
  generateTenantColors,
} from './tokens';

// Types
export type {
  OrokiiPayTheme,
  ThemeName,
} from './theme';

export type {
  DesignTokens,
  BankingTokens,
  ColorPalette,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from './tokens';

export type {
  ComponentStyleProps,
  ComponentStyles,
} from './components';

export type {
  WidgetStyleProps,
  WidgetStyles,
  DatePickerProps,
  PhoneFormatterProps,
  CurrencyFormatterProps,
  AccountFormatterProps,
  PinInputProps,
  FileUploadProps,
  SearchWidgetProps,
} from './widgets';