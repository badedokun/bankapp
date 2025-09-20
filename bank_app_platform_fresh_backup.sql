--
-- PostgreSQL database dump
--

\restrict ZOTNf2BexdbbwiVgYfUuvceScWeSkB7e5xNhyIzWDRRklhjhqbOgJgTqgdFHDEq

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
-- Name: ai; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA ai;


--
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA analytics;


--
-- Name: SCHEMA analytics; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA analytics IS 'Analytics and reporting tables';


--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: SCHEMA audit; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA audit IS 'Audit logging and compliance tracking';


--
-- Name: platform; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA platform;


--
-- Name: SCHEMA platform; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA platform IS 'Core platform tables for multi-tenant management';


--
-- Name: tenant; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tenant;


--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: assign_account_number(); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: create_compatible_primary_wallet(); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: create_primary_wallet(); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: generate_account_number(character varying); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: generate_referral_code(uuid, character varying); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: get_tenant_asset_url(uuid, character varying, character varying); Type: FUNCTION; Schema: platform; Owner: -
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


--
-- Name: update_tenant_assets_updated_at(); Type: FUNCTION; Schema: platform; Owner: -
--

CREATE FUNCTION platform.update_tenant_assets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: platform; Owner: -
--

CREATE FUNCTION platform.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: validate_nigerian_phone(character varying); Type: FUNCTION; Schema: platform; Owner: -
--

CREATE FUNCTION platform.validate_nigerian_phone(phone_number character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
BEGIN
    -- Allow Nigerian phone numbers (+234xxxxxxxxxx or 0xxxxxxxxxx)
    RETURN phone_number ~ '^\+234[789][01]\d{8}$' OR phone_number ~ '^0[789][01]\d{8}$';
END;
$_$;


--
-- Name: calculate_tenant_billing(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: cleanup_expired_data(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: create_wallet_transaction(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: generate_transaction_reference(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: generate_wallet_number(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: get_current_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: log_tenant_changes(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_wallet_balance(); Type: FUNCTION; Schema: public; Owner: -
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_messages; Type: TABLE; Schema: ai; Owner: -
--

CREATE TABLE ai.conversation_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    conversation_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    content_type character varying(20) DEFAULT 'text'::character varying,
    intent character varying(100),
    confidence numeric(5,4),
    entities jsonb DEFAULT '{}'::jsonb,
    processing_time numeric(8,2),
    language character varying(10) DEFAULT 'en'::character varying,
    voice_input boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '30 days'::interval),
    CONSTRAINT conversation_messages_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['text'::character varying, 'audio'::character varying, 'image'::character varying])::text[]))),
    CONSTRAINT conversation_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


--
-- Name: conversations; Type: TABLE; Schema: ai; Owner: -
--

CREATE TABLE ai.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_id character varying(255) NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    message_count integer DEFAULT 0 NOT NULL,
    average_confidence numeric(5,4),
    total_processing_time numeric(10,2),
    successful_resolution boolean,
    user_satisfaction integer,
    escalated_to_human boolean DEFAULT false NOT NULL,
    primary_language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    detected_languages jsonb DEFAULT '{}'::jsonb,
    intents_identified text[],
    entities_extracted jsonb DEFAULT '{}'::jsonb,
    conversation_summary text,
    sentiment_analysis jsonb DEFAULT '{}'::jsonb,
    topics_discussed text[],
    actions_completed jsonb DEFAULT '[]'::jsonb,
    follow_up_required boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversations_user_satisfaction_check CHECK (((user_satisfaction >= 1) AND (user_satisfaction <= 5)))
);


--
-- Name: TABLE conversations; Type: COMMENT; Schema: ai; Owner: -
--

COMMENT ON TABLE ai.conversations IS 'AI conversation analytics (no PII)';


--
-- Name: user_behavior_patterns; Type: TABLE; Schema: ai; Owner: -
--

CREATE TABLE ai.user_behavior_patterns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    pattern_date date NOT NULL,
    transaction_velocity numeric(8,4),
    average_transaction_amount numeric(15,2),
    preferred_transaction_types text[],
    peak_activity_hours integer[],
    typical_locations jsonb DEFAULT '{}'::jsonb,
    device_fingerprints text[],
    preferred_channels character varying(50)[],
    session_duration_avg numeric(8,2),
    features_used jsonb DEFAULT '{}'::jsonb,
    navigation_patterns jsonb DEFAULT '{}'::jsonb,
    ai_usage_frequency numeric(6,2),
    preferred_ai_language character varying(10),
    voice_command_usage boolean DEFAULT false,
    satisfaction_trend numeric(3,2),
    security_events integer DEFAULT 0,
    mfa_usage_rate numeric(5,4),
    suspicious_activities integer DEFAULT 0,
    feature_vector numeric(8,6)[] DEFAULT '{}'::numeric[],
    anomaly_score numeric(5,4),
    behavior_cluster integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ai_conversation_analytics; Type: TABLE; Schema: analytics; Owner: -
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


--
-- Name: TABLE ai_conversation_analytics; Type: COMMENT; Schema: analytics; Owner: -
--

COMMENT ON TABLE analytics.ai_conversation_analytics IS 'Aggregated AI conversation metrics';


--
-- Name: ai_fraud_analytics; Type: TABLE; Schema: analytics; Owner: -
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


--
-- Name: TABLE ai_fraud_analytics; Type: COMMENT; Schema: analytics; Owner: -
--

COMMENT ON TABLE analytics.ai_fraud_analytics IS 'AI fraud detection performance metrics';


--
-- Name: cbn_compliance_reports; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: cbn_incidents; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: cbn_security_audits; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: data_localization_checks; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: network_segmentation; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: pci_dss_compliance; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: pci_dss_findings; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: pci_dss_requirements; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: security_alerts; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: siem_events; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: siem_rules; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: tenant_audit_logs; Type: TABLE; Schema: audit; Owner: -
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
    CONSTRAINT tenant_audit_logs_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['create'::character varying, 'read'::character varying, 'update'::character varying, 'delete'::character varying, 'auth'::character varying, 'transaction'::character varying, 'admin'::character varying, 'system'::character varying])::text[]))),
    CONSTRAINT tenant_audit_logs_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT tenant_audit_logs_status_check CHECK (((status)::text = ANY ((ARRAY['logged'::character varying, 'reviewed'::character varying, 'investigated'::character varying, 'resolved'::character varying])::text[])))
);


--
-- Name: TABLE tenant_audit_logs; Type: COMMENT; Schema: audit; Owner: -
--

COMMENT ON TABLE audit.tenant_audit_logs IS 'Comprehensive audit trail';


--
-- Name: threat_intelligence; Type: TABLE; Schema: audit; Owner: -
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


--
-- Name: ai_models; Type: TABLE; Schema: platform; Owner: -
--

CREATE TABLE platform.ai_models (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    version character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    platform character varying(20) NOT NULL,
    tenant_id uuid,
    is_shared boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    model_url text,
    config_url text,
    model_size bigint NOT NULL,
    model_format character varying(20) DEFAULT 'tensorflow'::character varying,
    accuracy numeric(5,4),
    precision_score numeric(5,4),
    recall_score numeric(5,4),
    f1_score numeric(5,4),
    latency numeric(8,2),
    throughput numeric(10,2),
    supported_languages text[] DEFAULT ARRAY['en'::text],
    regional_optimization character varying(50) DEFAULT 'nigeria'::character varying,
    status character varying(20) DEFAULT 'training'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    training_data_size bigint,
    training_duration integer,
    training_cost numeric(10,2),
    training_completed_at timestamp without time zone,
    parent_model_id uuid,
    deployment_config jsonb DEFAULT '{}'::jsonb,
    description text,
    tags text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    CONSTRAINT ai_models_platform_check CHECK (((platform)::text = ANY ((ARRAY['cloud'::character varying, 'edge'::character varying, 'hybrid'::character varying])::text[]))),
    CONSTRAINT ai_models_status_check CHECK (((status)::text = ANY ((ARRAY['training'::character varying, 'validating'::character varying, 'ready'::character varying, 'deprecated'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT ai_models_type_check CHECK (((type)::text = ANY ((ARRAY['conversational'::character varying, 'fraud_detection'::character varying, 'nlp'::character varying, 'voice'::character varying, 'vision'::character varying, 'document'::character varying])::text[])))
);


--
-- Name: TABLE ai_models; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON TABLE platform.ai_models IS 'AI model registry and metadata';


--
-- Name: platform_config; Type: TABLE; Schema: platform; Owner: -
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
    CONSTRAINT platform_config_config_type_check CHECK (((config_type)::text = ANY ((ARRAY['ai'::character varying, 'security'::character varying, 'payment'::character varying, 'system'::character varying, 'feature'::character varying])::text[]))),
    CONSTRAINT platform_config_environment_check CHECK (((environment)::text = ANY ((ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying, 'all'::character varying])::text[])))
);


--
-- Name: TABLE platform_config; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON TABLE platform.platform_config IS 'Platform-wide configuration settings';


--
-- Name: tenant_assets; Type: TABLE; Schema: platform; Owner: -
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
    CONSTRAINT tenant_assets_asset_type_check CHECK (((asset_type)::text = ANY ((ARRAY['logo'::character varying, 'favicon'::character varying, 'hero_image'::character varying, 'background'::character varying, 'icon'::character varying, 'stylesheet'::character varying])::text[])))
);


--
-- Name: tenant_billing; Type: TABLE; Schema: platform; Owner: -
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
    CONSTRAINT tenant_billing_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


--
-- Name: TABLE tenant_billing; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON TABLE platform.tenant_billing IS 'Tenant billing records and invoicing';


--
-- Name: tenant_usage_metrics; Type: TABLE; Schema: platform; Owner: -
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


--
-- Name: TABLE tenant_usage_metrics; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON TABLE platform.tenant_usage_metrics IS 'Real-time tenant usage tracking';


--
-- Name: tenants; Type: TABLE; Schema: platform; Owner: -
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
    bank_code character varying(3),
    CONSTRAINT check_name_format CHECK (((name)::text ~ '^[a-z0-9_-]+$'::text)),
    CONSTRAINT check_subdomain_format CHECK (((subdomain)::text ~ '^[a-z0-9-]+$'::text)),
    CONSTRAINT tenants_compliance_level_check CHECK (((compliance_level)::text = ANY ((ARRAY['tier1'::character varying, 'tier2'::character varying, 'tier3'::character varying])::text[]))),
    CONSTRAINT tenants_database_status_check CHECK (((database_status)::text = ANY ((ARRAY['pending'::character varying, 'provisioning'::character varying, 'active'::character varying, 'maintenance'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying, 'pending'::character varying, 'provisioning'::character varying])::text[]))),
    CONSTRAINT tenants_tier_check CHECK (((tier)::text = ANY ((ARRAY['basic'::character varying, 'premium'::character varying, 'enterprise'::character varying])::text[])))
);


--
-- Name: TABLE tenants; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON TABLE platform.tenants IS 'Master tenant registry with configuration';


--
-- Name: COLUMN tenants.database_name; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON COLUMN platform.tenants.database_name IS 'Isolated database name for this tenant';


--
-- Name: COLUMN tenants.connection_string; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON COLUMN platform.tenants.connection_string IS 'PostgreSQL connection string for tenant database';


--
-- Name: COLUMN tenants.database_status; Type: COMMENT; Schema: platform; Owner: -
--

COMMENT ON COLUMN platform.tenants.database_status IS 'Current status of tenant database';


--
-- Name: bill_providers; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT bill_providers_bill_type_check CHECK (((bill_type)::text = ANY ((ARRAY['electricity'::character varying, 'cable_tv'::character varying, 'water'::character varying, 'internet'::character varying])::text[]))),
    CONSTRAINT bill_providers_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: documents; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT documents_ai_verification_status_check CHECK (((ai_verification_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'failed'::character varying, 'manual_review'::character varying])::text[]))),
    CONSTRAINT documents_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['national_id'::character varying, 'drivers_license'::character varying, 'passport'::character varying, 'voters_card'::character varying, 'birth_certificate'::character varying, 'utility_bill'::character varying, 'bank_statement'::character varying, 'salary_slip'::character varying, 'tax_certificate'::character varying, 'business_registration'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT documents_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: TABLE documents; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.documents IS 'Document storage for KYC and compliance';


--
-- Name: fraud_alerts; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT fraud_alerts_alert_type_check CHECK (((alert_type)::text = ANY ((ARRAY['high_risk_transaction'::character varying, 'unusual_pattern'::character varying, 'velocity_check'::character varying, 'location_anomaly'::character varying, 'device_mismatch'::character varying, 'time_anomaly'::character varying, 'amount_anomaly'::character varying, 'recipient_risk'::character varying])::text[]))),
    CONSTRAINT fraud_alerts_priority_check CHECK (((priority >= 1) AND (priority <= 10))),
    CONSTRAINT fraud_alerts_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT fraud_alerts_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'false_positive'::character varying, 'escalated'::character varying])::text[])))
);


--
-- Name: TABLE fraud_alerts; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.fraud_alerts IS 'Fraud detection alerts and investigations';


--
-- Name: internal_transfers; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT internal_transfers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE internal_transfers; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.internal_transfers IS 'Inter-wallet transfers within user accounts';


--
-- Name: kyc_documents; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT kyc_documents_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['nin'::character varying, 'passport'::character varying, 'drivers_license'::character varying, 'voters_card'::character varying, 'bvn'::character varying])::text[]))),
    CONSTRAINT kyc_documents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: TABLE kyc_documents; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.kyc_documents IS 'KYC verification documents and status';


--
-- Name: notifications; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT notifications_personalization_level_check CHECK (((personalization_level)::text = ANY ((ARRAY['none'::character varying, 'basic'::character varying, 'standard'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'queued'::character varying, 'sent'::character varying, 'delivered'::character varying, 'read'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['transaction_completed'::character varying, 'transaction_failed'::character varying, 'security_alert'::character varying, 'fraud_alert'::character varying, 'ai_insight'::character varying, 'system_maintenance'::character varying, 'account_update'::character varying, 'payment_reminder'::character varying, 'kyc_required'::character varying, 'limit_exceeded'::character varying, 'promotional'::character varying])::text[])))
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.notifications IS 'User notifications and communications';


--
-- Name: recipients; Type: TABLE; Schema: tenant; Owner: -
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


--
-- Name: TABLE recipients; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.recipients IS 'Saved recipient accounts for transfers';


--
-- Name: referrals; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT referrals_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'claimed'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE referrals; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.referrals IS 'User referral program tracking';


--
-- Name: tenant_metadata; Type: TABLE; Schema: tenant; Owner: -
--

CREATE TABLE tenant.tenant_metadata (
    tenant_id uuid NOT NULL,
    tenant_name character varying(255) NOT NULL,
    schema_version character varying(50) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_tenant CHECK ((tenant_id IS NOT NULL))
);


--
-- Name: transaction_logs; Type: TABLE; Schema: tenant; Owner: -
--

CREATE TABLE tenant.transaction_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE transaction_logs; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.transaction_logs IS 'Detailed transfer transaction logs';


--
-- Name: transaction_ref_seq; Type: SEQUENCE; Schema: tenant; Owner: -
--

CREATE SEQUENCE tenant.transaction_ref_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT transactions_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'blocked'::character varying, 'reversed'::character varying, 'disputed'::character varying, 'settled'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['cash_withdrawal'::character varying, 'money_transfer'::character varying, 'bill_payment'::character varying, 'airtime_purchase'::character varying, 'balance_inquiry'::character varying, 'account_opening'::character varying, 'loan_payment'::character varying, 'investment'::character varying, 'pos_payment'::character varying, 'qr_payment'::character varying, 'bulk_transfer'::character varying])::text[])))
);


--
-- Name: TABLE transactions; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.transactions IS 'All transaction records with AI fraud detection';


--
-- Name: transfers; Type: TABLE; Schema: tenant; Owner: -
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
    source_bank_code character varying(3) NOT NULL,
    recipient_account_number character varying(20) NOT NULL,
    recipient_bank_code character varying(3) NOT NULL,
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
    CONSTRAINT transfers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'successful'::character varying, 'failed'::character varying, 'reversed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE transfers; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.transfers IS 'All money transfer transactions via NIBSS';


--
-- Name: users; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT users_kyc_level_check CHECK (((kyc_level >= 1) AND (kyc_level <= 3))),
    CONSTRAINT users_kyc_status_check CHECK (((kyc_status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT users_risk_profile_check CHECK (((risk_profile)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'super_agent'::character varying, 'agent'::character varying, 'merchant'::character varying, 'viewer'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'pending'::character varying, 'locked'::character varying])::text[])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.users IS 'Tenant-specific user accounts with AI preferences';


--
-- Name: transfer_history_view; Type: VIEW; Schema: tenant; Owner: -
--

CREATE VIEW tenant.transfer_history_view AS
 SELECT t.id,
    t.reference,
    t.amount,
    t.fee,
    t.description,
    t.status,
    t.created_at,
    t.updated_at,
    su.first_name AS sender_first_name,
    su.last_name AS sender_last_name,
    su.email AS sender_email,
    su.account_number AS sender_account,
    t.recipient_name,
    t.recipient_account_number,
    t.recipient_bank_code,
    t.nibss_transaction_id,
    t.nibss_session_id
   FROM (tenant.transfers t
     JOIN tenant.users su ON ((t.sender_id = su.id)));


--
-- Name: user_activity_logs; Type: TABLE; Schema: tenant; Owner: -
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


--
-- Name: TABLE user_activity_logs; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.user_activity_logs IS 'User activity tracking for security';


--
-- Name: user_sessions; Type: TABLE; Schema: tenant; Owner: -
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


--
-- Name: wallets; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT wallets_security_level_check CHECK (((security_level)::text = ANY ((ARRAY['basic'::character varying, 'standard'::character varying, 'premium'::character varying, 'maximum'::character varying])::text[]))),
    CONSTRAINT wallets_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'frozen'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT wallets_wallet_type_check CHECK (((wallet_type)::text = ANY (ARRAY[('main'::character varying)::text, ('primary'::character varying)::text, ('savings'::character varying)::text, ('business'::character varying)::text, ('investment'::character varying)::text])))
);


--
-- Name: TABLE wallets; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.wallets IS 'User wallet accounts for storing balances';


--
-- Name: user_wallet_summary; Type: VIEW; Schema: tenant; Owner: -
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


--
-- Name: wallet_fundings; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT wallet_fundings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: TABLE wallet_fundings; Type: COMMENT; Schema: tenant; Owner: -
--

COMMENT ON TABLE tenant.wallet_fundings IS 'Wallet funding operations';


--
-- Name: wallet_number_seq; Type: SEQUENCE; Schema: tenant; Owner: -
--

CREATE SEQUENCE tenant.wallet_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_transactions; Type: TABLE; Schema: tenant; Owner: -
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
    CONSTRAINT wallet_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])))
);


--
-- Data for Name: conversation_messages; Type: TABLE DATA; Schema: ai; Owner: -
--

