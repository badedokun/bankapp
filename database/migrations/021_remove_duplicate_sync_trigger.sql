-- Migration: Remove duplicate sync trigger from migration 008
-- Issue: Both migration 008 and 009 created triggers on tenant.transfers
-- Migration 009 was supposed to replace 008's trigger but didn't drop it
-- This causes the old buggy trigger to fire alongside the fixed one

-- Drop the old trigger from migration 008
DROP TRIGGER IF EXISTS sync_transfers_to_transactions ON tenant.transfers;

-- Keep only the fixed trigger from migration 009 (sync_transfer_to_transactions_trigger)
-- which uses the corrected platform.sync_transfer_to_transactions() function

COMMENT ON TRIGGER sync_transfer_to_transactions_trigger ON tenant.transfers IS
'Synchronizes transfers to transactions. Fixed version from migration 009, replaces buggy migration 008 trigger.';
