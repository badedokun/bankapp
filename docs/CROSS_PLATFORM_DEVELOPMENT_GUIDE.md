# 📱 Cross-Platform Development Guide
## Preventing Web vs Mobile Code Conflicts

---

## 📋 Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Core Platform Differences](#core-platform-differences)
3. [Architectural Approach](#architectural-approach)
4. [Platform-Specific File Strategy](#platform-specific-file-strategy)
5. [Platform Abstraction Patterns](#platform-abstraction-patterns)
6. [Design System Adaptation](#design-system-adaptation)
7. [Development Workflow](#development-workflow)
8. [Code Review Checklist](#code-review-checklist)
9. [Testing Requirements](#testing-requirements)
10. [Common Pitfalls](#common-pitfalls)

---

## Overview & Problem Statement

### 🚨 **The Challenge**

When developing for both web and mobile platforms using React Native, mobile-specific changes can inadvertently break web implementations, and vice versa. This creates:

- **Merge conflicts** between platform branches
- **Build failures** when platform-specific code is merged
- **UX inconsistencies** between platforms
- **Maintenance overhead** from diverging codebases

### 🎯 **The Solution**

This guide establishes **architectural patterns** and **development workflows** that allow:

✅ Independent platform development without breaking other platforms
✅ Shared business logic with platform-specific UI implementations
✅ Adherence to our World-Class UI Design System across all platforms
✅ Minimal code duplication while maintaining platform best practices

---

## Core Platform Differences

### **Critical Incompatibilities**

| Feature | Web (Browser) | Mobile (iOS/Android) |
|---------|--------------|----------------------|
| **CSS Gradients** | ✅ `backgroundImage: linear-gradient(...)` | ❌ Requires `react-native-linear-gradient` |
| **Box Shadow** | ✅ `boxShadow: '0 4px 12px rgba(0,0,0,0.1)'` | ❌ Use `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` |
| **Backdrop Filter** | ✅ `backdropFilter: 'blur(10px)'` | ❌ Not supported natively |
| **CSS Transitions** | ✅ `transition: 'all 0.3s ease'` | ❌ Use `Animated` API |
| **Hover States** | ✅ `:hover` pseudo-class | ❌ Use `onPressIn`/`onPressOut` |
| **Text Selection** | ✅ Native support | ⚠️ Limited, requires `selectable` prop |
| **Fonts** | ✅ Web fonts, Google Fonts | ⚠️ Requires native font files |
| **SVG** | ✅ Inline SVG, CSS styling | ⚠️ Requires `react-native-svg` |
| **Animations** | ✅ CSS animations, Lottie | ✅ `Animated` API, Reanimated |
| **Haptic Feedback** | ❌ Not available | ✅ `expo-haptics` |
| **Gestures** | ⚠️ Limited (scroll, click) | ✅ Rich gesture library |

### **Style Property Differences**

```typescript
// ❌ BREAKS WEB - Using mobile shadow properties
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
}

// ❌ BREAKS MOBILE - Using web shadow properties
{
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
}

// ❌ BREAKS MOBILE - Using CSS gradient
{
  background: 'linear-gradient(135deg, #010080, #FFD700)',
}

// ❌ BREAKS WEB - Using native gradient component
<LinearGradient colors={['#010080', '#FFD700']} />
```

---

## Architectural Approach

### **1. Hybrid Platform Strategy**

We use a **combination** of approaches based on the complexity of platform differences:

```
┌─────────────────────────────────────────────────────────┐
│                   SHARED LAYER                          │
│  • Business Logic (API calls, state management)         │
│  • Type Definitions (interfaces, types)                 │
│  • Constants (non-visual configuration)                 │
│  • Utilities (formatting, validation)                   │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐          ┌─────────▼──────────┐
│   WEB LAYER        │          │   MOBILE LAYER     │
│  • .web.tsx files  │          │  • .native.tsx     │
│  • CSS gradients   │          │  • Native gradients│
│  • boxShadow       │          │  • shadowColor     │
│  • backdropFilter  │          │  • Haptic feedback │
└────────────────────┘          └────────────────────┘
```

### **2. Separation of Concerns**

```
src/
├── components/
│   ├── common/
│   │   ├── GradientView.tsx        # ← Platform abstraction
│   │   ├── GradientView.web.tsx    # ← Web implementation
│   │   ├── GradientView.native.tsx # ← Mobile implementation
│   │   └── ShadowCard.tsx          # ← Auto-resolves platform files
│   └── dashboard/
│       ├── ModernDashboard.tsx     # ← Shared logic & structure
│       ├── ModernDashboard.styles.web.ts    # ← Web styles
│       └── ModernDashboard.styles.native.ts # ← Mobile styles
├── services/
│   └── api.ts                      # ← Shared business logic
├── types/
│   └── theme.ts                    # ← Shared interfaces
└── utils/
    └── formatting.ts               # ← Shared utilities
```

---

## Platform-Specific File Strategy

### **When to Use Platform-Specific Files**

#### ✅ **Use Separate Files (.web.tsx / .native.tsx) When:**

1. **Major UI Differences**
   - Component uses web-only features (CSS gradients, backdrop blur)
   - Mobile requires native modules (LinearGradient, Haptics)
   - Layout strategy differs significantly

2. **Style Complexity**
   - Many style properties require platform-specific values
   - Platform-specific animations or transitions

3. **Different Native APIs**
   - Camera, File system, Sensors
   - Platform-specific gesture handling

#### ⚠️ **Use Platform.select() When:**

1. **Minor Style Differences**
   - Single property variations
   - Simple conditional styling

2. **Small Behavioral Differences**
   - Touch vs click feedback
   - Platform-specific padding/margins

### **File Naming Convention**

```
ComponentName.tsx         # Shared logic/interface
ComponentName.web.tsx     # Web-specific implementation
ComponentName.native.tsx  # Mobile-specific implementation
ComponentName.ios.tsx     # iOS-only (if needed)
ComponentName.android.tsx # Android-only (if needed)
```

**Metro/Webpack automatically resolves the correct file:**

```typescript
// In your code - same import everywhere
import { GradientView } from './GradientView';

// Web build uses:    GradientView.web.tsx
// Mobile build uses: GradientView.native.tsx
// Falls back to:     GradientView.tsx
```

---

## Platform Abstraction Patterns

### **Pattern 1: Gradient Abstraction**

#### **Shared Interface**
```typescript
// src/components/common/GradientView/types.ts
export interface GradientViewProps {
  colors: [string, string];
  children?: React.ReactNode;
  style?: ViewStyle;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}
```

#### **Web Implementation**
```typescript
// src/components/common/GradientView/GradientView.web.tsx
import React from 'react';
import { View } from 'react-native';
import { GradientViewProps } from './types';

export const GradientView: React.FC<GradientViewProps> = ({
  colors,
  children,
  style,
  direction = 'diagonal',
}) => {
  const gradientDirection = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: '135deg',
  }[direction];

  return (
    <View
      style={[
        {
          backgroundImage: `linear-gradient(${gradientDirection}, ${colors[0]}, ${colors[1]})`,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

#### **Mobile Implementation**
```typescript
// src/components/common/GradientView/GradientView.native.tsx
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { GradientViewProps } from './types';

export const GradientView: React.FC<GradientViewProps> = ({
  colors,
  children,
  style,
  direction = 'diagonal',
}) => {
  const gradientProps = {
    horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
    vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
    diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  }[direction];

  return (
    <LinearGradient
      colors={colors}
      style={style}
      {...gradientProps}
    >
      {children}
    </LinearGradient>
  );
};
```

#### **Usage (Platform-Agnostic)**
```typescript
// src/screens/dashboard/ModernDashboardScreen.tsx
import { GradientView } from '../../components/common/GradientView';
import { useTenantTheme } from '../../context/TenantThemeContext';

const ModernDashboardScreen = () => {
  const { theme } = useTenantTheme();

  return (
    <GradientView
      colors={[theme.colors.primary, theme.colors.secondary]}
      direction="diagonal"
    >
      {/* Your dashboard content - works on both platforms */}
    </GradientView>
  );
};
```

---

### **Pattern 2: Shadow Abstraction**

#### **Web Implementation**
```typescript
// src/components/common/ShadowCard/ShadowCard.web.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ShadowCardProps {
  children: React.ReactNode;
  shadow?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
}

const SHADOWS = {
  light: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  heavy: '0 8px 20px rgba(0, 0, 0, 0.2)',
};

export const ShadowCard: React.FC<ShadowCardProps> = ({
  children,
  shadow = 'medium',
  style,
}) => {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 20,
          boxShadow: SHADOWS[shadow],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

#### **Mobile Implementation**
```typescript
// src/components/common/ShadowCard/ShadowCard.native.tsx
import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';

interface ShadowCardProps {
  children: React.ReactNode;
  shadow?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
}

const SHADOW_CONFIG = {
  light: { height: 2, opacity: 0.1, radius: 8, elevation: 3 },
  medium: { height: 4, opacity: 0.15, radius: 12, elevation: 5 },
  heavy: { height: 8, opacity: 0.2, radius: 20, elevation: 10 },
};

export const ShadowCard: React.FC<ShadowCardProps> = ({
  children,
  shadow = 'medium',
  style,
}) => {
  const config = SHADOW_CONFIG[shadow];

  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 20,
          // iOS shadows
          shadowColor: '#000',
          shadowOffset: { width: 0, height: config.height },
          shadowOpacity: config.opacity,
          shadowRadius: config.radius,
          // Android elevation
          elevation: config.elevation,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

---

### **Pattern 3: Glassmorphism Abstraction**

#### **Shared Interface**
```typescript
// src/components/common/GlassCard/types.ts
export interface GlassCardProps {
  children: React.ReactNode;
  blur?: 'light' | 'medium' | 'heavy';
  opacity?: number;
  style?: ViewStyle;
}
```

#### **Web Implementation**
```typescript
// src/components/common/GlassCard/GlassCard.web.tsx
import React from 'react';
import { View } from 'react-native';
import { GlassCardProps } from './types';

const BLUR_LEVELS = {
  light: 'blur(10px)',
  medium: 'blur(20px)',
  heavy: 'blur(30px)',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blur = 'medium',
  opacity = 0.95,
  style,
}) => {
  return (
    <View
      style={[
        {
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: BLUR_LEVELS[blur],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

#### **Mobile Implementation**
```typescript
// src/components/common/GlassCard/GlassCard.native.tsx
import React from 'react';
import { View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassCardProps } from './types';

const BLUR_AMOUNTS = {
  light: 10,
  medium: 20,
  heavy: 30,
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blur = 'medium',
  opacity = 0.95,
  style,
}) => {
  return (
    <BlurView
      blurType="light"
      blurAmount={BLUR_AMOUNTS[blur]}
      style={[
        {
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        {children}
      </View>
    </BlurView>
  );
};
```

---

## Design System Adaptation

### **Maintaining Design System Compliance Across Platforms**

Our **World-Class UI Design System** and **Modern UI Design System** MUST be respected on both platforms.

#### **1. Theme System (✅ Platform-Agnostic)**

```typescript
// ✅ WORKS ON BOTH - Theme colors are platform-agnostic
import { useTenantTheme } from '../../context/TenantThemeContext';

const Component = () => {
  const { theme } = useTenantTheme();

  // These work everywhere:
  const primaryColor = theme.colors.primary;
  const textColor = theme.colors.text.primary;
  const successColor = theme.colors.success;

  // Use in Platform.select() or abstraction components
};
```

#### **2. Typography System**

```typescript
// ✅ SHARED - Typography component works on both platforms
import { Typography } from '../../components/ui/Typography';

<Typography.DisplayLarge style={{ color: theme.colors.primary }}>
  Welcome Back!
</Typography.DisplayLarge>

<Typography.Amount value={2450000} currency="₦" />
```

#### **3. Spacing, Radius, Shadows**

```typescript
// ✅ SHARED - Design tokens work universally
import { SPACING, RADIUS } from '../../design-system/tokens';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,          // ✅ Works on both
    borderRadius: RADIUS.large,   // ✅ Works on both
    marginBottom: SPACING.xl,     // ✅ Works on both
  },
});
```

#### **4. Platform-Specific Adaptations**

```typescript
// Example: Glassmorphic Card using our abstraction
import { GlassCard } from '../../components/common/GlassCard';
import { ShadowCard } from '../../components/common/ShadowCard';
import { GradientView } from '../../components/common/GradientView';
import { useTenantTheme } from '../../context/TenantThemeContext';

const DashboardScreen = () => {
  const { theme } = useTenantTheme();

  return (
    <GradientView colors={[theme.colors.primary, theme.colors.secondary]}>
      <GlassCard blur="medium">
        <Typography.HeadlineLarge>
          {theme.branding.name}
        </Typography.HeadlineLarge>
      </GlassCard>

      <ShadowCard shadow="heavy">
        <Typography.BodyMedium>
          Account Balance
        </Typography.BodyMedium>
        <Typography.Amount value={2450000} currency="₦" />
      </ShadowCard>
    </GradientView>
  );
};
```

### **Design System Checklist**

When implementing design system components:

- [ ] ✅ Use `useTenantTheme()` for all colors
- [ ] ✅ Use `Typography` components (not raw Text)
- [ ] ✅ Use design tokens (SPACING, RADIUS, SHADOWS)
- [ ] ✅ Use abstraction components (GradientView, ShadowCard, GlassCard)
- [ ] ❌ NEVER hardcode colors
- [ ] ❌ NEVER use platform-specific CSS directly in shared components
- [ ] ❌ NEVER use `LinearGradient` directly (use `GradientView`)

---

## Development Workflow

### **Branch Strategy**

```
main (production)
├── feature/dashboard-redesign
│   ├── src/components/common/GradientView.tsx      # Shared interface
│   ├── src/components/common/GradientView.web.tsx   # Web implementation
│   ├── src/components/common/GradientView.native.tsx # Mobile implementation
│   └── All platforms work together in ONE branch
```

#### **✅ DO: Single Branch with Platform Files**

```bash
# Create feature branch
git checkout -b feature/savings-screen

# Create platform-specific files together
touch src/screens/savings/SavingsScreen.web.tsx
touch src/screens/savings/SavingsScreen.native.tsx

# Commit both platforms together
git add src/screens/savings/
git commit -m "Add savings screen for web and mobile"
```

#### **❌ DON'T: Separate Platform Branches**

```bash
# ❌ WRONG - Creates diverging codebases
git checkout -b feature/savings-web
git checkout -b feature/savings-mobile
```

### **Development Process**

#### **Step 1: Design & Planning**

Before writing code, identify platform differences:

```markdown
## Savings Screen Implementation Plan

### Shared Elements
- [ ] API integration for savings data
- [ ] State management (useState, useEffect)
- [ ] Business logic (calculate interest, validate amounts)
- [ ] Type definitions

### Platform-Specific Elements
**Web:**
- [ ] CSS gradients for hero section
- [ ] boxShadow for savings cards
- [ ] Hover states for interactive elements

**Mobile:**
- [ ] LinearGradient for hero section
- [ ] Native shadows (shadowColor, shadowOffset)
- [ ] Haptic feedback on interactions
- [ ] Pull-to-refresh functionality
```

#### **Step 2: Create Shared Logic**

```typescript
// src/screens/savings/useSavingsLogic.ts
import { useState, useEffect } from 'react';
import { APIService } from '../../services/api';

export const useSavingsLogic = () => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const data = await APIService.getSavingsGoals();
        setSavings(data);
      } catch (error) {
        console.error('Failed to fetch savings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();
  }, []);

  const createSavingsGoal = async (goal: SavingsGoal) => {
    // Shared business logic
  };

  return { savings, loading, createSavingsGoal };
};
```

#### **Step 3: Create Platform-Specific UI**

```typescript
// src/screens/savings/SavingsScreen.web.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSavingsLogic } from './useSavingsLogic';
import { useTenantTheme } from '../../context/TenantThemeContext';

const SavingsScreen = () => {
  const { savings, loading } = useSavingsLogic();
  const { theme } = useTenantTheme();

  return (
    <View style={{
      flex: 1,
      backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
    }}>
      <ScrollView>
        {savings.map(goal => (
          <View
            key={goal.id}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 16,
              padding: 20,
              margin: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Savings goal content */}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SavingsScreen;
```

```typescript
// src/screens/savings/SavingsScreen.native.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSavingsLogic } from './useSavingsLogic';
import { useTenantTheme } from '../../context/TenantThemeContext';

const SavingsScreen = () => {
  const { savings, loading } = useSavingsLogic();
  const { theme } = useTenantTheme();

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={{ flex: 1 }}
    >
      <ScrollView>
        {savings.map(goal => (
          <View
            key={goal.id}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 16,
              padding: 20,
              margin: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {/* Savings goal content */}
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

export default SavingsScreen;
```

#### **Step 4: Testing Both Platforms**

```bash
# Test web build
npm run web

# Test mobile build (Android)
npm run android

# Test mobile build (iOS)
npm run ios
```

---

## Code Review Checklist

### **Pull Request Requirements**

Every PR MUST pass this checklist:

#### **✅ Platform Separation**
- [ ] Shared business logic is in separate files/hooks
- [ ] Platform-specific UI code uses `.web.tsx` / `.native.tsx` extensions
- [ ] No platform-specific code in shared files
- [ ] Platform.select() used only for minor differences

#### **✅ Design System Compliance**
- [ ] Uses `useTenantTheme()` for all colors
- [ ] No hardcoded colors anywhere
- [ ] Typography components used (not raw Text)
- [ ] Design tokens used (SPACING, RADIUS)
- [ ] Abstraction components used (GradientView, ShadowCard, GlassCard)

#### **✅ Build Validation**
- [ ] Web build succeeds: `npm run build:web`
- [ ] Android build succeeds: `cd android && ./gradlew assembleDebug`
- [ ] iOS build succeeds: `cd ios && xcodebuild`
- [ ] No TypeScript errors
- [ ] No ESLint warnings related to platform code

#### **✅ Code Quality**
- [ ] Shared logic is well-tested
- [ ] Platform-specific files have comments explaining why they're separate
- [ ] No duplicated business logic between platform files
- [ ] Imports are clean (no unused platform-specific imports in shared files)

#### **✅ Documentation**
- [ ] README updated if new abstraction components created
- [ ] Platform differences documented in code comments
- [ ] Migration guide provided if refactoring existing components

---

## Testing Requirements

### **1. Build Tests (CI/CD)**

```yaml
# .github/workflows/cross-platform-validation.yml
name: Cross-Platform Validation

on: [push, pull_request]

jobs:
  web-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Build web
        run: npm run build:web
      - name: Web build artifact
        uses: actions/upload-artifact@v2
        with:
          name: web-build
          path: dist/

  android-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Build Android
        run: cd android && ./gradlew assembleDebug
      - name: Android APK artifact
        uses: actions/upload-artifact@v2
        with:
          name: android-apk
          path: android/app/build/outputs/apk/debug/

  ios-build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install && cd ios && pod install
      - name: Build iOS
        run: xcodebuild -workspace ios/OrokiiPayApp.xcworkspace -scheme OrokiiPayApp
```

### **2. Visual Regression Tests**

```typescript
// tests/platform-visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Platform Visual Consistency', () => {
  test('Dashboard gradient renders correctly on web', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    const container = page.locator('[data-testid="gradient-container"]');
    await expect(container).toHaveScreenshot('dashboard-gradient-web.png');
  });

  // Equivalent test for mobile using Detox or Appium
});
```

### **3. Unit Tests for Abstraction Components**

```typescript
// src/components/common/GradientView/__tests__/GradientView.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { GradientView } from '../GradientView';

describe('GradientView', () => {
  it('renders children correctly on both platforms', () => {
    const { getByText } = render(
      <GradientView colors={['#010080', '#FFD700']}>
        <Text>Test Content</Text>
      </GradientView>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies correct gradient direction', () => {
    const { getByTestId } = render(
      <GradientView
        colors={['#010080', '#FFD700']}
        direction="horizontal"
        testID="gradient-view"
      >
        <Text>Test</Text>
      </GradientView>
    );

    // Platform-specific assertions
  });
});
```

---

## Common Pitfalls

### **❌ Pitfall 1: Modifying Shared Files with Platform Code**

```typescript
// ❌ WRONG - Adding web-specific code to shared component
const DashboardScreen = () => {
  return (
    <View style={{
      background: 'linear-gradient(135deg, #010080, #FFD700)', // BREAKS MOBILE
    }}>
      {/* Content */}
    </View>
  );
};
```

**✅ Solution:**
```typescript
// Create platform-specific files
// DashboardScreen.web.tsx
// DashboardScreen.native.tsx

// OR use abstraction
<GradientView colors={['#010080', '#FFD700']}>
  {/* Content */}
</GradientView>
```

---

### **❌ Pitfall 2: Using Platform.select() for Complex Differences**

```typescript
// ❌ WRONG - Platform.select() becomes unreadable
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(20px)',
        background: 'linear-gradient(135deg, #fff, #f0f0f0)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
});
```

**✅ Solution:** Use separate style files
```typescript
// ModernDashboard.styles.web.ts
// ModernDashboard.styles.native.ts
```

---

### **❌ Pitfall 3: Forgetting to Test Both Platforms**

```bash
# ❌ WRONG - Only testing web
npm run web
# Ship it! 🚀

# ✅ CORRECT - Test both platforms
npm run web          # Test web
npm run android      # Test Android
npm run ios          # Test iOS
```

---

### **❌ Pitfall 4: Duplicating Business Logic**

```typescript
// ❌ WRONG - Duplicating API logic in both files

// DashboardScreen.web.tsx
const fetchDashboardData = async () => {
  const response = await fetch('/api/dashboard');
  const data = await response.json();
  setDashboardData(data);
};

// DashboardScreen.native.tsx
const fetchDashboardData = async () => {
  const response = await fetch('/api/dashboard');
  const data = await response.json();
  setDashboardData(data);
};
```

**✅ Solution:** Extract to shared hook
```typescript
// useDashboardData.ts
export const useDashboardData = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setData(data);
    };
    fetchData();
  }, []);

  return { data };
};

// Both DashboardScreen.web.tsx and DashboardScreen.native.tsx
import { useDashboardData } from './useDashboardData';
const { data } = useDashboardData();
```

---

## Summary: Golden Rules

### **🏆 The 10 Commandments of Cross-Platform Development**

1. **Thou shalt not hardcode colors** - Always use `theme.colors`
2. **Thou shalt separate UI from logic** - Use hooks for shared business logic
3. **Thou shalt use platform-specific files** - For major UI differences
4. **Thou shalt create abstractions** - For platform-specific features (gradients, shadows)
5. **Thou shalt test both platforms** - Before merging any PR
6. **Thou shalt respect the design system** - On all platforms
7. **Thou shalt document platform differences** - In code comments
8. **Thou shalt not duplicate business logic** - Between platform files
9. **Thou shalt use TypeScript** - For type safety across platforms
10. **Thou shalt commit both platforms together** - In the same branch

---

## Quick Reference

### **When in Doubt, Ask:**

1. **Does this feature work the same on web and mobile?**
   - ✅ Yes → Use shared component
   - ❌ No → Use platform-specific files

2. **Is this a styling difference or logic difference?**
   - 🎨 Styling → Create abstraction component
   - 🧠 Logic → NEVER separate (keep shared)

3. **Is this a minor or major difference?**
   - Minor → Use `Platform.select()`
   - Major → Use `.web.tsx` / `.native.tsx`

4. **Does this involve platform-specific APIs?**
   - ✅ Yes → Create abstraction with platform files
   - ❌ No → Keep shared

---

## Support & Resources

- **Design Systems**: See `WORLD_CLASS_UI_DESIGN_SYSTEM.md` and `MODERN_UI_DESIGN_SYSTEM.md`
- **Platform Abstraction Examples**: See `src/components/common/`
- **React Native Docs**: https://reactnative.dev/docs/platform-specific-code
- **Questions?**: Review this guide thoroughly, check existing abstractions, then ask

---

**⚠️ Remember: The goal is NOT to have identical code on both platforms. The goal is to have identical BEHAVIOR and DESIGN, implemented in the best way for each platform.**

---

**Version**: 1.0.0
**Last Updated**: 2025-10-15
**Author**: OrokiiPay Engineering Team
