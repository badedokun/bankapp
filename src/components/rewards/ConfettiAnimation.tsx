/**
 * Confetti Animation Component
 * Celebration animation for achievement unlocks and milestones
 * Pure React Native implementation (no Lottie required)
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';

// ============================================================================
// Interfaces
// ============================================================================

interface ConfettiAnimationProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

// ============================================================================
// Component
// ============================================================================

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  show,
  duration = 3000,
  particleCount = 50,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
  onComplete,
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    if (show) {
      // Create particles
      const particles: Particle[] = Array.from({ length: particleCount }, () => {
        const randomX = Math.random() * width;
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomShape: 'circle' | 'square' | 'triangle' =
          ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as any;

        return {
          x: new Animated.Value(randomX),
          y: new Animated.Value(-50),
          rotation: new Animated.Value(0),
          scale: new Animated.Value(1),
          color: randomColor,
          shape: randomShape,
        };
      });

      particlesRef.current = particles;

      // Animate all particles
      const animations = particles.map((particle) => {
        const fallDistance = height + 100;
        const randomRotation = Math.random() * 720 - 360; // Random rotation between -360 and 360
        const randomScale = 0.5 + Math.random() * 0.5; // Random scale between 0.5 and 1
        const randomDuration = duration * (0.8 + Math.random() * 0.4); // Vary duration slightly

        return Animated.parallel([
          // Fall down
          Animated.timing(particle.y, {
            toValue: fallDistance,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          // Rotate
          Animated.timing(particle.rotation, {
            toValue: randomRotation,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          // Scale
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: randomScale,
              duration: randomDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: randomDuration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      // Start all animations
      Animated.parallel(animations).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    }
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: particle.x,
              transform: [
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          {particle.shape === 'circle' && (
            <View style={[styles.circle, { backgroundColor: particle.color }]} />
          )}
          {particle.shape === 'square' && (
            <View style={[styles.square, { backgroundColor: particle.color }]} />
          )}
          {particle.shape === 'triangle' && (
            <View style={[styles.triangleContainer]}>
              <View style={[styles.triangle, { borderBottomColor: particle.color }]} />
            </View>
          )}
        </Animated.View>
      ))}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    ...Platform.select({
      web: {
        pointerEvents: 'none',
      },
    }),
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  square: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  triangleContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default ConfettiAnimation;
