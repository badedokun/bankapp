/**
 * Achievement Unlock Modal Component
 * Celebration modal that appears when a user unlocks an achievement
 * Shows achievement details with confetti animation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useTenantTheme } from '../../context/TenantThemeContext';
import Typography from '../ui/Typography';
import ConfettiAnimation from './ConfettiAnimation';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Interfaces
// ============================================================================

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: {
    name: string;
    description: string;
    icon: string;
    badgeColor: string;
    pointsReward: number;
    category: string;
  };
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const { theme } = useTenantTheme() as any;
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show confetti
      setShowConfetti(true);

      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      setShowConfetti(false);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate modal exit
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Animation */}
        <ConfettiAnimation
          show={showConfetti}
          duration={3000}
          particleCount={60}
          onComplete={() => setShowConfetti(false)}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                maxWidth: isMobile ? width - 40 : 500,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Typography.HeadlineLarge style={{ fontWeight: '800', textAlign: 'center' }}>
                🎉 Achievement Unlocked!
              </Typography.HeadlineLarge>
            </View>

            {/* Achievement Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: achievement.badgeColor + '20',
                  borderColor: achievement.badgeColor,
                },
              ]}
            >
              <Typography.DisplayLarge style={{ fontSize: 80 }}>
                {achievement.icon}
              </Typography.DisplayLarge>
            </View>

            {/* Achievement Info */}
            <View style={styles.infoContainer}>
              {/* Category Badge */}
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: achievement.badgeColor + '20',
                  },
                ]}
              >
                <Typography.LabelSmall
                  color={achievement.badgeColor}
                  style={{ fontWeight: '700', textTransform: 'uppercase' }}
                >
                  {achievement.category}
                </Typography.LabelSmall>
              </View>

              {/* Achievement Name */}
              <Typography.TitleLarge
                style={{ fontWeight: '800', textAlign: 'center', marginTop: 12 }}
              >
                {achievement.name}
              </Typography.TitleLarge>

              {/* Description */}
              <Typography.BodyMedium
                color={theme.colors.textSecondary}
                style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}
              >
                {achievement.description}
              </Typography.BodyMedium>

              {/* Points Reward */}
              <View style={styles.rewardContainer}>
                <Typography.DisplayMedium
                  color={achievement.badgeColor}
                  style={{ fontWeight: '800' }}
                >
                  +{achievement.pointsReward}
                </Typography.DisplayMedium>
                <Typography.BodyLarge color={theme.colors.textSecondary}>
                  points earned
                </Typography.BodyLarge>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: achievement.badgeColor,
                },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Typography.LabelLarge style={{ color: '#FFFFFF', fontWeight: '700' }}>
                Awesome! 🎊
              </Typography.LabelLarge>
            </TouchableOpacity>

            {/* Share Button (Optional) */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // TODO: Implement share functionality
              }}
              activeOpacity={0.7}
            >
              <Typography.LabelMedium color={theme.colors.textSecondary}>
                Share Achievement 📤
              </Typography.LabelMedium>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  header: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    width: '100%',
    gap: 4,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  shareButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});

export default AchievementUnlockModal;
