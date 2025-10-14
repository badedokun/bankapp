/**
 * ============================================================================
 * REFERRAL SYSTEM API ROUTES
 * ============================================================================
 * Purpose: API endpoints for referral, promo codes, and aggregator management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  ReferralService,
  PromoCodeService,
  AggregatorService,
  FraudDetectionService,
} from '../services/referrals';

const router = express.Router();

/**
 * Helper function to get tenant ID from request
 */
function getTenantId(req: Request): string | null {
  return (req as any).tenant?.id || null;
}

/**
 * Helper function to create service instances with tenant context
 */
function createServices(req: Request, res: Response) {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Tenant context required',
    });
    return null;
  }

  return {
    referralService: new ReferralService(tenantId),
    promoCodeService: new PromoCodeService(tenantId),
    aggregatorService: new AggregatorService(tenantId),
    fraudService: new FraudDetectionService(tenantId),
  };
}

// ============================================================================
// REFERRAL ENDPOINTS
// ============================================================================

/**
 * GET /api/referrals/user/:userId
 * Get user's referrals and statistics
 */
router.get('/user/:userId', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { userId } = req.params;
  const { limit, offset } = req.query;

  try {
    const [referrals, stats, code] = await Promise.all([
      services.referralService.getUserReferrals(
        userId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      ),
      services.referralService.getReferralStats(userId),
      services.referralService.getUserReferralCode(userId),
    ]);

    return res.json({
      code,
      stats,
      referrals,
    });
  } catch (error: any) {
    console.error('Error getting user referrals:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/referrals/create
 * Create a new referral
 */
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const {
    refereeId,
    referralCode,
    utmSource,
    utmMedium,
    utmCampaign,
    deviceInfo,
  } = req.body;

  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    // Extract device fingerprint from deviceInfo or generate one
    const deviceFingerprint = deviceInfo?.fingerprint || null;

    // Ensure user is authenticated
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID required',
      });
    }

    // Validate referral creation (fraud checks)
    const validation = await services.fraudService.validateReferralCreation(
      req.user.id,
      refereeId,
      deviceFingerprint,
      ipAddress
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: 'Referral creation blocked',
        errors: validation.errors,
      });
    }

    // Create referral
    const referralId = await services.referralService.createReferral({
      refereeId,
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
      deviceInfo,
      ipAddress,
      userAgent,
    });

    return res.status(201).json({
      success: true,
      referralId,
      message: 'Referral created successfully',
    });
  } catch (error: any) {
    console.error('Error creating referral:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/referrals/validate-code
 * Validate a referral code
 */
router.post('/validate-code', async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { code } = req.body;

  try {
    const result = await services.referralService.validateReferralCode(code);

    return res.json(result);
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/referrals/share
 * Record a referral share
 */
router.post('/share', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { shareMethod, shareDestination, deviceType, platform, metadata } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID required',
    });
  }

  try {
    const result = await services.referralService.shareReferral({
      userId: req.user.id,
      shareMethod,
      shareDestination,
      deviceType,
      platform,
      metadata,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error recording share:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/referrals/track-click
 * Track a click on a referral link
 */
router.post('/track-click', async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { trackingUrl } = req.body;
  const ipAddress = req.ip;

  try {
    const success = await services.referralService.trackClick(trackingUrl, ipAddress);

    return res.json({ success });
  } catch (error: any) {
    console.error('Error tracking click:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/referrals/share-analytics/:userId
 * Get share analytics for a user
 */
router.get('/share-analytics/:userId', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { userId } = req.params;

  try {
    const analytics = await services.referralService.getShareAnalytics(userId);

    return res.json(analytics);
  } catch (error: any) {
    console.error('Error getting share analytics:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/referrals/top-channels
 * Get top sharing channels
 */
router.get('/top-channels', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  try {
    const channels = await services.referralService.getTopSharingChannels();

    return res.json(channels);
  } catch (error: any) {
    console.error('Error getting top channels:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================================================
// PROMO CODE ENDPOINTS
// ============================================================================

/**
 * GET /api/promo-codes/active
 * Get all active promotional campaigns
 */
router.get('/promo-codes/active', async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  try {
    const campaigns = await services.promoCodeService.getActiveCampaigns();

    return res.json(campaigns);
  } catch (error: any) {
    console.error('Error getting active campaigns:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/promo-codes/validate
 * Validate a promo code
 */
router.post('/promo-codes/validate', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { code } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID required',
    });
  }

  try {
    const result = await services.promoCodeService.validatePromoCode(code, req.user.id);

    return res.json(result);
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/promo-codes/redeem
 * Redeem a promo code
 */
router.post('/promo-codes/redeem', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { code, depositAmount } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID required',
    });
  }

  try {
    const result = await services.promoCodeService.redeemPromoCode(
      req.user.id,
      code,
      depositAmount
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Error redeeming promo code:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/promo-codes/redemptions/:userId
 * Get user's redemption history
 */
router.get('/promo-codes/redemptions/:userId', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { userId } = req.params;
  const { limit, offset } = req.query;

  try {
    const redemptions = await services.promoCodeService.getUserRedemptions(
      userId,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    return res.json(redemptions);
  } catch (error: any) {
    console.error('Error getting redemptions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/promo-codes/campaigns (Admin only)
 * Create a new promotional campaign
 */
router.post('/promo-codes/campaigns', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  try {
    const campaignId = await services.promoCodeService.createCampaign({
      ...req.body,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      campaignId,
      message: 'Campaign created successfully',
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/promo-codes/campaigns/:campaignId/stats (Admin only)
 * Get campaign statistics
 */
router.get('/promo-codes/campaigns/:campaignId/stats', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { campaignId } = req.params;

  try {
    const stats = await services.promoCodeService.getCampaignStats(campaignId);

    return res.json(stats);
  } catch (error: any) {
    console.error('Error getting campaign stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================================================
// AGGREGATOR ENDPOINTS (Admin only)
// ============================================================================

/**
 * POST /api/aggregators/partners
 * Create a new aggregator partner
 */
router.post('/aggregators/partners', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  try {
    const partnerId = await services.aggregatorService.createPartner(req.body);

    return res.status(201).json({
      success: true,
      partnerId,
      message: 'Partner created successfully',
    });
  } catch (error: any) {
    console.error('Error creating partner:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/aggregators/partners
 * Get all aggregator partners
 */
router.get('/aggregators/partners', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { status, limit, offset } = req.query;

  try {
    const partners = await services.aggregatorService.getPartners({
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json(partners);
  } catch (error: any) {
    console.error('Error getting partners:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/aggregators/partners/:partnerId
 * Get partner by ID
 */
router.get('/aggregators/partners/:partnerId', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { partnerId } = req.params;

  try {
    const partner = await services.aggregatorService.getPartnerById(partnerId);

    if (!partner) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Partner not found',
      });
    }

    return res.json(partner);
  } catch (error: any) {
    console.error('Error getting partner:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/aggregators/partners/:partnerId/stats
 * Get partner statistics
 */
router.get('/aggregators/partners/:partnerId/stats', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { partnerId } = req.params;

  try {
    const stats = await services.aggregatorService.getPartnerStats(partnerId);

    return res.json(stats);
  } catch (error: any) {
    console.error('Error getting partner stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/aggregators/payouts/generate
 * Generate monthly payouts for all partners
 */
router.post('/aggregators/payouts/generate', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  const { year, month } = req.body;

  try {
    const count = await services.aggregatorService.generateMonthlyPayouts(year, month);

    return res.json({
      success: true,
      count,
      message: `Generated ${count} payouts for ${year}-${month}`,
    });
  } catch (error: any) {
    console.error('Error generating payouts:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/aggregators/payouts/:payoutId/approve
 * Approve a payout
 */
router.post('/aggregators/payouts/:payoutId/approve', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  const { payoutId } = req.params;
  const { paymentReference } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID required',
    });
  }

  try {
    const success = await services.aggregatorService.approvePayout(
      payoutId,
      req.user.id,
      paymentReference
    );

    return res.json({
      success,
      message: success ? 'Payout approved successfully' : 'Failed to approve payout',
    });
  } catch (error: any) {
    console.error('Error approving payout:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/aggregators/tiers
 * Get all compensation tiers
 */
router.get('/aggregators/tiers', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  try {
    const tiers = await services.aggregatorService.getCompensationTiers();

    return res.json(tiers);
  } catch (error: any) {
    console.error('Error getting compensation tiers:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// ============================================================================
// FRAUD DETECTION ENDPOINTS (Admin only)
// ============================================================================

/**
 * GET /api/fraud/stats
 * Get fraud detection statistics
 */
router.get('/fraud/stats', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  try {
    const stats = await services.fraudService.getFraudStats();

    return res.json(stats);
  } catch (error: any) {
    console.error('Error getting fraud stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/fraud/suspicious
 * Get suspicious referrals for manual review
 */
router.get('/fraud/suspicious', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  const { limit, offset } = req.query;

  try {
    const suspicious = await services.fraudService.getSuspiciousReferrals(
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    return res.json(suspicious);
  } catch (error: any) {
    console.error('Error getting suspicious referrals:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * POST /api/fraud/flag/:referralId
 * Flag a referral as fraud
 */
router.post('/fraud/flag/:referralId', authenticateToken, async (req: Request, res: Response) => {
  const services = createServices(req, res);
  if (!services) return undefined;

  // TODO: Add admin authorization check

  const { referralId } = req.params;
  const { reason } = req.body;

  try {
    await services.fraudService.flagReferralAsFraud(
      referralId,
      reason,
      req.user?.id
    );

    return res.json({
      success: true,
      message: 'Referral flagged as fraud successfully',
    });
  } catch (error: any) {
    console.error('Error flagging referral:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
