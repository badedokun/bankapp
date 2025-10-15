/**
 * Secure Login Screen Component
 * Multi-tenant login with comprehensive security features
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from '../../components/common/LinearGradient';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTenant, useTenantBranding } from '../../tenants/TenantContext';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { triggerHaptic } from '../../utils/haptics';
import { SecurityMonitor, SecurityConfig } from '../../utils/security';
import APIService from '../../services/api';
import DeploymentManager from '../../config/deployment';
import { useNotification } from '../../services/ModernNotificationService';
import { ENV_CONFIG, buildApiUrl } from '../../config/environment';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: screenWidth } = Dimensions.get('window');

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginScreenProps {
  onLogin?: (credentials: LoginFormData) => Promise<void>;
  onForgotPassword?: () => void;
  onBiometricAuth?: (type: 'fingerprint' | 'faceId' | 'voice') => void;
  navigation?: any; // React Navigation prop
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onForgotPassword,
  onBiometricAuth,
  navigation,
}) => {
  const { currentTenant, isLoading } = useTenant();
  const { theme } = useTenantTheme() as any;
  const branding = useTenantBranding();
  const deploymentBranding = DeploymentManager.getDeploymentBranding();
  const notify = useNotification();

  // Form state with security validation
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [fmfbLogoError, setFmfbLogoError] = useState(false);
  const [fmfbLogoLoading, setFmfbLogoLoading] = useState(true);

  // Refs for input fields
  const passwordInputRef = useRef<any>(null);

  // Security monitoring
  useEffect(() => {
    // Reset login attempts when component mounts or tenant changes
    if (currentTenant?.id) {
      setLoginAttempts(0);
    }
  }, [currentTenant?.id]);

  // Handle form field changes with validation
  const handleFieldChange = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Validate individual fields
  const handleEmailValidation = useCallback((isValid: boolean, error?: string) => {
    if (!isValid && error) {
      setFormErrors(prev => ({ ...prev, email: error }));
    } else {
      setFormErrors(prev => ({ ...prev, email: undefined }));
    }
  }, []);

  const handlePasswordValidation = useCallback((isValid: boolean, error?: string) => {
    if (!isValid && error) {
      setFormErrors(prev => ({ ...prev, password: error }));
    } else {
      setFormErrors(prev => ({ ...prev, password: undefined }));
    }
  }, []);

  // Handle form submission with security checks
  const handleSubmit = useCallback(async () => {
    console.log('🎯 handleSubmit called - formData:', formData);
    console.log('🎯 formErrors:', formErrors);
    console.log('🎯 isSubmitting:', isSubmitting);

    if (isSubmitting) return;

    // Check if user is blocked due to too many attempts
    const attemptCheck = SecurityMonitor.trackLoginAttempt(formData.email || 'anonymous');
    if (attemptCheck.blocked) {
      notify.error(
        `Your account has been temporarily locked due to multiple failed login attempts. For your security, please wait 1 hour before trying again, or contact our support team for immediate assistance.`,
        '🔒 Account Security Lock'
      );
      return;
    }

    // Validate form data
    const hasErrors = Object.values(formErrors).some(error => error !== undefined);
    console.log('🔍 Validation check - hasErrors:', hasErrors, 'email:', formData.email, 'password:', formData.password);
    if (hasErrors || !formData.email || !formData.password) {
      console.log('❌ Validation failed - showing alert');
      notify.warning(
        'Please ensure all fields are filled correctly before proceeding. Check that your email address is valid and your password meets the security requirements.',
        '⚠️ Form Validation',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (onLogin) {
        // Use custom login handler if provided
        await onLogin(formData);
        SecurityMonitor.resetLoginAttempts(formData.email);
      } else {
        // Use API service for authentication
        console.log('Attempting API login with:', {
          tenant: currentTenant?.id,
          email: formData.email,
          timestamp: new Date().toISOString(),
        });
        
        // Use current tenant context directly
        // Tenant should already be set via subdomain, header, or environment
        const tenantId = currentTenant?.id || currentTenant?.name;

        if (!tenantId) {
          notify.error(
            'Tenant context is required for login. Please ensure you are accessing the application from the correct domain.',
            'Missing Tenant Context'
          );
          return;
        }

        const loginResponse = await APIService.login({
          email: formData.email,
          password: formData.password,
          tenantId,
          deviceInfo: {
            rememberMe: formData.rememberMe,
            platform: Platform.OS,
            screenSize: `${screenWidth}x${Dimensions.get('window').height}`,
          }
        });
        
        console.log('🎉 Login API call successful! Response:', loginResponse);
        console.log('👤 User object:', loginResponse.user);
        console.log('💰 Wallet object:', loginResponse.user?.wallet);
        
        // Reset attempts on successful login
        SecurityMonitor.resetLoginAttempts(formData.email);
        
        console.log('📱 About to navigate to dashboard...');
        console.log('Login successful, user data:', {
          id: loginResponse.user.id,
          name: `${loginResponse.user.firstName} ${loginResponse.user.lastName}`,
          tenant: loginResponse.user.tenant.displayName,
          balance: loginResponse.user.wallet?.availableBalance
        });
        
        // Dispatch auth state changed event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { isAuthenticated: true, user: loginResponse.user }
        }));

        // Navigate to main app immediately (Alert doesn't work well in web)
        if (navigation) {
          console.log('🚀 Calling navigation.replace(\'MainApp\')');
          navigation.replace('MainApp');
        } else {
          console.error('❌ Navigation object not available');
          // Try to reload the page as a fallback
          window.location.reload();
        }
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginAttempts(prev => prev + 1);
      
      // Handle different error types with professional security messaging
      let errorMessage = 'The credentials you entered are not valid. Please verify your email address and password, then try again.';
      let errorTitle = '🔐 Authentication Failed';
      let buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }> = [];
      
      if (error?.message) {
        if (error.message.includes('Account locked') || error.message.includes('too many')) {
          errorTitle = '🔒 Account Security Lock';
          errorMessage = 'Your account has been temporarily locked for security purposes due to multiple unsuccessful login attempts.\n\nTo protect your account, please wait 1 hour before attempting to sign in again, or contact our support team for immediate assistance.';
          buttons = [
            {
              text: 'Contact Support',
              onPress: () => {
                console.log('User requested support for locked account:', formData.email);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Account is inactive') || error.message.includes('suspended')) {
          errorTitle = '⚠️ Account Status';
          errorMessage = 'Your account is currently inactive or suspended.\n\nThis may be due to pending verification or security measures. Please contact our support team to restore account access.';
          buttons = [
            {
              text: 'Contact Support',
              onPress: () => {
                console.log('User requested support for inactive account:', formData.email);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Server is not accessible')) {
          errorTitle = '🌐 Connection Issue';
          errorMessage = 'We\'re unable to connect to our secure servers at the moment.\n\nPlease check your internet connection and try again. If the issue persists, our servers may be temporarily unavailable.';
          buttons = [
            {
              text: 'Retry',
              onPress: () => {
                setTimeout(() => handleSubmit(), 1000);
              }
            },
            {
              text: 'OK',
              onPress: () => {},
              style: 'default'
            }
          ];
        } else if (error.message.includes('Invalid credentials')) {
          errorTitle = '🔐 Authentication Failed';
          errorMessage = 'The email address or password you entered is incorrect.\n\nPlease double-check your credentials and try again. If you\'ve forgotten your password, you can reset it using the "Forgot Password" link.';
          buttons = [
            {
              text: 'Reset Password',
              onPress: () => {
                handleForgotPassword();
              }
            },
            {
              text: 'Try Again',
              onPress: () => {},
              style: 'default'
            }
          ];
        }
      }
      
      // Default buttons if none were set
      if (buttons.length === 0) {
        buttons = [
          {
            text: 'Reset Password',
            onPress: () => {
              handleForgotPassword();
            }
          },
          {
            text: 'Try Again',
            onPress: () => {},
            style: 'default'
          }
        ];
      }
      
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        notify.confirm(
          errorTitle,
          errorMessage,
          buttons[0].onPress,
          () => {}
        );
      } else {
        notify.error(errorMessage, errorTitle);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, formErrors, isSubmitting, onLogin, currentTenant, notify]);

  // Handle biometric authentication
  const handleBiometricAuth = useCallback((type: 'fingerprint' | 'faceId' | 'voice') => {
    triggerHaptic('light');
    if (onBiometricAuth) {
      onBiometricAuth(type);
    } else {
      const typeMap = {
        fingerprint: { emoji: '👆', name: 'Fingerprint' },
        faceId: { emoji: '😊', name: 'Face ID' },
        voice: { emoji: '🎤', name: 'Voice' }
      };

      notify.info(
        `${typeMap[type].name} authentication is not yet configured for this device. This feature would securely authenticate using your device's biometric sensors in a production environment.`,
        `${typeMap[type].emoji} ${typeMap[type].name} Authentication`
      );
    }
  }, [onBiometricAuth, notify]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    triggerHaptic('light');
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      notify.info(
        'Password reset functionality is not yet available in this demo environment. In a production application, you would receive a secure reset link via email to create a new password.',
        '🔑 Password Reset',
      );
    }
  }, [onForgotPassword, notify]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.layout.spacing * 1.25,
      paddingVertical: theme.layout.spacing * 2,
      minHeight: '100%',
    },
    loginCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.layout.borderRadiusLarge,
      marginHorizontal: screenWidth > 600 ? '20%' : 0,
      maxWidth: 440,
      alignSelf: 'center',
      width: '100%',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        android: {
          elevation: 12,
        },
        web: {
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      }),
    },
    tenantHeader: {
      backgroundColor: theme.colors.primary,
      paddingTop: theme.layout.spacing * 2.5,
      paddingBottom: theme.layout.spacing * 2,
      paddingHorizontal: theme.layout.spacing * 1.5,
      alignItems: 'center',
      borderTopLeftRadius: theme.layout.borderRadiusLarge,
      borderTopRightRadius: theme.layout.borderRadiusLarge,
    },
    tenantLogo: {
      width: 80,
      height: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.layout.spacing,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    tenantLogoText: {
      fontSize: 32,
      fontWeight: '700' as any,
      color: theme.colors.textInverse,
      fontFamily: theme.typography?.fontFamily,
      letterSpacing: 1,
    },
    tenantLogoImage: {
      width: 68,
      height: 68,
      borderRadius: 30,
    },
    tenantName: {
      fontSize: 22,
      fontWeight: '700' as any,
      color: theme.colors.textInverse,
      marginBottom: theme.layout.spacing * 0.5,
      fontFamily: theme.typography?.fontFamily,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    tenantSubtitle: {
      fontSize: 15,
      fontWeight: '500' as any,
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    formContainer: {
      padding: theme.layout.spacing * 2,
    },
    welcomeSection: {
      alignItems: 'center',
      marginBottom: theme.layout.spacing * 2,
    },
    welcomeTitle: {
      fontSize: 26,
      fontWeight: '700' as any,
      color: theme.colors.text,
      marginBottom: theme.layout.spacing * 0.5,
      fontFamily: theme.typography?.fontFamily,
      letterSpacing: 0.3,
    },
    welcomeSubtitle: {
      fontSize: 15,
      fontWeight: '400' as any,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    formSection: {
      marginBottom: theme.layout.spacing,
    },
    rememberForgotContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.layout.spacing,
    },
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.layout.spacing * 0.5,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkmark: {
      color: theme.colors.textInverse,
      fontSize: 14,
      fontWeight: '700' as any,
    },
    rememberText: {
      fontSize: 14,
      fontWeight: '500' as any,
      color: theme.colors.text,
      marginLeft: theme.layout.spacing * 0.75,
    },
    forgotPasswordButton: {
      padding: theme.layout.spacing * 0.5,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600' as any,
    },
    signInButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.layout.borderRadius,
      paddingVertical: theme.layout.spacing * 0.875,
      paddingHorizontal: theme.layout.spacing * 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      width: '100%',
      marginBottom: theme.layout.spacing * 1.5,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: `0 4px 12px ${theme.colors.primary}40`,
        },
      }),
    },
    signInButtonDisabled: {
      opacity: 0.6,
    },
    signInButtonText: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '700' as any,
      fontFamily: theme.typography?.fontFamily,
      letterSpacing: 0.5,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.layout.spacing,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border || '#e1e5e9',
    },
    dividerText: {
      paddingHorizontal: theme.layout.spacing * 0.75,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    biometricContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.layout.spacing,
      marginBottom: theme.layout.spacing * 1.5,
    },
    biometricButton: {
      flex: 1,
      maxWidth: 100,
      paddingVertical: theme.layout.spacing * 0.75,
      paddingHorizontal: theme.layout.spacing * 0.5,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.layout.borderRadius,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    biometricIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.layout.spacing * 0.5,
    },
    biometricIconText: {
      fontSize: 20,
      color: theme.colors.primary,
    },
    biometricLabel: {
      fontSize: 11,
      fontWeight: '600' as any,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    securityInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.layout.spacing * 0.5,
      padding: theme.layout.spacing,
      backgroundColor: `${theme.colors.info}08`,
      borderRadius: theme.layout.borderRadius,
      borderWidth: 1,
      borderColor: `${theme.colors.info}20`,
    },
    securityIconContainer: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.info,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.layout.spacing * 0.75,
    },
    securityIcon: {
      fontSize: 10,
      color: theme.colors.textInverse,
    },
    securityText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500' as any,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get tenant logo initials
  const getTenantLogoInitials = () => {
    if (!currentTenant?.displayName) return 'O';
    return currentTenant.displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          {/* Tenant Header */}
          <View style={styles.tenantHeader}>
            <View style={[
              styles.tenantLogo,
              theme.brandLogo && { backgroundColor: '#FFFFFF' }
            ]}>
              {theme.brandLogo ? (
                !fmfbLogoError ? (
                  <Image
                    source={{ uri: theme.brandLogo }}
                    style={styles.tenantLogoImage}
                    resizeMode="contain"
                    onLoad={() => {
                      console.log('✅ Tenant logo loaded successfully');
                      setFmfbLogoLoading(false);
                    }}
                    onError={(error) => {
                      console.log('❌ Tenant logo failed to load:', {
                        logoUrl: theme.brandLogo,
                        error: error.nativeEvent.error,
                        isReactNative: typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
                      });
                      setFmfbLogoError(true);
                      setFmfbLogoLoading(false);
                    }}
                  />
                ) : (
                  <Text style={styles.tenantLogoText}>
                    {getTenantLogoInitials()}
                  </Text>
                )
              ) : (
                <Text style={styles.tenantLogoText}>
                  {getTenantLogoInitials()}
                </Text>
              )}
            </View>
            <Text style={styles.tenantName}>
              {currentTenant?.displayName || theme.brandName || deploymentBranding.loginPageTitle}
            </Text>
            <Text style={styles.tenantSubtitle}>
              {currentTenant ? 'Secure Banking App' : theme.brandTagline || 'AI-Enhanced Banking Platform'}
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your account to continue
              </Text>
            </View>

            <View style={styles.formSection}>
              <Input
                label="Email or Phone"
                placeholder="Enter your email or phone number"
                validationType="email"
                value={formData.email}
                onChangeText={(text) => handleFieldChange('email', text)}
                onValidationChange={handleEmailValidation}
                enableSecurityValidation={true}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // Focus password field when enter is pressed
                  passwordInputRef.current?.focus();
                }}
              />

              <Input
                ref={passwordInputRef}
                label="Password"
                placeholder="Enter your password"
                validationType="password"
                sensitive={true}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => handleFieldChange('password', text)}
                onValidationChange={handlePasswordValidation}
                enableSecurityValidation={true}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                rightIcon={
                  <View style={{
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 12,
                    backgroundColor: showPassword ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                  }}>
                    <Text style={{
                      fontSize: 18,
                      color: theme.colors.textSecondary,
                    }}>
                      {showPassword ? '○' : '●'}
                    </Text>
                  </View>
                }
                onRightIconPress={togglePasswordVisibility}
              />
            </View>

            <View style={styles.rememberForgotContainer}>
              <TouchableOpacity
                style={styles.rememberContainer}
                onPress={() => handleFieldChange('rememberMe', !formData.rememberMe)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: formData.rememberMe }}
              >
                <View style={[
                  styles.checkbox,
                  formData.rememberMe && styles.checkboxChecked
                ]}>
                  {formData.rememberMe && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                console.log('🚀 Sign In button pressed');
                triggerHaptic('medium');
                handleSubmit();
              }}
              style={[styles.signInButton, isSubmitting && styles.signInButtonDisabled]}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Sign in to your account"
              accessibilityState={{ disabled: isSubmitting }}
            >
              <Text style={styles.signInButtonText}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Biometric Authentication */}
            <View style={styles.biometricContainer}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => handleBiometricAuth('fingerprint')}
                accessibilityRole="button"
                accessibilityLabel="Sign in with fingerprint"
              >
                <View style={styles.biometricIconContainer}>
                  <Text style={styles.biometricIconText}>●</Text>
                </View>
                <Text style={styles.biometricLabel}>Touch ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => handleBiometricAuth('faceId')}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Face ID"
              >
                <View style={styles.biometricIconContainer}>
                  <Text style={styles.biometricIconText}>◐</Text>
                </View>
                <Text style={styles.biometricLabel}>Face ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.biometricButton}
                onPress={() => handleBiometricAuth('voice')}
                accessibilityRole="button"
                accessibilityLabel="Sign in with voice"
              >
                <View style={styles.biometricIconContainer}>
                  <Text style={styles.biometricIconText}>♫</Text>
                </View>
                <Text style={styles.biometricLabel}>Voice</Text>
              </TouchableOpacity>
            </View>

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <View style={styles.securityIconContainer}>
                <Text style={styles.securityIcon}>●</Text>
              </View>
              <Text style={styles.securityText}>
                Your data is protected with bank-level security and encryption
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;