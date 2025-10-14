/**
 * Tenant Management Routes
 * Tenant information and configuration endpoints
 */

import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { requireRole } from '../middleware/auth';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();
const publicRouter = express.Router(); // Public routes (no auth)

// In-memory cache for tenant lookups (TTL: 5 minutes)
const tenantCache = new Map<string, { tenantId: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/tenants/lookup
 * Public endpoint to get tenant ID from subdomain or custom domain
 * No authentication required - needed before login
 */
publicRouter.get('/lookup', asyncHandler(async (req: Request, res: Response)=> {
  const { subdomain, domain } = req.query;

  if (!subdomain && !domain) {
    throw errors.badRequest('Either subdomain or domain parameter is required', 'MISSING_PARAMETER');
  }

  const lookupKey = (subdomain as string) || (domain as string);

  // Check cache first
  const cached = tenantCache.get(lookupKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({
      success: true,
      data: { tenantId: cached.tenantId },
      cached: true
    });
  }

  // Query database
  let result;
  if (subdomain) {
    result = await query(`
      SELECT id, name, display_name, status
      FROM platform.tenants
      WHERE subdomain = $1 AND status = 'active'
      LIMIT 1
    `, [subdomain]);
  } else {
    result = await query(`
      SELECT id, name, display_name, status
      FROM platform.tenants
      WHERE (custom_domain = $1 OR subdomain = $1) AND status = 'active'
      LIMIT 1
    `, [domain]);
  }

  if (result.rows.length === 0) {
    throw errors.notFound('Tenant not found or inactive', 'TENANT_NOT_FOUND');
  }

  const tenant = result.rows[0];

  // Cache the result
  tenantCache.set(lookupKey, {
    tenantId: tenant.id,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    data: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      displayName: tenant.display_name
    },
    cached: false
  });
}));

/**
 * GET /api/tenants
 * Get list of all tenants (admin only)
 */
router.get('/', requireRole(['admin']), asyncHandler(async (_req, res) => {
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
router.get('/:id', asyncHandler(async (req: Request, res: Response)=> {
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
export { publicRouter };