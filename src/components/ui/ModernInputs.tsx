/**
 * Modern Input Components for OrokiiPay
 * Glassmorphic design with tenant theming
 * Based on MODERN_UI_DESIGN_SYSTEM.md specifications
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Text as RNText,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Platform,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { getCurrencySymbol } from '../../utils/currency';

const { width: screenWidth } = Dimensions.get('window');

interface ModernInputBaseProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

/**
 * ModernTextInput
 * Glassmorphic text input with tenant theming
 */
export interface ModernTextInputProps extends ModernInputBaseProps {
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  loading?: boolean;
}

export const ModernTextInput: React.FC<ModernTextInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  required = false,
  style,
  inputStyle,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  loading = false,
}) => {
  const { theme } = useTenantTheme() as any;
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    required: {
      color: theme.colors.danger,
    },
    inputWrapper: {
      position: 'relative',
    },
    inputContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 2,
      borderColor: isFocused ? theme.colors.primary : '#e2e8f0',
      borderRadius: 12,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
          boxShadow: isFocused ? `0 0 0 3px ${theme.colors.primary}33` : 'none',
        },
      }),
    },
    inputContainerError: {
      borderColor: '#EF4444',
      borderWidth: 2,
    },
    inputContainerDisabled: {
      opacity: 0.6,
      backgroundColor: '#f3f4f6',
    },
    leftIconContainer: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: '#1a1a2e',
      paddingVertical: 12,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'system-ui' }),
    },
    rightIconContainer: {
      marginLeft: 12,
    },
    helperText: {
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    helperTextNormal: {
      color: '#6c757d',
    },
    helperTextError: {
      color: '#EF4444',
    },
    loadingIndicator: {
      marginLeft: 8,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <RNText style={styles.label}>
            {label}
            {required && <RNText style={styles.required}> *</RNText>}
          </RNText>
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            error && styles.inputContainerError,
            disabled && styles.inputContainerDisabled,
          ]}
        >
          {/* Left Icon */}
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

          {/* Text Input */}
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            editable={!disabled && !loading}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}

          {/* Right Icon */}
          {rightIcon && !loading && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      </View>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <RNText style={[styles.helperText, error ? styles.helperTextError : styles.helperTextNormal]}>
          {error || helperText}
        </RNText>
      )}
    </View>
  );
};

/**
 * ModernAmountInput
 * Large centered amount display for banking transactions
 */
export interface ModernAmountInputProps extends Omit<ModernInputBaseProps, 'placeholder'> {
  currency?: string;
  onAmountChange?: (amount: number) => void;
  maxAmount?: number;
  showQuickAmounts?: boolean;
  quickAmounts?: number[];
  showLimits?: boolean;
  dailyLimit?: number;
  availableBalance?: number;
  remainingToday?: number;
}

export const ModernAmountInput: React.FC<ModernAmountInputProps> = ({
  label = 'Transfer Amount',
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  required = false,
  style,
  currency,
  onAmountChange,
  maxAmount,
  showQuickAmounts = true,
  quickAmounts = [1000, 5000, 10000, 50000],
  showLimits = false,
  dailyLimit,
  availableBalance,
  remainingToday,
}) => {
  const { theme } = useTenantTheme() as any;
  const currencySymbol = currency ? getCurrencySymbol(currency) : getCurrencySymbol(theme.currency);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return '0';
    return numAmount.toLocaleString('en-NG');
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (!cleaned) {
      onChangeText('');
      onAmountChange?.(0);
      return;
    }
    const formatted = parseInt(cleaned).toLocaleString('en-NG');
    onChangeText(formatted);
    onAmountChange?.(parseInt(cleaned));
  };

  const setQuickAmount = (amount: number) => {
    const formatted = amount.toLocaleString('en-NG');
    onChangeText(formatted);
    onAmountChange?.(amount);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 16,
      padding: screenWidth > 600 ? 24 : 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      width: '100%',
      maxWidth: '100%',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    headerIcon: {
      fontSize: 20,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: screenWidth > 600 ? 18 : 16,
      fontWeight: '600',
      color: '#1a1a2e',
    },
    amountInput: {
      fontSize: screenWidth > 600 ? 48 : screenWidth > 400 ? 36 : 28,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.colors.primary,
      marginBottom: 10,
      paddingVertical: 8,
      width: '100%',
    },
    currencyLabel: {
      fontSize: screenWidth > 600 ? 14 : 12,
      color: '#6c757d',
      textAlign: 'center',
      marginBottom: 20,
    },
    quickAmountsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
      justifyContent: 'space-between',
    },
    quickAmountBtn: {
      flexBasis: screenWidth > 600 ? '23%' : '48%',
      padding: screenWidth > 600 ? 10 : 8,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: `${theme.colors.primary}15`,
    },
    quickAmountBtnText: {
      fontSize: screenWidth > 600 ? 12 : 10,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    limitsInfo: {
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingTop: 15,
      width: '100%',
    },
    limitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    limitLabel: {
      fontSize: 13,
      color: '#6c757d',
    },
    limitValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1a1a2e',
    },
    limitValueHighlight: {
      color: theme.colors.primary,
    },
    error: {
      fontSize: 12,
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <RNText style={styles.headerIcon}>💰</RNText>
        <RNText style={styles.headerTitle}>{label}</RNText>
      </View>

      {/* Amount Input */}
      <TextInput
        style={styles.amountInput}
        placeholder="0"
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        editable={!disabled}
      />
      <RNText style={styles.currencyLabel}>
        {currencySymbol} - {theme.currency}
      </RNText>

      {/* Quick Amount Buttons */}
      {showQuickAmounts && (
        <View style={styles.quickAmountsGrid}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAmountBtn}
              onPress={() => setQuickAmount(amount)}
              disabled={disabled}
            >
              <RNText style={styles.quickAmountBtnText}>
                {currencySymbol}
                {amount >= 1000 ? `${amount / 1000}K` : amount}
              </RNText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Limits Information */}
      {showLimits && (dailyLimit || availableBalance || remainingToday) && (
        <View style={styles.limitsInfo}>
          {dailyLimit && (
            <View style={styles.limitRow}>
              <RNText style={styles.limitLabel}>Daily Limit:</RNText>
              <RNText style={styles.limitValue}>{formatCurrency(dailyLimit)}</RNText>
            </View>
          )}
          {availableBalance && (
            <View style={styles.limitRow}>
              <RNText style={styles.limitLabel}>Available Balance:</RNText>
              <RNText style={styles.limitValue}>{formatCurrency(availableBalance)}</RNText>
            </View>
          )}
          {remainingToday && (
            <View style={styles.limitRow}>
              <RNText style={styles.limitLabel}>Remaining Today:</RNText>
              <RNText style={[styles.limitValue, styles.limitValueHighlight]}>
                {formatCurrency(remainingToday)}
              </RNText>
            </View>
          )}
        </View>
      )}

      {/* Error Message */}
      {error && <RNText style={styles.error}>{error}</RNText>}
    </View>
  );
};

