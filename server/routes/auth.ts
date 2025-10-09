/**
 * Authentication Routes
 * Login, logout, token refresh, and user management endpoints
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import dbManager from '../config/multi-tenant-database';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateToken
} from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('tenantId').optional() // Remove UUID validation to accept tenant names
], asyncHandler(async (req, res) => {
  // Check validation errors
  const validationErrors = validationResult(req);
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
    throw errors.badRequest('Tenant context required', 'TENANT_REQUIRED');
  }

  // If tenantId is not a UUID, look it up by name
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    const tenantResult = await dbManager.queryPlatform(`
      SELECT id FROM platform.tenants WHERE name = $1 OR subdomain = $1
    `, [tenantId]);
    
    if (tenantResult.rows.length > 0) {
      tenantId = tenantResult.rows[0].id;
      console.log('🏢 Tenant lookup successful:', { originalTenant: req.body.tenantId, resolvedTenantId: tenantId });
    } else {
      console.log('❌ Tenant lookup failed for:', req.body.tenantId);
      throw errors.badRequest('Invalid tenant', 'INVALID_TENANT');
    }
  } else {
    console.log('✅ Using UUID tenant:', tenantId);
  }

  // Find user by email and tenant
  console.log('🔍 Looking for user:', { email, tenantId });
  const userResult = await dbManager.queryTenant(tenantId, `
    SELECT u.* FROM tenant.users u
    WHERE u.email = $1 AND u.tenant_id = $2
  `, [email, tenantId]);

  console.log('👤 User query result:', { found: userResult.rows.length, email });

  if (userResult.rows.length === 0) {
    // Check if user exists in any tenant (for better error messages)
    const anyUserResult = await dbManager.queryTenant(tenantId, `
      SELECT u.email, u.tenant_id FROM tenant.users u
      WHERE u.email = $1
    `, [email]);
    console.log('🔍 User exists in current tenant database:', anyUserResult.rows);
    throw errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const user = userResult.rows[0];

  // Get tenant information from platform database
  const tenantResult = await dbManager.queryPlatform(`
    SELECT name as tenant_name, display_name as tenant_display_name, branding, security_settings, bank_code
    FROM platform.tenants
    WHERE id = $1
  `, [tenantId]);

  if (tenantResult.rows.length > 0) {
    const tenantInfo = tenantResult.rows[0];
    user.tenant_name = tenantInfo.tenant_name;
    user.tenant_display_name = tenantInfo.tenant_display_name;
    user.branding = tenantInfo.branding;
    user.security_settings = tenantInfo.security_settings;
    user.bank_code = tenantInfo.bank_code;
  }

  // Check user status
  if (user.status !== 'active') {
    throw errors.forbidden(`Account is ${user.status}`, 'ACCOUNT_INACTIVE');
  }

  // Verify password
  console.log('🔑 Password verification:', { 
    providedPassword: password,
    hasStoredHash: !!user.password_hash,
    storedHashLength: user.password_hash?.length || 0
  });
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('🔓 Password verification result:', { isValidPassword });
  
  if (!isValidPassword) {
    // Increment failed login attempts
    await dbManager.queryTenant(tenantId, `
      UPDATE tenant.users
      SET failed_login_attempts = failed_login_attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [user.id]);

    console.log('❌ Password verification failed for:', { email, providedPassword: password });
    throw errors.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Check if account is locked due to too many failed attempts
  // Special handling for development accounts
  const isDevelopmentAccount = process.env.NODE_ENV === 'development' &&
    (user.email === 'admin@fmfb.com' || user.email === 'demo@fmfb.com');

  const maxAttempts = isDevelopmentAccount ? 100 : (user.security_settings?.maxLoginAttempts || 5);

  if (user.failed_login_attempts >= maxAttempts) {
    throw errors.forbidden('Account locked due to too many failed login attempts', 'ACCOUNT_LOCKED');
  }

  // Create user session using tenant database transaction
  const tenantPool = await dbManager.getTenantPool(tenantId);
  const client = await tenantPool.connect();

  try {
    await client.query('BEGIN');

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
    const refreshTokenValue = generateRefreshToken({
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

    await client.query('COMMIT');

    var finalSessionResult = sessionResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const sessionResult = finalSessionResult;

  // Generate JWT tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name,
    role: user.role,
    sessionId: sessionResult.id
  };

  const accessToken = generateToken(tokenPayload);
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
      bankCode: user.bank_code,
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
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw errors.badRequest('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw errors.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const tenantId = decoded.tenantId;

  // Find session and user in tenant database
  const sessionResult = await dbManager.queryTenant(tenantId, `
    SELECT s.*, u.email, u.role, u.status, u.tenant_id
    FROM tenant.user_sessions s
    JOIN tenant.users u ON s.user_id = u.id
    WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP
  `, [refreshToken]);

  if (sessionResult.rows.length === 0) {
    throw errors.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const session = sessionResult.rows[0];

  // Get tenant information from platform database
  const tenantResult = await dbManager.queryPlatform(`
    SELECT name as tenant_name, display_name as tenant_display_name
    FROM platform.tenants
    WHERE id = $1
  `, [tenantId]);

  if (tenantResult.rows.length > 0) {
    session.tenant_name = tenantResult.rows[0].tenant_name;
    session.tenant_display_name = tenantResult.rows[0].tenant_display_name;
  }

  // Check user status
  if (session.status !== 'active') {
    throw errors.forbidden('Account inactive', 'ACCOUNT_INACTIVE');
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

  const accessToken = generateToken(tokenPayload);

  // Update session activity
  await dbManager.queryTenant(tenantId, `
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
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const sessionId = req.token.payload.sessionId;
  const tenantId = req.user.tenantId;

  // Delete session
  await dbManager.queryTenant(tenantId, `
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
router.post('/logout-all', authenticateToken, asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  // Delete all user sessions
  const result = await dbManager.queryTenant(tenantId, `
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
router.get('/profile', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  // Get detailed user information from tenant database
  const userResult = await dbManager.queryTenant(tenantId, `
    SELECT u.*, w.wallet_number, w.balance, w.available_balance
    FROM tenant.users u
    LEFT JOIN tenant.wallets w ON u.id = w.user_id AND w.wallet_type = 'main'
    WHERE u.id = $1
  `, [req.user.id]);

  if (userResult.rows.length === 0) {
    throw errors.notFound('User not found', 'USER_NOT_FOUND');
  }

  const user = userResult.rows[0];

  // Get tenant information from platform database
  const tenantResult = await dbManager.queryPlatform(`
    SELECT name as tenant_name, display_name as tenant_display_name, branding, bank_code
    FROM platform.tenants
    WHERE id = $1
  `, [tenantId]);

  if (tenantResult.rows.length > 0) {
    const tenantInfo = tenantResult.rows[0];
    user.tenant_name = tenantInfo.tenant_name;
    user.tenant_display_name = tenantInfo.tenant_display_name;
    user.branding = tenantInfo.branding;
    user.bank_code = tenantInfo.bank_code;
  }

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
      bankCode: user.bank_code,
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
router.put('/profile', authenticateToken, validateTenantAccess, [
  body('firstName').optional().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('profileData').optional().isObject().withMessage('Profile data must be an object'),
  body('aiPreferences').optional().isObject().withMessage('AI preferences must be an object')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
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
    throw errors.badRequest('No valid fields to update', 'NO_UPDATE_FIELDS');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  updateValues.push(req.user.id);

  const updateQuery = `
    UPDATE tenant.users
    SET ${updateFields.join(', ')}
    WHERE id = $${updateValues.length}
    RETURNING first_name, last_name, phone_number, profile_data, ai_preferences, updated_at
  `;

  const tenantId = req.user.tenantId;
  const result = await dbManager.queryTenant(tenantId, updateQuery, updateValues);

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
router.post('/change-password', authenticateToken, validateTenantAccess, [
  body('currentPassword').isLength({ min: 8 }).withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain uppercase, lowercase, number and special character')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.badRequest('Validation failed', 'VALIDATION_ERROR', validationErrors.array());
  }

  const { currentPassword, newPassword } = req.body;
  const tenantId = req.user.tenantId;

  // Get current password hash
  const userResult = await dbManager.queryTenant(tenantId, `
    SELECT password_hash FROM tenant.users WHERE id = $1
  `, [req.user.id]);

  const user = userResult.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw errors.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await dbManager.queryTenant(tenantId, `
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
router.get('/sessions', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;

  const sessionsResult = await dbManager.queryTenant(tenantId, `
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
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
  body('firstName').isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('dateOfBirth').isDate().withMessage('Valid date of birth required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender required'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/).withMessage('Password must be at least 8 characters with uppercase, lowercase and number'),
  body('transactionPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Transaction PIN must be 4 digits'),
  body('acceptTerms').equals('true').withMessage('You must accept the terms and conditions'),
  body('tenantId').optional().isUUID().withMessage('Invalid tenant ID format'),
  body('referralCode').optional().isLength({ min: 6, max: 10 }).withMessage('Invalid referral code')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: validationErrors.array()
    });
  }

  const {
    email, phone, firstName, lastName, dateOfBirth, gender,
    password, transactionPin, referralCode
  } = req.body;
  
  const tenantId = req.body.tenantId || req.tenant?.id;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Tenant context required',
      code: 'TENANT_REQUIRED'
    });
  }

  try {
    const { userService } = await import('../services/users');
    
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

  } catch (error) {
    console.error('Registration error:', error);
    throw errors.internalError('Registration failed');
  }
}));

/**
 * POST /api/auth/kyc/submit
 * Submit KYC documents for verification
 */
