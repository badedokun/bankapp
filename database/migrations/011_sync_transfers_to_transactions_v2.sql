-- Migration: 011_sync_transfers_to_transactions_v2.sql
-- Description: Simplified sync between transfers and transactions tables
-- Purpose: Ensures unified transaction history for AI and reporting
-- Version: 2.0 (Schema-Matched)
-- Date: 2025-10-16

-- ============================================================================
-- SYNC TRANSFER TO TRANSACTIONS TRIGGER (SCHEMA-MATCHED)
-- ============================================================================

CREATE OR REPLACE FUNCTION tenant.sync_transfer_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
  existing_transaction_id UUID;
BEGIN
  -- Check if transaction already exists
  SELECT id INTO existing_transaction_id
  FROM tenant.transactions
  WHERE reference = NEW.reference
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    -- Create new transaction record for new transfer
    -- Map transfer status to transaction status
    INSERT INTO tenant.transactions (
      user_id,
      tenant_id,
      reference,
      type,
      amount,
      currency,
      description,
      recipient_name,
      status,
      total_fees,
      created_at
    ) VALUES (
      NEW.sender_id,
      NEW.tenant_id,
      NEW.reference,
      'money_transfer',
      NEW.amount,
      (SELECT currency FROM tenant.wallets WHERE user_id = NEW.sender_id LIMIT 1),
      NEW.description,
      NEW.recipient_name,
      CASE NEW.status
        WHEN 'successful' THEN 'completed'
        ELSE NEW.status
      END,
      COALESCE(NEW.fee, NEW.fees, 0),
      NEW.created_at
    )
    ON CONFLICT (reference) DO NOTHING;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Update status if changed (with mapping)
    IF OLD.status != NEW.status AND existing_transaction_id IS NOT NULL THEN
      UPDATE tenant.transactions
      SET status = CASE NEW.status
        WHEN 'successful' THEN 'completed'
        ELSE NEW.status
      END
      WHERE id = existing_transaction_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_transfer_to_transactions ON tenant.transfers;
CREATE TRIGGER trigger_sync_transfer_to_transactions
  AFTER INSERT OR UPDATE ON tenant.transfers
  FOR EACH ROW
  EXECUTE FUNCTION tenant.sync_transfer_to_transactions();

-- ============================================================================
-- BACKFILL EXISTING TRANSFERS
-- ============================================================================

DO $$
DECLARE
  inserted_count INTEGER := 0;
  transfer_rec RECORD;
BEGIN
  RAISE NOTICE 'Backfilling existing transfers...';

  FOR transfer_rec IN
    SELECT * FROM tenant.transfers
    WHERE reference NOT IN (SELECT COALESCE(reference, '') FROM tenant.transactions)
    ORDER BY created_at ASC
  LOOP
    BEGIN
      INSERT INTO tenant.transactions (
        user_id,
        tenant_id,
        reference,
        type,
        amount,
        currency,
        description,
        recipient_name,
        status,
        total_fees,
        created_at
      ) VALUES (
        transfer_rec.sender_id,
        transfer_rec.tenant_id,
        transfer_rec.reference,
        'money_transfer',
        transfer_rec.amount,
        (SELECT currency FROM tenant.wallets WHERE user_id = transfer_rec.sender_id LIMIT 1),
        transfer_rec.description,
        transfer_rec.recipient_name,
        CASE transfer_rec.status
          WHEN 'successful' THEN 'completed'
          ELSE transfer_rec.status
        END,
        COALESCE(transfer_rec.fee, transfer_rec.fees, 0),
        transfer_rec.created_at
      );
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error inserting transfer %: %', transfer_rec.reference, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % transfers synced', inserted_count;
END $$;

-- Verification
DO $$
DECLARE
  transfers_count INTEGER;
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO transfers_count FROM tenant.transfers;
  SELECT COUNT(*) INTO synced_count
  FROM tenant.transfers t
  INNER JOIN tenant.transactions tx ON t.reference = tx.reference;

  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Sync Status:';
  RAISE NOTICE '  Total transfers: %', transfers_count;
  RAISE NOTICE '  Synced to transactions: %', synced_count;
  RAISE NOTICE '  Sync rate: % %%', ROUND((synced_count::DECIMAL / NULLIF(transfers_count, 0)) * 100, 2);
  RAISE NOTICE '==========================================================';
END $$;
