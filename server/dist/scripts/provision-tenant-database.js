"use strict";
/**
 * Tenant Database Provisioning Script
 * Creates separate database for each tenant with proper isolation
 * Ensures regulatory compliance for banking operations
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
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Database configuration
const PLATFORM_DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USER || 'bisiadedokun',
    password: process.env.DB_PASSWORD || '',
    database: 'bank_app_platform'
};
const POSTGRES_CONFIG = {
    ...PLATFORM_DB_CONFIG,
    database: 'postgres' // For creating new databases
};
/**
 * Create a new database for a tenant
 */
async function createTenantDatabase(tenantName, tenantId) {
    const dbName = `tenant_${tenantName}_db`;
    const client = new pg_1.Client(POSTGRES_CONFIG);
    try {
        await client.connect();
        console.log(`\n📦 Creating database for tenant: ${tenantName}`);
        // Drop existing database if in development mode
        if (process.env.NODE_ENV === 'development') {
            try {
                await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
                console.log(`   Dropped existing database: ${dbName}`);
            }
            catch (error) {
                console.log(`   No existing database to drop`);
            }
        }
        // Create new database
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Created database: ${dbName}`);
        await client.end();
        // Apply tenant template schema
        await applyTenantSchema(dbName, tenantId, tenantName);
        return dbName;
    }
    catch (error) {
        await client.end();
        throw error;
    }
}
/**
 * Apply the tenant template schema to a tenant database
 */
async function applyTenantSchema(dbName, tenantId, tenantName) {
    const client = new pg_1.Client({
        ...PLATFORM_DB_CONFIG,
        database: dbName
    });
    try {
        await client.connect();
        console.log(`\n📝 Applying tenant schema to ${dbName}`);
        // Read the tenant template schema
        const templatePath = path.join(__dirname, '../database/migrations/002_tenant_template_schema.sql');
        let schemaSQL = fs.readFileSync(templatePath, 'utf8');
        // Split SQL into individual statements (handling VACUUM separately)
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (!statement)
                continue;
            // Skip VACUUM statements (will be handled separately)
            if (statement.toUpperCase().includes('VACUUM')) {
                continue;
            }
            try {
                await client.query(statement + ';');
            }
            catch (error) {
                console.error(`   Error executing statement ${i + 1}:`, error.message);
                // Continue with other statements
            }
        }
        // Insert tenant metadata
        await client.query(`
      INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name, schema_version)
      VALUES ($1, $2, '1.0')
      ON CONFLICT (tenant_id) DO UPDATE SET 
        tenant_name = EXCLUDED.tenant_name,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId, tenantName]);
        console.log(`✅ Applied tenant schema successfully`);
        await client.end();
    }
    catch (error) {
        await client.end();
        throw error;
    }
}
/**
 * Update platform database with tenant database connection info
 */
async function updateTenantRegistry(tenantName, tenantId, dbName) {
    const client = new pg_1.Client(PLATFORM_DB_CONFIG);
    try {
        await client.connect();
        console.log(`\n📄 Updating tenant registry`);
        // Update tenant record with database info
        await client.query(`
      UPDATE platform.tenants 
      SET 
        database_name = $1,
        database_host = $2,
        database_port = $3,
        connection_string = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
            dbName,
            PLATFORM_DB_CONFIG.host,
            PLATFORM_DB_CONFIG.port,
            `postgresql://${PLATFORM_DB_CONFIG.user}@${PLATFORM_DB_CONFIG.host}:${PLATFORM_DB_CONFIG.port}/${dbName}`,
            tenantId
        ]);
        console.log(`✅ Updated tenant registry`);
        await client.end();
    }
    catch (error) {
        await client.end();
        throw error;
    }
}
/**
 * Seed initial data for a tenant
 */
async function seedTenantData(dbName, tenantId, tenantName) {
    const client = new pg_1.Client({
        ...PLATFORM_DB_CONFIG,
        database: dbName
    });
    try {
        await client.connect();
        console.log(`\n🌱 Seeding initial data for ${tenantName}`);
        // Create demo users
        const userResult = await client.query(`
      INSERT INTO tenant.users (
        tenant_id,
        email,
        phone_number,
        first_name,
        last_name,
        password_hash,
        status,
        role
      ) VALUES 
      ($1, $2, '+2348012345678', 'Demo', 'User', crypt('Demo@123!', gen_salt('bf')), 'active', 'agent'),
      ($1, $3, '+2348012345679', 'Admin', 'User', crypt('Admin@123!', gen_salt('bf')), 'active', 'admin')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `, [tenantId, `demo@${tenantName}.com`, `admin@${tenantName}.com`]);
        // Create wallets for each user
        for (const user of userResult.rows) {
            await client.query(`
        INSERT INTO tenant.wallets (
          user_id,
          tenant_id,
          wallet_type,
          wallet_name,
          wallet_number,
          balance,
          available_balance
        ) VALUES ($1, $2, 'main', $3, $4, 50000.00, 50000.00)
        ON CONFLICT (user_id, wallet_type) DO NOTHING
      `, [
                user.id,
                tenantId,
                `${user.email.split('@')[0]} Main Wallet`,
                `${tenantName.toUpperCase()}${Date.now()}${Math.floor(Math.random() * 1000)}`
            ]);
        }
        console.log(`✅ Created ${userResult.rows.length} demo users with wallets`);
        await client.end();
    }
    catch (error) {
        await client.end();
        throw error;
    }
}
/**
 * Main provisioning function
 */
async function provisionTenant(tenantName) {
    const platformClient = new pg_1.Client(PLATFORM_DB_CONFIG);
    try {
        // Get tenant ID from platform database
        await platformClient.connect();
        const tenantResult = await platformClient.query(`
      SELECT id, name, display_name 
      FROM platform.tenants 
      WHERE name = $1
    `, [tenantName]);
        if (tenantResult.rows.length === 0) {
            throw new Error(`Tenant '${tenantName}' not found in platform database`);
        }
        const tenant = tenantResult.rows[0];
        await platformClient.end();
        console.log(`\n🏦 Provisioning Tenant: ${tenant.display_name}`);
        console.log(`   Tenant ID: ${tenant.id}`);
        console.log(`   Tenant Name: ${tenant.name}`);
        // Create tenant database
        const dbName = await createTenantDatabase(tenant.name, tenant.id);
        // Update tenant registry
        await updateTenantRegistry(tenant.name, tenant.id, dbName);
        // Seed initial data
        await seedTenantData(dbName, tenant.id, tenant.name);
        console.log(`\n✨ Successfully provisioned tenant: ${tenant.display_name}`);
        console.log(`   Database: ${dbName}`);
        console.log(`   Connection: postgresql://localhost:5433/${dbName}`);
        return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            databaseName: dbName
        };
    }
    catch (error) {
        console.error(`\n❌ Error provisioning tenant:`, error.message);
        await platformClient.end();
        throw error;
    }
}
/**
 * CLI handler
 */
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log(`
Usage: node provision-tenant-database.js <tenant-name>

Examples:
  node provision-tenant-database.js fmfb
  node provision-tenant-database.js bank-a
  node provision-tenant-database.js bank-b
    `);
        process.exit(1);
    }
    const tenantName = args[0];
    try {
        await provisionTenant(tenantName);
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
// Export for use in other scripts
exports.default = {
    provisionTenant,
    createTenantDatabase,
    applyTenantSchema,
    updateTenantRegistry,
    seedTenantData
};
// Run if called directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=provision-tenant-database.js.map