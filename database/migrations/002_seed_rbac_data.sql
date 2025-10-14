-- =====================================================
-- RBAC Data Seeding for Nigerian Banking Platform
-- =====================================================
-- This script seeds the RBAC system with:
-- 1. Platform-level roles and permissions
-- 2. Nigerian banking-specific roles
-- 3. CBN compliance permissions
-- 4. Default role-permission mappings
-- =====================================================

-- =====================================================
-- PLATFORM ROLES (Templates for all tenants)
-- =====================================================

INSERT INTO platform.rbac_roles (code, name, description, level, is_system_role) VALUES
('platform_admin', 'Platform Administrator', 'Full platform access across all tenants', 0, true),
('tenant_admin', 'Tenant Administrator', 'Full access within tenant boundary', 1, true),
('ceo', 'Chief Executive Officer', 'Highest authority within bank tenant', 1, false),
('coo', 'Chief Operating Officer', 'Operations oversight and strategic decisions', 1, false),
('cfo', 'Chief Financial Officer', 'Financial oversight and compliance', 1, false),
('cto', 'Chief Technology Officer', 'Technology and security oversight', 1, false),
('compliance_officer', 'Compliance Officer', 'Regulatory compliance and risk management', 1, false),
('head_of_operations', 'Head of Operations', 'Daily operations management', 1, false),
('branch_manager', 'Branch Manager', 'Branch-level management and oversight', 2, false),
('assistant_branch_manager', 'Assistant Branch Manager', 'Support branch management functions', 2, false),
('operations_manager', 'Operations Manager', 'Operations management at branch level', 2, false),
('customer_service_manager', 'Customer Service Manager', 'Customer service oversight', 2, false),
('loan_officer', 'Loan Officer', 'Loan processing and management', 3, false),
('bank_teller', 'Bank Teller', 'Front-line customer service', 3, false),
('customer_service_rep', 'Customer Service Representative', 'Customer support and basic transactions', 3, false)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PLATFORM PERMISSIONS (Master catalog)
-- =====================================================

-- Transfer Permissions
INSERT INTO platform.rbac_permissions (code, name, description, category, resource, action, is_system_permission, cbn_regulation_ref, nibss_requirement) VALUES
('internal_transfers', 'Internal Transfers', 'Transfer funds within same bank', 'transfers', 'transfers', 'create', false, 'CBN/BSD/2020/001', false),
('external_transfers', 'External Transfers', 'Transfer funds to other banks', 'transfers', 'transfers', 'create', false, 'CBN/BSD/2020/001', true),
('bulk_transfers', 'Bulk Transfers', 'Process multiple transfers at once', 'transfers', 'transfers', 'create', false, 'CBN/BSD/2020/002', true),
('international_transfers', 'International Transfers', 'Cross-border money transfers', 'transfers', 'transfers', 'create', false, 'CBN/TED/2019/003', true),
('transfer_approval', 'Transfer Approval', 'Approve high-value transfers', 'transfers', 'transfers', 'approve', false, 'CBN/BSD/2020/001', false),
('transfer_reversal', 'Transfer Reversal', 'Reverse completed transfers', 'transfers', 'transfers', 'execute', false, 'CBN/BSD/2020/004', true),
('view_transfer_history', 'View Transfer History', 'Access transfer transaction history', 'transfers', 'transfers', 'read', false, NULL, false),

-- Savings Permissions
('flexible_savings', 'Flexible Savings', 'Manage flexible savings accounts', 'savings', 'savings', 'create', false, 'CBN/BSD/2018/005', false),
('target_savings', 'Target Savings', 'Goal-based savings management', 'savings', 'savings', 'create', false, 'CBN/BSD/2018/005', false),
('group_savings', 'Group Savings', 'Cooperative savings management', 'savings', 'savings', 'create', false, 'CBN/BSD/2018/006', false),
('locked_savings', 'Locked Savings', 'Fixed-term savings products', 'savings', 'savings', 'create', false, 'CBN/BSD/2018/005', false),
('save_as_you_transact', 'Save as You Transact', 'Automatic micro-savings', 'savings', 'savings', 'create', false, NULL, false),
('savings_withdrawal', 'Savings Withdrawal', 'Process savings withdrawals', 'savings', 'savings', 'execute', false, 'CBN/BSD/2018/005', false),
('savings_interest_calculation', 'Savings Interest Calculation', 'Calculate and apply interest', 'savings', 'savings', 'execute', false, 'CBN/BSD/2018/007', false),

-- Loan Permissions
('personal_loans', 'Personal Loans', 'Individual loan products', 'loans', 'loans', 'create', false, 'CBN/CCD/2019/001', false),
('business_loans', 'Business Loans', 'Commercial loan products', 'loans', 'loans', 'create', false, 'CBN/CCD/2019/002', false),
('quick_loans', 'Quick Loans', 'Instant loan disbursement', 'loans', 'loans', 'create', false, 'CBN/CCD/2019/003', false),
('loan_approval', 'Loan Approval', 'Approve loan applications', 'loans', 'loans', 'approve', false, 'CBN/CCD/2019/001', false),
('loan_disbursement', 'Loan Disbursement', 'Disburse approved loans', 'loans', 'loans', 'execute', false, 'CBN/CCD/2019/004', false),
('loan_collection', 'Loan Collection', 'Manage loan repayments', 'loans', 'loans', 'execute', false, 'CBN/CCD/2019/005', false),

