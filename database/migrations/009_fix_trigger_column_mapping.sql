-- Fix trigger function column mapping for transactions table
-- This migration corrects the sync_transfer_to_transactions trigger function
-- to properly match the transactions table structure

CREATE OR REPLACE FUNCTION platform.sync_transfer_to_transactions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly attached to the transfers table
DROP TRIGGER IF EXISTS sync_transfer_to_transactions_trigger ON tenant.transfers;
CREATE TRIGGER sync_transfer_to_transactions_trigger
    AFTER INSERT ON tenant.transfers
    FOR EACH ROW
    EXECUTE FUNCTION platform.sync_transfer_to_transactions();

COMMENT ON FUNCTION platform.sync_transfer_to_transactions() IS 'Synchronizes transfer records to transactions table for unified transaction history';