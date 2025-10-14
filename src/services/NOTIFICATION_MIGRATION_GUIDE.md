# 🔔 Modern Notification System Migration Guide

## Overview

We are replacing the Material Design-based AlertService with a modern, glassmorphic notification system that aligns with our Modern UI Design System.

## 🆚 Comparison

### Old System (AlertService - Material Design)
❌ Material Design 3 styling (doesn't match our UI)
❌ Hardcoded colors
❌ Only modal dialogs (intrusive)
❌ No toast notifications
❌ No animations
❌ Not tenant-aware

### New System (ModernNotificationService - Glassmorphic)
✅ Glassmorphic design matching our UI
✅ Dynamic tenant colors
✅ Both toast and modal notifications
✅ Smooth animations
✅ Stack management for multiple notifications
✅ Fully tenant-aware

## 📦 Implementation

### 1. Setup Provider in App.tsx

```typescript
import { ModernNotificationProvider } from './services/ModernNotificationService';
import { TenantThemeProvider } from './context/TenantThemeContext';

function App() {
  return (
    <TenantThemeProvider>
      <ModernNotificationProvider>
        {/* Your app content */}
      </ModernNotificationProvider>
    </TenantThemeProvider>
  );
}
```

### 2. Replace AlertService Usage

#### Old Way (AlertService)
```typescript
import { useBankingAlert } from '../../services/AlertService';

const Component = () => {
  const { showAlert, showConfirm } = useBankingAlert();

  // Basic alert
  showAlert('Error', 'Something went wrong');

  // Confirmation
  showConfirm('Delete', 'Are you sure?', onConfirm, onCancel);
};
```

#### New Way (ModernNotificationService)
```typescript
import { useNotification } from '../../services/ModernNotificationService';

const Component = () => {
  const notify = useNotification();

  // Toast notifications (non-blocking)
  notify.success('Transfer completed successfully!');
  notify.error('Failed to process payment', 'Payment Error');
  notify.warning('Low balance warning', 'Balance Alert', 5000);
  notify.info('New features available');

  // Modal notifications (blocking)
  notify.confirm(
    'Delete Account',
    'Are you sure you want to delete this account? This action cannot be undone.',
    () => handleDelete(),
    () => handleCancel()
  );

  // Prompt for input
  notify.prompt(
    'Enter PIN',
    'Please enter your 4-digit transaction PIN',
    (pin) => processTransaction(pin),
    'Enter PIN'
  );
};
```

## 🎨 Advanced Features

### Custom Toast with Actions

```typescript
import { useModernNotification } from '../../services/ModernNotificationService';

const Component = () => {
  const { showToast } = useModernNotification();

  showToast({
    type: 'warning',
    title: 'Pending Transfer',
    message: 'You have a pending transfer of ₦50,000',
    duration: 0, // Persistent
    actions: [
      {
        label: 'View',
        style: 'primary',
        onPress: () => navigateToTransfer()
      },
      {
        label: 'Cancel',
        style: 'destructive',
        onPress: () => cancelTransfer()
      }
    ]
  });
};
```

### Custom Modal with Input

```typescript
const { showModal } = useModernNotification();

showModal({
  title: 'Verify Identity',
  message: 'Enter your BVN to continue',
  type: 'info',
  input: {
    placeholder: 'Enter 11-digit BVN',
    keyboardType: 'numeric',
  },
  actions: [
    {
      label: 'Cancel',
      style: 'cancel',
      onPress: () => {}
    },
    {
      label: 'Verify',
      style: 'primary',
      onPress: (bvn) => verifyBVN(bvn)
    }
  ]
});
```

## 🔄 Migration Checklist

### Phase 1: Setup (Immediate)
- [ ] Add ModernNotificationProvider to App.tsx
- [ ] Import useNotification in new components
- [ ] Test toast notifications in development

### Phase 2: Migration (This Sprint)
- [ ] Replace AlertService in LoginScreen
- [ ] Replace AlertService in TransferScreen
- [ ] Replace AlertService in DashboardScreen
- [ ] Replace AlertService in TransactionHistoryScreen
- [ ] Replace all showAlert() calls with notify.error() or notify.info()
- [ ] Replace all showConfirm() calls with notify.confirm()

### Phase 3: Deprecation (Next Sprint)
- [ ] Remove BankingAlertProvider from App.tsx
- [ ] Remove AlertService.tsx file
- [ ] Remove react-native-paper-alerts dependency
- [ ] Update documentation

## 📝 Best Practices

### 1. Use Toast for Non-Critical Messages
```typescript
// ✅ Good - Non-blocking feedback
notify.success('Settings saved');
notify.info('New messages available');

// ❌ Bad - Using modal for simple feedback
showModal({ title: 'Success', message: 'Settings saved' });
```

### 2. Use Modal for Critical Actions
```typescript
// ✅ Good - Requires user attention
notify.confirm('Delete Account', 'This cannot be undone', onDelete);

// ❌ Bad - Using toast for critical action
notify.warning('Click to delete account');
```

### 3. Provide Clear Actions
```typescript
// ✅ Good - Clear action labels
showToast({
  type: 'info',
  title: 'Update Available',
  message: 'A new version is available',
  actions: [
    { label: 'Update Now', style: 'primary', onPress: updateApp },
    { label: 'Later', onPress: dismissUpdate }
  ]
});

// ❌ Bad - Vague actions
actions: [{ label: 'OK' }, { label: 'Cancel' }]
```

### 4. Use Appropriate Duration
```typescript
// ✅ Good
notify.success('Saved', undefined, 2000); // Quick success
notify.error('Network error', 'Error', 5000); // Longer for errors
showToast({ duration: 0, ... }); // Persistent for critical

// ❌ Bad
notify.error('Critical error', undefined, 1000); // Too short
notify.success('Saved', undefined, 10000); // Too long
```

## 🎯 Type Definitions

```typescript
// Notification Types
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

// Toast Configuration
interface NotificationConfig {
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  position?: 'top' | 'bottom';
  actions?: NotificationAction[];
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Modal Configuration
interface ModalConfig {
  title: string;
  message: string;
  type?: NotificationType;
  actions?: ModalAction[];
  input?: {
    placeholder?: string;
    defaultValue?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address';
  };
  dismissible?: boolean;
}
```

## 🚀 Benefits of Migration

1. **Consistent UI**: Matches our glassmorphic design system
2. **Better UX**: Non-blocking toasts for feedback, modals for critical actions
3. **Tenant Awareness**: Uses dynamic colors from tenant configuration
4. **Modern Animations**: Smooth transitions and stacking
5. **Accessibility**: Better screen reader support and keyboard navigation
6. **Performance**: Lightweight and optimized for mobile

## ⚠️ Important Notes

- The new system requires TenantThemeProvider to be present
- Toast notifications auto-dismiss by default (4 seconds)
- Modals are dismissible by clicking backdrop unless `dismissible: false`
- All colors come from tenant theme, no hardcoding allowed
- Test on both iOS and Android for platform-specific styling

## 📞 Support

For questions or issues during migration:
- Check this guide first
- Review ModernNotificationService.tsx for implementation details
- Test in development environment before production

---

**Migration Deadline**: End of current sprint
**Deprecation Date**: AlertService will be removed in next release