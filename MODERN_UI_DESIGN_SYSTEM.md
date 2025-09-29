# 🎨 Modern UI Design System - Multi-Tenant Banking Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Design Principles](#core-design-principles)
3. [Multi-Tenant Theme System](#multi-tenant-theme-system)
4. [Visual Design Elements](#visual-design-elements)
5. [Component Library](#component-library)
6. [Layout Patterns](#layout-patterns)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Code Examples](#code-examples)
9. [Accessibility Standards](#accessibility-standards)
10. [Performance Considerations](#performance-considerations)

---

## Overview

This document defines the **mandatory design system** for all UI components and screens in the OrokiiPay Multi-Tenant Banking Platform. Every developer and AI assistant MUST follow these guidelines to ensure consistency, maintainability, and professional appearance across all tenant deployments.

### 🚨 **CRITICAL REQUIREMENT**
**ALL future pages, screens, and components MUST implement this modern design system. No exceptions.**

---

## Core Design Principles

### 1. **Glassmorphism First**
- Semi-transparent overlays with backdrop blur
- Creates depth and modern aesthetic
- Maintains readability across all tenant color schemes

### 2. **Dynamic Tenant Theming**
- **NEVER hardcode colors** - always use tenant theme
- Background gradients based on tenant's primary/secondary colors
- Consistent structure with adaptable colors

### 3. **Responsive by Default**
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interfaces

### 4. **Performance Optimized**
- Lightweight components
- Efficient animations
- Lazy loading where appropriate

---

## Multi-Tenant Theme System

### 🔴 **CRITICAL: Dynamic Color Management**

#### Database Schema
```sql
-- Tenant theme colors are stored in:
platform.tenant_assets (for logos and assets)
platform.tenants.branding (JSON configuration)
platform.tenants.brand_colors (JSON color palette)
```

#### Theme Structure
```typescript
interface TenantTheme {
  colors: {
    primary: string;        // From tenant.brand_colors.primary
    secondary: string;      // From tenant.brand_colors.secondary
    accent: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    text: string;
    background: string;
    surface: string;
  };
  branding: {
    appTitle: string;
    logoUrl: string;
    tagline: string;
  };
}
```

### ✅ **REQUIRED: Theme Implementation Pattern**

```typescript
// EVERY component MUST import and use theme
import { useTenantTheme } from '../../context/TenantThemeContext';

const YourComponent = () => {
  const { theme } = useTenantTheme();

  // ALWAYS use theme colors, NEVER hardcode
  const styles = {
    background: `linear-gradient(135deg,
      ${theme.colors.primary} 0%,
      ${theme.colors.secondary} 100%
    )`
  };
};
```

### ❌ **FORBIDDEN: Hardcoded Colors**
```typescript
// NEVER DO THIS
backgroundColor: '#010080'  // ❌ WRONG
color: 'blue'               // ❌ WRONG

// ALWAYS DO THIS
backgroundColor: theme.colors.primary     // ✅ CORRECT
color: theme.colors.text                  // ✅ CORRECT
```

---

## Visual Design Elements

### Color System Architecture

#### 1. **Dynamic Gradient Backgrounds**
```typescript
// Main container gradient (tenant-specific)
background: `linear-gradient(135deg,
  ${theme.colors.primary} 0%,
  ${theme.colors.secondary} 100%
)`
```

#### 2. **Glassmorphism Overlays**
```typescript
// Glass effect constants (neutral, works with any tenant colors)
const GLASS_STYLES = {
  heavy: 'rgba(255, 255, 255, 0.95)',
  medium: 'rgba(255, 255, 255, 0.85)',
  light: 'rgba(255, 255, 255, 0.1)',
  blur: {
    light: 'blur(10px)',
    medium: 'blur(20px)',
    heavy: 'blur(30px)'
  }
};
```

#### 3. **Text Colors (Neutral)**
```typescript
// These remain consistent across tenants for readability
const TEXT_COLORS = {
  primary: '#1a1a2e',    // Dark navy
  secondary: '#6c757d',  // Gray
  light: '#94a3b8',      // Light gray
  white: '#ffffff'       // Pure white
};
```

### Shadow System
```typescript
const SHADOWS = {
  light: '0 2px 8px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
  heavy: '0 8px 20px rgba(0, 0, 0, 0.2)'
};
```

### Border Radius Standards
```typescript
const RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  xxlarge: 24,
  round: 9999
};
```

---

## Component Library

### 1. **Glass Card Component**
**MANDATORY for all card-like elements**

```typescript
const GlassCard = ({ children, blur = 'medium', shadow = 'medium' }) => {
  return (
    <View style={{
      backgroundColor: GLASS_STYLES[blur],
      borderRadius: RADIUS.large,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      ...Platform.select({
        web: {
          backdropFilter: GLASS_STYLES.blur[blur],
          boxShadow: SHADOWS[shadow]
        }
      })
    }}>
      {children}
    </View>
  );
};
```

### 2. **Section Header Component**
**MANDATORY for all section titles**

```typescript
const SectionHeader = ({ title, subtitle }) => {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLORS.primary,
        marginBottom: 4
      }}>{title}</Text>
      {subtitle && (
        <Text style={{
          fontSize: 14,
          color: TEXT_COLORS.secondary
        }}>{subtitle}</Text>
      )}
    </View>
  );
};
```

### 3. **Feature Card Component**
**MANDATORY for feature/action items**

```typescript
const FeatureCard = ({ icon, title, description, onPress, theme }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        ...glassCardStyle,
        minHeight: 140
      }}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: TEXT_COLORS.primary,
        marginBottom: 4
      }}>{title}</Text>
      <Text style={{
        fontSize: 12,
        color: TEXT_COLORS.secondary,
        lineHeight: 16
      }}>{description}</Text>
    </TouchableOpacity>
  );
};
```

### 4. **Stats Card Component**
**MANDATORY for displaying metrics**

```typescript
const StatsCard = ({ label, value, change, icon, theme }) => {
  const isPositive = change > 0;

  return (
    <GlassCard>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: `${theme.colors.primary}10`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <Text>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 12,
            color: TEXT_COLORS.light,
            marginBottom: 4
          }}>{label}</Text>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: TEXT_COLORS.primary
          }}>{value}</Text>
          {change !== undefined && (
            <Text style={{
              fontSize: 11,
              color: isPositive ? '#10b981' : '#ef4444',
              marginTop: 4
            }}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </Text>
          )}
        </View>
      </View>
    </GlassCard>
  );
};
```

---

## Layout Patterns

### 1. **Page Structure Template**
**EVERY screen MUST follow this structure**

```typescript
const ScreenTemplate = ({ children }) => {
  const { theme } = useTenantTheme();

  return (
    <View style={{
      flex: 1,
      background: `linear-gradient(135deg,
        ${theme.colors.primary} 0%,
        ${theme.colors.secondary} 100%)`
    }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Header />

        {/* Welcome/Hero Section */}
        <WelcomeSection />

        {/* Quick Stats Grid */}
        <QuickStatsGrid />

        {/* Main Content Area */}
        <View style={{ padding: 20 }}>
          {children}
        </View>

        {/* AI Assistant (if applicable) */}
        <AIAssistantPanel />
      </ScrollView>
    </View>
  );
};
```

### 2. **Responsive Grid System**

```typescript
const ResponsiveGrid = ({ children }) => {
  const screenWidth = Dimensions.get('window').width;
  const columns = screenWidth < 480 ? 2 : screenWidth < 768 ? 3 : 4;

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8
    }}>
      {React.Children.map(children, child => (
        <View style={{
          width: `${100 / columns}%`,
          padding: 8
        }}>
          {child}
        </View>
      ))}
    </View>
  );
};
```

### 3. **Header Pattern**

```typescript
const StandardHeader = () => {
  const { theme } = useTenantTheme();

  return (
    <View style={{
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Logo/Brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {theme.brandLogo && (
          <Image source={{ uri: theme.brandLogo }} style={{ width: 40, height: 40 }} />
        )}
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 12 }}>
          {theme.brandName}
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity>
          <Text>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

## Implementation Guidelines

### 📝 **Mandatory Checklist for Every New Screen**

- [ ] Import `useTenantTheme` hook
- [ ] Apply dynamic gradient background using tenant colors
- [ ] Use GlassCard for all card elements
- [ ] Implement responsive layout breakpoints
- [ ] Use theme colors for ALL color properties
- [ ] Add proper shadows and borders
- [ ] Include loading states with shimmer effects
- [ ] Test on mobile, tablet, and desktop viewports
- [ ] Verify glassmorphism effects are working
- [ ] Ensure no hardcoded colors exist

### 🚀 **Quick Start Template**

```typescript
import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { GlassCard, SectionHeader, FeatureCard } from '../../components/common';

const YourNewScreen = () => {
  const { theme } = useTenantTheme();

  return (
    <View style={{
      flex: 1,
      ...Platform.select({
        web: {
          background: `linear-gradient(135deg,
            ${theme.colors.primary} 0%,
            ${theme.colors.secondary} 100%)`
        },
        default: {
          backgroundColor: theme.colors.primary
        }
      })
    }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          <SectionHeader
            title="Your Section Title"
            subtitle="Optional subtitle"
          />

          <GlassCard>
            {/* Your content here */}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
};

export default YourNewScreen;
```

---

## Code Examples

### Example 1: Transfer Screen with Modern UI

```typescript
const TransferScreen = () => {
  const { theme } = useTenantTheme();

  return (
    <View style={styles.container(theme)}>
      <ScrollView>
        {/* Header with gradient */}
        <View style={styles.header(theme)}>
          <Text style={styles.headerTitle}>Send Money</Text>
        </View>

        {/* Transfer Form in Glass Card */}
        <GlassCard blur="medium" shadow="medium">
          <SectionHeader title="Transfer Details" />

          {/* Form inputs with glass effect */}
          <TextInput
            style={styles.glassInput}
            placeholder="Recipient Account"
            placeholderTextColor={TEXT_COLORS.light}
          />

          <TextInput
            style={styles.glassInput}
            placeholder="Amount"
            placeholderTextColor={TEXT_COLORS.light}
            keyboardType="numeric"
          />

          {/* Action button with gradient */}
          <TouchableOpacity style={styles.gradientButton(theme)}>
            <Text style={styles.buttonText}>Send Money</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Recent Transfers */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Recent Transfers" />
          <GlassCard>
            {recentTransfers.map(transfer => (
              <TransferItem key={transfer.id} {...transfer} />
            ))}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
};
```

### Example 2: Settings Screen with Modern UI

```typescript
const SettingsScreen = () => {
  const { theme } = useTenantTheme();

  const settingSections = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', action: 'profile' },
        { icon: '🔐', label: 'Security', action: 'security' },
        { icon: '🔔', label: 'Notifications', action: 'notifications' }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🎨', label: 'Theme', action: 'theme' },
        { icon: '🌐', label: 'Language', action: 'language' },
        { icon: '💰', label: 'Currency', action: 'currency' }
      ]
    }
  ];

  return (
    <View style={styles.container(theme)}>
      <ScrollView>
        {settingSections.map(section => (
          <View key={section.title} style={{ marginBottom: 24 }}>
            <SectionHeader title={section.title} />
            <GlassCard>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.action}
                  style={[
                    styles.settingItem,
                    index < section.items.length - 1 && styles.settingItemBorder
                  ]}
                  onPress={() => handleSettingPress(item.action)}
                >
                  <View style={styles.settingItemContent}>
                    <Text style={styles.settingIcon}>{item.icon}</Text>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
```

---

## Accessibility Standards

### Required Accessibility Features

1. **Color Contrast**
   - Ensure 4.5:1 ratio for normal text
   - Ensure 3:1 ratio for large text
   - Test with tenant colors to maintain readability

2. **Touch Targets**
   - Minimum 44x44 points for interactive elements
   - Adequate spacing between buttons

3. **Screen Reader Support**
   - Add accessibilityLabel to all interactive elements
   - Use accessibilityRole appropriately
   - Provide accessibilityHint for complex interactions

4. **Keyboard Navigation** (Web)
   - Ensure all interactive elements are keyboard accessible
   - Provide visible focus indicators
   - Implement logical tab order

---

## Performance Considerations

### Optimization Requirements

1. **Image Optimization**
   - Use appropriate image formats (WebP where supported)
   - Implement lazy loading for off-screen images
   - Cache tenant logos and assets

2. **Animation Performance**
   - Use `transform` and `opacity` for animations
   - Avoid animating layout properties
   - Use `useNativeDriver: true` for React Native animations

3. **Component Optimization**
   - Use React.memo for expensive components
   - Implement virtualized lists for large datasets
   - Debounce search inputs and API calls

4. **Style Caching**
   - Cache computed styles based on theme
   - Memoize style objects that depend on theme
   - Use StyleSheet.create for static styles

---

## Migration Guide

### Converting Existing Screens to Modern UI

1. **Step 1: Add Theme Context**
```typescript
// Before
const OldScreen = () => {
  return <View style={{ backgroundColor: '#fff' }}>...</View>;
};

// After
const ModernScreen = () => {
  const { theme } = useTenantTheme();
  return <View style={styles.container(theme)}>...</View>;
};
```

2. **Step 2: Replace Cards with GlassCard**
```typescript
// Before
<View style={styles.card}>...</View>

// After
<GlassCard blur="medium" shadow="medium">...</GlassCard>
```

3. **Step 3: Apply Dynamic Colors**
```typescript
// Before
color: '#007AFF'

// After
color: theme.colors.primary
```

---

## Validation Checklist

### Pre-Deployment Review

- [ ] All screens use tenant theme colors
- [ ] No hardcoded colors in the codebase
- [ ] Glass effects applied to all cards
- [ ] Gradient backgrounds on all main containers
- [ ] Responsive layouts tested on all breakpoints
- [ ] Accessibility standards met
- [ ] Performance metrics within acceptable range
- [ ] Cross-browser compatibility verified
- [ ] Multi-tenant color schemes tested

---

## Support and Resources

### Getting Help
- Review this document thoroughly before implementing new screens
- Check existing components in `/src/components/common/`
- Reference ModernDashboardWithAI.tsx for implementation examples
- Use the modernDashboard.ts styles as a base

### Enforcement
- Code reviews MUST verify compliance with this design system
- Automated linting rules check for hardcoded colors
- Visual regression tests validate UI consistency
- Pull requests without proper theming will be rejected

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-09-29 | Initial design system documentation |
| | | Established mandatory guidelines for multi-tenant theming |
| | | Created component library and patterns |

---

**⚠️ FINAL WARNING: Failure to implement this design system will result in code rejection and required rework.**

This is not a suggestion—it's a requirement for maintaining the professional quality and multi-tenant capability of the OrokiiPay platform.