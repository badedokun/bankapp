import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac';
import { Pool } from 'pg';
import { AuthenticatedUser, TenantInfo } from '../types';

export interface RBACRequest extends Request {
  user?: AuthenticatedUser;
  tenant?: TenantInfo;
  rbac?: {
    permissions: Record<string, string>;
    roles: Array<{ roleCode: string; roleName: string; }>;
    isAdmin: boolean;
  };
}

/**
 * Middleware to load user's RBAC permissions
 */
export function loadRBACPermissions(pool: Pool) {
  const rbacService = new RBACService(pool);

  return async (req: RBACRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.tenant) {
        return next();
      }

      const tenantId = req.tenant.id;
      const userId = req.user.id;

      // Load user roles and permissions
      const [userRoles, userPermissions] = await Promise.all([
        rbacService.getUserRoles(tenantId, userId),
        rbacService.getUserPermissions(tenantId, userId)
      ]);

      // Check if user is admin (CEO, platform admin, etc.)
      const isAdmin = userRoles.some(role =>
        ['ceo', 'platform_admin', 'tenant_admin'].includes(role.roleCode)
      );

      // Attach RBAC data to request
      req.rbac = {
        permissions: userPermissions,
        roles: userRoles.map(r => ({ roleCode: r.roleCode, roleName: r.roleName })),
        isAdmin
      };

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      next(); // Continue without RBAC data in case of error
    }
  };
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permissionCode: string, level: 'read' | 'write' | 'full' = 'read') {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const tenantId = req.tenant.id;
      const userId = req.user.id;

      // Check if we have RBAC data
      if (!req.rbac) {
        return res.status(500).json({
          success: false,
          error: 'RBAC not initialized'
        });
      }

      // Admin bypass
      if (req.rbac.isAdmin) {
        return next();
      }

      // Check permission level
      const userPermissionLevel = req.rbac.permissions[permissionCode];

      if (!userPermissionLevel || userPermissionLevel === 'none') {
        // Log the permission denial
        const pool = (req as any).pool;
        if (pool) {
          const rbacService = new RBACService(pool);
          await rbacService.logPermissionCheck(
            tenantId, userId, req.path, req.method, permissionCode,
            false, 'Permission not granted', {
              ip: req.ip,
              userAgent: req.get('User-Agent')
            }
          );
        }

        return res.status(403).json({
          success: false,
          error: `Access denied. Required permission: ${permissionCode}`,
          requiredPermission: permissionCode,
          requiredLevel: level
        });
      }

      // Check if permission level is sufficient
      const levelHierarchy = { 'read': 1, 'write': 2, 'full': 3 };
      const userLevel = levelHierarchy[userPermissionLevel as keyof typeof levelHierarchy] || 0;
      const requiredLevel = levelHierarchy[level];

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permission level. Required: ${level}, Current: ${userPermissionLevel}`,
          requiredPermission: permissionCode,
          requiredLevel: level,
          currentLevel: userPermissionLevel
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware to require any of multiple permissions (OR logic)
 */
export function requireAnyPermission(permissions: string[], level: 'read' | 'write' | 'full' = 'read') {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.rbac) {
        return res.status(500).json({
          success: false,
          error: 'RBAC not initialized'
        });
      }

      // Admin bypass
      if (req.rbac.isAdmin) {
        return next();
      }

      const levelHierarchy = { 'read': 1, 'write': 2, 'full': 3 };
      const requiredLevel = levelHierarchy[level];

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(permissionCode => {
        const userPermissionLevel = req.rbac!.permissions[permissionCode];
        if (!userPermissionLevel || userPermissionLevel === 'none') return false;

        const userLevel = levelHierarchy[userPermissionLevel as keyof typeof levelHierarchy] || 0;
        return userLevel >= requiredLevel;
      });

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required any of: ${permissions.join(', ')}`,
          requiredPermissions: permissions,
          requiredLevel: level
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(roleCodes: string | string[]) {
  const codes = Array.isArray(roleCodes) ? roleCodes : [roleCodes];

  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.rbac) {
        return res.status(500).json({
          success: false,
          error: 'RBAC not initialized'
        });
      }

      // Check if user has any of the required roles
      const hasRequiredRole = req.rbac.roles.some(role => codes.includes(role.roleCode));

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role: ${codes.join(' or ')}`,
          requiredRoles: codes,
          userRoles: req.rbac.roles.map(r => r.roleCode)
        });
      }

      return next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Role check failed'
      });
    }
  };
}

/**
 * Middleware for admin-only endpoints
 */
export function requireAdmin() {
  return async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.tenant) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!req.rbac) {
        return res.status(500).json({
          success: false,
          error: 'RBAC not initialized'
        });
      }

      if (!req.rbac.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
          userRoles: req.rbac.roles.map(r => r.roleCode)
        });
      }

      return next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Admin check failed'
      });
    }
  };
}