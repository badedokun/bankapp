-- ============================================================================
-- REWARDS SYSTEM DATABASE SCHEMA
-- Inspired by Nubank's gamification system
-- ============================================================================
-- Created: October 5, 2025
-- Purpose: Implement world-class gamification and rewards system
-- ============================================================================

-- Create rewards schema in tenant database
CREATE SCHEMA IF NOT EXISTS rewards;

-- ============================================================================
-- 1. REWARD TIERS TABLE
-- Define tier levels (Bronze, Silver, Gold, Platinum, Diamond)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.tiers (
    id SERIAL PRIMARY KEY,
    tier_code VARCHAR(20) UNIQUE NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    tier_level INTEGER UNIQUE NOT NULL,
    points_required INTEGER NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(7),
    benefits JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tiers
INSERT INTO rewards.tiers (tier_code, tier_name, tier_level, points_required, icon, color, benefits) VALUES
    ('bronze', 'Bronze', 1, 0, '🥉', '#CD7F32', '{"description": "Welcome tier", "perks": ["Basic rewards", "Standard support"]}'),
    ('silver', 'Silver', 2, 1000, '🥈', '#C0C0C0', '{"description": "Growing tier", "perks": ["2x points on transfers", "Priority support", "Monthly insights"]}'),
    ('gold', 'Gold', 3, 5000, '🥇', '#FFD700', '{"description": "Premium tier", "perks": ["3x points on transfers", "VIP support", "Weekly insights", "Exclusive offers"]}'),
    ('platinum', 'Platinum', 4, 15000, '💎', '#E5E4E2', '{"description": "Elite tier", "perks": ["4x points on transfers", "Dedicated account manager", "Daily insights", "Premium offers", "Early feature access"]}'),
    ('diamond', 'Diamond', 5, 50000, '💍', '#B9F2FF', '{"description": "Ultimate tier", "perks": ["5x points on all actions", "Personal financial advisor", "Real-time insights", "Exclusive events", "Custom rewards"]}')
ON CONFLICT (tier_code) DO NOTHING;

-- ============================================================================
-- 2. USER REWARDS TABLE
-- Track each user's reward points and tier
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.user_rewards (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_tier_id INTEGER REFERENCES rewards.tiers(id),
    points_this_month INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON rewards.user_rewards(user_id);

-- ============================================================================
-- 3. POINT TRANSACTIONS TABLE
-- Log all point earnings and redemptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.point_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'bonus', 'penalty')),
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON rewards.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON rewards.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action_type ON rewards.point_transactions(action_type);

