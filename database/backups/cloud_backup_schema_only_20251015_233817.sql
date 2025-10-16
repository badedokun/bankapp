pg_dump: last built-in OID is 16383
pg_dump: reading extensions
pg_dump: identifying extension members
pg_dump: reading schemas
pg_dump: reading user-defined tables
pg_dump: reading user-defined functions
pg_dump: reading user-defined types
pg_dump: reading procedural languages
pg_dump: reading user-defined aggregate functions
pg_dump: reading user-defined operators
pg_dump: reading user-defined access methods
pg_dump: reading user-defined operator classes
pg_dump: reading user-defined operator families
pg_dump: reading user-defined text search parsers
pg_dump: reading user-defined text search templates
pg_dump: reading user-defined text search dictionaries
pg_dump: reading user-defined text search configurations
pg_dump: reading user-defined foreign-data wrappers
pg_dump: reading user-defined foreign servers
pg_dump: reading default privileges
pg_dump: reading user-defined collations
pg_dump: reading user-defined conversions
pg_dump: reading type casts
pg_dump: reading transforms
pg_dump: reading table inheritance information
pg_dump: reading event triggers
pg_dump: finding extension tables
pg_dump: finding inheritance relationships
pg_dump: reading column info for interesting tables
pg_dump: finding table default expressions
pg_dump: finding table check constraints
pg_dump: flagging inherited columns in subtables
pg_dump: reading partitioning data
pg_dump: reading indexes
pg_dump: flagging indexes in partitioned tables
pg_dump: reading extended statistics
pg_dump: reading constraints
pg_dump: reading triggers
pg_dump: reading rewrite rules
pg_dump: reading policies
pg_dump: reading row-level security policies
pg_dump: reading publications
pg_dump: reading publication membership of tables
pg_dump: reading publication membership of schemas
pg_dump: reading subscriptions
pg_dump: reading dependency data
pg_dump: saving encoding = UTF8
pg_dump: saving standard_conforming_strings = on
pg_dump: saving search_path = 
--
-- PostgreSQL database dump
--

\restrict o9T2ktO3FFj6vLOO5v8Pm4pE25MKkN9SKD6qQ9prFbXQzxc1mCCRrF1qgEKgD7y

-- Dumped from database version 15.14 (Debian 15.14-0+deb12u1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-0+deb12u1)

-- Started on 2025-10-16 03:38:18 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 11 (class 2615 OID 27401)
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA analytics;


ALTER SCHEMA analytics OWNER TO bisiadedokun;

--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA analytics; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA analytics IS 'Analytics and reporting tables';


--
-- TOC entry 12 (class 2615 OID 27402)
-- Name: audit; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO bisiadedokun;

--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA audit; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA audit IS 'Audit logging and compliance tracking';


--
-- TOC entry 13 (class 2615 OID 27403)
-- Name: platform; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA platform;


ALTER SCHEMA platform OWNER TO bisiadedokun;

--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 13
-- Name: SCHEMA platform; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA platform IS 'Platform-level shared data - templates, configurations, and cross-tenant utilities';


--
-- TOC entry 14 (class 2615 OID 27404)
-- Name: tenant; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA tenant;


ALTER SCHEMA tenant OWNER TO bisiadedokun;

--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 14
-- Name: SCHEMA tenant; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA tenant IS 'Tenant-specific data - isolated per tenant';


--
-- TOC entry 2 (class 3079 OID 27405)
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- TOC entry 3 (class 3079 OID 27841)
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA platform;


--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- TOC entry 4 (class 3079 OID 28026)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 5 (class 3079 OID 28057)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 6 (class 3079 OID 28094)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


