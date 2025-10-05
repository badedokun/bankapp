/**
 * Typography Component Library
 * World-class typography system inspired by N26, Revolut, and Nubank
 * Based on WORLD_CLASS_UI_DESIGN_SYSTEM.md specifications
 *
 * Features:
 * - Multi-tenant theme support
 * - Responsive font sizes
 * - Hierarchical text styles (Display, Headline, Body, Label, Amount)
 * - Currency formatting for Amount components
 * - Accessibility support (scalable fonts)
 */

import React from 'react';
import { Text as RNText, TextStyle, Platform, StyleSheet } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { getCurrencySymbol } from '../../utils/currency';

// ============================================================================
// Typography Interfaces
// ============================================================================

interface BaseTypographyProps {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
}

interface AmountProps extends Omit<BaseTypographyProps, 'children'> {
  value: number | string;
  currency?: string;
  showSymbol?: boolean;
  showDecimals?: boolean;
  variant?: 'large' | 'medium' | 'small';
  positive?: boolean; // Green for positive, red for negative
  colored?: boolean; // Apply color based on positive/negative
}

// ============================================================================
// Typography Scale Configuration
// ============================================================================

const TypographyScale = {
  // Display - Hero text (Page titles, large numbers)
  display: {
    large: { fontSize: 56, lineHeight: 64, fontWeight: '800' as const, letterSpacing: -0.5 },
    medium: { fontSize: 48, lineHeight: 56, fontWeight: '800' as const, letterSpacing: -0.5 },
    small: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const, letterSpacing: -0.3 },
  },

  // Headline - Section headers
  headline: {
    large: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.2 },
    medium: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.2 },
    small: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const, letterSpacing: -0.1 },
  },

  // Title - Card titles, subsection headers
  title: {
    large: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
    medium: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
    small: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  },

  // Body - Main content text
  body: {
    large: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
    medium: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  },

  // Label - Input labels, captions, metadata
  label: {
    large: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    medium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    small: { fontSize: 10, lineHeight: 14, fontWeight: '500' as const },
  },

  // Amount - Currency display (monospace for alignment)
  amount: {
    large: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const, letterSpacing: -0.5 },
    medium: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.3 },
    small: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const, letterSpacing: -0.2 },
  },
};

// ============================================================================
// Base Typography Component
// ============================================================================

const BaseTypography: React.FC<BaseTypographyProps & { baseStyle: TextStyle }> = ({
  children,
  color,
  style,
  baseStyle,
  numberOfLines,
  ellipsizeMode,
  onPress,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTenantTheme();

  const textStyle: TextStyle = {
    ...baseStyle,
    color: color || theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  };

  return (
    <RNText
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      allowFontScaling={true}
    >
      {children}
    </RNText>
  );
};

// ============================================================================
// Display Components
// ============================================================================

export const DisplayLarge: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.display.large} {...props} />
);

export const DisplayMedium: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.display.medium} {...props} />
);

export const DisplaySmall: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.display.small} {...props} />
);

// ============================================================================
// Headline Components
// ============================================================================

export const HeadlineLarge: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.headline.large} {...props} />
);

export const HeadlineMedium: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.headline.medium} {...props} />
);

export const HeadlineSmall: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.headline.small} {...props} />
);

// ============================================================================
// Title Components
// ============================================================================

export const TitleLarge: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.title.large} {...props} />
);

export const TitleMedium: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.title.medium} {...props} />
);

export const TitleSmall: React.FC<BaseTypographyProps> = (props) => (
  <BaseTypography baseStyle={TypographyScale.title.small} {...props} />
);

// ============================================================================
// Body Components
// ============================================================================

export const BodyLarge: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.body.large,
        color: theme.colors.text,
      }}
      {...props}
    />
  );
};

export const BodyMedium: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.body.medium,
        color: theme.colors.text,
      }}
      {...props}
    />
  );
};

export const BodySmall: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.body.small,
        color: theme.colors.text,
      }}
      {...props}
    />
  );
};

// ============================================================================
// Label Components
// ============================================================================

export const LabelLarge: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.label.large,
        color: theme.colors.textSecondary,
      }}
      {...props}
    />
  );
};

export const LabelMedium: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.label.medium,
        color: theme.colors.textSecondary,
      }}
      {...props}
    />
  );
};

export const LabelSmall: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        ...TypographyScale.label.small,
        color: theme.colors.textLight,
      }}
      {...props}
    />
  );
};

// ============================================================================
// Amount Component (Currency Display)
// ============================================================================

export const Amount: React.FC<AmountProps> = ({
  value,
  currency,
  showSymbol = true,
  showDecimals = true,
  variant = 'medium',
  positive,
  colored = false,
  color,
  style,
  ...props
}) => {
  const { theme } = useTenantTheme();

  // Format the amount
  const formatAmount = (val: number | string): string => {
    const numValue = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;

    if (isNaN(numValue)) return '0.00';

    const formatted = new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(Math.abs(numValue));

    return formatted;
  };

  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  const isPositive = positive !== undefined ? positive : numValue >= 0;
  const isNegative = !isPositive;

  // Determine color
  let amountColor = color || theme.colors.text;
  if (colored) {
    amountColor = isPositive ? theme.colors.success : theme.colors.danger;
  }

  // Get currency symbol
  const symbol = currency ? getCurrencySymbol(currency) : getCurrencySymbol(theme.currency);

  // Get base style
  const baseStyle = TypographyScale.amount[variant];

  // Monospace font for amount alignment
  const amountStyle: TextStyle = {
    ...baseStyle,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      default: 'monospace',
    }),
    color: amountColor,
  };

  const formattedAmount = formatAmount(value);
  const displayText = showSymbol
    ? `${isNegative ? '-' : ''}${symbol}${formattedAmount}`
    : `${isNegative ? '-' : ''}${formattedAmount}`;

  return (
    <RNText
      style={[amountStyle, style]}
      allowFontScaling={true}
      {...props}
    >
      {displayText}
    </RNText>
  );
};

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Caption - Helper text, timestamps, metadata
 */
export const Caption: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        color: theme.colors.textLight,
      }}
      {...props}
    />
  );
};

/**
 * Overline - Small uppercase labels
 */
export const Overline: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: theme.colors.textSecondary,
      }}
      {...props}
    />
  );
};

/**
 * Link - Clickable text
 */
export const Link: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        color: theme.colors.primary,
        textDecorationLine: 'underline',
      }}
      {...props}
    />
  );
};

/**
 * ErrorText - Error messages
 */
export const ErrorText: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
        color: theme.colors.danger,
      }}
      {...props}
    />
  );
};

/**
 * SuccessText - Success messages
 */
export const SuccessText: React.FC<BaseTypographyProps> = (props) => {
  const { theme } = useTenantTheme();
  return (
    <BaseTypography
      baseStyle={{
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
        color: theme.colors.success,
      }}
      {...props}
    />
  );
};

// ============================================================================
// Default Export (namespace)
// ============================================================================

export default {
  DisplayLarge,
  DisplayMedium,
  DisplaySmall,
  HeadlineLarge,
  HeadlineMedium,
  HeadlineSmall,
  TitleLarge,
  TitleMedium,
  TitleSmall,
  BodyLarge,
  BodyMedium,
  BodySmall,
  LabelLarge,
  LabelMedium,
  LabelSmall,
  Amount,
  Caption,
  Overline,
  Link,
  ErrorText,
  SuccessText,
};
