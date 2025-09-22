--
-- PostgreSQL database dump
--

\restrict 6a6uDpdm8UT5AjzW5zcu8PHHbKFxpGdSQ0XrpdomgTBhMpcE0Ye7lT0xxXKkB2A

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

DROP DATABASE IF EXISTS tenant_fmfb_db;
--
-- Name: tenant_fmfb_db; Type: DATABASE; Schema: -; Owner: bisiadedokun
--

CREATE DATABASE tenant_fmfb_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.UTF-8';


ALTER DATABASE tenant_fmfb_db OWNER TO bisiadedokun;

\unrestrict 6a6uDpdm8UT5AjzW5zcu8PHHbKFxpGdSQ0XrpdomgTBhMpcE0Ye7lT0xxXKkB2A
\connect tenant_fmfb_db
\restrict 6a6uDpdm8UT5AjzW5zcu8PHHbKFxpGdSQ0XrpdomgTBhMpcE0Ye7lT0xxXKkB2A

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
-- Name: ai; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA ai;


ALTER SCHEMA ai OWNER TO bisiadedokun;

--
-- Name: analytics; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA analytics;


ALTER SCHEMA analytics OWNER TO bisiadedokun;

--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO bisiadedokun;

--
-- Name: tenant; Type: SCHEMA; Schema: -; Owner: bisiadedokun
--

CREATE SCHEMA tenant;


ALTER SCHEMA tenant OWNER TO bisiadedokun;

--
-- Name: btree_gin; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;


--
-- Name: EXTENSION btree_gin; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';


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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation_messages; Type: TABLE; Schema: ai; Owner: bisiadedokun
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


ALTER TABLE ai.conversation_messages OWNER TO bisiadedokun;

--
-- Name: conversations; Type: TABLE; Schema: ai; Owner: bisiadedokun
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


ALTER TABLE ai.conversations OWNER TO bisiadedokun;

--
-- Name: TABLE conversations; Type: COMMENT; Schema: ai; Owner: bisiadedokun
--

COMMENT ON TABLE ai.conversations IS 'AI conversation analytics (no PII)';


--
-- Name: user_behavior_patterns; Type: TABLE; Schema: ai; Owner: bisiadedokun
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


ALTER TABLE ai.user_behavior_patterns OWNER TO bisiadedokun;

--
-- Name: ai_analytics_insights; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_analytics_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    insight_type character varying(50) NOT NULL,
    insight_data jsonb NOT NULL,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    relevance_score numeric(3,2) DEFAULT 1.0
);


ALTER TABLE tenant.ai_analytics_insights OWNER TO bisiadedokun;

--
-- Name: ai_configuration; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_configuration (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    feature_name character varying(100) NOT NULL,
    is_enabled boolean DEFAULT true,
    configuration jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_configuration OWNER TO bisiadedokun;

--
-- Name: ai_context_mappings; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_context_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    context_key character varying(100) NOT NULL,
    context_value jsonb NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_context_mappings OWNER TO bisiadedokun;

--
-- Name: ai_conversation_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_conversation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id character varying(100),
    user_message text NOT NULL,
    ai_response text NOT NULL,
    intent_detected character varying(100),
    confidence_score numeric(3,2),
    response_time_ms integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_conversation_logs OWNER TO bisiadedokun;

--
-- Name: ai_intent_categories; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_intent_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_intent_categories OWNER TO bisiadedokun;

--
-- Name: ai_intent_patterns; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_intent_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    pattern_text text NOT NULL,
    intent_name character varying(100) NOT NULL,
    confidence_threshold numeric(3,2) DEFAULT 0.8,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_intent_patterns OWNER TO bisiadedokun;

--
-- Name: ai_learning_feedback; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_learning_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid,
    feedback_type character varying(50) NOT NULL,
    feedback_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_learning_feedback OWNER TO bisiadedokun;

--
-- Name: ai_response_templates; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_response_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    intent_name character varying(100) NOT NULL,
    template_text text NOT NULL,
    variables jsonb,
    language_code character varying(5) DEFAULT 'en'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_response_templates OWNER TO bisiadedokun;

--
-- Name: ai_smart_suggestions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_smart_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    suggestion_type character varying(50) NOT NULL,
    suggestion_data jsonb NOT NULL,
    priority integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone
);


ALTER TABLE tenant.ai_smart_suggestions OWNER TO bisiadedokun;

