-- Insert mock data into FMFB tenant database (final corrected version)
-- Connect to tenant_fmfb_db and set tenant context

\c tenant_fmfb_db;
SET app.current_tenant_id = 'fmfb';

-- Use the actual FMFB tenant ID
DO $$
DECLARE
    fmfb_tenant_id UUID := '7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3';
BEGIN
    -- Insert mock users with proper column names and required fields
    INSERT INTO tenant.users (
        id, tenant_id, email, phone_number, password_hash, first_name, last_name, 
        role, status, kyc_status, created_at, updated_at
    ) VALUES
    (
        '11111111-1111-1111-1111-111111111111', 
        fmfb_tenant_id,
        'john.doe@fmfb.com', 
        '+234-801-234-5678', 
        '$2b$10$hashedpassword1', 
        'John', 
        'Doe',
        'agent', 
        'active', 
        'completed', 
        NOW() - INTERVAL '30 days', 
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222', 
        fmfb_tenant_id,
        'jane.smith@fmfb.com', 
        '+234-802-345-6789', 
        '$2b$10$hashedpassword2', 
        'Jane', 
        'Smith',
        'agent', 
        'active', 
        'completed', 
        NOW() - INTERVAL '25 days', 
        NOW()
    ),
    (
        '33333333-3333-3333-3333-333333333333', 
        fmfb_tenant_id,
        'mike.johnson@fmfb.com', 
        '+234-803-456-7890', 
        '$2b$10$hashedpassword3', 
        'Mike', 
        'Johnson',
        'agent', 
        'pending', 
        'pending', 
        NOW() - INTERVAL '15 days', 
        NOW()
    ),
    (
        '44444444-4444-4444-4444-444444444444', 
        fmfb_tenant_id,
        'sarah.wilson@fmfb.com', 
        '+234-804-567-8901', 
        '$2b$10$hashedpassword4', 
        'Sarah', 
        'Wilson',
        'agent', 
        'active', 
        'completed', 
        NOW() - INTERVAL '20 days', 
        NOW()
    ),
    (
        '55555555-5555-5555-5555-555555555555', 
        fmfb_tenant_id,
        'david.brown@fmfb.com', 
        '+234-805-678-9012', 
        '$2b$10$hashedpassword5', 
        'David', 
        'Brown',
        'agent', 
        'inactive', 
        'completed', 
        NOW() - INTERVAL '10 days', 
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock wallets with proper column names
    INSERT INTO tenant.wallets (
        id, user_id, tenant_id, wallet_number, wallet_type, wallet_name, 
        balance, available_balance, currency, is_active, created_at, updated_at
    ) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
        '11111111-1111-1111-1111-111111111111', 
        fmfb_tenant_id,
        'WAL001234567890', 
        'main', 
        'Main Wallet',
        150000.00, 
        150000.00, 
        'NGN', 
        true, 
        NOW() - INTERVAL '30 days', 
        NOW()
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
        '11111111-1111-1111-1111-111111111111', 
        fmfb_tenant_id,
        'WAL001234567891', 
        'business', 
        'Business Wallet',
        75000.00, 
        75000.00, 
        'NGN', 
        true, 
        NOW() - INTERVAL '28 days', 
        NOW()
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc', 
        '22222222-2222-2222-2222-222222222222', 
        fmfb_tenant_id,
        'WAL001234567892', 
        'main', 
        'Primary Wallet',
        250000.00, 
        250000.00, 
        'NGN', 
        true, 
        NOW() - INTERVAL '25 days', 
        NOW()
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd', 
        '33333333-3333-3333-3333-333333333333', 
        fmfb_tenant_id,
        'WAL001234567893', 
        'savings', 
        'Student Account',
        45000.00, 
        45000.00, 
        'NGN', 
        true, 
        NOW() - INTERVAL '15 days', 
        NOW()
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
        '44444444-4444-4444-4444-444444444444', 
        fmfb_tenant_id,
        'WAL001234567894', 
        'investment', 
        'Investment Wallet',
        500000.00, 
        500000.00, 
        'NGN', 
        true, 
        NOW() - INTERVAL '20 days', 
        NOW()
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff', 
        '55555555-5555-5555-5555-555555555555', 
        fmfb_tenant_id,
        'WAL001234567895', 
        'main', 
        'Checking Account',
        25000.00, 
        25000.00, 
        'NGN', 
        false, 
        NOW() - INTERVAL '10 days', 
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock transactions with proper column names
    INSERT INTO tenant.transactions (
        id, tenant_id, user_id, reference, type, amount, currency, description, 
        status, total_fees, created_at, processed_at
    ) VALUES
    (
        '11111111-aaaa-aaaa-aaaa-111111111111', 
        fmfb_tenant_id,
        '11111111-1111-1111-1111-111111111111', 
        'REF001234', 
        'money_transfer', 
        25000.00, 
        'NGN', 
        'Transfer to Jane Smith', 
        'completed', 
        100.00, 
        NOW() - INTERVAL '5 days', 
        NOW() - INTERVAL '5 days'
    ),
    (
        '22222222-bbbb-bbbb-bbbb-222222222222', 
        fmfb_tenant_id,
        '22222222-2222-2222-2222-222222222222', 
        'REF001235', 
        'money_transfer', 
        15000.00, 
        'NGN', 
        'Payment for services', 
        'completed', 
        75.00, 
        NOW() - INTERVAL '4 days', 
        NOW() - INTERVAL '4 days'
    ),
    (
        '33333333-cccc-cccc-cccc-333333333333', 
        fmfb_tenant_id,
        '44444444-4444-4444-4444-444444444444', 
        'REF001236', 
        'money_transfer', 
        50000.00, 
        'NGN', 
        'Educational support', 
        'completed', 
        200.00, 
        NOW() - INTERVAL '3 days', 
        NOW() - INTERVAL '3 days'
    ),
    (
        '44444444-dddd-dddd-dddd-444444444444', 
        fmfb_tenant_id,
        '11111111-1111-1111-1111-111111111111', 
        'REF001237', 
        'cash_withdrawal', 
        10000.00, 
        'NGN', 
        'Cash withdrawal', 
        'completed', 
        0.00, 
        NOW() - INTERVAL '7 days', 
        NOW() - INTERVAL '7 days'
    ),
    (
        '55555555-eeee-eeee-eeee-555555555555', 
        fmfb_tenant_id,
        '22222222-2222-2222-2222-222222222222', 
        'REF001238', 
        'cash_withdrawal', 
        20000.00, 
        'NGN', 
        'ATM withdrawal', 
        'completed', 
        50.00, 
        NOW() - INTERVAL '2 days', 
        NOW() - INTERVAL '2 days'
    ),
    (
        '66666666-ffff-ffff-ffff-666666666666', 
        fmfb_tenant_id,
        '11111111-1111-1111-1111-111111111111', 
        'REF001239', 
        'money_transfer', 
        35000.00, 
        'NGN', 
        'Investment transfer', 
        'pending', 
        150.00, 
        NOW() - INTERVAL '1 day', 
        NULL
    ),
    (
        '77777777-1111-1111-1111-777777777777', 
        fmfb_tenant_id,
        '33333333-3333-3333-3333-333333333333', 
        'REF001240', 
        'money_transfer', 
        5000.00, 
        'NGN', 
        'Failed transaction', 
        'failed', 
        25.00, 
        NOW() - INTERVAL '6 hours', 
        NOW() - INTERVAL '6 hours'
    ),
    (
        '88888888-2222-2222-2222-888888888888', 
        fmfb_tenant_id,
        '22222222-2222-2222-2222-222222222222', 
        'REF001241', 
        'bill_payment', 
        12000.00, 
        'NGN', 
        'Utility bill payment', 
        'completed', 
        60.00, 
        NOW() - INTERVAL '12 hours', 
        NOW() - INTERVAL '12 hours'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock wallet_transactions
    INSERT INTO tenant.wallet_transactions (wallet_id, transaction_id, transaction_type, amount, balance_after, created_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-aaaa-aaaa-111111111111', 'debit', -25000.00, 125000.00, NOW() - INTERVAL '5 days'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-bbbb-bbbb-bbbb-222222222222', 'credit', 15000.00, 265000.00, NOW() - INTERVAL '4 days'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-cccc-cccc-cccc-333333333333', 'debit', -50000.00, 450000.00, NOW() - INTERVAL '3 days'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-dddd-dddd-dddd-444444444444', 'debit', -10000.00, 115000.00, NOW() - INTERVAL '7 days'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-eeee-eeee-eeee-555555555555', 'debit', -20000.00, 245000.00, NOW() - INTERVAL '2 days')
    ON CONFLICT (wallet_id, transaction_id) DO NOTHING;

    -- Insert mock user sessions
    INSERT INTO tenant.user_sessions (
        id, user_id, refresh_token, expires_at, device_info, ip_address, created_at
    ) VALUES
    (
        '11111111-1111-1111-1111-aaaaaaaaaaaa', 
        '11111111-1111-1111-1111-111111111111', 
        'refresh_token_1234567890abcdef', 
        NOW() + INTERVAL '30 days', 
        '{"device": "iPhone 14", "os": "iOS 16.0"}', 
        '192.168.1.100', 
        NOW() - INTERVAL '2 hours'
    ),
    (
        '22222222-2222-2222-2222-bbbbbbbbbbbb', 
        '22222222-2222-2222-2222-222222222222', 
        'refresh_token_2345678901bcdefg', 
        NOW() + INTERVAL '30 days', 
        '{"device": "Samsung Galaxy S23", "os": "Android 13"}', 
        '192.168.1.101', 
        NOW() - INTERVAL '1 hour'
    ),
    (
        '33333333-3333-3333-3333-cccccccccccc', 
        '33333333-3333-3333-3333-333333333333', 
        'refresh_token_3456789012cdefgh', 
        NOW() + INTERVAL '30 days', 
        '{"device": "Chrome Browser", "os": "Windows 11"}', 
        '192.168.1.102', 
        NOW() - INTERVAL '5 days'
    ),
    (
        '44444444-4444-4444-4444-dddddddddddd', 
        '44444444-4444-4444-4444-444444444444', 
        'refresh_token_4567890123defghi', 
        NOW() + INTERVAL '30 days', 
        '{"device": "iPad Pro", "os": "iPadOS 16.0"}', 
        '192.168.1.103', 
        NOW() - INTERVAL '30 minutes'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock notifications
    INSERT INTO tenant.notifications (
        id, user_id, title, message, category, is_read, created_at
    ) VALUES
    (
        '11111111-1111-aaaa-aaaa-111111111111', 
        '11111111-1111-1111-1111-111111111111', 
        'Transfer Successful', 
        'Your transfer of ₦25,000 to Jane Smith was successful', 
        'transaction', 
        true, 
        NOW() - INTERVAL '5 days'
    ),
    (
        '22222222-2222-bbbb-bbbb-222222222222', 
        '11111111-1111-1111-1111-111111111111', 
        'Payment Received', 
        'You received ₦15,000 from Jane Smith', 
        'transaction', 
        false, 
        NOW() - INTERVAL '4 days'
    ),
    (
        '33333333-3333-cccc-cccc-333333333333', 
        '22222222-2222-2222-2222-222222222222', 
        'Account Verification', 
        'Your account has been successfully verified', 
        'account', 
        true, 
        NOW() - INTERVAL '25 days'
    ),
    (
        '44444444-4444-dddd-dddd-444444444444', 
        '33333333-3333-3333-3333-333333333333', 
        'KYC Update Required', 
        'Please update your KYC documents to continue using services', 
        'kyc', 
        false, 
        NOW() - INTERVAL '3 days'
    ),
    (
        '55555555-5555-eeee-eeee-555555555555', 
        '44444444-4444-4444-4444-444444444444', 
        'Investment Update', 
        'Your investment wallet has earned ₦5,000 in returns', 
        'investment', 
        false, 
        NOW() - INTERVAL '1 day'
    ),
    (
        '66666666-6666-ffff-ffff-666666666666', 
        '11111111-1111-1111-1111-111111111111', 
        'Security Alert', 
        'New device login detected from Windows 11', 
        'security', 
        true, 
        NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock fraud alerts
    INSERT INTO tenant.fraud_alerts (
        id, user_id, transaction_id, alert_type, risk_score, status, details, created_at
    ) VALUES
    (
        '11111111-aaaa-aaaa-aaaa-111111111111', 
        '55555555-5555-5555-5555-555555555555', 
        '77777777-1111-1111-1111-777777777777', 
        'suspicious_amount', 
        85, 
        'investigated', 
        '{"reason": "Large transaction from inactive account", "actions_taken": ["account_review", "transaction_blocked"]}', 
        NOW() - INTERVAL '6 hours'
    ),
    (
        '22222222-bbbb-bbbb-bbbb-222222222222', 
        '33333333-3333-3333-3333-333333333333', 
        NULL, 
        'multiple_failed_login', 
        65, 
        'active', 
        '{"reason": "Multiple failed login attempts detected", "attempts": 5, "time_window": "15 minutes"}', 
        NOW() - INTERVAL '2 days'
    ),
    (
        '33333333-cccc-cccc-cccc-333333333333', 
        '11111111-1111-1111-1111-111111111111', 
        '88888888-2222-2222-2222-888888888888', 
        'unusual_time', 
        45, 
        'cleared', 
        '{"reason": "Transaction outside normal hours", "transaction_time": "3:45 AM"}', 
        NOW() - INTERVAL '12 hours'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert mock documents
    INSERT INTO tenant.documents (
        id, user_id, document_type, original_filename, stored_filename, 
        file_path, status, uploaded_at
    ) VALUES
    (
        '11111111-aaaa-aaaa-aaaa-aaaaaaaaaa01', 
        '11111111-1111-1111-1111-111111111111', 
        'national_id', 
        'john_doe_id.jpg', 
        'fmfb_john_doe_id_20241201.jpg',
        '/uploads/fmfb/docs/fmfb_john_doe_id_20241201.jpg', 
        'approved', 
        NOW() - INTERVAL '30 days'
    ),
    (
        '22222222-bbbb-bbbb-bbbb-bbbbbbbbbb02', 
        '11111111-1111-1111-1111-111111111111', 
        'proof_of_address', 
        'john_doe_address.pdf', 
        'fmfb_john_doe_address_20241201.pdf',
        '/uploads/fmfb/docs/fmfb_john_doe_address_20241201.pdf', 
        'approved', 
        NOW() - INTERVAL '30 days'
    ),
    (
        '33333333-cccc-cccc-cccc-cccccccccc03', 
        '22222222-2222-2222-2222-222222222222', 
        'national_id', 
        'jane_smith_id.jpg', 
        'fmfb_jane_smith_id_20241206.jpg',
        '/uploads/fmfb/docs/fmfb_jane_smith_id_20241206.jpg', 
        'approved', 
        NOW() - INTERVAL '25 days'
    ),
    (
        '44444444-dddd-dddd-dddd-dddddddddd04', 
        '33333333-3333-3333-3333-333333333333', 
        'national_id', 
        'mike_johnson_id.jpg', 
        'fmfb_mike_johnson_id_20241220.jpg',
        '/uploads/fmfb/docs/fmfb_mike_johnson_id_20241220.jpg', 
        'pending', 
        NOW() - INTERVAL '15 days'
    ),
    (
        '55555555-eeee-eeee-eeee-eeeeeeeeee05', 
        '44444444-4444-4444-4444-444444444444', 
        'national_id', 
        'sarah_wilson_id.jpg', 
        'fmfb_sarah_wilson_id_20241215.jpg',
        '/uploads/fmfb/docs/fmfb_sarah_wilson_id_20241215.jpg', 
        'approved', 
        NOW() - INTERVAL '20 days'
    ),
    (
        '66666666-ffff-ffff-ffff-ffffffffff06', 
        '44444444-4444-4444-4444-444444444444', 
        'bank_statement', 
        'sarah_wilson_statement.pdf', 
        'fmfb_sarah_wilson_statement_20241217.pdf',
        '/uploads/fmfb/docs/fmfb_sarah_wilson_statement_20241217.pdf', 
        'approved', 
        NOW() - INTERVAL '18 days'
    )
    ON CONFLICT (id) DO NOTHING;

END $$;

-- Reset tenant context
RESET app.current_tenant_id;

-- Display summary
SELECT 'FMFB Mock Data Insertion Complete' as status;
SELECT 'Users: ' || COUNT(*) as users_count FROM tenant.users;
SELECT 'Wallets: ' || COUNT(*) as wallets_count FROM tenant.wallets;  
SELECT 'Transactions: ' || COUNT(*) as transactions_count FROM tenant.transactions;
SELECT 'Sessions: ' || COUNT(*) as sessions_count FROM tenant.user_sessions;
SELECT 'Notifications: ' || COUNT(*) as notifications_count FROM tenant.notifications;
SELECT 'Fraud Alerts: ' || COUNT(*) as fraud_alerts_count FROM tenant.fraud_alerts;
SELECT 'Documents: ' || COUNT(*) as documents_count FROM tenant.documents;