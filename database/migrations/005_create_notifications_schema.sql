-- Notifications Schema for Real-time Transfer Notifications
-- This migration creates tables for managing notifications, user preferences, and device tokens

-- Create notifications table for tracking all notifications
CREATE TABLE IF NOT EXISTS platform.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    channels JSONB NOT NULL, -- Array of notification channels used
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, expired
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create in-app notifications table for storing persistent in-app notifications
CREATE TABLE IF NOT EXISTS platform.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_id UUID REFERENCES platform.notifications(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50), -- transfer, account, security, promotion, etc.
    action_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notification preferences table for user notification settings
CREATE TABLE IF NOT EXISTS platform.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    transfer_initiated JSONB DEFAULT '[{"type":"push","enabled":true},{"type":"in_app","enabled":true}]',
    transfer_completed JSONB DEFAULT '[{"type":"push","enabled":true},{"type":"sms","enabled":true},{"type":"in_app","enabled":true}]',
    transfer_failed JSONB DEFAULT '[{"type":"push","enabled":true},{"type":"sms","enabled":true},{"type":"email","enabled":true},{"type":"in_app","enabled":true}]',
    receipt_generated JSONB DEFAULT '[{"type":"in_app","enabled":true}]',
    security_alerts JSONB DEFAULT '[{"type":"push","enabled":true},{"type":"sms","enabled":true},{"type":"email","enabled":true},{"type":"in_app","enabled":true}]',
    promotional_offers JSONB DEFAULT '[{"type":"push","enabled":false},{"type":"email","enabled":false},{"type":"in_app","enabled":true}]',
    quiet_hours JSONB DEFAULT '{"enabled":false,"start":"22:00","end":"08:00"}',
    max_daily_notifications INTEGER DEFAULT 50,
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Create user devices table for push notification tokens
CREATE TABLE IF NOT EXISTS platform.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- ios, android, web
    platform VARCHAR(20) NOT NULL, -- fcm, apns, web_push
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    device_name VARCHAR(100),
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(device_token)
);

-- Create notification templates table for customizable notification content
CREATE TABLE IF NOT EXISTS platform.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- push, sms, email, in_app, webhook
    language VARCHAR(10) DEFAULT 'en',
    subject VARCHAR(255), -- For email notifications
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT, -- For email notifications
    variables TEXT[] DEFAULT '{}', -- Available template variables
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, event_type, channel, language)
);

-- Create notification logs table for audit trail
CREATE TABLE IF NOT EXISTS platform.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_id UUID REFERENCES platform.notifications(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL, -- sent, failed, bounced, delivered
    provider VARCHAR(50), -- twilio, sendgrid, firebase, etc.
    provider_response JSONB,
    cost DECIMAL(10,4), -- Cost of sending notification
    delivery_time INTERVAL, -- Time taken to deliver
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create webhook endpoints table for external notification delivery
CREATE TABLE IF NOT EXISTS platform.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types to send
    is_active BOOLEAN DEFAULT true,
    retry_policy JSONB DEFAULT '{"max_retries":3,"retry_delay_seconds":60}',
    headers JSONB, -- Additional headers to send
    last_triggered_at TIMESTAMP,
    failure_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification statistics table for analytics
CREATE TABLE IF NOT EXISTS platform.notification_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    channel VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, date, channel, event_type)
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON platform.notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON platform.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON platform.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON platform.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON platform.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON platform.notifications(scheduled_at);

-- Create indexes for in-app notifications
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_unread ON platform.in_app_notifications(user_id, is_read) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_tenant_user ON platform.in_app_notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON platform.in_app_notifications(created_at);

-- Create indexes for notification preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_user ON platform.notification_preferences(tenant_id, user_id);

