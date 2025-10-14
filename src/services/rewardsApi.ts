/**
 * Rewards API Service
 * Client-side API calls for rewards system
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const rewardsApi = {
  /**
   * Get complete rewards data for a user
   */
  async getUserRewards(userId: string) {
    const response = await fetch(`${API_BASE_URL}/rewards/user/${userId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user rewards');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get tier summary for dashboard widget
   */
  async getTierSummary(userId: string) {
    const response = await fetch(`${API_BASE_URL}/rewards/user/${userId}/tier-summary`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tier summary');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get achievement preview for dashboard
   */
  async getAchievementPreview(userId: string) {
    const response = await fetch(`${API_BASE_URL}/rewards/achievements/${userId}/preview`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch achievement preview');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Claim a completed challenge
   */
  async claimChallenge(userId: string, challengeCode: string) {
    const response = await fetch(
      `${API_BASE_URL}/rewards/challenges/${userId}/${challengeCode}/claim`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to claim challenge');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Initialize rewards for a new user
   */
  async initializeRewards(userId: string) {
    const response = await fetch(`${API_BASE_URL}/rewards/user/${userId}/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize rewards');
    }

    const result = await response.json();
    return result.data;
  },
};

export default rewardsApi;
