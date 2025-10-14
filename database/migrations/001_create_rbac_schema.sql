-- =====================================================
-- RBAC Database Schema for Multi-Tenant Banking Platform
-- =====================================================
-- This migration creates comprehensive RBAC tables that support:
-- 1. Multi-tenant isolation (tenant schema)
-- 2. Platform-level roles (platform schema)
-- 3. Nigerian banking compliance (CBN/NIBSS)
-- 4. Hierarchical permissions
-- 5. Dynamic role assignment
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS ltree;

-- =====================================================
-- PLATFORM SCHEMA: Cross-tenant RBAC definitions
-- =====================================================

-- Platform-level roles that apply across all tenants
CREATE TABLE IF NOT EXISTS platform.rbac_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- platform_admin, tenant_admin, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- 0=platform, 1=tenant, 2=branch, 3=department
    is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Platform-level permissions catalog
CREATE TABLE IF NOT EXISTS platform.rbac_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- internal_transfers, external_transfers, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- transfers, savings, loans, operations, management, platform
    resource VARCHAR(100) NOT NULL, -- what resource this permission controls
    action VARCHAR(100) NOT NULL, -- create, read, update, delete, execute, approve
    is_system_permission BOOLEAN DEFAULT false,
    cbn_regulation_ref VARCHAR(100), -- Reference to CBN regulation
    nibss_requirement BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Platform role-permission mappings (template for tenants)
CREATE TABLE IF NOT EXISTS platform.rbac_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES platform.rbac_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES platform.rbac_permissions(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'read', -- none, read, write, full
    conditions JSONB, -- Additional conditions for permission (amount limits, time restrictions, etc.)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- TENANT SCHEMA: Tenant-specific RBAC implementations
-- =====================================================

-- Tenant-specific roles (inherits from platform but can be customized)
CREATE TABLE IF NOT EXISTS tenant.rbac_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Links to platform.tenants
    platform_role_id UUID REFERENCES platform.rbac_roles(id), -- Links to platform template
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_custom_role BOOLEAN DEFAULT false, -- tenant-specific customization
    hierarchy_path LTREE, -- For role hierarchies (e.g., ceo.branch_manager.teller)
    branch_restrictions UUID[], -- Array of branch IDs this role is restricted to
    department_restrictions VARCHAR(100)[], -- Department restrictions
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(tenant_id, code)
);

-- Tenant-specific permission overrides
CREATE TABLE IF NOT EXISTS tenant.rbac_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform_permission_id UUID REFERENCES platform.rbac_permissions(id),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_custom_permission BOOLEAN DEFAULT false,
    tenant_specific_rules JSONB, -- Custom rules for this tenant
    compliance_requirements JSONB, -- CBN/NIBSS specific requirements
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Tenant role-permission mappings
CREATE TABLE IF NOT EXISTS tenant.rbac_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_id UUID REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES tenant.rbac_permissions(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'read',
    conditions JSONB, -- Amount limits, time restrictions, approval requirements
    effective_from TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(tenant_id, role_id, permission_id)
);

-- User role assignments (many-to-many)
CREATE TABLE IF NOT EXISTS tenant.rbac_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL, -- References tenant.users(id)
    role_id UUID REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE,
    assigned_by UUID, -- Who assigned this role
    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    effective_from TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITHOUT TIME ZONE, -- NULL = permanent
    is_active BOOLEAN DEFAULT true,
    assignment_reason TEXT,
    additional_permissions JSONB, -- One-off permissions beyond role
    restrictions JSONB, -- Additional restrictions for this user
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, role_id)
);

-- Permission audit trail
CREATE TABLE IF NOT EXISTS tenant.rbac_permission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    permission_code VARCHAR(100),
    access_granted BOOLEAN NOT NULL,
    denial_reason TEXT,
    request_context JSONB, -- IP, device, time, etc.
    resource_id UUID, -- ID of the specific resource accessed
    additional_data JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Role hierarchy and delegation
CREATE TABLE IF NOT EXISTS tenant.rbac_role_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_role_id UUID REFERENCES tenant.rbac_roles(id),
    child_role_id UUID REFERENCES tenant.rbac_roles(id),
    can_delegate BOOLEAN DEFAULT false, -- Can parent delegate permissions to child
    inheritance_level INTEGER DEFAULT 1, -- How many levels of inheritance
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, parent_role_id, child_role_id)
);

-- Temporary permission grants (for emergency access, etc.)
CREATE TABLE IF NOT EXISTS tenant.rbac_temporary_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission_id UUID REFERENCES tenant.rbac_permissions(id),
    granted_by UUID NOT NULL, -- Who granted this permission
    reason TEXT NOT NULL,
    effective_from TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER, -- NULL = unlimited
    emergency_access BOOLEAN DEFAULT false,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Platform schema indexes
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_role ON platform.rbac_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_permission ON platform.rbac_role_permissions(permission_id);

