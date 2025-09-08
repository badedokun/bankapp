/**
 * SQLite Database Setup Script
 * Creates local SQLite database with demo data
 */

import 'sqlite3'.verbose();
import 'path';
import 'crypto';

const DB_PATH = path.join(__dirname, '../database/orokii_banking.db';

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'orokii-salt', 10000, 64, 'sha512'.toString('hex';
}

async function setupSQLiteDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Setting up SQLite database...';)
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database';)
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;';

    // Create tables
    const schema = `
      -- Tenants table
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        subdomain TEXT NOT NULL UNIQUE,
        custom_domain TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'inactive', 'pending') DEFAULT 'pending',
        tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise') DEFAULT 'basic',
        configuration TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended') DEFAULT 'active',
        roles TEXT DEFAULT '["customer"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );

      -- Accounts table
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        account_number TEXT NOT NULL UNIQUE,
        account_type TEXT NOT NULL CHECK (account_type IN ('savings', 'current', 'fixed') DEFAULT 'savings',
        balance DECIMAL(15,2) DEFAULT 0.00,
        currency TEXT DEFAULT 'NGN',
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'closed') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        from_account_id TEXT,
        to_account_id TEXT,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdrawal', 'payment') DEFAULT 'transfer',
        amount DECIMAL(15,2) NOT NULL,
        currency TEXT DEFAULT 'NGN',
        description TEXT,
        reference TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_account_id) REFERENCES accounts (id),
        FOREIGN KEY (to_account_id) REFERENCES accounts (id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts (account_number);
      CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions (from_account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions (to_account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions (reference);
    `;

    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Error creating schema:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Database schema created';)

      // Insert sample data
      insertSampleData(db, resolve, reject);
    });
  });
}

function insertSampleData(db, resolve, reject) {
  console.log('🌱 Inserting sample data...';)

  const tenantId = 'fmfb-tenant-id';
  const userId = 'demo-user-id';
  const adminId = 'admin-user-id';

  db.serialize(() => {
    // Insert FMFB tenant
    db.run(`
      INSERT OR REPLACE INTO tenants (
        id, name, display_name, subdomain, custom_domain, status, tier, configuration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      'fmfb',
      'Firstmidas Microfinance Bank',
      'fmfb',
      'fmfb.orokii.com',
      'active',
      'enterprise',
      JSON.stringify({
        branding: {
          primaryColor: '#010080',
          secondaryColor: '#000060',
          accentColor: '#DAA520',
          logo: 'https://firstmidasmfb.com/wp-content/uploads/2021/01/logomidas-e1609933219910.png'
        },
        businessRules: {
          transactionLimits: {
            daily: { amount: 1000000, count: 50 },
            monthly: { amount: 10000000, count: 500 },
            perTransaction: { minimum: 100, maximum: 500000 }
          }
        }
      })
    ]);

    // Insert demo users
    db.run(`
      INSERT OR REPLACE INTO users (
        id, tenant_id, email, phone, first_name, last_name, password_hash, roles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      tenantId,
      'demo@fmfb.com',
      '+2348012345678',
      'Demo',
      'User',
      hashPassword('Demo@123!',
      JSON.stringify(['customer'])
    ]);

    db.run(`
      INSERT OR REPLACE INTO users (
        id, tenant_id, email, phone, first_name, last_name, password_hash, roles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      tenantId,
      'admin@fmfb.com',
      '+2348012345679',
      'Admin',
      'User',
      hashPassword('Admin@123!',
      JSON.stringify(['admin', 'customer'])
    ]);

    // Insert demo accounts
    db.run(`
      INSERT OR REPLACE INTO accounts (
        user_id, account_number, account_type, balance, status
      ) VALUES (?, ?, ?, ?, ?)
    `, [userId, '1234567890', 'savings', 50000.00, 'active']);

    db.run(`
      INSERT OR REPLACE INTO accounts (
        user_id, account_number, account_type, balance, status
      ) VALUES (?, ?, ?, ?, ?)
    `, [adminId, '0987654321', 'current', 250000.00, 'active']);

    // Insert sample transactions
    const transactionRef1 = 'TXN-' + Date.now() + '-1';
    const transactionRef2 = 'TXN-' + Date.now() + '-2';

    db.run(`
      INSERT OR REPLACE INTO transactions (
        from_account_id, to_account_id, transaction_type, amount, description, reference, status
      ) VALUES ()
        (SELECT id FROM accounts WHERE account_number = '1234567890',
        (SELECT id FROM accounts WHERE account_number = '0987654321',
        'transfer', 5000.00, 'Demo transfer', ?, 'completed'
      )
    `, [transactionRef1]);

    db.run(`
      INSERT OR REPLACE INTO transactions (
        to_account_id, transaction_type, amount, description, reference, status
      ) VALUES ()
        (SELECT id FROM accounts WHERE account_number = '1234567890',
        'deposit', 50000.00, 'Initial deposit', ?, 'completed'
      )
    `, [transactionRef2], (err) => {
      if (err) {
        console.error('❌ Error inserting sample data:', err.message);
        reject(err);
        return;
      }

      console.log('✅ Sample data inserted successfully';)
      console.log('\n🎉 SQLite database setup completed!';)
      console.log('📍 Database location:', DB_PATH);
      console.log('\n👤 Demo Credentials:';)
      console.log('   Email: demo@fmfb.com';)
      console.log('   Password: Demo@123!';)
      console.log('\n👑 Admin Credentials:';)
      console.log('   Email: admin@fmfb.com';)
      console.log('   Password: Admin@123!';)
      
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Database connection closed';)
        resolve();
      });
    });
  });
}

if (require.main === module) {
  setupSQLiteDatabase()
    .then(() => {
      console.log('🎯 Database ready for use!';)
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

export default { setupSQLiteDatabase };