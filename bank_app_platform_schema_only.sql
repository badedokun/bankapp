--
-- PostgreSQL database dump
--

\restrict Ipht8HII6LCvpCrhPmIi8uWyQHATePWTraUVJM4f5VQxA8LdR0AXbxZ1o1ljFEb

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

\unrestrict Ipht8HII6LCvpCrhPmIi8uWyQHATePWTraUVJM4f5VQxA8LdR0AXbxZ1o1ljFEb

