-- =====================================================
-- Complete RBAC Permissions - Adding Missing 22 Permissions
-- =====================================================
-- This migration adds all remaining permissions from the
-- NIGERIAN_BANK_RBAC_MATRIX.md to reach the full 67 permissions
-- =====================================================

-- Dashboard & Analytics Permissions (Missing from original implementation)
INSERT INTO platform.rbac_permissions (code, name, description, category, resource, action, is_system_permission, cbn_regulation_ref, nibss_requirement) VALUES
('platform_overview_dashboard', 'Platform Overview Dashboard', 'Access to platform-wide overview dashboard', 'management', 'dashboard', 'read', true, NULL, false),
('bank_performance_dashboard', 'Bank Performance Dashboard', 'View bank performance metrics and analytics', 'management', 'dashboard', 'read', false, 'CBN/BSD/2020/006', false),
('branch_performance_analytics', 'Branch Performance Analytics', 'Analyze branch-level performance metrics', 'management', 'analytics', 'read', false, 'CBN/BSD/2020/006', false),
('customer_analytics_dashboard', 'Customer Analytics Dashboard', 'View customer behavior and demographics analytics', 'management', 'analytics', 'read', false, NULL, false),
('financial_reporting_dashboard', 'Financial Reporting Dashboard', 'Access financial reporting and dashboard features', 'management', 'reports', 'read', false, 'CBN/BSD/2020/006', false),

-- Advanced User Management Permissions
('create_bank_users', 'Create Bank Users', 'Create new internal bank users', 'management', 'users', 'create', false, NULL, false),
('modify_user_roles', 'Modify User Roles', 'Change user role assignments', 'management', 'users', 'execute', true, NULL, false),
('deactivate_users', 'Deactivate Users', 'Suspend or deactivate user accounts', 'management', 'users', 'execute', false, NULL, false),
('view_user_activity', 'View User Activity', 'Monitor user login and activity logs', 'management', 'audit', 'read', true, NULL, false),
('reset_user_passwords', 'Reset User Passwords', 'Reset passwords for other users', 'management', 'users', 'execute', false, NULL, false),

-- Transfer & Transaction Enhancements
('transfer_limits_configuration', 'Transfer Limits Configuration', 'Configure transaction and transfer limits', 'operations', 'transfers', 'create', false, 'CBN/BSD/2020/001', false),
('transfer_approval_workflow', 'Transfer Approval Workflow', 'Participate in multi-level transfer approvals', 'operations', 'transfers', 'approve', false, 'CBN/BSD/2020/001', false),
('view_reversal_requests', 'View Reversal Requests', 'View transaction reversal requests', 'operations', 'reversals', 'read', false, 'CBN/BSD/2020/004', true),
('create_reversal_request', 'Create Reversal Request', 'Initiate transaction reversal requests', 'operations', 'reversals', 'create', false, 'CBN/BSD/2020/004', true),
('approve_reversal_level1', 'Approve Reversal (Level 1)', 'First level approval for transaction reversals', 'operations', 'reversals', 'approve', false, 'CBN/BSD/2020/004', true),
('approve_reversal_level2', 'Approve Reversal (Level 2)', 'Second level approval for transaction reversals', 'operations', 'reversals', 'approve', false, 'CBN/BSD/2020/004', true),
('execute_final_reversal', 'Execute Final Reversal', 'Execute approved transaction reversals', 'operations', 'reversals', 'execute', false, 'CBN/BSD/2020/004', true),

-- Advanced Savings & Account Management
('view_savings_accounts', 'View Savings Accounts', 'View customer savings account details', 'savings', 'accounts', 'read', false, 'CBN/BSD/2018/005', false),
('create_savings_account', 'Create Savings Account', 'Open new savings accounts for customers', 'savings', 'accounts', 'create', false, 'CBN/BSD/2018/005', false),
('modify_savings_terms', 'Modify Savings Terms', 'Change savings account terms and conditions', 'savings', 'accounts', 'execute', false, 'CBN/BSD/2018/005', false),
('configure_interest_rates', 'Configure Interest Rates', 'Set and modify interest rates for savings products', 'savings', 'configuration', 'create', false, 'CBN/BSD/2018/007', false),
('close_suspend_accounts', 'Close/Suspend Accounts', 'Close or suspend customer accounts', 'operations', 'accounts', 'execute', false, 'CBN/KYC/2020/001', false),
('account_relationship_mapping', 'Account Relationship Mapping', 'Manage customer account relationships', 'operations', 'accounts', 'execute', false, NULL, false),

