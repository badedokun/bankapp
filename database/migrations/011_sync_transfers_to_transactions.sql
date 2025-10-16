-- Migration: 011_sync_transfers_to_transactions.sql
-- Description: Automated synchronization between transfers and transactions tables
-- Purpose: Ensures unified transaction history for AI and reporting
-- Version: 1.0
-- Date: 2025-10-16

-- ============================================================================
-- SYNC TRANSFER TO TRANSACTIONS TRIGGER
-- ============================================================================

/**
 * Function to sync transfer records to the unified transactions table
 * Handles: INSERT, UPDATE, reversals, and status changes
 */
CREATE OR REPLACE FUNCTION tenant.sync_transfer_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
  existing_transaction_id UUID;
BEGIN
  -- Check if a transaction record already exists for this transfer
  SELECT id INTO existing_transaction_id
  FROM tenant.transactions
  WHERE reference = NEW.reference
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    -- Create new transaction record for new transfer
    INSERT INTO tenant.transactions (
      id,
      user_id,
      tenant_id,
      type,
      amount,
      total_fees,
      currency,
      description,
      status,
      reference,
      recipient_name,
      sender_name,
      created_at,
      updated_at,
      parent_transaction_id,
      original_amount,
      original_currency
    ) VALUES (
      gen_random_uuid(),
      NEW.sender_id,
      NEW.tenant_id,
      'money_transfer',
      NEW.amount,
      COALESCE(NEW.fee, NEW.fees, 0),
      'NGN',  -- Default currency, update if multi-currency
      NEW.description,
      NEW.status,
      NEW.reference,
      NEW.recipient_name,
      NULL,  -- sender_name not in transfers table
      NEW.created_at,
      NEW.updated_at,
      NULL,  -- parent_transaction_id (null for original transactions)
      NEW.amount,
      'NGN'
    )
    ON CONFLICT (reference) DO NOTHING;  -- Prevent duplicates

  ELSIF TG_OP = 'UPDATE' THEN
    -- Update existing transaction record when transfer is updated

    -- Handle status changes
    IF OLD.status != NEW.status THEN
      UPDATE tenant.transactions
      SET
        status = NEW.status,
        updated_at = NEW.updated_at
      WHERE reference = NEW.reference;
    END IF;

    -- Handle reversal scenario
    IF NEW.reversal_status = 'reversed' AND OLD.reversal_status != 'reversed' THEN
      -- Mark original transaction as reversed
      UPDATE tenant.transactions
      SET
        status = 'reversed',
        updated_at = NOW()
      WHERE reference = NEW.reference;

      -- Create reversal transaction record (opposite transaction)
      INSERT INTO tenant.transactions (
        id,
        user_id,
        tenant_id,
        type,
        amount,
        total_fees,
        currency,
        description,
        status,
        reference,
        recipient_name,
        parent_transaction_id,
        original_amount,
        original_currency,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.sender_id,
        NEW.tenant_id,
        'money_transfer',
        NEW.amount,  -- Same amount (credit back to sender)
        0,  -- No fee for reversal
        'NGN',
        'REVERSAL: ' || COALESCE(NEW.description, 'Transfer reversed'),
        'completed',  -- Reversals are immediately completed
        'REV-' || NEW.reference,  -- Reversal reference
        NEW.recipient_name,
        existing_transaction_id,  -- Link to original transaction
        NEW.amount,
        'NGN',
        NOW(),
        NOW()
      )
      ON CONFLICT (reference) DO NOTHING;
    END IF;

    -- Handle failure detection
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
      UPDATE tenant.transactions
      SET
        status = 'failed',
        updated_at = NOW()
      WHERE reference = NEW.reference;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_transfer_to_transactions ON tenant.transfers;

-- Create trigger for INSERT and UPDATE operations
CREATE TRIGGER trigger_sync_transfer_to_transactions
  AFTER INSERT OR UPDATE ON tenant.transfers
  FOR EACH ROW
  EXECUTE FUNCTION tenant.sync_transfer_to_transactions();

