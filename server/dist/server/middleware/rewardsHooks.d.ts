/**
 * Rewards Hooks Middleware
 * Automatically triggers reward actions after user events
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Award points and check achievements after transfer
 */
export declare function afterTransferHook(req: Request, res: Response, transferData: any): Promise<{
    pointsAwarded: number;
    unlockedAchievements: string[];
    tierUpgrade: import("../services/RewardService").RewardTier;
}>;
/**
 * Award points and check achievements after savings deposit
 */
export declare function afterSavingsDepositHook(req: Request, res: Response, savingsData: any): Promise<{
    pointsAwarded: number;
    unlockedAchievements: string[];
    tierUpgrade: import("../services/RewardService").RewardTier;
}>;
/**
 * Award points and check achievements after login
 */
export declare function afterLoginHook(userId: string, tenantId: string): Promise<{
    pointsAwarded: number;
    unlockedAchievements: string[];
    tierUpgrade: import("../services/RewardService").RewardTier;
}>;
/**
 * Award points and check achievements after bill payment
 */
export declare function afterBillPaymentHook(req: Request, res: Response, billData: any): Promise<{
    pointsAwarded: number;
    tierUpgrade: import("../services/RewardService").RewardTier;
}>;
/**
 * Award points for referral
 */
export declare function afterReferralSignupHook(referrerId: string, referredUserId: string, tenantId: string): Promise<{
    pointsAwarded: number;
    unlockedAchievements: string[];
    tierUpgrade: import("../services/RewardService").RewardTier;
}>;
/**
 * Update challenge progress after action
 */
export declare function updateChallengeProgress(userId: string, challengeCode: string, tenantId: string, increment?: number): Promise<{
    challengeCode: string;
    progress: number;
    isCompleted: boolean;
}>;
/**
 * Middleware to automatically award points and update challenges after transfer
 */
export declare function rewardsMiddleware(actionType: 'transfer' | 'savings' | 'bill' | 'login'): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rewardsHooks.d.ts.map