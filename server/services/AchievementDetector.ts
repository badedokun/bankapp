/**
 * Achievement Detector Service
 * Automatically detects and unlocks achievements based on user actions
 */

import RewardService from './RewardService';
import { getTenantPool } from '../config/database';
import { Pool } from 'pg';

interface AchievementCriteria {
  type: string;
  count?: number;
  amount?: number;
  days?: number;
  months?: number;
  maxRank?: number;
}

class AchievementDetector {
  private rewardService: RewardService;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.rewardService = new RewardService(tenantId);
  }

  private async getPool(): Promise<Pool> {
    return getTenantPool(this.tenantId);
  }

  /**
   * Check all achievements after a user action
   */
  async checkAchievements(userId: string, actionType: string, metadata?: any): Promise<string[]> {
    const unlockedAchievements: string[] = [];

    try {
      // Get all achievements for this user
      const achievements = await this.rewardService.getUserAchievements(userId);
      const lockedAchievements = achievements.filter(a => !a.unlocked);

      // Check each locked achievement
      for (const achievement of lockedAchievements) {
        const criteria = achievement.unlockCriteria as AchievementCriteria;
        let shouldUnlock = false;

        // Check based on criteria type
        switch (criteria.type) {
          case 'transfer_count':
            shouldUnlock = await this.checkTransferCount(userId, criteria.count || 1);
            break;

          case 'savings_amount':
            shouldUnlock = await this.checkSavingsAmount(userId, criteria.amount || 0);
            break;

          case 'login_streak':
            shouldUnlock = await this.checkLoginStreak(userId, criteria.days || 1);
            break;

          case 'budget_adherence':
            shouldUnlock = await this.checkBudgetAdherence(userId, criteria.months || 1);
            break;

          case 'user_rank':
            shouldUnlock = await this.checkUserRank(userId, criteria.maxRank || 1000);
            break;

          case 'referral_count':
            shouldUnlock = await this.checkReferralCount(userId, criteria.count || 1);
            break;

          default:
            console.warn(`Unknown achievement criteria type: ${criteria.type}`);
        }

        // If criteria met, unlock achievement
        if (shouldUnlock) {
          const unlocked = await this.rewardService.unlockAchievement(userId, achievement.code);
          if (unlocked) {
            unlockedAchievements.push(achievement.code);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Check if user has completed required number of transfers
   */
  private async checkTransferCount(userId: string, requiredCount: number): Promise<boolean> {
    try {
      const pool = await this.getPool();
    const result = await pool.query(
        'SELECT COUNT(*) as count FROM tenant.transfers WHERE user_id = $1 AND status = $2',
        [userId, 'completed']
      );

      const count = parseInt(result.rows[0]?.count || '0');
      return count >= requiredCount;
    } catch (error) {
      console.error('Error checking transfer count:', error);
      return false;
    }
  }

  /**
   * Check if user has saved required amount
   */
  private async checkSavingsAmount(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      // Get total savings balance
      const pool = await this.getPool();
    const result = await pool.query(
        `SELECT COALESCE(SUM(balance), 0) as total_savings
         FROM tenant.savings_accounts
         WHERE user_id = $1 AND status = $2`,
        [userId, 'active']
      );

      const totalSavings = parseFloat(result.rows[0]?.total_savings || '0');
      return totalSavings >= requiredAmount;
    } catch (error) {
      console.error('Error checking savings amount:', error);
      return false;
    }
  }

  /**
   * Check if user has active login streak
   */
  private async checkLoginStreak(userId: string, requiredDays: number): Promise<boolean> {
    try {
      const pool = await this.getPool();
    const result = await pool.query(
        `SELECT current_count
         FROM rewards.user_streaks
         WHERE user_id = $1 AND streak_type = $2`,
        [userId, 'login']
      );

      const currentCount = parseInt(result.rows[0]?.current_count || '0');
      return currentCount >= requiredDays;
    } catch (error) {
      console.error('Error checking login streak:', error);
      return false;
    }
  }

  /**
   * Check if user has stayed within budget
   */
  private async checkBudgetAdherence(userId: string, requiredMonths: number): Promise<boolean> {
    try {
      const pool = await this.getPool();
    const result = await pool.query(
        `SELECT current_count
         FROM rewards.user_streaks
         WHERE user_id = $1 AND streak_type = $2`,
        [userId, 'budget']
      );

      const currentCount = parseInt(result.rows[0]?.current_count || '0');
      return currentCount >= requiredMonths;
    } catch (error) {
      console.error('Error checking budget adherence:', error);
      return false;
    }
  }

  /**
   * Check if user is within top N users (early adopter)
   */
  private async checkUserRank(userId: string, maxRank: number): Promise<boolean> {
    try {
      const pool = await this.getPool();
    const result = await pool.query(
        `SELECT COUNT(*) as user_rank
         FROM tenant.users
         WHERE created_at < (SELECT created_at FROM tenant.users WHERE id = $1)`,
        [userId]
      );

      const userRank = parseInt(result.rows[0]?.user_rank || '0') + 1; // +1 because rank is 1-indexed
      return userRank <= maxRank;
    } catch (error) {
      console.error('Error checking user rank:', error);
      return false;
    }
  }

  /**
   * Check if user has referred required number of friends
   */
  private async checkReferralCount(userId: string, requiredCount: number): Promise<boolean> {
    try {
      // Assuming referrals table exists
      const pool = await this.getPool();
    const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM tenant.referrals
         WHERE referrer_id = $1 AND status = $2`,
        [userId, 'completed']
      );

      const count = parseInt(result.rows[0]?.count || '0');
      return count >= requiredCount;
    } catch (error) {
      console.error('Error checking referral count:', error);
      return false;
    }
  }

  /**
   * Trigger achievement check after transfer
   */
  async checkAfterTransfer(userId: string, transferData: any): Promise<string[]> {
    return this.checkAchievements(userId, 'transfer', transferData);
  }

  /**
   * Trigger achievement check after savings deposit
   */
  async checkAfterSavingsDeposit(userId: string, savingsData: any): Promise<string[]> {
    return this.checkAchievements(userId, 'savings', savingsData);
  }

  /**
   * Trigger achievement check after login
   */
  async checkAfterLogin(userId: string): Promise<string[]> {
    return this.checkAchievements(userId, 'login');
  }

  /**
   * Trigger achievement check after budget update
   */
  async checkAfterBudgetUpdate(userId: string, budgetData: any): Promise<string[]> {
    return this.checkAchievements(userId, 'budget', budgetData);
  }
}

export default AchievementDetector;
