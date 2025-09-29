"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
var RBACService = /** @class */ (function () {
    function RBACService(pool) {
        this.pool = pool;
    }
    /**
     * Get all roles assigned to a user
     */
    RBACService.prototype.getUserRoles = function (tenantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT\n        ur.role_id as \"roleId\",\n        r.code as \"roleCode\",\n        r.name as \"roleName\",\n        ur.assigned_at as \"assignedAt\",\n        ur.effective_from as \"effectiveFrom\",\n        ur.effective_to as \"effectiveTo\"\n      FROM tenant.rbac_user_roles ur\n      JOIN tenant.rbac_roles r ON ur.role_id = r.id\n      WHERE ur.tenant_id = $1\n      AND ur.user_id = $2\n      AND ur.is_active = true\n      AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())\n      AND (ur.effective_to IS NULL OR ur.effective_to > NOW())\n      ORDER BY r.level ASC\n    ";
                        return [4 /*yield*/, this.pool.query(query, [tenantId, userId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get user's permission level for a specific permission
     */
    RBACService.prototype.getUserPermissionLevel = function (tenantId, userId, permissionCode) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT tenant.get_user_permission_level($1, $2, $3) as permission_level\n    ";
                        return [4 /*yield*/, this.pool.query(query, [tenantId, userId, permissionCode])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.permission_level) || 'none'];
                }
            });
        });
    };
    /**
     * Check if user has specific permission
     */
    RBACService.prototype.checkUserPermission = function (tenantId, userId, permissionCode, resourceId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT tenant.check_user_permission($1, $2, $3, $4) as has_permission\n    ";
                        return [4 /*yield*/, this.pool.query(query, [tenantId, userId, permissionCode, resourceId])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.has_permission) || false];
                }
            });
        });
    };
    /**
     * Get all permissions for a user with their levels
     */
    RBACService.prototype.getUserPermissions = function (tenantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, permissions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT\n        p.code,\n        COALESCE(MAX(\n          CASE rp.permission_level\n            WHEN 'full' THEN 4\n            WHEN 'write' THEN 3\n            WHEN 'read' THEN 2\n            WHEN 'none' THEN 1\n            ELSE 0\n          END\n        ), 0) as max_level\n      FROM tenant.rbac_user_roles ur\n      JOIN tenant.rbac_role_permissions rp ON ur.role_id = rp.role_id\n      JOIN tenant.rbac_permissions p ON rp.permission_id = p.id\n      WHERE ur.tenant_id = $1\n      AND ur.user_id = $2\n      AND ur.is_active = true\n      AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())\n      AND (ur.effective_to IS NULL OR ur.effective_to > NOW())\n      AND rp.permission_level != 'none'\n      GROUP BY p.code\n    ";
                        return [4 /*yield*/, this.pool.query(query, [tenantId, userId])];
                    case 1:
                        result = _a.sent();
                        permissions = {};
                        result.rows.forEach(function (row) {
                            var level = row.max_level;
                            permissions[row.code] = level === 4 ? 'full' :
                                level === 3 ? 'write' :
                                    level === 2 ? 'read' : 'none';
                        });
                        return [2 /*return*/, permissions];
                }
            });
        });
    };
    /**
     * Get available banking features for a user based on their permissions
     */
    RBACService.prototype.getUserAvailableFeatures = function (tenantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, userQuery, userResult, legacyRole, isFullAccess, allFeatures, permissions, featurePermissionMap, available, restricted;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getUserRoles(tenantId, userId)];
                    case 1:
                        userRoles = _b.sent();
                        userQuery = "SELECT role FROM tenant.users WHERE id = $1 AND tenant_id = $2";
                        return [4 /*yield*/, this.pool.query(userQuery, [userId, tenantId])];
                    case 2:
                        userResult = _b.sent();
                        legacyRole = (_a = userResult.rows[0]) === null || _a === void 0 ? void 0 : _a.role;
                        isFullAccess = legacyRole === 'admin' || userRoles.some(function (role) {
                            return ['ceo', 'platform_admin', 'tenant_admin'].includes(role.roleCode);
                        });
                        allFeatures = [
                            'money_transfer', 'flexible_savings', 'target_savings', 'group_savings',
                            'locked_savings', 'save_as_you_transact', 'personal_loans', 'business_loans',
                            'quick_loans', 'bill_payments', 'kyc_onboarding', 'multi_account_management',
                            'transaction_management', 'transaction_reversal_system', 'external_transfers_nibss',
                            'external_transfers', // Added to match frontend
                            'complete_money_transfer', 'enhanced_money_transfer', 'rbac_management',
                            'tenant_management', 'platform_analytics', 'system_health'
                        ];
                        if (isFullAccess) {
                            return [2 /*return*/, {
                                    available: allFeatures,
                                    restricted: []
                                }];
                        }
                        return [4 /*yield*/, this.getUserPermissions(tenantId, userId)];
                    case 3:
                        permissions = _b.sent();
                        featurePermissionMap = {
                            'money_transfer': 'internal_transfers',
                            'external_transfers': 'external_transfers', // Direct mapping
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
                        available = [];
                        restricted = [];
                        allFeatures.forEach(function (feature) {
                            var requiredPermission = featurePermissionMap[feature] || feature;
                            var hasPermission = permissions[requiredPermission] && permissions[requiredPermission] !== 'none';
                            if (hasPermission) {
                                available.push(feature);
                            }
                            else {
                                restricted.push(feature);
                            }
                        });
                        return [2 /*return*/, { available: available, restricted: restricted }];
                }
            });
        });
    };
    /**
     * Log permission check for audit trail
     */
    RBACService.prototype.logPermissionCheck = function (tenantId, userId, resource, action, permissionCode, accessGranted, denialReason, requestContext) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO tenant.rbac_permission_audit (\n        tenant_id, user_id, resource, action, permission_code,\n        access_granted, denial_reason, request_context\n      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n    ";
                        return [4 /*yield*/, this.pool.query(query, [
                                tenantId, userId, resource, action, permissionCode,
                                accessGranted, denialReason, JSON.stringify(requestContext)
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assign role to user
     */
    RBACService.prototype.assignUserRole = function (tenantId, userId, roleCode, assignedBy, reason, effectiveFrom, effectiveTo) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO tenant.rbac_user_roles (\n        tenant_id, user_id, role_id, assigned_by, assignment_reason,\n        effective_from, effective_to\n      ) VALUES (\n        $1, $2,\n        (SELECT id FROM tenant.rbac_roles WHERE tenant_id = $1 AND code = $3),\n        $4, $5, $6, $7\n      )\n      ON CONFLICT (tenant_id, user_id, role_id)\n      DO UPDATE SET\n        is_active = true,\n        effective_from = EXCLUDED.effective_from,\n        effective_to = EXCLUDED.effective_to,\n        updated_at = NOW()\n    ";
                        return [4 /*yield*/, this.pool.query(query, [
                                tenantId, userId, roleCode, assignedBy, reason, effectiveFrom, effectiveTo
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove role from user
     */
    RBACService.prototype.removeUserRole = function (tenantId, userId, roleCode) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE tenant.rbac_user_roles\n      SET is_active = false, updated_at = NOW()\n      WHERE tenant_id = $1\n      AND user_id = $2\n      AND role_id = (SELECT id FROM tenant.rbac_roles WHERE tenant_id = $1 AND code = $3)\n    ";
                        return [4 /*yield*/, this.pool.query(query, [tenantId, userId, roleCode])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get role-based metrics for dashboard
     */
    RBACService.prototype.getRoleBasedMetrics = function (tenantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, permissions, isManager, canApproveTransfers, canManageLoans, _a;
            var _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getUserRoles(tenantId, userId)];
                    case 1:
                        userRoles = _d.sent();
                        return [4 /*yield*/, this.getUserPermissions(tenantId, userId)];
                    case 2:
                        permissions = _d.sent();
                        isManager = userRoles.some(function (role) {
                            return ['ceo', 'coo', 'cfo', 'branch_manager', 'operations_manager'].includes(role.roleCode);
                        });
                        canApproveTransfers = permissions['transfer_approval'] === 'full';
                        canManageLoans = permissions['loan_approval'] !== 'none';
                        _b = {};
                        if (!isManager) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getTenantUserCount(tenantId)];
                    case 3:
                        _a = _d.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = 0;
                        _d.label = 5;
                    case 5: return [2 /*return*/, (_b.totalUsers = _a,
                            _b.activeRoles = userRoles.length,
                            _b.permissionsCount = Object.keys(permissions).length,
                            _b.canApproveTransfers = canApproveTransfers,
                            _b.canManageLoans = canManageLoans,
                            _b.isManager = isManager,
                            _b.highestRole = ((_c = userRoles[0]) === null || _c === void 0 ? void 0 : _c.roleName) || 'No Role',
                            _b)];
                }
            });
        });
    };
    RBACService.prototype.getTenantUserCount = function (tenantId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT COUNT(*) as count FROM tenant.users WHERE tenant_id = $1";
                        return [4 /*yield*/, this.pool.query(query, [tenantId])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, parseInt(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.count) || '0')];
                }
            });
        });
    };
    return RBACService;
}());
exports.RBACService = RBACService;