/**
 * ModernDropdown
 * Glassmorphic dropdown/picker component
 */
export interface ModernDropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface ModernDropdownProps extends Omit<ModernInputBaseProps, 'value' | 'onChangeText'> {
  options: ModernDropdownOption[];
  value?: string;
  onSelect: (value: string, option: ModernDropdownOption) => void;
  searchable?: boolean;
  leftIcon?: React.ReactNode;
}

export const ModernDropdown: React.FC<ModernDropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onSelect,
  error,
  helperText,
  disabled = false,
  required = false,
  style,
  searchable = false,
  leftIcon,
}) => {
  const { theme } = useTenantTheme() as any;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    required: {
      color: theme.colors.danger,
    },
    dropdownButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 2,
      borderColor: isFocused || isOpen ? theme.colors.primary : '#e2e8f0',
      borderRadius: 12,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    dropdownButtonError: {
      borderColor: '#EF4444',
    },
    dropdownButtonDisabled: {
      opacity: 0.6,
      backgroundColor: '#f3f4f6',
    },
    leftIconContainer: {
      marginRight: 12,
    },
    dropdownText: {
      flex: 1,
      fontSize: 16,
      color: '#1a1a2e',
    },
    dropdownPlaceholder: {
      color: '#94a3b8',
    },
    chevron: {
      fontSize: 20,
      color: '#6c757d',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      ...Platform.select({
        web: {
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        },
      }),
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1a1a2e',
      textAlign: 'center',
    },
    searchContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    searchInput: {
      backgroundColor: '#f3f4f6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    optionsList: {
      paddingVertical: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    optionSelected: {
      backgroundColor: `${theme.colors.primary}10`,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: '#1a1a2e',
    },
    optionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    checkmark: {
      fontSize: 20,
      color: theme.colors.primary,
    },
    helperText: {
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    helperTextNormal: {
      color: '#6c757d',
    },
    helperTextError: {
      color: '#EF4444',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <RNText style={styles.label}>
            {label}
            {required && <RNText style={styles.required}> *</RNText>}
          </RNText>
        </View>
      )}

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          error && styles.dropdownButtonError,
          disabled && styles.dropdownButtonDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        {selectedOption?.icon && <View style={styles.leftIconContainer}>{selectedOption.icon}</View>}
        <RNText style={[styles.dropdownText, !selectedOption && styles.dropdownPlaceholder]}>
          {selectedOption?.label || placeholder}
        </RNText>
        <RNText style={styles.chevron}>{isOpen ? '▲' : '▼'}</RNText>
      </TouchableOpacity>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <RNText style={[styles.helperText, error ? styles.helperTextError : styles.helperTextNormal]}>
          {error || helperText}
        </RNText>
      )}

      {/* Modal */}
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>{label || 'Select Option'}</RNText>
            </View>

            {/* Search */}
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item.value, item);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {item.icon && <View style={styles.optionIcon}>{item.icon}</View>}
                    <RNText style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </RNText>
                    {isSelected && <RNText style={styles.checkmark}>✓</RNText>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
