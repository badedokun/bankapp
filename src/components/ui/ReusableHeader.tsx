/**
 * ReusableHeader Component
 *
 * A reusable header container that meets World-Class UI standards:
 * - Consistent 20px horizontal margins (matches content sections)
 * - Max-width constraint for ultra-wide screens
 * - Consistent spacing across all screens
 * - Platform-specific styling (shadows, blur effects)
 * - Theme integration
 *
 * Usage:
 * <ReusableHeader>
 *   <YourHeaderContent />
 * </ReusableHeader>
 */

import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface ReusableHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  withGlassmorphism?: boolean;
  withBorder?: boolean;
  borderColor?: string;
  maxWidth?: number; // Optional max-width (default: 1440px)
}

const ReusableHeader: React.FC<ReusableHeaderProps> = ({
  children,
  style,
  backgroundColor = 'rgba(255, 255, 255, 0.95)',
  withGlassmorphism = true,
  withBorder = true,
  borderColor = 'rgba(255, 255, 255, 0.2)',
  maxWidth = 1440,
}) => {
  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor,
            maxWidth: maxWidth,
            borderBottomWidth: withBorder ? 1 : 0,
            borderBottomColor: borderColor,
            ...Platform.select({
              web: withGlassmorphism
                ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }
                : {},
            }),
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
  },
  headerContainer: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: Platform.OS === 'web' ? 12 : 16,
    paddingBottom: 12,
    overflow: 'visible',
  },
});

export default ReusableHeader;
