"use strict";
/**
 * Tenant Assets API Routes
 * Handles serving Base64 stored assets as binary data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
/**
 * GET /api/tenants/:tenantId/assets/:assetType/:assetName
 * Serve tenant asset by converting Base64 back to binary
 */
router.get('/:tenantId/assets/:assetType/:assetName', async (req, res) => {
    try {
        const { tenantId, assetType, assetName = 'default' } = req.params;
        // Validate tenant ID format (basic UUID check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(tenantId)) {
            return res.status(400).json({ error: 'Invalid tenant ID format' });
        }
        // Validate asset type
        const validAssetTypes = ['logo', 'favicon', 'hero_image', 'background', 'icon', 'stylesheet'];
        if (!validAssetTypes.includes(assetType)) {
            return res.status(400).json({ error: 'Invalid asset type' });
        }
        // Query asset from database
        const result = await (0, database_1.query)(`
      SELECT asset_data, mime_type, file_size, dimensions, metadata
      FROM platform.tenant_assets ta
      JOIN platform.tenants t ON ta.tenant_id = t.id
      WHERE t.id = $1 AND ta.asset_type = $2 AND ta.asset_name = $3
    `, [tenantId, assetType, assetName]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Asset not found',
                tenant: tenantId,
                assetType,
                assetName
            });
        }
        const asset = result.rows[0];
        // Convert Base64 back to binary
        const binaryData = Buffer.from(asset.asset_data, 'base64');
        // Set appropriate headers
        res.set({
            'Content-Type': asset.mime_type,
            'Content-Length': binaryData.length,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'ETag': `"${tenantId}-${assetType}-${assetName}"`,
            'Last-Modified': new Date().toUTCString()
        });
        // Send binary data
        res.send(binaryData);
    }
    catch (error) {
        console.error('Error serving tenant asset:', error);
        res.status(500).json({
            error: 'Failed to serve asset',
            message: error.message
        });
    }
});
/**
 * GET /api/tenants/:tenantName/assets/:assetType/:assetName
 * Serve tenant asset by tenant name instead of ID
 */
router.get('/by-name/:tenantName/assets/:assetType/:assetName', async (req, res) => {
    try {
        const { tenantName, assetType, assetName = 'default' } = req.params;
        // Validate asset type
        const validAssetTypes = ['logo', 'favicon', 'hero_image', 'background', 'icon', 'stylesheet'];
        if (!validAssetTypes.includes(assetType)) {
            return res.status(400).json({ error: 'Invalid asset type' });
        }
        // Query asset from database using tenant name
        const result = await (0, database_1.query)(`
      SELECT ta.asset_data, ta.mime_type, ta.file_size, ta.dimensions, ta.metadata, t.id as tenant_id
      FROM platform.tenant_assets ta
      JOIN platform.tenants t ON ta.tenant_id = t.id
      WHERE t.name = $1 AND ta.asset_type = $2 AND ta.asset_name = $3 AND t.status = 'active'
    `, [tenantName, assetType, assetName]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Asset not found',
                tenant: tenantName,
                assetType,
                assetName
            });
        }
        const asset = result.rows[0];
        // Convert Base64 back to binary
        const binaryData = Buffer.from(asset.asset_data, 'base64');
        // Set appropriate headers
        res.set({
            'Content-Type': asset.mime_type,
            'Content-Length': binaryData.length,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'ETag': `"${tenantName}-${assetType}-${assetName}"`,
            'Last-Modified': new Date().toUTCString()
        });
        // Send binary data
        res.send(binaryData);
    }
    catch (error) {
        console.error('Error serving tenant asset by name:', error);
        res.status(500).json({
            error: 'Failed to serve asset',
            message: error.message
        });
    }
});
/**
 * POST /api/tenants/:tenantId/assets
 * Upload new asset (admin only)
 */
router.post('/:tenantId/assets', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { assetType, assetName, assetData, mimeType, dimensions, metadata } = req.body;
        // Validate required fields
        if (!assetType || !assetName || !assetData || !mimeType) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['assetType', 'assetName', 'assetData', 'mimeType']
            });
        }
        // Calculate file size from Base64
        const fileSize = Math.floor(assetData.length * 0.75); // Approximate binary size
        // Insert or update asset
        await (0, database_1.query)(`
      INSERT INTO platform.tenant_assets (
        tenant_id, asset_type, asset_name, asset_data, mime_type, file_size, dimensions, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id, asset_type, asset_name) 
      DO UPDATE SET 
        asset_data = EXCLUDED.asset_data,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size,
        dimensions = EXCLUDED.dimensions,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId, assetType, assetName, assetData, mimeType, fileSize, dimensions, metadata]);
        res.json({
            success: true,
            message: 'Asset uploaded successfully',
            assetUrl: `/api/tenants/${tenantId}/assets/${assetType}/${assetName}`
        });
    }
    catch (error) {
        console.error('Error uploading tenant asset:', error);
        res.status(500).json({
            error: 'Failed to upload asset',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=assets.js.map