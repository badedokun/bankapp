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
} from '../screens';

// Navigation parameter types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Transfer: undefined;
  TransactionDetails: { transactionId: string };
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
          borderTopWidth: 1,
          borderTopColor: '#e1e5e9',
          paddingVertical: 8,
          height: 80,
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
              console.log('Show transaction details for:', transactionId);
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
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;