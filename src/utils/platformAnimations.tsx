/**
 * Platform-Specific Animation Wrapper
 *
 * Web: Uses react-native-reanimated for smooth animations
 * Mobile: Uses simple View components (no animations)
 *
 * This allows us to:
 * - Keep beautiful animations on web
 * - Build standalone mobile APKs without native dependencies
 * - Distribute to testers without Metro bundler
 */

import React from 'react';
import { Platform, View, TouchableOpacity } from 'react-native';

// Conditionally import reanimated only for web
let Animated: any;
let FadeInDown: any;
let FadeInUp: any;
let FadeIn: any;
let createAnimatedComponent: any;

if (Platform.OS === 'web') {
  try {
    const reanimated = require('react-native-reanimated');
    Animated = reanimated.default;
    FadeInDown = reanimated.FadeInDown;
    FadeInUp = reanimated.FadeInUp;
    FadeIn = reanimated.FadeIn;
    createAnimatedComponent = Animated.createAnimatedComponent;
  } catch (e) {
    console.warn('react-native-reanimated not available for web');
  }
}

/**
 * Animated View - Uses reanimated on web, plain View on mobile
 */
export const AnimatedView: React.FC<any> = ({ entering, exiting, style, children, ...props }) => {
  if (Platform.OS === 'web' && Animated) {
    return (
      <Animated.View entering={entering} exiting={exiting} style={style} {...props}>
        {children}
      </Animated.View>
    );
  }

  // Mobile: just use regular View (no animation)
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};

/**
 * Animated TouchableOpacity - Uses reanimated on web, plain TouchableOpacity on mobile
 */
export const AnimatedTouchable: React.FC<any> = ({ entering, exiting, style, children, ...props }) => {
  if (Platform.OS === 'web' && Animated && createAnimatedComponent) {
    const AnimatedTouchableOpacity = createAnimatedComponent(TouchableOpacity);
    return (
      <AnimatedTouchableOpacity entering={entering} exiting={exiting} style={style} {...props}>
        {children}
      </AnimatedTouchableOpacity>
    );
  }

  // Mobile: just use regular TouchableOpacity (no animation)
  return (
    <TouchableOpacity style={style} {...props}>
      {children}
    </TouchableOpacity>
  );
};

/**
 * Export animation presets (only work on web)
 */
export const animations = {
  fadeInUp: Platform.OS === 'web' && FadeInUp ? FadeInUp.springify() : undefined,
  fadeInDown: Platform.OS === 'web' && FadeInDown ? FadeInDown.springify() : undefined,
  fadeIn: Platform.OS === 'web' && FadeIn ? FadeIn.duration(300) : undefined,
};

/**
 * Check if animations are available
 */
export const hasAnimations = Platform.OS === 'web' && !!Animated;

export default {
  AnimatedView,
  AnimatedTouchable,
  animations,
  hasAnimations,
};
