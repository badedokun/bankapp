/**
 * ============================================================================
 * PROMO CODE SERVICE
 * ============================================================================
 * Purpose: Promotional campaign and promo code management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

import { Pool } from 'pg';
import { getTenantPool } from '../../config/tenantDatabase';

export interface PromotionalCampaign {
  id: string;
  campaignName: string;
  campaignCode: string;
  campaignType: 'signup_bonus' | 'deposit_match' | 'fixed_points' | 'percentage_bonus';
  description: string;
  bonusPoints: number;
  bonusCash: number;
  depositMatchPercentage: number | null;
  maxBonusAmount: number | null;
  minDepositRequired: number | null;
  userEligibility: 'new_users' | 'existing_users' | 'tier_based' | 'all_users';
  eligibleTiers: string[] | null;
  maxRedemptionsTotal: number | null;
  maxRedemptionsPerUser: number;
  totalRedemptions: number;
  status: 'draft' | 'active' | 'paused' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromoCodeRedemption {
  id: string;
  userId: string;
  campaignId: string;
  campaignCode: string;
  depositAmount: number | null;
  pointsAwarded: number;
  cashBonusAwarded: number;
  redemptionDate: Date;
}

export interface CreateCampaignParams {
  campaignName: string;
  campaignCode: string;
  campaignType: 'signup_bonus' | 'deposit_match' | 'fixed_points' | 'percentage_bonus';
  description?: string;
  bonusPoints?: number;
  bonusCash?: number;
  depositMatchPercentage?: number;
  maxBonusAmount?: number;
  minDepositRequired?: number;
  userEligibility?: 'new_users' | 'existing_users' | 'tier_based' | 'all_users';
  eligibleTiers?: string[];
  maxRedemptionsTotal?: number;
  maxRedemptionsPerUser?: number;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

export interface ValidationResult {
  isValid: boolean;
  campaignId?: string;
  errorMessage?: string;
}

export interface RedemptionResult {
  success: boolean;
  pointsAwarded: number;
  cashBonus: number;
  message: string;
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  campaignCode: string;
  totalRedemptions: number;
  uniqueUsers: number;
  totalPointsAwarded: number;
  totalCashAwarded: number;
  totalDepositAmount: number;
  averageDepositAmount: number;
  conversionRate: number;
  redemptionsByDate: Array<{ date: string; count: number }>;
}

export class PromoCodeService {
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
   * Create a new promotional campaign
   */
  async createCampaign(params: CreateCampaignParams): Promise<string> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO rewards.promotional_campaigns (
          campaign_name, campaign_code, campaign_type, description,
          bonus_points, bonus_cash, deposit_match_percentage,
          max_bonus_amount, min_deposit_required,
          user_eligibility, eligible_tiers,
          max_redemptions_total, max_redemptions_per_user,
          start_date, end_date, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
        RETURNING id`,
        [
          params.campaignName,
          params.campaignCode.toUpperCase(),
          params.campaignType,
          params.description || '',
          params.bonusPoints || 0,
          params.bonusCash || 0,
          params.depositMatchPercentage || null,
          params.maxBonusAmount || null,
          params.minDepositRequired || null,
          params.userEligibility || 'all_users',
          params.eligibleTiers ? JSON.stringify(params.eligibleTiers) : null,
          params.maxRedemptionsTotal || null,
          params.maxRedemptionsPerUser || 1,
          params.startDate,
          params.endDate,
          params.createdBy,
        ]
      );

      return result.rows[0].id;
    } catch (error: any) {
      console.error('Error creating campaign:', error);

      if (error.code === '23505') { // Unique violation
        throw new Error(`Campaign code ${params.campaignCode} already exists`);
      }

      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<PromotionalCampaign | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<PromotionalCampaign>(
        `SELECT * FROM rewards.promotional_campaigns WHERE id = $1`,
        [campaignId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting campaign:', error);
      throw new Error(`Failed to get campaign: ${error.message}`);
    }
  }

  /**
   * Get campaign by code
   */
  async getCampaignByCode(code: string): Promise<PromotionalCampaign | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<PromotionalCampaign>(
        `SELECT * FROM rewards.promotional_campaigns WHERE campaign_code = $1`,
        [code.toUpperCase()]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting campaign by code:', error);
      throw new Error(`Failed to get campaign: ${error.message}`);
    }
  }

  /**
   * Get all active campaigns
   */
  async getActiveCampaigns(): Promise<PromotionalCampaign[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<PromotionalCampaign>(
        `SELECT * FROM rewards.promotional_campaigns
         WHERE status = 'active'
           AND start_date <= CURRENT_TIMESTAMP
           AND end_date >= CURRENT_TIMESTAMP
         ORDER BY created_at DESC`
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting active campaigns:', error);
      throw new Error(`Failed to get active campaigns: ${error.message}`);
    }
  }

  /**
   * Validate promo code
   */
  async validatePromoCode(code: string, userId: string): Promise<ValidationResult> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        is_valid: boolean;
        campaign_id: string | null;
        error_message: string | null;
      }>(
        `SELECT * FROM rewards.validate_promo_code($1, $2)`,
        [code.toUpperCase(), userId]
      );

      const row = result.rows[0];

      if (!row || !row.is_valid) {
        return {
          isValid: false,
          errorMessage: row?.error_message || 'Invalid promo code',
        };
      }

      return {
        isValid: true,
        campaignId: row.campaign_id || undefined,
      };
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      throw new Error(`Failed to validate promo code: ${error.message}`);
    }
  }

  /**
   * Redeem promo code
   */
  async redeemPromoCode(
    userId: string,
    code: string,
    depositAmount?: number
  ): Promise<RedemptionResult> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        success: boolean;
        points_awarded: number;
        cash_bonus: number;
        message: string;
      }>(
        `SELECT * FROM rewards.redeem_promo_code($1, $2, $3)`,
        [userId, code.toUpperCase(), depositAmount || null]
      );

      const row = result.rows[0];

      return {
        success: row.success,
        pointsAwarded: row.points_awarded,
        cashBonus: Number(row.cash_bonus),
        message: row.message,
      };
    } catch (error: any) {
      console.error('Error redeeming promo code:', error);
      throw new Error(`Failed to redeem promo code: ${error.message}`);
    }
  }

  /**
   * Get user's redemption history
   */
  async getUserRedemptions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PromoCodeRedemption[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<PromoCodeRedemption>(
        `SELECT * FROM rewards.promo_code_redemptions
         WHERE user_id = $1
         ORDER BY redemption_date DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting user redemptions:', error);
      throw new Error(`Failed to get user redemptions: ${error.message}`);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        total_redemptions: string;
        unique_users: string;
        total_points_awarded: string;
        total_cash_awarded: string;
        total_deposit_amount: string;
        average_deposit_amount: string;
        conversion_rate: string;
      }>(
        `SELECT * FROM rewards.get_campaign_stats($1)`,
        [campaignId]
      );

      const row = result.rows[0];

      // Get campaign info
      const campaign = await this.getCampaignById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get redemptions by date for last 30 days
      const dateResult = await pool.query<{ date: string; count: string }>(
        `SELECT DATE(redemption_date) as date, COUNT(*) as count
         FROM rewards.promo_code_redemptions
         WHERE campaign_id = $1
           AND redemption_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(redemption_date)
         ORDER BY date DESC`,
        [campaignId]
      );

      return {
        campaignId,
        campaignName: campaign.campaignName,
        campaignCode: campaign.campaignCode,
        totalRedemptions: parseInt(row.total_redemptions),
        uniqueUsers: parseInt(row.unique_users),
        totalPointsAwarded: parseInt(row.total_points_awarded),
        totalCashAwarded: parseFloat(row.total_cash_awarded),
        totalDepositAmount: parseFloat(row.total_deposit_amount),
        averageDepositAmount: parseFloat(row.average_deposit_amount),
        conversionRate: parseFloat(row.conversion_rate),
        redemptionsByDate: dateResult.rows.map(r => ({
          date: r.date,
          count: parseInt(r.count),
        })),
      };
    } catch (error: any) {
      console.error('Error getting campaign stats:', error);
      throw new Error(`Failed to get campaign stats: ${error.message}`);
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: 'draft' | 'active' | 'paused' | 'expired' | 'cancelled'
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.query(
        `UPDATE rewards.promotional_campaigns
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [status, campaignId]
      );
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      throw new Error(`Failed to update campaign status: ${error.message}`);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CreateCampaignParams>
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.campaignName !== undefined) {
        setClauses.push(`campaign_name = $${paramIndex}`);
        values.push(updates.campaignName);
        paramIndex++;
      }

      if (updates.description !== undefined) {
        setClauses.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
      }

      if (updates.bonusPoints !== undefined) {
        setClauses.push(`bonus_points = $${paramIndex}`);
        values.push(updates.bonusPoints);
        paramIndex++;
      }

      if (updates.bonusCash !== undefined) {
        setClauses.push(`bonus_cash = $${paramIndex}`);
        values.push(updates.bonusCash);
        paramIndex++;
      }

      if (updates.depositMatchPercentage !== undefined) {
        setClauses.push(`deposit_match_percentage = $${paramIndex}`);
        values.push(updates.depositMatchPercentage);
        paramIndex++;
      }

      if (updates.maxBonusAmount !== undefined) {
        setClauses.push(`max_bonus_amount = $${paramIndex}`);
        values.push(updates.maxBonusAmount);
        paramIndex++;
      }

      if (updates.minDepositRequired !== undefined) {
        setClauses.push(`min_deposit_required = $${paramIndex}`);
        values.push(updates.minDepositRequired);
        paramIndex++;
      }

      if (updates.maxRedemptionsTotal !== undefined) {
        setClauses.push(`max_redemptions_total = $${paramIndex}`);
        values.push(updates.maxRedemptionsTotal);
        paramIndex++;
      }

      if (updates.maxRedemptionsPerUser !== undefined) {
        setClauses.push(`max_redemptions_per_user = $${paramIndex}`);
        values.push(updates.maxRedemptionsPerUser);
        paramIndex++;
      }

      if (updates.startDate !== undefined) {
        setClauses.push(`start_date = $${paramIndex}`);
        values.push(updates.startDate);
        paramIndex++;
      }

      if (updates.endDate !== undefined) {
        setClauses.push(`end_date = $${paramIndex}`);
        values.push(updates.endDate);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(campaignId);

      await pool.query(
        `UPDATE rewards.promotional_campaigns
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  /**
   * Delete campaign (soft delete by setting status to cancelled)
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'cancelled');
  }

  /**
   * Expire campaigns that have passed end date
   */
  async expireOutdatedCampaigns(): Promise<number> {
    const pool = await this.getPool();

    try {
      const result = await pool.query(
        `UPDATE rewards.promotional_campaigns
         SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE end_date < CURRENT_TIMESTAMP
           AND status IN ('active', 'paused')
         RETURNING id`
      );

      return result.rowCount || 0;
    } catch (error: any) {
      console.error('Error expiring outdated campaigns:', error);
      throw new Error(`Failed to expire outdated campaigns: ${error.message}`);
    }
  }

  /**
   * Get all campaigns (with filters)
   */
  async getCampaigns(filters?: {
    status?: 'draft' | 'active' | 'paused' | 'expired' | 'cancelled';
    campaignType?: string;
    limit?: number;
    offset?: number;
  }): Promise<PromotionalCampaign[]> {
    const pool = await this.getPool();

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      if (filters?.campaignType) {
        conditions.push(`campaign_type = $${paramIndex}`);
        values.push(filters.campaignType);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const result = await pool.query<PromotionalCampaign>(
        `SELECT * FROM rewards.promotional_campaigns
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting campaigns:', error);
      throw new Error(`Failed to get campaigns: ${error.message}`);
    }
  }
}
