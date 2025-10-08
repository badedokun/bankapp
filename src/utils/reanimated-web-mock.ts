/**
 * React Native Reanimated Web Mock
 * Provides fallback animations for web using React Native Animated
 */

import { Animated } from 'react-native';
import React from 'react';

// Mock hooks
export const useSharedValue = (initialValue: any) => {
  return { value: initialValue };
};

export const useAnimatedStyle = (callback: () => any) => {
  return callback();
};

export const withSpring = (toValue: number, config?: any) => {
  return toValue;
};

export const withTiming = (toValue: number, config?: any) => {
  return toValue;
};

// Mock entering/exiting animations
export const FadeIn = {
  duration: (ms: number) => ({ springify: () => ({}) }),
};

export const FadeInDown = {
  duration: (ms: number) => ({ springify: () => ({}) }),
  delay: (ms: number) => ({ springify: () => ({}) }),
  springify: () => ({}),
};

export const FadeInUp = {
  duration: (ms: number) => ({ springify: () => ({}) }),
  delay: (ms: number) => ({ springify: () => ({}) }),
  springify: () => ({}),
};

export const FadeOut = {
  duration: (ms: number) => ({}),
};

// Default export (Animated from react-native as fallback)
export default Animated;
