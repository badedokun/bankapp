/**
 * Tenant Selector Component
 * Allows switching between different tenant configurations
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTenant } from '@/tenants/TenantContext';
import { TenantID } from '@/types/tenant';

interface TenantSelectorProps {
  visible: boolean;
  onClose: () => void;
  onTenantSelect: (tenantId: TenantID) => void;
}

const availableTenants: { id: TenantID; name: string; color: string }[] = [
  { id: 'fmfb', name: 'Firstmidas Microfinance Bank', color: '#2E8B57' },
  { id: 'bank-a', name: 'Bank A Demo', color: '#1E40AF' },
  { id: 'bank-b', name: 'Bank B Demo', color: '#DC2626' },
  { id: 'bank-c', name: 'Bank C Demo', color: '#059669' },
  { id: 'default', name: 'Multi-Tenant Platform', color: '#6366F1' },
];

const TenantSelector: React.FC<TenantSelectorProps> = ({
  visible,
  onClose,
  onTenantSelect,
}) => {
  const { currentTenant } = useTenant();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Bank Configuration</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tenantList}>
            {availableTenants.map((tenant) => (
              <TouchableOpacity
                key={tenant.id}
                style={[
                  styles.tenantItem,
                  currentTenant?.name === tenant.id && styles.activeTenant,
                  { borderLeftColor: tenant.color }
                ]}
                onPress={() => {
                  onTenantSelect(tenant.id);
                  onClose();
                }}
              >
                <View style={[styles.colorDot, { backgroundColor: tenant.color }]} />
                <View style={styles.tenantInfo}>
                  <Text style={[
                    styles.tenantName,
                    currentTenant?.name === tenant.id && styles.activeTenantText
                  ]}>
                    {tenant.name}
                  </Text>
                  <Text style={styles.tenantId}>ID: {tenant.id}</Text>
                </View>
                {currentTenant?.name === tenant.id && (
                  <Text style={styles.currentBadge}>Current</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Switch between different bank configurations for testing
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#6B7280',
  },
  tenantList: {
    padding: 20,
  },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  activeTenant: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activeTenantText: {
    color: '#4F46E5',
  },
  tenantId: {
    fontSize: 12,
    color: '#6B7280',
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TenantSelector;