/**
 * Cross-platform LinearGradient Component
 * Provides gradient support for both React Native and React Web
 */

import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Helper function to convert React Native styles to web-compatible CSS
const convertStyleToWeb = (rnStyle: ViewStyle): React.CSSProperties => {
  const webStyle: React.CSSProperties = {};

  if (rnStyle) {
    // Convert common React Native styles to web CSS
    Object.entries(rnStyle).forEach(([key, value]) => {
      switch (key) {
        case 'backgroundColor':
        case 'borderColor':
        case 'color':
          webStyle[key as keyof React.CSSProperties] = value as string;
          break;
        case 'borderRadius':
        case 'borderWidth':
        case 'width':
        case 'height':
        case 'margin':
        case 'marginTop':
        case 'marginBottom':
        case 'marginLeft':
        case 'marginRight':
        case 'padding':
        case 'paddingTop':
        case 'paddingBottom':
        case 'paddingLeft':
        case 'paddingRight':
        case 'top':
        case 'bottom':
        case 'left':
        case 'right':
          webStyle[key as keyof React.CSSProperties] = typeof value === 'number' ? `${value}px` : value as string;
          break;
        case 'flex':
        case 'flexDirection':
        case 'justifyContent':
        case 'alignItems':
        case 'position':
        case 'overflow':
        case 'opacity':
          webStyle[key as keyof React.CSSProperties] = value as any;
          break;
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
          // Skip shadow properties for now, they need special handling
          break;
        default:
          // For other properties, try to convert them directly
          if (typeof value === 'string' || typeof value === 'number') {
            (webStyle as any)[key] = value;
          }
          break;
      }
    });
  }

  return webStyle;
};

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
}) => {
  if (Platform.OS === 'web') {
    // Web implementation using CSS gradients
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
    const baseStyle = convertStyleToWeb(style || {});
    const gradientStyle: React.CSSProperties = {
      ...baseStyle,
      background: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
    };

    return (
      <div style={gradientStyle}>
        {children}
      </div>
    );
  }

  // For React Native, we'll use a fallback with the first color
  // In a real RN app, you would install and use react-native-linear-gradient
  const fallbackStyle: ViewStyle = {
    ...style,
    backgroundColor: colors[0] || 'transparent',
  };

  return (
    <View style={fallbackStyle}>
      {children}
    </View>
  );
};

export default LinearGradient;