-- ============================================================================
-- BACKFILL EXISTING TRANSFERS
-- ============================================================================

/**
 * Backfill existing transfers into transactions table
 * This ensures historical data is synced
 */
DO $$
DECLARE
  transfers_inserted INTEGER := 0;
  transfers_skipped INTEGER := 0;
  transfer_record RECORD;
BEGIN
  RAISE NOTICE 'Starting backfill of existing transfers to transactions table...';

  FOR transfer_record IN
    SELECT * FROM tenant.transfers
    WHERE reference NOT IN (SELECT reference FROM tenant.transactions WHERE reference IS NOT NULL)
    ORDER BY created_at ASC
  LOOP
    BEGIN
      INSERT INTO tenant.transactions (
        id,
        user_id,
        tenant_id,
        type,
        amount,
        total_fees,
        currency,
        description,
        status,
        reference,
        recipient_name,
        created_at,
        updated_at,
        original_amount,
        original_currency
      ) VALUES (
        gen_random_uuid(),
        transfer_record.sender_id,
        transfer_record.tenant_id,
        'money_transfer',
        transfer_record.amount,
        COALESCE(transfer_record.fee, transfer_record.fees, 0),
        'NGN',
        transfer_record.description,
        transfer_record.status,
        transfer_record.reference,
        transfer_record.recipient_name,
        transfer_record.created_at,
        transfer_record.updated_at,
        transfer_record.amount,
        'NGN'
      );

      transfers_inserted := transfers_inserted + 1;
    EXCEPTION
      WHEN unique_violation THEN
        transfers_skipped := transfers_skipped + 1;
      WHEN OTHERS THEN
        RAISE WARNING 'Error inserting transfer %: %', transfer_record.reference, SQLERRM;
        transfers_skipped := transfers_skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill completed: % transfers inserted, % skipped', transfers_inserted, transfers_skipped;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify sync is working
DO $$
DECLARE
  transfers_count INTEGER;
  transactions_count INTEGER;
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO transfers_count FROM tenant.transfers;
  SELECT COUNT(*) INTO transactions_count FROM tenant.transactions WHERE type = 'money_transfer';
  SELECT COUNT(*) INTO synced_count FROM tenant.transfers t
    INNER JOIN tenant.transactions tx ON t.reference = tx.reference;

  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Sync Verification:';
  RAISE NOTICE '  Total transfers: %', transfers_count;
  RAISE NOTICE '  Total money_transfer transactions: %', transactions_count;
  RAISE NOTICE '  Successfully synced: %', synced_count;
  RAISE NOTICE '  Sync rate: % %%', ROUND((synced_count::DECIMAL / NULLIF(transfers_count, 0)) * 100, 2);
  RAISE NOTICE '==========================================================';
END $$;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION tenant.sync_transfer_to_transactions() IS
'Automatically syncs transfer records to the unified transactions table.
Handles INSERT (new transfers), UPDATE (status changes), reversals, and failures.
Ensures AI Assistant and reporting tools have access to complete transaction history.';

COMMENT ON TRIGGER trigger_sync_transfer_to_transactions ON tenant.transfers IS
'Maintains real-time synchronization between transfers and transactions tables for unified transaction history';

-- ============================================================================
-- MIGRATION SUCCESS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 011_sync_transfers_to_transactions completed!';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  ✅ Auto-sync new transfers to transactions table';
  RAISE NOTICE '  ✅ Sync status updates (pending → successful → failed)';
  RAISE NOTICE '  ✅ Create reversal transaction records automatically';
  RAISE NOTICE '  ✅ Handle failure detection and marking';
  RAISE NOTICE '  ✅ Backfilled existing transfers';
  RAISE NOTICE '  ✅ Prevents duplicate entries';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify sync with: SELECT * FROM tenant.transactions;';
  RAISE NOTICE '  2. Test AI Assistant transaction history';
  RAISE NOTICE '  3. Monitor for any sync issues in logs';
  RAISE NOTICE '==========================================================';
END $$;
