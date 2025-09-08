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
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useTenant, useTenantTheme } from '@/tenants/TenantContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { InputValidator } from '@/utils/security';
import APIService from '@/services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TransferFormData {
  recipient: string;
  amount: string;
  description: string;
  recipientAccountNumber: string;
  recipientBankCode: string;
  pin: string;
}

interface Bank {
  code: string;
  name: string;
  slug: string;
}

interface AITransferScreenProps {
  onTransferComplete?: (transferData: TransferFormData) => void;
  onBack?: () => void;
}

const AITransferScreen: React.FC<AITransferScreenProps> = ({
  onTransferComplete,
  onBack,
}) => {
  const { currentTenant } = useTenant();
  const theme = useTenantTheme();
  
  // Form state
  const [formData, setFormData] = useState<TransferFormData>({
    recipient: '',
    amount: '',
    description: '',
    recipientAccountNumber: '',
    recipientBankCode: '',
    pin: '',
  });
  
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValidation, setRecipientValidation] = useState<{
    isValid: boolean;
    accountName?: string;
    bankName?: string;
  }>({ isValid: false });
  
  // Animation values
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Sample recipients for AI suggestions
  const recentRecipients = [
    { name: 'John Doe', account: '1234567890', bank: '058', amount: '₦5,000' },
    { name: 'Jane Smith', account: '0987654321', bank: '011', amount: '₦12,500' },
    { name: 'Michael Johnson', account: '1122334455', bank: '057', amount: '₦25,000' },
    { name: 'Sarah Wilson', account: '9988776655', bank: '030', amount: '₦8,750' },
  ];

  // Load banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await APIService.getBanks();
        setBanks(response.banks);
      } catch (error) {
        console.error('Failed to load banks:', error);
      }
    };
    
    loadBanks();
  }, []);

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
        `Confirm transfer of ₦${formData.amount || '25,000'} to ${nameMatch?.[1] || 'recipient'}?`,
        "Would you like to add a transaction description?",
        "This recipient received your last 3 transfers. Proceed?",
        "Smart tip: This amount is within your daily limit."
      ];
      setAiSuggestions(suggestions);
      setIsProcessing(false);
    }, 1500);
  }, [formData.amount]);

  // Validate recipient account
  const validateRecipient = useCallback(async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length === 10 && bankCode.length === 3) {
      setIsValidatingRecipient(true);
      try {
        const validation = await APIService.validateRecipient(accountNumber, bankCode);
        setRecipientValidation({
          isValid: validation.isValid,
          accountName: validation.accountName,
          bankName: validation.bankName,
        });
        
        if (validation.isValid && validation.accountName) {
          setFormData(prev => ({ ...prev, recipient: validation.accountName || '' }));
        }
      } catch (error) {
        console.error('Account validation failed:', error);
        setRecipientValidation({ isValid: false });
      } finally {
        setIsValidatingRecipient(false);
      }
    }
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate recipient when account number and bank code are complete
    if (field === 'recipientAccountNumber' || field === 'recipientBankCode') {
      const accountNumber = field === 'recipientAccountNumber' ? value : formData.recipientAccountNumber;
      const bankCode = field === 'recipientBankCode' ? value : formData.recipientBankCode;
      
      if (accountNumber.length === 10 && bankCode.length === 3) {
        validateRecipient(accountNumber, bankCode);
      }
    }
    
    // Generate AI suggestions based on input
    if (field === 'recipient' && value.length > 2) {
      const matchingRecipients = recentRecipients.filter(r => 
        r.name.toLowerCase().includes(value.toLowerCase())
      );
      const suggestions = matchingRecipients.map(r => `${r.name} - ${r.account}`);
      setAiSuggestions(suggestions);
    }
  }, [formData.recipientAccountNumber, formData.recipientBankCode, validateRecipient]);

  // Handle transfer submission
  const handleTransfer = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Validate form
      const amountValidation = InputValidator.validateAmount(formData.amount);
      const accountValidation = InputValidator.validateAccountNumber(formData.recipientAccountNumber);
      
      if (!amountValidation.isValid) {
        Alert.alert('Invalid Amount', amountValidation.error);
        setIsProcessing(false);
        return;
      }
      
      if (!accountValidation.isValid) {
        Alert.alert('Invalid Account', accountValidation.error);
        setIsProcessing(false);
        return;
      }

      if (!formData.pin) {
        Alert.alert('Transaction PIN Required', 'Please enter your 4-digit transaction PIN');
        setIsProcessing(false);
        return;
      }

      if (!recipientValidation.isValid) {
        Alert.alert('Invalid Recipient', 'Please validate the recipient account before proceeding');
        setIsProcessing(false);
        return;
      }
      
      // Initiate transfer via API
      const transferResult = await APIService.initiateTransfer({
        recipientAccountNumber: formData.recipientAccountNumber,
        recipientBankCode: formData.recipientBankCode,
        recipientName: formData.recipient,
        amount: parseFloat(formData.amount),
        description: formData.description,
        pin: formData.pin
      });
      
      setIsProcessing(false);
      
      Alert.alert(
        'Transfer Initiated',
        `₦${transferResult.amount.toLocaleString()} transfer to ${transferResult.recipient.name} has been initiated.\n\nReference: ${transferResult.referenceNumber}`,
        [{ text: 'OK', onPress: () => onTransferComplete?.(formData) }]
      );
      
      // Clear sensitive data
      setFormData(prev => ({ ...prev, pin: '' }));
      
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert(
        'Transfer Failed',
        error.message || 'An error occurred while processing your transfer. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [formData, onTransferComplete, recipientValidation.isValid]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
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
        <Text style={styles.headerTitle}>AI Money Transfer</Text>
        <Text style={styles.headerSubtitle}>
          Voice-enabled smart transfers with {currentTenant?.displayName || 'OrokiiPay'}
        </Text>
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
          
          {/* Recent Recipients */}
          <View style={styles.recipientSuggestions}>
            {recentRecipients.slice(0, 3).map((recipient, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recipientChip}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    recipient: recipient.name,
                    recipientAccountNumber: recipient.account,
                    recipientBankCode: recipient.bank,
                  }));
                }}
              >
                <Text style={styles.recipientChipText}>{recipient.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Account Number"
            placeholder="Enter 10-digit account number"
            value={formData.recipientAccountNumber}
            onChangeText={(text) => handleFieldChange('recipientAccountNumber', text)}
            validationType="accountNumber"
            keyboardType="numeric"
            maxLength={10}
          />

          <Input
            label="Bank Code"
            placeholder="Enter 3-digit bank code (e.g. 058 for GTBank)"
            value={formData.recipientBankCode}
            onChangeText={(text) => handleFieldChange('recipientBankCode', text)}
            keyboardType="numeric"
            maxLength={3}
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
                ✅ {recipientValidation.accountName} - {recipientValidation.bankName}
              </Text>
            </View>
          )}

          <Input
            label="Amount (₦)"
            placeholder="Enter amount in Naira"
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
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={true}
          />
        </View>

        {/* Transfer Button */}
        <Button
          title={isProcessing ? "Processing Transfer..." : "Send Money 🚀"}
          onPress={handleTransfer}
          loading={isProcessing}
          style={styles.transferButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AITransferScreen;