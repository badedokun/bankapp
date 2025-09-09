/**
 * OrokiiPay Design System - Component Patterns
 * Unified component styling patterns for both React Native and Web
 */

import { OrokiiPayTheme } from './theme';

export interface ComponentStyleProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export interface ComponentStyles {
  container: any;
  text: any;
  icon: any;
  [key: string]: any;
}

// Button component styles
export function createButtonStyles(theme: OrokiiPayTheme, props: ComponentStyleProps): ComponentStyles {
  const { variant = 'primary', size = 'md', disabled = false, fullWidth = false } = props;
  
  // Base styles
  const baseContainer = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };
  
  // Size variations
  const sizeStyles = {
    sm: {
      height: theme.banking.components.button.height.sm,
      paddingHorizontal: theme.banking.components.button.padding.sm.x,
      paddingVertical: theme.banking.components.button.padding.sm.y,
    },
    md: {
      height: theme.banking.components.button.height.md,
      paddingHorizontal: theme.banking.components.button.padding.md.x,
      paddingVertical: theme.banking.components.button.padding.md.y,
    },
    lg: {
      height: theme.banking.components.button.height.lg,
      paddingHorizontal: theme.banking.components.button.padding.lg.x,
      paddingVertical: theme.banking.components.button.padding.lg.y,
    },
    xl: {
      height: theme.banking.components.button.height.xl,
      paddingHorizontal: theme.banking.components.button.padding.xl.x,
      paddingVertical: theme.banking.components.button.padding.xl.y,
    },
  };
  
  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary[500],
      borderWidth: 1,
      borderColor: theme.colors.primary[500],
      color: theme.computed.text.onPrimary,
      ':hover': {
        backgroundColor: theme.colors.primary[600],
        borderColor: theme.colors.primary[600],
      },
      ':active': {
        backgroundColor: theme.colors.primary[700],
        borderColor: theme.colors.primary[700],
      },
    },
    secondary: {
      backgroundColor: theme.colors.secondary[500],
      borderWidth: 1,
      borderColor: theme.colors.secondary[500],
      color: theme.computed.text.onSecondary,
      ':hover': {
        backgroundColor: theme.colors.secondary[600],
        borderColor: theme.colors.secondary[600],
      },
      ':active': {
        backgroundColor: theme.colors.secondary[700],
        borderColor: theme.colors.secondary[700],
      },
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary[500],
      color: theme.colors.primary[500],
      ':hover': {
        backgroundColor: theme.colors.primary[50],
        borderColor: theme.colors.primary[600],
        color: theme.colors.primary[600],
      },
      ':active': {
        backgroundColor: theme.colors.primary[100],
        borderColor: theme.colors.primary[700],
        color: theme.colors.primary[700],
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      color: theme.colors.primary[500],
      ':hover': {
        backgroundColor: theme.colors.primary[50],
        color: theme.colors.primary[600],
      },
      ':active': {
        backgroundColor: theme.colors.primary[100],
        color: theme.colors.primary[700],
      },
    },
    danger: {
      backgroundColor: theme.colors.semantic.error[500],
      borderWidth: 1,
      borderColor: theme.colors.semantic.error[500],
      color: theme.computed.text.onPrimary,
      ':hover': {
        backgroundColor: theme.colors.semantic.error[600],
        borderColor: theme.colors.semantic.error[600],
      },
      ':active': {
        backgroundColor: theme.colors.semantic.error[700],
        borderColor: theme.colors.semantic.error[700],
      },
    },
  };
  
  const textStyles = {
    fontSize: size === 'sm' ? theme.typography.fontSize.sm : 
              size === 'lg' ? theme.typography.fontSize.lg :
              size === 'xl' ? theme.typography.fontSize.xl :
              theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  };
  
  return {
    container: {
      ...baseContainer,
      ...sizeStyles[size],
      ...variantStyles[variant],
    },
    text: {
      ...textStyles,
      color: variantStyles[variant].color,
    },
    icon: {
      marginRight: theme.spacing[2],
    },
  };
}

// Input component styles
export function createInputStyles(theme: OrokiiPayTheme, props: { size?: 'sm' | 'md' | 'lg'; error?: boolean; focused?: boolean }): ComponentStyles {
  const { size = 'md', error = false, focused = false } = props;
  
  const baseContainer = {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: error ? theme.computed.border.error : 
                focused ? theme.computed.border.focus : 
                theme.computed.border.light,
    backgroundColor: theme.computed.background.surface,
    transition: 'all 0.2s ease-in-out',
  };
  
  const sizeStyles = {
    sm: {
      height: theme.banking.components.input.height.sm,
      paddingHorizontal: theme.banking.components.input.padding.sm.x,
      paddingVertical: theme.banking.components.input.padding.sm.y,
    },
    md: {
      height: theme.banking.components.input.height.md,
      paddingHorizontal: theme.banking.components.input.padding.md.x,
      paddingVertical: theme.banking.components.input.padding.md.y,
    },
    lg: {
      height: theme.banking.components.input.height.lg,
      paddingHorizontal: theme.banking.components.input.padding.lg.x,
      paddingVertical: theme.banking.components.input.padding.lg.y,
    },
  };
  
  return {
    container: {
      ...baseContainer,
      ...sizeStyles[size],
    },
    input: {
      flex: 1,
      fontSize: size === 'sm' ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.primary,
      color: theme.computed.text.primary,
      outlineWidth: 0,
      border: 'none',
      backgroundColor: 'transparent',
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: error ? theme.colors.semantic.error[500] : theme.computed.text.secondary,
      marginBottom: theme.spacing[1],
    },
    error: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.semantic.error[500],
      marginTop: theme.spacing[1],
    },
  };
}

