/**
 * Notifications Management Routes
 * User notification preferences and history
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  // Get user preferences from database or return defaults
  const preferencesResult = await query(`
    SELECT notification_preferences FROM tenant.users
    WHERE id = $1 AND tenant_id = $2
  `, [req.user.id, req.user.tenantId]);

  let preferences = {
    email: {
      transactionAlerts: true,
      balanceUpdates: true,
      billReminders: true,
      securityAlerts: true,
      promotions: false
    },
    sms: {
      transactionAlerts: true,
      balanceUpdates: false,
      billReminders: true,
      securityAlerts: true,
      promotions: false
    },
    push: {
      transactionAlerts: true,
      balanceUpdates: true,
      billReminders: true,
      securityAlerts: true,
      promotions: true
    },
    inApp: {
      transactionAlerts: true,
      balanceUpdates: true,
      billReminders: true,
      securityAlerts: true,
      promotions: true
    }
  };

  if (preferencesResult.rows.length > 0 && preferencesResult.rows[0].notification_preferences) {
    try {
      const savedPreferences = JSON.parse(preferencesResult.rows[0].notification_preferences);
      preferences = { ...preferences, ...savedPreferences };
    } catch (e) {
      console.warn('Failed to parse notification preferences:', e);
    }
  }

  res.json({
    success: true,
    data: { preferences }
  });
}));

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', authenticateToken, validateTenantAccess, [
  body('preferences').isObject().withMessage('Preferences must be an object'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { preferences } = req.body;

  // Update user preferences in database
  await query(`
    UPDATE tenant.users
    SET notification_preferences = $1, updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3
  `, [JSON.stringify(preferences), req.user.id, req.user.tenantId]);

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: { preferences }
  });
}));

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, type = 'all', status = 'all' } = req.query;

  let typeFilter = '';
  if (type !== 'all') {
    typeFilter = `AND type = '${type}'`;
  }

  let statusFilter = '';
  if (status !== 'all') {
    statusFilter = `AND is_read = ${status === 'read' ? 'true' : 'false'}`;
  }

  // For now, we'll create sample notifications since the table might not exist
  const sampleNotifications = [
    {
      id: '1',
      type: 'transaction',
      title: 'Transaction Alert',
      message: 'You have received ₦50,000 from John Doe',
      is_read: false,
      created_at: new Date(),
      metadata: { amount: 50000, sender: 'John Doe' }
    },
    {
      id: '2',
      type: 'security',
      title: 'Security Alert',
      message: 'New device login detected',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      metadata: { device: 'iPhone 12', location: 'Lagos, Nigeria' }
    },
    {
      id: '3',
      type: 'bill_reminder',
      title: 'Bill Reminder',
      message: 'Your electricity bill is due in 3 days',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: { provider: 'IKEDC', amount: 15000 }
    },
    {
      id: '4',
      type: 'promotion',
      title: 'Special Offer',
      message: 'Get 50% off on your next bill payment',
      is_read: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      metadata: { code: 'SAVE50', expires: '2024-12-31' }
    }
  ];

  // Filter notifications based on query parameters
  let filteredNotifications = sampleNotifications;

  if (type !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.type === type);
  }

  if (status !== 'all') {
    filteredNotifications = filteredNotifications.filter(n =>
      status === 'read' ? n.is_read : !n.is_read
    );
  }

  // Apply pagination
  const paginatedNotifications = filteredNotifications.slice(
    parseInt(offset.toString()),
    parseInt(offset.toString()) + parseInt(limit.toString())
  );

  res.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: sampleNotifications.filter(n => !n.is_read).length
    }
  });
}));

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, just return success since we're using sample data
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  // For now, just return success since we're using sample data
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // For now, just return success since we're using sample data
  res.json({
    success: true,
    message: 'Notification deleted'
  });
}));

/**
 * GET /api/notifications/settings
 * Get notification delivery settings (channels, schedules, etc.)
 */
router.get('/settings', authenticateToken, validateTenantAccess, asyncHandler(async (req, res) => {
  const settings = {
    channels: {
      email: {
        enabled: true,
        address: req.user.email || 'user@example.com',
        verified: true
      },
      sms: {
        enabled: true,
        number: '+234xxxxxxxxxx',
        verified: false
      },
      push: {
        enabled: true,
        devices: 1
      }
    },
    schedule: {
      quiet_hours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      timezone: 'Africa/Lagos'
    },
    frequency: {
      digest: 'daily', // daily, weekly, monthly
      immediate: ['security', 'transaction'],
      batched: ['promotion', 'newsletter']
    }
  };

  res.json({
    success: true,
    data: { settings }
  });
}));

export default router;