-- Enhanced KYC & Compliance
('view_kyc_documents', 'View KYC Documents', 'Access customer KYC documentation', 'operations', 'kyc', 'read', false, 'CBN/KYC/2020/001', false),
('upload_kyc_documents', 'Upload KYC Documents', 'Upload customer identification documents', 'operations', 'kyc', 'create', false, 'CBN/KYC/2020/001', false),
('verify_kyc_documents', 'Verify KYC Documents', 'Verify authenticity of customer documents', 'operations', 'kyc', 'execute', false, 'CBN/KYC/2020/001', false),
('approve_customer_onboarding', 'Approve Customer Onboarding', 'Approve new customer account opening', 'operations', 'customers', 'approve', false, 'CBN/KYC/2020/001', false),
('kyc_compliance_reporting', 'KYC Compliance Reporting', 'Generate KYC compliance reports', 'management', 'compliance', 'read', false, 'CBN/KYC/2020/001', false),

-- Bill Payments & Services
('configure_biller_integrations', 'Configure Biller Integrations', 'Setup and manage biller service integrations', 'operations', 'billers', 'create', false, 'CBN/PSMD/2020/001', true),
('bill_payment_analytics', 'Bill Payment Analytics', 'Analyze bill payment patterns and metrics', 'operations', 'analytics', 'read', false, NULL, false),
('recurring_payment_setup', 'Recurring Payment Setup', 'Configure recurring bill payments', 'operations', 'bills', 'create', false, 'CBN/PSMD/2020/001', true),

-- Advanced Compliance & Audit
('generate_compliance_reports', 'Generate Compliance Reports', 'Create regulatory compliance reports', 'management', 'compliance', 'create', false, 'CBN/BSD/2020/007', false),
('bsa_aml_monitoring', 'BSA/AML Monitoring', 'Monitor for suspicious activities and AML compliance', 'operations', 'compliance', 'execute', true, 'CBN/AML/2020/002', false),
('regulatory_submissions', 'Regulatory Submissions', 'Submit reports to regulatory bodies (CBN)', 'management', 'compliance', 'create', false, 'CBN/BSD/2020/007', false),
('risk_assessment_tools', 'Risk Assessment Tools', 'Access and use risk assessment tools', 'operations', 'risk', 'execute', false, 'CBN/AML/2020/003', false),

-- System Administration & Configuration
('configure_bank_settings', 'Configure Bank Settings', 'Configure core banking system settings', 'management', 'system', 'create', true, NULL, false),
('manage_transaction_limits', 'Manage Transaction Limits', 'Set and modify transaction limits', 'management', 'limits', 'create', false, 'CBN/BSD/2020/001', false),
('system_backup_recovery', 'System Backup & Recovery', 'Perform system backup and recovery operations', 'platform', 'system', 'execute', true, 'CBN/IT/2020/001', false),
('database_administration', 'Database Administration', 'Direct database administration access', 'platform', 'database', 'execute', true, 'CBN/IT/2020/001', false),
('integration_management', 'Integration Management', 'Manage third-party service integrations', 'platform', 'integrations', 'create', true, NULL, false),

-- AI Assistant Permissions
('access_ai_chat', 'Access AI Chat', 'Use AI assistant chat functionality', 'operations', 'ai', 'execute', false, NULL, false),
('ai_analytics_insights', 'AI Analytics Insights', 'Access AI-powered analytics and insights', 'management', 'ai', 'read', false, NULL, false),
('ai_powered_recommendations', 'AI-Powered Recommendations', 'Receive AI-generated recommendations', 'operations', 'ai', 'read', false, NULL, false),
('configure_ai_settings', 'Configure AI Settings', 'Configure AI assistant parameters', 'management', 'ai', 'create', true, NULL, false)

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Update Role-Permission Mappings for Missing Permissions
-- =====================================================

