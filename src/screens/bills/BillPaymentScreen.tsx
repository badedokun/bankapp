/**
 * Bill Payment Screen
 * Based on ui-mockup-bill-payments.html
 * Features: Utility payments, service subscriptions, scheduled payments
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
  ActivityIndicator,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Button from '../../components/ui/Button';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface BillPaymentScreenProps {
  onBack?: () => void;
  onPaymentComplete?: (payment: any) => void;
}

export const BillPaymentScreen: React.FC<BillPaymentScreenProps> = ({
  onBack,
  onPaymentComplete,
}) => {
  const theme = useTenantTheme();
  const { theme: tenantTheme } = useTenantTheme();
  const { showAlert } = useBankingAlert();
  const [selectedCategory, setSelectedCategory] = useState('utilities');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'internet', name: 'Internet', icon: '🌐' },
    { id: 'cable', name: 'Cable TV', icon: '📺' },
    { id: 'mobile', name: 'Mobile', icon: '📱' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'education', name: 'Education', icon: '🎓' },
  ];

  const handlePayBill = async () => {
    setLoading(true);
    try {
      // API call to process bill payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('Success', 'Bill payment processed successfully');
      onPaymentComplete?.({});
    } catch (error) {
      showAlert('Error', 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>Bill Payments</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Select Category
          </Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selectedCategory === category.id
                      ? theme.colors.primary + '20'
                      : theme.colors.card,
                    borderColor: selectedCategory === category.id
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Bill Details
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Provider</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="Select provider"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Account/Meter Number</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="Enter account number"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Amount</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder={`${getCurrencySymbol(tenantTheme.currency)}0.00`}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <Button
            title={loading ? 'Processing...' : 'Pay Bill'}
            onPress={handlePayBill}
            disabled={loading}
            style={{ marginTop: 20 }}
          />
        </View>

        <View style={styles.recentBills}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Bills
          </Text>
          <View style={[styles.billCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.billInfo}>
              <Text style={[styles.billProvider, { color: theme.colors.text }]}>
                EKEDC Electricity
              </Text>
              <Text style={[styles.billDate, { color: theme.colors.textSecondary }]}>
                Paid on Dec 15, 2024
              </Text>
            </View>
            <Text style={[styles.billAmount, { color: theme.colors.primary }]}>
              {formatCurrency(15000, tenantTheme.currency, { locale: tenantTheme.locale })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
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
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  recentBills: {
    marginBottom: 24,
  },
  billCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  billInfo: {
    flex: 1,
  },
  billProvider: {
    fontSize: 14,
    fontWeight: '500',
  },
  billDate: {
    fontSize: 12,
    marginTop: 4,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BillPaymentScreen;