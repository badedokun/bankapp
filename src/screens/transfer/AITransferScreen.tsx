/**
 * AI-Enhanced Money Transfer Screen
 * Features: Voice commands, smart recipient detection, intelligent amounts
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
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useTenant, useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { InputValidator } from '../../utils/security';
import APIService from '../../services/api';
import { BankSelector } from '../../components/BankSelector';
import { Bank } from '../../types/banking';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TransferFormData {
  recipient: string;
  amount: string;
  description: string;
  recipientAccountNumber: string;
  recipientBank: Bank | null;
  pin: string;
}

export interface AITransferScreenProps {
  onTransferComplete?: (transferData: TransferFormData) => void;
  onBack?: () => void;
}


const AITransferScreen: React.FC<AITransferScreenProps> = ({
  onTransferComplete,
  onBack,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  const { theme: tenantTheme } = useTenantTheme();
  
  // Form state
  const [formData, setFormData] = useState<TransferFormData>({
    recipient: '',
    amount: '',
    description: '',
    recipientAccountNumber: '',
    recipientBank: null,
    pin: '',
  });
  
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValidation, setRecipientValidation] = useState<{
    isValid: boolean;
    accountName?: string;
    bankName?: string;
  }>({ isValid: false });
  const [userEnteredRecipientName, setUserEnteredRecipientName] = useState(false);
  
  // Professional alert service
  const { showAlert, showConfirm } = useBankingAlert();
  
  // Animation values
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;




  // Voice command animation
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      // Fade in suggestions
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnimation.setValue(1);
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isListening]);

  // Handle voice command
  const handleVoiceCommand = useCallback(() => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        const commands = [
          "Send 25,000 naira to John Doe",
          "Transfer 10 thousand to account 1234567890",
          "Send money to Jane Smith 15000",
          "Pay 5000 naira for airtime"
        ];
        const randomCommand = commands[Math.floor(Math.random() * commands.length)];
        setVoiceCommand(randomCommand);
        processVoiceCommand(randomCommand);
        setIsListening(false);
      }, 3000);
    } else {
      setVoiceCommand('');
    }
  }, [isListening]);

  // Process voice command with AI
  const processVoiceCommand = useCallback((command: string) => {
    setIsProcessing(true);
    
    // Simple AI parsing simulation
    setTimeout(() => {
      const amountMatch = command.match(/(\d+,?\d*)\s*(naira|thousand|k)/i);
      const nameMatch = command.match(/to\s+([A-Za-z\s]+)/i);
      const accountMatch = command.match(/account\s+(\d+)/i);
      
      if (amountMatch) {
        let amount = amountMatch[1].replace(',', '');
        if (amountMatch[2].toLowerCase().includes('thousand') || amountMatch[2].toLowerCase().includes('k')) {
          amount = (parseInt(amount) * 1000).toString();
        }
        setFormData(prev => ({ ...prev, amount }));
      }
      
      if (nameMatch) {
        setFormData(prev => ({ ...prev, recipient: nameMatch[1].trim() }));
      }
      
      if (accountMatch) {
        setFormData(prev => ({ ...prev, recipientAccountNumber: accountMatch[1] }));
      }
      
      // Generate AI suggestions
      const suggestions = [
        `Confirm transfer of ${formatCurrency(parseFloat(formData.amount || '25000'), tenantTheme.currency, { locale: tenantTheme.locale })} to ${nameMatch?.[1] || 'recipient'}?`,
        "Would you like to add a transaction description?",
        "This recipient received your last 3 transfers. Proceed?",
        "Smart tip: This amount is within your daily limit."
      ];
      setAiSuggestions(suggestions);
      setIsProcessing(false);
    }, 1500);
  }, [formData.amount, tenantTheme.currency, tenantTheme.locale]);

  // Validate recipient account
  const validateRecipient = useCallback(async (accountNumber: string, bank: Bank | null) => {
    if (accountNumber.length === 10 && bank?.code?.length === 3) {
      setIsValidatingRecipient(true);
      try {
        const validation = await APIService.validateRecipient(accountNumber, bank.code);
        setRecipientValidation({
          isValid: validation.isValid,
          accountName: validation.accountName,
          bankName: validation.bankName,
        });

        // Only auto-fill if no user input has been entered in the recipient field
        if (validation.isValid && validation.accountName && !userEnteredRecipientName && !formData.recipient.trim()) {
          setFormData(prev => ({ ...prev, recipient: validation.accountName || '' }));
        }
      } catch (error) {
        console.error('Account validation failed:', error);
        setRecipientValidation({ isValid: false });
      } finally {
        setIsValidatingRecipient(false);
      }
    }
  }, [userEnteredRecipientName, formData.recipient]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate recipient when account number is complete and bank is selected
    if (field === 'recipientAccountNumber') {
      // If user has already entered a recipient name, mark it as manually entered
      if (formData.recipient.trim() && !userEnteredRecipientName) {
        setUserEnteredRecipientName(true);
      }

      if (value.length === 10 && formData.recipientBank) {
        validateRecipient(value, formData.recipientBank);
      }
    }

    // Clear AI suggestions when typing recipient name and mark as manually entered
    if (field === 'recipient') {
      setAiSuggestions([]);
      setUserEnteredRecipientName(true);
    }
  }, [formData.recipientAccountNumber, formData.recipientBank, formData.recipient, userEnteredRecipientName, validateRecipient]);

  // Handle bank selection
  const handleBankSelect = useCallback((bank: Bank) => {
    setFormData(prev => ({ ...prev, recipientBank: bank }));

    // Validate recipient if account number is already entered
    if (formData.recipientAccountNumber.length === 10) {
      validateRecipient(formData.recipientAccountNumber, bank);
    }
  }, [formData.recipientAccountNumber, validateRecipient]);

  // Handle transfer submission
  const handleTransfer = useCallback(async () => {
    console.log('🚀 Transfer initiated with data:', formData);
    setIsProcessing(true);
    
    try {
      // Validate form
      const amountValidation = InputValidator.validateAmount(formData.amount);
      const accountValidation = InputValidator.validateAccountNumber(formData.recipientAccountNumber);
      
      console.log('✅ Validation results:', { amountValidation, accountValidation });
      
      if (!amountValidation.isValid) {
        console.error('❌ Amount validation failed:', amountValidation.error);
        showAlert('Invalid Amount', amountValidation.error);
        setIsProcessing(false);
        return;
      }
      
      if (!accountValidation.isValid) {
        console.error('❌ Account validation failed:', accountValidation.error);
        showAlert('Invalid Account', accountValidation.error);
        setIsProcessing(false);
        return;
      }

      if (!formData.pin) {
        console.error('❌ PIN validation failed: PIN is required');
        showAlert('Transaction PIN Required', 'Please enter your 4-digit transaction PIN');
        setIsProcessing(false);
        return;
      }

      if (!formData.recipient.trim()) {
        console.error('❌ Recipient name validation failed: Name is required');
        showAlert('Recipient Required', 'Please enter the recipient name');
        setIsProcessing(false);
        return;
      }

      if (!formData.recipientBank) {
        console.error('❌ Bank validation failed: Bank selection is required');
        showAlert('Bank Required', 'Please select the recipient bank');
        setIsProcessing(false);
        return;
      }

      // Skip recipient validation check for now to allow manual entry
      console.log('⚠️ Proceeding without recipient validation check for manual entry');
      
      console.log('💰 Initiating transfer with API...');
      
      // Initiate transfer via API
      const transferResult = await APIService.initiateTransfer({
        recipientAccountNumber: formData.recipientAccountNumber,
        recipientBankCode: formData.recipientBank.code,
        recipientName: formData.recipient,
        amount: parseFloat(formData.amount),
        description: formData.description,
        pin: formData.pin
      });
      
      console.log('✅ Transfer API response:', transferResult);
      console.log('🔍 Transfer result status:', transferResult.status);
      console.log('🔍 Transfer result message:', transferResult.message);
      console.log('🔍 Success condition check:', transferResult.status === 'successful', transferResult.message?.includes('successfully'));
      
      setIsProcessing(false);
      
      if (transferResult.status === 'successful' || transferResult.message?.includes('successfully')) {
        // Success feedback
        console.log('🎉 Transfer completed successfully!');
        console.log(`Amount: ₦${transferResult.amount.toLocaleString()}`);
        console.log(`To: ${transferResult.recipient.accountName}`);
        console.log(`Reference: ${transferResult.reference}`);
        console.log(`Status: ${transferResult.status}`);
        
        // Success notification
        showAlert(
          'Transfer Successful! 🎉',
          `${formatCurrency(transferResult.amount, tenantTheme.currency, { locale: tenantTheme.locale })} transfer to ${transferResult.recipient.accountName} completed successfully.\n\nReference: ${transferResult.reference}\nStatus: ${transferResult.status}`,
          [{
            text: 'OK',
            onPress: () => {
              // Close form after user acknowledges success
              console.log('🚪 SUCCESS: User acknowledged success, calling callbacks');
              onTransferComplete?.(formData);
              onBack?.();
            }
          }]
        );
        
        // Clear form completely on success
        setFormData({
          recipient: '',
          amount: '',
          description: '',
          recipientAccountNumber: '',
          recipientBank: null,
          pin: '',
        });
        setUserEnteredRecipientName(false);
        
        // Call success callback only after user acknowledges - moved to alert's onPress
        console.log('✅ SUCCESS: Transfer completed, showing success alert first');
      } else {
        console.error('❌ Transfer failed:', transferResult);
        showAlert(
          'Transfer Failed',
          transferResult.message || 'Transfer could not be completed. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Transfer failed:', error);
      console.log('🔄 ERROR CAUGHT: Stopping processing and showing error alert');
      setIsProcessing(false);
      
      // Parse error message to provide better user feedback
      let errorMessage = 'An error occurred while processing your transfer. Please try again.';
      let errorTitle = 'Transfer Failed';
      
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('Access token required')) {
          errorTitle = 'Authentication Required';
          errorMessage = 'Please log in again to continue with transfers.';
        } else if (error.message.includes('Validation failed')) {
          errorTitle = 'Invalid Transfer Details';
          errorMessage = 'Please check your transfer details and try again. Make sure the amount is within limits and all fields are filled correctly.';
        } else if (error.message.includes('Invalid transaction PIN')) {
          errorTitle = 'Invalid PIN';
          errorMessage = 'The transaction PIN you entered is incorrect. Please try again.';
        } else if (error.message.includes('Insufficient balance') || error.message.includes('Insufficient funds')) {
          errorTitle = 'Insufficient Funds';
          errorMessage = 'You do not have enough balance to complete this transfer.';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('🚨 SHOWING ERROR ALERT:', errorTitle, errorMessage);
      showAlert(errorTitle, errorMessage, [
        { 
          text: 'OK', 
          onPress: () => {
            // Keep form open so user can correct the error
            console.log('🚪 ERROR: User dismissed error alert, keeping form open');
            // onBack?.(); // Removed - don't close form on error
          }
        }
      ]);
    }
  }, [formData, onTransferComplete]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    headerTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold as any,
      color: '#ffffff',
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: theme.typography.sizes.sm,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    aiSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    aiTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    voiceButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    voiceButtonActive: {
      backgroundColor: theme.colors.accent,
    },
    voiceIcon: {
      fontSize: 40,
      color: '#ffffff',
    },
    voiceCommand: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      minHeight: 20,
    },
    formSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    suggestionsContainer: {
      marginTop: theme.spacing.md,
    },
    suggestionItem: {
      backgroundColor: theme.colors.primary + '20',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    suggestionText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    recipientSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    recipientChip: {
      backgroundColor: theme.colors.accent + '20',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    recipientChipText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.accent,
      fontWeight: theme.typography.weights.medium as any,
    },
    transferButton: {
      marginTop: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>AI Money Transfer</Text>
            <Text style={styles.headerSubtitle}>
              Voice-enabled smart transfers with {currentTenant?.displayName || 'OrokiiPay'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Voice Section */}
        <View style={styles.aiSection}>
          <Text style={styles.aiTitle}>🎤 Voice Command</Text>
          
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <TouchableOpacity
              style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
              onPress={handleVoiceCommand}
            >
              <Text style={styles.voiceIcon}>
                {isListening ? '⏹️' : '🎤'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.voiceCommand}>
            {isListening ? 'Listening... Say "Send money to..."' : voiceCommand || 'Tap to use voice commands'}
          </Text>
          
          {/* AI Suggestions */}
          <Animated.View style={[styles.suggestionsContainer, { opacity: fadeAnimation }]}>
            {aiSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>🤖 {suggestion}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Transfer Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>💸 Transfer Details</Text>
          
          <Input
            label="Recipient Name"
            placeholder="Enter recipient name"
            value={formData.recipient}
            onChangeText={(text) => handleFieldChange('recipient', text)}
            validationType="text"
          />
          

          <Input
            label="Account Number"
            placeholder="Enter 10-digit account number"
            value={formData.recipientAccountNumber}
            onChangeText={(text) => handleFieldChange('recipientAccountNumber', text)}
            validationType="accountNumber"
            keyboardType="numeric"
            maxLength={10}
          />

          <BankSelector
            selectedBank={formData.recipientBank}
            onBankSelect={handleBankSelect}
            placeholder="Select recipient bank"
            testID="recipient-bank-selector"
          />

          {/* Account Validation Status */}
          {isValidatingRecipient && (
            <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
              🔍 Validating account...
            </Text>
          )}
          
          {recipientValidation.isValid && recipientValidation.accountName && (
            <View style={styles.suggestionItem}>
              <Text style={[styles.suggestionText, { color: 'green' }]}>
                ✅ {userEnteredRecipientName && formData.recipient.trim()
                    ? formData.recipient
                    : recipientValidation.accountName} - {formData.recipientBank?.name || recipientValidation.bankName}
              </Text>
            </View>
          )}

          <Input
            label={`Amount (${getCurrencySymbol(tenantTheme.currency)})`}
            placeholder={`Enter amount in ${tenantTheme.currency}`}
            value={formData.amount}
            onChangeText={(text) => handleFieldChange('amount', text)}
            validationType="amount"
            keyboardType="numeric"
          />

          <Input
            label="Description (Optional)"
            placeholder="What's this transfer for?"
            value={formData.description}
            onChangeText={(text) => handleFieldChange('description', text)}
            validationType="text"
            multiline
          />

          <Input
            label="Transaction PIN"
            placeholder="Enter your 4-digit PIN"
            value={formData.pin}
            onChangeText={(text) => handleFieldChange('pin', text)}
            validationType="numeric"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={true}
          />
        </View>

        {/* Transfer Button */}
        <Button
          title={isProcessing ? "Processing Transfer..." : "Send Money 🚀"}
          onPress={() => {
            console.log('🔄 Send Money button clicked - IMMEDIATE RESPONSE');
            console.log('📝 Current form data:', JSON.stringify(formData, null, 2));
            handleTransfer();
          }}
          loading={isProcessing}
          style={styles.transferButton}
        />
      </ScrollView>

    </SafeAreaView>
  );
};

export default AITransferScreen;