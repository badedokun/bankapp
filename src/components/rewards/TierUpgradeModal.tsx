/**
 * Tier Upgrade Modal Component
 * Celebration modal for tier upgrades with fireworks animation
 * Shows old → new tier transition with perks unlocked
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

interface TierUpgradeModalProps {
  visible: boolean;
  oldTier: {
    tierName: string;
    tierLevel: number;
    icon: string;
    color: string;
  };
  newTier: {
    tierName: string;
    tierLevel: number;
    icon: string;
    color: string;
    perks?: string[];
  };
  bonusPoints?: number;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  visible,
  oldTier,
  newTier,
  bonusPoints = 0,
  onClose,
}) => {
  const { theme } = useTenantTheme() as any;
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  useEffect(() => {
    if (visible) {
      // Trigger strong haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show confetti
      setShowConfetti(true);

      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setShowConfetti(false);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  const confettiColors = [
    newTier.color,
    oldTier.color,
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#F7DC6F',
    '#BB8FCE',
  ];

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
          duration={4000}
          particleCount={80}
          colors={confettiColors}
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
                maxWidth: isMobile ? width - 40 : 550,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Typography.DisplaySmall style={{ fontSize: 40, marginBottom: 8 }}>
                🎊
              </Typography.DisplaySmall>
              <Typography.HeadlineLarge style={{ fontWeight: '800', textAlign: 'center' }}>
                Tier Upgrade!
              </Typography.HeadlineLarge>
              <Typography.BodyMedium
                color={theme.colors.textSecondary}
                style={{ textAlign: 'center', marginTop: 8 }}
              >
                Congratulations on reaching the next level
              </Typography.BodyMedium>
            </View>

            {/* Tier Transition */}
            <Animated.View
              style={[
                styles.tierTransition,
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* Old Tier */}
              <View style={styles.tierContainer}>
                <View
                  style={[
                    styles.tierIcon,
                    {
                      backgroundColor: oldTier.color + '20',
                      borderColor: oldTier.color + '50',
                    },
                  ]}
                >
                  <Typography.DisplayMedium style={{ fontSize: 50 }}>
                    {oldTier.icon}
                  </Typography.DisplayMedium>
                </View>
                <Typography.TitleMedium
                  color={theme.colors.textSecondary}
                  style={{ marginTop: 8 }}
                >
                  {oldTier.tierName}
                </Typography.TitleMedium>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Typography.DisplayMedium color={newTier.color}>
                  →
                </Typography.DisplayMedium>
              </View>

              {/* New Tier */}
              <View style={styles.tierContainer}>
                <View
                  style={[
                    styles.tierIcon,
                    styles.newTierIcon,
                    {
                      backgroundColor: newTier.color + '20',
                      borderColor: newTier.color,
                    },
                  ]}
                >
                  <Typography.DisplayMedium style={{ fontSize: 50 }}>
                    {newTier.icon}
                  </Typography.DisplayMedium>
                </View>
                <Typography.TitleMedium
                  color={newTier.color}
                  style={{ marginTop: 8, fontWeight: '800' }}
                >
                  {newTier.tierName}
                </Typography.TitleMedium>
              </View>
            </Animated.View>

            {/* Bonus Points */}
            {bonusPoints > 0 && (
              <View
                style={[
                  styles.bonusContainer,
                  {
                    backgroundColor: newTier.color + '15',
                  },
                ]}
              >
                <Typography.BodyLarge color={newTier.color} style={{ fontWeight: '700' }}>
                  🎁 Bonus: +{bonusPoints} points
                </Typography.BodyLarge>
              </View>
            )}

            {/* New Perks */}
            {newTier.perks && newTier.perks.length > 0 && (
              <View style={styles.perksContainer}>
                <Typography.TitleSmall style={{ fontWeight: '700', marginBottom: 12 }}>
                  🌟 New Perks Unlocked
                </Typography.TitleSmall>
                {newTier.perks.map((perk, index) => (
                  <View key={index} style={styles.perkItem}>
                    <Typography.BodyMedium color={newTier.color} style={{ marginRight: 8 }}>
                      ✓
                    </Typography.BodyMedium>
                    <Typography.BodyMedium
                      color={theme.colors.text}
                      style={{ flex: 1, lineHeight: 22 }}
                    >
                      {perk}
                    </Typography.BodyMedium>
                  </View>
                ))}
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: newTier.color,
                },
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Typography.LabelLarge style={{ color: '#FFFFFF', fontWeight: '700' }}>
                Continue to {newTier.tierName} 🚀
              </Typography.LabelLarge>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 550,
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
    alignItems: 'center',
    marginBottom: 32,
  },
  tierTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  tierContainer: {
    alignItems: 'center',
    flex: 1,
  },
  tierIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTierIcon: {
    borderWidth: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
      },
    }),
  },
  arrowContainer: {
    marginHorizontal: 16,
  },
  bonusContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  perksContainer: {
    width: '100%',
    marginBottom: 24,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
});

export default TierUpgradeModal;
