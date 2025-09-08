/**
 * Tenant Management Routes
 * Tenant information and configuration endpoints
 */

import express from 'express';
import { query } from '../config/database';
import { requireRole } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/tenants
 * Get list of all tenants (admin only)
 */
router.get('/', requireRole(['admin']), asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT id, name, display_name, subdomain, custom_domain, status, tier,
           created_at, updated_at
    FROM platform.tenants
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: { tenants: result.rows }
  });
}));

/**
 * GET /api/tenants/:id
 * Get specific tenant information
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(`
    SELECT id, name, display_name, subdomain, custom_domain, status, tier,
           configuration, branding, ai_configuration, security_settings,
           created_at, updated_at
    FROM platform.tenants
    WHERE id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw errors.notFound('Tenant not found', 'TENANT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { tenant: result.rows[0] }
  });
}));

export default router;