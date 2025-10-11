/**
 * Reward Service
 * Manages gamification, points, achievements, and challenges
 * Inspired by Nubank's reward system
 */
export interface RewardTier {
    id: number;
    tierCode: string;
    tierName: string;
    tierLevel: number;
    pointsRequired: number;
    icon: string;
    color: string;
    benefits: {
        description: string;
        perks: string[];
    };
}
export interface UserReward {
    userId: string;
    totalPoints: number;
    currentTier: RewardTier;
    pointsThisMonth: number;
    lifetimePoints: number;
    pointsToNextTier: number;
    nextTier?: RewardTier;
}
export interface Achievement {
    id: number;
    achievementCode: string;
    achievementName: string;
    description: string;
    category: 'savings' | 'spending' | 'loyalty' | 'transactions' | 'referral' | 'special';
    icon: string;
    badgeColor: string;
    pointsReward: number;
    unlockCriteria: any;
    isSecret: boolean;
    unlocked?: boolean;
    unlockedAt?: Date;
}
export interface Challenge {
    id: number;
    challengeCode: string;
    challengeName: string;
    description: string;
    challengeType: 'daily' | 'weekly' | 'monthly' | 'special';
    category: 'transactional' | 'behavioral' | 'educational' | 'social';
    icon: string;
    pointsReward: number;
    completionCriteria: any;
    validFrom: Date;
    validUntil: Date;
    progress?: number;
    status?: 'active' | 'completed' | 'expired' | 'claimed';
}
export interface Streak {
    userId: string;
    streakType: 'login' | 'savings' | 'budget' | 'transaction';
    currentCount: number;
    longestCount: number;
    lastActivityDate: Date;
}
export interface PointTransaction {
    id: number;
    userId: string;
    points: number;
    transactionType: 'earn' | 'redeem' | 'expire' | 'bonus' | 'penalty';
    actionType: string;
    description: string;
    metadata?: any;
    referenceId?: string;
    createdAt: Date;
}
export declare class RewardService {
    private tenantId;
    constructor(tenantId: string);
    private getPool;
    /**
     * Get user's current reward status
     */
    getUserRewards(userId: string): Promise<UserReward | null>;
    /**
     * Initialize rewards for a new user
     */
    initializeUserRewards(userId: string): Promise<void>;
    /**
     * Award points to a user
     */
    awardPoints(userId: string, points: number, actionType: string, description: string, metadata?: any): Promise<void>;
    /**
     * Check and handle tier upgrades
     */
    checkTierUpgrade(userId: string): Promise<RewardTier | null>;
    /**
     * Get all achievements for a user (unlocked and locked)
     */
    getUserAchievements(userId: string): Promise<Achievement[]>;
    /**
     * Unlock an achievement for a user
     */
    unlockAchievement(userId: string, achievementCode: string): Promise<boolean>;
    /**
     * Get active challenges for a user
     */
    getUserChallenges(userId: string): Promise<Challenge[]>;
    /**
     * Update challenge progress
     */
    updateChallengeProgress(userId: string, challengeCode: string, progress: number): Promise<void>;
    /**
     * Claim challenge rewards
     */
    claimChallenge(userId: string, challengeCode: string): Promise<boolean>;
    /**
     * Get user streaks
     */
    getUserStreaks(userId: string): Promise<Streak[]>;
    /**
     * Update streak (e.g., login streak)
     */
    updateStreak(userId: string, streakType: 'login' | 'savings' | 'budget' | 'transaction'): Promise<void>;
    /**
     * Get point transaction history
     */
    getPointTransactions(userId: string, limit?: number): Promise<PointTransaction[]>;
}
export default RewardService;
//# sourceMappingURL=RewardService.d.ts.map