/**
 * ============================================================================
 * AGGREGATOR SERVICE
 * ============================================================================
 * Purpose: Partner/influencer program management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
export interface AggregatorPartner {
    id: string;
    name: string;
    businessName: string | null;
    email: string;
    phone: string | null;
    contactPerson: string | null;
    customCode: string;
    codePrefix: string | null;
    compensationTierId: string | null;
    compensationType: 'per_referral' | 'percentage' | 'tiered' | 'hybrid';
    baseRate: number | null;
    customRates: Record<string, any>;
    totalReferrals: number;
    activeReferrals: number;
    fundedReferrals: number;
    pendingReferrals: number;
    totalCompensationEarned: number;
    totalCompensationPaid: number;
    pendingCompensation: number;
    status: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated';
    statusReason: string | null;
    contractStartDate: Date | null;
    contractEndDate: Date | null;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    bankCode: string | null;
    monthlyTarget: number | null;
    quarterlyBonus: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CompensationTier {
    id: string;
    tierName: string;
    tierLevel: number;
    tierDescription: string | null;
    minReferrals: number;
    maxReferrals: number | null;
    paymentPerReferral: number | null;
    paymentPerActiveReferral: number | null;
    paymentPerFundedReferral: number | null;
    tierBonus: number;
    benefits: string[] | null;
}
export interface Payout {
    id: string;
    partnerId: string;
    periodStart: Date;
    periodEnd: Date;
    totalReferrals: number;
    activeReferrals: number;
    fundedReferrals: number;
    baseCompensation: number;
    bonusCompensation: number;
    totalCompensation: number;
    status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled';
    submittedAt: Date | null;
    approvedAt: Date | null;
    paymentDate: Date | null;
    paymentReference: string | null;
    createdAt: Date;
}
export interface CreatePartnerParams {
    name: string;
    businessName?: string;
    email: string;
    phone?: string;
    contactPerson?: string;
    customCode: string;
    codePrefix?: string;
    compensationType?: 'per_referral' | 'percentage' | 'tiered' | 'hybrid';
    baseRate?: number;
    contractStartDate?: Date;
    contractEndDate?: Date;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    monthlyTarget?: number;
    quarterlyBonus?: number;
}
export interface PartnerStats {
    partnerId: string;
    partnerName: string;
    currentTier: string;
    totalReferrals: number;
    activeReferrals: number;
    fundedReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
    conversionRate: number;
    thisMonthReferrals: number;
    lastMonthReferrals: number;
    referralsByMonth: Array<{
        month: string;
        count: number;
    }>;
}
export declare class AggregatorService {
    private tenantId;
    constructor(tenantId: string);
    /**
     * Get tenant-specific database pool
     */
    private getPool;
    /**
     * Create a new aggregator partner
     */
    createPartner(params: CreatePartnerParams): Promise<string>;
    /**
     * Get partner by ID
     */
    getPartnerById(partnerId: string): Promise<AggregatorPartner | null>;
    /**
     * Get partner by custom code
     */
    getPartnerByCode(code: string): Promise<AggregatorPartner | null>;
    /**
     * Get all partners (with filters)
     */
    getPartners(filters?: {
        status?: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated';
        limit?: number;
        offset?: number;
    }): Promise<AggregatorPartner[]>;
    /**
     * Update partner status
     */
    updatePartnerStatus(partnerId: string, status: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated', reason?: string): Promise<void>;
    /**
     * Update partner
     */
    updatePartner(partnerId: string, updates: Partial<CreatePartnerParams>): Promise<void>;
    /**
     * Calculate compensation for partner
     */
    calculateCompensation(partnerId: string, periodStart: Date, periodEnd: Date): Promise<{
        totalCompensation: number;
        referralCount: number;
        tierName: string;
    }>;
    /**
     * Generate monthly payouts for all partners
     */
    generateMonthlyPayouts(year: number, month: number): Promise<number>;
    /**
     * Get partner payouts
     */
    getPartnerPayouts(partnerId: string, limit?: number, offset?: number): Promise<Payout[]>;
    /**
     * Get payout by ID
     */
    getPayoutById(payoutId: string): Promise<Payout | null>;
    /**
     * Approve payout
     */
    approvePayout(payoutId: string, approvedBy: string, paymentReference?: string): Promise<boolean>;
    /**
     * Reject payout
     */
    rejectPayout(payoutId: string, rejectedBy: string, reason: string): Promise<void>;
    /**
     * Mark payout as paid
     */
    markPayoutPaid(payoutId: string, paymentDate: Date, paymentReference: string): Promise<void>;
    /**
     * Get partner statistics
     */
    getPartnerStats(partnerId: string): Promise<PartnerStats>;
    /**
     * Get all compensation tiers
     */
    getCompensationTiers(): Promise<CompensationTier[]>;
    /**
     * Get payouts by status
     */
    getPayoutsByStatus(status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled', limit?: number, offset?: number): Promise<Payout[]>;
}
//# sourceMappingURL=AggregatorService.d.ts.map