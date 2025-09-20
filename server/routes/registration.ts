/**
 * User Registration Routes with KYC Integration
 * Complete customer onboarding system for multi-tenant banking
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { query, transaction } from '../config/database';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';
import crypto from 'crypto';

const router = express.Router();

/**
 * POST /api/registration/start
 * Start the registration process - Step 1: Basic Information
 */
router.post('/start', validateTenantAccess, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('firstName').isLength({ min: 2, max: 100 }).withMessage('First name is required'),
  body('lastName').isLength({ min: 2, max: 100 }).withMessage('Last name is required'),
  body('middleName').optional().isLength({ max: 100 }).withMessage('Middle name too long'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('agreeToTerms').equals('true').withMessage('Must agree to terms and conditions'),
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
    email,
    phoneNumber,
    password,
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    agreeToTerms
  } = req.body;

  const tenantId = req.tenant.id;

  try {
    // Start database transaction
    await transaction(async (client) => {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM tenant.users WHERE email = $1 OR phone_number = $2',
        [email, phoneNumber]
      );

      if (existingUser.rows.length > 0) {
        throw errors.badRequest('User already exists with this email or phone number');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Calculate age from date of birth
      const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 18) {
        throw errors.badRequest('Must be 18 years or older to register');
      }

      // Create user with pending status
      const userResult = await client.query(`
        INSERT INTO tenant.users (
          tenant_id, email, phone_number, password_hash,
          first_name, last_name, middle_name,
          status, kyc_status, kyc_level,
          profile_data, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'pending', 'pending', 1,
          jsonb_build_object(
            'date_of_birth', $8,
            'age', $9,
            'registration_step', 'basic_info',
            'email_verification_token', $10,
            'phone_verification_code', $11,
            'terms_accepted_at', NOW(),
            'registration_ip', $12
          ),
          NOW()
        ) RETURNING id, email, first_name, last_name
      `, [
        tenantId, email, phoneNumber, passwordHash,
        firstName, lastName, middleName || null,
        dateOfBirth, age, emailVerificationToken, 
        phoneVerificationCode, req.ip
      ]);

      const newUser = userResult.rows[0];

      // Log registration activity
      await client.query(`
        INSERT INTO tenant.user_activity_logs (
          user_id, action, description, ip_address, user_agent, metadata
        ) VALUES ($1, 'registration_started', 'User started registration process', $2, $3, $4)
      `, [
        newUser.id, req.ip, req.get('User-Agent'),
        JSON.stringify({ step: 'basic_info', email_verified: false, phone_verified: false })
      ]);

      // TODO: Send email verification (integrate with email service)
      // TODO: Send SMS verification (integrate with SMS service)

      res.status(201).json({
        success: true,
        message: 'Registration started successfully',
        data: {
          userId: newUser.id,
          email: newUser.email,
          name: `${newUser.first_name} ${newUser.last_name}`,
          nextStep: 'verify_contact',
          verificationRequired: {
            email: true,
            phone: true
          }
        }
      });
    });

  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'USER_EXISTS'
      });
    }
    throw errors.internalError('Registration failed');
  }
}));

/**
 * POST /api/registration/verify-email
 * Verify email address with token
 */
router.post('/verify-email', validateTenantAccess, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('token').isLength({ min: 64, max: 64 }).withMessage('Invalid verification token'),
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors.array()
    });
  }

  const { email, token } = req.body;

  try {
    const userResult = await query(`
      SELECT id, profile_data, status 
      FROM tenant.users 
      WHERE email = $1 AND profile_data->>'email_verification_token' = $2
    `, [email, token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token or email',
        code: 'INVALID_TOKEN'
      });
    }

    const user = userResult.rows[0];
    
    // Update user as email verified
    await query(`
      UPDATE tenant.users 
      SET profile_data = profile_data || jsonb_build_object(
        'email_verified', true,
        'email_verified_at', NOW()
      )
      WHERE id = $1
    `, [user.id]);

    // Log verification activity
    await query(`
      INSERT INTO tenant.user_activity_logs (
        user_id, action, description, ip_address, user_agent
      ) VALUES ($1, 'email_verified', 'User verified email address', $2, $3)
    `, [user.id, req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: user.id,
        emailVerified: true
      }
    });

  } catch (error) {
    throw errors.internalError('Email verification failed');
  }
}));

/**
 * POST /api/registration/verify-phone
 * Verify phone number with SMS code
 */
router.post('/verify-phone', validateTenantAccess, [
  body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code'),
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors.array()
    });
  }

  const { phoneNumber, code } = req.body;

  try {
    const userResult = await query(`
      SELECT id, profile_data, status 
      FROM tenant.users 
      WHERE phone_number = $1 AND profile_data->>'phone_verification_code' = $2
    `, [phoneNumber, code]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code or phone number',
        code: 'INVALID_CODE'
      });
    }

    const user = userResult.rows[0];
    
    // Update user as phone verified
    await query(`
      UPDATE tenant.users 
      SET profile_data = profile_data || jsonb_build_object(
        'phone_verified', true,
        'phone_verified_at', NOW()
      )
      WHERE id = $1
    `, [user.id]);

    // Log verification activity
    await query(`
      INSERT INTO tenant.user_activity_logs (
        user_id, action, description, ip_address, user_agent
      ) VALUES ($1, 'phone_verified', 'User verified phone number', $2, $3)
    `, [user.id, req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        userId: user.id,
        phoneVerified: true
      }
    });

  } catch (error) {
    throw errors.internalError('Phone verification failed');
  }
}));

