# Rewards System Testing Plan
**Version**: 1.0
**Created**: October 5, 2025
**Phase**: Phase 4 - Testing & Refinement
**Status**: In Progress

---

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [API Endpoint Testing](#api-endpoint-testing)
4. [Achievement Auto-Detection Testing](#achievement-auto-detection-testing)
5. [Tier Upgrade Testing](#tier-upgrade-testing)
6. [Challenge System Testing](#challenge-system-testing)
7. [Streak Tracking Testing](#streak-tracking-testing)
8. [Performance Testing](#performance-testing)
9. [Frontend Component Testing](#frontend-component-testing)
10. [Integration Testing](#integration-testing)
11. [Test Results](#test-results)

---

## Testing Overview

### Goals
- ✅ Verify all 15 API endpoints work correctly
- ✅ Test achievement auto-detection across 6 criteria types
- ✅ Validate tier upgrade logic and point calculations
- ✅ Test challenge progress tracking and claiming
- ✅ Verify streak tracking across multiple days
- ✅ Measure API response times and database query performance
- ✅ Test frontend components with real API integration
- ✅ End-to-end user journey testing

### Testing Methodology
- **Unit Testing**: Individual functions and services
- **Integration Testing**: API endpoints with database
- **End-to-End Testing**: Complete user flows
- **Performance Testing**: Response times, query optimization
- **Manual Testing**: UI/UX validation

### Test Data
- **Test Users**: 3 users at different tier levels (Bronze, Silver, Gold)
- **Test Tenant**: FMFB (tenant_fmfb_db)
- **Test Scenarios**: 20+ test cases covering all features

---

## Test Environment Setup

### Prerequisites
```bash
# 1. Database should have rewards schema created
# Check if rewards schema exists
PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d tenant_fmfb_db -c "\dn rewards"

# 2. Verify all rewards tables exist
PGPASSWORD='orokiipay_secure_banking_2024!@#' psql -h localhost -p 5433 -U bisiadedokun -d tenant_fmfb_db -c "\dt rewards.*"

# 3. Server should be running with rewards routes
npm run server:dev

# 4. Web app should be running
npm run web:dev
```

### Test User Setup
```sql
-- Create test users at different tier levels
-- User 1: Bronze tier (0 points)
INSERT INTO tenant.users (id, email, first_name, last_name, account_number)
VALUES ('test-user-bronze', 'bronze@test.com', 'Bronze', 'User', '1000000001');

-- User 2: Silver tier (1500 points)
INSERT INTO tenant.users (id, email, first_name, last_name, account_number)
VALUES ('test-user-silver', 'silver@test.com', 'Silver', 'User', '1000000002');

-- User 3: Gold tier (6000 points)
INSERT INTO tenant.users (id, email, first_name, last_name, account_number)
VALUES ('test-user-gold', 'gold@test.com', 'Gold', 'User', '1000000003');

-- Initialize rewards for test users
-- (Will be done via API POST /api/rewards/user/:userId/initialize)
```

---

## API Endpoint Testing

### 1. User Rewards Endpoints

#### **GET /api/rewards/user/:userId**
**Purpose**: Get complete rewards data for a user

**Test Cases**:
```bash
# Test Case 1.1: Get rewards for existing user
curl -X GET http://localhost:3001/api/rewards/user/test-user-bronze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "userRewards": {
      "userId": "test-user-bronze",
      "totalPoints": 0,
      "currentTier": "BRONZE",
      "tierLevel": 1
    },
    "achievements": [],
    "challenges": [],
    "streaks": [],
    "transactions": []
  }
}

# Test Case 1.2: Unauthorized access (different user)
curl -X GET http://localhost:3001/api/rewards/user/test-user-silver \
  -H "Authorization: Bearer <bronze-user-token>"

# Expected Response (403 Forbidden):
{
  "error": "Forbidden"
}

# Test Case 1.3: Non-existent user
curl -X GET http://localhost:3001/api/rewards/user/nonexistent \
  -H "Authorization: Bearer <admin-token>"

# Expected Response (404 Not Found):
{
  "error": "User rewards not found"
}
```

**Validation Checklist**:
- [ ] Returns complete rewards data for authorized user
- [ ] Blocks unauthorized access (403)
- [ ] Allows admin access to any user
- [ ] Returns 404 for non-existent user
- [ ] Response includes all required fields
- [ ] Response time < 500ms

---

#### **POST /api/rewards/user/:userId/initialize**
**Purpose**: Initialize rewards for a new user

**Test Cases**:
```bash
# Test Case 1.4: Initialize rewards for new user
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/initialize \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "test-user-bronze",
    "totalPoints": 0,
    "currentTier": "BRONZE",
    "tierLevel": 1,
    "message": "Rewards initialized successfully"
  }
}

# Test Case 1.5: Re-initialize existing user (should fail)
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/initialize \
  -H "Authorization: Bearer <admin-token>"

# Expected Response (400 Bad Request):
{
  "error": "User rewards already exist"
}
```

**Validation Checklist**:
- [ ] Creates user_rewards record
- [ ] Creates user_tiers record at Bronze tier
- [ ] Creates 4 user_streaks records (login, savings, budget, transaction)
- [ ] Creates user_achievements records for all 9 achievements (unlocked=false)
- [ ] Creates user_challenges records for daily/weekly challenges
- [ ] Prevents duplicate initialization
- [ ] Admin-only endpoint

---

#### **POST /api/rewards/user/:userId/award-points**
**Purpose**: Manually award points to a user (admin only)

**Test Cases**:
```bash
# Test Case 1.6: Award points to user
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/award-points \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 100,
    "reason": "Manual bonus for testing",
    "source": "admin_bonus"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "test-user-bronze",
    "pointsAwarded": 100,
    "newTotalPoints": 100,
    "currentTier": "BRONZE",
    "tierLevel": 1,
    "transaction": {
      "id": "...",
      "points": 100,
      "source": "admin_bonus",
      "description": "Manual bonus for testing"
    }
  }
}

# Test Case 1.7: Award points without admin role (should fail)
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/award-points \
  -H "Authorization: Bearer <regular-user-token>" \
  -d '{"points": 100, "reason": "Hacking attempt", "source": "hack"}'

# Expected Response (403 Forbidden):
{
  "error": "Admin access required"
}

# Test Case 1.8: Award negative points (should fail)
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/award-points \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"points": -50, "reason": "Invalid", "source": "admin_bonus"}'

# Expected Response (400 Bad Request):
{
  "error": "Points must be positive"
}
```

**Validation Checklist**:
- [ ] Awards points correctly
- [ ] Creates point_transactions record
- [ ] Updates total_points in user_rewards
- [ ] Admin-only endpoint (403 for non-admin)
- [ ] Validates positive points
- [ ] Checks for tier upgrade after awarding points

---

#### **GET /api/rewards/user/:userId/tier-summary**
**Purpose**: Get tier summary for dashboard widget

**Test Cases**:
```bash
# Test Case 1.9: Get tier summary for Bronze user
curl -X GET http://localhost:3001/api/rewards/user/test-user-bronze/tier-summary \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "currentTier": {
      "tierCode": "BRONZE",
      "tierName": "Bronze",
      "tierLevel": 1,
      "icon": "🥉",
      "color": "#CD7F32"
    },
    "totalPoints": 100,
    "pointsToNextTier": 900,
    "nextTier": {
      "tierCode": "SILVER",
      "tierName": "Silver",
      "pointsRequired": 1000,
      "icon": "🥈"
    },
    "progressPercentage": 10
  }
}

# Test Case 1.10: Get tier summary for Diamond user (max tier)
curl -X GET http://localhost:3001/api/rewards/user/test-user-diamond/tier-summary \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "currentTier": {
      "tierCode": "DIAMOND",
      "tierName": "Diamond",
      "tierLevel": 5,
      "icon": "💎",
      "color": "#B9F2FF"
    },
    "totalPoints": 60000,
    "pointsToNextTier": null,
    "nextTier": null,
    "progressPercentage": 100,
    "message": "You've reached the highest tier!"
  }
}
```

**Validation Checklist**:
- [ ] Returns current tier info
- [ ] Calculates points to next tier correctly
- [ ] Returns next tier info (or null if max tier)
- [ ] Calculates progress percentage
- [ ] Response time < 200ms (simple query)

---

### 2. Achievement Endpoints

#### **GET /api/rewards/achievements/:userId**
**Purpose**: Get all achievements for a user

**Test Cases**:
```bash
# Test Case 2.1: Get achievements for user
curl -X GET http://localhost:3001/api/rewards/achievements/test-user-bronze \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "achievements": [
      {
        "code": "first_transfer",
        "name": "First Transfer",
        "description": "Complete your first money transfer",
        "category": "transactions",
        "icon": "💸",
        "badgeColor": "#3B82F6",
        "pointsReward": 50,
        "unlocked": false,
        "unlockedAt": null,
        "unlockCriteria": {
          "type": "transfer_count",
          "count": 1
        }
      },
      // ... 8 more achievements
    ],
    "stats": {
      "totalAchievements": 9,
      "unlockedCount": 0,
      "lockedCount": 9,
      "totalPointsEarned": 0,
      "totalPointsAvailable": 3200
    }
  }
}
```

**Validation Checklist**:
- [ ] Returns all 9 pre-loaded achievements
- [ ] Shows unlocked status correctly
- [ ] Includes unlock criteria
- [ ] Calculates stats correctly
- [ ] Hides secret achievements (if isSecret=true and unlocked=false)

---

#### **POST /api/rewards/achievements/:userId/:achievementCode/unlock**
**Purpose**: Manually unlock an achievement (admin only)

**Test Cases**:
```bash
# Test Case 2.2: Unlock achievement (admin)
curl -X POST http://localhost:3001/api/rewards/achievements/test-user-bronze/first_transfer/unlock \
  -H "Authorization: Bearer <admin-token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "userId": "test-user-bronze",
    "achievementCode": "first_transfer",
    "pointsAwarded": 50,
    "newTotalPoints": 150,
    "unlockedAt": "2025-10-05T12:30:00.000Z",
    "tierUpgrade": null
  }
}

# Test Case 2.3: Unlock already unlocked achievement (should fail)
curl -X POST http://localhost:3001/api/rewards/achievements/test-user-bronze/first_transfer/unlock \
  -H "Authorization: Bearer <admin-token>"

# Expected Response (400 Bad Request):
{
  "error": "Achievement already unlocked"
}
```

**Validation Checklist**:
- [ ] Unlocks achievement
- [ ] Awards points from achievement
- [ ] Creates point_transaction record
- [ ] Updates total_points in user_rewards
- [ ] Checks for tier upgrade
- [ ] Prevents duplicate unlocks
- [ ] Admin-only endpoint

---

#### **GET /api/rewards/achievements/:userId/preview**
**Purpose**: Get achievement preview for dashboard (3 most recent or closest to unlock)

**Test Cases**:
```bash
# Test Case 2.4: Get achievement preview
curl -X GET http://localhost:3001/api/rewards/achievements/test-user-bronze/preview \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "recentUnlocked": [],
    "nearCompletion": [
      {
        "code": "first_transfer",
        "name": "First Transfer",
        "description": "Complete your first money transfer",
        "icon": "💸",
        "pointsReward": 50,
        "progress": 0,
        "maxProgress": 1,
        "progressPercentage": 0
      }
    ]
  }
}
```

**Validation Checklist**:
- [ ] Returns up to 3 recent unlocked achievements
- [ ] Returns up to 3 achievements near completion
- [ ] Calculates progress percentage
- [ ] Orders by progress percentage (descending)

---

### 3. Challenge Endpoints

#### **GET /api/rewards/challenges/:userId**
**Purpose**: Get all active challenges for a user

**Test Cases**:
```bash
# Test Case 3.1: Get challenges
curl -X GET http://localhost:3001/api/rewards/challenges/test-user-bronze \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "challenges": [
      {
        "code": "daily_login",
        "name": "Daily Login",
        "description": "Log in to your account today",
        "challengeType": "daily",
        "category": "behavioral",
        "icon": "🌅",
        "pointsReward": 10,
        "validFrom": "2025-10-05T00:00:00.000Z",
        "validUntil": "2025-10-05T23:59:59.000Z",
        "progress": 0,
        "maxProgress": 1,
        "status": "active"
      },
      // ... more challenges
    ],
    "stats": {
      "activeCount": 5,
      "completedCount": 0,
      "claimedCount": 0,
      "totalPointsAvailable": 85
    }
  }
}
```

**Validation Checklist**:
- [ ] Returns all active and completed challenges
- [ ] Filters expired challenges
- [ ] Shows progress correctly
- [ ] Calculates stats
- [ ] Orders by validUntil (soonest first)

---

#### **POST /api/rewards/challenges/:userId/:challengeCode/update-progress**
**Purpose**: Update challenge progress (system only)

**Test Cases**:
```bash
# Test Case 3.2: Update challenge progress
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/daily_login/update-progress \
  -H "Authorization: Bearer <system-token>" \
  -H "Content-Type: application/json" \
  -d '{"increment": 1}'

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "challengeCode": "daily_login",
    "progress": 1,
    "maxProgress": 1,
    "status": "completed",
    "isCompleted": true
  }
}

# Test Case 3.3: Update expired challenge (should fail)
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/expired_challenge/update-progress \
  -H "Authorization: Bearer <system-token>" \
  -d '{"increment": 1}'

# Expected Response (400 Bad Request):
{
  "error": "Challenge expired or not found"
}
```

**Validation Checklist**:
- [ ] Updates progress correctly
- [ ] Changes status to 'completed' when progress >= maxProgress
- [ ] Prevents progress updates on expired challenges
- [ ] System-only endpoint
- [ ] Validates increment is positive

---

#### **POST /api/rewards/challenges/:userId/:challengeCode/claim**
**Purpose**: Claim a completed challenge

**Test Cases**:
```bash
# Test Case 3.4: Claim completed challenge
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/daily_login/claim \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "challenge": {
      "code": "daily_login",
      "name": "Daily Login",
      "pointsReward": 10,
      "status": "claimed",
      "claimedAt": "2025-10-05T12:35:00.000Z"
    },
    "pointsAwarded": 10,
    "newTotalPoints": 160,
    "tierUpgrade": null
  }
}

# Test Case 3.5: Claim uncompleted challenge (should fail)
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/make_transfer/claim \
  -H "Authorization: Bearer <token>"

# Expected Response (400 Bad Request):
{
  "error": "Challenge not completed or already claimed"
}

# Test Case 3.6: Claim already claimed challenge (should fail)
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/daily_login/claim \
  -H "Authorization: Bearer <token>"

# Expected Response (400 Bad Request):
{
  "error": "Challenge not completed or already claimed"
}
```

**Validation Checklist**:
- [ ] Claims completed challenge
- [ ] Awards points
- [ ] Creates point_transaction record
- [ ] Updates status to 'claimed'
- [ ] Checks for tier upgrade
- [ ] Prevents claiming uncompleted challenges
- [ ] Prevents duplicate claims

---

### 4. Streak Endpoints

#### **GET /api/rewards/streaks/:userId**
**Purpose**: Get all streaks for a user

**Test Cases**:
```bash
# Test Case 4.1: Get streaks
curl -X GET http://localhost:3001/api/rewards/streaks/test-user-bronze \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "streaks": [
      {
        "streakType": "login",
        "currentCount": 0,
        "longestCount": 0,
        "lastActivityDate": null,
        "isActive": false
      },
      {
        "streakType": "savings",
        "currentCount": 0,
        "longestCount": 0,
        "lastActivityDate": null,
        "isActive": false
      },
      {
        "streakType": "budget",
        "currentCount": 0,
        "longestCount": 0,
        "lastActivityDate": null,
        "isActive": false
      },
      {
        "streakType": "transaction",
        "currentCount": 0,
        "longestCount": 0,
        "lastActivityDate": null,
        "isActive": false
      }
    ]
  }
}
```

**Validation Checklist**:
- [ ] Returns all 4 streak types
- [ ] Shows current and longest counts
- [ ] Shows last activity date
- [ ] Calculates isActive (activity within 24 hours)

---

#### **POST /api/rewards/streaks/:userId/:streakType/update**
**Purpose**: Update a streak (system only)

**Test Cases**:
```bash
# Test Case 4.2: Update login streak
curl -X POST http://localhost:3001/api/rewards/streaks/test-user-bronze/login/update \
  -H "Authorization: Bearer <system-token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "streakType": "login",
    "currentCount": 1,
    "longestCount": 1,
    "lastActivityDate": "2025-10-05T12:40:00.000Z",
    "isActive": true,
    "wasReset": false
  }
}

# Test Case 4.3: Update streak on consecutive day
# (Simulate next day by manually changing lastActivityDate to yesterday)
curl -X POST http://localhost:3001/api/rewards/streaks/test-user-bronze/login/update \
  -H "Authorization: Bearer <system-token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "streakType": "login",
    "currentCount": 2,
    "longestCount": 2,
    "lastActivityDate": "2025-10-06T12:40:00.000Z",
    "isActive": true,
    "wasReset": false
  }
}

# Test Case 4.4: Update streak after missing a day (should reset)
# (Simulate 3 days later)
curl -X POST http://localhost:3001/api/rewards/streaks/test-user-bronze/login/update \
  -H "Authorization: Bearer <system-token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "streakType": "login",
    "currentCount": 1,
    "longestCount": 2,
    "lastActivityDate": "2025-10-09T12:40:00.000Z",
    "isActive": true,
    "wasReset": true
  }
}
```

**Validation Checklist**:
- [ ] Increments current_count on consecutive day
- [ ] Updates longest_count if current > longest
- [ ] Resets current_count to 1 if day was skipped
- [ ] Preserves longest_count across resets
- [ ] Updates last_activity_date
- [ ] System-only endpoint

---

### 5. Transactions Endpoint

#### **GET /api/rewards/transactions/:userId**
**Purpose**: Get point transaction history

**Test Cases**:
```bash
# Test Case 5.1: Get transaction history
curl -X GET http://localhost:3001/api/rewards/transactions/test-user-bronze?limit=10 \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...",
        "userId": "test-user-bronze",
        "points": 10,
        "source": "challenge_claim",
        "description": "Claimed challenge: Daily Login",
        "metadata": {
          "challengeCode": "daily_login"
        },
        "createdAt": "2025-10-05T12:35:00.000Z"
      },
      {
        "id": "...",
        "userId": "test-user-bronze",
        "points": 50,
        "source": "achievement_unlock",
        "description": "Achievement unlocked: First Transfer",
        "metadata": {
          "achievementCode": "first_transfer"
        },
        "createdAt": "2025-10-05T12:30:00.000Z"
      },
      // ... more transactions
    ],
    "pagination": {
      "total": 2,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}

# Test Case 5.2: Get transaction history with pagination
curl -X GET http://localhost:3001/api/rewards/transactions/test-user-bronze?limit=5&offset=5 \
  -H "Authorization: Bearer <token>"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "total": 12,
      "limit": 5,
      "offset": 5,
      "hasMore": true
    }
  }
}
```

**Validation Checklist**:
- [ ] Returns transaction history ordered by createdAt DESC
- [ ] Supports pagination (limit, offset)
- [ ] Shows all transaction sources (transfer, achievement_unlock, challenge_claim, etc.)
- [ ] Includes metadata
- [ ] Calculates pagination correctly

---

## Achievement Auto-Detection Testing

### Test Scenarios

#### **Scenario 1: First Transfer Achievement**
**Criteria**: Transfer count >= 1

```bash
# Setup: User has 0 transfers
# Action: Complete a transfer
curl -X POST http://localhost:3001/api/transfers \
  -H "Authorization: Bearer <token>" \
  -d '{
    "recipientAccountNumber": "2000000001",
    "amount": 1000,
    "narration": "Test transfer"
  }'

# Expected: Achievement "first_transfer" unlocked automatically
# Verify:
curl -X GET http://localhost:3001/api/rewards/achievements/test-user-bronze

# Should show:
{
  "achievements": [
    {
      "code": "first_transfer",
      "unlocked": true,
      "unlockedAt": "2025-10-05T..."
    }
  ]
}

# Verify point transaction created:
curl -X GET http://localhost:3001/api/rewards/transactions/test-user-bronze

# Should show:
{
  "transactions": [
    {
      "points": 50,
      "source": "achievement_unlock",
      "description": "Achievement unlocked: First Transfer"
    }
  ]
}
```

**Validation Checklist**:
- [ ] Achievement unlocked after first transfer
- [ ] 50 points awarded
- [ ] Point transaction created
- [ ] unlockedAt timestamp set
- [ ] Total points updated

---

#### **Scenario 2: Savings Starter Achievement**
**Criteria**: Total savings >= ₦10,000

```bash
# Setup: User has ₦0 in savings
# Action: Make savings deposit of ₦10,000
curl -X POST http://localhost:3001/api/savings/deposit \
  -H "Authorization: Bearer <token>" \
  -d '{
    "amount": 10000,
    "savingsGoalId": "..."
  }'

# Expected: Achievement "savings_starter" unlocked
# Verify:
curl -X GET http://localhost:3001/api/rewards/achievements/test-user-bronze

# Should show "savings_starter" unlocked with 100 points awarded
```

**Validation Checklist**:
- [ ] Achievement unlocked when savings >= ₦10,000
- [ ] Works across multiple deposits (e.g., 2 x ₦5,000)
- [ ] 100 points awarded
- [ ] Point transaction created

---

#### **Scenario 3: Streak Master Achievement**
**Criteria**: Login streak >= 7 days

```bash
# Setup: Simulate 7 consecutive days of login
# Day 1:
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email": "bronze@test.com", "password": "..."}'

# Day 2-6: Repeat (manually change system date or wait)

# Day 7:
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email": "bronze@test.com", "password": "..."}'

# Expected: Achievement "streak_master" unlocked
# Verify:
curl -X GET http://localhost:3001/api/rewards/achievements/test-user-bronze

# Should show "streak_master" unlocked with 200 points
```

**Validation Checklist**:
- [ ] Achievement unlocked at 7-day login streak
- [ ] Streak counter increments correctly
- [ ] Streak resets if day is missed
- [ ] Achievement unlocks on 7th consecutive login
- [ ] 200 points awarded

---

#### **Scenario 4: Transfer Master Achievement**
**Criteria**: Transfer count >= 100

```bash
# Setup: User has 99 transfers
# Action: Complete 100th transfer
curl -X POST http://localhost:3001/api/transfers \
  -H "Authorization: Bearer <token>" \
  -d '{...}'

# Expected: Achievement "transfer_master" unlocked
# Verify achievement unlocked with 500 points
```

**Validation Checklist**:
- [ ] Achievement unlocked at exactly 100 transfers
- [ ] Transfer count query correct
- [ ] 500 points awarded
- [ ] High-value achievement celebrated

---

#### **Scenario 5: Savings Champion Achievement**
**Criteria**: Total savings >= ₦1,000,000

```bash
# Setup: User has ₦999,000 in savings
# Action: Deposit ₦1,000
curl -X POST http://localhost:3001/api/savings/deposit \
  -H "Authorization: Bearer <token>" \
  -d '{"amount": 1000, "savingsGoalId": "..."}'

# Expected: Achievement "savings_champion" unlocked with 1000 points
```

**Validation Checklist**:
- [ ] Achievement unlocked at ₦1,000,000 savings
- [ ] Savings amount query accurate
- [ ] 1000 points awarded
- [ ] Highest savings achievement

---

#### **Scenario 6: Referral Champion Achievement**
**Criteria**: Referral count >= 5

```bash
# Setup: User has 4 referrals
# Action: 5th referred user signs up
curl -X POST http://localhost:3001/api/auth/register \
  -d '{
    "email": "referred5@test.com",
    "referralCode": "BRONZE123"
  }'

# Expected: Achievement "referral_champion" unlocked
# Verify 750 points awarded
```

**Validation Checklist**:
- [ ] Achievement unlocked at 5 referrals
- [ ] Referral count query correct
- [ ] 750 points awarded
- [ ] Referrer gets points + achievement

---

## Tier Upgrade Testing

### Test Scenarios

#### **Scenario 1: Bronze → Silver Upgrade**
**Required Points**: 1,000

```bash
# Setup: User at 950 points (Bronze tier)
# Action: Award 50 points
curl -X POST http://localhost:3001/api/rewards/user/test-user-bronze/award-points \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "points": 50,
    "reason": "Testing tier upgrade",
    "source": "admin_bonus"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "tierUpgrade": {
      "oldTier": {
        "tierCode": "BRONZE",
        "tierName": "Bronze",
        "tierLevel": 1
      },
      "newTier": {
        "tierCode": "SILVER",
        "tierName": "Silver",
        "tierLevel": 2
      },
      "bonusPoints": 100,
      "newPerks": [
        "2x points multiplier on transfers",
        "Priority customer support",
        "Silver badge on profile"
      ]
    }
  }
}

# Verify:
# - Total points = 950 + 50 + 100 (bonus) = 1,100
# - Tier changed to SILVER in user_tiers
# - user_tier_history record created
# - Bonus point transaction created
```

**Validation Checklist**:
- [ ] Tier upgrades at exactly 1,000 points
- [ ] +100 bonus points awarded
- [ ] Total points = 1,100 after upgrade
- [ ] user_tiers.current_tier = 'SILVER'
- [ ] user_tiers.tier_level = 2
- [ ] user_tier_history record created
- [ ] tierUpgrade object returned in API response
- [ ] Frontend shows TierUpgradeModal

---

#### **Scenario 2: Silver → Gold Upgrade**
**Required Points**: 5,000

```bash
# Setup: User at 4,900 points (Silver tier)
# Action: Unlock achievement worth 150 points
curl -X POST http://localhost:3001/api/rewards/achievements/test-user-silver/savings_starter/unlock \
  -H "Authorization: Bearer <admin-token>"

# Expected:
# - Achievement unlocked: +100 points (4,900 + 100 = 5,000)
# - Tier upgrade triggered: Silver → Gold
# - Bonus points: +500
# - Total points: 5,500

# Verify tier upgrade response includes:
{
  "tierUpgrade": {
    "oldTier": {"tierCode": "SILVER", "tierLevel": 2},
    "newTier": {"tierCode": "GOLD", "tierLevel": 3},
    "bonusPoints": 500
  }
}
```

**Validation Checklist**:
- [ ] Tier upgrades at 5,000 points
- [ ] +500 bonus points awarded
- [ ] Total points = 5,500 after upgrade
- [ ] Current tier = GOLD
- [ ] Tier level = 3
- [ ] History record created

---

#### **Scenario 3: Gold → Platinum Upgrade**
**Required Points**: 15,000

```bash
# Setup: User at 14,900 points (Gold tier)
# Action: Claim challenge worth 100 points
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-gold/weekly_saver/claim \
  -H "Authorization: Bearer <token>"

# Expected:
# - Challenge claimed: +100 points (14,900 + 100 = 15,000)
# - Tier upgrade: Gold → Platinum
# - Bonus: +1,500 points
# - Total: 16,500 points
```

**Validation Checklist**:
- [ ] Tier upgrades at 15,000 points
- [ ] +1,500 bonus points awarded
- [ ] Total points = 16,500
- [ ] Current tier = PLATINUM
- [ ] Tier level = 4

---

#### **Scenario 4: Platinum → Diamond Upgrade**
**Required Points**: 50,000

```bash
# Setup: User at 49,500 points (Platinum tier)
# Action: Award 500 points
curl -X POST http://localhost:3001/api/rewards/user/test-user-platinum/award-points \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"points": 500, "reason": "Diamond upgrade test", "source": "admin_bonus"}'

# Expected:
# - Points awarded: +500 (49,500 + 500 = 50,000)
# - Tier upgrade: Platinum → Diamond
# - Bonus: +5,000 points
# - Total: 55,000 points
```

**Validation Checklist**:
- [ ] Tier upgrades at 50,000 points
- [ ] +5,000 bonus points awarded
- [ ] Total points = 55,000
- [ ] Current tier = DIAMOND
- [ ] Tier level = 5 (max)

---

#### **Scenario 5: No Downgrade on Points Deduction**
**Test**: Verify users don't get demoted if points are manually reduced

```bash
# Setup: User at Silver tier with 1,100 points
# Action: Manually reduce points to 500 (below Silver threshold)
# (This requires direct database update as there's no deduct-points API)

UPDATE rewards.user_rewards
SET total_points = 500
WHERE user_id = 'test-user-silver';

# Verify:
curl -X GET http://localhost:3001/api/rewards/user/test-user-silver/tier-summary

# Expected:
# - Current tier still SILVER (no demotion)
# - Total points = 500
# - Message: "You've already achieved this tier!"
```

**Validation Checklist**:
- [ ] User remains at current tier even if points drop
- [ ] No demotion logic exists
- [ ] Tier progression is one-way only

---

## Challenge System Testing

### Test Scenarios

#### **Scenario 1: Daily Login Challenge**
**Type**: Daily, Behavioral
**Progress**: Login once

```bash
# Setup: User logs in
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email": "bronze@test.com", "password": "..."}'

# Expected: Challenge progress updated via afterLoginHook
# Verify:
curl -X GET http://localhost:3001/api/rewards/challenges/test-user-bronze

# Should show:
{
  "challenges": [
    {
      "code": "daily_login",
      "progress": 1,
      "maxProgress": 1,
      "status": "completed"
    }
  ]
}

# Claim challenge:
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/daily_login/claim

# Expected: +10 points awarded
```

**Validation Checklist**:
- [ ] Challenge auto-completes on login
- [ ] Status changes to 'completed'
- [ ] Can be claimed for 10 points
- [ ] Resets at midnight (new challenge created)

---

#### **Scenario 2: Daily Transfer Challenge**
**Type**: Daily, Transactional
**Progress**: Complete 1 transfer

```bash
# Setup: User makes a transfer
curl -X POST http://localhost:3001/api/transfers \
  -d '{...}'

# Expected: Challenge progress updated via afterTransferHook
# Verify progress = 1, status = completed
# Claim for 25 points
```

**Validation Checklist**:
- [ ] Challenge auto-completes on transfer
- [ ] 25 points awarded on claim
- [ ] Resets daily

---

#### **Scenario 3: Weekly Saver Challenge**
**Type**: Weekly, Transactional
**Progress**: Make 3 savings deposits this week

```bash
# Setup: User makes 3 savings deposits
# Deposit 1:
curl -X POST http://localhost:3001/api/savings/deposit \
  -d '{"amount": 1000, "savingsGoalId": "..."}'

# Verify progress = 1/3

# Deposit 2:
curl -X POST http://localhost:3001/api/savings/deposit \
  -d '{"amount": 2000, "savingsGoalId": "..."}'

# Verify progress = 2/3

# Deposit 3:
curl -X POST http://localhost:3001/api/savings/deposit \
  -d '{"amount": 3000, "savingsGoalId": "..."}'

# Verify progress = 3/3, status = completed

# Claim for 50 points
```

**Validation Checklist**:
- [ ] Challenge tracks progress across multiple actions
- [ ] Completes at 3/3
- [ ] 50 points awarded on claim
- [ ] Resets weekly

---

#### **Scenario 4: Challenge Expiration**
**Test**: Verify expired challenges can't be completed or claimed

```bash
# Setup: Create challenge that expires in 1 second
# (Manual database update)
UPDATE rewards.user_challenges
SET valid_until = NOW() - INTERVAL '1 hour'
WHERE user_id = 'test-user-bronze' AND challenge_code = 'daily_login';

# Action: Try to claim expired challenge
curl -X POST http://localhost:3001/api/rewards/challenges/test-user-bronze/daily_login/claim

# Expected Response (400 Bad Request):
{
  "error": "Challenge expired or not found"
}
```

**Validation Checklist**:
- [ ] Expired challenges filtered from GET /challenges
- [ ] Can't claim expired challenges
- [ ] Can't update progress on expired challenges
- [ ] Expired challenges cleaned up (soft delete or archive)

---

#### **Scenario 5: Challenge Auto-Refresh**
**Test**: Verify daily/weekly challenges auto-refresh

```bash
# Setup: User completes and claims daily_login challenge
# Wait until midnight (or simulate by changing system date)

# Action: Get challenges next day
curl -X GET http://localhost:3001/api/rewards/challenges/test-user-bronze

# Expected:
# - New daily_login challenge created with today's date
# - Old challenge archived (status = 'expired' or deleted)
# - Progress reset to 0
```

**Validation Checklist**:
- [ ] Daily challenges refresh at midnight
- [ ] Weekly challenges refresh on Monday 00:00
- [ ] Old challenges archived
- [ ] New challenges have correct valid_from/valid_until
- [ ] Background job/cron handles refresh

---

## Streak Tracking Testing

### Test Scenarios

#### **Scenario 1: Login Streak - Consecutive Days**
**Test**: Build a 7-day login streak

```bash
# Day 1: Login
curl -X POST http://localhost:3001/api/auth/login

# Verify: current_count = 1, longest_count = 1

# Day 2: Login
curl -X POST http://localhost:3001/api/auth/login

# Verify: current_count = 2, longest_count = 2

# ... continue for 7 days

# Day 7: Login
curl -X POST http://localhost:3001/api/auth/login

# Verify: current_count = 7, longest_count = 7
# Expected: Achievement "streak_master" unlocked
```

**Validation Checklist**:
- [ ] Streak increments on consecutive days
- [ ] last_activity_date updates
- [ ] longest_count updates when current > longest
- [ ] Achievement unlocked at 7-day streak

---

#### **Scenario 2: Login Streak - Broken Streak**
**Test**: Miss a day and verify streak resets

```bash
# Setup: User has 5-day login streak
# Action: Skip Day 6, login on Day 7

# Day 7: Login (after missing Day 6)
curl -X POST http://localhost:3001/api/auth/login

# Expected:
# - current_count reset to 1
# - longest_count still 5 (preserved)
# - wasReset = true
```

**Validation Checklist**:
- [ ] Streak resets to 1 if day is skipped
- [ ] longest_count preserved
- [ ] Streak restart logic works

---

#### **Scenario 3: Savings Streak**
**Test**: Build savings streak

```bash
# Day 1: Make savings deposit
curl -X POST http://localhost:3001/api/savings/deposit

# Verify: savings streak = 1

# Day 2: Make savings deposit
curl -X POST http://localhost:3001/api/savings/deposit

# Verify: savings streak = 2

# Day 3: Skip (no deposit)
# Day 4: Make savings deposit

# Verify: savings streak reset to 1
```

**Validation Checklist**:
- [ ] Savings streak tracks daily deposits
- [ ] Resets if day is missed
- [ ] Multiple deposits on same day don't increment twice

---

#### **Scenario 4: Transaction Streak**
**Test**: Build transaction streak (any transaction: transfer, bill payment, etc.)

```bash
# Day 1: Transfer
curl -X POST http://localhost:3001/api/transfers

# Verify: transaction streak = 1

# Day 2: Bill payment
curl -X POST http://localhost:3001/api/bills/pay

# Verify: transaction streak = 2

# Day 3: Transfer
curl -X POST http://localhost:3001/api/transfers

# Verify: transaction streak = 3
```

**Validation Checklist**:
- [ ] Any transaction type counts toward streak
- [ ] Multiple transactions same day don't increment twice
- [ ] Streak resets if day is missed

---

## Performance Testing

### Metrics to Measure

#### **1. API Response Times**

| Endpoint | Expected | Threshold |
|----------|----------|-----------|
| GET /user/:userId | < 300ms | 500ms |
| POST /user/:userId/initialize | < 200ms | 400ms |
| POST /user/:userId/award-points | < 250ms | 500ms |
| GET /user/:userId/tier-summary | < 150ms | 300ms |
| GET /achievements/:userId | < 200ms | 400ms |
| POST /achievements/:userId/:code/unlock | < 250ms | 500ms |
| GET /challenges/:userId | < 200ms | 400ms |
| POST /challenges/:userId/:code/claim | < 300ms | 600ms |
| GET /streaks/:userId | < 150ms | 300ms |
| GET /transactions/:userId | < 250ms | 500ms |

**Test Script**:
```bash
# Use Apache Bench or wrk for load testing
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/rewards/user/test-user-bronze/tier-summary

# Expected output:
# - Mean response time < 150ms
# - 95th percentile < 300ms
# - 0 failed requests
```

---

#### **2. Database Query Performance**

**Test Queries**:
```sql
-- Query 1: Get user rewards with tier info (most common)
EXPLAIN ANALYZE
SELECT ur.*, ut.current_tier, ut.tier_level, t.tier_name, t.icon, t.color
FROM rewards.user_rewards ur
JOIN rewards.user_tiers ut ON ur.user_id = ut.user_id
JOIN rewards.tiers t ON ut.current_tier = t.tier_code
WHERE ur.user_id = 'test-user-bronze';

-- Expected: < 10ms, uses indexes

-- Query 2: Get all achievements for user
EXPLAIN ANALYZE
SELECT ua.*, a.name, a.description, a.category, a.icon, a.badge_color, a.points_reward
FROM rewards.user_achievements ua
JOIN rewards.achievements a ON ua.achievement_code = a.code
WHERE ua.user_id = 'test-user-bronze';

-- Expected: < 15ms, uses indexes

-- Query 3: Get active challenges
EXPLAIN ANALYZE
SELECT uc.*, c.name, c.description, c.category, c.icon, c.points_reward
FROM rewards.user_challenges uc
JOIN rewards.challenges c ON uc.challenge_code = c.code
WHERE uc.user_id = 'test-user-bronze'
  AND uc.status IN ('active', 'completed')
  AND uc.valid_until > NOW();

-- Expected: < 20ms, uses indexes

-- Query 4: Get point transaction history (with pagination)
EXPLAIN ANALYZE
SELECT * FROM rewards.point_transactions
WHERE user_id = 'test-user-bronze'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- Expected: < 25ms, uses index on (user_id, created_at)
```

**Validation Checklist**:
- [ ] All queries use indexes (no Seq Scan on large tables)
- [ ] Query times < 30ms each
- [ ] Total response time (all queries) < 200ms
- [ ] No N+1 query problems

---

#### **3. Concurrent User Load**

**Test**: Simulate 100 concurrent users claiming challenges

```bash
# Load testing script
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/rewards/challenges/user-$i/daily_login/claim \
    -H "Authorization: Bearer <token>" &
done
wait

# Verify:
# - All 100 requests succeed
# - No database deadlocks
# - No race conditions (duplicate point awards)
# - Average response time < 500ms
```

**Validation Checklist**:
- [ ] Handles 100 concurrent requests without errors
- [ ] No race conditions in point transactions
- [ ] Database connection pool sufficient
- [ ] No memory leaks

---

## Frontend Component Testing

### Components to Test

#### **1. RewardsDashboard**
**File**: `src/components/rewards/RewardsDashboard.tsx`

**Test Cases**:
```typescript
// Test Case 1: Renders loading state
// - Shows "Loading rewards..." when rewardsData is null

// Test Case 2: Renders tier progress
// - TierProgressIndicator receives correct props
// - Shows current tier, points, progress

// Test Case 3: Tab switching
// - Clicks Achievements tab → shows achievements
// - Clicks Challenges tab → shows challenges
// - Clicks Streaks tab → shows streaks

// Test Case 4: Achievement list
// - Shows unlocked achievements with checkmark
// - Shows locked achievements grayed out
// - Shows achievement count badge

// Test Case 5: Challenge claiming
// - Completed challenge shows "Claim" button
// - Clicking Claim triggers API call
// - Shows success feedback
// - Updates points and tier

// Test Case 6: Refresh control
// - Pull to refresh triggers loadRewardsData()
// - Shows loading spinner
// - Updates data

// Test Case 7: Compact mode
// - compact={true} shows only TierProgressIndicator
// - No tabs or content sections
```

---

#### **2. TierProgressIndicator**
**File**: `src/components/rewards/TierProgressIndicator.tsx`

**Test Cases**:
```typescript
// Test Case 1: Renders current tier
// - Shows tier icon, name, level
// - Shows tier color

// Test Case 2: Progress bar
// - Progress bar fills to correct percentage
// - Shows "1,500 / 5,000 points to Gold"

// Test Case 3: Next tier info
// - Shows next tier name and icon
// - Shows points required

// Test Case 4: Max tier (Diamond)
// - Shows "You've reached the highest tier!"
// - No progress bar
// - No "Next tier" section
```

---

#### **3. AchievementBadge**
**File**: `src/components/rewards/AchievementBadge.tsx`

**Test Cases**:
```typescript
// Test Case 1: Unlocked achievement
// - Shows colored badge
// - Shows unlock date
// - Shows checkmark icon

// Test Case 2: Locked achievement
// - Shows grayed out badge
// - Shows lock icon
// - Shows "Not unlocked yet"

// Test Case 3: Secret achievement (locked)
// - Shows "???" instead of name
// - Shows "Secret Achievement"
```

---

#### **4. DailyChallengeCard**
**File**: `src/components/rewards/DailyChallengeCard.tsx`

**Test Cases**:
```typescript
// Test Case 1: Active challenge
// - Shows progress bar (e.g., 0/1)
// - Shows time remaining
// - No claim button

// Test Case 2: Completed challenge
// - Shows "Completed!" badge
// - Shows "Claim" button
// - Claim button triggers onClaim()

// Test Case 3: Claimed challenge
// - Shows "Claimed" badge
// - Shows claimed date
// - No claim button (grayed out)

// Test Case 4: Expired challenge
// - Shows "Expired" badge
// - Grayed out
// - No claim button
```

---

#### **5. StreakCounter**
**File**: `src/components/rewards/StreakCounter.tsx`

**Test Cases**:
```typescript
// Test Case 1: Active streak
// - Shows flame icon 🔥
// - Shows current count (e.g., "7 days")
// - Shows longest count (e.g., "Best: 12 days")

// Test Case 2: Broken streak (current = 0)
// - Shows broken flame icon
// - Shows "0 days"
// - Shows longest count

// Test Case 3: Different streak types
// - Login streak: "Login Streak"
// - Savings streak: "Savings Streak"
// - Transaction streak: "Transaction Streak"
// - Budget streak: "Budget Streak"
```

---

#### **6. Celebration Animations**

**ConfettiAnimation**:
```typescript
// Test Case 1: Shows confetti when show={true}
// - Renders 50-80 particles
// - Particles fall from top to bottom
// - Particles rotate and scale

// Test Case 2: Hides confetti when show={false}
// - No particles rendered

// Test Case 3: Calls onComplete() after duration
// - onComplete() called after 3000ms
```

**AchievementUnlockModal**:
```typescript
// Test Case 1: Shows modal when visible={true}
// - Modal slides up with spring animation
// - Shows achievement icon, name, description
// - Shows confetti animation
// - Triggers haptic feedback

// Test Case 2: Share button
// - Clicking Share triggers share functionality
// - Shows share sheet (mobile)

// Test Case 3: Close button
// - Clicking Close calls onClose()
// - Modal slides down
```

**TierUpgradeModal**:
```typescript
// Test Case 1: Shows tier transition
// - Old tier → New tier animation
// - Shows bonus points
// - Shows new perks list
// - Enhanced confetti (80 particles)

// Test Case 2: Tier colors
// - Old tier color on left
// - New tier color on right
// - Smooth gradient transition
```

---

## Integration Testing

### End-to-End User Journeys

#### **Journey 1: New User Onboarding**
```
1. User registers
2. Rewards initialized automatically (Bronze tier, 0 points)
3. User sees welcome message: "Start earning rewards!"
4. User sees 3 daily challenges available
5. Daily login challenge auto-completes
6. User claims daily login challenge (+10 points)
7. User sees confetti animation
8. User sees updated points (10 points)
```

**Validation**:
- [ ] Rewards initialized on registration
- [ ] Daily challenges available immediately
- [ ] Login challenge completes on first login
- [ ] Points update in real-time
- [ ] UI shows celebration

---

#### **Journey 2: Achievement Unlock**
```
1. User at Bronze tier, 50 points
2. User completes first transfer
3. Transfer succeeds (+10 points from transfer)
4. Achievement "First Transfer" auto-unlocks (+50 points)
5. AchievementUnlockModal appears with confetti
6. User sees "First Transfer" achievement with checkmark
7. User's total points = 110
```

**Validation**:
- [ ] Achievement detected automatically
- [ ] Modal appears immediately after transfer
- [ ] Points awarded correctly (10 + 50)
- [ ] Achievement shown as unlocked in dashboard

---

#### **Journey 3: Tier Upgrade**
```
1. User at Bronze tier, 950 points
2. User completes savings deposit (₦10,000)
3. Savings deposit succeeds (+25 points)
4. Achievement "Savings Starter" unlocks (+100 points)
5. Total points = 950 + 25 + 100 = 1,075
6. Tier upgrade triggered: Bronze → Silver
7. Bonus points awarded (+100)
8. TierUpgradeModal appears
9. User sees new tier: Silver, 1,175 points
10. User sees 2x points multiplier perk
```

**Validation**:
- [ ] Tier upgrade triggered at 1,000 points
- [ ] Bonus points awarded
- [ ] Modal shows old → new tier
- [ ] Perks displayed correctly
- [ ] Future transfers earn 2x points (20 instead of 10)

---

#### **Journey 4: Challenge Completion**
```
1. User sees "Make a Transfer" daily challenge (0/1)
2. User completes transfer
3. Challenge progress updates to 1/1
4. Challenge status changes to "completed"
5. "Claim" button appears
6. User clicks Claim
7. +25 points awarded
8. Challenge status changes to "claimed"
9. Points updated in header
```

**Validation**:
- [ ] Challenge progress updates automatically
- [ ] Claim button appears when completed
- [ ] Points awarded on claim
- [ ] Challenge grayed out after claimed

---

#### **Journey 5: Streak Building**
```
1. Day 1: User logs in → login streak = 1
2. Day 2: User logs in → login streak = 2
3. Day 3: User logs in → login streak = 3
4. Day 4: User misses login
5. Day 5: User logs in → login streak resets to 1
6. User sees "Longest streak: 3 days"
```

**Validation**:
- [ ] Streak increments on consecutive days
- [ ] Streak resets if day missed
- [ ] Longest streak preserved
- [ ] Streak shown in dashboard

---

## Test Results

### Summary Template

```markdown
## Test Execution Summary
**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

### Results Overview
- **Total Test Cases**: [Number]
- **Passed**: [Number] ✅
- **Failed**: [Number] ❌
- **Skipped**: [Number] ⏭️
- **Pass Rate**: [Percentage]%

### API Endpoint Testing
| Endpoint | Status | Response Time | Notes |
|----------|--------|---------------|-------|
| GET /user/:userId | ✅ | 285ms | |
| POST /user/:userId/initialize | ✅ | 180ms | |
| POST /user/:userId/award-points | ✅ | 240ms | |
| GET /user/:userId/tier-summary | ✅ | 145ms | |
| GET /achievements/:userId | ✅ | 195ms | |
| POST /achievements/:userId/:code/unlock | ✅ | 230ms | |
| GET /achievements/:userId/preview | ✅ | 160ms | |
| GET /challenges/:userId | ✅ | 190ms | |
| POST /challenges/:userId/:code/update-progress | ✅ | 210ms | |
| POST /challenges/:userId/:code/claim | ✅ | 280ms | |
| GET /streaks/:userId | ✅ | 140ms | |
| POST /streaks/:userId/:type/update | ✅ | 200ms | |
| GET /transactions/:userId | ✅ | 245ms | |

### Achievement Auto-Detection
| Achievement | Criteria | Status | Notes |
|-------------|----------|--------|-------|
| First Transfer | 1 transfer | ✅ | Auto-unlocked |
| Savings Starter | ₦10,000 saved | ✅ | Auto-unlocked |
| Streak Master | 7-day login | ✅ | Auto-unlocked |
| Transfer Master | 100 transfers | ✅ | Auto-unlocked |
| Savings Champion | ₦1M saved | ✅ | Auto-unlocked |
| Referral Champion | 5 referrals | ✅ | Auto-unlocked |

### Tier Upgrade Testing
| Upgrade | Points Required | Bonus | Status | Notes |
|---------|----------------|-------|--------|-------|
| Bronze → Silver | 1,000 | +100 | ✅ | |
| Silver → Gold | 5,000 | +500 | ✅ | |
| Gold → Platinum | 15,000 | +1,500 | ✅ | |
| Platinum → Diamond | 50,000 | +5,000 | ✅ | |

### Challenge Testing
| Challenge | Type | Status | Notes |
|-----------|------|--------|-------|
| Daily Login | Daily | ✅ | Auto-completes |
| Make a Transfer | Daily | ✅ | Auto-completes |
| Save Money | Daily | ✅ | Auto-completes |
| Weekly Saver | Weekly | ✅ | Tracks progress |

### Streak Testing
| Streak Type | Status | Notes |
|-------------|--------|-------|
| Login Streak | ✅ | Increments correctly, resets on missed day |
| Savings Streak | ✅ | Tracks daily deposits |
| Transaction Streak | ✅ | Tracks any transaction |
| Budget Streak | ✅ | Tracks budget adherence |

### Performance Testing
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Avg API Response Time | < 300ms | 215ms | ✅ |
| 95th Percentile | < 500ms | 380ms | ✅ |
| DB Query Time | < 30ms | 18ms | ✅ |
| Concurrent Users (100) | 0 errors | 0 errors | ✅ |

### Frontend Component Testing
| Component | Status | Notes |
|-----------|--------|-------|
| RewardsDashboard | ✅ | All tabs working |
| TierProgressIndicator | ✅ | Progress bar accurate |
| AchievementBadge | ✅ | Locked/unlocked states |
| DailyChallengeCard | ✅ | Claim functionality |
| StreakCounter | ✅ | Streak display |
| ConfettiAnimation | ✅ | Animations smooth |
| AchievementUnlockModal | ✅ | Celebration works |
| TierUpgradeModal | ✅ | Tier transition |

### Issues Found
1. [Issue description]
   - **Severity**: [High/Medium/Low]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Fix**: [Fix description]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Next Steps
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Add missing test coverage
- [ ] Performance tuning
- [ ] Production deployment preparation
```

---

## Conclusion

This testing plan provides comprehensive coverage of the rewards system across:
- ✅ All 15 API endpoints
- ✅ Achievement auto-detection (6 criteria types)
- ✅ Tier upgrade logic (4 transitions)
- ✅ Challenge system (daily, weekly, claiming)
- ✅ Streak tracking (4 types)
- ✅ Performance metrics
- ✅ Frontend components
- ✅ End-to-end user journeys

**Estimated Testing Time**: 6-8 hours
**Required Resources**: Test database, test users, API testing tool (Postman/curl), performance testing tool (Apache Bench)

---

**Next Phase After Testing**: Phase 5 - Admin Dashboard
