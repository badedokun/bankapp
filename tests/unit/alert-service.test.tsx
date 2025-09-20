/**
 * Alert Service Unit Tests
 * Tests the professional React Native Paper alert implementation
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { BankingAlertProvider, useBankingAlert } from '../../src/services/AlertService';

// Test component to use the alert service
const TestAlertComponent: React.FC = () => {
  const { showAlert, showConfirm } = useBankingAlert();

  return (
    <>
      <button 
        testID="simple-alert-button"
        onClick={() => showAlert('Test Title', 'Test message')}
      >
        Show Simple Alert
      </button>
      
      <button 
        testID="custom-alert-button"
        onClick={() => showAlert(
          'Custom Alert', 
          'Custom message with buttons',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', style: 'destructive' }
          ]
        )}
      >
        Show Custom Alert
      </button>
      
      <button 
        testID="confirm-button"
        onClick={() => showConfirm(
          'Confirm Action',
          'Are you sure you want to proceed?',
          () => console.log('Confirmed'),
          () => console.log('Cancelled')
        )}
      >
        Show Confirm
      </button>
    </>
  );
};

const TestApp: React.FC = () => (
  <BankingAlertProvider>
    <TestAlertComponent />
  </BankingAlertProvider>
);

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Simple Alert', () => {
    test('should display simple alert with title and message', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('simple-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeTruthy();
        expect(screen.getByText('Test message')).toBeTruthy();
        expect(screen.getByText('OK')).toBeTruthy();
      });
    });

    test('should close alert when OK button is pressed', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('simple-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeTruthy();
      });
      
      const okButton = screen.getByText('OK');
      fireEvent.press(okButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Test Title')).toBeNull();
      });
    });
  });

  describe('Custom Alert', () => {
    test('should display custom alert with multiple buttons', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('custom-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Custom Alert')).toBeTruthy();
        expect(screen.getByText('Custom message with buttons')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Confirm')).toBeTruthy();
      });
    });

    test('should close alert when any button is pressed', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('custom-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Custom Alert')).toBeTruthy();
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Custom Alert')).toBeNull();
      });
    });
  });

  describe('Confirm Alert', () => {
    test('should display confirm alert with Cancel and Confirm buttons', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('confirm-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Action')).toBeTruthy();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Confirm')).toBeTruthy();
      });
    });

    test('should execute onConfirm callback when Confirm is pressed', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<TestApp />);
      
      const button = screen.getByTestId('confirm-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Action')).toBeTruthy();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.press(confirmButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Confirmed');
        expect(screen.queryByText('Confirm Action')).toBeNull();
      });
      
      consoleSpy.mockRestore();
    });

    test('should execute onCancel callback when Cancel is pressed', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<TestApp />);
      
      const button = screen.getByTestId('confirm-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Action')).toBeTruthy();
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Cancelled');
        expect(screen.queryByText('Confirm Action')).toBeNull();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Button Styles', () => {
    test('should apply correct styles for destructive buttons', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('custom-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm');
        // Check that destructive buttons have outlined mode
        expect(confirmButton.props.mode).toBe('outlined');
      });
    });

    test('should apply correct styles for normal buttons', async () => {
      render(<TestApp />);
      
      const button = screen.getByTestId('custom-alert-button');
      fireEvent.press(button);
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        // Check that normal buttons have contained mode
        expect(cancelButton.props.mode).toBe('contained');
      });
    });
  });

  describe('Alert State Management', () => {
    test('should show only one alert at a time', async () => {
      render(<TestApp />);
      
      // Show first alert
      const simpleButton = screen.getByTestId('simple-alert-button');
      fireEvent.press(simpleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeTruthy();
      });
      
      // Try to show second alert
      const customButton = screen.getByTestId('custom-alert-button');
      fireEvent.press(customButton);
      
      await waitFor(() => {
        // Should show the second alert (latest one)
        expect(screen.getByText('Custom Alert')).toBeTruthy();
        expect(screen.queryByText('Test Title')).toBeNull();
      });
    });
  });
});

describe('AlertService Error Cases', () => {
  test('should handle undefined button callbacks gracefully', async () => {
    const TestComponent: React.FC = () => {
      const { showAlert } = useBankingAlert();
      return (
        <button 
          testID="undefined-callback-button"
          onClick={() => showAlert('Test', 'Message', [{ text: 'OK' }])}
        >
          Show Alert
        </button>
      );
    };

    render(
      <BankingAlertProvider>
        <TestComponent />
      </BankingAlertProvider>
    );
    
    const button = screen.getByTestId('undefined-callback-button');
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeTruthy();
    });
    
    const okButton = screen.getByText('OK');
    // Should not throw error when pressing button with undefined callback
    expect(() => fireEvent.press(okButton)).not.toThrow();
  });

  test('should throw error when used outside BankingAlertProvider', () => {
    const TestComponent: React.FC = () => {
      const { showAlert } = useBankingAlert();
      return <div>Test</div>;
    };

    // Should throw error when hook is used outside provider
    expect(() => render(<TestComponent />)).toThrow(
      'useBankingAlert must be used within BankingAlertProvider'
    );
  });
});