/**
 * Enhanced Dashboard Screen Component
 * RBAC-enabled dashboard with comprehensive banking features and role-based access control
 */

import React from 'react';
import { EnhancedDashboardScreen } from '../../components/dashboard/EnhancedDashboardScreen';

export interface DashboardScreenProps {
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTransactionDetails?: (transactionId: string, transaction?: any) => void;
  onNavigateToAIChat?: () => void;
  onLogout?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransfer,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToTransactionDetails,
  onNavigateToAIChat,
  onLogout,
}) => {
  // Use the enhanced RBAC dashboard instead of the legacy dashboard
  return (
    <EnhancedDashboardScreen
      onNavigateToTransfer={onNavigateToTransfer}
      onNavigateToHistory={onNavigateToHistory}
      onNavigateToSettings={onNavigateToSettings}
      onNavigateToTransactionDetails={onNavigateToTransactionDetails}
      onNavigateToAIChat={onNavigateToAIChat}
      onLogout={onLogout}
    />
  );
};

export default DashboardScreen;