-- Create indexes for user devices
CREATE INDEX IF NOT EXISTS idx_user_devices_tenant_user ON platform.user_devices(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON platform.user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON platform.user_devices(device_token);

-- Create indexes for notification templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant ON platform.notification_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_event_channel ON platform.notification_templates(event_type, channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON platform.notification_templates(is_active);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_user ON platform.notification_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON platform.notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_status ON platform.notification_logs(channel, status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON platform.notification_logs(created_at);

-- Create indexes for webhook endpoints
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON platform.webhook_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON platform.webhook_endpoints(is_active);

-- Create indexes for notification statistics
CREATE INDEX IF NOT EXISTS idx_notification_statistics_tenant_date ON platform.notification_statistics(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_notification_statistics_channel_event ON platform.notification_statistics(channel, event_type);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_notifications_data ON platform.notifications USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_notifications_channels ON platform.notifications USING GIN(channels);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_data ON platform.in_app_notifications USING GIN(data);

-- Add constraints
ALTER TABLE platform.notifications
ADD CONSTRAINT chk_notifications_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD CONSTRAINT chk_notifications_status CHECK (status IN ('pending', 'sent', 'failed', 'expired')),
ADD CONSTRAINT chk_notifications_retry_count CHECK (retry_count >= 0),
ADD CONSTRAINT chk_notifications_max_retries CHECK (max_retries >= 0);

ALTER TABLE platform.in_app_notifications
ADD CONSTRAINT chk_in_app_notifications_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE platform.user_devices
ADD CONSTRAINT chk_user_devices_device_type CHECK (device_type IN ('ios', 'android', 'web')),
ADD CONSTRAINT chk_user_devices_platform CHECK (platform IN ('fcm', 'apns', 'web_push'));

ALTER TABLE platform.notification_logs
ADD CONSTRAINT chk_notification_logs_status CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
ADD CONSTRAINT chk_notification_logs_cost CHECK (cost >= 0);

ALTER TABLE platform.notification_statistics
ADD CONSTRAINT chk_notification_statistics_counts CHECK (
    sent_count >= 0 AND delivered_count >= 0 AND failed_count >= 0
    AND opened_count >= 0 AND clicked_count >= 0
),
ADD CONSTRAINT chk_notification_statistics_cost CHECK (total_cost >= 0);

-- Add updated_at trigger functions
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON platform.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON platform.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at
    BEFORE UPDATE ON platform.user_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON platform.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at
    BEFORE UPDATE ON platform.webhook_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_statistics_updated_at
    BEFORE UPDATE ON platform.notification_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW platform.v_notification_analytics AS
SELECT
    ns.tenant_id,
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
        WHEN ns.sent_count > 0 THEN (ns.delivered_count::DECIMAL / ns.sent_count) * 100
        ELSE 0
    END as delivery_rate,
    CASE
        WHEN ns.delivered_count > 0 THEN (ns.opened_count::DECIMAL / ns.delivered_count) * 100
        ELSE 0
    END as open_rate,
    CASE
        WHEN ns.opened_count > 0 THEN (ns.clicked_count::DECIMAL / ns.opened_count) * 100
        ELSE 0
    END as click_rate
FROM platform.notification_statistics ns;

-- Create view for user notification summary
CREATE OR REPLACE VIEW platform.v_user_notification_summary AS
SELECT
    ian.tenant_id,
    ian.user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE ian.is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE ian.is_read = true) as read_count,
    MAX(ian.created_at) as last_notification_at,
    COUNT(*) FILTER (WHERE ian.created_at >= NOW() - INTERVAL '24 hours') as notifications_today,
    COUNT(*) FILTER (WHERE ian.created_at >= NOW() - INTERVAL '7 days') as notifications_this_week
FROM platform.in_app_notifications ian
WHERE ian.is_deleted = false
GROUP BY ian.tenant_id, ian.user_id;

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION platform.cleanup_old_notifications()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to get notification statistics
CREATE OR REPLACE FUNCTION platform.get_notification_stats(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    channel VARCHAR(20),
    event_type VARCHAR(50),
    total_sent BIGINT,
    total_delivered BIGINT,
    total_failed BIGINT,
    avg_delivery_rate DECIMAL(5,2),
    total_cost DECIMAL(10,4)
) AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default notification templates
INSERT INTO platform.notification_templates (tenant_id, event_type, channel, title, body, variables) VALUES
('00000000-0000-0000-0000-000000000000', 'transfer_initiated', 'push', 'Transfer Initiated', 'Your transfer of {{amount}} to {{recipient}} has been initiated. Reference: {{reference}}', ARRAY['amount', 'recipient', 'reference']),
('00000000-0000-0000-0000-000000000000', 'transfer_completed', 'push', 'Transfer Completed', 'Your transfer of {{amount}} to {{recipient}} has been completed successfully. Reference: {{reference}}', ARRAY['amount', 'recipient', 'reference']),
('00000000-0000-0000-0000-000000000000', 'transfer_failed', 'push', 'Transfer Failed', 'Your transfer of {{amount}} to {{recipient}} has failed. Amount has been reversed. Reference: {{reference}}', ARRAY['amount', 'recipient', 'reference']),
('00000000-0000-0000-0000-000000000000', 'transfer_initiated', 'sms', 'Transfer Initiated', 'FMFB: Your transfer of {{amount}} to {{recipient}} has been initiated. Ref: {{reference}}', ARRAY['amount', 'recipient', 'reference']),
('00000000-0000-0000-0000-000000000000', 'transfer_completed', 'sms', 'Transfer Completed', 'FMFB: Your transfer of {{amount}} to {{recipient}} completed successfully. Ref: {{reference}}', ARRAY['amount', 'recipient', 'reference']),
('00000000-0000-0000-0000-000000000000', 'transfer_failed', 'sms', 'Transfer Failed', 'FMFB: Your transfer of {{amount}} failed. Amount reversed to your account. Ref: {{reference}}', ARRAY['amount', 'recipient', 'reference'])
ON CONFLICT (tenant_id, event_type, channel, language) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE platform.notifications IS 'Main notifications table tracking all notifications sent to users';
COMMENT ON TABLE platform.in_app_notifications IS 'Persistent in-app notifications that users can view in their notification center';
COMMENT ON TABLE platform.notification_preferences IS 'User preferences for different types of notifications and channels';
COMMENT ON TABLE platform.user_devices IS 'User device tokens for push notifications';
COMMENT ON TABLE platform.notification_templates IS 'Customizable notification templates for different events and channels';
COMMENT ON TABLE platform.notification_logs IS 'Audit log for notification delivery attempts and results';
COMMENT ON TABLE platform.webhook_endpoints IS 'External webhook endpoints for notification delivery';
COMMENT ON TABLE platform.notification_statistics IS 'Daily aggregated statistics for notification analytics';

COMMENT ON COLUMN platform.notifications.data IS 'JSON data containing notification context and variables';
COMMENT ON COLUMN platform.notifications.channels IS 'Array of notification channels used for this notification';
COMMENT ON COLUMN platform.notification_preferences.quiet_hours IS 'JSON object defining quiet hours when notifications should not be sent';
COMMENT ON COLUMN platform.user_devices.device_token IS 'FCM/APNS device token for push notifications';