-- Operations Permissions
('bill_payments', 'Bill Payments', 'Utility and service bill payments', 'operations', 'bills', 'create', false, 'CBN/PSMD/2020/001', true),
('kyc_management', 'KYC Management', 'Customer identity verification', 'operations', 'kyc', 'execute', false, 'CBN/AML/2020/001', false),
('transaction_monitoring', 'Transaction Monitoring', 'Monitor for suspicious activities', 'operations', 'transactions', 'read', true, 'CBN/AML/2020/002', false),
('fraud_detection', 'Fraud Detection', 'Detect and flag fraudulent activities', 'operations', 'fraud', 'execute', true, 'CBN/AML/2020/003', false),
('customer_onboarding', 'Customer Onboarding', 'New customer registration', 'operations', 'customers', 'create', false, 'CBN/KYC/2020/001', false),
('document_management', 'Document Management', 'Upload and manage customer documents', 'operations', 'documents', 'create', false, NULL, false),

-- Management Permissions
('user_management', 'User Management', 'Create and manage system users', 'management', 'users', 'create', false, NULL, false),
('role_management', 'Role Management', 'Assign and modify user roles', 'management', 'roles', 'create', true, NULL, false),
('permission_management', 'Permission Management', 'Grant or revoke permissions', 'management', 'permissions', 'create', true, NULL, false),
('branch_management', 'Branch Management', 'Manage branch operations', 'management', 'branches', 'create', false, NULL, false),
('audit_trail_access', 'Audit Trail Access', 'View system audit logs', 'management', 'audit', 'read', true, 'CBN/IT/2020/001', false),
('reporting_access', 'Reporting Access', 'Generate and view reports', 'management', 'reports', 'read', false, 'CBN/BSD/2020/005', false),
('financial_reporting', 'Financial Reporting', 'Generate financial reports', 'management', 'reports', 'read', false, 'CBN/BSD/2020/006', false),

-- Platform Permissions
('platform_administration', 'Platform Administration', 'Full platform control', 'platform', 'platform', 'execute', true, NULL, false),
('tenant_management', 'Tenant Management', 'Create and manage tenants', 'platform', 'tenants', 'create', true, NULL, false),
('system_configuration', 'System Configuration', 'Configure platform settings', 'platform', 'system', 'create', true, NULL, false),
('multi_tenant_reporting', 'Multi-Tenant Reporting', 'Cross-tenant analytics', 'platform', 'analytics', 'read', true, NULL, false),

-- Additional Nigerian Banking Permissions
('nibss_integration', 'NIBSS Integration', 'Access NIBSS services', 'operations', 'nibss', 'execute', false, NULL, true),
('rtgs_operations', 'RTGS Operations', 'Real-time gross settlement', 'operations', 'rtgs', 'execute', false, 'CBN/PSMD/2020/002', true),
('nip_transactions', 'NIP Transactions', 'Nigeria Instant Payment system', 'operations', 'nip', 'execute', false, 'CBN/PSMD/2020/003', true),
('bvn_verification', 'BVN Verification', 'Bank verification number checks', 'operations', 'bvn', 'execute', false, 'CBN/PSMD/2020/004', true),
('cbn_reporting', 'CBN Reporting', 'Regulatory reporting to CBN', 'management', 'cbr_reports', 'create', false, 'CBN/BSD/2020/007', false),
('fx_operations', 'Foreign Exchange Operations', 'Foreign currency transactions', 'operations', 'fx', 'execute', false, 'CBN/TED/2019/004', false),
('cash_management', 'Cash Management', 'Physical cash handling', 'operations', 'cash', 'execute', false, 'CBN/BSD/2019/008', false),
('atm_management', 'ATM Management', 'ATM operations and maintenance', 'operations', 'atm', 'execute', false, 'CBN/PSMD/2019/005', false)

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PLATFORM ROLE-PERMISSION MAPPINGS
-- =====================================================

-- Platform Administrator - Full access to everything
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'full'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'platform_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CEO - Full business access, limited system admin
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.category = 'platform' THEN 'read'
        WHEN p.code IN ('role_management', 'permission_management') THEN 'read'
        ELSE 'full'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'ceo' AND p.category != 'platform'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Branch Manager - Branch-level full access
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.code IN ('user_management', 'role_management', 'permission_management') THEN 'read'
        WHEN p.code IN ('loan_approval', 'transfer_approval') THEN 'full'
        WHEN p.category IN ('transfers', 'savings', 'loans', 'operations') THEN 'full'
        WHEN p.category = 'management' THEN 'read'
        ELSE 'none'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'branch_manager'
