"use strict";
/**
 * User Management Service
 * Handles user registration, KYC, and profile management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
class UserService {
    /**
     * Register a new user with initial KYC tier 1
     */
    async registerUser(userData) {
        try {
            // Start transaction
            await (0, database_1.query)('BEGIN');
            // Check if user already exists
            const existingUser = await (0, database_1.query)(`
        SELECT id FROM users 
        WHERE email = $1 OR phone_number = $2
      `, [userData.email, userData.phone]);
            if (existingUser.rowCount > 0) {
                await (0, database_1.query)('ROLLBACK');
                return {
                    success: false,
                    message: 'User with this email or phone number already exists'
                };
            }
            // Hash password and PIN
            const passwordHash = await bcrypt_1.default.hash(userData.password, 12);
            const transactionPinHash = await bcrypt_1.default.hash(userData.transactionPin, 12);
            // Generate unique account number
            const accountNumber = await this.generateAccountNumber(userData.tenantId);
            // Create user
            const userResult = await (0, database_1.query)(`
        INSERT INTO users (
          tenant_id, email, phone_number, first_name, last_name, date_of_birth,
          gender, password_hash, transaction_pin_hash, account_number,
          kyc_status, kyc_level, daily_limit, monthly_limit, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 1, 100000, 500000, true, NOW())
        RETURNING id
      `, [
                userData.tenantId, userData.email, userData.phone, userData.firstName,
                userData.lastName, userData.dateOfBirth, userData.gender, passwordHash,
                transactionPinHash, accountNumber
            ]);
            const userId = userResult.rows[0].id;
            // Create primary wallet
            await (0, database_1.query)(`
        INSERT INTO wallets (
          user_id, tenant_id, wallet_type, currency, balance, is_primary, created_at
        ) VALUES ($1, $2, 'primary', 'NGN', 0.00, true, NOW())
      `, [userId, userData.tenantId]);
            // Handle referral if provided
            if (userData.referralCode) {
                await this.processReferral(userId, userData.referralCode);
            }
            // Log registration event
            await (0, database_1.query)(`
        INSERT INTO user_activity_logs (user_id, activity_type, description, ip_address, created_at)
        VALUES ($1, 'REGISTRATION', 'User registered successfully', '127.0.0.1', NOW())
      `, [userId]);
            await (0, database_1.query)('COMMIT');
            return {
                success: true,
                userId,
                accountNumber,
                message: 'Registration successful. Please complete KYC verification.'
            };
        }
        catch (error) {
            await (0, database_1.query)('ROLLBACK');
            console.error('User registration error:', error);
            return {
                success: false,
                message: 'Registration failed. Please try again.'
            };
        }
    }
    /**
     * Submit KYC documents for verification
     */
    async submitKYCDocuments(kycData) {
        try {
            // Start transaction
            await (0, database_1.query)('BEGIN');
            // Check if user exists and current KYC status
            const userResult = await (0, database_1.query)(`
        SELECT id, kyc_status, kyc_level FROM users WHERE id = $1
      `, [kycData.userId]);
            if (userResult.rowCount === 0) {
                await (0, database_1.query)('ROLLBACK');
                return {
                    success: false,
                    kycLevel: 0,
                    message: 'User not found'
                };
            }
            const user = userResult.rows[0];
            // Save KYC documents
            const kycResult = await (0, database_1.query)(`
        INSERT INTO kyc_documents (
          user_id, document_type, document_number, document_image_url,
          selfie_image_url, status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        RETURNING id
      `, [
                kycData.userId, kycData.documentType, kycData.documentNumber,
                kycData.documentImage, kycData.selfieImage
            ]);
            const kycDocumentId = kycResult.rows[0].id;
            // Perform KYC verification (stubbed for now)
            const verificationResult = await this.performKYCVerification(kycData);
            // Update KYC document status
            await (0, database_1.query)(`
        UPDATE kyc_documents 
        SET status = $1, verification_response = $2, processed_at = NOW()
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
                await (0, database_1.query)(`
          UPDATE users 
          SET kyc_status = $1, kyc_level = $2, daily_limit = $3, monthly_limit = $4, updated_at = NOW()
          WHERE id = $5
        `, [kycStatus, newKycLevel, dailyLimit, monthlyLimit, kycData.userId]);
                // Log KYC approval
                await (0, database_1.query)(`
          INSERT INTO user_activity_logs (user_id, activity_type, description, created_at)
          VALUES ($1, 'KYC_APPROVED', $2, NOW())
        `, [kycData.userId, `KYC upgraded to level ${newKycLevel}`]);
                verificationResult.kycLevel = newKycLevel;
            }
            else {
                // Log KYC rejection
                await (0, database_1.query)(`
          INSERT INTO user_activity_logs (user_id, activity_type, description, created_at)
          VALUES ($1, 'KYC_REJECTED', $2, NOW())
        `, [kycData.userId, verificationResult.message]);
            }
            await (0, database_1.query)('COMMIT');
            return verificationResult;
        }
        catch (error) {
            await (0, database_1.query)('ROLLBACK');
            console.error('KYC submission error:', error);
            return {
                success: false,
                kycLevel: 0,
                message: 'KYC submission failed. Please try again.'
            };
        }
    }
    /**
     * Get user profile with complete information
     */
    async getUserProfile(userId) {
        try {
            const result = await (0, database_1.query)(`
        SELECT u.*, w.balance as wallet_balance,
               CASE 
                 WHEN u.profile_address IS NOT NULL 
                 THEN u.profile_address::json 
                 ELSE NULL 
               END as address
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id AND w.is_primary = true
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
                createdAt: user.created_at,
                updatedAt: user.updated_at
            };
        }
        catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
    /**
     * Update user profile information
     */
    async updateUserProfile(userId, updates) {
        try {
            const updateFields = [];
            const updateValues = [];
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
            updateFields.push('updated_at = NOW()');
            updateValues.push(userId);
            const query_text = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `;
            await (0, database_1.query)(query_text, updateValues);
            // Log profile update
            await (0, database_1.query)(`
        INSERT INTO user_activity_logs (user_id, activity_type, description, created_at)
        VALUES ($1, 'PROFILE_UPDATED', 'Profile information updated', NOW())
      `, [userId]);
            return {
                success: true,
                message: 'Profile updated successfully'
            };
        }
        catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: 'Profile update failed. Please try again.'
            };
        }
    }
    // Private helper methods
    async generateAccountNumber(tenantId) {
        // Get tenant bank code for account number generation
        const tenantResult = await (0, database_1.query)(`
      SELECT bank_code FROM tenants WHERE id = $1
    `, [tenantId]);
        if (tenantResult.rowCount === 0) {
            throw new Error('Tenant not found');
        }
        const bankCode = tenantResult.rows[0].bank_code;
        // Generate unique 10-digit account number with bank code prefix
        let accountNumber;
        let isUnique = false;
        while (!isUnique) {
            const randomSuffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
            accountNumber = bankCode + randomSuffix;
            // Check if account number already exists
            const existingResult = await (0, database_1.query)(`
        SELECT id FROM users WHERE account_number = $1
      `, [accountNumber]);
            isUnique = existingResult.rowCount === 0;
        }
        return accountNumber;
    }
    async processReferral(userId, referralCode) {
        // Find referrer by referral code
        const referrerResult = await (0, database_1.query)(`
      SELECT id FROM users WHERE referral_code = $1
    `, [referralCode]);
        if (referrerResult.rowCount > 0) {
            const referrerId = referrerResult.rows[0].id;
            // Create referral record
            await (0, database_1.query)(`
        INSERT INTO referrals (referrer_id, referee_id, referral_code, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [referrerId, userId, referralCode]);
            // Award referral bonus (₦100 to both)
            await (0, database_1.query)(`
        UPDATE wallets 
        SET balance = balance + 100.00
        WHERE user_id IN ($1, $2) AND is_primary = true
      `, [referrerId, userId]);
        }
    }
    async performKYCVerification(kycData) {
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
    getKycStatusFromLevel(level) {
        switch (level) {
            case 1: return 'tier1';
            case 2: return 'tier2';
            case 3: return 'tier3';
            default: return 'pending';
        }
    }
    getLimitsForKycLevel(level) {
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
exports.UserService = UserService;
// Export singleton instance
exports.userService = new UserService();
//# sourceMappingURL=users.js.map