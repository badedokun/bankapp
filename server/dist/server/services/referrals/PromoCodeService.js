"use strict";
/**
 * ============================================================================
 * PROMO CODE SERVICE
 * ============================================================================
 * Purpose: Promotional campaign and promo code management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCodeService = void 0;
const database_1 = require("../../config/database");
class PromoCodeService {
    constructor(tenantId) {
        this.tenantId = tenantId;
    }
    /**
     * Get tenant-specific database pool
     */
    async getPool() {
        return (0, database_1.getTenantPool)(this.tenantId);
    }
    /**
     * Create a new promotional campaign
     */
    async createCampaign(params) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`INSERT INTO rewards.promotional_campaigns (
          campaign_name, campaign_code, campaign_type, description,
          bonus_points, bonus_cash, deposit_match_percentage,
          max_bonus_amount, min_deposit_required,
          user_eligibility, eligible_tiers,
          max_redemptions_total, max_redemptions_per_user,
          start_date, end_date, created_by, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft')
        RETURNING id`, [
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
            ]);
            return result.rows[0].id;
        }
        catch (error) {
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
    async getCampaignById(campaignId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.promotional_campaigns WHERE id = $1`, [campaignId]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Error getting campaign:', error);
            throw new Error(`Failed to get campaign: ${error.message}`);
        }
    }
    /**
     * Get campaign by code
     */
    async getCampaignByCode(code) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.promotional_campaigns WHERE campaign_code = $1`, [code.toUpperCase()]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Error getting campaign by code:', error);
            throw new Error(`Failed to get campaign: ${error.message}`);
        }
    }
    /**
     * Get all active campaigns
     */
    async getActiveCampaigns() {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.promotional_campaigns
         WHERE status = 'active'
           AND start_date <= CURRENT_TIMESTAMP
           AND end_date >= CURRENT_TIMESTAMP
         ORDER BY created_at DESC`);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting active campaigns:', error);
            throw new Error(`Failed to get active campaigns: ${error.message}`);
        }
    }
    /**
     * Validate promo code
     */
    async validatePromoCode(code, userId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.validate_promo_code($1, $2)`, [code.toUpperCase(), userId]);
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
        }
        catch (error) {
            console.error('Error validating promo code:', error);
            throw new Error(`Failed to validate promo code: ${error.message}`);
        }
    }
    /**
     * Redeem promo code
     */
    async redeemPromoCode(userId, code, depositAmount) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.redeem_promo_code($1, $2, $3)`, [userId, code.toUpperCase(), depositAmount || null]);
            const row = result.rows[0];
            return {
                success: row.success,
                pointsAwarded: row.points_awarded,
                cashBonus: Number(row.cash_bonus),
                message: row.message,
            };
        }
        catch (error) {
            console.error('Error redeeming promo code:', error);
            throw new Error(`Failed to redeem promo code: ${error.message}`);
        }
    }
    /**
     * Get user's redemption history
     */
    async getUserRedemptions(userId, limit = 50, offset = 0) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.promo_code_redemptions
         WHERE user_id = $1
         ORDER BY redemption_date DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting user redemptions:', error);
            throw new Error(`Failed to get user redemptions: ${error.message}`);
        }
    }
    /**
     * Get campaign statistics
     */
    async getCampaignStats(campaignId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM rewards.get_campaign_stats($1)`, [campaignId]);
            const row = result.rows[0];
            // Get campaign info
            const campaign = await this.getCampaignById(campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            // Get redemptions by date for last 30 days
            const dateResult = await pool.query(`SELECT DATE(redemption_date) as date, COUNT(*) as count
         FROM rewards.promo_code_redemptions
         WHERE campaign_id = $1
           AND redemption_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY DATE(redemption_date)
         ORDER BY date DESC`, [campaignId]);
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
        }
        catch (error) {
            console.error('Error getting campaign stats:', error);
            throw new Error(`Failed to get campaign stats: ${error.message}`);
        }
    }
    /**
     * Update campaign status
     */
    async updateCampaignStatus(campaignId, status) {
        const pool = await this.getPool();
        try {
            await pool.query(`UPDATE rewards.promotional_campaigns
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [status, campaignId]);
        }
        catch (error) {
            console.error('Error updating campaign status:', error);
            throw new Error(`Failed to update campaign status: ${error.message}`);
        }
    }
    /**
     * Update campaign
     */
    async updateCampaign(campaignId, updates) {
        const pool = await this.getPool();
        try {
            const setClauses = [];
            const values = [];
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
            await pool.query(`UPDATE rewards.promotional_campaigns
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`, values);
        }
        catch (error) {
            console.error('Error updating campaign:', error);
            throw new Error(`Failed to update campaign: ${error.message}`);
        }
    }
    /**
     * Delete campaign (soft delete by setting status to cancelled)
     */
    async deleteCampaign(campaignId) {
        await this.updateCampaignStatus(campaignId, 'cancelled');
    }
    /**
     * Expire campaigns that have passed end date
     */
    async expireOutdatedCampaigns() {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`UPDATE rewards.promotional_campaigns
         SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE end_date < CURRENT_TIMESTAMP
           AND status IN ('active', 'paused')
         RETURNING id`);
            return result.rowCount || 0;
        }
        catch (error) {
            console.error('Error expiring outdated campaigns:', error);
            throw new Error(`Failed to expire outdated campaigns: ${error.message}`);
        }
    }
    /**
     * Get all campaigns (with filters)
     */
    async getCampaigns(filters) {
        const pool = await this.getPool();
        try {
            const conditions = [];
            const values = [];
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
            const result = await pool.query(`SELECT * FROM rewards.promotional_campaigns
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...values, limit, offset]);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting campaigns:', error);
            throw new Error(`Failed to get campaigns: ${error.message}`);
        }
    }
}
exports.PromoCodeService = PromoCodeService;
//# sourceMappingURL=PromoCodeService.js.map