pg_dump: creating SCHEMA "analytics"
pg_dump: creating COMMENT "SCHEMA analytics"
pg_dump: creating SCHEMA "audit"
pg_dump: creating COMMENT "SCHEMA audit"
pg_dump: creating SCHEMA "platform"
pg_dump: creating COMMENT "SCHEMA platform"
pg_dump: creating SCHEMA "tenant"
pg_dump: creating COMMENT "SCHEMA tenant"
pg_dump: creating EXTENSION "btree_gin"
pg_dump: creating COMMENT "EXTENSION btree_gin"
pg_dump: creating EXTENSION "ltree"
pg_dump: creating COMMENT "EXTENSION ltree"
pg_dump: creating EXTENSION "pg_stat_statements"
pg_dump: creating COMMENT "EXTENSION pg_stat_statements"
pg_dump: creating EXTENSION "pgcrypto"
pg_dump: creating COMMENT "EXTENSION pgcrypto"
pg_dump: creating EXTENSION "uuid-ossp"
pg_dump: creating COMMENT "EXTENSION "uuid-ossp""
pg_dump:--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 555 (class 1255 OID 28105)
-- Name: assign_account_number(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.assign_account_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    tenant_bank_code VARCHAR(3);
BEGIN
    -- Get bank code for the tenant
    SELECT bank_code INTO tenant_bank_code 
    FROM platform.tenants 
    WHERE id = NEW.tenant_id;
    
    -- Generate account number if not provided
    IF NEW.account_number IS NULL AND tenant_bank_code IS NOT NULL THEN
        NEW.account_number := generate_account_number(tenant_bank_code);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.assign_account_number() OWNER TO bisiadedokun;

--
-- TOC entry 556 (class 1255 OID 28106)
-- Name: cleanup_old_notifications(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.cleanup_old_notifications() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete notifications older than 90 days
    DELETE FROM platform.notifications
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('sent', 'failed', 'expired');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete read in-app notifications older than 30 days
    DELETE FROM platform.in_app_notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;

    -- Delete notification logs older than 1 year
    DELETE FROM platform.notification_logs
    WHERE created_at < NOW() - INTERVAL '1 year';

    RETURN deleted_count;
END;
$$;


ALTER FUNCTION platform.cleanup_old_notifications() OWNER TO bisiadedokun;

--
-- TOC entry 557 (class 1255 OID 28107)
-- Name: convert_currency(numeric, character varying, character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_rate DECIMAL(20, 8);
BEGIN
  -- Get exchange rate
  v_rate := platform.get_exchange_rate(p_from_currency, p_to_currency);

  -- If no rate found, return NULL
  IF v_rate IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convert and return
  RETURN ROUND(p_amount * v_rate, 2);
END;
$$;


ALTER FUNCTION platform.convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying) OWNER TO bisiadedokun;

--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 557
-- Name: FUNCTION convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying) IS 'Convert amount from one currency to another using current exchange rate';


--
-- TOC entry 558 (class 1255 OID 28108)
-- Name: create_compatible_primary_wallet(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.create_compatible_primary_wallet() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Create primary wallet for new user with proper wallet_type
    INSERT INTO tenant.wallets (
        user_id, tenant_id, wallet_type, wallet_name, currency, is_primary
    ) VALUES (
        NEW.id, NEW.tenant_id, 'primary', 'Primary Account', 'NGN', true
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.create_compatible_primary_wallet() OWNER TO bisiadedokun;

--
-- TOC entry 559 (class 1255 OID 28109)
-- Name: create_primary_wallet(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.create_primary_wallet() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Create primary wallet for new user
    INSERT INTO tenant.wallets (
        user_id, tenant_id, wallet_type, wallet_name, currency, is_primary
    ) VALUES (
        NEW.id, NEW.tenant_id, 'primary', 'Primary Account', 'NGN', true
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.create_primary_wallet() OWNER TO bisiadedokun;

--
-- TOC entry 560 (class 1255 OID 28110)
-- Name: generate_account_number(character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.generate_account_number(tenant_bank_code character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    account_num VARCHAR(10);
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate 7-digit random suffix
        account_num := tenant_bank_code || LPAD(floor(random() * 10000000)::text, 7, '0');
        
        -- Check if account number is unique
        SELECT NOT EXISTS(SELECT 1 FROM tenant.users WHERE account_number = account_num) INTO is_unique;
    END LOOP;
    
    RETURN account_num;
END;
$$;


ALTER FUNCTION platform.generate_account_number(tenant_bank_code character varying) OWNER TO bisiadedokun;

--
-- TOC entry 561 (class 1255 OID 28111)
-- Name: generate_referral_code(uuid, character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.generate_referral_code(p_user_id uuid, p_first_name character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    referral_code VARCHAR(50);
    is_unique BOOLEAN := FALSE;
    counter INTEGER := 0;
BEGIN
    WHILE NOT is_unique AND counter < 10 LOOP
        -- Generate referral code: first 3 letters of name + 6 random chars
        referral_code := UPPER(LEFT(p_first_name, 3)) || 
                         LPAD(floor(random() * 1000000)::text, 6, '0');
        
        -- Check if code is unique
        SELECT NOT EXISTS(SELECT 1 FROM tenant.users u WHERE u.referral_code = referral_code) INTO is_unique;
        counter := counter + 1;
    END LOOP;
    
    -- If still not unique after 10 attempts, use UUID
    IF NOT is_unique THEN
        referral_code := UPPER(REPLACE(p_user_id::text, '-', ''))::VARCHAR(10);
    END IF;
    
    RETURN referral_code;
END;
$$;


ALTER FUNCTION platform.generate_referral_code(p_user_id uuid, p_first_name character varying) OWNER TO bisiadedokun;

--
-- TOC entry 562 (class 1255 OID 28112)
-- Name: get_exchange_rate(character varying, character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.get_exchange_rate(p_from_currency character varying, p_to_currency character varying) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_rate DECIMAL(20, 8);
BEGIN
  -- If same currency, return 1
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;

  -- Get most recent active rate
  SELECT rate INTO v_rate
  FROM platform.exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;

  -- If no rate found, return NULL
  IF v_rate IS NULL THEN
    RAISE NOTICE 'No exchange rate found for % to %', p_from_currency, p_to_currency;
    RETURN NULL;
  END IF;

  RETURN v_rate;
END;
$$;


ALTER FUNCTION platform.get_exchange_rate(p_from_currency character varying, p_to_currency character varying) OWNER TO bisiadedokun;

--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 562
-- Name: FUNCTION get_exchange_rate(p_from_currency character varying, p_to_currency character varying); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.get_exchange_rate(p_from_currency character varying, p_to_currency character varying) IS 'Get current exchange rate between two currencies';


--
-- TOC entry 563 (class 1255 OID 28113)
-- Name: get_notification_stats(uuid, date, date); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.get_notification_stats(p_tenant_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE) RETURNS TABLE(channel character varying, event_type character varying, total_sent bigint, total_delivered bigint, total_failed bigint, avg_delivery_rate numeric, total_cost numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.channel,
        ns.event_type,
        SUM(ns.sent_count)::BIGINT as total_sent,
        SUM(ns.delivered_count)::BIGINT as total_delivered,
        SUM(ns.failed_count)::BIGINT as total_failed,
        CASE
            WHEN SUM(ns.sent_count) > 0 THEN
                (SUM(ns.delivered_count)::DECIMAL / SUM(ns.sent_count)) * 100
            ELSE 0
        END as avg_delivery_rate,
        SUM(ns.total_cost) as total_cost
    FROM platform.notification_statistics ns
    WHERE ns.tenant_id = p_tenant_id
    AND ns.date >= p_start_date
    AND ns.date <= p_end_date
    GROUP BY ns.channel, ns.event_type
    ORDER BY total_sent DESC;
END;
$$;


ALTER FUNCTION platform.get_notification_stats(p_tenant_id uuid, p_start_date date, p_end_date date) OWNER TO bisiadedokun;

--
-- TOC entry 564 (class 1255 OID 28114)
-- Name: get_tenant_asset_url(uuid, character varying, character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.get_tenant_asset_url(p_tenant_id uuid, p_asset_type character varying, p_asset_name character varying DEFAULT 'default'::character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    asset_exists BOOLEAN;
BEGIN
    -- Check if asset exists
    SELECT EXISTS(
        SELECT 1 FROM platform.tenant_assets 
        WHERE tenant_id = p_tenant_id 
        AND asset_type = p_asset_type 
        AND asset_name = p_asset_name
    ) INTO asset_exists;
    
    -- Return API URL if asset exists
    IF asset_exists THEN
        RETURN '/api/tenants/' || p_tenant_id || '/assets/' || p_asset_type || '/' || p_asset_name;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;


ALTER FUNCTION platform.get_tenant_asset_url(p_tenant_id uuid, p_asset_type character varying, p_asset_name character varying) OWNER TO bisiadedokun;

--
-- TOC entry 565 (class 1255 OID 28115)
-- Name: initialize_tenant_rbac(uuid); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.initialize_tenant_rbac(tenant_uuid uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION platform.initialize_tenant_rbac(tenant_uuid uuid) OWNER TO bisiadedokun;

--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 565
-- Name: FUNCTION initialize_tenant_rbac(tenant_uuid uuid); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.initialize_tenant_rbac(tenant_uuid uuid) IS 'Initializes RBAC system for a new or existing tenant by copying platform templates';


 creating FUNCTION "platform.assign_account_number()"
pg_dump: creating FUNCTION "platform.cleanup_old_notifications()"
pg_dump: creating FUNCTION "platform.convert_currency(numeric, character varying, character varying)"
pg_dump: creating COMMENT "platform.FUNCTION convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying)"
pg_dump: creating FUNCTION "platform.create_compatible_primary_wallet()"
pg_dump: creating FUNCTION "platform.create_primary_wallet()"
pg_dump: creating FUNCTION "platform.generate_account_number(character varying)"
pg_dump: creating FUNCTION "platform.generate_referral_code(uuid, character varying)"
pg_dump: creating FUNCTION "platform.get_exchange_rate(character varying, character varying)"
pg_dump: creating COMMENT "platform.FUNCTION get_exchange_rate(p_from_currency character varying, p_to_currency character varying)"
pg_dump: creating FUNCTION "platform.get_notification_stats(uuid, date, date)"
pg_dump: creating FUNCTION "platform.get_tenant_asset_url(uuid, character varying, character varying)"
pg_dump: creating FUNCTION "platform.initialize_tenant_rbac(uuid)"
pg_dump: creating COMMENT "platform.FUNCTION initialize_tenant_rbac(tenant_uuid uuid)"
pg_dump: creating FUNCTION "platform.provision_tenant_ai(character varying, character varying)"
--
-- TOC entry 566 (class 1255 OID 28116)
-- Name: provision_tenant_ai(character varying, character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.provision_tenant_ai(p_tenant_id character varying, p_tenant_name character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insert default AI configuration for tenant
    INSERT INTO tenant.ai_configuration (tenant_id, preferred_model_id)
    VALUES (p_tenant_id, (SELECT id FROM platform.ai_models WHERE is_active = true LIMIT 1));

    -- Copy standard banking intent categories
    INSERT INTO tenant.ai_intent_categories (tenant_id, name, description, priority)
    SELECT
        p_tenant_id,
        category_name,
        description,
        CASE
            WHEN category_name IN ('balance_inquiry', 'money_transfer', 'spending_analysis') THEN 1
            WHEN category_name IN ('transaction_history', 'bill_payment') THEN 2
            ELSE 3
        END as priority
    FROM platform.ai_intent_templates
    WHERE is_banking_standard = true;

    -- Add default patterns for each category
    INSERT INTO tenant.ai_intent_patterns (tenant_id, intent_category_id, pattern, pattern_type, language)
    SELECT
        p_tenant_id,
        ic.id,
        pattern_data->>'pattern',
        pattern_data->>'type',
        COALESCE(pattern_data->>'language', 'en')
    FROM tenant.ai_intent_categories ic
    JOIN platform.ai_intent_templates it ON ic.name = it.category_name
    CROSS JOIN LATERAL jsonb_array_elements(it.default_patterns) AS pattern_data
    WHERE ic.tenant_id = p_tenant_id;

    -- Add default response templates
    INSERT INTO tenant.ai_response_templates (tenant_id, intent_category_id, template, response_type, language)
    VALUES
    -- Balance inquiry responses
    (p_tenant_id,
     (SELECT id FROM tenant.ai_intent_categories WHERE tenant_id = p_tenant_id AND name = 'balance_inquiry'),
     'Your current account balance is ₦{account_balance}. You have {transaction_count} recent transactions.',
     'data_driven', 'en'),

    -- Transfer responses
    (p_tenant_id,
     (SELECT id FROM tenant.ai_intent_categories WHERE tenant_id = p_tenant_id AND name = 'money_transfer'),
     'I can help you transfer money. Please provide the recipient''s account details and amount.',
     'conversational', 'en'),

    -- Spending analysis responses
    (p_tenant_id,
     (SELECT id FROM tenant.ai_intent_categories WHERE tenant_id = p_tenant_id AND name = 'spending_analysis'),
     'Based on your transaction data: You have {transaction_count} transactions totaling ₦{total_spent}. Your top spending category is {top_category}.',
     'data_driven', 'en');

    -- Add default smart suggestions
    INSERT INTO tenant.ai_smart_suggestions (tenant_id, category, suggestion_text, action_type, language)
    VALUES
    (p_tenant_id, 'financial', 'Check your account balance', 'information', 'en'),
    (p_tenant_id, 'financial', 'View recent transactions', 'information', 'en'),
    (p_tenant_id, 'transactional', 'Transfer money', 'transaction', 'en'),
    (p_tenant_id, 'transactional', 'Pay bills', 'transaction', 'en'),
    (p_tenant_id, 'security', 'Enable two-factor authentication', 'security', 'en');

    RAISE NOTICE 'AI services provisioned for tenant: %', p_tenant_id;
END;
$$;


ALTER FUNCTION platform.provision_tenant_ai(p_tenant_id character varying, p_tenant_name character varying) OWNER TO bisiadedokun;

--
-- TOC entry 567 (class 1255 OID 28117)
-- Name: sync_bill_payment_to_transactions(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.sync_bill_payment_to_transactions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insert into transactions when bill payment is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO tenant.transactions (
            tenant_id,
            user_id,
            reference,
            type,
            amount,
            currency,
            description,
            recipient_name,
            recipient_account,
            status,
            processing_details,
            payment_provider,
            payment_method,
            total_fees,
            charges,
            channel,
            merchant_category,
            initiated_at,
            created_at,
            processed_at,
            completed_at
        ) VALUES (
            NEW.tenant_id,
            NEW.user_id,
            NEW.reference,
            'bill_payment',
            NEW.amount,
            'NGN',
            COALESCE(NEW.description, 'Bill payment to ' || NEW.provider_name),
            NEW.provider_name,
            NEW.account_number,
            NEW.status,
            jsonb_build_object(
                'provider_code', NEW.provider_code,
                'provider_name', NEW.provider_name,
                'account_number', NEW.account_number,
                'customer_name', NEW.customer_name,
                'bill_type', 'utility'
            ),
            NEW.provider_code,
            NEW.payment_method,
            NEW.total_amount,
            jsonb_build_object(
                'base_fee', NEW.fees,
                'vat', 0,
                'stamp_duty', 0
            ),
            'mobile',
            'Bills & Utilities',
            NEW.created_at,
            NEW.created_at,
            CASE WHEN NEW.status IN ('completed', 'failed') THEN NEW.updated_at ELSE NULL END,
            CASE WHEN NEW.status = 'completed' THEN NEW.updated_at ELSE NULL END
        )
        ON CONFLICT (reference) DO NOTHING; -- Prevent duplicates

        RETURN NEW;
    END IF;

    -- Update transactions when bill payment is updated
    IF TG_OP = 'UPDATE' THEN
        UPDATE tenant.transactions SET
            status = NEW.status,
            processed_at = CASE WHEN NEW.status IN ('completed', 'failed') THEN NEW.updated_at ELSE processed_at END,
            completed_at = CASE WHEN NEW.status = 'completed' THEN NEW.updated_at ELSE NULL END,
            processing_details = jsonb_build_object(
                'provider_code', NEW.provider_code,
                'provider_name', NEW.provider_name,
                'account_number', NEW.account_number,
                'customer_name', NEW.customer_name,
                'bill_type', 'utility'
            )
        WHERE reference = NEW.reference
        AND tenant_id = NEW.tenant_id
        AND type = 'bill_payment';

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION platform.sync_bill_payment_to_transactions() OWNER TO bisiadedokun;

--
-- TOC entry 568 (class 1255 OID 28118)
-- Name: sync_transfer_to_transactions(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.sync_transfer_to_transactions() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insert corresponding transaction record with explicit column mapping
    INSERT INTO tenant.transactions (
        tenant_id,
        user_id,
        reference,
        external_reference,
        type,
        amount,
        currency,
        description,
        recipient_name,
        recipient_account,
        recipient_bank,
        recipient_bank_code,
        recipient_details,
        sender_name,
        sender_account,
        sender_bank,
        sender_details,
        status,
        processing_details,
        failure_reason,
        payment_provider,
        provider_transaction_id,
        provider_response,
        total_fees,
        charges,
        channel,
        initiated_at,
        created_at,
        processed_at,
        completed_at
    ) VALUES (
        NEW.tenant_id,
        NEW.sender_id,
        NEW.reference,
        NEW.nibss_transaction_id,
        'money_transfer',
        NEW.amount,
        'NGN',
        COALESCE(NEW.description, 'Transfer to ' || NEW.recipient_name),
        NEW.recipient_name,
        NEW.recipient_account_number,
        'Bank Transfer',
        NEW.recipient_bank_code,
        jsonb_build_object(
            'recipient_name', NEW.recipient_name,
            'recipient_account_number', NEW.recipient_account_number,
            'recipient_bank_code', NEW.recipient_bank_code
        ),
        (SELECT first_name || ' ' || last_name FROM tenant.users WHERE id = NEW.sender_id),
        NEW.source_account_number,
        'OrokiiPay',
        jsonb_build_object(
            'source_account_number', NEW.source_account_number,
            'source_bank_code', NEW.source_bank_code
        ),
        CASE
            WHEN NEW.status = 'successful' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            WHEN NEW.status = 'pending' THEN 'pending'
            WHEN NEW.status = 'processing' THEN 'processing'
            ELSE NEW.status
        END,
        jsonb_build_object(
            'nibss_transaction_id', NEW.nibss_transaction_id,
            'nibss_session_id', NEW.nibss_session_id,
            'nibss_response_message', NEW.nibss_response_message,
            'transfer_type', 'money_transfer'
        ),
        NEW.failure_reason,
        'NIBSS',
        NEW.nibss_transaction_id,
        jsonb_build_object(
            'nibss_response', NEW.nibss_response_message,
            'session_id', NEW.nibss_session_id
        ),
        NEW.fee,
        jsonb_build_object(
            'transfer_fee', NEW.fee,
            'vat', 0,
            'stamp_duty', 0
        ),
        'mobile',
        NEW.created_at,
        NEW.created_at,
        NEW.processed_at,
        CASE WHEN NEW.status = 'successful' THEN NEW.processed_at ELSE NULL END
    )
    ON CONFLICT (reference) DO NOTHING;

    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.sync_transfer_to_transactions() OWNER TO bisiadedokun;

--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 568
-- Name: FUNCTION sync_transfer_to_transactions(); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.sync_transfer_to_transactions() IS 'Synchronizes transfer records to transactions table for unified transaction history';


--
-- TOC entry 569 (class 1255 OID 28119)
-- Name: update_scheduled_transfers_updated_at(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.update_scheduled_transfers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.update_scheduled_transfers_updated_at() OWNER TO bisiadedokun;

--
-- TOC entry 570 (class 1255 OID 28120)
-- Name: update_tenant_assets_updated_at(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.update_tenant_assets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.update_tenant_assets_updated_at() OWNER TO bisiadedokun;

pg_dump: creating FUNCTION "platform.sync_bill_payment_to_transactions()"
pg_dump: creating FUNCTION "platform.sync_transfer_to_transactions()"
pg_dump: creating COMMENT "platform.FUNCTION sync_transfer_to_transactions()"
pg_dump: creating FUNCTION "platform.update_scheduled_transfers_updated_at()"
pg_dump: creating FUNCTION "platform.update_tenant_assets_updated_at()"
pg_dump: creating FUNCTION "platform.update_updated_at_column()"
--
-- TOC entry 571 (class 1255 OID 28121)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION platform.update_updated_at_column() OWNER TO bisiadedokun;

--
-- TOC entry 572 (class 1255 OID 28122)
-- Name: validate_bank_code(); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.validate_bank_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Allow NULL bank codes (tenant may not support same-bank transfers)
  IF NEW.bank_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Validate non-NULL bank codes against ngn_bank_codes table
  IF NOT EXISTS (
    SELECT 1 FROM platform.ngn_bank_codes
    WHERE bank_code_3 = NEW.bank_code
       OR bank_code_5 = NEW.bank_code
       OR bank_code_6 = NEW.bank_code
       OR bank_code_9 = NEW.bank_code
  ) THEN
    RAISE EXCEPTION 'Invalid bank code: %. Must exist in ngn_bank_codes table.', NEW.bank_code;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION platform.validate_bank_code() OWNER TO bisiadedokun;

--
-- TOC entry 573 (class 1255 OID 28123)
-- Name: validate_nigerian_phone(character varying); Type: FUNCTION; Schema: platform; Owner: bisiadedokun
--

CREATE FUNCTION platform.validate_nigerian_phone(phone_number character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
BEGIN
    -- Allow Nigerian phone numbers (+234xxxxxxxxxx or 0xxxxxxxxxx)
    RETURN phone_number ~ '^\+234[789][01]\d{8}$' OR phone_number ~ '^0[789][01]\d{8}$';
END;
$_$;


ALTER FUNCTION platform.validate_nigerian_phone(phone_number character varying) OWNER TO bisiadedokun;

--
-- TOC entry 574 (class 1255 OID 28124)
-- Name: calculate_tenant_billing(uuid, date, date); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.calculate_tenant_billing(p_tenant_id uuid, p_period_start date, p_period_end date) RETURNS TABLE(base_fee numeric, transaction_fees numeric, overage_fees numeric, ai_usage_fees numeric, total_amount numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    tenant_tier TEXT;
    billing_config JSONB;
    usage_stats RECORD;
BEGIN
    -- Get tenant tier and billing configuration
    SELECT t.tier, t.billing_info INTO tenant_tier, billing_config
    FROM platform.tenants t
    WHERE t.id = p_tenant_id;
    
    -- Get usage statistics for the period
    SELECT 
        COALESCE(SUM(transaction_count), 0) as transactions,
        COALESCE(SUM(ai_requests), 0) as ai_requests,
        COALESCE(SUM(storage_used), 0) as storage_bytes,
        COALESCE(SUM(active_users), 0) as total_users
    INTO usage_stats
    FROM platform.tenant_usage_metrics
    WHERE tenant_id = p_tenant_id 
    AND metric_date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate fees based on tenant tier and usage
    RETURN QUERY
    SELECT 
        (billing_config->>'subscriptionFee')::DECIMAL(15,2) as base_fee,
        usage_stats.transactions * (billing_config->>'transactionFee')::DECIMAL(15,2) as transaction_fees,
        CASE 
            WHEN usage_stats.transactions > 1000 THEN 
                (usage_stats.transactions - 1000) * (billing_config->'overage'->>'transactionFee')::DECIMAL(15,2)
            ELSE 0
        END as overage_fees,
        usage_stats.ai_requests * 0.01 as ai_usage_fees, -- ₦0.01 per AI request
        (billing_config->>'subscriptionFee')::DECIMAL(15,2) + 
        usage_stats.transactions * (billing_config->>'transactionFee')::DECIMAL(15,2) +
        CASE 
            WHEN usage_stats.transactions > 1000 THEN 
                (usage_stats.transactions - 1000) * (billing_config->'overage'->>'transactionFee')::DECIMAL(15,2)
            ELSE 0
        END +
        usage_stats.ai_requests * 0.01 as total_amount;
END;
$$;


ALTER FUNCTION public.calculate_tenant_billing(p_tenant_id uuid, p_period_start date, p_period_end date) OWNER TO bisiadedokun;

pg_dump: creating FUNCTION "platform.validate_bank_code()"
pg_dump: creating FUNCTION "platform.validate_nigerian_phone(character varying)"
pg_dump: creating FUNCTION "public.calculate_tenant_billing(uuid, date, date)"
--
-- TOC entry 575 (class 1255 OID 28125)
-- Name: cleanup_expired_data(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.cleanup_expired_data() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete expired conversation messages
    DELETE FROM ai.conversation_messages WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired notifications
    DELETE FROM tenant.notifications WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old sessions (older than 30 days)
    DELETE FROM tenant.user_sessions WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Archive old transactions (older than 7 years, keeping only essential data)
    -- This would typically move data to an archive table
    
END;
$$;


ALTER FUNCTION public.cleanup_expired_data() OWNER TO bisiadedokun;

--
-- TOC entry 576 (class 1255 OID 28126)
-- Name: create_wallet_transaction(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.create_wallet_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    wallet_record RECORD;
BEGIN
    -- Only for completed transactions that affect wallet balance
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Find the user's main wallet
        SELECT * INTO wallet_record 
        FROM tenant.wallets 
        WHERE user_id = NEW.user_id AND wallet_type = 'main' 
        LIMIT 1;
        
        IF FOUND THEN
            -- Create wallet transaction record
            INSERT INTO tenant.wallet_transactions (
                wallet_id,
                transaction_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description,
                reference
            ) VALUES (
                wallet_record.id,
                NEW.id,
                CASE WHEN NEW.type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase') 
                     THEN 'debit' ELSE 'credit' END,
                NEW.amount,
                wallet_record.balance,
                wallet_record.balance + CASE WHEN NEW.type IN ('cash_withdrawal', 'money_transfer', 'bill_payment', 'airtime_purchase') 
                                            THEN -NEW.amount ELSE NEW.amount END,
                NEW.description,
                NEW.reference
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_wallet_transaction() OWNER TO bisiadedokun;

--
-- TOC entry 577 (class 1255 OID 28127)
-- Name: generate_transaction_reference(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.generate_transaction_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    tenant_prefix VARCHAR(10);
BEGIN
    -- Get tenant prefix from tenant_metadata
    SELECT UPPER(LEFT(tenant_name, 3)) INTO tenant_prefix 
    FROM tenant.tenant_metadata LIMIT 1;
    
    -- Generate reference if not provided
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference = COALESCE(tenant_prefix, 'TXN') || TO_CHAR(NOW(), 'YYYYMMDD') || 
                       LPAD(NEXTVAL('tenant.transaction_ref_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_transaction_reference() OWNER TO bisiadedokun;

--
-- TOC entry 578 (class 1255 OID 28128)
-- Name: generate_wallet_number(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.generate_wallet_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    tenant_prefix VARCHAR(10);
    wallet_number VARCHAR(20);
BEGIN
    -- Get tenant prefix
    SELECT UPPER(LEFT(tenant_name, 3)) INTO tenant_prefix 
    FROM tenant.tenant_metadata LIMIT 1;
    
    -- Generate wallet number if not provided
    IF NEW.wallet_number IS NULL OR NEW.wallet_number = '' THEN
        wallet_number = COALESCE(tenant_prefix, 'WLT') || TO_CHAR(NOW(), 'YYYYMM') || 
                       LPAD(NEXTVAL('tenant.wallet_number_seq')::TEXT, 8, '0');
        NEW.wallet_number = wallet_number;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_wallet_number() OWNER TO bisiadedokun;

--
-- TOC entry 579 (class 1255 OID 28129)
-- Name: get_current_tenant_id(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.get_current_tenant_id() RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;


ALTER FUNCTION public.get_current_tenant_id() OWNER TO bisiadedokun;

--
-- TOC entry 580 (class 1255 OID 28130)
-- Name: log_tenant_changes(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.log_tenant_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    change_type TEXT;
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine operation type
    IF TG_OP = 'INSERT' THEN
        change_type := 'create';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        change_type := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        change_type := 'delete';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit.tenant_audit_logs (
        tenant_id,
        service_name,
        operation,
        event_type,
        resource_type,
        resource_id,
        before_data,
        after_data,
        details
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        'platform',
        'tenant_' || change_type,
        'admin',
        'tenant',
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_tenant_changes() OWNER TO bisiadedokun;

--
-- TOC entry 581 (class 1255 OID 28131)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO bisiadedokun;

--
-- TOC entry 582 (class 1255 OID 28132)
-- Name: update_wallet_balance(); Type: FUNCTION; Schema: public; Owner: bisiadedokun
--

CREATE FUNCTION public.update_wallet_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update available balance based on reserved and pending balances
    NEW.available_balance = NEW.balance - NEW.reserved_balance - NEW.pending_balance;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_wallet_balance() OWNER TO bisiadedokun;

--
-- TOC entry 583 (class 1255 OID 28133)
-- Name: check_user_permission(uuid, uuid, character varying, uuid); Type: FUNCTION; Schema: tenant; Owner: bisiadedokun
--

CREATE FUNCTION tenant.check_user_permission(p_tenant_id uuid, p_user_id uuid, p_permission_code character varying, p_resource_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION tenant.check_user_permission(p_tenant_id uuid, p_user_id uuid, p_permission_code character varying, p_resource_id uuid) OWNER TO bisiadedokun;

--
-- TOC entry 584 (class 1255 OID 28134)
-- Name: get_user_permission_level(uuid, uuid, character varying); Type: FUNCTION; Schema: tenant; Owner: bisiadedokun
--

CREATE FUNCTION tenant.get_user_permission_level(p_tenant_id uuid, p_user_id uuid, p_permission_code character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION tenant.get_user_permission_level(p_tenant_id uuid, p_user_id uuid, p_permission_code character varying) OWNER TO bisiadedokun;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 28135)
-- Name: ai_conversation_analytics; Type: TABLE; Schema: analytics; Owner: bisiadedokun
--

CREATE TABLE analytics.ai_conversation_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    conversation_date date NOT NULL,
    total_conversations integer DEFAULT 0 NOT NULL,
    successful_resolutions integer DEFAULT 0 NOT NULL,
    escalated_conversations integer DEFAULT 0 NOT NULL,
    abandoned_conversations integer DEFAULT 0 NOT NULL,
    average_confidence numeric(5,4),
    average_response_time numeric(8,2),
    average_conversation_length numeric(6,2),
    language_usage jsonb DEFAULT '{}'::jsonb NOT NULL,
    intent_distribution jsonb DEFAULT '{}'::jsonb NOT NULL,
    user_satisfaction numeric(3,2),
    satisfaction_responses integer DEFAULT 0,
    escalation_rate numeric(5,4),
    parsing_errors integer DEFAULT 0,
    service_errors integer DEFAULT 0,
    timeout_errors integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.ai_conversation_analytics OWNER TO bisiadedokun;

--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE ai_conversation_analytics; Type: COMMENT; Schema: analytics; Owner: bisiadedokun
--

COMMENT ON TABLE analytics.ai_conversation_analytics IS 'Aggregated AI conversation metrics';


--
-- TOC entry 226 (class 1259 OID 28152)
-- Name: ai_fraud_analytics; Type: TABLE; Schema: analytics; Owner: bisiadedokun
--

CREATE TABLE analytics.ai_fraud_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    analysis_date date NOT NULL,
    total_assessments integer DEFAULT 0 NOT NULL,
    transactions_assessed integer DEFAULT 0 NOT NULL,
    low_risk_count integer DEFAULT 0 NOT NULL,
    medium_risk_count integer DEFAULT 0 NOT NULL,
    high_risk_count integer DEFAULT 0 NOT NULL,
    critical_risk_count integer DEFAULT 0 NOT NULL,
    true_positives integer DEFAULT 0,
    false_positives integer DEFAULT 0,
    true_negatives integer DEFAULT 0,
    false_negatives integer DEFAULT 0,
    false_positive_rate numeric(5,4),
    false_negative_rate numeric(5,4),
    model_accuracy numeric(5,4),
    average_processing_time numeric(8,2),
    p99_processing_time numeric(8,2),
    blocked_transactions integer DEFAULT 0 NOT NULL,
    approved_transactions integer DEFAULT 0 NOT NULL,
    flagged_for_review integer DEFAULT 0 NOT NULL,
    additional_auth_required integer DEFAULT 0 NOT NULL,
    primary_model_version character varying(50),
    model_performance_score numeric(5,4),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE analytics.ai_fraud_analytics OWNER TO bisiadedokun;

--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE ai_fraud_analytics; Type: COMMENT; Schema: analytics; Owner: bisiadedokun
--

COMMENT ON TABLE analytics.ai_fraud_analytics IS 'AI fraud detection performance metrics';


--
-- TOC entry 227 (class 1259 OID 28171)
-- Name: cbn_compliance_reports; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.cbn_compliance_reports (
    report_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    report_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    submission_deadline timestamp without time zone NOT NULL,
    submitted_at timestamp without time zone,
    acknowledged_at timestamp without time zone,
    description text NOT NULL,
    impact text NOT NULL,
    mitigation_actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.cbn_compliance_reports OWNER TO bisiadedokun;

--
-- TOC entry 228 (class 1259 OID 28181)
-- Name: cbn_incidents; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.cbn_incidents (
    incident_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    impact_level character varying(20) NOT NULL,
    affected_systems jsonb DEFAULT '[]'::jsonb NOT NULL,
    customer_impact integer DEFAULT 0 NOT NULL,
    financial_impact numeric(15,2) DEFAULT 0 NOT NULL,
    data_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    detected_at timestamp without time zone NOT NULL,
    reported_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone,
    root_cause text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
    compliance_report_id character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.cbn_incidents OWNER TO bisiadedokun;

--
-- TOC entry 229 (class 1259 OID 28195)
-- Name: cbn_security_audits; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.cbn_security_audits (
    audit_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    audit_type character varying(50) NOT NULL,
    scope jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    auditor character varying(255) NOT NULL,
    findings jsonb DEFAULT '[]'::jsonb NOT NULL,
    risk_rating character varying(20),
    compliance_score integer DEFAULT 0,
    recommendations jsonb DEFAULT '[]'::jsonb NOT NULL,
    action_plan jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.cbn_security_audits OWNER TO bisiadedokun;

--
-- TOC entry 230 (class 1259 OID 28208)
-- Name: data_localization_checks; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.data_localization_checks (
    check_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    data_type character varying(50) NOT NULL,
    storage_location character varying(50) NOT NULL,
    compliance boolean DEFAULT false NOT NULL,
    last_checked timestamp without time zone DEFAULT now() NOT NULL,
    issues jsonb DEFAULT '[]'::jsonb NOT NULL,
    remediation jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.data_localization_checks OWNER TO bisiadedokun;

--
-- TOC entry 231 (class 1259 OID 28219)
-- Name: network_segmentation; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.network_segmentation (
    segmentation_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    environment_type character varying(50) NOT NULL,
    segment_description text,
    validation_method character varying(100),
    last_validated timestamp without time zone DEFAULT now() NOT NULL,
    validation_results jsonb DEFAULT '{}'::jsonb NOT NULL,
    compliance_status boolean DEFAULT false NOT NULL,
    findings jsonb DEFAULT '[]'::jsonb NOT NULL,
    remediation_plan jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.network_segmentation OWNER TO bisiadedokun;

--
-- TOC entry 232 (class 1259 OID 28230)
-- Name: pci_dss_compliance; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.pci_dss_compliance (
    compliance_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    merchant_level integer DEFAULT 1 NOT NULL,
    assessment_type character varying(50) NOT NULL,
    compliance_status character varying(30) DEFAULT 'not_assessed'::character varying NOT NULL,
    last_assessment timestamp without time zone,
    next_assessment timestamp without time zone,
    valid_until timestamp without time zone,
    requirements jsonb DEFAULT '[]'::jsonb NOT NULL,
    network_security jsonb DEFAULT '{}'::jsonb NOT NULL,
    cardholder_data_protection jsonb DEFAULT '{}'::jsonb NOT NULL,
    vulnerability_management jsonb DEFAULT '{}'::jsonb NOT NULL,
    access_control jsonb DEFAULT '{}'::jsonb NOT NULL,
    monitoring jsonb DEFAULT '{}'::jsonb NOT NULL,
    security_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.pci_dss_compliance OWNER TO bisiadedokun;

--
-- TOC entry 233 (class 1259 OID 28246)
-- Name: pci_dss_findings; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.pci_dss_findings (
    finding_id character varying(255) NOT NULL,
    requirement_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    severity character varying(20) NOT NULL,
    description text NOT NULL,
    risk text NOT NULL,
    recommendation text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    due_date timestamp without time zone,
    assignee character varying(255),
    remediation_evidence jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.pci_dss_findings OWNER TO bisiadedokun;

--
-- TOC entry 234 (class 1259 OID 28254)
-- Name: pci_dss_requirements; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.pci_dss_requirements (
    requirement_id character varying(255) NOT NULL,
    compliance_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    requirement_number character varying(20) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    priority character varying(20) NOT NULL,
    status character varying(30) DEFAULT 'not_assessed'::character varying NOT NULL,
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_tested timestamp without time zone,
    next_test timestamp without time zone,
    findings jsonb DEFAULT '[]'::jsonb NOT NULL,
    compensating_controls jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.pci_dss_requirements OWNER TO bisiadedokun;

--
-- TOC entry 235 (class 1259 OID 28264)
-- Name: security_alerts; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.security_alerts (
    alert_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    title character varying(500) NOT NULL,
    description text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    trigger_events jsonb DEFAULT '[]'::jsonb NOT NULL,
    rule_name character varying(255) NOT NULL,
    rule_description text,
    risk_score integer DEFAULT 0 NOT NULL,
    threat_actors jsonb DEFAULT '[]'::jsonb NOT NULL,
    affected_assets jsonb DEFAULT '[]'::jsonb NOT NULL,
    potential_impact text,
    status character varying(30) DEFAULT 'open'::character varying NOT NULL,
    assigned_to character varying(255),
    escalated boolean DEFAULT false NOT NULL,
    response_time integer,
    resolution_time integer,
    investigation_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_alerts jsonb DEFAULT '[]'::jsonb NOT NULL,
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE audit.security_alerts OWNER TO bisiadedokun;

--
-- TOC entry 236 (class 1259 OID 28280)
-- Name: siem_events; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.siem_events (
    event_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    event_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    source character varying(255) NOT NULL,
    source_ip inet,
    user_id character varying(255),
    description text NOT NULL,
    raw_log text,
    parsed_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    correlation_id character varying(255),
    risk_score integer DEFAULT 0 NOT NULL,
    indicators jsonb DEFAULT '[]'::jsonb NOT NULL,
    related_events jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(30) DEFAULT 'new'::character varying NOT NULL,
    assigned_to character varying(255),
    investigation_notes text,
    response_actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    compliance_relevance jsonb DEFAULT '[]'::jsonb NOT NULL,
    retention_period integer DEFAULT 2555 NOT NULL,
    forensic_evidence jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.siem_events OWNER TO bisiadedokun;

--
-- TOC entry 237 (class 1259 OID 28295)
-- Name: siem_rules; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.siem_rules (
    rule_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    rule_name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(50) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
    time_window integer DEFAULT 60 NOT NULL,
    threshold integer DEFAULT 1 NOT NULL,
    severity character varying(20) NOT NULL,
    alert_actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    automated_responses jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by character varying(255) NOT NULL,
    last_modified timestamp without time zone DEFAULT now() NOT NULL,
    trigger_count integer DEFAULT 0 NOT NULL,
    false_positive_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE audit.siem_rules OWNER TO bisiadedokun;

--
-- TOC entry 238 (class 1259 OID 28310)
-- Name: tenant_audit_logs; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.tenant_audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    service_name character varying(100) NOT NULL,
    operation character varying(100) NOT NULL,
    endpoint character varying(255),
    http_method character varying(10),
    user_id uuid,
    user_email character varying(255),
    user_role character varying(50),
    session_id character varying(255),
    request_id uuid,
    ip_address inet,
    user_agent text,
    event_type character varying(50) NOT NULL,
    resource_type character varying(100),
    resource_id uuid,
    before_data jsonb,
    after_data jsonb,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_analysis jsonb,
    risk_level character varying(20),
    anomaly_score numeric(5,4),
    compliance_flags text[],
    status character varying(20) DEFAULT 'logged'::character varying,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    resolution_notes text,
    response_time numeric(8,2),
    response_code integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tenant_audit_logs_event_type_check CHECK (((event_type)::text = ANY (ARRAY[('create'::character varying)::text, ('read'::character varying)::text, ('update'::character varying)::text, ('delete'::character varying)::text, ('auth'::character varying)::text, ('transaction'::character varying)::text, ('admin'::character varying)::text, ('system'::character varying)::text]))),
    CONSTRAINT tenant_audit_logs_risk_level_check CHECK (((risk_level)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('critical'::character varying)::text]))),
    CONSTRAINT tenant_audit_logs_status_check CHECK (((status)::text = ANY (ARRAY[('logged'::character varying)::text, ('reviewed'::character varying)::text, ('investigated'::character varying)::text, ('resolved'::character varying)::text])))
);


ALTER TABLE audit.tenant_audit_logs OWNER TO bisiadedokun;

--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE tenant_audit_logs; Type: COMMENT; Schema: audit; Owner: bisiadedokun
--

COMMENT ON TABLE audit.tenant_audit_logs IS 'Comprehensive audit trail';


--
-- TOC entry 239 (class 1259 OID 28322)
-- Name: threat_intelligence; Type: TABLE; Schema: audit; Owner: bisiadedokun
--

CREATE TABLE audit.threat_intelligence (
    indicator_id character varying(255) NOT NULL,
    tenant_id character varying(255) NOT NULL,
    indicator_value character varying(500) NOT NULL,
    indicator_type character varying(50) NOT NULL,
    confidence integer DEFAULT 50 NOT NULL,
    source character varying(255) NOT NULL,
    description text,
    first_seen timestamp without time zone DEFAULT now() NOT NULL,
    last_seen timestamp without time zone DEFAULT now() NOT NULL,
    threat_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    campaigns jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);


ALTER TABLE audit.threat_intelligence OWNER TO bisiadedokun;

--
-- TOC entry 240 (class 1259 OID 28335)
-- Name: ai_intent_templates; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.ai_intent_templates (
    id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    description text,
    default_patterns jsonb DEFAULT '[]'::jsonb,
    is_banking_standard boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE platform.ai_intent_templates OWNER TO bisiadedokun;

--
-- TOC entry 241 (class 1259 OID 28343)
-- Name: ai_intent_templates_id_seq; Type: SEQUENCE; Schema: platform; Owner: bisiadedokun
--

CREATE SEQUENCE platform.ai_intent_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE platform.ai_intent_templates_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 241
-- Name: ai_intent_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ai_intent_templates_id_seq OWNED BY platform.ai_intent_templates.id;


--
-- TOC entry 242 (class 1259 OID 28344)
-- Name: ai_models; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.ai_models (
    id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    provider character varying(50) NOT NULL,
    model_version character varying(50),
    capabilities jsonb DEFAULT '{}'::jsonb,
    cost_per_request numeric(10,6),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE platform.ai_models OWNER TO bisiadedokun;

--
-- TOC entry 243 (class 1259 OID 28353)
-- Name: ai_models_id_seq; Type: SEQUENCE; Schema: platform; Owner: bisiadedokun
--

CREATE SEQUENCE platform.ai_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE platform.ai_models_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 243
-- Name: ai_models_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ai_models_id_seq OWNED BY platform.ai_models.id;


--
-- TOC entry 244 (class 1259 OID 28354)
-- Name: bill_provider_templates; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.bill_provider_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_code character varying(50) NOT NULL,
    provider_name character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    logo_url text,
    validation_rules jsonb,
    fee_structure jsonb,
    api_config jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_bill_provider_templates_category CHECK (((category)::text = ANY (ARRAY[('electricity'::character varying)::text, ('water'::character varying)::text, ('internet'::character varying)::text, ('cable'::character varying)::text, ('insurance'::character varying)::text, ('education'::character varying)::text, ('government'::character varying)::text])))
);


ALTER TABLE platform.bill_provider_templates OWNER TO bisiadedokun;

--
-- TOC entry 245 (class 1259 OID 28364)
-- Name: currency_config; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.currency_config (
    code character varying(3) NOT NULL,
    name character varying(50) NOT NULL,
    symbol character varying(5) NOT NULL,
    decimal_places smallint DEFAULT 2,
    symbol_position character varying(10) DEFAULT 'before'::character varying,
    enabled boolean DEFAULT true,
    countries jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT currency_config_decimal_places_check CHECK (((decimal_places >= 0) AND (decimal_places <= 8))),
    CONSTRAINT currency_config_symbol_position_check CHECK (((symbol_position)::text = ANY (ARRAY[('before'::character varying)::text, ('after'::character varying)::text])))
);


ALTER TABLE platform.currency_config OWNER TO bisiadedokun;

--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE currency_config; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.currency_config IS 'Master configuration for supported currencies worldwide';


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.code; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.code IS 'ISO 4217 3-letter currency code';


--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.symbol; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.symbol IS 'Currency symbol (e.g., $, €, ₦)';


--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.decimal_places; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.decimal_places IS 'Number of decimal places for currency (usually 2)';


--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.symbol_position; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.symbol_position IS 'Position of symbol relative to amount (before/after)';


--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.countries; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.countries IS 'Array of ISO 3166-1 alpha-2 country codes';


--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN currency_config.metadata; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.metadata IS 'Additional currency metadata (region, central bank, etc.)';


--
-- TOC entry 246 (class 1259 OID 28378)
-- Name: exchange_rates; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_currency character varying(3) NOT NULL,
    to_currency character varying(3) NOT NULL,
    rate numeric(20,8) NOT NULL,
    source character varying(50) DEFAULT 'manual'::character varying,
    valid_from timestamp without time zone DEFAULT now(),
    valid_until timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT exchange_rates_check CHECK (((from_currency)::text <> (to_currency)::text)),
    CONSTRAINT exchange_rates_rate_check CHECK ((rate > (0)::numeric)),
    CONSTRAINT exchange_rates_source_check CHECK (((source)::text = ANY (ARRAY[('manual'::character varying)::text, ('api'::character varying)::text, ('central_bank'::character varying)::text, ('market'::character varying)::text])))
);


ALTER TABLE platform.exchange_rates OWNER TO bisiadedokun;

--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE exchange_rates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.exchange_rates IS 'Foreign exchange rates for currency conversion';


--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN exchange_rates.rate; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.rate IS 'Exchange rate (1 from_currency = rate * to_currency)';


--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN exchange_rates.source; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.source IS 'Source of exchange rate data';


--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN exchange_rates.valid_from; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.valid_from IS 'Start of validity period for this rate';


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN exchange_rates.valid_until; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.valid_until IS 'End of validity period (NULL = indefinite)';


--
-- TOC entry 247 (class 1259 OID 28390)
-- Name: in_app_notifications; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.in_app_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_id uuid,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    priority character varying(20) DEFAULT 'medium'::character varying,
    category character varying(50),
    action_url text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_in_app_notifications_priority CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text])))
);


ALTER TABLE platform.in_app_notifications OWNER TO bisiadedokun;

--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 247
-- Name: TABLE in_app_notifications; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.in_app_notifications IS 'Persistent in-app notifications that users can view in their notification center';


--
-- TOC entry 248 (class 1259 OID 28401)
-- Name: ngn_bank_codes; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.ngn_bank_codes (
    id integer NOT NULL,
    bank_name character varying(255) NOT NULL,
    bank_code_3 character varying(3) NOT NULL,
    bank_code_6 character varying(6),
    bank_code_9 character varying(9),
    bank_type character varying(50),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bank_code_5 character varying(5)
);


ALTER TABLE platform.ngn_bank_codes OWNER TO bisiadedokun;

--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE ngn_bank_codes; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.ngn_bank_codes IS 'Nigerian bank codes from CBN/NIBSS - supports 3, 6, and 9 character formats';


--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ngn_bank_codes.bank_code_3; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_3 IS '3-character bank code used in transfers (e.g., 044 for Access Bank)';


--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ngn_bank_codes.bank_code_6; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_6 IS '6-character bank code (to be populated)';


--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN ngn_bank_codes.bank_code_9; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_9 IS '9-character bank code (inferred from 6-char or to be populated)';


--
-- TOC entry 249 (class 1259 OID 28407)
-- Name: ngn_bank_codes_id_seq; Type: SEQUENCE; Schema: platform; Owner: bisiadedokun
--

CREATE SEQUENCE platform.ngn_bank_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE platform.ngn_bank_codes_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 249
-- Name: ngn_bank_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ngn_bank_codes_id_seq OWNED BY platform.ngn_bank_codes.id;


--
-- TOC entry 250 (class 1259 OID 28408)
-- Name: notification_logs; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_id uuid,
    channel character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    provider character varying(50),
    provider_response jsonb,
    cost numeric(10,4),
    delivery_time interval,
    error_code character varying(50),
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_notification_logs_cost CHECK ((cost >= (0)::numeric)),
    CONSTRAINT chk_notification_logs_status CHECK (((status)::text = ANY (ARRAY[('sent'::character varying)::text, ('failed'::character varying)::text, ('bounced'::character varying)::text, ('delivered'::character varying)::text, ('opened'::character varying)::text, ('clicked'::character varying)::text])))
);


ALTER TABLE platform.notification_logs OWNER TO bisiadedokun;

pg_dump: creating FUNCTION "public.cleanup_expired_data()"
pg_dump: creating FUNCTION "public.create_wallet_transaction()"
pg_dump: creating FUNCTION "public.generate_transaction_reference()"
pg_dump: creating FUNCTION "public.generate_wallet_number()"
pg_dump: creating FUNCTION "public.get_current_tenant_id()"
pg_dump: creating FUNCTION "public.log_tenant_changes()"
pg_dump: creating FUNCTION "public.update_updated_at_column()"
pg_dump: creating FUNCTION "public.update_wallet_balance()"
pg_dump: creating FUNCTION "tenant.check_user_permission(uuid, uuid, character varying, uuid)"
pg_dump: creating FUNCTION "tenant.get_user_permission_level(uuid, uuid, character varying)"
pg_dump: creating TABLE "analytics.ai_conversation_analytics"
pg_dump: creating COMMENT "analytics.TABLE ai_conversation_analytics"
pg_dump: creating TABLE "analytics.ai_fraud_analytics"
pg_dump: creating COMMENT "analytics.TABLE ai_fraud_analytics"
pg_dump: creating TABLE "audit.cbn_compliance_reports"
pg_dump: creating TABLE "audit.cbn_incidents"
pg_dump: creating TABLE "audit.cbn_security_audits"
pg_dump: creating TABLE "audit.data_localization_checks"
pg_dump: creating TABLE "audit.network_segmentation"
pg_dump: creating TABLE "audit.pci_dss_compliance"
pg_dump: creating TABLE "audit.pci_dss_findings"
pg_dump: creating TABLE "audit.pci_dss_requirements"
pg_dump: creating TABLE "audit.security_alerts"
pg_dump: creating TABLE "audit.siem_events"
pg_dump: creating TABLE "audit.siem_rules"
pg_dump: creating TABLE "audit.tenant_audit_logs"
pg_dump: creating COMMENT "audit.TABLE tenant_audit_logs"
pg_dump: creating TABLE "audit.threat_intelligence"
pg_dump: creating TABLE "platform.ai_intent_templates"
pg_dump: creating SEQUENCE "platform.ai_intent_templates_id_seq"
pg_dump: creating SEQUENCE OWNED BY "platform.ai_intent_templates_id_seq"
pg_dump: creating TABLE "platform.ai_models"
pg_dump: creating SEQUENCE "platform.ai_models_id_seq"
pg_dump: creating SEQUENCE OWNED BY "platform.ai_models_id_seq"
pg_dump: creating TABLE "platform.bill_provider_templates"
pg_dump: creating TABLE "platform.currency_config"
pg_dump: creating COMMENT "platform.TABLE currency_config"
pg_dump: creating COMMENT "platform.COLUMN currency_config.code"
pg_dump: creating COMMENT "platform.COLUMN currency_config.symbol"
pg_dump: creating COMMENT "platform.COLUMN currency_config.decimal_places"
pg_dump: creating COMMENT "platform.COLUMN currency_config.symbol_position"
pg_dump: creating COMMENT "platform.COLUMN currency_config.countries"
pg_dump: creating COMMENT "platform.COLUMN currency_config.metadata"
pg_dump: creating TABLE "platform.exchange_rates"
pg_dump: creating COMMENT "platform.TABLE exchange_rates"
pg_dump: creating COMMENT "platform.COLUMN exchange_rates.rate"
pg_dump: creating COMMENT "platform.COLUMN exchange_rates.source"
pg_dump: creating COMMENT "platform.COLUMN exchange_rates.valid_from"
pg_dump: creating COMMENT "platform.COLUMN exchange_rates.valid_until"
pg_dump: creating TABLE "platform.in_app_notifications"
pg_dump: creating COMMENT "platform.TABLE in_app_notifications"
pg_dump: creating TABLE "platform.ngn_bank_codes"
pg_dump: creating COMMENT "platform.TABLE ngn_bank_codes"
pg_dump: creating COMMENT "platform.COLUMN ngn_bank_codes.bank_code_3"
pg_dump: creating COMMENT "platform.COLUMN ngn_bank_codes.bank_code_6"
pg_dump: creating COMMENT "platform.COLUMN ngn_bank_codes.bank_code_9"
pg_dump: creating SEQUENCE "platform.ngn_bank_codes_id_seq"
pg_dump: creating SEQUENCE OWNED BY "platform.ngn_bank_codes_id_seq"
pg_dump: creating TABLE "platform.notification_logs"
pg_dump: creating COMMENT "platform.TABLE notification_logs"
--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE notification_logs; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_logs IS 'Audit log for notification delivery attempts and results';


--
-- TOC entry 251 (class 1259 OID 28417)
-- Name: notification_preferences; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    transfer_initiated jsonb DEFAULT '[{"type": "push", "enabled": true}, {"type": "in_app", "enabled": true}]'::jsonb,
    transfer_completed jsonb DEFAULT '[{"type": "push", "enabled": true}, {"type": "sms", "enabled": true}, {"type": "in_app", "enabled": true}]'::jsonb,
    transfer_failed jsonb DEFAULT '[{"type": "push", "enabled": true}, {"type": "sms", "enabled": true}, {"type": "email", "enabled": true}, {"type": "in_app", "enabled": true}]'::jsonb,
    receipt_generated jsonb DEFAULT '[{"type": "in_app", "enabled": true}]'::jsonb,
    security_alerts jsonb DEFAULT '[{"type": "push", "enabled": true}, {"type": "sms", "enabled": true}, {"type": "email", "enabled": true}, {"type": "in_app", "enabled": true}]'::jsonb,
    promotional_offers jsonb DEFAULT '[{"type": "push", "enabled": false}, {"type": "email", "enabled": false}, {"type": "in_app", "enabled": true}]'::jsonb,
    quiet_hours jsonb DEFAULT '{"end": "08:00", "start": "22:00", "enabled": false}'::jsonb,
    max_daily_notifications integer DEFAULT 50,
    timezone character varying(50) DEFAULT 'Africa/Lagos'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.notification_preferences OWNER TO bisiadedokun;

--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 251
-- Name: TABLE notification_preferences; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_preferences IS 'User preferences for different types of notifications and channels';


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 251
-- Name: COLUMN notification_preferences.quiet_hours; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notification_preferences.quiet_hours IS 'JSON object defining quiet hours when notifications should not be sent';


--
-- TOC entry 252 (class 1259 OID 28435)
-- Name: notification_statistics; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.notification_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    date date NOT NULL,
    channel character varying(20) NOT NULL,
    event_type character varying(50) NOT NULL,
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    opened_count integer DEFAULT 0,
    clicked_count integer DEFAULT 0,
    total_cost numeric(10,4) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_notification_statistics_cost CHECK ((total_cost >= (0)::numeric)),
    CONSTRAINT chk_notification_statistics_counts CHECK (((sent_count >= 0) AND (delivered_count >= 0) AND (failed_count >= 0) AND (opened_count >= 0) AND (clicked_count >= 0)))
);


ALTER TABLE platform.notification_statistics OWNER TO bisiadedokun;

--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE notification_statistics; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_statistics IS 'Daily aggregated statistics for notification analytics';


--
-- TOC entry 253 (class 1259 OID 28449)
-- Name: notification_templates; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    channel character varying(20) NOT NULL,
    language character varying(10) DEFAULT 'en'::character varying,
    subject character varying(255),
    title character varying(255) NOT NULL,
    body text NOT NULL,
    html_body text,
    variables text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.notification_templates OWNER TO bisiadedokun;

--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE notification_templates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_templates IS 'Customizable notification templates for different events and channels';


--
-- TOC entry 254 (class 1259 OID 28461)
-- Name: notifications; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    data jsonb,
    channels jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_notifications_max_retries CHECK ((max_retries >= 0)),
    CONSTRAINT chk_notifications_priority CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text]))),
    CONSTRAINT chk_notifications_retry_count CHECK ((retry_count >= 0)),
    CONSTRAINT chk_notifications_status CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('sent'::character varying)::text, ('failed'::character varying)::text, ('expired'::character varying)::text])))
);


ALTER TABLE platform.notifications OWNER TO bisiadedokun;

--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE notifications; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notifications IS 'Main notifications table tracking all notifications sent to users';


--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 254
-- Name: COLUMN notifications.data; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notifications.data IS 'JSON data containing notification context and variables';


--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 254
-- Name: COLUMN notifications.channels; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notifications.channels IS 'Array of notification channels used for this notification';


--
-- TOC entry 255 (class 1259 OID 28477)
-- Name: platform_config; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.platform_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value jsonb NOT NULL,
    config_type character varying(50) DEFAULT 'system'::character varying NOT NULL,
    description text,
    is_sensitive boolean DEFAULT false,
    environment character varying(20) DEFAULT 'all'::character varying,
    version integer DEFAULT 1,
    is_active boolean DEFAULT true,
    effective_from timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    effective_until timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    CONSTRAINT platform_config_config_type_check CHECK (((config_type)::text = ANY (ARRAY[('ai'::character varying)::text, ('security'::character varying)::text, ('payment'::character varying)::text, ('system'::character varying)::text, ('feature'::character varying)::text]))),
    CONSTRAINT platform_config_environment_check CHECK (((environment)::text = ANY (ARRAY[('development'::character varying)::text, ('staging'::character varying)::text, ('production'::character varying)::text, ('all'::character varying)::text])))
);


ALTER TABLE platform.platform_config OWNER TO bisiadedokun;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE platform_config; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.platform_config IS 'Platform-wide configuration settings';


--
-- TOC entry 256 (class 1259 OID 28492)
-- Name: rbac_permissions; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.rbac_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    is_system_permission boolean DEFAULT false,
    cbn_regulation_ref character varying(100),
    nibss_requirement boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.rbac_permissions OWNER TO bisiadedokun;

--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE rbac_permissions; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_permissions IS 'Master catalog of all available permissions in the system';


--
-- TOC entry 257 (class 1259 OID 28502)
-- Name: rbac_role_permissions; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.rbac_role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid,
    permission_id uuid,
    permission_level character varying(20) DEFAULT 'read'::character varying NOT NULL,
    conditions jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.rbac_role_permissions OWNER TO bisiadedokun;

--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE rbac_role_permissions; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_role_permissions IS 'Default role-permission mappings that serve as templates for tenant RBAC setup';


pg_dump: creating TABLE "platform.notification_preferences"
pg_dump: creating COMMENT "platform.TABLE notification_preferences"
pg_dump: creating COMMENT "platform.COLUMN notification_preferences.quiet_hours"
pg_dump: creating TABLE "platform.notification_statistics"
pg_dump: creating COMMENT "platform.TABLE notification_statistics"
pg_dump: creating TABLE "platform.notification_templates"
pg_dump: creating COMMENT "platform.TABLE notification_templates"
pg_dump: creating TABLE "platform.notifications"
pg_dump: creating COMMENT "platform.TABLE notifications"
pg_dump: creating COMMENT "platform.COLUMN notifications.data"
pg_dump: creating COMMENT "platform.COLUMN notifications.channels"
pg_dump: creating TABLE "platform.platform_config"
pg_dump: creating COMMENT "platform.TABLE platform_config"
pg_dump: creating TABLE "platform.rbac_permissions"
pg_dump: creating COMMENT "platform.TABLE rbac_permissions"
pg_dump: creating TABLE "platform.rbac_role_permissions"
pg_dump: creating COMMENT "platform.TABLE rbac_role_permissions"
pg_dump:--
-- TOC entry 258 (class 1259 OID 28510)
-- Name: rbac_roles; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.rbac_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    level integer DEFAULT 0 NOT NULL,
    is_system_role boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.rbac_roles OWNER TO bisiadedokun;

--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE rbac_roles; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_roles IS 'Platform-level role templates that can be inherited by tenants';


--
-- TOC entry 259 (class 1259 OID 28520)
-- Name: receipt_templates; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.receipt_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    template_name character varying(100) NOT NULL,
    template_content text NOT NULL,
    template_variables jsonb,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.receipt_templates OWNER TO bisiadedokun;

--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE receipt_templates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.receipt_templates IS 'Customizable receipt templates for different transaction types';


--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 259
-- Name: COLUMN receipt_templates.template_variables; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.receipt_templates.template_variables IS 'Available variables for the template';


--
-- TOC entry 260 (class 1259 OID 28530)
-- Name: tenant_assets; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.tenant_assets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_type character varying(50) NOT NULL,
    asset_name character varying(100) NOT NULL,
    asset_data text NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    dimensions jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tenant_assets_asset_type_check CHECK (((asset_type)::text = ANY (ARRAY[('logo'::character varying)::text, ('favicon'::character varying)::text, ('hero_image'::character varying)::text, ('background'::character varying)::text, ('icon'::character varying)::text, ('stylesheet'::character varying)::text, ('brand_colors'::character varying)::text, ('brand_fonts'::character varying)::text, ('brand_styling'::character varying)::text])))
);


ALTER TABLE platform.tenant_assets OWNER TO bisiadedokun;

--
-- TOC entry 261 (class 1259 OID 28540)
-- Name: tenant_billing; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.tenant_billing (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    base_fee numeric(15,2) DEFAULT 0 NOT NULL,
    transaction_fees numeric(15,2) DEFAULT 0 NOT NULL,
    overage_fees numeric(15,2) DEFAULT 0 NOT NULL,
    ai_usage_fees numeric(15,2) DEFAULT 0 NOT NULL,
    support_fees numeric(15,2) DEFAULT 0 NOT NULL,
    subtotal numeric(15,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(15,2) DEFAULT 0 NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp without time zone,
    payment_method character varying(50),
    payment_reference character varying(100),
    usage_stats jsonb DEFAULT '{"api_calls": 0, "storage_gb": 0, "ai_requests": 0, "active_users": 0, "bandwidth_gb": 0, "transactions": 0}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tenant_billing_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('pending'::character varying)::text, ('paid'::character varying)::text, ('overdue'::character varying)::text, ('cancelled'::character varying)::text, ('refunded'::character varying)::text])))
);


ALTER TABLE platform.tenant_billing OWNER TO bisiadedokun;

--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE tenant_billing; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenant_billing IS 'Tenant billing records and invoicing';


--
-- TOC entry 262 (class 1259 OID 28559)
-- Name: tenant_usage_metrics; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.tenant_usage_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    metric_date date NOT NULL,
    transaction_count integer DEFAULT 0 NOT NULL,
    transaction_volume numeric(15,2) DEFAULT 0 NOT NULL,
    failed_transactions integer DEFAULT 0 NOT NULL,
    api_calls integer DEFAULT 0 NOT NULL,
    api_errors integer DEFAULT 0 NOT NULL,
    average_response_time numeric(8,2) DEFAULT 0,
    ai_requests integer DEFAULT 0 NOT NULL,
    ai_processing_time numeric(10,2) DEFAULT 0 NOT NULL,
    conversation_sessions integer DEFAULT 0 NOT NULL,
    fraud_assessments integer DEFAULT 0 NOT NULL,
    storage_used bigint DEFAULT 0 NOT NULL,
    bandwidth_used bigint DEFAULT 0 NOT NULL,
    cpu_usage_hours numeric(10,2) DEFAULT 0,
    memory_usage_gb_hours numeric(10,2) DEFAULT 0,
    active_users integer DEFAULT 0 NOT NULL,
    daily_logins integer DEFAULT 0 NOT NULL,
    unique_sessions integer DEFAULT 0 NOT NULL,
    features_used jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE platform.tenant_usage_metrics OWNER TO bisiadedokun;

--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE tenant_usage_metrics; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenant_usage_metrics IS 'Real-time tenant usage tracking';


--
-- TOC entry 263 (class 1259 OID 28584)
-- Name: tenants; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.tenants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    subdomain character varying(100) NOT NULL,
    custom_domain character varying(255),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    tier character varying(20) DEFAULT 'basic'::character varying NOT NULL,
    region character varying(50) DEFAULT 'nigeria-west'::character varying NOT NULL,
    compliance_level character varying(10) DEFAULT 'tier2'::character varying NOT NULL,
    database_config jsonb DEFAULT '{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}'::jsonb NOT NULL,
    configuration jsonb DEFAULT '{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}'::jsonb NOT NULL,
    ai_configuration jsonb DEFAULT '{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}'::jsonb NOT NULL,
    branding jsonb DEFAULT '{"locale": "en-NG", "logoUrl": "/assets/default-logo.png", "tagline": "Your trusted payment solution", "appTitle": "Banking PoS", "currency": "NGN", "darkMode": false, "textColor": "#333333", "dateFormat": "DD/MM/YYYY", "faviconUrl": "/assets/default-favicon.ico", "fontFamily": "Roboto", "timeFormat": "HH:mm", "accentColor": "#ff9800", "companyName": "Default Bank", "borderRadius": 8, "primaryColor": "#1976d2", "secondaryColor": "#f50057", "backgroundColor": "#ffffff"}'::jsonb NOT NULL,
    security_settings jsonb DEFAULT '{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}'::jsonb NOT NULL,
    billing_info jsonb DEFAULT '{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}'::jsonb NOT NULL,
    compliance_settings jsonb DEFAULT '{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    last_modified_by uuid,
    brand_colors jsonb DEFAULT '{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}'::jsonb,
    brand_typography jsonb DEFAULT '{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}'::jsonb,
    brand_assets jsonb DEFAULT '{}'::jsonb,
    database_name character varying(255),
    database_host character varying(255) DEFAULT 'localhost'::character varying,
    database_port integer DEFAULT 5433,
    connection_string text,
    database_status character varying(50) DEFAULT 'pending'::character varying,
    bank_code character varying(10),
    currency character varying(3) DEFAULT 'NGN'::character varying,
    locale character varying(10) DEFAULT 'en-NG'::character varying,
    timezone character varying(50) DEFAULT 'Africa/Lagos'::character varying,
    date_format character varying(20) DEFAULT 'DD/MM/YYYY'::character varying,
    number_format jsonb DEFAULT '{"decimal": ".", "precision": 2, "thousands": ","}'::jsonb,
    CONSTRAINT check_name_format CHECK (((name)::text ~ '^[a-z0-9_-]+$'::text)),
    CONSTRAINT check_subdomain_format CHECK (((subdomain)::text ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT tenants_compliance_level_check CHECK (((compliance_level)::text = ANY (ARRAY[('tier1'::character varying)::text, ('tier2'::character varying)::text, ('tier3'::character varying)::text]))),
    CONSTRAINT tenants_currency_check CHECK (((currency)::text = ANY (ARRAY[('NGN'::character varying)::text, ('USD'::character varying)::text, ('EUR'::character varying)::text, ('GBP'::character varying)::text, ('CAD'::character varying)::text, ('ZAR'::character varying)::text, ('KES'::character varying)::text, ('GHS'::character varying)::text]))),
    CONSTRAINT tenants_database_status_check CHECK (((database_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('provisioning'::character varying)::text, ('active'::character varying)::text, ('maintenance'::character varying)::text, ('error'::character varying)::text]))),
    CONSTRAINT tenants_locale_check CHECK (((locale)::text ~ '^[a-z]{2}-[A-Z]{2}$'::text)),
    CONSTRAINT tenants_region_check CHECK (((region)::text = ANY (ARRAY[('africa-west'::character varying)::text, ('africa-east'::character varying)::text, ('africa-south'::character varying)::text, ('africa-north'::character varying)::text, ('africa-central'::character varying)::text, ('north-america-east'::character varying)::text, ('north-america-west'::character varying)::text, ('north-america-central'::character varying)::text, ('europe-west'::character varying)::text, ('europe-central'::character varying)::text, ('europe-east'::character varying)::text, ('europe-north'::character varying)::text, ('europe-south'::character varying)::text, ('asia-pacific-east'::character varying)::text, ('asia-pacific-southeast'::character varying)::text, ('asia-pacific-south'::character varying)::text, ('middle-east'::character varying)::text, ('south-america-east'::character varying)::text, ('south-america-west'::character varying)::text, ('nigeria-west'::character varying)::text]))),
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('suspended'::character varying)::text, ('inactive'::character varying)::text, ('pending'::character varying)::text, ('provisioning'::character varying)::text]))),
    CONSTRAINT tenants_tier_check CHECK (((tier)::text = ANY (ARRAY[('basic'::character varying)::text, ('premium'::character varying)::text, ('enterprise'::character varying)::text])))
);


ALTER TABLE platform.tenants OWNER TO bisiadedokun;

--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE tenants; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenants IS 'Master tenant registry with configuration';


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.database_name; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.database_name IS 'Isolated database name for this tenant';


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.connection_string; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.connection_string IS 'PostgreSQL connection string for tenant database';


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.database_status; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.database_status IS 'Current status of tenant database';


--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.currency; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.currency IS 'ISO 4217 currency code (NGN, USD, EUR, GBP, CAD, ZAR, KES, GHS)';


 creating TABLE "platform.rbac_roles"
pg_dump: creating COMMENT "platform.TABLE rbac_roles"
pg_dump: creating TABLE "platform.receipt_templates"
pg_dump: creating COMMENT "platform.TABLE receipt_templates"
pg_dump: creating COMMENT "platform.COLUMN receipt_templates.template_variables"
pg_dump: creating TABLE "platform.tenant_assets"
pg_dump: creating TABLE "platform.tenant_billing"
pg_dump: creating COMMENT "platform.TABLE tenant_billing"
pg_dump: creating TABLE "platform.tenant_usage_metrics"
pg_dump: creating COMMENT "platform.TABLE tenant_usage_metrics"
pg_dump: creating TABLE "platform.tenants"
pg_dump: creating COMMENT "platform.TABLE tenants"
pg_dump: creating COMMENT "platform.COLUMN tenants.database_name"
pg_dump: creating COMMENT "platform.COLUMN tenants.connection_string"
pg_dump: creating COMMENT "platform.COLUMN tenants.database_status"
pg_dump: creating COMMENT "platform.COLUMN tenants.currency"
pg_dump: creating COMMENT "platform.COLUMN tenants.locale"
--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.locale; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.locale IS 'BCP 47 locale code (e.g., en-US, en-NG, fr-CA, de-DE)';


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.timezone; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Africa/Lagos)';


--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.date_format; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.date_format IS 'Display format for dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)';


--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN tenants.number_format; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.number_format IS 'Number formatting configuration (decimal separator, thousands separator, precision)';


--
-- TOC entry 264 (class 1259 OID 28623)
-- Name: transaction_attachments; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.transaction_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    attachment_type character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    description text,
    uploaded_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_transaction_attachments_file_size_positive CHECK ((file_size > 0))
);


ALTER TABLE platform.transaction_attachments OWNER TO bisiadedokun;

--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE transaction_attachments; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_attachments IS 'File attachments related to transactions';


--
-- TOC entry 265 (class 1259 OID 28632)
-- Name: transaction_audit_log; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.transaction_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_by uuid NOT NULL,
    change_reason text,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.transaction_audit_log OWNER TO bisiadedokun;

--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE transaction_audit_log; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_audit_log IS 'Audit trail for transaction changes and events';


--
-- TOC entry 266 (class 1259 OID 28639)
-- Name: transaction_receipts; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.transaction_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    receipt_number character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    fees numeric(15,2) DEFAULT 0,
    total_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying,
    status character varying(20) NOT NULL,
    sender_details jsonb NOT NULL,
    recipient_details jsonb NOT NULL,
    transaction_date timestamp without time zone NOT NULL,
    description text,
    reference character varying(50) NOT NULL,
    session_id character varying(100),
    narration text,
    receipt_file_path text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_transaction_receipts_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_transaction_receipts_fees_non_negative CHECK ((fees >= (0)::numeric)),
    CONSTRAINT chk_transaction_receipts_total_amount_positive CHECK ((total_amount > (0)::numeric))
);


ALTER TABLE platform.transaction_receipts OWNER TO bisiadedokun;

--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE transaction_receipts; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_receipts IS 'Stores generated receipts for all transaction types';


--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN transaction_receipts.receipt_number; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_receipts.receipt_number IS 'Unique receipt number in format RCP{YYYYMMDD}{SEQUENCE}';


--
-- TOC entry 267 (class 1259 OID 28652)
-- Name: transaction_records; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.transaction_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    account_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    transaction_category character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    fees numeric(15,2) DEFAULT 0,
    total_amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying,
    status character varying(20) NOT NULL,
    reference character varying(50) NOT NULL,
    description text NOT NULL,
    recipient_details jsonb,
    metadata jsonb,
    tags text[],
    location_data jsonb,
    device_info jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_transaction_records_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_transaction_records_fees_non_negative CHECK ((fees >= (0)::numeric)),
    CONSTRAINT chk_transaction_records_total_amount_positive CHECK ((total_amount > (0)::numeric))
);


ALTER TABLE platform.transaction_records OWNER TO bisiadedokun;

--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE transaction_records; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_records IS 'Comprehensive transaction tracking table for all transfer types';


--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN transaction_records.recipient_details; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.recipient_details IS 'JSON object containing recipient information';


--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN transaction_records.metadata; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.metadata IS 'Additional transaction metadata and context';


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 267
-- Name: COLUMN transaction_records.tags; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.tags IS 'Array of tags for categorization and filtering';


--
-- TOC entry 268 (class 1259 OID 28665)
-- Name: user_devices; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.user_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    device_token character varying(500) NOT NULL,
    device_type character varying(20) NOT NULL,
    platform character varying(20) NOT NULL,
    app_version character varying(20),
    os_version character varying(20),
    device_name character varying(100),
    device_id character varying(255),
    is_active boolean DEFAULT true,
    last_used_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_user_devices_device_type CHECK (((device_type)::text = ANY (ARRAY[('ios'::character varying)::text, ('android'::character varying)::text, ('web'::character varying)::text]))),
    CONSTRAINT chk_user_devices_platform CHECK (((platform)::text = ANY (ARRAY[('fcm'::character varying)::text, ('apns'::character varying)::text, ('web_push'::character varying)::text])))
);


ALTER TABLE platform.user_devices OWNER TO bisiadedokun;

--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE user_devices; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.user_devices IS 'User device tokens for push notifications';


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN user_devices.device_token; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.user_devices.device_token IS 'FCM/APNS device token for push notifications';


--
-- TOC entry 269 (class 1259 OID 28677)
-- Name: v_notification_analytics; Type: VIEW; Schema: platform; Owner: bisiadedokun
--

CREATE VIEW platform.v_notification_analytics AS
 SELECT ns.tenant_id,
    ns.date,
    ns.channel,
    ns.event_type,
    ns.sent_count,
    ns.delivered_count,
    ns.failed_count,
    ns.opened_count,
    ns.clicked_count,
    ns.total_cost,
        CASE
            WHEN (ns.sent_count > 0) THEN (((ns.delivered_count)::numeric / (ns.sent_count)::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS delivery_rate,
        CASE
            WHEN (ns.delivered_count > 0) THEN (((ns.opened_count)::numeric / (ns.delivered_count)::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS open_rate,
        CASE
            WHEN (ns.opened_count > 0) THEN (((ns.clicked_count)::numeric / (ns.opened_count)::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END AS click_rate
   FROM platform.notification_statistics ns;


ALTER TABLE platform.v_notification_analytics OWNER TO bisiadedokun;

--
-- TOC entry 270 (class 1259 OID 28682)
-- Name: v_recent_transactions; Type: VIEW; Schema: platform; Owner: bisiadedokun
--

CREATE VIEW platform.v_recent_transactions AS
 SELECT tr.id,
    tr.tenant_id,
    tr.user_id,
    tr.account_id,
    tr.transaction_type,
    tr.transaction_category,
    tr.amount,
    tr.fees,
    tr.total_amount,
    tr.currency,
    tr.status,
    tr.reference,
    tr.description,
    tr.recipient_details,
    tr.created_at,
        CASE
            WHEN (tr.created_at >= (now() - '01:00:00'::interval)) THEN 'very_recent'::text
            WHEN (tr.created_at >= (now() - '24:00:00'::interval)) THEN 'recent'::text
            WHEN (tr.created_at >= (now() - '7 days'::interval)) THEN 'this_week'::text
            WHEN (tr.created_at >= (now() - '30 days'::interval)) THEN 'this_month'::text
            ELSE 'older'::text
        END AS recency
   FROM platform.transaction_records tr
  ORDER BY tr.created_at DESC;


ALTER TABLE platform.v_recent_transactions OWNER TO bisiadedokun;

--
-- TOC entry 271 (class 1259 OID 28687)
-- Name: v_transaction_summary; Type: VIEW; Schema: platform; Owner: bisiadedokun
--

CREATE VIEW platform.v_transaction_summary AS
 SELECT tr.tenant_id,
    tr.account_id,
    tr.transaction_type,
    tr.status,
    date(tr.created_at) AS transaction_date,
    count(*) AS transaction_count,
    sum(tr.amount) AS total_amount,
    sum(tr.fees) AS total_fees,
    sum(tr.total_amount) AS grand_total,
    avg(tr.amount) AS average_amount
   FROM platform.transaction_records tr
  GROUP BY tr.tenant_id, tr.account_id, tr.transaction_type, tr.status, (date(tr.created_at));


ALTER TABLE platform.v_transaction_summary OWNER TO bisiadedokun;

--
-- TOC entry 272 (class 1259 OID 28692)
-- Name: v_user_notification_summary; Type: VIEW; Schema: platform; Owner: bisiadedokun
--

CREATE VIEW platform.v_user_notification_summary AS
 SELECT ian.tenant_id,
    ian.user_id,
    count(*) AS total_notifications,
    count(*) FILTER (WHERE (ian.is_read = false)) AS unread_count,
    count(*) FILTER (WHERE (ian.is_read = true)) AS read_count,
    max(ian.created_at) AS last_notification_at,
    count(*) FILTER (WHERE (ian.created_at >= (now() - '24:00:00'::interval))) AS notifications_today,
    count(*) FILTER (WHERE (ian.created_at >= (now() - '7 days'::interval))) AS notifications_this_week
   FROM platform.in_app_notifications ian
  WHERE (ian.is_deleted = false)
  GROUP BY ian.tenant_id, ian.user_id;


ALTER TABLE platform.v_user_notification_summary OWNER TO bisiadedokun;

--
-- TOC entry 273 (class 1259 OID 28697)
-- Name: webhook_endpoints; Type: TABLE; Schema: platform; Owner: bisiadedokun
--

CREATE TABLE platform.webhook_endpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(500) NOT NULL,
    secret_key character varying(255) NOT NULL,
    events text[] NOT NULL,
    is_active boolean DEFAULT true,
    retry_policy jsonb DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}'::jsonb,
    headers jsonb,
    last_triggered_at timestamp without time zone,
    failure_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE platform.webhook_endpoints OWNER TO bisiadedokun;

--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE webhook_endpoints; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.webhook_endpoints IS 'External webhook endpoints for notification delivery';


--
-- TOC entry 274 (class 1259 OID 28708)
-- Name: account_access_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.account_access_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    wallet_id uuid,
    action character varying(50) NOT NULL,
    ip_address inet,
    user_agent text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tenant.account_access_logs OWNER TO bisiadedokun;

pg_dump: creating COMMENT "platform.COLUMN tenants.timezone"
pg_dump: creating COMMENT "platform.COLUMN tenants.date_format"
pg_dump: creating COMMENT "platform.COLUMN tenants.number_format"
pg_dump: creating TABLE "platform.transaction_attachments"
pg_dump: creating COMMENT "platform.TABLE transaction_attachments"
pg_dump: creating TABLE "platform.transaction_audit_log"
pg_dump: creating COMMENT "platform.TABLE transaction_audit_log"
pg_dump: creating TABLE "platform.transaction_receipts"
pg_dump: creating COMMENT "platform.TABLE transaction_receipts"
pg_dump: creating COMMENT "platform.COLUMN transaction_receipts.receipt_number"
pg_dump: creating TABLE "platform.transaction_records"
pg_dump: creating COMMENT "platform.TABLE transaction_records"
pg_dump: creating COMMENT "platform.COLUMN transaction_records.recipient_details"
pg_dump: creating COMMENT "platform.COLUMN transaction_records.metadata"
pg_dump: creating COMMENT "platform.COLUMN transaction_records.tags"
pg_dump: creating TABLE "platform.user_devices"
pg_dump: creating COMMENT "platform.TABLE user_devices"
pg_dump: creating COMMENT "platform.COLUMN user_devices.device_token"
pg_dump: creating VIEW "platform.v_notification_analytics"
pg_dump: creating VIEW "platform.v_recent_transactions"
pg_dump: creating VIEW "platform.v_transaction_summary"
pg_dump: creating VIEW "platform.v_user_notification_summary"
pg_dump: creating TABLE "platform.webhook_endpoints"
pg_dump: creating COMMENT "platform.TABLE webhook_endpoints"
pg_dump: creating TABLE "tenant.account_access_logs"
pg_dump: creating TABLE "tenant.ai_analytics_insights"
--
-- TOC entry 275 (class 1259 OID 28715)
-- Name: ai_analytics_insights; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_analytics_insights (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    insight_type character varying(100) NOT NULL,
    title_template text NOT NULL,
    description_template text NOT NULL,
    calculation_logic jsonb NOT NULL,
    threshold_conditions jsonb DEFAULT '{}'::jsonb,
    recommendation_template text,
    language character varying(10) DEFAULT 'en'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_analytics_insights OWNER TO bisiadedokun;

--
-- TOC entry 276 (class 1259 OID 28725)
-- Name: ai_analytics_insights_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_analytics_insights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_analytics_insights_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 276
-- Name: ai_analytics_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_analytics_insights_id_seq OWNED BY tenant.ai_analytics_insights.id;


pg_dump: creating SEQUENCE "tenant.ai_analytics_insights_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_analytics_insights_id_seq"
pg_dump: creating TABLE "tenant.ai_configuration"
--
-- TOC entry 277 (class 1259 OID 28726)
-- Name: ai_configuration; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_configuration (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    preferred_model_id integer,
    custom_system_prompt text,
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 500,
    rate_limit_per_hour integer DEFAULT 100,
    enable_learning boolean DEFAULT true,
    enable_analytics boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_configuration OWNER TO bisiadedokun;

--
-- TOC entry 278 (class 1259 OID 28738)
-- Name: ai_configuration_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_configuration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_configuration_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 278
-- Name: ai_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_configuration_id_seq OWNED BY tenant.ai_configuration.id;


pg_dump: creating SEQUENCE "tenant.ai_configuration_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_configuration_id_seq"
pg_dump: --
-- TOC entry 279 (class 1259 OID 28739)
-- Name: ai_context_mappings; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_context_mappings (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    intent_category_id integer,
    data_source character varying(100) NOT NULL,
    query_template text,
    aggregation_type character varying(50),
    cache_duration integer DEFAULT 300,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_context_mappings OWNER TO bisiadedokun;

--
-- TOC entry 280 (class 1259 OID 28748)
-- Name: ai_context_mappings_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_context_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_context_mappings_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 280
-- Name: ai_context_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_context_mappings_id_seq OWNED BY tenant.ai_context_mappings.id;


--
-- TOC entry 281 (class 1259 OID 28749)
-- Name: ai_conversation_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_conversation_logs (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    user_id integer,
    session_id character varying(255),
    user_message text NOT NULL,
    detected_intent character varying(100),
    confidence_score numeric(4,3),
    ai_response text NOT NULL,
    response_source character varying(50),
    user_feedback integer,
    processing_time_ms integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_conversation_logs OWNER TO bisiadedokun;

--
-- TOC entry 282 (class 1259 OID 28756)
-- Name: ai_conversation_logs_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_conversation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_conversation_logs_id_seq OWNER TO bisiadedokun;

creating TABLE "tenant.ai_context_mappings"
pg_dump: creating SEQUENCE "tenant.ai_context_mappings_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_context_mappings_id_seq"
pg_dump: creating TABLE "tenant.ai_conversation_logs"
pg_dump: creating SEQUENCE "tenant.ai_conversation_logs_id_seq"
pg_dump: --
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 282
-- Name: ai_conversation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_conversation_logs_id_seq OWNED BY tenant.ai_conversation_logs.id;


--
-- TOC entry 283 (class 1259 OID 28757)
-- Name: ai_intent_categories; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_intent_categories (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    priority integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_intent_categories OWNER TO bisiadedokun;

--
-- TOC entry 284 (class 1259 OID 28766)
-- Name: ai_intent_categories_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_intent_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_intent_categories_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 284
-- Name: ai_intent_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_intent_categories_id_seq OWNED BY tenant.ai_intent_categories.id;


--
-- TOC entry 285 (class 1259 OID 28767)
-- Name: ai_intent_patterns; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_intent_patterns (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    intent_category_id integer,
    pattern text NOT NULL,
    pattern_type character varying(50) DEFAULT 'keyword'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    confidence_weight numeric(3,2) DEFAULT 1.00,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_intent_patterns OWNER TO bisiadedokun;

creating SEQUENCE OWNED BY "tenant.ai_conversation_logs_id_seq"
pg_dump: creating TABLE "tenant.ai_intent_categories"
pg_dump: creating SEQUENCE "tenant.ai_intent_categories_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_intent_categories_id_seq"
pg_dump: creating TABLE "tenant.ai_intent_patterns"
pg_dump: creating SEQUENCE "tenant.ai_intent_patterns_id_seq"
--
-- TOC entry 286 (class 1259 OID 28778)
-- Name: ai_intent_patterns_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_intent_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_intent_patterns_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 286
-- Name: ai_intent_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_intent_patterns_id_seq OWNED BY tenant.ai_intent_patterns.id;


--
-- TOC entry 287 (class 1259 OID 28779)
-- Name: ai_learning_feedback; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_learning_feedback (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    conversation_log_id integer,
    feedback_type character varying(50),
    feedback_details jsonb DEFAULT '{}'::jsonb,
    correct_intent character varying(100),
    correct_response text,
    reviewed_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_learning_feedback OWNER TO bisiadedokun;

--
-- TOC entry 288 (class 1259 OID 28786)
-- Name: ai_learning_feedback_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_learning_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_learning_feedback_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 288
-- Name: ai_learning_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_learning_feedback_id_seq OWNED BY tenant.ai_learning_feedback.id;


--
-- TOC entry 289 (class 1259 OID 28787)
-- Name: ai_response_templates; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_response_templates (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    intent_category_id integer,
    template text NOT NULL,
    response_type character varying(50) DEFAULT 'conversational'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    context_requirements jsonb DEFAULT '{}'::jsonb,
    placeholder_mapping jsonb DEFAULT '{}'::jsonb,
    priority integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_response_templates OWNER TO bisiadedokun;

pg_dump: creating SEQUENCE OWNED BY "tenant.ai_intent_patterns_id_seq"
pg_dump: creating TABLE "tenant.ai_learning_feedback"
pg_dump: creating SEQUENCE "tenant.ai_learning_feedback_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_learning_feedback_id_seq"
pg_dump: creating TABLE "tenant.ai_response_templates"
pg_dump: creating SEQUENCE "tenant.ai_response_templates_id_seq"
--
-- TOC entry 290 (class 1259 OID 28800)
-- Name: ai_response_templates_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_response_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_response_templates_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5488 (class 0 OID 0)
-- Dependencies: 290
-- Name: ai_response_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_response_templates_id_seq OWNED BY tenant.ai_response_templates.id;


--
-- TOC entry 291 (class 1259 OID 28801)
-- Name: ai_smart_suggestions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_smart_suggestions (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    category character varying(100) NOT NULL,
    suggestion_text text NOT NULL,
    action_type character varying(50),
    target_endpoint character varying(255),
    conditions jsonb DEFAULT '{}'::jsonb,
    language character varying(10) DEFAULT 'en'::character varying,
    priority integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_smart_suggestions OWNER TO bisiadedokun;

pg_dump: creating SEQUENCE OWNED BY "tenant.ai_response_templates_id_seq"
pg_dump: creating TABLE "tenant.ai_smart_suggestions"
pg_dump: --
-- TOC entry 292 (class 1259 OID 28812)
-- Name: ai_smart_suggestions_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_smart_suggestions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_smart_suggestions_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5489 (class 0 OID 0)
-- Dependencies: 292
-- Name: ai_smart_suggestions_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_smart_suggestions_id_seq OWNED BY tenant.ai_smart_suggestions.id;


--
-- TOC entry 293 (class 1259 OID 28813)
-- Name: ai_translation_patterns; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_translation_patterns (
    id integer NOT NULL,
    tenant_id character varying(50) NOT NULL,
    source_language character varying(10) NOT NULL,
    target_language character varying(10) NOT NULL,
    source_text text NOT NULL,
    translated_text text NOT NULL,
    context_category character varying(100),
    confidence_score numeric(4,3) DEFAULT 0.9,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_translation_patterns OWNER TO bisiadedokun;

--
-- TOC entry 294 (class 1259 OID 28822)
-- Name: ai_translation_patterns_id_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.ai_translation_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.ai_translation_patterns_id_seq OWNER TO bisiadedokun;

--
-- TOC entry 5490 (class 0 OID 0)
-- Dependencies: 294
-- Name: ai_translation_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_translation_patterns_id_seq OWNED BY tenant.ai_translation_patterns.id;


--
-- TOC entry 295 (class 1259 OID 28823)
-- Name: analytics_cache; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.analytics_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    cache_key character varying(100) NOT NULL,
    cache_data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tenant.analytics_cache OWNER TO bisiadedokun;

creating SEQUENCE "tenant.ai_smart_suggestions_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_smart_suggestions_id_seq"
pg_dump: creating TABLE "tenant.ai_translation_patterns"
pg_dump: creating SEQUENCE "tenant.ai_translation_patterns_id_seq"
pg_dump: creating SEQUENCE OWNED BY "tenant.ai_translation_patterns_id_seq"
pg_dump: creating TABLE "tenant.analytics_cache"
pg_dump:--
-- TOC entry 296 (class 1259 OID 28830)
-- Name: bill_payments; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.bill_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider_code character varying(50) NOT NULL,
    provider_name character varying(200) NOT NULL,
    account_number character varying(100) NOT NULL,
    customer_name character varying(200),
    amount numeric(15,2) NOT NULL,
    fees numeric(15,2) DEFAULT 0 NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    reference character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(50) DEFAULT 'wallet'::character varying,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_bill_payments_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_bill_payments_fees_non_negative CHECK ((fees >= (0)::numeric)),
    CONSTRAINT chk_bill_payments_status CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text]))),
    CONSTRAINT chk_bill_payments_total_amount CHECK ((total_amount = (amount + fees)))
);


ALTER TABLE tenant.bill_payments OWNER TO bisiadedokun;

--
-- TOC entry 297 (class 1259 OID 28845)
-- Name: bill_providers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.bill_providers (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    bill_type character varying(50) NOT NULL,
    description text,
    logo_url text,
    min_amount numeric(15,2) DEFAULT 100.00 NOT NULL,
    max_amount numeric(15,2) DEFAULT 500000.00 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bill_providers_bill_type_check CHECK (((bill_type)::text = ANY (ARRAY[('electricity'::character varying)::text, ('cable_tv'::character varying)::text, ('water'::character varying)::text, ('internet'::character varying)::text]))),
    CONSTRAINT bill_providers_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


ALTER TABLE tenant.bill_providers OWNER TO bisiadedokun;

--
-- TOC entry 298 (class 1259 OID 28857)
-- Name: documents; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    document_number character varying(100),
    document_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    ai_processed boolean DEFAULT false,
    ai_extracted_data jsonb DEFAULT '{}'::jsonb,
    ai_confidence_score numeric(5,4),
    ai_verification_status character varying(20) DEFAULT 'pending'::character varying,
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    verified_by uuid,
    verified_at timestamp without time zone,
    expiry_date date,
    is_encrypted boolean DEFAULT true,
    encryption_key_id character varying(100),
    file_hash character varying(64),
    upload_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_ai_verification_status_check CHECK (((ai_verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('failed'::character varying)::text, ('manual_review'::character varying)::text]))),
    CONSTRAINT documents_document_type_check CHECK (((document_type)::text = ANY (ARRAY[('national_id'::character varying)::text, ('drivers_license'::character varying)::text, ('passport'::character varying)::text, ('voters_card'::character varying)::text, ('birth_certificate'::character varying)::text, ('utility_bill'::character varying)::text, ('bank_statement'::character varying)::text, ('salary_slip'::character varying)::text, ('tax_certificate'::character varying)::text, ('business_registration'::character varying)::text, ('other'::character varying)::text]))),
    CONSTRAINT documents_verification_status_check CHECK (((verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('expired'::character varying)::text])))
);


ALTER TABLE tenant.documents OWNER TO bisiadedokun;

--
-- TOC entry 5491 (class 0 OID 0)
-- Dependencies: 298
-- Name: TABLE documents; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.documents IS 'Document storage for KYC and compliance';


--
-- TOC entry 299 (class 1259 OID 28874)
-- Name: fraud_alerts; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.fraud_alerts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    transaction_id uuid,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    risk_score numeric(5,2) NOT NULL,
    ai_analysis jsonb DEFAULT '{}'::jsonb NOT NULL,
    contributing_factors jsonb DEFAULT '{}'::jsonb NOT NULL,
    similar_patterns jsonb DEFAULT '{}'::jsonb,
    recommended_actions text[],
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    priority integer DEFAULT 5,
    resolved_at timestamp without time zone,
    resolved_by uuid,
    resolution_notes text,
    resolution_actions text[],
    notifications_sent jsonb DEFAULT '{}'::jsonb,
    user_acknowledged boolean DEFAULT false,
    acknowledged_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fraud_alerts_alert_type_check CHECK (((alert_type)::text = ANY (ARRAY[('high_risk_transaction'::character varying)::text, ('unusual_pattern'::character varying)::text, ('velocity_check'::character varying)::text, ('location_anomaly'::character varying)::text, ('device_mismatch'::character varying)::text, ('time_anomaly'::character varying)::text, ('amount_anomaly'::character varying)::text, ('recipient_risk'::character varying)::text]))),
    CONSTRAINT fraud_alerts_priority_check CHECK (((priority >= 1) AND (priority <= 10))),
    CONSTRAINT fraud_alerts_severity_check CHECK (((severity)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('critical'::character varying)::text]))),
    CONSTRAINT fraud_alerts_status_check CHECK (((status)::text = ANY (ARRAY[('open'::character varying)::text, ('investigating'::character varying)::text, ('resolved'::character varying)::text, ('false_positive'::character varying)::text, ('escalated'::character varying)::text])))
);


ALTER TABLE tenant.fraud_alerts OWNER TO bisiadedokun;

 creating TABLE "tenant.bill_payments"
pg_dump: creating TABLE "tenant.bill_providers"
pg_dump: creating TABLE "tenant.documents"
pg_dump: creating COMMENT "tenant.TABLE documents"
pg_dump: creating TABLE "tenant.fraud_alerts"
pg_dump: --
-- TOC entry 5492 (class 0 OID 0)
-- Dependencies: 299
-- Name: TABLE fraud_alerts; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.fraud_alerts IS 'Fraud detection alerts and investigations';


--
-- TOC entry 300 (class 1259 OID 28893)
-- Name: internal_transfers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.internal_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    from_wallet_id uuid NOT NULL,
    to_wallet_id uuid NOT NULL,
    reference character varying(100) NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_wallets CHECK ((from_wallet_id <> to_wallet_id)),
    CONSTRAINT internal_transfers_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT internal_transfers_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.internal_transfers OWNER TO bisiadedokun;

--
-- TOC entry 5493 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE internal_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.internal_transfers IS 'Inter-wallet transfers within user accounts';


--
-- TOC entry 301 (class 1259 OID 28904)
-- Name: kyc_documents; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.kyc_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    document_number character varying(50) NOT NULL,
    document_image_url text,
    selfie_image_url text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    verification_response jsonb,
    verification_score numeric(5,2),
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kyc_documents_document_type_check CHECK (((document_type)::text = ANY (ARRAY[('nin'::character varying)::text, ('passport'::character varying)::text, ('drivers_license'::character varying)::text, ('voters_card'::character varying)::text, ('bvn'::character varying)::text]))),
    CONSTRAINT kyc_documents_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('expired'::character varying)::text])))
);


ALTER TABLE tenant.kyc_documents OWNER TO bisiadedokun;

--
-- TOC entry 5494 (class 0 OID 0)
-- Dependencies: 301
-- Name: TABLE kyc_documents; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.kyc_documents IS 'KYC verification documents and status';


--
-- TOC entry 302 (class 1259 OID 28915)
-- Name: login_attempts; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    identifier character varying(255) NOT NULL,
    ip_address inet,
    user_agent text,
    success boolean DEFAULT false NOT NULL,
    failure_reason character varying(100),
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tenant.login_attempts OWNER TO bisiadedokun;

--
-- TOC entry 303 (class 1259 OID 28923)
-- Name: notification_preferences; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    channel character varying(20) NOT NULL,
    notification_type character varying(50) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    frequency character varying(20) DEFAULT 'immediate'::character varying,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    timezone character varying(50) DEFAULT 'UTC'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_notification_preferences_channel CHECK (((channel)::text = ANY (ARRAY[('email'::character varying)::text, ('sms'::character varying)::text, ('push'::character varying)::text, ('in_app'::character varying)::text]))),
    CONSTRAINT chk_notification_preferences_frequency CHECK (((frequency)::text = ANY (ARRAY[('immediate'::character varying)::text, ('daily'::character varying)::text, ('weekly'::character varying)::text, ('monthly'::character varying)::text])))
);


ALTER TABLE tenant.notification_preferences OWNER TO bisiadedokun;

--
-- TOC entry 304 (class 1259 OID 28934)
-- Name: notifications; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    ai_generated boolean DEFAULT false NOT NULL,
    personalization_level character varying(20) DEFAULT 'standard'::character varying,
    ai_confidence numeric(5,4),
    rich_content jsonb DEFAULT '{}'::jsonb,
    action_buttons jsonb DEFAULT '[]'::jsonb,
    deep_link character varying(255),
    channels character varying(50)[] DEFAULT ARRAY['in_app'::text] NOT NULL,
    delivery_preferences jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_for timestamp without time zone,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '30 days'::interval),
    related_transaction_id uuid,
    related_alert_id uuid,
    category character varying(50),
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_personalization_level_check CHECK (((personalization_level)::text = ANY (ARRAY[('none'::character varying)::text, ('basic'::character varying)::text, ('standard'::character varying)::text, ('advanced'::character varying)::text]))),
    CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text]))),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('queued'::character varying)::text, ('sent'::character varying)::text, ('delivered'::character varying)::text, ('read'::character varying)::text, ('failed'::character varying)::text, ('expired'::character varying)::text]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY (ARRAY[('transaction_completed'::character varying)::text, ('transaction_failed'::character varying)::text, ('security_alert'::character varying)::text, ('fraud_alert'::character varying)::text, ('ai_insight'::character varying)::text, ('system_maintenance'::character varying)::text, ('account_update'::character varying)::text, ('payment_reminder'::character varying)::text, ('kyc_required'::character varying)::text, ('limit_exceeded'::character varying)::text, ('promotional'::character varying)::text])))
);


ALTER TABLE tenant.notifications OWNER TO bisiadedokun;

--
-- TOC entry 5495 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE notifications; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.notifications IS 'User notifications and communications';


--
-- TOC entry 305 (class 1259 OID 28956)
-- Name: rbac_permission_audit; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_permission_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    permission_code character varying(100),
    access_granted boolean NOT NULL,
    denial_reason text,
    request_context jsonb,
    resource_id uuid,
    additional_data jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tenant.rbac_permission_audit OWNER TO bisiadedokun;

creating COMMENT "tenant.TABLE fraud_alerts"
pg_dump: creating TABLE "tenant.internal_transfers"
pg_dump: creating COMMENT "tenant.TABLE internal_transfers"
pg_dump: creating TABLE "tenant.kyc_documents"
pg_dump: creating COMMENT "tenant.TABLE kyc_documents"
pg_dump: creating TABLE "tenant.login_attempts"
pg_dump: creating TABLE "tenant.notification_preferences"
pg_dump: creating TABLE "tenant.notifications"
pg_dump: creating COMMENT "tenant.TABLE notifications"
pg_dump: creating TABLE "tenant.rbac_permission_audit"
pg_dump: creating COMMENT "tenant.TABLE rbac_permission_audit"
--
-- TOC entry 5496 (class 0 OID 0)
-- Dependencies: 305
-- Name: TABLE rbac_permission_audit; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_permission_audit IS 'Complete audit trail of all permission checks and access attempts';


--
-- TOC entry 306 (class 1259 OID 28963)
-- Name: rbac_permissions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    platform_permission_id uuid,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    is_custom_permission boolean DEFAULT false,
    tenant_specific_rules jsonb,
    compliance_requirements jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tenant.rbac_permissions OWNER TO bisiadedokun;

--
-- TOC entry 5497 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE rbac_permissions; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_permissions IS 'Tenant-specific permissions, can override platform defaults';


--
-- TOC entry 307 (class 1259 OID 28973)
-- Name: rbac_role_hierarchy; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_role_hierarchy (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    parent_role_id uuid,
    child_role_id uuid,
    can_delegate boolean DEFAULT false,
    inheritance_level integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tenant.rbac_role_hierarchy OWNER TO bisiadedokun;

--
-- TOC entry 308 (class 1259 OID 28980)
-- Name: rbac_role_permissions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    role_id uuid,
    permission_id uuid,
    permission_level character varying(20) DEFAULT 'read'::character varying NOT NULL,
    conditions jsonb,
    effective_from timestamp without time zone DEFAULT now(),
    effective_to timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE tenant.rbac_role_permissions OWNER TO bisiadedokun;

--
-- TOC entry 309 (class 1259 OID 28990)
-- Name: rbac_roles; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    platform_role_id uuid,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    level integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true,
    is_custom_role boolean DEFAULT false,
    hierarchy_path platform.ltree,
    branch_restrictions uuid[],
    department_restrictions character varying(100)[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid
);


ALTER TABLE tenant.rbac_roles OWNER TO bisiadedokun;

--
-- TOC entry 5498 (class 0 OID 0)
-- Dependencies: 309
-- Name: TABLE rbac_roles; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_roles IS 'Tenant-specific roles, can inherit from platform or be completely custom';


--
-- TOC entry 310 (class 1259 OID 29001)
-- Name: rbac_temporary_permissions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_temporary_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    permission_id uuid,
    granted_by uuid NOT NULL,
    reason text NOT NULL,
    effective_from timestamp without time zone DEFAULT now(),
    effective_to timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    max_usage integer,
    emergency_access boolean DEFAULT false,
    approval_required boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tenant.rbac_temporary_permissions OWNER TO bisiadedokun;

--
-- TOC entry 311 (class 1259 OID 29013)
-- Name: rbac_user_roles; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.rbac_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid,
    assigned_by uuid,
    assigned_at timestamp without time zone DEFAULT now(),
    effective_from timestamp without time zone DEFAULT now(),
    effective_to timestamp without time zone,
    is_active boolean DEFAULT true,
    assignment_reason text,
    additional_permissions jsonb,
    restrictions jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE tenant.rbac_user_roles OWNER TO bisiadedokun;

--
-- TOC entry 5499 (class 0 OID 0)
-- Dependencies: 311
-- Name: TABLE rbac_user_roles; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_user_roles IS 'User role assignments with effective dates and additional restrictions';


--
-- TOC entry 312 (class 1259 OID 29024)
-- Name: recipients; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.recipients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    account_number character varying(20) NOT NULL,
    account_name character varying(255) NOT NULL,
    bank_code character varying(3) NOT NULL,
    bank_name character varying(255) NOT NULL,
    nickname character varying(100),
    is_favorite boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_recipient_tenant_id CHECK ((tenant_id IS NOT NULL))
);


ALTER TABLE tenant.recipients OWNER TO bisiadedokun;

--
-- TOC entry 5500 (class 0 OID 0)
-- Dependencies: 312
-- Name: TABLE recipients; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.recipients IS 'Saved recipient accounts for transfers';


--
-- TOC entry 313 (class 1259 OID 29034)
-- Name: recurring_transfers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.recurring_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    from_wallet_id uuid NOT NULL,
    to_wallet_number character varying(20) NOT NULL,
    recipient_name character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying,
    reference character varying(50) NOT NULL,
    narration text,
    frequency character varying(20) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    next_execution_date timestamp without time zone NOT NULL,
    last_execution_date timestamp without time zone,
    execution_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recurring_transfers_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT recurring_transfers_frequency_check CHECK (((frequency)::text = ANY (ARRAY[('daily'::character varying)::text, ('weekly'::character varying)::text, ('monthly'::character varying)::text, ('yearly'::character varying)::text]))),
    CONSTRAINT recurring_transfers_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('paused'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.recurring_transfers OWNER TO bisiadedokun;

--
-- TOC entry 5501 (class 0 OID 0)
-- Dependencies: 313
-- Name: TABLE recurring_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.recurring_transfers IS 'Stores recurring/periodic transfers';


--
-- TOC entry 314 (class 1259 OID 29048)
-- Name: referrals; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    referral_code character varying(50) NOT NULL,
    bonus_amount numeric(15,2) DEFAULT 100.00,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_self_referral CHECK ((referrer_id <> referee_id)),
    CONSTRAINT referrals_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('claimed'::character varying)::text, ('expired'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.referrals OWNER TO bisiadedokun;

--
-- TOC entry 5502 (class 0 OID 0)
-- Dependencies: 314
-- Name: TABLE referrals; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.referrals IS 'User referral program tracking';


--
-- TOC entry 315 (class 1259 OID 29057)
-- Name: scheduled_transfers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.scheduled_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    from_wallet_id uuid NOT NULL,
    to_wallet_number character varying(20) NOT NULL,
    recipient_name character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying,
    reference character varying(50) NOT NULL,
    narration text,
    scheduled_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    transfer_id uuid,
    error_message text,
    executed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scheduled_transfers_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT scheduled_transfers_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.scheduled_transfers OWNER TO bisiadedokun;

--
-- TOC entry 5503 (class 0 OID 0)
-- Dependencies: 315
-- Name: TABLE scheduled_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.scheduled_transfers IS 'Stores one-time scheduled transfers';


--
-- TOC entry 316 (class 1259 OID 29069)
-- Name: tenant_metadata; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.tenant_metadata (
    tenant_id uuid NOT NULL,
    tenant_name character varying(255) NOT NULL,
    schema_version character varying(50) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_tenant CHECK ((tenant_id IS NOT NULL))
);


ALTER TABLE tenant.tenant_metadata OWNER TO bisiadedokun;

--
-- TOC entry 317 (class 1259 OID 29076)
-- Name: transaction_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.transaction_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.transaction_logs OWNER TO bisiadedokun;

--
-- TOC entry 5504 (class 0 OID 0)
-- Dependencies: 317
-- Name: TABLE transaction_logs; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transaction_logs IS 'Detailed transfer transaction logs';


pg_dump: creating TABLE "tenant.rbac_permissions"
pg_dump: creating COMMENT "tenant.TABLE rbac_permissions"
pg_dump: creating TABLE "tenant.rbac_role_hierarchy"
pg_dump: creating TABLE "tenant.rbac_role_permissions"
pg_dump: creating TABLE "tenant.rbac_roles"
pg_dump: creating COMMENT "tenant.TABLE rbac_roles"
pg_dump: creating TABLE "tenant.rbac_temporary_permissions"
pg_dump: creating TABLE "tenant.rbac_user_roles"
pg_dump: creating COMMENT "tenant.TABLE rbac_user_roles"
pg_dump: creating TABLE "tenant.recipients"
pg_dump: creating COMMENT "tenant.TABLE recipients"
pg_dump: creating TABLE "tenant.recurring_transfers"
pg_dump: creating COMMENT "tenant.TABLE recurring_transfers"
pg_dump: creating TABLE "tenant.referrals"
pg_dump: creating COMMENT "tenant.TABLE referrals"
pg_dump: creating TABLE "tenant.scheduled_transfers"
pg_dump: creating COMMENT "tenant.TABLE scheduled_transfers"
pg_dump: creating TABLE "tenant.tenant_metadata"
pg_dump: creating TABLE "tenant.transaction_logs"
pg_dump: creating COMMENT "tenant.TABLE transaction_logs"
pg_dump: creating SEQUENCE "tenant.transaction_ref_seq"
--
-- TOC entry 318 (class 1259 OID 29084)
-- Name: transaction_ref_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.transaction_ref_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.transaction_ref_seq OWNER TO bisiadedokun;

--
-- TOC entry 319 (class 1259 OID 29085)
-- Name: transactions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reference character varying(50) NOT NULL,
    external_reference character varying(100),
    batch_id uuid,
    parent_transaction_id uuid,
    type character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying NOT NULL,
    exchange_rate numeric(10,6) DEFAULT 1.0,
    original_amount numeric(15,2),
    original_currency character varying(3),
    description text,
    merchant_category character varying(50),
    transaction_tags text[],
    recipient_name character varying(255),
    recipient_account character varying(50),
    recipient_bank character varying(100),
    recipient_bank_code character varying(10),
    recipient_details jsonb DEFAULT '{}'::jsonb,
    sender_name character varying(255),
    sender_account character varying(50),
    sender_bank character varying(100),
    sender_details jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    substatus character varying(50),
    processing_details jsonb DEFAULT '{}'::jsonb NOT NULL,
    failure_reason text,
    failure_code character varying(50),
    ai_initiated boolean DEFAULT false NOT NULL,
    voice_initiated boolean DEFAULT false NOT NULL,
    ai_confidence numeric(5,4),
    natural_language_command text,
    ai_processing_metadata jsonb DEFAULT '{}'::jsonb,
    ai_recommendations jsonb DEFAULT '{}'::jsonb,
    fraud_score numeric(5,2),
    fraud_factors jsonb DEFAULT '{}'::jsonb,
    risk_level character varying(20),
    risk_factors jsonb DEFAULT '{}'::jsonb,
    compliance_flags text[] DEFAULT '{}'::text[],
    payment_provider character varying(50),
    payment_method character varying(50),
    provider_transaction_id character varying(100),
    provider_response jsonb DEFAULT '{}'::jsonb,
    provider_fees numeric(15,2) DEFAULT 0,
    total_fees numeric(15,2) DEFAULT 0 NOT NULL,
    charges jsonb DEFAULT '{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}'::jsonb,
    transaction_location jsonb,
    device_info jsonb DEFAULT '{}'::jsonb,
    channel character varying(50) DEFAULT 'mobile'::character varying,
    settlement_date date,
    settlement_batch character varying(100),
    reconciliation_status character varying(20) DEFAULT 'pending'::character varying,
    initiated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    settled_at timestamp without time zone,
    compliance_checked boolean DEFAULT false,
    compliance_score numeric(5,2),
    CONSTRAINT check_positive_amount CHECK ((amount > (0)::numeric)),
    CONSTRAINT check_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT transactions_risk_level_check CHECK (((risk_level)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('critical'::character varying)::text]))),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text, ('blocked'::character varying)::text, ('reversed'::character varying)::text, ('disputed'::character varying)::text, ('settled'::character varying)::text, ('expired'::character varying)::text]))),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY (ARRAY[('cash_withdrawal'::character varying)::text, ('money_transfer'::character varying)::text, ('bill_payment'::character varying)::text, ('airtime_purchase'::character varying)::text, ('balance_inquiry'::character varying)::text, ('account_opening'::character varying)::text, ('loan_payment'::character varying)::text, ('investment'::character varying)::text, ('pos_payment'::character varying)::text, ('qr_payment'::character varying)::text, ('bulk_transfer'::character varying)::text])))
);


