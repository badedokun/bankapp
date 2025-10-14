/**
 * ============================================================================
 * FRAUD DETECTION SERVICE
 * ============================================================================
 * Purpose: Detect and prevent referral fraud
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */
export interface FraudCheckResult {
    isFraudRisk: boolean;
    riskReason: string;
    riskScore: number;
    blockedReasons: string[];
}
export interface RateLimitCheck {
    withinLimits: boolean;
    limitType: string;
    currentCount: number;
    limitValue: number;
}
export interface DeviceFingerprintCheck {
    deviceFingerprint: string;
    matchCount: number;
    isExceeded: boolean;
    matchedUsers: string[];
}
export interface IPAddressCheck {
    ipAddress: string;
    matchCount: number;
    isExceeded: boolean;
    matchedUsers: string[];
}
export declare class FraudDetectionService {
    private tenantId;
    constructor(tenantId: string);
    /**
     * Get tenant-specific database pool
     */
    private getPool;
    /**
     * Comprehensive fraud check
     */
    checkFraudRisk(referrerId: string, refereeId: string, deviceFingerprint?: string, ipAddress?: string): Promise<FraudCheckResult>;
    /**
     * Check if user has exceeded referral limits
     */
    checkRateLimits(userId: string): Promise<RateLimitCheck>;
    /**
     * Check for circular referrals (A refers B, B refers A)
     */
    checkCircularReferral(referrerId: string, refereeId: string): Promise<boolean>;
    /**
     * Check device fingerprint for duplicates
     */
    checkDeviceFingerprint(deviceFingerprint: string, maxAllowed?: number): Promise<DeviceFingerprintCheck>;
    /**
     * Check IP address for duplicates
     */
    checkIPAddress(ipAddress: string, maxAllowed?: number): Promise<IPAddressCheck>;
    /**
     * Check velocity (rapid referrals in short time)
     */
    checkVelocity(userId: string, timeWindowMinutes?: number, maxReferrals?: number): Promise<{
        isExceeded: boolean;
        currentCount: number;
        maxAllowed: number;
    }>;
    /**
     * Flag referral as fraud
     */
    flagReferralAsFraud(referralId: string, reason: string, flaggedBy?: string): Promise<void>;
    /**
     * Get fraud statistics
     */
    getFraudStats(): Promise<{
        totalReferrals: number;
        fraudFlagged: number;
        fraudRate: number;
        circularReferrals: number;
        velocityViolations: number;
        deviceDuplicates: number;
        ipDuplicates: number;
    }>;
    /**
     * Get suspicious referrals for manual review
     */
    getSuspiciousReferrals(limit?: number, offset?: number): Promise<Array<{
        referralId: string;
        referrerId: string;
        refereeId: string;
        suspicionReasons: string[];
        riskScore: number;
        createdAt: Date;
    }>>;
    /**
     * Validate referral before creation
     */
    validateReferralCreation(referrerId: string, refereeId: string, deviceFingerprint?: string, ipAddress?: string): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=FraudDetectionService.d.ts.map