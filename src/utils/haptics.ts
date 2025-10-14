/**
 * Haptic Feedback Utility
 * Provides cross-platform haptic feedback with web fallback
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticFeedbackType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  | 'selection';

/**
 * Trigger haptic feedback
 * @param type - Type of haptic feedback
 */
export const triggerHaptic = async (type: HapticFeedbackType = 'impactMedium'): Promise<void> => {
  // Web doesn't support Expo Haptics, provide fallback or skip
  if (Platform.OS === 'web') {
    // Optional: Use Web Vibration API as fallback
    if (navigator && navigator.vibrate) {
      const patterns: Record<HapticFeedbackType, number> = {
        impactLight: 10,
        impactMedium: 20,
        impactHeavy: 30,
        notificationSuccess: 15,
        notificationWarning: 20,
        notificationError: 25,
        selection: 5,
      };
      navigator.vibrate(patterns[type]);
    }
    return;
  }

  try {
    switch (type) {
      case 'impactLight':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'notificationSuccess':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'notificationWarning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'notificationError':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    // Silently fail if haptics not supported
  }
};

/**
 * Check if haptics are supported on this device
 */
export const isHapticsSupported = (): boolean => {
  if (Platform.OS === 'web') {
    return !!(navigator && navigator.vibrate);
  }
  return true; // iOS and Android support expo-haptics
};

export default {
  trigger: triggerHaptic,
  isSupported: isHapticsSupported,
};