ALTER TABLE tenant.transactions OWNER TO bisiadedokun;

--
-- TOC entry 5505 (class 0 OID 0)
-- Dependencies: 319
-- Name: TABLE transactions; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transactions IS 'All transaction records with AI fraud detection';


--
-- TOC entry 320 (class 1259 OID 29119)
-- Name: transfers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    recipient_id uuid,
    reference character varying(100) NOT NULL,
    amount numeric(15,2) NOT NULL,
    fee numeric(15,2) DEFAULT 0.00 NOT NULL,
    description text,
    source_account_number character varying(20) NOT NULL,
    source_bank_code character varying(10) NOT NULL,
    recipient_account_number character varying(20) NOT NULL,
    recipient_bank_code character varying(10) NOT NULL,
    recipient_name character varying(255) NOT NULL,
    nibss_transaction_id character varying(255),
    nibss_session_id character varying(255),
    nibss_response_message text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    failure_reason text,
    processed_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recipient_user_id uuid,
    CONSTRAINT check_transfer_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT transfers_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT transfers_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('successful'::character varying)::text, ('failed'::character varying)::text, ('reversed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.transfers OWNER TO bisiadedokun;

--
-- TOC entry 5506 (class 0 OID 0)
-- Dependencies: 320
-- Name: TABLE transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transfers IS 'All money transfer transactions via NIBSS';


--
-- TOC entry 321 (class 1259 OID 29133)
-- Name: users; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    middle_name character varying(100),
    role character varying(50) DEFAULT 'agent'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    bvn character varying(11),
    nin character varying(11),
    ai_preferences jsonb DEFAULT '{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}'::jsonb NOT NULL,
    behavioral_profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    risk_profile character varying(20) DEFAULT 'medium'::character varying,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    last_login_at timestamp without time zone,
    last_login_ip inet,
    password_changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret character varying(255),
    mfa_backup_codes text[],
    mfa_methods character varying(50)[] DEFAULT ARRAY['sms'::text],
    biometric_enabled boolean DEFAULT false NOT NULL,
    biometric_templates jsonb DEFAULT '{}'::jsonb,
    profile_data jsonb DEFAULT '{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}'::jsonb NOT NULL,
    notification_preferences jsonb DEFAULT '{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}'::jsonb NOT NULL,
    last_known_location jsonb,
    registered_devices jsonb DEFAULT '[]'::jsonb,
    kyc_status character varying(20) DEFAULT 'pending'::character varying,
    kyc_level integer DEFAULT 1,
    kyc_documents jsonb DEFAULT '{}'::jsonb,
    kyc_completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    account_number character varying(20),
    transaction_pin_hash character varying(255),
    daily_limit numeric(15,2) DEFAULT 100000.00,
    monthly_limit numeric(15,2) DEFAULT 500000.00,
    date_of_birth date,
    gender character varying(20),
    is_active boolean DEFAULT true,
    profile_image_url text,
    profile_address jsonb,
    referral_code character varying(50),
    CONSTRAINT check_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY (ARRAY[('male'::character varying)::text, ('female'::character varying)::text, ('other'::character varying)::text]))),
    CONSTRAINT users_kyc_level_check CHECK (((kyc_level >= 1) AND (kyc_level <= 3))),
    CONSTRAINT users_kyc_status_check CHECK (((kyc_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('expired'::character varying)::text]))),
    CONSTRAINT users_risk_profile_check CHECK (((risk_profile)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text, ('critical'::character varying)::text]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('super_agent'::character varying)::text, ('agent'::character varying)::text, ('merchant'::character varying)::text, ('viewer'::character varying)::text]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('suspended'::character varying)::text, ('pending'::character varying)::text, ('locked'::character varying)::text])))
);