--
-- Name: ai_translation_patterns; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.ai_translation_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_language character varying(5) NOT NULL,
    target_language character varying(5) NOT NULL,
    source_text text NOT NULL,
    translated_text text NOT NULL,
    context character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.ai_translation_patterns OWNER TO bisiadedokun;

--
-- Name: bill_providers; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.bill_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_name character varying(255) NOT NULL,
    provider_code character varying(50) NOT NULL,
    category character varying(100),
    is_active boolean DEFAULT true,
    fee_structure jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    CONSTRAINT documents_ai_verification_status_check CHECK (((ai_verification_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'failed'::character varying, 'manual_review'::character varying])::text[]))),
    CONSTRAINT documents_document_type_check CHECK (((document_type)::text = ANY ((ARRAY['national_id'::character varying, 'drivers_license'::character varying, 'passport'::character varying, 'voters_card'::character varying, 'birth_certificate'::character varying, 'utility_bill'::character varying, 'bank_statement'::character varying, 'salary_slip'::character varying, 'tax_certificate'::character varying, 'business_registration'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT documents_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
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
    CONSTRAINT fraud_alerts_alert_type_check CHECK (((alert_type)::text = ANY ((ARRAY['high_risk_transaction'::character varying, 'unusual_pattern'::character varying, 'velocity_check'::character varying, 'location_anomaly'::character varying, 'device_mismatch'::character varying, 'time_anomaly'::character varying, 'amount_anomaly'::character varying, 'recipient_risk'::character varying])::text[]))),
    CONSTRAINT fraud_alerts_priority_check CHECK (((priority >= 1) AND (priority <= 10))),
    CONSTRAINT fraud_alerts_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT fraud_alerts_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'false_positive'::character varying, 'escalated'::character varying])::text[])))
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text,
    reference_number character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.internal_transfers OWNER TO bisiadedokun;

--
-- Name: kyc_documents; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.kyc_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    document_type character varying(50) NOT NULL,
    document_number character varying(100),
    document_data text,
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp without time zone
);


ALTER TABLE tenant.kyc_documents OWNER TO bisiadedokun;

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
    CONSTRAINT notifications_personalization_level_check CHECK (((personalization_level)::text = ANY ((ARRAY['none'::character varying, 'basic'::character varying, 'standard'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT notifications_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT notifications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'queued'::character varying, 'sent'::character varying, 'delivered'::character varying, 'read'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['transaction_completed'::character varying, 'transaction_failed'::character varying, 'security_alert'::character varying, 'fraud_alert'::character varying, 'ai_insight'::character varying, 'system_maintenance'::character varying, 'account_update'::character varying, 'payment_reminder'::character varying, 'kyc_required'::character varying, 'limit_exceeded'::character varying, 'promotional'::character varying])::text[])))
);


ALTER TABLE tenant.notifications OWNER TO bisiadedokun;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.notifications IS 'User notifications and communications';


--
-- Name: recipients; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recipient_name character varying(255) NOT NULL,
    account_number character varying(20) NOT NULL,
    bank_code character varying(10),
    bank_name character varying(255),
    is_favorite boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.recipients OWNER TO bisiadedokun;

--
-- Name: referrals; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid,
    referral_code character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    reward_amount numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


ALTER TABLE tenant.referrals OWNER TO bisiadedokun;

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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    transaction_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.transaction_logs OWNER TO bisiadedokun;

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
    CONSTRAINT transactions_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT transactions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'blocked'::character varying, 'reversed'::character varying, 'disputed'::character varying, 'settled'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['cash_withdrawal'::character varying, 'money_transfer'::character varying, 'bill_payment'::character varying, 'airtime_purchase'::character varying, 'balance_inquiry'::character varying, 'account_opening'::character varying, 'loan_payment'::character varying, 'investment'::character varying, 'pos_payment'::character varying, 'qr_payment'::character varying, 'bulk_transfer'::character varying])::text[])))
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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_user_id uuid,
    recipient_name character varying(255),
    recipient_account_number character varying(20),
    recipient_bank_code character varying(10),
    amount numeric(15,2) NOT NULL,
    fees numeric(15,2) DEFAULT 0,
    description text,
    reference_number character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.transfers OWNER TO bisiadedokun;

