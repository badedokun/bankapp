/**
 * Multi-Tenant Middleware
 * Handles tenant detection and context setting
 */

import { query } from '../config/database';

/**
 * Extract tenant information from various sources
 * Priority order: JWT token > subdomain > header > query param > default
 * @param {Object} req - Express request object
 * @returns {string|null} Tenant identifier
 */
function extractTenantId(req) {
  // 1. From JWT token (highest priority)
  if (req.user && req.user.tenantId) {
    return req.user.tenantId;
  }

  // 2. From X-Tenant-ID header
  const headerTenant = req.headers['x-tenant-id'];
  if (headerTenant) {
    return headerTenant;
  }

  // 3. From subdomain (e.g., fmfb.orokii.com)
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // Map common subdomains to tenant names
  const subdomainToTenant = {
    'fmfb': 'fmfb',
    'localhost': process.env.DEFAULT_TENANT || 'fmfb', // Use env default
    'dev': process.env.DEFAULT_TENANT || 'fmfb',
    'bank-a': 'bank-a',
    'bank-b': 'bank-b', 
    'bank-c': 'bank-c',
    'admin': 'system-admin'
  };

  if (subdomainToTenant[subdomain]) {
    return subdomainToTenant[subdomain];
  }

  // 4. From query parameter
  const queryTenant = req.query.tenant;
  if (queryTenant) {
    return queryTenant;
  }

  // 5. Default tenant from environment
  return process.env.DEFAULT_TENANT || 'fmfb';
}

/**
 * Resolve tenant name to tenant UUID
 * @param {string} tenantIdentifier - Tenant name or UUID
 * @returns {Promise<Object|null>} Tenant information
 */
async function resolveTenant(tenantIdentifier) {
  try {
    // First try to find by name
    let result = await query(`
      SELECT id, name, display_name, status, tier, subdomain, custom_domain,
             configuration, branding, ai_configuration, security_settings
      FROM platform.tenants 
      WHERE name = $1 AND status = 'active'
    `, [tenantIdentifier]);

    // If not found by name, try by UUID
    if (result.rows.length === 0) {
      result = await query(`
        SELECT id, name, display_name, status, tier, subdomain, custom_domain,
               configuration, branding, ai_configuration, security_settings
        FROM platform.tenants 
        WHERE id = $1 AND status = 'active'
      `, [tenantIdentifier]);
    }

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error resolving tenant:', error.message);
    return null;
  }
}

/**
 * Multi-tenant middleware
 * Detects tenant context and adds tenant information to request
 */
async function tenantMiddleware(req, res, next) {
  try {
    const tenantIdentifier = extractTenantId(req);
    
    if (!tenantIdentifier) {
      return res.status(400).json({
        error: 'Tenant identifier required',
        code: 'NO_TENANT_ID',
        message: 'Please specify tenant via subdomain, header, or query parameter'
      });
    }

    // Resolve tenant information
    const tenant = await resolveTenant(tenantIdentifier);
    
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found or inactive',
        code: 'TENANT_NOT_FOUND',
        tenant: tenantIdentifier
      });
    }

    // Add tenant information to request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      displayName: tenant.display_name,
      status: tenant.status,
      tier: tenant.tier,
      subdomain: tenant.subdomain,
      customDomain: tenant.custom_domain,
      configuration: tenant.configuration || {},
      branding: tenant.branding || {},
      aiConfiguration: tenant.ai_configuration || {},
      securitySettings: tenant.security_settings || {}
    };

    // Set tenant context for database queries (Row Level Security)
    req.tenantContext = tenant.id;

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error.message);
    return res.status(500).json({
      error: 'Tenant resolution failed',
      code: 'TENANT_SERVICE_ERROR'
    });
  }
}

/**
 * Tenant validation middleware
 * Ensures user belongs to the current tenant context
 */
function validateTenantAccess(req, res, next) {
  if (!req.user || !req.tenant) {
    return res.status(401).json({
      error: 'Authentication and tenant context required',
      code: 'AUTH_TENANT_REQUIRED'
    });
  }

  // Check if user belongs to the current tenant
  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({
      error: 'Access denied for this tenant',
      code: 'TENANT_ACCESS_DENIED',
      userTenant: req.user.tenantName,
      requestedTenant: req.tenant.name
    });
  }

  next();
}

/**
 * Tenant tier authorization middleware
 * @param {Array|string} requiredTiers - Required tenant tiers
 * @returns {Function} Middleware function
 */
function requireTenantTier(requiredTiers) {
  const tiers = Array.isArray(requiredTiers) ? requiredTiers : [requiredTiers];
  
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'Tenant context required',
        code: 'TENANT_CONTEXT_REQUIRED'
      });
    }

    if (!tiers.includes(req.tenant.tier)) {
      return res.status(403).json({
        error: 'Feature not available for your tenant tier',
        code: 'TIER_ACCESS_DENIED',
        required: tiers,
        current: req.tenant.tier
      });
    }

    next();
  };
}

/**
 * Feature flag middleware
 * @param {string} featureName - Feature flag name to check
 * @returns {Function} Middleware function
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: 'Tenant context required',
        code: 'TENANT_CONTEXT_REQUIRED'
      });
    }

    const featureFlags = req.tenant.configuration?.featureFlags || {};
    
    if (!featureFlags[featureName]) {
      return res.status(403).json({
        error: `Feature '${featureName}' is not enabled for your tenant`,
        code: 'FEATURE_DISABLED',
        feature: featureName,
        tenant: req.tenant.name
      });
    }

    next();
  };
}

/**
 * Get tenant-specific configuration
 * @param {Object} req - Express request object
 * @param {string} configPath - Configuration path (e.g., 'branding.primaryColor'
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Configuration value
 */
function getTenantConfig(req, configPath, defaultValue = null) {
  if (!req.tenant) {
    return defaultValue;
  }

  const paths = configPath.split('.');
  let current = req.tenant;

  for (const path of paths) {
    if (current && typeof current === 'object' && path in current) {
      current = current[path];
    } else {
      return defaultValue;
    }
  }

  return current !== undefined ? current : defaultValue;
}

export default {
  extractTenantId,
  resolveTenant,
  tenantMiddleware,
  validateTenantAccess,
  requireTenantTier,
  requireFeature,
  getTenantConfig
};