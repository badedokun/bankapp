"use strict";
/**
 * Tenant Management Routes
 * Tenant information and configuration endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
/**
 * GET /api/tenants
 * Get list of all tenants (admin only)
 */
router.get('/', (0, auth_1.requireRole)(['admin']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, database_1.query)(`
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
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await (0, database_1.query)(`
    SELECT id, name, display_name, subdomain, custom_domain, status, tier,
           configuration, branding, ai_configuration, security_settings,
           created_at, updated_at
    FROM platform.tenants
    WHERE id = $1
  `, [id]);
    if (result.rows.length === 0) {
        throw errorHandler_1.errors.notFound('Tenant not found', 'TENANT_NOT_FOUND');
    }
    res.json({
        success: true,
        data: { tenant: result.rows[0] }
    });
}));
exports.default = router;
//# sourceMappingURL=tenants.js.map