ALTER TABLE tenant.users OWNER TO bisiadedokun;

--
-- TOC entry 5507 (class 0 OID 0)
-- Dependencies: 321
-- Name: TABLE users; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.users IS 'Tenant-specific user accounts with AI preferences';


--
-- TOC entry 322 (class 1259 OID 29169)
-- Name: transfer_history_view; Type: VIEW; Schema: tenant; Owner: bisiadedokun
--

CREATE VIEW tenant.transfer_history_view AS
 SELECT t.id,
    t.sender_id,
    t.tenant_id,
    t.recipient_id,
    t.reference,
    t.amount,
    t.fee,
    t.description,
    t.source_account_number,
    t.source_bank_code,
    t.recipient_account_number,
    t.recipient_bank_code,
    t.recipient_name,
    t.nibss_transaction_id,
    t.nibss_session_id,
    t.nibss_response_message,
    t.status,
    t.failure_reason,
    t.processed_at,
    t.metadata,
    t.created_at,
    t.updated_at,
    t.recipient_user_id,
    u.email AS sender_email,
    (((u.first_name)::text || ' '::text) || (u.last_name)::text) AS sender_full_name
   FROM (tenant.transfers t
     LEFT JOIN tenant.users u ON ((t.sender_id = u.id)));


ALTER TABLE tenant.transfer_history_view OWNER TO bisiadedokun;

--
-- TOC entry 323 (class 1259 OID 29174)
-- Name: user_activity_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.user_activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    description text NOT NULL,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.user_activity_logs OWNER TO bisiadedokun;

