/**
 * Transaction Disputes API Routes
 * Handles dispute submission, review, and resolution
 */

import express, { Request, Response, Router } from 'express';
import dbManager from '../config/multi-tenant-database';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Submit a transaction dispute
 * POST /api/disputes
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;

  try {
    console.log('🔍 Dispute route - Auth context:', {
      userId,
      tenantId: tenant?.id,
      tenantName: tenant?.name,
      hasUser: !!(req as any).user,
      hasTenant: !!tenant
    });

    console.log('📥 Dispute submission request body:', {
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {}),
      transactionDetailsType: typeof req.body?.transactionDetails
    });

    const {
      transactionId,
      transactionReference,
      transactionType,
      transactionDetails,
      disputeReason,
      disputeCategory,
      additionalNotes
    } = req.body;

    // Validation
    if (!transactionId || !transactionReference || !disputeReason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['transactionId', 'transactionReference', 'disputeReason']
      });
    }

    // Ensure transactionDetails is properly formatted
    let formattedTransactionDetails;
    try {
      if (typeof transactionDetails === 'string') {
        // If it's already a string, try to parse it to validate it's valid JSON
        formattedTransactionDetails = JSON.parse(transactionDetails);
      } else if (typeof transactionDetails === 'object' && transactionDetails !== null) {
        // If it's an object, use it as-is
        formattedTransactionDetails = transactionDetails;
      } else {
        // If it's neither, set to empty object
        formattedTransactionDetails = {};
      }
    } catch (err) {
      console.error('❌ Error parsing transaction details:', err);
      formattedTransactionDetails = {};
    }

    // Get user information
    const userResult = await dbManager.queryTenant(
      tenant.id,
      'SELECT email, phone_number FROM tenant.users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get tenant code and locale
    const tenantCode = tenant?.name?.toUpperCase() || 'DFLT';
    const tenantLocale = tenant?.configuration?.locale || 'en-US';

    // Generate tenant-prefixed dispute number with localized date
    const disputeNumberResult = await dbManager.queryTenant(
      tenant.id,
      'SELECT tenant.generate_dispute_number($1::text, $2::text) as dispute_number',
      [tenantCode, tenantLocale]
    );
    const disputeNumber = disputeNumberResult.rows[0].dispute_number;

    console.log(`📋 Generated dispute number: ${disputeNumber} (tenant: ${tenantCode}, locale: ${tenantLocale})`);

    // Insert dispute
    const insertResult = await dbManager.queryTenant(
      tenant.id,
      `INSERT INTO tenant.transaction_disputes (
        dispute_number,
        transaction_id,
        transaction_reference,
        transaction_type,
        user_id,
        user_email,
        user_phone,
        transaction_details,
        dispute_reason,
        dispute_category,
        additional_notes,
        status,
        priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        disputeNumber,
        transactionId,
        transactionReference,
        transactionType || 'transfer',
        userId,
        user.email,
        user.phone_number,
        JSON.stringify(formattedTransactionDetails),
        disputeReason,
        disputeCategory || 'other',
        additionalNotes,
        'pending',
        'normal'
      ]
    );

    const dispute = insertResult.rows[0];

    // Log initial activity
    await dbManager.queryTenant(
      tenant.id,
      `INSERT INTO tenant.dispute_activity_log (
        dispute_id,
        activity_type,
        performed_by,
        performed_by_name,
        performed_by_role,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        dispute.id,
        'created',
        userId,
        user.email,
        'customer',
        'Dispute created by customer'
      ]
    );

    console.log(`✅ Dispute created: ${disputeNumber} for transaction ${transactionReference}`);

    res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully',
      dispute: {
        id: dispute.id,
        disputeNumber: dispute.dispute_number,
        status: dispute.status,
        createdAt: dispute.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error submitting dispute:', error);
    res.status(500).json({
      error: 'Failed to submit dispute',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get user's disputes
 * GET /api/disputes
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;

  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT
        id,
        dispute_number,
        transaction_id,
        transaction_reference,
        transaction_type,
        transaction_details,
        dispute_reason,
        dispute_category,
        additional_notes,
        status,
        priority,
        created_at,
        updated_at,
        resolved_at,
        resolution_notes,
        refund_amount
      FROM tenant.transaction_disputes
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      queryText += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbManager.queryTenant(tenant.id, queryText, params);

    // Get total count
    let countQueryText = 'SELECT COUNT(*) FROM tenant.transaction_disputes WHERE user_id = $1';
    const countParams: any[] = [userId];

    if (status) {
      countQueryText += ' AND status = $2';
      countParams.push(status);
    }

    const countResult = await dbManager.queryTenant(tenant.id, countQueryText, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      disputes: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + result.rows.length) < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching disputes:', error);
    res.status(500).json({
      error: 'Failed to fetch disputes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get dispute details
 * GET /api/disputes/:disputeId
 */
router.get('/:disputeId', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const tenant = (req as any).tenant;
  const { disputeId } = req.params;

  try {
    // Get dispute
    const disputeResult = await dbManager.queryTenant(
      tenant.id,
      `SELECT * FROM tenant.transaction_disputes
       WHERE id = $1 AND user_id = $2`,
      [disputeId, userId]
    );

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = disputeResult.rows[0];

    // Get activity log
    const activityResult = await dbManager.queryTenant(
      tenant.id,
      `SELECT * FROM tenant.dispute_activity_log
       WHERE dispute_id = $1
       ORDER BY created_at DESC`,
      [disputeId]
    );

    res.json({
      dispute,
      activityLog: activityResult.rows
    });

  } catch (error) {
    console.error('❌ Error fetching dispute details:', error);
    res.status(500).json({
      error: 'Failed to fetch dispute details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get all disputes for bank staff (admin only)
 * GET /api/disputes/admin/all
 */
router.get('/admin/all', async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const tenant = (req as any).tenant;

  try {
    // Check if user is admin/staff
    if (!['admin', 'staff', 'support'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    const { status, priority, assignedTo, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT
        d.*,
        u.email as user_email,
        u.phone as user_phone,
        u.firstName || ' ' || u.lastName as user_name,
        a.email as assigned_to_email,
        a.firstName || ' ' || a.lastName as assigned_to_name
      FROM tenant.transaction_disputes d
      LEFT JOIN tenant.users u ON d.user_id = u.id
      LEFT JOIN tenant.users a ON d.assigned_to = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      queryText += ` AND d.status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      queryText += ` AND d.priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (assignedTo) {
      queryText += ` AND d.assigned_to = $${params.length + 1}`;
      params.push(assignedTo);
    }

    queryText += ` ORDER BY
      CASE d.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      d.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await dbManager.queryTenant(tenant.id, queryText, params);

    // Get total count
    let countQueryText = 'SELECT COUNT(*) FROM tenant.transaction_disputes WHERE 1=1';
    const countParams: any[] = [];

    if (status) {
      countQueryText += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    if (priority) {
      countQueryText += ` AND priority = $${countParams.length + 1}`;
      countParams.push(priority);
    }

    if (assignedTo) {
      countQueryText += ` AND assigned_to = $${countParams.length + 1}`;
      countParams.push(assignedTo);
    }

    const countResult = await dbManager.queryTenant(tenant.id, countQueryText, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      disputes: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + result.rows.length) < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching all disputes:', error);
    res.status(500).json({
      error: 'Failed to fetch disputes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Update dispute status (admin only)
 * PATCH /api/disputes/:disputeId/status
 */
router.patch('/:disputeId/status', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  const tenant = (req as any).tenant;
  const { disputeId } = req.params;
  const { status, resolutionNotes, resolutionType, refundAmount } = req.body;

  try {
    // Check if user is admin/staff
    if (!['admin', 'staff', 'support'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    // Update dispute
    const updateResult = await dbManager.queryTenant(
      tenant.id,
      `UPDATE tenant.transaction_disputes
       SET status = $1,
           resolution_notes = COALESCE($2, resolution_notes),
           resolution_type = COALESCE($3, resolution_type),
           refund_amount = COALESCE($4, refund_amount),
           resolved_by = CASE WHEN $1 = 'resolved' THEN $5 ELSE resolved_by END,
           resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE id = $6
       RETURNING *`,
      [status, resolutionNotes, resolutionType, refundAmount, userId, disputeId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    console.log(`✅ Dispute ${disputeId} status updated to ${status}`);

    res.json({
      success: true,
      dispute: updateResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating dispute status:', error);
    res.status(500).json({
      error: 'Failed to update dispute status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
