/**
 * Rewards API Routes
 * RESTful endpoints for the gamification and rewards system
 */

import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import RewardService from '../services/RewardService';
import { z } from 'zod';

const router = express.Router();

// Helper function to get tenant ID from request
function getTenantId(req: Request): string | null {
  return (req as any).tenant?.id || null;
}

// Helper function to create RewardService with tenant ID
function createRewardService(req: Request, res: Response): RewardService | null {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Tenant context required',
    });
    return null;
  }
  return new RewardService(tenantId);
}

// ============================================================================
// Validation Schemas
// ============================================================================

const awardPointsSchema = z.object({
  points: z.number().int().min(1).max(10000),
  actionType: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional(),
});

const updateChallengeProgressSchema = z.object({
  progress: z.number().int().min(0),
});

// ============================================================================
// User Rewards Routes
// ============================================================================

/**
 * GET /api/rewards/user/:userId
 * Get complete rewards data for a user
 */
router.get('/user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check: users can only access their own rewards
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own rewards',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;

    // Get all rewards data in parallel
    const [
      userRewards,
      achievements,
      challenges,
      streaks,
      recentTransactions,
    ] = await Promise.all([
      rewardService.getUserRewards(userId),
      rewardService.getUserAchievements(userId),
      rewardService.getUserChallenges(userId),
      rewardService.getUserStreaks(userId),
      rewardService.getPointTransactions(userId, 10),
    ]);

    if (!userRewards) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User rewards not found. Initialize rewards first.',
      });
    }

    return res.json({
      success: true,
      data: {
        userRewards,
        achievements,
        challenges,
        streaks,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user rewards',
    });
  }
});

/**
 * POST /api/rewards/user/:userId/initialize
 * Initialize rewards for a new user
 */
router.post('/user/:userId/initialize', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only initialize your own rewards',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;

    // Check if already initialized
    const existing = await rewardService.getUserRewards(userId);
    if (existing) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User rewards already initialized',
      });
    }

    // Initialize with welcome bonus
    await rewardService.initializeUserRewards(userId);

    // Get initialized rewards
    const userRewards = await rewardService.getUserRewards(userId);

    return res.status(201).json({
      success: true,
      message: 'Rewards initialized with 100 point welcome bonus',
      data: { userRewards },
    });
  } catch (error) {
    console.error('Error initializing user rewards:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize user rewards',
    });
  }
});

/**
 * POST /api/rewards/user/:userId/points
 * Award points to a user for an action
 */
router.post('/user/:userId/points', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Only admins or the system can award points directly
    if (req.user?.role !== 'admin' && req.user?.role !== 'system') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can award points directly',
      });
    }

    // Validate request body
    const validation = awardPointsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { points, actionType, description, metadata } = validation.data;

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;

    // Award points
    await rewardService.awardPoints(userId, points, actionType, description, metadata);

    // Check for tier upgrade
    const tierUpgrade = await rewardService.checkTierUpgrade(userId);

    // Get updated rewards
    const userRewards = await rewardService.getUserRewards(userId);

    return res.json({
      success: true,
      message: `Awarded ${points} points for ${actionType}`,
      data: {
        userRewards,
        tierUpgrade: tierUpgrade || null,
      },
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to award points',
    });
  }
});

/**
 * GET /api/rewards/user/:userId/tier-summary
 * Get quick tier summary for dashboard widget
 */
router.get('/user/:userId/tier-summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own tier summary',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const userRewards = await rewardService.getUserRewards(userId);

    if (!userRewards) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User rewards not found',
      });
    }

    return res.json({
      success: true,
      data: {
        currentTier: userRewards.currentTier,
        totalPoints: userRewards.totalPoints,
        pointsToNextTier: userRewards.pointsToNextTier,
        nextTier: userRewards.nextTier,
      },
    });
  } catch (error) {
    console.error('Error fetching tier summary:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tier summary',
    });
  }
});

// ============================================================================
// Achievement Routes
// ============================================================================

/**
 * GET /api/rewards/achievements/:userId
 * Get all achievements for a user (locked + unlocked)
 */
router.get('/achievements/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own achievements',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const achievements = await rewardService.getUserAchievements(userId);

    return res.json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch achievements',
    });
  }
});

/**
 * POST /api/rewards/achievements/:userId/unlock/:achievementCode
 * Unlock a specific achievement for a user
 */
router.post('/achievements/:userId/unlock/:achievementCode', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, achievementCode } = req.params;

    // Only admins or the system can unlock achievements
    if (req.user?.role !== 'admin' && req.user?.role !== 'system') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can unlock achievements directly',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const unlocked = await rewardService.unlockAchievement(userId, achievementCode);

    if (!unlocked) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Achievement already unlocked or not found',
      });
    }

    // Get achievement details
    const achievements = await rewardService.getUserAchievements(userId);
    const achievement = achievements.find(a => a.code === achievementCode);

    return res.json({
      success: true,
      message: `Achievement unlocked: ${achievement?.name}`,
      data: { achievement },
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unlock achievement',
    });
  }
});

