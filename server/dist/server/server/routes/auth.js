"use strict";
/**
 * Authentication Routes
 * Login, logout, token refresh, and user management endpoints
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('tenantId').optional() // Remove UUID validation to accept tenant names
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check validation errors
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { email, password, deviceInfo = {} } = req.body;
    let tenantId = req.body.tenantId || req.tenant?.id;
    console.log('🔐 Login attempt:', { email, tenantId, hasPassword: !!password });
    if (!tenantId) {
        throw errorHandler_1.errors.badRequest('Tenant context required', 'TENANT_REQUIRED');
    }
    // If tenantId is not a UUID, look it up by name
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
        const tenantResult = await (0, database_1.query)(`
      SELECT id FROM platform.tenants WHERE name = $1 OR subdomain = $1
    `, [tenantId]);
        if (tenantResult.rows.length > 0) {
            tenantId = tenantResult.rows[0].id;
            console.log('🏢 Tenant lookup successful:', { originalTenant: req.body.tenantId, resolvedTenantId: tenantId });
        }
        else {
            console.log('❌ Tenant lookup failed for:', req.body.tenantId);
            throw errorHandler_1.errors.badRequest('Invalid tenant', 'INVALID_TENANT');
        }
    }
    else {
        console.log('✅ Using UUID tenant:', tenantId);
    }
    // Find user by email and tenant
    console.log('🔍 Looking for user:', { email, tenantId });
    const userResult = await (0, database_1.query)(`
    SELECT u.*, tm.tenant_name, t.display_name as tenant_display_name,
           t.branding, t.security_settings
    FROM tenant.users u
    JOIN tenant.tenant_metadata tm ON u.tenant_id = tm.tenant_id
    JOIN platform.tenants t ON u.tenant_id = t.id
    WHERE u.email = $1 AND u.tenant_id = $2
  `, [email, tenantId]);
    console.log('👤 User query result:', { found: userResult.rows.length, email });
    if (userResult.rows.length === 0) {
        // Check if user exists in any tenant
        const anyUserResult = await (0, database_1.query)(`
      SELECT u.email, u.tenant_id, t.name as tenant_name
      FROM tenant.users u
      JOIN platform.tenants t ON u.tenant_id = t.id
      WHERE u.email = $1
    `, [email]);
        console.log('🔍 User exists in other tenants:', anyUserResult.rows);
        throw errorHandler_1.errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }
    const user = userResult.rows[0];
    // Check user status
    if (user.status !== 'active') {
        throw errorHandler_1.errors.forbidden(`Account is ${user.status}`, 'ACCOUNT_INACTIVE');
    }
    // Verify password
    console.log('🔑 Password verification:', {
        providedPassword: password,
        hasStoredHash: !!user.password_hash,
        storedHashLength: user.password_hash?.length || 0
    });
    const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
    console.log('🔓 Password verification result:', { isValidPassword });
    if (!isValidPassword) {
        // Increment failed login attempts
        await (0, database_1.query)(`
      UPDATE tenant.users 
      SET failed_login_attempts = failed_login_attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [user.id]);
        console.log('❌ Password verification failed for:', { email, providedPassword: password });
        throw errorHandler_1.errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }
    // Check if account is locked due to too many failed attempts
    const maxAttempts = user.security_settings?.maxLoginAttempts || 5;
    if (user.failed_login_attempts >= maxAttempts) {
        throw errorHandler_1.errors.forbidden('Account locked due to too many failed login attempts', 'ACCOUNT_LOCKED');
    }
    // Create user session
    const sessionResult = await (0, database_1.transaction)(async (client) => {
        // Reset failed login attempts and update last login
        await client.query(`
      UPDATE tenant.users 
      SET failed_login_attempts = 0,
          last_login_at = CURRENT_TIMESTAMP,
          last_login_ip = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [req.ip, user.id]);
        // Create session record
        const sessionToken = require('crypto').randomUUID();
        const refreshTokenValue = (0, auth_1.generateRefreshToken)({
            userId: user.id,
            tenantId: user.tenant_id,
            sessionId: require('crypto').randomUUID()
        });
        const sessionResult = await client.query(`
      INSERT INTO tenant.user_sessions (
        user_id, session_token, refresh_token, device_info, ip_address, user_agent,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, session_token, refresh_token, expires_at
    `, [
            user.id,
            sessionToken,
            refreshTokenValue,
            JSON.stringify(deviceInfo),
            req.ip,
            req.get('User-Agent') || '',
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        ]);
        return sessionResult.rows[0];
    });
    // Generate JWT tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        role: user.role,
        sessionId: sessionResult.id
    };
    const accessToken = (0, auth_1.generateToken)(tokenPayload);
    const refreshToken = sessionResult.refresh_token;
    // User profile for response
    const userProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        mfaEnabled: user.mfa_enabled,
        biometricEnabled: user.biometric_enabled,
        kycStatus: user.kyc_status,
        kycLevel: user.kyc_level,
        profileData: user.profile_data,
        aiPreferences: user.ai_preferences,
        lastLoginAt: user.last_login_at,
        tenant: {
            id: user.tenant_id,
            name: user.tenant_name,
            displayName: user.tenant_display_name,
            branding: user.branding
        }
    };
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userProfile,
            tokens: {
                access: accessToken,
                refresh: refreshToken,
                expiresIn: '24h'
            },
            session: {
                id: sessionResult.id,
                expiresAt: sessionResult.expires_at
            }
        }
    });
}));
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw errorHandler_1.errors.badRequest('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }
    // Verify refresh token
    let decoded;
    try {
        decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
    }
    catch (error) {
        throw errorHandler_1.errors.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
    // Find session and user
    const sessionResult = await (0, database_1.query)(`
    SELECT s.*, u.email, u.role, u.status, u.tenant_id,
           tm.tenant_name, t.display_name as tenant_display_name
    FROM tenant.user_sessions s
    JOIN tenant.users u ON s.user_id = u.id
    JOIN tenant.tenant_metadata tm ON u.tenant_id = tm.tenant_id
    JOIN platform.tenants t ON u.tenant_id = t.id
    WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP
  `, [refreshToken]);
    if (sessionResult.rows.length === 0) {
        throw errorHandler_1.errors.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
    const session = sessionResult.rows[0];
    // Check user status
    if (session.status !== 'active') {
        throw errorHandler_1.errors.forbidden('Account inactive', 'ACCOUNT_INACTIVE');
    }
    // Generate new access token
    const tokenPayload = {
        userId: session.user_id,
        email: session.email,
        tenantId: session.tenant_id,
        tenantName: session.tenant_name,
        role: session.role,
        sessionId: session.id
    };
    const accessToken = (0, auth_1.generateToken)(tokenPayload);
    // Update session activity
    await (0, database_1.query)(`
    UPDATE tenant.user_sessions 
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [session.id]);
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            tokens: {
                access: accessToken,
                refresh: refreshToken,
                expiresIn: '24h'
            }
        }
    });
}));
/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessionId = req.token.payload.sessionId;
    // Delete session
    await (0, database_1.query)(`
    DELETE FROM tenant.user_sessions 
    WHERE id = $1 AND user_id = $2
  `, [sessionId, req.user.id]);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
}));
/**
 * POST /api/auth/logout-all
 * Logout user from all devices
 */
