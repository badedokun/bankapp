/**
 * User Management Service
 * Handles user registration, KYC, and profile management
 */

import bcrypt from 'bcrypt';
import dbManager from '../config/multi-tenant-database';

export interface UserRegistrationData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  password: string;
  transactionPin: string;
  tenantId: string;
  referralCode?: string;
}

export interface KYCDocumentData {
  tenantId: string;
  userId: string;
  documentType: 'nin' | 'passport' | 'drivers_license' | 'voters_card';
  documentNumber: string;
  documentImage: string; // Base64 or file path
  selfieImage: string; // Base64 or file path
}

export interface KYCVerificationResult {
  success: boolean;
  kycLevel: number;
  message: string;
  verificationId?: string;
  matchScore?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  accountNumber: string;
  kycStatus: 'pending' | 'tier1' | 'tier2' | 'tier3' | 'rejected';
  kycLevel: number;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
  };
  tenant?: {
    id: string;
    displayName: string;
    bankCode: string;
    slug: string;
    branding: any;
  };
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  /**
   * Register a new user with initial KYC tier 1
   */
  async registerUser(userData: UserRegistrationData): Promise<{
    success: boolean;
    userId?: string;
    accountNumber?: string;
    message: string;
  }> {
    const tenantId = userData.tenantId;
    const tenantPool = await dbManager.getTenantPool(tenantId);
    const client = await tenantPool.connect();

    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(`
        SELECT id FROM tenant.users
        WHERE email = $1 OR phone_number = $2
      `, [userData.email, userData.phone]);

      if (existingUser.rowCount > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'User with this email or phone number already exists'
        };
      }

      // Hash password and PIN
      const passwordHash = await bcrypt.hash(userData.password, 12);
      const transactionPinHash = await bcrypt.hash(userData.transactionPin, 12);

      // Generate unique account number
      const accountNumber = await this.generateAccountNumber(tenantId, client);

      // Create user
      const userResult = await client.query(`
        INSERT INTO tenant.users (
          tenant_id, email, phone_number, first_name, last_name, date_of_birth,
          gender, password_hash, transaction_pin_hash, account_number,
          kyc_status, kyc_level, daily_limit, monthly_limit, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 1, 100000, 500000, 'active', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        tenantId, userData.email, userData.phone, userData.firstName,
        userData.lastName, userData.dateOfBirth, userData.gender, passwordHash,
        transactionPinHash, accountNumber
      ]);

      const userId = userResult.rows[0].id;

      // Create primary wallet
      await client.query(`
        INSERT INTO tenant.wallets (
          user_id, tenant_id, wallet_type, currency, balance, wallet_number, created_at
        ) VALUES ($1, $2, 'main', 'NGN', 0.00, $3, CURRENT_TIMESTAMP)
      `, [userId, tenantId, accountNumber]);

      // Handle referral if provided
      if (userData.referralCode) {
        await this.processReferral(tenantId, userId, userData.referralCode, client);
      }

      // Log registration event
      await client.query(`
        INSERT INTO tenant.user_activity_logs (user_id, activity_type, description, ip_address, created_at)
        VALUES ($1, 'REGISTRATION', 'User registered successfully', '127.0.0.1', CURRENT_TIMESTAMP)
      `, [userId]);

      await client.query('COMMIT');

      return {
        success: true,
        userId,
        accountNumber,
        message: 'Registration successful. Please complete KYC verification.'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('User registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Submit KYC documents for verification
   */
  async submitKYCDocuments(kycData: KYCDocumentData): Promise<KYCVerificationResult> {
    const tenantId = kycData.tenantId;
    const tenantPool = await dbManager.getTenantPool(tenantId);
    const client = await tenantPool.connect();

    try {
      await client.query('BEGIN');

      // Check if user exists and current KYC status
      const userResult = await client.query(`
        SELECT id, kyc_status, kyc_level FROM tenant.users WHERE id = $1
      `, [kycData.userId]);

      if (userResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          kycLevel: 0,
          message: 'User not found'
        };
      }

      const user = userResult.rows[0];

      // Save KYC documents
      const kycResult = await client.query(`
        INSERT INTO tenant.kyc_documents (
          user_id, document_type, document_number, document_image_url,
          selfie_image_url, status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        kycData.userId, kycData.documentType, kycData.documentNumber,
        kycData.documentImage, kycData.selfieImage
      ]);

      const kycDocumentId = kycResult.rows[0].id;

      // Perform KYC verification (stubbed for now)
      const verificationResult = await this.performKYCVerification(kycData);

      // Update KYC document status
      await client.query(`
        UPDATE tenant.kyc_documents
        SET status = $1, verification_response = $2, processed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        verificationResult.success ? 'approved' : 'rejected',
        JSON.stringify(verificationResult),
        kycDocumentId
      ]);

      // Update user KYC status if approved
      if (verificationResult.success) {
        const newKycLevel = Math.min(user.kyc_level + 1, 3);
        const kycStatus = this.getKycStatusFromLevel(newKycLevel);
        const { dailyLimit, monthlyLimit } = this.getLimitsForKycLevel(newKycLevel);

        await client.query(`
          UPDATE tenant.users
          SET kyc_status = $1, kyc_level = $2, daily_limit = $3, monthly_limit = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [kycStatus, newKycLevel, dailyLimit, monthlyLimit, kycData.userId]);

        // Log KYC approval
        await client.query(`
          INSERT INTO tenant.user_activity_logs (user_id, activity_type, description, created_at)
          VALUES ($1, 'KYC_APPROVED', $2, CURRENT_TIMESTAMP)
        `, [kycData.userId, `KYC upgraded to level ${newKycLevel}`]);

        verificationResult.kycLevel = newKycLevel;
      } else {
        // Log KYC rejection
        await client.query(`
          INSERT INTO tenant.user_activity_logs (user_id, activity_type, description, created_at)
          VALUES ($1, 'KYC_REJECTED', $2, CURRENT_TIMESTAMP)
        `, [kycData.userId, verificationResult.message]);
      }

      await client.query('COMMIT');
      return verificationResult;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('KYC submission error:', error);
      return {
        success: false,
        kycLevel: 0,
        message: 'KYC submission failed. Please try again.'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get user profile with complete information
   */
  async getUserProfile(tenantId: string, userId: string): Promise<UserProfile | null> {
    try {
      // Query user data with tenant information including bank_code
      const result = await dbManager.queryTenant(tenantId, `
        SELECT u.*, w.balance as wallet_balance,
               CASE
                 WHEN u.profile_address IS NOT NULL
                 THEN u.profile_address::json
                 ELSE NULL
               END as address,
               t.display_name as tenant_display_name,
               t.bank_code as tenant_bank_code,
               t.branding as tenant_branding,
               t.slug as tenant_slug
        FROM tenant.users u
        LEFT JOIN tenant.wallets w ON u.id = w.user_id AND w.wallet_type = 'main'
        JOIN platform.tenants t ON u.tenant_id = t.id
        WHERE u.id = $1
      `, [userId]);

      if (result.rowCount === 0) {
        return null;
      }

      const user = result.rows[0];

      return {
        id: user.id,
        email: user.email,
        phone: user.phone_number,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        accountNumber: user.account_number,
        kycStatus: user.kyc_status,
        kycLevel: user.kyc_level,
        profileImage: user.profile_image_url,
        address: user.address,
        limits: {
          dailyLimit: parseFloat(user.daily_limit || '100000'),
          monthlyLimit: parseFloat(user.monthly_limit || '500000')
        },
        tenant: {
          id: tenantId,
          displayName: user.tenant_display_name,
          bankCode: user.tenant_bank_code,
          slug: user.tenant_slug,
          branding: user.tenant_branding
        },
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(tenantId: string, userId: string, updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
    };
    profileImage?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updates.firstName) {
        updateFields.push(`first_name = $${paramCount}`);
        updateValues.push(updates.firstName);
        paramCount++;
      }

      if (updates.lastName) {
        updateFields.push(`last_name = $${paramCount}`);
        updateValues.push(updates.lastName);
        paramCount++;
      }

      if (updates.phone) {
        updateFields.push(`phone_number = $${paramCount}`);
        updateValues.push(updates.phone);
        paramCount++;
      }

      if (updates.address) {
        updateFields.push(`profile_address = $${paramCount}`);
        updateValues.push(JSON.stringify(updates.address));
        paramCount++;
      }

      if (updates.profileImage) {
        updateFields.push(`profile_image_url = $${paramCount}`);
        updateValues.push(updates.profileImage);
        paramCount++;
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          message: 'No fields to update'
        };
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(userId);

      const query_text = `
        UPDATE tenant.users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `;

      await dbManager.queryTenant(tenantId, query_text, updateValues);

      // Log profile update
      await dbManager.queryTenant(tenantId, `
        INSERT INTO tenant.user_activity_logs (user_id, activity_type, description, created_at)
        VALUES ($1, 'PROFILE_UPDATED', 'Profile information updated', CURRENT_TIMESTAMP)
      `, [userId]);

      return {
        success: true,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Profile update failed. Please try again.'
      };
    }
  }

  // Private helper methods

  private async generateAccountNumber(tenantId: string, client: any): Promise<string> {
    // Get tenant bank code for account number generation
    const tenantResult = await dbManager.queryPlatform(`
      SELECT bank_code FROM platform.tenants WHERE id = $1
    `, [tenantId]);

    if (tenantResult.rowCount === 0) {
      throw new Error('Tenant not found');
    }

    const bankCode = tenantResult.rows[0].bank_code;

    // Generate unique 10-digit account number with bank code prefix
    let accountNumber: string;
    let isUnique = false;

    while (!isUnique) {
      const randomSuffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      accountNumber = bankCode + randomSuffix;

      // Check if account number already exists
      const existingResult = await client.query(`
        SELECT id FROM tenant.users WHERE account_number = $1
      `, [accountNumber]);

      isUnique = existingResult.rowCount === 0;
    }

    return accountNumber!;
  }

  private async processReferral(tenantId: string, userId: string, referralCode: string, client: any): Promise<void> {
    // Find referrer by referral code
    const referrerResult = await client.query(`
      SELECT id FROM tenant.users WHERE referral_code = $1
    `, [referralCode]);

    if (referrerResult.rowCount > 0) {
      const referrerId = referrerResult.rows[0].id;

      // Create referral record
      await client.query(`
        INSERT INTO tenant.referrals (referrer_id, referee_id, referral_code, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [referrerId, userId, referralCode]);

      // Award referral bonus (₦100 to both)
      await client.query(`
        UPDATE tenant.wallets
        SET balance = balance + 100.00
        WHERE user_id IN ($1, $2) AND wallet_type = 'main'
      `, [referrerId, userId]);
    }
  }

  private async performKYCVerification(kycData: KYCDocumentData): Promise<KYCVerificationResult> {
    // STUB: This would integrate with actual KYC verification services
    // like Smile Identity, Prembly, or NIBSS BVN verification
    
    // Simulate verification logic
    const isNinValid = kycData.documentType === 'nin' && kycData.documentNumber.length === 11;
    const hasValidImages = kycData.documentImage && kycData.selfieImage;

    if (!isNinValid || !hasValidImages) {
      return {
        success: false,
        kycLevel: 1,
        message: 'Invalid document or missing images',
        matchScore: 0
      };
    }

    // Simulate successful verification
    return {
      success: true,
      kycLevel: 2,
      message: 'KYC verification successful',
      verificationId: `VER_${Date.now()}`,
      matchScore: 95.7
    };
  }

  private getKycStatusFromLevel(level: number): string {
    switch (level) {
      case 1: return 'tier1';
      case 2: return 'tier2';
      case 3: return 'tier3';
      default: return 'pending';
    }
  }

  private getLimitsForKycLevel(level: number): { dailyLimit: number; monthlyLimit: number } {
    switch (level) {
      case 1:
        return { dailyLimit: 100000, monthlyLimit: 500000 }; // ₦100k daily, ₦500k monthly
      case 2:
        return { dailyLimit: 500000, monthlyLimit: 2000000 }; // ₦500k daily, ₦2M monthly
      case 3:
        return { dailyLimit: 2000000, monthlyLimit: 10000000 }; // ₦2M daily, ₦10M monthly
      default:
        return { dailyLimit: 50000, monthlyLimit: 200000 }; // ₦50k daily, ₦200k monthly
    }
  }
}

// Export singleton instance
export const userService = new UserService();