--
-- TOC entry 5508 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE user_activity_logs; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.user_activity_logs IS 'User activity tracking for security';


--
-- TOC entry 324 (class 1259 OID 29182)
-- Name: user_sessions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token text NOT NULL,
    refresh_token text,
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    geolocation jsonb,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_suspicious boolean DEFAULT false,
    risk_score numeric(5,2) DEFAULT 0,
    ai_risk_assessment jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE tenant.user_sessions OWNER TO bisiadedokun;

--
-- TOC entry 325 (class 1259 OID 29194)
-- Name: wallets; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.wallets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    wallet_number character varying(20) NOT NULL,
    wallet_type character varying(50) DEFAULT 'main'::character varying NOT NULL,
    wallet_name character varying(100),
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    available_balance numeric(15,2) DEFAULT 0 NOT NULL,
    reserved_balance numeric(15,2) DEFAULT 0 NOT NULL,
    pending_balance numeric(15,2) DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'NGN'::character varying NOT NULL,
    foreign_balances jsonb DEFAULT '{}'::jsonb,
    daily_limit numeric(15,2) DEFAULT 500000,
    monthly_limit numeric(15,2) DEFAULT 5000000,
    single_transaction_limit numeric(15,2) DEFAULT 100000,
    minimum_balance numeric(15,2) DEFAULT 0,
    ai_insights jsonb DEFAULT '{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}'::jsonb,
    predicted_balance numeric(15,2),
    balance_prediction_date date,
    spending_categories jsonb DEFAULT '{}'::jsonb,
    financial_health_score numeric(5,2),
    spending_behavior jsonb DEFAULT '{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}'::jsonb,
    interest_rate numeric(6,4) DEFAULT 0,
    reward_points integer DEFAULT 0,
    cashback_earned numeric(15,2) DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    is_frozen boolean DEFAULT false NOT NULL,
    freeze_reason character varying(255),
    security_level character varying(20) DEFAULT 'standard'::character varying,
    account_category character varying(50) DEFAULT 'individual'::character varying,
    regulatory_status character varying(50) DEFAULT 'compliant'::character varying,
    last_kyc_update timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activated_at timestamp without time zone,
    last_transaction_at timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying,
    is_primary boolean DEFAULT false,
    CONSTRAINT check_available_balance CHECK ((available_balance >= (0)::numeric)),
    CONSTRAINT check_balance_positive CHECK ((balance >= (0)::numeric)),
    CONSTRAINT check_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT wallets_security_level_check CHECK (((security_level)::text = ANY (ARRAY[('basic'::character varying)::text, ('standard'::character varying)::text, ('premium'::character varying)::text, ('maximum'::character varying)::text]))),
    CONSTRAINT wallets_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('frozen'::character varying)::text, ('closed'::character varying)::text]))),
    CONSTRAINT wallets_wallet_type_check CHECK (((wallet_type)::text = ANY (ARRAY[('main'::character varying)::text, ('primary'::character varying)::text, ('savings'::character varying)::text, ('business'::character varying)::text, ('investment'::character varying)::text])))
);


ALTER TABLE tenant.wallets OWNER TO bisiadedokun;

--
-- TOC entry 5509 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE wallets; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.wallets IS 'User wallet accounts for storing balances';


--
-- TOC entry 326 (class 1259 OID 29232)
-- Name: user_wallet_summary; Type: VIEW; Schema: tenant; Owner: bisiadedokun
--

CREATE VIEW tenant.user_wallet_summary AS
 SELECT u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.account_number,
    w.id AS wallet_id,
    w.wallet_type,
    w.balance,
    w.available_balance,
    w.status AS wallet_status,
    w.is_primary,
    u.kyc_status,
    u.kyc_level,
    u.daily_limit,
    u.monthly_limit
   FROM (tenant.users u
     LEFT JOIN tenant.wallets w ON (((u.id = w.user_id) AND (w.is_primary = true))));


ALTER TABLE tenant.user_wallet_summary OWNER TO bisiadedokun;

--
-- TOC entry 327 (class 1259 OID 29237)
-- Name: wallet_fundings; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.wallet_fundings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    reference character varying(100) NOT NULL,
    amount numeric(15,2) NOT NULL,
    funding_method character varying(50) DEFAULT 'bank_transfer'::character varying NOT NULL,
    description text,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallet_fundings_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT wallet_fundings_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE tenant.wallet_fundings OWNER TO bisiadedokun;

--
-- TOC entry 5510 (class 0 OID 0)
-- Dependencies: 327
-- Name: TABLE wallet_fundings; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.wallet_fundings IS 'Wallet funding operations';


--
-- TOC entry 328 (class 1259 OID 29249)
-- Name: wallet_number_seq; Type: SEQUENCE; Schema: tenant; Owner: bisiadedokun
--

CREATE SEQUENCE tenant.wallet_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tenant.wallet_number_seq OWNER TO bisiadedokun;

--
-- TOC entry 329 (class 1259 OID 29250)
-- Name: wallet_transactions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.wallet_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_id uuid NOT NULL,
    transaction_id uuid,
    transaction_type character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    balance_before numeric(15,2) NOT NULL,
    balance_after numeric(15,2) NOT NULL,
    description text NOT NULL,
    category character varying(50),
    subcategory character varying(50),
    reference character varying(100),
    external_reference character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_amount_not_zero CHECK ((amount <> (0)::numeric)),
    CONSTRAINT wallet_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY (ARRAY[('debit'::character varying)::text, ('credit'::character varying)::text])))
);


ALTER TABLE tenant.wallet_transactions OWNER TO bisiadedokun;

--
-- TOC entry 4077 (class 2604 OID 29260)
-- Name: ai_intent_templates id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_intent_templates ALTER COLUMN id SET DEFAULT nextval('platform.ai_intent_templates_id_seq'::regclass);


--
-- TOC entry 4081 (class 2604 OID 29261)
-- Name: ai_models id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_models ALTER COLUMN id SET DEFAULT nextval('platform.ai_models_id_seq'::regclass);


--
-- TOC entry 4108 (class 2604 OID 29262)
-- Name: ngn_bank_codes id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes ALTER COLUMN id SET DEFAULT nextval('platform.ngn_bank_codes_id_seq'::regclass);


--
-- TOC entry 4266 (class 2604 OID 29263)
-- Name: ai_analytics_insights id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_analytics_insights ALTER COLUMN id SET DEFAULT nextval('tenant.ai_analytics_insights_id_seq'::regclass);


--
-- TOC entry 4272 (class 2604 OID 29264)
-- Name: ai_configuration id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration ALTER COLUMN id SET DEFAULT nextval('tenant.ai_configuration_id_seq'::regclass);


--
-- TOC entry 4280 (class 2604 OID 29265)
-- Name: ai_context_mappings id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings ALTER COLUMN id SET DEFAULT nextval('tenant.ai_context_mappings_id_seq'::regclass);


--
-- TOC entry 4285 (class 2604 OID 29266)
-- Name: ai_conversation_logs id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_conversation_logs ALTER COLUMN id SET DEFAULT nextval('tenant.ai_conversation_logs_id_seq'::regclass);


--
-- TOC entry 4288 (class 2604 OID 29267)
-- Name: ai_intent_categories id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories ALTER COLUMN id SET DEFAULT nextval('tenant.ai_intent_categories_id_seq'::regclass);


--
-- TOC entry 4293 (class 2604 OID 29268)
-- Name: ai_intent_patterns id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns ALTER COLUMN id SET DEFAULT nextval('tenant.ai_intent_patterns_id_seq'::regclass);


--
-- TOC entry 4300 (class 2604 OID 29269)
-- Name: ai_learning_feedback id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback ALTER COLUMN id SET DEFAULT nextval('tenant.ai_learning_feedback_id_seq'::regclass);


--
-- TOC entry 4303 (class 2604 OID 29270)
-- Name: ai_response_templates id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates ALTER COLUMN id SET DEFAULT nextval('tenant.ai_response_templates_id_seq'::regclass);


--
-- TOC entry 4312 (class 2604 OID 29271)
-- Name: ai_smart_suggestions id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_smart_suggestions ALTER COLUMN id SET DEFAULT nextval('tenant.ai_smart_suggestions_id_seq'::regclass);


--
-- TOC entry 4319 (class 2604 OID 29272)
-- Name: ai_translation_patterns id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_translation_patterns ALTER COLUMN id SET DEFAULT nextval('tenant.ai_translation_patterns_id_seq'::regclass);


--
-- TOC entry 4643 (class 2606 OID 29362)
-- Name: ai_conversation_analytics ai_conversation_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4647 (class 2606 OID 29364)
-- Name: ai_fraud_analytics ai_fraud_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4651 (class 2606 OID 29366)
-- Name: cbn_compliance_reports cbn_compliance_reports_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_compliance_reports
    ADD CONSTRAINT cbn_compliance_reports_pkey PRIMARY KEY (report_id);


--
-- TOC entry 4653 (class 2606 OID 29368)
-- Name: cbn_incidents cbn_incidents_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_pkey PRIMARY KEY (incident_id);


--
-- TOC entry 4655 (class 2606 OID 29370)
-- Name: cbn_security_audits cbn_security_audits_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_security_audits
    ADD CONSTRAINT cbn_security_audits_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 4657 (class 2606 OID 29372)
-- Name: data_localization_checks data_localization_checks_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.data_localization_checks
    ADD CONSTRAINT data_localization_checks_pkey PRIMARY KEY (check_id);


--
-- TOC entry 4659 (class 2606 OID 29374)
-- Name: network_segmentation network_segmentation_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.network_segmentation
    ADD CONSTRAINT network_segmentation_pkey PRIMARY KEY (segmentation_id);


--
-- TOC entry 4661 (class 2606 OID 29376)
-- Name: pci_dss_compliance pci_dss_compliance_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_compliance
    ADD CONSTRAINT pci_dss_compliance_pkey PRIMARY KEY (compliance_id);


--
-- TOC entry 4663 (class 2606 OID 29378)
-- Name: pci_dss_findings pci_dss_findings_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_pkey PRIMARY KEY (finding_id);


--
-- TOC entry 4665 (class 2606 OID 29380)
-- Name: pci_dss_requirements pci_dss_requirements_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_pkey PRIMARY KEY (requirement_id);


--
-- TOC entry 4667 (class 2606 OID 29382)
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (alert_id);


--
-- TOC entry 4669 (class 2606 OID 29384)
-- Name: siem_events siem_events_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.siem_events
    ADD CONSTRAINT siem_events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 4671 (class 2606 OID 29386)
-- Name: siem_rules siem_rules_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.siem_rules
    ADD CONSTRAINT siem_rules_pkey PRIMARY KEY (rule_id);


--
-- TOC entry 4679 (class 2606 OID 29388)
-- Name: tenant_audit_logs tenant_audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4681 (class 2606 OID 29390)
-- Name: threat_intelligence threat_intelligence_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.threat_intelligence
    ADD CONSTRAINT threat_intelligence_pkey PRIMARY KEY (indicator_id);


--
-- TOC entry 4683 (class 2606 OID 29392)
-- Name: ai_intent_templates ai_intent_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_intent_templates
    ADD CONSTRAINT ai_intent_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4685 (class 2606 OID 29394)
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- TOC entry 4687 (class 2606 OID 29396)
-- Name: bill_provider_templates bill_provider_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.bill_provider_templates
    ADD CONSTRAINT bill_provider_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4689 (class 2606 OID 29398)
-- Name: bill_provider_templates bill_provider_templates_provider_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.bill_provider_templates
    ADD CONSTRAINT bill_provider_templates_provider_code_key UNIQUE (provider_code);


--
-- TOC entry 4693 (class 2606 OID 29400)
-- Name: currency_config currency_config_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.currency_config
    ADD CONSTRAINT currency_config_pkey PRIMARY KEY (code);


--
-- TOC entry 4695 (class 2606 OID 29402)
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 4705 (class 2606 OID 29404)
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4714 (class 2606 OID 29406)
-- Name: ngn_bank_codes ngn_bank_codes_bank_code_3_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes
    ADD CONSTRAINT ngn_bank_codes_bank_code_3_key UNIQUE (bank_code_3);


--
-- TOC entry 4716 (class 2606 OID 29408)
-- Name: ngn_bank_codes ngn_bank_codes_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes
    ADD CONSTRAINT ngn_bank_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4722 (class 2606 OID 29410)
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4725 (class 2606 OID 29412)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 4727 (class 2606 OID 29414)
-- Name: notification_preferences notification_preferences_tenant_id_user_id_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_preferences
    ADD CONSTRAINT notification_preferences_tenant_id_user_id_key UNIQUE (tenant_id, user_id);


--
-- TOC entry 4731 (class 2606 OID 29416)
-- Name: notification_statistics notification_statistics_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_statistics
    ADD CONSTRAINT notification_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 4733 (class 2606 OID 29418)
-- Name: notification_statistics notification_statistics_tenant_id_date_channel_event_type_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_statistics
    ADD CONSTRAINT notification_statistics_tenant_id_date_channel_event_type_key UNIQUE (tenant_id, date, channel, event_type);


--
-- TOC entry 4738 (class 2606 OID 29420)
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4740 (class 2606 OID 29422)
-- Name: notification_templates notification_templates_tenant_id_event_type_channel_languag_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_templates
    ADD CONSTRAINT notification_templates_tenant_id_event_type_channel_languag_key UNIQUE (tenant_id, event_type, channel, language);


--
-- TOC entry 4750 (class 2606 OID 29424)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4755 (class 2606 OID 29426)
-- Name: platform_config platform_config_config_key_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_config_key_key UNIQUE (config_key);


--
-- TOC entry 4757 (class 2606 OID 29428)
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);


--
-- TOC entry 4759 (class 2606 OID 29430)
-- Name: rbac_permissions rbac_permissions_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_permissions
    ADD CONSTRAINT rbac_permissions_code_key UNIQUE (code);


--
-- TOC entry 4761 (class 2606 OID 29432)
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4765 (class 2606 OID 29434)
-- Name: rbac_role_permissions rbac_role_permissions_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 29436)
-- Name: rbac_role_permissions rbac_role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- TOC entry 4769 (class 2606 OID 29438)
-- Name: rbac_roles rbac_roles_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_roles
    ADD CONSTRAINT rbac_roles_code_key UNIQUE (code);


--
-- TOC entry 4771 (class 2606 OID 29440)
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4776 (class 2606 OID 29442)
-- Name: receipt_templates receipt_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.receipt_templates
    ADD CONSTRAINT receipt_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 29444)
-- Name: tenant_assets tenant_assets_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_pkey PRIMARY KEY (id);


--
-- TOC entry 4783 (class 2606 OID 29446)
-- Name: tenant_assets tenant_assets_tenant_id_asset_type_asset_name_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_asset_type_asset_name_key UNIQUE (tenant_id, asset_type, asset_name);


--
-- TOC entry 4788 (class 2606 OID 29448)
-- Name: tenant_billing tenant_billing_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 29450)
-- Name: tenant_billing tenant_billing_tenant_id_billing_period_start_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_billing_period_start_key UNIQUE (tenant_id, billing_period_start);


--
-- TOC entry 4794 (class 2606 OID 29452)
-- Name: tenant_usage_metrics tenant_usage_metrics_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 29454)
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_metric_date_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_metric_date_key UNIQUE (tenant_id, metric_date);


--
-- TOC entry 4807 (class 2606 OID 29456)
-- Name: tenants tenants_bank_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_bank_code_key UNIQUE (bank_code);


--
-- TOC entry 4809 (class 2606 OID 29458)
-- Name: tenants tenants_name_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_name_key UNIQUE (name);


--
-- TOC entry 4811 (class 2606 OID 29460)
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- TOC entry 4813 (class 2606 OID 29462)
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- TOC entry 4818 (class 2606 OID 29464)
-- Name: transaction_attachments transaction_attachments_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_attachments
    ADD CONSTRAINT transaction_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 29466)
-- Name: transaction_audit_log transaction_audit_log_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_audit_log
    ADD CONSTRAINT transaction_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 29468)
-- Name: transaction_receipts transaction_receipts_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_receipts
    ADD CONSTRAINT transaction_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 29470)
-- Name: transaction_receipts transaction_receipts_receipt_number_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_receipts
    ADD CONSTRAINT transaction_receipts_receipt_number_key UNIQUE (receipt_number);


--
-- TOC entry 4854 (class 2606 OID 29472)
-- Name: transaction_records transaction_records_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_records
    ADD CONSTRAINT transaction_records_pkey PRIMARY KEY (id);


--
-- TOC entry 4859 (class 2606 OID 29474)
-- Name: user_devices user_devices_device_token_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.user_devices
    ADD CONSTRAINT user_devices_device_token_key UNIQUE (device_token);


--
-- TOC entry 4861 (class 2606 OID 29476)
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 29478)
-- Name: webhook_endpoints webhook_endpoints_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.webhook_endpoints
    ADD CONSTRAINT webhook_endpoints_pkey PRIMARY KEY (id);


pg_dump: creating TABLE "tenant.transactions"
pg_dump: creating COMMENT "tenant.TABLE transactions"
pg_dump: creating TABLE "tenant.transfers"
pg_dump: creating COMMENT "tenant.TABLE transfers"
pg_dump: creating TABLE "tenant.users"
pg_dump: creating COMMENT "tenant.TABLE users"
pg_dump: creating VIEW "tenant.transfer_history_view"
pg_dump: creating TABLE "tenant.user_activity_logs"
pg_dump: creating COMMENT "tenant.TABLE user_activity_logs"
pg_dump: creating TABLE "tenant.user_sessions"
pg_dump: creating TABLE "tenant.wallets"
pg_dump: creating COMMENT "tenant.TABLE wallets"
pg_dump: creating VIEW "tenant.user_wallet_summary"
pg_dump: creating TABLE "tenant.wallet_fundings"
pg_dump: creating COMMENT "tenant.TABLE wallet_fundings"
pg_dump: creating SEQUENCE "tenant.wallet_number_seq"
pg_dump: creating TABLE "tenant.wallet_transactions"
pg_dump: creating DEFAULT "platform.ai_intent_templates id"
pg_dump: creating DEFAULT "platform.ai_models id"
pg_dump: creating DEFAULT "platform.ngn_bank_codes id"
pg_dump: creating DEFAULT "tenant.ai_analytics_insights id"
pg_dump: creating DEFAULT "tenant.ai_configuration id"
pg_dump: creating DEFAULT "tenant.ai_context_mappings id"
pg_dump: creating DEFAULT "tenant.ai_conversation_logs id"
pg_dump: creating DEFAULT "tenant.ai_intent_categories id"
pg_dump: creating DEFAULT "tenant.ai_intent_patterns id"
pg_dump: creating DEFAULT "tenant.ai_learning_feedback id"
pg_dump: creating DEFAULT "tenant.ai_response_templates id"
pg_dump: creating DEFAULT "tenant.ai_smart_suggestions id"
pg_dump: creating DEFAULT "tenant.ai_translation_patterns id"
pg_dump: creating CONSTRAINT "analytics.ai_conversation_analytics ai_conversation_analytics_pkey"
pg_dump: creating CONSTRAINT "analytics.ai_fraud_analytics ai_fraud_analytics_pkey"
pg_dump: creating CONSTRAINT "audit.cbn_compliance_reports cbn_compliance_reports_pkey"
pg_dump: creating CONSTRAINT "audit.cbn_incidents cbn_incidents_pkey"
pg_dump: creating CONSTRAINT "audit.cbn_security_audits cbn_security_audits_pkey"
pg_dump: creating CONSTRAINT "audit.data_localization_checks data_localization_checks_pkey"
pg_dump: creating CONSTRAINT "audit.network_segmentation network_segmentation_pkey"
pg_dump: creating CONSTRAINT "audit.pci_dss_compliance pci_dss_compliance_pkey"
pg_dump: creating CONSTRAINT "audit.pci_dss_findings pci_dss_findings_pkey"
pg_dump: creating CONSTRAINT "audit.pci_dss_requirements pci_dss_requirements_pkey"
pg_dump: creating CONSTRAINT "audit.security_alerts security_alerts_pkey"
pg_dump: creating CONSTRAINT "audit.siem_events siem_events_pkey"
pg_dump: creating CONSTRAINT "audit.siem_rules siem_rules_pkey"
pg_dump: creating CONSTRAINT "audit.tenant_audit_logs tenant_audit_logs_pkey"
pg_dump: creating CONSTRAINT "audit.threat_intelligence threat_intelligence_pkey"
pg_dump: creating CONSTRAINT "platform.ai_intent_templates ai_intent_templates_pkey"
pg_dump: creating CONSTRAINT "platform.ai_models ai_models_pkey"
pg_dump: creating CONSTRAINT "platform.bill_provider_templates bill_provider_templates_pkey"
pg_dump: creating CONSTRAINT "platform.bill_provider_templates bill_provider_templates_provider_code_key"
pg_dump: creating CONSTRAINT "platform.currency_config currency_config_pkey"
pg_dump: creating CONSTRAINT "platform.exchange_rates exchange_rates_pkey"
pg_dump: creating CONSTRAINT "platform.in_app_notifications in_app_notifications_pkey"
pg_dump: creating CONSTRAINT "platform.ngn_bank_codes ngn_bank_codes_bank_code_3_key"
pg_dump: creating CONSTRAINT "platform.ngn_bank_codes ngn_bank_codes_pkey"
pg_dump: creating CONSTRAINT "platform.notification_logs notification_logs_pkey"
pg_dump: creating CONSTRAINT "platform.notification_preferences notification_preferences_pkey"
pg_dump: creating CONSTRAINT "platform.notification_preferences notification_preferences_tenant_id_user_id_key"
pg_dump: creating CONSTRAINT "platform.notification_statistics notification_statistics_pkey"
pg_dump: creating CONSTRAINT "platform.notification_statistics notification_statistics_tenant_id_date_channel_event_type_key"
pg_dump: creating CONSTRAINT "platform.notification_templates notification_templates_pkey"
pg_dump: creating CONSTRAINT "platform.notification_templates notification_templates_tenant_id_event_type_channel_languag_key"
pg_dump: creating CONSTRAINT "platform.notifications notifications_pkey"
pg_dump: creating CONSTRAINT "platform.platform_config platform_config_config_key_key"
pg_dump: creating CONSTRAINT "platform.platform_config platform_config_pkey"
pg_dump: creating CONSTRAINT "platform.rbac_permissions rbac_permissions_code_key"
pg_dump: creating CONSTRAINT "platform.rbac_permissions rbac_permissions_pkey"
pg_dump: creating CONSTRAINT "platform.rbac_role_permissions rbac_role_permissions_pkey"
pg_dump: creating CONSTRAINT "platform.rbac_role_permissions rbac_role_permissions_role_id_permission_id_key"
pg_dump: creating CONSTRAINT "platform.rbac_roles rbac_roles_code_key"
pg_dump: creating CONSTRAINT "platform.rbac_roles rbac_roles_pkey"
pg_dump: creating CONSTRAINT "platform.receipt_templates receipt_templates_pkey"
pg_dump: creating CONSTRAINT "platform.tenant_assets tenant_assets_pkey"
pg_dump: creating CONSTRAINT "platform.tenant_assets tenant_assets_tenant_id_asset_type_asset_name_key"
pg_dump: creating CONSTRAINT "platform.tenant_billing tenant_billing_pkey"
pg_dump: creating CONSTRAINT "platform.tenant_billing tenant_billing_tenant_id_billing_period_start_key"
pg_dump: creating CONSTRAINT "platform.tenant_usage_metrics tenant_usage_metrics_pkey"
pg_dump: creating CONSTRAINT "platform.tenant_usage_metrics tenant_usage_metrics_tenant_id_metric_date_key"
pg_dump: creating CONSTRAINT "platform.tenants tenants_bank_code_key"
pg_dump: creating CONSTRAINT "platform.tenants tenants_name_key"
pg_dump: creating CONSTRAINT "platform.tenants tenants_pkey"
pg_dump: creating CONSTRAINT "platform.tenants tenants_subdomain_key"
pg_dump: creating CONSTRAINT "platform.transaction_attachments transaction_attachments_pkey"
pg_dump: creating CONSTRAINT "platform.transaction_audit_log transaction_audit_log_pkey"
pg_dump: creating CONSTRAINT "platform.transaction_receipts transaction_receipts_pkey"
pg_dump: creating CONSTRAINT "platform.transaction_receipts transaction_receipts_receipt_number_key"
pg_dump: creating CONSTRAINT "platform.transaction_records transaction_records_pkey"
pg_dump: creating CONSTRAINT "platform.user_devices user_devices_device_token_key"
pg_dump: creating CONSTRAINT "platform.user_devices user_devices_pkey"
pg_dump: creating CONSTRAINT "platform.webhook_endpoints webhook_endpoints_pkey"
pg_dump: creating CONSTRAINT "tenant.account_access_logs account_access_logs_pkey"
--
-- TOC entry 4867 (class 2606 OID 29480)
-- Name: account_access_logs account_access_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT account_access_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4872 (class 2606 OID 29482)
-- Name: ai_analytics_insights ai_analytics_insights_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_analytics_insights
    ADD CONSTRAINT ai_analytics_insights_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 29484)
-- Name: ai_configuration ai_configuration_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration
    ADD CONSTRAINT ai_configuration_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 29486)
-- Name: ai_context_mappings ai_context_mappings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings
    ADD CONSTRAINT ai_context_mappings_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 29488)
-- Name: ai_conversation_logs ai_conversation_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_conversation_logs
    ADD CONSTRAINT ai_conversation_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 29490)
-- Name: ai_intent_categories ai_intent_categories_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 29492)
-- Name: ai_intent_categories ai_intent_categories_tenant_id_name_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- TOC entry 4886 (class 2606 OID 29494)
-- Name: ai_intent_patterns ai_intent_patterns_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns
    ADD CONSTRAINT ai_intent_patterns_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 29496)
-- Name: ai_learning_feedback ai_learning_feedback_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback
    ADD CONSTRAINT ai_learning_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 29498)
-- Name: ai_response_templates ai_response_templates_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates
    ADD CONSTRAINT ai_response_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 29500)
-- Name: ai_smart_suggestions ai_smart_suggestions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_smart_suggestions
    ADD CONSTRAINT ai_smart_suggestions_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 29502)
-- Name: ai_translation_patterns ai_translation_patterns_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_translation_patterns
    ADD CONSTRAINT ai_translation_patterns_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 29504)
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (id);


--
-- TOC entry 4909 (class 2606 OID 29506)
-- Name: bill_payments bill_payments_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT bill_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 29508)
-- Name: bill_payments bill_payments_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT bill_payments_reference_key UNIQUE (reference);


--
-- TOC entry 4917 (class 2606 OID 29510)
-- Name: bill_providers bill_providers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_providers
    ADD CONSTRAINT bill_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 29512)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4925 (class 2606 OID 29514)
-- Name: fraud_alerts fraud_alerts_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 4936 (class 2606 OID 29516)
-- Name: internal_transfers internal_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 4938 (class 2606 OID 29518)
-- Name: internal_transfers internal_transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_reference_key UNIQUE (reference);


--
-- TOC entry 4943 (class 2606 OID 29520)
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 29522)
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 29524)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 4961 (class 2606 OID 29526)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 29528)
-- Name: rbac_permission_audit rbac_permission_audit_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permission_audit
    ADD CONSTRAINT rbac_permission_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 4969 (class 2606 OID 29530)
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4971 (class 2606 OID 29532)
-- Name: rbac_permissions rbac_permissions_tenant_id_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- TOC entry 4973 (class 2606 OID 29534)
-- Name: rbac_role_hierarchy rbac_role_hierarchy_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 29536)
-- Name: rbac_role_hierarchy rbac_role_hierarchy_tenant_id_parent_role_id_child_role_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_tenant_id_parent_role_id_child_role_id_key UNIQUE (tenant_id, parent_role_id, child_role_id);


--
-- TOC entry 4978 (class 2606 OID 29538)
-- Name: rbac_role_permissions rbac_role_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 2606 OID 29540)
-- Name: rbac_role_permissions rbac_role_permissions_tenant_id_role_id_permission_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_tenant_id_role_id_permission_id_key UNIQUE (tenant_id, role_id, permission_id);


--
-- TOC entry 4984 (class 2606 OID 29542)
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 29544)
-- Name: rbac_roles rbac_roles_tenant_id_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- TOC entry 4988 (class 2606 OID 29546)
-- Name: rbac_temporary_permissions rbac_temporary_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_temporary_permissions
    ADD CONSTRAINT rbac_temporary_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 29548)
-- Name: rbac_user_roles rbac_user_roles_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4994 (class 2606 OID 29550)
-- Name: rbac_user_roles rbac_user_roles_tenant_id_user_id_role_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_tenant_id_user_id_role_id_key UNIQUE (tenant_id, user_id, role_id);


--
-- TOC entry 4999 (class 2606 OID 29552)
-- Name: recipients recipients_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_pkey PRIMARY KEY (id);


--
-- TOC entry 5001 (class 2606 OID 29554)
-- Name: recipients recipients_user_id_account_number_bank_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_account_number_bank_code_key UNIQUE (user_id, account_number, bank_code);


--
-- TOC entry 5006 (class 2606 OID 29556)
-- Name: recurring_transfers recurring_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 29558)
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 29560)
-- Name: referrals referrals_referrer_id_referee_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_referee_id_key UNIQUE (referrer_id, referee_id);


--
-- TOC entry 5018 (class 2606 OID 29562)
-- Name: scheduled_transfers scheduled_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 2606 OID 29564)
-- Name: scheduled_transfers scheduled_transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_reference_key UNIQUE (reference);


--
-- TOC entry 5022 (class 2606 OID 29566)
-- Name: tenant_metadata tenant_metadata_tenant_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.tenant_metadata
    ADD CONSTRAINT tenant_metadata_tenant_id_key UNIQUE (tenant_id);


--
-- TOC entry 5027 (class 2606 OID 29568)
-- Name: transaction_logs transaction_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5043 (class 2606 OID 29570)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5045 (class 2606 OID 29572)
-- Name: transactions transactions_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_reference_key UNIQUE (reference);


--
-- TOC entry 5054 (class 2606 OID 29574)
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- TOC entry 5056 (class 2606 OID 29576)
-- Name: transfers transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_reference_key UNIQUE (reference);


--
-- TOC entry 4907 (class 2606 OID 29578)
-- Name: analytics_cache uq_analytics_cache_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT uq_analytics_cache_key UNIQUE (tenant_id, user_id, cache_key);