--
-- Name: user_activity_logs; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.user_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    description text,
    ip_address character varying(45),
    user_agent text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.user_activity_logs OWNER TO bisiadedokun;

--
-- Name: user_sessions; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    refresh_token character varying(255),
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
    CONSTRAINT check_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT users_kyc_level_check CHECK (((kyc_level >= 1) AND (kyc_level <= 3))),
    CONSTRAINT users_kyc_status_check CHECK (((kyc_status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'failed'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT users_risk_profile_check CHECK (((risk_profile)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'super_agent'::character varying, 'agent'::character varying, 'merchant'::character varying, 'viewer'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'pending'::character varying, 'locked'::character varying])::text[])))
);


ALTER TABLE tenant.users OWNER TO bisiadedokun;

--
-- Name: TABLE users; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.users IS 'Tenant-specific user accounts with AI preferences';


--
-- Name: wallet_fundings; Type: TABLE; Schema: tenant; Owner: bisiadedokun
--

CREATE TABLE tenant.wallet_fundings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    funding_source character varying(50),
    reference_number character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE tenant.wallet_fundings OWNER TO bisiadedokun;

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
    CONSTRAINT wallet_transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])))
);


ALTER TABLE tenant.wallet_transactions OWNER TO bisiadedokun;

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
    CONSTRAINT check_available_balance CHECK ((available_balance >= (0)::numeric)),
    CONSTRAINT check_balance_positive CHECK ((balance >= (0)::numeric)),
    CONSTRAINT check_tenant_id CHECK ((tenant_id IS NOT NULL)),
    CONSTRAINT wallets_security_level_check CHECK (((security_level)::text = ANY ((ARRAY['basic'::character varying, 'standard'::character varying, 'premium'::character varying, 'maximum'::character varying])::text[]))),
    CONSTRAINT wallets_wallet_type_check CHECK (((wallet_type)::text = ANY ((ARRAY['main'::character varying, 'savings'::character varying, 'business'::character varying, 'investment'::character varying])::text[])))
);


ALTER TABLE tenant.wallets OWNER TO bisiadedokun;

--
-- Name: TABLE wallets; Type: COMMENT; Schema: tenant; Owner: bisiadedokun
--

COMMENT ON TABLE tenant.wallets IS 'User wallet accounts with AI insights';


--
-- Data for Name: conversation_messages; Type: TABLE DATA; Schema: ai; Owner: bisiadedokun
--

