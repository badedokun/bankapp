/**
 * OrokiiPay Design System - Widget Components
 * Reusable widget components for banking applications
 */

import { OrokiiPayTheme } from './theme';

// Widget Types and Interfaces
export interface WidgetStyleProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state?: 'default' | 'focused' | 'error' | 'success' | 'disabled';
  fullWidth?: boolean;
}

export interface WidgetStyles {
  container: Record<string, any>;
  input?: Record<string, any>;
  label?: Record<string, any>;
  error?: Record<string, any>;
  icon?: Record<string, any>;
  helper?: Record<string, any>;
}

// Date Picker Widget
export interface DatePickerProps extends WidgetStyleProps {
  format?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  minDate?: Date;
  maxDate?: Date;
  showCalendarIcon?: boolean;
}

export function createDatePickerStyles(theme: OrokiiPayTheme, props: DatePickerProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = false,
    showCalendarIcon = true
  } = props;

  const sizeMap = {
    xs: { height: '32px', fontSize: '12px', padding: '6px 8px' },
    sm: { height: '36px', fontSize: '14px', padding: '8px 12px' },
    md: { height: '44px', fontSize: '16px', padding: '12px 16px' },
    lg: { height: '52px', fontSize: '18px', padding: '14px 20px' },
    xl: { height: '60px', fontSize: '20px', padding: '16px 24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md
    },
    input: {
      width: '100%',
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      padding: showCalendarIcon ? `${currentSize.padding.split(' ')[0]} 44px ${currentSize.padding.split(' ')[0]} ${currentSize.padding.split(' ')[1]}` : currentSize.padding,
      border: `1px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.body,
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out',
      position: 'relative'
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    icon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.colors.neutral[500],
      fontSize: '18px',
      pointerEvents: 'none'
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// Phone Number Formatter Widget
export interface PhoneFormatterProps extends WidgetStyleProps {
  countryCode?: string;
  format?: 'international' | 'national' | 'compact';
  allowCountrySelection?: boolean;
}

export function createPhoneFormatterStyles(theme: OrokiiPayTheme, props: PhoneFormatterProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = false,
    allowCountrySelection = true
  } = props;

  const sizeMap = {
    xs: { height: '32px', fontSize: '12px', padding: '6px 8px' },
    sm: { height: '36px', fontSize: '14px', padding: '8px 12px' },
    md: { height: '44px', fontSize: '16px', padding: '12px 16px' },
    lg: { height: '52px', fontSize: '18px', padding: '14px 20px' },
    xl: { height: '60px', fontSize: '20px', padding: '16px 24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md
    },
    input: {
      width: '100%',
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      padding: allowCountrySelection ? `${currentSize.padding.split(' ')[0]} ${currentSize.padding.split(' ')[1]} ${currentSize.padding.split(' ')[0]} 80px` : currentSize.padding,
      border: `1px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.mono,
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out',
      position: 'relative'
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// Currency Formatter Widget
export interface CurrencyFormatterProps extends WidgetStyleProps {
  currency?: 'NGN' | 'USD' | 'EUR' | 'GBP';
  showSymbol?: boolean;
  decimalPlaces?: number;
  allowNegative?: boolean;
}

export function createCurrencyFormatterStyles(theme: OrokiiPayTheme, props: CurrencyFormatterProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = false,
    showSymbol = true
  } = props;

  const sizeMap = {
    xs: { height: '32px', fontSize: '12px', padding: '6px 8px' },
    sm: { height: '36px', fontSize: '14px', padding: '8px 12px' },
    md: { height: '44px', fontSize: '16px', padding: '12px 16px' },
    lg: { height: '52px', fontSize: '18px', padding: '14px 20px' },
    xl: { height: '60px', fontSize: '20px', padding: '16px 24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md
    },
    input: {
      width: '100%',
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      padding: showSymbol ? `${currentSize.padding.split(' ')[0]} ${currentSize.padding.split(' ')[1]} ${currentSize.padding.split(' ')[0]} 48px` : currentSize.padding,
      border: `1px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.mono,
      textAlign: 'right' as const,
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out',
      position: 'relative'
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    icon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.colors.neutral[600],
      fontSize: currentSize.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      pointerEvents: 'none'
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// Account Number Formatter Widget
export interface AccountFormatterProps extends WidgetStyleProps {
  bankCode?: string;
  format?: 'NNNN-NNNN-NN' | 'NNNNNNNNNN' | 'auto';
  showBankIcon?: boolean;
}

export function createAccountFormatterStyles(theme: OrokiiPayTheme, props: AccountFormatterProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = false,
    showBankIcon = true
  } = props;

  const sizeMap = {
    xs: { height: '32px', fontSize: '12px', padding: '6px 8px' },
    sm: { height: '36px', fontSize: '14px', padding: '8px 12px' },
    md: { height: '44px', fontSize: '16px', padding: '12px 16px' },
    lg: { height: '52px', fontSize: '18px', padding: '14px 20px' },
    xl: { height: '60px', fontSize: '20px', padding: '16px 24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md
    },
    input: {
      width: '100%',
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      padding: showBankIcon ? `${currentSize.padding.split(' ')[0]} 44px ${currentSize.padding.split(' ')[0]} ${currentSize.padding.split(' ')[1]}` : currentSize.padding,
      border: `1px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.mono,
      letterSpacing: '0.05em',
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out',
      position: 'relative'
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    icon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.colors.neutral[500],
      fontSize: '18px',
      pointerEvents: 'none'
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// PIN/OTP Input Widget
export interface PinInputProps extends WidgetStyleProps {
  length?: 4 | 6;
  type?: 'pin' | 'otp';
  maskInput?: boolean;
}

export function createPinInputStyles(theme: OrokiiPayTheme, props: PinInputProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    length = 4,
    maskInput = false
  } = props;

  const sizeMap = {
    xs: { width: '32px', height: '32px', fontSize: '14px' },
    sm: { width: '40px', height: '40px', fontSize: '16px' },
    md: { width: '48px', height: '48px', fontSize: '18px' },
    lg: { width: '56px', height: '56px', fontSize: '20px' },
    xl: { width: '64px', height: '64px', fontSize: '24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: theme.spacing.md
    },
    input: {
      width: currentSize.width,
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      border: `2px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.mono,
      fontWeight: theme.typography.fontWeight.bold,
      textAlign: 'center' as const,
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out',
      margin: `0 ${theme.spacing.xs}`
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.md,
      textAlign: 'center' as const
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.md,
      textAlign: 'center' as const
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.sm,
      textAlign: 'center' as const
    }
  };
}

// File Upload Widget
export interface FileUploadProps extends WidgetStyleProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  dragAndDrop?: boolean;
}

export function createFileUploadStyles(theme: OrokiiPayTheme, props: FileUploadProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = true,
    dragAndDrop = true
  } = props;

  const sizeMap = {
    xs: { minHeight: '80px', padding: '16px' },
    sm: { minHeight: '100px', padding: '20px' },
    md: { minHeight: '120px', padding: '24px' },
    lg: { minHeight: '140px', padding: '28px' },
    xl: { minHeight: '160px', padding: '32px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[700]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.primary[50],
      text: theme.colors.primary[700]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[700]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[700]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md
    },
    input: {
      width: '100%',
      minHeight: currentSize.minHeight,
      padding: currentSize.padding,
      border: `2px dashed ${currentColors.border}`,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      textAlign: 'center' as const
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    icon: {
      fontSize: '32px',
      color: theme.colors.neutral[400],
      marginBottom: theme.spacing.sm
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// Search/Filter Widget
export interface SearchWidgetProps extends WidgetStyleProps {
  placeholder?: string;
  showFilterIcon?: boolean;
  showClearButton?: boolean;
}

export function createSearchWidgetStyles(theme: OrokiiPayTheme, props: SearchWidgetProps = {}): WidgetStyles {
  const {
    variant = 'primary',
    size = 'md',
    state = 'default',
    fullWidth = true,
    showFilterIcon = false,
    showClearButton = true
  } = props;

  const sizeMap = {
    xs: { height: '32px', fontSize: '12px', padding: '6px 8px' },
    sm: { height: '36px', fontSize: '14px', padding: '8px 12px' },
    md: { height: '44px', fontSize: '16px', padding: '12px 16px' },
    lg: { height: '52px', fontSize: '18px', padding: '14px 20px' },
    xl: { height: '60px', fontSize: '20px', padding: '16px 24px' }
  };

  const stateColors = {
    default: {
      border: theme.colors.neutral[300],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    focused: {
      border: theme.colors.primary[500],
      background: theme.colors.neutral[50],
      text: theme.colors.neutral[900]
    },
    error: {
      border: theme.colors.error[500],
      background: theme.colors.error[50],
      text: theme.colors.error[900]
    },
    success: {
      border: theme.colors.success[500],
      background: theme.colors.success[50],
      text: theme.colors.success[900]
    },
    disabled: {
      border: theme.colors.neutral[200],
      background: theme.colors.neutral[100],
      text: theme.colors.neutral[400]
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = stateColors[state];

  const leftPadding = showFilterIcon ? '44px' : currentSize.padding.split(' ')[1];
  const rightPadding = showClearButton ? '44px' : currentSize.padding.split(' ')[1];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: fullWidth ? '100%' : 'auto',
      marginBottom: theme.spacing.md,
      position: 'relative'
    },
    input: {
      width: '100%',
      height: currentSize.height,
      fontSize: currentSize.fontSize,
      padding: `${currentSize.padding.split(' ')[0]} ${rightPadding} ${currentSize.padding.split(' ')[0]} ${leftPadding}`,
      border: `1px solid ${currentColors.border}`,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: currentColors.background,
      color: currentColors.text,
      fontFamily: theme.typography.fontFamily.body,
      outlineStyle: 'none' as any,
      transition: 'all 0.2s ease-in-out'
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.neutral[700],
      marginBottom: theme.spacing.xs
    },
    icon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.colors.neutral[500],
      fontSize: '18px',
      pointerEvents: 'none'
    },
    error: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs
    },
    helper: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.neutral[500],
      marginTop: theme.spacing.xs
    }
  };
}

// Export utility functions for widget formatting
export const widgetUtils = {
  // Phone number formatters
  formatPhoneNumber: (value: string, format: 'international' | 'national' | 'compact' = 'national'): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (format === 'international' && cleaned.startsWith('234')) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    
    if (format === 'national' && cleaned.length === 11) {
      return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    
    return cleaned;
  },

  // Currency formatters
  formatCurrency: (value: number, currency: 'NGN' | 'USD' | 'EUR' | 'GBP' = 'NGN', decimalPlaces: number = 2): string => {
    const symbols = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'USD' : currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value).replace('$', symbols[currency]);
    
    return formatted;
  },

  // Account number formatter
  formatAccountNumber: (value: string, format: 'NNNN-NNNN-NN' | 'NNNNNNNNNN' | 'auto' = 'auto'): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (format === 'NNNN-NNNN-NN' && cleaned.length === 10) {
      return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}-${cleaned.substring(8)}`;
    }
    
    return cleaned;
  },

  // Date formatters
  formatDate: (date: Date, format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  },

  // Validation helpers
  validateBVN: (bvn: string): boolean => {
    return /^\d{11}$/.test(bvn);
  },

  validateNIN: (nin: string): boolean => {
    return /^\d{11}$/.test(nin);
  },

  validateAccountNumber: (accountNumber: string): boolean => {
    return /^\d{10}$/.test(accountNumber);
  },

  validatePhoneNumber: (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned.startsWith('0');
  }
};