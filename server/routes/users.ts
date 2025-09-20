/**
 * User Management Routes
 * User information and management endpoints
 */

import express from 'express';
import { query } from '../config/database';
import { requireRole } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/users
 * Get list of users in current tenant (admin only)
 */
router.get('/', requireRole(['admin']), asyncHandler(async (req, res) => {
  const result = await query(`
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
 * GET /api/users/:id
 * Get specific user information
 */
router.get('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(`
    SELECT id, email, phone_number, first_name, last_name, role, status,
           permissions, kyc_status, kyc_level, profile_data, created_at,
           last_login_at, updated_at
    FROM tenant.users
    WHERE id = $1 AND tenant_id = $2
  `, [id, req.user.tenantId]);

  if (result.rows.length === 0) {
    throw errors.notFound('User not found', 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { user: result.rows[0] }
  });
}));

export default router;