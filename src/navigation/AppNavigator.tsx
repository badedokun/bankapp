/**
 * App Navigator
 * Main navigation structure for the OrokiiPay app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import screens
import {
  LoginScreen,
  DashboardScreen,
  AITransferScreen,
  TransactionHistoryScreen,
  SettingsScreen,
  RBACManagementScreen,
  ExternalTransferScreen,
  BillPaymentScreen,
  SavingsScreen,
  LoansScreen,
} from '../screens';

// Navigation parameter types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Transfer: undefined;
  ExternalTransfer: undefined;
  BillPayment: undefined;
  Savings: undefined;
  Loans: undefined;
  TransactionDetails: { transactionId: string };
  RBACManagement: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transfer: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Bar Component
const TabBarIcon: React.FC<{ 
  focused: boolean; 
  icon: string; 
  label: string;
}> = ({ focused, icon, label }) => {
  return (
    <Text style={{ 
      fontSize: focused ? 24 : 20, 
      opacity: focused ? 1 : 0.6,
      textAlign: 'center',
    }}>
      {icon}
    </Text>
  );
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          paddingVertical: 8,
          height: 80,
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e1e5e9',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({ focused }) => {
          let icon = '';
          
          switch (route.name) {
            case 'Dashboard':
              icon = '🏠';
              break;
            case 'Transfer':
              icon = '💸';
              break;
            case 'History':
              icon = '📊';
              break;
            case 'Settings':
              icon = '⚙️';
              break;
          }

          return (
            <TabBarIcon
              focused={focused}
              icon={icon}
              label={route.name}
            />
          );
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={{
          tabBarLabel: 'Home',
        }}
      >
        {(props) => (
          <DashboardScreen
            {...props}
            onNavigateToTransfer={() => props.navigation.navigate('Transfer')}
            onNavigateToHistory={() => props.navigation.navigate('History')}
            onNavigateToSettings={() => props.navigation.navigate('Settings')}
            onNavigateToFeature={(feature: string, params?: any) => {
              // Handle specific feature navigation
              switch (feature) {
                case 'rbac_management':
                  // Navigate to RBAC Management screen
                  props.navigation.getParent()?.navigate('RBACManagement');
                  break;
                case 'external_transfers':
                  props.navigation.getParent()?.navigate('ExternalTransfer');
                  break;
                case 'bill_payments':
                  props.navigation.getParent()?.navigate('BillPayment');
                  break;
                case 'flexible_savings':
                case 'target_savings':
                case 'locked_savings':
                case 'group_savings':
                case 'save_as_transact':
                  props.navigation.getParent()?.navigate('Savings');
                  break;
                case 'personal_loans':
                case 'business_loans':
                case 'quick_loans':
                  props.navigation.getParent()?.navigate('Loans');
                  break;
                default:
                  break;
              }
            }}
            onLogout={() => {
              // Navigate back to auth
              props.navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            }}
          />
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Transfer"
        options={{
          tabBarLabel: 'Send Money',
        }}
      >
        {(props) => (
          <AITransferScreen
            {...props}
            onTransferComplete={() => {
              // Navigate back to dashboard after successful transfer
              props.navigation.navigate('Dashboard');
            }}
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="History"
        options={{
          tabBarLabel: 'History',
        }}
      >
        {(props) => (
          <TransactionHistoryScreen
            {...props}
            onBack={() => props.navigation.navigate('Dashboard')}
            onTransactionDetails={(transactionId) => {
              // In the future, navigate to transaction details
            }}
          />
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
        }}
      >
        {(props) => (
          <SettingsScreen
            {...props}
            onBack={() => props.navigation.navigate('Dashboard')}
            onLogout={() => {
              // Navigate back to auth
              props.navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            }}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// Root Stack Navigator
const AppNavigator: React.FC<{
  isAuthenticated: boolean;
  onLogin: () => void;
}> = ({ isAuthenticated, onLogin }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth">
            {(props) => (
              <LoginScreen
                {...props}
                onLogin={async () => {
                  onLogin();
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
            />
            <Stack.Screen
              name="RBACManagement"
              options={{
                title: 'RBAC Management',
                headerShown: true,
              }}
            >
              {(props) => (
                <RBACManagementScreen
                  {...props}
                  onGoBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ExternalTransfer"
              options={{
                title: 'External Transfer',
                headerShown: false,
              }}
            >
              {(props) => (
                <ExternalTransferScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                  onTransferComplete={() => props.navigation.navigate('Main')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="BillPayment"
              options={{
                title: 'Bill Payment',
                headerShown: false,
              }}
            >
              {(props) => (
                <BillPaymentScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                  onPaymentComplete={() => props.navigation.navigate('Main')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Savings"
              options={{
                title: 'Savings',
                headerShown: false,
              }}
            >
              {(props) => (
                <SavingsScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Loans"
              options={{
                title: 'Loans',
                headerShown: false,
              }}
            >
              {(props) => (
                <LoansScreen
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;