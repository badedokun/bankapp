/**
 * Professional Alert Service for Banking Application
 * Modern World-Class UI with tenant theme integration
 * Works across iOS, Android, and Web platforms
 */

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Provider as PaperProvider, DefaultTheme, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTenantTheme } from '../tenants/TenantContext';

// Custom theme for banking app
const bankingTheme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1e3a8a', // Professional blue
    secondary: '#64748b',
    error: '#dc2626',
    success: '#16a34a',
    warning: '#f59e0b',
    info: '#0891b2',
    surface: '#ffffff',
    background: '#f8fafc',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onError: '#ffffff',
    onBackground: '#1e293b',
    onSurface: '#1e293b',
  },
  roundness: 2,
};

// Alert state interface
interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

// Alert Context for global access
const AlertContext = createContext<{
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  showPrompt: (title: string, message: string, onSubmit: (text: string) => void, options?: PromptOptions) => void;
} | null>(null);

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface PromptOptions {
  placeholder?: string;
  defaultValue?: string;
  cancelable?: boolean;
  type?: 'plain-text' | 'secure-text';
}

/**
 * Alert Provider Component
 * Wrap your app with this provider to enable professional alerts
 */
export const BankingAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={bankingTheme}>
        <AlertServiceProvider>
          {children}
        </AlertServiceProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

/**
 * Modern Alert Dialog Component with World-Class UI
 */
const ModernAlertDialog: React.FC<{ alertState: AlertState; onDismiss: () => void }> = ({ alertState, onDismiss }) => {
  const theme = useTenantTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 24,
      minWidth: 300,
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 24,
        },
        android: {
          elevation: 12,
        },
        web: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        },
      }),
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
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
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.text,
          shadowOpacity: 0.1,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    destructiveButton: {
      backgroundColor: theme.colors.danger,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    primaryButtonText: {
      color: theme.colors.textInverse,
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    destructiveButtonText: {
      color: theme.colors.textInverse,
    },
  });

  return (
    <Modal
      visible={alertState.visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{alertState.title}</Text>
            <Text style={styles.message}>{alertState.message}</Text>
            <View style={styles.buttonsContainer}>
              {alertState.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const isPrimary = !isCancel && !isDestructive;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      isCancel && styles.cancelButton,
                      isDestructive && styles.destructiveButton,
                      isPrimary && styles.primaryButton,
                    ]}
                    onPress={button.onPress}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.cancelButtonText,
                        isDestructive && styles.destructiveButtonText,
                        isPrimary && styles.primaryButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

/**
 * Internal Alert Service Provider
 */
const AlertServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]): void => {
    const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: () => hideAlert() }];
    const alertButtons = buttons?.map(btn => ({
      ...btn,
      onPress: () => {
        hideAlert();
        btn.onPress?.();
      }
    })) || defaultButtons;

    setAlertState({
      visible: true,
      title,
      message,
      buttons: alertButtons
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showAlert(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirm',
        onPress: onConfirm,
      },
    ]);
  };

  const showPrompt = (title: string, message: string, onSubmit: (text: string) => void, options?: PromptOptions) => {
    // For now, use a simple confirm dialog - can be enhanced later with text input
    showConfirm(
      title,
      message,
      () => onSubmit(''),
      undefined
    );
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      <ModernAlertDialog alertState={alertState} onDismiss={hideAlert} />
    </AlertContext.Provider>
  );
};

/**
 * Custom Hook for using Alert Service
 * Use this throughout your app for consistent alert behavior
 */
export const useBankingAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useBankingAlert must be used within BankingAlertProvider');
  }
  return context;
};

/**
 * Standalone Alert Functions for backward compatibility
 * These can be used in places where hooks aren't available
 */
export class AlertService {
  private static instance: AlertService;
  private alertFunctions: ReturnType<typeof useBankingAlert> | null = null;

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  setAlertFunctions(functions: ReturnType<typeof useBankingAlert>) {
    this.alertFunctions = functions;
  }

  showAlert(title: string, message: string, buttons?: AlertButton[]) {
    if (this.alertFunctions) {
      this.alertFunctions.showAlert(title, message, buttons);
    } else {
      // Fallback to console for development
      console.warn('AlertService not initialized. Message:', title, message);
    }
  }

  showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
    if (this.alertFunctions) {
      this.alertFunctions.showConfirm(title, message, onConfirm, onCancel);
    }
  }

  showPrompt(title: string, message: string, onSubmit: (text: string) => void, options?: PromptOptions) {
    if (this.alertFunctions) {
      this.alertFunctions.showPrompt(title, message, onSubmit, options);
    }
  }
}

// Export singleton instance
export const alertService = AlertService.getInstance();