router.post('/logout-all', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Delete all user sessions
    const result = await (0, database_1.query)(`
    DELETE FROM tenant.user_sessions 
    WHERE user_id = $1
  `, [req.user.id]);
    res.json({
        success: true,
        message: `Logged out from ${result.rowCount} sessions`
    });
}));
/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Get detailed user information
    const userResult = await (0, database_1.query)(`
    SELECT u.*, w.wallet_number, w.balance, w.available_balance,
           tm.tenant_name, t.display_name as tenant_display_name, t.branding
    FROM tenant.users u
    LEFT JOIN tenant.wallets w ON u.id = w.user_id AND w.wallet_type = 'main'
    JOIN tenant.tenant_metadata tm ON u.tenant_id = tm.tenant_id
    JOIN platform.tenants t ON u.tenant_id = t.id
    WHERE u.id = $1
  `, [req.user.id]);
    if (userResult.rows.length === 0) {
        throw errorHandler_1.errors.notFound('User not found', 'USER_NOT_FOUND');
    }
    const user = userResult.rows[0];
    const profile = {
        id: user.id,
        email: user.email,
        phoneNumber: user.phone_number,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        permissions: user.permissions || [],
        bvn: user.bvn,
        nin: user.nin,
        mfaEnabled: user.mfa_enabled,
        biometricEnabled: user.biometric_enabled,
        kycStatus: user.kyc_status,
        kycLevel: user.kyc_level,
        profileData: user.profile_data,
        aiPreferences: user.ai_preferences,
        behavioralProfile: user.behavioral_profile,
        riskProfile: user.risk_profile,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        wallet: user.wallet_number ? {
            number: user.wallet_number,
            balance: user.balance,
            availableBalance: user.available_balance
        } : null,
        tenant: {
            id: user.tenant_id,
            name: user.tenant_name,
            displayName: user.tenant_display_name,
            branding: user.branding
        }
    };
    res.json({
        success: true,
        data: { user: profile }
    });
}));
/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('firstName').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    (0, express_validator_1.body)('lastName').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    (0, express_validator_1.body)('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    (0, express_validator_1.body)('profileData').optional().isObject().withMessage('Profile data must be an object'),
    (0, express_validator_1.body)('aiPreferences').optional().isObject().withMessage('AI preferences must be an object')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
    }
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'profileData', 'aiPreferences'];
    const updateData = {};
    const updateFields = [];
    const updateValues = [];
    // Build update query dynamically
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            const dbField = field === 'firstName' ? 'first_name' :
                field === 'lastName' ? 'last_name' :
                    field === 'phoneNumber' ? 'phone_number' :
                        field === 'profileData' ? 'profile_data' :
                            field === 'aiPreferences' ? 'ai_preferences' : field;
            updateFields.push(`${dbField} = $${updateValues.length + 1}`);
            updateValues.push(typeof req.body[field] === 'object' ? JSON.stringify(req.body[field]) : req.body[field]);
        }
    });
    if (updateFields.length === 0) {
        throw errorHandler_1.errors.badRequest('No valid fields to update', 'NO_UPDATE_FIELDS');
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.user.id);
    const updateQuery = `
    UPDATE tenant.users 
    SET ${updateFields.join(', ')}
    WHERE id = $${updateValues.length}
    RETURNING first_name, last_name, phone_number, profile_data, ai_preferences, updated_at
  `;
    const result = await (0, database_1.query)(updateQuery, updateValues);
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: result.rows[0] }
    });
}));
/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('currentPassword').isLength({ min: 8 }).withMessage('Current password required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain uppercase, lowercase, number and special character')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        throw errorHandler_1.errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
    }
    const { currentPassword, newPassword } = req.body;
    // Get current password hash
    const userResult = await (0, database_1.query)(`
    SELECT password_hash FROM tenant.users WHERE id = $1
  `, [req.user.id]);
    const user = userResult.rows[0];
    // Verify current password
    const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
        throw errorHandler_1.errors.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
    }
    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt_1.default.hash(newPassword, saltRounds);
    // Update password
    await (0, database_1.query)(`
    UPDATE tenant.users 
    SET password_hash = $1,
        password_changed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [newPasswordHash, req.user.id]);
    res.json({
        success: true,
        message: 'Password changed successfully'
    });
}));
/**
 * GET /api/auth/sessions
 * Get user active sessions
 */
router.get('/sessions', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessionsResult = await (0, database_1.query)(`
    SELECT id, device_info, ip_address, user_agent, created_at, last_activity_at, expires_at
    FROM tenant.user_sessions
    WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
    ORDER BY last_activity_at DESC
  `, [req.user.id]);
    const sessions = sessionsResult.rows.map(session => ({
        id: session.id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        lastActivityAt: session.last_activity_at,
        expiresAt: session.expires_at,
        isCurrent: session.id === req.token.payload.sessionId
    }));
    res.json({
        success: true,
        data: { sessions }
    });
}));
/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('phone').isMobilePhone('any').withMessage('Valid phone number required'),
    (0, express_validator_1.body)('firstName').isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    (0, express_validator_1.body)('lastName').isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    (0, express_validator_1.body)('dateOfBirth').isDate().withMessage('Valid date of birth required'),
    (0, express_validator_1.body)('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/).withMessage('Password must be at least 8 characters with uppercase, lowercase and number'),
    (0, express_validator_1.body)('transactionPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Transaction PIN must be 4 digits'),
    (0, express_validator_1.body)('acceptTerms').equals('true').withMessage('You must accept the terms and conditions'),
    (0, express_validator_1.body)('tenantId').optional().isUUID().withMessage('Invalid tenant ID format'),
    (0, express_validator_1.body)('referralCode').optional().isLength({ min: 6, max: 10 }).withMessage('Invalid referral code')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { email, phone, firstName, lastName, dateOfBirth, gender, password, transactionPin, referralCode } = req.body;
    const tenantId = req.body.tenantId || req.tenant?.id;
    if (!tenantId) {
        return res.status(400).json({
            success: false,
            error: 'Tenant context required',
            code: 'TENANT_REQUIRED'
        });
    }
    try {
        const { userService } = await Promise.resolve().then(() => __importStar(require('../services/users')));
        const registrationResult = await userService.registerUser({
            email,
            phone,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            password,
            transactionPin,
            tenantId,
            referralCode
        });
        if (!registrationResult.success) {
            return res.status(400).json({
                success: false,
                error: registrationResult.message,
                code: 'REGISTRATION_FAILED'
            });
        }
        res.status(201).json({
            success: true,
            message: registrationResult.message,
            data: {
                userId: registrationResult.userId,
                accountNumber: registrationResult.accountNumber,
                email,
                firstName,
                lastName,
                kycStatus: 'pending',
                kycLevel: 1
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        throw errorHandler_1.errors.internalError('Registration failed');
    }
}));
/**
 * POST /api/auth/kyc/submit
 * Submit KYC documents for verification
 */
router.post('/kyc/submit', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('documentType').isIn(['nin', 'passport', 'drivers_license', 'voters_card']).withMessage('Valid document type required'),
    (0, express_validator_1.body)('documentNumber').isLength({ min: 5, max: 20 }).withMessage('Valid document number required'),
    (0, express_validator_1.body)('documentImage').isLength({ min: 10 }).withMessage('Document image is required'),
    (0, express_validator_1.body)('selfieImage').isLength({ min: 10 }).withMessage('Selfie image is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { documentType, documentNumber, documentImage, selfieImage } = req.body;
    const userId = req.user.id;
    try {
        const { userService } = await Promise.resolve().then(() => __importStar(require('../services/users')));
        const kycResult = await userService.submitKYCDocuments({
            userId,
            documentType,
            documentNumber,
            documentImage,
            selfieImage
        });
        res.json({
            success: kycResult.success,
            message: kycResult.message,
            data: {
                kycLevel: kycResult.kycLevel,
                verificationId: kycResult.verificationId,
                matchScore: kycResult.matchScore
            }
        });
    }
    catch (error) {
        console.error('KYC submission error:', error);
        throw errorHandler_1.errors.internalError('KYC submission failed');
    }
}));
/**
 * GET /api/auth/profile
 * Get complete user profile
 */
router.get('/profile', auth_1.authenticateToken, tenant_1.validateTenantAccess, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { userService } = await Promise.resolve().then(() => __importStar(require('../services/users')));
        const profile = await userService.getUserProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found',
                code: 'PROFILE_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: { user: profile }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        throw errorHandler_1.errors.internalError('Failed to fetch profile');
    }
}));
/**
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile', auth_1.authenticateToken, tenant_1.validateTenantAccess, [
    (0, express_validator_1.body)('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    (0, express_validator_1.body)('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    (0, express_validator_1.body)('address.street').optional().isLength({ min: 5, max: 100 }).withMessage('Street address must be 5-100 characters'),
    (0, express_validator_1.body)('address.city').optional().isLength({ min: 2, max: 50 }).withMessage('City must be 2-50 characters'),
    (0, express_validator_1.body)('address.state').optional().isLength({ min: 2, max: 50 }).withMessage('State must be 2-50 characters'),
    (0, express_validator_1.body)('address.country').optional().isLength({ min: 2, max: 50 }).withMessage('Country must be 2-50 characters'),
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors.array()
        });
    }
    const { firstName, lastName, phone, address, profileImage } = req.body;
    const userId = req.user.id;
    try {
        const { userService } = await Promise.resolve().then(() => __importStar(require('../services/users')));
        const updateResult = await userService.updateUserProfile(userId, {
            firstName,
            lastName,
            phone,
            address,
            profileImage
        });
        res.json({
            success: updateResult.success,
            message: updateResult.message
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        throw errorHandler_1.errors.internalError('Profile update failed');
    }
}));
exports.default = router;
