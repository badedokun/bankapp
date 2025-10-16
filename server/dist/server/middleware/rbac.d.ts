import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthenticatedUser, TenantInfo } from '../types';
export interface RBACRequest extends Request {
    user?: AuthenticatedUser;
    tenant?: TenantInfo;
    rbac?: {
        permissions: Record<string, string>;
        roles: Array<{
            roleCode: string;
            roleName: string;
        }>;
        isAdmin: boolean;
    };
}
/**
 * Middleware to load user's RBAC permissions
 */
export declare function loadRBACPermissions(pool: Pool): (req: RBACRequest, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to require specific permission
 */
export declare function requirePermission(permissionCode: string, level?: 'read' | 'write' | 'full'): (req: RBACRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to require any of multiple permissions (OR logic)
 */
export declare function requireAnyPermission(permissions: string[], level?: 'read' | 'write' | 'full'): (req: RBACRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to require specific role
 */
export declare function requireRole(roleCodes: string | string[]): (req: RBACRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware for admin-only endpoints
 */
export declare function requireAdmin(): (req: RBACRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=rbac.d.ts.map