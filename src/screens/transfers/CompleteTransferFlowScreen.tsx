/**
 * Complete Money Transfer Flow Screen
 * Based on ui-mockup-complete-money-transfer.html
 * Features: 4-step process (Select → Details → Review → Complete), Multiple transfer types
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import TransferHeader from '../../components/transfers/TransferHeader';
import TransferTabs from '../../components/transfers/TransferTabs';
import AccountSelector from '../../components/transfers/AccountSelector';
import BeneficiarySelector from '../../components/transfers/BeneficiarySelector';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import BankSelector from '../../components/BankSelector';
import APIService from '../../services/api';
import {
  TransferType,
  TransferStep,
  TransferProgress,
  TransferRequest,
  UserAccount,
  Beneficiary,
  Bank,
  TransferLimits,
} from '../../types/transfers';

export interface CompleteTransferFlowScreenProps {
  onBack?: () => void;
  onTransferComplete?: (transfer: TransferRequest) => void;
}

export const CompleteTransferFlowScreen: React.FC<CompleteTransferFlowScreenProps> = ({
  onBack,
  onTransferComplete,
}) => {
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();

  const [progress, setProgress] = useState<TransferProgress>({
    currentStep: 'select',
    completedSteps: [],
    transferData: {},
    isValid: false,
    errors: {},
  });

  // External transfer verification state
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [verificationState, setVerificationState] = useState<{
    isVerifying: boolean;
    isVerified: boolean;
    accountName: string | null;
    error: string | null;
  }>({
    isVerifying: false,
    isVerified: false,
    accountName: null,
    error: null,
  });

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

  const [beneficiaries] = useState<Beneficiary[]>([
    {
      id: '1',
      name: 'Jane Smith',
      accountNumber: '1234567890',
      bankCode: 'SAME',
      bankName: '', // Will be populated from tenant context
      nickname: 'Jane',
      isFrequent: true,
      lastUsed: new Date(Date.now() - 86400000),
      totalTransfers: 15,
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      accountNumber: '2345678901',
      bankCode: 'GTB',
      bankName: 'Guaranty Trust Bank',
      nickname: 'Sarah GTB',
      isFrequent: true,
      lastUsed: new Date(Date.now() - 86400000 * 2),
      totalTransfers: 8,
    },
  ]);

  const [banks] = useState<Bank[]>([
    { code: 'GTB', name: 'Guaranty Trust Bank', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'UBA', name: 'United Bank for Africa', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
    { code: 'FBN', name: 'First Bank of Nigeria', isActive: true, transferFee: 52.50, maxTransferLimit: 1000000 },
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
    stepContainer: {
      flex: 1,
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
    stepTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    stepDescription: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
      lineHeight: 20,
    },
    transferTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    transferTypeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      width: '48%',
      alignItems: 'center',
      minHeight: 120,
    },
    selectedTransferType: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    transferTypeIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.sm,
    },
    transferTypeName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    transferTypeDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
    },
    navigationButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    backButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    backButtonText: {
      color: theme.colors.text,
    },
    nextButton: {
      flex: 2,
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
      flex: 1,
    },
    reviewValue: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      textAlign: 'right',
      flex: 2,
      marginLeft: theme.spacing.md,
    },
    totalRow: {
      borderBottomWidth: 0,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 2,
      borderTopColor: theme.colors.primary,
    },
    totalLabel: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.primary,
    },
    successContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    successIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    successTitle: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.success,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.lg,
    },
    referenceContainer: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      alignItems: 'center',
    },
    referenceLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    referenceValue: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold as any,
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    actionButtons: {
      gap: theme.spacing.md,
    },
    // External Transfer Verification Styles
    bankSelectorContainer: {
      marginVertical: theme.spacing.sm,
    },
    inputLabel: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    verificationSection: {
      marginTop: theme.spacing.md,
    },
    verificationStatus: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    verificationSuccess: {
      borderColor: theme.colors.success || '#10b981',
      backgroundColor: theme.colors.success ? `${theme.colors.success}15` : '#10b98115',
    },
    verificationError: {
      borderColor: theme.colors.error,
      backgroundColor: `${theme.colors.error}15`,
    },
    verificationText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium as any,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    verifiedAccountName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold as any,
      color: theme.colors.primary,
    },
    errorText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    verifyButton: {
      marginTop: theme.spacing.sm,
    },
    retryButton: {
      marginTop: theme.spacing.sm,
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const transferTypes = [
    {
      id: 'internal' as TransferType,
      name: 'Internal Transfer',
      description: 'Same bank instant transfer',
      icon: '🏦',
      fee: 0,
    },
    {
      id: 'external' as TransferType,
      name: 'External Transfer',
      description: 'Other banks via NIBSS',
      icon: '🏛️',
      fee: 52.50,
    },
    {
      id: 'bill_payment' as TransferType,
      name: 'Bill Payment',
      description: 'Pay bills & utilities',
      icon: '💡',
      fee: 50,
    },
    {
      id: 'international' as TransferType,
      name: 'International',
      description: 'Global transfers',
      icon: '🌍',
      fee: 2500,
    },
  ];

  const updateProgress = useCallback((updates: Partial<TransferProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  // NIBSS Account Verification for External Transfers
  const verifyAccount = useCallback(async (accountNumber: string, bankCode: string) => {
    try {
      setVerificationState({
        isVerifying: true,
        isVerified: false,
        accountName: null,
        error: null,
      });

      console.log('🔍 Verifying account:', { accountNumber, bankCode });

      const response = await APIService.validateRecipient({
        accountNumber,
        bankCode,
      });

      if (response?.data?.accountName) {
        setVerificationState({
          isVerifying: false,
          isVerified: true,
          accountName: response.data.accountName,
          error: null,
        });

        // Auto-populate recipient name from NIBSS verification
        updateProgress({
          transferData: {
            ...progress.transferData,
            recipientName: response.data.accountName,
            recipientBankCode: bankCode,
          }
        });

        showAlert('Success', `Account verified: ${response.data.accountName}`);
        return true;
      } else {
        throw new Error('Account verification failed');
      }
    } catch (error) {
      console.error('❌ Account verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Account verification failed';

      setVerificationState({
        isVerifying: false,
        isVerified: false,
        accountName: null,
        error: errorMessage,
      });

      showAlert('Verification Failed', errorMessage);
      return false;
    }
  }, [progress.transferData, updateProgress, showAlert]);

  const handleNext = useCallback((stepData?: Partial<TransferRequest>) => {
    const updatedData = { ...progress.transferData, ...stepData };
    const currentStepIndex = ['select', 'details', 'review', 'verify', 'complete'].indexOf(progress.currentStep);
    const nextStep = ['select', 'details', 'review', 'verify', 'complete'][currentStepIndex + 1] as TransferStep;

    updateProgress({
      transferData: updatedData,
      currentStep: nextStep,
      completedSteps: [...progress.completedSteps, progress.currentStep],
    });
  }, [progress, updateProgress]);

  const handleBack = useCallback(() => {
    if (progress.completedSteps.length === 0) {
      onBack?.();
      return;
    }

    const previousStep = progress.completedSteps[progress.completedSteps.length - 1];
    const newCompletedSteps = progress.completedSteps.slice(0, -1);

    updateProgress({
      currentStep: previousStep,
      completedSteps: newCompletedSteps,
    });
  }, [progress, updateProgress, onBack]);

  const handleTransferTypeSelect = (type: TransferType) => {
    handleNext({ type });
  };

  const handleBeneficiarySelect = useCallback((beneficiary: Beneficiary) => {
    const selectedBank = banks.find(bank => bank.code === beneficiary.bankCode);
    updateProgress({
      transferData: {
        ...progress.transferData,
        recipientName: beneficiary.name,
        recipientAccountNumber: beneficiary.accountNumber,
        recipientBankCode: beneficiary.bankCode,
      }
    });
  }, [progress, updateProgress, banks]);

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Transfer Type</Text>
      <Text style={styles.stepDescription}>
        Choose the type of transfer you want to make
      </Text>

      <View style={styles.transferTypeGrid}>
        {transferTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.transferTypeCard,
              progress.transferData.type === type.id && styles.selectedTransferType,
            ]}
            onPress={() => handleTransferTypeSelect(type.id)}
          >
            <Text style={styles.transferTypeIcon}>{type.icon}</Text>
            <Text style={styles.transferTypeName}>{type.name}</Text>
            <Text style={styles.transferTypeDescription}>{type.description}</Text>
            {type.fee > 0 && (
              <Text style={[styles.transferTypeDescription, { color: theme.colors.primary, marginTop: 4 }]}>
                Fee: {formatCurrency(type.fee)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Transfer Details</Text>
      <Text style={styles.stepDescription}>
        Enter the recipient and transfer information
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 From Account</Text>
          <AccountSelector
            accounts={accounts}
            selectedAccount={accounts.find(acc => acc.id === progress.transferData.senderAccountId)}
            onAccountSelect={(account) => updateProgress({
              transferData: { ...progress.transferData, senderAccountId: account.id }
            })}
            label=""
            placeholder="Select your account"
          />
        </View>

        {/* Beneficiaries */}
        <BeneficiarySelector
          beneficiaries={beneficiaries.filter(b =>
            progress.transferData.type === 'internal'
              ? b.bankCode === 'SAME'
              : b.bankCode !== 'SAME'
          )}
          onBeneficiarySelect={handleBeneficiarySelect}
          showAddNew={true}
        />

        {/* Transfer Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Transfer Information</Text>

          {/* Step 1: Account Number for External Transfers */}
          {progress.transferData.type === 'external' ? (
            <>
              <Input
                label="Account Number"
                placeholder="Enter recipient account number"
                value={progress.transferData.recipientAccountNumber || ''}
                onChangeText={(text) => {
                  updateProgress({
                    transferData: { ...progress.transferData, recipientAccountNumber: text }
                  });
                  // Reset verification when account number changes
                  if (verificationState.isVerified) {
                    setVerificationState({
                      isVerifying: false,
                      isVerified: false,
                      accountName: null,
                      error: null,
                    });
                  }
                }}
                validationType="accountNumber"
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Step 2: Bank Selection with Search */}
              <View style={styles.bankSelectorContainer}>
                <Text style={styles.inputLabel}>Select Bank</Text>
                <BankSelector
                  selectedBank={selectedBank}
                  onBankSelect={(bank) => {
                    setSelectedBank(bank);
                    updateProgress({
                      transferData: {
                        ...progress.transferData,
                        recipientBankCode: bank.code,
                        recipientBankName: bank.name
                      }
                    });

                    // Auto-verify if account number is already entered
                    if (progress.transferData.recipientAccountNumber && progress.transferData.recipientAccountNumber.length === 10) {
                      verifyAccount(progress.transferData.recipientAccountNumber, bank.code);
                    }
                  }}
                  placeholder="Choose recipient bank"
                  showFullBankName={true}
                  testID="external-transfer-bank-selector"
                />
              </View>

              {/* Step 3: NIBSS Verification Status */}
              {progress.transferData.recipientAccountNumber && progress.transferData.recipientAccountNumber.length === 10 && selectedBank && (
                <View style={styles.verificationSection}>
                  {verificationState.isVerifying && (
                    <View style={styles.verificationStatus}>
                      <Text style={styles.verificationText}>🔍 Verifying account...</Text>
                    </View>
                  )}

                  {verificationState.isVerified && verificationState.accountName && (
                    <View style={[styles.verificationStatus, styles.verificationSuccess]}>
                      <Text style={styles.verificationText}>✅ Account verified</Text>
                      <Text style={styles.verifiedAccountName}>Account Name: {verificationState.accountName}</Text>
                    </View>
                  )}

                  {verificationState.error && (
                    <View style={[styles.verificationStatus, styles.verificationError]}>
                      <Text style={styles.verificationText}>❌ Verification failed</Text>
                      <Text style={styles.errorText}>{verificationState.error}</Text>
                      <Button
                        title="Retry Verification"
                        variant="outline"
                        size="sm"
                        onPress={() => verifyAccount(progress.transferData.recipientAccountNumber!, selectedBank.code)}
                        style={styles.retryButton}
                      />
                    </View>
                  )}

                  {!verificationState.isVerifying && !verificationState.isVerified && !verificationState.error && (
                    <Button
                      title="Verify Account"
                      variant="outline"
                      onPress={() => verifyAccount(progress.transferData.recipientAccountNumber!, selectedBank.code)}
                      style={styles.verifyButton}
                    />
                  )}
                </View>
              )}
            </>
          ) : (
            /* Internal transfers - keep original form */
            <Input
              label="Recipient Name"
              placeholder="Enter recipient name"
              value={progress.transferData.recipientName || ''}
              onChangeText={(text) => updateProgress({
                transferData: { ...progress.transferData, recipientName: text }
              })}
              validationType="text"
            />
          )}

          {/* Common fields for all transfer types */}
          {progress.transferData.type !== 'external' && (
            <Input
              label="Account Number"
              placeholder="Enter account number"
              value={progress.transferData.recipientAccountNumber || ''}
              onChangeText={(text) => updateProgress({
                transferData: { ...progress.transferData, recipientAccountNumber: text }
              })}
              validationType="accountNumber"
              keyboardType="numeric"
              maxLength={10}
            />
          )}

          <Input
            label="Amount (₦)"
            placeholder="Enter amount"
            value={progress.transferData.amount?.toString() || ''}
            onChangeText={(text) => updateProgress({
              transferData: { ...progress.transferData, amount: parseFloat(text) || 0 }
            })}
            validationType="amount"
            keyboardType="numeric"
          />

          <Input
            label="Description (Optional)"
            placeholder="What's this transfer for?"
            value={progress.transferData.description || ''}
            onChangeText={(text) => updateProgress({
              transferData: { ...progress.transferData, description: text }
            })}
            validationType="text"
            multiline
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderReviewStep = () => {
    const transferType = transferTypes.find(t => t.id === progress.transferData.type);
    const amount = progress.transferData.amount || 0;
    const fee = transferType?.fee || 0;
    const total = amount + fee;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review Transfer</Text>
        <Text style={styles.stepDescription}>
          Please review your transfer details before proceeding
        </Text>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>📋 Transfer Summary</Text>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Transfer Type:</Text>
            <Text style={styles.reviewValue}>{transferType?.name}</Text>
          </View>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>To:</Text>
            <Text style={styles.reviewValue}>{progress.transferData.recipientName}</Text>
          </View>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Account:</Text>
            <Text style={styles.reviewValue}>{progress.transferData.recipientAccountNumber}</Text>
          </View>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Amount:</Text>
            <Text style={styles.reviewValue}>{formatCurrency(amount)}</Text>
          </View>

          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Fee:</Text>
            <Text style={styles.reviewValue}>{formatCurrency(fee)}</Text>
          </View>

          <View style={[styles.reviewRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Input
            label="Transaction PIN"
            placeholder="Enter your 4-digit PIN"
            value={progress.transferData.pin || ''}
            onChangeText={(text) => updateProgress({
              transferData: { ...progress.transferData, pin: text }
            })}
            validationType="numeric"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
    );
  };

  const renderCompleteStep = () => {
    const transferType = transferTypes.find(t => t.id === progress.transferData.type);
    const amount = progress.transferData.amount || 0;
    const fee = transferType?.fee || 0;
    const total = amount + fee;
    const reference = `TXN${Date.now().toString().slice(-8)}`;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Transfer Successful!</Text>
          <Text style={styles.successMessage}>
            Your {transferType?.name.toLowerCase()} of {formatCurrency(amount)} to{' '}
            {progress.transferData.recipientName} has been processed successfully.
          </Text>

          <View style={styles.referenceContainer}>
            <Text style={styles.referenceLabel}>Transaction Reference</Text>
            <Text style={styles.referenceValue}>{reference}</Text>
          </View>

          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Transaction Details</Text>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Date & Time:</Text>
              <Text style={styles.reviewValue}>{new Date().toLocaleString()}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Type:</Text>
              <Text style={styles.reviewValue}>{transferType?.name}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Recipient:</Text>
              <Text style={styles.reviewValue}>{progress.transferData.recipientName}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Amount:</Text>
              <Text style={styles.reviewValue}>{formatCurrency(amount)}</Text>
            </View>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Fee:</Text>
              <Text style={styles.reviewValue}>{formatCurrency(fee)}</Text>
            </View>

            <View style={[styles.reviewRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Debited:</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="Share Receipt"
              onPress={() => showAlert('Share', 'Receipt sharing functionality would be implemented here')}
              variant="outline"
            />
            <Button
              title="Make Another Transfer"
              onPress={() => {
                setProgress({
                  currentStep: 'select',
                  completedSteps: [],
                  transferData: {},
                  isValid: false,
                  errors: {},
                });
              }}
              variant="primary"
            />
            <Button
              title="Done"
              onPress={() => {
                onTransferComplete?.(progress.transferData as TransferRequest);
                onBack?.();
              }}
              variant="primary"
              style={{ backgroundColor: theme.colors.success }}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderVerifyStep = () => {
    const transferType = transferTypes.find(t => t.id === progress.transferData.type);
    const amount = progress.transferData.amount || 0;
    const fee = transferType?.fee || 0;
    const total = amount + fee;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Verify Transfer</Text>
        <Text style={styles.stepDescription}>
          Enter your transaction PIN to confirm this transfer
        </Text>

        {/* Transfer Summary */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>🔒 Final Verification</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Recipient:</Text>
            <Text style={styles.reviewValue}>{progress.transferData.recipientName}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Amount:</Text>
            <Text style={styles.reviewValue}>{formatCurrency(amount)}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Fee:</Text>
            <Text style={styles.reviewValue}>{formatCurrency(fee)}</Text>
          </View>
          <View style={[styles.reviewRow, styles.totalRow]}>
            <Text style={[styles.reviewLabel, styles.totalLabel]}>Total:</Text>
            <Text style={[styles.reviewValue, styles.totalValue]}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* PIN Input */}
        <View style={styles.section}>
          <Input
            label="Transaction PIN"
            placeholder="Enter your 4-digit PIN"
            value={progress.transferData.pin || ''}
            onChangeText={(text) => updateProgress({
              transferData: { ...progress.transferData, pin: text }
            })}
            validationType="numeric"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (progress.currentStep) {
      case 'select':
        return renderSelectStep();
      case 'details':
        return renderDetailsStep();
      case 'review':
        return renderReviewStep();
      case 'verify':
        return renderVerifyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderSelectStep();
    }
  };

  const handleProcessTransfer = async () => {
    // Simulate transfer processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    handleNext();
  };

  const isStepValid = () => {
    switch (progress.currentStep) {
      case 'select':
        return !!progress.transferData.type;
      case 'details':
        return !!(
          progress.transferData.senderAccountId &&
          progress.transferData.recipientName &&
          progress.transferData.recipientAccountNumber &&
          progress.transferData.amount
        );
      case 'review':
        return !!progress.transferData.pin;
      case 'verify':
        return !!progress.transferData.pin && progress.transferData.pin.length === 4;
      default:
        return true;
    }
  };

  const getNextButtonTitle = () => {
    switch (progress.currentStep) {
      case 'select':
        return 'Continue';
      case 'details':
        return 'Review Transfer';
      case 'review':
        return 'Process Transfer';
      case 'verify':
        return 'Confirm Transfer';
      default:
        return 'Next';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TransferHeader
        title="Money Transfer"
        subtitle="Complete transfer in 4 easy steps"
        currentStep={progress.currentStep}
        onBack={handleBack}
        showSteps={true}
      />

      <View style={styles.content}>
        {renderCurrentStep()}

        {progress.currentStep !== 'complete' && (
          <View style={styles.navigationButtons}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
            <Button
              title={getNextButtonTitle()}
              onPress={progress.currentStep === 'review' ? handleProcessTransfer : progress.currentStep === 'verify' ? handleProcessTransfer : () => handleNext()}
              disabled={!isStepValid()}
              style={styles.nextButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CompleteTransferFlowScreen;