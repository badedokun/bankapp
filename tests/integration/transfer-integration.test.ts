/**
 * Frontend Integration Tests with Real API Responses
 * Tests frontend components with actual API response structures
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AITransferScreen from '../../src/screens/transfer/AITransferScreen';
import APIService from '../../src/services/api';

// Mock Alert to capture calls
const mockAlert = jest.spyOn(Alert, 'alert');

// Mock APIService but allow real response structures
jest.mock('../../src/services/api');
const mockAPIService = APIService as jest.Mocked<typeof APIService>;

describe('Transfer Integration Tests', () => {
  const mockProps = {
    onTransferComplete: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
  });

  test('should handle real API response structure for successful transfer', async () => {
    // Mock real API response structure (based on actual logs)
    const mockTransferResponse = {
      amount: 40000,
      fee: 50,
      fraudAnalysis: {
        riskScore: 0.11,
        riskLevel: 'low',
        decision: 'approve',
        processingTime: 0,
        sessionId: 'fraud_1757557115129_j3zxxfq4o'
      },
      message: "Transfer completed successfully",
      recipient: {
        accountNumber: '0987654321',
        accountName: 'Jane Smith',
        bankCode: '044'
      },
      reference: "ORP_1757557115200_D9NA4P",
      status: "successful",
      transactionId: "TXN_1757557115205_ynhbbd5cu",
      transferId: "69670489-d184-496a-abe9-0af0f031f84b"
    };

    const mockValidationResponse = {
      isValid: true,
      accountName: 'Test User',
      bankName: 'Access Bank'
    };

    mockAPIService.validateRecipient.mockResolvedValue(mockValidationResponse);
    mockAPIService.initiateTransfer.mockResolvedValue(mockTransferResponse);

    const { getByPlaceholderText, getByText } = render(
      <AITransferScreen {...mockProps} />
    );

    // Fill form with user input
    const recipientInput = getByPlaceholderText(/recipient name/i);
    const amountInput = getByPlaceholderText(/amount/i);
    const accountInput = getByPlaceholderText(/account number/i);
    const bankCodeInput = getByPlaceholderText(/bank code/i);
    const pinInput = getByPlaceholderText(/PIN/i);

    // User enters their own recipient name
    fireEvent.changeText(recipientInput, 'Custom Recipient');
    fireEvent.changeText(accountInput, '0987654321');
    fireEvent.changeText(bankCodeInput, '044');
    fireEvent.changeText(amountInput, '40000');
    fireEvent.changeText(pinInput, '2348');

    // Submit transfer
    const submitButton = getByText(/send money/i);
    fireEvent.press(submitButton);

    // Verify API was called
    await waitFor(() => {
      expect(mockAPIService.initiateTransfer).toHaveBeenCalledWith({
        recipientAccountNumber: '0987654321',
        recipientBankCode: '044',
        recipientName: 'Custom Recipient', // Should use user input, not API response
        amount: 40000,
        description: '',
        pin: '2348'
      });
    });

    // Verify success alert with real response structure
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Transfer Successful! 🎉',
        expect.stringContaining('₦40,000'),
        expect.arrayContaining([
          expect.objectContaining({
            text: 'OK',
            onPress: expect.any(Function)
          })
        ])
      );
    });

    // Verify onBack is NOT called immediately (only after alert dismissal)
    expect(mockProps.onBack).not.toHaveBeenCalled();

    // Simulate user dismissing alert
    const alertCallback = mockAlert.mock.calls[0][2][0].onPress;
    act(() => {
      alertCallback();
    });

    // Now onBack should be called
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  test('should handle insufficient balance error properly', async () => {
    const mockError = new Error('Insufficient balance');
    mockAPIService.initiateTransfer.mockRejectedValue(mockError);

    const { getByPlaceholderText, getByText } = render(
      <AITransferScreen {...mockProps} />
    );

    // Fill form
    fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'Test User');
    fireEvent.changeText(getByPlaceholderText(/account number/i), '1234567890');
    fireEvent.changeText(getByPlaceholderText(/bank code/i), '011');
    fireEvent.changeText(getByPlaceholderText(/amount/i), '999999');
    fireEvent.changeText(getByPlaceholderText(/PIN/i), '2348');

    // Submit transfer
    fireEvent.press(getByText(/send money/i));

    // Verify error alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Insufficient Funds',
        'You do not have enough balance to complete this transfer.',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'OK',
            onPress: expect.any(Function)
          })
        ])
      );
    });

    // Verify onBack called after error acknowledgment
    const alertCallback = mockAlert.mock.calls[0][2][0].onPress;
    act(() => {
      alertCallback();
    });
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  test('should not auto-fill recipient when user has entered name', async () => {
    const mockValidationResponse = {
      isValid: true,
      accountName: 'Jane Smith', // API returns this
      bankName: 'Access Bank'
    };

    mockAPIService.validateRecipient.mockResolvedValue(mockValidationResponse);

    const { getByPlaceholderText } = render(
      <AITransferScreen {...mockProps} />
    );

    const recipientInput = getByPlaceholderText(/recipient name/i);
    const accountInput = getByPlaceholderText(/account number/i);
    const bankCodeInput = getByPlaceholderText(/bank code/i);

    // User enters recipient name first
    fireEvent.changeText(recipientInput, 'My Custom Name');

    // Then enters account details that would trigger validation
    fireEvent.changeText(accountInput, '0987654321');
    fireEvent.changeText(bankCodeInput, '044');

    // Wait for validation
    await waitFor(() => {
      expect(mockAPIService.validateRecipient).toHaveBeenCalled();
    });

    // Verify recipient name is NOT overwritten
    expect(recipientInput.props.value).toBe('My Custom Name');
  });

  test('should show validation message with user name when manually entered', async () => {
    const mockValidationResponse = {
      isValid: true,
      accountName: 'Jane Smith',
      bankName: 'Access Bank'
    };

    mockAPIService.validateRecipient.mockResolvedValue(mockValidationResponse);

    const { getByPlaceholderText, getByText } = render(
      <AITransferScreen {...mockProps} />
    );

    // User enters recipient name
    fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'Custom Name');
    
    // Trigger validation
    fireEvent.changeText(getByPlaceholderText(/account number/i), '0987654321');
    fireEvent.changeText(getByPlaceholderText(/bank code/i), '044');

    // Wait for validation
    await waitFor(() => {
      expect(mockAPIService.validateRecipient).toHaveBeenCalled();
    });

    // Verify validation display shows user name, not API response
    await waitFor(() => {
      const validationText = getByText(/✅ Custom Name - Access Bank/);
      expect(validationText).toBeTruthy();
    });
  });
});