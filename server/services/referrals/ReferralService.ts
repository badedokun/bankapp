/**
 * ============================================================================
 * REFERRAL SERVICE
 * ============================================================================
 * Purpose: Core referral management service
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

import { Pool } from 'pg';
import { getTenantPool } from '../../config/tenantDatabase';

export interface CreateReferralParams {
  refereeId: string;
  referralCode: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceInfo?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  eligibleReferrals: number;
  awardedReferrals: number;
  expiredReferrals: number;
  totalPointsEarned: number;
  totalCashEarned: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  referralSource: string;
  bonusType: string;
  bonusPoints: number;
  bonusCash: number;
  bonusMultiplier: number;
  bonusStatus: string;
  bonusAwardedAt: Date | null;
  refereeAccountStatus: string;
  refereeKycCompleted: boolean;
  refereeFunded: boolean;
  refereeFundedAmount: number;
  eligibleForBonus: boolean;
  eligibilityNotes: string | null;
  expiresAt: Date;
  expired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareReferralParams {
  userId: string;
  shareMethod: 'sms' | 'email' | 'whatsapp' | 'telegram' | 'copy_link' | 'social_facebook' | 'social_twitter' | 'social_instagram' | 'social_linkedin' | 'qr_code';
  shareDestination?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  platform?: 'ios' | 'android' | 'web';
  metadata?: Record<string, any>;
}

export interface ShareResult {
  shareId: string;
  trackingUrl: string;
  referralCode: string;
}

export interface ShareAnalytics {
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  topShareMethod: string;
  sharesLast7Days: number;
  sharesLast30Days: number;
}

export class ReferralService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get tenant-specific database pool
   */
  private async getPool(): Promise<Pool> {
    return getTenantPool(this.tenantId);
  }

  /**
   * Create a new referral record
   */
  async createReferral(params: CreateReferralParams): Promise<string> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ id: string }>(
        `SELECT tenant.create_referral($1, $2, $3, $4, $5, $6, $7) as id`,
        [
          params.refereeId,
          params.referralCode,
          params.utmSource || null,
          params.utmMedium || null,
          params.utmCampaign || null,
          params.deviceInfo ? JSON.stringify(params.deviceInfo) : '{}',
          params.ipAddress || null,
        ]
      );

      return result.rows[0].id;
    } catch (error: any) {
      console.error('Error creating referral:', error);
      throw new Error(`Failed to create referral: ${error.message}`);
    }
  }

  /**
   * Get referral by ID
   */
  async getReferralById(referralId: string): Promise<Referral | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Referral>(
        `SELECT * FROM tenant.referrals WHERE id = $1`,
        [referralId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting referral:', error);
      throw new Error(`Failed to get referral: ${error.message}`);
    }
  }

  /**
   * Get all referrals for a user (as referrer)
   */
  async getUserReferrals(userId: string, limit: number = 50, offset: number = 0): Promise<Referral[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Referral>(
        `SELECT * FROM tenant.referrals
         WHERE referrer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting user referrals:', error);
      throw new Error(`Failed to get user referrals: ${error.message}`);
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<ReferralStats>(
        `SELECT * FROM tenant.get_referral_stats($1)`,
        [userId]
      );

      return result.rows[0];
    } catch (error: any) {
      console.error('Error getting referral stats:', error);
      throw new Error(`Failed to get referral stats: ${error.message}`);
    }
  }

  /**
   * Check referral eligibility
   */
  async checkEligibility(referralId: string): Promise<boolean> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ check_referral_eligibility: boolean }>(
        `SELECT tenant.check_referral_eligibility($1) as check_referral_eligibility`,
        [referralId]
      );

      return result.rows[0].check_referral_eligibility;
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      throw new Error(`Failed to check eligibility: ${error.message}`);
    }
  }

  /**
   * Award referral bonus
   */
  async awardBonus(referralId: string): Promise<{
    success: boolean;
    pointsAwarded: number;
    cashAwarded: number;
    message: string;
  }> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        success: boolean;
        points_awarded: number;
        cash_awarded: number;
        message: string;
      }>(
        `SELECT * FROM tenant.award_referral_bonus($1)`,
        [referralId]
      );

      const row = result.rows[0];
      return {
        success: row.success,
        pointsAwarded: row.points_awarded,
        cashAwarded: Number(row.cash_awarded),
        message: row.message,
      };
    } catch (error: any) {
      console.error('Error awarding bonus:', error);
      throw new Error(`Failed to award bonus: ${error.message}`);
    }
  }

  /**
   * Update referee status (KYC, funding, activation)
   */
  async updateRefereeStatus(
    referralId: string,
    updates: {
      kycCompleted?: boolean;
      funded?: boolean;
      fundedAmount?: number;
      active?: boolean;
    }
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.kycCompleted !== undefined) {
        setClauses.push(`referee_kyc_completed = $${paramIndex}`);
        values.push(updates.kycCompleted);
        paramIndex++;

        if (updates.kycCompleted) {
          setClauses.push(`referee_kyc_completed_at = CURRENT_TIMESTAMP`);
        }
      }

      if (updates.funded !== undefined) {
        setClauses.push(`referee_funded = $${paramIndex}`);
        values.push(updates.funded);
        paramIndex++;

        if (updates.funded) {
          setClauses.push(`referee_funded_at = CURRENT_TIMESTAMP`);
        }
      }

      if (updates.fundedAmount !== undefined) {
        setClauses.push(`referee_funded_amount = $${paramIndex}`);
        values.push(updates.fundedAmount);
        paramIndex++;
      }

      if (updates.active !== undefined) {
        setClauses.push(`referee_active = $${paramIndex}`);
        values.push(updates.active);
        paramIndex++;

        if (updates.active) {
          setClauses.push(`referee_activated_at = CURRENT_TIMESTAMP`);
        }
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(referralId);

      await pool.query(
        `UPDATE tenant.referrals
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    } catch (error: any) {
      console.error('Error updating referee status:', error);
      throw new Error(`Failed to update referee status: ${error.message}`);
    }
  }

  /**
   * Record referral share
   */
  async shareReferral(params: ShareReferralParams): Promise<ShareResult> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        share_id: string;
        tracking_url: string;
        referral_code: string;
      }>(
        `SELECT * FROM tenant.record_referral_share($1, $2, $3, $4, $5, $6)`,
        [
          params.userId,
          params.shareMethod,
          params.shareDestination || null,
          params.deviceType || null,
          params.platform || null,
          params.metadata ? JSON.stringify(params.metadata) : '{}',
        ]
      );

      const row = result.rows[0];
      return {
        shareId: row.share_id,
        trackingUrl: row.tracking_url,
        referralCode: row.referral_code,
      };
    } catch (error: any) {
      console.error('Error recording share:', error);
      throw new Error(`Failed to record share: ${error.message}`);
    }
  }

  /**
   * Track share click
   */
  async trackClick(trackingUrl: string, ipAddress?: string): Promise<boolean> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ track_share_click: boolean }>(
        `SELECT tenant.track_share_click($1, $2) as track_share_click`,
        [trackingUrl, ipAddress || null]
      );

      return result.rows[0].track_share_click;
    } catch (error: any) {
      console.error('Error tracking click:', error);
      throw new Error(`Failed to track click: ${error.message}`);
    }
  }

  /**
   * Get share analytics for a user
   */
  async getShareAnalytics(userId: string): Promise<ShareAnalytics> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        total_shares: string;
        total_clicks: string;
        total_conversions: string;
        conversion_rate: string;
        top_share_method: string;
        shares_last_7_days: string;
        shares_last_30_days: string;
      }>(
        `SELECT * FROM tenant.get_share_analytics($1)`,
        [userId]
      );

      const row = result.rows[0];
      return {
        totalShares: parseInt(row.total_shares),
        totalClicks: parseInt(row.total_clicks),
        totalConversions: parseInt(row.total_conversions),
        conversionRate: parseFloat(row.conversion_rate),
        topShareMethod: row.top_share_method,
        sharesLast7Days: parseInt(row.shares_last_7_days),
        sharesLast30Days: parseInt(row.shares_last_30_days),
      };
    } catch (error: any) {
      console.error('Error getting share analytics:', error);
      throw new Error(`Failed to get share analytics: ${error.message}`);
    }
  }

  /**
   * Get top sharing channels across all users
   */
  async getTopSharingChannels(): Promise<Array<{
    shareMethod: string;
    totalShares: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    avgClicksPerShare: number;
  }>> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        share_method: string;
        total_shares: string;
        total_clicks: string;
        total_conversions: string;
        conversion_rate: string;
        avg_clicks_per_share: string;
      }>(
        `SELECT * FROM tenant.get_top_sharing_channels()`
      );

      return result.rows.map(row => ({
        shareMethod: row.share_method,
        totalShares: parseInt(row.total_shares),
        totalClicks: parseInt(row.total_clicks),
        totalConversions: parseInt(row.total_conversions),
        conversionRate: parseFloat(row.conversion_rate),
        avgClicksPerShare: parseFloat(row.avg_clicks_per_share),
      }));
    } catch (error: any) {
      console.error('Error getting top sharing channels:', error);
      throw new Error(`Failed to get top sharing channels: ${error.message}`);
    }
  }

  /**
   * Validate referral code
   */
  async validateReferralCode(code: string): Promise<{
    isValid: boolean;
    referrerId?: string;
    referrerName?: string;
    referrerTier?: string;
  }> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        is_valid: boolean;
        referrer_id: string | null;
        referrer_name: string | null;
        referrer_tier: string | null;
      }>(
        `SELECT * FROM tenant.validate_referral_code($1)`,
        [code]
      );

      const row = result.rows[0];

      if (!row || !row.is_valid) {
        return { isValid: false };
      }

      return {
        isValid: true,
        referrerId: row.referrer_id || undefined,
        referrerName: row.referrer_name || undefined,
        referrerTier: row.referrer_tier || undefined,
      };
    } catch (error: any) {
      console.error('Error validating referral code:', error);
      throw new Error(`Failed to validate referral code: ${error.message}`);
    }
  }

  /**
   * Get user's referral code
   */
  async getUserReferralCode(userId: string): Promise<string | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ referral_code: string }>(
        `SELECT referral_code FROM tenant.users WHERE id = $1`,
        [userId]
      );

      return result.rows[0]?.referral_code || null;
    } catch (error: any) {
      console.error('Error getting user referral code:', error);
      throw new Error(`Failed to get user referral code: ${error.message}`);
    }
  }

  /**
   * Expire referrals that have passed grace period
   */
  async expireStaleReferrals(): Promise<number> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ expired_count: number }>(
        `UPDATE tenant.referrals
         SET bonus_status = 'expired',
             expired = true,
             eligibility_notes = 'Expired: 90-day grace period passed',
             updated_at = CURRENT_TIMESTAMP
         WHERE expires_at < CURRENT_TIMESTAMP
           AND bonus_status NOT IN ('awarded', 'expired', 'cancelled')
         RETURNING id`
      );

      return result.rowCount || 0;
    } catch (error: any) {
      console.error('Error expiring stale referrals:', error);
      throw new Error(`Failed to expire stale referrals: ${error.message}`);
    }
  }

  /**
   * Get referrals by status
   */
  async getReferralsByStatus(
    status: 'pending' | 'eligible' | 'awarded' | 'expired' | 'cancelled' | 'fraud_flagged',
    limit: number = 50,
    offset: number = 0
  ): Promise<Referral[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Referral>(
        `SELECT * FROM tenant.referrals
         WHERE bonus_status = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting referrals by status:', error);
      throw new Error(`Failed to get referrals by status: ${error.message}`);
    }
  }
}
