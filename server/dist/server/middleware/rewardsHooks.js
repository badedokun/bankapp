"use strict";
/**
 * Rewards Hooks Middleware
 * Automatically triggers reward actions after user events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterTransferHook = afterTransferHook;
exports.afterSavingsDepositHook = afterSavingsDepositHook;
exports.afterLoginHook = afterLoginHook;
exports.afterBillPaymentHook = afterBillPaymentHook;
exports.afterReferralSignupHook = afterReferralSignupHook;
exports.updateChallengeProgress = updateChallengeProgress;
exports.rewardsMiddleware = rewardsMiddleware;
const RewardService_1 = __importDefault(require("../services/RewardService"));
const AchievementDetector_1 = __importDefault(require("../services/AchievementDetector"));
// Helper function to get tenant ID from request
function getTenantId(req) {
    return req.tenant?.id || null;
}
/**
 * Award points and check achievements after transfer
 */
async function afterTransferHook(req, _res, transferData) {
    try {
        const userId = req.user?.id;
        const tenantId = getTenantId(req);
        if (!userId || !tenantId)
            return;
        const rewardService = new RewardService_1.default(tenantId);
        const achievementDetector = new AchievementDetector_1.default(tenantId);
        // Award points for transfer (base: 10 points, tier multiplier applies)
        await rewardService.awardPoints(userId, 10, 'transfer', `Transfer completed: ${transferData.reference}`, { transferId: transferData.id, amount: transferData.amount });
        // Check for achievements
        const unlockedAchievements = await achievementDetector.checkAfterTransfer(userId, transferData);
        // Check for tier upgrade
        const tierUpgrade = await rewardService.checkTierUpgrade(userId);
        // Return rewards info (caller can use this to show modals)
        return {
            pointsAwarded: 10,
            unlockedAchievements,
            tierUpgrade,
        };
    }
    catch (error) {
        console.error('Error in afterTransferHook:', error);
        return null;
    }
}
/**
 * Award points and check achievements after savings deposit
 */
async function afterSavingsDepositHook(req, _res, savingsData) {
    try {
        const userId = req.user?.id;
        const tenantId = getTenantId(req);
        if (!userId || !tenantId)
            return;
        const rewardService = new RewardService_1.default(tenantId);
        const achievementDetector = new AchievementDetector_1.default(tenantId);
        // Award points for savings deposit (base: 25 points, no tier multiplier)
        await rewardService.awardPoints(userId, 25, 'savings_deposit', `Savings deposit: ₦${savingsData.amount}`, { savingsId: savingsData.id, amount: savingsData.amount });
        // Check for achievements
        const unlockedAchievements = await achievementDetector.checkAfterSavingsDeposit(userId, savingsData);
        // Update savings streak
        await rewardService.updateStreak(userId, 'savings');
        // Check for tier upgrade
        const tierUpgrade = await rewardService.checkTierUpgrade(userId);
        return {
            pointsAwarded: 25,
            unlockedAchievements,
            tierUpgrade,
        };
    }
    catch (error) {
        console.error('Error in afterSavingsDepositHook:', error);
        return null;
    }
}
/**
 * Award points and check achievements after login
 */
async function afterLoginHook(userId, tenantId) {
    try {
        const rewardService = new RewardService_1.default(tenantId);
        const achievementDetector = new AchievementDetector_1.default(tenantId);
        // Award points for daily login (base: 5 points, no tier multiplier)
        await rewardService.awardPoints(userId, 5, 'login', 'Daily login bonus');
        // Update login streak
        await rewardService.updateStreak(userId, 'login');
        // Check for achievements
        const unlockedAchievements = await achievementDetector.checkAfterLogin(userId);
        // Check for tier upgrade
        const tierUpgrade = await rewardService.checkTierUpgrade(userId);
        return {
            pointsAwarded: 5,
            unlockedAchievements,
            tierUpgrade,
        };
    }
    catch (error) {
        console.error('Error in afterLoginHook:', error);
        return null;
    }
}
/**
 * Award points and check achievements after bill payment
 */
