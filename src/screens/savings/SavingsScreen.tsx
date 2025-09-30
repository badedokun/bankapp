/**
 * Savings Screen
 * Features: Flexible, Target, Locked, Group Savings
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

interface SavingsScreenProps {
  onBack?: () => void;
  onNavigateToSavingsFlow?: (productType: string) => void;
}

export const SavingsScreen: React.FC<SavingsScreenProps> = ({ onBack, onNavigateToSavingsFlow }) => {
  const theme = useTenantTheme();
  const { showAlert } = useBankingAlert();
  const [selectedProduct, setSelectedProduct] = useState('flexible');

  const savingsProducts = [
    { id: 'flexible', name: 'Flexible Savings', rate: '10%', icon: '💰' },
    { id: 'target', name: 'Target Savings', rate: '12%', icon: '🎯' },
    { id: 'locked', name: 'Locked Savings', rate: '15%', icon: '🔒' },
    { id: 'group', name: 'Group Savings', rate: '11%', icon: '👥' },
    { id: 'sayt', name: 'Save As You Transact', rate: 'Auto', icon: '💳' },
  ];

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    // Navigate to the savings transaction flow for the selected product
    if (onNavigateToSavingsFlow) {
      onNavigateToSavingsFlow(productId);
    } else {
      // For products without specific screens yet, show coming soon
      const productName = savingsProducts.find(p => p.id === productId)?.name;
      if (productId === 'flexible') {
        // This should not happen since dashboard routes directly to FlexibleSavings
        showAlert('Info', 'Use the dashboard feature tiles to access Flexible Savings.');
      } else {
        showAlert('Coming Soon', `${productName} transaction flow will be available soon. This feature is under development.`);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#fff' }]}>Savings Products</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.productsGrid}>
          {savingsProducts.map((product) => (
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
              onPress={() => handleProductSelect(product.id)}
            >
              <Text style={styles.productIcon}>{product.icon}</Text>
              <Text style={[styles.productName, { color: theme.colors.text }]}>
                {product.name}
              </Text>
              <Text style={[styles.productRate, { color: theme.colors.primary }]}>
                {product.rate} p.a.
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
            Your Savings Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Total Saved
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              ₦250,000
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Interest Earned
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              ₦12,500
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  productCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  productIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  productRate: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavingsScreen;