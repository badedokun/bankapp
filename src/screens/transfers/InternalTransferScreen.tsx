/**
 * Internal Transfer Screen
 * Based on ui-mockup-internal-transfers.html
 * Features: Instant/Scheduled/Recurring tabs, Account selection, Beneficiaries, OTP verification
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TransferHeader from '../../components/transfers/TransferHeader';
import TransferTabs from '../../components/transfers/TransferTabs';
import AccountSelector from '../../components/transfers/AccountSelector';
import BeneficiarySelector from '../../components/transfers/BeneficiarySelector';
import {
  TransferType,
  TransferFrequency,
  UserAccount,
  Beneficiary,
  InternalTransferRequest,
  TransferLimits,
} from '../../types/transfers';

interface InternalTransferScreenProps {
  onBack?: () => void;
  onTransferComplete?: (transfer: InternalTransferRequest) => void;
}

type TransferMode = 'instant' | 'scheduled' | 'recurring';

export const InternalTransferScreen: React.FC<InternalTransferScreenProps> = ({
  onBack,
  onTransferComplete,
}) => {
  const theme = useTenantTheme();
  const { showAlert, showConfirm } = useBankingAlert();

  // State management
  const [transferMode, setTransferMode] = useState<TransferMode>('instant');
  const [formData, setFormData] = useState({
    senderAccount: null as UserAccount | null,
    recipientName: '',
    recipientAccountNumber: '',
    amount: '',
    description: '',
    pin: '',
    scheduledDate: null as Date | null,
    frequency: 'once' as TransferFrequency,
    endDate: null as Date | null,
  });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - In real app, these would come from API
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

  const [beneficiaries] = useState<Beneficiary[]>([
    {
      id: '1',
      name: 'Jane Smith',
      accountNumber: '1234567890',
      bankCode: 'SAME',
      bankName: 'FMFB',
      nickname: 'Jane',
      isFrequent: true,
      lastUsed: new Date(Date.now() - 86400000), // 1 day ago
      totalTransfers: 15,
    },
    {
      id: '2',
      name: 'Mike Johnson',
      accountNumber: '2345678901',
      bankCode: 'SAME',
      bankName: 'FMFB',
      isFrequent: false,
      lastUsed: new Date(Date.now() - 86400000 * 7), // 1 week ago
      totalTransfers: 3,
    },
  ]);

  const [limits] = useState<TransferLimits>({
    daily: { used: 150000, limit: 1000000 },
    monthly: { used: 850000, limit: 5000000 },
    perTransaction: { min: 100, max: 500000 },
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
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: 4,
      marginBottom: theme.spacing.lg,
    },
    modeTab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
    },
    activeModeTab: {
      backgroundColor: theme.colors.primary,
    },
    modeTabText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.textSecondary,
    },
    activeModeTabText: {
      color: '#ffffff',
    },
    limitsCard: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    limitsTitle: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    limitsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    limitsLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.textSecondary,
    },
    limitsValue: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
    },
    schedulingSection: {
      marginTop: theme.spacing.md,
    },
    frequencySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    frequencyOption: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFrequencyOption: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    frequencyOptionText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    activeFrequencyOptionText: {
      color: '#ffffff',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleBeneficiarySelect = useCallback((beneficiary: Beneficiary) => {
    setFormData(prev => ({
      ...prev,
      recipientName: beneficiary.name,
      recipientAccountNumber: beneficiary.accountNumber,
    }));
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.senderAccount) {
      errors.push('Please select a sender account');
    }

    if (!formData.recipientName.trim()) {
      errors.push('Please enter recipient name');
    }

    if (!formData.recipientAccountNumber.trim()) {
      errors.push('Please enter recipient account number');
    } else if (formData.recipientAccountNumber.length !== 10) {
      errors.push('Account number must be 10 digits');
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

    if (transferMode === 'scheduled' && !formData.scheduledDate) {
      errors.push('Please select a scheduled date');
    }

    if (transferMode === 'recurring') {
      if (!formData.scheduledDate) {
        errors.push('Please select start date for recurring transfer');
      }
      if (formData.frequency === 'once') {
        errors.push('Please select frequency for recurring transfer');
      }
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transferRequest: InternalTransferRequest = {
        type: 'internal',
        senderAccountId: formData.senderAccount!.id,
        recipientName: formData.recipientName,
        recipientAccountNumber: formData.recipientAccountNumber,
        amount: parseFloat(formData.amount),
        description: formData.description,
        pin: formData.pin,
        scheduledDate: formData.scheduledDate || undefined,
        frequency: transferMode === 'recurring' ? formData.frequency : 'once',
        endDate: formData.endDate || undefined,
      };

      // Show success
      showAlert(
        'Transfer Successful! 🎉',
        `${formatCurrency(parseFloat(formData.amount))} has been ${
          transferMode === 'instant' ? 'transferred' : 'scheduled'
        } to ${formData.recipientName}`,
        [{
          text: 'OK',
          onPress: () => {
            onTransferComplete?.(transferRequest);
            onBack?.();
          }
        }]
      );

    } catch (error) {
      showAlert('Transfer Failed', 'Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const frequencyOptions: { value: TransferFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const renderTransferModes = () => (
    <View style={styles.modeTabs}>
      {(['instant', 'scheduled', 'recurring'] as TransferMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[styles.modeTab, transferMode === mode && styles.activeModeTab]}
          onPress={() => setTransferMode(mode)}
        >
          <Text style={[styles.modeTabText, transferMode === mode && styles.activeModeTabText]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLimitsCard = () => (
    <View style={styles.limitsCard}>
      <Text style={styles.limitsTitle}>💳 Transfer Limits</Text>
      <View style={styles.limitsRow}>
        <Text style={styles.limitsLabel}>Daily Used/Limit</Text>
        <Text style={styles.limitsValue}>
          {formatCurrency(limits.daily.used)} / {formatCurrency(limits.daily.limit)}
        </Text>
      </View>
      <View style={styles.limitsRow}>
        <Text style={styles.limitsLabel}>Monthly Used/Limit</Text>
        <Text style={styles.limitsValue}>
          {formatCurrency(limits.monthly.used)} / {formatCurrency(limits.monthly.limit)}
        </Text>
      </View>
      <View style={styles.limitsRow}>
        <Text style={styles.limitsLabel}>Per Transaction</Text>
        <Text style={styles.limitsValue}>
          {formatCurrency(limits.perTransaction.min)} - {formatCurrency(limits.perTransaction.max)}
        </Text>
      </View>
    </View>
  );

  const renderSchedulingOptions = () => {
    if (transferMode === 'instant') return null;

    return (
      <View style={styles.schedulingSection}>
        <Input
          label={transferMode === 'recurring' ? 'Start Date' : 'Scheduled Date'}
          placeholder="Select date"
          value={formData.scheduledDate?.toLocaleDateString() || ''}
          onChangeText={() => {}} // In real app, would open date picker
          validationType="text"
        />

        {transferMode === 'recurring' && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.md }]}>
              Frequency
            </Text>
            <View style={styles.frequencySelector}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyOption,
                    formData.frequency === option.value && styles.activeFrequencyOption,
                  ]}
                  onPress={() => handleFieldChange('frequency', option.value)}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      formData.frequency === option.value && styles.activeFrequencyOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="End Date (Optional)"
              placeholder="Select end date"
              value={formData.endDate?.toLocaleDateString() || ''}
              onChangeText={() => {}} // In real app, would open date picker
              validationType="text"
            />
          </>
        )}
      </View>
    );
  };

  const renderTransferReview = () => {
    if (!formData.amount || !formData.recipientName) return null;

    const amount = parseFloat(formData.amount);
    const fee = transferMode === 'instant' ? 0 : 50; // Mock fee calculation
    const total = amount + fee;

    return (
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>📋 Transfer Summary</Text>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>To:</Text>
          <Text style={styles.reviewValue}>{formData.recipientName}</Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Account:</Text>
          <Text style={styles.reviewValue}>{formData.recipientAccountNumber}</Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Amount:</Text>
          <Text style={styles.reviewValue}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Fee:</Text>
          <Text style={styles.reviewValue}>{formatCurrency(fee)}</Text>
        </View>

        <View style={[styles.reviewRow, { borderBottomWidth: 0, marginTop: theme.spacing.sm }]}>
          <Text style={[styles.reviewLabel, { fontWeight: 'bold' }]}>Total:</Text>
          <Text style={[styles.reviewValue, { fontWeight: 'bold', color: theme.colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>

        {transferMode !== 'instant' && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>When:</Text>
            <Text style={styles.reviewValue}>
              {transferMode === 'scheduled' ? 'One-time' : formData.frequency}
              {formData.scheduledDate && ` starting ${formData.scheduledDate.toLocaleDateString()}`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TransferHeader
        title="Internal Transfer"
        subtitle="Transfer within FMFB accounts"
        onBack={onBack}
        showSteps={false}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTransferModes()}
        {renderLimitsCard()}

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 From Account</Text>
          <AccountSelector
            accounts={accounts}
            selectedAccount={formData.senderAccount}
            onAccountSelect={(account) => handleFieldChange('senderAccount', account)}
            label=""
            placeholder="Select your account"
          />
        </View>

        {/* Beneficiaries */}
        <BeneficiarySelector
          beneficiaries={beneficiaries}
          onBeneficiarySelect={handleBeneficiarySelect}
          showAddNew={true}
        />

        {/* Transfer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Transfer Details</Text>

          <Input
            label="Recipient Name"
            placeholder="Enter recipient name"
            value={formData.recipientName}
            onChangeText={(text) => handleFieldChange('recipientName', text)}
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

          <Input
            label="Amount (₦)"
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

          {renderSchedulingOptions()}

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
          title={
            isProcessing
              ? "Processing..."
              : transferMode === 'instant'
                ? "Send Money Now 🚀"
                : "Schedule Transfer ⏰"
          }
          onPress={handleTransfer}
          loading={isProcessing}
          style={styles.transferButton}
        />

        <Text style={styles.disclaimerText}>
          {transferMode === 'instant'
            ? "Internal transfers are processed instantly and are free of charge."
            : "Scheduled transfers will be processed on the selected date. You can modify or cancel before processing."
          }
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InternalTransferScreen;