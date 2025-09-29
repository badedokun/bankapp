/**
 * Enhanced Dashboard Screen Component
 * RBAC-enabled dashboard with comprehensive banking features and role-based access control
 */

import React from 'react';
import ModernDashboardScreen from './ModernDashboardScreen';

export interface DashboardScreenProps {
  onNavigateToTransfer?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToTransactionDetails?: (transactionId: string, transaction?: any) => void;
  onNavigateToAIChat?: () => void;
  onLogout?: () => void;
  onNavigateToFeature?: (feature: string, params?: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransfer,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToTransactionDetails,
  onNavigateToAIChat,
  onLogout,
  onNavigateToFeature,
}) => {
  // Use the modern glassmorphism dashboard with RBAC integration
  return (
    <ModernDashboardScreen
      onNavigateToTransfer={onNavigateToTransfer}
      onNavigateToHistory={onNavigateToHistory}
      onNavigateToSettings={onNavigateToSettings}
      onNavigateToTransactionDetails={onNavigateToTransactionDetails}
      onNavigateToAIChat={onNavigateToAIChat}
      onLogout={onLogout}
      onNavigateToFeature={onNavigateToFeature}
    />
  );
};

export default DashboardScreen;