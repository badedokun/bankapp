-- Insert mock data into FMFB tenant database
-- Connect to tenant_fmfb_db and set tenant context

\c tenant_fmfb_db;
SET app.current_tenant_id = 'fmfb';

-- Insert mock users
INSERT INTO tenant.users (id, email, phone, first_name, last_name, password_hash, pin_hash, kyc_status, is_active, created_at, updated_at) VALUES
('user-001', 'john.doe@fmfb.com', '+234-801-234-5678', 'John', 'Doe', '$2b$10$hashedpassword1', '$2b$10$hashedpin1', 'verified', true, NOW() - INTERVAL '30 days', NOW()),
('user-002', 'jane.smith@fmfb.com', '+234-802-345-6789', 'Jane', 'Smith', '$2b$10$hashedpassword2', '$2b$10$hashedpin2', 'verified', true, NOW() - INTERVAL '25 days', NOW()),
('user-003', 'mike.johnson@fmfb.com', '+234-803-456-7890', 'Mike', 'Johnson', '$2b$10$hashedpassword3', '$2b$10$hashedpin3', 'pending', true, NOW() - INTERVAL '15 days', NOW()),
('user-004', 'sarah.wilson@fmfb.com', '+234-804-567-8901', 'Sarah', 'Wilson', '$2b$10$hashedpassword4', '$2b$10$hashedpin4', 'verified', true, NOW() - INTERVAL '20 days', NOW()),
('user-005', 'david.brown@fmfb.com', '+234-805-678-9012', 'David', 'Brown', '$2b$10$hashedpassword5', '$2b$10$hashedpin5', 'verified', false, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert mock wallets
INSERT INTO tenant.wallets (id, user_id, wallet_name, balance, currency, wallet_type, is_primary, is_active, created_at, updated_at) VALUES
('wallet-001', 'user-001', 'Main Wallet', 150000.00, 'NGN', 'savings', true, true, NOW() - INTERVAL '30 days', NOW()),
('wallet-002', 'user-001', 'Business Wallet', 75000.00, 'NGN', 'current', false, true, NOW() - INTERVAL '28 days', NOW()),
('wallet-003', 'user-002', 'Primary Wallet', 250000.00, 'NGN', 'savings', true, true, NOW() - INTERVAL '25 days', NOW()),
('wallet-004', 'user-003', 'Student Account', 45000.00, 'NGN', 'savings', true, true, NOW() - INTERVAL '15 days', NOW()),
('wallet-005', 'user-004', 'Investment Wallet', 500000.00, 'NGN', 'investment', true, true, NOW() - INTERVAL '20 days', NOW()),
('wallet-006', 'user-005', 'Checking Account', 25000.00, 'NGN', 'current', true, false, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert mock transactions
INSERT INTO tenant.transactions (id, from_wallet_id, to_wallet_id, amount, currency, transaction_type, status, reference, description, fee, created_at, updated_at) VALUES
('txn-001', 'wallet-001', 'wallet-003', 25000.00, 'NGN', 'transfer', 'completed', 'REF001234', 'Transfer to Jane Smith', 100.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('txn-002', 'wallet-003', 'wallet-001', 15000.00, 'NGN', 'transfer', 'completed', 'REF001235', 'Payment for services', 75.00, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('txn-003', 'wallet-005', 'wallet-004', 50000.00, 'NGN', 'transfer', 'completed', 'REF001236', 'Educational support', 200.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('txn-004', 'wallet-001', null, 10000.00, 'NGN', 'deposit', 'completed', 'REF001237', 'Bank deposit', 0.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('txn-005', null, 'wallet-003', 20000.00, 'NGN', 'withdrawal', 'completed', 'REF001238', 'ATM withdrawal', 50.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('txn-006', 'wallet-002', 'wallet-005', 35000.00, 'NGN', 'transfer', 'pending', 'REF001239', 'Investment transfer', 150.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('txn-007', 'wallet-004', 'wallet-001', 5000.00, 'NGN', 'transfer', 'failed', 'REF001240', 'Failed transaction', 25.00, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
('txn-008', 'wallet-003', 'wallet-002', 12000.00, 'NGN', 'transfer', 'completed', 'REF001241', 'Business payment', 60.00, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert mock wallet_transactions (linking transactions to wallets)
INSERT INTO tenant.wallet_transactions (wallet_id, transaction_id, transaction_type, amount, balance_after, created_at) VALUES
('wallet-001', 'txn-001', 'debit', -25000.00, 125000.00, NOW() - INTERVAL '5 days'),
('wallet-003', 'txn-001', 'credit', 25000.00, 275000.00, NOW() - INTERVAL '5 days'),
('wallet-003', 'txn-002', 'debit', -15000.00, 260000.00, NOW() - INTERVAL '4 days'),
('wallet-001', 'txn-002', 'credit', 15000.00, 140000.00, NOW() - INTERVAL '4 days'),
('wallet-005', 'txn-003', 'debit', -50000.00, 450000.00, NOW() - INTERVAL '3 days'),
('wallet-004', 'txn-003', 'credit', 50000.00, 95000.00, NOW() - INTERVAL '3 days'),
('wallet-001', 'txn-004', 'credit', 10000.00, 150000.00, NOW() - INTERVAL '7 days'),
('wallet-003', 'txn-005', 'debit', -20000.00, 240000.00, NOW() - INTERVAL '2 days'),
('wallet-002', 'txn-006', 'debit', -35000.00, 40000.00, NOW() - INTERVAL '1 day'),
('wallet-005', 'txn-006', 'credit', 35000.00, 535000.00, NOW() - INTERVAL '1 day'),
('wallet-001', 'txn-008', 'credit', 12000.00, 152000.00, NOW() - INTERVAL '12 hours'),
('wallet-002', 'txn-008', 'debit', -12000.00, 28000.00, NOW() - INTERVAL '12 hours')
ON CONFLICT (wallet_id, transaction_id) DO NOTHING;

-- Insert mock user sessions
INSERT INTO tenant.user_sessions (id, user_id, refresh_token, expires_at, is_active, device_info, ip_address, created_at) VALUES
('session-001', 'user-001', 'refresh_token_1234567890abcdef', NOW() + INTERVAL '30 days', true, '{"device": "iPhone 14", "os": "iOS 16.0"}', '192.168.1.100', NOW() - INTERVAL '2 hours'),
('session-002', 'user-002', 'refresh_token_2345678901bcdefg', NOW() + INTERVAL '30 days', true, '{"device": "Samsung Galaxy S23", "os": "Android 13"}', '192.168.1.101', NOW() - INTERVAL '1 hour'),
('session-003', 'user-003', 'refresh_token_3456789012cdefgh', NOW() + INTERVAL '30 days', false, '{"device": "Chrome Browser", "os": "Windows 11"}', '192.168.1.102', NOW() - INTERVAL '5 days'),
('session-004', 'user-004', 'refresh_token_4567890123defghi', NOW() + INTERVAL '30 days', true, '{"device": "iPad Pro", "os": "iPadOS 16.0"}', '192.168.1.103', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert mock notifications
INSERT INTO tenant.notifications (id, user_id, title, message, notification_type, is_read, created_at) VALUES
('notif-001', 'user-001', 'Transfer Successful', 'Your transfer of ₦25,000 to Jane Smith was successful', 'transaction', true, NOW() - INTERVAL '5 days'),
('notif-002', 'user-001', 'Payment Received', 'You received ₦15,000 from Jane Smith', 'transaction', false, NOW() - INTERVAL '4 days'),
('notif-003', 'user-002', 'Account Verification', 'Your account has been successfully verified', 'account', true, NOW() - INTERVAL '25 days'),
('notif-004', 'user-003', 'KYC Update Required', 'Please update your KYC documents to continue using services', 'account', false, NOW() - INTERVAL '3 days'),
('notif-005', 'user-004', 'Investment Update', 'Your investment wallet has earned ₦5,000 in returns', 'investment', false, NOW() - INTERVAL '1 day'),
('notif-006', 'user-001', 'Security Alert', 'New device login detected from Windows 11', 'security', true, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert mock fraud alerts
INSERT INTO tenant.fraud_alerts (id, user_id, transaction_id, alert_type, risk_score, status, description, created_at) VALUES
('fraud-001', 'user-005', 'txn-007', 'suspicious_amount', 85, 'investigated', 'Large transaction from inactive account', NOW() - INTERVAL '6 hours'),
('fraud-002', 'user-003', null, 'multiple_failed_login', 65, 'active', 'Multiple failed login attempts detected', NOW() - INTERVAL '2 days'),
('fraud-003', 'user-001', 'txn-008', 'unusual_time', 45, 'cleared', 'Transaction outside normal hours', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert mock documents
INSERT INTO tenant.documents (id, user_id, document_type, file_name, file_path, status, uploaded_at) VALUES
('doc-001', 'user-001', 'national_id', 'john_doe_id.jpg', '/uploads/fmfb/docs/john_doe_id.jpg', 'approved', NOW() - INTERVAL '30 days'),
('doc-002', 'user-001', 'proof_of_address', 'john_doe_address.pdf', '/uploads/fmfb/docs/john_doe_address.pdf', 'approved', NOW() - INTERVAL '30 days'),
('doc-003', 'user-002', 'national_id', 'jane_smith_id.jpg', '/uploads/fmfb/docs/jane_smith_id.jpg', 'approved', NOW() - INTERVAL '25 days'),
('doc-004', 'user-003', 'national_id', 'mike_johnson_id.jpg', '/uploads/fmfb/docs/mike_johnson_id.jpg', 'pending', NOW() - INTERVAL '15 days'),
('doc-005', 'user-004', 'national_id', 'sarah_wilson_id.jpg', '/uploads/fmfb/docs/sarah_wilson_id.jpg', 'approved', NOW() - INTERVAL '20 days'),
('doc-006', 'user-004', 'bank_statement', 'sarah_wilson_statement.pdf', '/uploads/fmfb/docs/sarah_wilson_statement.pdf', 'approved', NOW() - INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

-- Update tenant metadata
INSERT INTO tenant.tenant_metadata (key, value, created_at, updated_at) VALUES
('last_data_seed', NOW()::text, NOW(), NOW()),
('mock_data_version', '1.0', NOW(), NOW()),
('total_users', '5', NOW(), NOW()),
('total_wallets', '6', NOW(), NOW()),
('total_transactions', '8', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Reset tenant context
RESET app.current_tenant_id;

-- Display summary
SELECT 'FMFB Mock Data Insertion Complete' as status;
SELECT 'Users: ' || COUNT(*) as users_count FROM tenant.users;
SELECT 'Wallets: ' || COUNT(*) as wallets_count FROM tenant.wallets;
SELECT 'Transactions: ' || COUNT(*) as transactions_count FROM tenant.transactions;
SELECT 'Sessions: ' || COUNT(*) as sessions_count FROM tenant.user_sessions;
SELECT 'Notifications: ' || COUNT(*) as notifications_count FROM tenant.notifications;