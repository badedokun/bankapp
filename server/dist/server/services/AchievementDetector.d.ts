/**
 * Achievement Detector Service
 * Automatically detects and unlocks achievements based on user actions
 */
declare class AchievementDetector {
    private rewardService;
    private tenantId;
    constructor(tenantId: string);
    private getPool;
    /**
     * Check all achievements after a user action
     */
    checkAchievements(userId: string, actionType: string, metadata?: any): Promise<string[]>;
    /**
     * Check if user has completed required number of transfers
     */
    private checkTransferCount;
    /**
     * Check if user has saved required amount
     */
    private checkSavingsAmount;
    /**
     * Check if user has active login streak
     */
    private checkLoginStreak;
    /**
     * Check if user has stayed within budget
     */
    private checkBudgetAdherence;
    /**
     * Check if user is within top N users (early adopter)
     */
    private checkUserRank;
    /**
     * Check if user has referred required number of friends
     */
    private checkReferralCount;
    /**
     * Trigger achievement check after transfer
     */
    checkAfterTransfer(userId: string, transferData: any): Promise<string[]>;
    /**
     * Trigger achievement check after savings deposit
     */
    checkAfterSavingsDeposit(userId: string, savingsData: any): Promise<string[]>;
    /**
     * Trigger achievement check after login
     */
    checkAfterLogin(userId: string): Promise<string[]>;
    /**
     * Trigger achievement check after budget update
     */
    checkAfterBudgetUpdate(userId: string, budgetData: any): Promise<string[]>;
}
export default AchievementDetector;
//# sourceMappingURL=AchievementDetector.d.ts.map