--
-- PostgreSQL database dump
--

\restrict 5bxWXGM087JV67sfYl01pf0bzMJdVrdgdp0KOT8f4X5IZtZ3P0v1vp5H92vt6ec

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

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
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA analytics;


ALTER SCHEMA analytics OWNER TO bisiadedokun;

--
-- Name: SCHEMA analytics; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA analytics IS 'Analytics and reporting tables';


--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO bisiadedokun;

--
-- Name: SCHEMA audit; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA audit IS 'Audit logging and compliance tracking';


--
-- Name: platform; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA platform;


ALTER SCHEMA platform OWNER TO bisiadedokun;

--
-- Name: SCHEMA platform; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA platform IS 'Platform-level shared data - templates, configurations, and cross-tenant utilities';


--
-- Name: tenant; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA tenant;


ALTER SCHEMA tenant OWNER TO bisiadedokun;

--
-- Name: SCHEMA tenant; Type: COMMENT; Schema: -; Owner: bisiadedokun
--

COMMENT ON SCHEMA tenant IS 'Tenant-specific data - isolated per tenant';


--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA platform;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
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
-- Name: FUNCTION convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.convert_currency(p_amount numeric, p_from_currency character varying, p_to_currency character varying) IS 'Convert amount from one currency to another using current exchange rate';


--
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
-- Name: FUNCTION get_exchange_rate(p_from_currency character varying, p_to_currency character varying); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.get_exchange_rate(p_from_currency character varying, p_to_currency character varying) IS 'Get current exchange rate between two currencies';


--
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
-- Name: FUNCTION initialize_tenant_rbac(tenant_uuid uuid); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.initialize_tenant_rbac(tenant_uuid uuid) IS 'Initializes RBAC system for a new or existing tenant by copying platform templates';


--
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
-- Name: FUNCTION sync_transfer_to_transactions(); Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON FUNCTION platform.sync_transfer_to_transactions() IS 'Synchronizes transfer records to transactions table for unified transaction history';


--
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

--
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

--
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
-- Name: TABLE ai_conversation_analytics; Type: COMMENT; Schema: analytics; Owner: bisiadedokun
--

COMMENT ON TABLE analytics.ai_conversation_analytics IS 'Aggregated AI conversation metrics';


--
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
-- Name: TABLE ai_fraud_analytics; Type: COMMENT; Schema: analytics; Owner: bisiadedokun
--

COMMENT ON TABLE analytics.ai_fraud_analytics IS 'AI fraud detection performance metrics';


--
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
-- Name: TABLE tenant_audit_logs; Type: COMMENT; Schema: audit; Owner: bisiadedokun
--

COMMENT ON TABLE audit.tenant_audit_logs IS 'Comprehensive audit trail';


--
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
-- Name: ai_intent_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ai_intent_templates_id_seq OWNED BY platform.ai_intent_templates.id;


--
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
-- Name: ai_models_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ai_models_id_seq OWNED BY platform.ai_models.id;


--
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
-- Name: TABLE currency_config; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.currency_config IS 'Master configuration for supported currencies worldwide';


--
-- Name: COLUMN currency_config.code; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.code IS 'ISO 4217 3-letter currency code';


--
-- Name: COLUMN currency_config.symbol; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.symbol IS 'Currency symbol (e.g., $, €, ₦)';


--
-- Name: COLUMN currency_config.decimal_places; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.decimal_places IS 'Number of decimal places for currency (usually 2)';


--
-- Name: COLUMN currency_config.symbol_position; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.symbol_position IS 'Position of symbol relative to amount (before/after)';


--
-- Name: COLUMN currency_config.countries; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.countries IS 'Array of ISO 3166-1 alpha-2 country codes';


--
-- Name: COLUMN currency_config.metadata; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.currency_config.metadata IS 'Additional currency metadata (region, central bank, etc.)';


--
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
-- Name: TABLE exchange_rates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.exchange_rates IS 'Foreign exchange rates for currency conversion';


--
-- Name: COLUMN exchange_rates.rate; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.rate IS 'Exchange rate (1 from_currency = rate * to_currency)';


--
-- Name: COLUMN exchange_rates.source; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.source IS 'Source of exchange rate data';


--
-- Name: COLUMN exchange_rates.valid_from; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.valid_from IS 'Start of validity period for this rate';


--
-- Name: COLUMN exchange_rates.valid_until; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.exchange_rates.valid_until IS 'End of validity period (NULL = indefinite)';


--
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
-- Name: TABLE in_app_notifications; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.in_app_notifications IS 'Persistent in-app notifications that users can view in their notification center';


--
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
-- Name: TABLE ngn_bank_codes; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.ngn_bank_codes IS 'Nigerian bank codes from CBN/NIBSS - supports 3, 6, and 9 character formats';


--
-- Name: COLUMN ngn_bank_codes.bank_code_3; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_3 IS '3-character bank code used in transfers (e.g., 044 for Access Bank)';


--
-- Name: COLUMN ngn_bank_codes.bank_code_6; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_6 IS '6-character bank code (to be populated)';


--
-- Name: COLUMN ngn_bank_codes.bank_code_9; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.ngn_bank_codes.bank_code_9 IS '9-character bank code (inferred from 6-char or to be populated)';


--
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
-- Name: ngn_bank_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: platform; Owner: bisiadedokun
--

ALTER SEQUENCE platform.ngn_bank_codes_id_seq OWNED BY platform.ngn_bank_codes.id;


--
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

--
-- Name: TABLE notification_logs; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_logs IS 'Audit log for notification delivery attempts and results';


--
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
-- Name: TABLE notification_preferences; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_preferences IS 'User preferences for different types of notifications and channels';


--
-- Name: COLUMN notification_preferences.quiet_hours; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notification_preferences.quiet_hours IS 'JSON object defining quiet hours when notifications should not be sent';


--
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
-- Name: TABLE notification_statistics; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_statistics IS 'Daily aggregated statistics for notification analytics';


--
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
-- Name: TABLE notification_templates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notification_templates IS 'Customizable notification templates for different events and channels';


--
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
-- Name: TABLE notifications; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.notifications IS 'Main notifications table tracking all notifications sent to users';


--
-- Name: COLUMN notifications.data; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notifications.data IS 'JSON data containing notification context and variables';


--
-- Name: COLUMN notifications.channels; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.notifications.channels IS 'Array of notification channels used for this notification';


--
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
-- Name: TABLE platform_config; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.platform_config IS 'Platform-wide configuration settings';


--
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
-- Name: TABLE rbac_permissions; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_permissions IS 'Master catalog of all available permissions in the system';


--
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
-- Name: TABLE rbac_role_permissions; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_role_permissions IS 'Default role-permission mappings that serve as templates for tenant RBAC setup';


--
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
-- Name: TABLE rbac_roles; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.rbac_roles IS 'Platform-level role templates that can be inherited by tenants';


--
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
-- Name: TABLE receipt_templates; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.receipt_templates IS 'Customizable receipt templates for different transaction types';


--
-- Name: COLUMN receipt_templates.template_variables; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.receipt_templates.template_variables IS 'Available variables for the template';


--
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
-- Name: TABLE tenant_billing; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenant_billing IS 'Tenant billing records and invoicing';


--
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
-- Name: TABLE tenant_usage_metrics; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenant_usage_metrics IS 'Real-time tenant usage tracking';


--
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
-- Name: TABLE tenants; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.tenants IS 'Master tenant registry with configuration';


--
-- Name: COLUMN tenants.database_name; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.database_name IS 'Isolated database name for this tenant';


--
-- Name: COLUMN tenants.connection_string; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.connection_string IS 'PostgreSQL connection string for tenant database';


--
-- Name: COLUMN tenants.database_status; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.database_status IS 'Current status of tenant database';


--
-- Name: COLUMN tenants.currency; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.currency IS 'ISO 4217 currency code (NGN, USD, EUR, GBP, CAD, ZAR, KES, GHS)';


--
-- Name: COLUMN tenants.locale; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.locale IS 'BCP 47 locale code (e.g., en-US, en-NG, fr-CA, de-DE)';


--
-- Name: COLUMN tenants.timezone; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London, Africa/Lagos)';


--
-- Name: COLUMN tenants.date_format; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.date_format IS 'Display format for dates (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)';


--
-- Name: COLUMN tenants.number_format; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.tenants.number_format IS 'Number formatting configuration (decimal separator, thousands separator, precision)';


--
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
-- Name: TABLE transaction_attachments; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_attachments IS 'File attachments related to transactions';


--
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
-- Name: TABLE transaction_audit_log; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_audit_log IS 'Audit trail for transaction changes and events';


--
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
-- Name: TABLE transaction_receipts; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_receipts IS 'Stores generated receipts for all transaction types';


--
-- Name: COLUMN transaction_receipts.receipt_number; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_receipts.receipt_number IS 'Unique receipt number in format RCP{YYYYMMDD}{SEQUENCE}';


--
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
-- Name: TABLE transaction_records; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.transaction_records IS 'Comprehensive transaction tracking table for all transfer types';


--
-- Name: COLUMN transaction_records.recipient_details; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.recipient_details IS 'JSON object containing recipient information';


--
-- Name: COLUMN transaction_records.metadata; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.metadata IS 'Additional transaction metadata and context';


--
-- Name: COLUMN transaction_records.tags; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.transaction_records.tags IS 'Array of tags for categorization and filtering';


--
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
-- Name: TABLE user_devices; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.user_devices IS 'User device tokens for push notifications';


--
-- Name: COLUMN user_devices.device_token; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON COLUMN platform.user_devices.device_token IS 'FCM/APNS device token for push notifications';


--
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
-- Name: TABLE webhook_endpoints; Type: COMMENT; Schema: platform; Owner: bisiadedokun
--

COMMENT ON TABLE platform.webhook_endpoints IS 'External webhook endpoints for notification delivery';


--
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

--
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
-- Name: ai_analytics_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_analytics_insights_id_seq OWNED BY tenant.ai_analytics_insights.id;


--
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
-- Name: ai_configuration_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_configuration_id_seq OWNED BY tenant.ai_configuration.id;


--
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
-- Name: ai_context_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_context_mappings_id_seq OWNED BY tenant.ai_context_mappings.id;


--
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

--
-- Name: ai_conversation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_conversation_logs_id_seq OWNED BY tenant.ai_conversation_logs.id;


--
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
-- Name: ai_intent_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_intent_categories_id_seq OWNED BY tenant.ai_intent_categories.id;


--
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

--
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
-- Name: ai_intent_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_intent_patterns_id_seq OWNED BY tenant.ai_intent_patterns.id;


--
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
-- Name: ai_learning_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_learning_feedback_id_seq OWNED BY tenant.ai_learning_feedback.id;


--
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

--
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
-- Name: ai_response_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_response_templates_id_seq OWNED BY tenant.ai_response_templates.id;


--
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

--
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
-- Name: ai_smart_suggestions_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_smart_suggestions_id_seq OWNED BY tenant.ai_smart_suggestions.id;


--
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
-- Name: ai_translation_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: tenant; Owner: bisiadedokun
--

ALTER SEQUENCE tenant.ai_translation_patterns_id_seq OWNED BY tenant.ai_translation_patterns.id;


--
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

--
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
-- Name: TABLE documents; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.documents IS 'Document storage for KYC and compliance';


--
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

--
-- Name: TABLE fraud_alerts; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.fraud_alerts IS 'Fraud detection alerts and investigations';


--
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
-- Name: TABLE internal_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.internal_transfers IS 'Inter-wallet transfers within user accounts';


--
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
-- Name: TABLE kyc_documents; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.kyc_documents IS 'KYC verification documents and status';


--
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
-- Name: TABLE notifications; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.notifications IS 'User notifications and communications';


--
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

--
-- Name: TABLE rbac_permission_audit; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_permission_audit IS 'Complete audit trail of all permission checks and access attempts';


--
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
-- Name: TABLE rbac_permissions; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_permissions IS 'Tenant-specific permissions, can override platform defaults';


--
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
-- Name: TABLE rbac_roles; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_roles IS 'Tenant-specific roles, can inherit from platform or be completely custom';


--
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
-- Name: TABLE rbac_user_roles; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.rbac_user_roles IS 'User role assignments with effective dates and additional restrictions';


--
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
-- Name: TABLE recipients; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.recipients IS 'Saved recipient accounts for transfers';


--
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
-- Name: TABLE recurring_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.recurring_transfers IS 'Stores recurring/periodic transfers';


--
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
-- Name: TABLE referrals; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.referrals IS 'User referral program tracking';


--
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
-- Name: TABLE scheduled_transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.scheduled_transfers IS 'Stores one-time scheduled transfers';


--
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
-- Name: TABLE transaction_logs; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transaction_logs IS 'Detailed transfer transaction logs';


--
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
-- Name: TABLE transactions; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transactions IS 'All transaction records with AI fraud detection';


--
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
-- Name: TABLE transfers; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.transfers IS 'All money transfer transactions via NIBSS';


--
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
-- Name: TABLE users; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.users IS 'Tenant-specific user accounts with AI preferences';


--
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
-- Name: TABLE user_activity_logs; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.user_activity_logs IS 'User activity tracking for security';


--
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
-- Name: TABLE wallets; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.wallets IS 'User wallet accounts for storing balances';


--
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
-- Name: TABLE wallet_fundings; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.wallet_fundings IS 'Wallet funding operations';


--
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
-- Name: ai_intent_templates id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_intent_templates ALTER COLUMN id SET DEFAULT nextval('platform.ai_intent_templates_id_seq'::regclass);


--
-- Name: ai_models id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_models ALTER COLUMN id SET DEFAULT nextval('platform.ai_models_id_seq'::regclass);


--
-- Name: ngn_bank_codes id; Type: DEFAULT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes ALTER COLUMN id SET DEFAULT nextval('platform.ngn_bank_codes_id_seq'::regclass);


--
-- Name: ai_analytics_insights id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_analytics_insights ALTER COLUMN id SET DEFAULT nextval('tenant.ai_analytics_insights_id_seq'::regclass);


--
-- Name: ai_configuration id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration ALTER COLUMN id SET DEFAULT nextval('tenant.ai_configuration_id_seq'::regclass);


--
-- Name: ai_context_mappings id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings ALTER COLUMN id SET DEFAULT nextval('tenant.ai_context_mappings_id_seq'::regclass);


--
-- Name: ai_conversation_logs id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_conversation_logs ALTER COLUMN id SET DEFAULT nextval('tenant.ai_conversation_logs_id_seq'::regclass);


--
-- Name: ai_intent_categories id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories ALTER COLUMN id SET DEFAULT nextval('tenant.ai_intent_categories_id_seq'::regclass);


--
-- Name: ai_intent_patterns id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns ALTER COLUMN id SET DEFAULT nextval('tenant.ai_intent_patterns_id_seq'::regclass);


--
-- Name: ai_learning_feedback id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback ALTER COLUMN id SET DEFAULT nextval('tenant.ai_learning_feedback_id_seq'::regclass);


--
-- Name: ai_response_templates id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates ALTER COLUMN id SET DEFAULT nextval('tenant.ai_response_templates_id_seq'::regclass);


--
-- Name: ai_smart_suggestions id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_smart_suggestions ALTER COLUMN id SET DEFAULT nextval('tenant.ai_smart_suggestions_id_seq'::regclass);


--
-- Name: ai_translation_patterns id; Type: DEFAULT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_translation_patterns ALTER COLUMN id SET DEFAULT nextval('tenant.ai_translation_patterns_id_seq'::regclass);


--
-- Data for Name: ai_conversation_analytics; Type: TABLE DATA; Schema: analytics; Owner: bisiadedokun
--

COPY analytics.ai_conversation_analytics (id, tenant_id, conversation_date, total_conversations, successful_resolutions, escalated_conversations, abandoned_conversations, average_confidence, average_response_time, average_conversation_length, language_usage, intent_distribution, user_satisfaction, satisfaction_responses, escalation_rate, parsing_errors, service_errors, timeout_errors, created_at) FROM stdin;
\.


--
-- Data for Name: ai_fraud_analytics; Type: TABLE DATA; Schema: analytics; Owner: bisiadedokun
--

COPY analytics.ai_fraud_analytics (id, tenant_id, analysis_date, total_assessments, transactions_assessed, low_risk_count, medium_risk_count, high_risk_count, critical_risk_count, true_positives, false_positives, true_negatives, false_negatives, false_positive_rate, false_negative_rate, model_accuracy, average_processing_time, p99_processing_time, blocked_transactions, approved_transactions, flagged_for_review, additional_auth_required, primary_model_version, model_performance_score, created_at) FROM stdin;
\.


--
-- Data for Name: cbn_compliance_reports; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.cbn_compliance_reports (report_id, tenant_id, report_type, severity, status, submission_deadline, submitted_at, acknowledged_at, description, impact, mitigation_actions, metadata, created_at, updated_at) FROM stdin;
71a067c1-48df-4afe-b33f-198ba7f1006a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:37:14.669	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:37:14.669Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "02ceec92-f75e-48b5-ac67-25b0a4c906a0", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:37:14.712042	2025-09-10 14:37:14.712042
16faec9f-cfc5-45bb-80ab-6357bf10e7aa	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:43:37.833	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:43:37.833Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "b8749586-5182-491b-b4b9-99facd82ab0b", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:43:37.847745	2025-09-10 14:43:37.847745
ce5dbce8-ac76-4b67-be8b-a22e5e902894	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:45:30.728	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:45:30.728Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "15059b24-0e0d-40f5-a3e8-2a1371066cd1", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:45:30.730388	2025-09-10 14:45:30.730388
14da6449-258a-4e09-8058-bc63fcfc934b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-15 18:40:11.374	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-14T22:40:11.374Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "6666bccf-b6ab-40bd-b0a0-dde010d9e0c9", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-14 18:40:11.412133	2025-09-14 18:40:11.412133
\.


--
-- Data for Name: cbn_incidents; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.cbn_incidents (incident_id, tenant_id, category, severity, impact_level, affected_systems, customer_impact, financial_impact, data_types, detected_at, reported_at, resolved_at, root_cause, status, timeline, compliance_report_id, created_at, updated_at) FROM stdin;
02ceec92-f75e-48b5-ac67-25b0a4c906a0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:37:14.669	2025-09-10 14:37:14.67	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:37:14.669Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:37:14.670Z"}]	71a067c1-48df-4afe-b33f-198ba7f1006a	2025-09-10 14:37:14.670519	2025-09-10 14:37:14.713457
b8749586-5182-491b-b4b9-99facd82ab0b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:43:37.833	2025-09-10 14:43:37.833	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:43:37.833Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:43:37.833Z"}]	16faec9f-cfc5-45bb-80ab-6357bf10e7aa	2025-09-10 14:43:37.834149	2025-09-10 14:43:37.849022
15059b24-0e0d-40f5-a3e8-2a1371066cd1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:45:30.728	2025-09-10 14:45:30.728	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:45:30.728Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:45:30.728Z"}]	ce5dbce8-ac76-4b67-be8b-a22e5e902894	2025-09-10 14:45:30.728412	2025-09-10 14:45:30.730916
6666bccf-b6ab-40bd-b0a0-dde010d9e0c9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-14 18:40:11.374	2025-09-14 18:40:11.374	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-14T22:40:11.374Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-14T22:40:11.374Z"}]	14da6449-258a-4e09-8058-bc63fcfc934b	2025-09-14 18:40:11.374877	2025-09-14 18:40:11.412836
\.


--
-- Data for Name: cbn_security_audits; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.cbn_security_audits (audit_id, tenant_id, audit_type, scope, status, start_date, end_date, auditor, findings, risk_rating, compliance_score, recommendations, action_plan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: data_localization_checks; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.data_localization_checks (check_id, tenant_id, data_type, storage_location, compliance, last_checked, issues, remediation, created_at, updated_at) FROM stdin;
763ea5cf-894b-44c9-b9f0-0434f88b40c3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:28:18.834	[]	[]	2025-09-10 14:28:18.834978	2025-09-10 14:28:18.834978
bcf3315c-8e86-447e-a92e-704125528487	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:28:18.838	[]	[]	2025-09-10 14:28:18.838971	2025-09-10 14:28:18.838971
92e6cb86-0ee2-45ea-b8ea-b6aaf5450d92	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:28:18.839	[]	[]	2025-09-10 14:28:18.840036	2025-09-10 14:28:18.840036
dd5b33df-7f9f-441c-b35b-e0a8e615c6da	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:28:18.84	[]	[]	2025-09-10 14:28:18.840671	2025-09-10 14:28:18.840671
827e3b6f-b14f-4c4f-82c3-ade4f2daabb0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:31:13.618	[]	[]	2025-09-10 14:31:13.618305	2025-09-10 14:31:13.618305
0b521961-2f5d-4edf-b03c-b2a7912b198d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:31:13.62	[]	[]	2025-09-10 14:31:13.621667	2025-09-10 14:31:13.621667
1db2b575-1c67-48d0-9d25-a9d8cdbf3587	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:31:13.622	[]	[]	2025-09-10 14:31:13.622578	2025-09-10 14:31:13.622578
6ad4167b-b048-4bdc-bf07-8fc333d55614	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:31:13.623	[]	[]	2025-09-10 14:31:13.624017	2025-09-10 14:31:13.624017
8b31e620-1cc9-446c-93a4-14deba9fec8f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:31:57.908	[]	[]	2025-09-10 14:31:57.908847	2025-09-10 14:31:57.908847
d175e114-e6cb-4b73-a7fa-333f2a3a668f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:31:57.91	[]	[]	2025-09-10 14:31:57.910334	2025-09-10 14:31:57.910334
ed4fab0d-451c-4c50-a03c-8d2f6f0f79ea	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:31:57.91	[]	[]	2025-09-10 14:31:57.910639	2025-09-10 14:31:57.910639
d9ebe905-d3c7-4b0e-81c7-5ad72eeae3ec	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:31:57.91	[]	[]	2025-09-10 14:31:57.910937	2025-09-10 14:31:57.910937
aa37de5a-21e5-40e4-a4b1-1cd12521350c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:37:14.822	[]	[]	2025-09-10 14:37:14.822758	2025-09-10 14:37:14.822758
99d71901-2503-47b1-98a5-7b5f416fb9df	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:37:14.823	[]	[]	2025-09-10 14:37:14.824389	2025-09-10 14:37:14.824389
25490550-f73a-48bb-9331-e3a2582a615e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:37:14.825	[]	[]	2025-09-10 14:37:14.825384	2025-09-10 14:37:14.825384
6938cc28-120b-4a67-878d-ac5df738b09c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:37:14.826	[]	[]	2025-09-10 14:37:14.826837	2025-09-10 14:37:14.826837
25fa75f1-7a68-4e08-91d7-651a692343b9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:43:37.958	[]	[]	2025-09-10 14:43:37.958571	2025-09-10 14:43:37.958571
e7ed2df6-eaff-47e8-8128-ff1e868db983	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:43:37.959	[]	[]	2025-09-10 14:43:37.959126	2025-09-10 14:43:37.959126
83f870d4-4b16-4886-8c67-b16a996a4df1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:43:37.959	[]	[]	2025-09-10 14:43:37.959422	2025-09-10 14:43:37.959422
fd97fdbd-6722-41d1-a184-bb44992614c1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:43:37.959	[]	[]	2025-09-10 14:43:37.959676	2025-09-10 14:43:37.959676
49c6eeef-6389-482f-8ab9-4acc39e2df44	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-10 14:45:30.838	[]	[]	2025-09-10 14:45:30.83895	2025-09-10 14:45:30.83895
5e170664-142d-4ffd-b5a0-2458904267ea	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-10 14:45:30.839	[]	[]	2025-09-10 14:45:30.839884	2025-09-10 14:45:30.839884
699b5d5b-462a-4fd7-9479-4ceeeade4bdf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-10 14:45:30.84	[]	[]	2025-09-10 14:45:30.840293	2025-09-10 14:45:30.840293
337b6300-a763-46c6-bfed-296b3c735f64	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-10 14:45:30.84	[]	[]	2025-09-10 14:45:30.840569	2025-09-10 14:45:30.840569
daf302e7-78b8-4f4d-96ca-9b8f9673d1b8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	customer_data	nigeria	t	2025-09-14 18:40:11.522	[]	[]	2025-09-14 18:40:11.523048	2025-09-14 18:40:11.523048
6265ecc3-08d2-4648-be04-ce46846b9c5e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_data	nigeria	t	2025-09-14 18:40:11.523	[]	[]	2025-09-14 18:40:11.524005	2025-09-14 18:40:11.524005
13350942-5df7-4922-bc81-9b61ad424875	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	payment_data	nigeria	t	2025-09-14 18:40:11.524	[]	[]	2025-09-14 18:40:11.524348	2025-09-14 18:40:11.524348
1cad8183-8b4b-41af-ac12-4947d0790cc0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	kyc_data	nigeria	t	2025-09-14 18:40:11.524	[]	[]	2025-09-14 18:40:11.524666	2025-09-14 18:40:11.524666
\.


--
-- Data for Name: network_segmentation; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.network_segmentation (segmentation_id, tenant_id, environment_type, segment_description, validation_method, last_validated, validation_results, compliance_status, findings, remediation_plan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pci_dss_compliance; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.pci_dss_compliance (compliance_id, tenant_id, merchant_level, assessment_type, compliance_status, last_assessment, next_assessment, valid_until, requirements, network_security, cardholder_data_protection, vulnerability_management, access_control, monitoring, security_policy, created_at, updated_at) FROM stdin;
a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	self_assessment	in_progress	2025-09-10 14:45:31.277	2026-09-10 14:45:31.277	2026-09-10 14:45:31.277	[{"title": "Network Security Controls Documentation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 1.1.1: Network Security Controls Documentation", "requirementId": "e4e787c9-23c8-4f26-a8c8-28903d089e88", "requirementNumber": "1.1.1"}, {"title": "Network Configuration Standards", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 1.2.1: Network Configuration Standards", "requirementId": "67b69c07-9ffb-44d3-be91-09a437eb56c4", "requirementNumber": "1.2.1"}, {"title": "Change Default Passwords", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 2.1.1: Change Default Passwords", "requirementId": "bffd9c26-0d3b-47a1-83fc-302a3d8a09aa", "requirementNumber": "2.1.1"}, {"title": "Configuration Standards Implementation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 2.2.1: Configuration Standards Implementation", "requirementId": "0acf93f0-60d9-46ef-ba28-9c27fb8edc96", "requirementNumber": "2.2.1"}, {"title": "Minimize Cardholder Data Storage", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage", "requirementId": "9c0fe739-2cfa-4982-b53e-be61a505d412", "requirementNumber": "3.1.1"}, {"title": "Render PAN Unreadable", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 3.4.1: Render PAN Unreadable", "requirementId": "9d8333c8-db0c-4ee1-907f-20e31c8a70e3", "requirementNumber": "3.4.1"}, {"title": "Strong Cryptography for Data Transmission", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission", "requirementId": "4fdc7f64-4ead-4d35-ac8a-d07a9f4def0c", "requirementNumber": "4.1.1"}, {"title": "Never Send Unprotected PANs", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 4.2.1: Never Send Unprotected PANs", "requirementId": "2c0e97a4-9030-4b74-84da-8703288e69ff", "requirementNumber": "4.2.1"}, {"title": "Deploy Anti-Malware Solutions", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions", "requirementId": "b02e0731-dd51-4e01-a7de-8caba6634e6d", "requirementNumber": "5.1.1"}, {"title": "Keep Anti-Malware Current", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 5.2.1: Keep Anti-Malware Current", "requirementId": "01f242da-8b2a-4d09-a4ad-dce091beeacc", "requirementNumber": "5.2.1"}, {"title": "Establish Vulnerability Management Process", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process", "requirementId": "6781cac5-d358-4a0c-9c5b-b27b2cd9e1f2", "requirementNumber": "6.1.1"}, {"title": "Deploy Critical Security Patches", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 6.2.1: Deploy Critical Security Patches", "requirementId": "e54bb441-b55f-42f0-9d3d-4c6c2a674f25", "requirementNumber": "6.2.1"}, {"title": "Limit Access to Business Need-to-Know", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know", "requirementId": "b94f0866-69fb-4d14-8e48-2abbde990351", "requirementNumber": "7.1.1"}, {"title": "Assign Unique ID to Each User", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 7.2.1: Assign Unique ID to Each User", "requirementId": "34bde7ba-16af-4ec9-adc6-60ed30d680ca", "requirementNumber": "7.2.1"}, {"title": "Assign Unique User IDs", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 8.1.1: Assign Unique User IDs", "requirementId": "a0eed628-2523-493e-9fb0-ddba027fa328", "requirementNumber": "8.1.1"}, {"title": "Strong User Authentication", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 8.2.1: Strong User Authentication", "requirementId": "259b6ab4-3cdd-4cb7-ba36-3f617251da7f", "requirementNumber": "8.2.1"}, {"title": "Physical Access Controls", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 9.1.1: Physical Access Controls", "requirementId": "8d8a1738-a6e4-4d85-8ebe-19a55d09f32d", "requirementNumber": "9.1.1"}, {"title": "Develop Physical Access Procedures", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 9.2.1: Develop Physical Access Procedures", "requirementId": "46fa7114-d8e6-4f63-91e3-b4899f03d18b", "requirementNumber": "9.2.1"}, {"title": "Implement Audit Trails", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 10.1.1: Implement Audit Trails", "requirementId": "92e76980-2cd6-4d15-b362-1188c7d7ff72", "requirementNumber": "10.1.1"}, {"title": "Automated Audit Trail Review", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 10.2.1: Automated Audit Trail Review", "requirementId": "ec1e3aae-8bda-42bc-b1ff-0e8036170964", "requirementNumber": "10.2.1"}, {"title": "Wireless Access Point Inventory", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "medium", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 11.1.1: Wireless Access Point Inventory", "requirementId": "ac2447c9-bcee-4953-8111-0865b532e1cb", "requirementNumber": "11.1.1"}, {"title": "Perform Penetration Testing", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 11.3.1: Perform Penetration Testing", "requirementId": "e882e6ec-2eaa-42e1-8fba-212241da5f90", "requirementNumber": "11.3.1"}, {"title": "Information Security Policy", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 12.1.1: Information Security Policy", "requirementId": "a46d07cd-70bb-4bc0-8abb-31c3716842eb", "requirementNumber": "12.1.1"}, {"title": "Security Awareness Program", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 12.6.1: Security Awareness Program", "requirementId": "5c924b4c-1f79-44a1-947a-247a73841410", "requirementNumber": "12.6.1"}]	{"networkSegmentation": {"segmentationTested": true, "lastPenetrationTest": "2025-09-10T18:45:31.277Z", "segmentationControls": ["Network firewalls", "VLANs", "Access control lists"], "cardholderDataEnvironment": "Isolated DMZ network"}, "firewallConfiguration": {"rulesReviewed": true, "lastReviewDate": "2025-09-10T18:45:31.277Z", "rulesDocumented": true, "configurationStandards": ["Default deny-all firewall rules", "Restrict inbound and outbound traffic", "Document business justification for all rules"]}, "defaultPasswordChanges": {"changePolicy": "All default passwords must be changed before deployment", "defaultsChanged": true, "verificationProcess": "Configuration review and penetration testing"}, "dataTransmissionSecurity": {"keyManagement": "Hardware Security Module (HSM)", "encryptionStandards": ["TLS 1.2+", "AES-256"], "transmissionProtocols": ["HTTPS", "SFTP"]}}	{"masking": {"exemptions": ["Authorized personnel only"], "panMasking": true, "displayRules": ["Show only last 4 digits", "Mask middle digits with X"], "maskingMethod": "tokenization"}, "disposal": {"disposalMethods": ["Cryptographic erasure", "Physical destruction"], "mediaDestruction": "NIST 800-88 standards", "verificationProcess": "Certificate of destruction required"}, "retention": {"secureStorage": true, "retentionPeriod": 12, "businessJustification": "Regulatory and dispute resolution requirements"}, "dataStorage": {"retentionPolicy": "12 months maximum retention", "storageLocations": ["Encrypted database", "Tokenization vault"], "storageMinimized": true, "encryptionStandards": ["AES-256-GCM", "Field-level encryption"]}, "dataTransmission": {"keyManagement": "PKI with certificate rotation", "approvedProtocols": ["TLS 1.3", "HTTPS"], "encryptionRequired": true}}	{"systemUpdates": {"testingProcess": "Staging environment testing required", "patchManagement": "Monthly security patch cycle", "criticalPatchTimeline": "30 days for critical patches"}, "antivirusControls": {"deploymentScope": "All systems processing cardholder data", "updateFrequency": "Daily signature updates", "monitoringEnabled": true}, "secureApplicationDevelopment": {"codeReviewProcess": "Peer review and static analysis", "developmentStandards": ["OWASP Secure Coding", "SANS Secure Development"], "vulnerabilityTesting": "Dynamic and static application testing"}}	{"uniqueUserIds": {"userIdPolicy": "Unique user ID for each individual", "sharedIdProhibition": true, "serviceAccountManagement": "Documented and approved service accounts only"}, "physicalAccess": {"mediaAccess": "Secure storage with dual control", "deviceSecurity": "Device inventory and tracking", "facilityAccess": "Badge access with logging"}, "accessRestrictions": {"needToKnowBasis": true, "roleBasedAccess": true, "privilegedAccess": "Multi-factor authentication required"}}	{"logManagement": {"logSources": ["Firewalls", "Servers", "Applications", "Databases"], "reviewProcess": "Daily automated review with exception reporting", "loggingEnabled": true, "retentionPeriod": 12}, "securityTesting": {"applicationTesting": {"staticAnalysis": true, "dynamicAnalysis": true, "testingFrequency": "Before deployment and annually"}, "penetrationTesting": {"scope": ["Network", "Applications", "Wireless"], "findings": [], "lastTest": "2025-09-10T18:45:31.278Z", "nextTest": "2026-09-10T18:45:31.278Z", "frequency": "annual", "remediation": []}, "vulnerabilityScanning": {"lastScan": "2025-09-10T18:45:31.278Z", "scanScope": ["Internal networks", "External perimeter"], "criticalFindings": 0, "scanningFrequency": "Quarterly"}}, "incidentResponse": {"teamStructure": "24/7 security operations center", "responseProcess": "Documented incident response plan", "testingSchedule": "Annual tabletop exercises", "communicationPlan": "Escalation matrix with contact details"}}	{"riskAssessment": {"riskRegister": ["Data breach", "System compromise", "Insider threats"], "lastAssessment": "2025-09-10T18:45:31.278Z", "mitigationPlans": ["Security controls", "Monitoring", "Training"], "assessmentFrequency": "Annual with quarterly updates"}, "securityAwareness": {"trainingProgram": "Comprehensive security awareness program", "trainingFrequency": "Annual mandatory training", "awarenessActivities": ["Phishing simulations", "Security bulletins", "Workshops"]}, "informationSecurityPolicy": {"lastReview": "2025-09-10T18:45:31.278Z", "nextReview": "2026-09-10T18:45:31.278Z", "policyExists": true, "approvalProcess": "Board-approved annually"}}	2025-09-10 14:45:31.278679	2025-09-10 14:45:31.278679
8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	self_assessment	in_progress	2025-09-14 18:40:11.962	2026-09-14 18:40:11.962	2026-09-14 18:40:11.962	[{"title": "Network Security Controls Documentation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 1.1.1: Network Security Controls Documentation", "requirementId": "7684eb10-e4d2-4bc5-9396-ae69bd569e86", "requirementNumber": "1.1.1"}, {"title": "Network Configuration Standards", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 1.2.1: Network Configuration Standards", "requirementId": "139df60f-72a5-4d57-bd8d-2c172d7b8e14", "requirementNumber": "1.2.1"}, {"title": "Change Default Passwords", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 2.1.1: Change Default Passwords", "requirementId": "66399b46-7f7b-4e2b-b0ed-eae7a64d9d7c", "requirementNumber": "2.1.1"}, {"title": "Configuration Standards Implementation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 2.2.1: Configuration Standards Implementation", "requirementId": "a2fc908f-c4d5-433b-8266-a09ea7c51acd", "requirementNumber": "2.2.1"}, {"title": "Minimize Cardholder Data Storage", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage", "requirementId": "c64c1382-9530-4b7e-bb96-2322351bac03", "requirementNumber": "3.1.1"}, {"title": "Render PAN Unreadable", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 3.4.1: Render PAN Unreadable", "requirementId": "896392e7-dd8d-468e-974e-3a72f270d0ac", "requirementNumber": "3.4.1"}, {"title": "Strong Cryptography for Data Transmission", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission", "requirementId": "db94c2c8-ff4d-482a-a9c7-59f1fe26b3e9", "requirementNumber": "4.1.1"}, {"title": "Never Send Unprotected PANs", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 4.2.1: Never Send Unprotected PANs", "requirementId": "544ecbc1-4d93-42b7-af4c-2585126e686c", "requirementNumber": "4.2.1"}, {"title": "Deploy Anti-Malware Solutions", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions", "requirementId": "1b549a5a-966e-4b98-8101-0b1643d0c36b", "requirementNumber": "5.1.1"}, {"title": "Keep Anti-Malware Current", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 5.2.1: Keep Anti-Malware Current", "requirementId": "205e5a35-cac8-4bbb-900f-d4bdd44c0003", "requirementNumber": "5.2.1"}, {"title": "Establish Vulnerability Management Process", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process", "requirementId": "0f506ca7-937e-4b68-8c25-c49918d9f949", "requirementNumber": "6.1.1"}, {"title": "Deploy Critical Security Patches", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 6.2.1: Deploy Critical Security Patches", "requirementId": "85b6525d-8e73-4c25-8e23-0463ab269144", "requirementNumber": "6.2.1"}, {"title": "Limit Access to Business Need-to-Know", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know", "requirementId": "3f05e478-e127-47ba-988e-d09abffe4baf", "requirementNumber": "7.1.1"}, {"title": "Assign Unique ID to Each User", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 7.2.1: Assign Unique ID to Each User", "requirementId": "b3739f4e-aa8d-41bf-9eee-dcf54cad4b41", "requirementNumber": "7.2.1"}, {"title": "Assign Unique User IDs", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 8.1.1: Assign Unique User IDs", "requirementId": "4390dbca-8721-4749-9854-929501e68ac5", "requirementNumber": "8.1.1"}, {"title": "Strong User Authentication", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 8.2.1: Strong User Authentication", "requirementId": "a7f1c128-a0c4-4245-9c79-09ea0e1453d3", "requirementNumber": "8.2.1"}, {"title": "Physical Access Controls", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 9.1.1: Physical Access Controls", "requirementId": "adcb191c-ccc9-41bb-a85f-31cdc0364093", "requirementNumber": "9.1.1"}, {"title": "Develop Physical Access Procedures", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 9.2.1: Develop Physical Access Procedures", "requirementId": "5ff3d6f0-7712-45b9-bde9-304b67a4a03f", "requirementNumber": "9.2.1"}, {"title": "Implement Audit Trails", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 10.1.1: Implement Audit Trails", "requirementId": "bb27cf09-499c-4cc0-b09f-e0694c48934a", "requirementNumber": "10.1.1"}, {"title": "Automated Audit Trail Review", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 10.2.1: Automated Audit Trail Review", "requirementId": "0707a22c-a64f-4bb4-9edf-5d6a16e21e1e", "requirementNumber": "10.2.1"}, {"title": "Wireless Access Point Inventory", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "medium", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 11.1.1: Wireless Access Point Inventory", "requirementId": "5c18c09c-4bdf-4dcd-8349-3c7dc35d9a26", "requirementNumber": "11.1.1"}, {"title": "Perform Penetration Testing", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 11.3.1: Perform Penetration Testing", "requirementId": "3bf07061-68a0-4677-973a-38e6b95f3bd2", "requirementNumber": "11.3.1"}, {"title": "Information Security Policy", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 12.1.1: Information Security Policy", "requirementId": "68c04149-fae9-41c8-8503-281d4c46d407", "requirementNumber": "12.1.1"}, {"title": "Security Awareness Program", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 12.6.1: Security Awareness Program", "requirementId": "78707e0e-7779-447b-b03e-5108a341d701", "requirementNumber": "12.6.1"}]	{"networkSegmentation": {"segmentationTested": true, "lastPenetrationTest": "2025-09-14T22:40:11.962Z", "segmentationControls": ["Network firewalls", "VLANs", "Access control lists"], "cardholderDataEnvironment": "Isolated DMZ network"}, "firewallConfiguration": {"rulesReviewed": true, "lastReviewDate": "2025-09-14T22:40:11.962Z", "rulesDocumented": true, "configurationStandards": ["Default deny-all firewall rules", "Restrict inbound and outbound traffic", "Document business justification for all rules"]}, "defaultPasswordChanges": {"changePolicy": "All default passwords must be changed before deployment", "defaultsChanged": true, "verificationProcess": "Configuration review and penetration testing"}, "dataTransmissionSecurity": {"keyManagement": "Hardware Security Module (HSM)", "encryptionStandards": ["TLS 1.2+", "AES-256"], "transmissionProtocols": ["HTTPS", "SFTP"]}}	{"masking": {"exemptions": ["Authorized personnel only"], "panMasking": true, "displayRules": ["Show only last 4 digits", "Mask middle digits with X"], "maskingMethod": "tokenization"}, "disposal": {"disposalMethods": ["Cryptographic erasure", "Physical destruction"], "mediaDestruction": "NIST 800-88 standards", "verificationProcess": "Certificate of destruction required"}, "retention": {"secureStorage": true, "retentionPeriod": 12, "businessJustification": "Regulatory and dispute resolution requirements"}, "dataStorage": {"retentionPolicy": "12 months maximum retention", "storageLocations": ["Encrypted database", "Tokenization vault"], "storageMinimized": true, "encryptionStandards": ["AES-256-GCM", "Field-level encryption"]}, "dataTransmission": {"keyManagement": "PKI with certificate rotation", "approvedProtocols": ["TLS 1.3", "HTTPS"], "encryptionRequired": true}}	{"systemUpdates": {"testingProcess": "Staging environment testing required", "patchManagement": "Monthly security patch cycle", "criticalPatchTimeline": "30 days for critical patches"}, "antivirusControls": {"deploymentScope": "All systems processing cardholder data", "updateFrequency": "Daily signature updates", "monitoringEnabled": true}, "secureApplicationDevelopment": {"codeReviewProcess": "Peer review and static analysis", "developmentStandards": ["OWASP Secure Coding", "SANS Secure Development"], "vulnerabilityTesting": "Dynamic and static application testing"}}	{"uniqueUserIds": {"userIdPolicy": "Unique user ID for each individual", "sharedIdProhibition": true, "serviceAccountManagement": "Documented and approved service accounts only"}, "physicalAccess": {"mediaAccess": "Secure storage with dual control", "deviceSecurity": "Device inventory and tracking", "facilityAccess": "Badge access with logging"}, "accessRestrictions": {"needToKnowBasis": true, "roleBasedAccess": true, "privilegedAccess": "Multi-factor authentication required"}}	{"logManagement": {"logSources": ["Firewalls", "Servers", "Applications", "Databases"], "reviewProcess": "Daily automated review with exception reporting", "loggingEnabled": true, "retentionPeriod": 12}, "securityTesting": {"applicationTesting": {"staticAnalysis": true, "dynamicAnalysis": true, "testingFrequency": "Before deployment and annually"}, "penetrationTesting": {"scope": ["Network", "Applications", "Wireless"], "findings": [], "lastTest": "2025-09-14T22:40:11.962Z", "nextTest": "2026-09-14T22:40:11.962Z", "frequency": "annual", "remediation": []}, "vulnerabilityScanning": {"lastScan": "2025-09-14T22:40:11.962Z", "scanScope": ["Internal networks", "External perimeter"], "criticalFindings": 0, "scanningFrequency": "Quarterly"}}, "incidentResponse": {"teamStructure": "24/7 security operations center", "responseProcess": "Documented incident response plan", "testingSchedule": "Annual tabletop exercises", "communicationPlan": "Escalation matrix with contact details"}}	{"riskAssessment": {"riskRegister": ["Data breach", "System compromise", "Insider threats"], "lastAssessment": "2025-09-14T22:40:11.962Z", "mitigationPlans": ["Security controls", "Monitoring", "Training"], "assessmentFrequency": "Annual with quarterly updates"}, "securityAwareness": {"trainingProgram": "Comprehensive security awareness program", "trainingFrequency": "Annual mandatory training", "awarenessActivities": ["Phishing simulations", "Security bulletins", "Workshops"]}, "informationSecurityPolicy": {"lastReview": "2025-09-14T22:40:11.962Z", "nextReview": "2026-09-14T22:40:11.962Z", "policyExists": true, "approvalProcess": "Board-approved annually"}}	2025-09-14 18:40:11.963159	2025-09-14 18:40:11.963159
\.


--
-- Data for Name: pci_dss_findings; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.pci_dss_findings (finding_id, requirement_id, tenant_id, severity, description, risk, recommendation, status, due_date, assignee, remediation_evidence, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pci_dss_requirements; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.pci_dss_requirements (requirement_id, compliance_id, tenant_id, requirement_number, title, description, category, priority, status, evidence, last_tested, next_test, findings, compensating_controls, created_at, updated_at) FROM stdin;
e4e787c9-23c8-4f26-a8c8-28903d089e88	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1.1.1	Network Security Controls Documentation	PCI DSS Requirement 1.1.1: Network Security Controls Documentation	network_security	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.281947	2025-09-10 14:45:31.281947
67b69c07-9ffb-44d3-be91-09a437eb56c4	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1.2.1	Network Configuration Standards	PCI DSS Requirement 1.2.1: Network Configuration Standards	network_security	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.283278	2025-09-10 14:45:31.283278
bffd9c26-0d3b-47a1-83fc-302a3d8a09aa	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2.1.1	Change Default Passwords	PCI DSS Requirement 2.1.1: Change Default Passwords	network_security	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.283631	2025-09-10 14:45:31.283631
0acf93f0-60d9-46ef-ba28-9c27fb8edc96	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2.2.1	Configuration Standards Implementation	PCI DSS Requirement 2.2.1: Configuration Standards Implementation	network_security	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.283919	2025-09-10 14:45:31.283919
9c0fe739-2cfa-4982-b53e-be61a505d412	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3.1.1	Minimize Cardholder Data Storage	PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage	data_protection	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.284179	2025-09-10 14:45:31.284179
9d8333c8-db0c-4ee1-907f-20e31c8a70e3	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3.4.1	Render PAN Unreadable	PCI DSS Requirement 3.4.1: Render PAN Unreadable	data_protection	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.28444	2025-09-10 14:45:31.28444
4fdc7f64-4ead-4d35-ac8a-d07a9f4def0c	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4.1.1	Strong Cryptography for Data Transmission	PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission	data_protection	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.284697	2025-09-10 14:45:31.284697
2c0e97a4-9030-4b74-84da-8703288e69ff	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4.2.1	Never Send Unprotected PANs	PCI DSS Requirement 4.2.1: Never Send Unprotected PANs	data_protection	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.284978	2025-09-10 14:45:31.284978
b02e0731-dd51-4e01-a7de-8caba6634e6d	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5.1.1	Deploy Anti-Malware Solutions	PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions	vulnerability_mgmt	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.285255	2025-09-10 14:45:31.285255
01f242da-8b2a-4d09-a4ad-dce091beeacc	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5.2.1	Keep Anti-Malware Current	PCI DSS Requirement 5.2.1: Keep Anti-Malware Current	vulnerability_mgmt	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.285607	2025-09-10 14:45:31.285607
6781cac5-d358-4a0c-9c5b-b27b2cd9e1f2	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6.1.1	Establish Vulnerability Management Process	PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process	vulnerability_mgmt	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.286127	2025-09-10 14:45:31.286127
e54bb441-b55f-42f0-9d3d-4c6c2a674f25	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6.2.1	Deploy Critical Security Patches	PCI DSS Requirement 6.2.1: Deploy Critical Security Patches	vulnerability_mgmt	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.286411	2025-09-10 14:45:31.286411
b94f0866-69fb-4d14-8e48-2abbde990351	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7.1.1	Limit Access to Business Need-to-Know	PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know	access_control	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.286878	2025-09-10 14:45:31.286878
34bde7ba-16af-4ec9-adc6-60ed30d680ca	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7.2.1	Assign Unique ID to Each User	PCI DSS Requirement 7.2.1: Assign Unique ID to Each User	access_control	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.287177	2025-09-10 14:45:31.287177
a0eed628-2523-493e-9fb0-ddba027fa328	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8.1.1	Assign Unique User IDs	PCI DSS Requirement 8.1.1: Assign Unique User IDs	access_control	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.287455	2025-09-10 14:45:31.287455
259b6ab4-3cdd-4cb7-ba36-3f617251da7f	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8.2.1	Strong User Authentication	PCI DSS Requirement 8.2.1: Strong User Authentication	access_control	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.28795	2025-09-10 14:45:31.28795
8d8a1738-a6e4-4d85-8ebe-19a55d09f32d	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	9.1.1	Physical Access Controls	PCI DSS Requirement 9.1.1: Physical Access Controls	access_control	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.28867	2025-09-10 14:45:31.28867
46fa7114-d8e6-4f63-91e3-b4899f03d18b	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	9.2.1	Develop Physical Access Procedures	PCI DSS Requirement 9.2.1: Develop Physical Access Procedures	access_control	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.289132	2025-09-10 14:45:31.289132
92e76980-2cd6-4d15-b362-1188c7d7ff72	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10.1.1	Implement Audit Trails	PCI DSS Requirement 10.1.1: Implement Audit Trails	monitoring	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.28947	2025-09-10 14:45:31.28947
ec1e3aae-8bda-42bc-b1ff-0e8036170964	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10.2.1	Automated Audit Trail Review	PCI DSS Requirement 10.2.1: Automated Audit Trail Review	monitoring	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.289747	2025-09-10 14:45:31.289747
ac2447c9-bcee-4953-8111-0865b532e1cb	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	11.1.1	Wireless Access Point Inventory	PCI DSS Requirement 11.1.1: Wireless Access Point Inventory	monitoring	medium	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.290057	2025-09-10 14:45:31.290057
e882e6ec-2eaa-42e1-8fba-212241da5f90	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	11.3.1	Perform Penetration Testing	PCI DSS Requirement 11.3.1: Perform Penetration Testing	monitoring	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.290459	2025-09-10 14:45:31.290459
a46d07cd-70bb-4bc0-8abb-31c3716842eb	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	12.1.1	Information Security Policy	PCI DSS Requirement 12.1.1: Information Security Policy	policy	critical	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.29077	2025-09-10 14:45:31.29077
5c924b4c-1f79-44a1-947a-247a73841410	a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	12.6.1	Security Awareness Program	PCI DSS Requirement 12.6.1: Security Awareness Program	policy	high	not_applicable	[]	2025-09-10 14:45:31.277	2025-12-10 14:45:31.277	[]	\N	2025-09-10 14:45:31.291229	2025-09-10 14:45:31.291229
7684eb10-e4d2-4bc5-9396-ae69bd569e86	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1.1.1	Network Security Controls Documentation	PCI DSS Requirement 1.1.1: Network Security Controls Documentation	network_security	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.966875	2025-09-14 18:40:11.966875
139df60f-72a5-4d57-bd8d-2c172d7b8e14	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1.2.1	Network Configuration Standards	PCI DSS Requirement 1.2.1: Network Configuration Standards	network_security	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.968025	2025-09-14 18:40:11.968025
66399b46-7f7b-4e2b-b0ed-eae7a64d9d7c	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2.1.1	Change Default Passwords	PCI DSS Requirement 2.1.1: Change Default Passwords	network_security	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.968409	2025-09-14 18:40:11.968409
a2fc908f-c4d5-433b-8266-a09ea7c51acd	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2.2.1	Configuration Standards Implementation	PCI DSS Requirement 2.2.1: Configuration Standards Implementation	network_security	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.968745	2025-09-14 18:40:11.968745
c64c1382-9530-4b7e-bb96-2322351bac03	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3.1.1	Minimize Cardholder Data Storage	PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage	data_protection	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.96905	2025-09-14 18:40:11.96905
896392e7-dd8d-468e-974e-3a72f270d0ac	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3.4.1	Render PAN Unreadable	PCI DSS Requirement 3.4.1: Render PAN Unreadable	data_protection	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.969343	2025-09-14 18:40:11.969343
db94c2c8-ff4d-482a-a9c7-59f1fe26b3e9	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4.1.1	Strong Cryptography for Data Transmission	PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission	data_protection	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.969623	2025-09-14 18:40:11.969623
544ecbc1-4d93-42b7-af4c-2585126e686c	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4.2.1	Never Send Unprotected PANs	PCI DSS Requirement 4.2.1: Never Send Unprotected PANs	data_protection	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.969895	2025-09-14 18:40:11.969895
1b549a5a-966e-4b98-8101-0b1643d0c36b	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5.1.1	Deploy Anti-Malware Solutions	PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions	vulnerability_mgmt	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.970162	2025-09-14 18:40:11.970162
205e5a35-cac8-4bbb-900f-d4bdd44c0003	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5.2.1	Keep Anti-Malware Current	PCI DSS Requirement 5.2.1: Keep Anti-Malware Current	vulnerability_mgmt	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.970428	2025-09-14 18:40:11.970428
0f506ca7-937e-4b68-8c25-c49918d9f949	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6.1.1	Establish Vulnerability Management Process	PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process	vulnerability_mgmt	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.970698	2025-09-14 18:40:11.970698
85b6525d-8e73-4c25-8e23-0463ab269144	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6.2.1	Deploy Critical Security Patches	PCI DSS Requirement 6.2.1: Deploy Critical Security Patches	vulnerability_mgmt	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.970955	2025-09-14 18:40:11.970955
3f05e478-e127-47ba-988e-d09abffe4baf	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7.1.1	Limit Access to Business Need-to-Know	PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know	access_control	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.97124	2025-09-14 18:40:11.97124
b3739f4e-aa8d-41bf-9eee-dcf54cad4b41	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7.2.1	Assign Unique ID to Each User	PCI DSS Requirement 7.2.1: Assign Unique ID to Each User	access_control	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.971499	2025-09-14 18:40:11.971499
4390dbca-8721-4749-9854-929501e68ac5	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8.1.1	Assign Unique User IDs	PCI DSS Requirement 8.1.1: Assign Unique User IDs	access_control	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.971754	2025-09-14 18:40:11.971754
a7f1c128-a0c4-4245-9c79-09ea0e1453d3	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8.2.1	Strong User Authentication	PCI DSS Requirement 8.2.1: Strong User Authentication	access_control	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.972009	2025-09-14 18:40:11.972009
adcb191c-ccc9-41bb-a85f-31cdc0364093	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	9.1.1	Physical Access Controls	PCI DSS Requirement 9.1.1: Physical Access Controls	access_control	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.972258	2025-09-14 18:40:11.972258
5ff3d6f0-7712-45b9-bde9-304b67a4a03f	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	9.2.1	Develop Physical Access Procedures	PCI DSS Requirement 9.2.1: Develop Physical Access Procedures	access_control	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.972501	2025-09-14 18:40:11.972501
bb27cf09-499c-4cc0-b09f-e0694c48934a	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10.1.1	Implement Audit Trails	PCI DSS Requirement 10.1.1: Implement Audit Trails	monitoring	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.972753	2025-09-14 18:40:11.972753
0707a22c-a64f-4bb4-9edf-5d6a16e21e1e	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10.2.1	Automated Audit Trail Review	PCI DSS Requirement 10.2.1: Automated Audit Trail Review	monitoring	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.973002	2025-09-14 18:40:11.973002
5c18c09c-4bdf-4dcd-8349-3c7dc35d9a26	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	11.1.1	Wireless Access Point Inventory	PCI DSS Requirement 11.1.1: Wireless Access Point Inventory	monitoring	medium	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.973251	2025-09-14 18:40:11.973251
3bf07061-68a0-4677-973a-38e6b95f3bd2	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	11.3.1	Perform Penetration Testing	PCI DSS Requirement 11.3.1: Perform Penetration Testing	monitoring	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.973501	2025-09-14 18:40:11.973501
68c04149-fae9-41c8-8503-281d4c46d407	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	12.1.1	Information Security Policy	PCI DSS Requirement 12.1.1: Information Security Policy	policy	critical	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.973768	2025-09-14 18:40:11.973768
78707e0e-7779-447b-b03e-5108a341d701	8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	12.6.1	Security Awareness Program	PCI DSS Requirement 12.6.1: Security Awareness Program	policy	high	not_applicable	[]	2025-09-14 18:40:11.962	2025-12-14 18:40:11.962	[]	\N	2025-09-14 18:40:11.974118	2025-09-14 18:40:11.974118
\.


--
-- Data for Name: security_alerts; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.security_alerts (alert_id, tenant_id, alert_type, severity, title, description, "timestamp", trigger_events, rule_name, rule_description, risk_score, threat_actors, affected_assets, potential_impact, status, assigned_to, escalated, response_time, resolution_time, investigation_steps, related_alerts, evidence, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: siem_events; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.siem_events (event_id, tenant_id, "timestamp", event_type, severity, source, source_ip, user_id, description, raw_log, parsed_data, correlation_id, risk_score, indicators, related_events, status, assigned_to, investigation_notes, response_actions, compliance_relevance, retention_period, forensic_evidence, created_at) FROM stdin;
88cd5be3-3b9d-420c-a2a0-725e2243add3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-10 14:43:38.946	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-10 14:43:38.947089
dcf75564-8a25-4ff6-b979-1703449f8431	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-10 14:45:31.837	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-10 14:45:31.837704
156dc7b0-9688-4f32-a466-d5e4ef3fc3a8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-14 18:40:12.518	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-14 18:40:12.518593
\.


--
-- Data for Name: siem_rules; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.siem_rules (rule_id, tenant_id, rule_name, description, category, enabled, conditions, time_window, threshold, severity, alert_actions, automated_responses, created_by, last_modified, trigger_count, false_positive_rate, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_audit_logs; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.tenant_audit_logs (id, tenant_id, service_name, operation, endpoint, http_method, user_id, user_email, user_role, session_id, request_id, ip_address, user_agent, event_type, resource_type, resource_id, before_data, after_data, details, ai_analysis, risk_level, anomaly_score, compliance_flags, status, reviewed_by, reviewed_at, resolution_notes, response_time, response_code, created_at) FROM stdin;
0d0fe0e7-1ade-4a9c-988c-aa6528685db5	c7afab8c-00fa-460e-9aaa-2999c7cdd406	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	c7afab8c-00fa-460e-9aaa-2999c7cdd406	\N	{"id": "c7afab8c-00fa-460e-9aaa-2999c7cdd406", "name": "system-admin", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}, "subdomain": "admin", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-04T19:44:07.277726", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "System Administration", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}, "compliance_level": "tier3", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T19:44:07.277726-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 19:44:07.277726
a0be1277-eebb-4047-a1f5-e3c555312b8e	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	\N	{"id": "71d9f3d7-b9c6-4e24-835b-982a557dd9d2", "name": "development", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}, "subdomain": "dev", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-04T19:44:07.277726", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Development Environment", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T19:44:07.277726-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 19:44:07.277726
4ea04441-d380-438f-9715-b4901416b40a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"locale": "en-NG", "logoUrl": "/assets/default-logo.png", "tagline": "Your trusted payment solution", "appTitle": "Banking PoS", "currency": "NGN", "darkMode": false, "textColor": "#333333", "dateFormat": "DD/MM/YYYY", "faviconUrl": "/assets/default-favicon.ico", "fontFamily": "Roboto", "timeFormat": "HH:mm", "accentColor": "#ff9800", "companyName": "Default Bank", "borderRadius": 8, "primaryColor": "#1976d2", "secondaryColor": "#f50057", "backgroundColor": "#ffffff"}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T19:44:07.491134", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Firstmidas Microfinance Bank", "configuration": {"branding": {"logo": "https://firstmidasmfb.com/wp-content/uploads/2021/01/logomidas-e1609933219910.png", "accentColor": "#DAA520", "primaryColor": "#010080", "secondaryColor": "#000060"}, "businessRules": {"transactionLimits": {"daily": {"count": 50, "amount": 1000000}, "monthly": {"count": 500, "amount": 10000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T19:44:07.491134-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 19:44:07.491134
555d9b14-df05-479d-88f3-8e3ab71d5585	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"locale": "en-NG", "logoUrl": "/assets/default-logo.png", "tagline": "Your trusted payment solution", "appTitle": "Banking PoS", "currency": "NGN", "darkMode": false, "textColor": "#333333", "dateFormat": "DD/MM/YYYY", "faviconUrl": "/assets/default-favicon.ico", "fontFamily": "Roboto", "timeFormat": "HH:mm", "accentColor": "#ff9800", "companyName": "Default Bank", "borderRadius": 8, "primaryColor": "#1976d2", "secondaryColor": "#f50057", "backgroundColor": "#ffffff"}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T19:44:07.491134", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Firstmidas Microfinance Bank", "configuration": {"branding": {"logo": "https://firstmidasmfb.com/wp-content/uploads/2021/01/logomidas-e1609933219910.png", "accentColor": "#DAA520", "primaryColor": "#010080", "secondaryColor": "#000060"}, "businessRules": {"transactionLimits": {"daily": {"count": 50, "amount": 1000000}, "monthly": {"count": 500, "amount": 10000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"assets": {"heroImage": "/assets/brands/fmfb/hero.jpg", "backgroundPattern": "/assets/brands/fmfb/pattern.svg"}, "colors": {"info": "#17A2B8", "text": "#212529", "error": "#DC3545", "accent": "#FF6B35", "primary": "#2E8B57", "success": "#28A745", "surface": "#FFFFFF", "warning": "#FFC107", "secondary": "#FFD700", "background": "#F8F9FA", "textSecondary": "#6C757D"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/assets/brands/fmfb/logo.png", "customCss": "", "faviconUrl": "/assets/brands/fmfb/favicon.ico", "typography": {"fontFamily": "Inter, system-ui, sans-serif", "headingFontFamily": "Poppins, Inter, sans-serif"}}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T21:18:55.352692", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Firstmidas Microfinance Bank", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-04T21:18:55.352692-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:18:55.352692
14b72049-d1c1-480a-b2e2-bf5adf4a71ac	daa800d6-7ffb-420a-a62d-5e4653638e47	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	daa800d6-7ffb-420a-a62d-5e4653638e47	\N	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-04T21:22:31.292787", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T21:22:31.292787-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:22:31.292787
63f9d1ed-4a56-4516-9671-331f0cd58952	30371b03-f729-488e-b06c-b2db675ab6b3	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	30371b03-f729-488e-b06c-b2db675ab6b3	\N	{"id": "30371b03-f729-488e-b06c-b2db675ab6b3", "name": "bank-b", "tier": "basic", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}, "subdomain": "bank-b", "created_at": "2025-09-04T21:22:31.297288", "created_by": null, "updated_at": "2025-09-04T21:22:31.297288", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Bank B Demo", "configuration": {"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}, "custom_domain": "bank-b.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}, "compliance_level": "tier1", "last_modified_by": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T21:22:31.297288-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:22:31.297288
ef5399dd-59c7-4400-9454-a035af55758a	dcb42e6a-b186-4616-8211-95983c32c9ee	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	dcb42e6a-b186-4616-8211-95983c32c9ee	\N	{"id": "dcb42e6a-b186-4616-8211-95983c32c9ee", "name": "bank-c", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}, "subdomain": "bank-c", "created_at": "2025-09-04T21:22:31.297935", "created_by": null, "updated_at": "2025-09-04T21:22:31.297935", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Bank C Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}, "custom_domain": "bank-c.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}, "compliance_level": "tier3", "last_modified_by": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T21:22:31.297935-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:22:31.297935
d29d0f21-cf5a-4329-b034-9a96ed864d05	6ce598f4-9cd7-4422-95f0-4641906573df	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	6ce598f4-9cd7-4422-95f0-4641906573df	\N	{"id": "6ce598f4-9cd7-4422-95f0-4641906573df", "name": "default", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}, "subdomain": "default", "created_at": "2025-09-04T21:22:31.29844", "created_by": null, "updated_at": "2025-09-04T21:22:31.29844", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "display_name": "Multi-Tenant Banking Platform", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}, "custom_domain": "orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}, "compliance_level": "tier3", "last_modified_by": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-04T21:22:31.29844-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:22:31.29844
b411d60f-8648-482c-bdf0-16fb080687e2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"assets": {"heroImage": "/assets/brands/fmfb/hero.jpg", "backgroundPattern": "/assets/brands/fmfb/pattern.svg"}, "colors": {"info": "#17A2B8", "text": "#212529", "error": "#DC3545", "accent": "#FF6B35", "primary": "#2E8B57", "success": "#28A745", "surface": "#FFFFFF", "warning": "#FFC107", "secondary": "#FFD700", "background": "#F8F9FA", "textSecondary": "#6C757D"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/assets/brands/fmfb/logo.png", "customCss": "", "faviconUrl": "/assets/brands/fmfb/favicon.ico", "typography": {"fontFamily": "Inter, system-ui, sans-serif", "headingFontFamily": "Poppins, Inter, sans-serif"}}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T21:18:55.352692", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T21:35:09.22138", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-04T21:35:09.22138-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 21:35:09.22138
fdb4a432-54cb-4e31-b8c5-0c192eb0e54b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T21:35:09.22138", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T22:08:15.953622", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-04T22:08:15.953622-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-04 22:08:15.953622
2f3e8c80-7e4a-4a24-bd9d-3e6c60e0e607	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "bank_code": null, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-04T22:08:15.953622", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-09T00:25:33.241994", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-09T00:25:33.241994-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-09 00:25:33.241994
52a8823a-0c70-4c67-ac47-3fb06e987efd	30371b03-f729-488e-b06c-b2db675ab6b3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	30371b03-f729-488e-b06c-b2db675ab6b3	{"id": "30371b03-f729-488e-b06c-b2db675ab6b3", "name": "bank-b", "tier": "basic", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-b", "created_at": "2025-09-04T21:22:31.297288", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank B Demo", "configuration": {"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}, "custom_domain": "bank-b.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier1", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "30371b03-f729-488e-b06c-b2db675ab6b3", "name": "bank-b", "tier": "basic", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-b", "created_at": "2025-09-04T21:22:31.297288", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank B Demo", "configuration": {"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}, "custom_domain": "bank-b.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier1", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
5dbd9ca3-7ea8-4b3d-9218-d1ff9fb91b4d	6ce598f4-9cd7-4422-95f0-4641906573df	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	6ce598f4-9cd7-4422-95f0-4641906573df	{"id": "6ce598f4-9cd7-4422-95f0-4641906573df", "name": "default", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "default", "created_at": "2025-09-04T21:22:31.29844", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Multi-Tenant Banking Platform", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}, "custom_domain": "orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "6ce598f4-9cd7-4422-95f0-4641906573df", "name": "default", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "default", "created_at": "2025-09-04T21:22:31.29844", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Multi-Tenant Banking Platform", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}, "custom_domain": "orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
cb4d8a53-5027-4026-abaf-2652b1e9cfee	c7afab8c-00fa-460e-9aaa-2999c7cdd406	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	c7afab8c-00fa-460e-9aaa-2999c7cdd406	{"id": "c7afab8c-00fa-460e-9aaa-2999c7cdd406", "name": "system-admin", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "admin", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "System Administration", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "c7afab8c-00fa-460e-9aaa-2999c7cdd406", "name": "system-admin", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "admin", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "System Administration", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
5eefd115-fbed-44fe-acff-c55dfb51ae8c	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	{"id": "71d9f3d7-b9c6-4e24-835b-982a557dd9d2", "name": "development", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "dev", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Development Environment", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "71d9f3d7-b9c6-4e24-835b-982a557dd9d2", "name": "development", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "dev", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Development Environment", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
4bf70786-f5c6-4a60-a5a5-ce6a8d22ecb9	daa800d6-7ffb-420a-a62d-5e4653638e47	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	daa800d6-7ffb-420a-a62d-5e4653638e47	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
b4662bed-715f-42af-b0d9-5ee56f2b2bd1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
aa9edc28-9c92-4558-a0ba-df459b58627f	dcb42e6a-b186-4616-8211-95983c32c9ee	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	dcb42e6a-b186-4616-8211-95983c32c9ee	{"id": "dcb42e6a-b186-4616-8211-95983c32c9ee", "name": "bank-c", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-c", "created_at": "2025-09-04T21:22:31.297935", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank C Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}, "custom_domain": "bank-c.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "dcb42e6a-b186-4616-8211-95983c32c9ee", "name": "bank-c", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-c", "created_at": "2025-09-04T21:22:31.297935", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank C Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}, "custom_domain": "bank-c.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
3b680731-634a-4cea-8f88-93f1c0420a74	92b9a514-e318-46ba-bb6d-bbc5e1e0854c	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	92b9a514-e318-46ba-bb6d-bbc5e1e0854c	\N	{"id": "92b9a514-e318-46ba-bb6d-bbc5e1e0854c", "name": "usbank", "tier": "basic", "locale": "en-US", "region": "north-america-east", "status": "active", "branding": {"tagline": "Banking Made Simple", "appTitle": "US Community Bank", "primaryColor": "#003366", "secondaryColor": "#FF6B35"}, "currency": "USD", "timezone": "America/New_York", "bank_code": null, "subdomain": "usbank", "created_at": "2025-09-30T21:16:55.849081", "created_by": null, "updated_at": "2025-09-30T21:16:55.849081", "date_format": "MM/DD/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"error": "#EF4444", "primary": "#003366", "success": "#10B981", "secondary": "#FF6B35"}, "display_name": "United States Community Bank", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-30T21:16:55.849081-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 21:16:55.849081
f25947ae-f499-441f-aff1-42ea6c12bc04	2c234c5e-c321-4ed4-83d0-b5602ea50c07	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	2c234c5e-c321-4ed4-83d0-b5602ea50c07	\N	{"id": "2c234c5e-c321-4ed4-83d0-b5602ea50c07", "name": "cabank", "tier": "basic", "locale": "en-CA", "region": "north-america-east", "status": "active", "branding": {"tagline": "Your Canadian Banking Partner", "appTitle": "Maple Leaf Financial", "primaryColor": "#D32F2F", "secondaryColor": "#FFFFFF"}, "currency": "CAD", "timezone": "America/Toronto", "bank_code": null, "subdomain": "cabank", "created_at": "2025-09-30T21:16:55.849081", "created_by": null, "updated_at": "2025-09-30T21:16:55.849081", "date_format": "YYYY-MM-DD", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"error": "#EF4444", "primary": "#D32F2F", "success": "#10B981", "secondary": "#FFFFFF"}, "display_name": "Maple Leaf Financial Services", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-30T21:16:55.849081-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 21:16:55.849081
845b7012-c358-41d5-ac8a-44549c1601fb	004c5e50-eb32-4c7d-a375-e8ff65f225c1	platform	tenant_create	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	004c5e50-eb32-4c7d-a375-e8ff65f225c1	\N	{"id": "004c5e50-eb32-4c7d-a375-e8ff65f225c1", "name": "eubank", "tier": "basic", "locale": "de-DE", "region": "europe-central", "status": "active", "branding": {"tagline": "Banking Across Europe", "appTitle": "Europa Banking", "primaryColor": "#004494", "secondaryColor": "#FFDD00"}, "currency": "EUR", "timezone": "Europe/Berlin", "bank_code": null, "subdomain": "eubank", "created_at": "2025-09-30T21:16:55.849081", "created_by": null, "updated_at": "2025-09-30T21:16:55.849081", "date_format": "DD.MM.YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"error": "#EF4444", "primary": "#004494", "success": "#10B981", "secondary": "#FFDD00"}, "display_name": "Europa Banking Group", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "INSERT", "timestamp": "2025-09-30T21:16:55.849081-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 21:16:55.849081
b5bdb567-4a80-4bb6-8fd5-8fd82735e84d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-09T00:25:33.241994", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-21T17:18:16.364538", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-21T17:18:16.364538-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-21 17:18:16.364538
3183d1bf-026e-4acb-82b0-4a03753ffaaa	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}, "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-21T17:18:16.364538", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "region": "nigeria-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-27T19:08:44.006006", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-27T19:08:44.006006-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-27 19:08:44.006006
05a12cf7-1a88-42ad-a0f3-7940e5427bb8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-27T19:08:44.006006", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
8ccaf699-40b6-4cd6-a356-c70ecf275f5d	c7afab8c-00fa-460e-9aaa-2999c7cdd406	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	c7afab8c-00fa-460e-9aaa-2999c7cdd406	{"id": "c7afab8c-00fa-460e-9aaa-2999c7cdd406", "name": "system-admin", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "admin", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-04T19:44:07.277726", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "System Administration", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "c7afab8c-00fa-460e-9aaa-2999c7cdd406", "name": "system-admin", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "admin", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "System Administration", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
ec58e4cd-3d32-4a64-987c-3f945325d7ee	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	71d9f3d7-b9c6-4e24-835b-982a557dd9d2	{"id": "71d9f3d7-b9c6-4e24-835b-982a557dd9d2", "name": "development", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "dev", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-04T19:44:07.277726", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Development Environment", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "71d9f3d7-b9c6-4e24-835b-982a557dd9d2", "name": "development", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "dev", "created_at": "2025-09-04T19:44:07.277726", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Development Environment", "configuration": {"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}, "custom_domain": null, "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
8f967fb7-cee4-442d-a942-ba1c482dee21	daa800d6-7ffb-420a-a62d-5e4653638e47	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	daa800d6-7ffb-420a-a62d-5e4653638e47	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-04T21:22:31.292787", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
5369738b-13a8-4d4b-8f35-f755b3443356	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
0cbffe0d-8698-4498-ae6b-3979353f0896	30371b03-f729-488e-b06c-b2db675ab6b3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	30371b03-f729-488e-b06c-b2db675ab6b3	{"id": "30371b03-f729-488e-b06c-b2db675ab6b3", "name": "bank-b", "tier": "basic", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-b", "created_at": "2025-09-04T21:22:31.297288", "created_by": null, "updated_at": "2025-09-04T21:22:31.297288", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank B Demo", "configuration": {"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}, "custom_domain": "bank-b.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier1", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "30371b03-f729-488e-b06c-b2db675ab6b3", "name": "bank-b", "tier": "basic", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-b", "created_at": "2025-09-04T21:22:31.297288", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank B Demo", "configuration": {"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}, "custom_domain": "bank-b.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier1", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
9f5c6e7e-ddea-401d-a99c-23b9f5994bb5	dcb42e6a-b186-4616-8211-95983c32c9ee	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	dcb42e6a-b186-4616-8211-95983c32c9ee	{"id": "dcb42e6a-b186-4616-8211-95983c32c9ee", "name": "bank-c", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-c", "created_at": "2025-09-04T21:22:31.297935", "created_by": null, "updated_at": "2025-09-04T21:22:31.297935", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank C Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}, "custom_domain": "bank-c.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "dcb42e6a-b186-4616-8211-95983c32c9ee", "name": "bank-c", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-c", "created_at": "2025-09-04T21:22:31.297935", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank C Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}, "custom_domain": "bank-c.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
43354740-abe9-42c1-bd04-d44a2a3c5565	6ce598f4-9cd7-4422-95f0-4641906573df	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	6ce598f4-9cd7-4422-95f0-4641906573df	{"id": "6ce598f4-9cd7-4422-95f0-4641906573df", "name": "default", "tier": "enterprise", "locale": "en-NG", "region": "nigeria-west", "status": "active", "branding": {"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "default", "created_at": "2025-09-04T21:22:31.29844", "created_by": null, "updated_at": "2025-09-04T21:22:31.29844", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Multi-Tenant Banking Platform", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}, "custom_domain": "orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "6ce598f4-9cd7-4422-95f0-4641906573df", "name": "default", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "default", "created_at": "2025-09-04T21:22:31.29844", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Multi-Tenant Banking Platform", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}, "custom_domain": "orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier3", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": true}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-09-30T20:30:02.334894-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-09-30 20:30:02.334894
0c37bd53-d8e9-47f6-ba17-18ee0b3fe8b0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "090", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-10-03T07:34:38.708168", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-10-03T07:34:38.708168-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-10-03 07:34:38.708168
817aa2ed-341d-45a2-9635-f1834e4003d3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-10-03T07:34:38.708168", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "513", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-10-03T11:14:29.51315", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-10-03T11:14:29.51315-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-10-03 11:14:29.51315
723fec1e-8757-4174-b6cc-613d5643cfcf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "513", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-10-03T11:14:29.51315", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3", "name": "fmfb", "tier": "enterprise", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "51333", "subdomain": "fmfb", "created_at": "2025-09-04T19:44:07.491134", "created_by": null, "updated_at": "2025-10-07T21:41:52.87166", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}, "display_name": "Firstmidas Microfinance Bank Limited", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}, "custom_domain": "fmfb.orokii.com", "database_host": "localhost", "database_name": "tenant_fmfb_db", "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "active", "ai_configuration": {"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": "postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db", "security_settings": {"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-10-07T21:41:52.87166-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-10-07 21:41:52.87166
9dc2679c-982d-4424-be56-8390d6ba798e	daa800d6-7ffb-420a-a62d-5e4653638e47	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	daa800d6-7ffb-420a-a62d-5e4653638e47	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-09-30T20:30:02.334894", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "TDBNK1", "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-10-07T21:57:48.734605", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-10-07T21:57:48.734605-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-10-07 21:57:48.734605
3408d60c-40e1-4cf6-8774-624631d74855	daa800d6-7ffb-420a-a62d-5e4653638e47	platform	tenant_update	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	tenant	daa800d6-7ffb-420a-a62d-5e4653638e47	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": "TDBNK1", "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-10-07T21:57:48.734605", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"id": "daa800d6-7ffb-420a-a62d-5e4653638e47", "name": "bank-a", "tier": "premium", "locale": "en-NG", "region": "africa-west", "status": "active", "branding": {"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}, "currency": "NGN", "timezone": "Africa/Lagos", "bank_code": null, "subdomain": "bank-a", "created_at": "2025-09-04T21:22:31.292787", "created_by": null, "updated_at": "2025-10-07T21:57:55.372174", "date_format": "DD/MM/YYYY", "billing_info": {"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}, "brand_assets": {}, "brand_colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "display_name": "Bank A Demo", "configuration": {"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}, "custom_domain": "bank-a.orokii.com", "database_host": "localhost", "database_name": null, "database_port": 5433, "number_format": {"decimal": ".", "precision": 2, "thousands": ","}, "database_config": {"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}, "database_status": "pending", "ai_configuration": {"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}, "brand_typography": {"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}, "compliance_level": "tier2", "last_modified_by": null, "connection_string": null, "security_settings": {"mfa": {"required": false}}, "compliance_settings": {"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}}	{"table": "tenants", "operation": "UPDATE", "timestamp": "2025-10-07T21:57:55.372174-04:00"}	\N	\N	\N	\N	logged	\N	\N	\N	\N	\N	2025-10-07 21:57:55.372174
\.


--
-- Data for Name: threat_intelligence; Type: TABLE DATA; Schema: audit; Owner: bisiadedokun
--

COPY audit.threat_intelligence (indicator_id, tenant_id, indicator_value, indicator_type, confidence, source, description, first_seen, last_seen, threat_types, campaigns, tags, active, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: ai_intent_templates; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.ai_intent_templates (id, category_name, description, default_patterns, is_banking_standard, created_at) FROM stdin;
1	balance_inquiry	User asking about account balance	[{"type": "keyword", "pattern": "balance"}, {"type": "phrase", "pattern": "account balance"}, {"type": "phrase", "pattern": "how much money"}]	t	2025-09-20 12:15:11.449952
2	spending_analysis	User requesting spending analysis	[{"type": "phrase", "pattern": "spending pattern"}, {"type": "phrase", "pattern": "spending habits"}, {"type": "phrase", "pattern": "expense analysis"}]	t	2025-09-20 12:15:11.449952
3	money_transfer	User wanting to transfer money	[{"type": "phrase", "pattern": "send money"}, {"type": "phrase", "pattern": "transfer funds"}, {"type": "phrase", "pattern": "wire transfer"}]	t	2025-09-20 12:15:11.449952
4	transaction_history	User requesting transaction history	[{"type": "phrase", "pattern": "transaction history"}, {"type": "phrase", "pattern": "recent transactions"}, {"type": "phrase", "pattern": "payment history"}]	t	2025-09-20 12:15:11.449952
5	bill_payment	User wanting to pay bills	[{"type": "phrase", "pattern": "pay bill"}, {"type": "phrase", "pattern": "bill payment"}, {"type": "phrase", "pattern": "utility payment"}]	t	2025-09-20 12:15:11.449952
6	greeting	User greeting	[{"type": "keyword", "pattern": "hello"}, {"type": "keyword", "pattern": "hi"}, {"type": "phrase", "pattern": "good morning"}]	t	2025-09-20 12:15:11.449952
7	help_support	User requesting help	[{"type": "keyword", "pattern": "help"}, {"type": "keyword", "pattern": "support"}, {"type": "phrase", "pattern": "what can you do"}]	t	2025-09-20 12:15:11.449952
\.


--
-- Data for Name: ai_models; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.ai_models (id, model_name, provider, model_version, capabilities, cost_per_request, is_active, created_at, updated_at) FROM stdin;
1	gpt-3.5-turbo	openai	3.5	{"max_tokens": 4096, "multilingual": true, "conversational": true}	0.002000	t	2025-09-20 12:15:11.449344	2025-09-20 12:15:11.449344
2	gpt-4	openai	4.0	{"reasoning": true, "max_tokens": 8192, "multilingual": true, "conversational": true}	0.030000	t	2025-09-20 12:15:11.449344	2025-09-20 12:15:11.449344
3	claude-3-sonnet	anthropic	3.0	{"reasoning": true, "multilingual": true, "conversational": true}	0.003000	t	2025-09-20 12:15:11.449344	2025-09-20 12:15:11.449344
\.


--
-- Data for Name: bill_provider_templates; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.bill_provider_templates (id, provider_code, provider_name, category, logo_url, validation_rules, fee_structure, api_config, is_active, created_at, updated_at) FROM stdin;
1c4b8765-80a3-407b-b8b7-b33f5d127812	IKEDC	Ikeja Electric	electricity	\N	{"account_length": {"max": 15, "min": 8}}	{"rate": 0.01, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
4989d78b-dea4-4bac-b8ed-5bf24cadd03e	EKEDC	Eko Electric	electricity	\N	{"account_length": {"max": 15, "min": 8}}	{"rate": 0.01, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
c71b9d16-d4e1-4628-9bdd-526910d66ca1	AEDC	Abuja Electric	electricity	\N	{"account_length": {"max": 15, "min": 8}}	{"rate": 0.01, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
84378852-7b7c-4cff-adcf-355ddffa80b7	PHEDC	Port Harcourt Electric	electricity	\N	{"account_length": {"max": 15, "min": 8}}	{"rate": 0.01, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
45a7a66b-159c-421f-b9cb-c2f8eafd932f	MTN	MTN Nigeria	internet	\N	{"account_length": {"max": 11, "min": 10}}	{"type": "fixed", "amount": 50}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
085a4e5f-05f8-412e-b5eb-fb2c5efd590b	AIRTEL	Airtel Nigeria	internet	\N	{"account_length": {"max": 11, "min": 10}}	{"type": "fixed", "amount": 50}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
5d41071b-4014-4d69-a936-b6b10ebe1fc6	GLO	Globacom Nigeria	internet	\N	{"account_length": {"max": 11, "min": 10}}	{"type": "fixed", "amount": 50}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
7ee3377b-7de8-4098-82ac-b0e3c7e3c31e	DSTV	DStv	cable	\N	{"account_length": {"max": 12, "min": 8}}	{"rate": 0.015, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
c3884e4b-73a6-4ffc-be88-b93c890149b6	GOTV	GOtv	cable	\N	{"account_length": {"max": 12, "min": 8}}	{"rate": 0.015, "type": "percentage"}	\N	t	2025-09-26 16:02:50.722554-04	2025-09-26 16:02:50.722554-04
\.


--
-- Data for Name: currency_config; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.currency_config (code, name, symbol, decimal_places, symbol_position, enabled, countries, metadata, created_at, updated_at) FROM stdin;
NGN	Nigerian Naira	₦	2	before	t	["NG"]	{"region": "africa-west", "centralBank": "CBN"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
ZAR	South African Rand	R	2	before	t	["ZA"]	{"region": "africa-south", "centralBank": "SARB"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
KES	Kenyan Shilling	KSh	2	before	t	["KE"]	{"region": "africa-east", "centralBank": "CBK"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
GHS	Ghanaian Cedi	GH₵	2	before	t	["GH"]	{"region": "africa-west", "centralBank": "BOG"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
USD	US Dollar	$	2	before	t	["US"]	{"region": "north-america", "centralBank": "Federal Reserve"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
CAD	Canadian Dollar	$	2	before	t	["CA"]	{"region": "north-america", "centralBank": "Bank of Canada"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
EUR	Euro	€	2	before	t	["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "GR"]	{"region": "europe", "centralBank": "ECB"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
GBP	British Pound	£	2	before	t	["GB"]	{"region": "europe", "centralBank": "Bank of England"}	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.exchange_rates (id, from_currency, to_currency, rate, source, valid_from, valid_until, is_active, created_at, updated_at) FROM stdin;
649dba85-dc6b-4d1c-8ee3-223558caa24a	NGN	USD	0.00130000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
3583b15e-d550-440d-9dcb-528688b9014d	USD	NGN	769.00000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
84fabacf-ab05-49f8-a2dd-f01c9e7aa758	NGN	EUR	0.00120000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
84335b98-1918-4f99-ae0b-5c0e59242b19	EUR	NGN	833.00000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
d0739daf-bfda-4b51-ae20-a5be61528f57	NGN	GBP	0.00100000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
dd14bf99-d8d7-4ac0-bfaa-91ea961a9e40	GBP	NGN	1000.00000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
f4dd5819-9d83-430c-a7df-c590dc5962cb	USD	EUR	0.92000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
61fa1887-a23c-4fbf-8598-6ca040598a63	EUR	USD	1.09000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
7464291b-9e62-47e6-9382-0d3ef00a9fe9	USD	GBP	0.79000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
0350ce16-434c-456a-ae18-2ed025b74d87	GBP	USD	1.27000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
45e6ec1d-de2b-4c2d-9613-e8fe1d9b8f9c	USD	CAD	1.36000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
b1ec3b94-9f7d-450a-b32f-a4c03ae82d49	CAD	USD	0.74000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
b32f058e-c3ff-41cf-9035-7929755afe51	EUR	GBP	0.86000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
59a549a2-4fa4-4c2d-82ca-cd8eb0c6d80f	GBP	EUR	1.16000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
897e419a-592e-4aea-8962-6263f5ee696c	NGN	ZAR	0.02500000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
de27bee6-4b50-4e03-82c7-c2ca17c0ccdd	ZAR	NGN	40.00000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
deea8936-4db3-4826-9908-069e3bbec353	NGN	KES	0.17000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
f4bc1390-1f05-461f-8d77-42a740662f38	KES	NGN	5.90000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
21aac59d-a6f5-40ed-9dd5-731b19f97697	NGN	GHS	0.11000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
6daacfc6-da66-4e27-97df-34e9c5dacc87	GHS	NGN	9.10000000	manual	2025-09-30 20:30:49.03341	\N	t	2025-09-30 20:30:49.03341	2025-09-30 20:30:49.03341
\.


--
-- Data for Name: in_app_notifications; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.in_app_notifications (id, tenant_id, user_id, notification_id, title, body, data, is_read, read_at, is_deleted, deleted_at, priority, category, action_url, created_at) FROM stdin;
\.


--
-- Data for Name: ngn_bank_codes; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.ngn_bank_codes (id, bank_name, bank_code_3, bank_code_6, bank_code_9, bank_type, status, created_at, updated_at, bank_code_5) FROM stdin;
1	ACCESS BANK NIGERIA PLC	044	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
2	ACCESS BANK PLC (DIAMOND)	063	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
3	CITIBANK	023	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
4	ECOBANK NIGERIA PLC	050	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
5	FIDELITY BANK PLC	070	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
6	FIRST BANK PLC	011	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
7	FIRST CITY MONUMENT BANK PLC	214	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
8	GLOBUS BANK	103	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
9	GTBANK PLC	058	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
10	JAIZ BANK	301	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
11	KEYSTONE BANK PLC	082	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
12	LOTUS BANK	303	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
13	OPTIMUS BANK LIMITED	107	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
14	PARALLEX BANK LIMITED	104	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
15	POLARIS BANK	076	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
16	PREMIUMTRUST BANK	105	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
17	PROVIDUS BANK	101	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
18	SIGNATURE BANK	106	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
19	STANBIC IBTC BANK PLC	039	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
20	STANDARD CHARTERED BANK NIGERIA LIMITED	068	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
21	STERLING BANK PLC	232	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
22	SUNTRUST BANK	100	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
23	TAJ BANK	302	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
24	TITAN TRUST BANK	102	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
25	UNION BANK OF NIGERIA PLC	032	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
26	UNITED BANK FOR AFRICA PLC	033	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
27	UNITY BANK PLC	215	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
28	WEMA BANK PLC	035	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
29	ZENITH BANK PLC	057	\N	\N	COMMERCIAL	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
30	CENTRAL BANK OF NIGERIA	010	\N	\N	CENTRAL_BANK	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
31	BANK OF AGRICULTURE	H13	\N	\N	SPECIALIZED	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
32	NEXIM BANK	F18	\N	\N	SPECIALIZED	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
33	CORONATION MERCHANT BANK	C16	\N	\N	MERCHANT	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
34	FBNQUEST MERCHANT BANK	C17	\N	\N	MERCHANT	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
35	FSDH	501	\N	\N	MERCHANT	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
36	GREENWICH MERCHANT BANK	C57	\N	\N	MERCHANT	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
37	RAND MERCHANT BANK	502	\N	\N	MERCHANT	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
38	9 PAYMENT SERVICE BANK	C34	\N	\N	PAYMENT_SERVICE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
39	HOPE PAYMENT SERVICE BANK	800	\N	\N	PAYMENT_SERVICE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
40	MOMO PAYMENT SERVICE BANK	C47	\N	\N	PAYMENT_SERVICE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
41	MONEYMASTER PSB	C46	\N	\N	PAYMENT_SERVICE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
42	SMARTCASH PAYMENT SERVICE BANK	C60	\N	\N	PAYMENT_SERVICE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
43	ACCESS MOBILE	323	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
44	CARBON	565	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
45	FBN MOBILE	309	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
46	FCMB EASY ACCOUNT	312	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
47	FIDELITY MOBILE	B86	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
48	GOMONEY	B89	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
49	GTBANK MOBILE MONEY	B90	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
50	KONGA PAY	025	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
51	KUDA MICROFINANCE BANK	A98	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
52	OPAY	C03	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
53	PAGA	B98	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
54	PALMPAY LIMITED	B99	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
55	PAYSTACK-TITAN	C70	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
56	RUBIES MFB	587	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
57	UBA MONI	A99	\N	\N	FINTECH	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
58	5TT MFB	H14	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
59	9JAPAY MICROFINANCE BANK	E09	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
60	ABSU MICROFINANCE BANK	F12	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
61	ABU MICROFINANCE BANK	780	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
62	ABUCOOP MICROFINANCE BANK	D80	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
63	ACCION MICROFINANCE BANK	603	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
64	ADA MFB	F84	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
65	ADDOSSER MICROFINANCE BANK	A07	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
66	ADVANCLY MFB	E41	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
67	AELLA MFB	E05	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
68	AFEKHAFE MICROFINANCE BANK	716	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
69	AG MORTGAGE BANK PLC	A09	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
70	AGOSASA MICROFINANCE BANK	D91	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
71	AKALABO MFB	D97	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
72	AKPO MICROFINANCE BANK	965	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
73	AKSU MFB	E31	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
74	AKU MICROFINANCE BANK	D25	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
75	AL-BARAKAH MICROFINANCE BANK	A11	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
76	ALERT MICROFINANCE BANK	A13	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
77	ALPHA MORGAN BANK	E52	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
78	ALTERNATIVE BANK LIMITED	F25	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
79	ALVANA MICROFINANCE BANK	751	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
81	AMOYE MICROFINANCE BANK	964	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
82	AMPLE MFB	E45	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
83	ANIOCHA MICROFINANCE BANK	885	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
84	ANIOMA MFB	E26	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
85	APPLE MICROFINANCE BANK	A20	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
86	ARM MFB	E85	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
87	ASSETS MICROFINANCE BANK	712	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
88	ATBU MFB	D70	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
89	AUCHI POLY MFB	E87	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
90	AVE MARIA MICROFINANCE BANK	970	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
91	AVUENEGBE MICROFINANCE BANK	969	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
92	AWACASH MICROFINANCE BANK	880	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
93	AWESOME MICROFINANCE BANK	F27	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
94	AZTEC MICROFINANCE BANK AMB	D18	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
95	BABURA MICROFINANCE BANK	F02	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
96	BAINES CREDIT MICROFINANCE BANK	A25	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
97	BALOGUN FULANI MICROFINANCE BANK	713	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
98	BAM MICROFINANCE BANK	F55	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
99	BANC CORP MICROFINANCE BANK	E04	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
100	BANKIT MFB	A02	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
101	BAOBAB MFB	A27	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
102	BARNAWA MFB	E72	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
103	BELLBANK MICROFINANCE BANK	F63	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
104	BERACHAH MFB	F52	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
105	BESTSTAR MICROFINANCE BANK	958	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
106	BETHEL MICROFINANCE BANK	F54	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
107	BIPC MICROFINANCE BANK	C14	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
108	BLOOMS MFB	E43	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
109	BLUEPRINT INVESTMENTS MICROFINANCE BANK	811	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
110	BOI MICROFINANCE BANK	D72	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
111	BOJI FMB	796	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
112	BOKKOS MFB	F74	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
113	BOLD MFB	E27	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
114	BOOST MFB	H05	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
115	BORSTAL MICROFINANCE BANK	F13	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
116	BOWEN MICROFINANCE BANK	A32	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
117	BOWMAN MFB	E94	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
118	BRIDGEWAY MICROFINANCE BANK	335	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
119	BRIGHTWAY MICROFINANCE BANK	A35	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
120	BRIYTH-COVENANT MICROFINANCE BANK	883	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
121	BUILD MICROFINANCE BANK	889	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
122	BUNDI MICROFINANCE	F30	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
123	BUNKURE MICROFINANCE BANK	F20	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
124	BUYPOWER MICROFINANCE BANK	F57	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
125	CANAAN MICROFINANCE BANK	F16	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
126	CASHBRIDGE MICROFINANCE BANK	886	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
127	CASHCONNECT	A36	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
128	CASHRITE MICROFINANCE BANK	F24	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
129	CEDAR MICROFINANCE BANK	921	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
130	CEMCS MICROFINANCE BANK	A37	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
131	CHANELLE MICROFINANCE BANK	D87	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
132	CHARIS MFB	E97	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
133	CHIBUEZE MICROFINANCE BANK	694	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
134	CHUKWUNENYE MFB	D50	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
135	CLEARPAY MICROFINANCE BANK	731	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
136	COALCAMP MICROFINANCE BANK	714	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
137	COASTLINE MICROFINANCE BANK	A40	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
138	CONFIDENCE MICROFINANCE BANK	D26	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
139	CORESTEP MICROFINANCE BANK	A43	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
140	COVENANT MICROFINANCE BANK	756	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
141	CREDIT AFRIQUE MICROFINANCE BANK	A44	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
142	CREDITVILLE MICROFINANCE BANK	904	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
143	CRUST MICROFINANCE BANK	C83	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
144	CRUTECH MICROFINANCE BANK	802	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
145	CSD MICROFINANCE BANK	F66	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:12:14.855682	2025-10-02 21:12:14.855682	\N
146	DAILY TRUST MICROFINANCE BANK	F83	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
147	DAL MFB	891	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
148	DAVENPORT MICROFINANCE BANK	F41	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
149	DAVODANI MICROFINANCE BANK	A45	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
150	DESTINY MFB	F97	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
151	DIGITVANT MFB	E22	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
152	DILLON MFB	E98	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
153	DIOBU MICROFINANCE BANK	F05	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
154	DOJE MICROFINANCE BANK LIMITED	F43	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
155	DOT MICROFINANCE BANK	C84	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
156	DSC MICROFINANCE BANK	E84	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
157	DW MFB	E17	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
158	EARNWELL MICROFINANCE BANK	F42	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
159	EASTMAN MFB	H01	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
160	EBSU MFB	D79	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
161	EDFIN MICROFINANCE BANK	645	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
162	EJINDU MFB	F67	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
163	EK-RELIABLE MICROFINANCE BANK	A51	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
164	EMAAR MFB	F87	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
165	ENTITY MICROFINANCE BANK	F33	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
166	ESAN MICROFINANCE BANK	A55	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
167	ESO-E MICROFINANCE BANK	A56	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
168	EXCEL MICROFINANCE BANK	F49	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
169	FAIRMONEY MICROFINANCE BANK	D10	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
170	FAME MICROFINANCE BANK	D96	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
171	FCMB MFB	F38	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
172	FEDERAL POLYTECHNIC NEKEDE MICROFINANCE BANK	F37	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
173	FIDFUND MICROFINANCE BANK	568	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
174	FINCA MICROFINANCE BANK	C36	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
175	FIRMUS MICROFINANCE BANK	676	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
176	FIRST ALLY MFB	592	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
177	FLEXI MFB	H15	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
178	FOCUS MFB	F79	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
179	FORTRESS MICROFINANCE BANK	D53	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
180	FUD MFB	A61	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
181	GABASAWA MICROFINANCE BANK	894	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
182	GARUN MALLAM MFB	F72	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
183	GIDAUNIYAR ALHERI MICROFINANCE BANK	902	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
184	GIREI MICROFINANCE BANK	703	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
185	GLOBAL INITIATIVE MICROFINANCE BANK	884	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
186	GLORY MICROFIANCE BANK	A74	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
187	GOLDMAN MICROFINANCE BANK LIMITED	078	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
188	GOMBE MICROFINANCE BANK LIMITED	F07	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
189	GOOD SHEPHERD MICROFINANCE BANK	F46	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
190	GOODNEWS MICROFINANCE	C85	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
191	GOSIFECHUKWU MFB	F60	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
192	GRANTS MICROFINANCE BANK	F36	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
193	GREENACRES MICROFINANCE BANK	F11	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
194	GREENVILLE MICROFINANCE BANK	A77	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
195	GROOMING MICROFINANCE BANK	A78	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
196	GTI MICROFINANCE BANK	A79	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
197	GWONG MICROFINANCE BANK	F31	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
198	HALO MICROFINANCE BANK	D19	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
199	HILLPOST MFB	E40	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
200	IBANK MICROFINANCE BANK	779	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
201	IBETO MICROFINANCE BANK	D75	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
202	IBOLO MICROFINANCE BANK	D24	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
203	IBU-AJE MICROFINANCE BANK	D51	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
204	IC-GLOBAL MFB	D33	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
205	IHIALA MFB	F95	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
206	IJARE MFB	D78	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
207	IKENNE MICROFINANCE BANK	A86	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
208	IKERE MFB	E73	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
209	IKIRE MICROFINANCE BANK	A87	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
210	IKOYI ILE MICROFINANCE BANK	F56	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
211	ILARO POLY MICROFINANCE BANK	C94	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
212	ILE-OLUJI MFB	F93	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
213	ILISAN MFB	F77	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
214	ILORA MICROFINANCE	F10	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
215	IMSU MICROFINANCE BANK	F40	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
216	INDULGE MFB	E53	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
217	INSIGHT MFB	F68	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
218	ISALE OYO MICROFINANCE BANK	A93	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
219	ISLAND MICROFINANCE BANK	867	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
220	JESSEFIELD MICROFINANCE	D92	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
221	KADUPE MICROFINANCE BANK	F34	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
222	KANOPOLY MICROFINANCE BANK LIMITED	971	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
223	KATAGUM MFB	D84	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
224	KATSU MFB	E48	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
225	KAYI MICROFINANCE BANK	F53	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
226	KINGDOM COLLEGE MICROFINANCE BANK	D52	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
227	KKU MICROFINANCE BANK	899	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
228	KOLOMONI MICROFINANCE BANK	737	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
229	KONTAGORA MICROFINANCE BANK	A97	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
230	KOPO KOPE MICROFINANCE BANK	910	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
231	KREDI MONEY MICROFINANCE BANK LTD	333	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
232	LA FAYETTE MICROFINANCE BANK	594	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
233	LAPO MICROFINANCE BANK	B01	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
234	LAWYERS MFB	F94	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
235	LEADCITY MICROFINANCE BANK	F17	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
236	LEGEND MICROFINANCE BANK	B03	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
237	LETSHEGO MFB	216	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
238	LIGHTWAY MFB	E54	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
239	LINKS MICROFINANCE BANK	699	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
240	LOBREM MICROFINANCE BANK	D21	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
241	LOMA MFB	903	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
242	MAAL MFB	E38	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
243	MAB ALLIANZ MICROFINANCE BANK	900	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
244	MABINAS MICROFINANCE BANK	879	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
245	MACROD MICROFINANCE BANK LIMITED	906	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
246	MADOBI MICROFINANCE BANK	893	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
247	MAESTRO MFB	E21	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
248	MANNY MICROFINANCE BANK	C86	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
249	MAYFAIR MICROFINANCE BANK	B09	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
250	MEDEF MICROFINANCE BANK	962	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
251	MEGA MFB	H02	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
252	MEGAPRAISE MICROFINANCE BANK	E44	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
253	MGBIDI MICROFINANCE BANK	D28	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
254	MICHAEL OKPARA UNIAGRIC MICROFINANCE BANK	F23	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
255	MICROVIS MICROFINANCE BANK	B12	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
256	MIDLAND MICROFINANCE BANK	766	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
257	MIMO (MKUDI)	B94	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
258	MINJIBIR MICROFINANCE BANK	882	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
259	MINT-FINEX MFB	B13	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
260	MKOBO MFB	826	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
261	MOLUSI MICROFINANCE BANK	B14	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
262	MONEYFIELD MICROFINANCE BANK	A39	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
263	MONEYTRONICS MFB	E99	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
264	MONIEPOINT MICROFINANCE BANK	C39	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
265	MOREMONEE MICROFINANCE BANK LIMITED	F62	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
266	MUTUAL BENEFITS MICROFINANCE BANK	B17	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
267	MUTUAL TRUST MICROFINANCE BANK	B18	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
268	NAGARTA MICROFINANCE BANK	598	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
269	NASARAWA MICROFINANCE BANK	807	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
270	NDDC MICROFINANCE BANK	F47	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
271	NEPTUNE MICROFINANCE BANK	B21	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
272	NET MFB	F58	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
273	NEXTON MICROFINANCE BANK	E79	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
274	NIRSAL MICROFINANCE BANK	B26	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
275	NOMASE MFB	E20	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
276	NOMBANK MFB	953	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
277	NOUN MFB	E89	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
278	NOVA BANK	561	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
279	NPF MICROFINANCE BANK	B28	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
280	NSEHE MICROFINANCE BANK	888	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
281	NUGGETS MFB	F69	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
282	NUMO MICORFINANCE BANK	786	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
283	NURTURE MICROFINANCE BANK	660	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
284	NWANNEGADI MICROFINANCE BANK	D86	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
285	OAKLAND MFB	743	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
286	OBELEDU MFB	E33	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
287	OBOLLO MFB	E81	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
288	ODOAKPU MICROFINANCE BANK LIMITED	F19	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
289	OGBERURU MFB	E18	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
290	OHHA MICROFINANCE BANK	887	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
291	OK MICROFINANCE BANK	C98	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
292	OKENGWE MICROFINANCE BANK	F14	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
293	OKO MFB	E32	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
294	OKWO-OHA MFB	E36	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
295	OLD SHOREHAM MFB	690	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
296	OLIVE MFB	F71	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
297	OLOFIN-OWENA MICROFINANCE BANK	D61	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
298	OLUCHUKWU MICROFINANCE BANK	D60	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
299	OMAK MFB	F76	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
300	OSANTA MFB	E28	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
301	OSOMHE MFB	D98	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
302	OSPOLY MICROFINANCE BANK	F44	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
303	OURS MFB	E70	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
304	OYAN MICROFINANCE BANK	881	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
305	PAGE MFBANK	B35	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
306	PARKWAY	D89	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
307	PATHFINDER MICROFINANCE BANK LIMITED	F51	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
308	PEACE MICROFINANCE BANK	C40	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
309	PECANTRUST MICROFINANCE BANK	B37	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
310	PENIEL MICROFINANCE BANK	D90	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
311	PENNYWISE MFB	B38	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
312	PETTYSAVE MFB	E50	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
313	POINTONE MFB	E30	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
314	POLYBADAN MICROFINANCE BANK	809	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
315	PREEMINENT MICROFINANCE BANK	D83	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
316	PRESTIGE MICROFINANCE BANK	B43	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
317	PRISCO MICROFINANCE BANK	D56	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
318	PRISTINE DIVITIS MICROFINANCE BANK	752	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
319	PROSPECTS MFB	F61	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
320	PROSPERITY MICROFINANCE BANK	F06	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
321	PRUDENT MICROFINANCE BANK	F64	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
322	PURPLEMONEY MFB	B44	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
323	PYRAMID MICROFINANCE BANK	F22	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
324	RAYYAN MICROFINANCE BANK	956	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
325	REFUGE MICROFINANCE BANK	B47	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
326	REHOBOTH MICROFINANCE BANK	707	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
327	RELIANCE MICROFINANCE BANK	B49	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
328	RENMONEY MICROFINANCE BANK	B50	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
329	REPHIDIM MICROFINANCE BANK	B51	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
330	RETRUST MFB	E42	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
331	REVELATION MICROFINANCE BANK	F32	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
332	REX MICROFINANCE BANK	D71	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
333	RIC MFB	F92	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
334	RICHWAY MICROFINANCE BANK	B52	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
335	RIGO MICROFINANCE BANK	720	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
336	RIMA MICROFINANCE BANK	D73	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
337	ROYAL BLUE MICROFINANCE BANK	F21	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
338	ROYAL EXCHANGE MICROFINANCE BANK	B53	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
339	RSU MICROFINANCE BANK	D23	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
340	RUN MFB	E49	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
341	SABI MFB	E11	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
342	SAFE HAVEN MICROFINANCE BANK	B54	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
343	SHEPHERD TRUST MICROFINANCE BANK	C41	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
344	SINCERE MICROFINANCE BANK	D88	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
345	SOROMAN MICROFINANCE BANK	E51	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
346	SOURCE MICROFINANCE BANK	F04	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
347	SPARKLE	B59	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
348	SPECTRUM MICROFINANCE BANK	D76	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
349	STANDARD MICROFINANCE BANK	709	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
350	SUMMIT BANK	H06	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
351	SUNBEAM MICROFINANCE BANK	700	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
352	SUNTOP MICROFINANCE BANK	F08	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
353	SURE ANCHOR MFB	D77	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
354	SWIFT TRUST MFB	E39	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
355	TANGALE MICROFINANCE BANK	F03	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
356	TASUED MICROFINANCE BANK	966	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
357	TATUM BANK	E96	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
358	TELLERONE MFB	E91	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
359	TENN MFB	F91	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
360	THE MILLENNIUM MF	F85	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
361	THINK FINANCE MICROFINANCE BANK	677	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
362	TOFA MFB	F86	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
363	TOPRATE MICROFINANCE BANK	E83	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
364	TRANSPAY MFB	F82	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
365	TREASURES MICROFINANCE BANK	F35	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
366	TRUSTBANC J6 MICROFINANCE BANK LIMITED	569	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
367	U AND C MICROFINANCE BANK	789	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
368	UBJ MFB	E35	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
369	UCEE MFB	F80	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
370	UGA MICROFINANCE BANK	E78	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
371	UKPOR MFB	E95	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
372	ULTIMATE MICROFINANCEBANK	E77	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
373	UMMAH MICROFINANCE BANK	961	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
374	UMUCHINEMERE PROCREDIT MICROFINANCE BANK	F29	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
375	UMUCHUKWU MICROFINANCE BANK	F15	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
376	UMUNRI MFB	E67	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
377	UMUOJI MFB	E88	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
378	UNAAB MICROFINANCE BANK	B66	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
379	UNIFUND MICROFINANCE BANK LIMITED	F01	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
380	UNILAG MICROFINANCE BANK	728	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
381	UNILORIN MFB	F75	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
382	UNIMAID MICROFINANCE BANK	705	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
383	UNIUYO MICROFINANCE BANK	D95	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
384	URE MICROFINANCE BANK	F65	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
385	UVUOMA MFB	E37	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
386	UZONDU MICROFINANCE BANK	892	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
387	VFD MICROFINANCE BANK	B69	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
388	VICTORY MFB	H03	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
389	VISTA MICROFINANCE BANK	E82	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
390	WALLET MFB	E66	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
391	WESLEY MFB	F70	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
392	WESTON-CHARIS MFB	E19	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
393	WRA MFB	F73	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
394	XPRESS WALLET	F09	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
395	YCT MICROFINANCE BANK	D63	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
396	YOBE MICROFINANCE BANK	F88	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
397	ZIKORA MICROFINANCE BANK	D42	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
398	ZITRA MFB	F98	\N	\N	MICROFINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
399	ABBEY MORTGAGE BANK	A04	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
400	ADAMAWA MORTGAGE BANK	H04	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
401	AKWA SAVINGS AND LOANS LIMITED	C73	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
402	ASO SAVINGS AND LOANS	785	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
403	BRENT MORTGAGE BANK	615	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
404	CITYCODE MORTGAGE BANK	F45	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
405	COOP MORTGAGE BANK	693	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
406	COOPFUND MFB	F90	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
407	FBN MORTGAGE BANK (FIRST TRUST MORTGAGE BANK)	A70	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
408	GATEWAY MORTGAGE BANK	A73	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
409	HAGGAI MORTGAGE BANK LIMITED	A81	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
410	HOMEBASE MORTGAGE BANK	C74	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
411	IMPERIAL HOMES MORTGAGE BANK	A89	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
412	INFINITY TRUST MORTGAGE BANK	A91	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
413	JIGAWA SAVINGS AND LOANS LIMITED	E12	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
415	LIVING TRUST MORTGAGE BANK	C38	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
416	MUTUAL ALLIANCE MORTGAGE BANK	F59	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
417	STB MORTGAGE BANK	C76	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
418	TRUSTBOND MORTGAGE(FIRST TRUST MORTGAGE)	523	\N	\N	MORTGAGE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
419	78 FINANCE COMPANY LIMITED	F39	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
420	BRANCH INTERNATIONAL FINANCE COMPANY LIMITED	C78	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
421	CARDINALSTONE FINANCE	890	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
422	CENTRUM FINANCE	E34	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
423	CRYSTAL FINANCE COMPANY LIMITED	E10	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
424	DIGNITY FINANCE AND INVESTMENT LIMITED	963	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
425	E-FINANCE	895	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
426	ENCO FINANCE COMPANY LTD	972	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
427	EVIB FINANCE	E71	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
428	FIRST MARINA TRUST FINANCE	E92	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
429	GADOL FINANCE	E68	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
430	LAGOS BUILDING INVESTMENT COMPANY	C25	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
431	LUKEFIELD FINANCE COMPANY LIMITED	897	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
432	PODER FINANCE	F50	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
433	SCIART FINANCE	E86	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
434	SIMPLE FINANCE LIMITED	830	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
435	SIMPLIFY SYNERG	F78	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
436	SPRING SKY FINANCE	E80	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
437	TEKLA FACTORING AND FINANCE LIMITED	968	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
438	THE BROOK FINANCE LIMITED	E29	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
439	TRINITY FINANCIAL	957	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
440	TRIVES FINANCE COMPANY LTD	F48	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
441	UNLIMINT NIGERIA LIMITED	E46	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
442	VALE FINANCE LIMITED	F26	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
443	WHITECRUST FINANCE	E93	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
444	ZEDVANCE FINANCE LIMITED	F96	\N	\N	FINANCE	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
445	ACCESS YELLO & BETA	B77	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
446	BETASTACK TECHNOLOGIES	H07	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
447	CHAMS MOBILE	B78	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
448	EARTHOLEUM	626	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
449	E-TRANZACT	317	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
450	FETS	B85	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
451	FORTIS MOBILE	B88	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
452	HEDONMARK MOBILE	B91	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
453	NOWNOW DIGITAL SYSTEMS	997	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
454	PARRALLLLEX	526	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
455	PAYATTITUDE ONLINE	C02	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
456	READYCASH (PARKWAY)	C04	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
457	STANBIC IBTC @EASE WALLET	C05	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
458	TANGERINE MONEY	C82	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
459	TEASY MOBILE	C07	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
460	VTNETWORK	C08	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
461	ZENITH EAZY WALLET	F28	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
462	ZENITH MOBILE	C10	\N	\N	FINTECH	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
463	AFRIBANK NIGERIA PLC	014	\N	\N	COMMERCIAL	INACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
464	ENTERPRISE BANK LIMITED	084	\N	\N	COMMERCIAL	INACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
465	EQUITORIAL TRUST BANK PLC	040	\N	\N	COMMERCIAL	INACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
466	FIRST INLAND BANK PLC	085	\N	\N	COMMERCIAL	INACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
467	OCEANIC BANK NIGERIA PLC	056	\N	\N	COMMERCIAL	INACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
468	NIBSS TEST BANK	T39	\N	\N	TEST	ACTIVE	2025-10-02 21:16:41.663774	2025-10-02 21:16:41.663774	\N
469	Firstmidas Microfinance Bank Limited	513	\N	\N	Microfinance Bank	ACTIVE	2025-10-03 11:13:52.918831	2025-10-03 11:13:52.918831	51333
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.notification_logs (id, tenant_id, user_id, notification_id, channel, status, provider, provider_response, cost, delivery_time, error_code, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.notification_preferences (id, tenant_id, user_id, transfer_initiated, transfer_completed, transfer_failed, receipt_generated, security_alerts, promotional_offers, quiet_hours, max_daily_notifications, timezone, language, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_statistics; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.notification_statistics (id, tenant_id, date, channel, event_type, sent_count, delivered_count, failed_count, opened_count, clicked_count, total_cost, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.notification_templates (id, tenant_id, event_type, channel, language, subject, title, body, html_body, variables, is_active, is_default, created_by, created_at, updated_at) FROM stdin;
68730ca3-0507-48e5-a6a6-a1a05368b00d	00000000-0000-0000-0000-000000000000	transfer_initiated	push	en	\N	Transfer Initiated	Your transfer of {{amount}} to {{recipient}} has been initiated. Reference: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
5a51d90d-1d2f-4489-8352-4c8b8a25d189	00000000-0000-0000-0000-000000000000	transfer_completed	push	en	\N	Transfer Completed	Your transfer of {{amount}} to {{recipient}} has been completed successfully. Reference: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
74eb7077-4d61-4a9d-89c3-7f147564ff04	00000000-0000-0000-0000-000000000000	transfer_failed	push	en	\N	Transfer Failed	Your transfer of {{amount}} to {{recipient}} has failed. Amount has been reversed. Reference: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
c7557c5b-3e36-4005-95da-fa9b8670cd27	00000000-0000-0000-0000-000000000000	transfer_initiated	sms	en	\N	Transfer Initiated	FMFB: Your transfer of {{amount}} to {{recipient}} has been initiated. Ref: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
f813f59d-28fe-458f-b2eb-1bc00cba0724	00000000-0000-0000-0000-000000000000	transfer_completed	sms	en	\N	Transfer Completed	FMFB: Your transfer of {{amount}} to {{recipient}} completed successfully. Ref: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
02f80090-0339-4087-b940-df4dfdd36f25	00000000-0000-0000-0000-000000000000	transfer_failed	sms	en	\N	Transfer Failed	FMFB: Your transfer of {{amount}} failed. Amount reversed to your account. Ref: {{reference}}	\N	{amount,recipient,reference}	t	f	\N	2025-09-26 15:09:32.323672	2025-09-26 15:09:32.323672
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.notifications (id, tenant_id, user_id, type, priority, title, body, data, channels, status, sent_at, error_message, retry_count, max_retries, scheduled_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.platform_config (id, config_key, config_value, config_type, description, is_sensitive, environment, version, is_active, effective_from, effective_until, updated_at, updated_by) FROM stdin;
68ee86db-5e5f-4b99-9279-393121f18541	ai_models_config	{"conversational": {"max_tokens": 2000, "temperature": 0.7, "default_model": "gpt-4", "nigerian_model": "nigerian_nlp_v1.2", "supported_languages": ["en", "ha", "yo", "ig", "pcm"]}, "fraud_detection": {"batch_size": 32, "default_model": "nigerian_fraud_v2.1", "fallback_model": "global_fraud_v1.8", "max_latency_ms": 500, "confidence_threshold": 0.85}, "voice_processing": {"speech_to_text": "whisper-large-v2", "text_to_speech": "nigerian_tts_v1.0", "noise_reduction": true, "accent_adaptation": true}}	ai	AI models configuration and parameters	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
cc39411e-cd98-4211-b9fc-4c8c51325900	payment_providers_config	{"nibss": {"name": "Nigeria Inter-Bank Settlement System", "timeout_ms": 30000, "api_version": "v1", "sandbox_url": "https://sandbox.nibss-plc.com.ng/api/v1", "production_url": "https://api.nibss-plc.com.ng/v1", "retry_attempts": 3}, "interswitch": {"name": "Interswitch", "timeout_ms": 25000, "api_version": "v1", "sandbox_url": "https://sandbox.interswitchng.com/api/v1", "production_url": "https://api.interswitchng.com/v1", "retry_attempts": 3}}	payment	Payment providers configuration	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
ebb30023-08fa-453b-9fac-c17907b9d44b	security_defaults	{"encryption": {"algorithm": "AES-256-GCM", "key_rotation_days": 90}, "jwt_expiry": 3600, "password_policy": {"min_length": 8, "max_age_days": 90, "require_numbers": true, "require_special": true, "require_lowercase": true, "require_uppercase": true}, "lockout_duration": 900, "max_login_attempts": 5, "refresh_token_expiry": 604800}	security	Default security settings	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
f6f0d0d3-e52b-4153-86fd-86e27ed8007b	feature_flags_global	{"qr_payments": true, "ai_assistant": true, "offline_mode": true, "biometric_auth": true, "multi_language": true, "voice_commands": true, "fraud_detection": true, "bulk_transactions": false, "advanced_analytics": true, "real_time_notifications": true}	feature	Global feature flags	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
66275e6e-a625-46ba-ae0f-6e432b2fcb1d	rate_limits	{"basic": {"burst_size": 150, "requests_per_minute": 100, "ai_requests_per_hour": 500}, "premium": {"burst_size": 750, "requests_per_minute": 500, "ai_requests_per_hour": 2000}, "enterprise": {"burst_size": 1500, "requests_per_minute": 1000, "ai_requests_per_hour": 10000}}	system	Rate limiting configuration by tenant tier	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
ea40249f-bd12-4e7f-a230-5f664532fafd	nigerian_banking_config	{"holidays": ["2025-01-01", "2025-03-31", "2025-04-01", "2025-05-01", "2025-06-12", "2025-10-01", "2025-12-25", "2025-12-26"], "regulatory": {"cbn_code": "CBN", "kyc_requirements": ["bvn", "nin", "address_verification"], "daily_cumulative_limit": 20000000, "max_single_transaction": 5000000}, "business_hours": {"end_time": "16:00", "timezone": "Africa/Lagos", "start_time": "08:00", "banking_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "supported_banks": [{"code": "011", "name": "Bank Alpha", "swift": "BKALNGNP"}, {"code": "058", "name": "Guaranty Trust Bank", "swift": "GTBINGLA"}, {"code": "057", "name": "Bank Beta", "swift": "BKBETNGLA"}, {"code": "033", "name": "United Bank for Africa", "swift": "UNAFNGLA"}, {"code": "214", "name": "Bank Gamma", "swift": "BKGAMNGNP"}]}	system	Nigerian banking system configuration	f	all	1	t	2025-09-04 19:44:07.277726	\N	2025-09-04 19:44:07.277726	\N
\.


--
-- Data for Name: rbac_permissions; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.rbac_permissions (id, code, name, description, category, resource, action, is_system_permission, cbn_regulation_ref, nibss_requirement, created_at, updated_at) FROM stdin;
138893cb-ec9c-4a4f-840d-b104a07bf5cb	internal_transfers	Internal Transfers	Transfer funds within same bank	transfers	transfers	create	f	CBN/BSD/2020/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
1fcdd80c-5ab4-4309-8374-e06e55f57f2b	external_transfers	External Transfers	Transfer funds to other banks	transfers	transfers	create	f	CBN/BSD/2020/001	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
f0a996a8-4824-460f-8ea4-1a664882cd61	bulk_transfers	Bulk Transfers	Process multiple transfers at once	transfers	transfers	create	f	CBN/BSD/2020/002	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
de8e6c97-8fe4-4b81-92fb-6afd2cc598c1	international_transfers	International Transfers	Cross-border money transfers	transfers	transfers	create	f	CBN/TED/2019/003	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
e2c1cc64-fb45-4db9-97b5-83741e665a0b	transfer_approval	Transfer Approval	Approve high-value transfers	transfers	transfers	approve	f	CBN/BSD/2020/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
f7cf9604-5f62-40e1-80af-4ea1d23d67a1	transfer_reversal	Transfer Reversal	Reverse completed transfers	transfers	transfers	execute	f	CBN/BSD/2020/004	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
e3145c3b-7902-43bb-abbb-c1a28050d3b4	view_transfer_history	View Transfer History	Access transfer transaction history	transfers	transfers	read	f	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
3e2b7bc0-d182-4dd4-b648-84e61aae758f	flexible_savings	Flexible Savings	Manage flexible savings accounts	savings	savings	create	f	CBN/BSD/2018/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
025df99f-7780-4118-b3df-ed80cb880a00	target_savings	Target Savings	Goal-based savings management	savings	savings	create	f	CBN/BSD/2018/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
e4a91eb0-9c06-4285-8909-a1edc4d3b7d5	group_savings	Group Savings	Cooperative savings management	savings	savings	create	f	CBN/BSD/2018/006	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
42bbe078-17f5-4e3a-a10e-42b9fb9548c8	locked_savings	Locked Savings	Fixed-term savings products	savings	savings	create	f	CBN/BSD/2018/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
7e93d389-414f-4447-862d-8160edc6357a	save_as_you_transact	Save as You Transact	Automatic micro-savings	savings	savings	create	f	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	savings_withdrawal	Savings Withdrawal	Process savings withdrawals	savings	savings	execute	f	CBN/BSD/2018/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
482429af-01a2-4219-b556-6b3e8bf81a02	savings_interest_calculation	Savings Interest Calculation	Calculate and apply interest	savings	savings	execute	f	CBN/BSD/2018/007	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
b520b1a5-9b8b-40b5-962d-f94f0c1a3279	personal_loans	Personal Loans	Individual loan products	loans	loans	create	f	CBN/CCD/2019/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
c4269378-0f43-4bde-816c-1c29f26d60d5	business_loans	Business Loans	Commercial loan products	loans	loans	create	f	CBN/CCD/2019/002	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
1164d3f2-78f5-405b-873e-d679ede0cff6	quick_loans	Quick Loans	Instant loan disbursement	loans	loans	create	f	CBN/CCD/2019/003	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
7fcf81f4-695c-4da2-9851-727ff3b9b210	loan_approval	Loan Approval	Approve loan applications	loans	loans	approve	f	CBN/CCD/2019/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
968016e6-db06-4162-9930-92ed614a1af2	loan_disbursement	Loan Disbursement	Disburse approved loans	loans	loans	execute	f	CBN/CCD/2019/004	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
bae28538-38eb-409a-ac2e-98ec5616cf25	loan_collection	Loan Collection	Manage loan repayments	loans	loans	execute	f	CBN/CCD/2019/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	bill_payments	Bill Payments	Utility and service bill payments	operations	bills	create	f	CBN/PSMD/2020/001	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
02a64972-a2d5-4aae-bd32-7bece5277932	kyc_management	KYC Management	Customer identity verification	operations	kyc	execute	f	CBN/AML/2020/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
d07bcee1-4cb5-4874-a36e-f3e22cd06965	transaction_monitoring	Transaction Monitoring	Monitor for suspicious activities	operations	transactions	read	t	CBN/AML/2020/002	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
10724507-8fdf-4027-8961-0a6b56877bb1	fraud_detection	Fraud Detection	Detect and flag fraudulent activities	operations	fraud	execute	t	CBN/AML/2020/003	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
41008226-9219-4a8f-9256-f0e8cc5ca809	customer_onboarding	Customer Onboarding	New customer registration	operations	customers	create	f	CBN/KYC/2020/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
ccd01816-991e-4d3b-9d93-ec6b397388bd	document_management	Document Management	Upload and manage customer documents	operations	documents	create	f	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
0b7dcbd9-f6b5-4f6a-840b-0583b9843863	user_management	User Management	Create and manage system users	management	users	create	f	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
64319b48-f6bc-4253-b5af-626e77f1d1cb	role_management	Role Management	Assign and modify user roles	management	roles	create	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
240de0a8-9480-493a-9fd3-386b0dd755d2	permission_management	Permission Management	Grant or revoke permissions	management	permissions	create	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
da75b893-f234-444e-ac11-d6cf51aabe89	branch_management	Branch Management	Manage branch operations	management	branches	create	f	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	audit_trail_access	Audit Trail Access	View system audit logs	management	audit	read	t	CBN/IT/2020/001	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
f90d6eba-0099-45a7-9b65-1058bf625459	reporting_access	Reporting Access	Generate and view reports	management	reports	read	f	CBN/BSD/2020/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
0a4f21d5-3f47-4c15-912c-363726b05885	financial_reporting	Financial Reporting	Generate financial reports	management	reports	read	f	CBN/BSD/2020/006	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
26e76667-b79a-4fe2-b229-68e26e729f89	platform_administration	Platform Administration	Full platform control	platform	platform	execute	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
1166962d-e611-4d09-a0bd-6de6890e0aaf	tenant_management	Tenant Management	Create and manage tenants	platform	tenants	create	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
2f8801c2-3c98-4176-9a67-06ff20198560	system_configuration	System Configuration	Configure platform settings	platform	system	create	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
60a265a0-4d91-454e-a77a-bf21db598ef9	multi_tenant_reporting	Multi-Tenant Reporting	Cross-tenant analytics	platform	analytics	read	t	\N	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
db0b5c60-1987-4769-bf13-f32e917e9eac	nibss_integration	NIBSS Integration	Access NIBSS services	operations	nibss	execute	f	\N	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
14e38180-49ab-445d-bf6d-2b0d70b4cb24	rtgs_operations	RTGS Operations	Real-time gross settlement	operations	rtgs	execute	f	CBN/PSMD/2020/002	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
919b1f68-55c1-4497-b9e6-b69dcc5b00cd	nip_transactions	NIP Transactions	Nigeria Instant Payment system	operations	nip	execute	f	CBN/PSMD/2020/003	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
3377171f-cb47-442c-994c-906e3fb69c1e	bvn_verification	BVN Verification	Bank verification number checks	operations	bvn	execute	f	CBN/PSMD/2020/004	t	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
6cf427ba-adab-4a0a-8432-2bfe237392e5	cbn_reporting	CBN Reporting	Regulatory reporting to CBN	management	cbr_reports	create	f	CBN/BSD/2020/007	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
5879ebd2-c2af-4c10-99f4-54af16b6ed8e	fx_operations	Foreign Exchange Operations	Foreign currency transactions	operations	fx	execute	f	CBN/TED/2019/004	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
3087add7-90f3-4381-b5e9-5ab739c34975	cash_management	Cash Management	Physical cash handling	operations	cash	execute	f	CBN/BSD/2019/008	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
efab47c1-8594-4a84-afbc-abade5ffd6ad	atm_management	ATM Management	ATM operations and maintenance	operations	atm	execute	f	CBN/PSMD/2019/005	f	2025-09-25 21:37:11.593502	2025-09-25 21:37:11.593502
6b12a124-9a49-43b4-ad63-ebf86b586037	platform_overview_dashboard	Platform Overview Dashboard	Access to platform-wide overview dashboard	management	dashboard	read	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
8929a57b-f3fd-4c98-af63-ac998d1e8101	bank_performance_dashboard	Bank Performance Dashboard	View bank performance metrics and analytics	management	dashboard	read	f	CBN/BSD/2020/006	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
84bb70d9-e29b-46c4-b704-bbf73bcb81f0	branch_performance_analytics	Branch Performance Analytics	Analyze branch-level performance metrics	management	analytics	read	f	CBN/BSD/2020/006	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	customer_analytics_dashboard	Customer Analytics Dashboard	View customer behavior and demographics analytics	management	analytics	read	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	financial_reporting_dashboard	Financial Reporting Dashboard	Access financial reporting and dashboard features	management	reports	read	f	CBN/BSD/2020/006	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
22b1d15a-9d2b-4930-90ec-c6d8f2efef24	create_bank_users	Create Bank Users	Create new internal bank users	management	users	create	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
bcabec8b-fab8-4c3b-ad33-2e898353c4db	modify_user_roles	Modify User Roles	Change user role assignments	management	users	execute	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	deactivate_users	Deactivate Users	Suspend or deactivate user accounts	management	users	execute	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
f067355c-02ed-44f5-831b-43e21a51b0b8	view_user_activity	View User Activity	Monitor user login and activity logs	management	audit	read	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	reset_user_passwords	Reset User Passwords	Reset passwords for other users	management	users	execute	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
b088fae8-f4f3-406b-a0b4-85290183127a	transfer_limits_configuration	Transfer Limits Configuration	Configure transaction and transfer limits	operations	transfers	create	f	CBN/BSD/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
93a87ed0-3727-4e6a-aebb-d3869540d21b	transfer_approval_workflow	Transfer Approval Workflow	Participate in multi-level transfer approvals	operations	transfers	approve	f	CBN/BSD/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
a36437dc-580e-47b1-8c63-badc80aa6d2d	view_reversal_requests	View Reversal Requests	View transaction reversal requests	operations	reversals	read	f	CBN/BSD/2020/004	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
1ad328bc-a842-420d-b342-73524905da1c	create_reversal_request	Create Reversal Request	Initiate transaction reversal requests	operations	reversals	create	f	CBN/BSD/2020/004	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	approve_reversal_level1	Approve Reversal (Level 1)	First level approval for transaction reversals	operations	reversals	approve	f	CBN/BSD/2020/004	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
413ec926-cbc1-4f9b-a728-6b711ceba516	approve_reversal_level2	Approve Reversal (Level 2)	Second level approval for transaction reversals	operations	reversals	approve	f	CBN/BSD/2020/004	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
798c3dff-c458-4513-afbb-83f241033832	execute_final_reversal	Execute Final Reversal	Execute approved transaction reversals	operations	reversals	execute	f	CBN/BSD/2020/004	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
90973b1a-1af0-4e30-8af8-683d30ad1797	view_savings_accounts	View Savings Accounts	View customer savings account details	savings	accounts	read	f	CBN/BSD/2018/005	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
56c195ca-4566-41e3-989a-8f568bdd640f	create_savings_account	Create Savings Account	Open new savings accounts for customers	savings	accounts	create	f	CBN/BSD/2018/005	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
8e303b4b-2056-430a-9932-f0733563c571	modify_savings_terms	Modify Savings Terms	Change savings account terms and conditions	savings	accounts	execute	f	CBN/BSD/2018/005	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
998839ac-1533-454c-9317-8379b05b2d87	configure_interest_rates	Configure Interest Rates	Set and modify interest rates for savings products	savings	configuration	create	f	CBN/BSD/2018/007	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	close_suspend_accounts	Close/Suspend Accounts	Close or suspend customer accounts	operations	accounts	execute	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
28026104-a008-4323-8c24-e8b5d1739dce	account_relationship_mapping	Account Relationship Mapping	Manage customer account relationships	operations	accounts	execute	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
e395c321-d203-434f-bbcb-40e0fd48c0e2	view_kyc_documents	View KYC Documents	Access customer KYC documentation	operations	kyc	read	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
57187619-bd17-40ae-ba79-99f3fcfd33e1	upload_kyc_documents	Upload KYC Documents	Upload customer identification documents	operations	kyc	create	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
a1652a23-34e8-4fef-ae34-5005e7f8a494	verify_kyc_documents	Verify KYC Documents	Verify authenticity of customer documents	operations	kyc	execute	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
d9156cea-2613-4b8f-a44e-73b28d5bf1ef	approve_customer_onboarding	Approve Customer Onboarding	Approve new customer account opening	operations	customers	approve	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
f34038fa-a483-4341-984f-75f565bb4315	kyc_compliance_reporting	KYC Compliance Reporting	Generate KYC compliance reports	management	compliance	read	f	CBN/KYC/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
edbe9ab8-50f4-4aa0-996c-5e043a2eb5b7	configure_biller_integrations	Configure Biller Integrations	Setup and manage biller service integrations	operations	billers	create	f	CBN/PSMD/2020/001	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	bill_payment_analytics	Bill Payment Analytics	Analyze bill payment patterns and metrics	operations	analytics	read	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	recurring_payment_setup	Recurring Payment Setup	Configure recurring bill payments	operations	bills	create	f	CBN/PSMD/2020/001	t	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	generate_compliance_reports	Generate Compliance Reports	Create regulatory compliance reports	management	compliance	create	f	CBN/BSD/2020/007	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
e447c976-03f1-4d98-b481-6a29f18bdeb3	bsa_aml_monitoring	BSA/AML Monitoring	Monitor for suspicious activities and AML compliance	operations	compliance	execute	t	CBN/AML/2020/002	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
232b533b-fd5c-4e99-ad25-b613fde533c1	regulatory_submissions	Regulatory Submissions	Submit reports to regulatory bodies (CBN)	management	compliance	create	f	CBN/BSD/2020/007	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
56d743af-1ddf-4802-b360-d503d4c70617	risk_assessment_tools	Risk Assessment Tools	Access and use risk assessment tools	operations	risk	execute	f	CBN/AML/2020/003	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
08a36eac-bd37-4e6a-8f47-6461b7672734	configure_bank_settings	Configure Bank Settings	Configure core banking system settings	management	system	create	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
90c96a7d-7049-4b70-8d60-2af92d3029ec	manage_transaction_limits	Manage Transaction Limits	Set and modify transaction limits	management	limits	create	f	CBN/BSD/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
7c9b3bc2-66b8-4cfd-ae84-95762298d918	system_backup_recovery	System Backup & Recovery	Perform system backup and recovery operations	platform	system	execute	t	CBN/IT/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	database_administration	Database Administration	Direct database administration access	platform	database	execute	t	CBN/IT/2020/001	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	integration_management	Integration Management	Manage third-party service integrations	platform	integrations	create	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
10d1e4d6-ce02-43c0-b78c-b648b598c695	access_ai_chat	Access AI Chat	Use AI assistant chat functionality	operations	ai	execute	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	ai_analytics_insights	AI Analytics Insights	Access AI-powered analytics and insights	management	ai	read	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
7101b2c1-797d-4318-a277-e51d280e1f6e	ai_powered_recommendations	AI-Powered Recommendations	Receive AI-generated recommendations	operations	ai	read	f	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
c320e930-8a64-40e2-81c5-9e11015b7621	configure_ai_settings	Configure AI Settings	Configure AI assistant parameters	management	ai	create	t	\N	f	2025-09-25 21:52:16.392515	2025-09-25 21:52:16.392515
\.


--
-- Data for Name: rbac_role_permissions; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.rbac_role_permissions (id, role_id, permission_id, permission_level, conditions, created_at) FROM stdin;
d7dde8da-b190-4b9d-90af-34fc23eb00bf	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	138893cb-ec9c-4a4f-840d-b104a07bf5cb	full	\N	2025-09-25 21:37:11.595047
a4e2ec52-08de-4f7d-816a-18663a87d042	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	1fcdd80c-5ab4-4309-8374-e06e55f57f2b	full	\N	2025-09-25 21:37:11.595047
e185d0a4-780a-41ac-a224-c07466d0b8bd	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f0a996a8-4824-460f-8ea4-1a664882cd61	full	\N	2025-09-25 21:37:11.595047
8bb35a5e-e5c3-4b6f-aad0-7b12f34be64b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	de8e6c97-8fe4-4b81-92fb-6afd2cc598c1	full	\N	2025-09-25 21:37:11.595047
4986be73-5031-43a1-8e4f-6e941f2f6e94	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e2c1cc64-fb45-4db9-97b5-83741e665a0b	full	\N	2025-09-25 21:37:11.595047
ab7d6555-c27b-48e0-a043-70bb504e9696	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f7cf9604-5f62-40e1-80af-4ea1d23d67a1	full	\N	2025-09-25 21:37:11.595047
0b1a5f6c-4a90-4336-97a2-7e1f5c92ab41	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e3145c3b-7902-43bb-abbb-c1a28050d3b4	full	\N	2025-09-25 21:37:11.595047
a04d1a49-4c32-43ff-9ba5-9312df12a335	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	3e2b7bc0-d182-4dd4-b648-84e61aae758f	full	\N	2025-09-25 21:37:11.595047
0b929dcc-194f-4a77-b070-48e92099be1b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	025df99f-7780-4118-b3df-ed80cb880a00	full	\N	2025-09-25 21:37:11.595047
cb154f68-e18f-405f-8ade-8865296faf47	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e4a91eb0-9c06-4285-8909-a1edc4d3b7d5	full	\N	2025-09-25 21:37:11.595047
1cc090a3-a225-4e33-a046-dda1c977caf0	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	42bbe078-17f5-4e3a-a10e-42b9fb9548c8	full	\N	2025-09-25 21:37:11.595047
7b033d06-e65d-4406-9cfe-b22c496ebcd5	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	7e93d389-414f-4447-862d-8160edc6357a	full	\N	2025-09-25 21:37:11.595047
ae8f4ab0-c823-49bd-9c67-35ad83cf281d	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	full	\N	2025-09-25 21:37:11.595047
c071651e-7224-40ce-9500-7b4eb5435b95	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	482429af-01a2-4219-b556-6b3e8bf81a02	full	\N	2025-09-25 21:37:11.595047
48e9741d-b1e6-4483-88b1-2bd7fc565c65	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	b520b1a5-9b8b-40b5-962d-f94f0c1a3279	full	\N	2025-09-25 21:37:11.595047
6eaba50a-9537-4671-941f-e5375ddac928	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	c4269378-0f43-4bde-816c-1c29f26d60d5	full	\N	2025-09-25 21:37:11.595047
8a6fe541-fb30-4ba3-b884-f90f8adf1f0a	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	1164d3f2-78f5-405b-873e-d679ede0cff6	full	\N	2025-09-25 21:37:11.595047
4771cfb2-383d-4463-a3bc-959b5bf040b0	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	7fcf81f4-695c-4da2-9851-727ff3b9b210	full	\N	2025-09-25 21:37:11.595047
62fe7d0d-c8a6-4fcc-8494-f176b0a0ee29	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	968016e6-db06-4162-9930-92ed614a1af2	full	\N	2025-09-25 21:37:11.595047
8df3367d-c8ef-4a62-9ec6-b1ee40c924ff	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	bae28538-38eb-409a-ac2e-98ec5616cf25	full	\N	2025-09-25 21:37:11.595047
5dd15ded-7c8b-43f7-8781-0dfb55155b07	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	full	\N	2025-09-25 21:37:11.595047
a9bfbd54-097f-4b08-8274-c8b220a19caf	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	02a64972-a2d5-4aae-bd32-7bece5277932	full	\N	2025-09-25 21:37:11.595047
6c038bdd-d660-4dc5-8b5b-b7ae00316d3b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	d07bcee1-4cb5-4874-a36e-f3e22cd06965	full	\N	2025-09-25 21:37:11.595047
bbe17a11-a791-4d98-bdd5-6d9e53eae952	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	10724507-8fdf-4027-8961-0a6b56877bb1	full	\N	2025-09-25 21:37:11.595047
340f9af3-bf1e-47ca-a911-0390c2911cb9	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	41008226-9219-4a8f-9256-f0e8cc5ca809	full	\N	2025-09-25 21:37:11.595047
e1d47e31-3d19-4f2f-ab73-290058c5af3d	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	ccd01816-991e-4d3b-9d93-ec6b397388bd	full	\N	2025-09-25 21:37:11.595047
300e4d2d-c1f1-471b-a063-1582573225d4	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	full	\N	2025-09-25 21:37:11.595047
cc0bd334-d8e9-4541-ac36-daad053c2d52	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	64319b48-f6bc-4253-b5af-626e77f1d1cb	full	\N	2025-09-25 21:37:11.595047
0d905952-81ac-477f-bab0-b2ad7138a82b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	240de0a8-9480-493a-9fd3-386b0dd755d2	full	\N	2025-09-25 21:37:11.595047
c177a3b9-a5a0-48ba-b2a8-48e9643d2085	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	da75b893-f234-444e-ac11-d6cf51aabe89	full	\N	2025-09-25 21:37:11.595047
6b3e848e-2599-458e-b2ad-1d9064fba6cc	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	full	\N	2025-09-25 21:37:11.595047
3bc898fd-8af9-4337-b874-0c8e8a5a5b46	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f90d6eba-0099-45a7-9b65-1058bf625459	full	\N	2025-09-25 21:37:11.595047
10dadb74-70a6-4b7f-b031-fa42704fbf30	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	0a4f21d5-3f47-4c15-912c-363726b05885	full	\N	2025-09-25 21:37:11.595047
63c2ea94-5c6d-42a3-8424-9c610e0015f0	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	26e76667-b79a-4fe2-b229-68e26e729f89	full	\N	2025-09-25 21:37:11.595047
8f933ac8-a3d2-4a2e-b862-009547dbbe42	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	1166962d-e611-4d09-a0bd-6de6890e0aaf	full	\N	2025-09-25 21:37:11.595047
b3cd931d-616f-4733-92be-04a717509a59	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	2f8801c2-3c98-4176-9a67-06ff20198560	full	\N	2025-09-25 21:37:11.595047
27b2925c-02fb-4f8e-9690-79a5ab776801	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	60a265a0-4d91-454e-a77a-bf21db598ef9	full	\N	2025-09-25 21:37:11.595047
28dec889-a8d6-4010-ba36-cec3781ca5b4	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	db0b5c60-1987-4769-bf13-f32e917e9eac	full	\N	2025-09-25 21:37:11.595047
d9fffa18-691f-4616-9bb1-078726818647	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	14e38180-49ab-445d-bf6d-2b0d70b4cb24	full	\N	2025-09-25 21:37:11.595047
2b13cd8d-9a0a-4ec4-ae54-2b46a544518f	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	919b1f68-55c1-4497-b9e6-b69dcc5b00cd	full	\N	2025-09-25 21:37:11.595047
be857b88-8099-4f3b-9153-7f92344dd264	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	3377171f-cb47-442c-994c-906e3fb69c1e	full	\N	2025-09-25 21:37:11.595047
e3e75b3a-4fc9-4dca-add6-772188982bbf	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	6cf427ba-adab-4a0a-8432-2bfe237392e5	full	\N	2025-09-25 21:37:11.595047
cfad089b-e8bd-4ee9-b422-787c591c4843	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	5879ebd2-c2af-4c10-99f4-54af16b6ed8e	full	\N	2025-09-25 21:37:11.595047
c71b2466-c284-4f4b-b2c7-a495269064ce	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	3087add7-90f3-4381-b5e9-5ab739c34975	full	\N	2025-09-25 21:37:11.595047
daccb1c8-3694-42a3-b2ca-d0482c56a347	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	efab47c1-8594-4a84-afbc-abade5ffd6ad	full	\N	2025-09-25 21:37:11.595047
42d685dd-7860-49db-a433-7fe464edd65b	94b16979-72b7-4be8-968d-892028b9a78c	138893cb-ec9c-4a4f-840d-b104a07bf5cb	full	\N	2025-09-25 21:37:11.597211
779884b5-a7b6-4316-8da1-b1917b0642a6	94b16979-72b7-4be8-968d-892028b9a78c	1fcdd80c-5ab4-4309-8374-e06e55f57f2b	full	\N	2025-09-25 21:37:11.597211
e28d6ce1-be27-48bd-b646-0f1c119aaa29	94b16979-72b7-4be8-968d-892028b9a78c	f0a996a8-4824-460f-8ea4-1a664882cd61	full	\N	2025-09-25 21:37:11.597211
baaef9c2-af41-4c30-b22f-403a0949a1a3	94b16979-72b7-4be8-968d-892028b9a78c	de8e6c97-8fe4-4b81-92fb-6afd2cc598c1	full	\N	2025-09-25 21:37:11.597211
9939b843-eaa4-4588-8a8c-2c89ffe43e4a	94b16979-72b7-4be8-968d-892028b9a78c	e2c1cc64-fb45-4db9-97b5-83741e665a0b	full	\N	2025-09-25 21:37:11.597211
342357fc-8a5a-4f6d-bd0c-88238cfc5150	94b16979-72b7-4be8-968d-892028b9a78c	f7cf9604-5f62-40e1-80af-4ea1d23d67a1	full	\N	2025-09-25 21:37:11.597211
6fa575f8-4e01-4012-99d6-06268617c31e	94b16979-72b7-4be8-968d-892028b9a78c	e3145c3b-7902-43bb-abbb-c1a28050d3b4	full	\N	2025-09-25 21:37:11.597211
8937134d-c207-4394-aec4-920166ccdcc5	94b16979-72b7-4be8-968d-892028b9a78c	3e2b7bc0-d182-4dd4-b648-84e61aae758f	full	\N	2025-09-25 21:37:11.597211
912387b2-1b51-4ab7-9bb6-38ad09d09c6b	94b16979-72b7-4be8-968d-892028b9a78c	025df99f-7780-4118-b3df-ed80cb880a00	full	\N	2025-09-25 21:37:11.597211
928112e1-cb41-4f7f-b804-fa5d046e89c8	94b16979-72b7-4be8-968d-892028b9a78c	e4a91eb0-9c06-4285-8909-a1edc4d3b7d5	full	\N	2025-09-25 21:37:11.597211
37a62030-9542-4a8f-a990-6e40ebceb969	94b16979-72b7-4be8-968d-892028b9a78c	42bbe078-17f5-4e3a-a10e-42b9fb9548c8	full	\N	2025-09-25 21:37:11.597211
cb231bf4-4601-425b-8fe0-e648419ef223	94b16979-72b7-4be8-968d-892028b9a78c	7e93d389-414f-4447-862d-8160edc6357a	full	\N	2025-09-25 21:37:11.597211
f0c13712-f951-432c-b87d-c98c63f9c84a	94b16979-72b7-4be8-968d-892028b9a78c	e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	full	\N	2025-09-25 21:37:11.597211
b147a394-87e6-458e-ae54-0c58da8295b3	94b16979-72b7-4be8-968d-892028b9a78c	482429af-01a2-4219-b556-6b3e8bf81a02	full	\N	2025-09-25 21:37:11.597211
9f24df2e-2104-4ffb-8ad4-217eefdf29c3	94b16979-72b7-4be8-968d-892028b9a78c	b520b1a5-9b8b-40b5-962d-f94f0c1a3279	full	\N	2025-09-25 21:37:11.597211
4d05fa65-bb0a-426f-967a-55c7389e83cd	94b16979-72b7-4be8-968d-892028b9a78c	c4269378-0f43-4bde-816c-1c29f26d60d5	full	\N	2025-09-25 21:37:11.597211
57dcade7-7a25-4a46-90f9-9b3aad30c9d7	94b16979-72b7-4be8-968d-892028b9a78c	1164d3f2-78f5-405b-873e-d679ede0cff6	full	\N	2025-09-25 21:37:11.597211
1737bbfa-3372-41ac-94dd-7f2a8d5b56d0	94b16979-72b7-4be8-968d-892028b9a78c	7fcf81f4-695c-4da2-9851-727ff3b9b210	full	\N	2025-09-25 21:37:11.597211
61e4aa4e-81cb-476a-befc-14a18081fe8c	94b16979-72b7-4be8-968d-892028b9a78c	968016e6-db06-4162-9930-92ed614a1af2	full	\N	2025-09-25 21:37:11.597211
8649457d-2ae1-4fd7-9fa3-f2d24ba5408a	94b16979-72b7-4be8-968d-892028b9a78c	bae28538-38eb-409a-ac2e-98ec5616cf25	full	\N	2025-09-25 21:37:11.597211
81b53f74-c0ba-4b05-9dcd-40aab7b79497	94b16979-72b7-4be8-968d-892028b9a78c	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	full	\N	2025-09-25 21:37:11.597211
e5fb0d79-aa2f-4f36-bfa8-aa999e7becce	94b16979-72b7-4be8-968d-892028b9a78c	02a64972-a2d5-4aae-bd32-7bece5277932	full	\N	2025-09-25 21:37:11.597211
46ec855f-c84c-4def-b977-904e7e2994bb	94b16979-72b7-4be8-968d-892028b9a78c	d07bcee1-4cb5-4874-a36e-f3e22cd06965	full	\N	2025-09-25 21:37:11.597211
5df896e0-2798-48e0-b693-8609fa15598a	94b16979-72b7-4be8-968d-892028b9a78c	10724507-8fdf-4027-8961-0a6b56877bb1	full	\N	2025-09-25 21:37:11.597211
425ea866-f061-4760-bb0c-8c1edc72e756	94b16979-72b7-4be8-968d-892028b9a78c	41008226-9219-4a8f-9256-f0e8cc5ca809	full	\N	2025-09-25 21:37:11.597211
bcb2485d-9005-4f9d-bf85-28059f4d7526	94b16979-72b7-4be8-968d-892028b9a78c	ccd01816-991e-4d3b-9d93-ec6b397388bd	full	\N	2025-09-25 21:37:11.597211
607c01cb-fa19-4e01-8a38-0d0df338e226	94b16979-72b7-4be8-968d-892028b9a78c	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	full	\N	2025-09-25 21:37:11.597211
398196f0-6cde-4f79-a52c-3ce506a1e837	94b16979-72b7-4be8-968d-892028b9a78c	64319b48-f6bc-4253-b5af-626e77f1d1cb	read	\N	2025-09-25 21:37:11.597211
e9ed47c2-024d-4a24-834c-0c7f7690d173	94b16979-72b7-4be8-968d-892028b9a78c	240de0a8-9480-493a-9fd3-386b0dd755d2	read	\N	2025-09-25 21:37:11.597211
1e1e7f51-e92e-4b14-8eb5-c4ddd55d43da	94b16979-72b7-4be8-968d-892028b9a78c	da75b893-f234-444e-ac11-d6cf51aabe89	full	\N	2025-09-25 21:37:11.597211
1fdac2a8-f6cf-40e8-a0fd-493834b76444	94b16979-72b7-4be8-968d-892028b9a78c	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	full	\N	2025-09-25 21:37:11.597211
9bc0ce2e-3d7b-469d-aef0-1bf4d1e4f7aa	94b16979-72b7-4be8-968d-892028b9a78c	f90d6eba-0099-45a7-9b65-1058bf625459	full	\N	2025-09-25 21:37:11.597211
d9c71ef4-cd86-4b3f-b35d-96c76ee80ca9	94b16979-72b7-4be8-968d-892028b9a78c	0a4f21d5-3f47-4c15-912c-363726b05885	full	\N	2025-09-25 21:37:11.597211
aee76e1b-752e-4d77-9bb7-9c052686a388	94b16979-72b7-4be8-968d-892028b9a78c	db0b5c60-1987-4769-bf13-f32e917e9eac	full	\N	2025-09-25 21:37:11.597211
42a67350-b5ab-40dd-8b88-584465b8fc7c	94b16979-72b7-4be8-968d-892028b9a78c	14e38180-49ab-445d-bf6d-2b0d70b4cb24	full	\N	2025-09-25 21:37:11.597211
7959a750-86f4-49e9-bfe6-4db735567ce3	94b16979-72b7-4be8-968d-892028b9a78c	919b1f68-55c1-4497-b9e6-b69dcc5b00cd	full	\N	2025-09-25 21:37:11.597211
adde0f5b-f260-4d46-b9fe-c3e6185c715d	94b16979-72b7-4be8-968d-892028b9a78c	3377171f-cb47-442c-994c-906e3fb69c1e	full	\N	2025-09-25 21:37:11.597211
80a1a852-e466-4331-b596-858ef9043eed	94b16979-72b7-4be8-968d-892028b9a78c	6cf427ba-adab-4a0a-8432-2bfe237392e5	full	\N	2025-09-25 21:37:11.597211
e85efeb7-925f-4c28-85de-8b043fa8ed1b	94b16979-72b7-4be8-968d-892028b9a78c	5879ebd2-c2af-4c10-99f4-54af16b6ed8e	full	\N	2025-09-25 21:37:11.597211
58e6856d-a172-4c19-a723-5821fff7b5e9	94b16979-72b7-4be8-968d-892028b9a78c	3087add7-90f3-4381-b5e9-5ab739c34975	full	\N	2025-09-25 21:37:11.597211
3fddee88-058f-4046-969a-b890d687b8e8	94b16979-72b7-4be8-968d-892028b9a78c	efab47c1-8594-4a84-afbc-abade5ffd6ad	full	\N	2025-09-25 21:37:11.597211
d26949c6-eeb7-4c71-9512-5940e350a6c4	d299e1b7-7c8f-42e8-8376-d069426a7c04	138893cb-ec9c-4a4f-840d-b104a07bf5cb	full	\N	2025-09-25 21:37:11.598004
d52188cf-d00f-4d52-9e42-48c38c07f7a8	d299e1b7-7c8f-42e8-8376-d069426a7c04	1fcdd80c-5ab4-4309-8374-e06e55f57f2b	full	\N	2025-09-25 21:37:11.598004
6eaf74c7-4632-4a39-a80f-6741d022f92b	d299e1b7-7c8f-42e8-8376-d069426a7c04	f0a996a8-4824-460f-8ea4-1a664882cd61	full	\N	2025-09-25 21:37:11.598004
56474369-870a-4ac2-9cf7-9cc70a0ef9de	d299e1b7-7c8f-42e8-8376-d069426a7c04	de8e6c97-8fe4-4b81-92fb-6afd2cc598c1	full	\N	2025-09-25 21:37:11.598004
6b26c141-12ed-42d6-abdd-2949813ac236	d299e1b7-7c8f-42e8-8376-d069426a7c04	e2c1cc64-fb45-4db9-97b5-83741e665a0b	full	\N	2025-09-25 21:37:11.598004
ba1ffb20-1253-445e-aadd-7466721dc900	d299e1b7-7c8f-42e8-8376-d069426a7c04	f7cf9604-5f62-40e1-80af-4ea1d23d67a1	full	\N	2025-09-25 21:37:11.598004
c649218b-9304-47ee-a0eb-3a738b294050	d299e1b7-7c8f-42e8-8376-d069426a7c04	e3145c3b-7902-43bb-abbb-c1a28050d3b4	full	\N	2025-09-25 21:37:11.598004
1116a1b6-61c4-4746-ab2a-8f2a60e7c2af	d299e1b7-7c8f-42e8-8376-d069426a7c04	3e2b7bc0-d182-4dd4-b648-84e61aae758f	full	\N	2025-09-25 21:37:11.598004
33531c45-a5c8-4372-9a37-1c9e2017c2e6	d299e1b7-7c8f-42e8-8376-d069426a7c04	025df99f-7780-4118-b3df-ed80cb880a00	full	\N	2025-09-25 21:37:11.598004
6074537a-2655-4ba1-9f06-b231b4e507ff	d299e1b7-7c8f-42e8-8376-d069426a7c04	e4a91eb0-9c06-4285-8909-a1edc4d3b7d5	full	\N	2025-09-25 21:37:11.598004
56e4438c-1dbf-4643-b11b-f26822fe5d71	d299e1b7-7c8f-42e8-8376-d069426a7c04	42bbe078-17f5-4e3a-a10e-42b9fb9548c8	full	\N	2025-09-25 21:37:11.598004
c424ddfe-03ab-4cd9-bcb7-ed38d66c0010	d299e1b7-7c8f-42e8-8376-d069426a7c04	7e93d389-414f-4447-862d-8160edc6357a	full	\N	2025-09-25 21:37:11.598004
eeee2a1b-d965-4eb7-b3b8-1908a9f45b07	d299e1b7-7c8f-42e8-8376-d069426a7c04	e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	full	\N	2025-09-25 21:37:11.598004
c203ad2b-1b23-462d-b970-a33e977cc054	d299e1b7-7c8f-42e8-8376-d069426a7c04	482429af-01a2-4219-b556-6b3e8bf81a02	full	\N	2025-09-25 21:37:11.598004
c3805140-f2e7-4f4f-8712-6298bf240596	d299e1b7-7c8f-42e8-8376-d069426a7c04	b520b1a5-9b8b-40b5-962d-f94f0c1a3279	full	\N	2025-09-25 21:37:11.598004
b6704f35-d6f5-4031-97f1-0e5b326c0fa5	d299e1b7-7c8f-42e8-8376-d069426a7c04	c4269378-0f43-4bde-816c-1c29f26d60d5	full	\N	2025-09-25 21:37:11.598004
af74fb1c-6b4c-446b-8496-3202b128bb31	d299e1b7-7c8f-42e8-8376-d069426a7c04	1164d3f2-78f5-405b-873e-d679ede0cff6	full	\N	2025-09-25 21:37:11.598004
a024aa0c-12af-4d69-9f21-34f87d6872c0	d299e1b7-7c8f-42e8-8376-d069426a7c04	7fcf81f4-695c-4da2-9851-727ff3b9b210	full	\N	2025-09-25 21:37:11.598004
12b3f1a8-0650-42eb-b18b-7f09c1b6e827	d299e1b7-7c8f-42e8-8376-d069426a7c04	968016e6-db06-4162-9930-92ed614a1af2	full	\N	2025-09-25 21:37:11.598004
5dec5b60-8601-4b89-979c-7376b45e072a	d299e1b7-7c8f-42e8-8376-d069426a7c04	bae28538-38eb-409a-ac2e-98ec5616cf25	full	\N	2025-09-25 21:37:11.598004
27fba433-3b8e-4f17-aa58-5c5bf97dad93	d299e1b7-7c8f-42e8-8376-d069426a7c04	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	full	\N	2025-09-25 21:37:11.598004
599a1e22-eb11-4ad3-80c3-86306eb73a33	d299e1b7-7c8f-42e8-8376-d069426a7c04	02a64972-a2d5-4aae-bd32-7bece5277932	full	\N	2025-09-25 21:37:11.598004
b677edad-fd69-4dea-9225-8b66e9b7813f	d299e1b7-7c8f-42e8-8376-d069426a7c04	d07bcee1-4cb5-4874-a36e-f3e22cd06965	full	\N	2025-09-25 21:37:11.598004
05a4cf76-9322-4ce9-a911-32f6cd63976d	d299e1b7-7c8f-42e8-8376-d069426a7c04	10724507-8fdf-4027-8961-0a6b56877bb1	full	\N	2025-09-25 21:37:11.598004
e15d7c4f-3312-45ac-b960-639a767b2b10	d299e1b7-7c8f-42e8-8376-d069426a7c04	41008226-9219-4a8f-9256-f0e8cc5ca809	full	\N	2025-09-25 21:37:11.598004
ac2881b6-a64a-40cd-a11b-390fe2adfb0b	d299e1b7-7c8f-42e8-8376-d069426a7c04	ccd01816-991e-4d3b-9d93-ec6b397388bd	full	\N	2025-09-25 21:37:11.598004
458ccef0-6329-4e5c-b934-a667228f7972	d299e1b7-7c8f-42e8-8376-d069426a7c04	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 21:37:11.598004
6615b4c0-73bf-4416-acf8-9e4f92f2773b	d299e1b7-7c8f-42e8-8376-d069426a7c04	64319b48-f6bc-4253-b5af-626e77f1d1cb	read	\N	2025-09-25 21:37:11.598004
dedbd973-8b7e-4173-ba47-d911c817ca53	d299e1b7-7c8f-42e8-8376-d069426a7c04	240de0a8-9480-493a-9fd3-386b0dd755d2	read	\N	2025-09-25 21:37:11.598004
79cf60f0-bd30-484a-b44c-4da494f6efc3	d299e1b7-7c8f-42e8-8376-d069426a7c04	da75b893-f234-444e-ac11-d6cf51aabe89	read	\N	2025-09-25 21:37:11.598004
c38d17b5-e21e-484c-b8ac-363323d5b150	d299e1b7-7c8f-42e8-8376-d069426a7c04	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 21:37:11.598004
d65f717f-5520-453d-9bfd-84743f96a05e	d299e1b7-7c8f-42e8-8376-d069426a7c04	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 21:37:11.598004
e4196602-d762-46e4-90e6-c85f3e4f5eed	d299e1b7-7c8f-42e8-8376-d069426a7c04	0a4f21d5-3f47-4c15-912c-363726b05885	read	\N	2025-09-25 21:37:11.598004
abfe5ff4-ac0b-4e3d-b316-d8b911c5f8b9	d299e1b7-7c8f-42e8-8376-d069426a7c04	db0b5c60-1987-4769-bf13-f32e917e9eac	full	\N	2025-09-25 21:37:11.598004
0044df33-895e-47f9-ac43-01f5162d6102	d299e1b7-7c8f-42e8-8376-d069426a7c04	14e38180-49ab-445d-bf6d-2b0d70b4cb24	full	\N	2025-09-25 21:37:11.598004
a6108332-1347-4118-99d6-8a5c32e5e935	d299e1b7-7c8f-42e8-8376-d069426a7c04	919b1f68-55c1-4497-b9e6-b69dcc5b00cd	full	\N	2025-09-25 21:37:11.598004
80c79d48-17a8-4814-a08e-ee9d39b50dfd	d299e1b7-7c8f-42e8-8376-d069426a7c04	3377171f-cb47-442c-994c-906e3fb69c1e	full	\N	2025-09-25 21:37:11.598004
ff4f4d75-9c53-415e-9be0-dbf3455dd09f	d299e1b7-7c8f-42e8-8376-d069426a7c04	6cf427ba-adab-4a0a-8432-2bfe237392e5	read	\N	2025-09-25 21:37:11.598004
42876bf0-f666-49c8-a400-9e8e8532db79	d299e1b7-7c8f-42e8-8376-d069426a7c04	5879ebd2-c2af-4c10-99f4-54af16b6ed8e	full	\N	2025-09-25 21:37:11.598004
507c7377-0d66-41d2-b7db-d1cb3ae76ba7	d299e1b7-7c8f-42e8-8376-d069426a7c04	3087add7-90f3-4381-b5e9-5ab739c34975	full	\N	2025-09-25 21:37:11.598004
54953118-0f14-4ad9-86ee-e18a02835aa3	d299e1b7-7c8f-42e8-8376-d069426a7c04	efab47c1-8594-4a84-afbc-abade5ffd6ad	full	\N	2025-09-25 21:37:11.598004
ddd188da-12e3-49ab-b318-3445fe821c83	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	138893cb-ec9c-4a4f-840d-b104a07bf5cb	write	\N	2025-09-25 21:37:11.599279
fd88c5c0-22fe-45fa-80d9-d2924c0d2d78	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	e3145c3b-7902-43bb-abbb-c1a28050d3b4	write	\N	2025-09-25 21:37:11.599279
8aad38d0-221b-4049-b283-c8377f679de8	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	3e2b7bc0-d182-4dd4-b648-84e61aae758f	write	\N	2025-09-25 21:37:11.599279
c814306e-c629-46b3-8184-4ebdd9a8915e	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	write	\N	2025-09-25 21:37:11.599279
37ddf749-aa7c-494f-9b16-2d51ba10b8be	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	write	\N	2025-09-25 21:37:11.599279
9fa6c6b3-9a78-4038-959e-5b5d00d2c4e9	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	02a64972-a2d5-4aae-bd32-7bece5277932	write	\N	2025-09-25 21:37:11.599279
28de3e5a-84ab-4cf0-ad0a-de8ae9a73520	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	41008226-9219-4a8f-9256-f0e8cc5ca809	write	\N	2025-09-25 21:37:11.599279
e3106480-517a-4c9a-bf40-b426485aed00	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	ccd01816-991e-4d3b-9d93-ec6b397388bd	write	\N	2025-09-25 21:37:11.599279
7ddae751-001c-45d4-abbf-d63a4fc9c34e	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	3377171f-cb47-442c-994c-906e3fb69c1e	write	\N	2025-09-25 21:37:11.599279
0bc97931-9086-4197-8430-3a93ab91d066	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	3087add7-90f3-4381-b5e9-5ab739c34975	write	\N	2025-09-25 21:37:11.599279
e1337994-d583-4df6-8983-32d9127ff621	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	b520b1a5-9b8b-40b5-962d-f94f0c1a3279	full	\N	2025-09-25 21:37:11.599707
f2cb3703-56c2-43aa-9295-06b2867a8c68	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	c4269378-0f43-4bde-816c-1c29f26d60d5	full	\N	2025-09-25 21:37:11.599707
11b40151-5afd-466d-b0a0-5b5dc5b2a3ea	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	1164d3f2-78f5-405b-873e-d679ede0cff6	full	\N	2025-09-25 21:37:11.599707
e5cb2f93-3796-408c-b3c0-6a96d7e223e7	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	7fcf81f4-695c-4da2-9851-727ff3b9b210	write	\N	2025-09-25 21:37:11.599707
8e2cad2b-16c2-4256-91e4-46f4f80cc8bb	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	968016e6-db06-4162-9930-92ed614a1af2	full	\N	2025-09-25 21:37:11.599707
be2e434c-0261-4c64-b616-24b6a748c016	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	bae28538-38eb-409a-ac2e-98ec5616cf25	full	\N	2025-09-25 21:37:11.599707
ac609a87-cc95-4a01-9745-581316939c38	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	02a64972-a2d5-4aae-bd32-7bece5277932	full	\N	2025-09-25 21:37:11.599707
a24ad6b9-53d6-4ed8-8e21-075181ed45d0	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	41008226-9219-4a8f-9256-f0e8cc5ca809	full	\N	2025-09-25 21:37:11.599707
e21845c9-61d5-46cb-89d7-6edb344ed746	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	ccd01816-991e-4d3b-9d93-ec6b397388bd	full	\N	2025-09-25 21:37:11.599707
3e99d59f-e8a6-4687-b8ee-2da383f3b598	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 21:37:11.599707
0335e197-f081-4d9d-964c-e9b55c1d1828	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	3377171f-cb47-442c-994c-906e3fb69c1e	full	\N	2025-09-25 21:37:11.599707
33d84a1e-48ab-4373-b07b-37bee1c31605	63e954bf-abe1-4378-b1b1-1954b6da4bbf	d07bcee1-4cb5-4874-a36e-f3e22cd06965	full	\N	2025-09-25 21:37:11.600087
d06dcfbe-27f8-471d-85d7-e94f0b82db5f	63e954bf-abe1-4378-b1b1-1954b6da4bbf	10724507-8fdf-4027-8961-0a6b56877bb1	full	\N	2025-09-25 21:37:11.600087
8b7f6d12-fa57-4062-b1e4-d1148a21cac1	63e954bf-abe1-4378-b1b1-1954b6da4bbf	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	full	\N	2025-09-25 21:37:11.600087
0a6b77f4-c0f8-4de6-a033-63daf198b319	63e954bf-abe1-4378-b1b1-1954b6da4bbf	64319b48-f6bc-4253-b5af-626e77f1d1cb	full	\N	2025-09-25 21:37:11.600087
fd1897e9-c95a-4a67-ad3e-17ac69669d6a	63e954bf-abe1-4378-b1b1-1954b6da4bbf	240de0a8-9480-493a-9fd3-386b0dd755d2	full	\N	2025-09-25 21:37:11.600087
145210cf-57fb-4dd1-81c1-cabbf6cbafb6	63e954bf-abe1-4378-b1b1-1954b6da4bbf	da75b893-f234-444e-ac11-d6cf51aabe89	full	\N	2025-09-25 21:37:11.600087
757dcf07-fb57-4b7a-b810-a18668f2fdf9	63e954bf-abe1-4378-b1b1-1954b6da4bbf	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	full	\N	2025-09-25 21:37:11.600087
e01b0f28-dd36-4a09-b2a0-f52f4c285803	63e954bf-abe1-4378-b1b1-1954b6da4bbf	f90d6eba-0099-45a7-9b65-1058bf625459	full	\N	2025-09-25 21:37:11.600087
d3d161fc-3e4a-4f52-9ffa-d873369b4601	63e954bf-abe1-4378-b1b1-1954b6da4bbf	0a4f21d5-3f47-4c15-912c-363726b05885	full	\N	2025-09-25 21:37:11.600087
c9fa56f3-609c-40b7-8cdc-33ed6b9e8232	63e954bf-abe1-4378-b1b1-1954b6da4bbf	6cf427ba-adab-4a0a-8432-2bfe237392e5	full	\N	2025-09-25 21:37:11.600087
db9fbdde-aea1-4b82-9e15-acffb04afd07	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	e3145c3b-7902-43bb-abbb-c1a28050d3b4	write	\N	2025-09-25 21:37:11.602093
c28ae1bc-58ca-4da9-9f93-f336cd83b04a	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	3e2b7bc0-d182-4dd4-b648-84e61aae758f	write	\N	2025-09-25 21:37:11.602093
bfd3e182-652c-456c-a929-0b3f27a287e9	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	write	\N	2025-09-25 21:37:11.602093
9c4ab9e2-aa93-4935-972f-37f57cdcec4b	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	41008226-9219-4a8f-9256-f0e8cc5ca809	write	\N	2025-09-25 21:37:11.602093
43b1e4eb-b606-4edb-9d2f-554f9e9153d9	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	ccd01816-991e-4d3b-9d93-ec6b397388bd	write	\N	2025-09-25 21:37:11.602093
4c631e2b-37ab-4120-9993-a8d14751c92f	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	3377171f-cb47-442c-994c-906e3fb69c1e	write	\N	2025-09-25 21:37:11.602093
828a6544-c433-495e-b15a-1bf538641bf0	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	6b12a124-9a49-43b4-ad63-ebf86b586037	full	\N	2025-09-25 21:52:16.395149
cc10d08a-9e9e-43ff-9624-34652bce6d9a	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	8929a57b-f3fd-4c98-af63-ac998d1e8101	full	\N	2025-09-25 21:52:16.395149
d33179a5-fd45-467e-80f3-60a1f640dd45	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	84bb70d9-e29b-46c4-b704-bbf73bcb81f0	full	\N	2025-09-25 21:52:16.395149
448f08d6-2246-495f-bd13-9beeb59e9095	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	full	\N	2025-09-25 21:52:16.395149
2da5775c-4fca-4399-96e7-367f4552e2fe	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	full	\N	2025-09-25 21:52:16.395149
c4cab42e-668f-4b7b-978f-828a5f0246d5	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	full	\N	2025-09-25 21:52:16.395149
9fe60897-83e5-4b9e-be8b-56156757bc7f	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	bcabec8b-fab8-4c3b-ad33-2e898353c4db	full	\N	2025-09-25 21:52:16.395149
94f39799-e7c5-4b65-a75f-00ada36b493d	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	full	\N	2025-09-25 21:52:16.395149
ce4aebbd-f2cb-46a1-8b45-b4d0c587c64d	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f067355c-02ed-44f5-831b-43e21a51b0b8	full	\N	2025-09-25 21:52:16.395149
9b2ad0f3-f31d-4058-b560-91c85ddf9596	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	full	\N	2025-09-25 21:52:16.395149
8d9aa96d-3055-45f4-ac4f-8f7adb74cbce	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	b088fae8-f4f3-406b-a0b4-85290183127a	full	\N	2025-09-25 21:52:16.395149
44c96eb6-b958-46dd-9dd6-1e7905812239	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	93a87ed0-3727-4e6a-aebb-d3869540d21b	full	\N	2025-09-25 21:52:16.395149
d82c50f4-e645-4696-a92a-540982dbe330	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	a36437dc-580e-47b1-8c63-badc80aa6d2d	full	\N	2025-09-25 21:52:16.395149
5f59865b-7759-41ea-8929-62b788707db3	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	1ad328bc-a842-420d-b342-73524905da1c	full	\N	2025-09-25 21:52:16.395149
ef74cc26-6079-450a-9070-375e3313432b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	full	\N	2025-09-25 21:52:16.395149
162ecd73-1b19-4424-9f6f-e437624f8a97	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	413ec926-cbc1-4f9b-a728-6b711ceba516	full	\N	2025-09-25 21:52:16.395149
c257ace0-c1c8-4dd9-aa07-b48228191ccd	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	798c3dff-c458-4513-afbb-83f241033832	full	\N	2025-09-25 21:52:16.395149
2a955802-a011-4f56-b5ab-e0007371fe51	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	90973b1a-1af0-4e30-8af8-683d30ad1797	full	\N	2025-09-25 21:52:16.395149
217495f2-ef74-4114-be0e-b5cadaba48df	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	56c195ca-4566-41e3-989a-8f568bdd640f	full	\N	2025-09-25 21:52:16.395149
08b0f38d-bb2d-41ad-8edd-0165ef44459e	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	8e303b4b-2056-430a-9932-f0733563c571	full	\N	2025-09-25 21:52:16.395149
ecabedc1-f121-4f30-8ae0-36edf13caa69	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	998839ac-1533-454c-9317-8379b05b2d87	full	\N	2025-09-25 21:52:16.395149
d82c5e53-8f21-452b-9506-d9cf23f3c926	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	full	\N	2025-09-25 21:52:16.395149
3315a4c3-9d50-4898-897b-cbaf46b03648	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	28026104-a008-4323-8c24-e8b5d1739dce	full	\N	2025-09-25 21:52:16.395149
a961879e-4f7f-4173-8e67-7317556a5278	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e395c321-d203-434f-bbcb-40e0fd48c0e2	full	\N	2025-09-25 21:52:16.395149
8cad1123-8df7-451f-b14b-5a85a077c65b	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	57187619-bd17-40ae-ba79-99f3fcfd33e1	full	\N	2025-09-25 21:52:16.395149
3aef5513-6fc5-455f-8d61-852490527013	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	a1652a23-34e8-4fef-ae34-5005e7f8a494	full	\N	2025-09-25 21:52:16.395149
589020f3-c30f-4e08-994d-3defb3f9d034	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	full	\N	2025-09-25 21:52:16.395149
77de7dcc-0868-4094-b718-d51f95a38a51	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	f34038fa-a483-4341-984f-75f565bb4315	full	\N	2025-09-25 21:52:16.395149
f78ca688-1f99-4461-b0f2-4f041a4a17fb	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	edbe9ab8-50f4-4aa0-996c-5e043a2eb5b7	full	\N	2025-09-25 21:52:16.395149
ee41fede-dcf1-432f-b5c5-378721405c41	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	full	\N	2025-09-25 21:52:16.395149
a6ece372-b3cb-48e6-825a-1d89049d7f81	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	full	\N	2025-09-25 21:52:16.395149
27bc8a52-7af8-4e8a-8849-e8216b505f36	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	full	\N	2025-09-25 21:52:16.395149
1beab21f-68b6-4b00-9196-2f760fe9b347	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	e447c976-03f1-4d98-b481-6a29f18bdeb3	full	\N	2025-09-25 21:52:16.395149
b3777183-f226-40d4-a709-cdad88184079	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	232b533b-fd5c-4e99-ad25-b613fde533c1	full	\N	2025-09-25 21:52:16.395149
b2d65ed6-45ab-4147-8350-363236dab2eb	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	56d743af-1ddf-4802-b360-d503d4c70617	full	\N	2025-09-25 21:52:16.395149
39025394-451d-4a7e-b659-6b5c8c680ef6	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	08a36eac-bd37-4e6a-8f47-6461b7672734	full	\N	2025-09-25 21:52:16.395149
0d9c13f3-bb0d-4a8e-8704-cac6a311c6d1	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	90c96a7d-7049-4b70-8d60-2af92d3029ec	full	\N	2025-09-25 21:52:16.395149
deff19ce-de78-47fa-a0f1-6490fa9234a2	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	7c9b3bc2-66b8-4cfd-ae84-95762298d918	full	\N	2025-09-25 21:52:16.395149
f2396f56-356e-4b05-a409-14b18c77be4f	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	full	\N	2025-09-25 21:52:16.395149
eaa1ffce-5cfa-4af3-9e5f-7f81ca8b580c	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	full	\N	2025-09-25 21:52:16.395149
e8c3ec75-a772-463c-acfa-aad4181a0e9f	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	10d1e4d6-ce02-43c0-b78c-b648b598c695	full	\N	2025-09-25 21:52:16.395149
7013abcc-a9ab-4371-9cfb-d3ed8aca30d5	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	full	\N	2025-09-25 21:52:16.395149
03141118-ce12-4bfb-a921-6d679178b325	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	7101b2c1-797d-4318-a277-e51d280e1f6e	full	\N	2025-09-25 21:52:16.395149
8ef20264-5752-4096-b9fe-d99459a8fd9f	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	c320e930-8a64-40e2-81c5-9e11015b7621	full	\N	2025-09-25 21:52:16.395149
9136cdf7-2dcc-4b68-b526-498ccb631f0f	94b16979-72b7-4be8-968d-892028b9a78c	8929a57b-f3fd-4c98-af63-ac998d1e8101	full	\N	2025-09-25 21:52:16.398023
a51547c1-06e0-4e0c-87d7-280d037dae32	94b16979-72b7-4be8-968d-892028b9a78c	84bb70d9-e29b-46c4-b704-bbf73bcb81f0	full	\N	2025-09-25 21:52:16.398023
0222e168-2964-4300-87cf-4906a7837c7b	94b16979-72b7-4be8-968d-892028b9a78c	96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	full	\N	2025-09-25 21:52:16.398023
861303c6-b243-44a3-b0e2-d73e18cbecbf	94b16979-72b7-4be8-968d-892028b9a78c	22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	full	\N	2025-09-25 21:52:16.398023
c6ddf629-272e-4f89-80b2-05d2169bbb9a	94b16979-72b7-4be8-968d-892028b9a78c	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	full	\N	2025-09-25 21:52:16.398023
8cb845a7-7a7b-4d8c-87da-e87d5cbaf68a	94b16979-72b7-4be8-968d-892028b9a78c	bcabec8b-fab8-4c3b-ad33-2e898353c4db	full	\N	2025-09-25 21:52:16.398023
22fd707b-1f65-4ab0-b787-2685a7837872	94b16979-72b7-4be8-968d-892028b9a78c	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	full	\N	2025-09-25 21:52:16.398023
6ad2bf16-19ab-4f20-814b-b30d4aeb7da7	94b16979-72b7-4be8-968d-892028b9a78c	f067355c-02ed-44f5-831b-43e21a51b0b8	full	\N	2025-09-25 21:52:16.398023
9eb8e53b-31e0-4773-934c-dfaec484126e	94b16979-72b7-4be8-968d-892028b9a78c	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	full	\N	2025-09-25 21:52:16.398023
8bf26f06-4c79-43ef-b586-2359b03cd4c2	94b16979-72b7-4be8-968d-892028b9a78c	b088fae8-f4f3-406b-a0b4-85290183127a	full	\N	2025-09-25 21:52:16.398023
fac5faad-78c1-4a81-bb00-41026486fd10	94b16979-72b7-4be8-968d-892028b9a78c	93a87ed0-3727-4e6a-aebb-d3869540d21b	full	\N	2025-09-25 21:52:16.398023
c271a00d-07c3-4869-b967-f83b133bb8db	94b16979-72b7-4be8-968d-892028b9a78c	a36437dc-580e-47b1-8c63-badc80aa6d2d	full	\N	2025-09-25 21:52:16.398023
fbd673f8-b7bc-45e6-9a4d-7daccc0f0c0b	94b16979-72b7-4be8-968d-892028b9a78c	1ad328bc-a842-420d-b342-73524905da1c	full	\N	2025-09-25 21:52:16.398023
971ab65e-fe41-441c-afa4-53d753563387	94b16979-72b7-4be8-968d-892028b9a78c	5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	full	\N	2025-09-25 21:52:16.398023
b6396491-1cd3-4291-b807-eeec86124a22	94b16979-72b7-4be8-968d-892028b9a78c	413ec926-cbc1-4f9b-a728-6b711ceba516	full	\N	2025-09-25 21:52:16.398023
9900e9d4-8e62-4378-bb58-dd4a44704aaf	94b16979-72b7-4be8-968d-892028b9a78c	798c3dff-c458-4513-afbb-83f241033832	full	\N	2025-09-25 21:52:16.398023
1b826c9c-e515-49c2-9135-d62e47bb0e7b	94b16979-72b7-4be8-968d-892028b9a78c	90973b1a-1af0-4e30-8af8-683d30ad1797	full	\N	2025-09-25 21:52:16.398023
bdfcccf0-f08d-4ee6-9144-4d8ef8dc3a3f	94b16979-72b7-4be8-968d-892028b9a78c	56c195ca-4566-41e3-989a-8f568bdd640f	full	\N	2025-09-25 21:52:16.398023
0fd05dca-58c2-4c34-978a-388505962766	94b16979-72b7-4be8-968d-892028b9a78c	8e303b4b-2056-430a-9932-f0733563c571	full	\N	2025-09-25 21:52:16.398023
ab5d41a5-7b5b-4176-9806-11dd848ecfb1	94b16979-72b7-4be8-968d-892028b9a78c	998839ac-1533-454c-9317-8379b05b2d87	full	\N	2025-09-25 21:52:16.398023
c55f13af-0f55-46e5-b915-e54b44f563e7	94b16979-72b7-4be8-968d-892028b9a78c	e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	full	\N	2025-09-25 21:52:16.398023
9fa616dd-14aa-4ae0-92b6-0dcf35dce02e	94b16979-72b7-4be8-968d-892028b9a78c	28026104-a008-4323-8c24-e8b5d1739dce	full	\N	2025-09-25 21:52:16.398023
9051f147-6ca1-4305-b607-51b75e92b714	94b16979-72b7-4be8-968d-892028b9a78c	e395c321-d203-434f-bbcb-40e0fd48c0e2	full	\N	2025-09-25 21:52:16.398023
e1f77364-469b-4634-af76-d9dc0c58df86	94b16979-72b7-4be8-968d-892028b9a78c	57187619-bd17-40ae-ba79-99f3fcfd33e1	full	\N	2025-09-25 21:52:16.398023
ead3e6a8-b48c-46fb-b318-04d8611aaa36	94b16979-72b7-4be8-968d-892028b9a78c	a1652a23-34e8-4fef-ae34-5005e7f8a494	full	\N	2025-09-25 21:52:16.398023
594586ba-be2c-4996-87da-c2e2d3933295	94b16979-72b7-4be8-968d-892028b9a78c	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	full	\N	2025-09-25 21:52:16.398023
b908ff1e-abfc-47c4-bcd3-9619254e8bf8	94b16979-72b7-4be8-968d-892028b9a78c	f34038fa-a483-4341-984f-75f565bb4315	full	\N	2025-09-25 21:52:16.398023
75cde95a-b129-4152-8342-449bc6b00eda	94b16979-72b7-4be8-968d-892028b9a78c	edbe9ab8-50f4-4aa0-996c-5e043a2eb5b7	full	\N	2025-09-25 21:52:16.398023
3b987db8-1bc8-4d99-973a-ff2af666adcb	94b16979-72b7-4be8-968d-892028b9a78c	43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	full	\N	2025-09-25 21:52:16.398023
b88f360b-eebf-4952-8648-65ff50805612	94b16979-72b7-4be8-968d-892028b9a78c	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	full	\N	2025-09-25 21:52:16.398023
fe4dc95b-04e5-4d38-9394-906ef7a9c2da	94b16979-72b7-4be8-968d-892028b9a78c	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	full	\N	2025-09-25 21:52:16.398023
b9688da8-027b-4b71-9f32-007d90026096	94b16979-72b7-4be8-968d-892028b9a78c	e447c976-03f1-4d98-b481-6a29f18bdeb3	full	\N	2025-09-25 21:52:16.398023
6bd63c70-49e8-446e-9f1a-18c7b2441f2f	94b16979-72b7-4be8-968d-892028b9a78c	232b533b-fd5c-4e99-ad25-b613fde533c1	full	\N	2025-09-25 21:52:16.398023
53735d3d-ee41-4a6b-b1da-61a2fc117270	94b16979-72b7-4be8-968d-892028b9a78c	56d743af-1ddf-4802-b360-d503d4c70617	full	\N	2025-09-25 21:52:16.398023
3035d02e-1595-4a95-981e-ce19bd8df513	94b16979-72b7-4be8-968d-892028b9a78c	08a36eac-bd37-4e6a-8f47-6461b7672734	full	\N	2025-09-25 21:52:16.398023
5cda5cfe-e34b-4ca2-841e-4a87e5476195	94b16979-72b7-4be8-968d-892028b9a78c	90c96a7d-7049-4b70-8d60-2af92d3029ec	full	\N	2025-09-25 21:52:16.398023
3ccb6353-abbd-421a-b8d3-c2d7fc3d1948	94b16979-72b7-4be8-968d-892028b9a78c	10d1e4d6-ce02-43c0-b78c-b648b598c695	full	\N	2025-09-25 21:52:16.398023
c8c1c88b-cff4-4438-9004-61c5c11db14e	94b16979-72b7-4be8-968d-892028b9a78c	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	full	\N	2025-09-25 21:52:16.398023
ce8dd5db-b315-4b58-a5f5-6aed7cc0b96b	94b16979-72b7-4be8-968d-892028b9a78c	7101b2c1-797d-4318-a277-e51d280e1f6e	full	\N	2025-09-25 21:52:16.398023
e2241ee1-28e8-495d-b859-dda4abe35125	d299e1b7-7c8f-42e8-8376-d069426a7c04	8929a57b-f3fd-4c98-af63-ac998d1e8101	write	\N	2025-09-25 21:52:16.398817
848aba16-f153-4b7c-81a2-715291a67af0	d299e1b7-7c8f-42e8-8376-d069426a7c04	84bb70d9-e29b-46c4-b704-bbf73bcb81f0	write	\N	2025-09-25 21:52:16.398817
a311b2a3-4300-4101-ba8d-44562b1b0414	d299e1b7-7c8f-42e8-8376-d069426a7c04	96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	write	\N	2025-09-25 21:52:16.398817
a0dd2d65-b5ca-4992-8a23-a400cdd6a01f	d299e1b7-7c8f-42e8-8376-d069426a7c04	22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	write	\N	2025-09-25 21:52:16.398817
e7cf1f8f-8877-4717-90b8-5bbc2e4a775a	d299e1b7-7c8f-42e8-8376-d069426a7c04	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	write	\N	2025-09-25 21:52:16.398817
8cfa29ef-fe66-4be5-83b6-4104007c8fdd	d299e1b7-7c8f-42e8-8376-d069426a7c04	bcabec8b-fab8-4c3b-ad33-2e898353c4db	write	\N	2025-09-25 21:52:16.398817
bfd4d542-17f0-49de-a565-571323152886	d299e1b7-7c8f-42e8-8376-d069426a7c04	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	write	\N	2025-09-25 21:52:16.398817
da337ed8-46d1-44f9-bb72-b35bfae70a56	d299e1b7-7c8f-42e8-8376-d069426a7c04	f067355c-02ed-44f5-831b-43e21a51b0b8	write	\N	2025-09-25 21:52:16.398817
27a646f0-1fe2-45be-bd65-f9fb115d270c	d299e1b7-7c8f-42e8-8376-d069426a7c04	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	write	\N	2025-09-25 21:52:16.398817
a03e639b-dc2d-43f4-9314-8c551ec77130	d299e1b7-7c8f-42e8-8376-d069426a7c04	b088fae8-f4f3-406b-a0b4-85290183127a	write	\N	2025-09-25 21:52:16.398817
30d9001a-ae68-4ac6-b69e-e8c8848703fb	d299e1b7-7c8f-42e8-8376-d069426a7c04	93a87ed0-3727-4e6a-aebb-d3869540d21b	full	\N	2025-09-25 21:52:16.398817
918d1e9e-166f-46ea-a17c-5a8be51a4e1a	d299e1b7-7c8f-42e8-8376-d069426a7c04	a36437dc-580e-47b1-8c63-badc80aa6d2d	write	\N	2025-09-25 21:52:16.398817
23adc87e-50d5-443a-9abe-c538b9acf353	d299e1b7-7c8f-42e8-8376-d069426a7c04	1ad328bc-a842-420d-b342-73524905da1c	write	\N	2025-09-25 21:52:16.398817
89413d22-a4e8-4ea3-a1fa-97b83e139f9c	d299e1b7-7c8f-42e8-8376-d069426a7c04	5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	full	\N	2025-09-25 21:52:16.398817
3008246a-eea6-4ca5-aba8-1ab32f386185	d299e1b7-7c8f-42e8-8376-d069426a7c04	90973b1a-1af0-4e30-8af8-683d30ad1797	write	\N	2025-09-25 21:52:16.398817
9eefb0f8-60ca-455b-a4f4-85bd30d21e08	d299e1b7-7c8f-42e8-8376-d069426a7c04	56c195ca-4566-41e3-989a-8f568bdd640f	write	\N	2025-09-25 21:52:16.398817
0155d7bf-6eeb-4873-9c9e-800e1b2d92a6	d299e1b7-7c8f-42e8-8376-d069426a7c04	8e303b4b-2056-430a-9932-f0733563c571	write	\N	2025-09-25 21:52:16.398817
83f2dba1-ffc6-47b7-8040-f35c08fa3a28	d299e1b7-7c8f-42e8-8376-d069426a7c04	e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	write	\N	2025-09-25 21:52:16.398817
4b26fdfc-8efa-4ef6-a3bd-769230ebd596	d299e1b7-7c8f-42e8-8376-d069426a7c04	28026104-a008-4323-8c24-e8b5d1739dce	write	\N	2025-09-25 21:52:16.398817
04bddd03-aa2b-4e54-98e5-7ac74df663c0	d299e1b7-7c8f-42e8-8376-d069426a7c04	e395c321-d203-434f-bbcb-40e0fd48c0e2	write	\N	2025-09-25 21:52:16.398817
37ae8968-b4bf-4a26-bdff-73e80c8df1f5	d299e1b7-7c8f-42e8-8376-d069426a7c04	57187619-bd17-40ae-ba79-99f3fcfd33e1	write	\N	2025-09-25 21:52:16.398817
9d268761-715f-41b7-8172-b033fef70db4	d299e1b7-7c8f-42e8-8376-d069426a7c04	a1652a23-34e8-4fef-ae34-5005e7f8a494	write	\N	2025-09-25 21:52:16.398817
4bebe91e-2944-4684-9d11-798da2173215	d299e1b7-7c8f-42e8-8376-d069426a7c04	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	write	\N	2025-09-25 21:52:16.398817
27123f55-344c-4329-8634-2fdd0be87ec4	d299e1b7-7c8f-42e8-8376-d069426a7c04	f34038fa-a483-4341-984f-75f565bb4315	write	\N	2025-09-25 21:52:16.398817
b9d05242-e491-4c65-81cc-3e8fb3eb698d	d299e1b7-7c8f-42e8-8376-d069426a7c04	43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	write	\N	2025-09-25 21:52:16.398817
8df75c1e-ee28-497c-b1fa-c78f8813e519	d299e1b7-7c8f-42e8-8376-d069426a7c04	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	write	\N	2025-09-25 21:52:16.398817
1ed6b2e7-ab3f-4541-9fe6-0585fd271f20	d299e1b7-7c8f-42e8-8376-d069426a7c04	10d1e4d6-ce02-43c0-b78c-b648b598c695	write	\N	2025-09-25 21:52:16.398817
db93d103-b985-41e7-a349-ac9d66a131dd	d299e1b7-7c8f-42e8-8376-d069426a7c04	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	write	\N	2025-09-25 21:52:16.398817
5ca14d92-d73a-4f85-93e8-9527a0ecb855	d299e1b7-7c8f-42e8-8376-d069426a7c04	7101b2c1-797d-4318-a277-e51d280e1f6e	write	\N	2025-09-25 21:52:16.398817
82cd1833-1864-40c8-908e-7e560265cb54	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	1ad328bc-a842-420d-b342-73524905da1c	write	\N	2025-09-25 21:52:16.399412
0862f16d-2622-4e5c-994f-721cd7d1820b	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	90973b1a-1af0-4e30-8af8-683d30ad1797	write	\N	2025-09-25 21:52:16.399412
7afc9176-bda9-47b3-8490-4021895df131	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	56c195ca-4566-41e3-989a-8f568bdd640f	write	\N	2025-09-25 21:52:16.399412
6c058ede-0816-46c2-bff7-2da5a827c148	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	e395c321-d203-434f-bbcb-40e0fd48c0e2	write	\N	2025-09-25 21:52:16.399412
328007d6-7fea-4242-b018-dcd421dd593d	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	57187619-bd17-40ae-ba79-99f3fcfd33e1	write	\N	2025-09-25 21:52:16.399412
a3d90842-f956-497b-8560-18058c6ec940	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	write	\N	2025-09-25 21:52:16.399412
2ce4d5f7-e9bd-47a1-b48f-5cbf2ad01612	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	10d1e4d6-ce02-43c0-b78c-b648b598c695	write	\N	2025-09-25 21:52:16.399412
0d0ab052-1fc0-404c-9b40-1fc10fa6fb97	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	7101b2c1-797d-4318-a277-e51d280e1f6e	write	\N	2025-09-25 21:52:16.399412
3b9fa48b-c8da-4e17-a123-007f6c8c7a93	63e954bf-abe1-4378-b1b1-1954b6da4bbf	f067355c-02ed-44f5-831b-43e21a51b0b8	full	\N	2025-09-25 21:52:16.399769
8d9cc0a1-d8f6-41e3-8197-072a359e4b90	63e954bf-abe1-4378-b1b1-1954b6da4bbf	a36437dc-580e-47b1-8c63-badc80aa6d2d	full	\N	2025-09-25 21:52:16.399769
a622cf2e-58f1-48eb-9eba-5972fab709c7	63e954bf-abe1-4378-b1b1-1954b6da4bbf	a1652a23-34e8-4fef-ae34-5005e7f8a494	full	\N	2025-09-25 21:52:16.399769
af29db18-5032-498b-ac9b-c864832a2607	63e954bf-abe1-4378-b1b1-1954b6da4bbf	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	full	\N	2025-09-25 21:52:16.399769
2eb6adb0-c282-4e7e-8e68-223d90542737	63e954bf-abe1-4378-b1b1-1954b6da4bbf	f34038fa-a483-4341-984f-75f565bb4315	full	\N	2025-09-25 21:52:16.399769
cbe4eeaa-e819-4621-88c9-d60243464421	63e954bf-abe1-4378-b1b1-1954b6da4bbf	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	full	\N	2025-09-25 21:52:16.399769
e4758840-bf6c-40af-85a1-9d4abd05e41c	63e954bf-abe1-4378-b1b1-1954b6da4bbf	e447c976-03f1-4d98-b481-6a29f18bdeb3	full	\N	2025-09-25 21:52:16.399769
bf52e9da-283a-4aa7-9f01-454f2c58e2ad	63e954bf-abe1-4378-b1b1-1954b6da4bbf	232b533b-fd5c-4e99-ad25-b613fde533c1	full	\N	2025-09-25 21:52:16.399769
0f85765c-a231-4850-9a24-442cab80453d	63e954bf-abe1-4378-b1b1-1954b6da4bbf	56d743af-1ddf-4802-b360-d503d4c70617	full	\N	2025-09-25 21:52:16.399769
eabec4dc-8ba0-40d1-8184-a6d2501652e5	63e954bf-abe1-4378-b1b1-1954b6da4bbf	10d1e4d6-ce02-43c0-b78c-b648b598c695	full	\N	2025-09-25 21:52:16.399769
b9f150ea-c4c9-4866-b219-d70972f633a4	63e954bf-abe1-4378-b1b1-1954b6da4bbf	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	full	\N	2025-09-25 21:52:16.399769
21c1b215-eb63-4068-8d74-4b6b4aae3beb	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	90973b1a-1af0-4e30-8af8-683d30ad1797	write	\N	2025-09-25 21:52:16.400621
cc71f1e1-e415-4a4f-8087-e6635ddaff97	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	56c195ca-4566-41e3-989a-8f568bdd640f	full	\N	2025-09-25 21:52:16.400621
a5a33b07-96ef-4684-8d2c-df88895c31d0	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	e395c321-d203-434f-bbcb-40e0fd48c0e2	write	\N	2025-09-25 21:52:16.400621
31beed0c-c30d-4024-a12e-617a6601add7	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	57187619-bd17-40ae-ba79-99f3fcfd33e1	write	\N	2025-09-25 21:52:16.400621
4c36ec5d-8043-4af7-a01b-e3936b542999	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	a1652a23-34e8-4fef-ae34-5005e7f8a494	write	\N	2025-09-25 21:52:16.400621
6e01cd82-8e2f-4b94-823c-40d68fad2ee5	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	full	\N	2025-09-25 21:52:16.400621
b6d8111b-e01a-4088-bdf8-15c893bbaea6	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	10d1e4d6-ce02-43c0-b78c-b648b598c695	write	\N	2025-09-25 21:52:16.400621
f43eb360-fac2-402e-a4d6-cafa9672c5c7	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	7101b2c1-797d-4318-a277-e51d280e1f6e	write	\N	2025-09-25 21:52:16.400621
581ab902-ec8e-4ffe-bc96-6b7d8d6bf24a	94b16979-72b7-4be8-968d-892028b9a78c	26e76667-b79a-4fe2-b229-68e26e729f89	full	\N	2025-09-25 22:16:30.486542
583b69b3-e5e1-4b6c-b49a-a0a280c3c5e6	cef037ed-c74d-4760-8c9e-822ddbdbe121	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	read	\N	2025-09-25 22:41:51.682382
35f55d6c-30a7-41a2-b1fb-7a45151c1fde	cef037ed-c74d-4760-8c9e-822ddbdbe121	02a64972-a2d5-4aae-bd32-7bece5277932	read	\N	2025-09-25 22:41:51.682382
a14849e8-3bea-4d7c-b8fc-3deece8277e5	cef037ed-c74d-4760-8c9e-822ddbdbe121	d07bcee1-4cb5-4874-a36e-f3e22cd06965	write	\N	2025-09-25 22:41:51.682382
b7fc2b40-16f5-4282-8434-b98773d191b0	cef037ed-c74d-4760-8c9e-822ddbdbe121	10724507-8fdf-4027-8961-0a6b56877bb1	write	\N	2025-09-25 22:41:51.682382
08fe1f76-1bad-492b-ad3e-bb3958fa1e47	cef037ed-c74d-4760-8c9e-822ddbdbe121	41008226-9219-4a8f-9256-f0e8cc5ca809	read	\N	2025-09-25 22:41:51.682382
94f04ef5-796a-4867-8b73-581569ae4d03	cef037ed-c74d-4760-8c9e-822ddbdbe121	ccd01816-991e-4d3b-9d93-ec6b397388bd	read	\N	2025-09-25 22:41:51.682382
57fdaba4-dcd8-417e-84fb-b8c28bee004b	cef037ed-c74d-4760-8c9e-822ddbdbe121	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	full	\N	2025-09-25 22:41:51.682382
0fd90fd3-c44e-4eba-9b05-86693f685b44	cef037ed-c74d-4760-8c9e-822ddbdbe121	64319b48-f6bc-4253-b5af-626e77f1d1cb	full	\N	2025-09-25 22:41:51.682382
a06702c8-c0e4-4ebc-b1da-3a4c9f85f2f0	cef037ed-c74d-4760-8c9e-822ddbdbe121	240de0a8-9480-493a-9fd3-386b0dd755d2	full	\N	2025-09-25 22:41:51.682382
1ebf4958-610a-43b6-8619-1379533d0a9f	cef037ed-c74d-4760-8c9e-822ddbdbe121	da75b893-f234-444e-ac11-d6cf51aabe89	read	\N	2025-09-25 22:41:51.682382
ed088747-89aa-4c1b-bbbf-a96a9b82529e	cef037ed-c74d-4760-8c9e-822ddbdbe121	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:41:51.682382
5e318890-bbfc-4d05-abe5-96a3974cb8f5	cef037ed-c74d-4760-8c9e-822ddbdbe121	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:41:51.682382
0226abf3-a11d-47ef-ae2f-c50402028ef1	cef037ed-c74d-4760-8c9e-822ddbdbe121	0a4f21d5-3f47-4c15-912c-363726b05885	read	\N	2025-09-25 22:41:51.682382
29d24711-2f63-4562-9ce6-d0726199cb15	cef037ed-c74d-4760-8c9e-822ddbdbe121	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:41:51.682382
4a359e99-384a-4413-bd94-f38b9329e280	cef037ed-c74d-4760-8c9e-822ddbdbe121	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:41:51.682382
fcd87bc3-1388-4ebf-bcef-35c8510c0f40	cef037ed-c74d-4760-8c9e-822ddbdbe121	2f8801c2-3c98-4176-9a67-06ff20198560	full	\N	2025-09-25 22:41:51.682382
41cdb698-b1b4-4433-9c1d-9187d3b4b321	cef037ed-c74d-4760-8c9e-822ddbdbe121	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:41:51.682382
f2fc68e7-79b4-4f2b-895b-4abb3488aae8	cef037ed-c74d-4760-8c9e-822ddbdbe121	db0b5c60-1987-4769-bf13-f32e917e9eac	read	\N	2025-09-25 22:41:51.682382
de00357a-99a3-4e9c-bb01-80623d00c4d4	cef037ed-c74d-4760-8c9e-822ddbdbe121	14e38180-49ab-445d-bf6d-2b0d70b4cb24	read	\N	2025-09-25 22:41:51.682382
8faee7cd-0d0e-426b-bb12-c7940a182511	cef037ed-c74d-4760-8c9e-822ddbdbe121	919b1f68-55c1-4497-b9e6-b69dcc5b00cd	read	\N	2025-09-25 22:41:51.682382
b90b69e8-e883-4f8c-8637-0f7c44e90ab8	cef037ed-c74d-4760-8c9e-822ddbdbe121	3377171f-cb47-442c-994c-906e3fb69c1e	read	\N	2025-09-25 22:41:51.682382
9d80dd18-e79e-4bd5-9774-28da261cabfc	cef037ed-c74d-4760-8c9e-822ddbdbe121	6cf427ba-adab-4a0a-8432-2bfe237392e5	read	\N	2025-09-25 22:41:51.682382
2df662dc-1d68-4567-94e5-e7665076696d	cef037ed-c74d-4760-8c9e-822ddbdbe121	5879ebd2-c2af-4c10-99f4-54af16b6ed8e	read	\N	2025-09-25 22:41:51.682382
bf570a07-c033-4ba7-94ec-1f6438751c8b	cef037ed-c74d-4760-8c9e-822ddbdbe121	3087add7-90f3-4381-b5e9-5ab739c34975	read	\N	2025-09-25 22:41:51.682382
c72b64d8-4f26-4c82-a850-eb7d5bcaf874	cef037ed-c74d-4760-8c9e-822ddbdbe121	efab47c1-8594-4a84-afbc-abade5ffd6ad	read	\N	2025-09-25 22:41:51.682382
a193a2c0-4cf9-42bf-b802-420eb7ad5dcd	cef037ed-c74d-4760-8c9e-822ddbdbe121	6b12a124-9a49-43b4-ad63-ebf86b586037	read	\N	2025-09-25 22:41:51.682382
838e7b07-2b39-4019-9910-588b9ffa3849	cef037ed-c74d-4760-8c9e-822ddbdbe121	8929a57b-f3fd-4c98-af63-ac998d1e8101	read	\N	2025-09-25 22:41:51.682382
fdf4e70d-c7f5-4100-8c8b-ea25b8b969ef	cef037ed-c74d-4760-8c9e-822ddbdbe121	84bb70d9-e29b-46c4-b704-bbf73bcb81f0	read	\N	2025-09-25 22:41:51.682382
0539ced2-774b-414f-9f63-cd27c68a1ac8	cef037ed-c74d-4760-8c9e-822ddbdbe121	96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	read	\N	2025-09-25 22:41:51.682382
e85eeddc-7957-4544-b13a-74c8f6651919	cef037ed-c74d-4760-8c9e-822ddbdbe121	22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	read	\N	2025-09-25 22:41:51.682382
dba86df3-9b9e-427e-8580-fcb7a5eae09c	cef037ed-c74d-4760-8c9e-822ddbdbe121	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	full	\N	2025-09-25 22:41:51.682382
e234cdfc-6889-438a-8d38-4b9ec6b3d900	cef037ed-c74d-4760-8c9e-822ddbdbe121	bcabec8b-fab8-4c3b-ad33-2e898353c4db	full	\N	2025-09-25 22:41:51.682382
911b5ba5-cb4e-4490-8e45-10cc3a4b0934	cef037ed-c74d-4760-8c9e-822ddbdbe121	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	full	\N	2025-09-25 22:41:51.682382
68d5a327-057a-4c9b-a30c-beb8a56dc288	cef037ed-c74d-4760-8c9e-822ddbdbe121	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:41:51.682382
5198e6a6-13d3-4964-b1f7-33425bb6efe6	cef037ed-c74d-4760-8c9e-822ddbdbe121	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	read	\N	2025-09-25 22:41:51.682382
6acb50a6-c32f-453f-8c55-81772fae28d0	cef037ed-c74d-4760-8c9e-822ddbdbe121	b088fae8-f4f3-406b-a0b4-85290183127a	read	\N	2025-09-25 22:41:51.682382
27bcda5b-5c82-4b00-8a3f-50145b71a4c8	cef037ed-c74d-4760-8c9e-822ddbdbe121	93a87ed0-3727-4e6a-aebb-d3869540d21b	read	\N	2025-09-25 22:41:51.682382
ce99d272-f8b6-492f-bec0-07b486ce543c	cef037ed-c74d-4760-8c9e-822ddbdbe121	a36437dc-580e-47b1-8c63-badc80aa6d2d	read	\N	2025-09-25 22:41:51.682382
f9c71599-2998-4fe2-b140-6cfb3f68fdde	cef037ed-c74d-4760-8c9e-822ddbdbe121	1ad328bc-a842-420d-b342-73524905da1c	read	\N	2025-09-25 22:41:51.682382
2ee8b03f-b359-4c95-9d47-dfd75a859517	cef037ed-c74d-4760-8c9e-822ddbdbe121	5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	read	\N	2025-09-25 22:41:51.682382
9c397b30-6b2d-4ada-ba9d-f922af5274f5	cef037ed-c74d-4760-8c9e-822ddbdbe121	413ec926-cbc1-4f9b-a728-6b711ceba516	read	\N	2025-09-25 22:41:51.682382
0c03f26f-0911-4fa1-842e-82856b4ce7de	cef037ed-c74d-4760-8c9e-822ddbdbe121	798c3dff-c458-4513-afbb-83f241033832	read	\N	2025-09-25 22:41:51.682382
d41b9e11-3392-46ce-9558-48643571f7aa	cef037ed-c74d-4760-8c9e-822ddbdbe121	e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	read	\N	2025-09-25 22:41:51.682382
0a26b4c8-b0a5-4464-92ba-4b6eb6e80991	cef037ed-c74d-4760-8c9e-822ddbdbe121	28026104-a008-4323-8c24-e8b5d1739dce	read	\N	2025-09-25 22:41:51.682382
6dacaf8b-7b98-4274-8797-76ddfee0fe45	cef037ed-c74d-4760-8c9e-822ddbdbe121	e395c321-d203-434f-bbcb-40e0fd48c0e2	read	\N	2025-09-25 22:41:51.682382
26a46348-b261-4b38-981d-2da09699a70c	cef037ed-c74d-4760-8c9e-822ddbdbe121	57187619-bd17-40ae-ba79-99f3fcfd33e1	read	\N	2025-09-25 22:41:51.682382
864ce8ba-247c-4e2d-b865-9574da197334	cef037ed-c74d-4760-8c9e-822ddbdbe121	a1652a23-34e8-4fef-ae34-5005e7f8a494	read	\N	2025-09-25 22:41:51.682382
84c50d5f-40a0-4c8b-a147-243107d344e9	cef037ed-c74d-4760-8c9e-822ddbdbe121	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	read	\N	2025-09-25 22:41:51.682382
a59cd46c-9acb-41ed-8aec-9518249cfde0	cef037ed-c74d-4760-8c9e-822ddbdbe121	f34038fa-a483-4341-984f-75f565bb4315	read	\N	2025-09-25 22:41:51.682382
8f9913bf-6845-4de7-884c-91e0b27c2076	cef037ed-c74d-4760-8c9e-822ddbdbe121	edbe9ab8-50f4-4aa0-996c-5e043a2eb5b7	read	\N	2025-09-25 22:41:51.682382
1af7664b-b5e5-4a1d-9190-6adeceb4166f	cef037ed-c74d-4760-8c9e-822ddbdbe121	43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	read	\N	2025-09-25 22:41:51.682382
fe1894d5-ea0a-4f13-bc98-bd73a6558cfc	cef037ed-c74d-4760-8c9e-822ddbdbe121	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	read	\N	2025-09-25 22:41:51.682382
d81146c0-ca58-42bf-acbc-c891f4be365a	cef037ed-c74d-4760-8c9e-822ddbdbe121	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	read	\N	2025-09-25 22:41:51.682382
1f1b69c1-3860-4066-bb31-7d793e73857f	cef037ed-c74d-4760-8c9e-822ddbdbe121	e447c976-03f1-4d98-b481-6a29f18bdeb3	write	\N	2025-09-25 22:41:51.682382
1c13cf0a-4a3b-4304-a9bf-a182cb2b2ee8	cef037ed-c74d-4760-8c9e-822ddbdbe121	232b533b-fd5c-4e99-ad25-b613fde533c1	read	\N	2025-09-25 22:41:51.682382
8760d45f-c591-410f-a894-279e25a74e55	cef037ed-c74d-4760-8c9e-822ddbdbe121	56d743af-1ddf-4802-b360-d503d4c70617	write	\N	2025-09-25 22:41:51.682382
2cb1008f-23c8-4f61-9c5c-774f1301eeb7	cef037ed-c74d-4760-8c9e-822ddbdbe121	08a36eac-bd37-4e6a-8f47-6461b7672734	full	\N	2025-09-25 22:41:51.682382
81f04ae4-4487-477d-b80d-1dc259c1456b	cef037ed-c74d-4760-8c9e-822ddbdbe121	90c96a7d-7049-4b70-8d60-2af92d3029ec	read	\N	2025-09-25 22:41:51.682382
e8a452e7-dc35-4637-b411-eb118687e819	cef037ed-c74d-4760-8c9e-822ddbdbe121	7c9b3bc2-66b8-4cfd-ae84-95762298d918	full	\N	2025-09-25 22:41:51.682382
022a438e-b619-4488-a846-4990c84e4a7c	cef037ed-c74d-4760-8c9e-822ddbdbe121	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	full	\N	2025-09-25 22:41:51.682382
e7d65e12-eca6-4640-9818-838350c5334e	cef037ed-c74d-4760-8c9e-822ddbdbe121	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	full	\N	2025-09-25 22:41:51.682382
e3f017b8-d855-4f65-9bd9-40a87af10df9	cef037ed-c74d-4760-8c9e-822ddbdbe121	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:41:51.682382
18a5b24a-af68-46cf-a0ca-6b101513744e	cef037ed-c74d-4760-8c9e-822ddbdbe121	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	read	\N	2025-09-25 22:41:51.682382
78b77902-b1d5-417c-9051-1da5ed636339	cef037ed-c74d-4760-8c9e-822ddbdbe121	7101b2c1-797d-4318-a277-e51d280e1f6e	read	\N	2025-09-25 22:41:51.682382
0a3d538b-b06d-4dd2-8ab7-14d1764bf7ac	cef037ed-c74d-4760-8c9e-822ddbdbe121	c320e930-8a64-40e2-81c5-9e11015b7621	full	\N	2025-09-25 22:41:51.682382
f5c75c46-d20e-4e9f-982f-8be0189c3fb5	efe96241-ae03-4c8a-9419-fb2cec733204	d07bcee1-4cb5-4874-a36e-f3e22cd06965	full	\N	2025-09-25 22:42:10.246873
a09e33ba-b913-42be-8c23-6b9ae6952b5b	efe96241-ae03-4c8a-9419-fb2cec733204	10724507-8fdf-4027-8961-0a6b56877bb1	full	\N	2025-09-25 22:42:10.246873
1f0c17a7-4edd-49fa-922c-73211113e197	efe96241-ae03-4c8a-9419-fb2cec733204	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	full	\N	2025-09-25 22:42:10.246873
811c5f5d-d51d-4fae-98a1-019a6a5909e5	efe96241-ae03-4c8a-9419-fb2cec733204	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	full	\N	2025-09-25 22:42:10.246873
35d592b3-3a8c-44ec-876d-17052f27f9b1	efe96241-ae03-4c8a-9419-fb2cec733204	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	read	\N	2025-09-25 22:42:10.246873
ea2e78f8-bd0c-46c4-b753-942eea972833	efe96241-ae03-4c8a-9419-fb2cec733204	bcabec8b-fab8-4c3b-ad33-2e898353c4db	read	\N	2025-09-25 22:42:10.246873
1e021f6a-f4ef-4751-ac20-02fc6d706c2b	efe96241-ae03-4c8a-9419-fb2cec733204	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	full	\N	2025-09-25 22:42:10.246873
38764f47-cdef-43b0-8061-822d384c656f	efe96241-ae03-4c8a-9419-fb2cec733204	f067355c-02ed-44f5-831b-43e21a51b0b8	full	\N	2025-09-25 22:42:10.246873
2373c713-d6e4-4692-ab29-249723ae26f9	efe96241-ae03-4c8a-9419-fb2cec733204	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	read	\N	2025-09-25 22:42:10.246873
8cfa4fae-ea8a-41a9-b51d-d01be10c7f9a	efe96241-ae03-4c8a-9419-fb2cec733204	f34038fa-a483-4341-984f-75f565bb4315	read	\N	2025-09-25 22:42:10.246873
43db27c3-d41e-45a5-b0eb-de655bb13f58	efe96241-ae03-4c8a-9419-fb2cec733204	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	full	\N	2025-09-25 22:42:10.246873
4daef5e3-2999-4150-bd4b-86c302b6926c	efe96241-ae03-4c8a-9419-fb2cec733204	e447c976-03f1-4d98-b481-6a29f18bdeb3	full	\N	2025-09-25 22:42:10.246873
e864e3e9-e4d1-4e1c-a3a0-4bea6966a61b	a81d18e1-8291-4d0e-b875-1b81a5147730	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:10.161044
9bf060c1-982d-4ac6-938e-5054cfb0b9b0	bdd476be-7637-4144-9836-58605a7f4ad3	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:10.161044
007a6111-4336-408e-be9c-1de6d8d26cc6	a81d18e1-8291-4d0e-b875-1b81a5147730	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:10.161044
b85f2bfb-50e5-4e9b-9246-8c79d5a65212	bdd476be-7637-4144-9836-58605a7f4ad3	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:10.161044
4f73666b-8e1c-4f92-945f-c773cbe88c21	a81d18e1-8291-4d0e-b875-1b81a5147730	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:10.161044
7cccf992-ff0b-49d2-a018-843afde2af23	bdd476be-7637-4144-9836-58605a7f4ad3	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:10.161044
f72e80bc-2f7a-4a25-b5b5-831e04627b6d	a81d18e1-8291-4d0e-b875-1b81a5147730	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:10.161044
7983e890-132a-4758-8e1c-20c3a3590a31	bdd476be-7637-4144-9836-58605a7f4ad3	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:10.161044
5b30a277-45b5-4e56-8d40-7e3c4ca3dc88	a81d18e1-8291-4d0e-b875-1b81a5147730	2f8801c2-3c98-4176-9a67-06ff20198560	write	\N	2025-09-25 22:44:10.161044
7eb50b1e-b1f6-44ad-9e03-774342327815	bdd476be-7637-4144-9836-58605a7f4ad3	2f8801c2-3c98-4176-9a67-06ff20198560	read	\N	2025-09-25 22:44:10.161044
03458935-5266-4f30-8536-0c34fdc54ee5	a81d18e1-8291-4d0e-b875-1b81a5147730	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:10.161044
5a0e21bd-b488-43e5-97fd-c86adb34d3aa	bdd476be-7637-4144-9836-58605a7f4ad3	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:10.161044
4ef69dc2-1171-491b-a643-0c33f4a3060e	a81d18e1-8291-4d0e-b875-1b81a5147730	7c9b3bc2-66b8-4cfd-ae84-95762298d918	read	\N	2025-09-25 22:44:10.161044
3c16ba3f-46fb-45c7-9f2a-3709f6e62010	bdd476be-7637-4144-9836-58605a7f4ad3	7c9b3bc2-66b8-4cfd-ae84-95762298d918	read	\N	2025-09-25 22:44:10.161044
9dd06f59-b235-4c0f-8bc7-b59f816e35d2	a81d18e1-8291-4d0e-b875-1b81a5147730	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	write	\N	2025-09-25 22:44:10.161044
e9c380e6-dd66-4bf2-91dc-282163bd9930	bdd476be-7637-4144-9836-58605a7f4ad3	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	read	\N	2025-09-25 22:44:10.161044
cf2e1b28-79c9-4388-a4ae-ffe04fec1024	a81d18e1-8291-4d0e-b875-1b81a5147730	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	write	\N	2025-09-25 22:44:10.161044
27c836a2-3610-4553-8118-658cceaa8486	bdd476be-7637-4144-9836-58605a7f4ad3	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	read	\N	2025-09-25 22:44:10.161044
24df7fa2-9cfc-4dc2-9b54-de22348316c0	a81d18e1-8291-4d0e-b875-1b81a5147730	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:10.161044
96c92749-73d9-4984-aeb9-309ed2a63183	bdd476be-7637-4144-9836-58605a7f4ad3	10d1e4d6-ce02-43c0-b78c-b648b598c695	write	\N	2025-09-25 22:44:10.161044
79b76cd7-9993-4698-8bba-eabe4a522b2a	a81d18e1-8291-4d0e-b875-1b81a5147730	7101b2c1-797d-4318-a277-e51d280e1f6e	read	\N	2025-09-25 22:44:10.161044
884f18b8-a5bd-469f-8bb0-46673009a6bc	bdd476be-7637-4144-9836-58605a7f4ad3	7101b2c1-797d-4318-a277-e51d280e1f6e	write	\N	2025-09-25 22:44:10.161044
a544b0df-e480-4757-9ae6-7aa1e5ab5245	63f3fe24-4a5b-4e95-9f24-10467ada4949	d07bcee1-4cb5-4874-a36e-f3e22cd06965	read	\N	2025-09-25 22:44:50.545921
48936b9e-9137-4bfb-b4d1-fe58d49a6d43	db49d211-1fe9-4673-91ae-8660b39da6d9	d07bcee1-4cb5-4874-a36e-f3e22cd06965	read	\N	2025-09-25 22:44:50.545921
5e524c5d-77f1-474c-a88d-f9192f126972	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	d07bcee1-4cb5-4874-a36e-f3e22cd06965	read	\N	2025-09-25 22:44:50.545921
f7468b3b-1e0c-4e8f-805b-c244a889a0da	2600f432-59a1-4201-969f-377c9f0117ff	d07bcee1-4cb5-4874-a36e-f3e22cd06965	read	\N	2025-09-25 22:44:50.545921
2c6dcdcc-556a-449e-ae4c-dbe2553057fc	68a12d75-1505-4282-aa2b-589bffa95c1d	d07bcee1-4cb5-4874-a36e-f3e22cd06965	write	\N	2025-09-25 22:44:50.545921
c656985a-8d87-4d21-801f-5ba91e560a1f	c902ceb6-36b5-419b-902c-4b4bb6ed434f	d07bcee1-4cb5-4874-a36e-f3e22cd06965	read	\N	2025-09-25 22:44:50.545921
0ab9c03d-eebf-4167-b311-77ec05254e4a	63f3fe24-4a5b-4e95-9f24-10467ada4949	10724507-8fdf-4027-8961-0a6b56877bb1	read	\N	2025-09-25 22:44:50.545921
4a5ca087-6e54-462c-b474-5fd04bce689f	db49d211-1fe9-4673-91ae-8660b39da6d9	10724507-8fdf-4027-8961-0a6b56877bb1	read	\N	2025-09-25 22:44:50.545921
d6d11d45-5111-4827-aa6e-562111ad1aac	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	10724507-8fdf-4027-8961-0a6b56877bb1	read	\N	2025-09-25 22:44:50.545921
9bbded2d-9d2c-4230-af45-bb49f0cc78fa	2600f432-59a1-4201-969f-377c9f0117ff	10724507-8fdf-4027-8961-0a6b56877bb1	read	\N	2025-09-25 22:44:50.545921
081917a2-d80b-4c41-9518-4d6e852c934e	68a12d75-1505-4282-aa2b-589bffa95c1d	10724507-8fdf-4027-8961-0a6b56877bb1	write	\N	2025-09-25 22:44:50.545921
5f2351f3-fb4d-426a-95d3-0dbe8dd678b8	c902ceb6-36b5-419b-902c-4b4bb6ed434f	10724507-8fdf-4027-8961-0a6b56877bb1	read	\N	2025-09-25 22:44:50.545921
e8fdc59e-cb63-44ee-8953-39efb83b622a	63f3fe24-4a5b-4e95-9f24-10467ada4949	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
0711351a-3a22-4173-a7a2-fa5fdb95b84e	db49d211-1fe9-4673-91ae-8660b39da6d9	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
797a125a-10fb-4a42-92c5-2062fe88a891	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
e8a46d3f-ce3e-480f-8471-3cfc9a12d62a	2600f432-59a1-4201-969f-377c9f0117ff	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
03a2f3a8-97b5-4bbc-8510-bead3ab26cdd	68a12d75-1505-4282-aa2b-589bffa95c1d	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
0b466d4d-86d9-45a6-a736-12698d676cc5	c902ceb6-36b5-419b-902c-4b4bb6ed434f	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	read	\N	2025-09-25 22:44:50.545921
c11dc10f-4699-4df3-8d0c-cf1a3dff8bf9	63f3fe24-4a5b-4e95-9f24-10467ada4949	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:50.545921
b6e43a5c-142e-40ce-8372-f402ba040a22	db49d211-1fe9-4673-91ae-8660b39da6d9	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:50.545921
6bc7e78c-57c6-488d-8d1e-bd9494102813	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:50.545921
40327332-90fa-48f8-9497-26151730c079	2600f432-59a1-4201-969f-377c9f0117ff	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:50.545921
88b40ece-8784-4948-8107-bb64f5504964	68a12d75-1505-4282-aa2b-589bffa95c1d	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	write	\N	2025-09-25 22:44:50.545921
7a34dcca-e648-4f48-8913-5dfc0270df9f	c902ceb6-36b5-419b-902c-4b4bb6ed434f	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	read	\N	2025-09-25 22:44:50.545921
faf541b0-83d0-41cd-9013-797913929167	63f3fe24-4a5b-4e95-9f24-10467ada4949	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
6e6e2ce3-3d80-4877-9b5b-7dc6bcff2fbb	db49d211-1fe9-4673-91ae-8660b39da6d9	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
78f22b1c-8be8-4342-8742-ac2ac1b97683	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
d657bc13-5e48-4747-b58c-43dc74ed6dda	2600f432-59a1-4201-969f-377c9f0117ff	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
c7abedb2-00fa-4efa-a592-6dc35f6a141f	68a12d75-1505-4282-aa2b-589bffa95c1d	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
d537a359-313b-4326-9945-75623dac8eaa	c902ceb6-36b5-419b-902c-4b4bb6ed434f	f90d6eba-0099-45a7-9b65-1058bf625459	read	\N	2025-09-25 22:44:50.545921
13fcb3b7-c6f2-4380-bc98-67d76279a111	63f3fe24-4a5b-4e95-9f24-10467ada4949	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
5cbb8df7-d808-4b6d-a7f4-e517aabd3223	db49d211-1fe9-4673-91ae-8660b39da6d9	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
5d01558c-2459-4da9-b95f-d89623ffec2b	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
6a6348cf-7d07-4802-a77b-72a6d4cdd0ac	2600f432-59a1-4201-969f-377c9f0117ff	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
5a8ae77f-5d14-4f6f-bd72-0d10fa15c489	68a12d75-1505-4282-aa2b-589bffa95c1d	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
14ab2916-3f87-461a-8d08-392eda15827e	c902ceb6-36b5-419b-902c-4b4bb6ed434f	26e76667-b79a-4fe2-b229-68e26e729f89	read	\N	2025-09-25 22:44:50.545921
d692b057-67f1-4bd3-95ab-7778b4c208d0	63f3fe24-4a5b-4e95-9f24-10467ada4949	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
2fd025f8-5600-4e6c-8d11-e78b94bf277e	db49d211-1fe9-4673-91ae-8660b39da6d9	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
3a8d443e-6610-49cd-96d3-6df595140281	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
cd3da7d9-9a85-4a69-ad01-b9f1e3fb3e82	2600f432-59a1-4201-969f-377c9f0117ff	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
36768504-e935-4bb0-b884-e1f0b5c9edb7	68a12d75-1505-4282-aa2b-589bffa95c1d	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
e7714fcd-ec2c-439f-af84-1545f42269a5	c902ceb6-36b5-419b-902c-4b4bb6ed434f	1166962d-e611-4d09-a0bd-6de6890e0aaf	read	\N	2025-09-25 22:44:50.545921
b3617127-efca-4e8e-9d9d-d3813c034169	63f3fe24-4a5b-4e95-9f24-10467ada4949	2f8801c2-3c98-4176-9a67-06ff20198560	full	\N	2025-09-25 22:44:50.545921
46c6280e-7f1b-49d3-b1b6-1233c96c6f30	db49d211-1fe9-4673-91ae-8660b39da6d9	2f8801c2-3c98-4176-9a67-06ff20198560	full	\N	2025-09-25 22:44:50.545921
13d9c1c3-1bae-4594-81cd-92f07d8572e0	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	2f8801c2-3c98-4176-9a67-06ff20198560	read	\N	2025-09-25 22:44:50.545921
8c790923-ec13-4114-9857-812139e90ad7	2600f432-59a1-4201-969f-377c9f0117ff	2f8801c2-3c98-4176-9a67-06ff20198560	write	\N	2025-09-25 22:44:50.545921
9f21d8fd-f455-4259-8d2b-0cb437e71b0d	68a12d75-1505-4282-aa2b-589bffa95c1d	2f8801c2-3c98-4176-9a67-06ff20198560	read	\N	2025-09-25 22:44:50.545921
71338ef2-9449-4f4a-a51b-252779dece2e	c902ceb6-36b5-419b-902c-4b4bb6ed434f	2f8801c2-3c98-4176-9a67-06ff20198560	read	\N	2025-09-25 22:44:50.545921
f2987d0d-cccb-4a5e-9108-1f2fec769b80	63f3fe24-4a5b-4e95-9f24-10467ada4949	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
927fc21e-7a4b-4f41-ac29-080c6ccd5c94	db49d211-1fe9-4673-91ae-8660b39da6d9	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
b62d233b-cedc-4c4f-a79f-2946164f2911	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
97005d51-6679-45c8-9560-525d29d2a5fd	2600f432-59a1-4201-969f-377c9f0117ff	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
01cb8f8c-b9e5-4561-a438-3344b5d7482a	68a12d75-1505-4282-aa2b-589bffa95c1d	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
d11890df-c1d0-4000-afa3-8433dc2c45e5	c902ceb6-36b5-419b-902c-4b4bb6ed434f	60a265a0-4d91-454e-a77a-bf21db598ef9	read	\N	2025-09-25 22:44:50.545921
3437a9f6-f3af-4d2d-b567-93303ba3cba5	63f3fe24-4a5b-4e95-9f24-10467ada4949	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
cc4f55d9-e20f-465d-9698-f58151f171e6	db49d211-1fe9-4673-91ae-8660b39da6d9	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
d6ae03d8-21c3-4a81-b73f-a9308733582f	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
fec92371-98b3-4ea9-b3cf-286701f0b717	2600f432-59a1-4201-969f-377c9f0117ff	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
a543796a-1dc5-40de-8a8c-3e69e4446f50	68a12d75-1505-4282-aa2b-589bffa95c1d	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
59e26d99-c2c6-4983-94a8-696c79c0aceb	c902ceb6-36b5-419b-902c-4b4bb6ed434f	f067355c-02ed-44f5-831b-43e21a51b0b8	read	\N	2025-09-25 22:44:50.545921
e2aa9d58-8fdf-45f2-a134-347440e80321	63f3fe24-4a5b-4e95-9f24-10467ada4949	e447c976-03f1-4d98-b481-6a29f18bdeb3	read	\N	2025-09-25 22:44:50.545921
8c5713c2-7531-426d-ad62-31a7576f4dc5	db49d211-1fe9-4673-91ae-8660b39da6d9	e447c976-03f1-4d98-b481-6a29f18bdeb3	read	\N	2025-09-25 22:44:50.545921
4a2af04a-e216-412f-b27d-b0e36cd06a93	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	e447c976-03f1-4d98-b481-6a29f18bdeb3	read	\N	2025-09-25 22:44:50.545921
078e0a2a-04e1-45b4-8917-df2288b9daf0	2600f432-59a1-4201-969f-377c9f0117ff	e447c976-03f1-4d98-b481-6a29f18bdeb3	read	\N	2025-09-25 22:44:50.545921
83fe7abf-53a9-47c2-8226-cc79bc222114	68a12d75-1505-4282-aa2b-589bffa95c1d	e447c976-03f1-4d98-b481-6a29f18bdeb3	write	\N	2025-09-25 22:44:50.545921
3e952840-4712-4daf-ad72-c6de5b036779	c902ceb6-36b5-419b-902c-4b4bb6ed434f	e447c976-03f1-4d98-b481-6a29f18bdeb3	read	\N	2025-09-25 22:44:50.545921
83b773fa-7783-4c99-82d1-9c701429981d	63f3fe24-4a5b-4e95-9f24-10467ada4949	7c9b3bc2-66b8-4cfd-ae84-95762298d918	full	\N	2025-09-25 22:44:50.545921
90e5504f-390f-4ed4-b9bc-8001d23651dc	db49d211-1fe9-4673-91ae-8660b39da6d9	7c9b3bc2-66b8-4cfd-ae84-95762298d918	full	\N	2025-09-25 22:44:50.545921
e0376d29-2d4f-4b59-9b23-9d43e4692e0f	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	7c9b3bc2-66b8-4cfd-ae84-95762298d918	full	\N	2025-09-25 22:44:50.545921
60268472-dd34-4a1a-93ff-d2fbc45d7b48	2600f432-59a1-4201-969f-377c9f0117ff	7c9b3bc2-66b8-4cfd-ae84-95762298d918	read	\N	2025-09-25 22:44:50.545921
09a234a3-1cf9-4d35-bd51-79e49933e8c7	68a12d75-1505-4282-aa2b-589bffa95c1d	7c9b3bc2-66b8-4cfd-ae84-95762298d918	read	\N	2025-09-25 22:44:50.545921
d08c7abe-3482-4b77-a789-35056910aa95	c902ceb6-36b5-419b-902c-4b4bb6ed434f	7c9b3bc2-66b8-4cfd-ae84-95762298d918	read	\N	2025-09-25 22:44:50.545921
2cad824b-c1f0-4737-9c19-8053b8e49817	63f3fe24-4a5b-4e95-9f24-10467ada4949	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	full	\N	2025-09-25 22:44:50.545921
068c3c3b-c252-4987-9acb-c63390f2612c	db49d211-1fe9-4673-91ae-8660b39da6d9	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	write	\N	2025-09-25 22:44:50.545921
0ca770d2-d129-4829-97a9-a44f504c3aa9	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	full	\N	2025-09-25 22:44:50.545921
d42f23e8-a49e-41dd-b307-44a2a3b92940	2600f432-59a1-4201-969f-377c9f0117ff	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	read	\N	2025-09-25 22:44:50.545921
2ef787b5-efd2-4f84-b73c-7653acc0fc7d	68a12d75-1505-4282-aa2b-589bffa95c1d	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	read	\N	2025-09-25 22:44:50.545921
36feb7c3-9130-4a5e-b207-4ad557e56664	c902ceb6-36b5-419b-902c-4b4bb6ed434f	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	read	\N	2025-09-25 22:44:50.545921
b1d5a7dd-229d-464a-84d5-5ad40d517769	63f3fe24-4a5b-4e95-9f24-10467ada4949	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	full	\N	2025-09-25 22:44:50.545921
d117d26f-3dbc-406f-ae85-da072489581f	db49d211-1fe9-4673-91ae-8660b39da6d9	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	full	\N	2025-09-25 22:44:50.545921
63d9999f-24d2-4107-b987-66991f14e129	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	read	\N	2025-09-25 22:44:50.545921
2085eb5d-b5a2-4f08-94ea-e7f2ff29add4	2600f432-59a1-4201-969f-377c9f0117ff	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	read	\N	2025-09-25 22:44:50.545921
658076c0-f165-4d20-a212-2ee6b3b92348	68a12d75-1505-4282-aa2b-589bffa95c1d	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	read	\N	2025-09-25 22:44:50.545921
9c1d6c64-216c-4809-9808-d55d30fad47f	c902ceb6-36b5-419b-902c-4b4bb6ed434f	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	read	\N	2025-09-25 22:44:50.545921
2259ba85-f405-4ffd-a659-934195b6926f	63f3fe24-4a5b-4e95-9f24-10467ada4949	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
695be81a-dc34-4d3c-816b-be711b40c76c	db49d211-1fe9-4673-91ae-8660b39da6d9	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
b0e648ad-4a58-48c1-abc9-05aaa0adb4a2	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
97dcb8c7-080c-450c-b37d-2186bd7efaec	2600f432-59a1-4201-969f-377c9f0117ff	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
6571b047-edac-45cb-90a3-1169628da517	68a12d75-1505-4282-aa2b-589bffa95c1d	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
df14f531-ca95-4476-b3b6-631e8b6e4274	c902ceb6-36b5-419b-902c-4b4bb6ed434f	10d1e4d6-ce02-43c0-b78c-b648b598c695	read	\N	2025-09-25 22:44:50.545921
\.


--
-- Data for Name: rbac_roles; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.rbac_roles (id, code, name, description, level, is_system_role, created_at, updated_at) FROM stdin;
42bd9481-5511-4dd0-b2ba-bdcb56d49c10	platform_admin	Platform Administrator	Full platform access across all tenants	0	t	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
fe51835b-8350-4297-a9f5-0cd503c75733	tenant_admin	Tenant Administrator	Full access within tenant boundary	1	t	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
94b16979-72b7-4be8-968d-892028b9a78c	ceo	Chief Executive Officer	Highest authority within bank tenant	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
f73969e9-1094-4402-bd30-5b6017eb3df5	coo	Chief Operating Officer	Operations oversight and strategic decisions	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
e8978ed0-8a2d-4cab-80c7-a6a7a8975248	cfo	Chief Financial Officer	Financial oversight and compliance	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
0e342384-3b13-47a9-8ddd-23ee6e091f96	cto	Chief Technology Officer	Technology and security oversight	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
63e954bf-abe1-4378-b1b1-1954b6da4bbf	compliance_officer	Compliance Officer	Regulatory compliance and risk management	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
07ed3bb6-c083-49e0-a3ba-09f96f9ea6d4	head_of_operations	Head of Operations	Daily operations management	1	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
d299e1b7-7c8f-42e8-8376-d069426a7c04	branch_manager	Branch Manager	Branch-level management and oversight	2	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
657c788f-4890-45f7-b772-ff7d7effd1e0	assistant_branch_manager	Assistant Branch Manager	Support branch management functions	2	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
490af44c-9aec-48fd-a16e-8e95d95a4b95	operations_manager	Operations Manager	Operations management at branch level	2	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
1dc43912-672c-4892-9d99-8de85420eeb9	customer_service_manager	Customer Service Manager	Customer service oversight	2	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	loan_officer	Loan Officer	Loan processing and management	3	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	bank_teller	Bank Teller	Front-line customer service	3	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	customer_service_rep	Customer Service Representative	Customer support and basic transactions	3	f	2025-09-25 21:37:11.591933	2025-09-25 21:37:11.591933
cef037ed-c74d-4760-8c9e-822ddbdbe121	it_manager	IT Manager	Head of IT department and technology operations	2	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
efe96241-ae03-4c8a-9419-fb2cec733204	security_manager	Security Manager	Information security and cybersecurity oversight	2	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
a81d18e1-8291-4d0e-b875-1b81a5147730	senior_software_engineer	Senior Software Engineer	Lead developer and technical architecture	2	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
63f3fe24-4a5b-4e95-9f24-10467ada4949	devops_manager	DevOps Manager	Infrastructure and deployment operations management	2	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
bdd476be-7637-4144-9836-58605a7f4ad3	software_engineer	Software Engineer	Application development and maintenance	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
db49d211-1fe9-4673-91ae-8660b39da6d9	system_administrator	System Administrator	Server and infrastructure administration	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	database_administrator	Database Administrator	Database management and maintenance	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
2600f432-59a1-4201-969f-377c9f0117ff	network_administrator	Network Administrator	Network infrastructure and connectivity	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
68a12d75-1505-4282-aa2b-589bffa95c1d	security_analyst	Security Analyst	Security monitoring and incident response	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
c902ceb6-36b5-419b-902c-4b4bb6ed434f	qa_engineer	QA Engineer	Quality assurance and testing	3	f	2025-09-25 22:40:46.948545	2025-09-25 22:40:46.948545
\.


--
-- Data for Name: receipt_templates; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.receipt_templates (id, tenant_id, transaction_type, template_name, template_content, template_variables, is_active, is_default, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_assets; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.tenant_assets (id, tenant_id, asset_type, asset_name, asset_data, mime_type, file_size, dimensions, metadata, created_at, updated_at) FROM stdin;
d21907d3-6fd3-4e5a-8ee2-00479039a83d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	logo	default	iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACz6LpGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO2deZxUxbn3v3V6mZ59XxhgxBERCQICIvISMCQaQkwkLtFo3KNCiPF6fb1eLgxGRz5cYxQJIUqQgHGNcSG+XkPUECSKBJFwEQFxWByGYTZ6emZ679On3j/qdE93T8/KoPfG/n0+B7pP16l6qk499axVI/gCcNVVz2tHjnQUBQL6xS6X/1KXKzA2Pd02EgyrrktXMGjsGTIkc29enuPlnJy0HYWFaa7x44uNf//3r38R5KbwJYb4PBv78Y//yEcfNRc1NHjmNjZ6Fng8oTHhsLQnJUyA1ap5s7LsO8rKMteWl2e/VlmZ61qz5nufJ8kpfMnxuTHIpZc+ox0/7pl8+HDbotZW/yxdN7L6+qzdrrkLCtJfO/PM/GUjR+buXbfuSuNU0ppCChF8LgzyrW89S21t64za2vZVbndwjJRo/a1DCIzc3LQ9Z5yRt+Ccc4q2rl+fYpIUTj1OOYNMmvSk5nS6pzY0uJ/2+fTKk60vK8u2//TT866dOLFw51NPXT0YJKaQQrewnMrKJ0x4Qmts7Jje2OhZHQiERw1GncGgURAMhifYbNa/zZ1724m///35wag2hRSS4pQxyAUX/FZraOiY1dzsfSwYDI9h8KSVCATC5aGQzEpPt2w6cODV4CDVm0IKXdBvW6AvmD79t9pnn7VOb2nxLg8Gw2MHux0p0ZxO3xV1dZ7pAKGWPxNqecOqn/jTYDaTQgqDzyAzZ67n009dU1pavKv9fn3QmSOCQCCcU1/fcdMVV7xgD/vrHJ6G925uPfJ2hXP/Y6eiuRS+pBjUyTt16lrtwAHnjBMn3E8Hg+HRg1l3MrhcgQs/+6yt0t/eEGw/uj2n49i2Vf7GD4a59i0/1U2n8CXBoDHIrFnrrI2NHbOcTs/jum6MHKx6e4KuGwUeT2jG5o/GGgjrbt3TPM3vrFnlafrvEU0f3Pl5kJDCPzkGhUG++tUntUOHXDMaGtwrAoHwmMGosy8wDGn1+/XxDa15Wlp+ZYOwpPlDnuY5/hMfLwu768va9z38eZGSwj8pTppBrrrqOT77zD39+HH3Kp9P/9yYI4Jw2Chvbw9a07IqXJrF7pXSsOreE5f52+oe8rUdKvm86UnhnwsnxSAXXbRe+/DDlhmNjR1rA4FTb3Mkg8+n25ub3Voo4PQa4UA7gJSGPehuvMbTsGvZ8b/dWPBF0JXCPwesA33wgguetB450jarrq59RSAQ/lxsjmRIS7O48/MzdGtaZo7QbDmR+1Ia1pC78YdI3X9s0/eqMnKHOfMnrfyiyEzhfykGJEFUnKNtxtGjHY/4/V+M5ACVn5WWZj2SmWk3Qu1H86QRzAGQ5mVIwx70nLjZ33pkka/1cF7zB7d9UaSm8L8U/WaQ//iPt2hvD1x84oRvpRnnGFjDmjAyMmztwICTDoUQwfR02wc3fPNDw9d6qMQIBRxIFbKPXEjDofva5vndzffpAVnQ9tGSgTaXwpcQ/WKQyZPX8uqrn0w/eNC5OhAYuEEuBMbpp+dumDix7NL8fMfWgdaTkWGrz89P2xYOuqzSCH9VSiMjWUKLlEZGyNPyY79z76JAR32f0+xTSKHPDHL++Wu148fbZtXUONd6PKGKATeoCX348JyXJk8uu/3rX6/YPHXq0AUlJZlbheifJBECvbDQ8cysWcPqA86aEt3XejHSsIJSrxIhjbA92NHwE0/LgaVNH/xrTpIiKaTQBX1KIPzmN5+yfvRRy4yWFu9KM/FwQLBYRHDIkKwN55035K5H/+8n9ZnW5iynp8R/x7LTR+/a1fB4c7NvGn1k2pyctF2jRhV8780nj9S6Gz682uc8tFqG9SwAKdWOxGQQFmswvWDkrxz5Z94vCLcXn//rgXYnhS8Bep2Ml1/+orZvn3NGa6tv1Ukyhz5sWPaGyZPL7r71+x319sBHo7xNu5dnhrbNefK+/95/5pmFtxYXZ2yjDzaJw2FpGTo0q3rkGbm1gfaj5SGv8/YIc0TEh4wRI7ESRYZ1u895cJ6nYcePg97mjIH2J4UvB3pkkG9963k+/LB+WmOjZ7XPpw/YW6VpwqioyHllwoTSu+Zf46k7t/yvlb7WI6sCbcdu9Ltql2ve/bNX/6yuZvTowvnFxenb6YFJrFbhHT48Z/nYsUVvrFr4kTXkbrhR97VOjRYwrXMhOhkjUZjIcCgj6G5eGOw4/uPG9293DLRf/5xYYl59LntKklH/p6BbFeuyy57XPvjg+IzGRs/qYHDgm50sFqGPGJG3YdKkkgU/u/2Tphx2jwy4jjwe8rbOAqkBWOyZtekFlQsaQv9n449/VjCypsb5eGurf0bi1lyrVfNWVGQ/etZZhcueXrrf72vZPdfvrFkdDvmLYtUqCQjZQ+/M34TF5nbknrY0o2TcY8XnPervuSeLAOEAUQBCS27pAIq5mwAdcABF5n034IJqoEoDCszfY6Gb5bxQnWSRWAJIB1AJjAHyACewB6gF6YcHgSUZqv5EGgUJ8jSG3gd1da8qy6x7R3Ia4uixgpwKYhs8oMfTaWSByDPbccKDXrN+DSgBrAn0GGb/g6r/IggP9Nx8PC0lIMuA3WqMeywbGf+xIEeYbdeC2A80wQPRficNFF5zzUvWd9+tm9Xc7F1xkswRHDYs56Vzzy29Z9XCT5oCzt2jA67DK0I+V5Q5AMJBT4XPeWhVaQEL1i+btPH2nw1f8PHHLataW31RJrFaNe/w4dmPjR9f/NDaBw74fc0HLgy4jjwSDvmLog1Kc+5HfLzdiZAII4VDWf622kVCsxgtO+/9VdHEh7y9dGkCiMeBnB64rw64CThkll8DZACrQD5qEpABPAJMT3g4CNSBfBmWvKgmVuRlVwGyHMRC4ArUC9aITnC5AcQjsPgIcCGwHESS9ysSPssWkNcCNebNYcA9wB1AQ8/DIUcAdwO3Kxqi9wHtMtSqYgALoWqD2ZciEL8324mlxzD7344auz9B1SZFQ2+MulgDrgAxE+StZh3doMoKzAbuRb2fyCLlB/aDfAiqXoPqICRRsSZM+I22a1fj7BMnPCv9/oGrVRaL8A8ZkvXCpEml997wfUd9yPXRqEDbkRW6z/UNpOzSbjjkqfC3HlqRFf5g9vqftx0YOTJ/fn6+413AsFiEt7Q087Gzzip4aO3P9nl9zR/P8DtrVupB94hoBSIqGKKBwgh/JK6jMuZHGQ5m+V1HFnpb9t3W/OHiHtQtAWrFrwBRCWIEiGGgxVxiGIgyiB5l5ABGqPIUEh1vTQOt3KynEkSFWd9oEN9QE51FKMaKIA94CJin2hBBEE0gvGa784D7QOSY7cbSVRHTVgzdEXojC+VigEoQsxQdPalaizTgMhBTQSZ6NTUgy2yrUvUj+hasagy1WHrMcmKMqk9coxYWsU59r+pFjRNFIG8AvgFiolpMkqEK1OKxEsR0UyNwgmhRi4mYDGIFMCvSZtwKc8UVz7JtW+O0pibPQycjOTRNGKWlmS+MGJG78KYfZDRMLn9jpLfh4OqQzzUjGXMAICEc8FQGXJ+tdFjeveO3/znpjSsX5N4uhFhut1v2FBVlPLT6gaNun7Nmms9Z87jubxsdO/NFDHdE1iQZwzRmE6pcAgw9kOd31ixEWJxN//3gcyXjF+tdS3WxZN4G8XwSVasdRH3ykUkmdWQLsBLwAueAmKsmubwetYq+bbYxDcR31YuUB0AuBPYDZSAWAVNA2E0VbCcwv1NKyxygypxIe0GsBBnZquwlKimEFbWq5qiVWL5Gt6uxKAGuBQpAjIOqHTGqTR9d9rIG5NMoyWEFUQiMMPtSrphUlgM3mH1KgipAXAyMUxNeXgdsN/uV2F4GiNvVgoEO8jcg16rPXAzavSD8IKP5e1EGWbLkLbZsOTqxtdW35mQ2OwmBUVaW+btzzim5d97VrqZJRU+P8DYcXqv7WqfT03E/5kwOB9wj/Cc+WZVfbJ1fdddFG194Pe8GEN57FmS7bb5t070t+9fq/rZRSU0MqZgiUYmI+yyS2ydGyFsScH5aLYQ84tr3n1vyzv73JATG1ij3gPwdCKNruZ4MoC5oB/kcSq2wAgdB3KdsHWaC3GSWm2CqZgawGtigVI8le0EeUaswO+ic0Edi5mk5aHeh7KF6MJ5RkqcLHCDOVXSIKSBnweINyq6JRRXAJSBGmUx5nhoLzIVF9NFwF7UgfgmGSbPUADswEqgGcQnKHloKi6+EB91JKikArotRlS4BHk9g2Eh7OWZ9mlKFjWoQETVyP8idKFvkCObgWQFuu+1V/vrX2pJ9+1qWejyhk2AO4S8pyfjdxIllC9ctfsfpb/tslPdEw+O6r306vbmUY1b7cMBT4Xd+uuKb5w3/9jW3PXKgcet1hAOBKb6WmnW6v22kWbzL85H/ogZ7IsPIznaikiamonDQXRFs++x+j8XyA3rVvwEwujckk4n5ngz7alMHr3pXrWJkEK+np9E5hjGq4AOgmOtQ92RWGTH1xD6XAJEHRDQHB4hbgbdRjoNYFIC4IWZSjgWRBbi6pyEZhEFn3yFqqFftBnkHyl6ZBmIGGLNM2yDm+UUodZCp6jnpNSXbDSB3EWXYKDQ67TKrYm6BORZBYBNdHwCn02f97LO2K1pb/Rf2r4MxXRXo+fmODUOH5ix8ouoTZ9DrGhdob1ip+9svJJE5Yg2E2Doi/1ssXos9+xWMQF3De9dpgbZjEzxNe1aEvM4+nasV8WaJBGkSa7jHMUcMLbq/bXrI3big5cN/7c3AtatJsSSj69WdztytVNHgPkyd3/TwYAAt5u8GsA9lSGrArcB3oSqje327JyRj1CWYRvewGHqnA9Pi26jSgFlKrYpiJFAe8/0kD/WrBqgDnkX1OQPEN+niVLLkANeaKuEBkC+ptsVlIJJlmLuJLiSiDMRS1ecqrbtx1ADq6z0VbW2BW8NhOeCYgMNhPVRRkVO9/pcZTuH7ZLS/9eAq3d/xDWmgJX0fMZM1ll+EZvXaM0sfSy88c6mBzR9yN48LdDStCge9U+JUtCR1ShkfIEwKM0bSnR4mw4Y15HHeHPQ0TXAffrKnmuYoG0T8Pv5iBfGTpTfYgdEgp5gv9i51T/qBv6NWWIBNYGxW38UIEKtRxvxUqEp6vnH/IAHGAjkg3eoiC8RNxDkLZA6Ia9Vv0m3SWaD6EJ1kgxEbMUBuAxmRSmNQY2ViCShbZboqy2sg14FsUu5eeZ3p3YqFG+QaVQYNxNXme7sZKE8W09HmzHmaI0faL+zoCJ6U3VFcnPHS+PEl+0sdHxcEXEcfCXlbp4HUukxG6FRzYtQiAQiLNZiWU/5EeuEZD6VlV7QHnAfHBdrrVxlB91RASzqpZfytJLfV94QbMnIvMeIuIBzylYXcDdeF3MdiXkhiDEFUovTwmItLgFlANwmRSVeKctDWgfgv4GlT99dRL3xTzOA1gbxLuXNlUKkS4jbQXgWWQ9WYJBOiGySVZFYQ400VZI9yQkhTWjBOTf7FgJgIzEAxwdum/WNVtkvE9pCDcCxsNagYT0S9KyFOtZQZwHWoeE8T8DywE+QWs49Xq7GNq9MA3gB5j3IQRGwtsQLEH0HebMaBotDS0y2OcNj4pmEMXHrYbJp7+PDsP/7ipzuMQMvub4S8zXFxjr5AaJagLb3gUUfROdW2zMJ2d8OOcX7XkdV6oH1qj2f5xrmoYj7LhOmcbE4klO/0cEkt5G6c5TuxrzPG0pXljgBvJLk2o1aqHhqMq8cAmQcUKQ+U3AHyPpB3A85OW6Ea4ADIW4A7Y3TsMtBuUyuhNgcWD3QTXA4wwfy8FyUJXSCKgJsUbSIDxHUgCkA6gcdBHEIxy2QwMrrv54CQyGjmPFgMyu6ZY95/HeR+CHpRalk7UAF8v6u6W+0HngP5PTB+i/IiOkBMBm2F6ndVmdkGms0mcwzDmHgyvbBYNKfNZjkkpN8a9jvPl4beq8iPEwaaNejIO+13WaXjlxFua/c27VXM4W9XalUPalP0JxEvJZIJrsT2ReyHhMJh3T9CGqEJntpnu6vxNeBK4PLOS1wOYgHdunmTYj/I15XUEKCkyC+gur6rF+ZBoNoF/AbkpWDcA3I3Sl0YCzwCYvTA7BLKUS5WHeRHSr1ho1roxHdNnX4scLFZfiPIragoPiBHm8xED86I/iKLTrXKizKkMaXcDahFxQ/yY5DjwD4ZJXHqTKl2XVcpAlCtQ/UekAtAXm564FxABmg/RAVKHQCarhs5fn8472R6YbEIPTtbMwzdqxky7OjP+AjN6rfnDP9devH4hdbCSe6Qt22iv+3Y47q/Y0pnoR6eT/K5uwBh78R0fpRGOEMPesaEvMcjakNCjVIHwws/88df9/tVqkKfV1EXsAzlotWAu0BOjqxgyfGAAdW1wK9AXhmjVow0Vb2B2ACVqGCkF9iNigesNekrAa4C8QNl3OIE1qEm499N5i5BMRiDI0GqUMweSVfhEMpgN2kVl5ltOUC7Hyx/Vpf2BxART9xoYHb3TpMH/aBtAe5Qiw1OwI6KRVUAaH6/rhlG/9ShROi6zAoERB7ComsW+2eIxNhAcghN89oy8n7pyDt9obBZWzxHXhsXaK9bEw54lM0xQAjoEg8BknvPYtSxuJ+kBCNUaHXkaZ21dhdhOWkcMNWqBtMAr468oHhUWVX+UwTVhvnsSuXiRAPOot9jtwTgfMChaOCQkl5iG7BZ2RbiRuAaVV5uArnd/LwfNbEcgLmondx8MuvIAa5CSREd5Hvq/yorysVcRmd6itVsP3Lp6hIOlJcrRlVeAixxdGYJ3A884EapXVvN92yqvKA5HPag1SpO6gDoUChccPy4e6I993TDnjtio8WW4YKeV3ChWfy2jMJf2rOKl9rSbC2+hg/H+F2HV+u+1nH04QUnrTtGXUo6fbtxGMRG4DvVNAlSalLqnd+TJv8NBgQoH/xDKC/VdBD3KjcuKKZYMgNYB/KaeBWqGuL9/f7ejeQuo+dQxrcAqEVNeIh6fXCj0lJKUBLFlB7VoHKwak0D/bzubaD+jFWVA7R5po2hmfbea6i4yTBULhqmvfYd4Ovxl/w6yF+ZlU1GBTyBqhKQP1WSUQ5LSKWJJEvGfbYKobnS0qz1ECzrRw/iEA5Le21tx6VX3jHk9RceG79Xd9cv97tqqzDCSQ1/YbF4HTlDH8soGbtUaFn+QNvBKYH246vCQd/kvrbZU6IusRumugtqJ9yPjZ2o/zVDs9qPyWBbkrSTuNZ6+K2vk0Ki9OIlT4C8AMQVwPXAx1D1G5Tqcz9oF4KcDtSrSDE6UGLaPRmo1fTvdInuJ6ILXQWmWmIAu4mmaTyAClzKLeZkNcDYAmyJCe61m89MRqk0kQzjJH3sci8H5ERY4kYtinaUqvc9ELNREq0d5FKQtaqM+D6IStP2WAdsis2+7cQSJ8gfEs3TEhuB6SCWme34QVZDVYv5fTYww1wI61BxGDSfT3cLIbZyksEdny84u6nJM6d6zRgjo/icX6flDv+VZktzxm2lFRiazdHiyBvxC0fhmUutmSOCwY6j032tB1f3hzmSwoyBCBI8Vt3N0VivbbKgpWZ1C4tjF9bMmAeSiZ/u0J8VM1L2AT/IRSB3gsgimmMlXcDLSo0SI0C8DOK/zP//DOIbqLjBTlP96UfbVYAcBZShJs0/iJNIoh1Yi7I32kGsAy02sh4EPlTPiArQ+nME1GSzH++Y119U/WIuKhbUoCaxfAEejEiPa1Eq1SHg9e4zfeUhlCPFADEVxRxbgZ2dKqN4yxzD/wficZR3zgvyWZTrGK2oKEPPzU17x2bTekv17hHBoFF05Ejb/Zs3H52w+MmvtmeWTbwvvXDUTbas0t/Zs0p32rNKdtizhjyXXnDmDRll5y1z5H3F72v5aIbP+ekq3edS7sU4GzjeK5XMdRuHbuaj7O8zZmHN5jigWWx7c874SewPhrk660qN6dNENPXh2AVIogzbxPsAHDInRb1SacRSoAzkM0ptkC5Uuv00EBcrw1zqyusk7wXquuZOReiQ5hU3CBoqKq6ZddfE//4AqJjIDiVJ5Galt0dQDci9KAayg4zddRrpYze0YKhnsBPNHpBeJS2Ml8yV/5eA3zS0ZwOVIIMgX1Jj1B2kbk70FnOxuQ6kE+RCsy+G6dS42BzLHLP/vwJ+C5pSsdavv5zp09dsO37cvScUCk7tvsHe0dYWGHPwYOtqm00svPfX0zY//FP76+Gs8jctabk5UuqGNAyvZsv0Ck2zdxx752J/W+0jYZ+rc0ATVv4uaSJ0ywdRGyLyOa6OZDlZkcoSNSEBCE23pRf8IS3/zMTcogMgzUg3e/rAIAeAO1Dp77uIMoP0o+IMfwAa1KSIoNqAqjdRsYdhqAlmVS9P3A/yHZCXmiqR1Xz+r8AbIGqTqxu0K8lEFlBPZyYvRCPWzEdN8r1JkvzaQa5AbWRKlt27C+R8VMR9FxgGaJuBBWaft8WUdQGLQCYGU3VVv3Sh1Js69T3SnypQ2ct3mDbW26ZU6Qlmv2SeGgM0YCtq/8slwEyUh85r1v1fwBYQ3kj8SQDMmvWUdvhw6211de3LQyHjpLegpqdbG4YMyXqmvDzr1fPGduy/+5a2oEV2GIav0SGlURn2NFwV7Ki/PhzyD9rZuRH1KjLpJUQTFoncjxZOuJfAQFZH7q7M0nO+48gbWZc/7mcxD8Yax5JuVuoYRIzASIMaavWN1BPLobHJg/cRFZld2loMysdvR8Uogp2rcXc76RYT540A4stWxdCRSEu0jGl8VyeRCEti6o3UnRiLqY4pG4uktgldxzZxLPs6/okv+wHM8dDo9H5FdjLqiWMYnTaXXfZcyfvvH1tz/LhnoH70+IoFOBxW58zzg7sf+Zd/tDtoRoZ8JYahjzZC3pwu+0KS2LRdbpkTma5Fu6uiRyQrr1nTWhyFZy3IHjb9xfwx/9aP2lL4Z0TUJVdcnNlUUZG3qKMjWOl2hwZ8YmIEUkI4bNiPO/O3WS12T7jjxN1GONR9QDLJzO5yqzv3bWL5PnJKF5PbYnOn5ZQ/7MgduiHFHClAjKRYvfpSKiuz9w4blnt3dra9h70FfYPNprWXl2c/VnFa8bL88lE/d+SPuF+z2vu5X6CfiNFKugjuZGGMWAjNb88sfMKRf+ZvHNmnpf4waApAknX2Rz961bpzZ8OMQ4dcj7hcgT4F7RLhcFicw4Zl3z98eM5vv/3t093NzV77T77zthZu/fDmQMfxpbInSdJHJBUSkZuJiYu9SROh6fbssufScivuduSWtxSe+2iSQksgekhCoo5+nzlG95tG4xJNNdzbYQP9wWJQMY8K1MEOTcqj1tsJHl80Yu2f7jaX9RdVGlBuOhtaejfWq+jfOC0GtVkrp8ufgd658/fG9dfPPxwIyL8Yhiz2+/XTwmGZ1pdqNU0Es7PTPj7nnOI7Z84sf0bXtfC2bQ3Tt26tf/iZ1wt3f+3/WN4qKrR6w8H2qdLQHdB/uyGCbiPlkTp7iYV0HhMkdFtm4YtZQ869c8j09Sd+vvr9blr8qoZK87bCDCeY6U9qApyrPE5bjsESO8h5wEUwcxtsCfe/d4n4D0AbA9rLIOYD6SDOBybAzA9hyyAy4mBisYbaT3Ij8E248EKYmQYzjsKWHgKwvWFmOogXQIwH4034WzdjvASYOQXEPLPNmABmFTDTqhxZWxJ0ixkaiMUgliaVDg89dAnvvvujmssvP/PWCRNKry0uzngpPd1ar2kimHiGrhAYVqvmz8mx766szFt67rml37roouGvHTzotu/d2zJ3z56mtUePtl9WX9+x7ocLR431OL72RFrO0Hs0q70F4v0q/UY3nBU5NE72UgYhdFtG3ivp+affWTr1iSTR37gnNODbwNXEHacjHKgdfpEjfOwgJoE4j5P4+yvx0EAx5whUuvuzqn4xfvDaOBXQNBDfUUE5JgNzUeno1w8w4zgWkbyrHiBBbbS6ja6b2EaioupJApsC1HvM6HFwV6z4rnfZsr+8/te/Ht3U1hYY1dERnCKE/EpLi7egvT1McbFDz862N1gsln8UF2dsHzUqr2748Exj+/bmin37Wm6tr3f/KBAIlwF4vaGJTU3uVZfcnH3ni49NfqYwK2AEOxqXGeFQ1NWbKE2SSZe4c3cTOCvWodeThqUkjGbYs0o32rNK7k7LP6uF3pEBYgpqg84LUFVjiu0xqN2FO6DqUZBuEPegNuPExDeqIKqiRdygEjoPOIi5H1uOyPcMVBxih1Kv5O2o6LW/050pI2WJV7+WQDSBUBidsckHSZioCbREsDiGpgcT7okk5RMh9oO8Uo0dr4K4FOR61B58k7bE9JhYV3GkX9KApYl1m/9X0VWN6043qQK1X+Q24E+w5ICZVhPpZ1Rw9Lr6nH12GiUlQ/0nToR35+dn7na5/NZ33qnVPv7Yx9e+VszYsaX60KGZ+j/+0Ww9fLit7P336+ccO+a+xen0TQiHo+dDAWg+X2jK8eMdq66797Q7Xvx583OZWYYW8jQvNXTFJH1J5OhvckcyRhFCGLbM4o3pRWPuchSPr8s/66e9jEIVqOzOSlRg6RLgl+YWzStRq9M4IA8MN2hjUStQk2m7jAZ5MYhSkJ+oQ9SYgDq5pEg9J55T+UNcApwDss08OG2XKsv5KCb5PiqxcRgqNWQLKou2yGTIaYrp5EaVryUM1T7fNWMn21W7ci9U7UedE+U36TgXaAVeUQfQaZrqs5wNDAUOwpKXUAG9qSipZgM+ULRWJ2RjRI1CM+tW+kHoIM2/C1PlQJ1ldT6IRtTeljKT9iyUVD6CShUpBfEPWPJGV52japiiRe6Hql19sP0qgIvUO+IikDVQ5QLmqLHnIIqZe2eQxkYfW7c2Xrx9u3NkcXHm/iFD0uuGDMlol9Lwt7b67O+9V1dSU9NW7nIFZ7rdwTltbf5Rut7t7kTN6w1NrK11rb7kJ+Ov2/Bo6Jm8bKuSJO3CvPcAAAtYSURBVHqgb0HDHlJK4tS1hHhJ9DEhDFtWyZsZRWMW2LIrjvTOHFGMQk3QIyCuVVJEZqHyho6gEv5GAAdA3K6it3KzKXVWmqpYLYgLQe5CnRgyB+QelNG9EbgHxNXAIVTK9a3AApBjQMxA7fpbgJIk5skrcisqP+kK9RwtwERzlb7cXJ2fQm0cOgRciTqkrVrRw12oXCwzci0mA5NU23I06gC3LNTW2lmoPLEx6nlZB/hB3AxyOSz+ZecRpnGjPgrEsyjDugCVDWwA14O4X/UDN3CnOcY7zbFcadLVgMoVm4c6xfGNmPdiqkoyS/3Wp60WI1EJoXbgMuAd4AIQP1Hvj1moAyz0Xhnkgw9a2L27Y+fx494rDx9uX2qzacG0NOEOh6XfMKRd18kLBMIZum7Y6ZvHS3O7g+N03VhzyU8nzv/D8uJnhubt1v1tRx82QiaT9NEwiZcKMd+7e1Zouj2r7O2M0nG3l13wRG0faI3SbE70epCrQNwHfBc1YXNAVqsXLSejBjgSpbWrFAyhgbxK/SaGoSaDhkoVv9b8f4450RYB61EHwq1BnW1znWI4cTsq09Wp7kXH2woiCNyrJIScZ9JYgdppOBLkTSjJMwvE0+pZGXk2cvxoO2pSTjcZdIHZvyuB/WCUo7KG70RN2mWoCPQdwC3KcCYmPyoanfeCsQu102+O6rPcD+IGVa+8FsWcK9Q4RFQqYQf5MvAYyJEg/gScB2w0GxgB2kqz7O1ATbyK1W0q97tqrMRTwELUwrUctV/9TlRKzjpgVK8T+sknf4DDkdaUm5u+yGrVXnK7gzktLYERra3B0W1toUqPJ1Sg64aDfrqD/X59ckuLZ9UV/zJ8XKN/wguOvBH3ajZHS7Rfsd3pJuEwwkeRpMZktkZnYU23ZRRsSC8cvSC99Nz+MAeovk1CTf7XTTVlPspDswmVNXoEOJ/4Q9McIEajtqUeUPuhtRo6z49qUJfwE90FJ1+B6nZU0uC7KMnlQDGVjkolT5ZY2qBUheogap84qBXydPWs2AnVblTelNl+dMRqTFq8QBMqlcWK2mJbA+xXtD94CLXyl6Mk5l2mvVWAYozutlrXgVwK4g7gRVTS4WSUWrfTbNsF8m/E5YlJv5K20ttZJrYNORqYCLwFHEruRk42cx4MmnUZ5v85QB7IDwAnKglyN/RxUr///s0UF2c3FBZmLcrMTHuG5Bma/YXm9+tTWlo8K+f+ZOjY5uD4F9JimSQGXc63iv3N/L3LzdjkRSGC1vT8l+y5p99jyyw+lFt5e39pzUHp8QdQL2odyvtRAjyFkgB7TdUjNgkvaJavAPKU/z6cR/QYHRGMeQUNqC9jTT9/jqn6tND14LZkMIhulBKRrGOAE6h9FUWqXjGMrqeuJHufBmrSl3c+WxX5y1xuYBvqeNKbQK4Gfk/cAdaJEFbUoRSR3X1es55ylL1mBXE2cWq/wJSMsd9j69wGvATcomy8xK21ceUdMWeXJWhOoh1lhw1R7YsM1Dvru4twx46bOf/89Q1paZZ729q8JU1NntlSnrSLUQsE9CknTnge/95Pht6y+Sn/M7ZMjzvkbnzE0IPDen88AUncWELTgvbsIS/YM0vvtWaVNxRNfGggdFaiDgj40DQyN6HOf3WiMmF187eLiTt4DT9q4jyMYqrdZl0xrhhhmAmMbwI7TDXjDXMizwJ5PyplO6GjfYoeGaYddCewXNUvzdTuRHTRaw2QTxE9RJpdqEnzCMjXQfzQHIsgiNmqHV5IToYcDfzBVNtGA2+iMm03o2IkK1FMOpce/7REl/suMJaittQuB5rijxyNTogs1BlikUzktSj7K4I6YDuI61HHCeUpWxFvl0BhTzh2bAMnTrzhPeOMy9/y+UJl5l+c6lcdSSB03RgaCOjTfv/n0nfPPW/E5tMr2GsEO6YZeiC/L1NBmv8IgUpmND9rFpvfkTt8ZWbZ+H8rm/6U8xdP/n2AJM4chlpRX4bqNpgZQJ1T9TegRrk+ZzqBfBQTBIDPQGxV3iI+Q3mizlZeLPFnlH1SC/wd3jFgSwfM2AhiCMpjpQPLzEmqA9moVXcTSjLloU5b/AeQCxwH3oMtQZiRDtICbAZjN4gDKBXxNFRK916Q7wMHlW3DJ6oeIVG7/FpRKfR7gI9RaszZKF39NeAv5nhMRW3D3YAaBFdnABVUEI4ClGfMhVJDn1f9qm6FmTtQWwEi/X1atcEmk/lsqD0ozaaekI9SyfaZn/ea9sQ7KI9gvqJ5iyl1LoTOQ+/qgWbz2mW+E7tqq/oYzNiOcgRMRknzP4I8PJAgNt/+9vN88klzSVOTZ1lHR+CHUnare/YLGRm2nWefXXTn4n/N2zZl6IYpfuenj4R8J6bQx0MlYmMkms3R7sgbsTSrfNqvC8Yt6YuK0gMivvrYOEBiOkkk1iAiG6m0zt+qAGnq9TKoUiOqEspE24oY+AZIvbO9SPnY+uNiJ8T/LZFI2ah/325KHlOdkmZfompJQhwm8uxiFD3CCgQ76V2smWoRgN7NPhTi1Z4I7dWJv1uJbkQzzHiHJWbME+NDJPQ/rp2EmEy0P8RIIMP8nqwOu8mcOqANiEEAZs9+hoYGd3ldXftDJ054vz9YTJKdbd995pmFC749i63zvvO3kYHWmnt1n3OuoQcLenvWlDaGxZ5Za8874+GMwpHriyc/elI7JVP4cmPA6lFNzStcf/2CjuPHfe8FAvowU9066X0kwWC4uLXVf87eA3ygZZz28dTxvs2a1b4P5DAZDpUijW5p1ixWrz2zaJMjd/jdjsKxG0omPxw4WXpS+HJjwBIkgssu+wP79jUV1de3L29vD1w9CIY7AGlplh0FBVm3lJZm7/7rc60E2w6VBTrq54a9zd8LBztGGUaoCGnYEZouLPYmiz17lzUt5/n0otFvW+1Zzvxx/9OzXFP434CTZhCAn/70dTZtqi05dqx9qcvlv36w1C273bI9Ly9jQXl57s5du35k+E+8Sbij3u5r2VlkGEalEQwUWR2ZbjRtb3rhxBZrTmUwLX/aYDSdQgrAIDEIgHlKfFl9fcfStjb/YBnuhmKS9DsKCrJ27t8/L2oIeo+/BnoIiz2dtNI5PdWRQgoDxqAxCMDs2U9TU+MqaWpyP9zREbhmkNQtw263bM/NzZhfWJi5a//+eYNQZQop9A0nG8OIQ03Nq1xwwbUeKcXWUCg8PBDQz+bkDXcRDsvycNiYlJZm2TZv3p1N7733bO9PpZDCIGBQGQTg009f4ayzfujJydG2+P16id+vf2UQ2hHhsDE0HDa+0dwc2HHzzXfUv/vuMwPeZ5VCCn3FoDMIQG3ty8yYcaPX4wluC4dlSSCgf0XKk28rGAwXBoPh6Y2Nvp1f//pNx/bseTHFJCmcUpwSBgHYs+dFZsy4xWOzie2BQHiI36+fPRhMEgjoeRaLJoqL09/85JNXBiNpMoUUusVJB/Z6wssvX86555Y2nHNO8d2nnZa73mo9ufN/NU3oBQXpG4cOzV5htWqpo3lSOOU4ZRIkgh07nufGG+d7hbBsDgQMl9cbGqfrRib986AZGRm2xoqKnCe+8pWifz/jjPzDzz///ZR6lcIpx6C6eXvDlVe+YK2paZ14/Lj7rra2wMV+v57X0x/o1DSMtDRrS16eY2NlZd6qs88u2Pnkk5el1KoUPjd8rgwCMH/+Bmpr3VkeT3DqoUOuizo6ghN13RgTChlZUkpNCBFMS7M4bTZLTU6OffuQIZlvZWen7Ro+PMe9Zs3cz5vcFL7k+NwZJII1a97jz3+utXZ0BHPCYWNYOExJIKBrQghvVpatQUrRNGRIhvfCC4fqN910wRdFZgpfcnxhDJKIt976CLfbjxCSuXOn9P5ACil8Dvj/WYd8X9Z1ED8AAAAASUVORK5CYII=	image/png	11186	{"width": 200, "height": 72}	{"source": "https://firstmidasmfb.com", "description": "Official FMFB logo"}	2025-09-04 21:37:35.50616-04	2025-09-04 21:37:35.50616-04
25b51910-ee26-4a84-a905-265ed70f9c48	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	brand_colors	default	eyJwcmltYXJ5Q29sb3IiOiAiIzAxMDA4MCIsICJzZWNvbmRhcnlDb2xvciI6ICIjMDAwMDYwIiwg\nImFjY2VudENvbG9yIjogIiNEQUE1MjAifQ==	application/json	82	\N	{"accentColor": "#DAA520", "primaryColor": "#010080", "secondaryColor": "#000060"}	2025-09-20 13:33:47.684573-04	2025-09-20 13:56:41.322949-04
8269f280-e0d9-4cb0-9173-f6017b3b8535	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	brand_fonts	default	eyJwcmltYXJ5IjogIkludGVyIiwgInNlY29uZGFyeSI6ICJSb2JvdG8ifQ==	application/json	43	\N	{"primary": "Inter", "secondary": "Roboto"}	2025-09-20 13:33:47.684573-04	2025-09-20 13:56:41.322949-04
3f67e328-f62a-4136-8497-be9daabc06ee	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	brand_styling	default	eyJib3JkZXJSYWRpdXMiOiAxMCwgInNoYWRvd0ludGVuc2l0eSI6IDAuMX0=	application/json	44	\N	{"borderRadius": 10, "shadowIntensity": 0.1}	2025-09-20 13:33:47.684573-04	2025-09-20 13:56:41.322949-04
2cb3307c-eeb8-4ea8-9b29-6b128365792d	6ce598f4-9cd7-4422-95f0-4641906573df	brand_colors	default	eyJwcmltYXJ5Q29sb3IiOiAiIzAwN2JmZiIsICJzZWNvbmRhcnlDb2xvciI6ICIjMDA1NmIzIiwg\nImFjY2VudENvbG9yIjogIiMxN2EyYjgifQ==	application/json	82	\N	{"accentColor": "#17a2b8", "primaryColor": "#007bff", "secondaryColor": "#0056b3"}	2025-09-20 13:33:47.688804-04	2025-09-20 13:56:41.327034-04
3fb171d9-74ee-44c3-8ff4-f251344553b2	6ce598f4-9cd7-4422-95f0-4641906573df	brand_fonts	default	eyJwcmltYXJ5IjogIkludGVyIiwgInNlY29uZGFyeSI6ICJSb2JvdG8ifQ==	application/json	43	\N	{"primary": "Inter", "secondary": "Roboto"}	2025-09-20 13:33:47.688804-04	2025-09-20 13:56:41.327034-04
d9b307b1-6e70-4224-bc98-95ab3a75eefc	6ce598f4-9cd7-4422-95f0-4641906573df	brand_styling	default	eyJib3JkZXJSYWRpdXMiOiAxMCwgInNoYWRvd0ludGVuc2l0eSI6IDAuMX0=	application/json	44	\N	{"borderRadius": 10, "shadowIntensity": 0.1}	2025-09-20 13:33:47.688804-04	2025-09-20 13:56:41.327034-04
\.


--
-- Data for Name: tenant_billing; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.tenant_billing (id, tenant_id, billing_period_start, billing_period_end, base_fee, transaction_fees, overage_fees, ai_usage_fees, support_fees, subtotal, tax_amount, total_amount, currency, status, due_date, paid_at, payment_method, payment_reference, usage_stats, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_usage_metrics; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.tenant_usage_metrics (id, tenant_id, metric_date, transaction_count, transaction_volume, failed_transactions, api_calls, api_errors, average_response_time, ai_requests, ai_processing_time, conversation_sessions, fraud_assessments, storage_used, bandwidth_used, cpu_usage_hours, memory_usage_gb_hours, active_users, daily_logins, unique_sessions, features_used, created_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.tenants (id, name, display_name, subdomain, custom_domain, status, tier, region, compliance_level, database_config, configuration, ai_configuration, branding, security_settings, billing_info, compliance_settings, created_at, updated_at, created_by, last_modified_by, brand_colors, brand_typography, brand_assets, database_name, database_host, database_port, connection_string, database_status, bank_code, currency, locale, timezone, date_format, number_format) FROM stdin;
30371b03-f729-488e-b06c-b2db675ab6b3	bank-b	Bank B Demo	bank-b	bank-b.orokii.com	active	basic	africa-west	tier1	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}	{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}	{"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}	{"mfa": {"required": false}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.297288	2025-09-30 20:30:02.334894	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
6ce598f4-9cd7-4422-95f0-4641906573df	default	Multi-Tenant Banking Platform	default	orokii.com	active	enterprise	africa-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}	{"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}	{"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}	{"mfa": {"required": true}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.29844	2025-09-30 20:30:02.334894	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
c7afab8c-00fa-460e-9aaa-2999c7cdd406	system-admin	System Administration	admin	\N	active	enterprise	africa-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}	{"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.277726	2025-09-30 20:30:02.334894	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
71d9f3d7-b9c6-4e24-835b-982a557dd9d2	development	Development Environment	dev	\N	active	enterprise	africa-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}	{"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.277726	2025-09-30 20:30:02.334894	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
dcb42e6a-b186-4616-8211-95983c32c9ee	bank-c	Bank C Demo	bank-c	bank-c.orokii.com	active	enterprise	africa-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}	{"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}	{"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}	{"mfa": {"required": true}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.297935	2025-09-30 20:30:02.334894	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
92b9a514-e318-46ba-bb6d-bbc5e1e0854c	usbank	United States Community Bank	usbank	\N	active	basic	north-america-east	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}	{"tagline": "Banking Made Simple", "appTitle": "US Community Bank", "primaryColor": "#003366", "secondaryColor": "#FF6B35"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-30 21:16:55.849081	2025-09-30 21:16:55.849081	\N	\N	{"error": "#EF4444", "primary": "#003366", "success": "#10B981", "secondary": "#FF6B35"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	USD	en-US	America/New_York	MM/DD/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
2c234c5e-c321-4ed4-83d0-b5602ea50c07	cabank	Maple Leaf Financial Services	cabank	\N	active	basic	north-america-east	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}	{"tagline": "Your Canadian Banking Partner", "appTitle": "Maple Leaf Financial", "primaryColor": "#D32F2F", "secondaryColor": "#FFFFFF"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-30 21:16:55.849081	2025-09-30 21:16:55.849081	\N	\N	{"error": "#EF4444", "primary": "#D32F2F", "success": "#10B981", "secondary": "#FFFFFF"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	CAD	en-CA	America/Toronto	YYYY-MM-DD	{"decimal": ".", "precision": 2, "thousands": ","}
004c5e50-eb32-4c7d-a375-e8ff65f225c1	eubank	Europa Banking Group	eubank	\N	active	basic	europe-central	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}	{"tagline": "Banking Across Europe", "appTitle": "Europa Banking", "primaryColor": "#004494", "secondaryColor": "#FFDD00"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-30 21:16:55.849081	2025-09-30 21:16:55.849081	\N	\N	{"error": "#EF4444", "primary": "#004494", "success": "#10B981", "secondary": "#FFDD00"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	EUR	de-DE	Europe/Berlin	DD.MM.YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fmfb	Firstmidas Microfinance Bank Limited	fmfb	fmfb.orokii.com	active	enterprise	africa-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}	{"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}	{"logoUrl": "/assets/fmfb-logo.png", "tagline": "Your trusted financial partner", "appTitle": "Firstmidas Banking", "textColor": "#1F2937", "primaryColor": "#010080", "secondaryColor": "#FFD700", "backgroundColor": "#F5F5F5"}	{"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.491134	2025-10-07 21:41:52.87166	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#F59E0B", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#FFD700", "background": "#F5F5F5"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}	{}	tenant_fmfb_db	localhost	5433	postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db	active	51333	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
daa800d6-7ffb-420a-a62d-5e4653638e47	bank-a	Bank A Demo	bank-a	bank-a.orokii.com	active	premium	africa-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}	{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}	{"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}	{"mfa": {"required": false}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.292787	2025-10-07 21:57:55.372174	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N	NGN	en-NG	Africa/Lagos	DD/MM/YYYY	{"decimal": ".", "precision": 2, "thousands": ","}
\.


--
-- Data for Name: transaction_attachments; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.transaction_attachments (id, tenant_id, transaction_id, transaction_type, attachment_type, file_name, file_path, file_size, mime_type, description, uploaded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transaction_audit_log; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.transaction_audit_log (id, tenant_id, transaction_id, transaction_type, action, old_values, new_values, changed_by, change_reason, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: transaction_receipts; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.transaction_receipts (id, tenant_id, transaction_id, transaction_type, receipt_number, amount, fees, total_amount, currency, status, sender_details, recipient_details, transaction_date, description, reference, session_id, narration, receipt_file_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transaction_records; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.transaction_records (id, tenant_id, user_id, account_id, transaction_type, transaction_category, amount, fees, total_amount, currency, status, reference, description, recipient_details, metadata, tags, location_data, device_info, ip_address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.user_devices (id, tenant_id, user_id, device_token, device_type, platform, app_version, os_version, device_name, device_id, is_active, last_used_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: webhook_endpoints; Type: TABLE DATA; Schema: platform; Owner: bisiadedokun
--

COPY platform.webhook_endpoints (id, tenant_id, name, url, secret_key, events, is_active, retry_policy, headers, last_triggered_at, failure_count, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: account_access_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.account_access_logs (id, tenant_id, user_id, wallet_id, action, ip_address, user_agent, details, created_at) FROM stdin;
\.


--
-- Data for Name: ai_analytics_insights; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_analytics_insights (id, tenant_id, insight_type, title_template, description_template, calculation_logic, threshold_conditions, recommendation_template, language, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_configuration; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_configuration (id, tenant_id, preferred_model_id, custom_system_prompt, temperature, max_tokens, rate_limit_per_hour, enable_learning, enable_analytics, created_at, updated_at) FROM stdin;
1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	You are a helpful AI assistant for FirstMidas Microfinance Bank. Focus on microfinance services and financial inclusion.	0.70	500	100	t	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
\.


--
-- Data for Name: ai_context_mappings; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_context_mappings (id, tenant_id, intent_category_id, data_source, query_template, aggregation_type, cache_duration, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_conversation_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_conversation_logs (id, tenant_id, user_id, session_id, user_message, detected_intent, confidence_score, ai_response, response_source, user_feedback, processing_time_ms, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: ai_intent_categories; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_intent_categories (id, tenant_id, name, description, priority, is_active, created_at, updated_at) FROM stdin;
1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	balance_inquiry	User asking about account balance	1	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	bill_payment	User wanting to pay bills	2	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	greeting	User greeting	3	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	help_support	User requesting help	3	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	money_transfer	User wanting to transfer money	1	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	spending_analysis	User requesting spending analysis	1	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transaction_history	User requesting transaction history	2	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
\.


--
-- Data for Name: ai_intent_patterns; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_intent_patterns (id, tenant_id, intent_category_id, pattern, pattern_type, language, confidence_weight, is_active, created_at, updated_at) FROM stdin;
1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	balance	keyword	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	account balance	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	how much money	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	wo iye owo mi	phrase	yo	1.00	t	2025-09-20 12:15:11.454082	2025-09-20 12:15:11.454082
23	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	duba adadin kudi	phrase	ha	1.00	t	2025-09-20 12:15:11.454082	2025-09-20 12:15:11.454082
24	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	lelee ego m	phrase	ig	1.00	t	2025-09-20 12:15:11.454082	2025-09-20 12:15:11.454082
4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2	spending pattern	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2	spending habits	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2	expense analysis	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3	send money	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3	transfer funds	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3	wire transfer	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
10	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4	transaction history	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
11	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4	recent transactions	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
12	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4	payment history	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
13	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5	pay bill	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
14	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5	bill payment	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
15	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5	utility payment	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
16	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6	hello	keyword	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
17	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6	hi	keyword	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
18	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6	good morning	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
19	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7	help	keyword	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
20	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7	support	keyword	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
21	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7	what can you do	phrase	en	1.00	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
\.


--
-- Data for Name: ai_learning_feedback; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_learning_feedback (id, tenant_id, conversation_log_id, feedback_type, feedback_details, correct_intent, correct_response, reviewed_by, created_at) FROM stdin;
\.


--
-- Data for Name: ai_response_templates; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_response_templates (id, tenant_id, intent_category_id, template, response_type, language, context_requirements, placeholder_mapping, priority, is_active, created_at, updated_at) FROM stdin;
1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	Your current account balance is ₦{account_balance}. You have {transaction_count} recent transactions.	data_driven	en	{}	{}	5	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2	Based on your transaction data: You have {transaction_count} transactions totaling ₦{total_spent}. Your top spending category is {top_category}.	data_driven	en	{}	{}	5	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3	I can help you transfer money. Please provide the recipient's account details and amount.	conversational	en	{}	{}	5	t	2025-09-20 12:15:11.450239	2025-09-20 12:15:11.450239
\.


--
-- Data for Name: ai_smart_suggestions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_smart_suggestions (id, tenant_id, category, suggestion_text, action_type, target_endpoint, conditions, language, priority, is_active, created_at, updated_at) FROM stdin;
6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	Check your account balance	information	/api/wallets/balance	{"timeRelevant": ["morning", "afternoon"]}	en	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	View your daily spending summary	analytics	/api/transactions/summary	{"timeRelevant": ["morning"]}	en	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	Set today's spending budget	budget	/api/budgets/daily	{"timeRelevant": ["morning"]}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Send money to family or friends	transaction	/api/transfers/create	{"balanceThreshold": 1000}	en	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
10	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Pay utility bills	transaction	/api/bills/pay	{"recurring": true, "timeRelevant": ["evening"]}	en	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
11	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Recharge airtime or data	transaction	/api/airtime/purchase	{"frequency": "high"}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
12	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Schedule a future payment	transaction	/api/transfers/schedule	{}	en	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
13	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Split a bill with friends	transaction	/api/bills/split	{}	en	5	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
14	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Enable two-factor authentication	security	/api/auth/2fa/setup	{"mfaEnabled": false}	en	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
15	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Review recent login activity	security	/api/auth/activity	{}	en	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
16	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Update your password	security	/api/auth/password/change	{"passwordAge": 90}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
17	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Set transaction limits	security	/api/security/limits	{}	en	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
18	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Enable biometric authentication	security	/api/auth/biometric/setup	{"biometricEnabled": false}	en	5	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
19	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	investment	Explore savings plans	investment	/api/investments/savings	{"balanceThreshold": 10000}	en	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
20	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	investment	Check fixed deposit rates	investment	/api/investments/fixed-deposits	{"balanceThreshold": 50000}	en	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
21	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	investment	Start an emergency fund	investment	/api/investments/emergency-fund	{}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	analytics	View monthly spending report	analytics	/api/analytics/spending	{}	en	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
23	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	analytics	Track your saving goals	analytics	/api/analytics/goals	{}	en	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
24	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	analytics	Analyze transaction categories	analytics	/api/analytics/categories	{}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
25	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	analytics	Compare spending vs income	analytics	/api/analytics/income-vs-spending	{}	en	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
26	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	contextual	Fund your account (balance is low)	transaction	/api/wallets/fund	{"trigger": "low_balance", "threshold": 1000}	en	10	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
27	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	contextual	Transfer to your frequent contacts	transaction	/api/transfers/frequent	{"trigger": "frequent_recipients"}	en	8	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
28	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	contextual	Pay recurring bills	transaction	/api/bills/recurring	{"trigger": "bill_due"}	en	9	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
29	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	local	Buy MTN/Airtel/Glo airtime	transaction	/api/airtime/networks	{}	en	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
30	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	local	Pay NEPA/PHCN electricity bill	transaction	/api/bills/electricity	{}	en	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
31	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	local	Transfer to other Nigerian banks	transaction	/api/transfers/interbank	{}	en	5	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
32	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	local	Check CBN exchange rates	information	/api/rates/cbn	{}	en	6	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
33	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	Wo iye owo mi (Check my balance)	information	/api/wallets/balance	{}	yo	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
34	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Fi owo ranṣẹ (Send money)	transaction	/api/transfers/create	{}	yo	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
35	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	San gbese (Pay bills)	transaction	/api/bills/pay	{}	yo	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
36	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Ṣe aabo account mi (Secure my account)	security	/api/auth/2fa/setup	{}	yo	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
37	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	Duba ma'aunin asusuna (Check account balance)	information	/api/wallets/balance	{}	ha	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
38	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Tura kudi (Send money)	transaction	/api/transfers/create	{}	ha	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
39	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Biya kudade (Pay bills)	transaction	/api/bills/pay	{}	ha	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
40	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Kare asusuna (Secure account)	security	/api/auth/2fa/setup	{}	ha	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
41	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	financial	Lelee ego m (Check my money)	information	/api/wallets/balance	{}	ig	1	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
42	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Zigara mmadụ ego (Send money to someone)	transaction	/api/transfers/create	{}	ig	2	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
43	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	transactional	Kwụọ ụgwọ (Pay bills)	transaction	/api/bills/pay	{}	ig	3	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
44	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	security	Chekwaa akaụntụ m (Protect my account)	security	/api/auth/2fa/setup	{}	ig	4	t	2025-09-20 14:33:10.043019	2025-09-20 14:33:10.043019
\.


--
-- Data for Name: ai_translation_patterns; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_translation_patterns (id, tenant_id, source_language, target_language, source_text, translated_text, context_category, confidence_score, is_verified, created_at, updated_at) FROM stdin;
2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	en	ha	Check my account balance	Duba ma'aunin asusuna	banking	0.900	t	2025-09-20 12:15:11.454309	2025-09-20 12:15:11.454309
3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	en	ig	Check my account balance	Lelee ego m	banking	0.900	t	2025-09-20 12:15:11.454309	2025-09-20 12:15:11.454309
1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	en	yo	Check my account balance	Wo iye owo mi	banking	0.900	t	2025-09-20 12:15:11.454309	2025-09-20 12:15:11.454309
\.


--
-- Data for Name: analytics_cache; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.analytics_cache (id, tenant_id, user_id, cache_key, cache_data, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: bill_payments; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.bill_payments (id, tenant_id, user_id, provider_code, provider_name, account_number, customer_name, amount, fees, total_amount, reference, status, payment_method, description, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bill_providers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.bill_providers (id, name, bill_type, description, logo_url, min_amount, max_amount, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.documents (id, user_id, document_type, document_number, document_name, file_path, file_size, mime_type, ai_processed, ai_extracted_data, ai_confidence_score, ai_verification_status, verification_status, verified_by, verified_at, expiry_date, is_encrypted, encryption_key_id, file_hash, upload_metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fraud_alerts; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.fraud_alerts (id, user_id, transaction_id, alert_type, severity, risk_score, ai_analysis, contributing_factors, similar_patterns, recommended_actions, status, priority, resolved_at, resolved_by, resolution_notes, resolution_actions, notifications_sent, user_acknowledged, acknowledged_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: internal_transfers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.internal_transfers (id, user_id, from_wallet_id, to_wallet_id, reference, amount, description, status, created_at) FROM stdin;
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.kyc_documents (id, user_id, document_type, document_number, document_image_url, selfie_image_url, status, verification_response, verification_score, submitted_at, processed_at, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.login_attempts (id, tenant_id, identifier, ip_address, user_agent, success, failure_reason, attempted_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.notification_preferences (id, tenant_id, user_id, channel, notification_type, enabled, frequency, quiet_hours_start, quiet_hours_end, timezone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.notifications (id, user_id, type, priority, title, message, ai_generated, personalization_level, ai_confidence, rich_content, action_buttons, deep_link, channels, delivery_preferences, status, scheduled_for, sent_at, delivered_at, read_at, expires_at, related_transaction_id, related_alert_id, category, tags, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: rbac_permission_audit; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_permission_audit (id, tenant_id, user_id, resource, action, permission_code, access_granted, denial_reason, request_context, resource_id, additional_data, created_at) FROM stdin;
\.


--
-- Data for Name: rbac_permissions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_permissions (id, tenant_id, platform_permission_id, code, name, description, category, resource, action, is_active, is_custom_permission, tenant_specific_rules, compliance_requirements, created_at, updated_at) FROM stdin;
2170ad05-ef90-4ca0-bc1f-581b3eac44b0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	138893cb-ec9c-4a4f-840d-b104a07bf5cb	internal_transfers	Internal Transfers	Transfer funds within same bank	transfers	transfers	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
5bc932df-72e9-4117-8df4-d9e0e7fe9d0c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1fcdd80c-5ab4-4309-8374-e06e55f57f2b	external_transfers	External Transfers	Transfer funds to other banks	transfers	transfers	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
6beea4a2-c492-4de5-8c87-4e973c6d1e03	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f0a996a8-4824-460f-8ea4-1a664882cd61	bulk_transfers	Bulk Transfers	Process multiple transfers at once	transfers	transfers	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
9f3b75da-e81e-49bd-b7df-6b95bf6c616a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	de8e6c97-8fe4-4b81-92fb-6afd2cc598c1	international_transfers	International Transfers	Cross-border money transfers	transfers	transfers	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
0cb844c5-4d7e-433a-bec6-93acfdc63559	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e2c1cc64-fb45-4db9-97b5-83741e665a0b	transfer_approval	Transfer Approval	Approve high-value transfers	transfers	transfers	approve	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
aa5e341e-8fe6-405e-bc32-646cee802d3c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7cf9604-5f62-40e1-80af-4ea1d23d67a1	transfer_reversal	Transfer Reversal	Reverse completed transfers	transfers	transfers	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
89deb2b7-c539-463b-abf3-b4324cf04a72	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e3145c3b-7902-43bb-abbb-c1a28050d3b4	view_transfer_history	View Transfer History	Access transfer transaction history	transfers	transfers	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
a325883b-571c-45d9-a3df-ab61078e1886	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3e2b7bc0-d182-4dd4-b648-84e61aae758f	flexible_savings	Flexible Savings	Manage flexible savings accounts	savings	savings	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
8679287e-469e-4e95-88c5-8f74ffe995f6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	025df99f-7780-4118-b3df-ed80cb880a00	target_savings	Target Savings	Goal-based savings management	savings	savings	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
834196e9-6336-4929-8196-6ea93aa61672	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e4a91eb0-9c06-4285-8909-a1edc4d3b7d5	group_savings	Group Savings	Cooperative savings management	savings	savings	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
f1ca4c40-80d0-4ad2-9f02-48a58d130bf1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	42bbe078-17f5-4e3a-a10e-42b9fb9548c8	locked_savings	Locked Savings	Fixed-term savings products	savings	savings	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
f4f4552f-0c7a-4b6e-ae15-156e4b8ce070	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7e93d389-414f-4447-862d-8160edc6357a	save_as_you_transact	Save as You Transact	Automatic micro-savings	savings	savings	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
934810c0-32dc-45c0-a43d-199e8f57c933	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e09a3f15-c2ea-4f81-a9d5-6669bf6983dd	savings_withdrawal	Savings Withdrawal	Process savings withdrawals	savings	savings	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
49b4855e-8e89-4617-ba1d-f650a7c8bd58	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	482429af-01a2-4219-b556-6b3e8bf81a02	savings_interest_calculation	Savings Interest Calculation	Calculate and apply interest	savings	savings	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
761f7c08-f89f-4772-a98a-9732144ee3ee	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	b520b1a5-9b8b-40b5-962d-f94f0c1a3279	personal_loans	Personal Loans	Individual loan products	loans	loans	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
0579d541-3549-4e9b-a6cf-23a6b4571899	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	c4269378-0f43-4bde-816c-1c29f26d60d5	business_loans	Business Loans	Commercial loan products	loans	loans	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
99264891-3f7a-4fdb-b464-4e21cb56618f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1164d3f2-78f5-405b-873e-d679ede0cff6	quick_loans	Quick Loans	Instant loan disbursement	loans	loans	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
9d2a2402-cd41-4332-af43-c71004114949	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7fcf81f4-695c-4da2-9851-727ff3b9b210	loan_approval	Loan Approval	Approve loan applications	loans	loans	approve	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
e80d8fdb-1239-4077-836d-0c8ece8a5748	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	968016e6-db06-4162-9930-92ed614a1af2	loan_disbursement	Loan Disbursement	Disburse approved loans	loans	loans	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
2352747f-5a1e-4eeb-9a3b-dd3022e01284	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	bae28538-38eb-409a-ac2e-98ec5616cf25	loan_collection	Loan Collection	Manage loan repayments	loans	loans	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
e15b3b1f-0303-43a4-b6ca-9854842ae28f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	68ea5d31-2706-4e83-8ce2-e7d6bbaafce2	bill_payments	Bill Payments	Utility and service bill payments	operations	bills	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
63d70597-49c0-40d4-b6fb-01379f7b9824	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	02a64972-a2d5-4aae-bd32-7bece5277932	kyc_management	KYC Management	Customer identity verification	operations	kyc	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
cbb494e5-a568-40be-bc96-155f132bc5b6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	d07bcee1-4cb5-4874-a36e-f3e22cd06965	transaction_monitoring	Transaction Monitoring	Monitor for suspicious activities	operations	transactions	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
5f559d25-4861-4e77-8ac9-42f1aceb2de2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10724507-8fdf-4027-8961-0a6b56877bb1	fraud_detection	Fraud Detection	Detect and flag fraudulent activities	operations	fraud	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
871c2261-4f5d-4971-8275-87dcca1f2fe6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	41008226-9219-4a8f-9256-f0e8cc5ca809	customer_onboarding	Customer Onboarding	New customer registration	operations	customers	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
9d2bca2b-536b-4557-afd7-d5a6bf894c81	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ccd01816-991e-4d3b-9d93-ec6b397388bd	document_management	Document Management	Upload and manage customer documents	operations	documents	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
5e5e26f1-12d1-4308-a921-4bb5630fd7dd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	0b7dcbd9-f6b5-4f6a-840b-0583b9843863	user_management	User Management	Create and manage system users	management	users	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
365bf743-6685-4d40-ad74-b25e38366331	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	64319b48-f6bc-4253-b5af-626e77f1d1cb	role_management	Role Management	Assign and modify user roles	management	roles	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
e163396f-407d-40be-931c-1861102f0504	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	240de0a8-9480-493a-9fd3-386b0dd755d2	permission_management	Permission Management	Grant or revoke permissions	management	permissions	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
1029445d-c1bc-4513-9580-018ee94795ba	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	da75b893-f234-444e-ac11-d6cf51aabe89	branch_management	Branch Management	Manage branch operations	management	branches	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
434761e3-18d4-4e51-8660-223712f4216a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1dc6549c-21e8-4af9-8d3a-463a2ec7f5e2	audit_trail_access	Audit Trail Access	View system audit logs	management	audit	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
a0b32bf0-6ae5-474e-9eac-8b77eab7b272	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f90d6eba-0099-45a7-9b65-1058bf625459	reporting_access	Reporting Access	Generate and view reports	management	reports	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
076b8a5c-b3a6-45e3-ab39-06836051f13c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	0a4f21d5-3f47-4c15-912c-363726b05885	financial_reporting	Financial Reporting	Generate financial reports	management	reports	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
b6035ff1-6d04-4a17-a14c-d4cff0c38c60	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	26e76667-b79a-4fe2-b229-68e26e729f89	platform_administration	Platform Administration	Full platform control	platform	platform	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
54f0740d-f882-47da-8f10-42ca7b9ff2fd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1166962d-e611-4d09-a0bd-6de6890e0aaf	tenant_management	Tenant Management	Create and manage tenants	platform	tenants	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
c1d3687a-37a1-4be8-8cb1-933be20f38b7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2f8801c2-3c98-4176-9a67-06ff20198560	system_configuration	System Configuration	Configure platform settings	platform	system	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
d87b290f-3a0a-492b-890a-f655dd3bc8e8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	60a265a0-4d91-454e-a77a-bf21db598ef9	multi_tenant_reporting	Multi-Tenant Reporting	Cross-tenant analytics	platform	analytics	read	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
fe3bf1ef-3334-4a92-ac80-5f0153d02233	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	db0b5c60-1987-4769-bf13-f32e917e9eac	nibss_integration	NIBSS Integration	Access NIBSS services	operations	nibss	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
913f24b8-53e8-48c1-a500-36bc332d7436	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	14e38180-49ab-445d-bf6d-2b0d70b4cb24	rtgs_operations	RTGS Operations	Real-time gross settlement	operations	rtgs	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
c03f372b-f316-4e77-80b7-127c776ce3ec	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	919b1f68-55c1-4497-b9e6-b69dcc5b00cd	nip_transactions	NIP Transactions	Nigeria Instant Payment system	operations	nip	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
8b2fcc5b-c658-4195-98fe-98bd422688b2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3377171f-cb47-442c-994c-906e3fb69c1e	bvn_verification	BVN Verification	Bank verification number checks	operations	bvn	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
2646ef04-dc41-4d86-9cec-999dc9b2ad1d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6cf427ba-adab-4a0a-8432-2bfe237392e5	cbn_reporting	CBN Reporting	Regulatory reporting to CBN	management	cbr_reports	create	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
85a678d9-1797-48c3-943f-9a3acda991ea	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5879ebd2-c2af-4c10-99f4-54af16b6ed8e	fx_operations	Foreign Exchange Operations	Foreign currency transactions	operations	fx	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
5da7dc76-6cb5-4264-82fc-4c141945332d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	3087add7-90f3-4381-b5e9-5ab739c34975	cash_management	Cash Management	Physical cash handling	operations	cash	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
d6f4823d-7b72-40b5-b3f4-649f143978e5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	efab47c1-8594-4a84-afbc-abade5ffd6ad	atm_management	ATM Management	ATM operations and maintenance	operations	atm	execute	t	f	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438
ade84696-328f-4def-b0c2-427b5d786b3c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6b12a124-9a49-43b4-ad63-ebf86b586037	platform_overview_dashboard	Platform Overview Dashboard	Access to platform-wide overview dashboard	management	dashboard	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
569c09e4-fddd-4e79-bef0-07b2e9b7661a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8929a57b-f3fd-4c98-af63-ac998d1e8101	bank_performance_dashboard	Bank Performance Dashboard	View bank performance metrics and analytics	management	dashboard	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
5f095827-8e2b-4984-a352-d293336cb408	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	84bb70d9-e29b-46c4-b704-bbf73bcb81f0	branch_performance_analytics	Branch Performance Analytics	Analyze branch-level performance metrics	management	analytics	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
7f6f4c20-c434-4c80-be54-b08de3c367e7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	96ee8ea0-56ab-42ac-a801-e75ec1c7bcc7	customer_analytics_dashboard	Customer Analytics Dashboard	View customer behavior and demographics analytics	management	analytics	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
c7df67d6-73b1-4d91-b5dc-0a221b4c4ec4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	22a8d30c-aa36-4cb4-ba94-b67b1dbf45d6	financial_reporting_dashboard	Financial Reporting Dashboard	Access financial reporting and dashboard features	management	reports	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
b33bb7b3-b461-4288-a69e-016bef43fc9e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	22b1d15a-9d2b-4930-90ec-c6d8f2efef24	create_bank_users	Create Bank Users	Create new internal bank users	management	users	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
1f2a7308-2466-4d06-8824-52cf86df1f41	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	bcabec8b-fab8-4c3b-ad33-2e898353c4db	modify_user_roles	Modify User Roles	Change user role assignments	management	users	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
484606e3-c25e-4e75-80ec-78b3ad1543d7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6eb534cb-baed-4ffa-a23a-0bf0006ed3e0	deactivate_users	Deactivate Users	Suspend or deactivate user accounts	management	users	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
740b63c5-929f-4b47-bd6b-6e3a3ef016c7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f067355c-02ed-44f5-831b-43e21a51b0b8	view_user_activity	View User Activity	Monitor user login and activity logs	management	audit	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
45e5f332-1727-41fb-adca-c0d65fe29300	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7d6c3a8-4915-4de0-8541-d9f5c8d6afb8	reset_user_passwords	Reset User Passwords	Reset passwords for other users	management	users	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
504b3739-ed3f-4371-83ab-6f373a7216e4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	b088fae8-f4f3-406b-a0b4-85290183127a	transfer_limits_configuration	Transfer Limits Configuration	Configure transaction and transfer limits	operations	transfers	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
d7fb6ade-c1c3-443d-a1d0-1229f6755d3e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	93a87ed0-3727-4e6a-aebb-d3869540d21b	transfer_approval_workflow	Transfer Approval Workflow	Participate in multi-level transfer approvals	operations	transfers	approve	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
c28ceeb1-e436-4306-b665-3f49154161f7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	a36437dc-580e-47b1-8c63-badc80aa6d2d	view_reversal_requests	View Reversal Requests	View transaction reversal requests	operations	reversals	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
ef6a3a75-f343-45a0-a30e-5f0ce8d574a9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1ad328bc-a842-420d-b342-73524905da1c	create_reversal_request	Create Reversal Request	Initiate transaction reversal requests	operations	reversals	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
a73d86f2-e8f1-4eed-9dec-bdd7ffbfcd27	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	5ab2417f-b4ab-4c73-9eee-ceae4bbcbc89	approve_reversal_level1	Approve Reversal (Level 1)	First level approval for transaction reversals	operations	reversals	approve	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
7b2f6739-00b0-44af-8e69-62fc1c80dda8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	413ec926-cbc1-4f9b-a728-6b711ceba516	approve_reversal_level2	Approve Reversal (Level 2)	Second level approval for transaction reversals	operations	reversals	approve	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
d4629928-d54c-4e48-add5-75c55f76116c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	798c3dff-c458-4513-afbb-83f241033832	execute_final_reversal	Execute Final Reversal	Execute approved transaction reversals	operations	reversals	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
923aa2b0-7517-4bf5-a130-d3b8749cc4e5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	90973b1a-1af0-4e30-8af8-683d30ad1797	view_savings_accounts	View Savings Accounts	View customer savings account details	savings	accounts	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
13a45a50-3b81-46d3-82b0-c0b0bceda821	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	56c195ca-4566-41e3-989a-8f568bdd640f	create_savings_account	Create Savings Account	Open new savings accounts for customers	savings	accounts	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
f792ffd0-3e91-40a2-b9a9-a32f20eb9cb9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8e303b4b-2056-430a-9932-f0733563c571	modify_savings_terms	Modify Savings Terms	Change savings account terms and conditions	savings	accounts	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
63b3dcfb-fc2d-4d1f-a39b-0f6c434fbd9b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	998839ac-1533-454c-9317-8379b05b2d87	configure_interest_rates	Configure Interest Rates	Set and modify interest rates for savings products	savings	configuration	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
f050b605-4a69-41b4-adaa-ada9be1964e1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e7f6b4f9-5a46-4ce1-8305-028006d3ae5e	close_suspend_accounts	Close/Suspend Accounts	Close or suspend customer accounts	operations	accounts	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
b55d4740-e3a7-44ce-bc69-e11f508d354d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	28026104-a008-4323-8c24-e8b5d1739dce	account_relationship_mapping	Account Relationship Mapping	Manage customer account relationships	operations	accounts	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e395c321-d203-434f-bbcb-40e0fd48c0e2	view_kyc_documents	View KYC Documents	Access customer KYC documentation	operations	kyc	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
8645f722-e567-43ac-bf52-0757e11a2d22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	57187619-bd17-40ae-ba79-99f3fcfd33e1	upload_kyc_documents	Upload KYC Documents	Upload customer identification documents	operations	kyc	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
c839e799-03c7-4db1-b1ee-3faa075ae78c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	a1652a23-34e8-4fef-ae34-5005e7f8a494	verify_kyc_documents	Verify KYC Documents	Verify authenticity of customer documents	operations	kyc	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
5b03259e-7719-447a-88fc-85fa7ad5c3ca	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	d9156cea-2613-4b8f-a44e-73b28d5bf1ef	approve_customer_onboarding	Approve Customer Onboarding	Approve new customer account opening	operations	customers	approve	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
36bea580-f2c9-497f-830b-72ed52ade5e3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f34038fa-a483-4341-984f-75f565bb4315	kyc_compliance_reporting	KYC Compliance Reporting	Generate KYC compliance reports	management	compliance	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
fd373a87-65c7-47b6-a0f6-686587980648	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	edbe9ab8-50f4-4aa0-996c-5e043a2eb5b7	configure_biller_integrations	Configure Biller Integrations	Setup and manage biller service integrations	operations	billers	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
b8988627-8c82-403d-bb4c-07a1c8bf5483	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	43dbe8fc-b36e-4224-bf49-f2ff77ff5cec	bill_payment_analytics	Bill Payment Analytics	Analyze bill payment patterns and metrics	operations	analytics	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
9f9178ac-e7d7-4a13-a10a-1a9290761fbf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ee001c5a-a7c3-46ae-a0d1-46d68a1433f5	recurring_payment_setup	Recurring Payment Setup	Configure recurring bill payments	operations	bills	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
1599338e-6df6-4d18-b285-2fb80d94978b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	0d4d8edd-085a-4402-8e2f-62abe8f2ad3d	generate_compliance_reports	Generate Compliance Reports	Create regulatory compliance reports	management	compliance	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
bda28c46-8c26-4e40-93ec-9310618c9745	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e447c976-03f1-4d98-b481-6a29f18bdeb3	bsa_aml_monitoring	BSA/AML Monitoring	Monitor for suspicious activities and AML compliance	operations	compliance	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
aa0ac506-d4ed-44eb-b674-67541491253c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	232b533b-fd5c-4e99-ad25-b613fde533c1	regulatory_submissions	Regulatory Submissions	Submit reports to regulatory bodies (CBN)	management	compliance	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
b93aea0a-af5f-40f9-bbfa-8972106f7714	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	56d743af-1ddf-4802-b360-d503d4c70617	risk_assessment_tools	Risk Assessment Tools	Access and use risk assessment tools	operations	risk	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
686c9cc1-1189-4d72-846c-8cf11aeb5890	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	08a36eac-bd37-4e6a-8f47-6461b7672734	configure_bank_settings	Configure Bank Settings	Configure core banking system settings	management	system	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
affb1bd9-c1bf-4242-b21d-24ae6140613d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	90c96a7d-7049-4b70-8d60-2af92d3029ec	manage_transaction_limits	Manage Transaction Limits	Set and modify transaction limits	management	limits	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
9eeeaadf-ea3d-4816-b48a-e8c68710a7e8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7c9b3bc2-66b8-4cfd-ae84-95762298d918	system_backup_recovery	System Backup & Recovery	Perform system backup and recovery operations	platform	system	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
e3e2dce4-cf45-4b73-a2c3-568d112b789a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	bf2d4d1e-e7c6-442d-af47-7597a99dbfdc	database_administration	Database Administration	Direct database administration access	platform	database	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
41c053ee-fd27-4414-8735-90ec943277bf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	0e5093f5-0e03-49d7-82f3-b4ceb5177a6b	integration_management	Integration Management	Manage third-party service integrations	platform	integrations	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
100138a4-01de-4d15-bac1-4d47532060d4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	10d1e4d6-ce02-43c0-b78c-b648b598c695	access_ai_chat	Access AI Chat	Use AI assistant chat functionality	operations	ai	execute	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
141ea57b-7150-4f24-bf1d-a7d40f921e99	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	6c4f8d94-65e5-4bd1-ba1e-ac194e0640a8	ai_analytics_insights	AI Analytics Insights	Access AI-powered analytics and insights	management	ai	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
1688cf5a-76c3-4388-8814-65d7aa4eb85f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	7101b2c1-797d-4318-a277-e51d280e1f6e	ai_powered_recommendations	AI-Powered Recommendations	Receive AI-generated recommendations	operations	ai	read	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
a1cf9e0a-9e00-4dfe-9155-2711f9b8247e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	c320e930-8a64-40e2-81c5-9e11015b7621	configure_ai_settings	Configure AI Settings	Configure AI assistant parameters	management	ai	create	t	f	\N	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209
\.


--
-- Data for Name: rbac_role_hierarchy; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_role_hierarchy (id, tenant_id, parent_role_id, child_role_id, can_delegate, inheritance_level, created_at) FROM stdin;
\.


--
-- Data for Name: rbac_role_permissions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_role_permissions (id, tenant_id, role_id, permission_id, permission_level, conditions, effective_from, effective_to, created_at, updated_at, created_by) FROM stdin;
aa39c48d-fefa-4737-aa89-cab7752933d1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	d6f4823d-7b72-40b5-b3f4-649f143978e5	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c98a5d54-cda2-4866-8346-6bd4fd444e22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	d6f4823d-7b72-40b5-b3f4-649f143978e5	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f34a0739-ac33-41ce-b895-0a4a424ebd8d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	d6f4823d-7b72-40b5-b3f4-649f143978e5	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
956e9179-83d8-4775-9e34-1902bb215c51	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	434761e3-18d4-4e51-8660-223712f4216a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
0bcc86fa-fc7e-4aa6-af7f-000831569d0a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	434761e3-18d4-4e51-8660-223712f4216a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9d670f76-e5c6-4944-9147-97a8f7a09098	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	434761e3-18d4-4e51-8660-223712f4216a	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
bd67383c-a476-40e0-bd58-a9413801e61a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	434761e3-18d4-4e51-8660-223712f4216a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b1cbdc25-a65f-4192-911f-196752da102c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	e15b3b1f-0303-43a4-b6ca-9854842ae28f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e987fc3f-4366-4e17-b84b-e4905da18bb7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	e15b3b1f-0303-43a4-b6ca-9854842ae28f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
6f5189a5-7fb6-471a-89bb-4cd5398bb69f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	e15b3b1f-0303-43a4-b6ca-9854842ae28f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
dde33c85-9006-45fd-b2e1-c7f4553acbc8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	e15b3b1f-0303-43a4-b6ca-9854842ae28f	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
adb11091-5c07-4ce1-b5da-bfbd56b175dd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	e15b3b1f-0303-43a4-b6ca-9854842ae28f	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
16829616-3e14-4144-a5b1-2f044173bb8f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	1029445d-c1bc-4513-9580-018ee94795ba	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
60d72226-6363-4bcb-861f-c7391b339cf1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	1029445d-c1bc-4513-9580-018ee94795ba	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d8c2ff8a-9a11-492d-8d6c-8cbc30eee468	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	1029445d-c1bc-4513-9580-018ee94795ba	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
fe5227a4-c8f0-45e6-97b5-38d120c458ac	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	1029445d-c1bc-4513-9580-018ee94795ba	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
fea6c101-7371-450e-9bac-ab65a29abaad	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	6beea4a2-c492-4de5-8c87-4e973c6d1e03	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c5c8b4a4-91cb-4caa-b26c-6d6de10ebcbf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	6beea4a2-c492-4de5-8c87-4e973c6d1e03	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
641143db-db36-4657-9632-97104f5ce354	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	6beea4a2-c492-4de5-8c87-4e973c6d1e03	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f1b4e31e-7c07-43c4-af06-e6bd2a1c2507	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	0579d541-3549-4e9b-a6cf-23a6b4571899	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
1a461ae4-2354-49cb-bba9-a161f025b03e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	0579d541-3549-4e9b-a6cf-23a6b4571899	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
358e8a6d-f08d-4726-b15b-49e52d2e2f93	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	0579d541-3549-4e9b-a6cf-23a6b4571899	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7fa45844-fa6e-461d-b826-483adb5073ad	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	0579d541-3549-4e9b-a6cf-23a6b4571899	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9ba8b464-e547-43dc-85b3-bb18aa4eb3cb	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	8b2fcc5b-c658-4195-98fe-98bd422688b2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b8e9d0a4-6888-4d10-a13a-c4bef806bcf6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	8b2fcc5b-c658-4195-98fe-98bd422688b2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
db7e83b7-e864-43c9-9019-fc0b158c469f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	8b2fcc5b-c658-4195-98fe-98bd422688b2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
aa22f3bd-4269-43c7-bc33-9b6e181f5baa	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	8b2fcc5b-c658-4195-98fe-98bd422688b2	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
43fe7ef9-3109-4c14-baa5-e46d9791848c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	8b2fcc5b-c658-4195-98fe-98bd422688b2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
bd5cbf1a-1c44-4001-8389-d7719b25d14c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	8b2fcc5b-c658-4195-98fe-98bd422688b2	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9d1593c4-41ea-4215-8602-8a5bc3c2906d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5da7dc76-6cb5-4264-82fc-4c141945332d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9dd05f42-ea7b-4f77-b990-a5ab12daa869	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5da7dc76-6cb5-4264-82fc-4c141945332d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
64571739-f532-4237-9226-3c41661b055d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5da7dc76-6cb5-4264-82fc-4c141945332d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7efe391b-0dba-42e3-a2c7-065e8b93ff8c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	5da7dc76-6cb5-4264-82fc-4c141945332d	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8a28c8e9-ad14-4d28-90b7-34b42645d753	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	2646ef04-dc41-4d86-9cec-999dc9b2ad1d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2110e811-ae78-47b3-b53e-d06388cd037e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	2646ef04-dc41-4d86-9cec-999dc9b2ad1d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ef95c120-cbb5-4d1d-8f20-f20bfd4b154a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	2646ef04-dc41-4d86-9cec-999dc9b2ad1d	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
905a7181-cf66-4692-b1be-0d22013a309d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	2646ef04-dc41-4d86-9cec-999dc9b2ad1d	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
5743fdf8-1049-4bbd-94d1-404caabad7f6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	871c2261-4f5d-4971-8275-87dcca1f2fe6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
554fb5ae-37c9-4de9-9f0b-649ffb57f6ef	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	871c2261-4f5d-4971-8275-87dcca1f2fe6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7f83f24d-4200-4288-a1f8-271c5beb3615	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	871c2261-4f5d-4971-8275-87dcca1f2fe6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8a9926bb-fea3-4d03-a35b-0aad35295c3e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	871c2261-4f5d-4971-8275-87dcca1f2fe6	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
4eed4897-9298-4eb1-b051-b2eab7f37dd0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	871c2261-4f5d-4971-8275-87dcca1f2fe6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
730c7c1a-8c20-47b2-aebf-c7ff05e027f8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	871c2261-4f5d-4971-8275-87dcca1f2fe6	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
a988bb73-8b16-4866-91f6-adb5806423f4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	9d2bca2b-536b-4557-afd7-d5a6bf894c81	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
6bc719a9-2043-44b2-8805-7f4a73a849bd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	9d2bca2b-536b-4557-afd7-d5a6bf894c81	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2a6ce9a2-ffe8-461e-a7ec-0c8e227fdc9b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	9d2bca2b-536b-4557-afd7-d5a6bf894c81	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
adf75145-376a-4fee-b642-44affcdfa19d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	9d2bca2b-536b-4557-afd7-d5a6bf894c81	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f5936dbd-d9bd-40b1-a7d9-6e8df6269b09	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	9d2bca2b-536b-4557-afd7-d5a6bf894c81	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8be53175-f724-47d3-8caa-3411728619dc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	9d2bca2b-536b-4557-afd7-d5a6bf894c81	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
5e9fcc3a-2991-425e-9bf8-d2050571a36b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5bc932df-72e9-4117-8df4-d9e0e7fe9d0c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
eac07b2c-76fc-4b13-850d-a708a4bf177c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5bc932df-72e9-4117-8df4-d9e0e7fe9d0c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2e359072-ab03-4f02-9740-b16ddbb6c88e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5bc932df-72e9-4117-8df4-d9e0e7fe9d0c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
db4ca506-3f96-49cf-85b1-16812230c729	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	076b8a5c-b3a6-45e3-ab39-06836051f13c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b524e614-3605-4170-ab80-cc2a97204239	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	076b8a5c-b3a6-45e3-ab39-06836051f13c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
cfc5547f-f616-4f6d-98ef-037f5b4ce2d8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	076b8a5c-b3a6-45e3-ab39-06836051f13c	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
00be44fe-027a-4de3-90c7-e98df0ac794a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	076b8a5c-b3a6-45e3-ab39-06836051f13c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e61ab38e-35b5-46fb-b6e8-ef2ceeecce42	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	a325883b-571c-45d9-a3df-ab61078e1886	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ea3e6705-fffb-4e37-ad49-5052d99e872d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	a325883b-571c-45d9-a3df-ab61078e1886	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
3bdef935-8f6c-4037-a56e-641d445f3d45	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	a325883b-571c-45d9-a3df-ab61078e1886	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
32c8bef6-a452-44c5-bfd6-3d0e2ce9d03f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	a325883b-571c-45d9-a3df-ab61078e1886	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
cdff3c6e-505e-43f4-8adb-6e2faa30565d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	a325883b-571c-45d9-a3df-ab61078e1886	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ef5bfcaa-a643-4594-96f6-ff5a10eb651b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5f559d25-4861-4e77-8ac9-42f1aceb2de2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8b371b6d-8890-4850-90ec-faadbb8cf1dc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5f559d25-4861-4e77-8ac9-42f1aceb2de2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
af2990da-714a-4d3d-91ca-d09e4a0a63f2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5f559d25-4861-4e77-8ac9-42f1aceb2de2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c0f9f4e1-ffdd-44b6-b9ea-e7650f053842	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	5f559d25-4861-4e77-8ac9-42f1aceb2de2	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d48d48fc-3bc6-4811-90f1-fc4e0993c602	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	85a678d9-1797-48c3-943f-9a3acda991ea	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
bdc8098c-674c-49eb-8b18-b91f2b940048	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	85a678d9-1797-48c3-943f-9a3acda991ea	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
229809f5-e32a-4632-b347-312069eaa7ed	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	85a678d9-1797-48c3-943f-9a3acda991ea	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
99646dd7-1bc0-465f-84bd-20ada7053f6a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	834196e9-6336-4929-8196-6ea93aa61672	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
64610e55-993f-4afa-b9cf-660eda11cbef	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	834196e9-6336-4929-8196-6ea93aa61672	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b8c7ab48-18ed-41bb-8a62-9e0f9e57c3d6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	834196e9-6336-4929-8196-6ea93aa61672	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
a7ba6391-d670-423c-bc35-70abc4648ae9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	2170ad05-ef90-4ca0-bc1f-581b3eac44b0	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c965cf07-7782-443d-a504-116c1f7507a0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	2170ad05-ef90-4ca0-bc1f-581b3eac44b0	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7c17b984-99ee-471a-946d-6d1451691902	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	2170ad05-ef90-4ca0-bc1f-581b3eac44b0	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d9ab887c-4c94-4f4f-b8aa-cf303e9c2b11	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	2170ad05-ef90-4ca0-bc1f-581b3eac44b0	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
45861452-87fd-41c1-9cb3-f8efa3520693	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	9f3b75da-e81e-49bd-b7df-6b95bf6c616a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7fa262f3-1a19-4d59-a6e4-bdde0f261271	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	9f3b75da-e81e-49bd-b7df-6b95bf6c616a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c776c0c5-5754-4de3-848e-f0a7c387cbaf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	9f3b75da-e81e-49bd-b7df-6b95bf6c616a	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
6dd203bd-ffa2-4be2-a413-5eec96a9aed5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	63d70597-49c0-40d4-b6fb-01379f7b9824	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
3b6cc79f-2cc5-4725-8c6f-eaae867baf08	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	63d70597-49c0-40d4-b6fb-01379f7b9824	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2210eb9f-a5b6-4785-a785-6d6e4a118920	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	63d70597-49c0-40d4-b6fb-01379f7b9824	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
869eb0ec-3752-47c2-8b68-064255d1f095	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	63d70597-49c0-40d4-b6fb-01379f7b9824	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
0e778999-5b46-4c6b-803c-2f1bfd92f462	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	63d70597-49c0-40d4-b6fb-01379f7b9824	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f881621a-6704-4945-9f4b-2e0b53f747ac	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	9d2a2402-cd41-4332-af43-c71004114949	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
31dbd8cc-b22f-4afb-9c91-9fab830ad699	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	9d2a2402-cd41-4332-af43-c71004114949	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
beb172ed-63d8-46f0-b501-fd7b459c33b0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	9d2a2402-cd41-4332-af43-c71004114949	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ac222ec8-19b8-474a-ba69-491b59ba0b63	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	9d2a2402-cd41-4332-af43-c71004114949	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7a36fc2e-9373-4a7a-8169-4d8ded682533	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	2352747f-5a1e-4eeb-9a3b-dd3022e01284	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
a2f8b6a3-7b3c-4363-b182-1ddf76f823e1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	2352747f-5a1e-4eeb-9a3b-dd3022e01284	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
73c36399-6415-4620-a4fe-4eddb41c34eb	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	2352747f-5a1e-4eeb-9a3b-dd3022e01284	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
369b5260-1188-4c49-b89e-e6c3fa450904	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	2352747f-5a1e-4eeb-9a3b-dd3022e01284	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2f1154a4-127f-4d81-b32c-a13c75ba76b5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	e80d8fdb-1239-4077-836d-0c8ece8a5748	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
276ca494-3df0-43d1-9f4f-3f205f5a035e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	e80d8fdb-1239-4077-836d-0c8ece8a5748	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
08021003-2843-4d4f-bb59-83a6e1d4b843	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	e80d8fdb-1239-4077-836d-0c8ece8a5748	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
a91e1c9b-f2e5-4d21-a4db-b56b7cf6c57c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	e80d8fdb-1239-4077-836d-0c8ece8a5748	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
cb9ab309-e83f-436c-99fb-6f796e577211	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	f1ca4c40-80d0-4ad2-9f02-48a58d130bf1	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b6e0f890-7061-433d-8a20-6f0a81e52a65	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	f1ca4c40-80d0-4ad2-9f02-48a58d130bf1	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
63f7bcf5-2f45-434b-8e9a-d2143dac9d58	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	f1ca4c40-80d0-4ad2-9f02-48a58d130bf1	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
08d86910-c1f7-4921-8b6f-112ed6adfe1e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	d87b290f-3a0a-492b-890a-f655dd3bc8e8	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
5e03efb3-e706-44ef-ab6b-f7b905e80d90	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	fe3bf1ef-3334-4a92-ac80-5f0153d02233	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
58c9f3bf-cbf2-4d8b-ba34-6683b0b7a038	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	fe3bf1ef-3334-4a92-ac80-5f0153d02233	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
20586684-d8d6-46f6-b9ac-0b5ea9535ee6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	fe3bf1ef-3334-4a92-ac80-5f0153d02233	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b7b00dfb-52d7-4729-b249-8112ab1c66bf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	c03f372b-f316-4e77-80b7-127c776ce3ec	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
1a054672-d79c-4069-a510-39b7d9dba7ec	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	c03f372b-f316-4e77-80b7-127c776ce3ec	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9077080c-b68d-419b-a393-f6ed8a85f9f3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	c03f372b-f316-4e77-80b7-127c776ce3ec	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
eb062761-db60-4c5c-86c2-e8a9d079126a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	e163396f-407d-40be-931c-1861102f0504	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
918ce276-95b0-49de-b9d3-ac85f82f02a6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	e163396f-407d-40be-931c-1861102f0504	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
cb1a0c85-c9c3-437e-9fd9-029483126010	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	e163396f-407d-40be-931c-1861102f0504	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
167bdbb2-4c40-4eb8-864c-cc05b5484c03	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	e163396f-407d-40be-931c-1861102f0504	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
53ebfe32-f45b-41ec-a2e5-eb617266495a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	761f7c08-f89f-4772-a98a-9732144ee3ee	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d92a3722-69fb-4f74-be4f-a0f7deef8c81	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	761f7c08-f89f-4772-a98a-9732144ee3ee	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d5534396-2e10-4f9d-a563-9ce0af8e517b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	761f7c08-f89f-4772-a98a-9732144ee3ee	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
a45d410c-dfc3-4e5e-8624-154ef65e2d72	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	761f7c08-f89f-4772-a98a-9732144ee3ee	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8c8e8e74-093c-4df0-af18-cc803dc9140a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b6035ff1-6d04-4a17-a14c-d4cff0c38c60	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
22e15731-0199-4537-bbed-df8bda166228	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	99264891-3f7a-4fdb-b464-4e21cb56618f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c6c13a64-2eb5-43cd-be2f-468bdc4b976c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	99264891-3f7a-4fdb-b464-4e21cb56618f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e010b8ea-4af0-4445-9811-2dc58250bc1f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	99264891-3f7a-4fdb-b464-4e21cb56618f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
58806c00-e2f6-4d9e-a906-e36a6a308a3a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	99264891-3f7a-4fdb-b464-4e21cb56618f	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
0dd5fa08-fe03-4097-8689-b98322254184	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	a0b32bf0-6ae5-474e-9eac-8b77eab7b272	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
2abc9634-85d0-4f72-9587-82b19495d58a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	a0b32bf0-6ae5-474e-9eac-8b77eab7b272	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b1d5919f-6819-4e50-9f45-a4efe2527325	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	a0b32bf0-6ae5-474e-9eac-8b77eab7b272	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
bf2bb9cc-5bff-485f-b126-fb60e90a96ae	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	a0b32bf0-6ae5-474e-9eac-8b77eab7b272	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
32b206dd-2879-4c22-832d-3bd41388c91c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	a0b32bf0-6ae5-474e-9eac-8b77eab7b272	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d2c1b85f-5e5b-45ed-b161-9d4405e8ae2c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	365bf743-6685-4d40-ad74-b25e38366331	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
35c9bd94-ab43-46ce-ab16-049ea7e930ee	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	365bf743-6685-4d40-ad74-b25e38366331	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
4e69971e-e606-4557-a125-ecea53f841c3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	365bf743-6685-4d40-ad74-b25e38366331	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
50ffc20f-a3e9-498f-99d8-219bc64a6449	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	365bf743-6685-4d40-ad74-b25e38366331	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7291b528-faee-4a4d-82dc-6268e62ae40d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	913f24b8-53e8-48c1-a500-36bc332d7436	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e88cfd09-72dd-4e75-a995-d644c88bde19	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	913f24b8-53e8-48c1-a500-36bc332d7436	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f5c8856a-8dac-4612-9b08-f19b046d1953	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	913f24b8-53e8-48c1-a500-36bc332d7436	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
db9564af-70e7-42c3-b284-c22b2307333e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	f4f4552f-0c7a-4b6e-ae15-156e4b8ce070	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
02f8df40-ab7b-4e30-a424-f44d5e0b84d5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	f4f4552f-0c7a-4b6e-ae15-156e4b8ce070	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b1883d4b-6003-4aa2-9cba-c8c3b3b65ed7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	f4f4552f-0c7a-4b6e-ae15-156e4b8ce070	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
aca1f3d5-b896-4c35-a306-f9bef81e3071	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	49b4855e-8e89-4617-ba1d-f650a7c8bd58	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
85d22f49-fb03-46ea-b9b1-20e9f963c414	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	49b4855e-8e89-4617-ba1d-f650a7c8bd58	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
5ee0833a-3014-4a9f-a18d-aaf84120ef2c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	49b4855e-8e89-4617-ba1d-f650a7c8bd58	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8762beb3-f8ee-4c5e-99fa-eb31692c5be7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	934810c0-32dc-45c0-a43d-199e8f57c933	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
c8aba4a8-2318-4406-921b-eaf7b375b4e4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	934810c0-32dc-45c0-a43d-199e8f57c933	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
dc3d7d9d-6b43-4d83-999d-a8615a732b84	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	934810c0-32dc-45c0-a43d-199e8f57c933	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
5a9a3e13-6733-4536-afa2-cbacf528974a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	934810c0-32dc-45c0-a43d-199e8f57c933	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
bed5db68-0cf8-4e38-8a6c-64b7c9d0a164	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	c1d3687a-37a1-4be8-8cb1-933be20f38b7	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
29df3dea-e3b3-4e87-9403-f69250e61cfd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	8679287e-469e-4e95-88c5-8f74ffe995f6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
6f873038-644c-4fb9-9c14-f2329c0f362c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	8679287e-469e-4e95-88c5-8f74ffe995f6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
80c4cd1c-5990-4353-bd5b-2226aa588861	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	8679287e-469e-4e95-88c5-8f74ffe995f6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
65a3e107-df02-44bc-a0f8-8e98c3629025	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	54f0740d-f882-47da-8f10-42ca7b9ff2fd	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
b63cb266-3dd8-4eae-9228-ea35a27ff5c4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	cbb494e5-a568-40be-bc96-155f132bc5b6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
3888086e-6322-4595-898a-a758c51533c6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	cbb494e5-a568-40be-bc96-155f132bc5b6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
0b3bcb12-fe7c-4cdd-8622-cc675f1e1e28	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	cbb494e5-a568-40be-bc96-155f132bc5b6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
7a7f68fa-9a5d-42ea-b5cc-6585557bb631	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	cbb494e5-a568-40be-bc96-155f132bc5b6	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9040311c-9d15-4d80-9b60-48fda8b500ba	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	0cb844c5-4d7e-433a-bec6-93acfdc63559	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
32d55ca7-dc8c-439a-a753-5c2acc679fae	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	0cb844c5-4d7e-433a-bec6-93acfdc63559	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ebd37936-8c5d-4b97-9bdb-bf434f4c7a0f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	0cb844c5-4d7e-433a-bec6-93acfdc63559	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
98c06056-5bfc-4405-bbc8-2a39495803fb	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	aa5e341e-8fe6-405e-bc32-646cee802d3c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
0a4c989a-7b1c-4a91-a7c8-4edfc5b453f2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	aa5e341e-8fe6-405e-bc32-646cee802d3c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
287b2908-2b84-46ce-8ca0-4b673d84ef09	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	aa5e341e-8fe6-405e-bc32-646cee802d3c	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
6477ef27-cb87-4be0-857e-d9f013bef92f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5e5e26f1-12d1-4308-a921-4bb5630fd7dd	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
949ea7a5-3f4a-4dd0-a1ed-14d55d01aa97	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5e5e26f1-12d1-4308-a921-4bb5630fd7dd	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
925e8794-89c2-4fe0-8e4e-5b6b8ae4651d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5e5e26f1-12d1-4308-a921-4bb5630fd7dd	read	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
8c5bec01-2d32-44f7-a5e7-3c16a21f3986	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	5e5e26f1-12d1-4308-a921-4bb5630fd7dd	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
1f3b7f35-f5c3-45b1-9c7b-43fdde9c5d2a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	89deb2b7-c539-463b-abf3-b4324cf04a72	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
67e0854e-d75f-4b67-a493-aff66f5f36ad	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	89deb2b7-c539-463b-abf3-b4324cf04a72	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
088560f9-f0de-400e-94c5-a70b09ac50be	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	89deb2b7-c539-463b-abf3-b4324cf04a72	full	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
77257f38-4ff5-46af-a261-cae461607097	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	89deb2b7-c539-463b-abf3-b4324cf04a72	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
1dabad69-aa53-4777-9071-4159f65d40a4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	4a93fda0-54a8-44c2-bc5d-5bf898e088be	89deb2b7-c539-463b-abf3-b4324cf04a72	write	\N	2025-09-25 21:38:00.482438	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e99f1bb4-3bcb-4438-89b5-376de17d02f7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	ade84696-328f-4def-b0c2-427b5d786b3c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
759dbd45-ca37-4e16-8914-e8d0bb6c4292	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	569c09e4-fddd-4e79-bef0-07b2e9b7661a	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
271a8530-f5a2-478a-b5d3-3a8a1a08ea65	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	569c09e4-fddd-4e79-bef0-07b2e9b7661a	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
038d8352-0693-41ed-b415-d10ac523f681	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	569c09e4-fddd-4e79-bef0-07b2e9b7661a	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a3b3fd3e-0132-4571-8cb1-900b08ffc4b1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5f095827-8e2b-4984-a352-d293336cb408	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
29426c8c-ab3c-48c6-aad6-188e46bdcb3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5f095827-8e2b-4984-a352-d293336cb408	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
6bd315e6-8428-484f-9619-51e6798fc5f3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5f095827-8e2b-4984-a352-d293336cb408	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
aa2a78bd-9789-4664-899a-65a715e83634	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	7f6f4c20-c434-4c80-be54-b08de3c367e7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
bf075391-4526-4003-9d8d-b1b6dc5cee91	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	7f6f4c20-c434-4c80-be54-b08de3c367e7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
30159c5c-0b60-4bf2-b296-feae0e8c918c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	7f6f4c20-c434-4c80-be54-b08de3c367e7	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
bcd79420-9c0f-45d9-871c-25a541d61ed7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	c7df67d6-73b1-4d91-b5dc-0a221b4c4ec4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5bd19073-717c-4de6-8b08-293a0b8d8f0c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	c7df67d6-73b1-4d91-b5dc-0a221b4c4ec4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
ead26c0d-500d-4e81-b21f-68ba08af51e1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	c7df67d6-73b1-4d91-b5dc-0a221b4c4ec4	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
0fd6e25e-cc26-450f-b01c-143fb692fe5f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b33bb7b3-b461-4288-a69e-016bef43fc9e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
1fd4e114-3560-48e5-9b6e-aa9a224c6559	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b33bb7b3-b461-4288-a69e-016bef43fc9e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
40909b8f-e489-4ba8-ac3f-064475da38e4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	b33bb7b3-b461-4288-a69e-016bef43fc9e	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
73232e6a-dbd0-408c-b549-e3bb133653d2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	1f2a7308-2466-4d06-8824-52cf86df1f41	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
0ee4fcdc-5071-4820-977c-47c71a068a12	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	1f2a7308-2466-4d06-8824-52cf86df1f41	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
cd78b5e3-5277-4383-8cc6-4eefd96b006f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	1f2a7308-2466-4d06-8824-52cf86df1f41	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
50c140f2-4699-4f71-a726-daf86996b565	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	484606e3-c25e-4e75-80ec-78b3ad1543d7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
378f36b7-84a1-4b2d-be03-2974288daeba	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	484606e3-c25e-4e75-80ec-78b3ad1543d7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
c7ce1254-e808-410f-8e43-0424cf928c64	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	484606e3-c25e-4e75-80ec-78b3ad1543d7	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
309054de-3ff7-4147-b998-517f79dafd22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	740b63c5-929f-4b47-bd6b-6e3a3ef016c7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
563227c1-3868-42bd-9c0e-59b36fa1356f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	740b63c5-929f-4b47-bd6b-6e3a3ef016c7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
44dda033-7305-4c0d-ac18-1720a4e19c39	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	740b63c5-929f-4b47-bd6b-6e3a3ef016c7	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
c3b74bdc-3d44-420b-b08e-665a6a2832c9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	740b63c5-929f-4b47-bd6b-6e3a3ef016c7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f334560b-7cd9-4cd5-8ae2-a734b468c8b2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	45e5f332-1727-41fb-adca-c0d65fe29300	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
9fe0f2da-50c5-4663-a825-ea790e0d4919	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	45e5f332-1727-41fb-adca-c0d65fe29300	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e1c4cd33-a27f-4455-ac69-09e15fd05323	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	45e5f332-1727-41fb-adca-c0d65fe29300	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
80b45d08-10a3-4cff-90e4-3e2553e31f22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	504b3739-ed3f-4371-83ab-6f373a7216e4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e136fda2-9143-402e-a63a-5817fcfc9924	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	504b3739-ed3f-4371-83ab-6f373a7216e4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
2d6187c8-8f71-4be9-b8a0-17247b8a2957	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	504b3739-ed3f-4371-83ab-6f373a7216e4	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e7862882-c192-45a2-9595-292613bfcb8a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	d7fb6ade-c1c3-443d-a1d0-1229f6755d3e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7cc6b7fd-cfe4-4b66-86eb-ef821e98a53f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	d7fb6ade-c1c3-443d-a1d0-1229f6755d3e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
4334a1e8-a867-43ec-a330-952249690541	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	d7fb6ade-c1c3-443d-a1d0-1229f6755d3e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
32bbab66-3b90-47b5-a6c3-8e3d561caa77	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	c28ceeb1-e436-4306-b665-3f49154161f7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
831b476a-f779-44de-bc72-e9d1be481791	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	c28ceeb1-e436-4306-b665-3f49154161f7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
c4c6fc44-adb0-44a7-97f5-1817105b0289	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	c28ceeb1-e436-4306-b665-3f49154161f7	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
ae1e9fe4-94e5-4a63-9e23-f167c2c92d17	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	c28ceeb1-e436-4306-b665-3f49154161f7	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f7b28277-2edc-4a72-a795-cc6f095f2072	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	ef6a3a75-f343-45a0-a30e-5f0ce8d574a9	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
3209fe3b-ce16-45f9-acee-e2c98e6f555e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	ef6a3a75-f343-45a0-a30e-5f0ce8d574a9	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7c9ed72a-521f-491a-b34c-213391b25bc0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	ef6a3a75-f343-45a0-a30e-5f0ce8d574a9	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b5acd6c8-e81c-489c-ba24-6eef88abff26	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	ef6a3a75-f343-45a0-a30e-5f0ce8d574a9	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a8c176fb-8e48-4ed9-aca7-f094ef00c41f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	a73d86f2-e8f1-4eed-9dec-bdd7ffbfcd27	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
24545603-b4b3-43ef-9c1d-497c4b254003	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	a73d86f2-e8f1-4eed-9dec-bdd7ffbfcd27	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f6ce5fa2-6af2-4541-b519-c6cfa180390a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	a73d86f2-e8f1-4eed-9dec-bdd7ffbfcd27	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e988b2d5-22ec-4b29-bd22-74b488d47bfb	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	7b2f6739-00b0-44af-8e69-62fc1c80dda8	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
55d402b0-82cb-4262-84e4-f07189cb78bf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	7b2f6739-00b0-44af-8e69-62fc1c80dda8	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
05150af5-33c9-4b6e-8823-280932ac7f45	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	d4629928-d54c-4e48-add5-75c55f76116c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
1dcc5e04-a52c-41a8-9789-90804d40862e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	d4629928-d54c-4e48-add5-75c55f76116c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d2055bb6-9a45-4f88-bbed-3192dd6793f6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	923aa2b0-7517-4bf5-a130-d3b8749cc4e5	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d0f0164b-50d8-42f6-95e3-518394df9f02	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	923aa2b0-7517-4bf5-a130-d3b8749cc4e5	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
709fe16b-8990-4d14-b5ed-e24c696f0640	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	923aa2b0-7517-4bf5-a130-d3b8749cc4e5	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
40ca20c5-3ece-45cc-a492-270921d63f11	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	923aa2b0-7517-4bf5-a130-d3b8749cc4e5	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d2a6b180-b876-4983-b0f7-ef9fd9ea6bc1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	923aa2b0-7517-4bf5-a130-d3b8749cc4e5	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d3bac1a6-b523-4278-a4f6-e2ad7199623a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	13a45a50-3b81-46d3-82b0-c0b0bceda821	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7e548069-a606-4a8e-bbdf-2447179d3212	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	13a45a50-3b81-46d3-82b0-c0b0bceda821	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
51fead35-2bfa-4aaf-bd61-44c28d9a8031	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	13a45a50-3b81-46d3-82b0-c0b0bceda821	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a97b68bf-1652-46a6-9614-3ff2024bda3e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	13a45a50-3b81-46d3-82b0-c0b0bceda821	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
251bf16e-0c03-48f3-8ee9-558382fe1e62	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	13a45a50-3b81-46d3-82b0-c0b0bceda821	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
693fc033-a343-4fd9-8479-a523f1b7d321	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	f792ffd0-3e91-40a2-b9a9-a32f20eb9cb9	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b85fba87-4652-44ef-be26-942f0f57668c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	f792ffd0-3e91-40a2-b9a9-a32f20eb9cb9	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
48754143-7a2a-490e-a25d-fdfa3c8198af	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	f792ffd0-3e91-40a2-b9a9-a32f20eb9cb9	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
43542478-bd96-44c1-83b6-ff61fbd69e46	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	63b3dcfb-fc2d-4d1f-a39b-0f6c434fbd9b	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7d6c620f-2f93-4b12-a86b-7dfb716a95ce	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	63b3dcfb-fc2d-4d1f-a39b-0f6c434fbd9b	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a279dce5-58b7-40ae-b70b-752e5b6507c9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	f050b605-4a69-41b4-adaa-ada9be1964e1	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b3a3e317-e7de-4a91-9757-225627789f60	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	f050b605-4a69-41b4-adaa-ada9be1964e1	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
4ac5b5c3-4ca5-4a0c-9fd9-378e88f9ed78	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	f050b605-4a69-41b4-adaa-ada9be1964e1	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
cf775b68-604f-4cc7-9e1c-e8d9ce065841	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b55d4740-e3a7-44ce-bc69-e11f508d354d	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
2118c5a5-3b1d-430c-a030-b608bfdbf149	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b55d4740-e3a7-44ce-bc69-e11f508d354d	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
214aac6a-49c8-4b78-a18a-cfef1fd0382c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	b55d4740-e3a7-44ce-bc69-e11f508d354d	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
85a7103a-2fd8-4502-871e-c9d9b4a426b4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
2ce3d97c-a195-4787-82a9-7f2ab5c10368	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7d345d37-3a9e-4ccf-b9d7-176e061fe168	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b50af62d-9b46-471a-bb00-b44ab530ef85	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d789708a-e4ef-4de9-b631-fafe3b49a31f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	b7677c4c-5a5b-434e-beb8-1e3b51c75c1f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e3eb9c2d-92ff-4fdd-8257-21d764dc6145	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	8645f722-e567-43ac-bf52-0757e11a2d22	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
080bad8c-2830-4542-ac6e-5dc82e15bcba	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	8645f722-e567-43ac-bf52-0757e11a2d22	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
0ab8979d-e8ac-41af-97c5-abfcad8f529f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	8645f722-e567-43ac-bf52-0757e11a2d22	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
8296b7ac-8cac-4af0-881a-ea10bf666595	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	8645f722-e567-43ac-bf52-0757e11a2d22	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b9e390ba-f66d-420f-81e0-c67ccd878c6a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	8645f722-e567-43ac-bf52-0757e11a2d22	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
806c0732-0d3e-421c-9f0e-55adae1481e8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	c839e799-03c7-4db1-b1ee-3faa075ae78c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
1f43ce78-24a5-4d00-85a4-900e513d18c6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	c839e799-03c7-4db1-b1ee-3faa075ae78c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5e905c4b-9c68-4ec1-b337-00e76bf84868	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	c839e799-03c7-4db1-b1ee-3faa075ae78c	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
6a5b0e84-b7a0-4a43-ad6c-2f65eaac1ecd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	c839e799-03c7-4db1-b1ee-3faa075ae78c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
952ae908-f006-443a-9112-180a60c8e3d7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	c839e799-03c7-4db1-b1ee-3faa075ae78c	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a54ae0b9-7d5c-4e87-9fbc-24519d0c51b0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	5b03259e-7719-447a-88fc-85fa7ad5c3ca	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
07adf65d-637c-481e-b99b-70f5fe2228af	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	5b03259e-7719-447a-88fc-85fa7ad5c3ca	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7ed38c1e-9326-43f9-9aed-522e6e17844f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	5b03259e-7719-447a-88fc-85fa7ad5c3ca	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
cb93a382-313a-4b01-af0e-10229c3c08e3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	5b03259e-7719-447a-88fc-85fa7ad5c3ca	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
66f27e84-aa54-4993-94ec-218419398401	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	5b03259e-7719-447a-88fc-85fa7ad5c3ca	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
305ea154-fdca-407d-a2e3-b4090a622fbd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	36bea580-f2c9-497f-830b-72ed52ade5e3	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
c9b1dbc9-36aa-42e5-9789-d94099dbfcc5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	36bea580-f2c9-497f-830b-72ed52ade5e3	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5490405c-c063-4067-b728-1ce99fc817d8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	36bea580-f2c9-497f-830b-72ed52ade5e3	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
28ec2021-d903-462b-a7e8-8adde1fd3c91	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	36bea580-f2c9-497f-830b-72ed52ade5e3	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
624eb26a-b912-4e1d-9ff7-0d20731c2096	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	fd373a87-65c7-47b6-a0f6-686587980648	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
db8940a2-8c1b-4a76-a127-92c93150a5c6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	fd373a87-65c7-47b6-a0f6-686587980648	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f7db91a2-f40f-499f-8bd0-c64a55933cdc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b8988627-8c82-403d-bb4c-07a1c8bf5483	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d39cd871-9755-455b-bd4b-3b2fd688e1ac	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b8988627-8c82-403d-bb4c-07a1c8bf5483	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e0bc5486-29aa-40e9-9c6e-8d549553874c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	b8988627-8c82-403d-bb4c-07a1c8bf5483	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5f38a673-2d46-46e0-af59-c3e4d6892fdf	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	9f9178ac-e7d7-4a13-a10a-1a9290761fbf	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
8bd1b66f-4f6f-40db-8dad-099b2d4fe923	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	9f9178ac-e7d7-4a13-a10a-1a9290761fbf	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
e114405c-8f50-4993-ac47-71cc6a7fa4ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	9f9178ac-e7d7-4a13-a10a-1a9290761fbf	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
fe9c9565-ce55-4d1d-bd7c-860734afe058	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	9f9178ac-e7d7-4a13-a10a-1a9290761fbf	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
ac3516d6-bc2c-4d23-be9b-5a35bf34373b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	1599338e-6df6-4d18-b285-2fb80d94978b	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a929169a-99a0-4bf4-8e4c-49d7e9f14845	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	1599338e-6df6-4d18-b285-2fb80d94978b	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
8ee7c9c1-91e2-46d9-8df6-58d937b5f1b9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	1599338e-6df6-4d18-b285-2fb80d94978b	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a3d4997b-9691-4200-aa0d-971d6bca3e0a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	bda28c46-8c26-4e40-93ec-9310618c9745	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
ee139852-8690-4915-8508-b1031ffce1de	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	bda28c46-8c26-4e40-93ec-9310618c9745	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5ae190bf-e1c9-4157-b36a-70a253cb94d6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	bda28c46-8c26-4e40-93ec-9310618c9745	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
855a4a75-11bc-462e-addf-01bf2a1bea36	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	aa0ac506-d4ed-44eb-b674-67541491253c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f22f9c96-9ef5-4c04-b166-70a0be06018f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	aa0ac506-d4ed-44eb-b674-67541491253c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f59c79d5-30c3-40e6-a656-073bbea87bea	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	aa0ac506-d4ed-44eb-b674-67541491253c	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
b9c154f2-3138-4659-96bc-22cec702b10f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	b93aea0a-af5f-40f9-bbfa-8972106f7714	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
0a2700ee-7c41-4bae-986b-6adac8e614f8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b93aea0a-af5f-40f9-bbfa-8972106f7714	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5f867e79-e492-4d12-b951-393c19228740	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	b93aea0a-af5f-40f9-bbfa-8972106f7714	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
da40546f-76f6-475b-b040-d10d329f0185	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	686c9cc1-1189-4d72-846c-8cf11aeb5890	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
4accae3c-04f9-49ed-ac4e-f1d095095d4a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	686c9cc1-1189-4d72-846c-8cf11aeb5890	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d0b23293-29c3-4054-9bf0-85233f19acfa	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	affb1bd9-c1bf-4242-b21d-24ae6140613d	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
09c61820-6d2b-4c0a-80ae-fa055ec17e26	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	affb1bd9-c1bf-4242-b21d-24ae6140613d	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7227ecef-77b4-405b-823d-c2b87e11ec12	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	9eeeaadf-ea3d-4816-b48a-e8c68710a7e8	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
bfb0e6af-8823-4c1b-a8d1-16987b5f54f5	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	e3e2dce4-cf45-4b73-a2c3-568d112b789a	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
01c9f1ed-1332-464b-92ed-39ce757ca7c6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	41c053ee-fd27-4414-8735-90ec943277bf	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
eb81335e-2ee4-45fd-9dd7-540df80eeaf1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	100138a4-01de-4d15-bac1-4d47532060d4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d0a03591-d3be-4efc-9381-7416356047ce	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	100138a4-01de-4d15-bac1-4d47532060d4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
ee27e896-d1f0-4c75-a763-a59dd7f7a8d6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	100138a4-01de-4d15-bac1-4d47532060d4	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
7f70d0f9-6c74-4c8c-b494-a60d16035fbc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	100138a4-01de-4d15-bac1-4d47532060d4	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a642f4bb-374f-47ac-b684-da5300509ea7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	100138a4-01de-4d15-bac1-4d47532060d4	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
55d15511-1d2c-49e8-bc13-bd1d264d183f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	100138a4-01de-4d15-bac1-4d47532060d4	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
6b923ce3-6c76-454b-858e-9d927e359b28	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	141ea57b-7150-4f24-bf1d-a7d40f921e99	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
8f2dd4bf-be73-4dd0-a94b-8855e3152e07	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	141ea57b-7150-4f24-bf1d-a7d40f921e99	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
a096f101-802f-485d-a6cf-c68fd0899e59	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	141ea57b-7150-4f24-bf1d-a7d40f921e99	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
afd4bedb-32b8-4df2-bc75-61e48ddcecb3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	141ea57b-7150-4f24-bf1d-a7d40f921e99	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
8851a752-ec54-47ef-8d51-e52dd3230272	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	1688cf5a-76c3-4388-8814-65d7aa4eb85f	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
f61392af-4a94-4ef9-a59f-c1b2a9fd2aa6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	1688cf5a-76c3-4388-8814-65d7aa4eb85f	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
87268a3b-379b-452e-bb82-531916fe40c7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ae36a192-8287-448f-b227-cecc3227ccfe	1688cf5a-76c3-4388-8814-65d7aa4eb85f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
29e2b3e6-4254-477c-bd2d-caec961abe22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f2186283-b988-4bda-941f-da07d6371aeb	1688cf5a-76c3-4388-8814-65d7aa4eb85f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
5add03e0-7a3a-4bc2-9119-d877743af873	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e19bc7f8-bc09-4e9f-9781-47388dba62c6	1688cf5a-76c3-4388-8814-65d7aa4eb85f	write	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
d444e588-13f7-4067-8cc8-1166525e0880	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f7072c0c-ca18-4edb-932e-a900ae914ff2	a1cf9e0a-9e00-4dfe-9155-2711f9b8247e	full	\N	2025-09-25 21:53:59.341209	\N	2025-09-25 21:53:59.341209	2025-09-25 21:53:59.341209	\N
1269a96a-8929-4b76-8f2f-8c40b9eacee2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f47adcf3-f012-4e30-9024-fa3614dc5c0f	b6035ff1-6d04-4a17-a14c-d4cff0c38c60	full	\N	2025-09-25 22:28:33.352286	\N	2025-09-25 22:28:33.352286	2025-09-25 22:28:33.352286	\N
\.


--
-- Data for Name: rbac_roles; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_roles (id, tenant_id, platform_role_id, code, name, description, level, is_active, is_custom_role, hierarchy_path, branch_restrictions, department_restrictions, created_at, updated_at, created_by) FROM stdin;
f7072c0c-ca18-4edb-932e-a900ae914ff2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	42bd9481-5511-4dd0-b2ba-bdcb56d49c10	platform_admin	Platform Administrator	Full platform access across all tenants	0	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
58317935-8d6f-4bf7-8aff-e7758295f01f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fe51835b-8350-4297-a9f5-0cd503c75733	tenant_admin	Tenant Administrator	Full access within tenant boundary	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f47adcf3-f012-4e30-9024-fa3614dc5c0f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	94b16979-72b7-4be8-968d-892028b9a78c	ceo	Chief Executive Officer	Highest authority within bank tenant	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
11325fe3-b184-4187-a77d-49e2d5fe8be2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	f73969e9-1094-4402-bd30-5b6017eb3df5	coo	Chief Operating Officer	Operations oversight and strategic decisions	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
9749ccd6-703c-40f0-9e52-db70923dfc61	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	e8978ed0-8a2d-4cab-80c7-a6a7a8975248	cfo	Chief Financial Officer	Financial oversight and compliance	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
33021799-0215-4938-8adf-b8e8b291d26e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	0e342384-3b13-47a9-8ddd-23ee6e091f96	cto	Chief Technology Officer	Technology and security oversight	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
46e9cbd0-9c9b-4f29-a2c8-267c35d4764b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	63e954bf-abe1-4378-b1b1-1954b6da4bbf	compliance_officer	Compliance Officer	Regulatory compliance and risk management	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
d3c1c673-caa7-44ca-a151-74a631efd4d7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	07ed3bb6-c083-49e0-a3ba-09f96f9ea6d4	head_of_operations	Head of Operations	Daily operations management	1	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
ae36a192-8287-448f-b227-cecc3227ccfe	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	d299e1b7-7c8f-42e8-8376-d069426a7c04	branch_manager	Branch Manager	Branch-level management and oversight	2	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
96517b5d-2c9e-44ac-bdaf-b98cba8bbb48	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	657c788f-4890-45f7-b772-ff7d7effd1e0	assistant_branch_manager	Assistant Branch Manager	Support branch management functions	2	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
60127b44-2dc7-4ee8-a585-1bea779821b4	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	490af44c-9aec-48fd-a16e-8e95d95a4b95	operations_manager	Operations Manager	Operations management at branch level	2	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
3bc0c378-3466-4da3-b6a7-3d5fda92b641	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1dc43912-672c-4892-9d99-8de85420eeb9	customer_service_manager	Customer Service Manager	Customer service oversight	2	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
e19bc7f8-bc09-4e9f-9781-47388dba62c6	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	d08772c3-aa59-4a2a-8c0e-76ec4ea2325b	loan_officer	Loan Officer	Loan processing and management	3	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
f2186283-b988-4bda-941f-da07d6371aeb	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	437f0197-8aa0-4ef8-a9ac-2fa5f6e7fa88	bank_teller	Bank Teller	Front-line customer service	3	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
4a93fda0-54a8-44c2-bc5d-5bf898e088be	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	ec3e7101-8e2a-4bcc-a56b-a1c579c2f6c9	customer_service_rep	Customer Service Representative	Customer support and basic transactions	3	t	f	\N	\N	\N	2025-09-25 21:38:00.482438	2025-09-25 21:38:00.482438	\N
882caa9c-b074-4f7c-a810-de1567b340f0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cef037ed-c74d-4760-8c9e-822ddbdbe121	it_manager	IT Manager	Head of IT department and technology operations	2	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
3eaab3c0-b6bd-4a22-9a3c-c3acecb8431a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	efe96241-ae03-4c8a-9419-fb2cec733204	security_manager	Security Manager	Information security and cybersecurity oversight	2	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
94442ed1-719d-42ac-93bc-102c72f015ee	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	a81d18e1-8291-4d0e-b875-1b81a5147730	senior_software_engineer	Senior Software Engineer	Lead developer and technical architecture	2	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
435c6ab2-3e37-4a9f-9155-e5aec1a4b5e3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	63f3fe24-4a5b-4e95-9f24-10467ada4949	devops_manager	DevOps Manager	Infrastructure and deployment operations management	2	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
b4ef1f53-5701-4a5a-a11d-125c2da1e8ae	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	bdd476be-7637-4144-9836-58605a7f4ad3	software_engineer	Software Engineer	Application development and maintenance	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
34db3a3f-e046-46a6-bb7d-7bac68100d30	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	db49d211-1fe9-4673-91ae-8660b39da6d9	system_administrator	System Administrator	Server and infrastructure administration	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
fb25ded1-146c-4fa5-84e6-3f6f03e356e2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	57d85863-7cf5-4ce0-8acb-eab8d0c8fca8	database_administrator	Database Administrator	Database management and maintenance	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
dfa6c329-fecd-4b0a-b261-80c4c5e05706	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2600f432-59a1-4201-969f-377c9f0117ff	network_administrator	Network Administrator	Network infrastructure and connectivity	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
8e3ded40-b875-45ea-b26d-1d878c06d859	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	68a12d75-1505-4282-aa2b-589bffa95c1d	security_analyst	Security Analyst	Security monitoring and incident response	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
da9b89e1-2eff-43bc-9a1c-f6722a15898e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	c902ceb6-36b5-419b-902c-4b4bb6ed434f	qa_engineer	QA Engineer	Quality assurance and testing	3	t	f	\N	\N	\N	2025-09-25 22:41:17.748433	2025-09-25 22:41:17.748433	\N
\.


--
-- Data for Name: rbac_temporary_permissions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_temporary_permissions (id, tenant_id, user_id, permission_id, granted_by, reason, effective_from, effective_to, is_active, usage_count, max_usage, emergency_access, approval_required, approved_by, approved_at, created_at) FROM stdin;
\.


--
-- Data for Name: rbac_user_roles; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.rbac_user_roles (id, tenant_id, user_id, role_id, assigned_by, assigned_at, effective_from, effective_to, is_active, assignment_reason, additional_permissions, restrictions, created_at, updated_at) FROM stdin;
dd67d9f5-9c65-497e-b13a-f6bb92221516	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	f47adcf3-f012-4e30-9024-fa3614dc5c0f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	2025-09-25 21:38:40.739988	2025-09-25 21:38:40.739988	\N	t	Initial admin setup for development	\N	\N	2025-09-25 21:38:40.739988	2025-09-25 21:38:40.739988
79751600-a11b-4def-85f3-de47fe60bc62	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	f47adcf3-f012-4e30-9024-fa3614dc5c0f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	2025-09-25 22:02:41.592928	2025-09-25 22:02:41.592928	\N	t	CEO role for demo user - QA and testing purposes	\N	\N	2025-09-25 22:02:41.592928	2025-09-25 22:02:41.592928
\.


--
-- Data for Name: recipients; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.recipients (id, user_id, tenant_id, account_number, account_name, bank_code, bank_name, nickname, is_favorite, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recurring_transfers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.recurring_transfers (id, tenant_id, user_id, from_wallet_id, to_wallet_number, recipient_name, amount, currency, reference, narration, frequency, start_date, end_date, next_execution_date, last_execution_date, execution_count, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.referrals (id, referrer_id, referee_id, referral_code, bonus_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: scheduled_transfers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.scheduled_transfers (id, tenant_id, user_id, from_wallet_id, to_wallet_number, recipient_name, amount, currency, reference, narration, scheduled_date, status, transfer_id, error_message, executed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_metadata; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.tenant_metadata (tenant_id, tenant_name, schema_version, created_at, updated_at) FROM stdin;
c7afab8c-00fa-460e-9aaa-2999c7cdd406	migration_007	1.1	2025-09-09 00:25:33.254372	2025-09-09 21:54:14.131021
550e8400-e29b-41d4-a716-446655440000	test-tenant	1.1	2025-09-09 22:36:42.899541	2025-09-09 22:36:42.899541
7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fmfb	1.0	2025-09-04 19:44:07.495083	2025-09-04 19:44:07.495083
\.


--
-- Data for Name: transaction_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transaction_logs (id, transfer_id, event_type, message, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transactions (id, tenant_id, user_id, reference, external_reference, batch_id, parent_transaction_id, type, amount, currency, exchange_rate, original_amount, original_currency, description, merchant_category, transaction_tags, recipient_name, recipient_account, recipient_bank, recipient_bank_code, recipient_details, sender_name, sender_account, sender_bank, sender_details, status, substatus, processing_details, failure_reason, failure_code, ai_initiated, voice_initiated, ai_confidence, natural_language_command, ai_processing_metadata, ai_recommendations, fraud_score, fraud_factors, risk_level, risk_factors, compliance_flags, payment_provider, payment_method, provider_transaction_id, provider_response, provider_fees, total_fees, charges, transaction_location, device_info, channel, settlement_date, settlement_batch, reconciliation_status, initiated_at, created_at, processed_at, completed_at, settled_at, compliance_checked, compliance_score) FROM stdin;
550e8400-e29b-41d4-a716-446655440001	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	RENT-2025-01	\N	\N	\N	money_transfer	75000.00	NGN	1.000000	\N	\N	Rent Payment	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
550e8400-e29b-41d4-a716-446655440003	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	SHOP-001	\N	\N	\N	bill_payment	25000.00	NGN	1.000000	\N	\N	Shoprite Groceries	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
550e8400-e29b-41d4-a716-446655440004	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	REST-001	\N	\N	\N	bill_payment	12000.00	NGN	1.000000	\N	\N	Restaurant Dinner	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
550e8400-e29b-41d4-a716-446655440005	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	FUEL-001	\N	\N	\N	bill_payment	15000.00	NGN	1.000000	\N	\N	Fuel Station	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
550e8400-e29b-41d4-a716-446655440006	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ELEC-001	\N	\N	\N	bill_payment	8000.00	NGN	1.000000	\N	\N	PHCN Electricity	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
550e8400-e29b-41d4-a716-446655440007	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ATM-001	\N	\N	\N	cash_withdrawal	20000.00	NGN	1.000000	\N	\N	ATM Withdrawal	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	0.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-21 16:41:48.214313	2025-09-21 16:41:48.214313	\N	\N	\N	f	\N
06b66c98-940f-4a90-beac-d395fd1a66ec	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757503445787_LA5F05	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	John Doe	1234567890	Bank Transfer	058	{"recipient_name": "John Doe", "recipient_bank_code": "058", "recipient_account_number": "1234567890"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	failed	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": "Transfer failed - insufficient funds at source account"}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": "Transfer failed - insufficient funds at source account"}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 07:24:05.715977	2025-09-10 07:24:05.715977	\N	\N	\N	f	\N
b93a98a4-69a1-4101-a3ec-6b5708e4e8d7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757503950563_3EDXP2	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	John Doe	1234567890	Bank Transfer	058	{"recipient_name": "John Doe", "recipient_bank_code": "058", "recipient_account_number": "1234567890"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	failed	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": "Transfer failed - insufficient funds at source account"}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": "Transfer failed - insufficient funds at source account"}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 07:32:30.491783	2025-09-10 07:32:30.491783	\N	\N	\N	f	\N
041836aa-b507-4e3f-9f69-95d0de06bb3e	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759256122511_DX4PI9	\N	\N	\N	money_transfer	35000.00	NGN	1.000000	\N	\N	Sending money to Jame Smith	\N	\N	Test Account 4321	0987654321	Bank Transfer	011	{"recipient_name": "Test Account 4321", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-09-30 14:15:22.429363	2025-09-30 14:15:22.429363	\N	\N	\N	f	\N
b0cb7042-9711-4330-a5cc-a433e9dd7edd	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759328849025_ITALKT	\N	\N	\N	money_transfer	100000.00	NGN	1.000000	\N	\N	Sending payment to Joanna Kerry	\N	\N	Jane Smith	0987654321	Bank Transfer	068	{"recipient_name": "Jane Smith", "recipient_bank_code": "068", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-01 10:27:28.932615	2025-10-01 10:27:28.932615	\N	\N	\N	f	\N
4451893f-304d-4bde-802a-f02efc129b50	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757553184975_ZDCNV6	TXN_1757553184982_3aeug7r5d	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Firstmidas money transfer	\N	\N	Jane Smith	0987654321	Bank Transfer	068	{"recipient_name": "Jane Smith", "recipient_bank_code": "068", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757553184982", "nibss_transaction_id": "TXN_1757553184982_3aeug7r5d", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757553184982_3aeug7r5d	{"session_id": "SES_1757553184982", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 21:13:04.886528	2025-09-10 21:13:04.886528	\N	\N	\N	f	\N
0dddd014-fd59-4230-822a-4fda3ab01231	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757556720103_1SB6QJ	TXN_1757556720108_ejq96dyel	\N	\N	money_transfer	30000.00	NGN	1.000000	\N	\N	FMFB transfer	\N	\N	Jane Smith	0987654321	Bank Transfer	044	{"recipient_name": "Jane Smith", "recipient_bank_code": "044", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757556720108", "nibss_transaction_id": "TXN_1757556720108_ejq96dyel", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757556720108_ejq96dyel	{"session_id": "SES_1757556720108", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 22:12:00.032497	2025-09-10 22:12:00.032497	\N	\N	\N	f	\N
99d1c3bd-08b0-4294-8cac-9a764179de22	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757789753406_COBCAW	\N	\N	\N	money_transfer	35000.00	NGN	1.000000	\N	\N	Money transfer from Demo User to Admin User	\N	\N	Admin User	0907934845	Bank Transfer	035	{"recipient_name": "Admin User", "recipient_bank_code": "035", "recipient_account_number": "0907934845"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 14:55:53.334299	2025-09-13 14:55:53.334299	\N	\N	\N	f	\N
aa189fca-c14c-4a12-ad0c-7fc7d3086d6f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757556877222_NA2ZUT	TXN_1757556877227_fcvxzc9fu	\N	\N	money_transfer	30000.00	NGN	1.000000	\N	\N	Firstmidas bank money transfer	\N	\N	Jane Smith	0987654321	Bank Transfer	044	{"recipient_name": "Jane Smith", "recipient_bank_code": "044", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757556877227", "nibss_transaction_id": "TXN_1757556877227_fcvxzc9fu", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757556877227_fcvxzc9fu	{"session_id": "SES_1757556877227", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 22:14:37.151032	2025-09-10 22:14:37.151032	\N	\N	\N	f	\N
e39d3c2d-9e61-4d80-be90-0dd1779b293a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757557115200_D9NA4P	TXN_1757557115205_ynhbbd5cu	\N	\N	money_transfer	40000.00	NGN	1.000000	\N	\N	fmfb transfer	\N	\N	Jane Smith	0987654321	Bank Transfer	044	{"recipient_name": "Jane Smith", "recipient_bank_code": "044", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757557115205", "nibss_transaction_id": "TXN_1757557115205_ynhbbd5cu", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757557115205_ynhbbd5cu	{"session_id": "SES_1757557115205", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-10 22:18:35.129415	2025-09-10 22:18:35.129415	\N	\N	\N	f	\N
e098266d-9e54-4159-8fb5-d1d90aca846d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757635647753_V7WGAF	TXN_1757635647758_tlk2ad75h	\N	\N	money_transfer	3000.00	NGN	1.000000	\N	\N	Firstmidas transfer	\N	\N	Bisi Adedokun	0987654321	Bank Transfer	033	{"recipient_name": "Bisi Adedokun", "recipient_bank_code": "033", "recipient_account_number": "0987654321"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757635647758", "nibss_transaction_id": "TXN_1757635647758_tlk2ad75h", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757635647758_tlk2ad75h	{"session_id": "SES_1757635647758", "nibss_response": null}	0.00	30.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 30.00}	\N	{}	mobile	\N	\N	pending	2025-09-11 20:07:27.682683	2025-09-11 20:07:27.682683	\N	\N	\N	f	\N
4995c80a-d1d5-424c-8617-7aa59437e372	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757636041205_FQ56V1	TXN_1757636041209_7vzfejmw7	\N	\N	money_transfer	4000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	Bisi Adedokun	0987654321	Bank Transfer	035	{"recipient_name": "Bisi Adedokun", "recipient_bank_code": "035", "recipient_account_number": "0987654321"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757636041209", "nibss_transaction_id": "TXN_1757636041209_7vzfejmw7", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757636041209_7vzfejmw7	{"session_id": "SES_1757636041209", "nibss_response": null}	0.00	40.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 40.00}	\N	{}	mobile	\N	\N	pending	2025-09-11 20:14:01.132893	2025-09-11 20:14:01.132893	\N	\N	\N	f	\N
0b27d9e0-0ae9-41e3-9cbb-70ad7cfb6b75	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757776756007_7NP5FF	TXN_1757776756012_9ejbc6qbf	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	Bisi Adedokun	0987654321	Bank Transfer	035	{"recipient_name": "Bisi Adedokun", "recipient_bank_code": "035", "recipient_account_number": "0987654321"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757776756012", "nibss_transaction_id": "TXN_1757776756012_9ejbc6qbf", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757776756012_9ejbc6qbf	{"session_id": "SES_1757776756012", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 11:19:15.935622	2025-09-13 11:19:15.935622	\N	\N	\N	f	\N
b3362be0-cbcc-4aa6-b525-e62412f39d26	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757776865493_N72MGE	TXN_1757776865499_ughoalxpy	\N	\N	money_transfer	100.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	Dotun Adedokun	0987654390	Bank Transfer	044	{"recipient_name": "Dotun Adedokun", "recipient_bank_code": "044", "recipient_account_number": "0987654390"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757776865499", "nibss_transaction_id": "TXN_1757776865499_ughoalxpy", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757776865499_ughoalxpy	{"session_id": "SES_1757776865499", "nibss_response": null}	0.00	1.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 1.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 11:21:05.421175	2025-09-13 11:21:05.421175	\N	\N	\N	f	\N
079678ca-3562-4250-8119-009a07001bca	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	06cd7648-a556-41b1-9ffa-a831ff75b982	ORP_1757777032531_E5E94S	TXN_1757777032537_o5ng9uenc	\N	\N	money_transfer	400000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	Dolapo Adedokun	0987634590	Bank Transfer	033	{"recipient_name": "Dolapo Adedokun", "recipient_bank_code": "033", "recipient_account_number": "0987634590"}	Demo User	0905916152	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0905916152"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757777032537", "nibss_transaction_id": "TXN_1757777032537_o5ng9uenc", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757777032537_o5ng9uenc	{"session_id": "SES_1757777032537", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 11:23:52.461151	2025-09-13 11:23:52.461151	\N	\N	\N	f	\N
a6a7403e-a69a-4d2d-8593-4db68521341f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757780631548_2XY9TZ	TXN_1757780631553_aaufpmay6	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Money transfer	\N	\N	Bisi Adedokun	0987890001	Bank Transfer	033	{"recipient_name": "Bisi Adedokun", "recipient_bank_code": "033", "recipient_account_number": "0987890001"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757780631553", "nibss_transaction_id": "TXN_1757780631553_aaufpmay6", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757780631553_aaufpmay6	{"session_id": "SES_1757780631553", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 12:23:51.478132	2025-09-13 12:23:51.478132	\N	\N	\N	f	\N
95b5005b-ae3c-424f-b3d5-9b50976be599	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1757785276497_5HT75A	TXN_1757785276503_o46y1fas3	\N	\N	money_transfer	75000.00	NGN	1.000000	\N	\N	Transfer from admin user to demo user	\N	\N	Demo User	0905916152	Bank Transfer	033	{"recipient_name": "Demo User", "recipient_bank_code": "033", "recipient_account_number": "0905916152"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1757785276503", "nibss_transaction_id": "TXN_1757785276503_o46y1fas3", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1757785276503_o46y1fas3	{"session_id": "SES_1757785276503", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-13 13:41:16.423041	2025-09-13 13:41:16.423041	\N	\N	\N	f	\N
ce650e4f-4c77-48bc-ba1e-ad15593c88c8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1758325285167_NJH4Q4	TXN_1758325285176_y89ot4xll	\N	\N	money_transfer	18000.00	NGN	1.000000	\N	\N	Sending money to Funmi Adedokun	\N	\N	Funmi Adedokun	0987654321	Bank Transfer	011	{"recipient_name": "Funmi Adedokun", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1758325285176", "nibss_transaction_id": "TXN_1758325285176_y89ot4xll", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1758325285176_y89ot4xll	{"session_id": "SES_1758325285176", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-19 19:41:25.091392	2025-09-19 19:41:25.091392	\N	\N	\N	f	\N
799203a8-446c-4711-995b-d782bbf81aa2	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1758534736895_H9BMOG	TXN_1758534736905_u54izujkx	\N	\N	money_transfer	20000.00	NGN	1.000000	\N	\N	Sending stipend money to Dolapo 	\N	\N	Dolapo Adedokun	0988976123	Bank Transfer	014	{"recipient_name": "Dolapo Adedokun", "recipient_bank_code": "014", "recipient_account_number": "0988976123"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1758534736905", "nibss_transaction_id": "TXN_1758534736905_u54izujkx", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1758534736905_u54izujkx	{"session_id": "SES_1758534736905", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-22 05:52:16.803519	2025-09-22 05:52:16.803519	\N	\N	\N	f	\N
d1388a45-5794-42a2-a0cb-5faf7e48c007	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1758535026839_WFVNR1	TXN_1758535026845_b8kvj81pl	\N	\N	money_transfer	24000.00	NGN	1.000000	\N	\N	School stipend money for October	\N	\N	Dotun Adedokun	5934201377	Bank Transfer	057	{"recipient_name": "Dotun Adedokun", "recipient_bank_code": "057", "recipient_account_number": "5934201377"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1758535026845", "nibss_transaction_id": "TXN_1758535026845_b8kvj81pl", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1758535026845_b8kvj81pl	{"session_id": "SES_1758535026845", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-22 05:57:06.733145	2025-09-22 05:57:06.733145	\N	\N	\N	f	\N
47d2c67b-e80d-41a9-b76e-22c4d435794c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1758634890807_RE8QXL	TXN_1758634890815_mp1qf6oid	\N	\N	money_transfer	40000.00	NGN	1.000000	\N	\N	Sending money to Randolph	\N	\N	Randolph Oghwe	0984345890	Bank Transfer	023	{"recipient_name": "Randolph Oghwe", "recipient_bank_code": "023", "recipient_account_number": "0984345890"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1758634890815", "nibss_transaction_id": "TXN_1758634890815_mp1qf6oid", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1758634890815_mp1qf6oid	{"session_id": "SES_1758634890815", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-23 09:41:30.734263	2025-09-23 09:41:30.734263	\N	\N	\N	f	\N
d85ce310-d2c7-41bd-86b5-6dba45a10ac8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1758635102237_K1UBCK	TXN_1758635102244_xbe8n4uyi	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Sending money to Shoeb for his wedding preparation	\N	\N	Shoeb Khan	0987654321	Bank Transfer	044	{"recipient_name": "Shoeb Khan", "recipient_bank_code": "044", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": "SES_1758635102244", "nibss_transaction_id": "TXN_1758635102244_xbe8n4uyi", "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	TXN_1758635102244_xbe8n4uyi	{"session_id": "SES_1758635102244", "nibss_response": null}	0.00	50.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 50.00}	\N	{}	mobile	\N	\N	pending	2025-09-23 09:45:02.163779	2025-09-23 09:45:02.163779	\N	\N	\N	f	\N
35b0dc60-e5f9-42eb-91d4-a34ce1d6dc14	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759254681597_MHYL75	\N	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Sending payment to Jane Smith	\N	\N	Jane Smith	0987654321	Bank Transfer	011	{"recipient_name": "Jane Smith", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-09-30 13:51:21.518894	2025-09-30 13:51:21.518894	\N	\N	\N	f	\N
79f78d51-7614-4593-a241-f199e711df95	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759325777426_OUBGTM	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Sending payment to Jane Smith	\N	\N	Jane Smith	0987654321	Bank Transfer	011	{"recipient_name": "Jane Smith", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "090", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-01 09:36:17.330483	2025-10-01 09:36:17.330483	\N	\N	\N	f	\N
5cbffd6f-f11a-4325-9b3a-fc4440099139	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759516085652_RO1LE4	\N	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Sending money to Sola	\N	\N	Test Account 4321	0987654321	Bank Transfer	513	{"recipient_name": "Test Account 4321", "recipient_bank_code": "513", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 14:28:05.573671	2025-10-03 14:28:05.573671	\N	\N	\N	f	\N
eb2def34-f90e-4706-805a-c43446f79ac0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759518413840_K3KELA	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Sending money to John 	\N	\N	John Doe	1234567890	Bank Transfer	044	{"recipient_name": "John Doe", "recipient_bank_code": "044", "recipient_account_number": "1234567890"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 15:06:53.747115	2025-10-03 15:06:53.747115	\N	\N	\N	f	\N
11053a83-55b1-45e2-afa1-3aa099828add	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759524395570_FV7751	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Money transfer to the MD	\N	\N	Test Account 4321	0987654321	Bank Transfer	513	{"recipient_name": "Test Account 4321", "recipient_bank_code": "513", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 16:46:35.492677	2025-10-03 16:46:35.492677	\N	\N	\N	f	\N
241fc208-3a54-4385-8b99-709f0fc04041	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	51301K6NXXHD3106F54C294	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Transfer to Lekan	\N	\N	Test Account 4321	0987654321	Bank Transfer	513	{"recipient_name": "Test Account 4321", "recipient_bank_code": "513", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 16:58:47.508725	2025-10-03 16:58:47.508725	\N	\N	\N	f	\N
384de228-bcc8-45a0-8a8c-aff0d9f1b557	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	51301K6NYHVRVM797A65A44	\N	\N	\N	money_transfer	15000.00	NGN	1.000000	\N	\N	Money transfer to Jane Smith	\N	\N	Jane Smith	0987654321	Bank Transfer	011	{"recipient_name": "Jane Smith", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 17:09:53.476568	2025-10-03 17:09:53.476568	\N	\N	\N	f	\N
2ec2fe4a-5007-4251-b3e3-0d4a23123747	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	51301K6NZ27JKCW204ECD76	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Transfer to Olaoluwa	\N	\N	Test Account 4321	0987654321	Bank Transfer	513	{"recipient_name": "Test Account 4321", "recipient_bank_code": "513", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 17:18:49.854378	2025-10-03 17:18:49.854378	\N	\N	\N	f	\N
b9e0446b-0807-4ff0-a7da-7088993a23b0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759542351570_IEVZL3	\N	\N	\N	money_transfer	5000.00	NGN	1.000000	\N	\N	FM01K6PE8ZREFP18C9C756	\N	\N	Jane Smith	0987654321	Bank Transfer	011	{"recipient_name": "Jane Smith", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-03 21:45:51.489261	2025-10-03 21:45:51.489261	\N	\N	\N	f	\N
7e9dd048-2d57-4178-869d-2f6b75c9f6d7	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759581471298_2F8H07	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	FM01K6QKKVV54N5EB27876	\N	\N	Jane Smith	0987654321	Bank Transfer	011	{"recipient_name": "Jane Smith", "recipient_bank_code": "011", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-04 08:37:51.206769	2025-10-04 08:37:51.206769	\N	\N	\N	f	\N
fd993e5a-35fa-4d63-bded-4f6167b32dd0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759583486642_SHCM0E	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	FM01K6QNHCKPYDCDC00608	\N	\N	Jane Smith	0987654321	Bank Transfer	044	{"recipient_name": "Jane Smith", "recipient_bank_code": "044", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "513", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-04 09:11:26.549703	2025-10-04 09:11:26.549703	\N	\N	\N	f	\N
e7863085-15fd-4851-8cf0-11f232777d17	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8ef06c9c-d933-43a7-be93-22bd04f4b36c	TXN1759622729450	\N	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Payment for services	\N	\N	Jane Recipient	8265785650	Bank Transfer	058	{"recipient_name": "Jane Recipient", "recipient_bank_code": "058", "recipient_account_number": "8265785650"}	John Sender	1234567890	OrokiiPay	{"source_bank_code": "058", "source_account_number": "1234567890"}	completed	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	100.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 100.00}	\N	{}	mobile	\N	\N	pending	2025-10-04 20:05:29.450264	2025-10-04 20:05:29.450264	\N	\N	\N	f	\N
1e6b8899-0fad-44b2-99d7-1e8f2d5d9629	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8ef06c9c-d933-43a7-be93-22bd04f4b36c	TXN1759622729455	\N	\N	\N	money_transfer	25000.00	NGN	1.000000	\N	\N	Bill payment	\N	\N	External Recipient	1234567890	Bank Transfer	033	{"recipient_name": "External Recipient", "recipient_bank_code": "033", "recipient_account_number": "1234567890"}	John Sender	1234567890	OrokiiPay	{"source_bank_code": "058", "source_account_number": "1234567890"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	100.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 100.00}	\N	{}	mobile	\N	\N	pending	2025-10-04 20:05:29.455969	2025-10-04 20:05:29.455969	\N	\N	\N	f	\N
26aaa936-a108-499f-bf91-7da924ad6d50	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8ef06c9c-d933-43a7-be93-22bd04f4b36c	TXN1759622729460	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Failed transaction test	\N	\N	Failed Recipient	0000000000	Bank Transfer	058	{"recipient_name": "Failed Recipient", "recipient_bank_code": "058", "recipient_account_number": "0000000000"}	John Sender	1234567890	OrokiiPay	{"source_bank_code": "058", "source_account_number": "1234567890"}	failed	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	100.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 100.00}	\N	{}	mobile	\N	\N	pending	2025-10-04 20:05:29.461265	2025-10-04 20:05:29.461265	\N	\N	\N	f	\N
65518dc5-e643-43a2-99c7-879a3009c9ed	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	ORP_1759934309589_3IAASE	\N	\N	\N	money_transfer	10000.00	NGN	1.000000	\N	\N	Money Transfer	\N	\N	Test Account 4321	0987654321	Bank Transfer	51333	{"recipient_name": "Test Account 4321", "recipient_bank_code": "51333", "recipient_account_number": "0987654321"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "51333", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-08 10:38:29.502053	2025-10-08 10:38:29.502053	\N	\N	\N	f	\N
ca57f7df-72d7-4626-bfe0-554483545be8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	5133301K72B1PAXHJ46DE6509	\N	\N	\N	money_transfer	5000.00	NGN	1.000000	\N	\N	Money to Jane Smith	\N	\N	Test Account 7890	1234567890	Bank Transfer	51333	{"recipient_name": "Test Account 7890", "recipient_bank_code": "51333", "recipient_account_number": "1234567890"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "51333", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-08 12:39:08.293445	2025-10-08 12:39:08.293445	\N	\N	\N	f	\N
d048f032-95f0-4bb4-9ae5-3f861d2da05f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	5133301K72BCWZATS9F892E72	\N	\N	\N	money_transfer	50000.00	NGN	1.000000	\N	\N	Money to John Smith	\N	\N	Test Account 6789	0123456789	Bank Transfer	023	{"recipient_name": "Test Account 6789", "recipient_bank_code": "023", "recipient_account_number": "0123456789"}	Admin User	0907934845	OrokiiPay	{"source_bank_code": "51333", "source_account_number": "0907934845"}	pending	\N	{"transfer_type": "money_transfer", "nibss_session_id": null, "nibss_transaction_id": null, "nibss_response_message": null}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	NIBSS	\N	\N	{"session_id": null, "nibss_response": null}	0.00	0.00	{"vat": 0, "stamp_duty": 0, "transfer_fee": 0.00}	\N	{}	mobile	\N	\N	pending	2025-10-08 12:45:15.532572	2025-10-08 12:45:15.532572	\N	\N	\N	f	\N
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transfers (id, sender_id, tenant_id, recipient_id, reference, amount, fee, description, source_account_number, source_bank_code, recipient_account_number, recipient_bank_code, recipient_name, nibss_transaction_id, nibss_session_id, nibss_response_message, status, failure_reason, processed_at, metadata, created_at, updated_at, recipient_user_id) FROM stdin;
1e36fcfd-f911-46e4-bd37-ea7652e888c5	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503307782_VMRDC3	10000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 07:21:47.707897	2025-09-10 07:21:47.707897	\N
87212585-f428-49f7-9568-3a4283a68ee8	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503445678_6UZW3O	10000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 07:24:05.604713	2025-09-10 07:24:05.604713	\N
eb70d81c-6989-4c2c-95a4-1a88b5b14e52	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503445787_LA5F05	10000.00	0.00	Money transfer	0905916152	090	1234567890	058	John Doe	\N	\N	Transfer failed - insufficient funds at source account	failed	\N	\N	{}	2025-09-10 07:24:05.715977	2025-09-10 07:24:05.715977	\N
377c12e9-727f-4c0a-9f83-f7b0ff7030b9	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503445871_L2CEMT	1000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 07:24:05.799668	2025-09-10 07:24:05.799668	\N
87200c9e-48a7-4553-ab8f-a05435dfa8c4	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503950320_ARVMMR	10000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 07:32:30.246659	2025-09-10 07:32:30.246659	\N
957f4107-6d26-4c47-9c41-38c433ada144	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503950563_3EDXP2	10000.00	0.00	Money transfer	0905916152	090	1234567890	058	John Doe	\N	\N	Transfer failed - insufficient funds at source account	failed	\N	\N	{}	2025-09-10 07:32:30.491783	2025-09-10 07:32:30.491783	\N
680302cc-8fa1-4ee0-9c68-13f05a9bb18b	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757503950647_WKO3NW	1000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 07:32:30.575603	2025-09-10 07:32:30.575603	\N
01e3bc75-dce4-46d8-8435-f70e8b44c216	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757513134954_JJAQTJ	10000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 10:05:34.879716	2025-09-10 10:05:34.879716	\N
2f2864e5-1edc-42e1-80cd-62d605bdc4c7	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757513135311_TRQREA	1000.00	50.00	Test transfer	0905916152	090	1234567890	058	John Doe	NIBSS_TXN_123	SESSION_123	\N	successful	\N	\N	{}	2025-09-10 10:05:35.238771	2025-09-10 10:05:35.238771	\N
723d3989-138b-4b4b-8bc0-cd475fe96b28	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757553184975_ZDCNV6	50000.00	50.00	Firstmidas money transfer	0907934845	090	0987654321	068	Jane Smith	TXN_1757553184982_3aeug7r5d	SES_1757553184982	\N	successful	\N	\N	{}	2025-09-10 21:13:04.886528	2025-09-10 21:13:04.886528	\N
09431df0-649f-4da1-8c09-f510ac768634	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757556720103_1SB6QJ	30000.00	50.00	FMFB transfer	0907934845	090	0987654321	044	Jane Smith	TXN_1757556720108_ejq96dyel	SES_1757556720108	\N	successful	\N	\N	{}	2025-09-10 22:12:00.032497	2025-09-10 22:12:00.032497	\N
b6e4d4d2-be6c-4746-b27f-3230de0acc85	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757556877222_NA2ZUT	30000.00	50.00	Firstmidas bank money transfer	0907934845	090	0987654321	044	Jane Smith	TXN_1757556877227_fcvxzc9fu	SES_1757556877227	\N	successful	\N	\N	{}	2025-09-10 22:14:37.151032	2025-09-10 22:14:37.151032	\N
69670489-d184-496a-abe9-0af0f031f84b	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757557115200_D9NA4P	40000.00	50.00	fmfb transfer	0907934845	090	0987654321	044	Jane Smith	TXN_1757557115205_ynhbbd5cu	SES_1757557115205	\N	successful	\N	\N	{}	2025-09-10 22:18:35.129415	2025-09-10 22:18:35.129415	\N
a92cdbf9-cc6d-4f42-b993-a408b8fd00c0	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757635647753_V7WGAF	3000.00	30.00	Firstmidas transfer	0905916152	090	0987654321	033	Bisi Adedokun	TXN_1757635647758_tlk2ad75h	SES_1757635647758	\N	successful	\N	\N	{}	2025-09-11 20:07:27.682683	2025-09-11 20:07:27.682683	\N
7c895faf-9eb1-4e90-8659-36e8575a03c0	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757636041205_FQ56V1	4000.00	40.00	Money transfer	0905916152	090	0987654321	035	Bisi Adedokun	TXN_1757636041209_7vzfejmw7	SES_1757636041209	\N	successful	\N	\N	{}	2025-09-11 20:14:01.132893	2025-09-11 20:14:01.132893	\N
833d4963-c670-4447-845b-b678ab146cd8	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757776756007_7NP5FF	50000.00	50.00	Money transfer	0905916152	090	0987654321	035	Bisi Adedokun	TXN_1757776756012_9ejbc6qbf	SES_1757776756012	\N	successful	\N	\N	{}	2025-09-13 11:19:15.935622	2025-09-13 11:19:15.935622	\N
f5c69ec4-1626-4a9a-a227-0c911ed1d2db	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757776865493_N72MGE	100.00	1.00	Money transfer	0905916152	090	0987654390	044	Dotun Adedokun	TXN_1757776865499_ughoalxpy	SES_1757776865499	\N	successful	\N	\N	{}	2025-09-13 11:21:05.421175	2025-09-13 11:21:05.421175	\N
2400f89d-6896-4ba2-ab97-e4049e383b51	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757777032531_E5E94S	400000.00	50.00	Money transfer	0905916152	090	0987634590	033	Dolapo Adedokun	TXN_1757777032537_o5ng9uenc	SES_1757777032537	\N	successful	\N	\N	{}	2025-09-13 11:23:52.461151	2025-09-13 11:23:52.461151	\N
d748435b-62ae-4a7e-9185-2c0b4e54e4d8	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757780631548_2XY9TZ	50000.00	50.00	Money transfer	0907934845	090	0987890001	033	Bisi Adedokun	TXN_1757780631553_aaufpmay6	SES_1757780631553	\N	successful	\N	\N	{}	2025-09-13 12:23:51.478132	2025-09-13 12:23:51.478132	\N
4a2ac4a4-3e90-45cb-9ae0-03db5a20326c	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757785276497_5HT75A	75000.00	50.00	Transfer from admin user to demo user	0907934845	090	0905916152	033	Demo User	TXN_1757785276503_o46y1fas3	SES_1757785276503	\N	successful	\N	\N	{}	2025-09-13 13:41:16.423041	2025-09-13 13:51:04.8156	06cd7648-a556-41b1-9ffa-a831ff75b982
c750c56a-01ab-4fd1-8d83-eec4cc193a4f	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1757789753406_COBCAW	35000.00	0.00	Money transfer from Demo User to Admin User	0905916152	090	0907934845	035	Admin User	\N	\N	\N	successful	\N	\N	{}	2025-09-13 14:55:53.334299	2025-09-13 14:55:53.334299	19769e1e-b7c7-437a-b0c4-c242d82e8e3f
0886dbc5-d826-47a0-8b74-9c7696cea308	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758317474148_AOPL7D	20000.00	50.00	Testing the AI-powered money transfered	0907934845	090	0987654321	011	Dotun Adedokun	TXN_1758317474161_m3lnu2lon	SES_1758317474162	\N	successful	\N	\N	{}	2025-09-19 17:31:14.069643	2025-09-19 17:31:14.069643	\N
3bafc00e-17bb-4f22-a852-ddc7ec13e893	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758325285167_NJH4Q4	18000.00	50.00	Sending money to Funmi Adedokun	0907934845	090	0987654321	011	Funmi Adedokun	TXN_1758325285176_y89ot4xll	SES_1758325285176	\N	successful	\N	\N	{}	2025-09-19 19:41:25.091392	2025-09-19 19:41:25.091392	\N
a1d84951-c6d5-4b75-b2ba-8598284b9280	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758534736895_H9BMOG	20000.00	50.00	Sending stipend money to Dolapo 	0907934845	090	0988976123	014	Dolapo Adedokun	TXN_1758534736905_u54izujkx	SES_1758534736905	\N	successful	\N	\N	{}	2025-09-22 05:52:16.803519	2025-09-22 05:52:16.803519	\N
ac0cb9a0-18ec-4dc8-9396-e8b854ef8abf	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758535026839_WFVNR1	24000.00	50.00	School stipend money for October	0907934845	090	5934201377	057	Dotun Adedokun	TXN_1758535026845_b8kvj81pl	SES_1758535026845	\N	successful	\N	\N	{}	2025-09-22 05:57:06.733145	2025-09-22 05:57:06.733145	\N
047f8cba-fe71-4174-b297-9e6219979628	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758634890807_RE8QXL	40000.00	50.00	Sending money to Randolph	0907934845	090	0984345890	023	Randolph Oghwe	TXN_1758634890815_mp1qf6oid	SES_1758634890815	\N	successful	\N	\N	{}	2025-09-23 09:41:30.734263	2025-09-23 09:41:30.734263	\N
1b19694e-31af-4159-8843-1b38952ea842	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1758635102237_K1UBCK	50000.00	50.00	Sending money to Shoeb for his wedding preparation	0907934845	090	0987654321	044	Shoeb Khan	TXN_1758635102244_xbe8n4uyi	SES_1758635102244	\N	successful	\N	\N	{}	2025-09-23 09:45:02.163779	2025-09-23 09:45:02.163779	\N
2e29e567-a725-423f-a64d-8ae392b211fc	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759254681597_MHYL75	50000.00	50.00	Sending payment to Jane Smith	0907934845	090	0987654321	011	Jane Smith	TXN_1759254681609_xjiakmwqs	SES_1759254681609	\N	successful	\N	\N	{}	2025-09-30 13:51:21.518894	2025-09-30 13:51:21.518894	\N
993becb4-8d78-4a05-bb94-fab41d0a892a	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759325777426_OUBGTM	10000.00	50.00	Sending payment to Jane Smith	0907934845	090	0987654321	011	Jane Smith	TXN_1759325777441_ye1974fzs	SES_1759325777441	\N	successful	\N	\N	{}	2025-10-01 09:36:17.330483	2025-10-01 09:36:17.330483	\N
62f6ed79-f77e-4150-a08e-039c37974884	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759328849025_ITALKT	100000.00	50.00	Sending payment to Joanna Kerry	0907934845	090	0987654321	068	Jane Smith	TXN_1759328849033_ke8zmmif7	SES_1759328849033	\N	successful	\N	\N	{}	2025-10-01 10:27:28.932615	2025-10-01 10:27:28.932615	\N
a5a94fc3-3f24-4500-84c4-0de43a49c124	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759518413840_K3KELA	10000.00	50.00	Sending money to John 	0907934845	513	1234567890	044	John Doe	TXN_1759518413847_ssobso29q	SES_1759518413847	\N	successful	\N	\N	{}	2025-10-03 15:06:53.747115	2025-10-03 15:06:53.747115	\N
e8134d82-6d66-419a-a243-3cca948d14a8	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	51301K6NYHVRVM797A65A44	15000.00	50.00	Money transfer to Jane Smith	0907934845	513	0987654321	011	Jane Smith	TXN_1759525793570_9wc9tm0ka	SES_1759525793570	\N	successful	\N	\N	{}	2025-10-03 17:09:53.476568	2025-10-03 17:09:53.476568	\N
a3c354a6-4c4d-4d64-8856-e2d35d124484	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759542351570_IEVZL3	5000.00	50.00	FM01K6PE8ZREFP18C9C756	0907934845	513	0987654321	011	Jane Smith	TXN_1759542351580_jrb7jqi0y	SES_1759542351580	\N	successful	\N	\N	{}	2025-10-03 21:45:51.489261	2025-10-03 21:45:51.489261	\N
e7fdffcf-ab7d-4b84-9f93-138a086ce639	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759581471298_2F8H07	10000.00	50.00	FM01K6QKKVV54N5EB27876	0907934845	513	0987654321	011	Jane Smith	TXN_1759581471310_qops64bl2	SES_1759581471310	\N	successful	\N	\N	{}	2025-10-04 08:37:51.206769	2025-10-04 08:37:51.206769	\N
97fcc228-35ef-4bd8-be79-711db65b7f49	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759583486642_SHCM0E	10000.00	50.00	FM01K6QNHCKPYDCDC00608	0907934845	513	0987654321	044	Jane Smith	TXN_1759583486650_rpmtqpakl	SES_1759583486650	\N	successful	\N	\N	{}	2025-10-04 09:11:26.549703	2025-10-04 09:11:26.549703	\N
7ee44ac1-a2f4-43a0-b911-068b090a8389	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	TXN1759622729450	50000.00	100.00	Payment for services	1234567890	058	8265785650	058	Jane Recipient	\N	\N	\N	successful	\N	\N	{}	2025-10-04 20:05:29.450264	2025-10-04 20:05:29.450264	\N
9860360a-4f89-4675-815b-9615890c6820	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	TXN1759622729455	25000.00	100.00	Bill payment	1234567890	058	1234567890	033	External Recipient	\N	\N	\N	pending	\N	\N	{}	2025-10-04 20:05:29.455969	2025-10-04 20:05:29.455969	\N
c7af0d71-1ab8-4ad3-9def-bbd747d11499	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	TXN1759622729460	10000.00	100.00	Failed transaction test	1234567890	058	0000000000	058	Failed Recipient	\N	\N	\N	failed	\N	\N	{}	2025-10-04 20:05:29.461265	2025-10-04 20:05:29.461265	\N
3c0869a1-d5fd-4dad-a431-54c99f1ec73f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	ORP_1759934309589_3IAASE	10000.00	50.00	Money Transfer	0907934845	51333	0987654321	51333	Test Account 4321	TXN_1759934309616_p53izcqfj	SES_1759934309616	\N	successful	\N	\N	{}	2025-10-08 10:38:29.502053	2025-10-08 10:38:29.502053	\N
a1b93c50-cf99-414e-ba9b-63a0df599af6	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	5133301K72B1PAXHJ46DE6509	5000.00	50.00	Money to Jane Smith	0907934845	51333	1234567890	51333	Test Account 7890	TXN_1759941548402_8q8ywn4r8	SES_1759941548402	\N	successful	\N	\N	{}	2025-10-08 12:39:08.293445	2025-10-08 12:39:08.293445	\N
4e729de3-0a8f-46d3-b8ed-df733bd725a5	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	\N	5133301K72BCWZATS9F892E72	50000.00	50.00	Money to John Smith	0907934845	51333	0123456789	023	Test Account 6789	TXN_1759941915652_1fefyu7ev	SES_1759941915652	\N	successful	\N	\N	{}	2025-10-08 12:45:15.532572	2025-10-08 12:45:15.532572	\N
\.


--
-- Data for Name: user_activity_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.user_activity_logs (id, user_id, activity_type, description, ip_address, user_agent, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.user_sessions (id, user_id, session_token, refresh_token, device_info, ip_address, user_agent, geolocation, expires_at, created_at, last_activity_at, is_suspicious, risk_score, ai_risk_assessment) FROM stdin;
e760c202-372f-4cbd-b81b-9d78f252ed6d	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	f1017c2a-1c1f-46bc-ad95-ecd57617c061	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjUzYzhlMDdhLWY3MzYtNGNiYS1hNmEyLTg4YjcwYTA0ZDk2NCIsImlhdCI6MTc1OTg4MzYwNCwiZXhwIjoxNzYwNDg4NDA0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.-CNEB2zXyhHXzMnFQIo2JDTigFGvNCEMGx5HzNXQmCY	{"platform": "web", "timestamp": "2025-10-08T00:33:23.909Z", "userAgent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36", "rememberMe": false, "screenSize": "412x915"}	::1	Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	\N	2025-10-14 20:33:24.05	2025-10-07 20:33:24.040423	2025-10-07 20:33:24.040423	f	0.00	{}
8fa5daea-653d-4da4-af6b-ec27d966c34f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	8f7a6be2-9064-4e36-8085-e6b79cb83877	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjE3YzI5NGRlLTgyZTktNDVhOS04Y2QxLTlmNTQzNzMzMDljYyIsImlhdCI6MTc1OTg4Njc1OCwiZXhwIjoxNzYwNDkxNTU4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.olRJyUZv6ocqACKazR4rMv1brvoOxazC9WJAJNaeRQg	{"platform": "web", "timestamp": "2025-10-08T01:25:58.614Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-14 21:25:58.739	2025-10-07 21:25:58.728906	2025-10-07 21:25:58.728906	f	0.00	{}
f9bfa09e-e6b2-430f-8044-c1b90d3efe0e	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	e0eeca05-64c6-4a37-b085-b480a8bc1e57	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjdmNjMzMmMxLTQwODEtNDE0Mi04OGM4LTIxNTE3ZTIzZTY4NyIsImlhdCI6MTc1OTg5MDQwMiwiZXhwIjoxNzYwNDk1MjAyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.JEkwbq3cfUFgiiNDCoW_j86z_oxN3cUqMisumYeUwA8	{"platform": "web", "timestamp": "2025-10-08T02:26:42.016Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-14 22:26:42.131	2025-10-07 22:26:42.120944	2025-10-07 22:26:42.120944	f	0.00	{}
23dc3f78-beae-4e25-9dfd-5139c5b18cdf	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	80d20743-ff11-4403-b387-e49e26ace929	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjM5YmY4ZTgwLTM1YzMtNGYwYi1hZGViLTNkYWFmZjQyNTNhMyIsImlhdCI6MTc1OTg5MTI4NSwiZXhwIjoxNzYwNDk2MDg1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.ZauH43uVf_SJPhr7lNcl9aceCIOXWHuzB9C3nfibln0	{"platform": "web", "timestamp": "2025-10-08T02:41:25.375Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-14 22:41:25.494	2025-10-07 22:41:25.484924	2025-10-07 22:41:25.484924	f	0.00	{}
303df2cb-60c4-4c5e-b190-38bcabcb7228	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	3d7cf089-7762-4625-934f-3dbb39bacb66	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjZjMzczNjdjLTFjNzYtNGJmMi04ZDEwLWQ1OTQ2NzY4MzMxZiIsImlhdCI6MTc1OTg5MjQ3MSwiZXhwIjoxNzYwNDk3MjcxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.dVin8YOyeMbBkRyv0lkx5Wj-SB8_QdseDgTSpIvvY38	{"platform": "web", "timestamp": "2025-10-08T03:01:11.280Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-14 23:01:11.393	2025-10-07 23:01:11.381962	2025-10-07 23:01:11.381962	f	0.00	{}
df6daa31-ed97-4e3b-952a-3de535548b55	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	154f339c-78e6-4731-996b-a7054f5a14e3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjRjYmM2NGZkLWYxOGMtNGEwMS1iMGYwLTk0OWUzYzQzNDkxNSIsImlhdCI6MTc1OTg5NDA2MSwiZXhwIjoxNzYwNDk4ODYxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.g84qeZxC7yAWji7cR9oPzCHIGbgLd8K7MODDKeirb8M	{"platform": "web", "timestamp": "2025-10-08T03:27:41.629Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-14 23:27:41.805	2025-10-07 23:27:41.769698	2025-10-07 23:27:41.769698	f	0.00	{}
2e53942c-487b-44d6-a7b3-23bc7896c1ca	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	b65f0cf6-7c17-4f8a-a8d7-cd1e351309dc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjljNDJiM2ZjLWQxYjEtNDVhOC1hYjAzLWM1NTkxMWZkZmVkNSIsImlhdCI6MTc1OTkyMTUzMywiZXhwIjoxNzYwNTI2MzMzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.GfecuftIdZGiELDuR1zN-lihAH07cRpJJk1IXGGnfFQ	{"platform": "web", "timestamp": "2025-10-08T11:05:33.235Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2183x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-15 07:05:33.416	2025-10-08 07:05:33.376484	2025-10-08 07:05:33.376484	f	0.00	{}
a411f82c-4151-4d6b-93d2-003dee403d89	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	cc48c9b0-8553-4148-883a-56a5156e26cf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjE0Njg3OGQ2LTVjYTctNDdlZi1iNzBhLTNiZjMyYjNlZGI5OCIsImlhdCI6MTc1OTk0MTQ5OCwiZXhwIjoxNzYwNTQ2Mjk4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.qgOznuIaHjqt70JR1GBMWpOiKQAWoATLyw01TW7zDGI	{"platform": "web", "timestamp": "2025-10-08T16:38:18.097Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1835x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-15 12:38:18.229	2025-10-08 12:38:18.202057	2025-10-08 12:38:18.202057	f	0.00	{}
091f253a-9dee-4615-bfbd-f86b905478e8	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	58d6b1ed-089e-424f-baaf-42981aa88e76	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsInNlc3Npb25JZCI6IjZiNDljYmZhLWE1YWUtNDdhMS1hZjFkLTEyNzQ1NzVjOGZjMyIsImlhdCI6MTc1OTk0MjE5NiwiZXhwIjoxNzYwNTQ2OTk2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.S6hDIYaA5K3z82ppdevuzjoNS15AXLl0DyhdImFxRck	{"platform": "web", "timestamp": "2025-10-08T16:49:56.205Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1835x1046"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	\N	2025-10-15 12:49:56.31	2025-10-08 12:49:56.307721	2025-10-08 12:49:56.307721	f	0.00	{}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.users (id, tenant_id, email, phone_number, password_hash, first_name, last_name, middle_name, role, status, permissions, bvn, nin, ai_preferences, behavioral_profile, risk_profile, failed_login_attempts, last_login_at, last_login_ip, password_changed_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_methods, biometric_enabled, biometric_templates, profile_data, notification_preferences, last_known_location, registered_devices, kyc_status, kyc_level, kyc_documents, kyc_completed_at, created_at, updated_at, created_by, account_number, transaction_pin_hash, daily_limit, monthly_limit, date_of_birth, gender, is_active, profile_image_url, profile_address, referral_code) FROM stdin;
06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	demo@fmfb.com	+2348012345678	$2b$12$OHjR7gKWNdAC7nSwCgy5LOkNObs9wkKzrjWz4WeSz/Y5YH2p7pQZe	Demo	User	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	2025-09-27 21:04:38.266435	::1	2025-09-18 20:44:52.281632	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 19:44:07.49548	2025-10-04 20:05:29.417249	\N	0905916152	$2b$10$ObNIvh1HxQ3ryvKCzgQJDe1CFBbO7/9LM71AkrrSxCQKhQwLcpUee	100000.00	500000.00	\N	\N	t	\N	\N	\N
35abd4fa-6d73-4476-bc16-f397754c1b81	92b9a514-e318-46ba-bb6d-bbc5e1e0854c	admin@usbank.com	+15550100	$2b$10$rHg4YJhQ0Mz.4VQmD9fF6OZKXPyE.jHVGcq6KmC8eJ7G8zN4L5C6K	John	Administrator	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-09-30 22:22:17.447177	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	completed	3	{}	\N	2025-09-30 22:22:17.447177	2025-09-30 22:22:17.447177	\N	\N	\N	100000.00	500000.00	\N	\N	t	\N	\N	\N
b9c517e7-45e0-42f9-9cd4-afc27dd518b4	2c234c5e-c321-4ed4-83d0-b5602ea50c07	admin@cabank.com	+14165550100	$2b$10$rHg4YJhQ0Mz.4VQmD9fF6OZKXPyE.jHVGcq6KmC8eJ7G8zN4L5C6K	Sarah	Administrator	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-09-30 22:22:17.447177	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	completed	3	{}	\N	2025-09-30 22:22:17.447177	2025-09-30 22:22:17.447177	\N	\N	\N	100000.00	500000.00	\N	\N	t	\N	\N	\N
f048438d-7ef7-4031-b492-5c96c1474a36	004c5e50-eb32-4c7d-a375-e8ff65f225c1	admin@eubank.com	+493055501 00	$2b$10$rHg4YJhQ0Mz.4VQmD9fF6OZKXPyE.jHVGcq6KmC8eJ7G8zN4L5C6K	Hans	Administrator	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-09-30 22:22:17.447177	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	completed	3	{}	\N	2025-09-30 22:22:17.447177	2025-09-30 22:22:17.447177	\N	\N	\N	100000.00	500000.00	\N	\N	t	\N	\N	\N
8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	sender-1759622729419-6yike@test.com	+2348122729419	$2b$10$example.hashed.password	John	Sender	\N	agent	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-10-04 20:05:29.420417	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-10-04 20:05:29.420417	2025-10-04 20:05:29.420417	\N	5132680566	$2b$10$example.hashed.pin	100000.00	500000.00	\N	\N	t	\N	\N	\N
05510310-7fe4-4b97-8e88-3b0bde13d13c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	recipient-1759622729419-6yike@test.com	+2348982729419	$2b$10$example.hashed.password	Jane	Recipient	\N	agent	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-10-04 20:05:29.442245	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-10-04 20:05:29.442245	2025-10-04 20:05:29.442245	\N	5134698326	$2b$10$example.hashed.pin	100000.00	500000.00	\N	\N	t	\N	\N	\N
19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	admin@fmfb.com	+2348012345679	$2b$10$GLd/dwsly0BgumpMRG6QyOt0dKmkFXlPfYVaH57wgPiXExnLiwW/K	Admin	User	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	2025-10-08 12:49:56.307721	::1	2025-09-04 19:44:07.49548	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 19:44:07.49548	2025-10-08 12:49:56.307721	\N	0907934845	$2b$10$ObNIvh1HxQ3ryvKCzgQJDe1CFBbO7/9LM71AkrrSxCQKhQwLcpUee	100000.00	500000.00	\N	\N	t	\N	\N	\N
\.


--
-- Data for Name: wallet_fundings; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallet_fundings (id, user_id, wallet_id, reference, amount, funding_method, description, status, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallet_transactions (id, wallet_id, transaction_id, transaction_type, amount, balance_before, balance_after, description, category, subcategory, reference, external_reference, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallets (id, user_id, tenant_id, wallet_number, wallet_type, wallet_name, balance, available_balance, reserved_balance, pending_balance, currency, foreign_balances, daily_limit, monthly_limit, single_transaction_limit, minimum_balance, ai_insights, predicted_balance, balance_prediction_date, spending_categories, financial_health_score, spending_behavior, interest_rate, reward_points, cashback_earned, is_active, is_frozen, freeze_reason, security_level, account_category, regulatory_status, last_kyc_update, created_at, updated_at, activated_at, last_transaction_at, status, is_primary) FROM stdin;
daa9b1f7-4897-4b2d-be48-4e2f6bc811df	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20250900000226	main	demo Main Wallet	1000000.00	1000000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-10 20:28:52.30177	2025-10-04 20:05:29.419226	\N	\N	active	f
9332108e-750a-4ded-bfca-52cd9e1fea2b	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMF20250900000001	primary	demo Main Wallet	1000000.00	1000000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 19:44:07.505231	2025-10-04 20:05:29.419226	\N	\N	active	t
53f4f050-247f-4109-829f-17dadf899fd8	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20251000000517	primary	Primary Account	0.00	0.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.420417	2025-10-04 20:05:29.420417	\N	\N	active	t
ed48e70f-85f5-49c5-8b08-c031d8a701df	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20251000000518	main	\N	1000000.00	1000000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.439599	2025-10-04 20:05:29.439599	\N	\N	active	f
ad97a003-ab8e-4868-ab0b-37c213f2c7e7	05510310-7fe4-4b97-8e88-3b0bde13d13c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20251000000519	primary	Primary Account	0.00	0.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.442245	2025-10-04 20:05:29.442245	\N	\N	active	t
492a85f2-5746-4df3-88ce-637aaff9ce37	05510310-7fe4-4b97-8e88-3b0bde13d13c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20251000000520	main	\N	1000000.00	1000000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.444313	2025-10-04 20:05:29.444313	\N	\N	active	f
4fe14197-d013-4e2e-93a6-b6abe24b9b4e	8ef06c9c-d933-43a7-be93-22bd04f4b36c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	9372103793	savings	\N	2000000.00	2000000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.445805	2025-10-04 20:05:29.445805	\N	\N	active	f
45bcbbe6-1fcb-4f52-b2a8-d88a57089e7d	05510310-7fe4-4b97-8e88-3b0bde13d13c	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	8265785650	savings	\N	100000.00	100000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-10-04 20:05:29.447434	2025-10-04 20:05:29.447434	\N	\N	active	f
7c572bcd-2037-4bcd-9707-82724dac18a7	35abd4fa-6d73-4476-bc16-f397754c1b81	92b9a514-e318-46ba-bb6d-bbc5e1e0854c	MIG20250900000498	primary	Primary Account	50000.00	50000.00	0.00	0.00	USD	{}	10000.00	100000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-30 22:22:17.447177	2025-09-30 22:23:02.852319	\N	\N	active	t
01766978-469c-4f70-abc0-f7156a93c440	b9c517e7-45e0-42f9-9cd4-afc27dd518b4	2c234c5e-c321-4ed4-83d0-b5602ea50c07	MIG20250900000499	primary	Primary Account	65000.00	65000.00	0.00	0.00	CAD	{}	12000.00	120000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-30 22:22:17.447177	2025-09-30 22:23:02.852319	\N	\N	active	t
31514430-4331-415a-8cc7-883838a43de2	f048438d-7ef7-4031-b492-5c96c1474a36	004c5e50-eb32-4c7d-a375-e8ff65f225c1	MIG20250900000500	primary	Primary Account	45000.00	45000.00	0.00	0.00	EUR	{}	9000.00	90000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-30 22:22:17.447177	2025-09-30 22:23:02.852319	\N	\N	active	t
df6759b9-079c-45c2-9a26-208f5fc8fbfb	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMF20250900000002	primary	admin Main Wallet	4935000.00	4935000.00	0.00	0.00	NGN	{}	1000000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 19:44:07.509087	2025-10-08 12:45:15.532572	\N	\N	active	t
\.


--
-- Name: ai_intent_templates_id_seq; Type: SEQUENCE SET; Schema: platform; Owner: bisiadedokun
--

SELECT pg_catalog.setval('platform.ai_intent_templates_id_seq', 7, true);


--
-- Name: ai_models_id_seq; Type: SEQUENCE SET; Schema: platform; Owner: bisiadedokun
--

SELECT pg_catalog.setval('platform.ai_models_id_seq', 3, true);


--
-- Name: ngn_bank_codes_id_seq; Type: SEQUENCE SET; Schema: platform; Owner: bisiadedokun
--

SELECT pg_catalog.setval('platform.ngn_bank_codes_id_seq', 471, true);


--
-- Name: ai_analytics_insights_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_analytics_insights_id_seq', 1, false);


--
-- Name: ai_configuration_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_configuration_id_seq', 1, true);


--
-- Name: ai_context_mappings_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_context_mappings_id_seq', 1, false);


--
-- Name: ai_conversation_logs_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_conversation_logs_id_seq', 1, false);


--
-- Name: ai_intent_categories_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_intent_categories_id_seq', 7, true);


--
-- Name: ai_intent_patterns_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_intent_patterns_id_seq', 24, true);


--
-- Name: ai_learning_feedback_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_learning_feedback_id_seq', 1, false);


--
-- Name: ai_response_templates_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_response_templates_id_seq', 3, true);


--
-- Name: ai_smart_suggestions_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_smart_suggestions_id_seq', 44, true);


--
-- Name: ai_translation_patterns_id_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.ai_translation_patterns_id_seq', 3, true);


--
-- Name: transaction_ref_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.transaction_ref_seq', 1, false);


--
-- Name: wallet_number_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.wallet_number_seq', 520, true);


--
-- Name: ai_conversation_analytics ai_conversation_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_pkey PRIMARY KEY (id);


--
-- Name: ai_fraud_analytics ai_fraud_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_pkey PRIMARY KEY (id);


--
-- Name: cbn_compliance_reports cbn_compliance_reports_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_compliance_reports
    ADD CONSTRAINT cbn_compliance_reports_pkey PRIMARY KEY (report_id);


--
-- Name: cbn_incidents cbn_incidents_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_pkey PRIMARY KEY (incident_id);


--
-- Name: cbn_security_audits cbn_security_audits_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_security_audits
    ADD CONSTRAINT cbn_security_audits_pkey PRIMARY KEY (audit_id);


--
-- Name: data_localization_checks data_localization_checks_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.data_localization_checks
    ADD CONSTRAINT data_localization_checks_pkey PRIMARY KEY (check_id);


--
-- Name: network_segmentation network_segmentation_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.network_segmentation
    ADD CONSTRAINT network_segmentation_pkey PRIMARY KEY (segmentation_id);


--
-- Name: pci_dss_compliance pci_dss_compliance_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_compliance
    ADD CONSTRAINT pci_dss_compliance_pkey PRIMARY KEY (compliance_id);


--
-- Name: pci_dss_findings pci_dss_findings_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_pkey PRIMARY KEY (finding_id);


--
-- Name: pci_dss_requirements pci_dss_requirements_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_pkey PRIMARY KEY (requirement_id);


--
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: siem_events siem_events_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.siem_events
    ADD CONSTRAINT siem_events_pkey PRIMARY KEY (event_id);


--
-- Name: siem_rules siem_rules_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.siem_rules
    ADD CONSTRAINT siem_rules_pkey PRIMARY KEY (rule_id);


--
-- Name: tenant_audit_logs tenant_audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: threat_intelligence threat_intelligence_pkey; Type: CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.threat_intelligence
    ADD CONSTRAINT threat_intelligence_pkey PRIMARY KEY (indicator_id);


--
-- Name: ai_intent_templates ai_intent_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_intent_templates
    ADD CONSTRAINT ai_intent_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: bill_provider_templates bill_provider_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.bill_provider_templates
    ADD CONSTRAINT bill_provider_templates_pkey PRIMARY KEY (id);


--
-- Name: bill_provider_templates bill_provider_templates_provider_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.bill_provider_templates
    ADD CONSTRAINT bill_provider_templates_provider_code_key UNIQUE (provider_code);


--
-- Name: currency_config currency_config_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.currency_config
    ADD CONSTRAINT currency_config_pkey PRIMARY KEY (code);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


--
-- Name: ngn_bank_codes ngn_bank_codes_bank_code_3_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes
    ADD CONSTRAINT ngn_bank_codes_bank_code_3_key UNIQUE (bank_code_3);


--
-- Name: ngn_bank_codes ngn_bank_codes_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.ngn_bank_codes
    ADD CONSTRAINT ngn_bank_codes_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_tenant_id_user_id_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_preferences
    ADD CONSTRAINT notification_preferences_tenant_id_user_id_key UNIQUE (tenant_id, user_id);


--
-- Name: notification_statistics notification_statistics_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_statistics
    ADD CONSTRAINT notification_statistics_pkey PRIMARY KEY (id);


--
-- Name: notification_statistics notification_statistics_tenant_id_date_channel_event_type_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_statistics
    ADD CONSTRAINT notification_statistics_tenant_id_date_channel_event_type_key UNIQUE (tenant_id, date, channel, event_type);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_tenant_id_event_type_channel_languag_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_templates
    ADD CONSTRAINT notification_templates_tenant_id_event_type_channel_languag_key UNIQUE (tenant_id, event_type, channel, language);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: platform_config platform_config_config_key_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_config_key_key UNIQUE (config_key);


--
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_permissions
    ADD CONSTRAINT rbac_permissions_code_key UNIQUE (code);


--
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_permissions rbac_role_permissions_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: rbac_roles rbac_roles_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_roles
    ADD CONSTRAINT rbac_roles_code_key UNIQUE (code);


--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- Name: receipt_templates receipt_templates_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.receipt_templates
    ADD CONSTRAINT receipt_templates_pkey PRIMARY KEY (id);


--
-- Name: tenant_assets tenant_assets_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_pkey PRIMARY KEY (id);


--
-- Name: tenant_assets tenant_assets_tenant_id_asset_type_asset_name_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_asset_type_asset_name_key UNIQUE (tenant_id, asset_type, asset_name);


--
-- Name: tenant_billing tenant_billing_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_pkey PRIMARY KEY (id);


--
-- Name: tenant_billing tenant_billing_tenant_id_billing_period_start_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_billing_period_start_key UNIQUE (tenant_id, billing_period_start);


--
-- Name: tenant_usage_metrics tenant_usage_metrics_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_metric_date_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_metric_date_key UNIQUE (tenant_id, metric_date);


--
-- Name: tenants tenants_bank_code_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_bank_code_key UNIQUE (bank_code);


--
-- Name: tenants tenants_name_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_name_key UNIQUE (name);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: transaction_attachments transaction_attachments_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_attachments
    ADD CONSTRAINT transaction_attachments_pkey PRIMARY KEY (id);


--
-- Name: transaction_audit_log transaction_audit_log_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_audit_log
    ADD CONSTRAINT transaction_audit_log_pkey PRIMARY KEY (id);


--
-- Name: transaction_receipts transaction_receipts_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_receipts
    ADD CONSTRAINT transaction_receipts_pkey PRIMARY KEY (id);


--
-- Name: transaction_receipts transaction_receipts_receipt_number_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_receipts
    ADD CONSTRAINT transaction_receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: transaction_records transaction_records_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.transaction_records
    ADD CONSTRAINT transaction_records_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_device_token_key; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.user_devices
    ADD CONSTRAINT user_devices_device_token_key UNIQUE (device_token);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: webhook_endpoints webhook_endpoints_pkey; Type: CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.webhook_endpoints
    ADD CONSTRAINT webhook_endpoints_pkey PRIMARY KEY (id);


--
-- Name: account_access_logs account_access_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT account_access_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_analytics_insights ai_analytics_insights_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_analytics_insights
    ADD CONSTRAINT ai_analytics_insights_pkey PRIMARY KEY (id);


--
-- Name: ai_configuration ai_configuration_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration
    ADD CONSTRAINT ai_configuration_pkey PRIMARY KEY (id);


--
-- Name: ai_context_mappings ai_context_mappings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings
    ADD CONSTRAINT ai_context_mappings_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_logs ai_conversation_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_conversation_logs
    ADD CONSTRAINT ai_conversation_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_intent_categories ai_intent_categories_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_pkey PRIMARY KEY (id);


--
-- Name: ai_intent_categories ai_intent_categories_tenant_id_name_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: ai_intent_patterns ai_intent_patterns_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns
    ADD CONSTRAINT ai_intent_patterns_pkey PRIMARY KEY (id);


--
-- Name: ai_learning_feedback ai_learning_feedback_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback
    ADD CONSTRAINT ai_learning_feedback_pkey PRIMARY KEY (id);


--
-- Name: ai_response_templates ai_response_templates_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates
    ADD CONSTRAINT ai_response_templates_pkey PRIMARY KEY (id);


--
-- Name: ai_smart_suggestions ai_smart_suggestions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_smart_suggestions
    ADD CONSTRAINT ai_smart_suggestions_pkey PRIMARY KEY (id);


--
-- Name: ai_translation_patterns ai_translation_patterns_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_translation_patterns
    ADD CONSTRAINT ai_translation_patterns_pkey PRIMARY KEY (id);


--
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (id);


--
-- Name: bill_payments bill_payments_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT bill_payments_pkey PRIMARY KEY (id);


--
-- Name: bill_payments bill_payments_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT bill_payments_reference_key UNIQUE (reference);


--
-- Name: bill_providers bill_providers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_providers
    ADD CONSTRAINT bill_providers_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: fraud_alerts fraud_alerts_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_pkey PRIMARY KEY (id);


--
-- Name: internal_transfers internal_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_pkey PRIMARY KEY (id);


--
-- Name: internal_transfers internal_transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_reference_key UNIQUE (reference);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: rbac_permission_audit rbac_permission_audit_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permission_audit
    ADD CONSTRAINT rbac_permission_audit_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_permissions rbac_permissions_tenant_id_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: rbac_role_hierarchy rbac_role_hierarchy_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_hierarchy rbac_role_hierarchy_tenant_id_parent_role_id_child_role_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_tenant_id_parent_role_id_child_role_id_key UNIQUE (tenant_id, parent_role_id, child_role_id);


--
-- Name: rbac_role_permissions rbac_role_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_role_permissions rbac_role_permissions_tenant_id_role_id_permission_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_tenant_id_role_id_permission_id_key UNIQUE (tenant_id, role_id, permission_id);


--
-- Name: rbac_roles rbac_roles_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_roles rbac_roles_tenant_id_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: rbac_temporary_permissions rbac_temporary_permissions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_temporary_permissions
    ADD CONSTRAINT rbac_temporary_permissions_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (id);


--
-- Name: rbac_user_roles rbac_user_roles_tenant_id_user_id_role_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_tenant_id_user_id_role_id_key UNIQUE (tenant_id, user_id, role_id);


--
-- Name: recipients recipients_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_user_id_account_number_bank_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_account_number_bank_code_key UNIQUE (user_id, account_number, bank_code);


--
-- Name: recurring_transfers recurring_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referrer_id_referee_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_referee_id_key UNIQUE (referrer_id, referee_id);


--
-- Name: scheduled_transfers scheduled_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_pkey PRIMARY KEY (id);


--
-- Name: scheduled_transfers scheduled_transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_reference_key UNIQUE (reference);


--
-- Name: tenant_metadata tenant_metadata_tenant_id_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.tenant_metadata
    ADD CONSTRAINT tenant_metadata_tenant_id_key UNIQUE (tenant_id);


--
-- Name: transaction_logs transaction_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_reference_key UNIQUE (reference);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_reference_key UNIQUE (reference);


--
-- Name: analytics_cache uq_analytics_cache_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT uq_analytics_cache_key UNIQUE (tenant_id, user_id, cache_key);


--
-- Name: notification_preferences uq_notification_preferences; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT uq_notification_preferences UNIQUE (tenant_id, user_id, channel, notification_type);


--
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_account_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_account_number_key UNIQUE (account_number);


--
-- Name: users users_bvn_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_bvn_key UNIQUE (bvn);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_nin_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_nin_key UNIQUE (nin);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: wallet_fundings wallet_fundings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_pkey PRIMARY KEY (id);


--
-- Name: wallet_fundings wallet_fundings_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_reference_key UNIQUE (reference);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_wallet_type_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_wallet_type_key UNIQUE (user_id, wallet_type);


--
-- Name: wallets wallets_wallet_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_wallet_number_key UNIQUE (wallet_number);


--
-- Name: idx_ai_conversation_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_date ON analytics.ai_conversation_analytics USING btree (conversation_date);


--
-- Name: idx_ai_conversation_tenant_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_tenant_date ON analytics.ai_conversation_analytics USING btree (tenant_id, conversation_date);


--
-- Name: idx_ai_fraud_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_fraud_date ON analytics.ai_fraud_analytics USING btree (analysis_date);


--
-- Name: idx_ai_fraud_tenant_date; Type: INDEX; Schema: analytics; Owner: bisiadedokun
--

CREATE INDEX idx_ai_fraud_tenant_date ON analytics.ai_fraud_analytics USING btree (tenant_id, analysis_date);


--
-- Name: idx_tenant_audit_event_type; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_event_type ON audit.tenant_audit_logs USING btree (event_type, created_at);


--
-- Name: idx_tenant_audit_resource; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_resource ON audit.tenant_audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_tenant_audit_risk_level; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_risk_level ON audit.tenant_audit_logs USING btree (risk_level) WHERE ((risk_level)::text = ANY (ARRAY[('high'::character varying)::text, ('critical'::character varying)::text]));


--
-- Name: idx_tenant_audit_service_operation; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_service_operation ON audit.tenant_audit_logs USING btree (service_name, operation);


--
-- Name: idx_tenant_audit_tenant_created; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_tenant_created ON audit.tenant_audit_logs USING btree (tenant_id, created_at);


--
-- Name: idx_tenant_audit_user; Type: INDEX; Schema: audit; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_audit_user ON audit.tenant_audit_logs USING btree (user_id, created_at);


--
-- Name: idx_bill_provider_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_bill_provider_templates_active ON platform.bill_provider_templates USING btree (is_active);


--
-- Name: idx_bill_provider_templates_category; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_bill_provider_templates_category ON platform.bill_provider_templates USING btree (category);


--
-- Name: idx_exchange_rates_from; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_from ON platform.exchange_rates USING btree (from_currency);


--
-- Name: idx_exchange_rates_pair_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_exchange_rates_pair_active ON platform.exchange_rates USING btree (from_currency, to_currency, valid_from) WHERE (is_active = true);


--
-- Name: idx_exchange_rates_to; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_to ON platform.exchange_rates USING btree (to_currency);


--
-- Name: idx_exchange_rates_valid; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_exchange_rates_valid ON platform.exchange_rates USING btree (valid_from, valid_until);


--
-- Name: idx_in_app_notifications_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_created_at ON platform.in_app_notifications USING btree (created_at);


--
-- Name: idx_in_app_notifications_data; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_data ON platform.in_app_notifications USING gin (data);


--
-- Name: idx_in_app_notifications_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_tenant_user ON platform.in_app_notifications USING btree (tenant_id, user_id);


--
-- Name: idx_in_app_notifications_user_unread; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_in_app_notifications_user_unread ON platform.in_app_notifications USING btree (user_id, is_read) WHERE (is_deleted = false);


--
-- Name: idx_ngn_bank_code_3; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_3 ON platform.ngn_bank_codes USING btree (bank_code_3);


--
-- Name: idx_ngn_bank_code_5; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_5 ON platform.ngn_bank_codes USING btree (bank_code_5);


--
-- Name: idx_ngn_bank_code_6; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_6 ON platform.ngn_bank_codes USING btree (bank_code_6);


--
-- Name: idx_ngn_bank_code_9; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_code_9 ON platform.ngn_bank_codes USING btree (bank_code_9);


--
-- Name: idx_ngn_bank_name; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_name ON platform.ngn_bank_codes USING btree (bank_name);


--
-- Name: idx_ngn_bank_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_status ON platform.ngn_bank_codes USING btree (status);


--
-- Name: idx_ngn_bank_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_ngn_bank_type ON platform.ngn_bank_codes USING btree (bank_type);


--
-- Name: idx_notification_logs_channel_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_channel_status ON platform.notification_logs USING btree (channel, status);


--
-- Name: idx_notification_logs_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_created_at ON platform.notification_logs USING btree (created_at);


--
-- Name: idx_notification_logs_notification_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_notification_id ON platform.notification_logs USING btree (notification_id);


--
-- Name: idx_notification_logs_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_logs_tenant_user ON platform.notification_logs USING btree (tenant_id, user_id);


--
-- Name: idx_notification_preferences_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_tenant_user ON platform.notification_preferences USING btree (tenant_id, user_id);


--
-- Name: idx_notification_statistics_channel_event; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_statistics_channel_event ON platform.notification_statistics USING btree (channel, event_type);


--
-- Name: idx_notification_statistics_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_statistics_tenant_date ON platform.notification_statistics USING btree (tenant_id, date);


--
-- Name: idx_notification_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_active ON platform.notification_templates USING btree (is_active);


--
-- Name: idx_notification_templates_event_channel; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_event_channel ON platform.notification_templates USING btree (event_type, channel);


--
-- Name: idx_notification_templates_tenant; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notification_templates_tenant ON platform.notification_templates USING btree (tenant_id);


--
-- Name: idx_notifications_channels; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_channels ON platform.notifications USING gin (channels);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_created_at ON platform.notifications USING btree (created_at);


--
-- Name: idx_notifications_data; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_data ON platform.notifications USING gin (data);


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_priority ON platform.notifications USING btree (priority);


--
-- Name: idx_notifications_scheduled_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_scheduled_at ON platform.notifications USING btree (scheduled_at);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_status ON platform.notifications USING btree (status);


--
-- Name: idx_notifications_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_tenant_user ON platform.notifications USING btree (tenant_id, user_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_type ON platform.notifications USING btree (type);


--
-- Name: idx_platform_config_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_active ON platform.platform_config USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_platform_config_key; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_key ON platform.platform_config USING btree (config_key);


--
-- Name: idx_platform_config_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_config_type ON platform.platform_config USING btree (config_type);


--
-- Name: idx_platform_role_permissions_permission; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_role_permissions_permission ON platform.rbac_role_permissions USING btree (permission_id);


--
-- Name: idx_platform_role_permissions_role; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_platform_role_permissions_role ON platform.rbac_role_permissions USING btree (role_id);


--
-- Name: idx_receipt_templates_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_active ON platform.receipt_templates USING btree (is_active);


--
-- Name: idx_receipt_templates_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_tenant_id ON platform.receipt_templates USING btree (tenant_id);


--
-- Name: idx_receipt_templates_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_receipt_templates_type ON platform.receipt_templates USING btree (transaction_type);


--
-- Name: idx_tenant_assets_branding; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_branding ON platform.tenant_assets USING btree (tenant_id, asset_type) WHERE ((asset_type)::text = ANY (ARRAY[('brand_colors'::character varying)::text, ('brand_fonts'::character varying)::text, ('brand_styling'::character varying)::text]));


--
-- Name: idx_tenant_assets_name; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_name ON platform.tenant_assets USING btree (asset_name);


--
-- Name: idx_tenant_assets_tenant_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_assets_tenant_type ON platform.tenant_assets USING btree (tenant_id, asset_type);


--
-- Name: idx_tenant_billing_due_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_due_date ON platform.tenant_billing USING btree (due_date);


--
-- Name: idx_tenant_billing_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_status ON platform.tenant_billing USING btree (status);


--
-- Name: idx_tenant_billing_tenant_period; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_billing_tenant_period ON platform.tenant_billing USING btree (tenant_id, billing_period_start);


--
-- Name: idx_tenant_usage_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_usage_date ON platform.tenant_usage_metrics USING btree (metric_date);


--
-- Name: idx_tenant_usage_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_usage_tenant_date ON platform.tenant_usage_metrics USING btree (tenant_id, metric_date);


--
-- Name: idx_tenants_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_created_at ON platform.tenants USING btree (created_at);


--
-- Name: idx_tenants_currency; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_currency ON platform.tenants USING btree (currency);


--
-- Name: idx_tenants_custom_domain; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_custom_domain ON platform.tenants USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- Name: idx_tenants_database_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_database_status ON platform.tenants USING btree (database_status);


--
-- Name: idx_tenants_locale; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_locale ON platform.tenants USING btree (locale);


--
-- Name: idx_tenants_region; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_region ON platform.tenants USING btree (region);


--
-- Name: idx_tenants_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_status ON platform.tenants USING btree (status);


--
-- Name: idx_tenants_subdomain; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_subdomain ON platform.tenants USING btree (subdomain);


--
-- Name: idx_tenants_tier; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_tenants_tier ON platform.tenants USING btree (tier);


--
-- Name: idx_transaction_attachments_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_tenant_id ON platform.transaction_attachments USING btree (tenant_id);


--
-- Name: idx_transaction_attachments_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_transaction_id ON platform.transaction_attachments USING btree (transaction_id);


--
-- Name: idx_transaction_attachments_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_attachments_type ON platform.transaction_attachments USING btree (attachment_type);


--
-- Name: idx_transaction_audit_log_action; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_action ON platform.transaction_audit_log USING btree (action);


--
-- Name: idx_transaction_audit_log_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_created_at ON platform.transaction_audit_log USING btree (created_at);


--
-- Name: idx_transaction_audit_log_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_tenant_id ON platform.transaction_audit_log USING btree (tenant_id);


--
-- Name: idx_transaction_audit_log_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_audit_log_transaction_id ON platform.transaction_audit_log USING btree (transaction_id);


--
-- Name: idx_transaction_receipts_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_date ON platform.transaction_receipts USING btree (transaction_date);


--
-- Name: idx_transaction_receipts_receipt_number; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_receipt_number ON platform.transaction_receipts USING btree (receipt_number);


--
-- Name: idx_transaction_receipts_recipient_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_recipient_details ON platform.transaction_receipts USING gin (recipient_details);


--
-- Name: idx_transaction_receipts_reference; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_reference ON platform.transaction_receipts USING btree (reference);


--
-- Name: idx_transaction_receipts_sender_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_sender_details ON platform.transaction_receipts USING gin (sender_details);


--
-- Name: idx_transaction_receipts_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_status ON platform.transaction_receipts USING btree (status);


--
-- Name: idx_transaction_receipts_tenant_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_tenant_date ON platform.transaction_receipts USING btree (tenant_id, created_at DESC);


--
-- Name: idx_transaction_receipts_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_tenant_id ON platform.transaction_receipts USING btree (tenant_id);


--
-- Name: idx_transaction_receipts_transaction_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_transaction_id ON platform.transaction_receipts USING btree (transaction_id);


--
-- Name: idx_transaction_receipts_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_receipts_type ON platform.transaction_receipts USING btree (transaction_type);


--
-- Name: idx_transaction_records_account_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_account_date ON platform.transaction_records USING btree (account_id, created_at DESC);


--
-- Name: idx_transaction_records_account_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_account_id ON platform.transaction_records USING btree (account_id);


--
-- Name: idx_transaction_records_amount; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_amount ON platform.transaction_records USING btree (amount);


--
-- Name: idx_transaction_records_category; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_category ON platform.transaction_records USING btree (transaction_category);


--
-- Name: idx_transaction_records_created_at; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_created_at ON platform.transaction_records USING btree (created_at);


--
-- Name: idx_transaction_records_metadata; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_metadata ON platform.transaction_records USING gin (metadata);


--
-- Name: idx_transaction_records_recipient_details; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_recipient_details ON platform.transaction_records USING gin (recipient_details);


--
-- Name: idx_transaction_records_reference; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_reference ON platform.transaction_records USING btree (reference);


--
-- Name: idx_transaction_records_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_status ON platform.transaction_records USING btree (status);


--
-- Name: idx_transaction_records_tenant_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_tenant_id ON platform.transaction_records USING btree (tenant_id);


--
-- Name: idx_transaction_records_type; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_type ON platform.transaction_records USING btree (transaction_type);


--
-- Name: idx_transaction_records_type_status; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_type_status ON platform.transaction_records USING btree (transaction_type, status);


--
-- Name: idx_transaction_records_user_date; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_user_date ON platform.transaction_records USING btree (user_id, created_at DESC);


--
-- Name: idx_transaction_records_user_id; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_records_user_id ON platform.transaction_records USING btree (user_id);


--
-- Name: idx_user_devices_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_active ON platform.user_devices USING btree (is_active);


--
-- Name: idx_user_devices_tenant_user; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_tenant_user ON platform.user_devices USING btree (tenant_id, user_id);


--
-- Name: idx_user_devices_token; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_user_devices_token ON platform.user_devices USING btree (device_token);


--
-- Name: idx_webhook_endpoints_active; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_webhook_endpoints_active ON platform.webhook_endpoints USING btree (is_active);


--
-- Name: idx_webhook_endpoints_tenant; Type: INDEX; Schema: platform; Owner: bisiadedokun
--

CREATE INDEX idx_webhook_endpoints_tenant ON platform.webhook_endpoints USING btree (tenant_id);


--
-- Name: idx_account_access_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_created_at ON tenant.account_access_logs USING btree (created_at);


--
-- Name: idx_account_access_logs_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_tenant_user ON tenant.account_access_logs USING btree (tenant_id, user_id);


--
-- Name: idx_account_access_logs_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_account_access_logs_wallet ON tenant.account_access_logs USING btree (wallet_id);


--
-- Name: idx_activity_logs_activity_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_activity_type ON tenant.user_activity_logs USING btree (activity_type);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_created_at ON tenant.user_activity_logs USING btree (created_at);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_activity_logs_user_id ON tenant.user_activity_logs USING btree (user_id);


--
-- Name: idx_analytics_cache_expires; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_analytics_cache_expires ON tenant.analytics_cache USING btree (expires_at);


--
-- Name: idx_analytics_cache_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_analytics_cache_tenant_user ON tenant.analytics_cache USING btree (tenant_id, user_id);


--
-- Name: idx_bill_payments_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_created_at ON tenant.bill_payments USING btree (created_at);


--
-- Name: idx_bill_payments_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_reference ON tenant.bill_payments USING btree (reference);


--
-- Name: idx_bill_payments_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_status ON tenant.bill_payments USING btree (status);


--
-- Name: idx_bill_payments_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_bill_payments_tenant_user ON tenant.bill_payments USING btree (tenant_id, user_id);


--
-- Name: idx_documents_ai_processed; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_ai_processed ON tenant.documents USING btree (ai_processed, ai_verification_status);


--
-- Name: idx_documents_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_type ON tenant.documents USING btree (document_type);


--
-- Name: idx_documents_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_user ON tenant.documents USING btree (user_id);


--
-- Name: idx_documents_verification; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_documents_verification ON tenant.documents USING btree (verification_status);


--
-- Name: idx_fraud_alerts_created; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_created ON tenant.fraud_alerts USING btree (created_at);


--
-- Name: idx_fraud_alerts_severity; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_severity ON tenant.fraud_alerts USING btree (severity);


--
-- Name: idx_fraud_alerts_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_status ON tenant.fraud_alerts USING btree (status);


--
-- Name: idx_fraud_alerts_transaction; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_transaction ON tenant.fraud_alerts USING btree (transaction_id);


--
-- Name: idx_fraud_alerts_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_fraud_alerts_user ON tenant.fraud_alerts USING btree (user_id);


--
-- Name: idx_internal_transfers_from_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_from_wallet ON tenant.internal_transfers USING btree (from_wallet_id);


--
-- Name: idx_internal_transfers_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_reference ON tenant.internal_transfers USING btree (reference);


--
-- Name: idx_internal_transfers_to_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_to_wallet ON tenant.internal_transfers USING btree (to_wallet_id);


--
-- Name: idx_internal_transfers_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_internal_transfers_user_id ON tenant.internal_transfers USING btree (user_id);


--
-- Name: idx_kyc_documents_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_status ON tenant.kyc_documents USING btree (status);


--
-- Name: idx_kyc_documents_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_type ON tenant.kyc_documents USING btree (document_type);


--
-- Name: idx_kyc_documents_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_kyc_documents_user_id ON tenant.kyc_documents USING btree (user_id);


--
-- Name: idx_login_attempts_attempted_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_attempted_at ON tenant.login_attempts USING btree (attempted_at);


--
-- Name: idx_login_attempts_tenant_identifier; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_tenant_identifier ON tenant.login_attempts USING btree (tenant_id, identifier);


--
-- Name: idx_login_attempts_tenant_ip; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_login_attempts_tenant_ip ON tenant.login_attempts USING btree (tenant_id, ip_address);


--
-- Name: idx_notification_preferences_channel; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_channel ON tenant.notification_preferences USING btree (channel);


--
-- Name: idx_notification_preferences_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notification_preferences_tenant_user ON tenant.notification_preferences USING btree (tenant_id, user_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_created ON tenant.notifications USING btree (created_at);


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_priority ON tenant.notifications USING btree (priority);


--
-- Name: idx_notifications_scheduled; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_scheduled ON tenant.notifications USING btree (scheduled_for) WHERE (scheduled_for IS NOT NULL);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_type ON tenant.notifications USING btree (type);


--
-- Name: idx_notifications_user_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_notifications_user_status ON tenant.notifications USING btree (user_id, status);


--
-- Name: idx_recipients_account_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_account_number ON tenant.recipients USING btree (account_number);


--
-- Name: idx_recipients_bank_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_bank_code ON tenant.recipients USING btree (bank_code);


--
-- Name: idx_recipients_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recipients_user_id ON tenant.recipients USING btree (user_id);


--
-- Name: idx_recurring_transfers_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_status_date ON tenant.recurring_transfers USING btree (status, next_execution_date);


--
-- Name: idx_recurring_transfers_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_user ON tenant.recurring_transfers USING btree (user_id);


--
-- Name: idx_recurring_transfers_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_recurring_transfers_wallet ON tenant.recurring_transfers USING btree (from_wallet_id);


--
-- Name: idx_referrals_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_code ON tenant.referrals USING btree (referral_code);


--
-- Name: idx_referrals_referee_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_referee_id ON tenant.referrals USING btree (referee_id);


--
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_referrals_referrer_id ON tenant.referrals USING btree (referrer_id);


--
-- Name: idx_scheduled_transfers_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_status_date ON tenant.scheduled_transfers USING btree (status, scheduled_date);


--
-- Name: idx_scheduled_transfers_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_user ON tenant.scheduled_transfers USING btree (user_id);


--
-- Name: idx_scheduled_transfers_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_scheduled_transfers_wallet ON tenant.scheduled_transfers USING btree (from_wallet_id);


--
-- Name: idx_suggestions_action_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_action_type ON tenant.ai_smart_suggestions USING btree (tenant_id, action_type);


--
-- Name: idx_suggestions_category_language; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_category_language ON tenant.ai_smart_suggestions USING btree (tenant_id, category, language);


--
-- Name: idx_suggestions_conditions; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_suggestions_conditions ON tenant.ai_smart_suggestions USING gin (conditions);


--
-- Name: idx_tenant_conversation_logs; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_conversation_logs ON tenant.ai_conversation_logs USING btree (tenant_id, user_id, created_at);


--
-- Name: idx_tenant_intent_categories; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_intent_categories ON tenant.ai_intent_categories USING btree (tenant_id, name);


--
-- Name: idx_tenant_intent_patterns; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_intent_patterns ON tenant.ai_intent_patterns USING btree (tenant_id, intent_category_id);


--
-- Name: idx_tenant_permission_audit_resource; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_resource ON tenant.rbac_permission_audit USING btree (tenant_id, resource, action);


--
-- Name: idx_tenant_permission_audit_time; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_time ON tenant.rbac_permission_audit USING btree (created_at);


--
-- Name: idx_tenant_permission_audit_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permission_audit_user ON tenant.rbac_permission_audit USING btree (tenant_id, user_id);


--
-- Name: idx_tenant_permissions_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_permissions_tenant ON tenant.rbac_permissions USING btree (tenant_id);


--
-- Name: idx_tenant_response_templates; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_response_templates ON tenant.ai_response_templates USING btree (tenant_id, intent_category_id);


--
-- Name: idx_tenant_role_permissions_tenant_role; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_role_permissions_tenant_role ON tenant.rbac_role_permissions USING btree (tenant_id, role_id);


--
-- Name: idx_tenant_roles_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_roles_code ON tenant.rbac_roles USING btree (tenant_id, code);


--
-- Name: idx_tenant_roles_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_roles_tenant ON tenant.rbac_roles USING btree (tenant_id);


--
-- Name: idx_tenant_smart_suggestions; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_smart_suggestions ON tenant.ai_smart_suggestions USING btree (tenant_id, category);


--
-- Name: idx_tenant_translations; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_translations ON tenant.ai_translation_patterns USING btree (tenant_id, source_language, target_language);


--
-- Name: idx_tenant_user_roles_active; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_user_roles_active ON tenant.rbac_user_roles USING btree (tenant_id, user_id, is_active);


--
-- Name: idx_tenant_user_roles_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_tenant_user_roles_tenant_user ON tenant.rbac_user_roles USING btree (tenant_id, user_id);


--
-- Name: idx_transaction_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_created_at ON tenant.transaction_logs USING btree (created_at);


--
-- Name: idx_transaction_logs_event_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_event_type ON tenant.transaction_logs USING btree (event_type);


--
-- Name: idx_transaction_logs_transfer_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_transfer_id ON tenant.transaction_logs USING btree (transfer_id);


--
-- Name: idx_transactions_ai_initiated; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_ai_initiated ON tenant.transactions USING btree (ai_initiated) WHERE (ai_initiated = true);


--
-- Name: idx_transactions_amount_range; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_amount_range ON tenant.transactions USING btree (amount);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_created_at ON tenant.transactions USING btree (created_at);


--
-- Name: idx_transactions_external_ref; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_external_ref ON tenant.transactions USING btree (external_reference) WHERE (external_reference IS NOT NULL);


--
-- Name: idx_transactions_fraud_score; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_fraud_score ON tenant.transactions USING btree (fraud_score) WHERE (fraud_score IS NOT NULL);


--
-- Name: idx_transactions_provider; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_provider ON tenant.transactions USING btree (payment_provider);


--
-- Name: idx_transactions_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_reference ON tenant.transactions USING btree (reference);


--
-- Name: idx_transactions_risk_level; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_risk_level ON tenant.transactions USING btree (risk_level) WHERE ((risk_level)::text = ANY (ARRAY[('high'::character varying)::text, ('critical'::character varying)::text]));


--
-- Name: idx_transactions_settlement; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_settlement ON tenant.transactions USING btree (settlement_date, reconciliation_status);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_status ON tenant.transactions USING btree (status);


--
-- Name: idx_transactions_tenant_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_tenant_user ON tenant.transactions USING btree (tenant_id, user_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_type ON tenant.transactions USING btree (type);


--
-- Name: idx_transactions_type_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_type_status_date ON tenant.transactions USING btree (type, status, created_at);


--
-- Name: idx_transactions_user_status_date; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transactions_user_status_date ON tenant.transactions USING btree (user_id, status, created_at);


--
-- Name: idx_transfers_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_created_at ON tenant.transfers USING btree (created_at);


--
-- Name: idx_transfers_date_range; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_date_range ON tenant.transfers USING btree (sender_id, created_at);


--
-- Name: idx_transfers_nibss_transaction_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_nibss_transaction_id ON tenant.transfers USING btree (nibss_transaction_id);


--
-- Name: idx_transfers_recipient_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_recipient_id ON tenant.transfers USING btree (recipient_id);


--
-- Name: idx_transfers_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_reference ON tenant.transfers USING btree (reference);


--
-- Name: idx_transfers_sender_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_sender_id ON tenant.transfers USING btree (sender_id);


--
-- Name: idx_transfers_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_status ON tenant.transfers USING btree (status);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_expires ON tenant.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_suspicious; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_suspicious ON tenant.user_sessions USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_token ON tenant.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_sessions_user ON tenant.user_sessions USING btree (user_id);


--
-- Name: idx_users_account_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_account_number ON tenant.users USING btree (account_number) WHERE (account_number IS NOT NULL);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_created_at ON tenant.users USING btree (created_at);


--
-- Name: idx_users_email_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_users_email_tenant ON tenant.users USING btree (email, tenant_id);


--
-- Name: idx_users_kyc_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_kyc_status ON tenant.users USING btree (kyc_status);


--
-- Name: idx_users_phone_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX idx_users_phone_tenant ON tenant.users USING btree (phone_number, tenant_id);


--
-- Name: idx_users_referral_code; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_referral_code ON tenant.users USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- Name: idx_users_risk_profile; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_risk_profile ON tenant.users USING btree (risk_profile);


--
-- Name: idx_users_role; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_role ON tenant.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_users_status ON tenant.users USING btree (status);


--
-- Name: idx_wallet_fundings_reference; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_reference ON tenant.wallet_fundings USING btree (reference);


--
-- Name: idx_wallet_fundings_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_status ON tenant.wallet_fundings USING btree (status);


--
-- Name: idx_wallet_fundings_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_user_id ON tenant.wallet_fundings USING btree (user_id);


--
-- Name: idx_wallet_fundings_wallet_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_fundings_wallet_id ON tenant.wallet_fundings USING btree (wallet_id);


--
-- Name: idx_wallet_transactions_transaction; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_transaction ON tenant.wallet_transactions USING btree (transaction_id);


--
-- Name: idx_wallet_transactions_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_type ON tenant.wallet_transactions USING btree (transaction_type);


--
-- Name: idx_wallet_transactions_wallet; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallet_transactions_wallet ON tenant.wallet_transactions USING btree (wallet_id, created_at);


--
-- Name: idx_wallets_balance; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_balance ON tenant.wallets USING btree (balance);


--
-- Name: idx_wallets_number; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_number ON tenant.wallets USING btree (wallet_number);


--
-- Name: idx_wallets_primary; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_primary ON tenant.wallets USING btree (user_id, is_primary) WHERE (is_primary = true);


--
-- Name: idx_wallets_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_status ON tenant.wallets USING btree (is_active, is_frozen);


--
-- Name: idx_wallets_tenant_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_tenant_id ON tenant.wallets USING btree (tenant_id);


--
-- Name: idx_wallets_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_type ON tenant.wallets USING btree (wallet_type);


--
-- Name: idx_wallets_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_user_id ON tenant.wallets USING btree (user_id);


--
-- Name: idx_wallets_user_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_user_tenant ON tenant.wallets USING btree (user_id, tenant_id);


--
-- Name: unique_primary_wallet_per_user; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE UNIQUE INDEX unique_primary_wallet_per_user ON tenant.wallets USING btree (user_id) WHERE (is_primary = true);


--
-- Name: tenants log_tenant_changes_trigger; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER log_tenant_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.log_tenant_changes();


--
-- Name: tenant_assets trigger_tenant_assets_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER trigger_tenant_assets_updated_at BEFORE UPDATE ON platform.tenant_assets FOR EACH ROW EXECUTE FUNCTION platform.update_tenant_assets_updated_at();


--
-- Name: bill_provider_templates update_bill_provider_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_bill_provider_templates_updated_at BEFORE UPDATE ON platform.bill_provider_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON platform.notification_preferences FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: notification_statistics update_notification_statistics_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_statistics_updated_at BEFORE UPDATE ON platform.notification_statistics FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: notification_templates update_notification_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON platform.notification_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON platform.notifications FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: platform_config update_platform_config_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON platform.platform_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rbac_permissions update_platform_rbac_permissions_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_rbac_permissions_updated_at BEFORE UPDATE ON platform.rbac_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: rbac_roles update_platform_rbac_roles_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_platform_rbac_roles_updated_at BEFORE UPDATE ON platform.rbac_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: receipt_templates update_receipt_templates_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_receipt_templates_updated_at BEFORE UPDATE ON platform.receipt_templates FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: tenant_billing update_tenant_billing_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_billing_updated_at BEFORE UPDATE ON platform.tenant_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transaction_attachments update_transaction_attachments_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_attachments_updated_at BEFORE UPDATE ON platform.transaction_attachments FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: transaction_receipts update_transaction_receipts_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_receipts_updated_at BEFORE UPDATE ON platform.transaction_receipts FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: transaction_records update_transaction_records_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_transaction_records_updated_at BEFORE UPDATE ON platform.transaction_records FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: user_devices update_user_devices_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON platform.user_devices FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: webhook_endpoints update_webhook_endpoints_updated_at; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON platform.webhook_endpoints FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: tenants validate_tenant_bank_code; Type: TRIGGER; Schema: platform; Owner: bisiadedokun
--

CREATE TRIGGER validate_tenant_bank_code BEFORE INSERT OR UPDATE OF bank_code ON platform.tenants FOR EACH ROW EXECUTE FUNCTION platform.validate_bank_code();


--
-- Name: users auto_assign_account_number; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER auto_assign_account_number BEFORE INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.assign_account_number();


--
-- Name: users auto_create_primary_wallet; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER auto_create_primary_wallet AFTER INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.create_primary_wallet();


--
-- Name: transactions create_wallet_transaction_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER create_wallet_transaction_trigger AFTER UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.create_wallet_transaction();


--
-- Name: transactions generate_transaction_reference_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER generate_transaction_reference_trigger BEFORE INSERT ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_reference();


--
-- Name: wallets generate_wallet_number_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER generate_wallet_number_trigger BEFORE INSERT ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.generate_wallet_number();


--
-- Name: bill_payments sync_bill_payments_to_transactions; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_bill_payments_to_transactions AFTER INSERT OR UPDATE ON tenant.bill_payments FOR EACH ROW EXECUTE FUNCTION platform.sync_bill_payment_to_transactions();


--
-- Name: transfers sync_transfer_to_transactions_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_transfer_to_transactions_trigger AFTER INSERT ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.sync_transfer_to_transactions();


--
-- Name: transfers sync_transfers_to_transactions; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER sync_transfers_to_transactions AFTER INSERT OR UPDATE ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.sync_transfer_to_transactions();


--
-- Name: bill_payments update_bill_payments_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_bill_payments_updated_at BEFORE UPDATE ON tenant.bill_payments FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON tenant.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fraud_alerts update_fraud_alerts_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_fraud_alerts_updated_at BEFORE UPDATE ON tenant.fraud_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON tenant.notification_preferences FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: recipients update_recipients_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON tenant.recipients FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: recurring_transfers update_recurring_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_recurring_transfers_updated_at BEFORE UPDATE ON tenant.recurring_transfers FOR EACH ROW EXECUTE FUNCTION platform.update_scheduled_transfers_updated_at();


--
-- Name: scheduled_transfers update_scheduled_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_scheduled_transfers_updated_at BEFORE UPDATE ON tenant.scheduled_transfers FOR EACH ROW EXECUTE FUNCTION platform.update_scheduled_transfers_updated_at();


--
-- Name: rbac_permissions update_tenant_rbac_permissions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_permissions_updated_at BEFORE UPDATE ON tenant.rbac_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: rbac_role_permissions update_tenant_rbac_role_permissions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_role_permissions_updated_at BEFORE UPDATE ON tenant.rbac_role_permissions FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: rbac_roles update_tenant_rbac_roles_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_roles_updated_at BEFORE UPDATE ON tenant.rbac_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: rbac_user_roles update_tenant_rbac_user_roles_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_tenant_rbac_user_roles_updated_at BEFORE UPDATE ON tenant.rbac_user_roles FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transfers update_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON tenant.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallets update_wallets_balance_trigger; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_wallets_balance_trigger BEFORE INSERT OR UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();


--
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: tenant; Owner: bisiadedokun
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: ai_conversation_analytics ai_conversation_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_fraud_analytics ai_fraud_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: cbn_incidents cbn_incidents_compliance_report_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_compliance_report_id_fkey FOREIGN KEY (compliance_report_id) REFERENCES audit.cbn_compliance_reports(report_id);


--
-- Name: pci_dss_findings pci_dss_findings_requirement_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES audit.pci_dss_requirements(requirement_id);


--
-- Name: pci_dss_requirements pci_dss_requirements_compliance_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_compliance_id_fkey FOREIGN KEY (compliance_id) REFERENCES audit.pci_dss_compliance(compliance_id);


--
-- Name: tenant_audit_logs tenant_audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: exchange_rates exchange_rates_from_currency_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_fkey FOREIGN KEY (from_currency) REFERENCES platform.currency_config(code);


--
-- Name: exchange_rates exchange_rates_to_currency_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.exchange_rates
    ADD CONSTRAINT exchange_rates_to_currency_fkey FOREIGN KEY (to_currency) REFERENCES platform.currency_config(code);


--
-- Name: in_app_notifications in_app_notifications_notification_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.in_app_notifications
    ADD CONSTRAINT in_app_notifications_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES platform.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_notification_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.notification_logs
    ADD CONSTRAINT notification_logs_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES platform.notifications(id) ON DELETE CASCADE;


--
-- Name: rbac_role_permissions rbac_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES platform.rbac_permissions(id) ON DELETE CASCADE;


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES platform.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: tenant_assets tenant_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_billing tenant_billing_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_configuration ai_configuration_preferred_model_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_configuration
    ADD CONSTRAINT ai_configuration_preferred_model_id_fkey FOREIGN KEY (preferred_model_id) REFERENCES platform.ai_models(id);


--
-- Name: ai_context_mappings ai_context_mappings_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_context_mappings
    ADD CONSTRAINT ai_context_mappings_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- Name: ai_intent_patterns ai_intent_patterns_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_patterns
    ADD CONSTRAINT ai_intent_patterns_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- Name: ai_learning_feedback ai_learning_feedback_conversation_log_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_learning_feedback
    ADD CONSTRAINT ai_learning_feedback_conversation_log_id_fkey FOREIGN KEY (conversation_log_id) REFERENCES tenant.ai_conversation_logs(id);


--
-- Name: ai_response_templates ai_response_templates_intent_category_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_response_templates
    ADD CONSTRAINT ai_response_templates_intent_category_id_fkey FOREIGN KEY (intent_category_id) REFERENCES tenant.ai_intent_categories(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES tenant.users(id);


--
-- Name: account_access_logs fk_account_access_logs_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: account_access_logs fk_account_access_logs_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: account_access_logs fk_account_access_logs_wallet; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.account_access_logs
    ADD CONSTRAINT fk_account_access_logs_wallet FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE SET NULL;


--
-- Name: analytics_cache fk_analytics_cache_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT fk_analytics_cache_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: analytics_cache fk_analytics_cache_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.analytics_cache
    ADD CONSTRAINT fk_analytics_cache_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: bill_payments fk_bill_payments_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT fk_bill_payments_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: bill_payments fk_bill_payments_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_payments
    ADD CONSTRAINT fk_bill_payments_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: login_attempts fk_login_attempts_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.login_attempts
    ADD CONSTRAINT fk_login_attempts_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: notification_preferences fk_notification_preferences_tenant; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT fk_notification_preferences_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: notification_preferences fk_notification_preferences_user; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notification_preferences
    ADD CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: fraud_alerts fraud_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES tenant.users(id);


--
-- Name: fraud_alerts fraud_alerts_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: fraud_alerts fraud_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: internal_transfers internal_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: internal_transfers internal_transfers_to_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_to_wallet_id_fkey FOREIGN KEY (to_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: internal_transfers internal_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_alert_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_alert_id_fkey FOREIGN KEY (related_alert_id) REFERENCES tenant.fraud_alerts(id);


--
-- Name: notifications notifications_related_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_transaction_id_fkey FOREIGN KEY (related_transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: rbac_permissions rbac_permissions_platform_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_permissions
    ADD CONSTRAINT rbac_permissions_platform_permission_id_fkey FOREIGN KEY (platform_permission_id) REFERENCES platform.rbac_permissions(id);


--
-- Name: rbac_role_hierarchy rbac_role_hierarchy_child_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_child_role_id_fkey FOREIGN KEY (child_role_id) REFERENCES tenant.rbac_roles(id);


--
-- Name: rbac_role_hierarchy rbac_role_hierarchy_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_hierarchy
    ADD CONSTRAINT rbac_role_hierarchy_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES tenant.rbac_roles(id);


--
-- Name: rbac_role_permissions rbac_role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES tenant.rbac_permissions(id) ON DELETE CASCADE;


--
-- Name: rbac_role_permissions rbac_role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_role_permissions
    ADD CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: rbac_roles rbac_roles_platform_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_roles
    ADD CONSTRAINT rbac_roles_platform_role_id_fkey FOREIGN KEY (platform_role_id) REFERENCES platform.rbac_roles(id);


--
-- Name: rbac_temporary_permissions rbac_temporary_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_temporary_permissions
    ADD CONSTRAINT rbac_temporary_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES tenant.rbac_permissions(id);


--
-- Name: rbac_user_roles rbac_user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.rbac_user_roles
    ADD CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES tenant.rbac_roles(id) ON DELETE CASCADE;


--
-- Name: recipients recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: recurring_transfers recurring_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: recurring_transfers recurring_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recurring_transfers
    ADD CONSTRAINT recurring_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: referrals referrals_referee_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES tenant.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES tenant.users(id);


--
-- Name: scheduled_transfers scheduled_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: scheduled_transfers scheduled_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.scheduled_transfers
    ADD CONSTRAINT scheduled_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: transaction_logs transaction_logs_transfer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES tenant.transfers(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_parent_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_parent_transaction_id_fkey FOREIGN KEY (parent_transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: transfers transfers_recipient_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES tenant.recipients(id);


--
-- Name: transfers transfers_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES tenant.users(id);


--
-- Name: transfers transfers_sender_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES tenant.users(id);


--
-- Name: user_activity_logs user_activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: wallet_fundings wallet_fundings_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: wallet_fundings wallet_fundings_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: wallet_transactions wallet_transactions_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: ai_conversation_analytics; Type: ROW SECURITY; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE analytics.ai_conversation_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_fraud_analytics; Type: ROW SECURITY; Schema: analytics; Owner: bisiadedokun
--

ALTER TABLE analytics.ai_fraud_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_audit_logs; Type: ROW SECURITY; Schema: audit; Owner: bisiadedokun
--

ALTER TABLE audit.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_billing; Type: ROW SECURITY; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE platform.tenant_billing ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_billing tenant_billing_isolation; Type: POLICY; Schema: platform; Owner: bisiadedokun
--

CREATE POLICY tenant_billing_isolation ON platform.tenant_billing USING ((tenant_id = public.get_current_tenant_id()));


--
-- Name: tenant_usage_metrics tenant_usage_isolation; Type: POLICY; Schema: platform; Owner: bisiadedokun
--

CREATE POLICY tenant_usage_isolation ON platform.tenant_usage_metrics USING ((tenant_id = public.get_current_tenant_id()));


--
-- Name: tenant_usage_metrics; Type: ROW SECURITY; Schema: platform; Owner: bisiadedokun
--

ALTER TABLE platform.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: fraud_alerts; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.fraud_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_permission_audit; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_permission_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_permissions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_role_permissions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_roles; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: rbac_user_roles; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.rbac_user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE tenant.wallets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 5bxWXGM087JV67sfYl01pf0bzMJdVrdgdp0KOT8f4X5IZtZ3P0v1vp5H92vt6ec

