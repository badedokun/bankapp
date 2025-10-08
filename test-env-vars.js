const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...\n');

// Check shell environment BEFORE loading .env
console.log('1. Shell environment (before dotenv):');
console.log('   DB_PORT:', process.env.DB_PORT);
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('');

// Load .env file
require('dotenv').config();

// Check environment AFTER loading .env
console.log('2. Environment after dotenv.config():');
console.log('   DB_PORT:', process.env.DB_PORT);
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('');

// Read .env file directly
console.log('3. Reading .env file directly:');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.startsWith('DB_'));
envLines.forEach(line => console.log('   ' + line));
