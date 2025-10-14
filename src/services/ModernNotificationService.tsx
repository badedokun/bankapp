/**
 * Modern Notification Service
 * Glassmorphic design with dynamic tenant theming
 * Supports both toast notifications and modal alerts
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTenantTheme } from '../context/TenantThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';
export type NotificationPosition = 'top' | 'bottom' | 'center';

// Notification configuration
export interface NotificationConfig {
  id?: string;
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number; // 0 for persistent
  position?: NotificationPosition;
  actions?: NotificationAction[];
  icon?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface NotificationAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'primary' | 'destructive';
}

// Modal configuration
export interface ModalConfig {
  title: string;
  message: string;
  type?: NotificationType;
  actions?: ModalAction[];
  input?: ModalInput;
  dismissible?: boolean;
}

export interface ModalAction {
  label: string;
  onPress: (inputValue?: string) => void;
  style?: 'default' | 'primary' | 'destructive' | 'cancel';
}

export interface ModalInput {
  placeholder?: string;
  defaultValue?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}

// Context interface
interface NotificationContextType {
  showToast: (config: NotificationConfig) => void;
  showModal: (config: ModalConfig) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
  dismissModal: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Internal notification state
interface ToastState extends NotificationConfig {
  id: string;
  animValue: Animated.Value;
}

export const ModernNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTenantTheme();
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const modalAnimValue = new Animated.Value(0);

  // Get icon and color for notification type
  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return { icon: '✅', color: theme?.colors?.success || '#10b981' };
      case 'error':
        return { icon: '❌', color: theme?.colors?.error || '#ef4444' };
      case 'warning':
        return { icon: '⚠️', color: theme?.colors?.warning || '#f59e0b' };
      case 'info':
        return { icon: 'ℹ️', color: theme?.colors?.info || '#3b82f6' };
      default:
        return { icon: '💬', color: theme?.colors?.primary || '#667eea' };
    }
  };

  // Show toast notification
  const showToast = (config: NotificationConfig) => {
    const id = config.id || Date.now().toString();
    const animValue = new Animated.Value(0);

    const newToast: ToastState = {
      ...config,
      id,
      animValue,
      type: config.type || 'default',
      duration: config.duration !== undefined ? config.duration : 4000,
      dismissible: config.dismissible !== false,
      position: config.position || 'top',
    };

    setToasts(prev => [...prev, newToast]);

    // Animate in
    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto dismiss if duration > 0
    if (newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration);
    }
  };

  // Dismiss toast
  const dismissToast = (id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast) {
        Animated.timing(toast.animValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setToasts(current => current.filter(t => t.id !== id));
          toast.onDismiss?.();
        });
      }
      return prev;
    });
  };

  // Dismiss all toasts
  const dismissAllToasts = () => {
    toasts.forEach(toast => dismissToast(toast.id));
  };

  // Show modal
  const showModal = (config: ModalConfig) => {
    setModal(config);
    setModalVisible(true);
    setInputValue(config.input?.defaultValue || '');

    Animated.timing(modalAnimValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Dismiss modal
  const dismissModal = () => {
    Animated.timing(modalAnimValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setModal(null);
      setInputValue('');
    });
  };

  // Render toast component
  const renderToast = (toast: ToastState) => {
    const style = getNotificationStyle(toast.type || 'default');
    const translateY = toast.animValue.interpolate({
      inputRange: [0, 1],
      outputRange: toast.position === 'top' ? [-100, 0] : [100, 0],
    });

    return (
      <Animated.View
        key={toast.id}
        style={[
          styles.toastContainer,
          toast.position === 'top' ? styles.toastTop : styles.toastBottom,
          {
            transform: [{ translateY }],
            opacity: toast.animValue,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={toast.dismissible ? 0.9 : 1}
          onPress={() => toast.dismissible && dismissToast(toast.id)}
          style={[
            styles.toast,
            {
              borderLeftColor: style.color,
              ...Platform.select({
                web: {
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                },
              }),
            },
          ]}
        >
          {/* Icon */}
          <Text style={styles.toastIcon}>{toast.icon || style.icon}</Text>

          {/* Content */}
          <View style={styles.toastContent}>
            {toast.title && (
              <Text style={styles.toastTitle}>{toast.title}</Text>
            )}
            <Text style={styles.toastMessage}>{toast.message}</Text>
          </View>

          {/* Actions */}
          {toast.actions && toast.actions.length > 0 && (
            <View style={styles.toastActions}>
              {toast.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={action.onPress}
                  style={[
                    styles.toastActionButton,
                    action.style === 'primary' && { backgroundColor: style.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.toastActionText,
                      action.style === 'primary' && { color: '#fff' },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Dismiss button */}
          {toast.dismissible && (
            <TouchableOpacity
              onPress={() => dismissToast(toast.id)}
              style={styles.dismissButton}
            >
              <Text style={styles.dismissIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render modal
  const renderModal = () => {
    if (!modal || !modalVisible) return null;

    const style = getNotificationStyle(modal.type || 'info');
    const scale = modalAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Animated.View
        style={[
          styles.modalOverlay,
          { opacity: modalAnimValue },
        ]}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => modal.dismissible !== false && dismissModal()}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale }],
              ...Platform.select({
                web: {
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                },
              }),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: style.color }]}>
            <Text style={styles.modalIcon}>{getNotificationStyle(modal.type || 'info').icon}</Text>
            <Text style={styles.modalTitle}>{modal.title}</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalMessage}>{modal.message}</Text>

            {/* Input field if needed */}
            {modal.input && (
              <TextInput
                style={[
                  styles.modalInput,
                  { borderColor: theme?.colors?.primary || '#667eea' },
                ]}
                placeholder={modal.input.placeholder}
                value={inputValue}
                onChangeText={setInputValue}
                secureTextEntry={modal.input.secureTextEntry}
                keyboardType={modal.input.keyboardType || 'default'}
                autoFocus
              />
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            {modal.actions?.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  action.onPress(modal.input ? inputValue : undefined);
                  dismissModal();
                }}
                style={[
                  styles.modalActionButton,
                  action.style === 'primary' && {
                    backgroundColor: theme?.colors?.primary || '#667eea',
                  },
                  action.style === 'destructive' && {
                    backgroundColor: theme?.colors?.error || '#ef4444',
                  },
                  action.style === 'cancel' && styles.modalCancelButton,
                ]}
              >
                <Text
                  style={[
                    styles.modalActionText,
                    (action.style === 'primary' || action.style === 'destructive') && {
                      color: '#fff',
                    },
                    action.style === 'cancel' && styles.modalCancelText,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            )) || (
              <TouchableOpacity
                onPress={dismissModal}
                style={[
                  styles.modalActionButton,
                  { backgroundColor: theme?.colors?.primary || '#667eea' },
                ]}
              >
                <Text style={[styles.modalActionText, { color: '#fff' }]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showModal,
        dismissToast,
        dismissAllToasts,
        dismissModal,
      }}
    >
      {children}

      {/* Toast notifications */}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map(renderToast)}
      </View>

      {/* Modal */}
      {renderModal()}
    </NotificationContext.Provider>
  );
};