--
-- TOC entry 4954 (class 2606 OID 29580)
-- Name: notification_preferences uq_notification_preferences; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT uq_notification_preferences UNIQUE (tenant_id, user_id, channel, notification_type);


--
-- TOC entry 5084 (class 2606 OID 29582)
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5090 (class 2606 OID 29584)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 29586)
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 5094 (class 2606 OID 29588)
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- TOC entry 5067 (class 2606 OID 29590)
-- Name: users users_account_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_account_number_key UNIQUE (account_number);


--
-- TOC entry 5069 (class 2606 OID 29592)
-- Name: users users_bvn_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_bvn_key UNIQUE (bvn);


--
-- TOC entry 5071 (class 2606 OID 29594)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5073 (class 2606 OID 29596)
-- Name: users users_nin_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_nin_key UNIQUE (nin);


--
-- TOC entry 5075 (class 2606 OID 29598)
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- TOC entry 5077 (class 2606 OID 29600)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 29602)
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- TOC entry 5115 (class 2606 OID 29604)
-- Name: wallet_fundings wallet_fundings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 29606)
-- Name: wallet_fundings wallet_fundings_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_reference_key UNIQUE (reference);


--
-- TOC entry 5122 (class 2606 OID 29608)
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5105 (class 2606 OID 29610)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 5107 (class 2606 OID 29612)
-- Name: wallets wallets_user_id_wallet_type_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_wallet_type_key UNIQUE (user_id, wallet_type);


--
-- TOC entry 5109 (class 2606 OID 29614)
-- Name: wallets wallets_wallet_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_wallet_number_key UNIQUE (wallet_number);


--
-- TOC entry 4644 (class 1259 OID 29615)
-- Name: idx_ai_conversation_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_date ON analytics.ai_conversation_analytics USING btree (conversation_date);


--
-- TOC entry 4645 (class 1259 OID 29616)
-- Name: idx_ai_conversation_tenant_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_tenant_date ON analytics.ai_conversation_analytics USING btree (tenant_id, conversation_date);


--
-- TOC entry 4648 (class 1259 OID 29617)
-- Name: idx_ai_fraud_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_fraud_date ON analytics.ai_fraud_analytics USING btree (analysis_date);


--
-- TOC entry 4649 (class 1259 OID 29618)
-- Name: idx_ai_fraud_tenant_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_fraud_tenant_date ON analytics.ai_fraud_analytics USING btree (tenant_id, analysis_date);


--
-- TOC entry 4672 (class 1259 OID 29619)
-- Name: idx_tenant_audit_event_type; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_event_type ON audit.tenant_audit_logs USING btree (event_type, created_at);


--
-- TOC entry 4673 (class 1259 OID 29620)
-- Name: idx_tenant_audit_resource; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_resource ON audit.tenant_audit_logs USING btree (resource_type, resource_id);


--
-- TOC entry 4674 (class 1259 OID 29621)
-- Name: idx_tenant_audit_risk_level; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_risk_level ON audit.tenant_audit_logs USING btree (risk_level) WHERE ((risk_level)::text = ANY (ARRAY[('high'::character varying)::text, ('critical'::character varying)::text]));


--
-- TOC entry 4675 (class 1259 OID 29622)
-- Name: idx_tenant_audit_service_operation; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_service_operation ON audit.tenant_audit_logs USING btree (service_name, operation);


--
-- TOC entry 4676 (class 1259 OID 29623)
-- Name: idx_tenant_audit_tenant_created; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_tenant_created ON audit.tenant_audit_logs USING btree (tenant_id, created_at);


--
-- TOC entry 4677 (class 1259 OID 29624)
-- Name: idx_tenant_audit_user; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_user ON audit.tenant_audit_logs USING btree (user_id, created_at);


--
-- TOC entry 4690 (class 1259 OID 29625)
-- Name: idx_bill_provider_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_bill_provider_templates_active ON platform.bill_provider_templates USING btree (is_active);


--
-- TOC entry 4691 (class 1259 OID 29626)
-- Name: idx_bill_provider_templates_category; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_bill_provider_templates_category ON platform.bill_provider_templates USING btree (category);


--
-- TOC entry 4696 (class 1259 OID 29627)
-- Name: idx_exchange_rates_from; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_from ON platform.exchange_rates USING btree (from_currency);


--
-- TOC entry 4697 (class 1259 OID 29628)
-- Name: idx_exchange_rates_pair_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_exchange_rates_pair_active ON platform.exchange_rates USING btree (from_currency, to_currency, valid_from) WHERE (is_active = true);


--
-- TOC entry 4698 (class 1259 OID 29629)
-- Name: idx_exchange_rates_to; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_to ON platform.exchange_rates USING btree (to_currency);


--
-- TOC entry 4699 (class 1259 OID 29630)
-- Name: idx_exchange_rates_valid; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_valid ON platform.exchange_rates USING btree (valid_from, valid_until);


--
-- TOC entry 4700 (class 1259 OID 29631)
-- Name: idx_in_app_notifications_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_created_at ON platform.in_app_notifications USING btree (created_at);


--
-- TOC entry 4701 (class 1259 OID 29632)
-- Name: idx_in_app_notifications_data; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_data ON platform.in_app_notifications USING gin (data);


--
-- TOC entry 4702 (class 1259 OID 29633)
-- Name: idx_in_app_notifications_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_tenant_user ON platform.in_app_notifications USING btree (tenant_id, user_id);


--
-- TOC entry 4703 (class 1259 OID 29634)
-- Name: idx_in_app_notifications_user_unread; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_user_unread ON platform.in_app_notifications USING btree (user_id, is_read) WHERE (is_deleted = false);


--
-- TOC entry 4706 (class 1259 OID 29635)
-- Name: idx_ngn_bank_code_3; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_3 ON platform.ngn_bank_codes USING btree (bank_code_3);


--
-- TOC entry 4707 (class 1259 OID 29636)
-- Name: idx_ngn_bank_code_5; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_5 ON platform.ngn_bank_codes USING btree (bank_code_5);


--
-- TOC entry 4708 (class 1259 OID 29637)
-- Name: idx_ngn_bank_code_6; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_6 ON platform.ngn_bank_codes USING btree (bank_code_6);


--
-- TOC entry 4709 (class 1259 OID 29638)
-- Name: idx_ngn_bank_code_9; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_9 ON platform.ngn_bank_codes USING btree (bank_code_9);


--
-- TOC entry 4710 (class 1259 OID 29639)
-- Name: idx_ngn_bank_name; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_name ON platform.ngn_bank_codes USING btree (bank_name);


--
-- TOC entry 4711 (class 1259 OID 29640)
-- Name: idx_ngn_bank_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_status ON platform.ngn_bank_codes USING btree (status);


--
-- TOC entry 4712 (class 1259 OID 29641)
-- Name: idx_ngn_bank_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_type ON platform.ngn_bank_codes USING btree (bank_type);


--
-- TOC entry 4717 (class 1259 OID 29642)
-- Name: idx_notification_logs_channel_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_channel_status ON platform.notification_logs USING btree (channel, status);


--
-- TOC entry 4718 (class 1259 OID 29643)
-- Name: idx_notification_logs_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_created_at ON platform.notification_logs USING btree (created_at);


--
-- TOC entry 4719 (class 1259 OID 29644)
-- Name: idx_notification_logs_notification_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_notification_id ON platform.notification_logs USING btree (notification_id);


--
-- TOC entry 4720 (class 1259 OID 29645)
-- Name: idx_notification_logs_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_tenant_user ON platform.notification_logs USING btree (tenant_id, user_id);


--
-- TOC entry 4723 (class 1259 OID 29646)
-- Name: idx_notification_preferences_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_tenant_user ON platform.notification_preferences USING btree (tenant_id, user_id);


--
-- TOC entry 4728 (class 1259 OID 29647)
-- Name: idx_notification_statistics_channel_event; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_statistics_channel_event ON platform.notification_statistics USING btree (channel, event_type);


--
-- TOC entry 4729 (class 1259 OID 29648)
-- Name: idx_notification_statistics_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_statistics_tenant_date ON platform.notification_statistics USING btree (tenant_id, date);


--
-- TOC entry 4734 (class 1259 OID 29649)
-- Name: idx_notification_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_active ON platform.notification_templates USING btree (is_active);


--
-- TOC entry 4735 (class 1259 OID 29650)
-- Name: idx_notification_templates_event_channel; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_event_channel ON platform.notification_templates USING btree (event_type, channel);


--
-- TOC entry 4736 (class 1259 OID 29651)
-- Name: idx_notification_templates_tenant; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_tenant ON platform.notification_templates USING btree (tenant_id);


--
-- TOC entry 4741 (class 1259 OID 29652)
-- Name: idx_notifications_channels; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_channels ON platform.notifications USING gin (channels);


--
-- TOC entry 4742 (class 1259 OID 29653)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_created_at ON platform.notifications USING btree (created_at);


--
-- TOC entry 4743 (class 1259 OID 29654)
-- Name: idx_notifications_data; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_data ON platform.notifications USING gin (data);


--
-- TOC entry 4744 (class 1259 OID 29655)
-- Name: idx_notifications_priority; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_priority ON platform.notifications USING btree (priority);


--
-- TOC entry 4745 (class 1259 OID 29656)
-- Name: idx_notifications_scheduled_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_scheduled_at ON platform.notifications USING btree (scheduled_at);


--
-- TOC entry 4746 (class 1259 OID 29657)
-- Name: idx_notifications_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_status ON platform.notifications USING btree (status);


--
-- TOC entry 4747 (class 1259 OID 29658)
-- Name: idx_notifications_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_tenant_user ON platform.notifications USING btree (tenant_id, user_id);


--
-- TOC entry 4748 (class 1259 OID 29659)
-- Name: idx_notifications_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_type ON platform.notifications USING btree (type);


--
-- TOC entry 4751 (class 1259 OID 29660)
-- Name: idx_platform_config_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_active ON platform.platform_config USING btree (is_active) WHERE (is_active = true);


--
-- TOC entry 4752 (class 1259 OID 29661)
-- Name: idx_platform_config_key; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_key ON platform.platform_config USING btree (config_key);


--
-- TOC entry 4753 (class 1259 OID 29662)
-- Name: idx_platform_config_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_type ON platform.platform_config USING btree (config_type);


--
-- TOC entry 4762 (class 1259 OID 29663)
-- Name: idx_platform_role_permissions_permission; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_role_permissions_permission ON platform.rbac_role_permissions USING btree (permission_id);


--
-- TOC entry 4763 (class 1259 OID 29664)
-- Name: idx_platform_role_permissions_role; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_role_permissions_role ON platform.rbac_role_permissions USING btree (role_id);


--
-- TOC entry 4772 (class 1259 OID 29665)
-- Name: idx_receipt_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_active ON platform.receipt_templates USING btree (is_active);


--
-- TOC entry 4773 (class 1259 OID 29666)
-- Name: idx_receipt_templates_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_tenant_id ON platform.receipt_templates USING btree (tenant_id);


--
-- TOC entry 4774 (class 1259 OID 29667)
-- Name: idx_receipt_templates_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_type ON platform.receipt_templates USING btree (transaction_type);


--
-- TOC entry 4777 (class 1259 OID 29668)
-- Name: idx_tenant_assets_branding; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_branding ON platform.tenant_assets USING btree (tenant_id, asset_type) WHERE ((asset_type)::text = ANY (ARRAY[('brand_colors'::character varying)::text, ('brand_fonts'::character varying)::text, ('brand_styling'::character varying)::text]));


--
-- TOC entry 4778 (class 1259 OID 29669)
-- Name: idx_tenant_assets_name; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_name ON platform.tenant_assets USING btree (asset_name);


--
-- TOC entry 4779 (class 1259 OID 29670)
-- Name: idx_tenant_assets_tenant_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_tenant_type ON platform.tenant_assets USING btree (tenant_id, asset_type);


--
-- TOC entry 4784 (class 1259 OID 29671)
-- Name: idx_tenant_billing_due_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_due_date ON platform.tenant_billing USING btree (due_date);


--
-- TOC entry 4785 (class 1259 OID 29672)
-- Name: idx_tenant_billing_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_status ON platform.tenant_billing USING btree (status);


--
-- TOC entry 4786 (class 1259 OID 29673)
-- Name: idx_tenant_billing_tenant_period; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_tenant_period ON platform.tenant_billing USING btree (tenant_id, billing_period_start);


--
-- TOC entry 4791 (class 1259 OID 29674)
-- Name: idx_tenant_usage_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_usage_date ON platform.tenant_usage_metrics USING btree (metric_date);


--
-- TOC entry 4792 (class 1259 OID 29675)
-- Name: idx_tenant_usage_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokupg_dump: creating CONSTRAINT "tenant.ai_analytics_insights ai_analytics_insights_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_configuration ai_configuration_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_context_mappings ai_context_mappings_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_conversation_logs ai_conversation_logs_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_intent_categories ai_intent_categories_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_intent_categories ai_intent_categories_tenant_id_name_key"
pg_dump: creating CONSTRAINT "tenant.ai_intent_patterns ai_intent_patterns_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_learning_feedback ai_learning_feedback_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_response_templates ai_response_templates_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_smart_suggestions ai_smart_suggestions_pkey"
pg_dump: creating CONSTRAINT "tenant.ai_translation_patterns ai_translation_patterns_pkey"
pg_dump: creating CONSTRAINT "tenant.analytics_cache analytics_cache_pkey"
pg_dump: creating CONSTRAINT "tenant.bill_payments bill_payments_pkey"
pg_dump: creating CONSTRAINT "tenant.bill_payments bill_payments_reference_key"
pg_dump: creating CONSTRAINT "tenant.bill_providers bill_providers_pkey"
pg_dump: creating CONSTRAINT "tenant.documents documents_pkey"
pg_dump: creating CONSTRAINT "tenant.fraud_alerts fraud_alerts_pkey"
pg_dump: creating CONSTRAINT "tenant.internal_transfers internal_transfers_pkey"
pg_dump: creating CONSTRAINT "tenant.internal_transfers internal_transfers_reference_key"
pg_dump: creating CONSTRAINT "tenant.kyc_documents kyc_documents_pkey"
pg_dump: creating CONSTRAINT "tenant.login_attempts login_attempts_pkey"
pg_dump: creating CONSTRAINT "tenant.notification_preferences notification_preferences_pkey"
pg_dump: creating CONSTRAINT "tenant.notifications notifications_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_permission_audit rbac_permission_audit_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_permissions rbac_permissions_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_permissions rbac_permissions_tenant_id_code_key"
pg_dump: creating CONSTRAINT "tenant.rbac_role_hierarchy rbac_role_hierarchy_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_role_hierarchy rbac_role_hierarchy_tenant_id_parent_role_id_child_role_id_key"
pg_dump: creating CONSTRAINT "tenant.rbac_role_permissions rbac_role_permissions_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_role_permissions rbac_role_permissions_tenant_id_role_id_permission_id_key"
pg_dump: creating CONSTRAINT "tenant.rbac_roles rbac_roles_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_roles rbac_roles_tenant_id_code_key"
pg_dump: creating CONSTRAINT "tenant.rbac_temporary_permissions rbac_temporary_permissions_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_user_roles rbac_user_roles_pkey"
pg_dump: creating CONSTRAINT "tenant.rbac_user_roles rbac_user_roles_tenant_id_user_id_role_id_key"
pg_dump: creating CONSTRAINT "tenant.recipients recipients_pkey"
pg_dump: creating CONSTRAINT "tenant.recipients recipients_user_id_account_number_bank_code_key"
pg_dump: creating CONSTRAINT "tenant.recurring_transfers recurring_transfers_pkey"
pg_dump: creating CONSTRAINT "tenant.referrals referrals_pkey"
pg_dump: creating CONSTRAINT "tenant.referrals referrals_referrer_id_referee_id_key"
pg_dump: creating CONSTRAINT "tenant.scheduled_transfers scheduled_transfers_pkey"
pg_dump: creating CONSTRAINT "tenant.scheduled_transfers scheduled_transfers_reference_key"
pg_dump: creating CONSTRAINT "tenant.tenant_metadata tenant_metadata_tenant_id_key"
pg_dump: creating CONSTRAINT "tenant.transaction_logs transaction_logs_pkey"
pg_dump: creating CONSTRAINT "tenant.transactions transactions_pkey"
pg_dump: creating CONSTRAINT "tenant.transactions transactions_reference_key"
pg_dump: creating CONSTRAINT "tenant.transfers transfers_pkey"
pg_dump: creating CONSTRAINT "tenant.transfers transfers_reference_key"
pg_dump: creating CONSTRAINT "tenant.analytics_cache uq_analytics_cache_key"
pg_dump: creating CONSTRAINT "tenant.notification_preferences uq_notification_preferences"
pg_dump: creating CONSTRAINT "tenant.user_activity_logs user_activity_logs_pkey"
pg_dump: creating CONSTRAINT "tenant.user_sessions user_sessions_pkey"
pg_dump: creating CONSTRAINT "tenant.user_sessions user_sessions_refresh_token_key"
pg_dump: creating CONSTRAINT "tenant.user_sessions user_sessions_session_token_key"
pg_dump: creating CONSTRAINT "tenant.users users_account_number_key"
pg_dump: creating CONSTRAINT "tenant.users users_bvn_key"
pg_dump: creating CONSTRAINT "tenant.users users_email_key"
pg_dump: creating CONSTRAINT "tenant.users users_nin_key"
pg_dump: creating CONSTRAINT "tenant.users users_phone_number_key"
pg_dump: creating CONSTRAINT "tenant.users users_pkey"
pg_dump: creating CONSTRAINT "tenant.users users_referral_code_key"
pg_dump: creating CONSTRAINT "tenant.wallet_fundings wallet_fundings_pkey"
pg_dump: creating CONSTRAINT "tenant.wallet_fundings wallet_fundings_reference_key"
pg_dump: creating CONSTRAINT "tenant.wallet_transactions wallet_transactions_pkey"
pg_dump: creating CONSTRAINT "tenant.wallets wallets_pkey"
pg_dump: creating CONSTRAINT "tenant.wallets wallets_user_id_wallet_type_key"
pg_dump: creating CONSTRAINT "tenant.wallets wallets_wallet_number_key"
pg_dump: creating INDEX "analytics.idx_ai_conversation_date"
pg_dump: creating INDEX "analytics.idx_ai_conversation_tenant_date"
pg_dump: creating INDEX "analytics.idx_ai_fraud_date"
pg_dump: creating INDEX "analytics.idx_ai_fraud_tenant_date"
pg_dump: creating INDEX "audit.idx_tenant_audit_event_type"
pg_dump: creating INDEX "audit.idx_tenant_audit_resource"
pg_dump: creating INDEX "audit.idx_tenant_audit_risk_level"
pg_dump: creating INDEX "audit.idx_tenant_audit_service_operation"
pg_dump: creating INDEX "audit.idx_tenant_audit_tenant_created"
pg_dump: creating INDEX "audit.idx_tenant_audit_user"
pg_dump: creating INDEX "platform.idx_bill_provider_templates_active"
pg_dump: creating INDEX "platform.idx_bill_provider_templates_category"
pg_dump: creating INDEX "platform.idx_exchange_rates_from"
pg_dump: creating INDEX "platform.idx_exchange_rates_pair_active"
pg_dump: creating INDEX "platform.idx_exchange_rates_to"
pg_dump: creating INDEX "platform.idx_exchange_rates_valid"
pg_dump: creating INDEX "platform.idx_in_app_notifications_created_at"
pg_dump: creating INDEX "platform.idx_in_app_notifications_data"
pg_dump: creating INDEX "platform.idx_in_app_notifications_tenant_user"
pg_dump: creating INDEX "platform.idx_in_app_notifications_user_unread"
pg_dump: creating INDEX "platform.idx_ngn_bank_code_3"
pg_dump: creating INDEX "platform.idx_ngn_bank_code_5"
pg_dump: creating INDEX "platform.idx_ngn_bank_code_6"
pg_dump: creating INDEX "platform.idx_ngn_bank_code_9"
pg_dump: creating INDEX "platform.idx_ngn_bank_name"
pg_dump: creating INDEX "platform.idx_ngn_bank_status"
pg_dump: creating INDEX "platform.idx_ngn_bank_type"
pg_dump: creating INDEX "platform.idx_notification_logs_channel_status"
pg_dump: creating INDEX "platform.idx_notification_logs_created_at"
pg_dump: creating INDEX "platform.idx_notification_logs_notification_id"
pg_dump: creating INDEX "platform.idx_notification_logs_tenant_user"
pg_dump: creating INDEX "platform.idx_notification_preferences_tenant_user"
pg_dump: creating INDEX "platform.idx_notification_statistics_channel_event"
pg_dump: creating INDEX "platform.idx_notification_statistics_tenant_date"
pg_dump: creating INDEX "platform.idx_notification_templates_active"
pg_dump: creating INDEX "platform.idx_notification_templates_event_channel"
pg_dump: creating INDEX "platform.idx_notification_templates_tenant"
pg_dump: creating INDEX "platform.idx_notifications_channels"
pg_dump: creating INDEX "platform.idx_notifications_created_at"
pg_dump: creating INDEX "platform.idx_notifications_data"
pg_dump: creating INDEX "platform.idx_notifications_priority"
pg_dump: creating INDEX "platform.idx_notifications_scheduled_at"
pg_dump: creating INDEX "platform.idx_notifications_status"
pg_dump: creating INDEX "platform.idx_notifications_tenant_user"
pg_dump: creating INDEX "platform.idx_notifications_type"
pg_dump: creating INDEX "platform.idx_platform_config_active"
pg_dump: creating INDEX "platform.idx_platform_config_key"
pg_dump: creating INDEX "platform.idx_platform_config_type"
pg_dump: creating INDEX "platform.idx_platform_role_permissions_permission"
pg_dump: creating INDEX "platform.idx_platform_role_permissions_role"
pg_dump: creating INDEX "platform.idx_receipt_templates_active"
pg_dump: creating INDEX "platform.idx_receipt_templates_tenant_id"
pg_dump: creating INDEX "platform.idx_receipt_templates_type"
pg_dump: creating INDEX "platform.idx_tenant_assets_branding"
pg_dump: creating INDEX "platform.idx_tenant_assets_name"
pg_dump: creating INDEX "platform.idx_tenant_assets_tenant_type"
pg_dump: creating INDEX "platform.idx_tenant_billing_due_date"
pg_dump: creating INDEX "platform.idx_tenant_billing_status"
pg_dump: creating INDEX "platform.idx_tenant_billing_tenant_period"
pg_dump: creating INDEX "platform.idx_tenant_usage_date"
pg_dump: creating INDEX "platform.idx_tenant_usage_tenant_date"
pg_dump: creating INDEX "platform.idx_tenants_created_at"
pg_dump: creating INDEX "platform.idx_tenants_currency"
pg_dump: creating INDEX "platform.idx_tenants_custom_domain"
pg_dump: creating INDEX "platform.idx_tenants_database_status"
pg_dump: creating INDEX "platform.idx_tenants_locale"
pg_dump: creating INDEX "platform.idx_tenants_region"
pg_dump: creating INDEX "platform.idx_tenants_status"
pg_dump: creating INDEX "platform.idx_tenants_subdomain"
pg_dump: creating INDEX "platform.idx_tenants_tier"
pg_dump: creating INDEX "platform.idx_transaction_attachments_tenant_id"
pg_dump: creating INDEX "platform.idx_transaction_attachments_transaction_id"
pg_dump: creating INDEX "platform.idx_transaction_attachments_type"
pg_dump: creating INDEX "platform.idx_transaction_audit_log_action"
pg_dump: creating INDEX "platform.idx_transaction_audit_log_created_at"
pg_dump: creating INDEX "platform.idx_transaction_audit_log_tenant_id"
pg_dump: creating INDEX "platform.idx_transaction_audit_log_transaction_id"
pg_dump: creating INDEX "platform.idx_transaction_receipts_date"
pg_dump: creating INDEX "platform.idx_transaction_receipts_receipt_number"
pg_dump: creating INDEX "platform.idx_transaction_receipts_recipient_details"
pg_dump: creating INDEX "platform.idx_transaction_receipts_reference"
pg_dump: creating INDEX "platform.idx_transaction_receipts_sender_details"
pg_dump: creating INDEX "platform.idx_transaction_receipts_status"
pg_dump: creating INDEX "platform.idx_transaction_receipts_tenant_date"
pg_dump: creating INDEX "platform.idx_transaction_receipts_tenant_id"
pg_dump: creating INDEX "platform.idx_transaction_receipts_transaction_id"
pg_dump: creating INDEX "platform.idx_transaction_receipts_type"
pg_dump: creating INDEX "platform.idx_transaction_records_account_date"
pg_dump: creating INDEX "platform.idx_transaction_records_account_id"
pg_dump: creating INDEX "platform.idx_transaction_records_amount"
pg_dump: creating INDEX "platform.idx_transaction_records_category"
pg_dump: creating INDEX "platform.idx_transaction_records_created_at"
pg_dump: creating INDEX "platform.idx_transaction_records_metadata"
pg_dump: creating INDEX "platform.idx_transaction_records_recipient_details"
pg_dump: creating INDEX "platform.idx_transaction_records_reference"
pg_dump: creating INDEX "platform.idx_transaction_records_status"
pg_dump: creating INDEX "platform.idx_transaction_records_tenant_id"
pg_dump: creating INDEX "platform.idx_transaction_records_type"
pg_dump: creating INDEX "platform.idx_transaction_records_type_status"
pg_dump: creating INDEX "platform.idx_transaction_records_user_date"
pg_dump: creating INDEX "platform.idx_transaction_records_user_id"
pg_dump: creating INDEX "platform.idx_user_devices_active"
pg_dump: creating INDEX "platform.idx_user_devices_tenant_user"
pg_dump: creating INDEX "platform.idx_user_devices_token"
pg_dump: creating INDEX "platform.idx_webhook_endpoints_active"
pg_dump: creating INDEX "platform.idx_webhook_endpoints_tenant"
pg_dump: creating INDEX "tenant.idx_account_access_logs_created_at"
pg_dump: creating INDEX "tenant.idx_account_access_logs_tenant_user"
pg_dump: creating INDEX "tenant.idx_account_access_logs_wallet"
pg_dump: creating INDEX "tenant.idx_activity_logs_activity_type"
pg_dump: creating INDEX "tenant.idx_activity_logs_created_at"
pg_dump: creating INDEX "tenant.idx_activity_logs_user_id"
pg_dump: creating INDEX "tenant.idx_analytics_cache_expires"
pg_dump: creating INDEX "tenant.idx_analytics_cache_tenant_user"
pg_dump: creating INDEX "tenant.idx_bill_payments_created_at"
pg_dump: creating INDEX "tenant.idx_bill_payments_reference"
pg_dump: creating INDEX "tenant.idx_bill_payments_status"
pg_dump: creating INDEX "tenant.idx_bill_payments_tenant_user"
pg_dump: creating INDEX "tenant.idx_documents_ai_processed"
pg_dump: creating INDEX "tenant.idx_documents_type"
pg_dump: creating INDEX "tenant.idx_documents_user"
pg_dump: creating INDEX "tenant.idx_documents_verification"
pg_dump: creating INDEX "tenant.idx_fraud_alerts_created"
pg_dump: creating INDEX "tenant.idx_fraud_alerts_severity"
pg_dump: creating INDEX "tenant.idx_fraud_alerts_status"
pg_dump: creating INDEX "tenant.idx_fraud_alerts_transaction"
pg_dump: creating INDEX "tenant.idx_fraud_alerts_user"
pg_dump: creating INDEX "tenant.idx_internal_transfers_from_wallet"
pg_dump: creating INDEX "tenant.idx_internal_transfers_reference"
pg_dump: creating INDEX "tenant.idx_internal_transfers_to_wallet"
pg_dump: creating INDEX "tenant.idx_internal_transfers_user_id"
pg_dump: creating INDEX "tenant.idx_kyc_documents_status"
pg_dump: creating INDEX "tenant.idx_kyc_documents_type"
pg_dump: creating INDEX "tenant.idx_kyc_documents_user_id"
pg_dump: creating INDEX "tenant.idx_login_attempts_attempted_at"
pg_dump: creating INDEX "tenant.idx_login_attempts_tenant_identifier"
pg_dump: creating INDEX "tenant.idx_login_attempts_tenant_ip"
pg_dump: creating INDEX "tenant.idx_notification_preferences_channel"
pg_dump: creating INDEX "tenant.idx_notification_preferences_tenant_user"
pg_dump: creating INDEX "tenant.idx_notifications_created"
pg_dump: creating INDEX "tenant.idx_notifications_priority"
pg_dump: creating INDEX "tenant.idx_notifications_scheduled"
pg_dump: creating INDEX "tenant.idx_notifications_type"
pg_dump: creating INDEX "tenant.idx_notifications_user_status"
pg_dump: creating INDEX "tenant.idx_recipients_account_number"
pg_dump: creating INDEX "tenant.idx_recipients_bank_code"
pg_dump: creating INDEX "tenant.idx_recipients_user_id"
pg_dump: creating INDEX "tenant.idx_recurring_transfers_status_date"
pg_dump: creating INDEX "tenant.idx_recurring_transfers_user"
pg_dump: creating INDEX "tenant.idx_recurring_transfers_wallet"
pg_dump: creating INDEX "tenant.idx_referrals_code"
pg_dump: creating INDEX "tenant.idx_referrals_referee_id"
pg_dump: creating INDEX "tenant.idx_referrals_referrer_id"
pg_dump: creating INDEX "tenant.idx_scheduled_transfers_status_date"
pg_dump: creating INDEX "tenant.idx_scheduled_transfers_user"
pg_dump: creating INDEX "tenant.idx_scheduled_transfers_wallet"
pg_dump: creating INDEX "tenant.idx_suggestions_action_type"
pg_dump: creating INDEX "tenant.idx_suggestions_category_language"
pg_dump: creating INDEX "tenant.idx_suggestions_conditions"
pg_dump: creating INDEX "tenant.idx_tenant_conversation_logs"
pg_dump: creating INDEX "tenant.idx_tenant_intent_categories"
pg_dump: creating INDEX "tenant.idx_tenant_intent_patterns"
pg_dump: creating INDEX "tenant.idx_tenant_permission_audit_resource"
pg_dump: creating INDEX "tenant.idx_tenant_permission_audit_time"
pg_dump: creating INDEX "tenant.idx_tenant_permission_audit_user"
pg_dump: creating INDEX "tenant.idx_tenant_permissions_tenant"
pg_dump: creating INDEX "tenant.idx_tenant_response_templates"
pg_dump: creating INDEX "tenant.idx_tenant_role_permissions_tenant_role"
pg_dump: creating INDEX "tenant.idx_tenant_roles_code"
pg_dump: creating INDEX "tenant.idx_tenant_roles_tenant"
pg_dump: creating INDEX "tenant.idx_tenant_smart_suggestions"
pg_dump: creating INDEX "tenant.idx_tenant_translations"
pg_dump: creating INDEX "tenant.idx_tenant_user_roles_active"
pg_dump: creating INDEX "tenant.idx_tenant_user_roles_tenant_user"
pg_dump: creating INDEX "tenant.idx_transaction_logs_created_at"
pg_dump: creating INDEX "tenant.idx_transaction_logs_event_type"
pg_dump: creating INDEX "tenant.idx_transaction_logs_transfer_id"
pg_dump: creating INDEX "tenant.idx_transactions_ai_initiated"
pg_dump: creating INDEX "tenant.idx_transactions_amount_range"
pg_dump: creating INDEX "tenant.idx_transactions_created_at"
pg_dump: creating INDEX "tenant.idx_transactions_external_ref"
pg_dump: creating INDEX "tenant.idx_transactions_fraud_score"
pg_dump: creating INDEX "tenant.idx_transactions_provider"
pg_dump: creating INDEX "tenant.idx_transactions_reference"
pg_dump: creating INDEX "tenant.idx_transactions_risk_level"
pg_dump: creating INDEX "tenant.idx_transactions_settlement"
pg_dump: creating INDEX "tenant.idx_transactions_status"
pg_dump: creating INDEX "tenant.idx_transactions_tenant_user"
pg_dump: creating INDEX "tenant.idx_transactions_type"
pg_dump: creating INDEX "tenant.idx_transactions_type_status_date"
pg_dump: creating INDEX "tenant.idx_transactions_user_status_date"
pg_dump: creating INDEX "tenant.idx_transfers_created_at"
pg_dump: creating INDEX "tenant.idx_transfers_date_range"
pg_dump: creating INDEX "tenant.idx_transfers_nibss_transaction_id"
pg_dump: creating INDEX "tenant.idx_transfers_recipient_id"
pg_dump: creating INDEX "tenant.idx_transfers_reference"
pg_dump: creating INDEX "tenant.idx_transfers_sender_id"
pg_dump: creating INDEX "tenant.idx_transfers_status"
pg_dump: creating INDEX "tenant.idx_user_sessions_expires"
pg_dump: creating INDEX "tenant.idx_user_sessions_suspicious"
pg_dump: creating INDEX "tenant.idx_user_sessions_token"
pg_dump: creating INDEX "tenant.idx_user_sessions_user"
pg_dump: creating INDEX "tenant.idx_users_account_number"
pg_dump: creating INDEX "tenant.idx_users_created_at"
pg_dump: creating INDEX "tenant.idx_users_email_tenant"
pg_dump: creating INDEX "tenant.idx_users_kyc_status"
pg_dump: creating INDEX "tenant.idx_users_phone_tenant"
pg_dump: creating INDEX "tenant.idx_users_referral_code"
pg_dump: creating INDEX "tenant.idx_users_risk_profile"
pg_dump: creating INDEX "tenant.idx_users_role"
pg_dump: creating INDEX "tenant.idx_users_status"
pg_dump: creating INDEX "tenant.idx_wallet_fundings_reference"
pg_dump: creating INDEX "tenant.idx_wallet_fundings_status"
pg_dump: creating INDEX "tenant.idx_wallet_fundings_user_id"
pg_dump: creating INDEX "tenant.idx_wallet_fundings_wallet_id"
pg_dump: creating INDEX "tenant.idx_wallet_transactions_transaction"
pg_dump: creating INDEX "tenant.idx_wallet_transactions_type"
pg_dump: creating INDEX "tenant.idx_wallet_transactions_wallet"
pg_dump: creating INDEX "tenant.idx_wallets_balance"
pg_dump: creating INDEX "tenant.idx_wallets_number"
pg_dump: creating INDEX "tenant.idx_wallets_primary"
pg_dump: creating INDEX "tenant.idx_wallets_status"
pg_dump: creating INDEX "tenant.idx_wallets_tenant_id"
pg_dump: creating INDEX "tenant.idx_wallets_type"
pg_dump: creating INDEX "tenant.idx_wallets_user_id"
pg_dump: creating INDEX "tenant.idx_wallets_user_tenant"
pg_dump: creating INDEX "tenant.unique_primary_wallet_per_user"
pg_dump: creating TRIGGER "platform.tenants log_tenant_changes_trigger"
pg_dump: creating TRIGGER "platform.tenant_assets trigger_tenant_assets_updated_at"
pg_dump: creating TRIGGER "platform.bill_provider_templates update_bill_provider_templates_updated_at"
pg_dump: creating TRIGGER "platform.notification_preferences update_notification_preferences_updated_at"
pg_dump: creating TRIGGER "platform.notification_statistics update_notification_statistics_updated_at"
pg_dump: creating TRIGGER "platform.notification_templates update_notification_templates_updated_at"
pg_dump: creating TRIGGER "platform.notifications update_notifications_updated_at"
pg_dump: creating TRIGGER "platform.platform_config update_platform_config_updated_at"
pg_dump: creating TRIGGER "platform.rbac_permissions update_platform_rbac_permissions_updated_at"
pg_dump: creating TRIGGER "platform.rbac_roles update_platform_rbac_roles_updated_at"
pg_dump: creating TRIGGER "platform.receipt_templates update_receipt_templates_updated_at"
pg_dump: creating TRIGGER "platform.tenant_billing update_tenant_billing_updated_at"
pg_dump: creating TRIGGER "platform.tenants update_tenants_updated_at"
pg_dump: creating TRIGGER "platform.transaction_attachments update_transaction_attachments_updated_at"
pg_dump: creating TRIGGER "platform.transaction_receipts update_transaction_receipts_updated_at"
pg_dump: creating TRIGGER "platform.transaction_records update_transaction_records_updated_at"
pg_dump: creating TRIGGER "platform.user_devices update_user_devices_updated_at"
pg_dump: creating TRIGGER "platform.webhook_endpoints update_webhook_endpoints_updated_at"
pg_dump: creating TRIGGER "platform.tenants validate_tenant_bank_code"
pg_dump: creating TRIGGER "tenant.users auto_assign_account_number"
pg_dump: creating TRIGGER "tenant.users auto_create_primary_wallet"
pg_dump: creating TRIGGER "tenant.transactions create_wallet_transaction_trigger"
pg_dump: creating TRIGGER "tenant.transactions generate_transaction_reference_trigger"
pg_dump: creating TRIGGER "tenant.wallets generate_wallet_number_trigger"
pg_dump: creating TRIGGER "tenant.bill_payments sync_bill_payments_to_transactions"
pg_dump: creating TRIGGER "tenant.transfers sync_transfer_to_transactions_trigger"
pg_dump: creating TRIGGER "tenant.transfers sync_transfers_to_transactions"
pg_dump: creating TRIGGER "tenant.bill_payments update_bill_payments_updated_at"
pg_dump: creating TRIGGER "tenant.documents update_documents_updated_at"
pg_dump: creating TRIGGER "tenant.fraud_alerts update_fraud_alerts_updated_at"
pg_dump: creating TRIGGER "tenant.notification_preferences update_notification_preferences_updated_at"
pg_dump: creating TRIGGER "tenant.recipients update_recipients_updated_at"
pg_dump: creating TRIGGER "tenant.recurring_transfers update_recurring_transfers_updated_at"
pg_dump: creating TRIGGER "tenant.scheduled_transfers update_scheduled_transfers_updated_at"
pg_dump: creating TRIGGER "tenant.rbac_permissions update_tenant_rbac_permissions_updated_at"
pg_dump: creating TRIGGER "tenant.rbac_role_permissions update_tenant_rbac_role_permissions_updated_at"
pg_dump: creating TRIGGER "tenant.rbac_roles update_tenant_rbac_roles_updated_at"
pg_dump: creating TRIGGER "tenant.rbac_user_roles update_tenant_rbac_user_roles_updated_at"
pg_dump: creating TRIGGER "tenant.transactions update_transactions_updated_at"
pg_dump: creating TRIGGER "tenant.transfers update_transfers_updated_at"
pg_dump: creating TRIGGER "tenant.users update_users_updated_at"
pg_dump: creating TRIGGER "tenant.wallets update_wallets_balance_trigger"
pg_dump: creating TRIGGER "tenant.wallets update_wallets_updated_at"
pg_dump: creating FK CONSTRAINT "analytics.ai_conversation_analytics ai_conversation_analytics_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "analytics.ai_fraud_analytics ai_fraud_analytics_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "audit.cbn_incidents cbn_incidents_compliance_report_id_fkey"
pg_dump: creating FK CONSTRAINT "audit.pci_dss_findings pci_dss_findings_requirement_id_fkey"
pg_dump: creating FK CONSTRAINT "audit.pci_dss_requirements pci_dss_requirements_compliance_id_fkey"
pg_dump: creating FK CONSTRAINT "audit.tenant_audit_logs tenant_audit_logs_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.exchange_rates exchange_rates_from_currency_fkey"
pg_dump: creating FK CONSTRAINT "platform.exchange_rates exchange_rates_to_currency_fkey"
pg_dump: creating FK CONSTRAINT "platform.in_app_notifications in_app_notifications_notification_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.notification_logs notification_logs_notification_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.rbac_role_permissions rbac_role_permissions_permission_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.rbac_role_permissions rbac_role_permissions_role_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.tenant_assets tenant_assets_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.tenant_billing tenant_billing_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "platform.tenant_usage_metrics tenant_usage_metrics_tenant_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.ai_configuration ai_configuration_preferred_model_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.ai_context_mappings ai_context_mappings_intent_category_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.ai_intent_patterns ai_intent_patterns_intent_category_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.ai_learning_feedback ai_learning_feedback_conversation_log_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.ai_response_templates ai_response_templates_intent_category_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.documents documents_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.documents documents_verified_by_fkey"
pg_dump: creating FK CONSTRAINT "tenant.account_access_logs fk_account_access_logs_tenant"
pg_dump: creating FK CONSTRAINT "tenant.account_access_logs fk_account_access_logs_user"
pg_dump: creating FK CONSTRAINT "tenant.account_access_logs fk_account_access_logs_wallet"
pg_dump: creating FK CONSTRAINT "tenant.analytics_cache fk_analytics_cache_tenant"
pg_dump: creating FK CONSTRAINT "tenant.analytics_cache fk_analytics_cache_user"
pg_dump: creating FK CONSTRAINT "tenant.bill_payments fk_bill_payments_tenant"
pg_dump: creating FK CONSTRAINT "tenant.bill_payments fk_bill_payments_user"
pg_dump: creating FK CONSTRAINT "tenant.login_attempts fk_login_attempts_tenant"
pg_dump: creating FK CONSTRAINT "tenant.notification_preferences fk_notification_preferences_tenant"
pg_dump: creating FK CONSTRAINT "tenant.notification_preferences fk_notification_preferences_user"
pg_dump: creating FK CONSTRAINT "tenant.fraud_alerts fraud_alerts_resolved_by_fkey"
pg_dump: creating FK CONSTRAINT "tenant.fraud_alerts fraud_alerts_transaction_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.fraud_alerts fraud_alerts_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.internal_transfers internal_transfers_from_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.internal_transfers internal_transfers_to_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.internal_transfers internal_transfers_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.kyc_documents kyc_documents_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.notifications notifications_related_alert_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.notifications notifications_related_transaction_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.notifications notifications_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_permissions rbac_permissions_platform_permission_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_role_hierarchy rbac_role_hierarchy_child_role_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_role_hierarchy rbac_role_hierarchy_parent_role_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_role_permissions rbac_role_permissions_permission_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_role_permissions rbac_role_permissions_role_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_roles rbac_roles_platform_role_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_temporary_permissions rbac_temporary_permissions_permission_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.rbac_user_roles rbac_user_roles_role_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.recipients recipients_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.recurring_transfers recurring_transfers_from_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.recurring_transfers recurring_transfers_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.referrals referrals_referee_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.referrals referrals_referrer_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.scheduled_transfers scheduled_transfers_from_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.scheduled_transfers scheduled_transfers_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transaction_logs transaction_logs_transfer_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transactions transactions_parent_transaction_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transactions transactions_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transfers transfers_recipient_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transfers transfers_recipient_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.transfers transfers_sender_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.user_activity_logs user_activity_logs_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.user_sessions user_sessions_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.wallet_fundings wallet_fundings_user_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.wallet_fundings wallet_fundings_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.wallet_transactions wallet_transactions_transaction_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.wallet_transactions wallet_transactions_wallet_id_fkey"
pg_dump: creating FK CONSTRAINT "tenant.wallets wallets_user_id_fkey"
pg_dump: creating ROW SECURITY "analytics.ai_conversation_analytics"
pg_dump: creating ROW SECURITY "analytics.ai_fraud_analytics"
pg_dump: creating ROW SECURITY "audit.tenant_audit_logs"
pg_dump: creating ROW SECURITY "platform.tenant_billing"
pg_dump: creating POLICY "platform.tenant_billing tenant_billing_isolation"
pg_dump: creating POLICY "platform.tenant_usage_metrics tenant_usage_isolation"
pg_dump: creating ROW SECURITY "platform.tenant_usage_metrics"
pg_dump: creating ROW SECURITY "tenant.documents"
pg_dump: creating ROW SECURITY "tenant.fraud_alerts"
pg_dump: creating ROW SECURITY "tenant.notifications"
pg_dump: creating ROW SECURITY "tenant.rbac_permission_audit"
pg_dump: creating ROW SECURITY "tenant.rbac_permissions"
pg_dump: creating ROW SECURITY "tenant.rbac_role_permissions"
pg_dump: creating ROW SECURITY "tenant.rbac_roles"
pg_dump: creating ROW SECURITY "tenant.rbac_user_roles"
pg_dump: creating ROW SECURITY "tenant.transactions"
pg_dump: creating ROW SECURITY "tenant.users"
pg_dump: creating ROW SECURITY "tenant.wallets"
n
--

