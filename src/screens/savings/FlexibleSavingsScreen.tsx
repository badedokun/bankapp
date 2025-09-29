/**
 * Flexible Savings Screen
 * Based on ui-mockup-flexible-savings.html
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Button from '../../components/ui/Button';

interface FlexibleSavingsScreenProps {
  onBack?: () => void;
  onSavingComplete?: (saving: any) => void;
}

export const FlexibleSavingsScreen: React.FC<FlexibleSavingsScreenProps> = ({
  onBack,
  onSavingComplete,
}) => {
  const theme = useTenantTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#0d9488' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>Flexible Savings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.productIcon}>🌱</Text>
          <Text style={[styles.productTitle, { color: theme.colors.text }]}>
            Flexible Savings Account
          </Text>
          <Text style={[styles.productSubtitle, { color: theme.colors.textSecondary }]}>
            Save at your own pace with complete flexibility
          </Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Benefits & Features
          </Text>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                10% Annual Interest
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Competitive interest rate on your savings
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔄</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Flexible Deposits & Withdrawals
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Add or withdraw funds anytime without penalties
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📱</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Mobile Banking
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Manage your savings anywhere, anytime
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🛡️</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                NDIC Insured
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Your savings are protected up to ₦500,000
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Open Your Account
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Initial Deposit Amount
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="₦1,000 minimum"
              placeholderTextColor={theme.colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: '#e6fffa' }]}>
            <Text style={[styles.infoTitle, { color: '#0d9488' }]}>
              💡 Did you know?
            </Text>
            <Text style={[styles.infoText, { color: '#134e4a' }]}>
              You can start saving with as little as ₦1,000 and add more funds whenever you want!
            </Text>
          </View>

          <Button
            title={loading ? 'Creating Account...' : 'Open Flexible Savings Account'}
            onPress={handleCreateSaving}
            disabled={loading || !amount}
            style={{ marginTop: 20 }}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Savings Summary
          </Text>
          <Text style={[styles.noSavings, { color: theme.colors.textSecondary }]}>
            No flexible savings account yet. Open one today!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backArrow: {
    fontSize: 24,
    color: '#fff',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
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