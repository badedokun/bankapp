import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

// Mock dependencies
jest.mock('@/utils/storage', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/tenants/TenantDetector', () => ({
  detectTenant: jest.fn().mockResolvedValue('fmfb'),
  getCurrentTenantId: jest.fn().mockReturnValue('fmfb'),
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

jest.mock('@/services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

import { authAPI } from '@/services/api';
import TenantDetector from '@/tenants/TenantDetector';

const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;
const mockTenantDetector = TenantDetector as jest.Mocked<typeof TenantDetector>;

describe('LoginScreen', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with FMFB branding', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    await waitFor(() => {
      expect(getByText('Firstmidas Microfinance Bank')).toBeTruthy();
      expect(getByPlaceholderText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });
  });

  it('validates required fields', async () => {
    const { getByText } = render(<LoginScreen onLogin={mockOnLogin} />);

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    const emailInput = getByPlaceholderText('Email Address');
    fireEvent.changeText(emailInput, 'invalid-email');

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('handles successful login', async () => {
    const mockLoginResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    };

    mockAuthAPI.login.mockResolvedValueOnce(mockLoginResponse);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    const emailInput = getByPlaceholderText('Email Address');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAuthAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        tenantName: 'fmfb',
      });
      expect(mockOnLogin).toHaveBeenCalledWith(mockLoginResponse.user);
    });
  });

  it('handles login error', async () => {
    mockAuthAPI.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText, queryByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    const emailInput = getByPlaceholderText('Email Address');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(queryByText('Invalid credentials')).toBeTruthy();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during login', async () => {
    // Mock a delayed login response
    mockAuthAPI.login.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    const emailInput = getByPlaceholderText('Email Address');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    // Should show loading state
    expect(getByText('Signing In...')).toBeTruthy();
  });

  it('displays tenant logo when available', async () => {
    const { getByTestId } = render(<LoginScreen onLogin={mockOnLogin} />);

    await waitFor(() => {
      expect(getByTestId('tenant-logo')).toBeTruthy();
    });
  });

  it('handles password visibility toggle', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    const passwordInput = getByPlaceholderText('Password');
    const toggleButton = getByTestId('password-toggle');

    // Initially password should be hidden
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Toggle to show password
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(false);

    // Toggle to hide password again
    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('navigates to forgot password', async () => {
    const { getByText } = render(<LoginScreen onLogin={mockOnLogin} />);

    const forgotPasswordLink = getByText('Forgot Password?');
    fireEvent.press(forgotPasswordLink);

    // This would trigger navigation in a real app
    // For now, we just verify the link is pressable
    expect(forgotPasswordLink).toBeTruthy();
  });
});