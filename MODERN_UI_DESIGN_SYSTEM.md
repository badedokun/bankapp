# 🎨 Modern UI Design System - Multi-Tenant Banking Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Design Principles](#core-design-principles)
3. [Multi-Tenant Theme System](#multi-tenant-theme-system)
4. [Visual Design Elements](#visual-design-elements)
5. [Component Library](#component-library)
6. [Notification System](#notification-system)
7. [Layout Patterns](#layout-patterns)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Code Examples](#code-examples)
10. [Accessibility Standards](#accessibility-standards)
11. [Performance Considerations](#performance-considerations)

---

## Overview

This document defines the **mandatory design system** for all UI components and screens in the OrokiiPay Multi-Tenant Banking Platform. Every developer and AI assistant MUST follow these guidelines to ensure consistency, maintainability, and professional appearance across all tenant deployments.

### 🚨 **CRITICAL REQUIREMENTS**
1. **ALL future pages MUST implement this modern design system. No exceptions.**
2. **🔴 ALL menu screens MUST use 2-column grid on desktop/tablet, 1-column on mobile.**
3. **NEVER deviate from these patterns without explicit architectural approval.**

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

### 3. **🔴 CRITICAL: Consistent Responsive Grid Layout & Card Dimensions**
- **MANDATORY**: All menu/selection screens MUST use 2-column grid on desktop/tablet (≥768px)
- **MANDATORY**: All menu/selection screens MUST use 1-column grid on mobile (<768px)
- **MANDATORY**: All menu cards MUST have minHeight: 180px for visual consistency
- **NO EXCEPTIONS**: This ensures UI consistency across the entire application
- Examples: Transfer Menu, Savings Menu, Loans Menu, Bill Payment Menu

### 4. **Responsive by Default**
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interfaces

### 5. **Performance Optimized**
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

### 1. **Modern Back Button Component**
**MANDATORY for all navigation**

```typescript
// Icon-only circular back button with glassmorphic effect
const ModernBackButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
          web: { backdropFilter: 'blur(10px)' }
        })
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 20, color: '#FFFFFF' }}>←</Text>
    </TouchableOpacity>
  );
};
```

**Key Points:**
- ✅ Icon-only (no "Back" text)
- ✅ Circular shape (40x40px)
- ✅ Glassmorphic background
- ✅ Clean arrow icon (←)
- ❌ Never use "← Back" or "<- Back"

### 2. **Glass Card Component**
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

### 3. **🔴 CRITICAL: Standardized Menu Card Dimensions & Content Structure**
**MANDATORY for all menu/option cards to ensure visual consistency**

```typescript
// All menu cards across the application MUST use these dimensions
const MENU_CARD_STANDARDS = {
  minHeight: 180,              // ✅ REQUIRED minimum height for all cards
  padding: 20,                 // Consistent internal spacing
  borderRadius: 20,            // Uniform rounded corners
  marginHorizontal: 8,         // Consistent gap between cards

  // Example implementation for menu cards:
  menuCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 8,
    minHeight: 180,           // 🔴 CRITICAL: Must be exactly 180px
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  }
};
```

**🔴 CRITICAL: Standardized Card Content Structure**
To maintain visual consistency, ALL menu cards must follow this content structure:

```typescript
// REQUIRED Card Content Layout (top to bottom):
1. Header Section (icon + optional badge)
   - Icon: 24-32px emoji or icon
   - Badge: Optional status/label in top-right

2. Title Section
   - Name: 18px, font-weight: 600
   - Description: 13-14px, secondary color, 1-2 lines max

3. Footer Section (key info only)
   - Left side: Primary metric (rate, fee, etc.)
   - Right side: Secondary info (min amount, duration, etc.)
   - Font sizes: 11-18px range
   - NO additional rows or complex layouts

// ❌ FORBIDDEN in menu cards:
- Multiple rows of chips/tags
- Separate action buttons at bottom
- Lists of features (keep for detail screens)
- Complex multi-line footers
- Content that causes cards to exceed 220px height

// ✅ REQUIRED:
- Keep content minimal and scannable
- Use consistent spacing between sections
- Ensure all cards have similar visual weight
```

**Applied to:**
- Transfer Menu cards
- Savings Menu cards
- Loans Menu cards
- Bills Menu cards
- Any future menu selection screens

### 4. **Section Header Component**
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

## Form Components & Input System

### **🔴 CRITICAL: Standardized Input Components**
**MANDATORY for all form inputs across the application**

All input components MUST follow the glassmorphic design system with consistent styling, validation states, and user feedback.

### **1. Text Input Component**

#### **Standard Text Input**
```typescript
import { useTenantTheme } from '../../context/TenantThemeContext';

const ModernTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled = false,
  multiline = false,
  secureTextEntry = false,
  icon,
  ...props
}) => {
  const { theme } = useTenantTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      {/* Input Wrapper */}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused(theme),
        error && styles.inputWrapperError,
        disabled && styles.inputWrapperDisabled,
      ]}>
        {/* Icon (optional) */}
        {icon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          {...props}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    minHeight: 52,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      }
    }),
  },
  inputWrapperFocused: (theme) => ({
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  }),
  inputWrapperError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputWrapperDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a2e',
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});
```

#### **Input States**
```typescript
// Default State
<ModernTextInput
  label="Account Number"
  placeholder="Enter 10-digit account number"
  value={accountNumber}
  onChangeText={setAccountNumber}
/>

// With Icon
<ModernTextInput
  label="Email Address"
  icon="✉️"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
/>

// Error State
<ModernTextInput
  label="PIN"
  value={pin}
  onChangeText={setPin}
  error="PIN must be exactly 4 digits"
  secureTextEntry
  maxLength={4}
/>

// Disabled State
<ModernTextInput
  label="Account Name"
  value="JOHN DOE (Verified)"
  disabled
/>

// Multiline
<ModernTextInput
  label="Transaction Narration"
  placeholder="Enter description (optional)"
  value={narration}
  onChangeText={setNarration}
  multiline
/>
```

### **2. Dropdown / Select Component**

```typescript
const ModernDropdown = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  error,
  disabled = false,
}) => {
  const { theme } = useTenantTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Dropdown Trigger */}
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          error && styles.dropdownTriggerError,
          disabled && styles.dropdownTriggerDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.dropdownText,
          !value && styles.dropdownPlaceholder,
        ]}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <ScrollView style={styles.dropdownList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    value === option.value && styles.dropdownOptionSelected(theme),
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    value === option.value && styles.dropdownOptionTextSelected(theme),
                  ]}>
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    minHeight: 52,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' }
    }),
  },
  dropdownTriggerError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  dropdownTriggerDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a2e',
  },
  dropdownPlaceholder: {
    color: '#94a3b8',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' }
    }),
  },
  dropdownList: {
    padding: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  dropdownOptionSelected: (theme) => ({
    backgroundColor: `${theme.colors.primary}15`,
  }),
  dropdownOptionText: {
    fontSize: 16,
    color: '#1a1a2e',
  },
  dropdownOptionTextSelected: (theme) => ({
    color: theme.colors.primary,
    fontWeight: '600',
  }),
  checkmark: {
    fontSize: 18,
    color: '#10B981',
  },
});
```

**Usage:**
```typescript
<ModernDropdown
  label="Select Bank"
  placeholder="Choose your bank"
  value={selectedBank}
  options={[
    { label: 'Access Bank', value: 'access' },
    { label: 'GTBank', value: 'gtb' },
    { label: 'Zenith Bank', value: 'zenith' },
  ]}
  onSelect={setSelectedBank}
/>
```

### **3. Date Picker Component**

```typescript
const ModernDatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  minDate,
  maxDate,
}) => {
  const { theme } = useTenantTheme();
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.datePickerContainer}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.datePickerTrigger,
          error && styles.datePickerTriggerError,
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateIcon}>📅</Text>
        <Text style={[
          styles.dateText,
          !value && styles.datePlaceholder,
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Native Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) onChange(selectedDate);
          }}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}
    </View>
  );
};
```

### **4. Checkbox Component**

```typescript
const ModernCheckbox = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  const { theme } = useTenantTheme();

  return (
    <TouchableOpacity
      style={[
        styles.checkboxContainer,
        disabled && styles.checkboxDisabled,
      ]}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Checkbox Box */}
      <View style={[
        styles.checkbox,
        checked && styles.checkboxChecked(theme),
        disabled && styles.checkboxDisabledBox,
      ]}>
        {checked && (
          <Text style={styles.checkboxIcon}>✓</Text>
        )}
      </View>

      {/* Label */}
      <Text style={[
        styles.checkboxLabel,
        disabled && styles.checkboxLabelDisabled,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: (theme) => ({
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  }),
  checkboxDisabledBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#1a1a2e',
  },
  checkboxLabelDisabled: {
    color: '#9CA3AF',
  },
});
```

### **5. Radio Button Component**

```typescript
const ModernRadioGroup = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  const { theme } = useTenantTheme();

  return (
    <View style={styles.radioGroupContainer}>
      {label && <Text style={styles.label}>{label}</Text>}

      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.radioOption}
          onPress={() => !disabled && onChange(option.value)}
          disabled={disabled}
        >
          {/* Radio Circle */}
          <View style={[
            styles.radioCircle,
            value === option.value && styles.radioCircleSelected(theme),
          ]}>
            {value === option.value && (
              <View style={styles.radioCircleInner(theme)} />
            )}
          </View>

          {/* Label */}
          <Text style={styles.radioLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  radioGroupContainer: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: (theme) => ({
    borderColor: theme.colors.primary,
  }),
  radioCircleInner: (theme) => ({
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  }),
  radioLabel: {
    fontSize: 15,
    color: '#1a1a2e',
  },
});
```

### **6. Toggle Switch Component**

```typescript
const ModernToggle = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const { theme } = useTenantTheme();

  return (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.toggleTrack,
          value && styles.toggleTrackActive(theme),
          disabled && styles.toggleTrackDisabled,
        ]}
        onPress={() => !disabled && onChange(!value)}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View style={[
          styles.toggleThumb,
          value && styles.toggleThumbActive,
        ]} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#1a1a2e',
    flex: 1,
  },
  toggleTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: (theme) => ({
    backgroundColor: theme.colors.primary,
  }),
  toggleTrackDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
```

### **7. Search Input Component**

```typescript
const ModernSearchInput = ({
  value,
  onChangeText,
  placeholder = "Search...",
  onClear,
}) => {
  const { theme } = useTenantTheme();

  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
      />
      {value && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    minHeight: 52,
    marginBottom: 16,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' }
    }),
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a2e',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#6c757d',
  },
});
```

### **8. Amount Input Component (Banking-Specific)**

```typescript
const ModernAmountInput = ({
  label,
  value,
  onChangeText,
  currency = '₦',
  error,
  maxAmount,
}) => {
  const { theme } = useTenantTheme();

  const formatAmount = (text) => {
    // Remove non-numeric characters
    const numeric = text.replace(/[^0-9]/g, '');
    // Add comma separators
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <View style={styles.amountContainer}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[
        styles.amountWrapper,
        error && styles.amountWrapperError,
      ]}>
        <Text style={styles.currencySymbol}>{currency}</Text>
        <TextInput
          style={styles.amountInput}
          value={value}
          onChangeText={(text) => onChangeText(formatAmount(text))}
          placeholder="0.00"
          keyboardType="numeric"
          placeholderTextColor="#94a3b8"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {maxAmount && (
        <Text style={styles.helperText}>
          Maximum: {currency}{formatAmount(maxAmount.toString())}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  amountContainer: {
    marginBottom: 16,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    minHeight: 64,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)' }
    }),
  },
  amountWrapperError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    marginLeft: 4,
  },
});
```

### **✅ Form Component Checklist**

Every form input MUST have:
- [ ] Glassmorphic background (`rgba(255, 255, 255, 0.95)`)
- [ ] 12px border radius
- [ ] Minimum height of 52px (48px for compact)
- [ ] Focus state with tenant primary color border
- [ ] Error state with red border (#EF4444)
- [ ] Disabled state with reduced opacity
- [ ] Clear labels (14px, font-weight: 600)
- [ ] Error messages below input (12px, red)
- [ ] Placeholder text in gray (#94a3b8)
- [ ] Touch target minimum 44x44 points

### **🎨 Input Validation States**

```typescript
// Success State (after validation)
<ModernTextInput
  label="Account Number"
  value="2011223344"
  rightIcon="✓"
  borderColor="#10B981"
/>

// Warning State
<ModernTextInput
  label="Daily Limit"
  value="100000"
  warning="Approaching daily limit"
  borderColor="#F59E0B"
/>

// Loading State
<ModernTextInput
  label="Account Name"
  value="Verifying..."
  rightIcon={<ActivityIndicator />}
  disabled
/>
```

---

## Notification System

### **Modern Glassmorphic Notifications**
**MANDATORY for all user feedback and alerts**

The platform uses a modern notification system that replaces traditional Material Design alerts with glassmorphic toasts and modals that match our design system.

#### **Key Features**
- 🎨 **Glassmorphic Design**: Semi-transparent with backdrop blur
- 🎭 **Dynamic Tenant Theming**: Uses tenant colors automatically
- 📍 **Toast Notifications**: Non-blocking feedback messages
- 🔐 **Modal Dialogs**: Blocking confirmations and prompts
- ✨ **Smooth Animations**: Slide-in/fade effects
- 📚 **Stack Management**: Multiple notifications handled gracefully

#### **Implementation**

```typescript
import { useNotification } from '../../services/ModernNotificationService';

const Component = () => {
  const notify = useNotification();

  // Toast Notifications (Non-blocking)
  notify.success('Transfer completed successfully!');
  notify.error('Payment failed', 'Payment Error');
  notify.warning('Low balance', 'Warning', 5000); // Custom duration
  notify.info('New features available');

  // Modal Notifications (Blocking)
  notify.confirm(
    'Delete Account',
    'Are you sure? This cannot be undone.',
    () => handleDelete(),
    () => handleCancel()
  );

  // Prompt for Input
  notify.prompt(
    'Enter PIN',
    'Please enter your 4-digit PIN',
    (pin) => processTransaction(pin),
    'Enter PIN'
  );
};
```

#### **Notification Types & Usage**

| Type | Use Case | Blocking | Duration |
|------|----------|----------|----------|
| `success` | Completed actions | No | 3 seconds |
| `error` | Failed operations | No | 5 seconds |
| `warning` | Important notices | No | 4 seconds |
| `info` | General information | No | 4 seconds |
| `confirm` | Critical actions | Yes | Until dismissed |
| `prompt` | User input needed | Yes | Until submitted |

#### **Best Practices**

1. **Use Toasts for Feedback**
   ```typescript
   // ✅ Good - Non-blocking success feedback
   notify.success('Settings saved');

   // ❌ Bad - Using modal for simple feedback
   notify.confirm('Success', 'Settings saved');
   ```

2. **Use Modals for Critical Actions**
   ```typescript
   // ✅ Good - Requires user confirmation
   notify.confirm('Delete', 'This cannot be undone', onDelete);

   // ❌ Bad - Using toast for destructive action
   notify.warning('Click to delete account');
   ```

3. **Provide Clear Messages**
   ```typescript
   // ✅ Good - Clear and actionable
   notify.error('Invalid PIN. Please try again.', 'Authentication Failed');

   // ❌ Bad - Vague message
   notify.error('Error occurred');
   ```

#### **Migration from AlertService**

Replace old Material Design alerts:
```typescript
// ❌ Old Way (AlertService)
import { useBankingAlert } from './AlertService';
const { showAlert } = useBankingAlert();
showAlert('Error', 'Something went wrong');

// ✅ New Way (ModernNotificationService)
import { useNotification } from './ModernNotificationService';
const notify = useNotification();
notify.error('Something went wrong', 'Error');
```

---

## Layout Patterns

### 1. **🔴 CRITICAL: Responsive Grid Layout for Menu Screens**
**MANDATORY for ALL menu/selection screens - NO EXCEPTIONS**

This is a **CORE ARCHITECTURE DECISION** that ensures consistency across the entire application.

```typescript
// REQUIRED IMPLEMENTATION for all menu screens
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isMobile = screenWidth < 768;

const styles = StyleSheet.create({
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  productCardWrapper: {
    width: isTablet ? '50%' : '100%', // 2 columns on desktop/tablet, 1 on mobile
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  productCard: {
    // Your card styles
    height: '100%', // Ensure equal heights
  }
});
```

**Strict Requirements:**
- ✅ **Desktop/Tablet (≥768px)**: MUST display 2 columns
- ✅ **Mobile (<768px)**: MUST display 1 column
- ✅ **Spacing**: MUST use 16px between cards
- ✅ **Height**: Cards MUST have equal heights within rows
- ❌ **NEVER** use different layouts for the same screen type
- ❌ **NEVER** use 3+ columns (breaks consistency)
- ❌ **NEVER** use single column on desktop (wastes space)

**Screens That MUST Follow This Pattern:**
- Transfer Menu Screen ✅
- Savings Menu Screen ✅
- Loans Menu Screen (future)
- Bill Payment Menu Screen (future)
- Investment Products Screen (future)
- Any other selection/menu screens

### 2. **Page Structure Template**
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