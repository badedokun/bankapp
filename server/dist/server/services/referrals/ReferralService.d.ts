/**
 * ============================================================================
 * REFERRAL SERVICE
 * ============================================================================
 * Purpose: Core referral management service
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
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
export declare class ReferralService {
    private tenantId;
    constructor(tenantId: string);
    /**
     * Get tenant-specific database pool
     */
    private getPool;
    /**
     * Create a new referral record
     */
    createReferral(params: CreateReferralParams): Promise<string>;
    /**
     * Get referral by ID
     */
    getReferralById(referralId: string): Promise<Referral | null>;
    /**
     * Get all referrals for a user (as referrer)
     */
    getUserReferrals(userId: string, limit?: number, offset?: number): Promise<Referral[]>;
    /**
     * Get referral statistics for a user
     */
    getReferralStats(userId: string): Promise<ReferralStats>;
    /**
     * Check referral eligibility
     */
    checkEligibility(referralId: string): Promise<boolean>;
    /**
     * Award referral bonus
     */
    awardBonus(referralId: string): Promise<{
        success: boolean;
        pointsAwarded: number;
        cashAwarded: number;
        message: string;
    }>;
    /**
     * Update referee status (KYC, funding, activation)
     */
    updateRefereeStatus(referralId: string, updates: {
        kycCompleted?: boolean;
        funded?: boolean;
        fundedAmount?: number;
        active?: boolean;
    }): Promise<void>;
    /**
     * Record referral share
     */
    shareReferral(params: ShareReferralParams): Promise<ShareResult>;
    /**
     * Track share click
     */
    trackClick(trackingUrl: string, ipAddress?: string): Promise<boolean>;
    /**
     * Get share analytics for a user
     */
    getShareAnalytics(userId: string): Promise<ShareAnalytics>;
    /**
     * Get top sharing channels across all users
     */
    getTopSharingChannels(): Promise<Array<{
        shareMethod: string;
        totalShares: number;
        totalClicks: number;
        totalConversions: number;
        conversionRate: number;
        avgClicksPerShare: number;
    }>>;
    /**
     * Validate referral code
     */
    validateReferralCode(code: string): Promise<{
        isValid: boolean;
        referrerId?: string;
        referrerName?: string;
        referrerTier?: string;
    }>;
    /**
     * Get user's referral code
     */
    getUserReferralCode(userId: string): Promise<string | null>;
    /**
     * Expire referrals that have passed grace period
     */
    expireStaleReferrals(): Promise<number>;
    /**
     * Get referrals by status
     */
    getReferralsByStatus(status: 'pending' | 'eligible' | 'awarded' | 'expired' | 'cancelled' | 'fraud_flagged', limit?: number, offset?: number): Promise<Referral[]>;
}
//# sourceMappingURL=ReferralService.d.ts.map