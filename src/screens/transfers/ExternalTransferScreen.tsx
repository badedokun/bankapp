/**
 * External Transfer Screen (NIBSS)
 * Based on ui-mockup-external-transfers-nibss.html
 * Features: Bank search, account verification, beneficiaries management, bulk transfers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput as RNTextInput,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TransferHeader from '../../components/transfers/TransferHeader';
import AccountSelector from '../../components/transfers/AccountSelector';
import BeneficiarySelector from '../../components/transfers/BeneficiarySelector';
import {
  UserAccount,
  Beneficiary,
  ExternalTransferRequest,
  TransferLimits,
  Bank,
} from '../../types/transfers';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface ExternalTransferScreenProps {
  onBack?: () => void;
  onTransferComplete?: (transfer: ExternalTransferRequest) => void;
}

export const ExternalTransferScreen: React.FC<ExternalTransferScreenProps> = ({
  onBack,
  onTransferComplete,
}) => {
  const { theme } = useTenantTheme() as any;
  const { showAlert, showConfirm } = useBankingAlert();

  // State management
  const [formData, setFormData] = useState({
    senderAccount: null as UserAccount | null,
    recipientName: '',
    recipientAccountNumber: '',
    recipientBank: null as Bank | null,
    amount: '',
    description: '',
    pin: '',
    saveBeneficiary: false,
    beneficiaryNickname: '',
  });

  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [accountValidation, setAccountValidation] = useState<{
    isValid: boolean;
    accountName?: string;
    bankName?: string;
  }>({ isValid: false });
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data
  const [accounts] = useState<UserAccount[]>([
    {
      id: '1',
      accountNumber: '0123456789',
      accountName: 'John Doe',
      balance: 750000,
      accountType: 'Savings',
      currency: 'NGN',
      isDefault: true,
    },
    {
      id: '2',
      accountNumber: '0987654321',
      accountName: 'John Doe Business',
      balance: 1250000,
      accountType: 'Current',
      currency: 'NGN',
      isDefault: false,
    },
  ]);

  const [banks] = useState<Bank[]>([
    { code: 'GTB', name: 'Guaranty Trust Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'UBA', name: 'United Bank for Africa', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'FBN', name: 'First Bank of Nigeria', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'ZEN', name: 'Zenith Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'ACC', name: 'Access Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'STB', name: 'Stanbic IBTC Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'UNI', name: 'Union Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'POL', name: 'Polaris Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'KEY', name: 'Keystone Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'ECO', name: 'Ecobank Nigeria', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
  ]);

  const [externalBeneficiaries] = useState<Beneficiary[]>([
    {
      id: '3',
      name: 'Sarah Wilson',
      accountNumber: '1234567890',
      bankCode: 'GTB',
      bankName: 'Guaranty Trust Bank',
      nickname: 'Sarah GTB',
      isFrequent: true,
      lastUsed: new Date(Date.now() - 86400000 * 2), // 2 days ago
      totalTransfers: 8,
    },
    {
      id: '4',
      name: 'David Brown',
      accountNumber: '2345678901',
      bankCode: 'UBA',
      bankName: 'United Bank for Africa',
      isFrequent: false,
      lastUsed: new Date(Date.now() - 86400000 * 10), // 10 days ago
      totalTransfers: 2,
    },
  ]);

  const [limits] = useState<TransferLimits>({
    daily: { used: 150000, limit: 5000000 },
    monthly: { used: 850000, limit: 20000000 },
    perTransaction: { min: 100, max: 1000000 },
    currency: 'NGN',
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    section: {
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
    nibssCard: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    nibssTitle: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    nibssDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    bankSelector: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    bankSelectorPlaceholder: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankSelectorText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
    selectedBank: {
      color: theme.colors.text,
      fontWeight: theme.typography.weights.medium as any,
    },
    chevron: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      width: '100%',
      maxHeight: '80%',
      padding: theme.spacing.lg,
    },
    modalTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    searchContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      paddingVertical: theme.spacing.md,
    },
    bankItem: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    selectedBankItem: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    bankItemName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    bankItemCode: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    bankItemFee: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.primary,
      marginTop: 2,
    },
    closeButton: {
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    closeButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as any,
    },
    validationContainer: {
      marginTop: theme.spacing.sm,
    },
    validationText: {
      fontSize: theme.typography.sizes.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      textAlign: 'center',
    },
    validationLoading: {
      backgroundColor: theme.colors.warning + '20',
      color: theme.colors.warning,
    },
    validationSuccess: {
      backgroundColor: theme.colors.success + '20',
      color: theme.colors.success,
    },
    validationError: {
      backgroundColor: theme.colors.error + '20',
      color: theme.colors.error,
    },
    feeInfo: {
      backgroundColor: theme.colors.warning + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    feeLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    feeAmount: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.warning,
    },
    saveBeneficiaryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginRight: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
    },
    checkboxText: {
      color: theme.colors.textInverse,
      fontSize: 12,
      fontWeight: 'bold',
    },
    saveBeneficiaryLabel: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    reviewSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    reviewTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.primary,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    reviewLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    reviewValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      textAlign: 'right',
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    transferButton: {
      marginTop: theme.spacing.lg,
    },
    disclaimerText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      fontStyle: 'italic',
    },
  });


  const handleBeneficiarySelect = useCallback((beneficiary: Beneficiary) => {
    const selectedBank = banks.find(bank => bank.code === beneficiary.bankCode);
    setFormData(prev => ({
      ...prev,
      recipientName: beneficiary.name,
      recipientAccountNumber: beneficiary.accountNumber,
      recipientBank: selectedBank || null,
    }));
  }, [banks]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Trigger account validation when account number and bank are complete
    if (field === 'recipientAccountNumber' && value.length === 10 && formData.recipientBank) {
      validateAccount(value, formData.recipientBank.code);
    }
  }, [formData.recipientBank]);

  const handleBankSelect = (bank: Bank) => {
    setFormData(prev => ({ ...prev, recipientBank: bank }));
    setShowBankModal(false);

    // Trigger account validation if account number is already entered
    if (formData.recipientAccountNumber.length === 10) {
      validateAccount(formData.recipientAccountNumber, bank.code);
    }
  };

  const validateAccount = async (accountNumber: string, bankCode: string) => {
    setIsValidatingAccount(true);
    setAccountValidation({ isValid: false });

    try {
      // Simulate API call to NIBSS for account validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation response
      const mockResponse = {
        isValid: true,
        accountName: 'JAMES OKAFOR',
        bankName: banks.find(b => b.code === bankCode)?.name,
      };

      setAccountValidation(mockResponse);

      // Auto-fill recipient name if not manually entered
      if (mockResponse.isValid && mockResponse.accountName && !formData.recipientName.trim()) {
        setFormData(prev => ({ ...prev, recipientName: mockResponse.accountName || '' }));
      }
    } catch (error) {
      setAccountValidation({ isValid: false });
    } finally {
      setIsValidatingAccount(false);
    }
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.code.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.senderAccount) {
      errors.push('Please select a sender account');
    }

    if (!formData.recipientBank) {
      errors.push('Please select recipient bank');
    }

    if (!formData.recipientName.trim()) {
      errors.push('Please enter recipient name');
    }

    if (!formData.recipientAccountNumber.trim()) {
      errors.push('Please enter recipient account number');
    } else if (formData.recipientAccountNumber.length !== 10) {
      errors.push('Account number must be 10 digits');
    }

    if (!accountValidation.isValid) {
      errors.push('Please verify recipient account');
    }

    if (!formData.amount.trim()) {
      errors.push('Please enter transfer amount');
    } else {
      const amount = parseFloat(formData.amount);
      if (amount < limits.perTransaction.min) {
        errors.push(`Minimum transfer amount is ${formatCurrency(limits.perTransaction.min)}`);
      }
      if (amount > limits.perTransaction.max) {
        errors.push(`Maximum transfer amount is ${formatCurrency(limits.perTransaction.max)}`);
      }
      if (formData.senderAccount && amount > formData.senderAccount.balance) {
        errors.push('Insufficient balance');
      }
    }

    if (!formData.pin.trim()) {
      errors.push('Please enter your transaction PIN');
    } else if (formData.pin.length !== 4) {
      errors.push('PIN must be 4 digits');
    }

    if (formData.saveBeneficiary && !formData.beneficiaryNickname.trim()) {
      errors.push('Please enter a nickname for the beneficiary');
    }

    return errors;
  };

  const handleTransfer = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      showAlert('Validation Error', errors.join('\n'));
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate NIBSS transfer API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const transferRequest: ExternalTransferRequest = {
        type: 'external',
        senderAccountId: formData.senderAccount!.id,
        recipientName: formData.recipientName,
        recipientAccountNumber: formData.recipientAccountNumber,
        recipientBankCode: formData.recipientBank!.code,
        amount: parseFloat(formData.amount),
        description: formData.description,
        pin: formData.pin,
        saveBeneficiary: formData.saveBeneficiary,
        beneficiaryNickname: formData.beneficiaryNickname,
      };

      const fee = formData.recipientBank?.transferFee || 52.50;
      const total = parseFloat(formData.amount) + fee;

      showAlert(
        'Transfer Successful! 🎉',
        `${formatCurrency(parseFloat(formData.amount), 'NGN', { locale: 'en-NG' })} has been sent to ${formData.recipientName} at ${formData.recipientBank?.name}\n\nTotal Charge: ${formatCurrency(total)} (including ${formatCurrency(fee)} NIBSS fee)`,
        [{
          text: 'OK',
          onPress: () => {
            onTransferComplete?.(transferRequest);
            onBack?.();
          }
        }]
      );

    } catch (error) {
      showAlert('Transfer Failed', 'NIBSS transfer could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBankSelector = () => (
    <View>
      <RNText style={[styles.sectionTitle, { marginBottom: theme.spacing.sm }]}>🏛️ Recipient Bank</RNText>
      <TouchableOpacity
        style={styles.bankSelector}
        onPress={() => setShowBankModal(true)}
      >
        <View style={styles.bankSelectorPlaceholder}>
          <RNText style={[
            styles.bankSelectorText,
            formData.recipientBank && styles.selectedBank
          ]}>
            {formData.recipientBank ? formData.recipientBank.name : 'Select bank'}
          </RNText>
          <RNText style={styles.chevron}>▼</RNText>
        </View>
      </TouchableOpacity>

      {formData.recipientBank && (
        <View style={styles.feeInfo}>
          <RNText style={styles.feeLabel}>Transfer Fee:</RNText>
          <RNText style={styles.feeAmount}>
            {formatCurrency(formData.recipientBank.transferFee)}
          </RNText>
        </View>
      )}
    </View>
  );

  const renderAccountValidation = () => {
    if (!formData.recipientAccountNumber || formData.recipientAccountNumber.length !== 10 || !formData.recipientBank) {
      return null;
    }

    if (isValidatingAccount) {
      return (
        <View style={styles.validationContainer}>
          <RNText style={[styles.validationText, styles.validationLoading]}>
            🔍 Verifying account with NIBSS...
          </RNText>
        </View>
      );
    }

    if (accountValidation.isValid) {
      return (
        <View style={styles.validationContainer}>
          <RNText style={[styles.validationText, styles.validationSuccess]}>
            ✅ Account verified: {accountValidation.accountName} - {accountValidation.bankName}
          </RNText>
        </View>
      );
    }

    return (
      <View style={styles.validationContainer}>
        <RNText style={[styles.validationText, styles.validationError]}>
          ❌ Account verification failed. Please check account number and bank.
        </RNText>
      </View>
    );
  };

  const renderTransferReview = () => {
    if (!formData.amount || !formData.recipientName || !formData.recipientBank) return null;

    const amount = parseFloat(formData.amount);
    const fee = formData.recipientBank.transferFee;
    const total = amount + fee;

    return (
      <View style={styles.reviewSection}>
        <RNText style={styles.reviewTitle}>📋 Transfer Summary</RNText>

        <View style={styles.reviewRow}>
          <RNText style={styles.reviewLabel}>To:</RNText>
          <RNText style={styles.reviewValue}>{formData.recipientName}</RNText>
        </View>

        <View style={styles.reviewRow}>
          <RNText style={styles.reviewLabel}>Account:</RNText>
          <RNText style={styles.reviewValue}>{formData.recipientAccountNumber}</RNText>
        </View>

        <View style={styles.reviewRow}>
          <RNText style={styles.reviewLabel}>Bank:</RNText>
          <RNText style={styles.reviewValue}>{formData.recipientBank.name}</RNText>
        </View>

        <View style={styles.reviewRow}>
          <RNText style={styles.reviewLabel}>Amount:</RNText>
          <RNText style={styles.reviewValue}>{formatCurrency(amount)}</RNText>
        </View>

        <View style={styles.reviewRow}>
          <RNText style={styles.reviewLabel}>NIBSS Fee:</RNText>
          <RNText style={styles.reviewValue}>{formatCurrency(fee)}</RNText>
        </View>

        <View style={[styles.reviewRow, { borderBottomWidth: 0, marginTop: theme.spacing.sm }]}>
          <RNText style={[styles.reviewLabel, { fontWeight: 'bold' }]}>Total:</RNText>
          <RNText style={[styles.reviewValue, { fontWeight: 'bold', color: theme.colors.primary }]}>
            {formatCurrency(total)}
          </RNText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TransferHeader
        title="External Transfer"
        subtitle="Send to other banks via NIBSS"
        onBack={onBack}
        showSteps={false}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* NIBSS Info */}
        <View style={styles.nibssCard}>
          <RNText style={styles.nibssTitle}>🏛️ NIBSS Instant Payments (NIP)</RNText>
          <RNText style={styles.nibssDescription}>
            Send money to any bank in Nigeria instantly. Transfers are processed 24/7
            with real-time account verification and settlement.
          </RNText>
        </View>

        {/* Account Selection */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>💰 From Account</RNText>
          <AccountSelector
            accounts={accounts}
            selectedAccount={formData.senderAccount}
            onAccountSelect={(account) => handleFieldChange('senderAccount', account)}
            label=""
            placeholder="Select your account"
          />
        </View>

        {/* External Beneficiaries */}
        <BeneficiarySelector
          beneficiaries={externalBeneficiaries}
          onBeneficiarySelect={handleBeneficiarySelect}
          showAddNew={true}
        />

        {/* Transfer Details */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>📝 Transfer Details</RNText>

          {renderBankSelector()}

          <Input
            label="Account Number"
            placeholder="Enter 10-digit account number"
            value={formData.recipientAccountNumber}
            onChangeText={(text) => handleFieldChange('recipientAccountNumber', text)}
            validationType="accountNumber"
            keyboardType="numeric"
            maxLength={10}
          />

          {renderAccountValidation()}

          <Input
            label="Recipient Name"
            placeholder="Enter recipient name"
            value={formData.recipientName}
            onChangeText={(text) => handleFieldChange('recipientName', text)}
            validationType="text"
          />

          <Input
            label={`Amount (${getCurrencySymbol('NGN')})`}
            placeholder="Enter amount"
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

          {/* Save Beneficiary Option */}
          <TouchableOpacity
            style={styles.saveBeneficiaryContainer}
            onPress={() => handleFieldChange('saveBeneficiary', !formData.saveBeneficiary)}
          >
            <View style={[styles.checkbox, formData.saveBeneficiary && styles.checkboxChecked]}>
              {formData.saveBeneficiary && <RNText style={styles.checkboxText}>✓</RNText>}
            </View>
            <RNText style={styles.saveBeneficiaryLabel}>
              Save as beneficiary for future transfers
            </RNText>
          </TouchableOpacity>

          {formData.saveBeneficiary && (
            <Input
              label="Beneficiary Nickname"
              placeholder="Enter a nickname for this recipient"
              value={formData.beneficiaryNickname}
              onChangeText={(text) => handleFieldChange('beneficiaryNickname', text)}
              validationType="text"
            />
          )}

          <Input
            label="Transaction PIN"
            placeholder="Enter your 4-digit PIN"
            value={formData.pin}
            onChangeText={(text) => handleFieldChange('pin', text)}
            validationType="numeric"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>

        {renderTransferReview()}

        <Button
          title={isProcessing ? "Processing NIBSS Transfer..." : "Send Money via NIBSS 🚀"}
          onPress={handleTransfer}
          loading={isProcessing}
          style={styles.transferButton}
        />

        <RNText style={styles.disclaimerText}>
          External transfers via NIBSS are processed instantly during banking hours.
          A fee of {formatCurrency(52.50)} applies per transaction.
        </RNText>
      </ScrollView>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBankModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBankModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <RNText style={styles.modalTitle}>Select Bank</RNText>

            <View style={styles.searchContainer}>
              <RNTextInput
                style={styles.searchInput}
                placeholder="Search banks..."
                placeholderTextColor={theme.colors.textSecondary}
                value={bankSearchQuery}
                onChangeText={setBankSearchQuery}
              />
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bankItem,
                    formData.recipientBank?.code === item.code && styles.selectedBankItem,
                  ]}
                  onPress={() => handleBankSelect(item)}
                >
                  <RNText style={styles.bankItemName}>{item.name}</RNText>
                  <RNText style={styles.bankItemCode}>{item.code}</RNText>
                  <RNText style={styles.bankItemFee}>
                    Fee: {formatCurrency(item.transferFee)}
                  </RNText>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBankModal(false)}
            >
              <RNText style={styles.closeButtonText}>Close</RNText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ExternalTransferScreen;