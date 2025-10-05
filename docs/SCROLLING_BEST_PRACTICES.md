# Scrolling Best Practices - OrokiiPay BankApp

**Quick Reference Guide for Developers**

---

## TL;DR - Copy/Paste Template

Use this template for **ALL new form screens**:

```typescript
import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

const YourFormScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Your form inputs here */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

---

## When to Use What

### 1. Form Screens (with inputs)
**ALWAYS use KeyboardAvoidingView + ScrollView**

✅ **Use for:**
- Login screens
- Transfer forms
- Bill payment forms
- Settings with input fields
- Any screen with TextInput

❌ **Don't use for:**
- Read-only dashboards
- List screens without inputs

---

### 2. List Screens (no forms)
**Use ScrollView OR FlatList**

✅ **ScrollView** for:
- Small lists (< 50 items)
- Mixed content layouts
- Dashboard sections

✅ **FlatList** for:
- Large lists (> 50 items)
- Transaction history
- Bank selection lists

---

### 3. Modal Screens
**CRITICAL: Modal must be OUTSIDE ScrollView**

```typescript
// ✅ CORRECT
<View style={{ flex: 1 }}>
  <ScrollView>{/* Main content */}</ScrollView>

  <Modal visible={showModal}>
    <View style={styles.modalContent}>
      <FlatList nestedScrollEnabled={true} />
    </View>
  </Modal>
</View>

// ❌ WRONG - Modal scrolling won't work!
<ScrollView>
  <Modal>
    <FlatList />
  </Modal>
</ScrollView>
```

---

## Essential Props Explained

### KeyboardAvoidingView

```typescript
<KeyboardAvoidingView
  style={{ flex: 1 }}                           // Must be flex: 1
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  // Platform-specific
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}  // Fine-tune if needed
>
```

**Why:**
- iOS works best with `'padding'`
- Android works best with `'height'`
- Without this, keyboard covers your inputs!

---

### ScrollView Configuration

```typescript
<ScrollView
  style={{ flex: 1 }}                           // Container fills space
  contentContainerStyle={{ paddingBottom: 100 }} // Space for buttons
  showsVerticalScrollIndicator={Platform.OS === 'web'}  // Only show on web
  keyboardShouldPersistTaps="handled"           // Tap outside dismisses keyboard
  nestedScrollEnabled={true}                    // Allows nested scrolling
>
```

**Why each prop matters:**
- `flex: 1` - Makes ScrollView fill available space
- `paddingBottom: 100` - Prevents floating buttons from covering content
- `Platform.OS === 'web'` - Web users expect scrollbars
- `keyboardShouldPersistTaps="handled"` - Better UX when keyboard is open
- `nestedScrollEnabled={true}` - Required if screen is wrapped in another ScrollView

---

## Common Mistakes to Avoid

### ❌ Mistake #1: No KeyboardAvoidingView on Forms
```typescript
// WRONG
<SafeAreaView>
  <ScrollView>
    <TextInput />
  </ScrollView>
</SafeAreaView>
```

**Problem:** Keyboard covers the input field!

**Fix:** Wrap ScrollView with KeyboardAvoidingView

---

### ❌ Mistake #2: Modal Inside ScrollView
```typescript
// WRONG
<ScrollView>
  <Modal>
    <FlatList data={items} />
  </Modal>
</ScrollView>
```

**Problem:** FlatList inside Modal won't scroll!

**Fix:** Move Modal outside ScrollView

---

### ❌ Mistake #3: Missing nestedScrollEnabled
```typescript
// POTENTIALLY PROBLEMATIC
<ScrollView>
  <MyComponent />  // This component also has ScrollView inside
</ScrollView>
```

**Problem:** Nested scrolling may not work properly

**Fix:** Add `nestedScrollEnabled={true}` to inner ScrollView

---

### ❌ Mistake #4: No Bottom Padding
```typescript
// WRONG
<ScrollView style={{ flex: 1 }}>
  <Button title="Submit" />  // Button at bottom
</ScrollView>
```

**Problem:** Button may be cut off or hidden by keyboard

**Fix:** Add `contentContainerStyle={{ paddingBottom: 100 }}`

---

## Platform-Specific Behavior

### iOS
- Uses `'padding'` behavior for KeyboardAvoidingView
- Native bounce scrolling (don't disable!)
- Keyboard slides up smoothly

### Android
- Uses `'height'` behavior for KeyboardAvoidingView
- May need `keyboardVerticalOffset={20}` adjustment
- Keyboard may resize or overlay

### Web
- Show scroll indicators: `showsVerticalScrollIndicator={Platform.OS === 'web'}`
- No keyboard overlay issues (keyboard doesn't cover screen)
- Mouse wheel should work automatically

---

## Gold Standard Examples

### Example 1: ModernDashboardWithAI.tsx
**Best dashboard implementation**

```typescript
<ScrollView
  style={styles.scrollContainer}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={true}
  nestedScrollEnabled={true}
