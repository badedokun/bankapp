/**
 * Professional Alert Service for Banking Application
 * Uses React Native Paper Dialog for Material Design compliance
 * Works across iOS, Android, and Web platforms
 */

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Platform } from 'react-native';
import { Provider as PaperProvider, DefaultTheme, MD3Theme, Dialog, Portal, Paragraph, Button as PaperButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      <Portal>
        <Dialog visible={alertState.visible} onDismiss={hideAlert}>
          <Dialog.Title>{alertState.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{alertState.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            {alertState.buttons.map((button, index) => (
              <PaperButton
                key={index}
                onPress={button.onPress}
                mode={button.style === 'destructive' ? 'outlined' : 'contained'}
                style={{ marginLeft: 8 }}
              >
                {button.text}
              </PaperButton>
            ))}
          </Dialog.Actions>
        </Dialog>
      </Portal>
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