CREATE INDEX idx_tenant_usage_tenant_date ON platform.tenant_usage_metrics USING btree (tenant_id, metric_date);


--
-- TOC entry 4797 (class 1259 OID 29676)
-- Name: idx_tenants_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_created_at ON platform.tenants USING btree (created_at);


--
-- TOC entry 4798 (class 1259 OID 29677)
-- Name: idx_tenants_currency; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_currency ON platform.tenants USING btree (currency);


--
-- TOC entry 4799 (class 1259 OID 29678)
-- Name: idx_tenants_custom_domain; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_custom_domain ON platform.tenants USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- TOC entry 4800 (class 1259 OID 29679)
-- Name: idx_tenants_database_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_database_status ON platform.tenants USING btree (database_status);


--
-- TOC entry 4801 (class 1259 OID 29680)
-- Name: idx_tenants_locale; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_locale ON platform.tenants USING btree (locale);


--
-- TOC entry 4802 (class 1259 OID 29681)
-- Name: idx_tenants_region; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_region ON platform.tenants USING btree (region);


--
-- TOC entry 4803 (class 1259 OID 29682)
-- Name: idx_tenants_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_status ON platform.tenants USING btree (status);


--
-- TOC entry 4804 (class 1259 OID 29683)
-- Name: idx_tenants_subdomain; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_subdomain ON platform.tenants USING btree (subdomain);


--
-- TOC entry 4805 (class 1259 OID 29684)
-- Name: idx_tenants_tier; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_tier ON platform.tenants USING btree (tier);


--
-- TOC entry 4814 (class 1259 OID 29685)
-- Name: idx_transaction_attachments_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_tenant_id ON platform.transaction_attachments USING btree (tenant_id);


--
-- TOC entry 4815 (class 1259 OID 29686)
-- Name: idx_transaction_attachments_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_transaction_id ON platform.transaction_attachments USING btree (transaction_id);


--
-- TOC entry 4816 (class 1259 OID 29687)
-- Name: idx_transaction_attachments_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_type ON platform.transaction_attachments USING btree (attachment_type);


--
-- TOC entry 4819 (class 1259 OID 29688)
-- Name: idx_transaction_audit_log_action; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_action ON platform.transaction_audit_log USING btree (action);


--
-- TOC entry 4820 (class 1259 OID 29689)
-- Name: idx_transaction_audit_log_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_created_at ON platform.transaction_audit_log USING btree (created_at);


--
-- TOC entry 4821 (class 1259 OID 29690)
-- Name: idx_transaction_audit_log_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_tenant_id ON platform.transaction_audit_log USING btree (tenant_id);


--
-- TOC entry 4822 (class 1259 OID 29691)
-- Name: idx_transaction_audit_log_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_transaction_id ON platform.transaction_audit_log USING btree (transaction_id);


--
-- TOC entry 4825 (class 1259 OID 29692)
-- Name: idx_transaction_receipts_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_date ON platform.transaction_receipts USING btree (transaction_date);


--
-- TOC entry 4826 (class 1259 OID 29693)
-- Name: idx_transaction_receipts_receipt_number; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_receipt_number ON platform.transaction_receipts USING btree (receipt_number);


--
-- TOC entry 4827 (class 1259 OID 29694)
-- Name: idx_transaction_receipts_recipient_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_recipient_details ON platform.transaction_receipts USING gin (recipient_details);


--
-- TOC entry 4828 (class 1259 OID 29695)
-- Name: idx_transaction_receipts_reference; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_reference ON platform.transaction_receipts USING btree (reference);


--
-- TOC entry 4829 (class 1259 OID 29696)
-- Name: idx_transaction_receipts_sender_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_sender_details ON platform.transaction_receipts USING gin (sender_details);


--
-- TOC entry 4830 (class 1259 OID 29697)
-- Name: idx_transaction_receipts_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_status ON platform.transaction_receipts USING btree (status);


--
-- TOC entry 4831 (class 1259 OID 29698)
-- Name: idx_transaction_receipts_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_tenant_date ON platform.transaction_receipts USING btree (tenant_id, created_at DESC);


--
-- TOC entry 4832 (class 1259 OID 29699)
-- Name: idx_transaction_receipts_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_tenant_id ON platform.transaction_receipts USING btree (tenant_id);


--
-- TOC entry 4833 (class 1259 OID 29700)
-- Name: idx_transaction_receipts_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_transaction_id ON platform.transaction_receipts USING btree (transaction_id);


--
-- TOC entry 4834 (class 1259 OID 29701)
-- Name: idx_transaction_receipts_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_type ON platform.transaction_receipts USING btree (transaction_type);


--
-- TOC entry 4839 (class 1259 OID 29702)
-- Name: idx_transaction_records_account_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_account_date ON platform.transaction_records USING btree (account_id, created_at DESC);


--
-- TOC entry 4840 (class 1259 OID 29703)
-- Name: idx_transaction_records_account_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_account_id ON platform.transaction_records USING btree (account_id);


--
-- TOC entry 4841 (class 1259 OID 29704)
-- Name: idx_transaction_records_amount; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_amount ON platform.transaction_records USING btree (amount);


--
-- TOC entry 4842 (class 1259 OID 29705)
-- Name: idx_transaction_records_category; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_category ON platform.transaction_records USING btree (transaction_category);


--
-- TOC entry 4843 (class 1259 OID 29706)
-- Name: idx_transaction_records_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_created_at ON platform.transaction_records USING btree (created_at);


--
-- TOC entry 4844 (class 1259 OID 29707)
-- Name: idx_transaction_records_metadata; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_metadata ON platform.transaction_records USING gin (metadata);


--
-- TOC entry 4845 (class 1259 OID 29708)
-- Name: idx_transaction_records_recipient_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_recipient_details ON platform.transaction_records USING gin (recipient_details);


--
-- TOC entry 4846 (class 1259 OID 29709)
-- Name: idx_transaction_records_reference; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_reference ON platform.transaction_records USING btree (reference);


--
-- TOC entry 4847 (class 1259 OID 29710)
-- Name: idx_transaction_records_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_status ON platform.transaction_records USING btree (status);


--
-- TOC entry 4848 (class 1259 OID 29711)
-- Name: idx_transaction_records_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_tenant_id ON platform.transaction_records USING btree (tenant_id);


--
-- TOC entry 4849 (class 1259 OID 29712)
-- Name: idx_transaction_records_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_type ON platform.transaction_records USING btree (transaction_type);


--
-- TOC entry 4850 (class 1259 OID 29713)
-- Name: idx_transaction_records_type_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_type_status ON platform.transaction_records USING btree (transaction_type, status);


--
-- TOC entry 4851 (class 1259 OID 29714)
-- Name: idx_transaction_records_user_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_user_date ON platform.transaction_records USING btree (user_id, created_at DESC);


--
-- TOC entry 4852 (class 1259 OID 29715)
-- Name: idx_transaction_records_user_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_user_id ON platform.transaction_records USING btree (user_id);


--
-- TOC entry 4855 (class 1259 OID 29716)
-- Name: idx_user_devices_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_active ON platform.user_devices USING btree (is_active);


--
-- TOC entry 4856 (class 1259 OID 29717)
-- Name: idx_user_devices_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_tenant_user ON platform.user_devices USING btree (tenant_id, user_id);


--
-- TOC entry 4857 (class 1259 OID 29718)
-- Name: idx_user_devices_token; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_token ON platform.user_devices USING btree (device_token);


--
-- TOC entry 4862 (class 1259 OID 29719)
-- Name: idx_webhook_endpoints_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_webhook_endpoints_active ON platform.webhook_endpoints USING btree (is_active);


--
-- TOC entry 4863 (class 1259 OID 29720)
-- Name: idx_webhook_endpoints_tenant; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_webhook_endpoints_tenant ON platform.webhook_endpoints USING btree (tenant_id);


--
-- TOC entry 4868 (class 1259 OID 29721)
-- Name: idx_account_access_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_created_at ON tenant.account_access_logs USING btree (created_at);


--
-- TOC entry 4869 (class 1259 OID 29722)
-- Name: idx_account_access_logs_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_tenant_user ON tenant.account_access_logs USING btree (tenant_id, user_id);


--
-- TOC entry 4870 (class 1259 OID 29723)
-- Name: idx_account_access_logs_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_wallet ON tenant.account_access_logs USING btree (wallet_id);


--
-- TOC entry 5080 (class 1259 OID 29724)
-- Name: idx_activity_logs_activity_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_activity_type ON tenant.user_activity_logs USING btree (activity_type);


--
-- TOC entry 5081 (class 1259 OID 29725)
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_created_at ON tenant.user_activity_logs USING btree (created_at);


--
-- TOC entry 5082 (class 1259 OID 29726)
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_user_id ON tenant.user_activity_logs USING btree (user_id);


--
-- TOC entry 4904 (class 1259 OID 29727)
-- Name: idx_analytics_cache_expires; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_analytics_cache_expires ON tenant.analytics_cache USING btree (expires_at);


--
-- TOC entry 4905 (class 1259 OID 29728)
-- Name: idx_analytics_cache_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_analytics_cache_tenant_user ON tenant.analytics_cache USING btree (tenant_id, user_id);


--
-- TOC entry 4912 (class 1259 OID 29729)
-- Name: idx_bill_payments_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_created_at ON tenant.bill_payments USING btree (created_at);


--
-- TOC entry 4913 (class 1259 OID 29730)
-- Name: idx_bill_payments_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_reference ON tenant.bill_payments USING btree (reference);


--
-- TOC entry 4914 (class 1259 OID 29731)
-- Name: idx_bill_payments_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_status ON tenant.bill_payments USING btree (status);


--
-- TOC entry 4915 (class 1259 OID 29732)
-- Name: idx_bill_payments_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_tenant_user ON tenant.bill_payments USING btree (tenant_id, user_id);


--
-- TOC entry 4920 (class 1259 OID 29733)
-- Name: idx_documents_ai_processed; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_ai_processed ON tenant.documents USING btree (ai_processed, ai_verification_status);


--
-- TOC entry 4921 (class 1259 OID 29734)
-- Name: idx_documents_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_type ON tenant.documents USING btree (document_type);


--
-- TOC entry 4922 (class 1259 OID 29735)
-- Name: idx_documents_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_user ON tenant.documents USING btree (user_id);


--
-- TOC entry 4923 (class 1259 OID 29736)
-- Name: idx_documents_verification; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_verification ON tenant.documents USING btree (verification_status);


--
-- TOC entry 4926 (class 1259 OID 29737)
-- Name: idx_fraud_alerts_created; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_created ON tenant.fraud_alerts USING btree (created_at);


--
-- TOC entry 4927 (class 1259 OID 29738)
-- Name: idx_fraud_alerts_severity; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_severity ON tenant.fraud_alerts USING btree (severity);


--
-- TOC entry 4928 (class 1259 OID 29739)
-- Name: idx_fraud_alerts_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_status ON tenant.fraud_alerts USING btree (status);


--
-- TOC entry 4929 (class 1259 OID 29740)
-- Name: idx_fraud_alerts_transaction; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_transaction ON tenant.fraud_alerts USING btree (transaction_id);


--
-- TOC entry 4930 (class 1259 OID 29741)
-- Name: idx_fraud_alerts_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_user ON tenant.fraud_alerts USING btree (user_id);


--
-- TOC entry 4931 (class 1259 OID 29742)
-- Name: idx_internal_transfers_from_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_from_wallet ON tenant.internal_transfers USING btree (from_wallet_id);


--
-- TOC entry 4932 (class 1259 OID 29743)
-- Name: idx_internal_transfers_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_reference ON tenant.internal_transfers USING btree (reference);


--
-- TOC entry 4933 (class 1259 OID 29744)
-- Name: idx_internal_transfers_to_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_to_wallet ON tenant.internal_transfers USING btree (to_wallet_id);


--
-- TOC entry 4934 (class 1259 OID 29745)
-- Name: idx_internal_transfers_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_user_id ON tenant.internal_transfers USING btree (user_id);


--
-- TOC entry 4939 (class 1259 OID 29746)
-- Name: idx_kyc_documents_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_status ON tenant.kyc_documents USING btree (status);


--
-- TOC entry 4940 (class 1259 OID 29747)
-- Name: idx_kyc_documents_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_type ON tenant.kyc_documents USING btree (document_type);


--
-- TOC entry 4941 (class 1259 OID 29748)
-- Name: idx_kyc_documents_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_user_id ON tenant.kyc_documents USING btree (user_id);


--
-- TOC entry 4944 (class 1259 OID 29749)
-- Name: idx_login_attempts_attempted_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_attempted_at ON tenant.login_attempts USING btree (attempted_at);


--
-- TOC entry 4945 (class 1259 OID 29750)
-- Name: idx_login_attempts_tenant_identifier; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_tenant_identifier ON tenant.login_attempts USING btree (tenant_id, identifier);


--
-- TOC entry 4946 (class 1259 OID 29751)
-- Name: idx_login_attempts_tenant_ip; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_tenant_ip ON tenant.login_attempts USING btree (tenant_id, ip_address);


--
-- TOC entry 4949 (class 1259 OID 29752)
-- Name: idx_notification_preferences_channel; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_channel ON tenant.notification_preferences USING btree (channel);


--
-- TOC entry 4950 (class 1259 OID 29753)
-- Name: idx_notification_preferences_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_tenant_user ON tenant.notification_preferences USING btree (tenant_id, user_id);


--
-- TOC entry 4955 (class 1259 OID 29754)
-- Name: idx_notifications_created; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_created ON tenant.notifications USING btree (created_at);


--
-- TOC entry 4956 (class 1259 OID 29755)
-- Name: idx_notifications_priority; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_priority ON tenant.notifications USING btree (priority);


--
-- TOC entry 4957 (class 1259 OID 29756)
-- Name: idx_notifications_scheduled; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_scheduled ON tenant.notifications USING btree (scheduled_for) WHERE (scheduled_for IS NOT NULL);


--
-- TOC entry 4958 (class 1259 OID 29757)
-- Name: idx_notifications_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_type ON tenant.notifications USING btree (type);


--
-- TOC entry 4959 (class 1259 OID 29758)
-- Name: idx_notifications_user_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_user_status ON tenant.notifications USING btree (user_id, status);


--
-- TOC entry 4995 (class 1259 OID 29759)
-- Name: idx_recipients_account_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_account_number ON tenant.recipients USING btree (account_number);


--
-- TOC entry 4996 (class 1259 OID 29760)
-- Name: idx_recipients_bank_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_bank_code ON tenant.recipients USING btree (bank_code);


--
-- TOC entry 4997 (class 1259 OID 29761)
-- Name: idx_recipients_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_user_id ON tenant.recipients USING btree (user_id);


--
-- TOC entry 5002 (class 1259 OID 29762)
-- Name: idx_recurring_transfers_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_status_date ON tenant.recurring_transfers USING btree (status, next_execution_date);


--
-- TOC entry 5003 (class 1259 OID 29763)
-- Name: idx_recurring_transfers_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_user ON tenant.recurring_transfers USING btree (user_id);


--
-- TOC entry 5004 (class 1259 OID 29764)
-- Name: idx_recurring_transfers_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_wallet ON tenant.recurring_transfers USING btree (from_wallet_id);


--
-- TOC entry 5007 (class 1259 OID 29765)
-- Name: idx_referrals_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_code ON tenant.referrals USING btree (referral_code);


--
-- TOC entry 5008 (class 1259 OID 29766)
-- Name: idx_referrals_referee_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_referee_id ON tenant.referrals USING btree (referee_id);


--
-- TOC entry 5009 (class 1259 OID 29767)
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_referrer_id ON tenant.referrals USING btree (referrer_id);


--
-- TOC entry 5014 (class 1259 OID 29768)
-- Name: idx_scheduled_transfers_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_status_date ON tenant.scheduled_transfers USING btree (status, scheduled_date);


--
-- TOC entry 5015 (class 1259 OID 29769)
-- Name: idx_scheduled_transfers_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_user ON tenant.scheduled_transfers USING btree (user_id);


--
-- TOC entry 5016 (class 1259 OID 29770)
-- Name: idx_scheduled_transfers_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_wallet ON tenant.scheduled_transfers USING btree (from_wallet_id);


--
-- TOC entry 4895 (class 1259 OID 29771)
-- Name: idx_suggestions_action_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_action_type ON tenant.ai_smart_suggestions USING btree (tenant_id, action_type);


