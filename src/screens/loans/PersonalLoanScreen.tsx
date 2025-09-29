/**
 * Personal Loan Screen
 * Based on ui-mockup-personal-loan.html
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

interface PersonalLoanScreenProps {
  onBack?: () => void;
  onLoanComplete?: (loan: any) => void;
}

export const PersonalLoanScreen: React.FC<PersonalLoanScreenProps> = ({
  onBack,
  onLoanComplete,
}) => {
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');
  const [loading, setLoading] = useState(false);

  const handleApplyLoan = async () => {
    setLoading(true);
    try {
      // API call to apply for personal loan
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('Success', 'Personal loan application submitted successfully');
      onLoanComplete?.({ amount, duration, type: 'personal' });
    } catch (error) {
      showAlert('Error', 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(amount) || 0;
    const months = parseInt(duration) || 12;
    const monthlyRate = 0.15 / 12; // 15% annual rate

    if (principal > 0) {
      const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                     (Math.pow(1 + monthlyRate, months) - 1);
      return Math.round(payment);
    }
    return 0;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>Personal Loan</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.productCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.productIcon}>💵</Text>
          <Text style={[styles.productTitle, { color: theme.colors.text }]}>
            Personal Loan
          </Text>
          <Text style={[styles.productSubtitle, { color: theme.colors.textSecondary }]}>
            Quick access to funds for personal needs
          </Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Loan Features
          </Text>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💰</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Up to ₦5,000,000
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Borrow what you need for your personal goals
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📅</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Flexible Repayment
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                6 to 60 months repayment period
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Quick Approval
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Get approved in as little as 24 hours
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Competitive Rate
              </Text>
              <Text style={[styles.benefitDesc, { color: theme.colors.textSecondary }]}>
                Starting from 15% per annum
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Loan Application
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Loan Amount
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="₦50,000 - ₦5,000,000"
              placeholderTextColor={theme.colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Repayment Period (Months)
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="6 - 60 months"
              placeholderTextColor={theme.colors.textSecondary}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          {amount && duration && (
            <View style={[styles.calculationCard, { backgroundColor: '#f0f9ff' }]}>
              <Text style={[styles.calculationTitle, { color: theme.colors.primary }]}>
                📊 Loan Summary
              </Text>
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, { color: '#0369a1' }]}>
                  Monthly Payment:
                </Text>
                <Text style={[styles.calculationValue, { color: '#0369a1' }]}>
                  ₦{calculateMonthlyPayment().toLocaleString()}
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, { color: '#0369a1' }]}>
                  Total Repayment:
                </Text>
                <Text style={[styles.calculationValue, { color: '#0369a1' }]}>
                  ₦{(calculateMonthlyPayment() * parseInt(duration || '12')).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.infoCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.infoTitle, { color: '#d97706' }]}>
              📋 Required Documents
            </Text>
            <Text style={[styles.infoText, { color: '#92400e' }]}>
              • Valid ID (NIN, Driver's License, or Passport){'\n'}
              • Proof of Income (Salary slip or Bank statement){'\n'}
              • Utility Bill (for address verification){'\n'}
              • BVN
            </Text>
          </View>

          <Button
            title={loading ? 'Submitting Application...' : 'Apply for Personal Loan'}
            onPress={handleApplyLoan}
            disabled={loading || !amount || !duration}
            style={{ marginTop: 20 }}
          />
        </View>

        <View style={[styles.eligibilityCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Loan Eligibility
          </Text>
          <View style={styles.eligibilityRow}>
            <Text style={[styles.eligibilityLabel, { color: theme.colors.textSecondary }]}>
              Maximum Amount
            </Text>
            <Text style={[styles.eligibilityValue, { color: theme.colors.primary }]}>
              ₦2,000,000
            </Text>
          </View>
          <View style={styles.eligibilityRow}>
            <Text style={[styles.eligibilityLabel, { color: theme.colors.textSecondary }]}>
              Credit Score
            </Text>
            <Text style={[styles.eligibilityValue, { color: theme.colors.success }]}>
              750 (Excellent)
            </Text>
          </View>
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
  calculationCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
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
    lineHeight: 18,
  },
  eligibilityCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  eligibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eligibilityLabel: {
    fontSize: 14,
  },
  eligibilityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalLoanScreen;