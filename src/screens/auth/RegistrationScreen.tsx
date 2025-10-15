/**
 * ============================================================================
 * WORLD-CLASS REGISTRATION SCREEN WITH REFERRAL CODE SUPPORT
 * ============================================================================
 * Purpose: Multi-step user registration with referral code validation
 * Design System: Nubank-inspired glassmorphism + gamification
 * Features:
 * - Referral code validation with live feedback
 * - Multi-step form with progress indicator
 * - Haptic feedback on all interactions
 * - Animated transitions between steps
 * - World-Class UI components (GlassCard, Typography, etc.)
 * ============================================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import LinearGradient from '../../components/common/LinearGradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { GlassCard } from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { triggerHaptic } from '../../utils/haptics';
import APIService from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface RegistrationFormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;

  // Step 2: Security
  password: string;
  confirmPassword: string;

  // Step 3: Referral (Optional)
  referralCode?: string;

  // Step 4: Terms
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface ReferralValidationResult {
  isValid: boolean;
  referrerName?: string;
  referrerTier?: string;
  bonusPoints?: number;
  message?: string;
}

interface RegistrationScreenProps {
  navigation?: any;
  onSuccess?: (userId: string) => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  navigation,
  onSuccess,
}) => {
  const { theme } = useTenantTheme() as any;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralValidation, setReferralValidation] = useState<ReferralValidationResult | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);

  // Animation values
  const progressWidth = useSharedValue(25);
  const stepScale = useSharedValue(1);

  // Update progress bar width
  useEffect(() => {
    progressWidth.value = withSpring((currentStep / 4) * 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const stepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stepScale.value }],
  }));

  // Handle field change
  const handleFieldChange = useCallback((field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setReferralValidation(null);
      return;
    }

    setIsValidatingReferral(true);
    triggerHaptic('light');

    try {
      const response = await APIService.post('/api/referrals/validate-code', { code });

      if ((response as any).data.success && (response as any).data.data.isValid) {
        setReferralValidation({
          isValid: true,
          referrerName: (response as any).data.data.referrerName,
          referrerTier: (response as any).data.data.referrerTier,
          bonusPoints: (response as any).data.data.bonusPoints || 100,
          message: `You'll receive ${(response as any).data.data.bonusPoints || 100} points on signup!`,
        });
        triggerHaptic('medium');
      } else {
        setReferralValidation({
          isValid: false,
          message: (response as any).data.data.message || 'Invalid referral code',
        });
        triggerHaptic('heavy');
      }
    } catch (error) {
      console.error('Referral validation error:', error);
      setReferralValidation({
        isValid: false,
        message: 'Unable to validate referral code',
      });
      triggerHaptic('heavy');
    } finally {
      setIsValidatingReferral(false);
    }
  }, []);

  // Debounced referral code validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.referralCode && formData.referralCode.length >= 6) {
        validateReferralCode(formData.referralCode);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.referralCode, validateReferralCode]);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const errors: Partial<Record<keyof RegistrationFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.firstName || formData.firstName.length < 2) {
        errors.firstName = 'First name is required (min 2 characters)';
      }
      if (!formData.lastName || formData.lastName.length < 2) {
        errors.lastName = 'Last name is required (min 2 characters)';
      }
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else {
        const age = Math.floor((Date.now() - new Date(formData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          errors.dateOfBirth = 'You must be 18 years or older';
        }
      }
      if (!formData.email || !formData.email.includes('@')) {
        errors.email = 'Valid email is required';
      }
      if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
        errors.phoneNumber = 'Valid phone number is required';
      }
    }

    if (currentStep === 2) {
      if (!formData.password || formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, number and special character';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (currentStep === 4) {
      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the terms and conditions';
      }
      if (!formData.agreeToPrivacy) {
        errors.agreeToPrivacy = 'You must agree to the privacy policy';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (!validateStep()) {
      triggerHaptic('heavy');
      return;
    }

    triggerHaptic('medium');
    stepScale.value = withSpring(0.95, {}, () => {
      stepScale.value = withSpring(1);
    });
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, [validateStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    triggerHaptic('light');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Handle registration submission
  const handleSubmit = useCallback(async () => {
    if (!validateStep()) {
      triggerHaptic('heavy');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('heavy');

    try {
      const response = await APIService.post('/api/registration/start', {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || null,
        dateOfBirth: formData.dateOfBirth,
        agreeToTerms: formData.agreeToTerms,
        referralCode: formData.referralCode || null,
      });

      if ((response as any).data.success) {
        triggerHaptic('medium');
        Alert.alert(
          '🎉 Registration Successful!',
          `Welcome aboard${formData.referralCode ? ` with ${referralValidation?.bonusPoints || 100} bonus points` : ''}! Please verify your email and phone number to continue.`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) {
                  onSuccess((response as any).data.data.userId);
                }
                if (navigation) {
                  navigation.navigate('VerifyContact', { userId: (response as any).data.data.userId });
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      triggerHaptic('heavy');
      Alert.alert(
        'Registration Failed',
        (error as any).response?.data?.error || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, navigation, onSuccess, referralValidation]);

  const styles = createStyles(theme);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={styles.stepTitle}>📝 Tell us about yourself</Text>
            <Text style={styles.stepSubtitle}>We need some basic information to get started</Text>

            <View style={styles.inputGroup}>
              <Input
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => handleFieldChange('firstName', text)}
                error={formErrors.firstName}
                placeholder="John"
                autoCapitalize="words"
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => handleFieldChange('lastName', text)}
                error={formErrors.lastName}
                placeholder="Doe"
                autoCapitalize="words"
              />
              <Input
                label="Middle Name (Optional)"
                value={formData.middleName}
                onChangeText={(text) => handleFieldChange('middleName', text)}
                placeholder="Optional"
                autoCapitalize="words"
              />
              <Input
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChangeText={(text) => handleFieldChange('dateOfBirth', text)}
                error={formErrors.dateOfBirth}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />
              <Input
                label="Email Address"
                value={formData.email}
                onChangeText={(text) => handleFieldChange('email', text)}
                error={formErrors.email}
                placeholder="john.doe@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleFieldChange('phoneNumber', text)}
                error={formErrors.phoneNumber}
                placeholder="+234 XXX XXX XXXX"
                keyboardType="phone-pad"
              />
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={styles.stepTitle}>🔒 Secure your account</Text>
            <Text style={styles.stepSubtitle}>Create a strong password to protect your account</Text>

            <View style={styles.inputGroup}>
              <Input
                label="Password"
                value={formData.password}
                onChangeText={(text) => handleFieldChange('password', text)}
                error={formErrors.password}
                placeholder="••••••••"
                secureTextEntry
              />
              <Input
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleFieldChange('confirmPassword', text)}
                error={formErrors.confirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password must contain:</Text>
                <Text style={styles.requirement}>• At least 8 characters</Text>
                <Text style={styles.requirement}>• Uppercase letter (A-Z)</Text>
                <Text style={styles.requirement}>• Lowercase letter (a-z)</Text>
                <Text style={styles.requirement}>• Number (0-9)</Text>
                <Text style={styles.requirement}>• Special character (@$!%*?&)</Text>
              </View>
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={styles.stepTitle}>🎁 Have a referral code?</Text>
            <Text style={styles.stepSubtitle}>Enter it below to get bonus rewards (optional)</Text>

            <View style={styles.inputGroup}>
              <Input
                label="Referral Code (Optional)"
                value={formData.referralCode}
                onChangeText={(text) => handleFieldChange('referralCode', text.toUpperCase())}
                placeholder="ABCD1234"
                autoCapitalize="characters"
                maxLength={8}
              />

              {isValidatingReferral && (
                <View style={styles.validationLoader}>
                  <Text style={styles.validationText}>Validating code...</Text>
                </View>
              )}

              {referralValidation && !isValidatingReferral && (
                <GlassCard
                  style={[
                    styles.referralValidationCard,
                    referralValidation.isValid ? styles.validCard : styles.invalidCard,
                  ] as any}
                >
                  <Text style={styles.validationIcon}>
                    {referralValidation.isValid ? '✅' : '❌'}
                  </Text>
                  {referralValidation.isValid ? (
                    <>
                      <Text style={[styles.validationMessage, { color: theme.colors.success }]}>
                        {referralValidation.message}
                      </Text>
                      <Text style={styles.referrerInfo}>
                        Referred by: {referralValidation.referrerName}
                      </Text>
                      {referralValidation.referrerTier && (
                        <Text style={styles.referrerTier}>
                          Tier: {referralValidation.referrerTier}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={[styles.validationMessage, { color: theme.colors.error }]}>
                      {referralValidation.message}
                    </Text>
                  )}
                </GlassCard>
              )}

              <View style={styles.referralInfo}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  Don't have a referral code? No worries! You can still register and enjoy all our features.
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={styles.stepTitle}>📜 Terms & Conditions</Text>
            <Text style={styles.stepSubtitle}>Please review and accept our terms to continue</Text>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  triggerHaptic('light');
                  handleFieldChange('agreeToTerms', !formData.agreeToTerms);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxChecked]}>
                  {formData.agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the{' '}
                  <Text style={styles.link}>Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>
              {formErrors.agreeToTerms && (
                <Text style={styles.errorText}>{formErrors.agreeToTerms}</Text>
              )}

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  triggerHaptic('light');
                  handleFieldChange('agreeToPrivacy', !formData.agreeToPrivacy);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, formData.agreeToPrivacy && styles.checkboxChecked]}>
                  {formData.agreeToPrivacy && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the{' '}
                  <Text style={styles.link}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {formErrors.agreeToPrivacy && (
                <Text style={styles.errorText}>{formErrors.agreeToPrivacy}</Text>
              )}

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📋 Registration Summary</Text>
                <Text style={styles.summaryItem}>
                  Name: {formData.firstName} {formData.lastName}
                </Text>
                <Text style={styles.summaryItem}>Email: {formData.email}</Text>
                <Text style={styles.summaryItem}>Phone: {formData.phoneNumber}</Text>
                {formData.referralCode && referralValidation?.isValid && (
                  <Text style={[styles.summaryItem, { color: theme.colors.success }]}>
                    ✨ Referral: {formData.referralCode} (+{referralValidation.bonusPoints} points)
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[
          theme.colors.primary,
          theme.colors.primaryDark || theme.colors.primary,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.springify()} style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join thousands of happy users</Text>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
            </View>
            <Text style={styles.progressText}>Step {currentStep} of 4</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={stepAnimatedStyle}
          >
            <GlassCard style={styles.formCard}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                {currentStep > 1 && (
                  <Button
                    title="Previous"
                    onPress={handlePrevious}
                    variant="outline"
                    style={styles.navButton}
                  />
                )}

                {currentStep < 4 ? (
                  <Button
                    title="Next"
                    onPress={handleNext}
                    style={[styles.navButton, currentStep === 1 && styles.fullWidthButton]}
                  />
                ) : (
                  <Button
                    title={isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={styles.fullWidthButton}
                  />
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Login Link */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                navigation?.navigate('Login');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.spacing * 2,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 0,
    marginBottom: theme.layout.spacing * 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textInverse,
    fontFamily: theme.typography.fontFamily?.display || theme.typography.fontFamily?.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  progressContainer: {
    marginBottom: theme.layout.spacing * 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  formCard: {
    padding: theme.layout.spacing * 2,
    marginBottom: theme.layout.spacing * 2,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.layout.spacing * 2,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  inputGroup: {
    gap: theme.layout.spacing,
  },
  passwordRequirements: {
    padding: theme.layout.spacing,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  requirement: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  validationLoader: {
    padding: theme.layout.spacing,
    alignItems: 'center',
  },
  validationText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  referralValidationCard: {
    padding: theme.layout.spacing,
    alignItems: 'center',
    marginTop: 8,
  },
  validCard: {
    borderColor: theme.colors.success,
    borderWidth: 1,
  },
  invalidCard: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  validationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  validationMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  referrerInfo: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  referrerTier: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  referralInfo: {
    flexDirection: 'row',
    padding: theme.layout.spacing,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.layout.spacing,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: -8,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  summaryCard: {
    padding: theme.layout.spacing,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  summaryItem: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 6,
    fontFamily: theme.typography.fontFamily?.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.layout.spacing,
    marginTop: theme.layout.spacing * 2,
  },
  navButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fontFamily?.primary,
  },
  footerLink: {
    fontSize: 14,
    color: theme.colors.textInverse,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: theme.typography.fontFamily?.primary,
  },
});

export default RegistrationScreen;
