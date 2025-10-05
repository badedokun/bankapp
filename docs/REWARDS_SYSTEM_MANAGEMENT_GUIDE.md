# 🎮 Rewards System Management Guide

**Version**: 1.0
**Last Updated**: October 5, 2025
**Platform**: OrokiiPay Multi-Tenant Banking Platform

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Tier Progression System](#tier-progression-system)
3. [Point Earning Mechanics](#point-earning-mechanics)
4. [Achievement System](#achievement-system)
5. [Challenge System](#challenge-system)
6. [Streak Tracking](#streak-tracking)
7. [Tenant Configuration](#tenant-configuration)
8. [Admin Dashboard](#admin-dashboard)
9. [API Management](#api-management)
10. [Reporting & Analytics](#reporting--analytics)

---

## 🎯 System Overview

### **What is the Rewards System?**

The OrokiiPay Rewards System is a comprehensive gamification platform designed to increase user engagement, encourage positive financial behaviors, and build customer loyalty through a tier-based progression system inspired by world-class fintech leaders like Nubank.

### **Core Components**:

1. **Tier System** - 5-level progression (Bronze → Silver → Gold → Platinum → Diamond)
2. **Points System** - Earn points through transactions, savings, and engagement
3. **Achievements** - Unlock badges for milestones (9 pre-configured)
4. **Challenges** - Daily, weekly, and monthly tasks (5 pre-configured)
5. **Streaks** - Track consecutive activity (login, savings, budget, transactions)
6. **Redemptions** - Exchange points for rewards (future feature)

### **Database Architecture**:

```
rewards schema (tenant-level)
├── tiers (5 levels)
├── user_rewards (user progress tracking)
├── point_transactions (full audit trail)
├── achievements (milestone definitions)
├── user_achievements (unlock tracking)
├── challenges (task definitions)
├── user_challenges (progress tracking)
├── user_streaks (consecutive activity)
└── redemptions (reward claims)
```

---

## 🏆 Tier Progression System

### **Tier Levels & Requirements**

The tier system has **5 progressive levels**, each with increasing point requirements and enhanced benefits:

| Tier | Icon | Level | Points Required | Multiplier | Status |
|------|------|-------|-----------------|------------|--------|
| **Bronze** | 🥉 | 1 | 0 | 1x | Default tier for all new users |
| **Silver** | 🥈 | 2 | 1,000 | 2x | First milestone tier |
| **Gold** | 🥇 | 3 | 5,000 | 3x | Premium tier |
| **Platinum** | 💎 | 4 | 15,000 | 4x | Elite tier |
| **Diamond** | 💍 | 5 | 50,000 | 5x | Ultimate tier |

### **How Tier Promotion Works**

#### **Automatic Tier Upgrades**:

Tier promotions happen **automatically** when a user's total points reach the threshold:

```sql
-- Automatic tier upgrade function (in database)
UPDATE rewards.user_rewards ur
SET current_tier_id = (
    SELECT id FROM rewards.tiers
    WHERE points_required <= ur.total_points
    ORDER BY tier_level DESC
    LIMIT 1
)
WHERE ur.user_id = p_user_id;
```

**Example Flow**:
1. User has 950 points (Bronze tier)
2. User completes transfer → +60 points = 1,010 total
3. System detects threshold crossed (1,000 points)
4. **Automatic upgrade to Silver tier**
5. **Bonus**: 10% of tier threshold = +100 bonus points
6. New total: 1,110 points
7. Celebration modal appears with confetti 🎉

#### **Tier Upgrade Bonuses**:

When a user crosses a tier threshold, they receive a **bonus**:

| Tier Reached | Bonus Points | Calculation |
|--------------|--------------|-------------|
| Silver (1,000) | +100 | 10% of 1,000 |
| Gold (5,000) | +500 | 10% of 5,000 |
| Platinum (15,000) | +1,500 | 10% of 15,000 |
| Diamond (50,000) | +5,000 | 10% of 50,000 |

**Formula**: `bonus = tier_threshold * 0.10`

#### **Tier Benefits & Perks**:

Each tier unlocks progressive benefits:

**🥉 Bronze (Default)**:
- Basic rewards
- Standard support
- 1x points on all actions

**🥈 Silver (1,000 pts)**:
- 2x points on transfers
- Priority support
- Monthly financial insights
- Access to basic challenges

**🥇 Gold (5,000 pts)**:
- 3x points on transfers
- VIP customer support
- Weekly financial insights
- Exclusive promotional offers
- Early access to new features

**💎 Platinum (15,000 pts)**:
- 4x points on transfers
- Dedicated account manager
- Daily financial insights
- Premium promotional offers
- Early feature access
- Platinum-only challenges

**💍 Diamond (50,000 pts)**:
- 5x points on all actions (not just transfers!)
- Personal financial advisor
- Real-time financial insights
- Exclusive VIP events
- Custom reward options
- Diamond-only perks

### **Tier Demotion Policy**

**Current Implementation**: No tier demotion

Users **keep their tier permanently** once achieved. This encourages:
- Positive user sentiment
- Long-term loyalty
- Reduced churn
- Aspirational progression

**Future Option**: Configurable demotion (tenant setting)
- Monthly activity minimum
- Points expiration policy
- Tier maintenance requirements

---

## 💰 Point Earning Mechanics

### **Point Earning Actions**

Users earn points through various activities:

| Action | Base Points | Tier Multiplier | Example (Gold 3x) |
|--------|-------------|-----------------|-------------------|
| Daily Login | 5 | No | 5 points |
| Transfer (any) | 10 | **Yes** | 30 points |
| Savings Deposit | 25 | No | 25 points |
| Bill Payment | 15 | **Yes** | 45 points |
| Referral Sign-up | 500 | No | 500 points |
| Achievement Unlock | 50-2,500 | No | Varies |
| Challenge Completion | 10-150 | No | Varies |
| Streak Milestone | 5-150 | No | Varies |

### **Point Calculation Formula**

```typescript
// Standard action
basePoints = action.basePoints;
multiplier = action.usesTierMultiplier ? user.tier.multiplier : 1;
finalPoints = basePoints * multiplier;

// Example: Gold user (3x) makes a transfer
finalPoints = 10 * 3 = 30 points
```

### **Point Transaction Logging**

Every point change is logged for **full audit trail**:

```sql
INSERT INTO rewards.point_transactions (
  user_id,
  points,
  transaction_type,  -- 'earn', 'redeem', 'expire', 'bonus', 'penalty'
  action_type,       -- 'transfer', 'savings', 'achievement', etc.
  description,
  metadata,
  reference_id
) VALUES (...);
```

**Transaction Types**:
- **earn**: Points awarded for actions
- **redeem**: Points spent on rewards
- **expire**: Points removed due to expiration
- **bonus**: Bonus points (tier upgrade, special promotions)
- **penalty**: Points deducted (e.g., chargebacks, violations)

### **Monthly Points Reset**

The `points_this_month` field tracks current month activity:

```sql
-- Reset monthly points (scheduled job - 1st of each month)
UPDATE rewards.user_rewards
SET points_this_month = 0
WHERE DATE_PART('day', CURRENT_DATE) = 1;
```

**Use Cases**:
- Monthly leaderboards
- Tier qualification periods
- Activity-based challenges
- Engagement metrics

---

## 🏅 Achievement System

### **Achievement Categories**

Achievements are organized into **6 categories**:

1. **Savings** 🌱💰
   - Savings Starter (₦10,000)
   - Savings Champion (₦100,000)

2. **Spending** 🎯
   - Budget Master (3 months within budget)

3. **Loyalty** 🔥⭐
   - 7-Day Streak
   - 30-Day Streak

4. **Transactions** 💸🚀
   - First Transfer
   - Transfer Master (100 transfers)

5. **Referral** 👥
   - Referral Champion (5 friends)

6. **Special** 🌟
   - Early Adopter (first 1000 users)

### **Achievement Structure**

```typescript
interface Achievement {
  code: string;              // 'first_transfer'
  name: string;              // 'First Transfer'
  description: string;       // 'Complete your first money transfer'
  category: string;          // 'transactions'
  icon: string;              // '💸'
  badgeColor: string;        // '#3B82F6'
  pointsReward: number;      // 50
  unlockCriteria: {
    type: string;            // 'transfer_count'
    count?: number;          // 1
    amount?: number;         // (for savings)
    days?: number;           // (for streaks)
  };
  isSecret: boolean;         // Hide until unlocked
  isActive: boolean;         // Can be unlocked
}
```

### **Achievement Unlocking Process**

**Manual Trigger** (current implementation):
```typescript
// After user completes action
const unlocked = await RewardService.unlockAchievement(userId, 'first_transfer');

if (unlocked) {
  // Show celebration modal
  showAchievementUnlockModal(achievement);

  // Award points
  await RewardService.awardPoints(
    userId,
    achievement.pointsReward,
    'achievement',
    `Unlocked: ${achievement.name}`
  );
}
```

**Automatic Trigger** (future enhancement):
```typescript
// Database function checks criteria automatically
rewards.check_achievements(user_id)

// Called after each action:
- After transfer completion
- After savings deposit
- After daily login
- After budget update
```

### **Secret Achievements**

Achievements with `isSecret: true` show as "???" until unlocked:

```typescript
// Display logic
if (achievement.isSecret && !achievement.unlocked) {
  display: "??? Secret achievement - unlock to reveal"
} else {
  display: achievement.description
}
```

---

## 🎯 Challenge System

### **Challenge Types**

Challenges are time-bound tasks with **4 types**:

1. **Daily** 🌅 - Refreshes every 24 hours
2. **Weekly** 🛍️ - Refreshes every 7 days
3. **Monthly** 📅 - Refreshes every 30 days
4. **Special** ✨ - Limited-time events

### **Pre-Configured Challenges**

| Code | Name | Type | Category | Points | Criteria |
|------|------|------|----------|--------|----------|
| `daily_login` | Daily Login | Daily | Behavioral | 10 | Log in today |
| `make_transfer` | Make a Transfer | Daily | Transactional | 25 | 1+ transfer today |
| `save_money` | Save Some Money | Daily | Transactional | 50 | Deposit ₦1,000+ |
| `weekly_spender` | Weekly Spender | Weekly | Transactional | 100 | 5+ transactions this week |
| `learn_finance` | Financial Literacy | Weekly | Educational | 150 | Read 3 finance tips in AI chat |

### **Challenge Lifecycle**

```
┌─────────────┐
│   CREATED   │ (Challenge defined in database)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ (User starts challenge)
└──────┬──────┘
       │ (User makes progress)
       ▼
┌─────────────┐
│  COMPLETED  │ (Criteria met)
└──────┬──────┘
       │ (User claims reward)
       ▼
┌─────────────┐
│   CLAIMED   │ (Points awarded)
└─────────────┘

Alternative paths:
- ACTIVE → EXPIRED (validUntil passed)
```

### **Challenge Progress Tracking**

```sql
-- User challenge progress
INSERT INTO rewards.user_challenges (
  user_id,
  challenge_id,
  status,           -- 'active', 'completed', 'expired', 'claimed'
  progress,         -- Current count (e.g., 3/5 transactions)
  completed_at,     -- Timestamp when criteria met
  claimed_at,       -- Timestamp when reward claimed
  points_earned
) VALUES (...);
```

### **Challenge Completion Flow**

```typescript
// 1. Update progress
await RewardService.updateChallengeProgress(userId, 'make_transfer', 1);

// 2. Check if completed
const challenge = await getUserChallenge(userId, 'make_transfer');
if (challenge.progress >= challenge.maxProgress) {
  challenge.status = 'completed';
  challenge.completedAt = new Date();
}

// 3. User claims reward
await RewardService.claimChallenge(userId, 'make_transfer');
// → Awards points
// → Changes status to 'claimed'
// → Shows confetti animation
```

---

## 🔥 Streak Tracking

### **Streak Types**

The system tracks **4 types of consecutive activity**:

1. **Login Streak** 🔥
   - Consecutive days logging in
   - Resets if user misses a day
   - Milestone bonuses every 7 days

2. **Savings Streak** 💰
   - Consecutive days adding to savings
   - Encourages regular saving habits
   - Higher bonuses for longer streaks

3. **Budget Streak** 🎯
   - Consecutive months staying within budget
   - Promotes financial discipline
   - Monthly bonuses

4. **Transaction Streak** ⚡
   - Consecutive days with at least one transaction
   - Measures active usage
   - Daily bonuses

### **Streak Mechanics**

```typescript
interface Streak {
  streakType: 'login' | 'savings' | 'budget' | 'transaction';
  currentCount: number;     // Current streak length
  longestCount: number;     // Personal best
  lastActivityDate: Date;   // Last activity timestamp
}
```

### **Streak Update Logic**

```typescript
// When user performs action
await RewardService.updateStreak(userId, 'login');

// Internal logic:
1. Check last activity date
2. If yesterday → increment current count
3. If today → no change (already counted)
4. If >1 day ago → reset to 1
5. If new personal best → update longest count
6. Award milestone bonus every 7 days
```

### **Streak Milestone Bonuses**

```typescript
// Every 7 days, award bonus points
if (currentCount % 7 === 0 && currentCount > 0) {
  bonusPoints = currentCount * 5;

  // Examples:
  // 7 days = 35 points
  // 14 days = 70 points
  // 30 days = 150 points

  await awardPoints(userId, bonusPoints, 'streak_milestone',
    `${currentCount}-day ${streakType} streak!`);
}
```

### **Streak Break Handling**

```typescript
// If user breaks streak
if (daysSinceLastActivity > 1) {
  streak.currentCount = 1;  // Start fresh
  // longestCount is preserved (personal best)

  // Optional: Send "We miss you" notification
  sendNotification(userId, 'Your streak was broken! Start a new one today.');
}
```

---

## ⚙️ Tenant Configuration

### **Is the Rewards System Configurable by Tenants?**

**Answer**: **Partially configurable** (current) → **Fully configurable** (future roadmap)

### **Current Configuration Level**

**Fixed (Platform-Level)**:
- ✅ Tier names (Bronze, Silver, Gold, Platinum, Diamond)
- ✅ Tier icons (🥉🥈🥇💎💍)
- ✅ Number of tiers (5 levels)
- ✅ Database schema structure

**Configurable (Tenant-Level)**:
- ⚠️ **Tier point thresholds** - Can be modified per tenant
- ⚠️ **Tier benefits** - Stored as JSONB, customizable
- ⚠️ **Tier multipliers** - Can be adjusted
- ⚠️ **Achievement criteria** - Stored as JSONB, customizable
- ⚠️ **Challenge definitions** - Can be created/modified
- ⚠️ **Point earning rates** - Configurable per action type

### **Tenant-Specific Tier Configuration**

**Database Structure** (allows tenant customization):

```sql
-- Tier configuration (per tenant database)
CREATE TABLE rewards.tiers (
  id SERIAL PRIMARY KEY,
  tier_code VARCHAR(20),
  tier_name VARCHAR(50),       -- Customizable
  tier_level INTEGER,
  points_required INTEGER,     -- Customizable per tenant
  icon VARCHAR(10),
  color VARCHAR(7),
  benefits JSONB,              -- Fully customizable
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Tenant Customization**:

```sql
-- Tenant A: Conservative thresholds
UPDATE rewards.tiers SET
  points_required = 500 WHERE tier_code = 'silver',   -- Lower barrier
  points_required = 2500 WHERE tier_code = 'gold',
  points_required = 10000 WHERE tier_code = 'platinum',
  points_required = 40000 WHERE tier_code = 'diamond';

-- Tenant B: Generous thresholds
UPDATE rewards.tiers SET
  points_required = 2000 WHERE tier_code = 'silver',  -- Higher barrier
  points_required = 10000 WHERE tier_code = 'gold',
  points_required = 30000 WHERE tier_code = 'platinum',
  points_required = 100000 WHERE tier_code = 'diamond';
```

**Custom Benefits per Tenant**:

```sql
-- Tenant A: Focus on customer service
UPDATE rewards.tiers SET benefits = '{
  "description": "Premium tier",
  "perks": [
    "3x points on transfers",
    "24/7 VIP phone support",
    "Dedicated relationship manager",
    "Free wire transfers",
    "Exclusive event invitations"
  ]
}'::JSONB WHERE tier_code = 'gold';

-- Tenant B: Focus on financial products
UPDATE rewards.tiers SET benefits = '{
  "description": "Premium tier",
  "perks": [
    "3x points on transfers",
    "Reduced loan interest rates (0.5% off)",
    "Higher savings account APY (+0.25%)",
    "No account maintenance fees",
    "Priority loan approval"
  ]
}'::JSONB WHERE tier_code = 'gold';
```

### **Tenant Configuration API**

**Planned Endpoints** (future):

```typescript
// Get tenant rewards configuration
GET /api/admin/rewards/config

// Update tier thresholds
PUT /api/admin/rewards/tiers/:tierCode
{
  pointsRequired: 3000,
  benefits: {
    description: "...",
    perks: [...]
  }
}

// Update point earning rates
PUT /api/admin/rewards/point-rates
{
  transfer: 15,           // Base points per transfer
  savings_deposit: 30,    // Base points per savings
  ...
}

// Create custom achievement
POST /api/admin/rewards/achievements
{
  code: 'large_transfer',
  name: 'Big Spender',
  description: 'Complete a transfer over ₦1,000,000',
  category: 'transactions',
  pointsReward: 500,
  unlockCriteria: {
    type: 'transfer_amount',
    minAmount: 1000000
  }
}
```

### **Configuration UI** (Future Admin Dashboard)

**Tenant Admin Panel** → **Rewards Settings**:

```
┌─────────────────────────────────────────────────┐
│ Rewards System Configuration                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ [Tier Thresholds]                               │
│  🥉 Bronze:    0 points                         │
│  🥈 Silver:    [1,000] points    [Save]         │
│  🥇 Gold:      [5,000] points    [Save]         │
│  💎 Platinum:  [15,000] points   [Save]         │
│  💍 Diamond:   [50,000] points   [Save]         │
│                                                  │
│ [Point Earning Rates]                           │
│  Transfer:           [10] points  [2x] tier     │
│  Savings Deposit:    [25] points  [ ] tier      │
│  Bill Payment:       [15] points  [2x] tier     │
│  Referral:          [500] points  [ ] tier      │
│                                                  │
│ [Advanced Settings]                             │
│  ☑ Auto tier upgrades                           │
│  ☑ Tier upgrade bonuses (10%)                   │
│  ☐ Tier demotion enabled                        │
│  ☐ Points expiration (after 12 months)          │
│                                                  │
│              [Save All Changes]                  │
└─────────────────────────────────────────────────┘
```

---

## 📊 Admin Dashboard

### **Does the System Have an Admin Dashboard?**

**Current Status**: ❌ **Not yet implemented** (database + service layer only)

**Planned Features** (Roadmap):

### **Admin Dashboard Modules**

#### **1. Overview Dashboard**

```
┌────────────────────────────────────────────────────────────┐
│ Rewards System Overview                                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Total Users:        10,523                                 │
│ Total Points Earned: 15,234,891                            │
│ Total Achievements: 8,472 unlocks                          │
│                                                             │
│ ┌─────────────────┬──────────┬────────┬──────────┐        │
│ │ Tier            │ Users    │ %      │ Avg Pts  │        │
│ ├─────────────────┼──────────┼────────┼──────────┤        │
│ │ 🥉 Bronze       │ 6,234    │ 59.2%  │ 342      │        │
│ │ 🥈 Silver       │ 2,891    │ 27.5%  │ 2,145    │        │
│ │ 🥇 Gold         │ 1,123    │ 10.7%  │ 7,892    │        │
│ │ 💎 Platinum     │ 234      │ 2.2%   │ 19,234   │        │
│ │ 💍 Diamond      │ 41       │ 0.4%   │ 67,123   │        │
│ └─────────────────┴──────────┴────────┴──────────┘        │
│                                                             │
│ [View Detailed Analytics] [Export Report]                  │
└────────────────────────────────────────────────────────────┘
```

#### **2. User Management**

```
┌────────────────────────────────────────────────────────────┐
│ User Rewards Management                        [Search...]  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┬──────┬────────┬─────────┬──────────────┐ │
│ │ User         │ Tier │ Points │ Achieve │ Actions      │ │
│ ├──────────────┼──────┼────────┼─────────┼──────────────┤ │
│ │ John Doe     │ 🥇   │ 7,245  │ 5/9     │ [View][Edit] │ │
│ │ Jane Smith   │ 🥈   │ 2,134  │ 3/9     │ [View][Edit] │ │
│ │ Bob Johnson  │ 💎   │ 18,923 │ 8/9     │ [View][Edit] │ │
│ └──────────────┴──────┴────────┴─────────┴──────────────┘ │
│                                                             │
│ Bulk Actions: [Award Bonus Points] [Reset Monthly Points]  │
└────────────────────────────────────────────────────────────┘
```

#### **3. Achievement Management**

```
┌────────────────────────────────────────────────────────────┐
│ Achievement Management                 [+ Create New]       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 💸 First Transfer                                     │  │
│ │ Complete your first money transfer                    │  │
│ │ Category: Transactions | Points: 50 | Unlocks: 8,234 │  │
│ │ [Edit] [Deactivate] [View Analytics]                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🌱 Savings Starter                                    │  │
│ │ Save your first ₦10,000                               │  │
│ │ Category: Savings | Points: 100 | Unlocks: 6,123     │  │
│ │ [Edit] [Deactivate] [View Analytics]                 │  │
│ └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### **4. Challenge Management**

```
┌────────────────────────────────────────────────────────────┐
│ Challenge Management                   [+ Create New]       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Challenges:                                          │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🌅 Daily Login (Daily)                                │  │
│ │ Log in to your account today                          │  │
│ │ Points: 10 | Active Users: 7,234 | Completion: 68%   │  │
│ │ Valid: Oct 5, 2025 00:00 - Oct 5, 2025 23:59         │  │
│ │ [Edit] [Pause] [View Stats]                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Completed Challenges (Last 7 Days): 24,891                  │
│ Total Points Awarded: 428,762                               │
└────────────────────────────────────────────────────────────┘
```

#### **5. Point Transaction Log**

```
┌────────────────────────────────────────────────────────────┐
│ Point Transaction History              [Filter ▼] [Export] │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────┬──────────┬────────┬─────────┬────────┬─────────┐ │
│ │ Date │ User     │ Points │ Type    │ Action │ Ref     │ │
│ ├──────┼──────────┼────────┼─────────┼────────┼─────────┤ │
│ │ 10/5 │ John D.  │ +30    │ Earn    │Transfer│ TX12345 │ │
│ │ 10/5 │ Jane S.  │ +50    │ Earn    │Achieve │ first_t │ │
│ │ 10/5 │ Bob J.   │ +100   │ Bonus   │Tier Up │ SILVER  │ │
│ │ 10/4 │ Mary K.  │ +25    │ Earn    │Savings │ SV78901 │ │
│ └──────┴──────────┴────────┴─────────┴────────┴─────────┘ │
│                                                             │
│ Total Points Awarded Today: 12,345                          │
└────────────────────────────────────────────────────────────┘
```

#### **6. Analytics & Insights**

```
┌────────────────────────────────────────────────────────────┐
│ Rewards Analytics                      [Date: Last 30 Days]│
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Engagement Metrics:                                         │
│  ├─ Daily Active Users (Rewards): 3,245 (+15.2% vs last)  │
│  ├─ Avg Points Per User: 145 points/day                   │
│  ├─ Achievement Unlock Rate: 2.3/user/month               │
│  └─ Challenge Completion Rate: 72%                        │
│                                                             │
│ Top Performing Achievements:                                │
│  1. First Transfer (8,234 unlocks)                        │
│  2. Savings Starter (6,123 unlocks)                       │
│  3. 7-Day Streak (4,891 unlocks)                          │
│                                                             │
│ Point Sources:                                              │
│  [Chart: Pie chart showing distribution]                   │
│  - Transfers: 45%                                           │
│  - Achievements: 25%                                        │
│  - Challenges: 18%                                          │
│  - Streaks: 12%                                             │
│                                                             │
│ [View Full Report] [Schedule Email Report]                  │
└────────────────────────────────────────────────────────────┘
```

### **Admin Dashboard API Endpoints**

```typescript
// Dashboard overview
GET /api/admin/rewards/overview
Response: {
  totalUsers: number,
  totalPoints: number,
  tierDistribution: TierStats[],
  topEarners: User[]
}

// User search
GET /api/admin/rewards/users?search=john&tier=gold
Response: { users: UserReward[] }

// User details
GET /api/admin/rewards/users/:userId
Response: { user, points, achievements, challenges, streaks }

// Award bonus points
POST /api/admin/rewards/users/:userId/bonus
Body: { points: 100, reason: "Customer appreciation" }

// Analytics
GET /api/admin/rewards/analytics?from=2025-01-01&to=2025-10-05
Response: { engagement, topAchievements, pointSources }

// Export report
GET /api/admin/rewards/export?format=csv&from=...&to=...
Response: CSV file download
```

---

## 🔌 API Management

### **RewardService Methods**

The backend service provides comprehensive API methods:

#### **User Rewards Management**:

```typescript
// Get user's complete rewards status
async getUserRewards(userId: string): Promise<UserReward | null>

// Initialize new user with welcome bonus
async initializeUserRewards(userId: string): Promise<void>
// → Awards 100 points welcome bonus
// → Assigns Bronze tier
// → Creates initial records

// Award points for actions
async awardPoints(
  userId: string,
  points: number,
  actionType: string,
  description: string,
  metadata?: any
): Promise<void>
// → Creates point transaction
// → Updates user totals
// → Checks tier upgrade
// → Returns upgrade info

// Check and upgrade tier
async checkTierUpgrade(userId: string): Promise<TierUpgrade | null>
// → Compares points to thresholds
// → Upgrades if threshold crossed
// → Awards bonus points (10%)
// → Returns old/new tier info
```

#### **Achievement Management**:

```typescript
// Get all achievements (locked + unlocked)
async getUserAchievements(userId: string): Promise<Achievement[]>

// Unlock specific achievement
async unlockAchievement(
  userId: string,
  achievementCode: string
): Promise<boolean>
// → Checks if already unlocked
// → Creates unlock record
// → Awards achievement points
// → Returns success/failure
```

#### **Challenge Management**:

```typescript
// Get user's active challenges
async getUserChallenges(userId: string): Promise<Challenge[]>

// Update challenge progress
async updateChallengeProgress(
  userId: string,
  challengeCode: string,
  progress: number
): Promise<void>
// → Updates progress count
// → Marks complete if criteria met
// → Does NOT auto-claim points

// Claim challenge reward
async claimChallenge(
  userId: string,
  challengeCode: string
): Promise<boolean>
// → Checks if completed
// → Awards points
// → Updates status to 'claimed'
// → Returns success/failure
```

#### **Streak Management**:

```typescript
// Get all user streaks
async getUserStreaks(userId: string): Promise<Streak[]>

// Update streak
async updateStreak(
  userId: string,
  streakType: 'login' | 'savings' | 'budget' | 'transaction'
): Promise<void>
// → Checks last activity date
// → Increments or resets count
// → Awards milestone bonuses
// → Updates personal best
```

#### **Point History**:

```typescript
// Get point transaction history
async getPointTransactions(
  userId: string,
  limit?: number
): Promise<PointTransaction[]>
```

---

## 📈 Reporting & Analytics

### **Built-in Reports**

#### **1. Tier Distribution Report**

```sql
-- Query tier distribution
SELECT
  t.tier_name,
  t.icon,
  COUNT(ur.user_id) as user_count,
  ROUND(COUNT(ur.user_id) * 100.0 / (SELECT COUNT(*) FROM rewards.user_rewards), 2) as percentage,
  AVG(ur.total_points) as avg_points
FROM rewards.tiers t
LEFT JOIN rewards.user_rewards ur ON ur.current_tier_id = t.id
GROUP BY t.tier_name, t.icon, t.tier_level
ORDER BY t.tier_level;
```

#### **2. Top Earners Report**

```sql
-- Top 100 point earners
SELECT
  u.first_name || ' ' || u.last_name as user_name,
  u.email,
  t.tier_name,
  ur.total_points,
  ur.lifetime_points,
  COUNT(ua.achievement_id) as achievements_unlocked
FROM rewards.user_rewards ur
JOIN tenant.users u ON u.id = ur.user_id
JOIN rewards.tiers t ON t.id = ur.current_tier_id
LEFT JOIN rewards.user_achievements ua ON ua.user_id = ur.user_id
GROUP BY u.id, ur.id, t.tier_name
ORDER BY ur.total_points DESC
LIMIT 100;
```

#### **3. Achievement Analytics**

```sql
-- Achievement unlock rates
SELECT
  a.achievement_name,
  a.category,
  a.points_reward,
  COUNT(ua.user_id) as unlock_count,
  ROUND(COUNT(ua.user_id) * 100.0 / (SELECT COUNT(*) FROM rewards.user_rewards), 2) as unlock_rate
FROM rewards.achievements a
LEFT JOIN rewards.user_achievements ua ON ua.achievement_id = a.id
GROUP BY a.id
ORDER BY unlock_count DESC;
```

#### **4. Challenge Completion Report**

```sql
-- Challenge completion rates
SELECT
  c.challenge_name,
  c.challenge_type,
  c.points_reward,
  COUNT(CASE WHEN uc.status = 'claimed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN uc.status = 'active' THEN 1 END) as active_count,
  ROUND(COUNT(CASE WHEN uc.status = 'claimed' THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0), 2) as completion_rate
FROM rewards.challenges c
LEFT JOIN rewards.user_challenges uc ON uc.challenge_id = c.id
WHERE c.is_active = true
GROUP BY c.id
ORDER BY completion_rate DESC;
```

#### **5. Point Transaction Summary**

```sql
-- Point transactions by type (last 30 days)
SELECT
  transaction_type,
  action_type,
  COUNT(*) as transaction_count,
  SUM(points) as total_points,
  AVG(points) as avg_points
FROM rewards.point_transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY transaction_type, action_type
ORDER BY total_points DESC;
```

### **Export Formats**

Future support for:
- CSV (Excel-compatible)
- JSON (API consumption)
- PDF (Executive reports)
- Excel (XLSX with charts)

---

## 🚀 Implementation Roadmap

### **Phase 1: Foundation** ✅ (COMPLETE)
- [x] Database schema design
- [x] RewardService implementation
- [x] Basic point earning
- [x] Tier progression logic
- [x] Achievement definitions
- [x] Challenge definitions

### **Phase 2: UI Components** ✅ (COMPLETE)
- [x] RewardsDashboard component
- [x] TierProgressIndicator
- [x] AchievementBadge
- [x] DailyChallengeCard
- [x] StreakCounter
- [x] Celebration animations

### **Phase 3: API Integration** ⏳ (NEXT)
- [ ] Create `/api/rewards/*` endpoints
- [ ] Connect RewardService to REST API
- [ ] Real-time point updates
- [ ] Achievement auto-detection
- [ ] Challenge auto-refresh

### **Phase 4: Admin Dashboard** ⏳ (FUTURE)
- [ ] Admin UI components
- [ ] Configuration interface
- [ ] User management panel
- [ ] Analytics dashboard
- [ ] Report generation

### **Phase 5: Advanced Features** ⏳ (FUTURE)
- [ ] Tenant-specific configuration
- [ ] Custom achievement builder
- [ ] Custom challenge creator
- [ ] Point expiration policies
- [ ] Tier demotion options
- [ ] Redemption catalog
- [ ] Social sharing

---

## 🎯 Summary

### **How Tier Promotion Works**:
1. User earns points through actions
2. System checks total points vs tier thresholds
3. **Automatic upgrade** when threshold crossed
4. **10% bonus** awarded on upgrade
5. **Celebration modal** with confetti animation
6. User enjoys new tier benefits

### **Criteria to Move Tiers**:
- **Bronze → Silver**: 1,000 points (+100 bonus)
- **Silver → Gold**: 5,000 points (+500 bonus)
- **Gold → Platinum**: 15,000 points (+1,500 bonus)
- **Platinum → Diamond**: 50,000 points (+5,000 bonus)

### **Tenant Configuration**:
- **Current**: Partially configurable (JSONB benefits, point thresholds)
- **Future**: Fully configurable via admin dashboard
- **Custom**: Tenants can create achievements, challenges, and adjust rates

### **Admin Dashboard**:
- **Current**: Not implemented (backend only)
- **Planned**: Full admin panel with analytics, user management, configuration

---

**Document Version**: 1.0
**Last Updated**: October 5, 2025
**Next Review**: After Phase 3 API Integration

**Questions?** Contact the development team or refer to the codebase:
- Database: `database/migrations/create_rewards_system.sql`
- Service: `server/services/RewardService.ts`
- Components: `src/components/rewards/`
