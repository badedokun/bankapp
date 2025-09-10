/**
 * OrokiiPay Avatar Component
 * User profile pictures and initials display
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { createAvatarStyles } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  src?: string;
  name?: string;
  fallbackText?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Banking specific
  kycStatus?: 'verified' | 'pending' | 'rejected';
  accountType?: 'individual' | 'business' | 'premium';
  isVip?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  src,
  name,
  fallbackText,
  status,
  showStatus = false,
  style,
  textStyle,
  kycStatus,
  accountType,
  isVip = false,
}) => {
  const theme = useTheme();
  const avatarStyles = createAvatarStyles(theme, {
    size,
    status,
    showStatus,
    kycStatus,
    accountType,
  });

  // Generate initials from name
  const getInitials = () => {
    if (fallbackText) return fallbackText;
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Get status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return theme.colors.semantic.success[500];
      case 'away':
        return theme.colors.semantic.warning[500];
      case 'busy':
        return theme.colors.semantic.error[500];
      case 'offline':
      default:
        return theme.colors.neutral[400];
    }
  };

  // Get KYC indicator color
  const getKycColor = () => {
    switch (kycStatus) {
      case 'verified':
        return theme.colors.semantic.success[500];
      case 'pending':
        return theme.colors.semantic.warning[500];
      case 'rejected':
        return theme.colors.semantic.error[500];
      default:
        return 'transparent';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.avatar, avatarStyles.container]}>
        {src ? (
          <Image
            source={{ uri: src }}
            style={[styles.image, avatarStyles.image]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fallback, avatarStyles.fallback]}>
            <Text style={[styles.initials, avatarStyles.text, textStyle]}>
              {getInitials()}
            </Text>
          </View>
        )}
        
        {/* VIP Badge */}
        {isVip && (
          <View style={[styles.vipBadge, avatarStyles.vipBadge]}>
            <Text style={styles.vipText}>⭐</Text>
          </View>
        )}
        
        {/* Status Indicator */}
        {showStatus && status && (
          <View 
            style={[
              styles.statusIndicator, 
              avatarStyles.statusIndicator,
              { backgroundColor: getStatusColor() }
            ]} 
          />
        )}
        
        {/* KYC Status Indicator */}
        {kycStatus && (
          <View 
            style={[
              styles.kycIndicator, 
              avatarStyles.kycIndicator,
              { backgroundColor: getKycColor() }
            ]} 
          />
        )}
      </View>
      
      {/* Account Type Badge */}
      {accountType && accountType !== 'individual' && (
        <View style={[styles.accountBadge, avatarStyles.accountBadge]}>
          <Text style={[styles.accountText, avatarStyles.accountText]}>
            {accountType === 'business' ? '💼' : accountType === 'premium' ? '💎' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

// Avatar Group Component
export const AvatarGroup: React.FC<{
  avatars: Array<{
    src?: string;
    name?: string;
    key?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  spacing?: number;
}> = ({ avatars, max = 3, size = 'md', spacing = -8 }) => {
  const theme = useTheme();
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);
  
  return (
    <View style={styles.avatarGroup}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={avatar.key || index}
          style={[
            styles.groupAvatar,
            { marginLeft: index > 0 ? spacing : 0, zIndex: max - index }
          ]}
        >
          <Avatar
            size={size}
            src={avatar.src}
            name={avatar.name}
            style={styles.groupAvatarBorder}
          />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupAvatar,
            { marginLeft: spacing, zIndex: 0 }
          ]}
        >
          <Avatar
            size={size}
            fallbackText={`+${remainingCount}`}
            style={[styles.groupAvatarBorder, styles.remainingAvatar]}
          />
        </View>
      )}
    </View>
  );
};

// Banking Customer Avatar
export const CustomerAvatar: React.FC<{
  customer: {
    id: string;
    name: string;
    profilePicture?: string;
    kycStatus: 'verified' | 'pending' | 'rejected';
    accountType: 'individual' | 'business' | 'premium';
    isOnline?: boolean;
    isVip?: boolean;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStatus?: boolean;
  onPress?: () => void;
}> = ({ customer, size = 'md', showStatus = true, onPress }) => {
  return (
    <Avatar
      size={size}
      src={customer.profilePicture}
      name={customer.name}
      status={customer.isOnline ? 'online' : 'offline'}
      showStatus={showStatus}
      kycStatus={customer.kycStatus}
      accountType={customer.accountType}
      isVip={customer.isVip}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  avatar: {
    position: 'relative',
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  initials: {
    fontWeight: '600',
    color: '#374151',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  kycIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  vipBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  vipText: {
    fontSize: 10,
    color: '#ffffff',
  },
  accountBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  accountText: {
    fontSize: 10,
    color: '#ffffff',
  },
  
  // Avatar Group Styles
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    position: 'relative',
  },
  groupAvatarBorder: {
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  remainingAvatar: {
    backgroundColor: '#f3f4f6',
  },
});

export default Avatar;