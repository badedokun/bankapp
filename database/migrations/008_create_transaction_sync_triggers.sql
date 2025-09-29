-- Transaction Synchronization Triggers
-- Ensures all transfer and bill payment records are automatically synced to the master transactions table

-- ==================================================
-- 1. TRANSFER → TRANSACTION SYNC TRIGGER
-- ==================================================

-- Function to sync transfers to transactions table
CREATE OR REPLACE FUNCTION sync_transfer_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into transactions when transfer is created
    IF TG_OP = 'INSERT' THEN
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
            NEW.source_bank_code,
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
        ON CONFLICT (reference) DO NOTHING; -- Prevent duplicates

        RETURN NEW;
    END IF;

    -- Update transactions when transfer is updated
    IF TG_OP = 'UPDATE' THEN
        UPDATE tenant.transactions SET
            status = CASE
                WHEN NEW.status = 'successful' THEN 'completed'
                WHEN NEW.status = 'failed' THEN 'failed'
                WHEN NEW.status = 'pending' THEN 'pending'
                WHEN NEW.status = 'processing' THEN 'processing'
                ELSE NEW.status
            END,
            failure_reason = NEW.failure_reason,
            provider_response = jsonb_build_object(
                'nibss_response', NEW.nibss_response_message,
                'session_id', NEW.nibss_session_id
            ),
            processed_at = NEW.processed_at,
            completed_at = CASE WHEN NEW.status = 'successful' THEN NEW.processed_at ELSE NULL END,
            processing_details = jsonb_build_object(
                'nibss_transaction_id', NEW.nibss_transaction_id,
                'nibss_session_id', NEW.nibss_session_id,
                'nibss_response_message', NEW.nibss_response_message,
                'transfer_type', 'money_transfer'
            )
        WHERE reference = NEW.reference
        AND tenant_id = NEW.tenant_id
        AND type = 'money_transfer';

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transfers
DROP TRIGGER IF EXISTS sync_transfers_to_transactions ON tenant.transfers;
CREATE TRIGGER sync_transfers_to_transactions
    AFTER INSERT OR UPDATE ON tenant.transfers
    FOR EACH ROW EXECUTE FUNCTION sync_transfer_to_transactions();

-- ==================================================
-- 2. BILL_PAYMENTS → TRANSACTION SYNC TRIGGER
-- ==================================================

-- Function to sync bill payments to transactions table
CREATE OR REPLACE FUNCTION sync_bill_payment_to_transactions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for bill payments
DROP TRIGGER IF EXISTS sync_bill_payments_to_transactions ON tenant.bill_payments;
CREATE TRIGGER sync_bill_payments_to_transactions
    AFTER INSERT OR UPDATE ON tenant.bill_payments
    FOR EACH ROW EXECUTE FUNCTION sync_bill_payment_to_transactions();

-- ==================================================
-- 3. BACKFILL EXISTING TRANSFERS
-- ==================================================

-- Backfill existing transfers that are not in transactions table
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
)
SELECT
    t.tenant_id,
    t.sender_id,
    t.reference,
    t.nibss_transaction_id,
    'money_transfer',
    t.amount,
    'NGN',
    COALESCE(t.description, 'Transfer to ' || t.recipient_name),
    t.recipient_name,
    t.recipient_account_number,
    'Bank Transfer',
    t.recipient_bank_code,
    jsonb_build_object(
        'recipient_name', t.recipient_name,
        'recipient_account_number', t.recipient_account_number,
        'recipient_bank_code', t.recipient_bank_code
    ),
    COALESCE(u.first_name || ' ' || u.last_name, 'Unknown'),
    t.source_account_number,
    'OrokiiPay',
    t.source_bank_code,
    jsonb_build_object(
        'source_account_number', t.source_account_number,
        'source_bank_code', t.source_bank_code
    ),
    CASE
        WHEN t.status = 'successful' THEN 'completed'
        WHEN t.status = 'failed' THEN 'failed'
        WHEN t.status = 'pending' THEN 'pending'
        WHEN t.status = 'processing' THEN 'processing'
        ELSE t.status
    END,
    jsonb_build_object(
        'nibss_transaction_id', t.nibss_transaction_id,
        'nibss_session_id', t.nibss_session_id,
        'nibss_response_message', t.nibss_response_message,
        'transfer_type', 'money_transfer'
    ),
    t.failure_reason,
    'NIBSS',
    t.nibss_transaction_id,
    jsonb_build_object(
        'nibss_response', t.nibss_response_message,
        'session_id', t.nibss_session_id
    ),
    t.fee,
    jsonb_build_object(
        'transfer_fee', t.fee,
        'vat', 0,
        'stamp_duty', 0
    ),
    'mobile',
    t.created_at,
    t.created_at,
    t.processed_at,
    CASE WHEN t.status = 'successful' THEN t.processed_at ELSE NULL END
FROM tenant.transfers t
LEFT JOIN tenant.users u ON t.sender_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM tenant.transactions tx
    WHERE tx.reference = t.reference
    AND tx.tenant_id = t.tenant_id
    AND tx.type = 'money_transfer'
)
ON CONFLICT (reference) DO NOTHING;

-- ==================================================
-- 4. VERIFICATION AND SUMMARY
-- ==================================================

-- Create summary of sync results
DO $$
DECLARE
    transfers_count INTEGER;
    transactions_transfers_count INTEGER;
    bill_payments_count INTEGER;
    transactions_bills_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO transfers_count FROM tenant.transfers;
    SELECT COUNT(*) INTO transactions_transfers_count FROM tenant.transactions WHERE type = 'money_transfer';
    SELECT COUNT(*) INTO bill_payments_count FROM tenant.bill_payments;
    SELECT COUNT(*) INTO transactions_bills_count FROM tenant.transactions WHERE type = 'bill_payment';

    RAISE NOTICE '=== TRANSACTION SYNC TRIGGERS CREATED ===';
    RAISE NOTICE 'Transfers: % records, Transactions (money_transfer): % records', transfers_count, transactions_transfers_count;
    RAISE NOTICE 'Bill Payments: % records, Transactions (bill_payment): % records', bill_payments_count, transactions_bills_count;
    RAISE NOTICE 'Triggers created for automatic synchronization';
    RAISE NOTICE 'Backfill completed for existing transfer records';
END $$;

-- Verify triggers exist
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'tenant'
AND trigger_name IN ('sync_transfers_to_transactions', 'sync_bill_payments_to_transactions')
ORDER BY event_object_table, trigger_name;