// Hook for using notifications
export const useModernNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useModernNotification must be used within ModernNotificationProvider');
  }
  return context;
};

// Convenience functions
export const useNotification = () => {
  const { showToast, showModal } = useModernNotification();

  return {
    success: (message: string, title?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),

    error: (message: string, title?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),

    warning: (message: string, title?: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),

    info: (message: string, title?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),

    confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) =>
      showModal({
        title,
        message,
        type: 'warning',
        actions: [
          { label: 'Cancel', style: 'cancel', onPress: () => onCancel?.() },
          { label: 'Confirm', style: 'primary', onPress: () => onConfirm() },
        ],
      }),

    prompt: (title: string, message: string, onSubmit: (value: string) => void, placeholder?: string) =>
      showModal({
        title,
        message,
        type: 'info',
        input: { placeholder },
        actions: [
          { label: 'Cancel', style: 'cancel', onPress: () => {} },
          { label: 'Submit', style: 'primary', onPress: (value) => onSubmit(value || '') },
        ],
      }),
  };
};

// Styles
const styles = StyleSheet.create({
  // Toast wrapper
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },

  // Toast container
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 500,
    alignSelf: 'center',
    zIndex: 10000,
  },

  toastTop: {
    top: Platform.OS === 'ios' ? 50 : 30,
  },

  toastBottom: {
    bottom: 100,
  },

  // Toast styles
  toast: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  toastIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  toastContent: {
    flex: 1,
  },

  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },

  toastMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },

  toastActions: {
    flexDirection: 'row',
    marginLeft: 12,
    gap: 8,
  },

  toastActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  toastActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },

  dismissIcon: {
    fontSize: 16,
    color: '#94a3b8',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },

  modalIcon: {
    fontSize: 28,
    marginRight: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
  },

  modalContent: {
    padding: 20,
    maxHeight: 300,
  },

  modalMessage: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },

  modalInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },

  modalActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },

  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },

  modalCancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  modalCancelText: {
    color: '#6c757d',
  },
});

export default ModernNotificationProvider;