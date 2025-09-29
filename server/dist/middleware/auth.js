"use strict";
/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.extractToken = extractToken;
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
function generateToken(payload, options = {}) {
    const defaultOptions = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'orokiipay-api',
        audience: 'orokiipay-client'
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
}
/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, {
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
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'orokiipay-api',
            audience: 'orokiipay-client'
        });
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}
/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET, {
            issuer: 'orokiipay-api',
            audience: 'orokiipay-client'
        });
    }
    catch (error) {
        throw new Error('Invalid refresh token');
    }
}
/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token
 */
function extractToken(req) {
    var _a, _b;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Also check for token in cookies or query params for development
    return ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || ((_b = req.query) === null || _b === void 0 ? void 0 : _b.token) || null;
}
/**
 * Authentication middleware
 * Verifies JWT token and sets user information on request object
 */
async function authenticateToken(req, res, next) {
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
        const userResult = await (0, database_1.query)(`
      SELECT u.*, tm.tenant_name, t.display_name as tenant_display_name
      FROM tenant.users u
      JOIN tenant.tenant_metadata tm ON u.tenant_id = tm.tenant_id
      JOIN platform.tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND u.status = 'active'
    `, [decoded.userId]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'User not found or inactive',
                code: 'USER_NOT_FOUND'
            });
        }
        const user = userResult.rows[0];
        // Check if token tenant matches user tenant
        if (decoded.tenantId !== user.tenant_id) {
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
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000)
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
                expiredAt: error.expiredAt
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
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token) {
            return next();
        }
        // Try to authenticate, but continue if it fails
        await authenticateToken(req, res, next);
    }
    catch (error) {
        // Continue without authentication
        next();
    }
}
/**
 * Role-based authorization middleware
 * @param {Array|string} allowedRoles - Required roles
 * @returns {Function} Middleware function
 */
function requireRole(allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
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
        next();
    };
}
/**
 * Permission-based authorization middleware
 * @param {Array|string} requiredPermissions - Required permissions
 * @returns {Function} Middleware function
 */
function requirePermission(requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const userPermissions = req.user.permissions || [];
        const hasPermission = permissions.every(permission => userPermissions.includes(permission) || req.user.role === 'admin');
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'MISSING_PERMISSIONS',
                required: permissions,
                current: userPermissions
            });
        }
        next();
    };
}
exports.default = {
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
