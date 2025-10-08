const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'bisiadedokun',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_app_platform',
});

console.log('🔍 Testing connection with:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', parseInt(process.env.DB_PORT || '5432'));
console.log('  User:', process.env.DB_USER || 'bisiadedokun');
console.log('  Database:', process.env.DB_NAME || 'bank_app_platform');
console.log('');

pool.query('SELECT NOW() as time, current_database() as db, current_user as user')
  .then(result => {
    console.log('✅ Database connected successfully!');
    console.log('  Time:', result.rows[0].time);
    console.log('  Database:', result.rows[0].db);
    console.log('  User:', result.rows[0].user);
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database connection failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    pool.end();
    process.exit(1);
  });
