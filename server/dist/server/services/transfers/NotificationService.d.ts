/**
 * Real-time Notification Service for Transfers
 * Handles push notifications, SMS, email, and in-app notifications for transfer events
 */
import { Pool } from 'pg';
import { EventEmitter } from 'events';
declare class NotificationService extends EventEmitter {
    private db;
    private smsProvider;
    private emailProvider;
    private pushProvider;
    private activeConnections;
    private notificationQueue;
    private processing;
    constructor(database: Pool);
    /**
     * Send transfer notification
     */
    sendTransferNotification(event: {
        type: string;
        tenantId: string;
        userId: string;
        transferData: any;
        priority?: string;
    }): Promise<void>;
    /**
     * Process notification queue
     */
    private processNotificationQueue;
    /**
     * Process individual notification
     */
    private processNotification;
    /**
     * Send notification on specific channel
     */
    private sendNotificationOnChannel;
    /**
     * Send push notification
     */
    private sendPushNotification;
    /**
     * Send SMS notification
     */
    private sendSMSNotification;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Send in-app notification
     */
    private sendInAppNotification;
    /**
     * Send webhook notification
     */
    private sendWebhookNotification;
    /**
     * Generate notification body based on type and data
     */
    private generateNotificationBody;
    /**
     * Generate SMS message
     */
    private generateSMSMessage;
    /**
     * Generate email HTML
     */
    private generateEmailHTML;
    /**
     * Get notification title based on type
     */
    private getNotificationTitle;
    /**
     * Helper methods
     */
    private getUserNotificationPreferences;
    private isQuietHours;
    private getDailyNotificationCount;
    private getUserDeviceTokens;
    private getUserProfile;
    /**
     * Start notification processor
     */
    private startNotificationProcessor;
    /**
     * Register WebSocket connection for real-time notifications
     */
    registerConnection(userId: string, connection: any): void;
    /**
     * Get unread in-app notifications
     */
    getUnreadNotifications(userId: string, tenantId: string): Promise<any[]>;
    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
}
export default NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map