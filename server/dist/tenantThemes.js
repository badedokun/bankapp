"use strict";
/**
 * Tenant Themes API Routes
 * Dynamic multi-tenant theme configuration endpoint
 * No hardcoded tenant data - themes loaded from database
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var pg_1 = require("pg");
// Database connection using existing config
var pool = new pg_1.Pool({
    user: process.env.DB_USER || 'bisiadedokun',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bank_app_platform',
    password: process.env.DB_PASSWORD || 'orokiipay_secure_banking_2024!@#',
    port: parseInt(process.env.DB_PORT || '5433'),
});
// Default OrokiiPay Platform Theme (Platform Owner)
var DEFAULT_THEME = {
    tenantId: 'platform',
    tenantCode: 'orokiipay',
    brandName: 'OrokiiPay',
    brandTagline: 'Digital Banking Platform',
    brandLogo: 'https://api.orokiipay.com/assets/logos/orokiipay-logo.png',
    colors: {
        primary: '#6B46C1',
        primaryGradientStart: '#6B46C1',
        primaryGradientEnd: '#9333EA',
        secondary: '#10B981',
        accent: '#F59E0B',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        text: '#1F2937',
        textSecondary: '#6B7280',
        textLight: '#9CA3AF',
        background: '#F9FAFB',
        backgroundGradientStart: '#F3F4F6',
        backgroundGradientEnd: '#E5E7EB',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        glassBackground: 'rgba(255, 255, 255, 0.85)',
        glassBorder: 'rgba(255, 255, 255, 0.2)',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    layout: {
        borderRadius: 12,
        borderRadiusLarge: 20,
        spacing: 16,
        containerPadding: 20,
    }
};
var router = express_1.default.Router();
/**
 * GET /api/tenants/:tenantCode/theme
 * Fetch tenant-specific theme configuration
 *
 * @param {string} tenantCode - Tenant identifier (from subdomain, JWT, or env)
 * @returns {Object} Theme configuration object
 */