router.post('/kyc/submit', authenticateToken, validateTenantAccess, [
  body('documentType').isIn(['nin', 'passport', 'drivers_license', 'voters_card']).withMessage('Valid document type required'),
  body('documentNumber').isLength({ min: 5, max: 20 }).withMessage('Valid document number required'),
  body('documentImage').isLength({ min: 10 }).withMessage('Document image is required'),
  body('selfieImage').isLength({ min: 10 }).withMessage('Selfie image is required')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
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
    const { userService } = await import('../services/users');
    
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

  } catch (error) {
    console.error('KYC submission error:', error);
    throw errors.internalError('KYC submission failed');
  }
}));

/**
 * GET /api/auth/profile
 * Get complete user profile
 */
router.get('/profile', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  try {
    const { userService } = await import('../services/users');
    
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

  } catch (error) {
    console.error('Get profile error:', error);
    throw errors.internalError('Failed to fetch profile');
  }
}));

/**
 * PUT /api/auth/profile
 * Update user profile information
 */
router.put('/profile', authenticateToken, validateTenantAccess, [
  body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('address.street').optional().isLength({ min: 5, max: 100 }).withMessage('Street address must be 5-100 characters'),
  body('address.city').optional().isLength({ min: 2, max: 50 }).withMessage('City must be 2-50 characters'),
  body('address.state').optional().isLength({ min: 2, max: 50 }).withMessage('State must be 2-50 characters'),
  body('address.country').optional().isLength({ min: 2, max: 50 }).withMessage('Country must be 2-50 characters'),
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
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
    const { userService } = await import('../services/users');
    
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

  } catch (error) {
    console.error('Profile update error:', error);
    throw errors.internalError('Profile update failed');
  }
}));

export default router;