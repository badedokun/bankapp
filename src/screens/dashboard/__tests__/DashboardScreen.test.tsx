import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { TenantProvider } from '@/tenants/TenantContext';

// Mock dependencies
jest.mock('@/services/api', () => ({
  walletsAPI: {
    getBalance: jest.fn(),
    getStatement: jest.fn(),
    getLimits: jest.fn(),
  },
  transfersAPI: {
    getHistory: jest.fn(),
  },
}));

jest.mock('@/tenants/TenantConfigLoader', () => ({
  loadTenantConfig: jest.fn().mockResolvedValue({
    id: 'fmfb',
    name: 'Firstmidas Microfinance Bank',
    branding: {
      primaryColor: '#010080',
      secondaryColor: '#000060',
      accentColor: '#DAA520',
    },
  }),
}));

jest.mock('@/utils/storage', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { walletsAPI, transfersAPI } from '@/services/api';

const mockWalletsAPI = walletsAPI as jest.Mocked<typeof walletsAPI>;
const mockTransfersAPI = transfersAPI as jest.Mocked<typeof transfersAPI>;

describe('DashboardScreen', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const mockBalance = {
    id: 'wallet-123',
    wallet_number: 'WLT202501001',
    balance: 150000.00,
    available_balance: 145000.00,
    reserved_balance: 5000.00,
    currency: 'NGN',
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockLimits = {
    daily: {
      limit: 500000,
      used: 50000,
      remaining: 450000,
    },
    monthly: {
      limit: 5000000,
      used: 200000,
      remaining: 4800000,
    },
  };

  const mockTransactions = [
    {
      id: 'txn-1',
      reference: 'TXN202501001',
      type: 'money_transfer',
      amount: 5000.00,
      status: 'completed',
      description: 'Transfer to Jane Smith',
      created_at: '2025-01-01T10:00:00Z',
      entry_type: 'debit',
      recipient_name: 'Jane Smith',
    },
    {
      id: 'txn-2',
      reference: 'TXN202501002',
      type: 'credit',
      amount: 10000.00,
      status: 'completed',
      description: 'Account credit',
      created_at: '2025-01-02T14:30:00Z',
      entry_type: 'credit',
    },
  ];

  const mockTenantData = {
    id: 'fmfb',
    name: 'Firstmidas Microfinance Bank',
    displayName: 'Firstmidas Microfinance Bank',
    branding: {
      primaryColor: '#010080',
      secondaryColor: '#000060',
      accentColor: '#DAA520',
      logo: 'https://example.com/logo.png',
    },
    configuration: {},
  };

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <TenantProvider initialTenant={mockTenantData}>
        {component}
      </TenantProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockWalletsAPI.getBalance.mockResolvedValue({ wallet: mockBalance });
    mockWalletsAPI.getLimits.mockResolvedValue({ limits: mockLimits });
    mockTransfersAPI.getHistory.mockResolvedValue({ 
      transactions: mockTransactions,
      totalCount: 2,
      currentPage: 1,
      totalPages: 1,
    });
  });

  it('renders correctly with user data and balance', async () => {
    const { getByText, getByTestId } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Welcome back, John!')).toBeTruthy();
      expect(getByText('₦150,000.00')).toBeTruthy();
      expect(getByText('WLT202501001')).toBeTruthy();
      expect(getByTestId('balance-card')).toBeTruthy();
    });
  });

  it('displays account statistics correctly', async () => {
    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('₦145,000.00')).toBeTruthy(); // Available balance
      expect(getByText('₦5,000.00')).toBeTruthy(); // Reserved balance
      expect(getByText('₦450,000.00')).toBeTruthy(); // Daily remaining limit
    });
  });

  it('shows recent transactions', async () => {
    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Transfer to Jane Smith')).toBeTruthy();
      expect(getByText('Account credit')).toBeTruthy();
      expect(getByText('TXN202501001')).toBeTruthy();
      expect(getByText('-₦5,000.00')).toBeTruthy();
      expect(getByText('+₦10,000.00')).toBeTruthy();
    });
  });

  it('handles quick action button presses', async () => {
    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      const sendMoneyButton = getByText('Send Money');
      const payBillsButton = getByText('Pay Bills');
      const buyAirtimeButton = getByText('Buy Airtime');
      const requestMoneyButton = getByText('Request Money');

      expect(sendMoneyButton).toBeTruthy();
      expect(payBillsButton).toBeTruthy();
      expect(buyAirtimeButton).toBeTruthy();
      expect(requestMoneyButton).toBeTruthy();

      // Test button presses
      fireEvent.press(sendMoneyButton);
      fireEvent.press(payBillsButton);
      fireEvent.press(buyAirtimeButton);
      fireEvent.press(requestMoneyButton);
    });
  });

  it('handles loading states correctly', async () => {
    // Mock delayed responses
    mockWalletsAPI.getBalance.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ wallet: mockBalance }), 100))
    );

    const { getByTestId, queryByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    // Should show loading initially
    expect(queryByText('Loading...')).toBeTruthy();

    // Should show data after loading
    await waitFor(() => {
      expect(queryByText('Loading...')).toBeFalsy();
      expect(getByTestId('balance-card')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    mockWalletsAPI.getBalance.mockRejectedValueOnce(new Error('Network error'));
    mockTransfersAPI.getHistory.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Failed to load account data')).toBeTruthy();
    });
  });

  it('displays AI assistant section', async () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('AI Assistant')).toBeTruthy();
      expect(getByText('How can I help you today?')).toBeTruthy();
      expect(getByPlaceholderText('Ask me anything about your finances...')).toBeTruthy();
    });
  });

  it('handles refresh action', async () => {
    const { getByTestId } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      const refreshButton = getByTestId('refresh-button');
      fireEvent.press(refreshButton);

      // Should call APIs again
      expect(mockWalletsAPI.getBalance).toHaveBeenCalledTimes(2);
      expect(mockTransfersAPI.getHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('formats currency amounts correctly', async () => {
    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      // Check various currency formats
      expect(getByText('₦150,000.00')).toBeTruthy(); // Main balance
      expect(getByText('₦145,000.00')).toBeTruthy(); // Available balance
      expect(getByText('₦5,000.00')).toBeTruthy(); // Reserved balance
    });
  });

  it('handles view all transactions button', async () => {
    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      const viewAllButton = getByText('View All');
      fireEvent.press(viewAllButton);
      
      // This would trigger navigation in a real app
      expect(viewAllButton).toBeTruthy();
    });
  });

  it('displays transaction status indicators correctly', async () => {
    const pendingTransaction = {
      ...mockTransactions[0],
      status: 'pending',
    };

    mockTransfersAPI.getHistory.mockResolvedValueOnce({
      transactions: [pendingTransaction],
      totalCount: 1,
      currentPage: 1,
      totalPages: 1,
    });

    const { getByText } = renderWithProvider(
      <DashboardScreen user={mockUser} onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Pending')).toBeTruthy();
    });
  });
});