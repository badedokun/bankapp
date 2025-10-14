import { Pool } from 'pg';
export interface RBACPermission {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    resource: string;
    action: string;
}
export interface RBACRole {
    id: string;
    code: string;
    name: string;
    description: string;
    level: number;
}
export interface UserRole {
    roleId: string;
    roleCode: string;
    roleName: string;
    assignedAt: Date;
    effectiveFrom?: Date;
    effectiveTo?: Date;
}
export interface UserPermission {
    permissionCode: string;
    permissionLevel: 'none' | 'read' | 'write' | 'full';
    conditions?: any;
}
export declare class RBACService {
    private pool;
    constructor(pool: Pool);
    /**
     * Get all roles assigned to a user
     */
    getUserRoles(tenantId: string, userId: string): Promise<UserRole[]>;
    /**
     * Get user's permission level for a specific permission
     */
    getUserPermissionLevel(tenantId: string, userId: string, permissionCode: string): Promise<'none' | 'read' | 'write' | 'full'>;
    /**
     * Check if user has specific permission
     */
    checkUserPermission(tenantId: string, userId: string, permissionCode: string, resourceId?: string): Promise<boolean>;
    /**
     * Get all permissions for a user with their levels
     */
    getUserPermissions(tenantId: string, userId: string): Promise<Record<string, string>>;
    /**
     * Get available banking features for a user based on their permissions
     */
    getUserAvailableFeatures(tenantId: string, userId: string): Promise<{
        available: string[];
        restricted: string[];
    }>;
    /**
     * Log permission check for audit trail
     */
    logPermissionCheck(tenantId: string, userId: string, resource: string, action: string, permissionCode: string, accessGranted: boolean, denialReason?: string, requestContext?: any): Promise<void>;
    /**
     * Assign role to user
     */
    assignUserRole(tenantId: string, userId: string, roleCode: string, assignedBy: string, reason?: string, effectiveFrom?: Date, effectiveTo?: Date): Promise<void>;
    /**
     * Remove role from user
     */
    removeUserRole(tenantId: string, userId: string, roleCode: string): Promise<void>;
    /**
     * Get role-based metrics for dashboard
     */
    getRoleBasedMetrics(tenantId: string, userId: string): Promise<any>;
    private getTenantUserCount;
}
//# sourceMappingURL=rbac.d.ts.map