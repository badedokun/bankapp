const { Pool } = require('pg');
require('dotenv').config();

// Try connecting to tenant_fmfb_db instead
const tenantPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER || 'bisiadedokun',
  password: process.env.DB_PASSWORD || '',
  database: 'tenant_fmfb_db', // Try FMFB tenant database
});

console.log('🔍 Testing FMFB tenant database connection:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', parseInt(process.env.DB_PORT || '5433'));
console.log('  User:', process.env.DB_USER || 'bisiadedokun');
console.log('  Database: tenant_fmfb_db');
console.log('');

tenantPool.query('SELECT NOW() as time, current_database() as db, current_user as user')
  .then(result => {
    console.log('✅ Tenant database connected successfully!');
    console.log('  Time:', result.rows[0].time);
    console.log('  Database:', result.rows[0].db);
    console.log('  User:', result.rows[0].user);
    return tenantPool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name");
  })
  .then(result => {
    console.log('\n📋 Available schemas:');
    result.rows.forEach(row => {
      console.log('  -', row.schema_name);
    });
    tenantPool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Tenant database connection failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    tenantPool.end();
    process.exit(1);
  });
