/**
 * OrokiiPay Enhanced Input Components
 * Banking-specific form inputs with design system integration and security
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { createInputStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

interface BaseInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const EnhancedInput: React.FC<BaseInputProps & {
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'md',
  variant = 'outlined',
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  maxLength,
  multiline = false,
  numberOfLines = 1,
}) => {
  const theme = useTheme();
  const inputStyles = createInputStyles(theme, {
    size,
    variant,
    error: !!error,
    disabled,
    focused: false,
  });

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, inputStyles.label]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        inputStyles.container,
        isFocused && inputStyles.focused,
        error && inputStyles.error,
        disabled && inputStyles.disabled,
      ]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={[styles.icon, styles.leftIcon]}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            inputStyles.input,
            inputStyle,
            multiline && styles.multilineInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral[400]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {/* Password Toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            style={[styles.icon, styles.rightIcon]}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordToggle}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {rightIcon && !secureTextEntry && (
          <View style={[styles.icon, styles.rightIcon]}>
            {rightIcon}
          </View>
        )}
      </View>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error ? styles.errorText : styles.normalHelperText,
          { color: error ? theme.colors.semantic.error[500] : theme.colors.neutral[500] }
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// Phone Number Input
export const PhoneInput: React.FC<BaseInputProps & {
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  format?: 'international' | 'national' | 'compact';
}> = ({
  label = 'Phone Number',
  placeholder = '080 1234 5678',
  value,
  onChangeText,
  countryCode = '+234',
  onCountryCodeChange,
  format = 'national',
  ...props
}) => {
  const formatPhoneNumber = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    
    // Format based on Nigerian phone number patterns
    if (format === 'national') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`;
    }
    
    return digits;
  };

  const handleChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <EnhancedInput
      {...props}
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={handleChange}
      keyboardType="phone-pad"
      maxLength={format === 'national' ? 13 : 11}
      leftIcon={
        <Text style={styles.countryCode}>{countryCode}</Text>
      }
    />
  );
};

// Currency Input
export const CurrencyInput: React.FC<BaseInputProps & {
  currency?: string;
  onAmountChange?: (amount: number) => void;
}> = ({
  label = 'Amount',
  placeholder = '0.00',
  value,
  onChangeText,
  currency = '₦',
  onAmountChange,
  ...props
}) => {
  const formatCurrency = (text: string) => {
    // Remove non-digits and decimal points
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Handle decimal places
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    
    return cleaned;
  };

  const handleChange = (text: string) => {
    const formatted = formatCurrency(text);
    onChangeText(formatted);
    
    const amount = parseFloat(formatted || '0');
    if (onAmountChange && !isNaN(amount)) {
      onAmountChange(amount);
    }
  };

  return (
    <EnhancedInput
      {...props}
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={handleChange}
      keyboardType="numeric"
      leftIcon={
        <Text style={styles.currencySymbol}>{currency}</Text>
      }
    />
  );
};

// Account Number Input
export const AccountNumberInput: React.FC<BaseInputProps & {
  bankCode?: string;
  onAccountNumberChange?: (accountNumber: string) => void;
  onValidation?: (isValid: boolean, accountName?: string) => void;
}> = ({
  label = 'Account Number',
  placeholder = '0123456789',
  value,
  onChangeText,
  bankCode,
  onAccountNumberChange,
  onValidation,
  ...props
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [accountName, setAccountName] = useState('');

  const validateAccountNumber = async (accountNumber: string, bankCode?: string) => {
    if (accountNumber.length === 10 && bankCode) {
      setIsValidating(true);
      
      try {
        // Here you would integrate with account validation API
        // For now, we'll simulate validation
        setTimeout(() => {
          const mockAccountName = 'John Doe';
          setAccountName(mockAccountName);
          setIsValidating(false);
          onValidation?.(true, mockAccountName);
        }, 1500);
      } catch (error) {
        setIsValidating(false);
        onValidation?.(false);
      }
    } else {
      setAccountName('');
      onValidation?.(false);
    }
  };

  const handleChange = (text: string) => {
    // Only allow digits and limit to 10 characters
    const digits = text.replace(/\D/g, '').slice(0, 10);
    onChangeText(digits);
    onAccountNumberChange?.(digits);
    
    if (digits.length === 10) {
      validateAccountNumber(digits, bankCode);
    } else {
      setAccountName('');
    }
  };

  return (
    <View>
      <EnhancedInput
        {...props}
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChange}
        keyboardType="numeric"
        maxLength={10}
        rightIcon={isValidating ? (
          <Text style={styles.validating}>⏳</Text>
        ) : accountName ? (
          <Text style={styles.validated}>✅</Text>
        ) : null}
      />
      {accountName && (
        <Text style={styles.accountName}>
          {accountName}
        </Text>
      )}
    </View>
  );
};

// PIN Input
export const PINInput: React.FC<{
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (pin: string) => void;
  label?: string;
  error?: string;
  masked?: boolean;
}> = ({
  length = 4,
  value,
  onChangeText,
  onComplete,
  label = 'PIN',
  error,
  masked = true,
}) => {
  const theme = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    newValue[index] = text;
    const updatedValue = newValue.join('').slice(0, length);
    
    onChangeText(updatedValue);
    
    // Auto-focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Call onComplete when PIN is fully entered
    if (updatedValue.length === length) {
      onComplete?.(updatedValue);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.pinContainer}>
      {label && (
        <Text style={[styles.label, { color: theme.computed.text.primary }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.pinInputs}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={ref => inputRefs.current[index] = ref}
            style={[
              styles.pinInput,
              {
                borderColor: error ? theme.colors.semantic.error[500] : theme.computed.border.medium,
                color: theme.computed.text.primary,
              }
            ]}
            value={value[index] || ''}
            onChangeText={text => handleChange(text.slice(-1), index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry={masked}
            textAlign="center"
          />
        ))}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.semantic.error[500] }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

// OTP Input (similar to PIN but typically 6 digits)
export const OTPInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (otp: string) => void;
  label?: string;
  error?: string;
  resendOTP?: () => void;
  countdown?: number;
}> = ({
  value,
  onChangeText,
  onComplete,
  label = 'Enter OTP',
  error,
  resendOTP,
  countdown,
}) => {
  const theme = useTheme();

  return (
    <View>
      <PINInput
        length={6}
        value={value}
        onChangeText={onChangeText}
        onComplete={onComplete}
        label={label}
        error={error}
        masked={false}
      />
      
      {resendOTP && (
        <View style={styles.otpActions}>
          <Text style={[styles.otpText, { color: theme.computed.text.secondary }]}>
            Didn't receive OTP?
          </Text>
          <TouchableOpacity
            onPress={resendOTP}
            disabled={!!countdown && countdown > 0}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendText,
              {
                color: countdown && countdown > 0 
                  ? theme.computed.text.tertiary
                  : theme.colors.primary[500]
              }
            ]}>
              {countdown && countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  icon: {
    paddingHorizontal: 12,
  },
  leftIcon: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  rightIcon: {
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  passwordToggle: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  validating: {
    fontSize: 16,
  },
  validated: {
    fontSize: 16,
  },
  accountName: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  normalHelperText: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // PIN Input Styles
  pinContainer: {
    marginBottom: 16,
  },
  pinInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
  },
  
  // OTP Input Styles
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  otpText: {
    fontSize: 14,
  },
  resendButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EnhancedInput;