-- Platform Administrator - Gets full access to everything including new permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'full'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'platform_admin'
AND p.code IN (
    'platform_overview_dashboard', 'bank_performance_dashboard', 'branch_performance_analytics',
    'customer_analytics_dashboard', 'financial_reporting_dashboard', 'create_bank_users',
    'modify_user_roles', 'deactivate_users', 'view_user_activity', 'reset_user_passwords',
    'transfer_limits_configuration', 'transfer_approval_workflow', 'view_reversal_requests',
    'create_reversal_request', 'approve_reversal_level1', 'approve_reversal_level2',
    'execute_final_reversal', 'view_savings_accounts', 'create_savings_account',
    'modify_savings_terms', 'configure_interest_rates', 'close_suspend_accounts',
    'account_relationship_mapping', 'view_kyc_documents', 'upload_kyc_documents',
    'verify_kyc_documents', 'approve_customer_onboarding', 'kyc_compliance_reporting',
    'configure_biller_integrations', 'bill_payment_analytics', 'recurring_payment_setup',
    'generate_compliance_reports', 'bsa_aml_monitoring', 'regulatory_submissions',
    'risk_assessment_tools', 'configure_bank_settings', 'manage_transaction_limits',
    'system_backup_recovery', 'database_administration', 'integration_management',
    'access_ai_chat', 'ai_analytics_insights', 'ai_powered_recommendations', 'configure_ai_settings'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CEO - Gets full business access except platform-specific permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.code IN ('platform_overview_dashboard', 'database_administration') THEN 'none'
        WHEN p.code IN ('configure_ai_settings', 'system_backup_recovery', 'integration_management') THEN 'read'
        WHEN p.code IN ('approve_reversal_level2', 'execute_final_reversal', 'regulatory_submissions') THEN 'full'
        ELSE 'full'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'ceo'
AND p.code IN (
    'bank_performance_dashboard', 'branch_performance_analytics', 'customer_analytics_dashboard',
    'financial_reporting_dashboard', 'create_bank_users', 'modify_user_roles',
    'deactivate_users', 'view_user_activity', 'reset_user_passwords',
    'transfer_limits_configuration', 'transfer_approval_workflow', 'view_reversal_requests',
    'create_reversal_request', 'approve_reversal_level1', 'approve_reversal_level2',
    'execute_final_reversal', 'view_savings_accounts', 'create_savings_account',
    'modify_savings_terms', 'configure_interest_rates', 'close_suspend_accounts',
    'account_relationship_mapping', 'view_kyc_documents', 'upload_kyc_documents',
    'verify_kyc_documents', 'approve_customer_onboarding', 'kyc_compliance_reporting',
    'configure_biller_integrations', 'bill_payment_analytics', 'recurring_payment_setup',
    'generate_compliance_reports', 'bsa_aml_monitoring', 'regulatory_submissions',
    'risk_assessment_tools', 'configure_bank_settings', 'manage_transaction_limits',
    'access_ai_chat', 'ai_analytics_insights', 'ai_powered_recommendations'
)
AND CASE
    WHEN p.code IN ('platform_overview_dashboard', 'database_administration') THEN 'none'
    WHEN p.code IN ('configure_ai_settings', 'system_backup_recovery', 'integration_management') THEN 'read'
    WHEN p.code IN ('approve_reversal_level2', 'execute_final_reversal', 'regulatory_submissions') THEN 'full'
    ELSE 'full'
END != 'none'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Branch Manager - Branch-level permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.code IN ('approve_reversal_level2', 'execute_final_reversal') THEN 'read'
        WHEN p.code IN ('configure_interest_rates', 'configure_bank_settings', 'regulatory_submissions') THEN 'read'
        WHEN p.code IN ('approve_reversal_level1', 'transfer_approval_workflow') THEN 'full'
        ELSE 'write'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'branch_manager'
AND p.code IN (
    'bank_performance_dashboard', 'branch_performance_analytics', 'customer_analytics_dashboard',
    'financial_reporting_dashboard', 'create_bank_users', 'modify_user_roles',
    'deactivate_users', 'view_user_activity', 'reset_user_passwords',
    'transfer_limits_configuration', 'transfer_approval_workflow', 'view_reversal_requests',
    'create_reversal_request', 'approve_reversal_level1', 'view_savings_accounts',
    'create_savings_account', 'modify_savings_terms', 'close_suspend_accounts',
    'account_relationship_mapping', 'view_kyc_documents', 'upload_kyc_documents',
    'verify_kyc_documents', 'approve_customer_onboarding', 'kyc_compliance_reporting',
    'bill_payment_analytics', 'recurring_payment_setup', 'access_ai_chat',
    'ai_analytics_insights', 'ai_powered_recommendations'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Bank Teller - Front-line customer service permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'write'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'bank_teller'
AND p.code IN (
    'view_savings_accounts', 'create_savings_account', 'view_kyc_documents',
    'upload_kyc_documents', 'create_reversal_request', 'recurring_payment_setup',
    'access_ai_chat', 'ai_powered_recommendations'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Compliance Officer - Full compliance and audit access
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'full'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'compliance_officer'
AND p.code IN (
    'view_user_activity', 'view_reversal_requests', 'kyc_compliance_reporting',
    'generate_compliance_reports', 'bsa_aml_monitoring', 'regulatory_submissions',
    'risk_assessment_tools', 'verify_kyc_documents', 'approve_customer_onboarding',
    'access_ai_chat', 'ai_analytics_insights'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Loan Officer - Loan and customer focused permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.code IN ('approve_customer_onboarding', 'create_savings_account') THEN 'full'
        ELSE 'write'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'loan_officer'
AND p.code IN (
    'view_savings_accounts', 'create_savings_account', 'view_kyc_documents',
    'upload_kyc_documents', 'verify_kyc_documents', 'approve_customer_onboarding',
    'access_ai_chat', 'ai_powered_recommendations'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- Verification Query
-- =====================================================

-- Count total permissions (should be 67 now)
-- SELECT 'Total Permissions' as metric, COUNT(*) as count FROM platform.rbac_permissions
-- UNION ALL
-- SELECT 'Total Roles' as metric, COUNT(*) as count FROM platform.rbac_roles
-- UNION ALL
-- SELECT 'Total Role-Permission Mappings' as metric, COUNT(*) as count FROM platform.rbac_role_permissions;