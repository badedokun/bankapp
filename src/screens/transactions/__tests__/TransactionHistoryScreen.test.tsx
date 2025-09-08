import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TransactionHistoryScreen from '../TransactionHistoryScreen';

// Mock dependencies
jest.mock('@/services/api', () => ({
  transfersAPI: {
    getHistory: jest.fn(),
    getTransactionDetails: jest.fn(),
  },
  walletsAPI: {
    getStatement: jest.fn(),
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

import { transfersAPI, walletsAPI } from '@/services/api';

const mockTransfersAPI = transfersAPI as jest.Mocked<typeof transfersAPI>;
const mockWalletsAPI = walletsAPI as jest.Mocked<typeof walletsAPI>;

describe('TransactionHistoryScreen', () => {
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
      recipient_account_number: '1234567890',
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
    {
      id: 'txn-3',
      reference: 'TXN202501003',
      type: 'airtime_purchase',
      amount: 1000.00,
      status: 'pending',
      description: 'MTN Airtime Purchase',
      created_at: '2025-01-03T09:15:00Z',
      entry_type: 'debit',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockTransfersAPI.getHistory.mockResolvedValue({
      transactions: mockTransactions,
      totalCount: 3,
      currentPage: 1,
      totalPages: 1,
    });
  });

  it('renders correctly with transaction list', async () => {
    const { getByText, getByTestId } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      expect(getByText('Transaction History')).toBeTruthy();
      expect(getByText('Transfer to Jane Smith')).toBeTruthy();
      expect(getByText('Account credit')).toBeTruthy();
      expect(getByText('MTN Airtime Purchase')).toBeTruthy();
      expect(getByTestId('transaction-list')).toBeTruthy();
    });
  });

  it('displays transaction details correctly', async () => {
    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      // Check transaction references
      expect(getByText('TXN202501001')).toBeTruthy();
      expect(getByText('TXN202501002')).toBeTruthy();
      expect(getByText('TXN202501003')).toBeTruthy();

      // Check amounts with correct formatting
      expect(getByText('-₦5,000.00')).toBeTruthy();
      expect(getByText('+₦10,000.00')).toBeTruthy();
      expect(getByText('-₦1,000.00')).toBeTruthy();

      // Check status indicators
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });
  });

  it('handles transaction status filtering', async () => {
    const { getByText, queryByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      // Find filter button (All, Completed, Pending, Failed)
      const completedFilter = getByText('Completed');
      fireEvent.press(completedFilter);
    });

    // Mock API call with filtered results
    mockTransfersAPI.getHistory.mockResolvedValueOnce({
      transactions: mockTransactions.filter(t => t.status === 'completed'),
      totalCount: 2,
      currentPage: 1,
      totalPages: 1,
    });

    await waitFor(() => {
      expect(queryByText('MTN Airtime Purchase')).toBeFalsy();
      expect(getByText('Transfer to Jane Smith')).toBeTruthy();
    });
  });

  it('handles transaction type filtering', async () => {
    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      // Test filter by transaction type
      const transferFilter = getByText('Transfers');
      fireEvent.press(transferFilter);
    });

    // Mock API call with filtered results
    mockTransfersAPI.getHistory.mockResolvedValueOnce({
      transactions: mockTransactions.filter(t => t.type === 'money_transfer'),
      totalCount: 1,
      currentPage: 1,
      totalPages: 1,
    });

    await waitFor(() => {
      expect(mockTransfersAPI.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'money_transfer',
        })
      );
    });
  });

  it('handles date range filtering', async () => {
    const { getByPlaceholderText, getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      const startDateInput = getByPlaceholderText('Start Date');
      const endDateInput = getByPlaceholderText('End Date');
      
      fireEvent.changeText(startDateInput, '2025-01-01');
      fireEvent.changeText(endDateInput, '2025-01-31');
      
      const applyFilterButton = getByText('Apply Filter');
      fireEvent.press(applyFilterButton);
    });

    await waitFor(() => {
      expect(mockTransfersAPI.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
      );
    });
  });

  it('handles transaction search', async () => {
    const { getByPlaceholderText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      const searchInput = getByPlaceholderText('Search transactions...');
      fireEvent.changeText(searchInput, 'Jane Smith');
    });

    await waitFor(() => {
      expect(mockTransfersAPI.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Jane Smith',
        })
      );
    });
  });

  it('handles pagination correctly', async () => {
    // Mock response with multiple pages
    mockTransfersAPI.getHistory.mockResolvedValueOnce({
      transactions: mockTransactions,
      totalCount: 50,
      currentPage: 1,
      totalPages: 5,
    });

    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      const nextPageButton = getByText('Next');
      fireEvent.press(nextPageButton);
    });

    await waitFor(() => {
      expect(mockTransfersAPI.getHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('handles transaction details modal', async () => {
    mockTransfersAPI.getTransactionDetails.mockResolvedValue({
      transaction: {
        ...mockTransactions[0],
        sender_account_number: '0987654321',
        fees: 50.00,
        net_amount: 4950.00,
      }
    });

    const { getByText, getByTestId } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      const transactionItem = getByText('Transfer to Jane Smith');
      fireEvent.press(transactionItem);
    });

    await waitFor(() => {
      expect(getByTestId('transaction-details-modal')).toBeTruthy();
      expect(getByText('Transaction Details')).toBeTruthy();
      expect(getByText('TXN202501001')).toBeTruthy();
      expect(getByText('₦50.00')).toBeTruthy(); // Fees
    });
  });

  it('handles loading states', async () => {
    // Mock delayed response
    mockTransfersAPI.getHistory.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        transactions: mockTransactions,
        totalCount: 3,
        currentPage: 1,
        totalPages: 1,
      }), 100))
    );

    const { getByTestId, queryByTestId } = render(
      <TransactionHistoryScreen />
    );

    // Should show loading initially
    expect(getByTestId('loading-indicator')).toBeTruthy();

    // Should show content after loading
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeFalsy();
      expect(getByTestId('transaction-list')).toBeTruthy();
    });
  });

  it('handles API errors gracefully', async () => {
    mockTransfersAPI.getHistory.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      expect(getByText('Failed to load transactions')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('handles retry after error', async () => {
    // First call fails, second succeeds
    mockTransfersAPI.getHistory
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        transactions: mockTransactions,
        totalCount: 3,
        currentPage: 1,
        totalPages: 1,
      });

    const { getByText, queryByText } = render(
      <TransactionHistoryScreen />
    );

    // Wait for error state
    await waitFor(() => {
      expect(getByText('Failed to load transactions')).toBeTruthy();
    });

    // Press retry
    const retryButton = getByText('Retry');
    fireEvent.press(retryButton);

    // Should show transactions after retry
    await waitFor(() => {
      expect(queryByText('Failed to load transactions')).toBeFalsy();
      expect(getByText('Transfer to Jane Smith')).toBeTruthy();
    });
  });

  it('handles empty transaction list', async () => {
    mockTransfersAPI.getHistory.mockResolvedValueOnce({
      transactions: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
    });

    const { getByText, getByTestId } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      expect(getByText('No transactions found')).toBeTruthy();
      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  it('handles export functionality', async () => {
    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      const exportButton = getByText('Export');
      fireEvent.press(exportButton);
      
      // Should show export options
      expect(getByText('Export as PDF')).toBeTruthy();
      expect(getByText('Export as CSV')).toBeTruthy();
    });
  });

  it('formats dates correctly', async () => {
    const { getByText } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      // Check for formatted dates
      expect(getByText('Jan 1, 2025')).toBeTruthy();
      expect(getByText('Jan 2, 2025')).toBeTruthy();
      expect(getByText('Jan 3, 2025')).toBeTruthy();
    });
  });

  it('displays transaction icons correctly', async () => {
    const { getByTestId } = render(
      <TransactionHistoryScreen />
    );

    await waitFor(() => {
      expect(getByTestId('transfer-icon')).toBeTruthy();
      expect(getByTestId('credit-icon')).toBeTruthy();
      expect(getByTestId('airtime-icon')).toBeTruthy();
    });
  });
});