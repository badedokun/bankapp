/**
 * Flexible Savings Screen
 * Based on ui-mockup-flexible-savings.html
 */

import React, { useState } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput as RNTextInput,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Button from '../../components/ui/Button';
import TransferHeader from '../../components/transfers/TransferHeader';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface FlexibleSavingsScreenProps {
  onBack?: () => void;
  onSavingComplete?: (saving: any) => void;
}

export const FlexibleSavingsScreen: React.FC<FlexibleSavingsScreenProps> = ({
  onBack,
  onSavingComplete,
}) => {
  const tenantTheme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSaving = async () => {
    setLoading(true);
    try {
      // API call to create flexible saving
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('Success', 'Flexible saving account created successfully');
      onSavingComplete?.({ amount, type: 'flexible' });
    } catch (error) {
      showAlert('Error', 'Failed to create flexible saving account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TransferHeader
        title="Flexible Savings"
        subtitle="Save at your own pace with complete flexibility"
        onBack={onBack}
        showSteps={false}
      />

      <ScrollView style={[styles.content, { backgroundColor: tenantTheme.colors.background }]}>
        <View style={[styles.productCard, { backgroundColor: tenantTheme.colors.surface }]}>
          <RNText style={styles.productIcon}>🌱</RNText>
          <RNText style={[styles.productTitle, { color: tenantTheme.colors.text }]}>
            Flexible Savings Account
          </RNText>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: tenantTheme.colors.surface }]}>
          <RNText style={[styles.sectionTitle, { color: tenantTheme.colors.text }]}>
            Benefits & Features
          </RNText>

          <View style={styles.benefitItem}>
            <RNText style={styles.benefitIcon}>💰</RNText>
            <View style={styles.benefitText}>
              <RNText style={[styles.benefitTitle, { color: tenantTheme.colors.text }]}>
                10% Annual Interest
              </RNText>
              <RNText style={[styles.benefitDesc, { color: tenantTheme.colors.textSecondary }]}>
                Competitive interest rate on your savings
              </RNText>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <RNText style={styles.benefitIcon}>🔄</RNText>
            <View style={styles.benefitText}>
              <RNText style={[styles.benefitTitle, { color: tenantTheme.colors.text }]}>
                Flexible Deposits & Withdrawals
              </RNText>
              <RNText style={[styles.benefitDesc, { color: tenantTheme.colors.textSecondary }]}>
                Add or withdraw funds anytime without penalties
              </RNText>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <RNText style={styles.benefitIcon}>📱</RNText>
            <View style={styles.benefitText}>
              <RNText style={[styles.benefitTitle, { color: tenantTheme.colors.text }]}>
                Mobile Banking
              </RNText>
              <RNText style={[styles.benefitDesc, { color: tenantTheme.colors.textSecondary }]}>
                Manage your savings anywhere, anytime
              </RNText>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <RNText style={styles.benefitIcon}>🛡️</RNText>
            <View style={styles.benefitText}>
              <RNText style={[styles.benefitTitle, { color: tenantTheme.colors.text }]}>
                NDIC Insured
              </RNText>
              <RNText style={[styles.benefitDesc, { color: tenantTheme.colors.textSecondary }]}>
                Your savings are protected up to {formatCurrency(500000)}
              </RNText>
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: tenantTheme.colors.surface }]}>
          <RNText style={[styles.sectionTitle, { color: tenantTheme.colors.text }]}>
            Open Your Account
          </RNText>

          <View style={styles.inputGroup}>
            <RNText style={[styles.label, { color: tenantTheme.colors.text }]}>
              Initial Deposit Amount
            </RNText>
            <RNTextInput
              style={[styles.input, {
                backgroundColor: tenantTheme.colors.background,
                color: tenantTheme.colors.text,
                borderColor: tenantTheme.colors.border,
              }]}
              placeholder={`${formatCurrency(1000)} minimum`}
              placeholderTextColor={tenantTheme.colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <RNText style={[styles.infoTitle, { color: theme.colors.info }]}>
              💡 Did you know?
            </RNText>
            <RNText style={[styles.infoText, { color: theme.colors.text }]}>
              You can start saving with as little as {formatCurrency(1000)} and add more funds whenever you want!
            </RNText>
          </View>

          <Button
            title={loading ? 'Creating Account...' : 'Open Flexible Savings Account'}
            onPress={handleCreateSaving}
            disabled={loading || !amount}
            style={{ marginTop: 20 }}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: tenantTheme.colors.surface }]}>
          <RNText style={[styles.sectionTitle, { color: tenantTheme.colors.text }]}>
            Your Savings Summary
          </RNText>
          <RNText style={[styles.noSavings, { color: tenantTheme.colors.textSecondary }]}>
            No flexible savings account yet. Open one today!
          </RNText>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  productIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  productSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  noSavings: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default FlexibleSavingsScreen;