// Card component styles
export function createCardStyles(theme: OrokiiPayTheme, props: { padding?: 'sm' | 'md' | 'lg' | 'xl'; elevated?: boolean }): ComponentStyles {
  const { padding = 'md', elevated = true } = props;
  
  const paddingStyles = {
    sm: theme.banking.components.card.padding.sm,
    md: theme.banking.components.card.padding.md,
    lg: theme.banking.components.card.padding.lg,
    xl: theme.banking.components.card.padding.xl,
  };
  
  return {
    container: {
      backgroundColor: theme.computed.background.surface,
      borderRadius: theme.borderRadius.lg,
      padding: paddingStyles[padding],
      boxShadow: elevated ? theme.shadows.md : 'none',
      border: `1px solid ${theme.computed.border.light}`,
    },
    header: {
      marginBottom: theme.spacing[4],
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.computed.text.primary,
      marginBottom: theme.spacing[1],
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.computed.text.secondary,
    },
    content: {
      marginBottom: theme.spacing[4],
    },
    footer: {
      borderTop: `1px solid ${theme.computed.border.light}`,
      paddingTop: theme.spacing[4],
    },
  };
}

// Badge/Status component styles
export function createBadgeStyles(theme: OrokiiPayTheme, props: { variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'; size?: 'sm' | 'md' }): ComponentStyles {
  const { variant = 'neutral', size = 'sm' } = props;
  
  const variantStyles = {
    success: {
      backgroundColor: theme.colors.semantic.success[50],
      color: theme.colors.semantic.success[700],
      borderColor: theme.colors.semantic.success[200],
    },
    warning: {
      backgroundColor: theme.colors.semantic.warning[50],
      color: theme.colors.semantic.warning[700],
      borderColor: theme.colors.semantic.warning[200],
    },
    error: {
      backgroundColor: theme.colors.semantic.error[50],
      color: theme.colors.semantic.error[700],
      borderColor: theme.colors.semantic.error[200],
    },
    info: {
      backgroundColor: theme.colors.semantic.info[50],
      color: theme.colors.semantic.info[700],
      borderColor: theme.colors.semantic.info[200],
    },
    neutral: {
      backgroundColor: theme.colors.neutral[100],
      color: theme.colors.neutral[700],
      borderColor: theme.colors.neutral[300],
    },
  };
  
  const sizeStyles = {
    sm: {
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
      fontSize: theme.typography.fontSize.xs,
    },
    md: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      fontSize: theme.typography.fontSize.sm,
    },
  };
  
  return {
    container: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      fontWeight: theme.typography.fontWeight.medium,
      ...variantStyles[variant],
      ...sizeStyles[size],
    },
    text: {
      fontSize: sizeStyles[size].fontSize,
      color: variantStyles[variant].color,
      fontWeight: theme.typography.fontWeight.medium,
    },
  };
}

// Avatar component styles
export function createAvatarStyles(theme: OrokiiPayTheme, props: { size?: 'sm' | 'md' | 'lg' | 'xl'; variant?: 'circle' | 'square' }): ComponentStyles {
  const { size = 'md', variant = 'circle' } = props;
  
  const sizeValues = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };
  
  const avatarSize = sizeValues[size];
  
  return {
    container: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: variant === 'circle' ? avatarSize / 2 : theme.borderRadius.md,
      backgroundColor: theme.colors.primary[100],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    fallback: {
      fontSize: size === 'sm' ? theme.typography.fontSize.sm : 
                size === 'lg' ? theme.typography.fontSize.xl :
                size === 'xl' ? theme.typography.fontSize['2xl'] :
                theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.primary[700],
    },
  };
}

// Transaction item styles (banking-specific)
export function createTransactionItemStyles(theme: OrokiiPayTheme, props: { type?: 'sent' | 'received' | 'pending' | 'failed' }): ComponentStyles {
  const { type = 'sent' } = props;
  
  const typeStyles = {
    sent: {
      iconColor: theme.colors.semantic.error[500],
      iconBackground: theme.colors.semantic.error[50],
      amountColor: theme.colors.semantic.error[500],
    },
    received: {
      iconColor: theme.colors.semantic.success[500],
      iconBackground: theme.colors.semantic.success[50],
      amountColor: theme.colors.semantic.success[500],
    },
    pending: {
      iconColor: theme.colors.semantic.warning[500],
      iconBackground: theme.colors.semantic.warning[50],
      amountColor: theme.colors.semantic.warning[500],
    },
    failed: {
      iconColor: theme.colors.neutral[500],
      iconBackground: theme.colors.neutral[100],
      amountColor: theme.colors.neutral[500],
    },
  };
  
  return {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing[4],
      backgroundColor: theme.computed.background.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing[2],
      border: `1px solid ${theme.computed.border.light}`,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: typeStyles[type].iconBackground,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing[3],
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.computed.text.primary,
      marginBottom: theme.spacing[1],
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.computed.text.secondary,
    },
    amount: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
      color: typeStyles[type].amountColor,
    },
  };
}