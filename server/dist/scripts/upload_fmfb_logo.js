"use strict";
/**
 * Upload FMFB Logo Script
 * Inserts the FMFB logo as Base64 into the tenant_assets table
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const pg_1 = require("pg");
// Database configuration
const pool = new pg_1.Pool({
    host: 'localhost',
    port: 5433,
    user: 'bisiadedokun',
    password: '',
    database: 'bank_app_platform'
});
async function uploadFMFBLogo() {
    try {
        console.log('📸 Reading FMFB logo file...');
        // Read the PNG file and convert to Base64
        const logoBuffer = fs.readFileSync('/tmp/fmfb_logo.png');
        const logoBase64 = logoBuffer.toString('base64');
        const fileSize = logoBuffer.length;
        console.log(`📏 Logo file size: ${fileSize} bytes`);
        // Get FMFB tenant ID
        console.log('🔍 Finding FMFB tenant...');
        const tenantResult = await pool.query(`
      SELECT id FROM platform.tenants WHERE name = 'fmfb'
    `);
        if (tenantResult.rows.length === 0) {
            throw new Error('FMFB tenant not found!');
        }
        const tenantId = tenantResult.rows[0].id;
        console.log(`🏦 FMFB Tenant ID: ${tenantId}`);
        // Insert logo into tenant_assets
        console.log('💾 Uploading logo to database...');
        await pool.query(`
      INSERT INTO platform.tenant_assets (
        tenant_id, 
        asset_type, 
        asset_name, 
        asset_data, 
        mime_type, 
        file_size,
        dimensions,
        metadata
      ) VALUES (
        $1,
        'logo',
        'default',
        $2,
        'image/png',
        $3,
        '{"width": 200, "height": 72}',
        '{"source": "https://firstmidasmfb.com", "description": "Official FMFB logo"}'
      ) ON CONFLICT (tenant_id, asset_type, asset_name) 
      DO UPDATE SET 
        asset_data = EXCLUDED.asset_data,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size,
        dimensions = EXCLUDED.dimensions,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId, logoBase64, fileSize]);
        console.log('✅ FMFB logo uploaded successfully!');
        console.log(`🌐 Logo URL: /api/tenants/by-name/fmfb/assets/logo/default`);
        console.log(`🌐 Direct URL: /api/tenants/${tenantId}/assets/logo/default`);
    }
    catch (error) {
        console.error('❌ Error uploading FMFB logo:', error.message);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
// Run the upload
uploadFMFBLogo();
//# sourceMappingURL=upload_fmfb_logo.js.map