/**
 * POST /api/registration/personal-details
 * Step 2: Complete personal information and address
 */
router.post('/personal-details', validateTenantAccess, [
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('address').isObject().withMessage('Address object required'),
  body('address.street').isLength({ min: 5, max: 200 }).withMessage('Street address required'),
  body('address.city').isLength({ min: 2, max: 100 }).withMessage('City required'),
  body('address.state').isLength({ min: 2, max: 100 }).withMessage('State required'),
  body('address.postalCode').optional().isLength({ max: 20 }).withMessage('Invalid postal code'),
  body('address.country').equals('Nigeria').withMessage('Only Nigerian addresses supported'),
  body('occupation').isLength({ min: 2, max: 100 }).withMessage('Occupation required'),
  body('monthlyIncome').optional().isNumeric().withMessage('Monthly income must be numeric'),
  body('bvn').optional().isLength({ min: 11, max: 11 }).withMessage('BVN must be 11 digits'),
  body('nin').optional().isLength({ min: 11, max: 11 }).withMessage('NIN must be 11 digits'),
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors.array()
    });
  }

  const { userId, address, occupation, monthlyIncome, bvn, nin } = req.body;

  try {
    // Verify user exists and is in correct state
    const userResult = await query(`
      SELECT id, profile_data, email, first_name, last_name
      FROM tenant.users 
      WHERE id = $1 AND status = 'pending'
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found or not in valid state',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    const profileData = user.profile_data || {};

    // Check if email and phone are verified
    if (!profileData.email_verified || !profileData.phone_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email and phone must be verified first',
        code: 'VERIFICATION_REQUIRED'
      });
    }

    // Check if BVN already exists
    if (bvn) {
      const existingBvn = await query('SELECT id FROM tenant.users WHERE bvn = $1 AND id != $2', [bvn, userId]);
      if (existingBvn.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'BVN already registered with another account',
          code: 'BVN_EXISTS'
        });
      }
    }

    // Check if NIN already exists
    if (nin) {
      const existingNin = await query('SELECT id FROM tenant.users WHERE nin = $1 AND id != $2', [nin, userId]);
      if (existingNin.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'NIN already registered with another account',
          code: 'NIN_EXISTS'
        });
      }
    }

    // Update user with personal details
    await query(`
      UPDATE tenant.users 
      SET 
        profile_address = $1,
        bvn = $2,
        nin = $3,
        profile_data = profile_data || jsonb_build_object(
          'occupation', $4,
          'monthly_income', $5,
          'registration_step', 'personal_details_completed',
          'personal_details_completed_at', NOW()
        )
      WHERE id = $6
    `, [
      JSON.stringify(address),
      bvn || null,
      nin || null,
      occupation,
      monthlyIncome || null,
      userId
    ]);

    // Log activity
    await query(`
      INSERT INTO tenant.user_activity_logs (
        user_id, action, description, ip_address, user_agent, metadata
      ) VALUES ($1, 'personal_details_completed', 'User completed personal details', $2, $3, $4)
    `, [
      userId, req.ip, req.get('User-Agent'),
      JSON.stringify({ 
        address_provided: true, 
        bvn_provided: !!bvn, 
        nin_provided: !!nin,
        occupation: occupation
      })
    ]);

    res.json({
      success: true,
      message: 'Personal details saved successfully',
      data: {
        userId: userId,
        nextStep: 'kyc_documents',
        profileComplete: true
      }
    });

  } catch (error) {
    throw errors.internalError('Failed to save personal details');
  }
}));

/**
 * GET /api/registration/status/:userId
 * Get current registration status and next steps
 */
router.get('/status/:userId', validateTenantAccess, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user ID format',
      code: 'INVALID_USER_ID'
    });
  }

  try {
    const userResult = await query(`
      SELECT 
        id, email, first_name, last_name, status, 
        kyc_status, kyc_level, profile_data, profile_address,
        bvn, nin, created_at
      FROM tenant.users 
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    const profileData = user.profile_data || {};

    // Determine next step based on current progress
    let nextStep = 'verify_contact';
    let stepProgress = {
      basicInfo: true,
      emailVerified: !!profileData.email_verified,
      phoneVerified: !!profileData.phone_verified,
      personalDetails: !!profileData.personal_details_completed_at,
      kycDocuments: user.kyc_status === 'completed',
      approved: user.status === 'active'
    };

    if (!stepProgress.emailVerified || !stepProgress.phoneVerified) {
      nextStep = 'verify_contact';
    } else if (!stepProgress.personalDetails) {
      nextStep = 'personal_details';
    } else if (!stepProgress.kycDocuments) {
      nextStep = 'kyc_documents';
    } else if (!stepProgress.approved) {
      nextStep = 'awaiting_approval';
    } else {
      nextStep = 'completed';
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        status: user.status,
        kycStatus: user.kyc_status,
        kycLevel: user.kyc_level,
        nextStep: nextStep,
        progress: stepProgress,
        registrationDate: user.created_at,
        hasAddress: !!user.profile_address,
        hasBvn: !!user.bvn,
        hasNin: !!user.nin
      }
    });

  } catch (error) {
    throw errors.internalError('Failed to get registration status');
  }
}));

export default router;