async function afterBillPaymentHook(req, _res, billData) {
    try {
        const userId = req.user?.id;
        const tenantId = getTenantId(req);
        if (!userId || !tenantId)
            return;
        const rewardService = new RewardService_1.default(tenantId);
        // Award points for bill payment (base: 15 points, tier multiplier applies)
        await rewardService.awardPoints(userId, 15, 'bill_payment', `Bill payment: ${billData.billerName}`, { billId: billData.id, amount: billData.amount });
        // Update transaction streak
        await rewardService.updateStreak(userId, 'transaction');
        // Check for tier upgrade
        const tierUpgrade = await rewardService.checkTierUpgrade(userId);
        return {
            pointsAwarded: 15,
            tierUpgrade,
        };
    }
    catch (error) {
        console.error('Error in afterBillPaymentHook:', error);
        return null;
    }
}
/**
 * Award points for referral
 */
async function afterReferralSignupHook(referrerId, referredUserId, tenantId) {
    try {
        const rewardService = new RewardService_1.default(tenantId);
        const achievementDetector = new AchievementDetector_1.default(tenantId);
        // Award points to referrer (base: 500 points, no tier multiplier)
        await rewardService.awardPoints(referrerId, 500, 'referral', `Friend referred: ${referredUserId}`, { referredUserId });
        // Check for achievements (Referral Champion: 5 referrals)
        const unlockedAchievements = await achievementDetector.checkAchievements(referrerId, 'referral');
        // Check for tier upgrade
        const tierUpgrade = await rewardService.checkTierUpgrade(referrerId);
        return {
            pointsAwarded: 500,
            unlockedAchievements,
            tierUpgrade,
        };
    }
    catch (error) {
        console.error('Error in afterReferralSignupHook:', error);
        return null;
    }
}
/**
 * Update challenge progress after action
 */
async function updateChallengeProgress(userId, challengeCode, tenantId, increment = 1) {
    try {
        const rewardService = new RewardService_1.default(tenantId);
        const challenges = await rewardService.getUserChallenges(userId);
        const challenge = challenges.find((c) => c.code === challengeCode && c.status === 'active');
        if (challenge) {
            const newProgress = (challenge.progress || 0) + increment;
            await rewardService.updateChallengeProgress(userId, challengeCode, newProgress);
            return {
                challengeCode,
                progress: newProgress,
                isCompleted: newProgress >= (challenge.progress || 100),
            };
        }
        return null;
    }
    catch (error) {
        console.error('Error updating challenge progress:', error);
        return null;
    }
}
/**
 * Middleware to automatically award points and update challenges after transfer
 */
function rewardsMiddleware(actionType) {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Only trigger rewards on successful responses
            if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
                // Trigger rewards in background (don't block response)
                setImmediate(async () => {
                    try {
                        let rewardsInfo = null;
                        const tenantId = getTenantId(req);
                        const userId = req.user?.id;
                        if (!tenantId || !userId)
                            return;
                        switch (actionType) {
                            case 'transfer':
                                rewardsInfo = await afterTransferHook(req, res, body.data?.transfer || body.data);
                                // Update daily transfer challenge
                                await updateChallengeProgress(userId, 'make_transfer', tenantId);
                                break;
                            case 'savings':
                                rewardsInfo = await afterSavingsDepositHook(req, res, body.data);
                                // Update daily savings challenge
                                await updateChallengeProgress(userId, 'save_money', tenantId);
                                break;
                            case 'bill':
                                rewardsInfo = await afterBillPaymentHook(req, res, body.data);
                                break;
                            case 'login':
                                rewardsInfo = await afterLoginHook(userId, tenantId);
                                // Update daily login challenge
                                await updateChallengeProgress(userId, 'daily_login', tenantId);
                                break;
                        }
                        if (rewardsInfo) {
                            console.log(`✅ Rewards awarded for ${actionType}:`, rewardsInfo);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing rewards for ${actionType}:`, error);
                    }
                });
            }
            return originalJson(body);
        };
        next();
    };
}
//# sourceMappingURL=rewardsHooks.js.map