COPY ai.conversation_messages (id, conversation_id, role, content, content_type, intent, confidence, entities, processing_time, language, voice_input, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: ai; Owner: -
--

COPY ai.conversations (id, user_id, session_id, started_at, ended_at, message_count, average_confidence, total_processing_time, successful_resolution, user_satisfaction, escalated_to_human, primary_language, detected_languages, intents_identified, entities_extracted, conversation_summary, sentiment_analysis, topics_discussed, actions_completed, follow_up_required, created_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_patterns; Type: TABLE DATA; Schema: ai; Owner: -
--

COPY ai.user_behavior_patterns (id, user_id, pattern_date, transaction_velocity, average_transaction_amount, preferred_transaction_types, peak_activity_hours, typical_locations, device_fingerprints, preferred_channels, session_duration_avg, features_used, navigation_patterns, ai_usage_frequency, preferred_ai_language, voice_command_usage, satisfaction_trend, security_events, mfa_usage_rate, suspicious_activities, feature_vector, anomaly_score, behavior_cluster, created_at) FROM stdin;
\.


--
-- Data for Name: ai_conversation_analytics; Type: TABLE DATA; Schema: analytics; Owner: -
--

COPY analytics.ai_conversation_analytics (id, tenant_id, conversation_date, total_conversations, successful_resolutions, escalated_conversations, abandoned_conversations, average_confidence, average_response_time, average_conversation_length, language_usage, intent_distribution, user_satisfaction, satisfaction_responses, escalation_rate, parsing_errors, service_errors, timeout_errors, created_at) FROM stdin;
\.


--
-- Data for Name: ai_fraud_analytics; Type: TABLE DATA; Schema: analytics; Owner: -
--

COPY analytics.ai_fraud_analytics (id, tenant_id, analysis_date, total_assessments, transactions_assessed, low_risk_count, medium_risk_count, high_risk_count, critical_risk_count, true_positives, false_positives, true_negatives, false_negatives, false_positive_rate, false_negative_rate, model_accuracy, average_processing_time, p99_processing_time, blocked_transactions, approved_transactions, flagged_for_review, additional_auth_required, primary_model_version, model_performance_score, created_at) FROM stdin;
\.


--
-- Data for Name: cbn_compliance_reports; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.cbn_compliance_reports (report_id, tenant_id, report_type, severity, status, submission_deadline, submitted_at, acknowledged_at, description, impact, mitigation_actions, metadata, created_at, updated_at) FROM stdin;
71a067c1-48df-4afe-b33f-198ba7f1006a	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:37:14.669	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:37:14.669Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "02ceec92-f75e-48b5-ac67-25b0a4c906a0", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:37:14.712042	2025-09-10 14:37:14.712042
16faec9f-cfc5-45bb-80ab-6357bf10e7aa	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:43:37.833	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:43:37.833Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "b8749586-5182-491b-b4b9-99facd82ab0b", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:43:37.847745	2025-09-10 14:43:37.847745
ce5dbce8-ac76-4b67-be8b-a22e5e902894	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-11 14:45:30.728	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-10T18:45:30.728Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "15059b24-0e0d-40f5-a3e8-2a1371066cd1", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-10 14:45:30.730388	2025-09-10 14:45:30.730388
14da6449-258a-4e09-8058-bc63fcfc934b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	incident	low	draft	2025-09-15 18:40:11.374	\N	\N	Security incident detected in cyber_attack category with low severity. Impact: 0 customers affected, ₦0 financial impact. Affected systems: test_system. Status: active. Detected at: 2025-09-14T22:40:11.374Z.	Financial Impact: ₦0\nCustomer Impact: 0 affected customers\nOperational Impact: minimal\nData Types Affected: test_data\nSystems Affected: test_system	["Incident containment and isolation of affected systems", "Investigation and root cause analysis", "Customer notification as required by regulations", "System security enhancement and patching", "Review and update security policies", "Security perimeter strengthening", "Threat intelligence analysis and sharing"]	{"incidentId": "6666bccf-b6ab-40bd-b0a0-dde010d9e0c9", "cbnCategory": "cyber_attack", "detectionMethod": "automated", "automaticallyGenerated": true}	2025-09-14 18:40:11.412133	2025-09-14 18:40:11.412133
\.


--
-- Data for Name: cbn_incidents; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.cbn_incidents (incident_id, tenant_id, category, severity, impact_level, affected_systems, customer_impact, financial_impact, data_types, detected_at, reported_at, resolved_at, root_cause, status, timeline, compliance_report_id, created_at, updated_at) FROM stdin;
02ceec92-f75e-48b5-ac67-25b0a4c906a0	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:37:14.669	2025-09-10 14:37:14.67	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:37:14.669Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:37:14.670Z"}]	71a067c1-48df-4afe-b33f-198ba7f1006a	2025-09-10 14:37:14.670519	2025-09-10 14:37:14.713457
b8749586-5182-491b-b4b9-99facd82ab0b	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:43:37.833	2025-09-10 14:43:37.833	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:43:37.833Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:43:37.833Z"}]	16faec9f-cfc5-45bb-80ab-6357bf10e7aa	2025-09-10 14:43:37.834149	2025-09-10 14:43:37.849022
15059b24-0e0d-40f5-a3e8-2a1371066cd1	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-10 14:45:30.728	2025-09-10 14:45:30.728	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-10T18:45:30.728Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-10T18:45:30.728Z"}]	ce5dbce8-ac76-4b67-be8b-a22e5e902894	2025-09-10 14:45:30.728412	2025-09-10 14:45:30.730916
6666bccf-b6ab-40bd-b0a0-dde010d9e0c9	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	cyber_attack	low	minimal	["test_system"]	0	0.00	["test_data"]	2025-09-14 18:40:11.374	2025-09-14 18:40:11.374	\N	\N	active	[{"actor": "System", "event": "Incident Detected", "details": "Incident automatically detected and logged", "timestamp": "2025-09-14T22:40:11.374Z"}, {"actor": "Compliance Service", "event": "CBN Report Initiated", "details": "Mandatory CBN incident report initiated", "timestamp": "2025-09-14T22:40:11.374Z"}]	14da6449-258a-4e09-8058-bc63fcfc934b	2025-09-14 18:40:11.374877	2025-09-14 18:40:11.412836
\.


--
-- Data for Name: cbn_security_audits; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.cbn_security_audits (audit_id, tenant_id, audit_type, scope, status, start_date, end_date, auditor, findings, risk_rating, compliance_score, recommendations, action_plan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: data_localization_checks; Type: TABLE DATA; Schema: audit; Owner: -
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
-- Data for Name: network_segmentation; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.network_segmentation (segmentation_id, tenant_id, environment_type, segment_description, validation_method, last_validated, validation_results, compliance_status, findings, remediation_plan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pci_dss_compliance; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.pci_dss_compliance (compliance_id, tenant_id, merchant_level, assessment_type, compliance_status, last_assessment, next_assessment, valid_until, requirements, network_security, cardholder_data_protection, vulnerability_management, access_control, monitoring, security_policy, created_at, updated_at) FROM stdin;
a6d06ede-3d5b-4b17-a94e-456e6258f8ff	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	self_assessment	in_progress	2025-09-10 14:45:31.277	2026-09-10 14:45:31.277	2026-09-10 14:45:31.277	[{"title": "Network Security Controls Documentation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 1.1.1: Network Security Controls Documentation", "requirementId": "e4e787c9-23c8-4f26-a8c8-28903d089e88", "requirementNumber": "1.1.1"}, {"title": "Network Configuration Standards", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 1.2.1: Network Configuration Standards", "requirementId": "67b69c07-9ffb-44d3-be91-09a437eb56c4", "requirementNumber": "1.2.1"}, {"title": "Change Default Passwords", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 2.1.1: Change Default Passwords", "requirementId": "bffd9c26-0d3b-47a1-83fc-302a3d8a09aa", "requirementNumber": "2.1.1"}, {"title": "Configuration Standards Implementation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 2.2.1: Configuration Standards Implementation", "requirementId": "0acf93f0-60d9-46ef-ba28-9c27fb8edc96", "requirementNumber": "2.2.1"}, {"title": "Minimize Cardholder Data Storage", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage", "requirementId": "9c0fe739-2cfa-4982-b53e-be61a505d412", "requirementNumber": "3.1.1"}, {"title": "Render PAN Unreadable", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 3.4.1: Render PAN Unreadable", "requirementId": "9d8333c8-db0c-4ee1-907f-20e31c8a70e3", "requirementNumber": "3.4.1"}, {"title": "Strong Cryptography for Data Transmission", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission", "requirementId": "4fdc7f64-4ead-4d35-ac8a-d07a9f4def0c", "requirementNumber": "4.1.1"}, {"title": "Never Send Unprotected PANs", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 4.2.1: Never Send Unprotected PANs", "requirementId": "2c0e97a4-9030-4b74-84da-8703288e69ff", "requirementNumber": "4.2.1"}, {"title": "Deploy Anti-Malware Solutions", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions", "requirementId": "b02e0731-dd51-4e01-a7de-8caba6634e6d", "requirementNumber": "5.1.1"}, {"title": "Keep Anti-Malware Current", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 5.2.1: Keep Anti-Malware Current", "requirementId": "01f242da-8b2a-4d09-a4ad-dce091beeacc", "requirementNumber": "5.2.1"}, {"title": "Establish Vulnerability Management Process", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process", "requirementId": "6781cac5-d358-4a0c-9c5b-b27b2cd9e1f2", "requirementNumber": "6.1.1"}, {"title": "Deploy Critical Security Patches", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 6.2.1: Deploy Critical Security Patches", "requirementId": "e54bb441-b55f-42f0-9d3d-4c6c2a674f25", "requirementNumber": "6.2.1"}, {"title": "Limit Access to Business Need-to-Know", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know", "requirementId": "b94f0866-69fb-4d14-8e48-2abbde990351", "requirementNumber": "7.1.1"}, {"title": "Assign Unique ID to Each User", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 7.2.1: Assign Unique ID to Each User", "requirementId": "34bde7ba-16af-4ec9-adc6-60ed30d680ca", "requirementNumber": "7.2.1"}, {"title": "Assign Unique User IDs", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 8.1.1: Assign Unique User IDs", "requirementId": "a0eed628-2523-493e-9fb0-ddba027fa328", "requirementNumber": "8.1.1"}, {"title": "Strong User Authentication", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 8.2.1: Strong User Authentication", "requirementId": "259b6ab4-3cdd-4cb7-ba36-3f617251da7f", "requirementNumber": "8.2.1"}, {"title": "Physical Access Controls", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 9.1.1: Physical Access Controls", "requirementId": "8d8a1738-a6e4-4d85-8ebe-19a55d09f32d", "requirementNumber": "9.1.1"}, {"title": "Develop Physical Access Procedures", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 9.2.1: Develop Physical Access Procedures", "requirementId": "46fa7114-d8e6-4f63-91e3-b4899f03d18b", "requirementNumber": "9.2.1"}, {"title": "Implement Audit Trails", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 10.1.1: Implement Audit Trails", "requirementId": "92e76980-2cd6-4d15-b362-1188c7d7ff72", "requirementNumber": "10.1.1"}, {"title": "Automated Audit Trail Review", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 10.2.1: Automated Audit Trail Review", "requirementId": "ec1e3aae-8bda-42bc-b1ff-0e8036170964", "requirementNumber": "10.2.1"}, {"title": "Wireless Access Point Inventory", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "medium", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 11.1.1: Wireless Access Point Inventory", "requirementId": "ac2447c9-bcee-4953-8111-0865b532e1cb", "requirementNumber": "11.1.1"}, {"title": "Perform Penetration Testing", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 11.3.1: Perform Penetration Testing", "requirementId": "e882e6ec-2eaa-42e1-8fba-212241da5f90", "requirementNumber": "11.3.1"}, {"title": "Information Security Policy", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "critical", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 12.1.1: Information Security Policy", "requirementId": "a46d07cd-70bb-4bc0-8abb-31c3716842eb", "requirementNumber": "12.1.1"}, {"title": "Security Awareness Program", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-10T19:45:31.277Z", "priority": "high", "lastTested": "2025-09-10T18:45:31.277Z", "description": "PCI DSS Requirement 12.6.1: Security Awareness Program", "requirementId": "5c924b4c-1f79-44a1-947a-247a73841410", "requirementNumber": "12.6.1"}]	{"networkSegmentation": {"segmentationTested": true, "lastPenetrationTest": "2025-09-10T18:45:31.277Z", "segmentationControls": ["Network firewalls", "VLANs", "Access control lists"], "cardholderDataEnvironment": "Isolated DMZ network"}, "firewallConfiguration": {"rulesReviewed": true, "lastReviewDate": "2025-09-10T18:45:31.277Z", "rulesDocumented": true, "configurationStandards": ["Default deny-all firewall rules", "Restrict inbound and outbound traffic", "Document business justification for all rules"]}, "defaultPasswordChanges": {"changePolicy": "All default passwords must be changed before deployment", "defaultsChanged": true, "verificationProcess": "Configuration review and penetration testing"}, "dataTransmissionSecurity": {"keyManagement": "Hardware Security Module (HSM)", "encryptionStandards": ["TLS 1.2+", "AES-256"], "transmissionProtocols": ["HTTPS", "SFTP"]}}	{"masking": {"exemptions": ["Authorized personnel only"], "panMasking": true, "displayRules": ["Show only last 4 digits", "Mask middle digits with X"], "maskingMethod": "tokenization"}, "disposal": {"disposalMethods": ["Cryptographic erasure", "Physical destruction"], "mediaDestruction": "NIST 800-88 standards", "verificationProcess": "Certificate of destruction required"}, "retention": {"secureStorage": true, "retentionPeriod": 12, "businessJustification": "Regulatory and dispute resolution requirements"}, "dataStorage": {"retentionPolicy": "12 months maximum retention", "storageLocations": ["Encrypted database", "Tokenization vault"], "storageMinimized": true, "encryptionStandards": ["AES-256-GCM", "Field-level encryption"]}, "dataTransmission": {"keyManagement": "PKI with certificate rotation", "approvedProtocols": ["TLS 1.3", "HTTPS"], "encryptionRequired": true}}	{"systemUpdates": {"testingProcess": "Staging environment testing required", "patchManagement": "Monthly security patch cycle", "criticalPatchTimeline": "30 days for critical patches"}, "antivirusControls": {"deploymentScope": "All systems processing cardholder data", "updateFrequency": "Daily signature updates", "monitoringEnabled": true}, "secureApplicationDevelopment": {"codeReviewProcess": "Peer review and static analysis", "developmentStandards": ["OWASP Secure Coding", "SANS Secure Development"], "vulnerabilityTesting": "Dynamic and static application testing"}}	{"uniqueUserIds": {"userIdPolicy": "Unique user ID for each individual", "sharedIdProhibition": true, "serviceAccountManagement": "Documented and approved service accounts only"}, "physicalAccess": {"mediaAccess": "Secure storage with dual control", "deviceSecurity": "Device inventory and tracking", "facilityAccess": "Badge access with logging"}, "accessRestrictions": {"needToKnowBasis": true, "roleBasedAccess": true, "privilegedAccess": "Multi-factor authentication required"}}	{"logManagement": {"logSources": ["Firewalls", "Servers", "Applications", "Databases"], "reviewProcess": "Daily automated review with exception reporting", "loggingEnabled": true, "retentionPeriod": 12}, "securityTesting": {"applicationTesting": {"staticAnalysis": true, "dynamicAnalysis": true, "testingFrequency": "Before deployment and annually"}, "penetrationTesting": {"scope": ["Network", "Applications", "Wireless"], "findings": [], "lastTest": "2025-09-10T18:45:31.278Z", "nextTest": "2026-09-10T18:45:31.278Z", "frequency": "annual", "remediation": []}, "vulnerabilityScanning": {"lastScan": "2025-09-10T18:45:31.278Z", "scanScope": ["Internal networks", "External perimeter"], "criticalFindings": 0, "scanningFrequency": "Quarterly"}}, "incidentResponse": {"teamStructure": "24/7 security operations center", "responseProcess": "Documented incident response plan", "testingSchedule": "Annual tabletop exercises", "communicationPlan": "Escalation matrix with contact details"}}	{"riskAssessment": {"riskRegister": ["Data breach", "System compromise", "Insider threats"], "lastAssessment": "2025-09-10T18:45:31.278Z", "mitigationPlans": ["Security controls", "Monitoring", "Training"], "assessmentFrequency": "Annual with quarterly updates"}, "securityAwareness": {"trainingProgram": "Comprehensive security awareness program", "trainingFrequency": "Annual mandatory training", "awarenessActivities": ["Phishing simulations", "Security bulletins", "Workshops"]}, "informationSecurityPolicy": {"lastReview": "2025-09-10T18:45:31.278Z", "nextReview": "2026-09-10T18:45:31.278Z", "policyExists": true, "approvalProcess": "Board-approved annually"}}	2025-09-10 14:45:31.278679	2025-09-10 14:45:31.278679
8adb1526-1cbd-40d7-bc66-32d629e9b929	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	1	self_assessment	in_progress	2025-09-14 18:40:11.962	2026-09-14 18:40:11.962	2026-09-14 18:40:11.962	[{"title": "Network Security Controls Documentation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 1.1.1: Network Security Controls Documentation", "requirementId": "7684eb10-e4d2-4bc5-9396-ae69bd569e86", "requirementNumber": "1.1.1"}, {"title": "Network Configuration Standards", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 1.2.1: Network Configuration Standards", "requirementId": "139df60f-72a5-4d57-bd8d-2c172d7b8e14", "requirementNumber": "1.2.1"}, {"title": "Change Default Passwords", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 2.1.1: Change Default Passwords", "requirementId": "66399b46-7f7b-4e2b-b0ed-eae7a64d9d7c", "requirementNumber": "2.1.1"}, {"title": "Configuration Standards Implementation", "status": "not_applicable", "category": "network_security", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 2.2.1: Configuration Standards Implementation", "requirementId": "a2fc908f-c4d5-433b-8266-a09ea7c51acd", "requirementNumber": "2.2.1"}, {"title": "Minimize Cardholder Data Storage", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 3.1.1: Minimize Cardholder Data Storage", "requirementId": "c64c1382-9530-4b7e-bb96-2322351bac03", "requirementNumber": "3.1.1"}, {"title": "Render PAN Unreadable", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 3.4.1: Render PAN Unreadable", "requirementId": "896392e7-dd8d-468e-974e-3a72f270d0ac", "requirementNumber": "3.4.1"}, {"title": "Strong Cryptography for Data Transmission", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 4.1.1: Strong Cryptography for Data Transmission", "requirementId": "db94c2c8-ff4d-482a-a9c7-59f1fe26b3e9", "requirementNumber": "4.1.1"}, {"title": "Never Send Unprotected PANs", "status": "not_applicable", "category": "data_protection", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 4.2.1: Never Send Unprotected PANs", "requirementId": "544ecbc1-4d93-42b7-af4c-2585126e686c", "requirementNumber": "4.2.1"}, {"title": "Deploy Anti-Malware Solutions", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 5.1.1: Deploy Anti-Malware Solutions", "requirementId": "1b549a5a-966e-4b98-8101-0b1643d0c36b", "requirementNumber": "5.1.1"}, {"title": "Keep Anti-Malware Current", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 5.2.1: Keep Anti-Malware Current", "requirementId": "205e5a35-cac8-4bbb-900f-d4bdd44c0003", "requirementNumber": "5.2.1"}, {"title": "Establish Vulnerability Management Process", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 6.1.1: Establish Vulnerability Management Process", "requirementId": "0f506ca7-937e-4b68-8c25-c49918d9f949", "requirementNumber": "6.1.1"}, {"title": "Deploy Critical Security Patches", "status": "not_applicable", "category": "vulnerability_mgmt", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 6.2.1: Deploy Critical Security Patches", "requirementId": "85b6525d-8e73-4c25-8e23-0463ab269144", "requirementNumber": "6.2.1"}, {"title": "Limit Access to Business Need-to-Know", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 7.1.1: Limit Access to Business Need-to-Know", "requirementId": "3f05e478-e127-47ba-988e-d09abffe4baf", "requirementNumber": "7.1.1"}, {"title": "Assign Unique ID to Each User", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 7.2.1: Assign Unique ID to Each User", "requirementId": "b3739f4e-aa8d-41bf-9eee-dcf54cad4b41", "requirementNumber": "7.2.1"}, {"title": "Assign Unique User IDs", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 8.1.1: Assign Unique User IDs", "requirementId": "4390dbca-8721-4749-9854-929501e68ac5", "requirementNumber": "8.1.1"}, {"title": "Strong User Authentication", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 8.2.1: Strong User Authentication", "requirementId": "a7f1c128-a0c4-4245-9c79-09ea0e1453d3", "requirementNumber": "8.2.1"}, {"title": "Physical Access Controls", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 9.1.1: Physical Access Controls", "requirementId": "adcb191c-ccc9-41bb-a85f-31cdc0364093", "requirementNumber": "9.1.1"}, {"title": "Develop Physical Access Procedures", "status": "not_applicable", "category": "access_control", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 9.2.1: Develop Physical Access Procedures", "requirementId": "5ff3d6f0-7712-45b9-bde9-304b67a4a03f", "requirementNumber": "9.2.1"}, {"title": "Implement Audit Trails", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 10.1.1: Implement Audit Trails", "requirementId": "bb27cf09-499c-4cc0-b09f-e0694c48934a", "requirementNumber": "10.1.1"}, {"title": "Automated Audit Trail Review", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 10.2.1: Automated Audit Trail Review", "requirementId": "0707a22c-a64f-4bb4-9edf-5d6a16e21e1e", "requirementNumber": "10.2.1"}, {"title": "Wireless Access Point Inventory", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "medium", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 11.1.1: Wireless Access Point Inventory", "requirementId": "5c18c09c-4bdf-4dcd-8349-3c7dc35d9a26", "requirementNumber": "11.1.1"}, {"title": "Perform Penetration Testing", "status": "not_applicable", "category": "monitoring", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 11.3.1: Perform Penetration Testing", "requirementId": "3bf07061-68a0-4677-973a-38e6b95f3bd2", "requirementNumber": "11.3.1"}, {"title": "Information Security Policy", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "critical", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 12.1.1: Information Security Policy", "requirementId": "68c04149-fae9-41c8-8503-281d4c46d407", "requirementNumber": "12.1.1"}, {"title": "Security Awareness Program", "status": "not_applicable", "category": "policy", "evidence": [], "findings": [], "nextTest": "2025-12-14T23:40:11.962Z", "priority": "high", "lastTested": "2025-09-14T22:40:11.962Z", "description": "PCI DSS Requirement 12.6.1: Security Awareness Program", "requirementId": "78707e0e-7779-447b-b03e-5108a341d701", "requirementNumber": "12.6.1"}]	{"networkSegmentation": {"segmentationTested": true, "lastPenetrationTest": "2025-09-14T22:40:11.962Z", "segmentationControls": ["Network firewalls", "VLANs", "Access control lists"], "cardholderDataEnvironment": "Isolated DMZ network"}, "firewallConfiguration": {"rulesReviewed": true, "lastReviewDate": "2025-09-14T22:40:11.962Z", "rulesDocumented": true, "configurationStandards": ["Default deny-all firewall rules", "Restrict inbound and outbound traffic", "Document business justification for all rules"]}, "defaultPasswordChanges": {"changePolicy": "All default passwords must be changed before deployment", "defaultsChanged": true, "verificationProcess": "Configuration review and penetration testing"}, "dataTransmissionSecurity": {"keyManagement": "Hardware Security Module (HSM)", "encryptionStandards": ["TLS 1.2+", "AES-256"], "transmissionProtocols": ["HTTPS", "SFTP"]}}	{"masking": {"exemptions": ["Authorized personnel only"], "panMasking": true, "displayRules": ["Show only last 4 digits", "Mask middle digits with X"], "maskingMethod": "tokenization"}, "disposal": {"disposalMethods": ["Cryptographic erasure", "Physical destruction"], "mediaDestruction": "NIST 800-88 standards", "verificationProcess": "Certificate of destruction required"}, "retention": {"secureStorage": true, "retentionPeriod": 12, "businessJustification": "Regulatory and dispute resolution requirements"}, "dataStorage": {"retentionPolicy": "12 months maximum retention", "storageLocations": ["Encrypted database", "Tokenization vault"], "storageMinimized": true, "encryptionStandards": ["AES-256-GCM", "Field-level encryption"]}, "dataTransmission": {"keyManagement": "PKI with certificate rotation", "approvedProtocols": ["TLS 1.3", "HTTPS"], "encryptionRequired": true}}	{"systemUpdates": {"testingProcess": "Staging environment testing required", "patchManagement": "Monthly security patch cycle", "criticalPatchTimeline": "30 days for critical patches"}, "antivirusControls": {"deploymentScope": "All systems processing cardholder data", "updateFrequency": "Daily signature updates", "monitoringEnabled": true}, "secureApplicationDevelopment": {"codeReviewProcess": "Peer review and static analysis", "developmentStandards": ["OWASP Secure Coding", "SANS Secure Development"], "vulnerabilityTesting": "Dynamic and static application testing"}}	{"uniqueUserIds": {"userIdPolicy": "Unique user ID for each individual", "sharedIdProhibition": true, "serviceAccountManagement": "Documented and approved service accounts only"}, "physicalAccess": {"mediaAccess": "Secure storage with dual control", "deviceSecurity": "Device inventory and tracking", "facilityAccess": "Badge access with logging"}, "accessRestrictions": {"needToKnowBasis": true, "roleBasedAccess": true, "privilegedAccess": "Multi-factor authentication required"}}	{"logManagement": {"logSources": ["Firewalls", "Servers", "Applications", "Databases"], "reviewProcess": "Daily automated review with exception reporting", "loggingEnabled": true, "retentionPeriod": 12}, "securityTesting": {"applicationTesting": {"staticAnalysis": true, "dynamicAnalysis": true, "testingFrequency": "Before deployment and annually"}, "penetrationTesting": {"scope": ["Network", "Applications", "Wireless"], "findings": [], "lastTest": "2025-09-14T22:40:11.962Z", "nextTest": "2026-09-14T22:40:11.962Z", "frequency": "annual", "remediation": []}, "vulnerabilityScanning": {"lastScan": "2025-09-14T22:40:11.962Z", "scanScope": ["Internal networks", "External perimeter"], "criticalFindings": 0, "scanningFrequency": "Quarterly"}}, "incidentResponse": {"teamStructure": "24/7 security operations center", "responseProcess": "Documented incident response plan", "testingSchedule": "Annual tabletop exercises", "communicationPlan": "Escalation matrix with contact details"}}	{"riskAssessment": {"riskRegister": ["Data breach", "System compromise", "Insider threats"], "lastAssessment": "2025-09-14T22:40:11.962Z", "mitigationPlans": ["Security controls", "Monitoring", "Training"], "assessmentFrequency": "Annual with quarterly updates"}, "securityAwareness": {"trainingProgram": "Comprehensive security awareness program", "trainingFrequency": "Annual mandatory training", "awarenessActivities": ["Phishing simulations", "Security bulletins", "Workshops"]}, "informationSecurityPolicy": {"lastReview": "2025-09-14T22:40:11.962Z", "nextReview": "2026-09-14T22:40:11.962Z", "policyExists": true, "approvalProcess": "Board-approved annually"}}	2025-09-14 18:40:11.963159	2025-09-14 18:40:11.963159
\.


--
-- Data for Name: pci_dss_findings; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.pci_dss_findings (finding_id, requirement_id, tenant_id, severity, description, risk, recommendation, status, due_date, assignee, remediation_evidence, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pci_dss_requirements; Type: TABLE DATA; Schema: audit; Owner: -
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
-- Data for Name: security_alerts; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.security_alerts (alert_id, tenant_id, alert_type, severity, title, description, "timestamp", trigger_events, rule_name, rule_description, risk_score, threat_actors, affected_assets, potential_impact, status, assigned_to, escalated, response_time, resolution_time, investigation_steps, related_alerts, evidence, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: siem_events; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.siem_events (event_id, tenant_id, "timestamp", event_type, severity, source, source_ip, user_id, description, raw_log, parsed_data, correlation_id, risk_score, indicators, related_events, status, assigned_to, investigation_notes, response_actions, compliance_relevance, retention_period, forensic_evidence, created_at) FROM stdin;
88cd5be3-3b9d-420c-a2a0-725e2243add3	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-10 14:43:38.946	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-10 14:43:38.947089
dcf75564-8a25-4ff6-b979-1703449f8431	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-10 14:45:31.837	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-10 14:45:31.837704
156dc7b0-9688-4f32-a466-d5e4ef3fc3a8	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	2025-09-14 18:40:12.518	authentication	low	integration_test	127.0.0.1	\N	Integration test security event for API validation		{}	\N	40	[]	[]	new	\N	\N	[]	["CBN_COMPLIANCE"]	2555	\N	2025-09-14 18:40:12.518593
\.


--
-- Data for Name: siem_rules; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.siem_rules (rule_id, tenant_id, rule_name, description, category, enabled, conditions, time_window, threshold, severity, alert_actions, automated_responses, created_by, last_modified, trigger_count, false_positive_rate, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_audit_logs; Type: TABLE DATA; Schema: audit; Owner: -
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
\.


--
-- Data for Name: threat_intelligence; Type: TABLE DATA; Schema: audit; Owner: -
--

COPY audit.threat_intelligence (indicator_id, tenant_id, indicator_value, indicator_type, confidence, source, description, first_seen, last_seen, threat_types, campaigns, tags, active, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: ai_models; Type: TABLE DATA; Schema: platform; Owner: -
--

COPY platform.ai_models (id, name, version, type, platform, tenant_id, is_shared, is_public, model_url, config_url, model_size, model_format, accuracy, precision_score, recall_score, f1_score, latency, throughput, supported_languages, regional_optimization, status, is_active, training_data_size, training_duration, training_cost, training_completed_at, parent_model_id, deployment_config, description, tags, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: platform; Owner: -
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
-- Data for Name: tenant_assets; Type: TABLE DATA; Schema: platform; Owner: -
--

COPY platform.tenant_assets (id, tenant_id, asset_type, asset_name, asset_data, mime_type, file_size, dimensions, metadata, created_at, updated_at) FROM stdin;
d21907d3-6fd3-4e5a-8ee2-00479039a83d	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	logo	default	iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACz6LpGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO2deZxUxbn3v3V6mZ59XxhgxBERCQICIvISMCQaQkwkLtFo3KNCiPF6fb1eLgxGRz5cYxQJIUqQgHGNcSG+XkPUECSKBJFwEQFxWByGYTZ6emZ679On3j/qdE93T8/KoPfG/n0+B7pP16l6qk499axVI/gCcNVVz2tHjnQUBQL6xS6X/1KXKzA2Pd02EgyrrktXMGjsGTIkc29enuPlnJy0HYWFaa7x44uNf//3r38R5KbwJYb4PBv78Y//yEcfNRc1NHjmNjZ6Fng8oTHhsLQnJUyA1ap5s7LsO8rKMteWl2e/VlmZ61qz5nufJ8kpfMnxuTHIpZc+ox0/7pl8+HDbotZW/yxdN7L6+qzdrrkLCtJfO/PM/GUjR+buXbfuSuNU0ppCChF8LgzyrW89S21t64za2vZVbndwjJRo/a1DCIzc3LQ9Z5yRt+Ccc4q2rl+fYpIUTj1OOYNMmvSk5nS6pzY0uJ/2+fTKk60vK8u2//TT866dOLFw51NPXT0YJKaQQrewnMrKJ0x4Qmts7Jje2OhZHQiERw1GncGgURAMhifYbNa/zZ1724m///35wag2hRSS4pQxyAUX/FZraOiY1dzsfSwYDI9h8KSVCATC5aGQzEpPt2w6cODV4CDVm0IKXdBvW6AvmD79t9pnn7VOb2nxLg8Gw2MHux0p0ZxO3xV1dZ7pAKGWPxNqecOqn/jTYDaTQgqDzyAzZ67n009dU1pavKv9fn3QmSOCQCCcU1/fcdMVV7xgD/vrHJ6G925uPfJ2hXP/Y6eiuRS+pBjUyTt16lrtwAHnjBMn3E8Hg+HRg1l3MrhcgQs/+6yt0t/eEGw/uj2n49i2Vf7GD4a59i0/1U2n8CXBoDHIrFnrrI2NHbOcTs/jum6MHKx6e4KuGwUeT2jG5o/GGgjrbt3TPM3vrFnlafrvEU0f3Pl5kJDCPzkGhUG++tUntUOHXDMaGtwrAoHwmMGosy8wDGn1+/XxDa15Wlp+ZYOwpPlDnuY5/hMfLwu768va9z38eZGSwj8pTppBrrrqOT77zD39+HH3Kp9P/9yYI4Jw2Chvbw9a07IqXJrF7pXSsOreE5f52+oe8rUdKvm86UnhnwsnxSAXXbRe+/DDlhmNjR1rA4FTb3Mkg8+n25ub3Voo4PQa4UA7gJSGPehuvMbTsGvZ8b/dWPBF0JXCPwesA33wgguetB450jarrq59RSAQ/lxsjmRIS7O48/MzdGtaZo7QbDmR+1Ia1pC78YdI3X9s0/eqMnKHOfMnrfyiyEzhfykGJEFUnKNtxtGjHY/4/V+M5ACVn5WWZj2SmWk3Qu1H86QRzAGQ5mVIwx70nLjZ33pkka/1cF7zB7d9UaSm8L8U/WaQ//iPt2hvD1x84oRvpRnnGFjDmjAyMmztwICTDoUQwfR02wc3fPNDw9d6qMQIBRxIFbKPXEjDofva5vndzffpAVnQ9tGSgTaXwpcQ/WKQyZPX8uqrn0w/eNC5OhAYuEEuBMbpp+dumDix7NL8fMfWgdaTkWGrz89P2xYOuqzSCH9VSiMjWUKLlEZGyNPyY79z76JAR32f0+xTSKHPDHL++Wu148fbZtXUONd6PKGKATeoCX348JyXJk8uu/3rX6/YPHXq0AUlJZlbheifJBECvbDQ8cysWcPqA86aEt3XejHSsIJSrxIhjbA92NHwE0/LgaVNH/xrTpIiKaTQBX1KIPzmN5+yfvRRy4yWFu9KM/FwQLBYRHDIkKwN55035K5H/+8n9ZnW5iynp8R/x7LTR+/a1fB4c7NvGn1k2pyctF2jRhV8780nj9S6Gz682uc8tFqG9SwAKdWOxGQQFmswvWDkrxz5Z94vCLcXn//rgXYnhS8Bep2Ml1/+orZvn3NGa6tv1Ukyhz5sWPaGyZPL7r71+x319sBHo7xNu5dnhrbNefK+/95/5pmFtxYXZ2yjDzaJw2FpGTo0q3rkGbm1gfaj5SGv8/YIc0TEh4wRI7ESRYZ1u895cJ6nYcePg97mjIH2J4UvB3pkkG9963k+/LB+WmOjZ7XPpw/YW6VpwqioyHllwoTSu+Zf46k7t/yvlb7WI6sCbcdu9Ltql2ve/bNX/6yuZvTowvnFxenb6YFJrFbhHT48Z/nYsUVvrFr4kTXkbrhR97VOjRYwrXMhOhkjUZjIcCgj6G5eGOw4/uPG9293DLRf/5xYYl59LntKklH/p6BbFeuyy57XPvjg+IzGRs/qYHDgm50sFqGPGJG3YdKkkgU/u/2Tphx2jwy4jjwe8rbOAqkBWOyZtekFlQsaQv9n449/VjCypsb5eGurf0bi1lyrVfNWVGQ/etZZhcueXrrf72vZPdfvrFkdDvmLYtUqCQjZQ+/M34TF5nbknrY0o2TcY8XnPervuSeLAOEAUQBCS27pAIq5mwAdcABF5n034IJqoEoDCszfY6Gb5bxQnWSRWAJIB1AJjAHyACewB6gF6YcHgSUZqv5EGgUJ8jSG3gd1da8qy6x7R3Ia4uixgpwKYhs8oMfTaWSByDPbccKDXrN+DSgBrAn0GGb/g6r/IggP9Nx8PC0lIMuA3WqMeywbGf+xIEeYbdeC2A80wQPRficNFF5zzUvWd9+tm9Xc7F1xkswRHDYs56Vzzy29Z9XCT5oCzt2jA67DK0I+V5Q5AMJBT4XPeWhVaQEL1i+btPH2nw1f8PHHLataW31RJrFaNe/w4dmPjR9f/NDaBw74fc0HLgy4jjwSDvmLog1Kc+5HfLzdiZAII4VDWf622kVCsxgtO+/9VdHEh7y9dGkCiMeBnB64rw64CThkll8DZACrQD5qEpABPAJMT3g4CNSBfBmWvKgmVuRlVwGyHMRC4ArUC9aITnC5AcQjsPgIcCGwHESS9ysSPssWkNcCNebNYcA9wB1AQ8/DIUcAdwO3Kxqi9wHtMtSqYgALoWqD2ZciEL8324mlxzD7344auz9B1SZFQ2+MulgDrgAxE+StZh3doMoKzAbuRb2fyCLlB/aDfAiqXoPqICRRsSZM+I22a1fj7BMnPCv9/oGrVRaL8A8ZkvXCpEml997wfUd9yPXRqEDbkRW6z/UNpOzSbjjkqfC3HlqRFf5g9vqftx0YOTJ/fn6+413AsFiEt7Q087Gzzip4aO3P9nl9zR/P8DtrVupB94hoBSIqGKKBwgh/JK6jMuZHGQ5m+V1HFnpb9t3W/OHiHtQtAWrFrwBRCWIEiGGgxVxiGIgyiB5l5ABGqPIUEh1vTQOt3KynEkSFWd9oEN9QE51FKMaKIA94CJin2hBBEE0gvGa784D7QOSY7cbSVRHTVgzdEXojC+VigEoQsxQdPalaizTgMhBTQSZ6NTUgy2yrUvUj+hasagy1WHrMcmKMqk9coxYWsU59r+pFjRNFIG8AvgFiolpMkqEK1OKxEsR0UyNwgmhRi4mYDGIFMCvSZtwKc8UVz7JtW+O0pibPQycjOTRNGKWlmS+MGJG78KYfZDRMLn9jpLfh4OqQzzUjGXMAICEc8FQGXJ+tdFjeveO3/znpjSsX5N4uhFhut1v2FBVlPLT6gaNun7Nmms9Z87jubxsdO/NFDHdE1iQZwzRmE6pcAgw9kOd31ixEWJxN//3gcyXjF+tdS3WxZN4G8XwSVasdRH3ykUkmdWQLsBLwAueAmKsmubwetYq+bbYxDcR31YuUB0AuBPYDZSAWAVNA2E0VbCcwv1NKyxygypxIe0GsBBnZquwlKimEFbWq5qiVWL5Gt6uxKAGuBQpAjIOqHTGqTR9d9rIG5NMoyWEFUQiMMPtSrphUlgM3mH1KgipAXAyMUxNeXgdsN/uV2F4GiNvVgoEO8jcg16rPXAzavSD8IKP5e1EGWbLkLbZsOTqxtdW35mQ2OwmBUVaW+btzzim5d97VrqZJRU+P8DYcXqv7WqfT03E/5kwOB9wj/Cc+WZVfbJ1fdddFG194Pe8GEN57FmS7bb5t070t+9fq/rZRSU0MqZgiUYmI+yyS2ydGyFsScH5aLYQ84tr3n1vyzv73JATG1ij3gPwdCKNruZ4MoC5oB/kcSq2wAgdB3KdsHWaC3GSWm2CqZgawGtigVI8le0EeUaswO+ic0Edi5mk5aHeh7KF6MJ5RkqcLHCDOVXSIKSBnweINyq6JRRXAJSBGmUx5nhoLzIVF9NFwF7UgfgmGSbPUADswEqgGcQnKHloKi6+EB91JKikArotRlS4BHk9g2Eh7OWZ9mlKFjWoQETVyP8idKFvkCObgWQFuu+1V/vrX2pJ9+1qWejyhk2AO4S8pyfjdxIllC9ctfsfpb/tslPdEw+O6r306vbmUY1b7cMBT4Xd+uuKb5w3/9jW3PXKgcet1hAOBKb6WmnW6v22kWbzL85H/ogZ7IsPIznaikiamonDQXRFs++x+j8XyA3rVvwEwujckk4n5ngz7alMHr3pXrWJkEK+np9E5hjGq4AOgmOtQ92RWGTH1xD6XAJEHRDQHB4hbgbdRjoNYFIC4IWZSjgWRBbi6pyEZhEFn3yFqqFftBnkHyl6ZBmIGGLNM2yDm+UUodZCp6jnpNSXbDSB3EWXYKDQ67TKrYm6BORZBYBNdHwCn02f97LO2K1pb/Rf2r4MxXRXo+fmODUOH5ix8ouoTZ9DrGhdob1ip+9svJJE5Yg2E2Doi/1ssXos9+xWMQF3De9dpgbZjEzxNe1aEvM4+nasV8WaJBGkSa7jHMUcMLbq/bXrI3big5cN/7c3AtatJsSSj69WdztytVNHgPkyd3/TwYAAt5u8GsA9lSGrArcB3oSqje327JyRj1CWYRvewGHqnA9Pi26jSgFlKrYpiJFAe8/0kD/WrBqgDnkX1OQPEN+niVLLkANeaKuEBkC+ptsVlIJJlmLuJLiSiDMRS1ecqrbtx1ADq6z0VbW2BW8NhOeCYgMNhPVRRkVO9/pcZTuH7ZLS/9eAq3d/xDWmgJX0fMZM1ll+EZvXaM0sfSy88c6mBzR9yN48LdDStCge9U+JUtCR1ShkfIEwKM0bSnR4mw4Y15HHeHPQ0TXAffrKnmuYoG0T8Pv5iBfGTpTfYgdEgp5gv9i51T/qBv6NWWIBNYGxW38UIEKtRxvxUqEp6vnH/IAHGAjkg3eoiC8RNxDkLZA6Ia9Vv0m3SWaD6EJ1kgxEbMUBuAxmRSmNQY2ViCShbZboqy2sg14FsUu5eeZ3p3YqFG+QaVQYNxNXme7sZKE8W09HmzHmaI0faL+zoCJ6U3VFcnPHS+PEl+0sdHxcEXEcfCXlbp4HUukxG6FRzYtQiAQiLNZiWU/5EeuEZD6VlV7QHnAfHBdrrVxlB91RASzqpZfytJLfV94QbMnIvMeIuIBzylYXcDdeF3MdiXkhiDEFUovTwmItLgFlANwmRSVeKctDWgfgv4GlT99dRL3xTzOA1gbxLuXNlUKkS4jbQXgWWQ9WYJBOiGySVZFYQ400VZI9yQkhTWjBOTf7FgJgIzEAxwdum/WNVtkvE9pCDcCxsNagYT0S9KyFOtZQZwHWoeE8T8DywE+QWs49Xq7GNq9MA3gB5j3IQRGwtsQLEH0HebMaBotDS0y2OcNj4pmEMXHrYbJp7+PDsP/7ipzuMQMvub4S8zXFxjr5AaJagLb3gUUfROdW2zMJ2d8OOcX7XkdV6oH1qj2f5xrmoYj7LhOmcbE4klO/0cEkt5G6c5TuxrzPG0pXljgBvJLk2o1aqHhqMq8cAmQcUKQ+U3AHyPpB3A85OW6Ea4ADIW4A7Y3TsMtBuUyuhNgcWD3QTXA4wwfy8FyUJXSCKgJsUbSIDxHUgCkA6gcdBHEIxy2QwMrrv54CQyGjmPFgMyu6ZY95/HeR+CHpRalk7UAF8v6u6W+0HngP5PTB+i/IiOkBMBm2F6ndVmdkGms0mcwzDmHgyvbBYNKfNZjkkpN8a9jvPl4beq8iPEwaaNejIO+13WaXjlxFua/c27VXM4W9XalUPalP0JxEvJZIJrsT2ReyHhMJh3T9CGqEJntpnu6vxNeBK4PLOS1wOYgHdunmTYj/I15XUEKCkyC+gur6rF+ZBoNoF/AbkpWDcA3I3Sl0YCzwCYvTA7BLKUS5WHeRHSr1ho1roxHdNnX4scLFZfiPIragoPiBHm8xED86I/iKLTrXKizKkMaXcDahFxQ/yY5DjwD4ZJXHqTKl2XVcpAlCtQ/UekAtAXm564FxABmg/RAVKHQCarhs5fn8472R6YbEIPTtbMwzdqxky7OjP+AjN6rfnDP9devH4hdbCSe6Qt22iv+3Y47q/Y0pnoR6eT/K5uwBh78R0fpRGOEMPesaEvMcjakNCjVIHwws/88df9/tVqkKfV1EXsAzlotWAu0BOjqxgyfGAAdW1wK9AXhmjVow0Vb2B2ACVqGCkF9iNigesNekrAa4C8QNl3OIE1qEm499N5i5BMRiDI0GqUMweSVfhEMpgN2kVl5ltOUC7Hyx/Vpf2BxART9xoYHb3TpMH/aBtAe5Qiw1OwI6KRVUAaH6/rhlG/9ShROi6zAoERB7ComsW+2eIxNhAcghN89oy8n7pyDt9obBZWzxHXhsXaK9bEw54lM0xQAjoEg8BknvPYtSxuJ+kBCNUaHXkaZ21dhdhOWkcMNWqBtMAr468oHhUWVX+UwTVhvnsSuXiRAPOot9jtwTgfMChaOCQkl5iG7BZ2RbiRuAaVV5uArnd/LwfNbEcgLmondx8MuvIAa5CSREd5Hvq/yorysVcRmd6itVsP3Lp6hIOlJcrRlVeAixxdGYJ3A884EapXVvN92yqvKA5HPag1SpO6gDoUChccPy4e6I993TDnjtio8WW4YKeV3ChWfy2jMJf2rOKl9rSbC2+hg/H+F2HV+u+1nH04QUnrTtGXUo6fbtxGMRG4DvVNAlSalLqnd+TJv8NBgQoH/xDKC/VdBD3KjcuKKZYMgNYB/KaeBWqGuL9/f7ejeQuo+dQxrcAqEVNeIh6fXCj0lJKUBLFlB7VoHKwak0D/bzubaD+jFWVA7R5po2hmfbea6i4yTBULhqmvfYd4Ovxl/w6yF+ZlU1GBTyBqhKQP1WSUQ5LSKWJJEvGfbYKobnS0qz1ECzrRw/iEA5Le21tx6VX3jHk9RceG79Xd9cv97tqqzDCSQ1/YbF4HTlDH8soGbtUaFn+QNvBKYH246vCQd/kvrbZU6IusRumugtqJ9yPjZ2o/zVDs9qPyWBbkrSTuNZ6+K2vk0Ki9OIlT4C8AMQVwPXAx1D1G5Tqcz9oF4KcDtSrSDE6UGLaPRmo1fTvdInuJ6ILXQWmWmIAu4mmaTyAClzKLeZkNcDYAmyJCe61m89MRqk0kQzjJH3sci8H5ERY4kYtinaUqvc9ELNREq0d5FKQtaqM+D6IStP2WAdsis2+7cQSJ8gfEs3TEhuB6SCWme34QVZDVYv5fTYww1wI61BxGDSfT3cLIbZyksEdny84u6nJM6d6zRgjo/icX6flDv+VZktzxm2lFRiazdHiyBvxC0fhmUutmSOCwY6j032tB1f3hzmSwoyBCBI8Vt3N0VivbbKgpWZ1C4tjF9bMmAeSiZ/u0J8VM1L2AT/IRSB3gsgimmMlXcDLSo0SI0C8DOK/zP//DOIbqLjBTlP96UfbVYAcBZShJs0/iJNIoh1Yi7I32kGsAy02sh4EPlTPiArQ+nME1GSzH++Y119U/WIuKhbUoCaxfAEejEiPa1Eq1SHg9e4zfeUhlCPFADEVxRxbgZ2dKqN4yxzD/wficZR3zgvyWZTrGK2oKEPPzU17x2bTekv17hHBoFF05Ejb/Zs3H52w+MmvtmeWTbwvvXDUTbas0t/Zs0p32rNKdtizhjyXXnDmDRll5y1z5H3F72v5aIbP+ekq3edS7sU4GzjeK5XMdRuHbuaj7O8zZmHN5jigWWx7c874SewPhrk660qN6dNENPXh2AVIogzbxPsAHDInRb1SacRSoAzkM0ptkC5Uuv00EBcrw1zqyusk7wXquuZOReiQ5hU3CBoqKq6ZddfE//4AqJjIDiVJ5Galt0dQDci9KAayg4zddRrpYze0YKhnsBPNHpBeJS2Ml8yV/5eA3zS0ZwOVIIMgX1Jj1B2kbk70FnOxuQ6kE+RCsy+G6dS42BzLHLP/vwJ+C5pSsdavv5zp09dsO37cvScUCk7tvsHe0dYWGHPwYOtqm00svPfX0zY//FP76+Gs8jctabk5UuqGNAyvZsv0Ck2zdxx752J/W+0jYZ+rc0ATVv4uaSJ0ywdRGyLyOa6OZDlZkcoSNSEBCE23pRf8IS3/zMTcogMgzUg3e/rAIAeAO1Dp77uIMoP0o+IMfwAa1KSIoNqAqjdRsYdhqAlmVS9P3A/yHZCXmiqR1Xz+r8AbIGqTqxu0K8lEFlBPZyYvRCPWzEdN8r1JkvzaQa5AbWRKlt27C+R8VMR9FxgGaJuBBWaft8WUdQGLQCYGU3VVv3Sh1Js69T3SnypQ2ct3mDbW26ZU6Qlmv2SeGgM0YCtq/8slwEyUh85r1v1fwBYQ3kj8SQDMmvWUdvhw6211de3LQyHjpLegpqdbG4YMyXqmvDzr1fPGduy/+5a2oEV2GIav0SGlURn2NFwV7Ki/PhzyD9rZuRH1KjLpJUQTFoncjxZOuJfAQFZH7q7M0nO+48gbWZc/7mcxD8Yax5JuVuoYRIzASIMaavWN1BPLobHJg/cRFZld2loMysdvR8Uogp2rcXc76RYT540A4stWxdCRSEu0jGl8VyeRCEti6o3UnRiLqY4pG4uktgldxzZxLPs6/okv+wHM8dDo9H5FdjLqiWMYnTaXXfZcyfvvH1tz/LhnoH70+IoFOBxW58zzg7sf+Zd/tDtoRoZ8JYahjzZC3pwu+0KS2LRdbpkTma5Fu6uiRyQrr1nTWhyFZy3IHjb9xfwx/9aP2lL4Z0TUJVdcnNlUUZG3qKMjWOl2hwZ8YmIEUkI4bNiPO/O3WS12T7jjxN1GONR9QDLJzO5yqzv3bWL5PnJKF5PbYnOn5ZQ/7MgduiHFHClAjKRYvfpSKiuz9w4blnt3dra9h70FfYPNprWXl2c/VnFa8bL88lE/d+SPuF+z2vu5X6CfiNFKugjuZGGMWAjNb88sfMKRf+ZvHNmnpf4waApAknX2Rz961bpzZ8OMQ4dcj7hcgT4F7RLhcFicw4Zl3z98eM5vv/3t093NzV77T77zthZu/fDmQMfxpbInSdJHJBUSkZuJiYu9SROh6fbssufScivuduSWtxSe+2iSQksgekhCoo5+nzlG95tG4xJNNdzbYQP9wWJQMY8K1MEOTcqj1tsJHl80Yu2f7jaX9RdVGlBuOhtaejfWq+jfOC0GtVkrp8ufgd658/fG9dfPPxwIyL8Yhiz2+/XTwmGZ1pdqNU0Es7PTPj7nnOI7Z84sf0bXtfC2bQ3Tt26tf/iZ1wt3f+3/WN4qKrR6w8H2qdLQHdB/uyGCbiPlkTp7iYV0HhMkdFtm4YtZQ869c8j09Sd+vvr9blr8qoZK87bCDCeY6U9qApyrPE5bjsESO8h5wEUwcxtsCfe/d4n4D0AbA9rLIOYD6SDOBybAzA9hyyAy4mBisYbaT3Ij8E248EKYmQYzjsKWHgKwvWFmOogXQIwH4034WzdjvASYOQXEPLPNmABmFTDTqhxZWxJ0ixkaiMUgliaVDg89dAnvvvujmssvP/PWCRNKry0uzngpPd1ar2kimHiGrhAYVqvmz8mx766szFt67rml37roouGvHTzotu/d2zJ3z56mtUePtl9WX9+x7ocLR431OL72RFrO0Hs0q70F4v0q/UY3nBU5NE72UgYhdFtG3ivp+affWTr1iSTR37gnNODbwNXEHacjHKgdfpEjfOwgJoE4j5P4+yvx0EAx5whUuvuzqn4xfvDaOBXQNBDfUUE5JgNzUeno1w8w4zgWkbyrHiBBbbS6ja6b2EaioupJApsC1HvM6HFwV6z4rnfZsr+8/te/Ht3U1hYY1dERnCKE/EpLi7egvT1McbFDz862N1gsln8UF2dsHzUqr2748Exj+/bmin37Wm6tr3f/KBAIlwF4vaGJTU3uVZfcnH3ni49NfqYwK2AEOxqXGeFQ1NWbKE2SSZe4c3cTOCvWodeThqUkjGbYs0o32rNK7k7LP6uF3pEBYgpqg84LUFVjiu0xqN2FO6DqUZBuEPegNuPExDeqIKqiRdygEjoPOIi5H1uOyPcMVBxih1Kv5O2o6LW/050pI2WJV7+WQDSBUBidsckHSZioCbREsDiGpgcT7okk5RMh9oO8Uo0dr4K4FOR61B58k7bE9JhYV3GkX9KApYl1m/9X0VWN6043qQK1X+Q24E+w5ICZVhPpZ1Rw9Lr6nH12GiUlQ/0nToR35+dn7na5/NZ33qnVPv7Yx9e+VszYsaX60KGZ+j/+0Ww9fLit7P336+ccO+a+xen0TQiHo+dDAWg+X2jK8eMdq66797Q7Xvx583OZWYYW8jQvNXTFJH1J5OhvckcyRhFCGLbM4o3pRWPuchSPr8s/66e9jEIVqOzOSlRg6RLgl+YWzStRq9M4IA8MN2hjUStQk2m7jAZ5MYhSkJ+oQ9SYgDq5pEg9J55T+UNcApwDss08OG2XKsv5KCb5PiqxcRgqNWQLKou2yGTIaYrp5EaVryUM1T7fNWMn21W7ci9U7UedE+U36TgXaAVeUQfQaZrqs5wNDAUOwpKXUAG9qSipZgM+ULRWJ2RjRI1CM+tW+kHoIM2/C1PlQJ1ldT6IRtTeljKT9iyUVD6CShUpBfEPWPJGV52japiiRe6Hql19sP0qgIvUO+IikDVQ5QLmqLHnIIqZe2eQxkYfW7c2Xrx9u3NkcXHm/iFD0uuGDMlol9Lwt7b67O+9V1dSU9NW7nIFZ7rdwTltbf5Rut7t7kTN6w1NrK11rb7kJ+Ov2/Bo6Jm8bKuSJO3CvPcAAAtYSURBVHqgb0HDHlJK4tS1hHhJ9DEhDFtWyZsZRWMW2LIrjvTOHFGMQk3QIyCuVVJEZqHyho6gEv5GAAdA3K6it3KzKXVWmqpYLYgLQe5CnRgyB+QelNG9EbgHxNXAIVTK9a3AApBjQMxA7fpbgJIk5skrcisqP+kK9RwtwERzlb7cXJ2fQm0cOgRciTqkrVrRw12oXCwzci0mA5NU23I06gC3LNTW2lmoPLEx6nlZB/hB3AxyOSz+ZecRpnGjPgrEsyjDugCVDWwA14O4X/UDN3CnOcY7zbFcadLVgMoVm4c6xfGNmPdiqkoyS/3Wp60WI1EJoXbgMuAd4AIQP1Hvj1moAyz0Xhnkgw9a2L27Y+fx494rDx9uX2qzacG0NOEOh6XfMKRd18kLBMIZum7Y6ZvHS3O7g+N03VhzyU8nzv/D8uJnhubt1v1tRx82QiaT9NEwiZcKMd+7e1Zouj2r7O2M0nG3l13wRG0faI3SbE70epCrQNwHfBc1YXNAVqsXLSejBjgSpbWrFAyhgbxK/SaGoSaDhkoVv9b8f4450RYB61EHwq1BnW1znWI4cTsq09Wp7kXH2woiCNyrJIScZ9JYgdppOBLkTSjJMwvE0+pZGXk2cvxoO2pSTjcZdIHZvyuB/WCUo7KG70RN2mWoCPQdwC3KcCYmPyoanfeCsQu102+O6rPcD+IGVa+8FsWcK9Q4RFQqYQf5MvAYyJEg/gScB2w0GxgB2kqz7O1ATbyK1W0q97tqrMRTwELUwrUctV/9TlRKzjpgVK8T+sknf4DDkdaUm5u+yGrVXnK7gzktLYERra3B0W1toUqPJ1Sg64aDfrqD/X59ckuLZ9UV/zJ8XKN/wguOvBH3ajZHS7Rfsd3pJuEwwkeRpMZktkZnYU23ZRRsSC8cvSC99Nz+MAeovk1CTf7XTTVlPspDswmVNXoEOJ/4Q9McIEajtqUeUPuhtRo6z49qUJfwE90FJ1+B6nZU0uC7KMnlQDGVjkolT5ZY2qBUheogap84qBXydPWs2AnVblTelNl+dMRqTFq8QBMqlcWK2mJbA+xXtD94CLXyl6Mk5l2mvVWAYozutlrXgVwK4g7gRVTS4WSUWrfTbNsF8m/E5YlJv5K20ttZJrYNORqYCLwFHEruRk42cx4MmnUZ5v85QB7IDwAnKglyN/RxUr///s0UF2c3FBZmLcrMTHuG5Bma/YXm9+tTWlo8K+f+ZOjY5uD4F9JimSQGXc63iv3N/L3LzdjkRSGC1vT8l+y5p99jyyw+lFt5e39pzUHp8QdQL2odyvtRAjyFkgB7TdUjNgkvaJavAPKU/z6cR/QYHRGMeQUNqC9jTT9/jqn6tND14LZkMIhulBKRrGOAE6h9FUWqXjGMrqeuJHufBmrSl3c+WxX5y1xuYBvqeNKbQK4Gfk/cAdaJEFbUoRSR3X1es55ylL1mBXE2cWq/wJSMsd9j69wGvATcomy8xK21ceUdMWeXJWhOoh1lhw1R7YsM1Dvru4twx46bOf/89Q1paZZ729q8JU1NntlSnrSLUQsE9CknTnge/95Pht6y+Sn/M7ZMjzvkbnzE0IPDen88AUncWELTgvbsIS/YM0vvtWaVNxRNfGggdFaiDgj40DQyN6HOf3WiMmF187eLiTt4DT9q4jyMYqrdZl0xrhhhmAmMbwI7TDXjDXMizwJ5PyplO6GjfYoeGaYddCewXNUvzdTuRHTRaw2QTxE9RJpdqEnzCMjXQfzQHIsgiNmqHV5IToYcDfzBVNtGA2+iMm03o2IkK1FMOpce/7REl/suMJaittQuB5rijxyNTogs1BlikUzktSj7K4I6YDuI61HHCeUpWxFvl0BhTzh2bAMnTrzhPeOMy9/y+UJl5l+c6lcdSSB03RgaCOjTfv/n0nfPPW/E5tMr2GsEO6YZeiC/L1NBmv8IgUpmND9rFpvfkTt8ZWbZ+H8rm/6U8xdP/n2AJM4chlpRX4bqNpgZQJ1T9TegRrk+ZzqBfBQTBIDPQGxV3iI+Q3mizlZeLPFnlH1SC/wd3jFgSwfM2AhiCMpjpQPLzEmqA9moVXcTSjLloU5b/AeQCxwH3oMtQZiRDtICbAZjN4gDKBXxNFRK916Q7wMHlW3DJ6oeIVG7/FpRKfR7gI9RaszZKF39NeAv5nhMRW3D3YAaBFdnABVUEI4ClGfMhVJDn1f9qm6FmTtQWwEi/X1atcEmk/lsqD0ozaaekI9SyfaZn/ea9sQ7KI9gvqJ5iyl1LoTOQ+/qgWbz2mW+E7tqq/oYzNiOcgRMRknzP4I8PJAgNt/+9vN88klzSVOTZ1lHR+CHUnare/YLGRm2nWefXXTn4n/N2zZl6IYpfuenj4R8J6bQx0MlYmMkms3R7sgbsTSrfNqvC8Yt6YuK0gMivvrYOEBiOkkk1iAiG6m0zt+qAGnq9TKoUiOqEspE24oY+AZIvbO9SPnY+uNiJ8T/LZFI2ah/325KHlOdkmZfompJQhwm8uxiFD3CCgQ76V2smWoRgN7NPhTi1Z4I7dWJv1uJbkQzzHiHJWbME+NDJPQ/rp2EmEy0P8RIIMP8nqwOu8mcOqANiEEAZs9+hoYGd3ldXftDJ054vz9YTJKdbd995pmFC749i63zvvO3kYHWmnt1n3OuoQcLenvWlDaGxZ5Za8874+GMwpHriyc/elI7JVP4cmPA6lFNzStcf/2CjuPHfe8FAvowU9066X0kwWC4uLXVf87eA3ygZZz28dTxvs2a1b4P5DAZDpUijW5p1ixWrz2zaJMjd/jdjsKxG0omPxw4WXpS+HJjwBIkgssu+wP79jUV1de3L29vD1w9CIY7AGlplh0FBVm3lJZm7/7rc60E2w6VBTrq54a9zd8LBztGGUaoCGnYEZouLPYmiz17lzUt5/n0otFvW+1Zzvxx/9OzXFP434CTZhCAn/70dTZtqi05dqx9qcvlv36w1C273bI9Ly9jQXl57s5du35k+E+8Sbij3u5r2VlkGEalEQwUWR2ZbjRtb3rhxBZrTmUwLX/aYDSdQgrAIDEIgHlKfFl9fcfStjb/YBnuhmKS9DsKCrJ27t8/L2oIeo+/BnoIiz2dtNI5PdWRQgoDxqAxCMDs2U9TU+MqaWpyP9zREbhmkNQtw263bM/NzZhfWJi5a//+eYNQZQop9A0nG8OIQ03Nq1xwwbUeKcXWUCg8PBDQz+bkDXcRDsvycNiYlJZm2TZv3p1N7733bO9PpZDCIGBQGQTg009f4ayzfujJydG2+P16id+vf2UQ2hHhsDE0HDa+0dwc2HHzzXfUv/vuMwPeZ5VCCn3FoDMIQG3ty8yYcaPX4wluC4dlSSCgf0XKk28rGAwXBoPh6Y2Nvp1f//pNx/bseTHFJCmcUpwSBgHYs+dFZsy4xWOzie2BQHiI36+fPRhMEgjoeRaLJoqL09/85JNXBiNpMoUUusVJB/Z6wssvX86555Y2nHNO8d2nnZa73mo9ufN/NU3oBQXpG4cOzV5htWqpo3lSOOU4ZRIkgh07nufGG+d7hbBsDgQMl9cbGqfrRib986AZGRm2xoqKnCe+8pWifz/jjPzDzz///ZR6lcIpx6C6eXvDlVe+YK2paZ14/Lj7rra2wMV+v57X0x/o1DSMtDRrS16eY2NlZd6qs88u2Pnkk5el1KoUPjd8rgwCMH/+Bmpr3VkeT3DqoUOuizo6ghN13RgTChlZUkpNCBFMS7M4bTZLTU6OffuQIZlvZWen7Ro+PMe9Zs3cz5vcFL7k+NwZJII1a97jz3+utXZ0BHPCYWNYOExJIKBrQghvVpatQUrRNGRIhvfCC4fqN910wRdFZgpfcnxhDJKIt976CLfbjxCSuXOn9P5ACil8Dvj/WYd8X9Z1ED8AAAAASUVORK5CYII=	image/png	11186	{"width": 200, "height": 72}	{"source": "https://firstmidasmfb.com", "description": "Official FMFB logo"}	2025-09-04 21:37:35.50616-04	2025-09-04 21:37:35.50616-04
\.


--
-- Data for Name: tenant_billing; Type: TABLE DATA; Schema: platform; Owner: -
--

COPY platform.tenant_billing (id, tenant_id, billing_period_start, billing_period_end, base_fee, transaction_fees, overage_fees, ai_usage_fees, support_fees, subtotal, tax_amount, total_amount, currency, status, due_date, paid_at, payment_method, payment_reference, usage_stats, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_usage_metrics; Type: TABLE DATA; Schema: platform; Owner: -
--

COPY platform.tenant_usage_metrics (id, tenant_id, metric_date, transaction_count, transaction_volume, failed_transactions, api_calls, api_errors, average_response_time, ai_requests, ai_processing_time, conversation_sessions, fraud_assessments, storage_used, bandwidth_used, cpu_usage_hours, memory_usage_gb_hours, active_users, daily_logins, unique_sessions, features_used, created_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: platform; Owner: -
--

COPY platform.tenants (id, name, display_name, subdomain, custom_domain, status, tier, region, compliance_level, database_config, configuration, ai_configuration, branding, security_settings, billing_info, compliance_settings, created_at, updated_at, created_by, last_modified_by, brand_colors, brand_typography, brand_assets, database_name, database_host, database_port, connection_string, database_status, bank_code) FROM stdin;
c7afab8c-00fa-460e-9aaa-2999c7cdd406	system-admin	System Administration	admin	\N	active	enterprise	nigeria-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"enabled": true, "services": {"documentAI": {"enabled": true}, "fraudDetection": {"enabled": true, "sensitivity": "high"}, "voiceProcessing": {"enabled": true}, "conversationalAI": {"enabled": true}, "predictiveAnalytics": {"enabled": true}}}	{"appTitle": "PoS Admin Console", "companyName": "NIBSS PoS Admin", "primaryColor": "#1565c0"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.277726	2025-09-04 19:44:07.277726	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
71d9f3d7-b9c6-4e24-835b-982a557dd9d2	development	Development Environment	dev	\N	active	enterprise	nigeria-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "offlineMode": true, "biometricAuth": true, "voiceCommands": false, "qrCodePayments": true, "bulkTransactions": false, "advancedAnalytics": false}, "businessRules": {"operatingHours": {"endTime": "18:00", "timezone": "Africa/Lagos", "startTime": "08:00", "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}, "monthly": {"count": 1000, "amount": 5000000}, "perTransaction": {"maximum": 500000, "minimum": 100}}}, "paymentProviders": [{"id": "nibss", "name": "NIBSS", "enabled": true, "priority": 1, "configuration": {}}]}	{"models": {"cloud": ["fraud-detection", "nlp-basic"], "offline": []}, "enabled": true, "services": {"documentAI": {"enabled": false, "supportedDocuments": ["receipt", "id_card"]}, "fraudDetection": {"enabled": true, "thresholds": {"low_risk": 30, "high_risk": 80, "medium_risk": 60}, "sensitivity": "medium"}, "voiceProcessing": {"accent": "nigerian", "enabled": false, "languages": ["en", "ha", "yo", "ig"]}, "conversationalAI": {"model": "gpt-4", "enabled": true, "maxTokens": 500, "personality": {"name": "AI Assistant", "tone": "professional", "greeting": "Hello! How can I help you with your banking today?", "description": "Your helpful banking assistant"}, "temperature": 0.7}, "predictiveAnalytics": {"enabled": false, "features": ["balance_prediction", "spending_insights"]}}}	{"appTitle": "Dev PoS System", "companyName": "Development Bank", "primaryColor": "#ff9800"}	{"mfa": {"methods": ["sms", "email", "totp"], "required": true, "exemptions": []}, "ipWhitelist": [], "fraudPrevention": {"actions": ["review", "block"], "enabled": true, "riskThreshold": 70}, "geoRestrictions": {"allowedCountries": ["NG"], "blockedCountries": []}, "sessionManagement": {"timeout": 1800, "deviceBinding": true, "maxConcurrentSessions": 5}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.277726	2025-09-04 19:44:07.277726	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
daa800d6-7ffb-420a-a62d-5e4653638e47	bank-a	Bank A Demo	bank-a	bank-a.orokii.com	active	premium	nigeria-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": false}, "businessRules": {"transactionTypes": ["money_transfer", "bill_payment"], "transactionLimits": {"daily": {"count": 50, "amount": 200000}}}}	{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank A assistant."}	{"colors": {"primary": "#1E40AF", "secondary": "#3B82F6"}, "logoUrl": "/assets/brands/bank-a/logo.png"}	{"mfa": {"required": false}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.292787	2025-09-04 21:22:31.292787	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
30371b03-f729-488e-b06c-b2db675ab6b3	bank-b	Bank B Demo	bank-b	bank-b.orokii.com	active	basic	nigeria-west	tier1	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": false}, "businessRules": {"transactionTypes": ["money_transfer"], "transactionLimits": {"daily": {"count": 10, "amount": 50000}}}}	{"model": "gpt-3.5-turbo", "systemPrompt": "You are Bank B assistant."}	{"colors": {"primary": "#DC2626", "secondary": "#EF4444"}, "logoUrl": "/assets/brands/bank-b/logo.png"}	{"mfa": {"required": false}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.297288	2025-09-04 21:22:31.297288	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
dcb42e6a-b186-4616-8211-95983c32c9ee	bank-c	Bank C Demo	bank-c	bank-c.orokii.com	active	enterprise	nigeria-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase"], "transactionLimits": {"daily": {"count": 100, "amount": 500000}}}}	{"model": "gpt-4", "systemPrompt": "You are Bank C premium assistant."}	{"colors": {"primary": "#059669", "secondary": "#10B981"}, "logoUrl": "/assets/brands/bank-c/logo.png"}	{"mfa": {"required": true}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.297935	2025-09-04 21:22:31.297935	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
6ce598f4-9cd7-4422-95f0-4641906573df	default	Multi-Tenant Banking Platform	default	orokii.com	active	enterprise	nigeria-west	tier3	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cardManagement": true, "advancedAnalytics": true}, "businessRules": {"transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 500, "amount": 1000000}}}}	{"model": "gpt-4", "systemPrompt": "You are a helpful multi-tenant banking assistant."}	{"colors": {"primary": "#6366F1", "secondary": "#8B5CF6"}, "logoUrl": "/assets/brands/default/logo.png"}	{"mfa": {"required": true}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 21:22:31.29844	2025-09-04 21:22:31.29844	\N	\N	{"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#8B5CF6", "primary": "#4F46E5", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#6366F1", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Inter, system-ui, sans-serif", "primaryFont": "Inter, system-ui, sans-serif"}	{}	\N	localhost	5433	\N	pending	\N
7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fmfb	Firstmidas Microfinance Bank Limited	fmfb	fmfb.orokii.com	active	enterprise	nigeria-west	tier2	{"host": "localhost", "port": 5432, "ssl_mode": "require", "backup_schedule": "0 2 * * *", "connection_pool_size": 20}	{"featureFlags": {"aiAssistant": true, "biometricAuth": true, "cryptoTrading": false, "cardManagement": true, "loanManagement": true, "advancedAnalytics": true, "investmentProducts": true, "internationalTransfer": false}, "integrations": {"bvn": {"enabled": true, "endpoint": "https://api.nibss.com/bvn"}, "cbn": {"enabled": true, "endpoint": "https://api.cbn.gov.ng"}, "nin": {"enabled": true, "endpoint": "https://api.nimc.gov.ng"}, "nibss": {"enabled": true, "endpoint": "https://api.nibss.com"}}, "businessRules": {"kyc": {"levels": ["tier1", "tier2", "tier3"], "required": true, "documents": ["nin", "bvn", "passport", "drivers_license"]}, "operatingHours": {"end": "22:00", "start": "06:00", "timezone": "Africa/Lagos", "workdays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]}, "transactionTypes": ["cash_withdrawal", "money_transfer", "bill_payment", "airtime_purchase", "balance_inquiry"], "transactionLimits": {"daily": {"count": 200, "amount": 1000000}, "monthly": {"count": 2000, "amount": 10000000}, "perTransaction": {"maximum": 1000000, "minimum": 100}}}}	{"model": "gpt-4", "features": {"goalSetting": true, "budgetAdvice": true, "fraudDetection": true, "spendingInsights": true, "transactionAnalysis": true, "conversationalBanking": true}, "languages": ["english", "yoruba", "hausa", "igbo"], "maxTokens": 1000, "personality": "professional_friendly", "temperature": 0.7, "systemPrompt": "You are FMFB Assistant, a helpful AI banking assistant for Firstmidas Microfinance Bank customers. You help with banking inquiries, transaction assistance, and financial guidance. Always maintain a professional, friendly tone and prioritize customer security."}	{"colors": {"info": "#3B82F6", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}, "layout": {"spacing": "16px", "borderRadius": "8px"}, "logoUrl": "/api/tenants/assets/logo/default", "tagline": "Your Success, Our Business", "faviconUrl": "/api/tenants/assets/favicon/default", "typography": {"fontFamily": "Futura Bk BT, Verdana, Arial, sans-serif", "headingFontFamily": "Futura Bk BT, Verdana, Arial, sans-serif"}}	{"mfa": {"methods": ["sms", "email", "authenticator", "biometric"], "timeout": 300, "required": true}, "passwordPolicy": {"minLength": 12, "expiryDays": 90, "preventReuse": 12, "requireNumbers": true, "requireLowercase": true, "requireUppercase": true, "requireSpecialChars": true}, "fraudPrevention": {"velocityChecks": true, "behaviorAnalysis": true, "deviceFingerprinting": true, "geolocationValidation": true}, "deviceManagement": {"maxDevices": 5, "requireApproval": true, "trustDeviceDays": 30}, "sessionManagement": {"timeout": 1800, "requireReauth": true, "maxConcurrentSessions": 3}}	{"plan": "basic", "overage": {"userFee": 1000, "transactionFee": 100}, "currency": "NGN", "invoicing": {"email": "", "format": "pdf", "frequency": "monthly"}, "billingCycle": "monthly", "paymentMethod": {"type": "bank_transfer", "details": {}}, "transactionFee": 50, "subscriptionFee": 50000}	{"auditLevel": "enhanced", "dataRetentionPeriod": 2555, "encryptionRequirements": {"hsm": false, "algorithm": "AES-256-GCM", "keyLength": 256, "rotationFrequency": 90}, "regulatoryRequirements": ["CBN", "PCI_DSS"]}	2025-09-04 19:44:07.491134	2025-09-09 00:25:33.241994	\N	\N	{"gold": "#DAA520", "info": "#3B82F6", "navy": "#010080", "text": "#1F2937", "error": "#EF4444", "accent": "#FFFFFF", "primary": "#010080", "success": "#10B981", "surface": "#FFFFFF", "warning": "#F59E0B", "secondary": "#DAA520", "background": "#F9FAFB", "textSecondary": "#6B7280"}	{"monoFont": "Monaco, Consolas, monospace", "headingFont": "Futura Bk BT, Verdana, Arial, sans-serif", "primaryFont": "Futura Bk BT, Verdana, Arial, sans-serif"}	{}	tenant_fmfb_db	localhost	5433	postgresql://bisiadedokun@localhost:5433/tenant_fmfb_db	pending	090
\.


--
-- Data for Name: bill_providers; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.bill_providers (id, name, bill_type, description, logo_url, min_amount, max_amount, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.documents (id, user_id, document_type, document_number, document_name, file_path, file_size, mime_type, ai_processed, ai_extracted_data, ai_confidence_score, ai_verification_status, verification_status, verified_by, verified_at, expiry_date, is_encrypted, encryption_key_id, file_hash, upload_metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fraud_alerts; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.fraud_alerts (id, user_id, transaction_id, alert_type, severity, risk_score, ai_analysis, contributing_factors, similar_patterns, recommended_actions, status, priority, resolved_at, resolved_by, resolution_notes, resolution_actions, notifications_sent, user_acknowledged, acknowledged_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: internal_transfers; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.internal_transfers (id, user_id, from_wallet_id, to_wallet_id, reference, amount, description, status, created_at) FROM stdin;
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.kyc_documents (id, user_id, document_type, document_number, document_image_url, selfie_image_url, status, verification_response, verification_score, submitted_at, processed_at, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.notifications (id, user_id, type, priority, title, message, ai_generated, personalization_level, ai_confidence, rich_content, action_buttons, deep_link, channels, delivery_preferences, status, scheduled_for, sent_at, delivered_at, read_at, expires_at, related_transaction_id, related_alert_id, category, tags, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: recipients; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.recipients (id, user_id, tenant_id, account_number, account_name, bank_code, bank_name, nickname, is_favorite, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.referrals (id, referrer_id, referee_id, referral_code, bonus_amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_metadata; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.tenant_metadata (tenant_id, tenant_name, schema_version, created_at, updated_at) FROM stdin;
c7afab8c-00fa-460e-9aaa-2999c7cdd406	migration_007	1.1	2025-09-09 00:25:33.254372	2025-09-09 21:54:14.131021
550e8400-e29b-41d4-a716-446655440000	test-tenant	1.1	2025-09-09 22:36:42.899541	2025-09-09 22:36:42.899541
7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fmfb	1.0	2025-09-04 19:44:07.495083	2025-09-04 19:44:07.495083
\.


--
-- Data for Name: transaction_logs; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.transaction_logs (id, transfer_id, event_type, message, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.transactions (id, tenant_id, user_id, reference, external_reference, batch_id, parent_transaction_id, type, amount, currency, exchange_rate, original_amount, original_currency, description, merchant_category, transaction_tags, recipient_name, recipient_account, recipient_bank, recipient_bank_code, recipient_details, sender_name, sender_account, sender_bank, sender_details, status, substatus, processing_details, failure_reason, failure_code, ai_initiated, voice_initiated, ai_confidence, natural_language_command, ai_processing_metadata, ai_recommendations, fraud_score, fraud_factors, risk_level, risk_factors, compliance_flags, payment_provider, payment_method, provider_transaction_id, provider_response, provider_fees, total_fees, charges, transaction_location, device_info, channel, settlement_date, settlement_batch, reconciliation_status, initiated_at, created_at, processed_at, completed_at, settled_at, compliance_checked, compliance_score) FROM stdin;
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: tenant; Owner: -
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
\.


--
-- Data for Name: user_activity_logs; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.user_activity_logs (id, user_id, activity_type, description, ip_address, user_agent, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.user_sessions (id, user_id, session_token, refresh_token, device_info, ip_address, user_agent, geolocation, expires_at, created_at, last_activity_at, is_suspicious, risk_score, ai_risk_assessment) FROM stdin;
1b04a4f6-b01e-45fb-9717-2180bd23aca8	06cd7648-a556-41b1-9ffa-a831ff75b982	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzAzMDYwNiwiZXhwIjoxNzU3NjM1NDA2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.AKA0-FxKsVe4yRNHPNJkmPak2SzoXXkc0Z102-MQC9o	\N	{}	::1	curl/8.7.1	\N	2025-09-11 20:03:26.123	2025-09-04 20:03:26.122356	2025-09-04 20:03:26.122356	f	0.00	{}
9169e208-32d4-408a-a591-1f967f95f221	06cd7648-a556-41b1-9ffa-a831ff75b982	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzM5MjI2MCwiZXhwIjoxNzU3OTk3MDYwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.jXpRWc51Cl-P1XHcm0JeNHhPanprfsjM685k0MwZ-7k	\N	{}	::1	curl/8.7.1	\N	2025-09-16 00:31:00.05	2025-09-09 00:31:00.045708	2025-09-09 00:31:00.045708	f	0.00	{}
2fcd021a-e111-4cf5-81f1-984b4ec2608d	06cd7648-a556-41b1-9ffa-a831ff75b982	2ea30ec4-127d-4293-a6de-110eaf2cef9c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5NzY5MCwiZXhwIjoxNzU4MTAyNDkwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.eVIhF4JXJU3f7ndsNlUFPB7pGD75ahIzjmb90G-NyIs	{}	::ffff:127.0.0.1		\N	2025-09-17 05:48:10.471	2025-09-10 05:48:10.467873	2025-09-10 05:48:10.467873	f	0.00	{}
8302a3e5-68d7-4518-a949-bd5b969f107f	06cd7648-a556-41b1-9ffa-a831ff75b982	176e6a4e-eaa9-4072-9700-b4675f74a542	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5NzczMiwiZXhwIjoxNzU4MTAyNTMyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.eAOhB-Z5EdmQhAQdPFmzdXx-PMQCOeKO5jYvPEZYHTI	{}	::ffff:127.0.0.1		\N	2025-09-17 05:48:52.179	2025-09-10 05:48:52.174337	2025-09-10 05:48:52.174337	f	0.00	{}
054e3c32-f133-44f0-b358-c2f3644e389a	06cd7648-a556-41b1-9ffa-a831ff75b982	ebf6d4cd-215c-4a42-8b4b-b91eaa3d8d92	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5Nzg4MCwiZXhwIjoxNzU4MTAyNjgwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.gFpmCDOeojTdrEluyHG81-OmyklfSnJd65ivOwLWz3Y	{}	::ffff:127.0.0.1		\N	2025-09-17 05:51:20.821	2025-09-10 05:51:20.818216	2025-09-10 05:51:20.818216	f	0.00	{}
70514746-e39d-4810-a39e-74d7cf93398d	06cd7648-a556-41b1-9ffa-a831ff75b982	864f2244-0364-4a88-86e2-8cfcde83d57d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODA2MSwiZXhwIjoxNzU4MTAyODYxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.WO2IUhT7jvrKba9nDS_HeH4sWmB8aCN497Ks7IkmfLE	{}	::ffff:127.0.0.1		\N	2025-09-17 05:54:21.314	2025-09-10 05:54:21.310811	2025-09-10 05:54:21.310811	f	0.00	{}
c384a08f-c63f-4a70-a64c-908962431a62	06cd7648-a556-41b1-9ffa-a831ff75b982	ac240bb6-758b-4c29-8d14-1a5a64a021c9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODI0NCwiZXhwIjoxNzU4MTAzMDQ0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.pRpggkx05PhKrBMlSpanjpc8h42lEnAEhOMopEZjnBg	{}	::ffff:127.0.0.1		\N	2025-09-17 05:57:24.969	2025-09-10 05:57:24.965694	2025-09-10 05:57:24.965694	f	0.00	{}
b16f5d34-73ee-463a-948d-b8f153ca26b1	06cd7648-a556-41b1-9ffa-a831ff75b982	726f5ba3-4845-4478-8c16-f82d0515a81c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODI1NSwiZXhwIjoxNzU4MTAzMDU1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.NKb6X-UTc4dofSszQS4SCafKL-5tiG3Yyb7-a6knA40	{}	::ffff:127.0.0.1		\N	2025-09-17 05:57:35.267	2025-09-10 05:57:35.263709	2025-09-10 05:57:35.263709	f	0.00	{}
5c336d0b-c69b-4641-b01a-beac75416c99	06cd7648-a556-41b1-9ffa-a831ff75b982	a0eac446-3aac-47b6-9c5d-4da3f68e96d7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODU5MCwiZXhwIjoxNzU4MTAzMzkwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.Bxvp7cu6nKHnedpz1g-ByCORRegy29Oi0TEfju99kU0	{}	::ffff:127.0.0.1		\N	2025-09-17 06:03:10.072	2025-09-10 06:03:10.068017	2025-09-10 06:03:10.068017	f	0.00	{}
b90973ca-86f4-45e8-a9bf-475635ff9160	06cd7648-a556-41b1-9ffa-a831ff75b982	7a54c0d3-4881-4ca5-a5f4-e80a7547383b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODcyOCwiZXhwIjoxNzU4MTAzNTI4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.jOqZ9pfN-K9Q6IB-IZPXfy39na5OT4LPWM1IBxWDlJc	{}	::ffff:127.0.0.1		\N	2025-09-17 06:05:28.599	2025-09-10 06:05:28.595381	2025-09-10 06:05:28.595381	f	0.00	{}
a61b6efd-d101-464c-88bd-2b5b24f7530a	06cd7648-a556-41b1-9ffa-a831ff75b982	adacf97d-65ea-49a0-b30d-3f8806c3968f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzQ5ODc0MCwiZXhwIjoxNzU4MTAzNTQwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.O1FJjwSHjJKh3HCK0xv07qJzQD0Qj9nY6_LdByWdQGw	{}	::ffff:127.0.0.1		\N	2025-09-17 06:05:40.785	2025-09-10 06:05:40.781611	2025-09-10 06:05:40.781611	f	0.00	{}
b2fab44a-6d40-4092-a7e3-9c21534c8345	06cd7648-a556-41b1-9ffa-a831ff75b982	9797149d-e1ae-4ba4-a4a3-bfefe7e2efa6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzAyMCwiZXhwIjoxNzU4MTA3ODIwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.ClhfLKmm5NUqlRV_Y4fF9Z3vylFtpiOY0P8wo2CtSiw	{}	::ffff:127.0.0.1		\N	2025-09-17 07:17:00.741	2025-09-10 07:17:00.73741	2025-09-10 07:17:00.73741	f	0.00	{}
d6103d07-c05f-4896-b92e-53c35dd7a1d5	06cd7648-a556-41b1-9ffa-a831ff75b982	3e045e96-ef3e-4d51-976b-6b2a033a5552	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzAzNiwiZXhwIjoxNzU4MTA3ODM2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.XuP8lv52WeviP7Oj8-xcNMpxwR40j8y7xFiZgPZd3YM	{}	::ffff:127.0.0.1		\N	2025-09-17 07:17:16.711	2025-09-10 07:17:16.707756	2025-09-10 07:17:16.707756	f	0.00	{}
2ea7c4ac-d5b9-404a-844e-6f4236aa5312	06cd7648-a556-41b1-9ffa-a831ff75b982	469e66c6-3577-49e4-ad93-e456f17902b2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzEyMywiZXhwIjoxNzU4MTA3OTIzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.-TEvp6kJJaltksuaP4Lo6YjJ-TDZeEA5jmvAWPWNYZU	{}	::ffff:127.0.0.1		\N	2025-09-17 07:18:43.169	2025-09-10 07:18:43.165834	2025-09-10 07:18:43.165834	f	0.00	{}
546a9dee-8407-4c8f-836a-22db221b8635	06cd7648-a556-41b1-9ffa-a831ff75b982	b15e685b-53d3-412c-9815-dbca47c089c4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzMwNywiZXhwIjoxNzU4MTA4MTA3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.0ayiUlZaHHyckHyG8fXIZYfuZH5gnPSMh5foevfC07o	{}	::ffff:127.0.0.1		\N	2025-09-17 07:21:47.683	2025-09-10 07:21:47.679202	2025-09-10 07:21:47.679202	f	0.00	{}
4db96ff5-9303-4d15-9620-7d3825137feb	06cd7648-a556-41b1-9ffa-a831ff75b982	07b881f8-1deb-4fb8-8e35-ec6989b5feb0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzQ0NSwiZXhwIjoxNzU4MTA4MjQ1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.5D3Lf_vyaJ0x4E7YnxmGQ6IWuwrqcROFXgQSFjhPmyk	{}	::ffff:127.0.0.1		\N	2025-09-17 07:24:05.551	2025-09-10 07:24:05.548239	2025-09-10 07:24:05.548239	f	0.00	{}
3a820f8d-5592-4af2-9333-b680fd49e70e	06cd7648-a556-41b1-9ffa-a831ff75b982	b70c9ca9-55e9-436e-8ca2-7b7ab0307e28	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzYyNSwiZXhwIjoxNzU4MTA4NDI1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.64Rx2kF4qRKjS-dX01DJmsQFCSn-zgYpDxf-4O7OyjU	{}	::ffff:127.0.0.1		\N	2025-09-17 07:27:05.063	2025-09-10 07:27:05.059731	2025-09-10 07:27:05.059731	f	0.00	{}
2e3c5453-d5cf-4a86-9e63-595b8b579ffa	06cd7648-a556-41b1-9ffa-a831ff75b982	57877b99-d052-4ac4-b6aa-11d4c7a1ec96	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzc4OCwiZXhwIjoxNzU4MTA4NTg4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.iGT64ULOmiNkUfSpLmH_kiG80GN5bbt1PfKPdTocSy0	{}	::ffff:127.0.0.1		\N	2025-09-17 07:29:48.807	2025-09-10 07:29:48.80364	2025-09-10 07:29:48.80364	f	0.00	{}
b838717f-3c00-4d46-8496-dbe953b90188	06cd7648-a556-41b1-9ffa-a831ff75b982	cf6eecfd-4477-456f-b742-8b5b6c4faad6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUwMzk1MCwiZXhwIjoxNzU4MTA4NzUwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.GWGd4MeoFc6VtgX9xhJHVmRkm2GKnLuQbDVBBBScPkY	{}	::ffff:127.0.0.1		\N	2025-09-17 07:32:30.195	2025-09-10 07:32:30.191611	2025-09-10 07:32:30.191611	f	0.00	{}
bc08aa36-0f0f-450b-ba7a-a5386812bd43	06cd7648-a556-41b1-9ffa-a831ff75b982	ca6eab0d-7e5b-4c36-bffb-eec9dbd11c5d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzUxMzEzNCwiZXhwIjoxNzU4MTE3OTM0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.6rkjZ7Fgkw9hEWpN0ZFaF8a3VON0LPquEauIIaD5Xj0	{}	::ffff:127.0.0.1		\N	2025-09-17 10:05:34.832	2025-09-10 10:05:34.829423	2025-09-10 10:05:34.829423	f	0.00	{}
a13ff5ee-24a5-47ae-811b-9998e51be0c2	06cd7648-a556-41b1-9ffa-a831ff75b982	ca89aaf1-fb3c-48d3-b5db-bf172a92f166	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTIyMywiZXhwIjoxNzU4MTU2MDIzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.E5lV1DiIO3Xzg2yIL6uj3LaoNntL3o7JGFkkn_lC87U	{"platform": "web", "timestamp": "2025-09-11T00:40:23.028Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:40:23.139	2025-09-10 20:40:23.136058	2025-09-10 20:40:23.136058	f	0.00	{}
14caa66f-a555-4d42-89ae-c7300dc8869b	06cd7648-a556-41b1-9ffa-a831ff75b982	5ac06675-0411-4712-b5d3-904d9dc0cd2b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTQwMSwiZXhwIjoxNzU4MTU2MjAxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.A2Jl2dmueVZxo0xNoM9AzKzYDuMW35sy2G_sadIdrGM	{"platform": "web", "timestamp": "2025-09-11T00:43:21.856Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:43:21.957	2025-09-10 20:43:21.956115	2025-09-10 20:43:21.956115	f	0.00	{}
293fc88d-52c0-4ce6-9449-cbf804fffe6b	06cd7648-a556-41b1-9ffa-a831ff75b982	37f8e075-8b2d-457e-ad8b-04da976535fa	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTU4MSwiZXhwIjoxNzU4MTU2MzgxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9._5OEi0z7YaEtpYmDgftof6m9CEX5dOBIsUxOLdtNxEo	{"platform": "web", "timestamp": "2025-09-11T00:46:21.551Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:46:21.666	2025-09-10 20:46:21.659779	2025-09-10 20:46:21.659779	f	0.00	{}
c31fb709-38f2-4572-a87c-932176666f95	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	5bdfc3cb-18ff-46a4-893c-49cca0fd6e23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTYwMCwiZXhwIjoxNzU4MTU2NDAwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.8I1oPml8xo-aKCAHpV3rSnybeuoY9YR4zET8eJVkWO0	{"platform": "web", "timestamp": "2025-09-11T00:46:40.014Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:46:40.115	2025-09-10 20:46:40.114077	2025-09-10 20:46:40.114077	f	0.00	{}
d9069be9-407e-42db-9040-65c2f83f6b2e	06cd7648-a556-41b1-9ffa-a831ff75b982	f9d539c7-ba48-4e6f-aa03-2c5272e58445	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTYyMywiZXhwIjoxNzU4MTU2NDIzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.hwhvpCk06-yVYt7AMjd5W0m12D4MGPvYdbkSi1Xwdog	{"platform": "web", "timestamp": "2025-09-11T00:47:03.255Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:47:03.354	2025-09-10 20:47:03.353393	2025-09-10 20:47:03.353393	f	0.00	{}
86d11a03-02d3-459a-ba20-512ae1ad1b1d	06cd7648-a556-41b1-9ffa-a831ff75b982	960f8f82-0569-4adb-89ec-abde31e006d5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MTk4OCwiZXhwIjoxNzU4MTU2Nzg4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.4V3icR_DqnfJLJ1gwgm6JhTR9ryNTZS1wf1TVC8fP6w	{"platform": "web", "timestamp": "2025-09-11T00:53:08.267Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:53:08.38	2025-09-10 20:53:08.374963	2025-09-10 20:53:08.374963	f	0.00	{}
e89e39f7-1c3f-480e-87e4-b791ef25d704	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	d2ada331-5735-4c0b-af76-3fefe636816e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MjI5OCwiZXhwIjoxNzU4MTU3MDk4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.eIn4zCGz-qMp-5V7s-ua4QNEUM1NkDHGCXdAC3HXqAw	{"platform": "web", "timestamp": "2025-09-11T00:58:18.892Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 20:58:18.995	2025-09-10 20:58:18.989916	2025-09-10 20:58:18.989916	f	0.00	{}
d6b854cf-aaa0-441a-9d14-872aa46d5f9f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	c4ea454e-e49e-4c77-829e-96a2223ee469	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MjcwNCwiZXhwIjoxNzU4MTU3NTA0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.y04x2JAc1BvQp97sLPNdHnwh7yLlTio5LJaX6yhg0C0	{"platform": "web", "timestamp": "2025-09-11T01:05:04.633Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 21:05:04.733	2025-09-10 21:05:04.729559	2025-09-10 21:05:04.729559	f	0.00	{}
d06b9c11-3355-4109-924d-147f07e7790e	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	b1d0c3b6-c02e-4362-b2b8-39ac0e3c6e5d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1MzEzNCwiZXhwIjoxNzU4MTU3OTM0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.bEyWITEmKmE3qZ3qeg-ElXqvmVpB4ydJJmpdJBCoeH0	{"platform": "web", "timestamp": "2025-09-11T01:12:14.151Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 21:12:14.253	2025-09-10 21:12:14.24812	2025-09-10 21:12:14.24812	f	0.00	{}
1876d462-97dc-426f-9580-05a8b42c3833	06cd7648-a556-41b1-9ffa-a831ff75b982	b4e1049d-70f5-4e11-bab1-8dfdcf220dab	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1NTk0OCwiZXhwIjoxNzU4MTYwNzQ4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.yt7n2y2rGgNDhsxEfxA8fRIdpusp3cjiwHFByoNcheo	{"platform": "web", "timestamp": "2025-09-11T01:59:08.399Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 21:59:08.478	2025-09-10 21:59:08.476673	2025-09-10 21:59:08.476673	f	0.00	{}
b06e1052-1ef2-4e32-b2ae-15703b46a636	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	df6acc0a-7ecb-4a88-bdea-4b0e5651fda7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1NjYzNSwiZXhwIjoxNzU4MTYxNDM1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.nleEhMK3b7crdmLezlfClIBcTQZWbEI2qw-clyda6Mo	{"platform": "web", "timestamp": "2025-09-11T02:10:35.291Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 22:10:35.37	2025-09-10 22:10:35.366631	2025-09-10 22:10:35.366631	f	0.00	{}
585d497e-6e3f-4350-9b2f-3cbcb0f49232	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	8ca0f79e-313f-41c5-bc76-8dfc9031430e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1NjgzNCwiZXhwIjoxNzU4MTYxNjM0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.CCzsXf8OsotokeA8FCMazPHGL5hHFxmi3BoxN8P-5nM	{"platform": "web", "timestamp": "2025-09-11T02:13:53.938Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 22:13:54.016	2025-09-10 22:13:54.015445	2025-09-10 22:13:54.015445	f	0.00	{}
0a316476-3b04-4d5f-bb59-8dd5008ad766	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	c0a83733-6d97-4152-9d03-5f6604c2b991	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1NzAzMywiZXhwIjoxNzU4MTYxODMzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.Rr9_PvkPfU0hfXGvapmG8hJgUSAJcfJtAl9CeTtDFUo	{"platform": "web", "timestamp": "2025-09-11T02:17:13.858Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 22:17:13.935	2025-09-10 22:17:13.934193	2025-09-10 22:17:13.934193	f	0.00	{}
a4dd4bdb-dd25-4ba2-a079-b05637fea28e	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	8f04219d-3654-4b3d-9234-0e99dbc7edbb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1NzM2MSwiZXhwIjoxNzU4MTYyMTYxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.XKbQqDdkbZaTjr17HrnZKF3Tl67-ckhb_L7R3Fn99M8	{"platform": "web", "timestamp": "2025-09-11T02:22:41.761Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 22:22:41.84	2025-09-10 22:22:41.838433	2025-09-10 22:22:41.838433	f	0.00	{}
17583255-7650-43ee-be87-5f4e11aa9a1e	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ed2b755-72cc-4ee7-a852-9cd67344bb41	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzU1OTkyNCwiZXhwIjoxNzU4MTY0NzI0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.4Y4oKsN1FavKzTQ2DsVRT_s471TZuR0yWkTFy6UEgKw	{"platform": "web", "timestamp": "2025-09-11T03:05:23.969Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-17 23:05:24.064	2025-09-10 23:05:24.057584	2025-09-10 23:05:24.057584	f	0.00	{}
c02841b4-30e2-481c-bbf9-1e591a4f22e6	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea038fb-8414-4714-888b-9b43d711e6e1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNDA0OCwiZXhwIjoxNzU4MjM4ODQ4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.p0WBkXN14KBuyZ08x7_LnSZEdOogDJvyoYLdHQyNBIg	{"platform": "web", "timestamp": "2025-09-11T23:40:48.523Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 19:40:48.663	2025-09-11 19:40:48.642858	2025-09-11 19:40:48.642858	f	0.00	{}
73215637-fe69-4ae1-b120-7032863911fe	06cd7648-a556-41b1-9ffa-a831ff75b982	6abbf512-d184-4705-bda3-04e751ff738a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNDkwNywiZXhwIjoxNzU4MjM5NzA3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.YM7-NNCSBeQ4ZDidVoebtcudkLOPRqCBoS-67TcWFN8	{"platform": "web", "timestamp": "2025-09-11T23:55:07.568Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 19:55:07.666	2025-09-11 19:55:07.647763	2025-09-11 19:55:07.647763	f	0.00	{}
0689c680-d236-4be3-ac2c-f8e7c1ebfa7a	06cd7648-a556-41b1-9ffa-a831ff75b982	5dcf1384-89fa-49c1-b636-1913de154061	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNTYwNCwiZXhwIjoxNzU4MjQwNDA0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.C7wPo3H0BCLzt21oI8n5U3RzV1oNDN8XjcX6oiObJjg	{"platform": "web", "timestamp": "2025-09-12T00:06:44.775Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 20:06:44.865	2025-09-11 20:06:44.851491	2025-09-11 20:06:44.851491	f	0.00	{}
2a659320-9951-4270-b29f-7cbcb9b45b1f	06cd7648-a556-41b1-9ffa-a831ff75b982	28c67987-4d4f-4a1c-b078-ae2b829f619e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNTk4MCwiZXhwIjoxNzU4MjQwNzgwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.JkZbwqiC7uCU4Su2Ur3DavxcwcGK0lcJ0MyEG0W1RGA	{"platform": "web", "timestamp": "2025-09-12T00:13:00.758Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 20:13:00.841	2025-09-11 20:13:00.837433	2025-09-11 20:13:00.837433	f	0.00	{}
e076ce57-db1d-40d6-bc54-30ce469845b7	06cd7648-a556-41b1-9ffa-a831ff75b982	0c2d8832-5325-416a-acd2-4965ed38b81f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNjE3NCwiZXhwIjoxNzU4MjQwOTc0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.D3GoiqwCJ_vzobixBxRlfQhN8_FtFOmW9YQ6HshoPZ0	{"platform": "web", "timestamp": "2025-09-12T00:16:14.620Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 20:16:14.701	2025-09-11 20:16:14.699467	2025-09-11 20:16:14.699467	f	0.00	{}
35c9b9fc-1ba6-4814-a3e0-f572566c35eb	06cd7648-a556-41b1-9ffa-a831ff75b982	5950f5cc-069e-4fc3-90c8-28e8a8d541cb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzYzNjQ5OCwiZXhwIjoxNzU4MjQxMjk4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.IQX-LQPjy0LVtfwGNpdNmbLQxa0KIvUS2vevbBJiYug	{"platform": "web", "timestamp": "2025-09-12T00:21:38.201Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-18 20:21:38.281	2025-09-11 20:21:38.279142	2025-09-11 20:21:38.279142	f	0.00	{}
3098cee1-1d00-4993-8a3c-7d0569e9a489	06cd7648-a556-41b1-9ffa-a831ff75b982	b869b037-e158-4e55-bbba-1fc461015315	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY2OTYwMCwiZXhwIjoxNzU4Mjc0NDAwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.u8PchsoiMS18-BFB29I46BgThCccLKjtWSIJHHzfbKY	{"platform": "web", "timestamp": "2025-09-12T09:33:20.056Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 05:33:20.172	2025-09-12 05:33:20.158813	2025-09-12 05:33:20.158813	f	0.00	{}
624bc6b1-9ebd-4930-b289-8d898ab22a4c	06cd7648-a556-41b1-9ffa-a831ff75b982	84e7b562-599f-4bc2-8445-96ac7bd65764	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY3MjY0MywiZXhwIjoxNzU4Mjc3NDQzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.TgHFEPDYfLmhoHchfqoYgjKYp9EED1cjHxZiOLoVzGQ	{"platform": "web", "timestamp": "2025-09-12T10:24:03.410Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 06:24:03.527	2025-09-12 06:24:03.5111	2025-09-12 06:24:03.5111	f	0.00	{}
e9175068-a9ac-4553-acb1-f16dfbdbc873	06cd7648-a556-41b1-9ffa-a831ff75b982	8866b3f6-ccc5-45fd-b9f9-3bd82a285a8f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY4MjY0NCwiZXhwIjoxNzU4Mjg3NDQ0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.DJi3deFzP-uW5qBp2UXmVrmENDzyBy1nhCN6gvL6WRg	{"platform": "web", "timestamp": "2025-09-12T13:10:44.699Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 09:10:44.829	2025-09-12 09:10:44.810239	2025-09-12 09:10:44.810239	f	0.00	{}
592d3650-a0bb-437b-bee1-39fe0715a478	06cd7648-a556-41b1-9ffa-a831ff75b982	8a9fc59d-6844-43fa-8c0e-566d73f07c6b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY4Mjg5NywiZXhwIjoxNzU4Mjg3Njk3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.VYHY6LAEiUnmqzU-anEVmeV7djQl5o2dR7SlNuK9_qk	{"platform": "web", "timestamp": "2025-09-12T13:14:57.449Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 09:14:57.552	2025-09-12 09:14:57.547129	2025-09-12 09:14:57.547129	f	0.00	{}
39c7cebb-46dd-4fba-a2ea-e2425cd5c1ed	06cd7648-a556-41b1-9ffa-a831ff75b982	78bb8e0e-df8a-4f0c-a383-b4ed9e2be501	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY4Mjk5MywiZXhwIjoxNzU4Mjg3NzkzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.f7_ldbCuD12Npcb8Po6NnYitbS7kHcGItWQ6sMLmJ3U	{"platform": "web", "timestamp": "2025-09-12T13:16:33.066Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 09:16:33.172	2025-09-12 09:16:33.166999	2025-09-12 09:16:33.166999	f	0.00	{}
29bab2d0-1cdc-4b00-b298-eb0629bae72b	06cd7648-a556-41b1-9ffa-a831ff75b982	d79f60f4-72ac-4a45-ac9d-d642e4dba06b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY4NTAzMCwiZXhwIjoxNzU4Mjg5ODMwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.VUzZzHDBFc0k4-Ax5JKS3Wpt84qkDq1Hy9rg3y97Ln4	{"platform": "web", "timestamp": "2025-09-12T13:50:30.441Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 09:50:30.525	2025-09-12 09:50:30.520586	2025-09-12 09:50:30.520586	f	0.00	{}
0666b4c9-5092-41bd-95dc-4a4a8428af89	06cd7648-a556-41b1-9ffa-a831ff75b982	bcaa7d2f-da07-4462-8432-e55e0af63ba5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzY4NTM4NSwiZXhwIjoxNzU4MjkwMTg1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.NmJDeCv4G093t9xKfLkac5Q-Shi96f8_cgx0OtRzNUI	{"platform": "web", "timestamp": "2025-09-12T13:56:25.476Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-19 09:56:25.556	2025-09-12 09:56:25.552045	2025-09-12 09:56:25.552045	f	0.00	{}
44bef922-582f-4226-93b1-64d662ba19b2	06cd7648-a556-41b1-9ffa-a831ff75b982	4d9c0136-e887-4ce9-a6c2-b06a42eed0da	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NDg1OSwiZXhwIjoxNzU4Mzc5NjU5LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.jn0McBZn2kSL3EjKEuvZ4pVSqC_gwHIh6MC4d711O98	{}	::1	curl/8.7.1	\N	2025-09-20 10:47:39.999	2025-09-13 10:47:39.996335	2025-09-13 10:47:39.996335	f	0.00	{}
9a2f331b-f59e-454f-a01b-0c2f669f0e10	06cd7648-a556-41b1-9ffa-a831ff75b982	ff782dec-ad53-47bb-9d76-691009379be7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NTExNywiZXhwIjoxNzU4Mzc5OTE3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.p1vOtCvcUBlrYqqAro_NnZCb_8R323FzL6VNIvRuLq4	{}	::1	curl/8.7.1	\N	2025-09-20 10:51:57.284	2025-09-13 10:51:57.281993	2025-09-13 10:51:57.281993	f	0.00	{}
bc40b856-4521-4d56-b219-b48532cb2363	06cd7648-a556-41b1-9ffa-a831ff75b982	f6160a8a-626a-4066-ad2a-26562ad7b61b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NTM0MCwiZXhwIjoxNzU4MzgwMTQwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9._MuKTjKXksiV9njFRYD62yUPtTSxv-mhx_H-3kotn9w	{"platform": "web", "timestamp": "2025-09-13T14:55:40.818Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 10:55:40.838	2025-09-13 10:55:40.834377	2025-09-13 10:55:40.834377	f	0.00	{}
30a54373-36d5-43cc-b57e-558686a6f970	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	d9ae7334-cf62-4f36-b8d8-84aeaed648cb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NTk1NCwiZXhwIjoxNzU4MzgwNzU0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.d6Kg5N5TUzZQQnl7X9pUEUR2p8CxFkD99OL0wSBYhXY	{"platform": "web", "timestamp": "2025-09-13T15:05:54.654Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:05:54.74	2025-09-13 11:05:54.735106	2025-09-13 11:05:54.735106	f	0.00	{}
bd174474-6fb0-4ef0-91b3-46f0de3fad34	06cd7648-a556-41b1-9ffa-a831ff75b982	58aa4aca-5a97-49a0-817d-9e47c1694f25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NjcwMywiZXhwIjoxNzU4MzgxNTAzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.3dXa0lGcYWXsDXPhashGgt92KTrToPSB3XFA34Awcq0	{"platform": "web", "timestamp": "2025-09-13T15:18:23.249Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:18:23.267	2025-09-13 11:18:23.261442	2025-09-13 11:18:23.261442	f	0.00	{}
7a3fe7db-257c-468b-bf51-4ab728429628	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	296ed73c-c468-46d5-91fb-acd0ecab3003	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NzU3OSwiZXhwIjoxNzU4MzgyMzc5LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.sRPtxUuc1z1J7jrt0ZnFQTpbL1LRtSgH8Xlf1rGhn14	{"platform": "web", "timestamp": "2025-09-13T15:32:58.966Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:32:59.051	2025-09-13 11:32:59.046549	2025-09-13 11:32:59.046549	f	0.00	{}
3192d16a-cc14-42e0-885b-44da97dcb7f9	06cd7648-a556-41b1-9ffa-a831ff75b982	310cfcbe-12ae-45a5-849a-19d2b1488715	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3NzgwMywiZXhwIjoxNzU4MzgyNjAzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.4s3l9KlWSm420xxqQ3aZYzYFFGFqpKmi7KRQj5_ipKU	{"platform": "web", "timestamp": "2025-09-13T15:36:43.184Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:36:43.198	2025-09-13 11:36:43.196893	2025-09-13 11:36:43.196893	f	0.00	{}
d3a312fa-153c-46c7-a2de-8e996dae3902	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	cd6265a1-9332-421b-baac-c20e4d49303c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3ODcwNSwiZXhwIjoxNzU4MzgzNTA1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.XONL9hjqmD2gWQEjFE7XcwEaqgqcuQwzSnXbX73aC38	{"platform": "web", "timestamp": "2025-09-13T15:51:45.540Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:51:45.626	2025-09-13 11:51:45.621062	2025-09-13 11:51:45.621062	f	0.00	{}
0cd916ce-ca5c-46db-a318-2c7036e2516d	06cd7648-a556-41b1-9ffa-a831ff75b982	4245f5b5-a1bd-471e-9770-6b7423838adf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3ODg3MiwiZXhwIjoxNzU4MzgzNjcyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.cFx09joJqNXDtlE62sJH-MdT977p5T8-7PBnNGew7ws	{"platform": "web", "timestamp": "2025-09-13T15:54:32.286Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:54:32.299	2025-09-13 11:54:32.298802	2025-09-13 11:54:32.298802	f	0.00	{}
ce015555-fdc1-4760-ad84-655dff2e6e16	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	bc4ee195-f71c-4c68-ae56-3dcc5495eb94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc3OTE3MSwiZXhwIjoxNzU4MzgzOTcxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.zlb7-4KJcvoe1GcNrehBZMqAb3m7spJ42BhdWpQhBs4	{"platform": "web", "timestamp": "2025-09-13T15:59:31.719Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 11:59:31.804	2025-09-13 11:59:31.800185	2025-09-13 11:59:31.800185	f	0.00	{}
cb7abb98-92e2-40d2-afef-7b78bb93a1c5	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	95aac380-a842-44f2-8c75-1563c1ed8de9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4MTQzMywiZXhwIjoxNzU4Mzg2MjMzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.39w1Ns_-wvurlJraUCOTy0FILigVabeZsW_CXyBRNlo	{"platform": "web", "timestamp": "2025-09-13T16:37:13.097Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 12:37:13.18	2025-09-13 12:37:13.178407	2025-09-13 12:37:13.178407	f	0.00	{}
22b9df41-a1dc-449f-9c25-bc9bef0c8f1f	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	febd3e36-86b8-40cb-9123-f91d7fec5f40	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4MTk1MiwiZXhwIjoxNzU4Mzg2NzUyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.nM9D5T_T8Bk_cGIWhpryR5rlPNoSTdFC1XtG3Z5l70w	{"platform": "web", "timestamp": "2025-09-13T16:45:52.888Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 12:45:52.976	2025-09-13 12:45:52.970391	2025-09-13 12:45:52.970391	f	0.00	{}
556eb7cb-dd02-4f6a-b610-caa0c1437668	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	81202e89-7e9b-44e1-8999-110417befe9d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4MjMzNSwiZXhwIjoxNzU4Mzg3MTM1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.uBNHQmjN7yie7W2zU6TUpBVc4-Xf65CjCEkYoQVZYP8	{"platform": "web", "timestamp": "2025-09-13T16:52:14.957Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 12:52:15.033	2025-09-13 12:52:15.032767	2025-09-13 12:52:15.032767	f	0.00	{}
46ae51b9-09b9-4ecf-ab9c-07a809bd9714	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	52399dd0-a926-46b4-81ec-6f0b50f6fb97	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4MjU4NiwiZXhwIjoxNzU4Mzg3Mzg2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.M6GyXb7Vsi-k3wTQAa9n1sPxcvGxpJlsf0tcw0iHogE	{"platform": "web", "timestamp": "2025-09-13T16:56:26.791Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 12:56:26.875	2025-09-13 12:56:26.871278	2025-09-13 12:56:26.871278	f	0.00	{}
4b3097e2-bd94-4ce7-b2f5-20ef9dd45979	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	9ced41bb-9d37-4b3d-bd8b-09647eed4581	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4MzAyNCwiZXhwIjoxNzU4Mzg3ODI0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.znTokpuIbY-eJeB-C1k8enRt-gcDUbnvybUMeF8oEDc	{"platform": "web", "timestamp": "2025-09-13T17:03:43.920Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 13:03:44.002	2025-09-13 13:03:43.996812	2025-09-13 13:03:43.996812	f	0.00	{}
c6d34d53-0694-4eb9-ac1e-cbfd96a59d9c	06cd7648-a556-41b1-9ffa-a831ff75b982	4ce3d486-7491-413d-b4b8-04674c33851e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4NTQwNiwiZXhwIjoxNzU4MzkwMjA2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.KT6D6qDcM9e7NxZFLuaV9Q4L157AQAD31bMjWnSNVc8	{"platform": "web", "timestamp": "2025-09-13T17:43:26.538Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 13:43:26.556	2025-09-13 13:43:26.551785	2025-09-13 13:43:26.551785	f	0.00	{}
cfbef896-4bea-461e-8a24-abc673668988	06cd7648-a556-41b1-9ffa-a831ff75b982	d2cd26b6-4e21-4ffc-ab42-3d8d3893f371	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc4NjgzMSwiZXhwIjoxNzU4MzkxNjMxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.ZURlJKxntlkdgwnnwPp6BNLraTtFXGZCriLvX1eed-0	{"platform": "web", "timestamp": "2025-09-13T18:07:11.636Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 14:07:11.673	2025-09-13 14:07:11.669619	2025-09-13 14:07:11.669619	f	0.00	{}
162b9a75-ef06-43b5-8a91-8d269445d7a1	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	e4e8dba2-7c96-4de0-a723-c7fd55f680e8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5MDI2MCwiZXhwIjoxNzU4Mzk1MDYwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.HFHfDL9xFywynMfwfbPBd8DIv5w_fRSlYp-L4mrRBhU	{"platform": "web", "timestamp": "2025-09-13T19:04:20.597Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 15:04:20.688	2025-09-13 15:04:20.682889	2025-09-13 15:04:20.682889	f	0.00	{}
2add5691-7892-4add-99a3-a45ffe72de76	06cd7648-a556-41b1-9ffa-a831ff75b982	4a7ebf42-b379-4dd3-a514-2d4985aca50c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5MzUzMiwiZXhwIjoxNzU4Mzk4MzMyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.Z1w3lWnLJqCVqwYwV1K47qhpA5rQ8rjRD15eNAUuBrk	{"platform": "web", "timestamp": "2025-09-13T19:58:52.088Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 15:58:52.111	2025-09-13 15:58:52.105935	2025-09-13 15:58:52.105935	f	0.00	{}
01028363-7d51-438e-b611-1d83b20b2de3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	1270dd50-da15-4eda-b8dd-8c523631c0b7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5NTE3MywiZXhwIjoxNzU4Mzk5OTczLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.fN5X1Z61G49JAnc9vO7BKp2WEhq4s135aR-3BeCXApw	{"platform": "web", "timestamp": "2025-09-13T20:26:13.707Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 16:26:13.788	2025-09-13 16:26:13.786064	2025-09-13 16:26:13.786064	f	0.00	{}
1302ade8-bc6f-4192-aab0-f8e66a4ed196	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	71193493-8490-4d73-805e-25218560d9fc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5NjA5MiwiZXhwIjoxNzU4NDAwODkyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.mJbhZ_AdE30yDhtBwIy0SyCSq4wxPruQj5tjLLtnl1k	{"platform": "web", "timestamp": "2025-09-13T20:41:32.666Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 16:41:32.758	2025-09-13 16:41:32.753201	2025-09-13 16:41:32.753201	f	0.00	{}
e48ba669-b33f-409c-bce7-0b41593668c4	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	32e16efa-3546-4d72-926d-cf17ef3deaba	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5NjMwNiwiZXhwIjoxNzU4NDAxMTA2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.MJVe-ws35JUcKvJhUi5jMul2asWGoL-TnjjtZpjZqVI	{"platform": "web", "timestamp": "2025-09-13T20:45:06.891Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 16:45:06.986	2025-09-13 16:45:06.980904	2025-09-13 16:45:06.980904	f	0.00	{}
3279aa21-4e03-4d23-b8ad-a79c8c23fd32	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	3bd4a517-f279-4d15-ba11-3f67cac91156	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5NjM0OCwiZXhwIjoxNzU4NDAxMTQ4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.z2cs8kmsOWK_ssvGOah59iDYnopAF8OMvuBGGJhaWWU	{"platform": "web", "timestamp": "2025-09-13T20:45:47.975Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 16:45:48.055	2025-09-13 16:45:48.053622	2025-09-13 16:45:48.053622	f	0.00	{}
700e017c-925d-43da-89d1-e398e0becb1d	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	2fb0b492-4dd0-4882-add3-0ec3aa665fcc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5NzM1MCwiZXhwIjoxNzU4NDAyMTUwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.YFoM54MUlNtPT-vt7dnFRTmv3bDTWz2gdHrvQ6paRKE	{"platform": "web", "timestamp": "2025-09-13T21:02:30.297Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:02:30.387	2025-09-13 17:02:30.381801	2025-09-13 17:02:30.381801	f	0.00	{}
1bd9e730-93ea-4c75-b379-486f72b11d08	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	6abaf9b1-1c6b-44dc-acfd-647aa3c7df11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5Nzc1NiwiZXhwIjoxNzU4NDAyNTU2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.NNlUbrESBv3SKfxmmmVqgh_UoeEq5VlOHd_HXSFZo2M	{"platform": "web", "timestamp": "2025-09-13T21:09:16.194Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:09:16.277	2025-09-13 17:09:16.272628	2025-09-13 17:09:16.272628	f	0.00	{}
e9e75984-bed7-42b0-af1f-054681be28e8	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	8500ed3d-e0d8-4b5a-8fb9-def3c7ff7878	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5ODM1NSwiZXhwIjoxNzU4NDAzMTU1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.yR2mFcsrS15L434tLUQv6AYef2lRdQJVuseofRud3OA	{"platform": "web", "timestamp": "2025-09-13T21:19:15.556Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:19:15.647	2025-09-13 17:19:15.642379	2025-09-13 17:19:15.642379	f	0.00	{}
dbed9f4d-5f9b-4038-b265-a8f165adb47d	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	150d10bb-1baf-4077-aaeb-215921aa6948	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5ODUxMSwiZXhwIjoxNzU4NDAzMzExLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.W4IQ1s5W_rSD5vLNzc2C5qwBydWiSs_L9U65C6PRQYo	{"platform": "web", "timestamp": "2025-09-13T21:21:51.461Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:21:51.542	2025-09-13 17:21:51.537812	2025-09-13 17:21:51.537812	f	0.00	{}
5461494f-7d31-4d8a-b0f9-59ea8c1fe2ad	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	36747680-ac26-4edc-ada9-1186cf5afdfd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5ODY2NiwiZXhwIjoxNzU4NDAzNDY2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.x1mWK4StfBtwO_qQCRIBPm75bR2KT8wfZwdqTXhutlc	{"platform": "web", "timestamp": "2025-09-13T21:24:26.278Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:24:26.361	2025-09-13 17:24:26.356631	2025-09-13 17:24:26.356631	f	0.00	{}
b563b408-823f-4940-bf1b-cb78e9fbf596	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	dfd29e9f-fdb9-4319-86cd-c8d89bc88e9e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5OTAzMSwiZXhwIjoxNzU4NDAzODMxLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.uoYahH0VeG-iiJZalVxI8GtYLK6aj2vPCjlSxJeh72o	{"platform": "web", "timestamp": "2025-09-13T21:30:31.031Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:30:31.111	2025-09-13 17:30:31.108535	2025-09-13 17:30:31.108535	f	0.00	{}
04b00b69-a77f-4304-a664-97f4f2a997d3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	c56adce5-bc25-4ffa-acd8-dc40e4be2e3d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5OTI1MCwiZXhwIjoxNzU4NDA0MDUwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.3bLWPmJwrndu0S7KKoGlE-V66DoMS1EdmncCYnnfW6E	{"platform": "web", "timestamp": "2025-09-13T21:34:10.677Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:34:10.76	2025-09-13 17:34:10.755872	2025-09-13 17:34:10.755872	f	0.00	{}
6d6a7934-b69f-4018-96e3-f73200d610b2	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	0021d61c-a66d-452f-a871-7e713d9f13d6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1Nzc5OTUwNSwiZXhwIjoxNzU4NDA0MzA1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.QiPIPVyi71vDy8ptg9mJUaiO12L6f2fwou-KFPC6kCs	{"platform": "web", "timestamp": "2025-09-13T21:38:25.362Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:38:25.443	2025-09-13 17:38:25.439209	2025-09-13 17:38:25.439209	f	0.00	{}
b0ff1350-9a3c-41a7-93f6-15930434c113	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	b0092772-1097-432f-a036-c3c1cc62cc4a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzgwMDAzNSwiZXhwIjoxNzU4NDA0ODM1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.lWgEb0xGU5jSeuMozjmrhB67IX_0rYlgIC9MAx07ZkE	{"platform": "web", "timestamp": "2025-09-13T21:47:15.578Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:47:15.657	2025-09-13 17:47:15.655308	2025-09-13 17:47:15.655308	f	0.00	{}
b3ecf1bd-17f3-488b-b099-8f9d5e2acb2a	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7c1b6485-b1c6-4c5c-811f-197eed39a94f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1NzgwMDM3NSwiZXhwIjoxNzU4NDA1MTc1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.D78z6eDC0tInsbo4BejGLOY93re8sx7x2eyeMJ0fhc8	{"platform": "web", "timestamp": "2025-09-13T21:52:55.422Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-20 17:52:55.5	2025-09-13 17:52:55.499243	2025-09-13 17:52:55.499243	f	0.00	{}
88944648-17c4-4779-ac96-4fc6aaae6090	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	4cd68002-7f65-4ac1-80c1-4af8ea18d056	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1MzUzOSwiZXhwIjoxNzU4NjU4MzM5LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.lghrhBd76riSYJZqc-wJlI3xnvQTjnFSpzw5tBfDbak	{"platform": "web", "timestamp": "2025-09-16T20:12:19.579Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36", "rememberMe": false, "screenSize": "1280x720"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36	\N	2025-09-23 16:12:19.727	2025-09-16 16:12:19.705485	2025-09-16 16:12:19.705485	f	0.00	{}
97d1a84e-0822-4707-b7f2-e184e6a779f4	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	43be9a4c-3a23-41e7-ba61-2aa3fb80df85	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1MzU2NiwiZXhwIjoxNzU4NjU4MzY2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.IzD8xvjn3ZAiEv-UtByWWtp6yAxbThk2yhevjwKwKd4	{"platform": "web", "timestamp": "2025-09-16T20:12:45.984Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36", "rememberMe": false, "screenSize": "1280x720"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36	\N	2025-09-23 16:12:46.075	2025-09-16 16:12:46.071885	2025-09-16 16:12:46.071885	f	0.00	{}
93334b22-6c29-4c62-8aa0-3e6efeceb1cc	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	b92a62a6-11b3-4e11-8621-a9fcd6c3d643	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1MzU5NSwiZXhwIjoxNzU4NjU4Mzk1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.OYeFllKc9uy8v-HRQ0eQakJbLgy2aVqtAfNhWuU48mc	{"platform": "web", "timestamp": "2025-09-16T20:13:14.893Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15", "rememberMe": false, "screenSize": "1280x720"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15	\N	2025-09-23 16:13:15.013	2025-09-16 16:13:15.010243	2025-09-16 16:13:15.010243	f	0.00	{}
07d246de-197a-4e57-a2fe-7afee7a7403b	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	1ab33d67-edb8-43db-90cb-1e83d5eac22f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1Mzk2MCwiZXhwIjoxNzU4NjU4NzYwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.YyC11Ce9K2hLsYwxV0oK9n8c1w7Pkqb7swojKQB9Qzg	{"platform": "web", "timestamp": "2025-09-16T20:19:20.758Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36", "rememberMe": false, "screenSize": "1280x720"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.7339.16 Safari/537.36	\N	2025-09-23 16:19:20.875	2025-09-16 16:19:20.869419	2025-09-16 16:19:20.869419	f	0.00	{}
6efac9b4-e8ed-4349-9af9-02cd9df1a687	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	c9a0f5f9-5d89-442b-954f-a33715e64410	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NDIxMSwiZXhwIjoxNzU4NjU5MDExLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.kVEMBOEmSl1aIIER20SKVzVm5EhuzkY94geo2bZYnK0	{"platform": "web", "timestamp": "2025-09-16T20:23:31.451Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 16:23:31.569	2025-09-16 16:23:31.556821	2025-09-16 16:23:31.556821	f	0.00	{}
70a0f2fa-4565-401b-b2ef-be14ce7d8fb9	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	32d8a1e3-81af-4287-8aea-367f70579ad4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NDYwNCwiZXhwIjoxNzU4NjU5NDA0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.tNGXVJMgQ3OVtw04_H0SSEbqlHW2ZWg7q_yze9NrVck	{"platform": "web", "timestamp": "2025-09-16T20:30:04.007Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 16:30:04.099	2025-09-16 16:30:04.094684	2025-09-16 16:30:04.094684	f	0.00	{}
4c3b09fa-89a0-420c-a28e-151e5931e197	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	a9b4f163-b742-4c79-9be9-849602e0d89f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NTc5NiwiZXhwIjoxNzU4NjYwNTk2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.IK0yek1G464sP29WTanfYvEFFac6S-7h8ReKUVs8ltU	{"platform": "web", "timestamp": "2025-09-16T20:49:56.791Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 16:49:56.883	2025-09-16 16:49:56.879475	2025-09-16 16:49:56.879475	f	0.00	{}
8c09ac1e-8211-4acc-9208-007157fff0e6	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7f0bd447-d3ae-4620-beb2-4caaa5db55a9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NjEzNCwiZXhwIjoxNzU4NjYwOTM0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.2lfdQWWGVvtVGJAK9fOuTx0MpAQ1WVEsk4u3SgAmiSg	{"platform": "web", "timestamp": "2025-09-16T20:55:33.932Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 16:55:34.018	2025-09-16 16:55:34.013561	2025-09-16 16:55:34.013561	f	0.00	{}
d02f400c-4dec-4d1d-95fa-a275c2e0c352	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	6b2cda60-9314-4ab9-974c-2756836986a9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NjQzMiwiZXhwIjoxNzU4NjYxMjMyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.Dlh_4cytDMo_Yz4TJ561MNRKhil1zMLbcVuWCQB8unk	{"platform": "web", "timestamp": "2025-09-16T21:00:32.666Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 17:00:32.77	2025-09-16 17:00:32.764791	2025-09-16 17:00:32.764791	f	0.00	{}
21485e4c-e76e-4432-8c53-a711ca8b8442	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	17420503-14ec-41ef-adca-9bbd95611c62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1NjYxNSwiZXhwIjoxNzU4NjYxNDE1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.tqqZdY5CuW_4xpIY_GGw6_2o3Ft6wZDc306F01rYjNo	{"platform": "web", "timestamp": "2025-09-16T21:03:35.548Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 17:03:35.651	2025-09-16 17:03:35.643553	2025-09-16 17:03:35.643553	f	0.00	{}
d72b1dfe-2fd2-4f15-bed9-9d3721fca377	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	6e19c47b-9da0-4ee0-9016-157504f779a5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1Njk4OCwiZXhwIjoxNzU4NjYxNzg4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.yWd3IuQSFMUL57DrFNop2ZfCqhdbOU8U2seN7PKVuM0	{"platform": "web", "timestamp": "2025-09-16T21:09:48.105Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 17:09:48.211	2025-09-16 17:09:48.205374	2025-09-16 17:09:48.205374	f	0.00	{}
ec2b9f33-05eb-459e-bbcb-29dab13d9116	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	1d51fabc-1aaa-41be-98e8-b17e71c642e9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1ODY3NywiZXhwIjoxNzU4NjYzNDc3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.265UbcbDoOi3FZrUKm1B4lfYiTNmknV3P2OX8i_TCFM	{"platform": "web", "timestamp": "2025-09-16T21:37:57.673Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 17:37:57.76	2025-09-16 17:37:57.756321	2025-09-16 17:37:57.756321	f	0.00	{}
6528dae0-9e36-4045-9f29-835eb71c12cc	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	c5ab67be-4f49-4894-ba11-d79f482219e7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA1OTIyNSwiZXhwIjoxNzU4NjY0MDI1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.81SfH98_30ZV9o3F23e6iO8Qhe0s3Uzk9KUF891PMkQ	{"platform": "web", "timestamp": "2025-09-16T21:47:05.188Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 17:47:05.412	2025-09-16 17:47:05.408447	2025-09-16 17:47:05.408447	f	0.00	{}
8b2f4d1e-78e7-407e-962f-af2f377e78ab	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	394736d9-1f2e-40c2-9966-3893b02394fc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2Mjk4NywiZXhwIjoxNzU4NjY3Nzg3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.zDy2_oF-zby8SsEc6Rk1U5LOX1l5ljhmFv8sA_4gTsA	{"platform": "web", "timestamp": "2025-09-16T22:49:47.559Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 18:49:47.645	2025-09-16 18:49:47.638206	2025-09-16 18:49:47.638206	f	0.00	{}
316ea7bd-5b94-4bdc-ac6c-f6ae2e20d6e9	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	a3422775-09de-4287-895f-38091350ac16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2Mzc0MCwiZXhwIjoxNzU4NjY4NTQwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.2aUR--rGOrTEho1RviBoRaNfxpPpYNdxuCyqm_DBEN8	{"platform": "web", "timestamp": "2025-09-16T23:02:20.787Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 19:02:20.873	2025-09-16 19:02:20.868046	2025-09-16 19:02:20.868046	f	0.00	{}
4fd0624a-8887-458e-b255-912b181b4b37	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	05a31e03-81c4-4cd8-ab39-b27af0526ba9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2NDE2MCwiZXhwIjoxNzU4NjY4OTYwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9._ypp_639kW7PFERBF7B07W8nP5p3-4Z7D-E2iai72M4	{"platform": "web", "timestamp": "2025-09-16T23:09:19.942Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 19:09:20.029	2025-09-16 19:09:20.025125	2025-09-16 19:09:20.025125	f	0.00	{}
ed1bed12-3706-4149-a80c-e504cb29bedc	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	9fca1b89-7b02-43e3-b1ec-b56bf6a433ce	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2NTAxNiwiZXhwIjoxNzU4NjY5ODE2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.KviiwWuJOW9-56ahPs8AsRtwVd7-uw7GVHOt8GYypwU	{"platform": "web", "timestamp": "2025-09-16T23:23:36.285Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 19:23:36.368	2025-09-16 19:23:36.363974	2025-09-16 19:23:36.363974	f	0.00	{}
5b32a491-c1c7-4831-b3ef-e983e9d02256	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	1b8f2689-97ff-47b4-aeda-b20d7c5cae3c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2NTg4MywiZXhwIjoxNzU4NjcwNjgzLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.5uTbqieJZabfOobyw4-7ykj0EBLtT3lXWlhhH0UYu1E	{"platform": "web", "timestamp": "2025-09-16T23:38:03.478Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 19:38:03.565	2025-09-16 19:38:03.560688	2025-09-16 19:38:03.560688	f	0.00	{}
57c3199e-6c9f-4a9e-9da0-379d2c793f44	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	009f3672-9fad-4ea9-ae65-308d80fb2028	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2ODIxMSwiZXhwIjoxNzU4NjczMDExLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.DWf3K4CszIGQno6CXzyrIbc8xGrCnF2BOFgpL3xJZcw	{"platform": "web", "timestamp": "2025-09-17T00:16:51.036Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 20:16:51.158	2025-09-16 20:16:51.139723	2025-09-16 20:16:51.139723	f	0.00	{}
75197d86-42ae-4b39-b411-276dd5b82040	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	f97a8723-04f1-4adc-8191-f937541fbcad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2ODU5NSwiZXhwIjoxNzU4NjczMzk1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.MsJl55uC5I6da_zl4npJAv62L9gxRV6fpVGIjmc8Q9k	{"platform": "web", "timestamp": "2025-09-17T00:23:15.566Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 20:23:15.66	2025-09-16 20:23:15.654342	2025-09-16 20:23:15.654342	f	0.00	{}
f184e06f-f63b-433e-bd6f-56e9494027e6	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7a53ed8d-b9ac-4875-b996-362ce60d57d4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA2OTcxMCwiZXhwIjoxNzU4Njc0NTEwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.IpN6ddZntYl6rtnbO52xmCF4X1n9wzgLCcT5VvxJFVk	{"platform": "web", "timestamp": "2025-09-17T00:41:50.765Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 20:41:50.851	2025-09-16 20:41:50.845867	2025-09-16 20:41:50.845867	f	0.00	{}
c0dc1068-80de-44bd-96ff-5d1659a1f79d	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	6872a892-c2dd-461f-86dd-a70dc2c2a978	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA3MjExMCwiZXhwIjoxNzU4Njc2OTEwLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.O9yDhGIX9_bEzi1RTwFOFoTqINBwq1tL2TJka88fAHk	{"platform": "web", "timestamp": "2025-09-17T01:21:50.596Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 21:21:50.716	2025-09-16 21:21:50.700304	2025-09-16 21:21:50.700304	f	0.00	{}
857783ef-0574-490b-862e-7cfccdf82dc7	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	96ab161a-d2ce-4d7e-a372-68e40161e5d4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODA3NzM3NiwiZXhwIjoxNzU4NjgyMTc2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.C2dxna7jw1T-4KSGDGOQwUIOhMIve98Qchza24yr_wY	{"platform": "web", "timestamp": "2025-09-17T02:49:36.643Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1992x975"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-23 22:49:36.771	2025-09-16 22:49:36.740858	2025-09-16 22:49:36.740858	f	0.00	{}
a42e23ca-b82c-4dfe-9420-ffb369ef1349	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	872edd41-5fb9-4102-8f11-912008b6c029	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODIyMjg4NSwiZXhwIjoxNzU4ODI3Njg1LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.UWDr7oSHUGUiHAF3MfIpbHog5ukhEx5rFUptdyk8n4I	{}	::1	curl/8.7.1	\N	2025-09-25 15:14:45.746	2025-09-18 15:14:45.706389	2025-09-18 15:14:45.706389	f	0.00	{}
7dc33611-5fba-4e43-ad49-a4710cce109e	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	0a2d7730-c0d2-4848-9c89-9431477f60c7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODIyMzY0NiwiZXhwIjoxNzU4ODI4NDQ2LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.v4gu2fTzFtpd4z7i64o2vhadrJRmWJSl1fublgcm9jI	{}	::1	curl/8.7.1	\N	2025-09-25 15:27:26.53	2025-09-18 15:27:26.528416	2025-09-18 15:27:26.528416	f	0.00	{}
b6e92a5d-0c7d-4e4b-949b-693c981816bb	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	05075d16-3079-438b-a4e9-074554394972	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODIyNDM4NCwiZXhwIjoxNzU4ODI5MTg0LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.sPECUS3lpEv7rWOsgmiX6q0M8aZkV6U-NBn0-b2UAik	{}	::1	curl/8.7.1	\N	2025-09-25 15:39:44.951	2025-09-18 15:39:44.945101	2025-09-18 15:39:44.945101	f	0.00	{}
3786c497-bc3e-444e-b69a-812fdaa79ae3	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	9a761cb6-cefc-4309-acce-3dcf0ed2dd18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODIyNDQzNywiZXhwIjoxNzU4ODI5MjM3LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.dXMCsdQpikuKiRhGTP2Xd0Iig7SD1SBkcPSeUX4Y7Dc	{"platform": "web", "userAgent": "Mozilla/5.0 (Test Browser)"}	::1	curl/8.7.1	\N	2025-09-25 15:40:37.946	2025-09-18 15:40:37.944097	2025-09-18 15:40:37.944097	f	0.00	{}
90d377de-d585-4794-bec1-5a36016e9c26	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	dc9aea06-1b1b-44f3-baeb-4c82103c4d19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTc2OWUxZS1iN2M3LTQzN2EtYjBjNC1jMjQyZDgyZThlM2YiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODIyNDUwMiwiZXhwIjoxNzU4ODI5MzAyLCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.-2LHAwbv6XIhEW34qDJEwdil77FjBsKLeuZPfP5_ePc	{"platform": "web", "timestamp": "2025-09-18T19:41:42.331Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "1940x929"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-25 15:41:42.427	2025-09-18 15:41:42.420864	2025-09-18 15:41:42.420864	f	0.00	{}
6883a55b-6ce4-433f-baca-ad1e18c71dc3	06cd7648-a556-41b1-9ffa-a831ff75b982	550e5c35-7069-4d23-8da1-01a616cbd3ce	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNmNkNzY0OC1hNTU2LTQxYjEtOWZmYS1hODMxZmY3NWI5ODIiLCJ0ZW5hbnRJZCI6IjdlYTFmZTBhLTZmN2QtNDgzOC1iY2NhLTRkZmRiNjFmZmNhMyIsImlhdCI6MTc1ODI0MzAxOCwiZXhwIjoxNzU4ODQ3ODE4LCJhdWQiOiJvcm9raWlwYXktY2xpZW50IiwiaXNzIjoib3Jva2lpcGF5LWFwaSJ9.kaavtF3HpBZS9vsq297yT3xQq9igsHbcNl5L_lQ-qTQ	{"platform": "web", "timestamp": "2025-09-19T00:50:18.120Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36", "rememberMe": false, "screenSize": "2016x1097"}	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	\N	2025-09-25 20:50:18.491	2025-09-18 20:50:18.488978	2025-09-18 20:50:18.488978	f	0.00	{}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.users (id, tenant_id, email, phone_number, password_hash, first_name, last_name, middle_name, role, status, permissions, bvn, nin, ai_preferences, behavioral_profile, risk_profile, failed_login_attempts, last_login_at, last_login_ip, password_changed_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_methods, biometric_enabled, biometric_templates, profile_data, notification_preferences, last_known_location, registered_devices, kyc_status, kyc_level, kyc_documents, kyc_completed_at, created_at, updated_at, created_by, account_number, transaction_pin_hash, daily_limit, monthly_limit, date_of_birth, gender, is_active, profile_image_url, profile_address, referral_code) FROM stdin;
06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	demo@fmfb.com	+2348012345678	$2b$12$OHjR7gKWNdAC7nSwCgy5LOkNObs9wkKzrjWz4WeSz/Y5YH2p7pQZe	Demo	User	\N	agent	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	1	2025-09-18 20:50:18.488978	::1	2025-09-18 20:44:52.281632	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 19:44:07.49548	2025-09-18 21:17:55.285761	\N	0905916152	$2b$10$ObNIvh1HxQ3ryvKCzgQJDe1CFBbO7/9LM71AkrrSxCQKhQwLcpUee	100000.00	500000.00	\N	\N	t	\N	\N	\N
19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	admin@fmfb.com	+2348012345679	$2b$10$ucekP8dJtb1W2YMoSsMDYO4DjD7dph30J74HjKXhnHRbDmkOIf.xW	Admin	User	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	2025-09-18 21:07:48.633177	::1	2025-09-04 19:44:07.49548	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 19:44:07.49548	2025-09-18 21:07:48.633177	\N	0907934845	$2b$10$ObNIvh1HxQ3ryvKCzgQJDe1CFBbO7/9LM71AkrrSxCQKhQwLcpUee	100000.00	500000.00	\N	\N	t	\N	\N	\N
\.


--
-- Data for Name: wallet_fundings; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.wallet_fundings (id, user_id, wallet_id, reference, amount, funding_method, description, status, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.wallet_transactions (id, wallet_id, transaction_id, transaction_type, amount, balance_before, balance_after, description, category, subcategory, reference, external_reference, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: tenant; Owner: -
--

COPY tenant.wallets (id, user_id, tenant_id, wallet_number, wallet_type, wallet_name, balance, available_balance, reserved_balance, pending_balance, currency, foreign_balances, daily_limit, monthly_limit, single_transaction_limit, minimum_balance, ai_insights, predicted_balance, balance_prediction_date, spending_categories, financial_health_score, spending_behavior, interest_rate, reward_points, cashback_earned, is_active, is_frozen, freeze_reason, security_level, account_category, regulatory_status, last_kyc_update, created_at, updated_at, activated_at, last_transaction_at, status, is_primary) FROM stdin;
df6759b9-079c-45c2-9a26-208f5fc8fbfb	19769e1e-b7c7-437a-b0c4-c242d82e8e3f	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMF20250900000002	primary	admin Main Wallet	260000.00	260000.00	0.00	0.00	NGN	{}	1000000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 19:44:07.509087	2025-09-13 17:53:26.962867	\N	\N	active	t
daa9b1f7-4897-4b2d-be48-4e2f6bc811df	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	MIG20250900000226	main	demo Main Wallet	500000.00	500000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-10 20:28:52.30177	2025-09-13 11:13:35.467844	\N	\N	active	f
9332108e-750a-4ded-bfca-52cd9e1fea2b	06cd7648-a556-41b1-9ffa-a831ff75b982	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMF20250900000001	primary	demo Main Wallet	89900.00	89900.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 19:44:07.505231	2025-09-13 14:55:53.334299	\N	\N	active	t
\.


--
-- Name: transaction_ref_seq; Type: SEQUENCE SET; Schema: tenant; Owner: -
--

SELECT pg_catalog.setval('tenant.transaction_ref_seq', 1, false);


--
-- Name: wallet_number_seq; Type: SEQUENCE SET; Schema: tenant; Owner: -
--

SELECT pg_catalog.setval('tenant.wallet_number_seq', 256, true);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_patterns user_behavior_patterns_pkey; Type: CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_patterns user_behavior_patterns_user_id_pattern_date_key; Type: CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_user_id_pattern_date_key UNIQUE (user_id, pattern_date);


--
-- Name: ai_conversation_analytics ai_conversation_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_pkey PRIMARY KEY (id);


--
-- Name: ai_fraud_analytics ai_fraud_analytics_pkey; Type: CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_pkey PRIMARY KEY (id);


--
-- Name: cbn_compliance_reports cbn_compliance_reports_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.cbn_compliance_reports
    ADD CONSTRAINT cbn_compliance_reports_pkey PRIMARY KEY (report_id);


--
-- Name: cbn_incidents cbn_incidents_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_pkey PRIMARY KEY (incident_id);


--
-- Name: cbn_security_audits cbn_security_audits_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.cbn_security_audits
    ADD CONSTRAINT cbn_security_audits_pkey PRIMARY KEY (audit_id);


--
-- Name: data_localization_checks data_localization_checks_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.data_localization_checks
    ADD CONSTRAINT data_localization_checks_pkey PRIMARY KEY (check_id);


--
-- Name: network_segmentation network_segmentation_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.network_segmentation
    ADD CONSTRAINT network_segmentation_pkey PRIMARY KEY (segmentation_id);


--
-- Name: pci_dss_compliance pci_dss_compliance_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.pci_dss_compliance
    ADD CONSTRAINT pci_dss_compliance_pkey PRIMARY KEY (compliance_id);


--
-- Name: pci_dss_findings pci_dss_findings_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_pkey PRIMARY KEY (finding_id);


--
-- Name: pci_dss_requirements pci_dss_requirements_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_pkey PRIMARY KEY (requirement_id);


--
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: siem_events siem_events_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.siem_events
    ADD CONSTRAINT siem_events_pkey PRIMARY KEY (event_id);


--
-- Name: siem_rules siem_rules_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.siem_rules
    ADD CONSTRAINT siem_rules_pkey PRIMARY KEY (rule_id);


--
-- Name: tenant_audit_logs tenant_audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: threat_intelligence threat_intelligence_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.threat_intelligence
    ADD CONSTRAINT threat_intelligence_pkey PRIMARY KEY (indicator_id);


--
-- Name: ai_models ai_models_name_version_tenant_id_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_name_version_tenant_id_key UNIQUE (name, version, tenant_id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- Name: platform_config platform_config_config_key_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_config_key_key UNIQUE (config_key);


--
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);


--
-- Name: tenant_assets tenant_assets_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_pkey PRIMARY KEY (id);


--
-- Name: tenant_assets tenant_assets_tenant_id_asset_type_asset_name_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_asset_type_asset_name_key UNIQUE (tenant_id, asset_type, asset_name);


--
-- Name: tenant_billing tenant_billing_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_pkey PRIMARY KEY (id);


--
-- Name: tenant_billing tenant_billing_tenant_id_billing_period_start_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_billing_period_start_key UNIQUE (tenant_id, billing_period_start);


--
-- Name: tenant_usage_metrics tenant_usage_metrics_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_metric_date_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_metric_date_key UNIQUE (tenant_id, metric_date);


--
-- Name: tenants tenants_bank_code_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_bank_code_key UNIQUE (bank_code);


--
-- Name: tenants tenants_name_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_name_key UNIQUE (name);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: bill_providers bill_providers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.bill_providers
    ADD CONSTRAINT bill_providers_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: fraud_alerts fraud_alerts_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_pkey PRIMARY KEY (id);


--
-- Name: internal_transfers internal_transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_pkey PRIMARY KEY (id);


--
-- Name: internal_transfers internal_transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_reference_key UNIQUE (reference);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_user_id_account_number_bank_code_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_account_number_bank_code_key UNIQUE (user_id, account_number, bank_code);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referrer_id_referee_id_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_referee_id_key UNIQUE (referrer_id, referee_id);


--
-- Name: tenant_metadata tenant_metadata_tenant_id_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.tenant_metadata
    ADD CONSTRAINT tenant_metadata_tenant_id_key UNIQUE (tenant_id);


--
-- Name: transaction_logs transaction_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_reference_key UNIQUE (reference);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_reference_key UNIQUE (reference);


--
-- Name: user_activity_logs user_activity_logs_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_account_number_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_account_number_key UNIQUE (account_number);


--
-- Name: users users_bvn_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_bvn_key UNIQUE (bvn);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_nin_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_nin_key UNIQUE (nin);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: wallet_fundings wallet_fundings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_pkey PRIMARY KEY (id);


--
-- Name: wallet_fundings wallet_fundings_reference_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_reference_key UNIQUE (reference);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_wallet_type_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_wallet_type_key UNIQUE (user_id, wallet_type);


--
-- Name: wallets wallets_wallet_number_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_wallet_number_key UNIQUE (wallet_number);


--
-- Name: idx_conversation_messages_conv; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversation_messages_conv ON ai.conversation_messages USING btree (conversation_id, created_at);


--
-- Name: idx_conversation_messages_expires; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversation_messages_expires ON ai.conversation_messages USING btree (expires_at);


--
-- Name: idx_conversations_escalated; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversations_escalated ON ai.conversations USING btree (escalated_to_human) WHERE (escalated_to_human = true);


--
-- Name: idx_conversations_satisfaction; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversations_satisfaction ON ai.conversations USING btree (user_satisfaction) WHERE (user_satisfaction IS NOT NULL);


--
-- Name: idx_conversations_session; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversations_session ON ai.conversations USING btree (session_id);


--
-- Name: idx_conversations_user_date; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_conversations_user_date ON ai.conversations USING btree (user_id, started_at);


--
-- Name: idx_user_behavior_cluster; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_user_behavior_cluster ON ai.user_behavior_patterns USING btree (behavior_cluster);


--
-- Name: idx_user_behavior_date; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_user_behavior_date ON ai.user_behavior_patterns USING btree (pattern_date);


--
-- Name: idx_user_behavior_user_date; Type: INDEX; Schema: ai; Owner: -
--

CREATE INDEX idx_user_behavior_user_date ON ai.user_behavior_patterns USING btree (user_id, pattern_date);


--
-- Name: idx_ai_conversation_date; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX idx_ai_conversation_date ON analytics.ai_conversation_analytics USING btree (conversation_date);


--
-- Name: idx_ai_conversation_tenant_date; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX idx_ai_conversation_tenant_date ON analytics.ai_conversation_analytics USING btree (tenant_id, conversation_date);


--
-- Name: idx_ai_fraud_date; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX idx_ai_fraud_date ON analytics.ai_fraud_analytics USING btree (analysis_date);


--
-- Name: idx_ai_fraud_tenant_date; Type: INDEX; Schema: analytics; Owner: -
--

CREATE INDEX idx_ai_fraud_tenant_date ON analytics.ai_fraud_analytics USING btree (tenant_id, analysis_date);


--
-- Name: idx_tenant_audit_event_type; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_event_type ON audit.tenant_audit_logs USING btree (event_type, created_at);


--
-- Name: idx_tenant_audit_resource; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_resource ON audit.tenant_audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_tenant_audit_risk_level; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_risk_level ON audit.tenant_audit_logs USING btree (risk_level) WHERE ((risk_level)::text = ANY ((ARRAY['high'::character varying, 'critical'::character varying])::text[]));


--
-- Name: idx_tenant_audit_service_operation; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_service_operation ON audit.tenant_audit_logs USING btree (service_name, operation);


--
-- Name: idx_tenant_audit_tenant_created; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_tenant_created ON audit.tenant_audit_logs USING btree (tenant_id, created_at);


--
-- Name: idx_tenant_audit_user; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_tenant_audit_user ON audit.tenant_audit_logs USING btree (user_id, created_at);


--
-- Name: idx_ai_models_public; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_ai_models_public ON platform.ai_models USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_ai_models_shared; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_ai_models_shared ON platform.ai_models USING btree (is_shared) WHERE (is_shared = true);


--
-- Name: idx_ai_models_tenant_type; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_ai_models_tenant_type ON platform.ai_models USING btree (tenant_id, type);


--
-- Name: idx_ai_models_type_status; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_ai_models_type_status ON platform.ai_models USING btree (type, status);


--
-- Name: idx_platform_config_active; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_platform_config_active ON platform.platform_config USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_platform_config_key; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_platform_config_key ON platform.platform_config USING btree (config_key);


--
-- Name: idx_platform_config_type; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_platform_config_type ON platform.platform_config USING btree (config_type);


--
-- Name: idx_tenant_assets_name; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_assets_name ON platform.tenant_assets USING btree (asset_name);


--
-- Name: idx_tenant_assets_tenant_type; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_assets_tenant_type ON platform.tenant_assets USING btree (tenant_id, asset_type);


--
-- Name: idx_tenant_billing_due_date; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_billing_due_date ON platform.tenant_billing USING btree (due_date);


--
-- Name: idx_tenant_billing_status; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_billing_status ON platform.tenant_billing USING btree (status);


--
-- Name: idx_tenant_billing_tenant_period; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_billing_tenant_period ON platform.tenant_billing USING btree (tenant_id, billing_period_start);


--
-- Name: idx_tenant_usage_date; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_usage_date ON platform.tenant_usage_metrics USING btree (metric_date);


--
-- Name: idx_tenant_usage_tenant_date; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenant_usage_tenant_date ON platform.tenant_usage_metrics USING btree (tenant_id, metric_date);


--
-- Name: idx_tenants_created_at; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_created_at ON platform.tenants USING btree (created_at);


--
-- Name: idx_tenants_custom_domain; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_custom_domain ON platform.tenants USING btree (custom_domain) WHERE (custom_domain IS NOT NULL);


--
-- Name: idx_tenants_database_status; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_database_status ON platform.tenants USING btree (database_status);


--
-- Name: idx_tenants_region; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_region ON platform.tenants USING btree (region);


--
-- Name: idx_tenants_status; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_status ON platform.tenants USING btree (status);


--
-- Name: idx_tenants_subdomain; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_subdomain ON platform.tenants USING btree (subdomain);


--
-- Name: idx_tenants_tier; Type: INDEX; Schema: platform; Owner: -
--

CREATE INDEX idx_tenants_tier ON platform.tenants USING btree (tier);


--
-- Name: idx_activity_logs_activity_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_activity_logs_activity_type ON tenant.user_activity_logs USING btree (activity_type);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_activity_logs_created_at ON tenant.user_activity_logs USING btree (created_at);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_activity_logs_user_id ON tenant.user_activity_logs USING btree (user_id);


--
-- Name: idx_documents_ai_processed; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_documents_ai_processed ON tenant.documents USING btree (ai_processed, ai_verification_status);


--
-- Name: idx_documents_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_documents_type ON tenant.documents USING btree (document_type);


--
-- Name: idx_documents_user; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_documents_user ON tenant.documents USING btree (user_id);


--
-- Name: idx_documents_verification; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_documents_verification ON tenant.documents USING btree (verification_status);


--
-- Name: idx_fraud_alerts_created; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_fraud_alerts_created ON tenant.fraud_alerts USING btree (created_at);


--
-- Name: idx_fraud_alerts_severity; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_fraud_alerts_severity ON tenant.fraud_alerts USING btree (severity);


--
-- Name: idx_fraud_alerts_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_fraud_alerts_status ON tenant.fraud_alerts USING btree (status);


--
-- Name: idx_fraud_alerts_transaction; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_fraud_alerts_transaction ON tenant.fraud_alerts USING btree (transaction_id);


--
-- Name: idx_fraud_alerts_user; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_fraud_alerts_user ON tenant.fraud_alerts USING btree (user_id);


--
-- Name: idx_internal_transfers_from_wallet; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_internal_transfers_from_wallet ON tenant.internal_transfers USING btree (from_wallet_id);


--
-- Name: idx_internal_transfers_reference; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_internal_transfers_reference ON tenant.internal_transfers USING btree (reference);


--
-- Name: idx_internal_transfers_to_wallet; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_internal_transfers_to_wallet ON tenant.internal_transfers USING btree (to_wallet_id);


--
-- Name: idx_internal_transfers_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_internal_transfers_user_id ON tenant.internal_transfers USING btree (user_id);


--
-- Name: idx_kyc_documents_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_kyc_documents_status ON tenant.kyc_documents USING btree (status);


--
-- Name: idx_kyc_documents_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_kyc_documents_type ON tenant.kyc_documents USING btree (document_type);


--
-- Name: idx_kyc_documents_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_kyc_documents_user_id ON tenant.kyc_documents USING btree (user_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_notifications_created ON tenant.notifications USING btree (created_at);


--
-- Name: idx_notifications_priority; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_notifications_priority ON tenant.notifications USING btree (priority);


--
-- Name: idx_notifications_scheduled; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_notifications_scheduled ON tenant.notifications USING btree (scheduled_for) WHERE (scheduled_for IS NOT NULL);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_notifications_type ON tenant.notifications USING btree (type);


--
-- Name: idx_notifications_user_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_notifications_user_status ON tenant.notifications USING btree (user_id, status);


--
-- Name: idx_recipients_account_number; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_recipients_account_number ON tenant.recipients USING btree (account_number);


--
-- Name: idx_recipients_bank_code; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_recipients_bank_code ON tenant.recipients USING btree (bank_code);


--
-- Name: idx_recipients_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_recipients_user_id ON tenant.recipients USING btree (user_id);


--
-- Name: idx_referrals_code; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_referrals_code ON tenant.referrals USING btree (referral_code);


--
-- Name: idx_referrals_referee_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_referrals_referee_id ON tenant.referrals USING btree (referee_id);


--
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_referrals_referrer_id ON tenant.referrals USING btree (referrer_id);


--
-- Name: idx_transaction_logs_created_at; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transaction_logs_created_at ON tenant.transaction_logs USING btree (created_at);


--
-- Name: idx_transaction_logs_event_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transaction_logs_event_type ON tenant.transaction_logs USING btree (event_type);


--
-- Name: idx_transaction_logs_transfer_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transaction_logs_transfer_id ON tenant.transaction_logs USING btree (transfer_id);


--
-- Name: idx_transactions_ai_initiated; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_ai_initiated ON tenant.transactions USING btree (ai_initiated) WHERE (ai_initiated = true);


--
-- Name: idx_transactions_amount_range; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_amount_range ON tenant.transactions USING btree (amount);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_created_at ON tenant.transactions USING btree (created_at);


--
-- Name: idx_transactions_external_ref; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_external_ref ON tenant.transactions USING btree (external_reference) WHERE (external_reference IS NOT NULL);


--
-- Name: idx_transactions_fraud_score; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_fraud_score ON tenant.transactions USING btree (fraud_score) WHERE (fraud_score IS NOT NULL);


--
-- Name: idx_transactions_provider; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_provider ON tenant.transactions USING btree (payment_provider);


--
-- Name: idx_transactions_reference; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_reference ON tenant.transactions USING btree (reference);


--
-- Name: idx_transactions_risk_level; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_risk_level ON tenant.transactions USING btree (risk_level) WHERE ((risk_level)::text = ANY ((ARRAY['high'::character varying, 'critical'::character varying])::text[]));


--
-- Name: idx_transactions_settlement; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_settlement ON tenant.transactions USING btree (settlement_date, reconciliation_status);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_status ON tenant.transactions USING btree (status);


--
-- Name: idx_transactions_tenant_user; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_tenant_user ON tenant.transactions USING btree (tenant_id, user_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_type ON tenant.transactions USING btree (type);


--
-- Name: idx_transactions_type_status_date; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_type_status_date ON tenant.transactions USING btree (type, status, created_at);


--
-- Name: idx_transactions_user_status_date; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transactions_user_status_date ON tenant.transactions USING btree (user_id, status, created_at);


--
-- Name: idx_transfers_created_at; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_created_at ON tenant.transfers USING btree (created_at);


--
-- Name: idx_transfers_date_range; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_date_range ON tenant.transfers USING btree (sender_id, created_at);


--
-- Name: idx_transfers_nibss_transaction_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_nibss_transaction_id ON tenant.transfers USING btree (nibss_transaction_id);


--
-- Name: idx_transfers_recipient_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_recipient_id ON tenant.transfers USING btree (recipient_id);


--
-- Name: idx_transfers_reference; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_reference ON tenant.transfers USING btree (reference);


--
-- Name: idx_transfers_sender_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_sender_id ON tenant.transfers USING btree (sender_id);


--
-- Name: idx_transfers_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_transfers_status ON tenant.transfers USING btree (status);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_user_sessions_expires ON tenant.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_suspicious; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_user_sessions_suspicious ON tenant.user_sessions USING btree (is_suspicious) WHERE (is_suspicious = true);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_user_sessions_token ON tenant.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_user_sessions_user ON tenant.user_sessions USING btree (user_id);


--
-- Name: idx_users_account_number; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_account_number ON tenant.users USING btree (account_number) WHERE (account_number IS NOT NULL);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_created_at ON tenant.users USING btree (created_at);


--
-- Name: idx_users_email_tenant; Type: INDEX; Schema: tenant; Owner: -
--

CREATE UNIQUE INDEX idx_users_email_tenant ON tenant.users USING btree (email, tenant_id);


--
-- Name: idx_users_kyc_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_kyc_status ON tenant.users USING btree (kyc_status);


--
-- Name: idx_users_phone_tenant; Type: INDEX; Schema: tenant; Owner: -
--

CREATE UNIQUE INDEX idx_users_phone_tenant ON tenant.users USING btree (phone_number, tenant_id);


--
-- Name: idx_users_referral_code; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_referral_code ON tenant.users USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- Name: idx_users_risk_profile; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_risk_profile ON tenant.users USING btree (risk_profile);


--
-- Name: idx_users_role; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_role ON tenant.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_users_status ON tenant.users USING btree (status);


--
-- Name: idx_wallet_fundings_reference; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_fundings_reference ON tenant.wallet_fundings USING btree (reference);


--
-- Name: idx_wallet_fundings_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_fundings_status ON tenant.wallet_fundings USING btree (status);


--
-- Name: idx_wallet_fundings_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_fundings_user_id ON tenant.wallet_fundings USING btree (user_id);


--
-- Name: idx_wallet_fundings_wallet_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_fundings_wallet_id ON tenant.wallet_fundings USING btree (wallet_id);


--
-- Name: idx_wallet_transactions_transaction; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_transactions_transaction ON tenant.wallet_transactions USING btree (transaction_id);


--
-- Name: idx_wallet_transactions_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_transactions_type ON tenant.wallet_transactions USING btree (transaction_type);


--
-- Name: idx_wallet_transactions_wallet; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallet_transactions_wallet ON tenant.wallet_transactions USING btree (wallet_id, created_at);


--
-- Name: idx_wallets_balance; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_balance ON tenant.wallets USING btree (balance);


--
-- Name: idx_wallets_number; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_number ON tenant.wallets USING btree (wallet_number);


--
-- Name: idx_wallets_primary; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_primary ON tenant.wallets USING btree (user_id, is_primary) WHERE (is_primary = true);


--
-- Name: idx_wallets_status; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_status ON tenant.wallets USING btree (is_active, is_frozen);


--
-- Name: idx_wallets_tenant_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_tenant_id ON tenant.wallets USING btree (tenant_id);


--
-- Name: idx_wallets_type; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_type ON tenant.wallets USING btree (wallet_type);


--
-- Name: idx_wallets_user_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_user_id ON tenant.wallets USING btree (user_id);


--
-- Name: idx_wallets_user_tenant; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_wallets_user_tenant ON tenant.wallets USING btree (user_id, tenant_id);


--
-- Name: unique_primary_wallet_per_user; Type: INDEX; Schema: tenant; Owner: -
--

CREATE UNIQUE INDEX unique_primary_wallet_per_user ON tenant.wallets USING btree (user_id) WHERE (is_primary = true);


--
-- Name: tenants log_tenant_changes_trigger; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER log_tenant_changes_trigger AFTER INSERT OR DELETE OR UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.log_tenant_changes();


--
-- Name: tenant_assets trigger_tenant_assets_updated_at; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER trigger_tenant_assets_updated_at BEFORE UPDATE ON platform.tenant_assets FOR EACH ROW EXECUTE FUNCTION platform.update_tenant_assets_updated_at();


--
-- Name: ai_models update_ai_models_updated_at; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON platform.ai_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_config update_platform_config_updated_at; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON platform.platform_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenant_billing update_tenant_billing_updated_at; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER update_tenant_billing_updated_at BEFORE UPDATE ON platform.tenant_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: platform; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON platform.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users auto_assign_account_number; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER auto_assign_account_number BEFORE INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.assign_account_number();


--
-- Name: users auto_create_primary_wallet; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER auto_create_primary_wallet AFTER INSERT ON tenant.users FOR EACH ROW EXECUTE FUNCTION platform.create_primary_wallet();


--
-- Name: transactions create_wallet_transaction_trigger; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER create_wallet_transaction_trigger AFTER UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.create_wallet_transaction();


--
-- Name: transactions generate_transaction_reference_trigger; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER generate_transaction_reference_trigger BEFORE INSERT ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_reference();


--
-- Name: wallets generate_wallet_number_trigger; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER generate_wallet_number_trigger BEFORE INSERT ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.generate_wallet_number();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON tenant.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fraud_alerts update_fraud_alerts_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_fraud_alerts_updated_at BEFORE UPDATE ON tenant.fraud_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recipients update_recipients_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON tenant.recipients FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON tenant.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transfers update_transfers_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON tenant.transfers FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON tenant.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallets update_wallets_balance_trigger; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_wallets_balance_trigger BEFORE INSERT OR UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();


--
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON tenant.wallets FOR EACH ROW EXECUTE FUNCTION platform.update_updated_at_column();


--
-- Name: conversation_messages conversation_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.conversation_messages
    ADD CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES ai.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_patterns user_behavior_patterns_user_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: -
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: ai_conversation_analytics ai_conversation_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.ai_conversation_analytics
    ADD CONSTRAINT ai_conversation_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_fraud_analytics ai_fraud_analytics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: analytics; Owner: -
--

ALTER TABLE ONLY analytics.ai_fraud_analytics
    ADD CONSTRAINT ai_fraud_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: cbn_incidents cbn_incidents_compliance_report_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.cbn_incidents
    ADD CONSTRAINT cbn_incidents_compliance_report_id_fkey FOREIGN KEY (compliance_report_id) REFERENCES audit.cbn_compliance_reports(report_id);


--
-- Name: pci_dss_findings pci_dss_findings_requirement_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.pci_dss_findings
    ADD CONSTRAINT pci_dss_findings_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES audit.pci_dss_requirements(requirement_id);


--
-- Name: pci_dss_requirements pci_dss_requirements_compliance_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.pci_dss_requirements
    ADD CONSTRAINT pci_dss_requirements_compliance_id_fkey FOREIGN KEY (compliance_id) REFERENCES audit.pci_dss_compliance(compliance_id);


--
-- Name: tenant_audit_logs tenant_audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.tenant_audit_logs
    ADD CONSTRAINT tenant_audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: ai_models ai_models_parent_model_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_parent_model_id_fkey FOREIGN KEY (parent_model_id) REFERENCES platform.ai_models(id);


--
-- Name: ai_models ai_models_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.ai_models
    ADD CONSTRAINT ai_models_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_assets tenant_assets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_assets
    ADD CONSTRAINT tenant_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_billing tenant_billing_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_billing
    ADD CONSTRAINT tenant_billing_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_usage_metrics tenant_usage_metrics_tenant_id_fkey; Type: FK CONSTRAINT; Schema: platform; Owner: -
--

ALTER TABLE ONLY platform.tenant_usage_metrics
    ADD CONSTRAINT tenant_usage_metrics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES platform.tenants(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.documents
    ADD CONSTRAINT documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES tenant.users(id);


--
-- Name: fraud_alerts fraud_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES tenant.users(id);


--
-- Name: fraud_alerts fraud_alerts_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: fraud_alerts fraud_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.fraud_alerts
    ADD CONSTRAINT fraud_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: internal_transfers internal_transfers_from_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_from_wallet_id_fkey FOREIGN KEY (from_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: internal_transfers internal_transfers_to_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_to_wallet_id_fkey FOREIGN KEY (to_wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: internal_transfers internal_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_alert_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_alert_id_fkey FOREIGN KEY (related_alert_id) REFERENCES tenant.fraud_alerts(id);


--
-- Name: notifications notifications_related_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_related_transaction_id_fkey FOREIGN KEY (related_transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: recipients recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referee_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES tenant.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES tenant.users(id);


--
-- Name: transaction_logs transaction_logs_transfer_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transaction_logs
    ADD CONSTRAINT transaction_logs_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES tenant.transfers(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_parent_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_parent_transaction_id_fkey FOREIGN KEY (parent_transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: transfers transfers_recipient_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES tenant.recipients(id);


--
-- Name: transfers transfers_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES tenant.users(id);


--
-- Name: transfers transfers_sender_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES tenant.users(id);


--
-- Name: user_activity_logs user_activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_activity_logs
    ADD CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: wallet_fundings wallet_fundings_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id);


--
-- Name: wallet_fundings wallet_fundings_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id);


--
-- Name: wallet_transactions wallet_transactions_transaction_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES tenant.transactions(id);


--
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES tenant.wallets(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: conversations; Type: ROW SECURITY; Schema: ai; Owner: -
--

ALTER TABLE ai.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_behavior_patterns; Type: ROW SECURITY; Schema: ai; Owner: -
--

ALTER TABLE ai.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversation_analytics; Type: ROW SECURITY; Schema: analytics; Owner: -
--

ALTER TABLE analytics.ai_conversation_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_fraud_analytics; Type: ROW SECURITY; Schema: analytics; Owner: -
--

ALTER TABLE analytics.ai_fraud_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_audit_logs; Type: ROW SECURITY; Schema: audit; Owner: -
--

ALTER TABLE audit.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_billing; Type: ROW SECURITY; Schema: platform; Owner: -
--

ALTER TABLE platform.tenant_billing ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_billing tenant_billing_isolation; Type: POLICY; Schema: platform; Owner: -
--

CREATE POLICY tenant_billing_isolation ON platform.tenant_billing USING ((tenant_id = public.get_current_tenant_id()));


--
-- Name: tenant_usage_metrics tenant_usage_isolation; Type: POLICY; Schema: platform; Owner: -
--

CREATE POLICY tenant_usage_isolation ON platform.tenant_usage_metrics USING ((tenant_id = public.get_current_tenant_id()));


--
-- Name: tenant_usage_metrics; Type: ROW SECURITY; Schema: platform; Owner: -
--

ALTER TABLE platform.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: fraud_alerts; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.fraud_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.users ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.wallets ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ZOTNf2BexdbbwiVgYfUuvceScWeSkB7e5xNhyIzWDRRklhjhqbOgJgTqgdFHDEq