AND p.category != 'platform'
AND CASE
    WHEN p.code IN ('user_management', 'role_management', 'permission_management') THEN 'read'
    WHEN p.code IN ('loan_approval', 'transfer_approval') THEN 'full'
    WHEN p.category IN ('transfers', 'savings', 'loans', 'operations') THEN 'full'
    WHEN p.category = 'management' THEN 'read'
    ELSE 'none'
END != 'none'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Bank Teller - Basic transaction access
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'write'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'bank_teller'
AND p.code IN (
    'internal_transfers', 'view_transfer_history', 'flexible_savings',
    'savings_withdrawal', 'bill_payments', 'kyc_management',
    'customer_onboarding', 'document_management', 'bvn_verification',
    'cash_management'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Loan Officer - Loan-focused permissions
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id,
    CASE
        WHEN p.code IN ('loan_approval') THEN 'write'  -- Can recommend, not final approve
        WHEN p.category = 'loans' THEN 'full'
        WHEN p.code IN ('kyc_management', 'customer_onboarding', 'document_management', 'bvn_verification') THEN 'full'
        ELSE 'read'
    END
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'loan_officer'
AND (
    p.category = 'loans' OR
    p.code IN ('kyc_management', 'customer_onboarding', 'document_management', 'bvn_verification', 'reporting_access')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Compliance Officer - Regulatory and audit focused
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'full'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'compliance_officer'
AND (
    p.code IN ('transaction_monitoring', 'fraud_detection', 'audit_trail_access', 'cbn_reporting', 'financial_reporting') OR
    p.category = 'management'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Customer Service Representative - Customer-focused access
INSERT INTO platform.rbac_role_permissions (role_id, permission_id, permission_level)
SELECT r.id, p.id, 'write'
FROM platform.rbac_roles r
CROSS JOIN platform.rbac_permissions p
WHERE r.code = 'customer_service_rep'
AND p.code IN (
    'view_transfer_history', 'flexible_savings', 'bill_payments',
    'customer_onboarding', 'document_management', 'bvn_verification'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- ADDITIONAL SETUP FOR EXISTING TENANTS
-- =====================================================

-- Function to initialize RBAC for existing tenant
CREATE OR REPLACE FUNCTION initialize_tenant_rbac(tenant_uuid UUID)
RETURNS VOID AS $$
DECLARE
    platform_role RECORD;
    platform_perm RECORD;
    new_role_id UUID;
    new_perm_id UUID;
BEGIN
    -- Copy platform roles to tenant
    FOR platform_role IN SELECT * FROM platform.rbac_roles LOOP
        INSERT INTO tenant.rbac_roles (
            tenant_id, platform_role_id, code, name, description, level, is_custom_role
        ) VALUES (
            tenant_uuid, platform_role.id, platform_role.code,
            platform_role.name, platform_role.description, platform_role.level, false
        ) ON CONFLICT (tenant_id, code) DO NOTHING;
    END LOOP;

    -- Copy platform permissions to tenant
    FOR platform_perm IN SELECT * FROM platform.rbac_permissions LOOP
        INSERT INTO tenant.rbac_permissions (
            tenant_id, platform_permission_id, code, name, description,
            category, resource, action, is_custom_permission
        ) VALUES (
            tenant_uuid, platform_perm.id, platform_perm.code, platform_perm.name,
            platform_perm.description, platform_perm.category, platform_perm.resource,
            platform_perm.action, false
        ) ON CONFLICT (tenant_id, code) DO NOTHING;
    END LOOP;

    -- Copy role-permission mappings
    INSERT INTO tenant.rbac_role_permissions (tenant_id, role_id, permission_id, permission_level, conditions)
    SELECT
        tenant_uuid,
        tr.id,
        tp.id,
        prp.permission_level,
        prp.conditions
    FROM platform.rbac_role_permissions prp
    JOIN platform.rbac_roles pr ON prp.role_id = pr.id
    JOIN platform.rbac_permissions pp ON prp.permission_id = pp.id
    JOIN tenant.rbac_roles tr ON (tr.tenant_id = tenant_uuid AND tr.code = pr.code)
    JOIN tenant.rbac_permissions tp ON (tp.tenant_id = tenant_uuid AND tp.code = pp.code)
    ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;

    RAISE NOTICE 'RBAC initialized for tenant: %', tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION initialize_tenant_rbac IS 'Initializes RBAC system for a new or existing tenant by copying platform templates';
COMMENT ON TABLE platform.rbac_role_permissions IS 'Default role-permission mappings that serve as templates for tenant RBAC setup';

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- SELECT 'Platform Roles Created' as status, count(*) as count FROM platform.rbac_roles;
-- SELECT 'Platform Permissions Created' as status, count(*) as count FROM platform.rbac_permissions;
-- SELECT 'Role-Permission Mappings Created' as status, count(*) as count FROM platform.rbac_role_permissions;