/**
 * GET /api/rewards/achievements/:userId/preview
 * Get top 3 achievements for dashboard preview
 */
router.get('/achievements/:userId/preview', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own achievements',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const achievements = await rewardService.getUserAchievements(userId);

    // Get first 3 achievements (2 unlocked, 1 locked for variety)
    const unlocked = achievements.filter(a => a.unlocked).slice(0, 2);
    const locked = achievements.filter(a => !a.unlocked).slice(0, 1);
    const preview = [...unlocked, ...locked];

    return res.json({
      success: true,
      data: {
        preview,
        unlockedCount: achievements.filter(a => a.unlocked).length,
        totalCount: achievements.length,
      },
    });
  } catch (error) {
    console.error('Error fetching achievement preview:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch achievement preview',
    });
  }
});

// ============================================================================
// Challenge Routes
// ============================================================================

/**
 * GET /api/rewards/challenges/:userId
 * Get all active challenges for a user
 */
router.get('/challenges/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own challenges',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const challenges = await rewardService.getUserChallenges(userId);

    return res.json({
      success: true,
      data: { challenges },
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch challenges',
    });
  }
});

/**
 * POST /api/rewards/challenges/:userId/:challengeCode/progress
 * Update progress for a challenge
 */
router.post('/challenges/:userId/:challengeCode/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, challengeCode } = req.params;

    // Only admins or the system can update challenge progress
    if (req.user?.role !== 'admin' && req.user?.role !== 'system') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the system can update challenge progress',
      });
    }

    // Validate request body
    const validation = updateChallengeProgressSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { progress } = validation.data;

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    await rewardService.updateChallengeProgress(userId, challengeCode, progress);

    // Get updated challenges
    const challenges = await rewardService.getUserChallenges(userId);
    const challenge = challenges.find(c => c.code === challengeCode);

    return res.json({
      success: true,
      message: `Challenge progress updated: ${challenge?.name}`,
      data: { challenge },
    });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update challenge progress',
    });
  }
});

/**
 * POST /api/rewards/challenges/:userId/:challengeCode/claim
 * Claim reward for a completed challenge
 */
router.post('/challenges/:userId/:challengeCode/claim', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, challengeCode } = req.params;

    // Authorization check: users can claim their own challenges
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only claim your own challenges',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const claimed = await rewardService.claimChallenge(userId, challengeCode);

    if (!claimed) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Challenge not completed or already claimed',
      });
    }

    // Get updated challenges and check for tier upgrade
    const [challenges, tierUpgrade] = await Promise.all([
      rewardService.getUserChallenges(userId),
      rewardService.checkTierUpgrade(userId),
    ]);

    const challenge = challenges.find(c => c.code === challengeCode);

    return res.json({
      success: true,
      message: `Challenge claimed: ${challenge?.name}`,
      data: {
        challenge,
        tierUpgrade: tierUpgrade || null,
      },
    });
  } catch (error) {
    console.error('Error claiming challenge:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to claim challenge',
    });
  }
});

// ============================================================================
// Streak Routes
// ============================================================================

/**
 * GET /api/rewards/streaks/:userId
 * Get all streaks for a user
 */
router.get('/streaks/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own streaks',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const streaks = await rewardService.getUserStreaks(userId);

    return res.json({
      success: true,
      data: { streaks },
    });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch streaks',
    });
  }
});

/**
 * POST /api/rewards/streaks/:userId/:streakType/update
 * Update a streak (called by system after user action)
 */
router.post('/streaks/:userId/:streakType/update', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, streakType } = req.params;

    // Only admins or the system can update streaks
    if (req.user?.role !== 'admin' && req.user?.role !== 'system') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the system can update streaks',
      });
    }

    // Validate streak type
    const validTypes = ['login', 'savings', 'budget', 'transaction'];
    if (!validTypes.includes(streakType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid streak type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    await rewardService.updateStreak(userId, streakType as any);

    // Get updated streaks
    const streaks = await rewardService.getUserStreaks(userId);
    const streak = streaks.find(s => s.streakType === streakType);

    return res.json({
      success: true,
      message: `${streakType} streak updated`,
      data: { streak },
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update streak',
    });
  }
});

// ============================================================================
// Point Transaction Routes
// ============================================================================

/**
 * GET /api/rewards/transactions/:userId
 * Get point transaction history for a user
 */
router.get('/transactions/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Authorization check
    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own transaction history',
      });
    }

    const rewardService = createRewardService(req, res);
    if (!rewardService) return;
    const transactions = await rewardService.getPointTransactions(userId, limit);

    return res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Error fetching point transactions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch point transactions',
    });
  }
});

export default router;
