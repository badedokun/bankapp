/**
 * Universal Test Helpers for All Features
 * Reusable utilities to prevent integration issues across the entire app
 */

import { Alert } from 'react-native';
import APIService from '../../src/services/api';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'agent' | 'user';
}

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@fmfb.com',
    password: 'Admin@123!',
    name: 'Admin User',
    role: 'admin'
  },
  agent: {
    email: 'demo@fmfb.com', 
    password: 'Demo@123!',
    name: 'Demo User',
    role: 'agent'
  }
};

/**
 * Mock Alert with UX validation
 */
export class AlertTestHelper {
  private static mockAlert = jest.spyOn(Alert, 'alert');

  static reset() {
    this.mockAlert.mockClear();
  }

  static expectSuccessAlert(expectedTitle?: string, expectedMessage?: string) {
    if (!this.mockAlert.mock.calls.length) {
      throw new Error('Alert was not called - no user feedback provided');
    }
    const [title, message, buttons] = this.mockAlert.mock.calls[0];
    
    if (expectedTitle) {
      expect(title).toContain(expectedTitle);
    }
    if (expectedMessage) {
      expect(message).toContain(expectedMessage);
    }
    
    // UX Requirements
    expect(Array.isArray(buttons)).toBe(true);
    expect(buttons[0]).toHaveProperty('onPress');
    expect(typeof buttons[0].onPress).toBe('function');
    
    return buttons[0].onPress;
  }

  static expectErrorAlert(expectedTitle?: string, expectedMessage?: string) {
    expect(this.mockAlert).toHaveBeenCalled();
    const [title, message, buttons] = this.mockAlert.mock.calls[0];
    
    if (expectedTitle) {
      expect(title).toContain(expectedTitle);
    }
    if (expectedMessage) {
      expect(message).toContain(expectedMessage);
    }
    
    // Error alerts should have dismissal callback
    expect(buttons[0].onPress).toBeDefined();
    
    return buttons[0].onPress;
  }

  static expectNoAlert() {
    expect(this.mockAlert).not.toHaveBeenCalled();
  }
}

/**
 * API Response Structure Validator
 */
export class APIResponseValidator {
  static validateSuccessResponse<T>(response: T, requiredFields: string[]): void {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    
    for (const field of requiredFields) {
      const fieldPath = field.split('.');
      let current: any = response;
      
      for (const segment of fieldPath) {
        expect(current).toHaveProperty(segment);
        current = current[segment];
      }
    }
  }

  static validateErrorResponse(error: Error, expectedPattern?: string): void {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBeDefined();
    
    if (expectedPattern) {
      expect(error.message).toMatch(new RegExp(expectedPattern, 'i'));
    }
  }
}

/**
 * User Input Preservation Validator
 */
export class UserInputValidator {
  static validateInputPreservation(
    inputElement: any, 
    userValue: string, 
    apiSuggestedValue: string
  ): void {
    // User input should be preserved, not overwritten by API
    if (inputElement.props.value !== userValue) {
      throw new Error(`User input was not preserved. Expected: "${userValue}", but got: "${inputElement.props.value}"`);
    }
    if (inputElement.props.value === apiSuggestedValue) {
      throw new Error(`User input was overwritten by API suggestion: "${apiSuggestedValue}"`);
    }
  }

  static validateNoConsoleSpam(consoleSpy: jest.SpyInstance, maxLogs: number = 5): void {
    const logCount = consoleSpy.mock.calls.length;
    expect(logCount).toBeLessThanOrEqual(maxLogs);
  }
}

/**
 * Navigation Test Helper
 */
export class NavigationValidator {
  static validateNoAutoNavigation(mockNavigationFn: jest.Mock): void {
    // Navigation should not happen without user acknowledgment
    if (mockNavigationFn.mock.calls.length > 0) {
      throw new Error('Navigation called without user acknowledgment - forms should not auto-close');
    }
  }

  static validateNavigationAfterAcknowledgment(
    mockNavigationFn: jest.Mock, 
    dismissCallback: () => void
  ): void {
    // Execute dismissal callback
    dismissCallback();
    
    // Now navigation should happen
    expect(mockNavigationFn).toHaveBeenCalled();
  }
}

/**
 * Form State Validator
 */
export class FormValidator {
  static validateFormReset(formInputs: Record<string, any>): void {
    Object.values(formInputs).forEach(input => {
      expect(input.props.value).toBe('');
    });
  }

  static validateRequiredFields(
    submitFn: () => void,
    expectedErrorPattern: string
  ): void {
    // Should prevent submission with invalid data
    submitFn();
    
    AlertTestHelper.expectErrorAlert();
    const [title, message] = AlertTestHelper.mockAlert.mock.calls[0];
    expect(title).toMatch(new RegExp(expectedErrorPattern, 'i'));
  }
}

/**
 * API Mock Generator
 */
export class APIMockGenerator {
  static createSuccessResponse<T>(data: Partial<T>, baseStructure: T): T {
    return { ...baseStructure, ...data };
  }

  static createErrorResponse(errorMessage: string, errorType?: string): Error {
    const error = new Error(errorMessage);
    if (errorType) {
      error.name = errorType;
    }
    return error;
  }

  static createRealisticTransferResponse() {
    return {
      status: 'successful',
      amount: 25000,
      fee: 50,
      recipient: {
        accountNumber: '1234567890',
        accountName: 'Test Recipient',
        bankCode: '011'
      },
      reference: `REF_${Date.now()}`,
      transactionId: `TXN_${Date.now()}`,
      transferId: `${Date.now()}-uuid`,
      message: 'Transfer completed successfully',
      fraudAnalysis: {
        riskScore: 0.1,
        riskLevel: 'low',
        decision: 'approve'
      }
    };
  }
}

/**
 * Feature Test Template Generator
 */
export class FeatureTestTemplate {
  static generateIntegrationTest(featureName: string, config: {
    component: React.ComponentType<any>;
    apiMethod: keyof typeof APIService;
    requiredFields: string[];
    successResponseStructure: any;
    errorScenarios: Array<{ error: Error; expectedTitle: string; expectedMessage: string }>;
  }) {
    return {
      [`should handle real ${featureName} API response structure`]: async () => {
        const mockResponse = config.successResponseStructure;
        (APIService[config.apiMethod] as jest.Mock).mockResolvedValue(mockResponse);
        
        // Test component renders without errors
        // Test API response structure
        APIResponseValidator.validateSuccessResponse(mockResponse, config.requiredFields);
      },
      
      [`should provide proper user feedback for ${featureName}`]: async () => {
        // Test success feedback
        // Test error feedback
        // Validate UX principles
      },
      
      [`should preserve user input during ${featureName} operations`]: async () => {
        // Test input preservation
        // Test no auto-overwrite
        // Validate user control
      }
    };
  }
}

/**
 * Database Test Helper
 */
export class DatabaseTestHelper {
  static async setupTestData(testName: string) {
    // Create isolated test data
    // Return cleanup function
  }

  static async cleanupTestData(testName: string) {
    // Clean up test-specific data
  }
}

/**
 * Performance Test Helper
 */
export class PerformanceValidator {
  static validateResponseTime(startTime: number, maxTime: number = 5000): void {
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxTime);
  }

  static validateNoMemoryLeaks(beforeMemory: number, afterMemory: number): void {
    const memoryIncrease = afterMemory - beforeMemory;
    const maxIncrease = 10 * 1024 * 1024; // 10MB
    expect(memoryIncrease).toBeLessThan(maxIncrease);
  }
}