"use strict";
/**
 * Real-time Notification Service for Transfers
 * Handles push notifications, SMS, email, and in-app notifications for transfer events
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const events_1 = require("events");
class NotificationService extends events_1.EventEmitter {
    constructor(database) {
        super();
        this.activeConnections = new Map(); // WebSocket connections
        this.notificationQueue = [];
        this.processing = false;
        this.db = database;
        // Initialize notification providers from environment
        this.smsProvider = {
            name: process.env.SMS_PROVIDER || 'Twilio',
            apiUrl: process.env.SMS_API_URL || 'https://api.twilio.com/2010-04-01',
            apiKey: process.env.SMS_API_KEY || '',
            sender: process.env.SMS_SENDER || 'FMFB',
        };
        this.emailProvider = {
            name: process.env.EMAIL_PROVIDER || 'SMTP',
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpPort: parseInt(process.env.SMTP_PORT || '587'),
            username: process.env.SMTP_USERNAME || '',
            password: process.env.SMTP_PASSWORD || '',
            fromEmail: process.env.FROM_EMAIL || 'noreply@fmfb.com.ng',
            fromName: process.env.FROM_NAME || 'First Microfinance Bank',
        };
        this.pushProvider = {
            name: process.env.PUSH_PROVIDER || 'Firebase',
            apiKey: process.env.PUSH_API_KEY || '',
            appId: process.env.PUSH_APP_ID || '',
            serverKey: process.env.PUSH_SERVER_KEY || '',
        };
        // Start notification processor
        this.startNotificationProcessor();
    }
    /**
     * Send transfer notification
     */
    async sendTransferNotification(event) {
        try {
            // Get user notification preferences
            const preferences = await this.getUserNotificationPreferences(event.userId, event.tenantId);
            if (!preferences) {
                console.log(`No notification preferences found for user ${event.userId}`);
                return;
            }
            // Check if we're in quiet hours
            if (this.isQuietHours(preferences.quietHours)) {
                console.log(`Skipping notification due to quiet hours for user ${event.userId}`);
                return;
            }
            // Check daily notification limit
            const dailyCount = await this.getDailyNotificationCount(event.userId, event.tenantId);
            if (dailyCount >= preferences.maxDailyNotifications) {
                console.log(`Daily notification limit reached for user ${event.userId}`);
                return;
            }
            // Determine which channels to use based on event type
            let channels = [];
            switch (event.type) {
                case 'transfer_initiated':
                    channels = preferences.transferInitiated;
                    break;
                case 'transfer_completed':
                    channels = preferences.transferCompleted;
                    break;
                case 'transfer_failed':
                    channels = preferences.transferFailed;
                    break;
                case 'receipt_generated':
                    channels = preferences.receiptGenerated;
                    break;
                default:
                    channels = [{ type: 'in_app', enabled: true }];
            }
            // Filter enabled channels
            const enabledChannels = channels.filter(channel => channel.enabled);
            if (enabledChannels.length === 0) {
                console.log(`No enabled notification channels for event ${event.type}`);
                return;
            }
            // Create notification event
            const notificationEvent = {
                id: (0, uuid_1.v4)(),
                tenantId: event.tenantId,
                userId: event.userId,
                type: event.type,
                priority: event.priority || 'medium',
                channels: enabledChannels,
                data: event.transferData,
                createdAt: new Date(),
            };
            // Add to queue for processing
            this.notificationQueue.push(notificationEvent);
            // Process immediately if high priority
            if (event.priority === 'urgent' || event.priority === 'high') {
                this.processNotificationQueue();
            }
            // Emit event for real-time listeners
            this.emit('notification', notificationEvent);
        }
        catch (error) {
            console.error('Send transfer notification error:', error);
        }
    }
    /**
     * Process notification queue
     */
    async processNotificationQueue() {
        if (this.processing || this.notificationQueue.length === 0) {
            return;
        }
        this.processing = true;
        try {
            while (this.notificationQueue.length > 0) {
                const notification = this.notificationQueue.shift();
                if (notification) {
                    await this.processNotification(notification);
                }
            }
        }
        catch (error) {
            console.error('Notification queue processing error:', error);
        }
        finally {
            this.processing = false;
        }
    }
    /**
     * Process individual notification
     */
    async processNotification(notification) {
        const client = await this.db.connect();
        try {
            // Save notification to database
            await client.query(`
        INSERT INTO platform.notifications (
          id, tenant_id, user_id, type, priority, title, body, data,
          channels, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
                notification.id,
                notification.tenantId,
                notification.userId,
                notification.type,
                notification.priority,
                'Transfer Notification',
                await this.generateNotificationBody(notification),
                JSON.stringify(notification.data),
                JSON.stringify(notification.channels),
                'pending'
            ]);
            // Process each enabled channel
            for (const channel of notification.channels) {
                if (channel.enabled) {
                    await this.sendNotificationOnChannel(notification, channel);
                }
            }
            // Update notification status
            await client.query(`
        UPDATE platform.notifications
        SET status = 'sent', sent_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [notification.id]);
        }
        catch (error) {
            console.error('Process notification error:', error);
            // Update notification status to failed
            await client.query(`
        UPDATE platform.notifications
        SET status = 'failed', error_message = $1, updated_at = NOW()
        WHERE id = $2
      `, [error.message, notification.id]);
        }
        finally {
            client.release();
        }
    }
    /**
     * Send notification on specific channel
     */
    async sendNotificationOnChannel(notification, channel) {
        try {
            switch (channel.type) {
                case 'push':
                    await this.sendPushNotification(notification);
                    break;
                case 'sms':
                    await this.sendSMSNotification(notification);
                    break;
                case 'email':
                    await this.sendEmailNotification(notification);
                    break;
                case 'in_app':
                    await this.sendInAppNotification(notification);
                    break;
                case 'webhook':
                    await this.sendWebhookNotification(notification, channel.config);
                    break;
                default:
                    console.log(`Unknown notification channel: ${channel.type}`);
            }
        }
        catch (error) {
            console.error(`Failed to send notification on ${channel.type}:`, error);
        }
    }
    /**
     * Send push notification
     */
    async sendPushNotification(notification) {
        try {
            // Get user's device tokens
            const userDevices = await this.getUserDeviceTokens(notification.userId, notification.tenantId);
            if (userDevices.length === 0) {
                console.log(`No device tokens found for user ${notification.userId}`);
                return;
            }
            const title = this.getNotificationTitle(notification.type);
            const body = await this.generateNotificationBody(notification);
            // Mock Firebase FCM implementation
            for (const device of userDevices) {
                const pushPayload = {
                    to: device.token,
                    notification: {
                        title,
                        body,
                        icon: 'ic_notification',
                        sound: 'default',
                    },
                    data: {
                        type: notification.type,
                        transferId: notification.data.id,
                        reference: notification.data.reference,
                    },
                };
                // In production, use actual Firebase Admin SDK
                console.log('Sending push notification:', pushPayload);
                // await admin.messaging().send(pushPayload);
            }
        }
        catch (error) {
            console.error('Push notification error:', error);
        }
    }
    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification) {
        try {
            // Get user phone number
            const userProfile = await this.getUserProfile(notification.userId, notification.tenantId);
            if (!userProfile || !userProfile.phone_number) {
                console.log(`No phone number found for user ${notification.userId}`);
                return;
            }
            const message = await this.generateSMSMessage(notification);
            // Mock SMS provider implementation
            const smsPayload = {
                to: userProfile.phone_number,
                from: this.smsProvider.sender,
                body: message,
            };
            console.log('Sending SMS notification:', smsPayload);
            // In production, integrate with actual SMS provider (Twilio, etc.)
            // const response = await fetch(`${this.smsProvider.apiUrl}/Messages.json`, {
            //   method: 'POST',
            //   headers: {
            //     'Authorization': `Basic ${btoa(`${this.smsProvider.accountSid}:${this.smsProvider.authToken}`)}`,
            //     'Content-Type': 'application/x-www-form-urlencoded',
            //   },
            //   body: new URLSearchParams(smsPayload),
            // });
        }
        catch (error) {
            console.error('SMS notification error:', error);
        }
    }
    /**
     * Send email notification
     */
    async sendEmailNotification(notification) {
        try {
            // Get user email
            const userProfile = await this.getUserProfile(notification.userId, notification.tenantId);
            if (!userProfile || !userProfile.email) {
                console.log(`No email found for user ${notification.userId}`);
                return;
            }
            const subject = this.getNotificationTitle(notification.type);
            const htmlBody = await this.generateEmailHTML(notification);
            // Mock email implementation
            const emailPayload = {
                from: `${this.emailProvider.fromName} <${this.emailProvider.fromEmail}>`,
                to: userProfile.email,
                subject,
                html: htmlBody,
            };
            console.log('Sending email notification:', emailPayload);
            // In production, use actual email service (nodemailer, SendGrid, etc.)
            // const transporter = nodemailer.createTransporter(this.emailProvider);
            // await transporter.sendMail(emailPayload);
        }
        catch (error) {
            console.error('Email notification error:', error);
        }
    }
    /**
     * Send in-app notification
     */
    async sendInAppNotification(notification) {
        try {
            // Send to WebSocket connections if user is online
            const userConnections = this.activeConnections.get(notification.userId);
            if (userConnections) {
                const inAppPayload = {
                    id: notification.id,
                    type: notification.type,
                    title: this.getNotificationTitle(notification.type),
                    body: await this.generateNotificationBody(notification),
                    data: notification.data,
                    timestamp: notification.createdAt,
                };
                // Send to all user's active connections
                userConnections.forEach((connection) => {
                    if (connection.readyState === 1) { // WebSocket.OPEN
                        connection.send(JSON.stringify({
                            type: 'notification',
                            payload: inAppPayload,
                        }));
                    }
                });
            }
            // Also save as in-app notification for later retrieval
            await this.db.query(`
        INSERT INTO platform.in_app_notifications (
          id, tenant_id, user_id, notification_id, title, body, data,
          is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      `, [
                (0, uuid_1.v4)(),
                notification.tenantId,
                notification.userId,
                notification.id,
                this.getNotificationTitle(notification.type),
                await this.generateNotificationBody(notification),
                JSON.stringify(notification.data)
            ]);
        }
        catch (error) {
            console.error('In-app notification error:', error);
        }
    }
    /**
     * Send webhook notification
     */
    async sendWebhookNotification(notification, webhookConfig) {
        try {
            if (!webhookConfig || !webhookConfig.url) {
                console.log('Webhook configuration missing');
                return;
            }
            const webhookPayload = {
                event: notification.type,
                tenantId: notification.tenantId,
                userId: notification.userId,
                data: notification.data,
                timestamp: notification.createdAt,
            };
            // Mock webhook call
            console.log('Sending webhook notification:', webhookPayload);
            // In production, make actual HTTP request
            // await fetch(webhookConfig.url, {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //     'Authorization': `Bearer ${webhookConfig.secret}`,
            //   },
            //   body: JSON.stringify(webhookPayload),
            // });
        }
        catch (error) {
            console.error('Webhook notification error:', error);
        }
    }
    /**
     * Generate notification body based on type and data
     */
    async generateNotificationBody(notification) {
        const { type, data } = notification;
        const amount = data.amount ? `₦${parseFloat(data.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '';
        const recipient = data.recipient_name || data.recipientName || 'recipient';
        switch (type) {
            case 'transfer_initiated':
                return `Your transfer of ${amount} to ${recipient} has been initiated. Reference: ${data.reference}`;
            case 'transfer_completed':
                return `Your transfer of ${amount} to ${recipient} has been completed successfully. Reference: ${data.reference}`;
            case 'transfer_failed':
                return `Your transfer of ${amount} to ${recipient} has failed. Amount has been reversed to your account. Reference: ${data.reference}`;
            case 'transfer_reversed':
                return `Your transfer of ${amount} has been reversed and credited back to your account. Reference: ${data.reference}`;
            case 'receipt_generated':
                return `Receipt has been generated for your transfer of ${amount}. Reference: ${data.reference}`;
            default:
                return `Transfer notification: ${type}. Reference: ${data.reference}`;
        }
    }
    /**
     * Generate SMS message
     */
    async generateSMSMessage(notification) {
        const body = await this.generateNotificationBody(notification);
        return `FMFB: ${body}`;
    }
    /**
     * Generate email HTML
     */
    async generateEmailHTML(notification) {
        const { type, data } = notification;
        const body = await this.generateNotificationBody(notification);
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transfer Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>First Microfinance Bank</h2>
            <p>Transfer Notification</p>
        </div>
        <div class="content">
            <h3>${this.getNotificationTitle(type)}</h3>
            <p>${body}</p>
            ${data.amount ? `
            <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 5px;">
                <strong>Transfer Details:</strong><br>
                Amount: ₦${parseFloat(data.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}<br>
                Reference: ${data.reference}<br>
                ${data.recipient_name ? `Recipient: ${data.recipient_name}<br>` : ''}
                Date: ${new Date().toLocaleString()}
            </div>
            ` : ''}
            <p>If you have any questions, please contact our customer service.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from First Microfinance Bank Limited.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
    }
    /**
     * Get notification title based on type
     */
    getNotificationTitle(type) {
        switch (type) {
            case 'transfer_initiated':
                return 'Transfer Initiated';
            case 'transfer_completed':
                return 'Transfer Completed';
            case 'transfer_failed':
                return 'Transfer Failed';
            case 'transfer_reversed':
                return 'Transfer Reversed';
            case 'receipt_generated':
                return 'Receipt Generated';
            default:
                return 'Transfer Notification';
        }
    }
    /**
     * Helper methods
     */
    async getUserNotificationPreferences(userId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT * FROM platform.notification_preferences
        WHERE user_id = $1 AND tenant_id = $2
      `, [userId, tenantId]);
            if (result.rows.length === 0) {
                // Return default preferences
                return {
                    userId,
                    tenantId,
                    transferInitiated: [
                        { type: 'push', enabled: true },
                        { type: 'in_app', enabled: true },
                    ],
                    transferCompleted: [
                        { type: 'push', enabled: true },
                        { type: 'sms', enabled: true },
                        { type: 'in_app', enabled: true },
                    ],
                    transferFailed: [
                        { type: 'push', enabled: true },
                        { type: 'sms', enabled: true },
                        { type: 'email', enabled: true },
                        { type: 'in_app', enabled: true },
                    ],
                    receiptGenerated: [
                        { type: 'in_app', enabled: true },
                    ],
                    quietHours: {
                        enabled: false,
                        start: '22:00',
                        end: '08:00',
                    },
                    maxDailyNotifications: 50,
                };
            }
            const row = result.rows[0];
            return {
                userId: row.user_id,
                tenantId: row.tenant_id,
                transferInitiated: row.transfer_initiated || [],
                transferCompleted: row.transfer_completed || [],
                transferFailed: row.transfer_failed || [],
                receiptGenerated: row.receipt_generated || [],
                quietHours: row.quiet_hours || { enabled: false, start: '22:00', end: '08:00' },
                maxDailyNotifications: row.max_daily_notifications || 50,
            };
        }
        catch (error) {
            console.error('Get notification preferences error:', error);
            return null;
        }
    }
    isQuietHours(quietHours) {
        if (!quietHours.enabled) {
            return false;
        }
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return currentTime >= quietHours.start || currentTime <= quietHours.end;
    }
    async getDailyNotificationCount(userId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT COUNT(*) as count
        FROM platform.notifications
        WHERE user_id = $1 AND tenant_id = $2 AND DATE(created_at) = CURRENT_DATE
      `, [userId, tenantId]);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            console.error('Get daily notification count error:', error);
            return 0;
        }
    }
    async getUserDeviceTokens(userId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT device_token, platform FROM platform.user_devices
        WHERE user_id = $1 AND tenant_id = $2 AND is_active = true
      `, [userId, tenantId]);
            return result.rows.map(row => ({
                token: row.device_token,
                platform: row.platform,
            }));
        }
        catch (error) {
            console.error('Get user device tokens error:', error);
            return [];
        }
    }
    async getUserProfile(userId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT email, phone_number, full_name
        FROM tenant.users
        WHERE id = $1
      `, [userId]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }
    /**
     * Start notification processor
     */
    startNotificationProcessor() {
        // Process queue every 5 seconds
        setInterval(() => {
            this.processNotificationQueue();
        }, 5000);
        console.log('Notification processor started');
    }
    /**
     * Register WebSocket connection for real-time notifications
     */
    registerConnection(userId, connection) {
        if (!this.activeConnections.has(userId)) {
            this.activeConnections.set(userId, []);
        }
        this.activeConnections.get(userId).push(connection);
        // Clean up on connection close
        connection.on('close', () => {
            const connections = this.activeConnections.get(userId);
            if (connections) {
                const index = connections.indexOf(connection);
                if (index > -1) {
                    connections.splice(index, 1);
                }
                if (connections.length === 0) {
                    this.activeConnections.delete(userId);
                }
            }
        });
    }
    /**
     * Get unread in-app notifications
     */
    async getUnreadNotifications(userId, tenantId) {
        try {
            const result = await this.db.query(`
        SELECT * FROM platform.in_app_notifications
        WHERE user_id = $1 AND tenant_id = $2 AND is_read = false
        ORDER BY created_at DESC
        LIMIT 20
      `, [userId, tenantId]);
            return result.rows;
        }
        catch (error) {
            console.error('Get unread notifications error:', error);
            return [];
        }
    }
    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId, userId) {
        try {
            await this.db.query(`
        UPDATE platform.in_app_notifications
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
        }
        catch (error) {
            console.error('Mark notification as read error:', error);
        }
    }
}
exports.default = NotificationService;