COPY ai.conversation_messages (id, conversation_id, role, content, content_type, intent, confidence, entities, processing_time, language, voice_input, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: ai; Owner: bisiadedokun
--

COPY ai.conversations (id, user_id, session_id, started_at, ended_at, message_count, average_confidence, total_processing_time, successful_resolution, user_satisfaction, escalated_to_human, primary_language, detected_languages, intents_identified, entities_extracted, conversation_summary, sentiment_analysis, topics_discussed, actions_completed, follow_up_required, created_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_patterns; Type: TABLE DATA; Schema: ai; Owner: bisiadedokun
--

COPY ai.user_behavior_patterns (id, user_id, pattern_date, transaction_velocity, average_transaction_amount, preferred_transaction_types, peak_activity_hours, typical_locations, device_fingerprints, preferred_channels, session_duration_avg, features_used, navigation_patterns, ai_usage_frequency, preferred_ai_language, voice_command_usage, satisfaction_trend, security_events, mfa_usage_rate, suspicious_activities, feature_vector, anomaly_score, behavior_cluster, created_at) FROM stdin;
\.


--
-- Data for Name: ai_analytics_insights; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_analytics_insights (id, user_id, insight_type, insight_data, generated_at, relevance_score) FROM stdin;
\.


--
-- Data for Name: ai_configuration; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_configuration (id, tenant_id, feature_name, is_enabled, configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_context_mappings; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_context_mappings (id, user_id, context_key, context_value, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: ai_conversation_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_conversation_logs (id, user_id, session_id, user_message, ai_response, intent_detected, confidence_score, response_time_ms, created_at) FROM stdin;
\.


--
-- Data for Name: ai_intent_categories; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_intent_categories (id, category_name, description, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: ai_intent_patterns; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_intent_patterns (id, category_id, pattern_text, intent_name, confidence_threshold, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: ai_learning_feedback; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_learning_feedback (id, user_id, conversation_id, feedback_type, feedback_data, created_at) FROM stdin;
\.


--
-- Data for Name: ai_response_templates; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_response_templates (id, intent_name, template_text, variables, language_code, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_smart_suggestions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_smart_suggestions (id, user_id, suggestion_type, suggestion_data, priority, is_active, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: ai_translation_patterns; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.ai_translation_patterns (id, source_language, target_language, source_text, translated_text, context, created_at) FROM stdin;
\.


--
-- Data for Name: bill_providers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.bill_providers (id, provider_name, provider_code, category, is_active, fee_structure, created_at, updated_at) FROM stdin;
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

COPY tenant.internal_transfers (id, sender_id, recipient_id, amount, description, reference_number, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.kyc_documents (id, user_id, document_type, document_number, document_data, verification_status, uploaded_at, verified_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.notifications (id, user_id, type, priority, title, message, ai_generated, personalization_level, ai_confidence, rich_content, action_buttons, deep_link, channels, delivery_preferences, status, scheduled_for, sent_at, delivered_at, read_at, expires_at, related_transaction_id, related_alert_id, category, tags, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: recipients; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.recipients (id, user_id, recipient_name, account_number, bank_code, bank_name, is_favorite, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.referrals (id, referrer_id, referred_id, referral_code, status, reward_amount, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: tenant_metadata; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.tenant_metadata (tenant_id, tenant_name, schema_version, created_at, updated_at) FROM stdin;
7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	fmfb	2.0-complete	2025-09-04 22:08:15.947302	2025-09-22 11:34:50.613288
\.


--
-- Data for Name: transaction_logs; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transaction_logs (id, user_id, transaction_type, transaction_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transactions (id, tenant_id, user_id, reference, external_reference, batch_id, parent_transaction_id, type, amount, currency, exchange_rate, original_amount, original_currency, description, merchant_category, transaction_tags, recipient_name, recipient_account, recipient_bank, recipient_bank_code, recipient_details, sender_name, sender_account, sender_bank, sender_details, status, substatus, processing_details, failure_reason, failure_code, ai_initiated, voice_initiated, ai_confidence, natural_language_command, ai_processing_metadata, ai_recommendations, fraud_score, fraud_factors, risk_level, risk_factors, compliance_flags, payment_provider, payment_method, provider_transaction_id, provider_response, provider_fees, total_fees, charges, transaction_location, device_info, channel, settlement_date, settlement_batch, reconciliation_status, initiated_at, created_at, processed_at, completed_at, settled_at, compliance_checked, compliance_score) FROM stdin;
11111111-aaaa-aaaa-aaaa-111111111111	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	427ebae8-3b2c-4379-a0b6-fae7a519aefc	REF001234	\N	\N	\N	money_transfer	25000.00	NGN	1.000000	\N	\N	Transfer to Admin User	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	100.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-04 22:52:00.199066	2025-08-30 22:52:00.199066	2025-08-30 22:52:00.199066	\N	\N	f	\N
22222222-bbbb-bbbb-bbbb-222222222222	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	70ea05fb-ae9f-4812-8fb0-9f18de394888	REF001235	\N	\N	\N	cash_withdrawal	15000.00	NGN	1.000000	\N	\N	ATM Withdrawal	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	completed	\N	{}	\N	\N	f	f	\N	\N	{}	{}	\N	{}	\N	{}	{}	\N	\N	\N	{}	0.00	75.00	{"vat": 0, "base_fee": 0, "stamp_duty": 0, "other_charges": {}, "percentage_fee": 0}	\N	{}	mobile	\N	\N	pending	2025-09-04 22:52:00.199066	2025-08-31 22:52:00.199066	2025-08-31 22:52:00.199066	\N	\N	f	\N
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.transfers (id, sender_id, recipient_user_id, recipient_name, recipient_account_number, recipient_bank_code, amount, fees, description, reference_number, status, created_at, updated_at) FROM stdin;
3c41d761-83a9-4b4d-ba63-78171f12fa9e	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	John Doe	1234567890	GTB	50000.00	100.00	Transfer to John Doe	\N	completed	2025-09-22 08:00:00	2025-09-22 08:00:00
b4a9966c-21ce-429d-a44e-36605875c050	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Jane Smith	0987654321	UBA	25000.00	50.00	Payment to Jane Smith	\N	completed	2025-09-22 09:15:00	2025-09-22 09:15:00
0768c686-bf6a-4930-893e-021e55b12872	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	David Wilson	1122334455	FBN	15000.00	30.00	School fees payment	\N	completed	2025-09-22 10:30:00	2025-09-22 10:30:00
524a1c16-91d9-4488-ac70-ceb91c389a24	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Sarah Johnson	5566778899	ZEN	75000.00	150.00	Business payment	\N	completed	2025-09-22 11:45:00	2025-09-22 11:45:00
386a1188-61fc-40a2-91c1-264aa79d30d6	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Mike Brown	9988776655	ACC	30000.00	60.00	Rent payment	\N	completed	2025-09-22 13:00:00	2025-09-22 13:00:00
d8a7f87d-2d5d-4b4f-8ae2-bba52128a924	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Lisa Davis	1357924680	STB	12000.00	25.00	Gift transfer	\N	completed	2025-09-22 14:15:00	2025-09-22 14:15:00
01378c88-34de-4b55-9f11-3398e9825620	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Robert Taylor	2468135790	UNI	45000.00	90.00	Invoice payment	\N	completed	2025-09-22 15:30:00	2025-09-22 15:30:00
56ad458b-886c-4016-a7f3-d76b1d7c279d	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Emily White	3691472580	POL	18000.00	35.00	Utility payment	\N	completed	2025-09-22 16:45:00	2025-09-22 16:45:00
1d7fc5b6-e4e3-460e-873f-a1497acaced8	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Chris Anderson	7410258963	KEY	65000.00	130.00	Contract payment	\N	completed	2025-09-22 18:00:00	2025-09-22 18:00:00
aed7a798-8519-49f4-aff3-9c749c9043ca	70ea05fb-ae9f-4812-8fb0-9f18de394888	\N	Amanda Clark	8520369741	ECO	22000.00	45.00	Service payment	\N	completed	2025-09-22 19:15:00	2025-09-22 19:15:00
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
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.users (id, tenant_id, email, phone_number, password_hash, first_name, last_name, middle_name, role, status, permissions, bvn, nin, ai_preferences, behavioral_profile, risk_profile, failed_login_attempts, last_login_at, last_login_ip, password_changed_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_methods, biometric_enabled, biometric_templates, profile_data, notification_preferences, last_known_location, registered_devices, kyc_status, kyc_level, kyc_documents, kyc_completed_at, created_at, updated_at, created_by) FROM stdin;
427ebae8-3b2c-4379-a0b6-fae7a519aefc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	demo@fmfb.com	+2348012345678	$2a$06$MGBn7EXWc61iAhPpyqKOmus1pLd7q/8tB6IXmSDKv.MgXI7oItlI.	Demo	User	\N	agent	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	\N	\N	2025-09-04 22:08:15.966034	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 22:08:15.966034	2025-09-04 22:08:15.966034	\N
70ea05fb-ae9f-4812-8fb0-9f18de394888	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	admin@fmfb.com	+2348012345679	$2a$06$keNCArFGOYpGrslefkHAku//o0yJR3Nuxr0ZjUn1NfR1Te4xS9GO.	Admin	User	\N	admin	active	[]	\N	\N	{"language": "en", "data_sharing": {"analytics": true, "personalization": true, "model_improvement": true}, "privacy_level": "standard", "voice_commands": false, "personality_type": "professional", "assistant_enabled": true}	{}	medium	0	2025-09-21 22:43:36.600083	::1	2025-09-04 22:08:15.966034	f	\N	\N	{sms}	f	{}	{"timezone": "Africa/Lagos", "avatar_url": null, "date_format": "DD/MM/YYYY", "currency_format": "₦#,##0.00"}	{"sms": true, "push": true, "email": true, "in_app": true, "categories": {"system": true, "security": true, "marketing": false, "transactions": true}}	\N	[]	pending	1	{}	\N	2025-09-04 22:08:15.966034	2025-09-21 22:43:36.600083	\N
\.


--
-- Data for Name: wallet_fundings; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallet_fundings (id, user_id, wallet_id, amount, funding_source, reference_number, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallet_transactions (id, wallet_id, transaction_id, transaction_type, amount, balance_before, balance_after, description, category, subcategory, reference, external_reference, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: tenant; Owner: bisiadedokun
--

COPY tenant.wallets (id, user_id, tenant_id, wallet_number, wallet_type, wallet_name, balance, available_balance, reserved_balance, pending_balance, currency, foreign_balances, daily_limit, monthly_limit, single_transaction_limit, minimum_balance, ai_insights, predicted_balance, balance_prediction_date, spending_categories, financial_health_score, spending_behavior, interest_rate, reward_points, cashback_earned, is_active, is_frozen, freeze_reason, security_level, account_category, regulatory_status, last_kyc_update, created_at, updated_at, activated_at, last_transaction_at) FROM stdin;
f6f537f4-1d28-496c-8a5e-3e0002e1e7be	427ebae8-3b2c-4379-a0b6-fae7a519aefc	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMFB1757038095976527	main	demo Main Wallet	50000.00	50000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 22:08:15.976249	2025-09-04 22:08:15.976249	\N	\N
b71a5500-7087-4118-b702-285386a07461	70ea05fb-ae9f-4812-8fb0-9f18de394888	7ea1fe0a-6f7d-4838-bcca-4dfdb61ffca3	FMFB1757038095977496	main	admin Main Wallet	222000.00	50000.00	0.00	0.00	NGN	{}	500000.00	5000000.00	100000.00	0.00	{"fraud_alerts": [], "budget_analysis": {}, "spending_patterns": {}, "saving_recommendations": []}	\N	\N	{}	\N	{"impulse_purchases": 0, "peak_spending_days": [], "recurring_payments": [], "average_transaction_size": 0}	0.0000	0	0.00	t	f	\N	standard	individual	compliant	\N	2025-09-04 22:08:15.977206	2025-09-04 22:08:15.977206	\N	\N
\.


--
-- Name: transaction_ref_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.transaction_ref_seq', 1, false);


--
-- Name: wallet_number_seq; Type: SEQUENCE SET; Schema: tenant; Owner: bisiadedokun
--

SELECT pg_catalog.setval('tenant.wallet_number_seq', 1, false);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_patterns user_behavior_patterns_pkey; Type: CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_patterns user_behavior_patterns_user_id_pattern_date_key; Type: CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_user_id_pattern_date_key UNIQUE (user_id, pattern_date);


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
-- Name: ai_intent_categories ai_intent_categories_category_name_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_category_name_key UNIQUE (category_name);


--
-- Name: ai_intent_categories ai_intent_categories_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.ai_intent_categories
    ADD CONSTRAINT ai_intent_categories_pkey PRIMARY KEY (id);


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
-- Name: bill_providers bill_providers_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_providers
    ADD CONSTRAINT bill_providers_pkey PRIMARY KEY (id);


--
-- Name: bill_providers bill_providers_provider_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.bill_providers
    ADD CONSTRAINT bill_providers_provider_code_key UNIQUE (provider_code);


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
-- Name: internal_transfers internal_transfers_reference_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.internal_transfers
    ADD CONSTRAINT internal_transfers_reference_number_key UNIQUE (reference_number);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.recipients
    ADD CONSTRAINT recipients_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referral_code_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.referrals
    ADD CONSTRAINT referrals_referral_code_key UNIQUE (referral_code);


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
-- Name: transfers transfers_reference_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.transfers
    ADD CONSTRAINT transfers_reference_number_key UNIQUE (reference_number);


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
-- Name: wallet_fundings wallet_fundings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_pkey PRIMARY KEY (id);


--
-- Name: wallet_fundings wallet_fundings_reference_number_key; Type: CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.wallet_fundings
    ADD CONSTRAINT wallet_fundings_reference_number_key UNIQUE (reference_number);


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
-- Name: idx_conversation_messages_conv; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversation_messages_conv ON ai.conversation_messages USING btree (conversation_id, created_at);


--
-- Name: idx_conversation_messages_expires; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversation_messages_expires ON ai.conversation_messages USING btree (expires_at);


--
-- Name: idx_conversations_escalated; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversations_escalated ON ai.conversations USING btree (escalated_to_human) WHERE (escalated_to_human = true);


--
-- Name: idx_conversations_satisfaction; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversations_satisfaction ON ai.conversations USING btree (user_satisfaction) WHERE (user_satisfaction IS NOT NULL);


--
-- Name: idx_conversations_session; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversations_session ON ai.conversations USING btree (session_id);


--
-- Name: idx_conversations_user_date; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_conversations_user_date ON ai.conversations USING btree (user_id, started_at);


--
-- Name: idx_user_behavior_cluster; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_user_behavior_cluster ON ai.user_behavior_patterns USING btree (behavior_cluster);


--
-- Name: idx_user_behavior_date; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_user_behavior_date ON ai.user_behavior_patterns USING btree (pattern_date);


--
-- Name: idx_user_behavior_user_date; Type: INDEX; Schema: ai; Owner: bisiadedokun
--

CREATE INDEX idx_user_behavior_user_date ON ai.user_behavior_patterns USING btree (user_id, pattern_date);


--
-- Name: idx_ai_analytics_insights_generated_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_analytics_insights_generated_at ON tenant.ai_analytics_insights USING btree (generated_at);


--
-- Name: idx_ai_analytics_insights_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_analytics_insights_user_id ON tenant.ai_analytics_insights USING btree (user_id);


--
-- Name: idx_ai_conversation_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_logs_created_at ON tenant.ai_conversation_logs USING btree (created_at);


--
-- Name: idx_ai_conversation_logs_session_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_logs_session_id ON tenant.ai_conversation_logs USING btree (session_id);


--
-- Name: idx_ai_conversation_logs_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_conversation_logs_user_id ON tenant.ai_conversation_logs USING btree (user_id);


--
-- Name: idx_ai_smart_suggestions_is_active; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_smart_suggestions_is_active ON tenant.ai_smart_suggestions USING btree (is_active);


--
-- Name: idx_ai_smart_suggestions_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_ai_smart_suggestions_user_id ON tenant.ai_smart_suggestions USING btree (user_id);


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
-- Name: idx_transaction_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_created_at ON tenant.transaction_logs USING btree (created_at);


--
-- Name: idx_transaction_logs_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transaction_logs_user_id ON tenant.transaction_logs USING btree (user_id);


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

CREATE INDEX idx_transactions_risk_level ON tenant.transactions USING btree (risk_level) WHERE ((risk_level)::text = ANY ((ARRAY['high'::character varying, 'critical'::character varying])::text[]));


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
-- Name: idx_transfers_recipient_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_recipient_user_id ON tenant.transfers USING btree (recipient_user_id);


--
-- Name: idx_transfers_sender_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_sender_id ON tenant.transfers USING btree (sender_id);


--
-- Name: idx_transfers_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_transfers_status ON tenant.transfers USING btree (status);


--
-- Name: idx_user_activity_logs_created_at; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_activity_logs_created_at ON tenant.user_activity_logs USING btree (created_at);


--
-- Name: idx_user_activity_logs_user_id; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_user_activity_logs_user_id ON tenant.user_activity_logs USING btree (user_id);


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
-- Name: idx_wallets_status; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_status ON tenant.wallets USING btree (is_active, is_frozen);


--
-- Name: idx_wallets_type; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_type ON tenant.wallets USING btree (wallet_type);


--
-- Name: idx_wallets_user_tenant; Type: INDEX; Schema: tenant; Owner: bisiadedokun
--

CREATE INDEX idx_wallets_user_tenant ON tenant.wallets USING btree (user_id, tenant_id);


--
-- Name: conversation_messages conversation_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.conversation_messages
    ADD CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES ai.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_patterns user_behavior_patterns_user_id_fkey; Type: FK CONSTRAINT; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ONLY ai.user_behavior_patterns
    ADD CONSTRAINT user_behavior_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


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
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: bisiadedokun
--

ALTER TABLE ONLY tenant.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES tenant.users(id) ON DELETE CASCADE;


--
-- Name: conversations; Type: ROW SECURITY; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ai.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_behavior_patterns; Type: ROW SECURITY; Schema: ai; Owner: bisiadedokun
--

ALTER TABLE ai.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

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
-- Name: SCHEMA ai; Type: ACL; Schema: -; Owner: bisiadedokun
--

GRANT USAGE ON SCHEMA ai TO tenant_admin;
GRANT USAGE ON SCHEMA ai TO tenant_agent;
GRANT USAGE ON SCHEMA ai TO tenant_viewer;
GRANT USAGE ON SCHEMA ai TO tenant_api;


--
-- Name: SCHEMA analytics; Type: ACL; Schema: -; Owner: bisiadedokun
--

GRANT USAGE ON SCHEMA analytics TO tenant_admin;
GRANT USAGE ON SCHEMA analytics TO tenant_agent;
GRANT USAGE ON SCHEMA analytics TO tenant_viewer;
GRANT USAGE ON SCHEMA analytics TO tenant_api;


--
-- Name: SCHEMA audit; Type: ACL; Schema: -; Owner: bisiadedokun
--

GRANT USAGE ON SCHEMA audit TO tenant_admin;
GRANT USAGE ON SCHEMA audit TO tenant_agent;
GRANT USAGE ON SCHEMA audit TO tenant_viewer;
GRANT USAGE ON SCHEMA audit TO tenant_api;


--
-- Name: SCHEMA tenant; Type: ACL; Schema: -; Owner: bisiadedokun
--

GRANT USAGE ON SCHEMA tenant TO tenant_admin;
GRANT USAGE ON SCHEMA tenant TO tenant_agent;
GRANT USAGE ON SCHEMA tenant TO tenant_viewer;
GRANT USAGE ON SCHEMA tenant TO tenant_api;


--
-- Name: TABLE conversation_messages; Type: ACL; Schema: ai; Owner: bisiadedokun
--

GRANT ALL ON TABLE ai.conversation_messages TO tenant_admin;
GRANT SELECT ON TABLE ai.conversation_messages TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE ai.conversation_messages TO tenant_api;


--
-- Name: TABLE conversations; Type: ACL; Schema: ai; Owner: bisiadedokun
--

GRANT ALL ON TABLE ai.conversations TO tenant_admin;
GRANT SELECT ON TABLE ai.conversations TO tenant_agent;
GRANT SELECT ON TABLE ai.conversations TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE ai.conversations TO tenant_api;


--
-- Name: TABLE user_behavior_patterns; Type: ACL; Schema: ai; Owner: bisiadedokun
--

GRANT ALL ON TABLE ai.user_behavior_patterns TO tenant_admin;
GRANT SELECT ON TABLE ai.user_behavior_patterns TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE ai.user_behavior_patterns TO tenant_api;


--
-- Name: TABLE documents; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.documents TO tenant_admin;
GRANT SELECT ON TABLE tenant.documents TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.documents TO tenant_api;


--
-- Name: TABLE fraud_alerts; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.fraud_alerts TO tenant_admin;
GRANT SELECT ON TABLE tenant.fraud_alerts TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.fraud_alerts TO tenant_api;


--
-- Name: TABLE notifications; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.notifications TO tenant_admin;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.notifications TO tenant_agent;
GRANT SELECT ON TABLE tenant.notifications TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.notifications TO tenant_api;


--
-- Name: TABLE tenant_metadata; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.tenant_metadata TO tenant_admin;
GRANT SELECT ON TABLE tenant.tenant_metadata TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.tenant_metadata TO tenant_api;


--
-- Name: SEQUENCE transaction_ref_seq; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON SEQUENCE tenant.transaction_ref_seq TO tenant_admin;


--
-- Name: TABLE transactions; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.transactions TO tenant_admin;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.transactions TO tenant_agent;
GRANT SELECT ON TABLE tenant.transactions TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.transactions TO tenant_api;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.user_sessions TO tenant_admin;
GRANT SELECT ON TABLE tenant.user_sessions TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.user_sessions TO tenant_api;


--
-- Name: TABLE users; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.users TO tenant_admin;
GRANT SELECT ON TABLE tenant.users TO tenant_agent;
GRANT SELECT ON TABLE tenant.users TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.users TO tenant_api;


--
-- Name: SEQUENCE wallet_number_seq; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON SEQUENCE tenant.wallet_number_seq TO tenant_admin;


--
-- Name: TABLE wallet_transactions; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.wallet_transactions TO tenant_admin;
GRANT SELECT ON TABLE tenant.wallet_transactions TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.wallet_transactions TO tenant_api;


--
-- Name: TABLE wallets; Type: ACL; Schema: tenant; Owner: bisiadedokun
--

GRANT ALL ON TABLE tenant.wallets TO tenant_admin;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.wallets TO tenant_agent;
GRANT SELECT ON TABLE tenant.wallets TO tenant_viewer;
GRANT SELECT,INSERT,UPDATE ON TABLE tenant.wallets TO tenant_api;


--
-- PostgreSQL database dump complete
--

\unrestrict 6a6uDpdm8UT5AjzW5zcu8PHHbKFxpGdSQ0XrpdomgTBhMpcE0Ye7lT0xxXKkB2A

