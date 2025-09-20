"use strict";
/**
 * Database Setup Script
 * Sets up PostgreSQL database and runs migrations
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
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'bisiadedokun',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to default database first
};
const TARGET_DB = 'bank_app_platform';
async function setupDatabase() {
    console.log('🚀 Starting database setup...');
    // Connect to PostgreSQL
    const client = new pg_1.Client(DB_CONFIG);
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        // Create database if it doesn't exist
        try {
            await client.query(`CREATE DATABASE ${TARGET_DB}`);
            console.log(`✅ Created database: ${TARGET_DB}`);
        }
        catch (error) {
            if (error.code === '42P04') {
                console.log(`ℹ️  Database ${TARGET_DB} already exists`);
            }
            else {
                throw error;
            }
        }
        await client.end();
        // Connect to the target database
        const targetClient = new pg_1.Client({
            ...DB_CONFIG,
            database: TARGET_DB,
        });
        await targetClient.connect();
        console.log(`✅ Connected to ${TARGET_DB}`);
        // Run migrations
        await runMigrations(targetClient);
        await targetClient.end();
        console.log('🎉 Database setup completed successfully!');
    }
    catch (error) {
        console.error('❌ Database setup failed:', error.message);
        // Check if PostgreSQL is running
        if (error.code === 'ECONNREFUSED') {
            console.log('\n📝 Setup Instructions:');
            console.log('1. Install PostgreSQL: brew install postgresql (macOS)');
            console.log('2. Start PostgreSQL: brew services start postgresql');
            console.log('3. Create user: createuser -s postgres');
            console.log('4. Set password: psql -c "ALTER USER postgres PASSWORD \'postgres\';)"');
            console.log('5. Run this script again\n');
        }
        process.exit(1);
    }
}
async function runMigrations(client) {
    console.log('📦 Running database migrations...');
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    for (const file of migrationFiles) {
        console.log(`⚡ Running migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        try {
            // Handle VACUUM commands separately as they cannot run in transactions
            if (migrationSQL.includes('VACUUM')) {
                const sqlParts = migrationSQL.split('VACUUM');
                // Run everything before VACUUM in a transaction
                if (sqlParts[0].trim()) {
                    await client.query(sqlParts[0]);
                }
                // Run VACUUM commands outside transaction
                const vacuumCommands = 'VACUUM' + sqlParts.slice(1).join('VACUUM');
                const vacuumLines = vacuumCommands.split('\n').filter(line => line.trim().startsWith('VACUUM'));
                for (const vacuumLine of vacuumLines) {
                    if (vacuumLine.trim()) {
                        await client.query(vacuumLine.trim());
                    }
                }
            }
            else {
                await client.query(migrationSQL);
            }
            console.log(`✅ Migration completed: ${file}`);
        }
        catch (error) {
            console.error(`❌ Migration failed: ${file}`, error.message);
            throw error;
        }
    }
    console.log('✅ All migrations completed');
}
// Create sample data for FMFB
async function seedData() {
    console.log('🌱 Seeding initial data...');
    const client = new pg_1.Client({
        ...DB_CONFIG,
        database: TARGET_DB,
    });
    await client.connect();
    try {
        // Insert FMFB tenant
        await client.query(`
      INSERT INTO platform.tenants (
        name, 
        display_name, 
        subdomain, 
        custom_domain,
        status,
        tier,
        configuration
      ) VALUES (
        'fmfb',
        'Firstmidas Microfinance Bank',
        'fmfb',
        'fmfb.orokii.com',
        'active',
        'enterprise',
        '{
          "branding": {
            "primaryColor": "#010080",
            "secondaryColor": "#000060",
            "accentColor": "#DAA520",
            "logo": "https://firstmidasmfb.com/wp-content/uploads/2021/01/logomidas-e1609933219910.png"
          },
          "businessRules": {
            "transactionLimits": {
              "daily": {"amount": 1000000, "count": 50},
              "monthly": {"amount": 10000000, "count": 500},
              "perTransaction": {"minimum": 100, "maximum": 500000}
            }
          }
        }'::jsonb
      ) ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        configuration = EXCLUDED.configuration;
    `);
        // Get the FMFB tenant ID
        const tenantResult = await client.query(`
      SELECT id FROM platform.tenants WHERE name = 'fmfb' LIMIT 1;
    `);
        if (tenantResult.rows.length === 0) {
            console.log('❌ FMFB tenant not found');
            return;
        }
        const tenantId = tenantResult.rows[0].id;
        // Insert tenant metadata
        await client.query(`
      INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name)
      VALUES ($1, 'fmfb')
      ON CONFLICT (tenant_id) DO UPDATE SET 
        tenant_name = EXCLUDED.tenant_name;
    `, [tenantId]);
        // Insert demo users in the tenant schema
        await client.query(`
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
      ($1, 'demo@fmfb.com', '+2348012345678', 'Demo', 'User', crypt('Demo@123!', gen_salt('bf')), 'active', 'agent'),
      ($1, 'admin@fmfb.com', '+2348012345679', 'Admin', 'User', crypt('Admin@123!', gen_salt('bf')), 'active', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [tenantId]);
        // Get the inserted user IDs and create wallets
        const usersResult = await client.query(`
      SELECT id, email FROM tenant.users WHERE email IN ('demo@fmfb.com', 'admin@fmfb.com');
    `);
        for (const user of usersResult.rows) {
            await client.query(`
        INSERT INTO tenant.wallets (
          user_id,
          tenant_id,
          wallet_type,
          wallet_name,
          balance,
          available_balance
        ) VALUES ($1, $2, 'main', $3, 50000.00, 50000.00)
        ON CONFLICT (user_id, wallet_type) DO NOTHING;
      `, [user.id, tenantId, `${user.email.split('@')[0]} Main Wallet`]);
        }
        console.log('✅ Seed data inserted');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    }
    finally {
        await client.end();
    }
}
async function main() {
    try {
        await setupDatabase();
        await seedData();
        console.log('🎉 Database is ready for use!');
    }
    catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
exports.default = { setupDatabase, seedData };
//# sourceMappingURL=setup-database.js.map