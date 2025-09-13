/**
 * User Experience Validation Tests
 * Tests UX principles and user feedback requirements
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AITransferScreen from '../../src/screens/transfer/AITransferScreen';
import APIService from '../../src/services/api';

// Mock the new Banking Alert Service
const mockShowAlert = jest.fn();
const mockShowConfirm = jest.fn();
jest.mock('../../src/services/AlertService', () => ({
  useBankingAlert: () => ({
    showAlert: mockShowAlert,
    showConfirm: mockShowConfirm,
  }),
  BankingAlertProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock TenantContext
jest.mock('../../src/tenants/TenantContext', () => ({
  useTenant: () => ({
    currentTenant: { name: 'test', displayName: 'Test Bank' },
    isLoading: false,
    error: null,
  }),
  useTenantTheme: () => ({
    colors: {
      primary: '#1e3a8a',
      background: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      error: '#dc2626',
      success: '#16a34a',
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    typography: {
      sizes: { sm: 12, md: 14, lg: 16, xl: 18 },
      weights: { normal: '400', medium: '500', bold: '700' },
    },
    borderRadius: { sm: 4, md: 8, lg: 12 },
  }),
  TenantProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Alert to capture and validate UX patterns (for backward compatibility tests)
const mockAlert = jest.spyOn(Alert, 'alert');
jest.mock('../../src/services/api');
const mockAPIService = APIService as jest.Mocked<typeof APIService>;

describe('Transfer UX Validation', () => {
  const mockProps = {
    onTransferComplete: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    mockShowAlert.mockClear();
    mockShowConfirm.mockClear();
  });

  describe('UX Principle: User Control and Freedom', () => {
    test('should preserve user input and not override without permission', async () => {
      const mockValidationResponse = {
        isValid: true,
        accountName: 'API Suggested Name',
        bankName: 'Test Bank'
      };
      mockAPIService.validateRecipient.mockResolvedValue(mockValidationResponse);

      const { getByPlaceholderText } = render(<AITransferScreen {...mockProps} />);

      const recipientInput = getByPlaceholderText(/recipient name/i);
      
      // User types their intended recipient
      fireEvent.changeText(recipientInput, 'My Intended Recipient');
      
      // System triggers validation (simulating account/bank code entry)
      fireEvent.changeText(getByPlaceholderText(/account number/i), '1234567890');
      fireEvent.changeText(getByPlaceholderText(/bank code/i), '011');

      await waitFor(() => {
        expect(mockAPIService.validateRecipient).toHaveBeenCalled();
      });

      // UX REQUIREMENT: User input must be preserved
      expect(recipientInput.props.value).toBe('My Intended Recipient');
    });

    test('should not close form without user acknowledgment', async () => {
      const mockTransferResponse = {
        status: 'successful',
        amount: 25000,
        recipient: { accountName: 'Test User' },
        reference: 'REF123',
        message: 'Transfer completed successfully'
      };
      
      mockAPIService.initiateTransfer.mockResolvedValue(mockTransferResponse);

      const { getByPlaceholderText, getByText } = render(<AITransferScreen {...mockProps} />);

      // Fill and submit form
      fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'Test User');
      fireEvent.changeText(getByPlaceholderText(/amount/i), '25000');
      fireEvent.changeText(getByPlaceholderText(/PIN/i), '2348');
      fireEvent.press(getByText(/send money/i));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // UX REQUIREMENT: Form should not auto-close without user action
      expect(mockProps.onBack).not.toHaveBeenCalled();

      // User acknowledges success
      const [title, message, buttons] = mockShowAlert.mock.calls[0];
      const alertCallback = buttons[0].onPress;
      act(() => alertCallback());

      // NOW form can close
      expect(mockProps.onBack).toHaveBeenCalled();
    });
  });

  describe('UX Principle: Visibility of System Status', () => {
    test('should provide clear feedback for successful transfers', async () => {
      const mockTransferResponse = {
        status: 'successful',
        amount: 50000,
        recipient: { accountName: 'John Doe' },
        reference: 'REF456',
        message: 'Transfer completed successfully'
      };
      
      mockAPIService.initiateTransfer.mockResolvedValue(mockTransferResponse);

      const { getByPlaceholderText, getByText } = render(<AITransferScreen {...mockProps} />);

      // Submit transfer
      fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'John Doe');
      fireEvent.changeText(getByPlaceholderText(/amount/i), '50000');
      fireEvent.changeText(getByPlaceholderText(/PIN/i), '2348');
      fireEvent.press(getByText(/send money/i));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Transfer Successful! 🎉',
          expect.stringContaining('₦50,000'),
          expect.any(Array)
        );
      });

      const [title, alertMessage, buttons] = mockShowAlert.mock.calls[0];
      
      // UX REQUIREMENTS: Success feedback must include key details
      expect(alertMessage).toContain('₦50,000');
      expect(alertMessage).toContain('John Doe');
      expect(alertMessage).toContain('REF456');
      expect(alertMessage).toContain('successful');
    });

    test('should provide specific error messages for different failure scenarios', async () => {
      const errorScenarios = [
        {
          error: new Error('Insufficient balance'),
          expectedTitle: 'Insufficient Funds',
          expectedMessage: 'You do not have enough balance to complete this transfer.'
        },
        {
          error: new Error('Invalid transaction PIN'),
          expectedTitle: 'Invalid PIN',
          expectedMessage: 'The transaction PIN you entered is incorrect. Please try again.'
        },
        {
          error: new Error('Validation failed'),
          expectedTitle: 'Invalid Transfer Details',
          expectedMessage: 'Please check your transfer details and try again. Make sure the amount is within limits and all fields are filled correctly.'
        }
      ];

      for (const scenario of errorScenarios) {
        mockShowAlert.mockClear();
        mockAPIService.initiateTransfer.mockRejectedValue(scenario.error);

        const { getByPlaceholderText, getByText } = render(<AITransferScreen {...mockProps} />);

        // Submit transfer
        fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'Test User');
        fireEvent.changeText(getByPlaceholderText(/amount/i), '25000');
        fireEvent.changeText(getByPlaceholderText(/PIN/i), '2348');
        fireEvent.press(getByText(/send money/i));

        await waitFor(() => {
          expect(mockShowAlert).toHaveBeenCalledWith(
            scenario.expectedTitle,
            scenario.expectedMessage,
            expect.any(Array)
          );
        });
      }
    });
  });

  describe('UX Principle: Consistency and Standards', () => {
    test('should follow consistent alert patterns', async () => {
      const mockTransferResponse = {
        status: 'successful',
        amount: 25000,
        recipient: { accountName: 'Test User' },
        reference: 'REF123',
        message: 'Transfer completed successfully'
      };
      
      mockAPIService.initiateTransfer.mockResolvedValue(mockTransferResponse);

      const { getByPlaceholderText, getByText } = render(<AITransferScreen {...mockProps} />);

      // Submit transfer
      fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'Test User');
      fireEvent.changeText(getByPlaceholderText(/amount/i), '25000');
      fireEvent.changeText(getByPlaceholderText(/PIN/i), '2348');
      fireEvent.press(getByText(/send money/i));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      const [title, message, buttons] = mockShowAlert.mock.calls[0];

      // UX REQUIREMENTS: Consistent alert structure
      expect(title).toMatch(/Transfer (Successful|Failed)/);
      expect(typeof message).toBe('string');
      expect(Array.isArray(buttons)).toBe(true);
      expect(buttons[0]).toHaveProperty('text', 'OK');
      expect(buttons[0]).toHaveProperty('onPress');
      expect(typeof buttons[0].onPress).toBe('function');
    });
  });

  describe('UX Principle: Prevention of Errors', () => {
    test('should validate required fields before submission', async () => {
      const { getByText } = render(<AITransferScreen {...mockProps} />);

      // Try to submit empty form
      fireEvent.press(getByText(/send money/i));

      // Should show validation alerts
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      const [alertTitle] = mockShowAlert.mock.calls[0];
      expect(alertTitle).toMatch(/(Invalid|Required)/);
    });

    test('should prevent confusion by showing correct recipient in validation', async () => {
      const mockValidationResponse = {
        isValid: true,
        accountName: 'System Suggested Name',
        bankName: 'Test Bank'
      };
      mockAPIService.validateRecipient.mockResolvedValue(mockValidationResponse);

      const { getByPlaceholderText, queryByText } = render(<AITransferScreen {...mockProps} />);

      // User enters their own recipient
      fireEvent.changeText(getByPlaceholderText(/recipient name/i), 'User Chosen Name');
      
      // Trigger validation
      fireEvent.changeText(getByPlaceholderText(/account number/i), '1234567890');
      fireEvent.changeText(getByPlaceholderText(/bank code/i), '011');

      await waitFor(() => {
        expect(mockAPIService.validateRecipient).toHaveBeenCalled();
      });

      // UX REQUIREMENT: Validation should show user's choice, not system suggestion
      await waitFor(() => {
        const userNameValidation = queryByText(/✅ User Chosen Name - Test Bank/);
        const systemNameValidation = queryByText(/✅ System Suggested Name - Test Bank/);
        
        expect(userNameValidation).toBeTruthy();
        expect(systemNameValidation).toBeFalsy();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    test('should not spam console with excessive logging', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { getByPlaceholderText } = render(<AITransferScreen {...mockProps} />);

      const recipientInput = getByPlaceholderText(/recipient name/i);
      
      // Type a name character by character
      const testName = 'Test Name';
      for (const char of testName) {
        fireEvent.changeText(recipientInput, recipientInput.props.value + char);
      }

      // UX REQUIREMENT: Should not log every keystroke
      const keystrokeLogsCount = consoleSpy.mock.calls.filter(call => 
        call[0].includes('User typing recipient name')
      ).length;
      
      expect(keystrokeLogsCount).toBe(0); // Should be 0 after our fix

      consoleSpy.mockRestore();
    });
  });
});