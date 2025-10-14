/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
function generateToken(payload: string | object | Buffer, options: Partial<SignOptions> = {}) {
  const defaultOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'orokiipay-api',
    audience: 'orokiipay-client'
  };

  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload: string | object | Buffer) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
    issuer: 'orokiipay-api',
    audience: 'orokiipay-client'
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'orokiipay-api',
      audience: 'orokiipay-client'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: 'orokiipay-api',
      audience: 'orokiipay-client'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token
 */
function extractToken(req: any) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies or query params for development
  return req.cookies?.token || req.query?.token || null;
}

/**
 * Authentication middleware
 * Verifies JWT token and sets user information on request object
 */
async function authenticateToken(req: any, res: any, next: any) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const userResult = await query(`
      SELECT u.*, tm.tenant_name, t.display_name as tenant_display_name
      FROM tenant.users u
      JOIN tenant.tenant_metadata tm ON u.tenant_id = tm.tenant_id
      JOIN platform.tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND u.status = 'active'
    `, [(decoded as JwtPayload).userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    
    // Check if token tenant matches user tenant
    if ((decoded as JwtPayload).tenantId !== user.tenant_id) {
      return res.status(401).json({
        error: 'Invalid tenant context',
        code: 'TENANT_MISMATCH'
      });
    }

    // Add user information to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantDisplayName: user.tenant_display_name,
      permissions: user.permissions || [],
      mfaEnabled: user.mfa_enabled,
      biometricEnabled: user.biometric_enabled,
      kycStatus: user.kyc_status,
      kycLevel: user.kyc_level
    };

    req.token = {
      raw: token,
      payload: decoded,
      issuedAt: new Date((decoded as JwtPayload).iat! * 1000),
      expiresAt: new Date((decoded as JwtPayload).exp! * 1000)
    };

    next();
  } catch (error) {
    console.error('Authentication error:', (error as Error).message);
    
    if ((error as Error).name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: (error as any).expiredAt
      });
    }

    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
}

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't return error if no token
 */
async function optionalAuth(req: any, res: any, next: any) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    // Try to authenticate, but continue if it fails
    await authenticateToken(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 * @param {Array|string} allowedRoles - Required roles
 * @returns {Function} Middleware function
 */
function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    return next();
  };
}

/**
 * Permission-based authorization middleware
 * @param {Array|string} requiredPermissions - Required permissions
 * @returns {Function} Middleware function
 */
function requirePermission(requiredPermissions: string | string[]) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(permission =>
      userPermissions.includes(permission) || req.user?.role === 'admin'
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'MISSING_PERMISSIONS',
        required: permissions,
        current: userPermissions
      });
    }

    return next();
  };
}

export { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  verifyRefreshToken, 
  extractToken, 
  authenticateToken, 
  optionalAuth, 
  requireRole, 
  requirePermission 
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission
};