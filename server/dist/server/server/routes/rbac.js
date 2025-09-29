"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRBACRouter = createRBACRouter;
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../services/rbac");
const auth_1 = require("../middleware/auth");
const rbac_2 = require("../middleware/rbac");
function createRBACRouter(pool) {
    const router = express_1.default.Router();
    const rbacService = new rbac_1.RBACService(pool);
    // Apply middleware to all routes
    router.use(auth_1.authenticateToken);
    router.use((0, rbac_2.loadRBACPermissions)(pool));
    /**
     * GET /api/rbac/permissions - Get current user's permissions
     */
    router.get('/permissions', async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            const permissions = await rbacService.getUserPermissions(req.tenant.id, req.user.id);
            const roles = await rbacService.getUserRoles(req.tenant.id, req.user.id);
            res.json({
                success: true,
                data: {
                    permissions,
                    roles,
                    isAdmin: req.rbac?.isAdmin || false
                }
            });
        }
        catch (error) {
            console.error('Error getting user permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get permissions'
            });
        }
    });
    /**
     * GET /api/rbac/available-features - Get available banking features for user
     */
    router.get('/available-features', async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            const availableFeatures = await rbacService.getUserAvailableFeatures(req.tenant.id, req.user.id);
            res.json({
                success: true,
                data: availableFeatures
            });
        }
        catch (error) {
            console.error('Error getting available features:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get available features'
            });
        }
    });
    /**
     * GET /api/rbac/role-based-metrics - Get role-based dashboard metrics
     */
    router.get('/role-based-metrics', async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            const metrics = await rbacService.getRoleBasedMetrics(req.tenant.id, req.user.id);
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            console.error('Error getting role-based metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get metrics'
            });
        }
    });
    /**
     * POST /api/rbac/check-permission - Check if user has specific permission
     */
    router.post('/check-permission', async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            const { permissionCode, resourceId } = req.body;
            if (!permissionCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Permission code is required'
                });
            }
            const hasPermission = await rbacService.checkUserPermission(req.tenant.id, req.user.id, permissionCode, resourceId);
            const permissionLevel = await rbacService.getUserPermissionLevel(req.tenant.id, req.user.id, permissionCode);
            res.json({
                success: true,
                data: {
                    hasPermission,
                    permissionLevel,
                    permissionCode
                }
            });
        }
        catch (error) {
            console.error('Error checking permission:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check permission'
            });
        }
    });
    /**
     * GET /api/rbac/roles - Get all available roles (admin only)
     */
    router.get('/roles', (0, rbac_2.requirePermission)('role_management', 'read'), async (req, res) => {
        try {
            if (!req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }
            const query = `
        SELECT id, code, name, description, level, is_active, is_custom_role
        FROM tenant.rbac_roles
        WHERE tenant_id = $1
        ORDER BY level ASC, name ASC
      `;
            const result = await pool.query(query, [req.tenant.id]);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Error getting roles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get roles'
            });
        }
    });
    /**
     * POST /api/rbac/assign-role - Assign role to user (admin only)
     */
    router.post('/assign-role', (0, rbac_2.requirePermission)('role_management', 'write'), async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            const { userId, roleCode, reason, effectiveFrom, effectiveTo } = req.body;
            if (!userId || !roleCode) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID and role code are required'
                });
            }
            await rbacService.assignUserRole(req.tenant.id, userId, roleCode, req.user.id, reason, effectiveFrom ? new Date(effectiveFrom) : undefined, effectiveTo ? new Date(effectiveTo) : undefined);
            res.json({
                success: true,
                message: 'Role assigned successfully'
            });
        }
        catch (error) {
            console.error('Error assigning role:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to assign role'
            });
        }
    });
    /**
     * DELETE /api/rbac/remove-role - Remove role from user (admin only)
     */
    router.delete('/remove-role', (0, rbac_2.requirePermission)('role_management', 'write'), async (req, res) => {
        try {
            if (!req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }
            const { userId, roleCode } = req.body;
            if (!userId || !roleCode) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID and role code are required'
                });
            }
            await rbacService.removeUserRole(req.tenant.id, userId, roleCode);
            res.json({
                success: true,
                message: 'Role removed successfully'
            });
        }
        catch (error) {
            console.error('Error removing role:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to remove role'
            });
        }
    });
    /**
     * GET /api/rbac/audit-trail - Get permission audit trail (admin only)
     */
    router.get('/audit-trail', (0, rbac_2.requirePermission)('audit_trail_access', 'read'), async (req, res) => {
        try {
            if (!req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }
            const { page = 1, limit = 50, userId, resource, action } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = `
        SELECT
          a.id,
          a.user_id,
          u.email as user_email,
          a.resource,
          a.action,
          a.permission_code,
          a.access_granted,
          a.denial_reason,
          a.request_context,
          a.created_at
        FROM tenant.rbac_permission_audit a
        LEFT JOIN tenant.users u ON a.user_id = u.id
        WHERE a.tenant_id = $1
      `;
            const queryParams = [req.tenant.id];
            let paramCount = 1;
            if (userId) {
                queryParams.push(userId);
                query += ` AND a.user_id = $${++paramCount}`;
            }
            if (resource) {
                queryParams.push(resource);
                query += ` AND a.resource = $${++paramCount}`;
            }
            if (action) {
                queryParams.push(action);
                query += ` AND a.action = $${++paramCount}`;
            }
            query += ` ORDER BY a.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
            queryParams.push(limit.toString(), offset.toString());
            const result = await pool.query(query, queryParams);
            res.json({
                success: true,
                data: {
                    auditTrail: result.rows,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: result.rows.length
                    }
                }
            });
        }
        catch (error) {
            console.error('Error getting audit trail:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get audit trail'
            });
        }
    });
    // ===================================
    // ROLE AND PERMISSION MANAGEMENT API
    // ===================================
    /**
     * GET /api/rbac/admin/platform-roles - Get all platform roles (platform admin only)
     */
    router.get('/admin/platform-roles', (0, rbac_2.requirePermission)('platform_administration', 'read'), async (req, res) => {
        try {
            const query = `
        SELECT
          id, code, name, description, level, is_system_role,
          created_at, updated_at
        FROM platform.rbac_roles
        ORDER BY level ASC, name ASC
      `;
            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Error getting platform roles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get platform roles'
            });
        }
    });
    /**
     * GET /api/rbac/admin/platform-permissions - Get all platform permissions (platform admin only)
     */
    router.get('/admin/platform-permissions', (0, rbac_2.requirePermission)('platform_administration', 'read'), async (req, res) => {
        try {
            const query = `
        SELECT
          id, code, name, description, category, resource, action,
          is_system_permission, cbn_regulation_ref, nibss_requirement,
          created_at, updated_at
        FROM platform.rbac_permissions
        ORDER BY category ASC, code ASC
      `;
            const result = await pool.query(query);
            // Group by category for easier frontend handling
            const groupedPermissions = result.rows.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                    acc[permission.category] = [];
                }
                acc[permission.category].push(permission);
                return acc;
            }, {});
            res.json({
                success: true,
                data: {
                    permissions: result.rows,
                    groupedByCategory: groupedPermissions
                }
            });
        }
        catch (error) {
            console.error('Error getting platform permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get platform permissions'
            });
        }
    });
    /**
     * GET /api/rbac/admin/role-permissions/:roleCode - Get permissions for a specific role
     */
    router.get('/admin/role-permissions/:roleCode', (0, rbac_2.requirePermission)('role_management', 'read'), async (req, res) => {
        try {
            const { roleCode } = req.params;
            const { level = 'platform' } = req.query; // platform or tenant
            const schema = level === 'tenant' ? 'tenant' : 'platform';
            const roleFilter = level === 'tenant' && req.tenant ? `AND r.tenant_id = '${req.tenant.id}'` : '';
            const query = `
        SELECT
          r.id as role_id,
          r.code as role_code,
          r.name as role_name,
          p.code as permission_code,
          p.name as permission_name,
          p.category,
          rp.permission_level,
          p.description
        FROM ${schema}.rbac_roles r
        JOIN ${schema}.rbac_role_permissions rp ON r.id = rp.role_id
        JOIN ${schema}.rbac_permissions p ON rp.permission_id = p.id
        WHERE r.code = $1 ${roleFilter}
        ORDER BY p.category, p.code
      `;
            const result = await pool.query(query, [roleCode]);
            // Group by category
            const groupedPermissions = result.rows.reduce((acc, row) => {
                if (!acc[row.category]) {
                    acc[row.category] = [];
                }
                acc[row.category].push({
                    code: row.permission_code,
                    name: row.permission_name,
                    level: row.permission_level,
                    description: row.description
                });
                return acc;
            }, {});
            res.json({
                success: true,
                data: {
                    roleCode: roleCode,
                    roleName: result.rows[0]?.role_name || '',
                    permissions: result.rows,
                    groupedByCategory: groupedPermissions,
                    totalPermissions: result.rows.length
                }
            });
        }
        catch (error) {
            console.error('Error getting role permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get role permissions'
            });
        }
    });
    /**
     * PUT /api/rbac/admin/role-permissions/:roleCode - Update role permissions
     */
    router.put('/admin/role-permissions/:roleCode', (0, rbac_2.requirePermission)('role_management', 'write'), async (req, res) => {
        try {
            const { roleCode } = req.params;
            const { permissions, level = 'platform' } = req.body;
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    error: 'Permissions must be an array'
                });
            }
            const schema = level === 'tenant' ? 'tenant' : 'platform';
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // Get role ID
                const roleFilter = level === 'tenant' && req.tenant ? `AND tenant_id = '${req.tenant.id}'` : '';
                const roleQuery = `SELECT id FROM ${schema}.rbac_roles WHERE code = $1 ${roleFilter}`;
                const roleResult = await client.query(roleQuery, [roleCode]);
                if (roleResult.rows.length === 0) {
                    throw new Error('Role not found');
                }
                const roleId = roleResult.rows[0].id;
                // Clear existing permissions
                await client.query(`DELETE FROM ${schema}.rbac_role_permissions WHERE role_id = $1`, [roleId]);
                // Add new permissions
                for (const perm of permissions) {
                    const permQuery = `
            SELECT id FROM ${schema}.rbac_permissions WHERE code = $1
            ${level === 'tenant' && req.tenant ? `AND tenant_id = '${req.tenant.id}'` : ''}
          `;
                    const permResult = await client.query(permQuery, [perm.code]);
                    if (permResult.rows.length > 0) {
                        const insertQuery = level === 'tenant'
                            ? `INSERT INTO ${schema}.rbac_role_permissions (tenant_id, role_id, permission_id, permission_level) VALUES ($1, $2, $3, $4)`
                            : `INSERT INTO ${schema}.rbac_role_permissions (role_id, permission_id, permission_level) VALUES ($1, $2, $3)`;
                        const insertParams = level === 'tenant'
                            ? [req.tenant?.id, roleId, permResult.rows[0].id, perm.level || 'read']
                            : [roleId, permResult.rows[0].id, perm.level || 'read'];
                        await client.query(insertQuery, insertParams);
                    }
                }
                await client.query('COMMIT');
                res.json({
                    success: true,
                    message: `Role permissions updated for ${roleCode}`,
                    data: {
                        roleCode,
                        permissionsUpdated: permissions.length
                    }
                });
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error('Error updating role permissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update role permissions'
            });
        }
    });
    /**
     * GET /api/rbac/admin/users - Get all users with their roles (admin only)
     */
    router.get('/admin/users', (0, rbac_2.requirePermission)('user_management', 'read'), async (req, res) => {
        try {
            if (!req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }
            const { page = 1, limit = 50 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const query = `
        SELECT
          u.id,
          u.email,
          u.full_name,
          u.role as legacy_role,
          u.status,
          u.created_at,
          u.last_login_at,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'roleCode', r.code,
                'roleName', r.name,
                'level', r.level,
                'assignedAt', ur.assigned_at,
                'assignmentReason', ur.assignment_reason,
                'isActive', ur.is_active
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::json
          ) as rbac_roles
        FROM tenant.users u
        LEFT JOIN tenant.rbac_user_roles ur ON u.id = ur.user_id AND ur.is_active = true
        LEFT JOIN tenant.rbac_roles r ON ur.role_id = r.id
        WHERE u.tenant_id = $1
        GROUP BY u.id, u.email, u.full_name, u.role, u.status, u.created_at, u.last_login_at
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3
      `;
            const result = await pool.query(query, [req.tenant.id, Number(limit), offset]);
            res.json({
                success: true,
                data: {
                    users: result.rows,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: result.rows.length
                    }
                }
            });
        }
        catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get users'
            });
        }
    });
    /**
     * POST /api/rbac/admin/create-role - Create a new custom role (tenant admin only)
     */
    router.post('/admin/create-role', (0, rbac_2.requirePermission)('role_management', 'write'), async (req, res) => {
        try {
            if (!req.tenant || !req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context and authentication required'
                });
            }
            const { code, name, description, level, permissions = [] } = req.body;
            if (!code || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Role code and name are required'
                });
            }
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // Create the role
                const roleQuery = `
          INSERT INTO tenant.rbac_roles
          (tenant_id, code, name, description, level, is_active, is_custom_role, created_at, updated_at, created_by)
          VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW(), $6)
          RETURNING id, code, name
        `;
                const roleResult = await client.query(roleQuery, [
                    req.tenant.id, code, name, description || '', level || 3, req.user.id
                ]);
                const roleId = roleResult.rows[0].id;
                // Assign permissions if provided
                if (permissions.length > 0) {
                    for (const perm of permissions) {
                        const permQuery = `SELECT id FROM tenant.rbac_permissions WHERE code = $1 AND tenant_id = $2`;
                        const permResult = await client.query(permQuery, [perm.code, req.tenant.id]);
                        if (permResult.rows.length > 0) {
                            await client.query(`INSERT INTO tenant.rbac_role_permissions (tenant_id, role_id, permission_id, permission_level)
                 VALUES ($1, $2, $3, $4)`, [req.tenant.id, roleId, permResult.rows[0].id, perm.level || 'read']);
                        }
                    }
                }
                await client.query('COMMIT');
                res.json({
                    success: true,
                    message: 'Custom role created successfully',
                    data: {
                        role: roleResult.rows[0],
                        permissionsAssigned: permissions.length
                    }
                });
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error('Error creating role:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error && error.message.includes('duplicate key')
                    ? 'Role code already exists'
                    : 'Failed to create role'
            });
        }
    });
    /**
     * GET /api/rbac/admin/dashboard - Get RBAC management dashboard data
     */
    router.get('/admin/dashboard', (0, rbac_2.requirePermission)('role_management', 'read'), async (req, res) => {
        try {
            if (!req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Tenant context required'
                });
            }
            const dashboardQueries = await Promise.all([
                // Total users
                pool.query('SELECT COUNT(*) as count FROM tenant.users WHERE tenant_id = $1', [req.tenant.id]),
                // Active roles
                pool.query('SELECT COUNT(*) as count FROM tenant.rbac_roles WHERE tenant_id = $1 AND is_active = true', [req.tenant.id]),
                // Total permissions
                pool.query('SELECT COUNT(*) as count FROM tenant.rbac_permissions WHERE tenant_id = $1', [req.tenant.id]),
                // Recent role assignments
                pool.query(`
          SELECT
            u.email,
            r.name as role_name,
            ur.assigned_at,
            ur.assignment_reason
          FROM tenant.rbac_user_roles ur
          JOIN tenant.users u ON ur.user_id = u.id
          JOIN tenant.rbac_roles r ON ur.role_id = r.id
          WHERE ur.tenant_id = $1 AND ur.is_active = true
          ORDER BY ur.assigned_at DESC
          LIMIT 10
        `, [req.tenant.id]),
                // Role distribution
                pool.query(`
          SELECT
            r.name as role_name,
            r.level,
            COUNT(ur.user_id) as user_count
          FROM tenant.rbac_roles r
          LEFT JOIN tenant.rbac_user_roles ur ON r.id = ur.role_id AND ur.is_active = true
          WHERE r.tenant_id = $1 AND r.is_active = true
          GROUP BY r.id, r.name, r.level
          ORDER BY r.level, user_count DESC
        `, [req.tenant.id])
            ]);
            res.json({
                success: true,
                data: {
                    totalUsers: parseInt(dashboardQueries[0].rows[0].count),
                    activeRoles: parseInt(dashboardQueries[1].rows[0].count),
                    totalPermissions: parseInt(dashboardQueries[2].rows[0].count),
                    recentAssignments: dashboardQueries[3].rows,
                    roleDistribution: dashboardQueries[4].rows
                }
            });
        }
        catch (error) {
            console.error('Error getting RBAC dashboard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard data'
            });
        }
    });
    /**
     * GET /api/rbac/enhanced-dashboard-data - Get complete enhanced dashboard data for current user
     * Combines user context, permissions, available features, and role-based metrics
     */
    router.get('/enhanced-dashboard-data', async (req, res) => {
        try {
            if (!req.user || !req.tenant) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }
            // Get all necessary data in parallel for better performance
            const [userPermissions, userRoles, availableFeatures, roleBasedMetrics] = await Promise.all([
                rbacService.getUserPermissions(req.tenant.id, req.user.id),
                rbacService.getUserRoles(req.tenant.id, req.user.id),
                rbacService.getUserAvailableFeatures(req.tenant.id, req.user.id),
                rbacService.getRoleBasedMetrics(req.tenant.id, req.user.id)
            ]);
            // Get enhanced user profile
            const userQuery = `
        SELECT
          id, email, full_name, role, status,
          branch_id, department, created_at, last_login_at,
          tenant_id
        FROM tenant.users
        WHERE id = $1 AND tenant_id = $2
      `;
            const userResult = await pool.query(userQuery, [req.user.id, req.tenant.id]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            const user = userResult.rows[0];
            // Generate role-specific AI suggestions
            const aiSuggestions = generateRoleBasedAISuggestions(user.role, userPermissions);
            // Get pending approvals for this user's role
            const pendingApprovals = await getPendingApprovalsForUser(pool, req.tenant.id, req.user.id, user.role);
            // Combine all data for enhanced dashboard
            const enhancedDashboardData = {
                userContext: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    permissions: userPermissions,
                    tenantId: user.tenant_id,
                    branchId: user.branch_id,
                    department: user.department,
                    isActive: user.status === 'active',
                    lastLogin: user.last_login_at,
                    rbacRoles: userRoles
                },
                permissions: userPermissions,
                availableFeatures: availableFeatures.available,
                restrictedFeatures: availableFeatures.restricted,
                roleBasedMetrics,
                aiSuggestions,
                pendingApprovals,
                isAdmin: req.rbac?.isAdmin || false
            };
            res.json({
                success: true,
                data: enhancedDashboardData
            });
        }
        catch (error) {
            console.error('Error getting enhanced dashboard data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get enhanced dashboard data'
            });
        }
    });
    return router;
}
// Helper function to generate role-based AI suggestions
function generateRoleBasedAISuggestions(role, permissions) {
    const suggestions = [];
    // Platform admin suggestions
    if (role === 'admin' || role === 'platform_admin') {
        suggestions.push({
            id: 'platform_health_check',
            type: 'operations',
            icon: '⚡',
            title: 'System Performance Review',
            description: 'Platform performance is optimal. Consider scaling resources for peak hours.',
            priority: 'medium',
            roleSpecific: ['platform_admin', 'admin']
        });
        if (permissions['compliance_monitoring'] === 'full') {
            suggestions.push({
                id: 'compliance_update',
                type: 'compliance',
                icon: '📋',
                title: 'Monthly Compliance Review',
                description: 'CBN regulatory reports are due. Review compliance status and generate reports.',
                priority: 'high',
                roleSpecific: ['platform_admin', 'admin', 'compliance_officer']
            });
        }
    }
    // CEO/Executive suggestions
    if (role === 'ceo' || role === 'deputy_md') {
        suggestions.push({
            id: 'executive_dashboard',
            type: 'analysis',
            icon: '📊',
            title: 'Executive Performance Analysis',
            description: 'Review quarterly performance metrics and strategic initiatives progress.',
            priority: 'high',
            roleSpecific: ['ceo', 'deputy_md']
        });
    }
    // Branch manager suggestions
    if (role === 'branch_manager') {
        suggestions.push({
            id: 'branch_performance',
            type: 'operations',
            icon: '🏦',
            title: 'Branch Performance Review',
            description: 'Review branch metrics, staff performance, and customer satisfaction scores.',
            priority: 'medium',
            roleSpecific: ['branch_manager']
        });
    }
    // Customer service suggestions
    if (role === 'customer_service' || role === 'relationship_manager') {
        suggestions.push({
            id: 'customer_follow_up',
            type: 'customer',
            icon: '🤝',
            title: 'High-Value Customer Follow-up',
            description: 'Contact customers with balances above ₦1M for premium service enrollment.',
            priority: 'medium',
            roleSpecific: ['customer_service', 'relationship_manager']
        });
    }
    // Credit manager suggestions
    if (role === 'credit_manager' || role === 'loan_officer') {
        suggestions.push({
            id: 'loan_portfolio_review',
            type: 'analysis',
            icon: '💰',
            title: 'Loan Portfolio Analysis',
            description: 'Review loan performance, risk assessment, and recovery strategies.',
            priority: 'medium',
            roleSpecific: ['credit_manager', 'loan_officer']
        });
    }
    return suggestions;
}
// Helper function to get pending approvals for user's role
async function getPendingApprovalsForUser(pool, tenantId, userId, role) {
    // Only certain roles should see approval workflows
    const approvalRoles = ['admin', 'ceo', 'deputy_md', 'branch_manager', 'operations_manager', 'credit_manager'];
    if (!approvalRoles.includes(role)) {
        return [];
    }
    try {
        // Get pending high-value transfers that need approval
        const transferQuery = `
      SELECT
        'transfer' as type,
        id,
        amount,
        description,
        created_at,
        sender_id,
        (SELECT full_name FROM tenant.users WHERE id = sender_id) as requested_by
      FROM tenant.transfers
      WHERE tenant_id = $1
      AND amount > 1000000
      AND status = 'pending'
      AND requires_approval = true
      ORDER BY created_at DESC
      LIMIT 5
    `;
        const transferResult = await pool.query(transferQuery, [tenantId]);
        return transferResult.rows.map(row => ({
            id: `approval-transfer-${row.id}`,
            type: row.type,
            amount: row.amount,
            currency: 'NGN',
            description: row.description || 'High-value transfer requiring approval',
            requestedBy: row.requested_by,
            requestedAt: row.created_at,
            priority: row.amount > 5000000 ? 'high' : 'medium'
        }));
    }
    catch (error) {
        console.error('Error getting pending approvals:', error);
        return [];
    }
}
