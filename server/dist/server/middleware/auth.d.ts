/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
declare function generateToken(payload: string | object | Buffer, options?: Partial<SignOptions>): string;
/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
declare function generateRefreshToken(payload: string | object | Buffer): string;
/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
declare function verifyToken(token: string): string | jwt.JwtPayload;
/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
declare function verifyRefreshToken(token: string): string | jwt.JwtPayload;
/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token
 */
declare function extractToken(req: any): any;
/**
 * Authentication middleware
 * Verifies JWT token and sets user information on request object
 */
declare function authenticateToken(req: any, res: any, next: any): Promise<any>;
/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't return error if no token
 */
declare function optionalAuth(req: any, res: any, next: any): Promise<any>;
/**
 * Role-based authorization middleware
 * @param {Array|string} allowedRoles - Required roles
 * @returns {Function} Middleware function
 */
declare function requireRole(allowedRoles: string | string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Permission-based authorization middleware
 * @param {Array|string} requiredPermissions - Required permissions
 * @returns {Function} Middleware function
 */
declare function requirePermission(requiredPermissions: string | string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken, extractToken, authenticateToken, optionalAuth, requireRole, requirePermission };
declare const _default: {
    generateToken: typeof generateToken;
    generateRefreshToken: typeof generateRefreshToken;
    verifyToken: typeof verifyToken;
    verifyRefreshToken: typeof verifyRefreshToken;
    extractToken: typeof extractToken;
    authenticateToken: typeof authenticateToken;
    optionalAuth: typeof optionalAuth;
    requireRole: typeof requireRole;
    requirePermission: typeof requirePermission;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map