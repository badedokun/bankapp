/**
 * OrokiiPay Modal/Dialog Component
 * Confirmation dialogs and modal overlays
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ViewStyle,
  TextStyle,
  Platform,
  Dimensions,
} from 'react-native';
import { createModalStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'center' | 'bottom' | 'fullscreen';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  footer?: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'center',
  closable = true,
  closeOnBackdrop = true,
  footer,
  style,
  contentStyle,
}) => {
  const theme = useTheme();
  const modalStyles = createModalStyles(theme, {
    size,
    variant,
  });

  const handleBackdropPress = () => {
    if (closeOnBackdrop && closable) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={variant === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={closable ? onClose : undefined}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[styles.backdrop, modalStyles.backdrop]}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, modalStyles.container, style]}>
              {/* Header */}
              {(title || closable) && (
                <View style={[styles.header, modalStyles.header]}>
                  {title && (
                    <Text style={[styles.title, modalStyles.title]}>
                      {title}
                    </Text>
                  )}
                  {closable && (
                    <TouchableOpacity
                      style={[styles.closeButton, modalStyles.closeButton]}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[styles.closeText, modalStyles.closeText]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <ScrollView
                style={[styles.content, modalStyles.content]}
                contentContainerStyle={[styles.contentContainer, contentStyle]}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {/* Footer */}
              {footer && (
                <View style={[styles.footer, modalStyles.footer]}>
                  {footer}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Confirmation Dialog
export const ConfirmDialog: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  icon?: React.ReactNode;
}> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
}) => {
  const theme = useTheme();

  const getConfirmButtonColor = () => {
    switch (variant) {
      case 'danger':
        return theme.colors.semantic.error[500];
      case 'warning':
        return theme.colors.semantic.warning[500];
      case 'success':
        return theme.colors.semantic.success[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={false}
    >
      <View style={styles.confirmContent}>
        {icon && (
          <View style={styles.confirmIcon}>
            {icon}
          </View>
        )}
        
        <Text style={[styles.confirmTitle, { color: theme.computed.text.primary }]}>
          {title}
        </Text>
        
        <Text style={[styles.confirmMessage, { color: theme.computed.text.secondary }]}>
          {message}
        </Text>
        
        <View style={styles.confirmActions}>
          <TouchableOpacity
            style={[styles.confirmButton, styles.cancelButton, { borderColor: theme.computed.border.medium }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: theme.computed.text.primary }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.confirmButton, styles.primaryButton, { backgroundColor: getConfirmButtonColor() }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Transaction Confirmation Dialog
export const TransactionConfirmDialog: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: {
    amount: string;
    currency?: string;
    recipientName: string;
    recipientAccount: string;
    recipientBank?: string;
    narration?: string;
    fee?: string;
  };
}> = ({ visible, onClose, onConfirm, transaction }) => {
  const theme = useTheme();
  
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Confirm Transaction"
      size="md"
      closeOnBackdrop={false}
    >
      <View style={styles.transactionContent}>
        {/* Amount */}
        <View style={styles.transactionRow}>
          <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
            Amount
          </Text>
          <Text style={[styles.transactionValue, styles.amountValue, { color: theme.computed.text.primary }]}>
            {transaction.currency || '₦'}{transaction.amount}
          </Text>
        </View>
        
        {/* Fee */}
        {transaction.fee && (
          <View style={styles.transactionRow}>
            <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
              Transaction Fee
            </Text>
            <Text style={[styles.transactionValue, { color: theme.computed.text.primary }]}>
              {transaction.currency || '₦'}{transaction.fee}
            </Text>
          </View>
        )}
        
        {/* Recipient */}
        <View style={styles.transactionRow}>
          <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
            Recipient
          </Text>
          <Text style={[styles.transactionValue, { color: theme.computed.text.primary }]}>
            {transaction.recipientName}
          </Text>
        </View>
        
        {/* Account */}
        <View style={styles.transactionRow}>
          <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
            Account
          </Text>
          <Text style={[styles.transactionValue, { color: theme.computed.text.primary }]}>
            {transaction.recipientAccount}
          </Text>
        </View>
        
        {/* Bank */}
        {transaction.recipientBank && (
          <View style={styles.transactionRow}>
            <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
              Bank
            </Text>
            <Text style={[styles.transactionValue, { color: theme.computed.text.primary }]}>
              {transaction.recipientBank}
            </Text>
          </View>
        )}
        
        {/* Narration */}
        {transaction.narration && (
          <View style={styles.transactionRow}>
            <Text style={[styles.transactionLabel, { color: theme.computed.text.secondary }]}>
              Narration
            </Text>
            <Text style={[styles.transactionValue, { color: theme.computed.text.primary }]}>
              {transaction.narration}
            </Text>
          </View>
        )}
        
        {/* Total */}
        {transaction.fee && (
          <View style={[styles.transactionRow, styles.totalRow, { borderTopColor: theme.computed.border.light }]}>
            <Text style={[styles.transactionLabel, styles.totalLabel, { color: theme.computed.text.primary }]}>
              Total
            </Text>
            <Text style={[styles.transactionValue, styles.totalValue, { color: theme.computed.text.primary }]}>
              {transaction.currency || '₦'}{(parseFloat(transaction.amount) + parseFloat(transaction.fee || '0')).toFixed(2)}
            </Text>
          </View>
        )}
        
        {/* Actions */}
        <View style={styles.transactionActions}>
          <TouchableOpacity
            style={[styles.transactionButton, styles.cancelButton, { borderColor: theme.computed.border.medium }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: theme.computed.text.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.transactionButton, styles.primaryButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => {
              onConfirm();
              onClose();
            }}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Send Money
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Loading Modal
export const LoadingModal: React.FC<{
  visible: boolean;
  message?: string;
}> = ({ visible, message = 'Processing...' }) => {
  const theme = useTheme();
  
  return (
    <Modal
      visible={visible}
      onClose={() => {}}
      size="sm"
      closable={false}
      closeOnBackdrop={false}
    >
      <View style={styles.loadingContent}>
        <View style={[styles.spinner, { borderTopColor: theme.colors.primary[500] }]} />
        <Text style={[styles.loadingMessage, { color: theme.computed.text.primary }]}>
          {message}
        </Text>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: height * 0.8,
    maxWidth: width * 0.9,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  // Confirm Dialog Styles
  confirmContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  
  // Transaction Confirm Styles
  transactionContent: {
    paddingVertical: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLabel: {
    fontSize: 14,
    flex: 1,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  transactionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading Modal Styles
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    borderColor: '#e5e7eb',
    borderTopColor: '#3b82f6',
    marginBottom: 16,
  },
  loadingMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Modal;