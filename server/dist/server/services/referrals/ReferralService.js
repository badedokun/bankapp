"use strict";
/**
 * ============================================================================
 * REFERRAL SERVICE
 * ============================================================================
 * Purpose: Core referral management service
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const database_1 = require("../../config/database");
class ReferralService {
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
     * Create a new referral record
     */
    async createReferral(params) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT tenant.create_referral($1, $2, $3, $4, $5, $6, $7) as id`, [
                params.refereeId,
                params.referralCode,
                params.utmSource || null,
                params.utmMedium || null,
                params.utmCampaign || null,
                params.deviceInfo ? JSON.stringify(params.deviceInfo) : '{}',
                params.ipAddress || null,
            ]);
            return result.rows[0].id;
        }
        catch (error) {
            console.error('Error creating referral:', error);
            throw new Error(`Failed to create referral: ${error.message}`);
        }
    }
    /**
     * Get referral by ID
     */
    async getReferralById(referralId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.referrals WHERE id = $1`, [referralId]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Error getting referral:', error);
            throw new Error(`Failed to get referral: ${error.message}`);
        }
    }
    /**
     * Get all referrals for a user (as referrer)
     */
    async getUserReferrals(userId, limit = 50, offset = 0) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.referrals
         WHERE referrer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting user referrals:', error);
            throw new Error(`Failed to get user referrals: ${error.message}`);
        }
    }
    /**
     * Get referral statistics for a user
     */
    async getReferralStats(userId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.get_referral_stats($1)`, [userId]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error getting referral stats:', error);
            throw new Error(`Failed to get referral stats: ${error.message}`);
        }
    }
    /**
     * Check referral eligibility
     */
    async checkEligibility(referralId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT tenant.check_referral_eligibility($1) as check_referral_eligibility`, [referralId]);
            return result.rows[0].check_referral_eligibility;
        }
        catch (error) {
            console.error('Error checking eligibility:', error);
            throw new Error(`Failed to check eligibility: ${error.message}`);
        }
    }
    /**
     * Award referral bonus
     */
    async awardBonus(referralId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.award_referral_bonus($1)`, [referralId]);
            const row = result.rows[0];
            return {
                success: row.success,
                pointsAwarded: row.points_awarded,
                cashAwarded: Number(row.cash_awarded),
                message: row.message,
            };
        }
        catch (error) {
            console.error('Error awarding bonus:', error);
            throw new Error(`Failed to award bonus: ${error.message}`);
        }
    }
    /**
     * Update referee status (KYC, funding, activation)
     */
    async updateRefereeStatus(referralId, updates) {
        const pool = await this.getPool();
        try {
            const setClauses = [];
            const values = [];
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
            await pool.query(`UPDATE tenant.referrals
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`, values);
        }
        catch (error) {
            console.error('Error updating referee status:', error);
            throw new Error(`Failed to update referee status: ${error.message}`);
        }
    }
    /**
     * Record referral share
     */
    async shareReferral(params) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.record_referral_share($1, $2, $3, $4, $5, $6)`, [
                params.userId,
                params.shareMethod,
                params.shareDestination || null,
                params.deviceType || null,
                params.platform || null,
                params.metadata ? JSON.stringify(params.metadata) : '{}',
            ]);
            const row = result.rows[0];
            return {
                shareId: row.share_id,
                trackingUrl: row.tracking_url,
                referralCode: row.referral_code,
            };
        }
        catch (error) {
            console.error('Error recording share:', error);
            throw new Error(`Failed to record share: ${error.message}`);
        }
    }
    /**
     * Track share click
     */
    async trackClick(trackingUrl, ipAddress) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT tenant.track_share_click($1, $2) as track_share_click`, [trackingUrl, ipAddress || null]);
            return result.rows[0].track_share_click;
        }
        catch (error) {
            console.error('Error tracking click:', error);
            throw new Error(`Failed to track click: ${error.message}`);
        }
    }
    /**
     * Get share analytics for a user
     */
    async getShareAnalytics(userId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.get_share_analytics($1)`, [userId]);
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
        }
        catch (error) {
            console.error('Error getting share analytics:', error);
            throw new Error(`Failed to get share analytics: ${error.message}`);
        }
    }
    /**
     * Get top sharing channels across all users
     */
    async getTopSharingChannels() {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.get_top_sharing_channels()`);
            return result.rows.map(row => ({
                shareMethod: row.share_method,
                totalShares: parseInt(row.total_shares),
                totalClicks: parseInt(row.total_clicks),
                totalConversions: parseInt(row.total_conversions),
                conversionRate: parseFloat(row.conversion_rate),
                avgClicksPerShare: parseFloat(row.avg_clicks_per_share),
            }));
        }
        catch (error) {
            console.error('Error getting top sharing channels:', error);
            throw new Error(`Failed to get top sharing channels: ${error.message}`);
        }
    }
    /**
     * Validate referral code
     */
    async validateReferralCode(code) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.validate_referral_code($1)`, [code]);
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
        }
        catch (error) {
            console.error('Error validating referral code:', error);
            throw new Error(`Failed to validate referral code: ${error.message}`);
        }
    }
    /**
     * Get user's referral code
     */
    async getUserReferralCode(userId) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT referral_code FROM tenant.users WHERE id = $1`, [userId]);
            return result.rows[0]?.referral_code || null;
        }
        catch (error) {
            console.error('Error getting user referral code:', error);
            throw new Error(`Failed to get user referral code: ${error.message}`);
        }
    }
    /**
     * Expire referrals that have passed grace period
     */
    async expireStaleReferrals() {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`UPDATE tenant.referrals
         SET bonus_status = 'expired',
             expired = true,
             eligibility_notes = 'Expired: 90-day grace period passed',
             updated_at = CURRENT_TIMESTAMP
         WHERE expires_at < CURRENT_TIMESTAMP
           AND bonus_status NOT IN ('awarded', 'expired', 'cancelled')
         RETURNING id`);
            return result.rowCount || 0;
        }
        catch (error) {
            console.error('Error expiring stale referrals:', error);
            throw new Error(`Failed to expire stale referrals: ${error.message}`);
        }
    }
    /**
     * Get referrals by status
     */
    async getReferralsByStatus(status, limit = 50, offset = 0) {
        const pool = await this.getPool();
        try {
            const result = await pool.query(`SELECT * FROM tenant.referrals
         WHERE bonus_status = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [status, limit, offset]);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting referrals by status:', error);
            throw new Error(`Failed to get referrals by status: ${error.message}`);
        }
    }
}
exports.ReferralService = ReferralService;
//# sourceMappingURL=ReferralService.js.map