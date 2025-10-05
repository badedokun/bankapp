/**
 * Reward Service
 * Manages gamification, points, achievements, and challenges
 * Inspired by Nubank's reward system
 */

import { Pool } from 'pg';
import { getTenantPool } from '../config/database';

// ============================================================================
// Interfaces
// ============================================================================

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

// ============================================================================
// Reward Service Class
// ============================================================================

export class RewardService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async getPool(): Promise<Pool> {
    return getTenantPool(this.tenantId);
  }

  // ==========================================================================
  // User Rewards Management
  // ==========================================================================

  /**
   * Get user's current reward status
   */
  async getUserRewards(userId: string): Promise<UserReward | null> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT
        ur.user_id,
        ur.total_points,
        ur.points_this_month,
        ur.lifetime_points,
        t.id as tier_id,
        t.tier_code,
        t.tier_name,
        t.tier_level,
        t.points_required,
        t.icon,
        t.color,
        t.benefits
      FROM rewards.user_rewards ur
      LEFT JOIN rewards.tiers t ON ur.current_tier_id = t.id
      WHERE ur.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Initialize user rewards
      await this.initializeUserRewards(userId);
      return this.getUserRewards(userId);
    }

    const row = result.rows[0];

    // Get next tier
    const nextTierResult = await pool.query(
      `SELECT * FROM rewards.tiers
       WHERE tier_level > $1
       ORDER BY tier_level ASC
       LIMIT 1`,
      [row.tier_level]
    );

    const currentTier: RewardTier = {
      id: row.tier_id,
      tierCode: row.tier_code,
      tierName: row.tier_name,
      tierLevel: row.tier_level,
      pointsRequired: row.points_required,
      icon: row.icon,
      color: row.color,
      benefits: row.benefits
    };

    const nextTier = nextTierResult.rows[0] ? {
      id: nextTierResult.rows[0].id,
      tierCode: nextTierResult.rows[0].tier_code,
      tierName: nextTierResult.rows[0].tier_name,
      tierLevel: nextTierResult.rows[0].tier_level,
      pointsRequired: nextTierResult.rows[0].points_required,
      icon: nextTierResult.rows[0].icon,
      color: nextTierResult.rows[0].color,
      benefits: nextTierResult.rows[0].benefits
    } : undefined;

    const pointsToNextTier = nextTier
      ? nextTier.pointsRequired - row.total_points
      : 0;

    return {
      userId: row.user_id,
      totalPoints: row.total_points,
      currentTier,
      pointsThisMonth: row.points_this_month,
      lifetimePoints: row.lifetime_points,
      pointsToNextTier,
      nextTier
    };
  }

  /**
   * Initialize rewards for a new user
   */
  async initializeUserRewards(userId: string): Promise<void> {
    const pool = await this.getPool();

    // Get Bronze tier (starting tier)
    const tierResult = await pool.query(
      `SELECT id FROM rewards.tiers WHERE tier_code = 'bronze' LIMIT 1`
    );

    const bronzeTierId = tierResult.rows[0]?.id;

    await pool.query(
      `INSERT INTO rewards.user_rewards (user_id, total_points, current_tier_id, points_this_month, lifetime_points)
       VALUES ($1, 0, $2, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, bronzeTierId]
    );

    // Award welcome bonus
    await this.awardPoints(userId, 100, 'welcome_bonus', 'Welcome to OrokiiPay! Here are your first 100 points! 🎉');
  }

  /**
   * Award points to a user
   */
  async awardPoints(
    userId: string,
    points: number,
    actionType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    const pool = await this.getPool();

    await pool.query(
      `SELECT rewards.award_points($1, $2, $3, $4, $5)`,
      [userId, points, actionType, description, metadata ? JSON.stringify(metadata) : null]
    );

    // Check for tier upgrade
    await this.checkTierUpgrade(userId);
  }

  /**
   * Check and handle tier upgrades
   */
  private async checkTierUpgrade(userId: string): Promise<void> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT
        ur.total_points,
        t_current.tier_level as current_tier_level,
        t_next.id as next_tier_id,
        t_next.tier_name as next_tier_name,
        t_next.tier_level as next_tier_level,
        t_next.points_required as next_tier_points
      FROM rewards.user_rewards ur
      JOIN rewards.tiers t_current ON ur.current_tier_id = t_current.id
      LEFT JOIN rewards.tiers t_next ON t_next.tier_level = t_current.tier_level + 1
      WHERE ur.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return;

    const { total_points, next_tier_id, next_tier_points, next_tier_name } = result.rows[0];

    // Check if user qualifies for next tier
    if (next_tier_id && total_points >= next_tier_points) {
      await pool.query(
        `UPDATE rewards.user_rewards
         SET current_tier_id = $1
         WHERE user_id = $2`,
        [next_tier_id, userId]
      );

      // Award tier upgrade bonus
      const bonusPoints = Math.floor(next_tier_points * 0.1); // 10% bonus
      await this.awardPoints(
        userId,
        bonusPoints,
        'tier_upgrade',
        `Congratulations! You've reached ${next_tier_name} tier! 🎊`,
        { newTier: next_tier_name }
      );
    }
  }

  // ==========================================================================
  // Achievements
  // ==========================================================================

  /**
   * Get all achievements for a user (unlocked and locked)
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT
        a.*,
        ua.unlocked_at,
        ua.points_earned,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as unlocked
      FROM rewards.achievements a
      LEFT JOIN rewards.user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE a.is_active = true
      ORDER BY
        unlocked DESC,
        a.category,
        a.points_reward DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      achievementCode: row.achievement_code,
      achievementName: row.achievement_name,
      description: row.description,
      category: row.category,
      icon: row.icon,
      badgeColor: row.badge_color,
      pointsReward: row.points_reward,
      unlockCriteria: row.unlock_criteria,
      isSecret: row.is_secret,
      unlocked: row.unlocked,
      unlockedAt: row.unlocked_at
    }));
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(userId: string, achievementCode: string): Promise<boolean> {
    const pool = await this.getPool();

    // Get achievement details
    const achievementResult = await pool.query(
      `SELECT * FROM rewards.achievements WHERE achievement_code = $1 AND is_active = true`,
      [achievementCode]
    );

    if (achievementResult.rows.length === 0) return false;

    const achievement = achievementResult.rows[0];

    // Check if already unlocked
    const existingResult = await pool.query(
      `SELECT id FROM rewards.user_achievements WHERE user_id = $1 AND achievement_id = $2`,
      [userId, achievement.id]
    );

    if (existingResult.rows.length > 0) return false; // Already unlocked

    // Unlock achievement
    await pool.query(
      `INSERT INTO rewards.user_achievements (user_id, achievement_id, points_earned)
       VALUES ($1, $2, $3)`,
      [userId, achievement.id, achievement.points_reward]
    );

    // Award points
    await this.awardPoints(
      userId,
      achievement.points_reward,
      'achievement_unlocked',
      `Achievement unlocked: ${achievement.achievement_name}! 🏆`,
      { achievementCode }
    );

    return true;
  }

  // ==========================================================================
  // Challenges
  // ==========================================================================

  /**
   * Get active challenges for a user
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT
        c.*,
        uc.status,
        uc.progress,
        uc.completed_at,
        uc.claimed_at
      FROM rewards.challenges c
      LEFT JOIN rewards.user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
      WHERE c.is_active = true
        AND c.valid_until > CURRENT_TIMESTAMP
      ORDER BY
        c.challenge_type,
        c.valid_until ASC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      challengeCode: row.challenge_code,
      challengeName: row.challenge_name,
      description: row.description,
      challengeType: row.challenge_type,
      category: row.category,
      icon: row.icon,
      pointsReward: row.points_reward,
      completionCriteria: row.completion_criteria,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      progress: row.progress || 0,
      status: row.status || 'active'
    }));
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId: string, challengeCode: string, progress: number): Promise<void> {
    const pool = await this.getPool();

    const challengeResult = await pool.query(
      `SELECT * FROM rewards.challenges WHERE challenge_code = $1`,
      [challengeCode]
    );

    if (challengeResult.rows.length === 0) return;

    const challenge = challengeResult.rows[0];
    const completionTarget = challenge.completion_criteria.min_count || challenge.completion_criteria.count || 1;

    await pool.query(
      `INSERT INTO rewards.user_challenges (user_id, challenge_id, progress, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, challenge_id) DO UPDATE SET
        progress = $3,
        status = CASE WHEN $3 >= $5 THEN 'completed' ELSE 'active' END,
        completed_at = CASE WHEN $3 >= $5 THEN CURRENT_TIMESTAMP ELSE NULL END`,
      [userId, challenge.id, progress, progress >= completionTarget ? 'completed' : 'active', completionTarget]
    );

    // Auto-claim if completed
    if (progress >= completionTarget) {
      await this.claimChallenge(userId, challengeCode);
    }
  }

  /**
   * Claim challenge rewards
   */
  async claimChallenge(userId: string, challengeCode: string): Promise<boolean> {
    const pool = await this.getPool();

    const result = await pool.query(
      `UPDATE rewards.user_challenges uc
       SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP, points_earned = c.points_reward
       FROM rewards.challenges c
       WHERE uc.user_id = $1
         AND c.challenge_code = $2
         AND uc.challenge_id = c.id
         AND uc.status = 'completed'
         AND uc.claimed_at IS NULL
       RETURNING c.points_reward, c.challenge_name`,
      [userId, challengeCode]
    );

    if (result.rows.length === 0) return false;

    const { points_reward, challenge_name } = result.rows[0];

    // Award points
    await this.awardPoints(
      userId,
      points_reward,
      'challenge_completed',
      `Challenge completed: ${challenge_name}! 🎯`,
      { challengeCode }
    );

    return true;
  }

  // ==========================================================================
  // Streaks
  // ==========================================================================

  /**
   * Get user streaks
   */
  async getUserStreaks(userId: string): Promise<Streak[]> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT * FROM rewards.user_streaks WHERE user_id = $1`,
      [userId]
    );

    return result.rows.map(row => ({
      userId: row.user_id,
      streakType: row.streak_type,
      currentCount: row.current_count,
      longestCount: row.longest_count,
      lastActivityDate: row.last_activity_date
    }));
  }

  /**
   * Update streak (e.g., login streak)
   */
  async updateStreak(userId: string, streakType: 'login' | 'savings' | 'budget' | 'transaction'): Promise<void> {
    const pool = await this.getPool();

    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT * FROM rewards.user_streaks WHERE user_id = $1 AND streak_type = $2`,
      [userId, streakType]
    );

    if (result.rows.length === 0) {
      // Create new streak
      await pool.query(
        `INSERT INTO rewards.user_streaks (user_id, streak_type, current_count, longest_count, last_activity_date)
         VALUES ($1, $2, 1, 1, $3)`,
        [userId, streakType, today]
      );

      await this.awardPoints(userId, 5, 'streak_started', `Started ${streakType} streak! 🔥`);
      return;
    }

    const streak = result.rows[0];
    const lastDate = new Date(streak.last_activity_date);
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no update
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      const newCount = streak.current_count + 1;
      const newLongest = Math.max(newCount, streak.longest_count);

      await pool.query(
        `UPDATE rewards.user_streaks
         SET current_count = $1, longest_count = $2, last_activity_date = $3
         WHERE user_id = $4 AND streak_type = $5`,
        [newCount, newLongest, today, userId, streakType]
      );

      // Award streak bonus every 7 days
      if (newCount % 7 === 0) {
        const bonusPoints = newCount * 5;
        await this.awardPoints(userId, bonusPoints, 'streak_milestone', `${newCount}-day ${streakType} streak! Keep it up! 🔥`);
      }
    } else {
      // Streak broken, reset
      await pool.query(
        `UPDATE rewards.user_streaks
         SET current_count = 1, last_activity_date = $1
         WHERE user_id = $2 AND streak_type = $3`,
        [today, userId, streakType]
      );
    }
  }

  // ==========================================================================
  // Point Transactions
  // ==========================================================================

  /**
   * Get point transaction history
   */
  async getPointTransactions(userId: string, limit: number = 50): Promise<PointTransaction[]> {
    const pool = await this.getPool();

    const result = await pool.query(
      `SELECT * FROM rewards.point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      points: row.points,
      transactionType: row.transaction_type,
      actionType: row.action_type,
      description: row.description,
      metadata: row.metadata,
      referenceId: row.reference_id,
      createdAt: row.created_at
    }));
  }
}

export default RewardService;
