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

export class RBACService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(tenantId: string, userId: string): Promise<UserRole[]> {
    const query = `
      SELECT
        ur.role_id as "roleId",
        r.code as "roleCode",
        r.name as "roleName",
        ur.assigned_at as "assignedAt",
        ur.effective_from as "effectiveFrom",
        ur.effective_to as "effectiveTo"
      FROM tenant.rbac_user_roles ur
      JOIN tenant.rbac_roles r ON ur.role_id = r.id
      WHERE ur.tenant_id = $1
      AND ur.user_id = $2
      AND ur.is_active = true
      AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
      AND (ur.effective_to IS NULL OR ur.effective_to > NOW())
      ORDER BY r.level ASC
    `;

    const result = await this.pool.query(query, [tenantId, userId]);
    return result.rows;
  }

  /**
   * Get user's permission level for a specific permission
   */
  async getUserPermissionLevel(
    tenantId: string,
    userId: string,
    permissionCode: string
  ): Promise<'none' | 'read' | 'write' | 'full'> {
    const query = `
      SELECT tenant.get_user_permission_level($1, $2, $3) as permission_level
    `;

    const result = await this.pool.query(query, [tenantId, userId, permissionCode]);
    return result.rows[0]?.permission_level || 'none';
  }

  /**
   * Check if user has specific permission
   */
  async checkUserPermission(
    tenantId: string,
    userId: string,
    permissionCode: string,
    resourceId?: string
  ): Promise<boolean> {
    const query = `
      SELECT tenant.check_user_permission($1, $2, $3, $4) as has_permission
    `;

    const result = await this.pool.query(query, [tenantId, userId, permissionCode, resourceId]);
    return result.rows[0]?.has_permission || false;
  }

  /**
   * Get all permissions for a user with their levels
   */
  async getUserPermissions(tenantId: string, userId: string): Promise<Record<string, string>> {
    const query = `
      SELECT
        p.code,
        COALESCE(MAX(
          CASE rp.permission_level
            WHEN 'full' THEN 4
            WHEN 'write' THEN 3
            WHEN 'read' THEN 2
            WHEN 'none' THEN 1
            ELSE 0
          END
        ), 0) as max_level
      FROM tenant.rbac_user_roles ur
      JOIN tenant.rbac_role_permissions rp ON ur.role_id = rp.role_id
      JOIN tenant.rbac_permissions p ON rp.permission_id = p.id
      WHERE ur.tenant_id = $1
      AND ur.user_id = $2
      AND ur.is_active = true
      AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
      AND (ur.effective_to IS NULL OR ur.effective_to > NOW())
      AND rp.permission_level != 'none'
      GROUP BY p.code
    `;

    const result = await this.pool.query(query, [tenantId, userId]);
    const permissions: Record<string, string> = {};

    result.rows.forEach(row => {
      const level = row.max_level;
      permissions[row.code] = level === 4 ? 'full' :
                             level === 3 ? 'write' :
                             level === 2 ? 'read' : 'none';
    });

    return permissions;
  }

  /**
   * Get available banking features for a user based on their permissions
   */
  async getUserAvailableFeatures(tenantId: string, userId: string): Promise<{
    available: string[];
    restricted: string[];
  }> {
    // Get user roles first
    const userRoles = await this.getUserRoles(tenantId, userId);

    // Check if user is CEO or admin (full access)
    const isFullAccess = userRoles.some(role =>
      ['ceo', 'platform_admin', 'tenant_admin'].includes(role.roleCode)
    );

    // All available banking features
    const allFeatures = [
      'money_transfer', 'flexible_savings', 'target_savings', 'group_savings',
      'locked_savings', 'save_as_you_transact', 'personal_loans', 'business_loans',
      'quick_loans', 'bill_payments', 'kyc_onboarding', 'multi_account_management',
      'transaction_management', 'transaction_reversal_system', 'external_transfers_nibss',
      'complete_money_transfer', 'enhanced_money_transfer', 'rbac_management',
      'tenant_management', 'platform_analytics', 'system_health'
    ];

    if (isFullAccess) {
      return {
        available: allFeatures,
        restricted: []
      };
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(tenantId, userId);

    // Map features to required permissions
    const featurePermissionMap: Record<string, string> = {
      'money_transfer': 'internal_transfers',
      'external_transfers_nibss': 'external_transfers',
      'complete_money_transfer': 'internal_transfers',
      'enhanced_money_transfer': 'bulk_transfers',
      'bulk_transfers': 'bulk_transfers', // Direct mapping for bulk transfers
      'transfer_templates': 'bulk_transfers', // Templates require bulk transfer permission
      'flexible_savings': 'flexible_savings',
      'target_savings': 'target_savings',
      'group_savings': 'group_savings',
      'locked_savings': 'locked_savings',
      'save_as_you_transact': 'save_as_you_transact',
      'save_as_transact': 'save_as_you_transact', // Alternative naming
      'personal_loans': 'personal_loans',
      'business_loans': 'business_loans',
      'quick_loans': 'quick_loans',
      'bill_payments': 'bill_payments',
      'kyc_onboarding': 'customer_onboarding',
      'multi_account_management': 'user_management',
      'user_management': 'user_management', // Direct mapping
      'transaction_management': 'transaction_monitoring',
      'transaction_reversal_system': 'transfer_reversal',
      'transaction_reversal': 'transfer_reversal', // Alternative naming
      'compliance_reports': 'generate_compliance_reports', // Map to compliance reporting
      'analytics_dashboard': 'multi_tenant_reporting', // Map to reporting permission
      'platform': 'platform_administration', // Generic platform access
      'compliance': 'generate_compliance_reports', // Generic compliance access
      'rbac_management': 'platform_administration',
      'tenant_management': 'tenant_management',
      'platform_analytics': 'multi_tenant_reporting',
      'system_health': 'system_configuration'
    };

    const available: string[] = [];
    const restricted: string[] = [];

    allFeatures.forEach(feature => {
      const requiredPermission = featurePermissionMap[feature] || feature;
      const hasPermission = permissions[requiredPermission] && permissions[requiredPermission] !== 'none';

      if (hasPermission) {
        available.push(feature);
      } else {
        restricted.push(feature);
      }
    });

    return { available, restricted };
  }

  /**
   * Log permission check for audit trail
   */
  async logPermissionCheck(
    tenantId: string,
    userId: string,
    resource: string,
    action: string,
    permissionCode: string,
    accessGranted: boolean,
    denialReason?: string,
    requestContext?: any
  ): Promise<void> {
    const query = `
      INSERT INTO tenant.rbac_permission_audit (
        tenant_id, user_id, resource, action, permission_code,
        access_granted, denial_reason, request_context
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.pool.query(query, [
      tenantId, userId, resource, action, permissionCode,
      accessGranted, denialReason, JSON.stringify(requestContext)
    ]);
  }

  /**
   * Assign role to user
   */
  async assignUserRole(
    tenantId: string,
    userId: string,
    roleCode: string,
    assignedBy: string,
    reason?: string,
    effectiveFrom?: Date,
    effectiveTo?: Date
  ): Promise<void> {
    const query = `
      INSERT INTO tenant.rbac_user_roles (
        tenant_id, user_id, role_id, assigned_by, assignment_reason,
        effective_from, effective_to
      ) VALUES (
        $1, $2,
        (SELECT id FROM tenant.rbac_roles WHERE tenant_id = $1 AND code = $3),
        $4, $5, $6, $7
      )
      ON CONFLICT (tenant_id, user_id, role_id)
      DO UPDATE SET
        is_active = true,
        effective_from = EXCLUDED.effective_from,
        effective_to = EXCLUDED.effective_to,
        updated_at = NOW()
    `;

    await this.pool.query(query, [
      tenantId, userId, roleCode, assignedBy, reason, effectiveFrom, effectiveTo
    ]);
  }

  /**
   * Remove role from user
   */
  async removeUserRole(
    tenantId: string,
    userId: string,
    roleCode: string
  ): Promise<void> {
    const query = `
      UPDATE tenant.rbac_user_roles
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = $1
      AND user_id = $2
      AND role_id = (SELECT id FROM tenant.rbac_roles WHERE tenant_id = $1 AND code = $3)
    `;

    await this.pool.query(query, [tenantId, userId, roleCode]);
  }

  /**
   * Get role-based metrics for dashboard
   */
  async getRoleBasedMetrics(tenantId: string, userId: string): Promise<any> {
    const userRoles = await this.getUserRoles(tenantId, userId);
    const permissions = await this.getUserPermissions(tenantId, userId);

    const isManager = userRoles.some(role =>
      ['ceo', 'coo', 'cfo', 'branch_manager', 'operations_manager'].includes(role.roleCode)
    );

    const canApproveTransfers = permissions['transfer_approval'] === 'full';
    const canManageLoans = permissions['loan_approval'] !== 'none';

    return {
      totalUsers: isManager ? await this.getTenantUserCount(tenantId) : 0,
      activeRoles: userRoles.length,
      permissionsCount: Object.keys(permissions).length,
      canApproveTransfers,
      canManageLoans,
      isManager,
      highestRole: userRoles[0]?.roleName || 'No Role'
    };
  }

  private async getTenantUserCount(tenantId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM tenant.users WHERE tenant_id = $1`;
    const result = await this.pool.query(query, [tenantId]);
    return parseInt(result.rows[0]?.count || '0');
  }
}