>
  {/* Dashboard content */}
</ScrollView>
```

**Why it's good:**
- Clean and simple
- Proper padding for floating buttons
- Nested scrolling enabled
- Works on all platforms

---

### Example 2: InternalTransferScreen.tsx
**Best form screen implementation**

```typescript
<SafeAreaView style={styles.container}>
  <TransferHeader />

  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
    >
      <Input label="Amount" />
      <Input label="Account Number" />
      <Button title="Submit" />
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

**Why it's good:**
- All inputs accessible with keyboard open
- Platform-specific keyboard behavior
- Proper padding for submit button
- Works on iOS, Android, and Web

---

### Example 3: ExternalTransferScreen.tsx
**Best modal implementation**

```typescript
<SafeAreaView style={styles.container}>
  <KeyboardAvoidingView style={{ flex: 1 }}>
    <ScrollView>
      {/* Main content */}
    </ScrollView>
  </KeyboardAvoidingView>

  {/* Modal OUTSIDE ScrollView */}
  <Modal visible={showBankModal}>
    <Pressable style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <FlatList
          data={banks}
          nestedScrollEnabled={true}  // Critical!
          showsVerticalScrollIndicator={true}
        />
      </View>
    </Pressable>
  </Modal>
</SafeAreaView>
```

**Why it's good:**
- Modal renders outside scroll context
- FlatList scrolls independently
- nestedScrollEnabled prevents conflicts
- Proper modal architecture

---

## Quick Debugging Checklist

### Keyboard covering inputs?
- [ ] Add KeyboardAvoidingView wrapper
- [ ] Use correct behavior: iOS = 'padding', Android = 'height'
- [ ] Check keyboardVerticalOffset

### Can't scroll in modal?
- [ ] Move Modal outside ScrollView
- [ ] Add nestedScrollEnabled={true} to FlatList

### Bottom content cut off?
- [ ] Add contentContainerStyle={{ paddingBottom: 100 }}
- [ ] Increase padding if using floating buttons

### Nested scrolling not working?
- [ ] Add nestedScrollEnabled={true}
- [ ] Check if multiple ScrollViews nested

### Web scrolling issues?
- [ ] Set showsVerticalScrollIndicator={Platform.OS === 'web'}
- [ ] Check if flex: 1 on container

---

## Testing Checklist

Before committing any screen with forms:

### Manual Testing
- [ ] Open keyboard - does it cover inputs? (NO = ✅)
- [ ] Can you scroll to bottom with keyboard open? (YES = ✅)
- [ ] Tap outside input - does keyboard dismiss? (YES = ✅)
- [ ] Can you reach submit button? (YES = ✅)
- [ ] Does modal scroll independently? (YES = ✅)

### Platform Testing
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on web browser
- [ ] Test on physical device (if possible)

### Screen Size Testing
- [ ] Small phone (< 375px)
- [ ] Regular phone (375-414px)
- [ ] Tablet (768-1024px)
- [ ] Desktop (> 1024px)

---

## Performance Tips

### Use FlatList for long lists
```typescript
// ✅ For 100+ items
<FlatList
  data={transactions}
  renderItem={({ item }) => <TransactionRow />}
  keyExtractor={(item) => item.id}
  nestedScrollEnabled={true}
/>

// ❌ For 100+ items
<ScrollView>
  {transactions.map(t => <TransactionRow key={t.id} />)}
</ScrollView>
```

### Optimize contentContainerStyle
```typescript
// ✅ Define once outside render
const scrollContentStyle = { paddingBottom: 100 };

<ScrollView contentContainerStyle={scrollContentStyle}>

// ❌ Creates new object every render
<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
```

### Memoize expensive components
```typescript
import { memo } from 'react';

const ExpensiveListItem = memo(({ item }) => {
  // Complex rendering
});
```

---

## Resources

### Internal Documentation
- SCROLLING_AUDIT_REPORT.md - Complete audit findings
- SCROLLING_FIXES_SUMMARY.md - All fixes implemented
- PROJECT_OVERVIEW.md - Project context

### External Resources
- [React Native ScrollView Docs](https://reactnative.dev/docs/scrollview)
- [KeyboardAvoidingView Docs](https://reactnative.dev/docs/keyboardavoidingview)
- [FlatList Docs](https://reactnative.dev/docs/flatlist)

---

## Questions?

If you're unsure about scrolling implementation:

1. Check this guide first
2. Look at ModernDashboardWithAI.tsx (gold standard)
3. Look at InternalTransferScreen.tsx (forms)
4. Look at ExternalTransferScreen.tsx (modals)
5. Ask the team!

---

**Last Updated:** January 2025
**Maintained By:** OrokiiPay Development Team
**Status:** ✅ Production Ready
