# 🌟 World-Class UI Design System - OrokiiPay Banking Platform

## 📋 Table of Contents
1. [Overview & Philosophy](#overview--philosophy)
2. [Core Design Principles](#core-design-principles)
3. [Multi-Tenant Theme System](#multi-tenant-theme-system)
4. [Typography System](#typography-system)
5. [Color System](#color-system)
6. [Component Library](#component-library)
7. [Micro-interactions & Animations](#micro-interactions--animations)
8. [Reward & Gamification System](#reward--gamification-system)
9. [AI Assistant Design](#ai-assistant-design)
10. [Data Visualization](#data-visualization)
11. [Onboarding Experience](#onboarding-experience)
12. [Notification System](#notification-system)
13. [Gesture Patterns](#gesture-patterns)
14. [Empty & Error States](#empty--error-states)
15. [Accessibility Standards](#accessibility-standards)
16. [Performance Guidelines](#performance-guidelines)

---

## Overview & Philosophy

### 🎯 **Mission Statement**
Create a banking experience that is **delightful, intuitive, and rewarding** - combining the best UI/UX practices from:
- **🇧🇷 Nubank** - Gamification & emotional connection
- **🇬🇧 Revolut** - Feature richness & data visualization
- **🇬🇧 Monzo** - UX excellence & helpful notifications
- **🇩🇪 N26** - Minimalist elegance & typography
- **🇬🇧 Cleo AI** - Conversational AI & personality-driven assistance

### 🏆 **Design Goals**
1. **NPS Score Target**: 85+ (Nubank-level satisfaction)
2. **Onboarding Time**: < 8 minutes (Nubank standard)
3. **Daily Active Usage**: 3+ sessions/day (Revolut benchmark)
4. **User Delight Index**: Measurable positive emotions

### 🚨 **CRITICAL REQUIREMENTS**
1. **ALL screens MUST implement this design system. No exceptions.**
2. **NEVER hardcode colors** - always use tenant theme
3. **EVERY interaction MUST have micro-feedback** (animation, haptic)
4. **MANDATORY gamification** on key user journeys
5. **Data MUST be visualized**, not just displayed

---

## Core Design Principles

### 1. **Glassmorphism + Gradient Mastery**
- Semi-transparent overlays with backdrop blur (Nubank-inspired)
- Dynamic tenant gradients as primary backgrounds
- Creates depth, modernity, and brand distinctiveness

### 2. **Conversational & Human**
- Use friendly, encouraging language (Nubank tone)
- Explain complex banking terms in simple words
- Guide users, don't just inform them

### 3. **Instant Feedback Loop**
- Every action gets immediate visual/haptic response
- Loading states never leave users wondering
- Success feels rewarding, not just functional

### 4. **Progressive Disclosure**
- Show essentials first, details on demand
- Reduce cognitive load (N26 philosophy)
- Expandable cards, accordions, drill-downs

### 5. **Delight Through Motion**
- Purposeful animations that communicate meaning
- Celebrate user achievements
- Make financial progress feel tangible

---

## Multi-Tenant Theme System

### 🎨 **Enhanced Theme Structure**

```typescript
interface WorldClassTheme {
  // Brand Identity
  branding: {
    name: string;
    logoUrl: string;
    tagline: string;
    primaryFont: string;        // NEW: Custom font family
    secondaryFont: string;       // NEW: For numbers/data
  };

  // Color Palette (Nubank-inspired richness)
  colors: {
    // Primary Gradient (hero backgrounds)
    primary: string;
    primaryDark: string;         // NEW: Darker shade for gradient end
    primaryLight: string;        // NEW: Lighter shade for accents

    // Secondary & Accents
    secondary: string;
    accent: string;

    // Semantic Colors
    success: string;
    error: string;
    warning: string;
    info: string;

    // Rewards & Gamification (NEW)
    reward: {
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
      platinum: '#E5E4E2'
    };

    // Category Colors (for spending breakdown)
    categories: {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      shopping: '#FFE66D',
      bills: '#A8E6CF',
      entertainment: '#FF8B94',
      health: '#95E1D3',
      education: '#F3A683',
      other: '#B8B8D1'
    };

    // Neutral Palette
    text: {
      primary: '#1a1a2e',
      secondary: '#6c757d',
      light: '#94a3b8',
      inverse: '#ffffff'
    };

    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef'
    };
  };

  // Typography Scale (N26-inspired)
  typography: {
    fontFamily: {
      primary: string;           // Main font
      mono: string;              // For amounts/numbers
      display: string;           // For hero text
    };

    scale: {
      display: { large: 57, medium: 45, small: 36 };
      headline: { large: 32, medium: 28, small: 24 };
      title: { large: 22, medium: 18, small: 16 };
      body: { large: 16, medium: 14, small: 12 };
      label: { large: 14, medium: 12, small: 11 };
    };

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8
    };

    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5
    };
  };

  // Motion & Animation
  motion: {
    easing: {
      standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
      emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
      decelerated: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerated: 'cubic-bezier(0.4, 0.0, 1, 1)'
    };

    duration: {
      instant: 50,
      fast: 100,
      medium: 200,
      slow: 300,
      slower: 400,
      slowest: 600
    };
  };

  // Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64
  };

  // Border Radius
  radius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 24,
    round: 9999
  };

  // Shadows
  shadows: {
    light: '0 2px 8px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    heavy: '0 8px 20px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 28px rgba(0, 0, 0, 0.25)'
  };
}
```

### 🔴 **MANDATORY: Dynamic Theme Usage**

```typescript
// ✅ ALWAYS DO THIS
import { useTenantTheme } from '../../context/TenantThemeContext';

const Component = () => {
  const { theme } = useTenantTheme();

  return (
    <View style={{
      background: `linear-gradient(135deg,
        ${theme.colors.primary} 0%,
        ${theme.colors.primaryDark} 100%)`
    }}>
      <Text style={{
        fontFamily: theme.typography.fontFamily.primary,
        fontSize: theme.typography.scale.headline.large,
        color: theme.colors.text.inverse
      }}>
        Welcome to {theme.branding.name}
      </Text>
    </View>
  );
};

// ❌ NEVER DO THIS
backgroundColor: '#010080'  // FORBIDDEN
color: 'blue'               // FORBIDDEN
```

---

## Typography System

### 📝 **N26-Inspired Typography Hierarchy**

```typescript
// Typography Component Library
const Typography = {
  // Display (Hero sections)
  Display: ({ size = 'large', children, style }) => {
    const { theme } = useTenantTheme();
    const fontSize = theme.typography.scale.display[size];

    return (
      <Text style={[{
        fontFamily: theme.typography.fontFamily.display,
        fontSize,
        lineHeight: fontSize * 1.2,
        fontWeight: '700',
        letterSpacing: -0.5
      }, style]}>
        {children}
      </Text>
    );
  },

  // Headlines
  Headline: ({ size = 'medium', children, style }) => {
    const { theme } = useTenantTheme();
    const fontSize = theme.typography.scale.headline[size];

    return (
      <Text style={[{
        fontFamily: theme.typography.fontFamily.primary,
        fontSize,
        lineHeight: fontSize * 1.3,
        fontWeight: '600',
        letterSpacing: 0
      }, style]}>
        {children}
      </Text>
    );
  },

  // Body Text
  Body: ({ size = 'medium', children, style }) => {
    const { theme } = useTenantTheme();
    const fontSize = theme.typography.scale.body[size];

    return (
      <Text style={[{
        fontFamily: theme.typography.fontFamily.primary,
        fontSize,
        lineHeight: fontSize * 1.5,
        fontWeight: '400',
        letterSpacing: 0.25,
        color: theme.colors.text.primary
      }, style]}>
        {children}
      </Text>
    );
  },

  // Monospace (for amounts)
  Amount: ({ value, currency = '₦', size = 'large', style }) => {
    const { theme } = useTenantTheme();
    const fontSize = theme.typography.scale.headline[size];

    return (
      <Text style={[{
        fontFamily: theme.typography.fontFamily.mono,
        fontSize,
        lineHeight: fontSize * 1.2,
        fontWeight: '600',
        color: theme.colors.text.primary,
        letterSpacing: -0.5
      }, style]}>
        {currency}{value.toLocaleString('en-NG')}
      </Text>
    );
  }
};

// Usage
<Typography.Display size="large">
  Welcome Back!
</Typography.Display>

<Typography.Amount value={2450000} currency="₦" size="large" />
```

---

## Reward & Gamification System

### 🏆 **Nubank-Inspired Reward Architecture**

The reward system is the **secret sauce** that creates emotional connection and drives engagement.

#### **1. Core Reward Types**

```typescript
interface RewardSystem {
  // Achievement Categories
  achievements: {
    // Onboarding Achievements
    onboarding: [
      {
        id: 'first_login',
        name: 'Welcome Aboard! 🎉',
        description: 'You\'ve logged in for the first time',
        points: 10,
        badge: '👋',
        tier: 'bronze',
        unlocked: boolean
      },
      {
        id: 'profile_complete',
        name: 'Profile Master 📝',
        description: 'Complete your profile 100%',
        points: 50,
        badge: '✅',
        tier: 'silver',
        progress: { current: 4, total: 5 }
      },
      {
        id: 'security_setup',
        name: 'Security Champion 🔐',
        description: 'Enable 2FA and biometric login',
        points: 100,
        badge: '🛡️',
        tier: 'gold'
      }
    ],

    // Transaction Achievements
    transactions: [
      {
        id: 'first_transfer',
        name: 'First Transfer! 💸',
        description: 'Send your first successful transfer',
        points: 25,
        badge: '🚀',
        celebration: 'confetti'
      },
      {
        id: 'transfer_streak_7',
        name: 'Weekly Warrior ⚡',
        description: 'Make transfers 7 days in a row',
        points: 200,
        badge: '🔥',
        celebration: 'fireworks'
      },
      {
        id: 'bill_automation',
        name: 'Automation Expert 🤖',
        description: 'Set up 3 automatic bill payments',
        points: 150,
        badge: '⚙️',
        tier: 'gold'
      }
    ],

    // Savings Achievements
    savings: [
      {
        id: 'first_savings',
        name: 'Savings Started! 💰',
        description: 'Create your first savings goal',
        points: 50,
        badge: '🎯',
        tier: 'bronze'
      },
      {
        id: 'savings_goal_reached',
        name: 'Goal Crusher! 🏆',
        description: 'Reach your savings goal',
        points: 500,
        badge: '🎊',
        tier: 'platinum',
        celebration: 'goldConfetti'
      },
      {
        id: 'consistent_saver',
        name: 'Consistent Saver 📈',
        description: 'Save money 30 days in a row',
        points: 1000,
        badge: '💎',
        tier: 'platinum',
        celebration: 'diamondShower'
      }
    ],

    // Financial Health
    financial_health: [
      {
        id: 'budget_wizard',
        name: 'Budget Wizard 🧙',
        description: 'Stay within budget for 3 months',
        points: 750,
        badge: '📊',
        tier: 'gold'
      },
      {
        id: 'debt_free',
        name: 'Debt Free Champion! 🎉',
        description: 'Pay off all outstanding loans',
        points: 2000,
        badge: '🏅',
        tier: 'platinum',
        celebration: 'victoryAnimation'
      }
    ],

    // Referral Achievements
    referrals: [
      {
        id: 'first_referral',
        name: 'Friend Bringer 👥',
        description: 'Refer your first friend',
        points: 100,
        bonus: '₦1,000',
        badge: '🤝'
      },
      {
        id: 'referral_master',
        name: 'Referral Master 🌟',
        description: 'Refer 10 friends who complete KYC',
        points: 2500,
        bonus: '₦25,000',
        badge: '👑',
        tier: 'platinum'
      }
    ]
  };

  // Reward Points System
  points: {
    total: number;
    available: number;
    redeemed: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    nextTier: {
      name: string;
      pointsNeeded: number;
      benefits: string[];
    };
  };

  // Reward Catalog (what points can buy)
  catalog: [
    {
      id: 'transfer_fee_waiver',
      name: 'Free Transfer',
      description: 'Waive fees on your next 5 transfers',
      cost: 500,
      icon: '💸',
      category: 'banking'
    },
    {
      id: 'cashback_boost',
      name: '2x Cashback Boost',
      description: 'Double cashback for 30 days',
      cost: 1000,
      icon: '🚀',
      category: 'benefits'
    },
    {
      id: 'airtime',
      name: '₦500 Airtime',
      description: 'Redeem for airtime',
      cost: 450,
      icon: '📱',
      category: 'utilities'
    },
    {
      id: 'premium_card',
      name: 'Premium Card Design',
      description: 'Unlock exclusive card designs',
      cost: 2000,
      icon: '💳',
      category: 'premium'
    }
  ];

  // Daily Challenges (Nubank-style)
  daily_challenges: [
    {
      id: 'daily_login',
      name: 'Daily Check-in ✅',
      description: 'Open the app today',
      points: 5,
      expiry: '24h',
      completed: boolean
    },
    {
      id: 'transaction_today',
      name: 'Stay Active 💪',
      description: 'Make any transaction today',
      points: 10,
      expiry: '24h'
    },
    {
      id: 'financial_tip',
      name: 'Learn Something New 📚',
      description: 'Read today\'s financial tip',
      points: 5,
      expiry: '24h'
    }
  ];

  // Streaks (engagement driver)
  streaks: {
    current: number;
    longest: number;
    type: 'login' | 'savings' | 'budget';
    bonusPoints: number;
    milestones: [
      { days: 7, reward: '🔥 Week Streak - 50 points' },
      { days: 30, reward: '🚀 Month Streak - 500 points' },
      { days: 100, reward: '💎 Century - 2000 points' }
    ];
  };
}
```

#### **2. Achievement Unlock Animation**

```typescript
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const AchievementUnlockModal = ({ achievement, onClose }) => {
  const { theme } = useTenantTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  }, []);

  return (
    <Modal transparent animationType="none">
      <View style={styles.achievementOverlay}>
        {/* Confetti Animation */}
        {achievement.celebration === 'confetti' && (
          <LottieView
            source={require('../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Achievement Card */}
        <Animated.View style={[
          styles.achievementCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim
          }
        ]}>
          {/* Badge Icon */}
          <View style={[
            styles.badgeContainer,
            { backgroundColor: getTierColor(achievement.tier, theme) }
          ]}>
            <Text style={styles.badgeEmoji}>{achievement.badge}</Text>
          </View>

          {/* Achievement Details */}
          <Typography.Headline size="medium" style={styles.achievementName}>
            {achievement.name}
          </Typography.Headline>

          <Typography.Body size="small" style={styles.achievementDesc}>
            {achievement.description}
          </Typography.Body>

          {/* Points Earned */}
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsIcon}>✨</Text>
            <Typography.Headline size="small" style={{ color: theme.colors.reward.gold }}>
              +{achievement.points} points
            </Typography.Headline>
          </View>

          {/* Bonus Reward (if any) */}
          {achievement.bonus && (
            <View style={[styles.bonusContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={styles.bonusText}>
                🎁 Bonus: {achievement.bonus}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const getTierColor = (tier, theme) => {
  const colors = {
    bronze: theme.colors.reward.bronze,
    silver: theme.colors.reward.silver,
    gold: theme.colors.reward.gold,
    platinum: theme.colors.reward.platinum
  };
  return colors[tier] || theme.colors.primary;
};
```

#### **3. Rewards Dashboard Screen**

```typescript
const RewardsDashboardScreen = () => {
  const { theme } = useTenantTheme();
  const [rewardData, setRewardData] = useState<RewardSystem | null>(null);

  return (
    <View style={styles.container(theme)}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Points */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
              Your Reward Points
            </Typography.Body>

            <Typography.Display size="large" style={{ color: theme.colors.reward.gold }}>
              {rewardData?.points.available.toLocaleString()}
            </Typography.Display>

            {/* Tier Badge */}
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(rewardData?.points.tier, theme) }]}>
              <Text style={styles.tierText}>
                {rewardData?.points.tier.toUpperCase()} MEMBER
              </Text>
            </View>

            {/* Progress to Next Tier */}
            <View style={styles.tierProgress}>
              <Typography.Body size="small">
                {rewardData?.points.nextTier.pointsNeeded} points to {rewardData?.points.nextTier.name}
              </Typography.Body>
              <ProgressBar
                progress={rewardData?.points.available / rewardData?.points.nextTier.pointsNeeded}
                color={theme.colors.reward.gold}
              />
            </View>
          </View>
        </GlassCard>

        {/* Daily Challenges */}
        <SectionHeader
          title="Daily Challenges"
          subtitle="Complete challenges to earn bonus points"
        />

        <View style={styles.challengesGrid}>
          {rewardData?.daily_challenges.map(challenge => (
            <DailyChallengeCard
              key={challenge.id}
              challenge={challenge}
              theme={theme}
            />
          ))}
        </View>

        {/* Current Streak */}
        <GlassCard style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Typography.Headline size="small">
                {rewardData?.streaks.current} Day Streak!
              </Typography.Headline>
              <Typography.Body size="small" style={{ color: theme.colors.text.secondary }}>
                Keep it going! Your longest: {rewardData?.streaks.longest} days
              </Typography.Body>
            </View>
          </View>

          {/* Streak Milestones */}
          <View style={styles.milestones}>
            {rewardData?.streaks.milestones.map((milestone, index) => (
              <StreakMilestone
                key={index}
                milestone={milestone}
                current={rewardData.streaks.current}
                achieved={rewardData.streaks.current >= milestone.days}
                theme={theme}
              />
            ))}
          </View>
        </GlassCard>

        {/* Achievements Grid */}
        <SectionHeader
          title="Achievements"
          subtitle="Track your banking milestones"
          action={{
            label: 'View All',
            onPress: () => navigate('AllAchievements')
          }}
        />

        <View style={styles.achievementsGrid}>
          {Object.values(rewardData?.achievements || {}).flat().slice(0, 6).map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              theme={theme}
            />
          ))}
        </View>

        {/* Reward Catalog */}
        <SectionHeader
          title="Redeem Rewards"
          subtitle="Use your points for amazing benefits"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.catalogScroll}>
            {rewardData?.catalog.map(reward => (
              <RewardCatalogCard
                key={reward.id}
                reward={reward}
                userPoints={rewardData.points.available}
                theme={theme}
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};
```

#### **4. Achievement Card Component**

```typescript
const AchievementCard = ({ achievement, theme }) => {
  const isUnlocked = achievement.unlocked;
  const hasProgress = achievement.progress;

  return (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        !isUnlocked && styles.achievementCardLocked
      ]}
      activeOpacity={0.8}
    >
      {/* Badge */}
      <View style={[
        styles.achievementBadge,
        {
          backgroundColor: isUnlocked
            ? getTierColor(achievement.tier, theme)
            : '#e0e0e0'
        }
      ]}>
        <Text style={[
          styles.achievementBadgeEmoji,
          !isUnlocked && styles.grayscale
        ]}>
          {achievement.badge}
        </Text>
      </View>

      {/* Achievement Name */}
      <Typography.Body
        size="small"
        style={[
          styles.achievementName,
          !isUnlocked && { color: theme.colors.text.light }
        ]}
      >
        {achievement.name}
      </Typography.Body>

      {/* Progress (if applicable) */}
      {hasProgress && !isUnlocked && (
        <View style={styles.achievementProgress}>
          <ProgressBar
            progress={achievement.progress.current / achievement.progress.total}
            height={4}
            color={theme.colors.primary}
          />
          <Typography.Body size="small" style={styles.progressText}>
            {achievement.progress.current}/{achievement.progress.total}
          </Typography.Body>
        </View>
      )}

      {/* Points */}
      <View style={styles.achievementPoints}>
        <Text style={styles.pointsIcon}>✨</Text>
        <Typography.Body size="small" style={{ color: theme.colors.reward.gold }}>
          {achievement.points}
        </Typography.Body>
      </View>

      {/* Unlocked Checkmark */}
      {isUnlocked && (
        <View style={styles.unlockedBadge}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

#### **5. Daily Challenge Card**

```typescript
const DailyChallengeCard = ({ challenge, theme }) => {
  const isCompleted = challenge.completed;

  return (
    <TouchableOpacity
      style={[
        styles.challengeCard,
        isCompleted && styles.challengeCardCompleted
      ]}
      onPress={() => handleChallengePress(challenge)}
      disabled={isCompleted}
    >
      <View style={styles.challengeHeader}>
        <Typography.Body size="medium" numberOfLines={1}>
          {challenge.name}
        </Typography.Body>

        {!isCompleted ? (
          <View style={[styles.challengePoints, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={styles.pointsText}>+{challenge.points}</Text>
          </View>
        ) : (
          <View style={[styles.completedBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.completedIcon}>✓</Text>
          </View>
        )}
      </View>

      <Typography.Body size="small" style={{ color: theme.colors.text.secondary }}>
        {challenge.description}
      </Typography.Body>

      {/* Timer */}
      {!isCompleted && (
        <View style={styles.challengeTimer}>
          <Text style={styles.timerIcon}>⏰</Text>
          <Typography.Body size="small" style={{ color: theme.colors.warning }}>
            Expires in {challenge.expiry}
          </Typography.Body>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

#### **6. Reward Catalog Card**

```typescript
const RewardCatalogCard = ({ reward, userPoints, theme }) => {
  const canAfford = userPoints >= reward.cost;

  return (
    <GlassCard style={styles.catalogCard}>
      {/* Reward Icon */}
      <View style={[
        styles.rewardIcon,
        { backgroundColor: theme.colors.primary + '15' }
      ]}>
        <Text style={styles.rewardEmoji}>{reward.icon}</Text>
      </View>

      {/* Reward Name */}
      <Typography.Body size="medium" style={styles.rewardName}>
        {reward.name}
      </Typography.Body>

      {/* Description */}
      <Typography.Body size="small" style={styles.rewardDesc}>
        {reward.description}
      </Typography.Body>

      {/* Cost */}
      <View style={styles.rewardCost}>
        <Text style={styles.costIcon}>✨</Text>
        <Typography.Headline size="small" style={{ color: theme.colors.reward.gold }}>
          {reward.cost}
        </Typography.Headline>
      </View>

      {/* Redeem Button */}
      <TouchableOpacity
        style={[
          styles.redeemButton,
          {
            backgroundColor: canAfford ? theme.colors.primary : '#e0e0e0'
          }
        ]}
        onPress={() => handleRedeem(reward)}
        disabled={!canAfford}
      >
        <Text style={[
          styles.redeemText,
          { color: canAfford ? '#fff' : theme.colors.text.light }
        ]}>
          {canAfford ? 'Redeem' : `Need ${reward.cost - userPoints} more`}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
};
```

#### **7. Streak Milestone Component**

```typescript
const StreakMilestone = ({ milestone, current, achieved, theme }) => {
  const progress = Math.min(current / milestone.days, 1);

  return (
    <View style={styles.milestoneContainer}>
      {/* Progress Ring */}
      <CircularProgress
        size={60}
        progress={progress}
        color={achieved ? theme.colors.success : theme.colors.text.light}
        backgroundColor="#f0f0f0"
        strokeWidth={4}
      >
        <Text style={[
          styles.milestoneDays,
          { color: achieved ? theme.colors.success : theme.colors.text.secondary }
        ]}>
          {milestone.days}
        </Text>
      </CircularProgress>

      {/* Reward */}
      <Typography.Body
        size="small"
        style={[
          styles.milestoneReward,
          achieved && { color: theme.colors.success }
        ]}
      >
        {milestone.reward}
      </Typography.Body>

      {/* Achievement Badge */}
      {achieved && (
        <View style={[styles.achievedBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.achievedIcon}>✓</Text>
        </View>
      )}
    </View>
  );
};
```

---

## AI Assistant Design

### 🤖 **Cleo AI-Inspired Conversational Banking**

The AI Assistant ("Oroki") is a **core differentiator** that transforms banking from transactional to conversational. Inspired by Cleo AI (the world's best banking AI), our assistant combines personality, proactivity, and intelligence.

#### **Why Cleo AI is the Gold Standard:**
- **95% user satisfaction** with AI interactions
- **Most human-like personality** in digital banking
- **Proactive insights** that users actually want
- **Behavioral change** - users improve financial habits
- **Entertainment value** - makes finance fun

### 🎯 **AI Assistant Philosophy**

```typescript
// Core AI Principles
const AI_PHILOSOPHY = {
  personality: {
    human: true,              // Never robotic or corporate
    helpful: true,            // Solve problems, don't create them
    honest: true,             // Brutally honest about finances
    encouraging: true,        // Supportive, never judgmental
    fun: true,                // Financial advice can be enjoyable
    culturally_aware: true    // Understands Nigerian context
  },

  interaction: {
    conversational: true,     // Like chatting with a friend
    proactive: true,          // Reaches out with insights
    contextual: true,         // Remembers conversation history
    multimodal: true,         // Text, voice, visual
    instant: true             // Real-time responses
  },

  intelligence: {
    predictive: true,         // Anticipates user needs
    analytical: true,         // Finds patterns in spending
    educational: true,        // Explains financial concepts
    personalized: true        // Adapts to individual behavior
  }
};
```

### 🎨 **AI Personality Configuration**

```typescript
interface OrokiAIPersonality {
  // Identity
  identity: {
    name: 'Oroki';                    // Friendly, memorable Nigerian name
    avatar: 'animated_robot';          // Expressive animated character
    pronouns: 'they/them';             // Inclusive
    tagline: 'Your AI financial bestie 🤖';
  };

  // Personality Modes (user-selectable)
  modes: {
    friendly: {
      tone: 'warm, supportive, encouraging',
      formality: 3,                    // 1-10 scale (3 = casual-friendly)
      humor: 'light, occasional',
      emojis: 'frequent',
      examples: [
        "Hey! 👋 I noticed you're getting close to your savings goal!",
        "Great job staying within budget this week! 💪",
        "Heads up - you've got a bill due tomorrow. Want me to pay it?"
      ]
    },

    professional: {
      tone: 'formal, detailed, analytical',
      formality: 8,                    // More formal
      humor: 'minimal',
      emojis: 'rare',
      examples: [
        "Good afternoon. Your monthly spending analysis is ready.",
        "Based on your transaction history, I recommend adjusting your budget.",
        "Your savings goal progress: 73% complete, ₦54,000 remaining."
      ]
    },

    playful: {
      tone: 'fun, casual, uses memes & slang',
      formality: 2,                    // Very casual
      humor: 'frequent, witty',
      emojis: 'extensive',
      gifs: true,
      examples: [
        "Yo! You just spent ₦15k on food delivery. Again. 😅",
        "YESSS! You hit your savings goal! Time to celebrate! 🎉🎊",
        "Bruh... another Uber? Your legs still work, right? 🚶‍♂️😂"
      ]
    },

    roastMode: {
      enabled: false,                  // Opt-in only!
      tone: 'sarcastic, playful teasing',
      formality: 1,                    // Super casual
      humor: 'savage (but loving)',
      optIn: true,                     // Requires user consent
      examples: [
        "₦80,000 on clothes this month?! Are you opening a boutique? 👗💸",
        "You've bought airtime 47 times. Ever heard of DATA PLANS? 📱",
        "Third Uber this week. Are you allergic to walking? 🚗😂",
        "₦50k on takeout? The economy is tough but your cooking is tougher! 🍕"
      ]
    }
  };

  // Cultural Adaptation (Nigerian Context)
  cultural: {
    language: ['english', 'pidgin'],   // Can speak Nigerian Pidgin!
    currency: '₦',
    dateFormat: 'DD/MM/YYYY',
    localContext: true,                // Understands local services
    examples: [
      "Your DSTV subscription is due tomorrow o! 📺",
      "Omo! You don spend ₦25k on Bolt this week! 🚗",
      "Abeg, make you save small money for rainy day 💰"
    ]
  };

  // Adaptive Intelligence
  adaptation: {
    learnsUserPreferences: true,       // Adapts to user's style
    remembersContext: true,            // Recalls previous conversations
    personalizes: true,                // Custom insights per user
    improves: true                     // Gets smarter over time
  };
}
```

### 💬 **AI Chat Interface Components**

#### **1. Main Chat Screen**

```typescript
const AIAssistantChatScreen = () => {
  const { theme } = useTenantTheme();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiPersonality, setAIPersonality] = useState<'friendly' | 'professional' | 'playful'>('friendly');
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.chatContainer(theme)}>
      {/* Animated Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* AI Avatar with Status */}
        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            {/* Animated Lottie Avatar */}
            <LottieView
              source={require('../../assets/animations/oroki-avatar.json')}
              autoPlay
              loop
              style={styles.avatar}
            />
            {/* Online Status Indicator */}
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
          </View>

          <View style={styles.aiInfo}>
            <Typography.Headline size="small">
              Oroki
            </Typography.Headline>
            <View style={styles.statusRow}>
              <View style={[styles.miniDot, { backgroundColor: theme.colors.success }]} />
              <Typography.Body size="small" style={{ color: theme.colors.success }}>
                Online · Ready to help
              </Typography.Body>
            </View>
          </View>
        </View>

        {/* Personality Selector & Settings */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.personalityButton}
            onPress={() => setShowPersonalityMenu(true)}
          >
            <Text style={styles.personalityIcon}>
              {aiPersonality === 'friendly' ? '🤗' : aiPersonality === 'professional' ? '🎓' : '🎭'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigate('AISettings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollToBottom()}
      >
        {/* Welcome State (empty conversation) */}
        {messages.length === 0 && (
          <WelcomeMessage personality={aiPersonality} theme={theme} />
        )}

        {/* Message List */}
        {messages.map((message, index) => (
          <AIMessage
            key={message.id || index}
            message={message}
            theme={theme}
            personality={aiPersonality}
            onQuickReply={handleQuickReply}
            onActionPress={handleMessageAction}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <TypingIndicator theme={theme} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputSection}
      >
        {/* Suggested Quick Replies */}
        {suggestedReplies.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsScroll}
            contentContainerStyle={styles.suggestionsContent}
          >
            {suggestedReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionChip, { borderColor: theme.colors.primary }]}
                onPress={() => handleSuggestionPress(reply)}
              >
                <Text style={styles.suggestionIcon}>{reply.icon}</Text>
                <Text style={styles.suggestionText}>{reply.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Row */}
        <View style={styles.inputRow}>
          {/* Attachment Button */}
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachment}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me anything..."
              placeholderTextColor={theme.colors.text.light}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? theme.colors.primary
                  : theme.colors.text.light + '30'
              }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Input Button */}
        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleVoiceInput}
          onLongPress={startVoiceRecording}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
          <Typography.Body size="small" style={{ color: '#fff', marginTop: 4 }}>
            {isRecording ? 'Recording...' : 'Hold to speak'}
          </Typography.Body>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};
```

#### **2. Welcome Message Component**

```typescript
const WelcomeMessage = ({ personality, theme }) => {
  const greetings = {
    friendly: {
      icon: '👋',
      title: 'Hey there! I\'m Oroki',
      message: 'Your AI financial assistant. I can help you manage money, track spending, save smarter, and even roast your bad habits if you want! 😄',
      tagline: 'What would you like to do today?'
    },
    professional: {
      icon: '🤖',
      title: 'Welcome to Oroki AI',
      message: 'I\'m your AI-powered financial assistant, providing insights, analytics, and personalized recommendations to optimize your financial management.',
      tagline: 'How may I assist you?'
    },
    playful: {
      icon: '🎉',
      title: 'Yo! Oroki here!',
      message: 'Your financial bestie is in the house! 🏠 I\'m here to help you stack that paper, track your spending (even the embarrassing stuff 😂), and keep you on your A-game! 💪',
      tagline: 'What\'s good?'
    }
  };

  const greeting = greetings[personality];

  return (
    <View style={styles.welcomeContainer}>
      {/* Animated Welcome Icon */}
      <Animated.View style={styles.welcomeIcon}>
        <Text style={styles.welcomeEmoji}>{greeting.icon}</Text>
      </Animated.View>

      {/* Welcome Text */}
      <Typography.Headline size="large" style={styles.welcomeTitle}>
        {greeting.title}
      </Typography.Headline>

      <Typography.Body size="medium" style={styles.welcomeMessage}>
        {greeting.message}
      </Typography.Body>

      <Typography.Body size="small" style={[styles.welcomeTagline, { color: theme.colors.text.secondary }]}>
        {greeting.tagline}
      </Typography.Body>

      {/* Quick Action Cards */}
      <View style={styles.quickActionsGrid}>
        <QuickActionCard
          icon="💰"
          title="Check Balance"
          description="What's my balance?"
          onPress={() => handleQuickAction('balance')}
          theme={theme}
        />
        <QuickActionCard
          icon="📊"
          title="Spending Report"
          description="Where did my money go?"
          onPress={() => handleQuickAction('spending')}
          theme={theme}
        />
        <QuickActionCard
          icon="🎯"
          title="Savings Goals"
          description="Help me save more"
          onPress={() => handleQuickAction('savings')}
          theme={theme}
        />
        <QuickActionCard
          icon="🔥"
          title="Roast Me"
          description="Roast my spending"
          onPress={() => handleQuickAction('roast')}
          theme={theme}
        />
      </View>

      {/* Feature Highlights */}
      <View style={styles.featuresContainer}>
        <Typography.Body size="small" style={{ color: theme.colors.text.light, marginBottom: 12 }}>
          I can help you with:
        </Typography.Body>

        <FeatureHighlight icon="💸" text="Send money & pay bills" />
        <FeatureHighlight icon="📈" text="Track & analyze spending" />
        <FeatureHighlight icon="🎯" text="Set & reach savings goals" />
        <FeatureHighlight icon="💡" text="Get personalized insights" />
        <FeatureHighlight icon="🔔" text="Proactive alerts & reminders" />
        <FeatureHighlight icon="🎓" text="Learn about personal finance" />
      </View>
    </View>
  );
};

const FeatureHighlight = ({ icon, text }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Typography.Body size="small">{text}</Typography.Body>
  </View>
);
```

#### **3. AI Message Component**

```typescript
const AIMessage = ({ message, theme, personality, onQuickReply, onActionPress }) => {
  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser && styles.userMessageRow
      ]}
      entering={FadeInDown.duration(300)}
    >
      {/* AI Avatar */}
      {isAI && (
        <View style={styles.messageAvatar}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        </View>
      )}

      {/* Message Content */}
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble(theme) : styles.aiBubble(theme)
      ]}>
        {/* Message Text */}
        <Typography.Body
          size="medium"
          style={{
            color: isUser ? '#fff' : theme.colors.text.primary,
            lineHeight: 22
          }}
        >
          {message.text}
        </Typography.Body>

        {/* Message Attachments (Rich Content) */}
        {message.attachments && message.attachments.map((attachment, index) => (
          <View key={index} style={styles.attachmentContainer}>
            <MessageAttachment
              attachment={attachment}
              theme={theme}
              onPress={onActionPress}
            />
          </View>
        ))}

        {/* Quick Reply Buttons */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <View style={styles.quickRepliesContainer}>
            {message.quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickReplyButton, { borderColor: theme.colors.primary }]}
                onPress={() => onQuickReply(reply)}
              >
                {reply.icon && <Text style={styles.quickReplyIcon}>{reply.icon}</Text>}
                <Text style={[styles.quickReplyText, { color: theme.colors.primary }]}>
                  {reply.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timestamp */}
        <View style={styles.messageFooter}>
          <Typography.Body
            size="small"
            style={{
              color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.text.light,
              marginTop: 4
            }}
          >
            {formatMessageTime(message.timestamp)}
          </Typography.Body>

          {/* Delivery Status (for user messages) */}
          {isUser && (
            <Text style={styles.deliveryStatus}>
              {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '⏱️'}
            </Text>
          )}
        </View>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={styles.messageAvatar}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.secondary + '20' }]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};
```

#### **4. Message Attachments (Rich Content)**

```typescript
const MessageAttachment = ({ attachment, theme, onPress }) => {
  switch (attachment.type) {
    case 'balance_card':
      return (
        <GlassCard style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
              Total Balance
            </Typography.Body>
            <Text style={styles.balanceIcon}>💰</Text>
          </View>
          <Typography.Amount value={attachment.data.balance} size="large" />
          <View style={styles.balanceFooter}>
            <View style={styles.balanceChange}>
              <Text style={styles.changeIcon}>
                {attachment.data.change >= 0 ? '↑' : '↓'}
              </Text>
              <Typography.Body
                size="small"
                style={{
                  color: attachment.data.change >= 0 ? theme.colors.success : theme.colors.error
                }}
              >
                {Math.abs(attachment.data.change)}% this month
              </Typography.Body>
            </View>
          </View>
        </GlassCard>
      );

    case 'spending_chart':
      return (
        <View style={styles.chartCard}>
          <Typography.Body size="small" style={{ marginBottom: 8 }}>
            Spending This Month
          </Typography.Body>
          <SpendingMiniChart data={attachment.data} theme={theme} />
          <TouchableOpacity
            style={styles.chartAction}
            onPress={() => onPress({ action: 'view_full_chart', data: attachment.data })}
          >
            <Text style={[styles.chartActionText, { color: theme.colors.primary }]}>
              View detailed breakdown →
            </Text>
          </TouchableOpacity>
        </View>
      );

    case 'savings_goal':
      return (
        <GlassCard style={styles.savingsGoalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalIcon}>{attachment.data.icon || '🎯'}</Text>
            <Typography.Body size="medium">{attachment.data.name}</Typography.Body>
          </View>

          {/* Progress Ring */}
          <View style={styles.goalProgress}>
            <CircularProgress
              size={80}
              progress={attachment.data.current / attachment.data.target}
              color={theme.colors.primary}
              backgroundColor="#f0f0f0"
              strokeWidth={8}
            >
              <Typography.Body size="small" style={{ fontWeight: '600' }}>
                {Math.round((attachment.data.current / attachment.data.target) * 100)}%
              </Typography.Body>
            </CircularProgress>

            <View style={styles.goalDetails}>
              <Typography.Amount value={attachment.data.current} size="small" />
              <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
                of {formatCurrency(attachment.data.target)}
              </Typography.Body>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.goalAction, { backgroundColor: theme.colors.primary }]}
            onPress={() => onPress({ action: 'add_to_goal', data: attachment.data })}
          >
            <Text style={styles.goalActionText}>Add Money</Text>
          </TouchableOpacity>
        </GlassCard>
      );

    case 'transaction_list':
      return (
        <View style={styles.transactionListCard}>
          <Typography.Body size="small" style={{ marginBottom: 12 }}>
            Recent Transactions
          </Typography.Body>
          {attachment.data.transactions.slice(0, 3).map((transaction, index) => (
            <TransactionMiniItem
              key={index}
              transaction={transaction}
              theme={theme}
            />
          ))}
          {attachment.data.transactions.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => onPress({ action: 'view_all_transactions' })}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                View all {attachment.data.transactions.length} transactions →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );

    case 'action_card':
      return (
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: theme.colors.primary }]}
          onPress={() => onPress(attachment.data.action)}
        >
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardIcon}>{attachment.data.icon}</Text>
            <View style={{ flex: 1 }}>
              <Typography.Body size="medium" style={{ fontWeight: '600' }}>
                {attachment.data.title}
              </Typography.Body>
              <Typography.Body size="small" style={{ color: theme.colors.text.secondary }}>
                {attachment.data.description}
              </Typography.Body>
            </View>
            <Text style={[styles.actionArrow, { color: theme.colors.primary }]}>→</Text>
          </View>
        </TouchableOpacity>
      );

    case 'insight_card':
      return (
        <View style={[styles.insightCard, { backgroundColor: getInsightColor(attachment.data.type) + '15' }]}>
          <Text style={styles.insightIcon}>{getInsightIcon(attachment.data.type)}</Text>
          <Typography.Body size="medium" style={{ marginTop: 8 }}>
            {attachment.data.message}
          </Typography.Body>
          {attachment.data.action && (
            <TouchableOpacity
              style={styles.insightAction}
              onPress={() => onPress(attachment.data.action)}
            >
              <Text style={[styles.insightActionText, { color: theme.colors.primary }]}>
                {attachment.data.action.label} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );

    default:
      return null;
  }
};

const getInsightIcon = (type) => {
  const icons = {
    tip: '💡',
    warning: '⚠️',
    success: '🎉',
    info: 'ℹ️',
    alert: '🔔'
  };
  return icons[type] || '💡';
};

const getInsightColor = (type) => {
  const colors = {
    tip: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#6366f1',
    alert: '#ef4444'
  };
  return colors[type] || '#3b82f6';
};
```

### 🔮 **Proactive AI Insights System**

#### **Cleo-Style Proactive Notifications**

```typescript
// Proactive Insight Engine
interface ProactiveInsight {
  id: string;
  type: 'spending_alert' | 'savings_opportunity' | 'goal_update' | 'roast' | 'celebration';
  trigger: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
  urgency: 'low' | 'medium' | 'high';
  personality: 'friendly' | 'professional' | 'playful';
  dismissible: boolean;
  expiresAt?: Date;
}

const ProactiveInsightsEngine = {
  // Spending Alerts (Cleo-inspired)
  spendingAlerts: [
    {
      trigger: 'unusual_spending_detected',
      friendly: "Hey! 👋 You've spent ₦{amount} on {category} this week. That's {percentage}% more than usual. Everything okay?",
      professional: "Alert: Your {category} spending is {percentage}% above average. Current: ₦{amount}, Typical: ₦{typical}.",
      playful: "Whoa there! 😱 ₦{amount} on {category}?! That's like... {comparison}! You good, bro?",
      action: {
        label: 'View breakdown',
        screen: 'SpendingAnalytics'
      },
      urgency: 'medium'
    },
    {
      trigger: 'approaching_budget_limit',
      friendly: "Heads up! You've used {percentage}% of your {category} budget. Only ₦{remaining} left this month. 📊",
      professional: "Budget Alert: {category} budget at {percentage}% capacity. Remaining: ₦{remaining}.",
      playful: "Omo! You don chop {percentage}% of your {category} budget o! Only ₦{remaining} left. Cool down! 😅",
      action: {
        label: 'Adjust budget',
        screen: 'BudgetManager'
      },
      urgency: 'high'
    },
    {
      trigger: 'duplicate_subscription_detected',
      friendly: "I noticed you're paying for both {service1} and {service2}. Do you really need both? 🤔",
      professional: "Subscription Analysis: Potential duplicate services detected - {service1} and {service2}.",
      playful: "Bro, you dey pay for {service1} AND {service2}?! Make we cancel one abeg! 💸",
      action: {
        label: 'Review subscriptions',
        screen: 'Subscriptions'
      },
      urgency: 'low'
    },
    {
      trigger: 'expensive_purchase_detected',
      friendly: "Just checking in! That ₦{amount} purchase was quite large. Need help tracking it?",
      professional: "Large Transaction Alert: ₦{amount} purchase recorded at {merchant}.",
      playful: "₦{amount}?! WHAT DID YOU BUY?! 🤯 Please tell me it was worth it!",
      urgency: 'medium'
    }
  ],

  // Savings Opportunities
  savingsOpportunities: [
    {
      trigger: 'money_sitting_idle',
      friendly: "You've got ₦{amount} sitting idle in your account. Want me to help you invest it? 💰",
      professional: "Investment Opportunity: ₦{amount} available for allocation. Potential returns: {rate}% APY.",
      playful: "Your ₦{amount} is just chilling there doing nothing! Put it to work! 🏃‍♂️💨",
      action: {
        label: 'See investment options',
        screen: 'Investments'
      },
      potentialReturn: '12% APY'
    },
    {
      trigger: 'round_up_suggestion',
      friendly: "If you'd rounded up your last 20 transactions, you'd have saved ₦{amount}. Enable it? 🎯",
      professional: "Savings Analysis: Round-up feature could generate ₦{amount} monthly savings based on current transaction patterns.",
      playful: "Yo! You could've saved ₦{amount} just by rounding up! That's free money! Enable am! 💵",
      action: {
        label: 'Enable round-ups',
        handler: () => enableRoundUps()
      }
    },
    {
      trigger: 'payday_savings_reminder',
      friendly: "Payday tomorrow! 🎉 Want to automatically save {percentage}% like last month?",
      professional: "Automated Savings: Your salary is scheduled for tomorrow. Configure automatic transfer to savings?",
      playful: "Salary day tomorrow! Time to save before you spend it all! 😂 Enable auto-save?",
      action: {
        label: 'Set up auto-save',
        screen: 'AutoSavings'
      }
    }
  ],

  // Goal Tracking Updates
  goalTracking: [
    {
      trigger: 'goal_milestone_reached',
      friendly: "Awesome! You're {percentage}% of the way to your '{goal_name}' goal! Just ₦{remaining} to go! 🎉",
      professional: "Goal Progress Update: '{goal_name}' - {percentage}% complete. Remaining: ₦{remaining}.",
      playful: "YESSS! You don reach {percentage}% for your '{goal_name}' goal! {percentage} more to go! Keep am up! 💪",
      celebration: true,
      rewardPoints: 50
    },
    {
      trigger: 'goal_behind_schedule',
      friendly: "Your '{goal_name}' savings is a bit behind. Save ₦{weekly_amount} weekly to catch up. 💪",
      professional: "Goal Status: '{goal_name}' is {days} days behind schedule. Required weekly contribution: ₦{weekly_amount}.",
      playful: "Omo, your '{goal_name}' goal dey fall behind o! You fit save ₦{weekly_amount} weekly? Let's go! 🏃",
      action: {
        label: 'Adjust savings plan',
        screen: 'GoalDetails'
      }
    },
    {
      trigger: 'goal_completed',
      friendly: "CONGRATULATIONS! 🎊 You reached your '{goal_name}' goal! ₦{amount} saved! You're amazing!",
      professional: "Goal Achievement: '{goal_name}' successfully completed. Total saved: ₦{amount}.",
      playful: "YOOOO! You just crushed your '{goal_name}' goal! ₦{amount} in the bag! 🏆🎉 LEGEND!",
      celebration: true,
      confetti: true,
      rewardPoints: 500
    }
  ],

  // Roast Mode 🔥 (Opt-in only!)
  roastMode: [
    {
      trigger: 'excessive_category_spending',
      message: "₦{amount} on {category} this month?! Are you trying to single-handedly keep that industry alive? 😂",
      severity: 'light',
      optIn: true
    },
    {
      trigger: 'frequent_small_purchases',
      message: "You've made {count} transactions under ₦1,000 this week. Death by a thousand cuts much? 🔪💸",
      severity: 'medium',
      optIn: true
    },
    {
      trigger: 'ride_hailing_addiction',
      message: "₦{amount} on Uber/Bolt this week?! Your legs still work, right? Or did you forget? 🚶‍♂️😂",
      severity: 'medium',
      optIn: true
    },
    {
      trigger: 'food_delivery_excess',
      message: "You've ordered food delivery {count} times this month. The economy is tough but your cooking is tougher! 🍕😅",
      severity: 'light',
      optIn: true
    },
    {
      trigger: 'shopping_spree',
      message: "₦{amount} on clothes this month?! Are you opening a boutique or what?! 👗💸",
      severity: 'medium',
      optIn: true
    },
    {
      trigger: 'airtime_purchases',
      message: "You've bought airtime {count} times this week. Ever heard of data bundles? 📱🤦",
      severity: 'light',
      optIn: true
    }
  ],

  // Celebrations & Wins
  celebrations: [
    {
      trigger: 'savings_milestone',
      friendly: "YESSS! You just hit ₦{amount} in savings! That's like {comparison}! Keep crushing it! 🏆",
      professional: "Milestone Achievement: Total savings reached ₦{amount}. Compared to initial target, you are {percentage}% ahead.",
      playful: "BROOO! ₦{amount} in savings?! You're basically rich now! 💰🎉 Keep stacking!",
      celebration: 'confetti',
      rewardPoints: 100
    },
    {
      trigger: 'budget_adherence_streak',
      friendly: "You stayed within budget this month! That's what I'm talking about! Financial ninja! 🥷",
      professional: "Budget Compliance: Month successfully completed within allocated budget limits.",
      playful: "Omo! You comot this month without breaking budget! You too much! 🔥💪",
      celebration: 'fireworks',
      rewardPoints: 50
    },
    {
      trigger: 'debt_free',
      friendly: "YOU DID IT! All loans paid off! You're officially debt-free! Time to celebrate! 🎊🎉",
      professional: "Debt Clearance: All outstanding loan balances successfully cleared.",
      playful: "NO MORE DEBT! YOU'RE FREE! 🕊️ Time to pop champagne! 🍾 (responsibly of course 😂)",
      celebration: 'victoryAnimation',
      rewardPoints: 1000
    }
  ]
};
```

#### **Proactive Notification Component**

```typescript
const ProactiveInsightNotification = ({ insight, theme }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.insightNotification}
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(300)}
    >
      <GlassCard style={styles.insightCard}>
        {/* Oroki Avatar */}
        <View style={styles.insightHeader}>
          <View style={[styles.miniAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={styles.miniAvatarText}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Typography.Body size="small" style={{ fontWeight: '600' }}>
              Oroki noticed something
            </Typography.Body>
            <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
              Just now
            </Typography.Body>
          </View>
          {insight.dismissible && (
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.dismissIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Insight Message */}
        <Typography.Body size="medium" style={styles.insightMessage}>
          {insight.message}
        </Typography.Body>

        {/* Action Button */}
        {insight.action && (
          <TouchableOpacity
            style={[styles.insightActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              insight.action.handler();
              setVisible(false);
            }}
          >
            <Text style={styles.insightActionText}>{insight.action.label}</Text>
            <Text style={styles.insightActionArrow}>→</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </Animated.View>
  );
};
```

### 🎭 **AI Personality Settings Screen**

```typescript
const AIPersonalitySettingsScreen = () => {
  const { theme } = useTenantTheme();
  const [personality, setPersonality] = useState<'friendly' | 'professional' | 'playful'>('friendly');
  const [roastModeEnabled, setRoastModeEnabled] = useState(false);
  const [proactiveInsights, setProactiveInsights] = useState(true);
  const [language, setLanguage] = useState('english');

  return (
    <ScrollView style={styles.settingsContainer}>
      {/* Personality Selection */}
      <GlassCard>
        <SectionHeader
          title="AI Personality"
          subtitle="Choose how Oroki talks to you"
        />

        <PersonalityOption
          icon="🤗"
          name="Friendly"
          description="Warm, supportive, and encouraging. Like talking to a helpful friend."
          example="'Hey! You're doing great with your savings this month! 💪'"
          selected={personality === 'friendly'}
          onSelect={() => setPersonality('friendly')}
          theme={theme}
        />

        <PersonalityOption
          icon="🎓"
          name="Professional"
          description="Formal, detailed, and analytical. Perfect for serious financial management."
          example="'Your monthly savings rate is 15% above target. Well done.'"
          selected={personality === 'professional'}
          onSelect={() => setPersonality('professional')}
          theme={theme}
        />

        <PersonalityOption
          icon="🎭"
          name="Playful"
          description="Fun, casual, uses Nigerian slang and humor. Makes finance entertaining!"
          example="'Omo! You don save ₦50k this month! You too much! 🔥'"
          selected={personality === 'playful'}
          onSelect={() => setPersonality('playful')}
          theme={theme}
        />
      </GlassCard>

      {/* Roast Mode Toggle */}
      <GlassCard style={{ marginTop: 16 }}>
        <View style={styles.roastModeSection}>
          <View style={{ flex: 1 }}>
            <View style={styles.roastHeader}>
              <Typography.Headline size="small">
                Roast Mode 🔥
              </Typography.Headline>
              <View style={[styles.betaBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            </View>
            <Typography.Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
              Let Oroki playfully roast your spending habits. It's hilarious (and might help you save money)!
            </Typography.Body>

            {/* Roast Examples */}
            {roastModeEnabled && (
              <View style={styles.roastExamples}>
                <Typography.Body size="small" style={{ fontStyle: 'italic', color: theme.colors.text.light }}>
                  Example roasts:
                </Typography.Body>
                <Text style={styles.roastExample}>
                  "₦80k on food delivery?! The economy is tough but your cooking is tougher! 😂"
                </Text>
                <Text style={styles.roastExample}>
                  "Third Uber this week. Your legs still work, right? 🚶"
                </Text>
              </View>
            )}
          </View>

          <ModernToggle
            value={roastModeEnabled}
            onChange={setRoastModeEnabled}
            theme={theme}
          />
        </View>

        {roastModeEnabled && (
          <View style={[styles.roastWarning, { backgroundColor: theme.colors.warning + '15' }]}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Typography.Body size="small">
              Roast Mode is playful and meant to be fun. Oroki will never be mean or hurtful!
            </Typography.Body>
          </View>
        )}
      </GlassCard>

      {/* Proactive Insights Toggle */}
      <GlassCard style={{ marginTop: 16 }}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Typography.Headline size="small">
              Proactive Insights
            </Typography.Headline>
            <Typography.Body size="small" style={{ color: theme.colors.text.secondary }}>
              Let Oroki reach out with helpful tips and alerts
            </Typography.Body>
          </View>
          <ModernToggle
            value={proactiveInsights}
            onChange={setProactiveInsights}
            theme={theme}
          />
        </View>
      </GlassCard>

      {/* Language Selection */}
      <GlassCard style={{ marginTop: 16 }}>
        <SectionHeader
          title="Language"
          subtitle="Oroki can speak Nigerian Pidgin too!"
        />

        <LanguageOption
          flag="🇬🇧"
          name="English"
          example="'You've spent ₦50,000 on food this month'"
          selected={language === 'english'}
          onSelect={() => setLanguage('english')}
          theme={theme}
        />

        <LanguageOption
          flag="🇳🇬"
          name="Nigerian Pidgin"
          example="'You don spend ₦50,000 for chop this month o!'"
          selected={language === 'pidgin'}
          onSelect={() => setLanguage('pidgin')}
          theme={theme}
        />
      </GlassCard>

      {/* Test AI Button */}
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigate('AIChat')}
      >
        <Text style={styles.testButtonText}>Chat with Oroki</Text>
        <Text style={styles.testButtonIcon}>💬</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const PersonalityOption = ({ icon, name, description, example, selected, onSelect, theme }) => (
  <TouchableOpacity
    style={[
      styles.personalityOption,
      selected && styles.personalityOptionSelected(theme)
    ]}
    onPress={onSelect}
  >
    <View style={styles.personalityHeader}>
      <Text style={styles.personalityIcon}>{icon}</Text>
      <Typography.Headline size="small">{name}</Typography.Headline>
      {selected && (
        <View style={[styles.selectedBadge, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.selectedCheck}>✓</Text>
        </View>
      )}
    </View>

    <Typography.Body size="small" style={{ color: theme.colors.text.secondary }}>
      {description}
    </Typography.Body>

    <View style={[styles.exampleBubble, { backgroundColor: theme.colors.primary + '10' }]}>
      <Typography.Body size="small" style={{ fontStyle: 'italic' }}>
        {example}
      </Typography.Body>
    </View>
  </TouchableOpacity>
);
```

### 📊 **AI-Powered Analytics Integration**

```typescript
// AI-Enhanced Spending Analysis
const AISpendingInsights = ({ data, theme }) => {
  const insights = generateAIInsights(data);

  return (
    <GlassCard>
      <SectionHeader
        title="AI Insights"
        subtitle="What Oroki noticed about your spending"
      />

      {insights.map((insight, index) => (
        <AIInsightCard
          key={index}
          insight={insight}
          theme={theme}
        />
      ))}
    </GlassCard>
  );
};

const generateAIInsights = (data) => {
  const insights = [];

  // Spending pattern analysis
  if (data.currentMonth > data.lastMonth * 1.2) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Spending Alert',
      message: `You've spent ${((data.currentMonth / data.lastMonth - 1) * 100).toFixed(0)}% more this month`,
      action: {
        label: 'See breakdown',
        handler: () => navigate('SpendingBreakdown')
      }
    });
  }

  // Savings opportunity
  if (data.categoriesBreakdown.food > data.totalSpending * 0.3) {
    insights.push({
      type: 'tip',
      icon: '💡',
      title: 'Savings Opportunity',
      message: `You're spending ${((data.categoriesBreakdown.food / data.totalSpending) * 100).toFixed(0)}% on food. Cooking at home could save ₦${(data.categoriesBreakdown.food * 0.4).toLocaleString()}`,
      action: {
        label: 'Budget tips',
        handler: () => navigate('BudgetTips')
      }
    });
  }

  // Positive reinforcement
  if (data.savingsRate > 0.15) {
    insights.push({
      type: 'success',
      icon: '🎉',
      title: 'Great Job!',
      message: `You're saving ${(data.savingsRate * 100).toFixed(0)}% of your income. That's above the recommended 10%!`,
      rewardPoints: 50
    });
  }

  return insights;
};
```

---

## Data Visualization

### 📊 **Revolut-Inspired Analytics**

```typescript
// Spending Analytics Component
const SpendingAnalytics = ({ data, period }) => {
  const { theme } = useTenantTheme();

  return (
    <GlassCard>
      <SectionHeader
        title="Spending Breakdown"
        subtitle={`Last ${period}`}
      />

      {/* Interactive Donut Chart */}
      <View style={styles.chartContainer}>
        <DonutChart
          data={data.categories}
          total={data.total}
          colors={Object.values(theme.colors.categories)}
          onSegmentPress={(category) => showCategoryDetails(category)}
        />

        {/* Center Total */}
        <View style={styles.chartCenter}>
          <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
            Total Spent
          </Typography.Body>
          <Typography.Amount value={data.total} size="medium" />
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.categoryList}>
        {data.categories.map((category, index) => (
          <CategoryBreakdownItem
            key={category.name}
            category={category}
            color={Object.values(theme.colors.categories)[index]}
            percentage={(category.amount / data.total) * 100}
            theme={theme}
          />
        ))}
      </View>
    </GlassCard>
  );
};

// Category Breakdown Item
const CategoryBreakdownItem = ({ category, color, percentage, theme }) => {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        {/* Color Indicator */}
        <View style={[styles.categoryDot, { backgroundColor: color }]} />

        {/* Category Info */}
        <View>
          <Typography.Body size="medium">{category.name}</Typography.Body>
          <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
            {category.transactions} transactions
          </Typography.Body>
        </View>
      </View>

      <View style={styles.categoryRight}>
        <Typography.Amount value={category.amount} size="small" />
        <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
          {percentage.toFixed(1)}%
        </Typography.Body>
      </View>
    </TouchableOpacity>
  );
};

// Spending Trend Chart
const SpendingTrendChart = ({ data, theme }) => {
  return (
    <GlassCard>
      <SectionHeader title="Spending Trend" subtitle="Last 6 months" />

      <LineChart
        data={{
          labels: data.months,
          datasets: [{
            data: data.amounts,
            color: (opacity = 1) => theme.colors.primary,
            strokeWidth: 3
          }]
        }}
        width={screenWidth - 80}
        height={220}
        chartConfig={{
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          color: (opacity = 1) => theme.colors.primary,
          strokeWidth: 2,
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.colors.primary
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#e0e0e0'
          }
        }}
        bezier
        style={styles.chart}
        onDataPointClick={(data) => showMonthDetails(data)}
      />

      {/* Insight Card */}
      <View style={[styles.insightCard, { backgroundColor: theme.colors.info + '15' }]}>
        <Text style={styles.insightIcon}>💡</Text>
        <Typography.Body size="small">
          You spent 15% less this month compared to last month. Keep it up!
        </Typography.Body>
      </View>
    </GlassCard>
  );
};
```

---

## Micro-interactions & Animations

### ✨ **Nubank-Inspired Motion Design**

```typescript
// 1. Button Press Animation
const AnimatedButton = ({ onPress, children, variant = 'primary', style }) => {
  const { theme } = useTenantTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors[variant] },
          style
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// 2. Skeleton Loader (for loading states)
const SkeletonLoader = ({ variant = 'card', width, height }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  return (
    <View style={[styles.skeleton, { width, height }]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }]
          }
        ]}
      >
        <LinearGradient
          colors={['#f0f0f0', '#f8f8f8', '#f0f0f0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// 3. Pull to Refresh
const PullToRefresh = ({ onRefresh, children }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

// 4. Success Checkmark Animation
const SuccessCheckmark = ({ size = 80, color, onComplete }) => {
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      })
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  return (
    <View style={styles.successContainer}>
      <Animated.View
        style={[
          styles.successCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ scale: circleScale }]
          }
        ]}
      >
        <Animated.Text
          style={[
            styles.successCheck,
            {
              fontSize: size * 0.5,
              color,
              transform: [{ scale: checkScale }]
            }
          ]}
        >
          ✓
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

// 5. Amount Counter Animation
const AnimatedAmount = ({ value, duration = 1000, currency = '₦' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <Typography.Amount
      value={displayValue}
      currency={currency}
      size="large"
    />
  );
};
```

---

## Onboarding Experience

### 🚀 **Nubank-Style Conversational Onboarding**

```typescript
const OnboardingFlow = () => {
  const { theme } = useTenantTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'welcome',
      title: 'Hey there! 👋',
      message: `Welcome to ${theme.branding.name}! I'm here to help you set up your account. This will only take about 5 minutes.`,
      type: 'intro',
      action: 'Get Started'
    },
    {
      id: 'personal_info',
      title: 'Let\'s get to know you',
      message: 'First, tell us a bit about yourself. We need this to keep your account secure.',
      type: 'form',
      fields: ['firstName', 'lastName', 'dateOfBirth'],
      action: 'Continue'
    },
    {
      id: 'contact',
      title: 'How can we reach you?',
      message: 'We\'ll send you important updates and transaction alerts.',
      type: 'form',
      fields: ['phone', 'email'],
      action: 'Next'
    },
    {
      id: 'verification',
      title: 'Let\'s verify your phone',
      message: 'We\'ve sent a code to your phone. Enter it below to continue.',
      type: 'otp',
      action: 'Verify'
    },
    {
      id: 'security',
      title: 'Secure your account 🔐',
      message: 'Create a 4-digit PIN. You\'ll use this to approve transactions.',
      type: 'pin',
      action: 'Set PIN'
    },
    {
      id: 'biometric',
      title: 'Want faster access? 👆',
      message: 'Enable Touch ID or Face ID for quick and secure login.',
      type: 'biometric',
      action: 'Enable',
      skipable: true
    },
    {
      id: 'complete',
      title: 'You\'re all set! 🎉',
      message: `Congratulations! Your ${theme.branding.name} account is ready. You've just earned your first 50 reward points!`,
      type: 'celebration',
      action: 'Start Banking',
      achievement: {
        name: 'Account Created! 🎉',
        points: 50,
        badge: '🌟'
      }
    }
  ];

  return (
    <View style={styles.onboardingContainer(theme)}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: theme.colors.primary
              }
            ]}
          />
        </View>
        <Typography.Body size="small" style={{ color: theme.colors.text.light }}>
          Step {currentStep + 1} of {steps.length}
        </Typography.Body>
      </View>

      {/* Step Content */}
      <OnboardingStep
        step={steps[currentStep]}
        onContinue={() => handleStepComplete(currentStep)}
        onSkip={() => handleStepSkip(currentStep)}
        theme={theme}
      />
    </View>
  );
};

const OnboardingStep = ({ step, onContinue, onSkip, theme }) => {
  return (
    <Animated.View style={styles.stepContainer}>
      {/* Avatar/Mascot (optional) */}
      <View style={styles.mascotContainer}>
        <Text style={styles.mascot}>🤖</Text>
      </View>

      {/* Message Bubble */}
      <GlassCard style={styles.messageBubble}>
        <Typography.Headline size="medium">
          {step.title}
        </Typography.Headline>

        <Typography.Body size="medium" style={styles.message}>
          {step.message}
        </Typography.Body>
      </GlassCard>

      {/* Step Content */}
      <View style={styles.stepContent}>
        {step.type === 'form' && (
          <OnboardingForm fields={step.fields} />
        )}

        {step.type === 'otp' && (
          <OTPInput length={6} onComplete={onContinue} />
        )}

        {step.type === 'pin' && (
          <PINSetup onComplete={onContinue} />
        )}

        {step.type === 'biometric' && (
          <BiometricSetup onEnable={onContinue} onSkip={onSkip} />
        )}

        {step.type === 'celebration' && (
          <View style={styles.celebration}>
            <LottieView
              source={require('../../assets/animations/success.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />

            {/* Achievement Earned */}
            {step.achievement && (
              <View style={styles.achievementEarned}>
                <Text style={styles.achievementBadge}>{step.achievement.badge}</Text>
                <Typography.Body size="medium">
                  {step.achievement.name}
                </Typography.Body>
                <Typography.Body size="small" style={{ color: theme.colors.reward.gold }}>
                  +{step.achievement.points} points
                </Typography.Body>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {step.skipable && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
          >
            <Typography.Body size="medium" style={{ color: theme.colors.text.light }}>
              Skip for now
            </Typography.Body>
          </TouchableOpacity>
        )}

        <AnimatedButton
          onPress={onContinue}
          variant="primary"
          style={styles.continueButton}
        >
          <Typography.Body size="medium" style={{ color: '#fff' }}>
            {step.action}
          </Typography.Body>
        </AnimatedButton>
      </View>
    </Animated.View>
  );
};
```

---

## Gesture Patterns

### 👆 **Monzo-Inspired Swipe Actions**

```typescript
import { Swipeable } from 'react-native-gesture-handler';

// Swipeable Transaction Item
const SwipeableTransaction = ({ transaction, onArchive, onDelete, onFavorite }) => {
  const { theme } = useTenantTheme();

  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.leftActions}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.favoriteAction,
            { transform: [{ scale }] }
          ]}
        >
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={styles.actionText}>Favorite</Text>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (progress, dragX) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.archiveAction]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onArchive(transaction);
          }}
        >
          <Text style={styles.actionIcon}>📁</Text>
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(transaction);
          }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={80}
      rightThreshold={80}
      onSwipeableLeftOpen={() => onFavorite(transaction)}
    >
      <TransactionItem transaction={transaction} theme={theme} />
    </Swipeable>
  );
};

// Long Press Menu
const LongPressMenu = ({ children, menuItems }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = (event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMenuPosition({
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    });
    setMenuVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {children}
      </TouchableOpacity>

      {menuVisible && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[
                styles.contextMenu,
                {
                  top: menuPosition.y,
                  left: menuPosition.x
                }
              ]}
            >
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    item.onPress();
                    setMenuVisible(false);
                  }}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};
```

---

## Empty & Error States

### 🎨 **Monzo-Style Helpful States**

```typescript
// Empty State Component
const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  theme
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      {/* Illustration or Icon */}
      {illustration ? (
        <LottieView
          source={illustration}
          autoPlay
          loop
          style={styles.emptyIllustration}
        />
      ) : (
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={styles.emptyIcon}>{icon}</Text>
        </View>
      )}

      {/* Title */}
      <Typography.Headline size="medium" style={styles.emptyTitle}>
        {title}
      </Typography.Headline>

      {/* Description */}
      <Typography.Body size="medium" style={styles.emptyDescription}>
        {description}
      </Typography.Body>

      {/* Action Button */}
      {actionLabel && onAction && (
        <AnimatedButton
          onPress={onAction}
          variant="primary"
          style={styles.emptyAction}
        >
          <Typography.Body size="medium" style={{ color: '#fff' }}>
            {actionLabel}
          </Typography.Body>
        </AnimatedButton>
      )}
    </View>
  );
};

// Usage Examples
<EmptyState
  icon="💸"
  title="No transactions yet"
  description="Your transaction history will appear here once you start using your account."
  actionLabel="Make your first transfer"
  onAction={() => navigate('Transfer')}
  theme={theme}
/>

<EmptyState
  icon="📊"
  title="No spending data yet"
  description="Start making transactions to see your spending analytics and insights."
  theme={theme}
/>

// Error State Component
const ErrorState = ({
  errorType = 'generic',
  title,
  description,
  onRetry,
  onContactSupport,
  theme
}) => {
  const errorConfig = {
    network: {
      icon: '📡',
      title: 'Connection Lost',
      description: 'Please check your internet connection and try again.',
      retryLabel: 'Retry'
    },
    server: {
      icon: '⚠️',
      title: 'Something went wrong',
      description: 'Our servers are having issues. We\'re working on it!',
      retryLabel: 'Try Again'
    },
    notFound: {
      icon: '🔍',
      title: 'Not Found',
      description: 'We couldn\'t find what you\'re looking for.',
      retryLabel: 'Go Back'
    },
    generic: {
      icon: '😕',
      title: title || 'Oops!',
      description: description || 'Something unexpected happened.',
      retryLabel: 'Try Again'
    }
  };

  const config = errorConfig[errorType];

  return (
    <View style={styles.errorStateContainer}>
      <Text style={styles.errorIcon}>{config.icon}</Text>

      <Typography.Headline size="medium" style={styles.errorTitle}>
        {config.title}
      </Typography.Headline>

      <Typography.Body size="medium" style={styles.errorDescription}>
        {config.description}
      </Typography.Body>

      <View style={styles.errorActions}>
        {onRetry && (
          <AnimatedButton
            onPress={onRetry}
            variant="primary"
            style={styles.retryButton}
          >
            <Typography.Body size="medium" style={{ color: '#fff' }}>
              {config.retryLabel}
            </Typography.Body>
          </AnimatedButton>
        )}

        {onContactSupport && (
          <TouchableOpacity
            style={styles.supportButton}
            onPress={onContactSupport}
          >
            <Typography.Body size="medium" style={{ color: theme.colors.primary }}>
              Contact Support
            </Typography.Body>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

---

## Accessibility Standards

### ♿ **WCAG AAA Compliance**

```typescript
// Accessible Component Example
const AccessibleButton = ({ label, onPress, icon, variant = 'primary' }) => {
  const { theme } = useTenantTheme();

  return (
    <TouchableOpacity
      style={styles.accessibleButton}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={`Tap to ${label.toLowerCase()}`}
      accessibilityState={{ disabled: false }}
      // Minimum touch target: 44x44 points
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// Color Contrast Checker
const ensureContrast = (foreground, background) => {
  const contrast = calculateContrastRatio(foreground, background);

  // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
  if (contrast < 7) {
    console.warn(`Low contrast: ${contrast.toFixed(2)}:1`);
    // Automatically adjust color to meet standards
    return adjustColorForContrast(foreground, background, 7);
  }

  return foreground;
};

// Screen Reader Announcements
const announceToScreenReader = (message, priority = 'polite') => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else if (Platform.OS === 'android') {
    UIManager.sendAccessibilityEvent(
      findNodeHandle(this),
      UIManager.AccessibilityEventTypes.typeViewClicked
    );
  }
};

// Accessibility Checklist
const ACCESSIBILITY_REQUIREMENTS = {
  colorContrast: {
    normalText: 7,        // AAA standard
    largeText: 4.5,       // AAA standard
    uiComponents: 3       // AA standard
  },

  touchTargets: {
    minimum: 44,          // 44x44 points minimum
    recommended: 48       // 48x48 points recommended
  },

  textScaling: {
    support: true,        // Must support dynamic type
    maxScale: 200,        // Support up to 200% scaling
    reflow: true          // Text must reflow, not truncate
  },

  screenReader: {
    labels: true,         // All interactive elements must have labels
    hints: true,          // Provide hints for complex interactions
    announcements: true   // Announce important state changes
  },

  focusManagement: {
    visible: true,        // Focus indicators must be visible
    logical: true,        // Tab order must be logical
    trapped: false        // Focus must not be trapped
  }
};
```

---

## Performance Guidelines

### ⚡ **60fps Guaranteed Performance**

```typescript
// Performance Monitoring
import { InteractionManager } from 'react-native';

// Defer expensive operations
const DeferredComponent = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <SkeletonLoader />;
  }

  return children;
};

// Memoization
const ExpensiveComponent = React.memo(({ data, theme }) => {
  // Expensive rendering logic
  return <View>...</View>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// Virtualized Lists
import { FlatList } from 'react-native';

const TransactionList = ({ transactions }) => {
  const renderItem = useCallback(({ item }) => (
    <TransactionItem transaction={item} />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index
      })}
    />
  );
};

// Image Optimization
import FastImage from 'react-native-fast-image';

const OptimizedImage = ({ uri, style }) => {
  return (
    <FastImage
      source={{
        uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable
      }}
      style={style}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
};

// Performance Targets
const PERFORMANCE_TARGETS = {
  fps: 60,                    // Maintain 60fps
  tti: 2000,                  // Time to Interactive < 2s
  firstPaint: 1000,           // First Paint < 1s
  apiResponse: 500,           // API calls < 500ms
  animationDuration: 300,     // Animations < 300ms
  bundleSize: 5000000,        // Bundle < 5MB
  memoryUsage: 100000000      // Memory < 100MB
};
```

---

## Implementation Checklist

### ✅ **Mandatory for Every Screen**

- [ ] Import and use `useTenantTheme` hook
- [ ] Dynamic gradient background (tenant colors)
- [ ] All cards use `GlassCard` component
- [ ] Typography uses `Typography` components (never raw `<Text>`)
- [ ] Amounts use `Typography.Amount` with monospace font
- [ ] All buttons have micro-interactions (scale feedback)
- [ ] Loading states use `SkeletonLoader`
- [ ] Empty states use `EmptyState` component
- [ ] Error handling uses `ErrorState` component
- [ ] All interactive elements have haptic feedback
- [ ] Accessibility labels on all touchable elements
- [ ] Minimum touch target: 44x44 points
- [ ] Color contrast ratio >= 7:1 (AAA)
- [ ] Support dynamic text scaling
- [ ] Performance: 60fps maintained
- [ ] No hardcoded colors anywhere
- [ ] Responsive layout (mobile/tablet/desktop)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.0 | 2025-10-03 | 🤖 **MAJOR: Cleo AI-Inspired AI Assistant Design System** |
| | | ✨ Added comprehensive AI Assistant "Oroki" with personality modes |
| | | 🎭 Added Roast Mode (opt-in playful spending roasts) |
| | | 🇳🇬 Added Nigerian Pidgin language support |
| | | 🔮 Added proactive insights engine with spending alerts |
| | | 💬 Added complete chat interface components |
| | | 🎯 Added AI-powered analytics and personalized recommendations |
| | | 🎊 Integrated AI with reward system for celebrations |
| 2.0.0 | 2025-10-03 | 🎉 World-class design system incorporating best practices from Nubank, Revolut, Monzo, N26 |
| | | ✨ Added comprehensive Reward & Gamification system |
| | | 📊 Added advanced data visualization components |
| | | 🎨 Enhanced typography system with custom fonts |
| | | ✨ Added micro-interactions and animation standards |
| | | 🚀 Added Nubank-style conversational onboarding |
| | | 👆 Added gesture patterns (swipe, long-press) |
| | | 🎯 Added empty and error states |
| | | ♿ Added WCAG AAA accessibility standards |
| | | ⚡ Added performance guidelines and targets |

---

## 🚀 **Next Steps**

1. **Immediate Actions:**
   - Create reusable component library (`src/components/world-class/`)
   - Implement reward system backend API
   - Design and export achievement badges
   - Create animation assets (Lottie files)

2. **Week 1 Priorities:**
   - Implement Typography system
   - Build Reward Dashboard
   - Create Achievement unlock animations
   - Implement Daily Challenges

3. **Week 2 Priorities:**
   - Build Data Visualization components
   - Implement Onboarding flow
   - Create Empty/Error states
   - Add Swipe gestures

4. **Week 3-4:**
   - Performance optimization
   - Accessibility audit
   - User testing
   - Iterate based on feedback

---

**⚠️ CRITICAL: This design system is MANDATORY for all new screens and MUST be applied to existing screens during refactoring. No exceptions.**

This is our path to competing with **Nubank** (gamification), **Revolut** (data viz), **Monzo** (UX), **N26** (design), and **Cleo AI** (conversational intelligence) as a world-class digital banking platform.

### 🤖 **AI Assistant "Oroki" - Our Secret Weapon**

The combination of:
- ✅ **Nubank's** reward & gamification system
- ✅ **Revolut's** data visualization & analytics
- ✅ **Cleo AI's** personality-driven conversational banking
- ✅ **Nigerian cultural adaptation** (Pidgin language, local context)

...makes OrokiiPay **UNSTOPPABLE** in the African market and competitive globally! 🚀
