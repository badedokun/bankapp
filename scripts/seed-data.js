/**
 * Database Seeding Script
 * Seeds initial data for FMFB tenant
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'bisiadedokun',
  password: process.env.DB_PASSWORD || '',
  database: 'bank_app_platform',
};

async function seedData() {
  console.log('🌱 Seeding initial data...');
  
  const client = new Client(DB_CONFIG);
  
  await client.connect();
  
  try {
    // Get the FMFB tenant ID
    const tenantResult = await client.query(`
      SELECT id FROM platform.tenants WHERE name = 'fmfb' LIMIT 1;
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ FMFB tenant not found');
      return;
    }
    
    const tenantId = tenantResult.rows[0].id;
    console.log('✅ Found FMFB tenant:', tenantId);
    
    // Insert tenant metadata
    await client.query(`
      INSERT INTO tenant.tenant_metadata (tenant_id, tenant_name)
      VALUES ($1, 'fmfb')
      ON CONFLICT (tenant_id) DO UPDATE SET 
        tenant_name = EXCLUDED.tenant_name;
    `, [tenantId]);
    
    // Hash passwords using bcrypt
    const demoPasswordHash = await bcrypt.hash('Demo@123!', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123!', 10);
    
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
      ($1, 'demo@fmfb.com', '+2348012345678', 'Demo', 'User', $2, 'active', 'agent'),
      ($1, 'admin@fmfb.com', '+2348012345679', 'Admin', 'User', $3, 'active', 'admin')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP;
    `, [tenantId, demoPasswordHash, adminPasswordHash]);
    
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
    
    console.log('✅ Seed data inserted successfully');
    console.log('\n🎉 PostgreSQL database is ready for use!');
    console.log('📍 Database: orokii_money_transfer_platform');
    console.log('🌐 Port: 5433');
    console.log('\n👤 Demo Credentials:');
    console.log('   Email: demo@fmfb.com');
    console.log('   Password: Demo@123!');
    console.log('\n👑 Admin Credentials:');
    console.log('   Email: admin@fmfb.com');
    console.log('   Password: Admin@123!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎯 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedData };