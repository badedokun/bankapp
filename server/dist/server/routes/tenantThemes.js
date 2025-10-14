"use strict";
/**
 * Tenant Themes API Routes
 * Dynamic multi-tenant theme configuration endpoint
 * No hardcoded tenant data - themes loaded from database
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
// Database connection using existing config
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'bisiadedokun',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bank_app_platform',
    password: process.env.DB_PASSWORD || 'orokiipay_secure_banking_2024!@#',
    port: parseInt(process.env.DB_PORT || '5433'),
});
// Default OrokiiPay Platform Theme (Platform Owner)
const DEFAULT_THEME = {
    tenantId: 'platform',
    tenantCode: 'orokiipay',
    brandName: 'OrokiiPay',
    brandTagline: 'Digital Banking Platform',
    brandLogo: 'https://api.orokiipay.com/assets/logos/orokiipay-logo.png',
    currency: 'NGN',
    locale: 'en-NG',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
        decimal: '.',
        thousands: ',',
        precision: 2,
    },
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
const router = express_1.default.Router();
/**
 * GET /api/tenants/:tenantCode/theme
 * Fetch tenant-specific theme configuration
 *
 * @param {string} tenantCode - Tenant identifier (from subdomain, JWT, or env)
 * @returns {Object} Theme configuration object
 */
router.get('/:tenantCode', async (req, res) => {
    try {
        const { tenantCode } = req.params;
        // Return default theme for platform owner
        if (tenantCode === 'orokiipay' || tenantCode === 'platform') {
            return res.json(DEFAULT_THEME);
        }
        // Query tenant theme configuration from database (including currency, locale, timezone)
        const tenantQuery = `
      SELECT
        t.id as tenant_id,
        t.name as tenant_code,
        t.display_name as brand_name,
        t.subdomain,
        t.currency,
        t.locale,
        t.timezone,
        t.date_format,
        t.number_format,
        t.branding,
        t.brand_colors,
        t.brand_typography,
        t.brand_assets
      FROM platform.tenants t
      WHERE (t.name = $1 OR t.subdomain = $1) AND t.status = 'active'
    `;
        const result = await pool.query(tenantQuery, [tenantCode]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Tenant theme not found for: ${tenantCode}`,
                fallback: DEFAULT_THEME
            });
        }
        const tenant = result.rows[0];
        // Parse branding and brand_colors JSON data
        let branding = {};
        let brandColors = {};
        let brandTypography = {};
        let numberFormat = {};
        try {
            branding = typeof tenant.branding === 'string' ? JSON.parse(tenant.branding) : tenant.branding || {};
            brandColors = typeof tenant.brand_colors === 'string' ? JSON.parse(tenant.brand_colors) : tenant.brand_colors || {};
            brandTypography = typeof tenant.brand_typography === 'string' ? JSON.parse(tenant.brand_typography) : tenant.brand_typography || {};
            numberFormat = typeof tenant.number_format === 'string' ? JSON.parse(tenant.number_format) : tenant.number_format || {};
        }
        catch (error) {
            console.warn(`Failed to parse theme data for ${tenantCode}:`, error);
        }
        // Build theme configuration from database data
        const tenantTheme = {
            tenantId: tenant.tenant_id,
            tenantCode: tenant.tenant_code,
            brandName: tenant.brand_name,
            brandTagline: branding.tagline || branding.appTitle || 'Digital Banking Solutions',
            brandLogo: `/api/tenants/by-name/${tenant.tenant_code}/assets/logo/default`,
            currency: tenant.currency || DEFAULT_THEME.currency,
            locale: tenant.locale || DEFAULT_THEME.locale,
            timezone: tenant.timezone || DEFAULT_THEME.timezone,
            dateFormat: tenant.date_format || DEFAULT_THEME.dateFormat,
            numberFormat: {
                decimal: numberFormat.decimal || DEFAULT_THEME.numberFormat.decimal,
                thousands: numberFormat.thousands || DEFAULT_THEME.numberFormat.thousands,
                precision: numberFormat.precision || DEFAULT_THEME.numberFormat.precision,
            },
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
    }
    catch (error) {
        console.error('Error fetching tenant theme:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenant theme',
            fallback: DEFAULT_THEME
        });
    }
});
/**
 * GET /api/tenants
 * List all active tenants (for development/admin purposes)
 */
router.get('/', async (req, res) => {
    try {
        const tenantsQuery = `
      SELECT
        id,
        code,
        name,
        description,
        subdomain,
        is_active,
        created_at
      FROM platform.tenants
      WHERE is_active = true
      ORDER BY name
    `;
        const result = await pool.query(tenantsQuery);
        res.json({
            success: true,
            tenants: result.rows,
            total: result.rows.length
        });
    }
    catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tenants'
        });
    }
});
/**
 * Helper function to adjust color brightness
 * @param {string} color - Hex color code
 * @param {number} percent - Brightness adjustment percentage
 * @returns {string} Adjusted hex color
 */
function adjustColorBrightness(color, percent) {
    try {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
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
        const num = parseInt(color.replace('#', ''), 16);
        const R = num >> 16;
        const G = num >> 8 & 0x00FF;
        const B = num & 0x0000FF;
        return `rgba(${R}, ${G}, ${B}, ${opacity})`;
    }
    catch (error) {
        return `rgba(255, 255, 255, ${opacity})`; // Fallback to white with opacity
    }
}
exports.default = router;
//# sourceMappingURL=tenantThemes.js.map