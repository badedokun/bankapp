/**
 * ============================================================================
 * PROMO CODE SERVICE
 * ============================================================================
 * Purpose: Promotional campaign and promo code management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
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
    redemptionsByDate: Array<{
        date: string;
        count: number;
    }>;
}
export declare class PromoCodeService {
    private tenantId;
    constructor(tenantId: string);
    /**
     * Get tenant-specific database pool
     */
    private getPool;
    /**
     * Create a new promotional campaign
     */
    createCampaign(params: CreateCampaignParams): Promise<string>;
    /**
     * Get campaign by ID
     */
    getCampaignById(campaignId: string): Promise<PromotionalCampaign | null>;
    /**
     * Get campaign by code
     */
    getCampaignByCode(code: string): Promise<PromotionalCampaign | null>;
    /**
     * Get all active campaigns
     */
    getActiveCampaigns(): Promise<PromotionalCampaign[]>;
    /**
     * Validate promo code
     */
    validatePromoCode(code: string, userId: string): Promise<ValidationResult>;
    /**
     * Redeem promo code
     */
    redeemPromoCode(userId: string, code: string, depositAmount?: number): Promise<RedemptionResult>;
    /**
     * Get user's redemption history
     */
    getUserRedemptions(userId: string, limit?: number, offset?: number): Promise<PromoCodeRedemption[]>;
    /**
     * Get campaign statistics
     */
    getCampaignStats(campaignId: string): Promise<CampaignStats>;
    /**
     * Update campaign status
     */
    updateCampaignStatus(campaignId: string, status: 'draft' | 'active' | 'paused' | 'expired' | 'cancelled'): Promise<void>;
    /**
     * Update campaign
     */
    updateCampaign(campaignId: string, updates: Partial<CreateCampaignParams>): Promise<void>;
    /**
     * Delete campaign (soft delete by setting status to cancelled)
     */
    deleteCampaign(campaignId: string): Promise<void>;
    /**
     * Expire campaigns that have passed end date
     */
    expireOutdatedCampaigns(): Promise<number>;
    /**
     * Get all campaigns (with filters)
     */
    getCampaigns(filters?: {
        status?: 'draft' | 'active' | 'paused' | 'expired' | 'cancelled';
        campaignType?: string;
        limit?: number;
        offset?: number;
    }): Promise<PromotionalCampaign[]>;
}
//# sourceMappingURL=PromoCodeService.d.ts.map