/**
 * Secure Custom Input Component
 * Tenant-aware input with comprehensive security features
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Alert,
} from 'react-native';
import { useTenantTheme } from '@/tenants/TenantContext';
import { InputSanitizer, InputValidator, SecurityMonitor, SecurityConfig } from '@/utils/security';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: any;
  validationType?: 'email' | 'phone' | 'password' | 'amount' | 'accountNumber' | 'text';
  enableSecurityValidation?: boolean;
  maxLength?: number;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  sensitive?: boolean; // For password/PIN fields
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  validationType = 'text',
  enableSecurityValidation = true,
  maxLength,
  onValidationChange,
  sensitive = false,
  value,
  onChangeText,
  ...props
}) => {
  const theme = useTenantTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationError, setValidationError] = useState<string | undefined>(error);
  const inputRef = useRef<TextInput>(null);
  
  // Security monitoring
  const securityCheckCount = useRef(0);

  // Secure input handling with validation
  const handleSecureTextChange = useCallback((text: string) => {
    // Increment security check counter
    securityCheckCount.current += 1;
    
    // Detect suspicious input patterns
    if (enableSecurityValidation) {
      const suspiciousCheck = SecurityMonitor.detectSuspiciousInput(text);
      if (suspiciousCheck.suspicious) {
        console.warn('Suspicious input detected:', suspiciousCheck.reasons);
        Alert.alert(
          'Security Warning',
          'Invalid characters detected. Please enter valid information.',
          [{ text: 'OK' }]
        );
        return; // Don't update input
      }
    }

    // Apply sanitization based on validation type
    let sanitizedText = text;
    const effectiveMaxLength = maxLength || SecurityConfig.maxInputLength[validationType as keyof typeof SecurityConfig.maxInputLength] || 255;
    
    switch (validationType) {
      case 'email':
        sanitizedText = InputSanitizer.sanitizeEmail(text);
        break;
      case 'phone':
        sanitizedText = InputSanitizer.sanitizePhone(text);
        break;
      case 'amount':
        sanitizedText = InputSanitizer.sanitizeNumeric(text, true);
        break;
      case 'accountNumber':
        sanitizedText = InputSanitizer.sanitizeNumeric(text, false);
        break;
      default:
        sanitizedText = InputSanitizer.sanitizeText(text, effectiveMaxLength);
        break;
    }

    // Update internal state
    setInternalValue(sanitizedText);
    
    // Perform validation if enabled
    if (enableSecurityValidation && sanitizedText.length > 0) {
      let validation = { isValid: true, error: undefined };
      
      switch (validationType) {
        case 'email':
          validation = InputValidator.validateEmail(sanitizedText);
          break;
        case 'phone':
          validation = InputValidator.validatePhone(sanitizedText);
          break;
        case 'password':
          validation = InputValidator.validatePassword(sanitizedText);
          break;
        case 'amount':
          validation = InputValidator.validateAmount(sanitizedText);
          break;
        case 'accountNumber':
          validation = InputValidator.validateAccountNumber(sanitizedText);
          break;
      }
      
      setValidationError(validation.error);
      onValidationChange?.(validation.isValid, validation.error);
    } else {
      setValidationError(undefined);
      onValidationChange?.(true);
    }

    // Call parent onChangeText with sanitized value
    onChangeText?.(sanitizedText);
  }, [validationType, enableSecurityValidation, maxLength, onChangeText, onValidationChange]);

  // Security-focused input properties
  const getSecureInputProps = useCallback(() => {
    const baseProps: any = {
      autoComplete: 'off',
      autoCorrect: false,
      spellCheck: false,
    };

    if (sensitive) {
      baseProps.textContentType = 'none';
      baseProps.secureTextEntry = validationType === 'password';
    }

    switch (validationType) {
      case 'email':
        return {
          ...baseProps,
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          textContentType: 'emailAddress',
          autoComplete: 'email',
        };
      case 'phone':
        return {
          ...baseProps,
          keyboardType: 'phone-pad',
          textContentType: 'telephoneNumber',
          autoComplete: 'tel',
        };
      case 'password':
        return {
          ...baseProps,
          secureTextEntry: true,
          textContentType: 'password',
          autoComplete: 'current-password',
          autoCapitalize: 'none',
        };
      case 'amount':
        return {
          ...baseProps,
          keyboardType: 'decimal-pad',
        };
      case 'accountNumber':
        return {
          ...baseProps,
          keyboardType: 'number-pad',
          maxLength: 10,
        };
      default:
        return baseProps;
    }
  }, [validationType, sensitive]);

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    inputContainer: {
      position: 'relative',
    },
    input: {
      backgroundColor: '#fafbfc',
      borderWidth: 2,
      borderColor: isFocused ? theme.colors.primary : '#e1e5e9',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      fontSize: theme.typography.sizes.md,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      minHeight: 48,
    },
    inputFocused: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    rightIconContainer: {
      position: 'absolute',
      right: theme.spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }],
    },
    error: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          {...props}
          {...getSecureInputProps()}
          ref={inputRef}
          value={internalValue}
          onChangeText={handleSecureTextChange}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            (validationError || error) && styles.inputError,
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor="#999"
          maxLength={maxLength || SecurityConfig.maxInputLength[validationType as keyof typeof SecurityConfig.maxInputLength]}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {(validationError || error) && (
        <Text style={styles.error}>{validationError || error}</Text>
      )}
    </View>
  );
};

export default Input;