router.get('/:tenantCode', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantCode, tenantQuery, result, tenant, branding, brandColors, brandTypography, tenantTheme, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tenantCode = req.params.tenantCode;
                // Return default theme for platform owner
                if (tenantCode === 'orokiipay' || tenantCode === 'platform') {
                    return [2 /*return*/, res.json(DEFAULT_THEME)];
                }
                tenantQuery = "\n      SELECT\n        t.id as tenant_id,\n        t.name as tenant_code,\n        t.display_name as brand_name,\n        t.subdomain,\n        t.branding,\n        t.brand_colors,\n        t.brand_typography,\n        t.brand_assets\n      FROM platform.tenants t\n      WHERE (t.name = $1 OR t.subdomain = $1) AND t.status = 'active'\n    ";
                return [4 /*yield*/, pool.query(tenantQuery, [tenantCode])];
            case 1:
                result = _a.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: "Tenant theme not found for: ".concat(tenantCode),
                            fallback: DEFAULT_THEME
                        })];
                }
                tenant = result.rows[0];
                branding = {};
                brandColors = {};
                brandTypography = {};
                try {
                    branding = typeof tenant.branding === 'string' ? JSON.parse(tenant.branding) : tenant.branding || {};
                    brandColors = typeof tenant.brand_colors === 'string' ? JSON.parse(tenant.brand_colors) : tenant.brand_colors || {};
                    brandTypography = typeof tenant.brand_typography === 'string' ? JSON.parse(tenant.brand_typography) : tenant.brand_typography || {};
                }
                catch (error) {
                    console.warn("Failed to parse theme data for ".concat(tenantCode, ":"), error);
                }
                tenantTheme = {
                    tenantId: tenant.tenant_id,
                    tenantCode: tenant.tenant_code,
                    brandName: tenant.brand_name,
                    brandTagline: branding.tagline || branding.appTitle || 'Digital Banking Solutions',
                    brandLogo: branding.logoUrl || "https://api.orokiipay.com/assets/logos/".concat(tenant.tenant_code, "-logo.png"),
                    colors: {
                        primary: brandColors.primary || branding.primaryColor || DEFAULT_THEME.colors.primary,
                        primaryGradientStart: brandColors.primary || branding.primaryColor || DEFAULT_THEME.colors.primary,
                        primaryGradientEnd: adjustColorBrightness(brandColors.primary || branding.primaryColor || DEFAULT_THEME.colors.primary, 20),
                        secondary: brandColors.secondary || branding.secondaryColor || DEFAULT_THEME.colors.secondary,
                        accent: brandColors.accent || branding.accentColor || DEFAULT_THEME.colors.accent,
                        success: brandColors.success || '#10B981',
                        warning: brandColors.warning || '#F59E0B',
                        danger: brandColors.error || '#EF4444',
                        info: brandColors.info || '#3B82F6',
                        text: brandColors.text || branding.textColor || DEFAULT_THEME.colors.text,
                        textSecondary: brandColors.textSecondary || '#6B7280',
                        textLight: '#9CA3AF',
                        background: brandColors.background || branding.backgroundColor || DEFAULT_THEME.colors.background,
                        backgroundGradientStart: adjustColorOpacity(brandColors.background || branding.backgroundColor || DEFAULT_THEME.colors.background, 0.1),
                        backgroundGradientEnd: adjustColorOpacity(brandColors.background || branding.backgroundColor || DEFAULT_THEME.colors.background, 0.05),
                        surface: brandColors.surface || '#FFFFFF',
                        border: '#E5E7EB',
                        glassBackground: 'rgba(255, 255, 255, 0.85)',
                        glassBorder: 'rgba(255, 255, 255, 0.2)',
                    },
                    typography: {
                        fontFamily: brandTypography.primaryFont || branding.fontFamily || DEFAULT_THEME.typography.fontFamily,
                    },
                    layout: {
                        borderRadius: parseInt(branding.borderRadius) || 12,
                        borderRadiusLarge: 20,
                        spacing: 16,
                        containerPadding: 20,
                    }
                };
                res.json(tenantTheme);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error fetching tenant theme:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error while fetching tenant theme',
                    fallback: DEFAULT_THEME
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/tenants
 * List all active tenants (for development/admin purposes)
 */
router.get('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tenantsQuery, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                tenantsQuery = "\n      SELECT\n        id,\n        code,\n        name,\n        description,\n        subdomain,\n        is_active,\n        created_at\n      FROM platform.tenants\n      WHERE is_active = true\n      ORDER BY name\n    ";
                return [4 /*yield*/, pool.query(tenantsQuery)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    tenants: result.rows,
                    total: result.rows.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching tenants:', error_2);
                res.status(500).json({
                    success: false,
                    message: 'Internal server error while fetching tenants'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * Helper function to adjust color brightness
 * @param {string} color - Hex color code
 * @param {number} percent - Brightness adjustment percentage
 * @returns {string} Adjusted hex color
 */
function adjustColorBrightness(color, percent) {
    try {
        var num = parseInt(color.replace('#', ''), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) + amt;
        var G = (num >> 8 & 0x00FF) + amt;
        var B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    catch (error) {
        return color; // Return original color if adjustment fails
    }
}
/**
 * Helper function to adjust color opacity
 * @param {string} color - Hex color code
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
function adjustColorOpacity(color, opacity) {
    try {
        var num = parseInt(color.replace('#', ''), 16);
        var R = num >> 16;
        var G = num >> 8 & 0x00FF;
        var B = num & 0x0000FF;
        return "rgba(".concat(R, ", ").concat(G, ", ").concat(B, ", ").concat(opacity, ")");
    }
    catch (error) {
        return "rgba(255, 255, 255, ".concat(opacity, ")"); // Fallback to white with opacity
    }
}
exports.default = router;