-- Tenant schema indexes
CREATE INDEX IF NOT EXISTS idx_tenant_roles_tenant ON tenant.rbac_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_roles_code ON tenant.rbac_roles(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_tenant_permissions_tenant ON tenant.rbac_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_role_permissions_tenant_role ON tenant.rbac_role_permissions(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant_user ON tenant.rbac_user_roles(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_active ON tenant.rbac_user_roles(tenant_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_permission_audit_user ON tenant.rbac_permission_audit(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_permission_audit_resource ON tenant.rbac_permission_audit(tenant_id, resource, action);
CREATE INDEX IF NOT EXISTS idx_tenant_permission_audit_time ON tenant.rbac_permission_audit(created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all RBAC tables
CREATE TRIGGER update_platform_rbac_roles_updated_at BEFORE UPDATE ON platform.rbac_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_platform_rbac_permissions_updated_at BEFORE UPDATE ON platform.rbac_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenant_rbac_roles_updated_at BEFORE UPDATE ON tenant.rbac_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenant_rbac_permissions_updated_at BEFORE UPDATE ON tenant.rbac_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenant_rbac_role_permissions_updated_at BEFORE UPDATE ON tenant.rbac_role_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenant_rbac_user_roles_updated_at BEFORE UPDATE ON tenant.rbac_user_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- RBAC UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION tenant.check_user_permission(
    p_tenant_id UUID,
    p_user_id UUID,
    p_permission_code VARCHAR(100),
    p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check through role assignments
    SELECT EXISTS (
        SELECT 1
        FROM tenant.rbac_user_roles ur
        JOIN tenant.rbac_role_permissions rp ON ur.role_id = rp.role_id
        JOIN tenant.rbac_permissions p ON rp.permission_id = p.id
        WHERE ur.tenant_id = p_tenant_id
        AND ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
        AND (ur.effective_to IS NULL OR ur.effective_to > NOW())
        AND p.code = p_permission_code
        AND rp.permission_level != 'none'
    ) INTO has_permission;

    -- Check temporary permissions if not found in roles
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1
            FROM tenant.rbac_temporary_permissions tp
            JOIN tenant.rbac_permissions p ON tp.permission_id = p.id
            WHERE tp.tenant_id = p_tenant_id
            AND tp.user_id = p_user_id
            AND tp.is_active = TRUE
            AND tp.effective_from <= NOW()
            AND tp.effective_to > NOW()
            AND p.code = p_permission_code
            AND (tp.max_usage IS NULL OR tp.usage_count < tp.max_usage)
        ) INTO has_permission;
    END IF;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's permission level for specific permission
CREATE OR REPLACE FUNCTION tenant.get_user_permission_level(
    p_tenant_id UUID,
    p_user_id UUID,
    p_permission_code VARCHAR(100)
) RETURNS VARCHAR(20) AS $$
DECLARE
    permission_level VARCHAR(20) := 'none';
    temp_level VARCHAR(20);
BEGIN
    -- Get highest permission level from roles
    SELECT COALESCE(MAX(
        CASE rp.permission_level
            WHEN 'full' THEN 4
            WHEN 'write' THEN 3
            WHEN 'read' THEN 2
            WHEN 'none' THEN 1
            ELSE 0
        END
    ), 0) INTO temp_level
    FROM tenant.rbac_user_roles ur
    JOIN tenant.rbac_role_permissions rp ON ur.role_id = rp.role_id
    JOIN tenant.rbac_permissions p ON rp.permission_id = p.id
    WHERE ur.tenant_id = p_tenant_id
    AND ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND (ur.effective_from IS NULL OR ur.effective_from <= NOW())
    AND (ur.effective_to IS NULL OR ur.effective_to > NOW())
    AND p.code = p_permission_code;

    -- Convert back to string
    permission_level := CASE temp_level::INTEGER
        WHEN 4 THEN 'full'
        WHEN 3 THEN 'write'
        WHEN 2 THEN 'read'
        ELSE 'none'
    END;

    RETURN permission_level;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE platform.rbac_roles IS 'Platform-level role templates that can be inherited by tenants';
COMMENT ON TABLE platform.rbac_permissions IS 'Master catalog of all available permissions in the system';
COMMENT ON TABLE tenant.rbac_roles IS 'Tenant-specific roles, can inherit from platform or be completely custom';
COMMENT ON TABLE tenant.rbac_permissions IS 'Tenant-specific permissions, can override platform defaults';
COMMENT ON TABLE tenant.rbac_user_roles IS 'User role assignments with effective dates and additional restrictions';
COMMENT ON TABLE tenant.rbac_permission_audit IS 'Complete audit trail of all permission checks and access attempts';

-- =====================================================
-- SECURITY POLICIES (ROW LEVEL SECURITY)
-- =====================================================

-- Enable RLS on tenant tables
ALTER TABLE tenant.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.rbac_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.rbac_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.rbac_permission_audit ENABLE ROW LEVEL SECURITY;

-- Create policies (example - would need to be customized based on auth system)
-- CREATE POLICY tenant_isolation_rbac_roles ON tenant.rbac_roles
--   USING (tenant_id = current_setting('app.current_tenant_id')::UUID);