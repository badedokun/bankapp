/**
 * Loans Screen
 * Features: Personal, Business, Quick Loans
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTenantTheme } from '../../tenants/TenantContext';
import { useBankingAlert } from '../../services/AlertService';
import Button from '../../components/ui/Button';

interface LoansScreenProps {
  onBack?: () => void;
  onNavigateToLoanFlow?: (productType: string) => void;
}

export const LoansScreen: React.FC<LoansScreenProps> = ({ onBack, onNavigateToLoanFlow }) => {
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  const [selectedProduct, setSelectedProduct] = useState('personal');

  const loanProducts = [
    { id: 'personal', name: 'Personal Loan', maxAmount: '₦5M', rate: '15%', icon: '💵' },
    { id: 'business', name: 'Business Loan', maxAmount: '₦50M', rate: '12%', icon: '💼' },
    { id: 'quick', name: 'Quick Loan', maxAmount: '₦100K', rate: '20%', icon: '⚡' },
  ];

  const handleApplyNow = () => {
    // Navigate to the loan flow for the selected product
    if (onNavigateToLoanFlow) {
      onNavigateToLoanFlow(selectedProduct);
    } else {
      // For products without specific screens yet, show coming soon
      const productName = loanProducts.find(p => p.id === selectedProduct)?.name;
      if (selectedProduct === 'personal') {
        // This should not happen since dashboard routes directly to PersonalLoan
        showAlert('Info', 'Use the dashboard feature tiles to access Personal Loans.');
      } else {
        showAlert('Coming Soon', `${productName} application flow will be available soon. This feature is under development.`);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>Loan Products</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.productsContainer}>
          {loanProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard,
                {
                  backgroundColor: selectedProduct === product.id
                    ? theme.colors.primary + '20'
                    : theme.colors.card,
                  borderColor: selectedProduct === product.id
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedProduct(product.id)}
            >
              <View style={styles.productHeader}>
                <Text style={styles.productIcon}>{product.icon}</Text>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.colors.text }]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productLimit, { color: theme.colors.textSecondary }]}>
                    Up to {product.maxAmount}
                  </Text>
                </View>
              </View>
              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Interest Rate
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {product.rate}/month
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.eligibilityCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.eligibilityTitle, { color: theme.colors.text }]}>
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
          <Button
            title="Apply Now"
            onPress={handleApplyNow}
            style={{ marginTop: 16 }}
          />
        </View>

        <View style={[styles.activeLoansCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.activeLoansTitle, { color: theme.colors.text }]}>
            Active Loans
          </Text>
          <Text style={[styles.noLoans, { color: theme.colors.textSecondary }]}>
            You have no active loans
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
  productsContainer: {
    marginBottom: 24,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productLimit: {
    fontSize: 14,
    marginTop: 4,
  },
  productDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  eligibilityCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  eligibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  activeLoansCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  activeLoansTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noLoans: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default LoansScreen;