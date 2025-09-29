"use strict";
/**
 * User Management Routes
 * User information and management endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
/**
 * GET /api/users
 * Get list of users in current tenant (admin only)
 */
router.get('/', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, database_1.query)(`
    SELECT id, email, first_name, last_name, role, status, kyc_status,
           created_at, last_login_at
    FROM tenant.users
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [req.user.tenantId]);
    res.json({
        success: true,
        data: { users: result.rows }
    });
}));
/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, database_1.query)(`
    SELECT id, email, phone_number, first_name, last_name, role, status,
           permissions, kyc_status, kyc_level, profile_data, created_at,
           last_login_at, updated_at
    FROM tenant.users
    WHERE id = $1 AND tenant_id = $2
  `, [req.user.id, req.user.tenantId]);
    if (result.rows.length === 0) {
        throw errorHandler_1.errors.notFound('User not found', 'USER_NOT_FOUND');
    }
    res.json({
        success: true,
        data: result.rows[0]
    });
}));
/**
 * GET /api/users/:id
 * Get specific user information
 */
router.get('/:id', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await (0, database_1.query)(`
    SELECT id, email, phone_number, first_name, last_name, role, status,
           permissions, kyc_status, kyc_level, profile_data, created_at,
           last_login_at, updated_at
    FROM tenant.users
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.user.tenantId]);
    if (result.rows.length === 0) {
        throw errorHandler_1.errors.notFound('User not found', 'USER_NOT_FOUND');
    }
    res.json({
        success: true,
        data: { user: result.rows[0] }
    });
}));
exports.default = router;