-- ============================================================================
-- 4. ACHIEVEMENTS TABLE
-- Define available achievements
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.achievements (
    id SERIAL PRIMARY KEY,
    achievement_code VARCHAR(50) UNIQUE NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL CHECK (category IN ('savings', 'spending', 'loyalty', 'transactions', 'referral', 'special')),
    icon VARCHAR(10),
    badge_color VARCHAR(7),
    points_reward INTEGER DEFAULT 0,
    unlock_criteria JSONB NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample achievements
INSERT INTO rewards.achievements (achievement_code, achievement_name, description, category, icon, badge_color, points_reward, unlock_criteria) VALUES
    ('first_transfer', 'First Transfer', 'Complete your first money transfer', 'transactions', '💸', '#3B82F6', 50, '{"type": "transfer_count", "count": 1}'),
    ('transfer_master', 'Transfer Master', 'Complete 100 transfers', 'transactions', '🚀', '#8B5CF6', 500, '{"type": "transfer_count", "count": 100}'),
    ('savings_starter', 'Savings Starter', 'Save your first ₦10,000', 'savings', '🌱', '#10B981', 100, '{"type": "savings_amount", "amount": 10000}'),
    ('savings_champion', 'Savings Champion', 'Save ₦100,000 or more', 'savings', '🏆', '#F59E0B', 1000, '{"type": "savings_amount", "amount": 100000}'),
    ('login_streak_7', '7-Day Streak', 'Log in for 7 consecutive days', 'loyalty', '🔥', '#EF4444', 200, '{"type": "login_streak", "days": 7}'),
    ('login_streak_30', '30-Day Streak', 'Log in for 30 consecutive days', 'loyalty', '⭐', '#F59E0B', 1000, '{"type": "login_streak", "days": 30}'),
    ('budget_master', 'Budget Master', 'Stay within budget for 3 consecutive months', 'spending', '🎯', '#6366F1', 500, '{"type": "budget_adherence", "months": 3}'),
    ('early_adopter', 'Early Adopter', 'Join in the first 1000 users', 'special', '🌟', '#EC4899', 1000, '{"type": "user_rank", "max_rank": 1000}'),
    ('referral_champion', 'Referral Champion', 'Refer 5 friends who sign up', 'referral', '👥', '#14B8A6', 2500, '{"type": "referral_count", "count": 5}')
ON CONFLICT (achievement_code) DO NOTHING;

-- ============================================================================
-- 5. USER ACHIEVEMENTS TABLE
-- Track which achievements each user has unlocked
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES rewards.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON rewards.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON rewards.user_achievements(unlocked_at DESC);

-- ============================================================================
-- 6. DAILY CHALLENGES TABLE
-- Define available daily/weekly challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.challenges (
    id SERIAL PRIMARY KEY,
    challenge_code VARCHAR(50) UNIQUE NOT NULL,
    challenge_name VARCHAR(100) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
    category VARCHAR(30) NOT NULL CHECK (category IN ('transactional', 'behavioral', 'educational', 'social')),
    icon VARCHAR(10),
    points_reward INTEGER DEFAULT 0,
    completion_criteria JSONB NOT NULL,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample challenges
INSERT INTO rewards.challenges (challenge_code, challenge_name, description, challenge_type, category, icon, points_reward, completion_criteria, valid_from, valid_until) VALUES
    ('daily_login', 'Daily Login', 'Log in to your account today', 'daily', 'behavioral', '🌅', 10, '{"type": "login", "count": 1}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day'),
    ('make_transfer', 'Make a Transfer', 'Complete at least one transfer today', 'daily', 'transactional', '💰', 25, '{"type": "transfer", "min_count": 1}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day'),
    ('save_money', 'Save Some Money', 'Add money to savings today', 'daily', 'transactional', '🏦', 50, '{"type": "savings_deposit", "min_amount": 1000}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day'),
    ('weekly_spender', 'Weekly Spender', 'Make 5 transactions this week', 'weekly', 'transactional', '🛍️', 100, '{"type": "transaction_count", "min_count": 5}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days'),
    ('learn_finance', 'Financial Literacy', 'Read 3 financial tips in the AI assistant', 'weekly', 'educational', '📚', 150, '{"type": "ai_interaction", "topic": "finance_tips", "count": 3}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days')
ON CONFLICT (challenge_code) DO NOTHING;

-- ============================================================================
-- 7. USER CHALLENGES TABLE
-- Track user progress on challenges
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.user_challenges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES rewards.challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON rewards.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON rewards.user_challenges(status);

-- ============================================================================
-- 8. STREAKS TABLE
-- Track user activity streaks
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.user_streaks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    streak_type VARCHAR(30) NOT NULL CHECK (streak_type IN ('login', 'savings', 'budget', 'transaction')),
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, streak_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON rewards.user_streaks(user_id);

-- ============================================================================
-- 9. REWARD REDEMPTIONS TABLE
-- Track when users redeem points for rewards
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards.redemptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES tenant.users(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON rewards.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON rewards.redemptions(status);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION rewards.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON rewards.tiers FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_user_rewards_updated_at BEFORE UPDATE ON rewards.user_rewards FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON rewards.achievements FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON rewards.challenges FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE ON rewards.user_challenges FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON rewards.user_streaks FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();
CREATE TRIGGER update_redemptions_updated_at BEFORE UPDATE ON rewards.redemptions FOR EACH ROW EXECUTE FUNCTION rewards.update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to award points to a user
CREATE OR REPLACE FUNCTION rewards.award_points(
    p_user_id UUID,
    p_points INTEGER,
    p_action_type VARCHAR(50),
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert point transaction
    INSERT INTO rewards.point_transactions (user_id, points, transaction_type, action_type, description, metadata)
    VALUES (p_user_id, p_points, 'earn', p_action_type, p_description, p_metadata);

    -- Update user rewards
    INSERT INTO rewards.user_rewards (user_id, total_points, points_this_month, lifetime_points, current_tier_id)
    VALUES (p_user_id, p_points, p_points, p_points, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = rewards.user_rewards.total_points + p_points,
        points_this_month = rewards.user_rewards.points_this_month + p_points,
        lifetime_points = rewards.user_rewards.lifetime_points + p_points,
        updated_at = CURRENT_TIMESTAMP;

    -- Check and update tier if necessary
    UPDATE rewards.user_rewards ur
    SET current_tier_id = (
        SELECT id FROM rewards.tiers
        WHERE points_required <= ur.total_points
        ORDER BY tier_level DESC
        LIMIT 1
    )
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION rewards.check_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- This function will be expanded based on specific achievement criteria
    -- For now, it's a placeholder for achievement unlock logic
    RAISE NOTICE 'Achievement check for user: %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (assuming tenant schema permissions)
-- ============================================================================

-- Grant permissions to application role (adjust as needed)
-- GRANT USAGE ON SCHEMA rewards TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rewards TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rewards TO app_user;

-- ============================================================================
-- END OF REWARDS SYSTEM SCHEMA
-- ============================================================================
