-- ============================================================================
-- Migration 017: Transaction Disputes Queue System
-- Description: Creates a dispute management system for transaction reviews
-- Created: 2025-10-08
-- ============================================================================

-- Create disputes table in tenant schema
CREATE TABLE IF NOT EXISTS tenant.transaction_disputes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., DSP-20251008-XXXX

  -- Transaction reference
  transaction_id UUID NOT NULL,
  transaction_reference VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'transfer', 'payment', 'withdrawal', etc.

  -- User information
  user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_phone VARCHAR(20),

  -- Transaction details snapshot (JSON for flexibility)
  transaction_details JSONB NOT NULL, -- Complete transaction data at time of dispute

  -- Dispute information
  dispute_reason TEXT NOT NULL, -- User's reason for disputing
  dispute_category VARCHAR(50), -- 'unauthorized', 'incorrect_amount', 'service_not_received', 'duplicate', 'fraud', 'other'
  additional_notes TEXT, -- Additional user comments

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Assignment
  assigned_to UUID REFERENCES tenant.users(id) ON DELETE SET NULL, -- Bank staff member reviewing the dispute
  assigned_at TIMESTAMPTZ,

  -- Resolution information
  resolution_notes TEXT, -- Bank staff resolution notes
  resolved_by UUID REFERENCES tenant.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_type VARCHAR(50), -- 'refunded', 'corrected', 'no_action', 'escalated_to_processor'

  -- Refund/correction details
  refund_amount DECIMAL(15, 2),
  refund_transaction_id UUID,
  refund_reference VARCHAR(255),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_resolution_type CHECK (resolution_type IS NULL OR resolution_type IN ('refunded', 'corrected', 'no_action', 'escalated_to_processor')),
  CONSTRAINT valid_category CHECK (dispute_category IS NULL OR dispute_category IN ('unauthorized', 'incorrect_amount', 'service_not_received', 'duplicate', 'fraud', 'other'))
);

-- Create dispute activity log for audit trail
CREATE TABLE IF NOT EXISTS tenant.dispute_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES tenant.transaction_disputes(id) ON DELETE CASCADE,

  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'assigned', 'note_added', 'resolved', 'escalated'
  performed_by UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
  performed_by_name VARCHAR(255) NOT NULL,
  performed_by_role VARCHAR(100),

  -- Changes
  previous_value TEXT,
  new_value TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON tenant.transaction_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_ref ON tenant.transaction_disputes(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON tenant.transaction_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON tenant.transaction_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON tenant.transaction_disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON tenant.transaction_disputes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON tenant.transaction_disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_at ON tenant.transaction_disputes(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_category ON tenant.transaction_disputes(dispute_category);
CREATE INDEX IF NOT EXISTS idx_disputes_number ON tenant.transaction_disputes(dispute_number);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_dispute_activity_dispute_id ON tenant.dispute_activity_log(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_activity_created_at ON tenant.dispute_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_activity_type ON tenant.dispute_activity_log(activity_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION tenant.update_dispute_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_disputes_timestamp ON tenant.transaction_disputes;
CREATE TRIGGER update_disputes_timestamp
  BEFORE UPDATE ON tenant.transaction_disputes
  FOR EACH ROW
  EXECUTE FUNCTION tenant.update_dispute_timestamp();

-- Create function to automatically log dispute activities
CREATE OR REPLACE FUNCTION tenant.log_dispute_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO tenant.dispute_activity_log (
      dispute_id,
      activity_type,
      performed_by,
      performed_by_name,
      previous_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      'status_changed',
      COALESCE(NEW.resolved_by, NEW.assigned_to, NEW.user_id),
      'System', -- Will be updated by application
      OLD.status,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;

  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO tenant.dispute_activity_log (
      dispute_id,
      activity_type,
      performed_by,
      performed_by_name,
      previous_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      'assigned',
      COALESCE(NEW.assigned_to, NEW.user_id),
      'System',
      COALESCE(OLD.assigned_to::TEXT, 'Unassigned'),
      COALESCE(NEW.assigned_to::TEXT, 'Unassigned'),
      'Dispute assignment changed'
    );
  END IF;

  -- Log resolution
  IF TG_OP = 'UPDATE' AND OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO tenant.dispute_activity_log (
      dispute_id,
      activity_type,
      performed_by,
      performed_by_name,
      previous_value,
      new_value,
      notes
    ) VALUES (
      NEW.id,
      'resolved',
      COALESCE(NEW.resolved_by, NEW.assigned_to, NEW.user_id),
      'System',
      OLD.status,
      NEW.status,
      COALESCE(NEW.resolution_notes, 'Dispute resolved')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activity logging
DROP TRIGGER IF EXISTS log_dispute_activity_trigger ON tenant.transaction_disputes;
CREATE TRIGGER log_dispute_activity_trigger
  AFTER INSERT OR UPDATE ON tenant.transaction_disputes
  FOR EACH ROW
  EXECUTE FUNCTION tenant.log_dispute_activity();

-- Create function to generate dispute numbers
CREATE OR REPLACE FUNCTION tenant.generate_dispute_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  sequence_num INT;
  dispute_num TEXT;
BEGIN
  -- Format: DSP-YYYYMMDD-XXXX
  today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(dispute_number FROM 'DSP-[0-9]{8}-([0-9]{4})')
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM tenant.transaction_disputes
  WHERE dispute_number LIKE 'DSP-' || today || '-%';

  -- Generate dispute number with zero-padded sequence
  dispute_num := 'DSP-' || today || '-' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN dispute_num;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE tenant.transaction_disputes IS 'Stores transaction disputes submitted by users for bank review';
COMMENT ON COLUMN tenant.transaction_disputes.dispute_number IS 'Unique dispute reference number (format: DSP-YYYYMMDD-XXXX)';
COMMENT ON COLUMN tenant.transaction_disputes.transaction_details IS 'Complete snapshot of transaction data at time of dispute';
COMMENT ON COLUMN tenant.transaction_disputes.status IS 'Current status of the dispute';
COMMENT ON COLUMN tenant.transaction_disputes.priority IS 'Priority level for dispute resolution';
COMMENT ON COLUMN tenant.transaction_disputes.assigned_to IS 'Bank staff member assigned to review this dispute';

COMMENT ON TABLE tenant.dispute_activity_log IS 'Audit trail of all activities on disputes';

-- Grant appropriate permissions (adjust as needed for your RBAC setup)
-- GRANT SELECT, INSERT ON tenant.transaction_disputes TO customer_role;
-- GRANT ALL ON tenant.transaction_disputes TO admin_role;
-- GRANT ALL ON tenant.dispute_activity_log TO admin_role;

-- ============================================================================
-- End of Migration 017
-- ============================================================================
