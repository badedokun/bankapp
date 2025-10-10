-- Data Migration Script
-- Migrate tenant.* data from bank_app_platform to tenant_fmfb_db
-- Date: 2025-10-09
--
-- IMPORTANT: Run this with dblink extension connecting both databases
-- Or export/import approach

-- ============================================
-- STEP 1: Clear existing tenant data in tenant_fmfb_db
-- ============================================

BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear tables in dependency order (children first, parents last)
TRUNCATE TABLE tenant.user_sessions CASCADE;
TRUNCATE TABLE tenant.rbac_user_roles CASCADE;
TRUNCATE TABLE tenant.rbac_role_permissions CASCADE;
TRUNCATE TABLE tenant.rbac_permissions CASCADE;
TRUNCATE TABLE tenant.rbac_roles CASCADE;
TRUNCATE TABLE tenant.transactions CASCADE;
TRUNCATE TABLE tenant.transfers CASCADE;
TRUNCATE TABLE tenant.wallets CASCADE;
TRUNCATE TABLE tenant.ai_smart_suggestions CASCADE;
TRUNCATE TABLE tenant.ai_response_templates CASCADE;
TRUNCATE TABLE tenant.ai_translation_patterns CASCADE;
TRUNCATE TABLE tenant.ai_intent_patterns CASCADE;
TRUNCATE TABLE tenant.ai_intent_categories CASCADE;
TRUNCATE TABLE tenant.ai_configuration CASCADE;
TRUNCATE TABLE tenant.users CASCADE;
-- tenant_metadata is managed per-tenant, keep it
-- TRUNCATE TABLE tenant.tenant_metadata CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

COMMIT;

-- ============================================
-- STEP 2: Data will be copied using pg_dump/pg_restore
-- ============================================
-- See migration command script for execution
