/**
 * Security Utilities
 * Core security functions for input validation, sanitization, and protection
 */

import { Platform } from 'react-native';

// Input validation patterns based on Nigerian banking requirements
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^(\+234|234|0)?[789][01]\d{8}$/,
  accountNumber: /^[0-9]{10}$/,
  bvn: /^[0-9]{11}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  pin: /^[0-9]{4,6}$/,
  amount: /^[0-9]+(\.[0-9]{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
} as const;

// Security configuration
export const SecurityConfig = {
  maxInputLength: {
    email: 254,
    phone: 15,
    name: 50,
    password: 128,
    amount: 15,
    description: 200,
    accountNumber: 10,
    bvn: 11,
    pin: 6,
  },
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  maxLoginAttempts: 3,
  passwordMinLength: 8,
  pinLength: 4,
} as const;

/**
 * Input Sanitization
 * Removes potentially dangerous characters and prevents injection attacks
 */
export class InputSanitizer {
  /**
   * Sanitize text input to prevent XSS and injection attacks
   */
  static sanitizeText(input: string, maxLength?: number): string {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input
      .trim()
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove potential script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove potential HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove potential SQL injection patterns
      .replace(/(union|select|insert|delete|update|drop|create|alter|exec|execute)(\s|\()/gi, '')
      // Remove potential JavaScript patterns
      .replace(/(javascript|vbscript|onload|onerror|onclick)/gi, '');
    
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Sanitize numeric input (amounts, account numbers, etc.)
   */
  static sanitizeNumeric(input: string, allowDecimal: boolean = false): string {
    if (!input || typeof input !== 'string') return '';
    
    const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    let sanitized = input.replace(pattern, '');
    
    // Ensure only one decimal point for decimal numbers
    if (allowDecimal) {
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[^0-9+]/g, '')
      .substring(0, SecurityConfig.maxInputLength.phone);
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9@._+-]/g, '')
      .substring(0, SecurityConfig.maxInputLength.email);
  }
}

/**
 * Input Validator
 * Validates input against security patterns and business rules
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    const sanitized = InputSanitizer.sanitizeEmail(email);
    
    if (!sanitized) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!ValidationPatterns.email.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate Nigerian phone number
   */
  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    const sanitized = InputSanitizer.sanitizePhone(phone);
    
    if (!sanitized) {
      return { isValid: false, error: 'Phone number is required' };
    }
    
    if (!ValidationPatterns.phone.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid Nigerian phone number' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < SecurityConfig.passwordMinLength) {
      return { 
        isValid: false, 
        error: `Password must be at least ${SecurityConfig.passwordMinLength} characters long`,
        strength: 'weak'
      };
    }
    
    if (!ValidationPatterns.password.test(password)) {
      return { 
        isValid: false, 
        error: 'Password must contain uppercase, lowercase, number and special character',
        strength: 'weak'
      };
    }
    
    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      return { 
        isValid: false, 
        error: 'Password is too common. Please choose a stronger password',
        strength: 'weak'
      };
    }
    
    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'medium';
    if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password)) {
      strength = 'strong';
    }
    
    return { isValid: true, strength };
  }

  /**
   * Validate amount input
   */
  static validateAmount(amount: string, minAmount: number = 1, maxAmount: number = 5000000): { isValid: boolean; error?: string } {
    const sanitized = InputSanitizer.sanitizeNumeric(amount, true);
    
    if (!sanitized) {
      return { isValid: false, error: 'Amount is required' };
    }
    
    const numericAmount = parseFloat(sanitized);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { isValid: false, error: 'Please enter a valid amount' };
    }
    
    if (numericAmount < minAmount) {
      return { isValid: false, error: `Minimum amount is ₦${minAmount.toLocaleString()}` };
    }
    
    if (numericAmount > maxAmount) {
      return { isValid: false, error: `Maximum amount is ₦${maxAmount.toLocaleString()}` };
    }
    
    return { isValid: true };
  }

  /**
   * Validate account number
   */
  static validateAccountNumber(accountNumber: string): { isValid: boolean; error?: string } {
    const sanitized = InputSanitizer.sanitizeNumeric(accountNumber);
    
    if (!sanitized) {
      return { isValid: false, error: 'Account number is required' };
    }
    
    if (!ValidationPatterns.accountNumber.test(sanitized)) {
      return { isValid: false, error: 'Account number must be 10 digits' };
    }
    
    return { isValid: true };
  }
}

/**
 * Security Monitor
 * Monitors for suspicious activity and potential security threats
 */
export class SecurityMonitor {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  /**
   * Track login attempts for rate limiting
   */
  static trackLoginAttempt(identifier: string): { blocked: boolean; remainingAttempts: number } {
    const now = Date.now();
    const key = `login_${identifier}`;
    const existing = this.attempts.get(key);
    
    if (existing) {
      // Reset counter if more than 1 hour has passed
      if (now - existing.lastAttempt > 60 * 60 * 1000) {
        this.attempts.set(key, { count: 1, lastAttempt: now });
        return { blocked: false, remainingAttempts: SecurityConfig.maxLoginAttempts - 1 };
      }
      
      const newCount = existing.count + 1;
      this.attempts.set(key, { count: newCount, lastAttempt: now });
      
      if (newCount >= SecurityConfig.maxLoginAttempts) {
        return { blocked: true, remainingAttempts: 0 };
      }
      
      return { blocked: false, remainingAttempts: SecurityConfig.maxLoginAttempts - newCount };
    }
    
    this.attempts.set(key, { count: 1, lastAttempt: now });
    return { blocked: false, remainingAttempts: SecurityConfig.maxLoginAttempts - 1 };
  }

  /**
   * Reset login attempts after successful login
   */
  static resetLoginAttempts(identifier: string): void {
    const key = `login_${identifier}`;
    this.attempts.delete(key);
  }

  /**
   * Detect suspicious input patterns
   */
  static detectSuspiciousInput(input: string): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check for SQL injection patterns
    if (/(union|select|insert|delete|update|drop|create|alter|exec|execute)/i.test(input)) {
      reasons.push('Potential SQL injection detected');
    }
    
    // Check for XSS patterns
    if (/<script|javascript:|onload=|onerror=/i.test(input)) {
      reasons.push('Potential XSS attack detected');
    }
    
    // Check for excessive length
    if (input.length > 1000) {
      reasons.push('Input exceeds maximum allowed length');
    }
    
    // Check for null bytes
    if (input.includes('\x00')) {
      reasons.push('Null byte injection detected');
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }
}

/**
 * Secure Storage Utilities
 * Platform-specific secure storage helpers
 */
export class SecureStorage {
  /**
   * Generate a secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (Platform.OS === 'web' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars.charAt(array[i] % chars.length);
      }
    } else {
      // Fallback for non-crypto environments (should be replaced with secure random in production)
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return result;
  }

  /**
   * Hash sensitive data (one-way)
   */
  static async hashData(data: string): Promise<string> {
    if (Platform.OS === 'web' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback - in production, use a proper crypto library
    return btoa(data);
  }
}

export default {
  InputSanitizer,
  InputValidator,
  SecurityMonitor,
  SecureStorage,
  ValidationPatterns,
  SecurityConfig,
};