--
-- TOC entry 4896 (class 1259 OID 29772)
-- Name: idx_suggestions_category_language; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_category_language ON tenant.ai_smart_suggestions USING btree (tenant_id, category, language);


--
-- TOC entry 4897 (class 1259 OID 29773)
-- Name: idx_suggestions_conditions; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_conditions ON tenant.ai_smart_suggestions USING gin (conditions);


--
-- TOC entry 4879 (class 1259 OID 29774)
-- Name: idx_tenant_conversation_logs; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_conversation_logs ON tenant.ai_conversation_logs USING btree (tenant_id, user_id, created_at);


--
-- TOC entry 4884 (class 1259 OID 29775)
-- Name: idx_tenant_intent_categories; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_intent_categories ON tenant.ai_intent_categories USING btree (tenant_id, name);


--
-- TOC entry 4887 (class 1259 OID 29776)
-- Name: idx_tenant_intent_patterns; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_intent_patterns ON tenant.ai_intent_patterns USING btree (tenant_id, intent_category_id);


--
-- TOC entry 4962 (class 1259 OID 29777)
-- Name: idx_tenant_permission_audit_resource; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_resource ON tenant.rbac_permission_audit USING btree (tenant_id, resource, action);


--
-- TOC entry 4963 (class 1259 OID 29778)
-- Name: idx_tenant_permission_audit_time; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_time ON tenant.rbac_permission_audit USING btree (created_at);


--
-- TOC entry 4964 (class 1259 OID 29779)
-- Name: idx_tenant_permission_audit_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_user ON tenant.rbac_permission_audit USING btree (tenant_id, user_id);


--
-- TOC entry 4967 (class 1259 OID 29780)
-- Name: idx_tenant_permissions_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permissions_tenant ON tenant.rbac_permissions USING btree (tenant_id);


--
-- TOC entry 4892 (class 1259 OID 29781)
-- Name: idx_tenant_response_templates; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_response_templates ON tenant.ai_response_templates USING btree (tenant_id, intent_category_id);


--
-- TOC entry 4976 (class 1259 OID 29782)
-- Name: idx_tenant_role_permissions_tenant_role; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_role_permissions_tenant_role ON tenant.rbac_role_permissions USING btree (tenant_id, role_id);


--
-- TOC entry 4981 (class 1259 OID 29783)
-- Name: idx_tenant_roles_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_roles_code ON tenant.rbac_roles USING btree (tenant_id, code);


--
-- TOC entry 4982 (class 1259 OID 29784)
-- Name: idx_tenant_roles_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_roles_tenant ON tenant.rbac_roles USING btree (tenant_id);


--
-- TOC entry 4898 (class 1259 OID 29785)
-- Name: idx_tenant_smart_suggestions; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_smart_suggestions ON tenant.ai_smart_suggestions USING btree (tenant_id, category);


--
-- TOC entry 4901 (class 1259 OID 29786)
-- Name: idx_tenant_translations; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_translations ON tenant.ai_translation_patterns USING btree (tenant_id, source_language, target_language);


--
-- TOC entry 4989 (class 1259 OID 29787)
-- Name: idx_tenant_user_roles_active; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_user_roles_active ON tenant.rbac_user_roles USING btree (tenant_id, user_id, is_active);


--
-- TOC entry 4990 (class 1259 OID 29788)
-- Name: idx_tenant_user_roles_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_user_roles_tenant_user ON tenant.rbac_user_roles USING btree (tenant_id, user_id);


--
-- TOC entry 5023 (class 1259 OID 29789)
-- Name: idx_transaction_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_created_at ON tenant.transaction_logs USING btree (created_at);


--
-- TOC entry 5024 (class 1259 OID 29790)
-- Name: idx_transaction_logs_event_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_event_type ON tenant.transaction_logs USING btree (event_type);


--
-- TOC entry 5025 (class 1259 OID 29791)
-- Name: idx_transaction_logs_transfer_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_transfer_id ON tenant.transaction_logs USING btree (transfer_id);


--
-- TOC entry 5028 (class 1259 OID 29792)
-- Name: idx_transactions_ai_initiated; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_ai_initiated ON tenant.transactions USING btree (ai_initiated) WHERE (ai_initiated = true);


--
-- TOC entry 5029 (class 1259 OID 29793)
-- Name: idx_transactions_amount_range; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_amount_range ON tenant.transactions USING btree (amount);


--
-- TOC entry 5030 (class 1259 OID 29794)
-- Name: idx_transactions_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_created_at ON tenant.transactions USING btree (created_at);


--
-- TOC entry 5031 (class 1259 OID 29795)
-- Name: idx_transactions_external_ref; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_external_ref ON tenant.transactions USING btree (external_reference) WHERE (external_reference IS NOT NULL);


--
-- TOC entry 5032 (class 1259 OID 29796)
-- Name: idx_transactions_fraud_score; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_fraud_score ON tenant.transactions USING btree (fraud_score) WHERE (fraud_score IS NOT NULL);


--
-- TOC entry 5033 (class 1259 OID 29797)
-- Name: idx_transactions_provider; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_provider ON tenant.transactions USING btree (payment_provider);


--
-- TOC entry 5034 (class 1259 OID 29798)
-- Name: idx_transactions_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_reference ON tenant.transactions USING btree (reference);


--
-- TOC entry 5035 (class 1259 OID 29799)
-- Name: idx_transactions_risk_level; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_risk_level ON tenant.transactions USING btree (risk_level) WHERE ((risk_level)::text = ANY (ARRAY[('high'::character varying)::text, ('critical'::character varying)::text]));


--
-- TOC entry 5036 (class 1259 OID 29800)
-- Name: idx_transactions_settlement; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_settlement ON tenant.transactions USING btree (settlement_date, reconciliation_status);


--
-- TOC entry 5037 (class 1259 OID 29801)
-- Name: idx_transactions_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_status ON tenant.transactions USING btree (status);


--
-- TOC entry 5038 (class 1259 OID 29802)
-- Name: idx_transactions_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_tenant_user ON tenant.transactions USING btree (tenant_id, user_id);


--
-- TOC entry 5039 (class 1259 OID 29803)
-- Name: idx_transactions_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_type ON tenant.transactions USING btree (type);


--
-- TOC entry 5040 (class 1259 OID 29804)
-- Name: idx_transactions_type_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_type_status_date ON tenant.transactions USING btree (type, status, created_at);


--
-- TOC entry 5041 (class 1259 OID 29805)
-- Name: idx_transactions_user_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_user_status_date ON tenant.transactions USING btree (user_id, status, created_at);


--
-- TOC entry 5046 (class 1259 OID 29806)
-- Name: idx_transfers_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_created_at ON tenant.transfers USING btree (created_at);


--
-- TOC entry 5047 (class 1259 OID 29807)
-- Name: idx_transfers_date_range; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_date_range ON tenant.transfers USING btree (sender_id, created_at);


--
-- TOC entry 5048 (class 1259 OID 29808)
-- Name: idx_transfers_nibss_transaction_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_nibss_transaction_id ON tenant.transfers USING btree (nibss_transaction_id);


--
-- TOC entry 5049 (class 1259 OID 29809)
-- Name: idx_transfers_recipient_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_recipient_id ON tenant.transfers USING btree (recipient_id);


--
-- TOC entry 5050 (class 1259 OID 29810)
-- Name: idx_transfers_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_reference ON tenant.transfers USING btree (reference);


--
-- TOC entry 5051 (class 1259 OID 29811)
-- Name: idx_transfers_sender_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_sender_id ON tenant.transfers USING btree (sender_id);


--
-- TOC entry 5052 (class 1259 OID 29812)
-- Name: idx_transfers_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_status ON tenant.transfers USING btree (status);


--
-- TOC entry 5085 (class 1259 OID 29813)
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_expires ON tenant.user_sessions USING btree (expires_at);


--
-- TOC entry 5086 (class 1259 OID 29814)
-- Name: idx_user_sessions_suspicious; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_suspicious ON tenant.user_sessions USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- TOC entry 5087 (class 1259 OID 29815)
-- Name: idx_user_sessions_token; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_token ON tenant.user_sessions USING btree (session_token);


--
-- TOC entry 5088 (class 1259 OID 29816)
-- Name: idx_user_sessions_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_user ON tenant.user_sessions USING btree (user_id);


--
-- TOC entry 5057 (class 1259 OID 29817)
-- Name: idx_users_account_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_account_number ON tenant.users USING btree (account_number) WHERE (account_number IS NOT NULL);


--
-- TOC entry 5058 (class 1259 OID 29818)
-- Name: idx_users_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_created_at ON tenant.users USING btree (created_at);


--
-- TOC entry 5059 (class 1259 OID 29819)
-- Name: idx_users_email_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_users_email_tenant ON tenant.users USING btree (email, tenant_id);


--
-- TOC entry 5060 (class 1259 OID 29820)
-- Name: idx_users_kyc_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_kyc_status ON tenant.users USING btree (kyc_status);


--
-- TOC entry 5061 (class 1259 OID 29821)
-- Name: idx_users_phone_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_users_phone_tenant ON tenant.users USING btree (phone_number, tenant_id);


--
-- TOC entry 5062 (class 1259 OID 29822)
-- Name: idx_users_referral_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_referral_code ON tenant.users USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- TOC entry 5063 (class 1259 OID 29823)
-- Name: idx_users_risk_profile; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_risk_profile ON tenant.users USING btree (risk_profile);


--
-- TOC entry 5064 (class 1259 OID 29824)
-- Name: idx_users_role; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_role ON tenant.users USING btree (role);


--
-- TOC entry 5065 (class 1259 OID 29825)
-- Name: idx_users_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_status ON tenant.users USING btree (status);


--
-- TOC entry 5110 (class 1259 OID 29826)
-- Name: idx_wallet_fundings_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_reference ON tenant.wallet_fundings USING btree (reference);


--
-- TOC entry 5111 (class 1259 OID 29827)
-- Name: idx_wallet_fundings_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_status ON tenant.wallet_fundings USING btree (status);


--
-- TOC entry 5112 (class 1259 OID 29828)
-- Name: idx_wallet_fundings_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_user_id ON tenant.wallet_fundings USING btree (user_id);


--
-- TOC entry 5113 (class 1259 OID 29829)
-- Name: idx_wallet_fundings_wallet_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_wallet_id ON tenant.wallet_fundings USING btree (wallet_id);


--
-- TOC entry 5118 (class 1259 OID 29830)
-- Name: idx_wallet_transactions_transaction; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_transaction ON tenant.wallet_transactions USING btree (transaction_id);


--
-- TOC entry 5119 (class 1259 OID 29831)
-- Name: idx_wallet_transactions_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_type ON tenant.wallet_transactions USING btree (transaction_type);


--
-- TOC entry 5120 (class 1259 OID 29832)
-- Name: idx_wallet_transactions_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_wallet ON tenant.wallet_transactions USING btree (wallet_id, created_at);


--
-- TOC entry 5095 (class 1259 OID 29833)
-- Name: idx_wallets_balance; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_balance ON tenant.wallets USING btree (balance);


--
-- TOC entry 5096 (class 1259 OID 29834)
-- Name: idx_wallets_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_number ON tenant.wallets USING btree (wallet_number);


--
-- TOC entry 5097 (class 1259 OID 29835)
-- Name: idx_wallets_primary; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_primary ON tenant.wallets USING btree (user_id, is_primary) WHERE (is_primary = true);


--
-- TOC entry 5098 (class 1259 OID 29836)
-- Name: idx_wallets_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_status ON tenant.wallets USING btree (is_active, is_frozen);


--
-- TOC entry 5099 (class 1259 OID 29837)
-- Name: idx_wallets_tenant_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_tenant_id ON tenant.wallets USING btree (tenant_id);


--
-- TOC entry 5100 (class 1259 OID 29838)
-- Name: idx_wallets_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_type ON tenant.wallets USING btree (wallet_type);


--
-- TOC entry 5101 (class 1259 OID 29839)
-- Name: idx_wallets_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_user_id ON tenant.wallets USING btree (user_id);


--
-- TOC entry 5102 (class 1259 OID 29840)
-- Name: idx_wallets_user_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_user_tenant ON tenant.wallets USING btree (user_id, tenant_id);


--
-- TOC entry 5103 (class 1259 OID 29841)
-- Name: unique_primary_wallet_per_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX unique_primary_wallet_per_user ON tenant.wallets USING btree (user_id) WHERE (is_primary = true);


--
-- TOC entry 5204 (class 2620 OID 29842)
-- Name: tenants log_tenant_changes_trigger; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER log_tenant_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.log_tenant_changes();


--
-- TOC entry 5202 (class 2620 OID 29843)
-- Name: tenant_assets trigger_tenant_assets_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER trigger_tenant_assets_updated_at BEFORE UPDATE ON platform.tenant_assets FOR EACH ROW EXECUTE FUNCTION platform.update_tenant_assets_updated_at();


--
-- TOC entry 5193 (class 2620 OID 29844)
-- Name: bill_provider_templates update_bill_provider_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_bill_provider_templates_updated_at BEFORE UPDATE ON platform.bill_provider_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5194 (class 2620 OID 29845)
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON platform.notification_preferences FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5195 (class 2620 OID 29846)
-- Name: notification_statistics update_notification_statistics_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_statistics_updated_at BEFORE UPDATE ON platform.notification_statistics FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5196 (class 2620 OID 29847)
-- Name: notification_templates update_notification_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON platform.notification_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5197 (class 2620 OID 29848)
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON platform.notifications FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5198 (class 2620 OID 29849)
-- Name: platform_config update_platform_config_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON platform.platform_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5199 (class 2620 OID 29850)
-- Name: rbac_permissions update_platform_rbac_permissions_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_rbac_permissions_updated_at BEFORE UPDATE ON platform.rbac_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5200 (class 2620 OID 29851)
-- Name: rbac_roles update_platform_rbac_roles_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_rbac_roles_updated_at BEFORE UPDATE ON platform.rbac_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5201 (class 2620 OID 29852)
-- Name: receipt_templates update_receipt_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_receipt_templates_updated_at BEFORE UPDATE ON platform.receipt_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5203 (class 2620 OID 29853)
-- Name: tenant_billing update_tenant_billing_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_billing_updated_at BEFORE UPDATE ON platform.tenant_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5205 (class 2620 OID 29854)
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5207 (class 2620 OID 29855)
-- Name: transaction_attachments update_transaction_attachments_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_attachments_updated_at BEFORE UPDATE ON platform.transaction_attachments FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5208 (class 2620 OID 29856)
-- Name: transaction_receipts update_transaction_receipts_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_receipts_updated_at BEFORE UPDATE ON platform.transaction_receipts FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5209 (class 2620 OID 29857)
-- Name: transaction_records update_transaction_records_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_records_updated_at BEFORE UPDATE ON platform.transaction_records FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5210 (class 2620 OID 29858)
-- Name: user_devices update_user_devices_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON platform.user_devices FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5211 (class 2620 OID 29859)
-- Name: webhook_endpoints update_webhook_endpoints_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON platform.webhook_endpoints FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5206 (class 2620 OID 29860)
-- Name: tenants validate_tenant_bank_code; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER validate_tenant_bank_code BEFORE INSERT OR UPDATE OF bank_code ON platform.tenants FOR EACH ROW EXECUTE FUNCTION platform.validate_bank_code();


--
-- TOC entry 5230 (class 2620 OID 29861)
-- Name: users auto_assign_account_number; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER auto_assign_account_number BEFORE INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.assign_account_number();


--
-- TOC entry 5231 (class 2620 OID 29862)
-- Name: users auto_create_primary_wallet; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER auto_create_primary_wallet AFTER INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.create_primary_wallet();


--
-- TOC entry 5224 (class 2620 OID 29863)
-- Name: transactions create_wallet_transaction_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER create_wallet_transaction_trigger AFTER UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.create_wallet_transaction();


--
-- TOC entry 5225 (class 2620 OID 29864)
-- Name: transactions generate_transaction_reference_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER generate_transaction_reference_trigger BEFORE INSERT ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_reference();


--
-- TOC entry 5233 (class 2620 OID 29865)
-- Name: wallets generate_wallet_number_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER generate_wallet_number_trigger BEFORE INSERT ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.generate_wallet_number();


--
-- TOC entry 5212 (class 2620 OID 29866)
-- Name: bill_payments sync_bill_payments_to_transactions; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_bill_payments_to_transactions AFTER INSERT OR UPDATE ON tenant.bill_payments FOR EACH ROW EXECUTE FUNCTION platform.sync_bill_payment_to_transactions();


--
-- TOC entry 5227 (class 2620 OID 29867)
-- Name: transfers sync_transfer_to_transactions_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_transfer_to_transactions_trigger AFTER INSERT ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.sync_transfer_to_transactions();


--
-- TOC entry 5228 (class 2620 OID 29868)
-- Name: transfers sync_transfers_to_transactions; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_transfers_to_transactions AFTER INSERT OR UPDATE ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.sync_transfer_to_transactions();


--
-- TOC entry 5213 (class 2620 OID 29869)
-- Name: bill_payments update_bill_payments_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_bill_payments_updated_at BEFORE UPDATE ON tenant.bill_payments FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5214 (class 2620 OID 29870)
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON tenant.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5215 (class 2620 OID 29871)
-- Name: fraud_alerts update_fraud_alerts_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_fraud_alerts_updated_at BEFORE UPDATE ON tenant.fraud_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5216 (class 2620 OID 29872)
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON tenant.notification_preferences FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5221 (class 2620 OID 29873)
-- Name: recipients update_recipients_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON tenant.recipients FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5222 (class 2620 OID 29874)
-- Name: recurring_transfers update_recurring_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_recurring_transfers_updated_at BEFORE UPDATE ON tenant.recurring_transfers FOR EACH ROW EXECUTE FUNCTION platform.update_scheduled_transfers_updated_at();


--
-- TOC entry 5223 (class 2620 OID 29875)
-- Name: scheduled_transfers update_scheduled_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_scheduled_transfers_updated_at BEFORE UPDATE ON tenant.scheduled_transfers FOR EACH ROW EXECUTE FUNCTION platform.update_scheduled_transfers_updated_at();


--
-- TOC entry 5217 (class 2620 OID 29876)
-- Name: rbac_permissions update_tenant_rbac_permissions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_permissions_updated_at BEFORE UPDATE ON tenant.rbac_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5218 (class 2620 OID 29877)
-- Name: rbac_role_permissions update_tenant_rbac_role_permissions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_role_permissions_updated_at BEFORE UPDATE ON tenant.rbac_role_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5219 (class 2620 OID 29878)
-- Name: rbac_roles update_tenant_rbac_roles_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_roles_updated_at BEFORE UPDATE ON tenant.rbac_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5220 (class 2620 OID 29879)
-- Name: rbac_user_roles update_tenant_rbac_user_roles_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_user_roles_updated_at BEFORE UPDATE ON tenant.rbac_user_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5226 (class 2620 OID 29880)
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5229 (class 2620 OID 29881)
-- Name: transfers update_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5232 (class 2620 OID 29882)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON tenant.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5234 (class 2620 OID 29883)
-- Name: wallets update_wallets_balance_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_wallets_balance_trigger BEFORE INSERT OR UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();


--
-- TOC entry 5235 (class 2620 OID 29884)
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- TOC entry 5123 (class 2606 OID 29885)
-- Name: ai_conversation_analytics ai_conversation_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5124 (class 2606 OID 29890)
-- Name: ai_fraud_analytics ai_fraud_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5125 (class 2606 OID 29895)
-- Name: cbn_incidents cbn_incidents_compliance_report_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_compliance_report_id_fkey FOREIGN KEY (compliance_report_id) REFERENCES audit.cbn_compliance_reports(report_id);


--
-- TOC entry 5126 (class 2606 OID 29900)
-- Name: pci_dss_findings pci_dss_findings_requirement_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES audit.pci_dss_requirements(requirement_id);


--
-- TOC entry 5127 (class 2606 OID 29905)
-- Name: pci_dss_requirements pci_dss_requirements_compliance_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_compliance_id_fkey FOREIGN KEY (compliance_id) REFERENCES audit.pci_dss_compliance(compliance_id);


--
-- TOC entry 5128 (class 2606 OID 29910)
-- Name: tenant_audit_logs tenant_audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 29915)
-- Name: exchange_rates exchange_rates_from_currency_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_fkey FOREIGN KEY (from_currency) REFERENCES platform.currency_config(code);


--
-- TOC entry 5130 (class 2606 OID 29920)
-- Name: exchange_rates exchange_rates_to_currency_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_to_currency_fkey FOREIGN KEY (to_currency) REFERENCES platform.currency_config(code);


--
-- TOC entry 5131 (class 2606 OID 29925)
-- Name: in_app_notifications in_app_notifications_notification_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.in_app_notifications
    ADD CONSTRAINT in_app_notifications_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES platform.notifications(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 29930)
-- Name: notification_logs notification_logs_notification_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_logs
    ADD CONSTRAINT notification_logs_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES platform.notifications(id) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 29935)
-- Name: rbac_role_permissions rbac_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES platform.rbac_permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 29940)
-- Name: rbac_role_permissions rbac_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES platform.rbac_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 29945)
-- Name: tenant_assets tenant_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 29950)
-- Name: tenant_billing tenant_billing_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 29955)
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 29960)
-- Name: ai_configuration ai_configuration_preferred_model_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration
    ADD CONSTRAINT ai_configuration_preferred_model_id_fkey FOREIGN KEY (preferred_model_id) REFERENCES platform.ai_models(id);


--
-- TOC entry 5142 (class 2606 OID 29965)
-- Name: ai_context_mappings ai_context_mappings_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings
    ADD CONSTRAINT ai_context_mappings_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 29970)
-- Name: ai_intent_patterns ai_intent_patterns_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns
    ADD CONSTRAINT ai_intent_patterns_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 29975)
-- Name: ai_learning_feedback ai_learning_feedback_conversation_log_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback
    ADD CONSTRAINT ai_learning_feedback_conversation_log_id_fkey FOREIGN KEY (conversation_log_id) REFERENCES tenant.ai_conversation_logs(id);


--
-- TOC entry 5145 (class 2606 OID 29980)
-- Name: ai_response_templates ai_response_templates_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates
    ADD CONSTRAINT ai_response_templates_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 29985)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 29990)
-- Name: documents documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES tenant.users(id);


--
-- TOC entry 5138 (class 2606 OID 29995)
-- Name: account_access_logs fk_account_access_logs_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 30000)
-- Name: account_access_logs fk_account_access_logs_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 30005)
-- Name: account_access_logs fk_account_access_logs_wallet; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_wallet FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE SET NULL;


--
-- TOC entry 5146 (class 2606 OID 30010)
-- Name: analytics_cache fk_analytics_cache_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT fk_analytics_cache_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 30015)
-- Name: analytics_cache fk_analytics_cache_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT fk_analytics_cache_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 30020)
-- Name: bill_payments fk_bill_payments_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT fk_bill_payments_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 30025)
-- Name: bill_payments fk_bill_payments_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT fk_bill_payments_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 30030)
-- Name: login_attempts fk_login_attempts_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.login_attempts
    ADD CONSTRAINT fk_login_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 30035)
-- Name: notification_preferences fk_notification_preferences_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT fk_notification_preferences_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 30040)
-- Name: notification_preferences fk_notification_preferences_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 30045)
-- Name: fraud_alerts fraud_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES tenant.users(id);


--
-- TOC entry 5153 (class 2606 OID 30050)
-- Name: fraud_alerts fraud_alerts_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- TOC entry 5154 (class 2606 OID 30055)
-- Name: fraud_alerts fraud_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5155 (class 2606 OID 30060)
-- Name: internal_transfers internal_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- TOC entry 5156 (class 2606 OID 30065)
-- Name: internal_transfers internal_transfers_to_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_to_wallet_id_fkey FOREIGN KEY (to_wallet_id) REFERENCES tenant.wallets(id);


--
-- TOC entry 5157 (class 2606 OID 30070)
-- Name: internal_transfers internal_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5158 (class 2606 OID 30075)
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 30080)
-- Name: notifications notifications_related_alert_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_alert_id_fkey FOREIGN KEY (related_alert_id) REFERENCES tenant.fraud_alerts(id);


--
-- TOC entry 5163 (class 2606 OID 30085)
-- Name: notifications notifications_related_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_transaction_id_fkey FOREIGN KEY (related_transaction_id) REFERENCES tenant.transactions(id);


--
-- TOC entry 5164 (class 2606 OID 30090)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 30095)
-- Name: rbac_permissions rbac_permissions_platform_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_platform_permission_id_fkey FOREIGN KEY (platform_permission_id) REFERENCES platform.rbac_permissions(id);


--
-- TOC entry 5166 (class 2606 OID 30100)
-- Name: rbac_role_hierarchy rbac_role_hierarchy_child_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_child_role_id_fkey FOREIGN KEY (child_role_id) REFERENCES tenant.rbac_roles(id);


--
-- TOC entry 5167 (class 2606 OID 30105)
-- Name: rbac_role_hierarchy rbac_role_hierarchy_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES tenant.rbac_roles(id);


--
-- TOC entry 5168 (class 2606 OID 30110)
-- Name: rbac_role_permissions rbac_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES tenant.rbac_permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 30115)
-- Name: rbac_role_permissions rbac_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 30120)
-- Name: rbac_roles rbac_roles_platform_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_platform_role_id_fkey FOREIGN KEY (platform_role_id) REFERENCES platform.rbac_roles(id);


--
-- TOC entry 5171 (class 2606 OID 30125)
-- Name: rbac_temporary_permissions rbac_temporary_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_temporary_permissions
    ADD CONSTRAINT rbac_temporary_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES tenant.rbac_permissions(id);


--
-- TOC entry 5172 (class 2606 OID 30130)
-- Name: rbac_user_roles rbac_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5173 (class 2606 OID 30135)
-- Name: recipients recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 30140)
-- Name: recurring_transfers recurring_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- TOC entry 5175 (class 2606 OID 30145)
-- Name: recurring_transfers recurring_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5176 (class 2606 OID 30150)
-- Name: referrals referrals_referee_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES tenant.users(id);


--
-- TOC entry 5177 (class 2606 OID 30155)
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES tenant.users(id);


--
-- TOC entry 5178 (class 2606 OID 30160)
-- Name: scheduled_transfers scheduled_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- TOC entry 5179 (class 2606 OID 30165)
-- Name: scheduled_transfers scheduled_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5180 (class 2606 OID 30170)
-- Name: transaction_logs transaction_logs_transfer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES tenant.transfers(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 30175)
-- Name: transactions transactions_parent_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_parent_transaction_id_fkey FOREIGN KEY (parent_transaction_id) REFERENCES tenant.transactions(id);


--
-- TOC entry 5182 (class 2606 OID 30180)
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5183 (class 2606 OID 30185)
-- Name: transfers transfers_recipient_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES tenant.recipients(id);


--
-- TOC entry 5184 (class 2606 OID 30190)
-- Name: transfers transfers_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5185 (class 2606 OID 30195)
-- Name: transfers transfers_sender_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES tenant.users(id);


--
-- TOC entry 5186 (class 2606 OID 30200)
-- Name: user_activity_logs user_activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- TOC entry 5187 (class 2606 OID 30205)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5189 (class 2606 OID 30210)
-- Name: wallet_fundings wallet_fundings_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5190 (class 2606 OID 30215)
-- Name: wallet_fundings wallet_fundings_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id);


--
-- TOC entry 5191 (class 2606 OID 30220)
-- Name: wallet_transactions wallet_transactions_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- TOC entry 5192 (class 2606 OID 30225)
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 30230)
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- TOC entry 5386 (class 0 OID 28135)
-- Dependencies: 225
-- Name: ai_conversation_analytics; Type: ROW SECURITY; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE analytics.ai_conversation_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5387 (class 0 OID 28152)
-- Dependencies: 226
-- Name: ai_fraud_analytics; Type: ROW SECURITY; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE analytics.ai_fraud_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5388 (class 0 OID 28310)
-- Dependencies: 238
-- Name: tenant_audit_logs; Type: ROW SECURITY; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE audit.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5389 (class 0 OID 28540)
-- Dependencies: 261
-- Name: tenant_billing; Type: ROW SECURITY; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE platform.tenant_billing ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5402 (class 3256 OID 30235)
-- Name: tenant_billing tenant_billing_isolation; Type: POLICY; Schema: platform; Owner: bisiadedokun
--

CREATE POLICY tenant_billing_isolation ON platform.tenant_billing USING ((tenant_id = public.get_current_tenant_id()));


--
-- TOC entry 5403 (class 3256 OID 30236)
-- Name: tenant_usage_metrics tenant_usage_isolation; Type: POLICY; Schema: platform; Owner: bisiadedokun
--

CREATE POLICY tenant_usage_isolation ON platform.tenant_usage_metrics USING ((tenant_id = public.get_current_tenant_id()));


--
-- TOC entry 5390 (class 0 OID 28559)
-- Dependencies: 262
-- Name: tenant_usage_metrics; Type: ROW SECURITY; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE platform.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5391 (class 0 OID 28857)
-- Dependencies: 298
-- Name: documents; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.documents ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5392 (class 0 OID 28874)
-- Dependencies: 299
-- Name: fraud_alerts; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.fraud_alerts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5393 (class 0 OID 28934)
-- Dependencies: 304
-- Name: notifications; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.notifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5394 (class 0 OID 28956)
-- Dependencies: 305
-- Name: rbac_permission_audit; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_permission_audit ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5395 (class 0 OID 28963)
-- Dependencies: 306
-- Name: rbac_permissions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_permissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5396 (class 0 OID 28980)
-- Dependencies: 308
-- Name: rbac_role_permissions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_role_permissions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5397 (class 0 OID 28990)
-- Dependencies: 309
-- Name: rbac_roles; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_roles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5398 (class 0 OID 29013)
-- Dependencies: 311
-- Name: rbac_user_roles; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_user_roles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5399 (class 0 OID 29085)
-- Dependencies: 319
-- Name: transactions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.transactions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5400 (class 0 OID 29133)
-- Dependencies: 321
-- Name: users; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5401 (class 0 OID 29194)
-- Dependencies: 325
-- Name: wallets; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.wallets ENABLE ROW LEVEL SECURITY;

-- Completed on 2025-10-16 03:38:18 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict o9T2ktO3FFj6vLOO5v8Pm4pE25MKkN9SKD6qQ9prFbXQzxc1mCCRrF1qgEKgD7y

