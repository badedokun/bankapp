/**
 * Share Receipt Modal Component
 * Reusable modal for sharing transaction receipts via email or phone
 *
 * Features:
 * - Locale-aware phone validation
 * - Input filtering (digits only for phone)
 * - Instant validation feedback
 * - Email validation
 * - World-Class UI compliant
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTenantTheme } from '../../tenants/TenantContext';
import { triggerHaptic } from '../../utils/haptics';

// World-Class UI Components
import GlassCard from '../ui/GlassCard';
import {
  TitleMedium,
  BodyMedium,
  BodySmall,
  LabelMedium,
} from '../ui/Typography';

/**
 * Get phone validation rules based on tenant locale
 * Supports international phone number formats
 */
const getPhoneValidation = (locale: string = 'en-NG') => {
  const validationRules: Record<string, { regex: RegExp; format: string; example: string }> = {
    'en-NG': {
      regex: /^0[789][01]\d{8}$/,
      format: '11 digits starting with 070, 080, 081, 090, or 091',
      example: '08012345678'
    },
    'en-US': {
      regex: /^[2-9]\d{9}$/,
      format: '10 digits',
      example: '5551234567'
    },
    'en-GB': {
      regex: /^(?:0[17]\d{8,9}|0[23]\d{9})$/,
      format: '10-11 digits starting with 0',
      example: '07700900123'
    },
    'en-KE': {
      regex: /^(?:0[17]\d{8}|254[17]\d{8})$/,
      format: '10 digits starting with 0 or 254',
      example: '0712345678'
    },
    'en-GH': {
      regex: /^0[235]\d{8}$/,
      format: '10 digits starting with 02, 03, or 05',
      example: '0201234567'
    },
    'en-ZA': {
      regex: /^0[1-8]\d{8}$/,
      format: '10 digits starting with 0',
      example: '0821234567'
    },
    'default': {
      regex: /^[0-9]{10,15}$/,
      format: '10-15 digits',
      example: '1234567890'
    }
  };

  return validationRules[locale] || validationRules['default'];
};

export interface ShareReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (method: 'email' | 'phone', value: string) => void;
  title?: string;
  description?: string;
}

export default function ShareReceiptModal({
  visible,
  onClose,
  onSubmit,
  title = 'Share Receipt',
  description = 'Choose how you want to share this transaction receipt',
}: ShareReceiptModalProps) {
  const theme = useTenantTheme();

  const [shareMethod, setShareMethod] = useState<'email' | 'phone'>('email');
  const [shareInput, setShareInput] = useState('');
  const [shareInputError, setShareInputError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setShareMethod('email');
      setShareInput('');
      setShareInputError('');
    }
  }, [visible]);

  const validateInput = (value: string, method: 'email' | 'phone'): string => {
    if (!value.trim()) {
      return '';
    }

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
    } else {
      // Locale-aware phone validation
      const phoneValidation = getPhoneValidation(theme.locale);
      if (!phoneValidation.regex.test(value)) {
        return `Invalid phone format. Expected: ${phoneValidation.format} (e.g., ${phoneValidation.example})`;
      }
    }

    return '';
  };

  const handleInputChange = (value: string) => {
    // For phone numbers, only allow digits
    if (shareMethod === 'phone') {
      // Filter out non-digit characters
      const digitsOnly = value.replace(/[^0-9]/g, '');
      setShareInput(digitsOnly);

      // Validate digits only
      const error = validateInput(digitsOnly, shareMethod);
      setShareInputError(error);
    } else {
      // For email, allow all characters
      setShareInput(value);

      // Validate email
      const error = validateInput(value, shareMethod);
      setShareInputError(error);
    }
  };

  const handleMethodChange = (method: 'email' | 'phone') => {
    triggerHaptic('selection');
    setShareMethod(method);
    setShareInput('');
    setShareInputError('');
  };

  const handleSubmit = () => {
    if (!shareInput.trim()) {
      setShareInputError(`Please enter a valid ${shareMethod === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    // Validate and check for errors
    const error = validateInput(shareInput, shareMethod);
    if (error) {
      setShareInputError(error);
      return;
    }

    triggerHaptic('notificationSuccess');
    onSubmit(shareMethod, shareInput);

    // Reset state
    setShareInput('');
    setShareInputError('');
  };

  const handleClose = () => {
    triggerHaptic('selection');
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      marginBottom: theme.spacing.lg,
    },
    methodToggle: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    methodButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      ...Platform.select({
        web: {
          cursor: 'pointer',
        },
      }),
    },
    methodButtonActive: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    inputError: {
      borderColor: theme.colors.error,
      borderWidth: 2,
    },
    errorMessage: {
      marginTop: -theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    modalButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          cursor: 'pointer',
        },
      }),
    },
    modalButtonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard blur="strong" shadow="large" padding="lg" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TitleMedium color={theme.colors.text}>{title}</TitleMedium>
                <BodySmall color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.xs }}>
                  {description}
                </BodySmall>
              </View>

              {/* Method Toggle */}
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    shareMethod === 'email' && styles.methodButtonActive
                  ]}
                  onPress={() => handleMethodChange('email')}
                >
                  <LabelMedium
                    color={shareMethod === 'email' ? theme.colors.primary : theme.colors.textSecondary}
                  >
                    📧 Email
                  </LabelMedium>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    shareMethod === 'phone' && styles.methodButtonActive
                  ]}
                  onPress={() => handleMethodChange('phone')}
                >
                  <LabelMedium
                    color={shareMethod === 'phone' ? theme.colors.primary : theme.colors.textSecondary}
                  >
                    📱 Phone
                  </LabelMedium>
                </TouchableOpacity>
              </View>

              {/* Input Field */}
              <TextInput
                style={[
                  styles.input,
                  shareInputError ? styles.inputError : null
                ]}
                placeholder={shareMethod === 'email' ? 'Enter email address' : 'Enter phone number'}
                placeholderTextColor={theme.colors.textLight}
                value={shareInput}
                onChangeText={handleInputChange}
                keyboardType={shareMethod === 'email' ? 'email-address' : 'number-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />

              {/* Error Message */}
              {shareInputError ? (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.errorMessage}>
                  <BodySmall color={theme.colors.error}>{shareInputError}</BodySmall>
                </Animated.View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={handleClose}
                >
                  <BodyMedium color={theme.colors.textSecondary}>Cancel</BodyMedium>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleSubmit}
                >
                  <BodyMedium color={theme.colors.textInverse}>Send Receipt</BodyMedium>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
