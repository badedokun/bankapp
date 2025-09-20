/**
 * OrokiiPay Design System - Navigation Components
 * Navigation patterns for multi-tenant banking platform
 */

import { OrokiiPayTheme } from './theme';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
  onClick?: () => void;
}

export interface NavigationStyleProps {
  variant?: 'horizontal' | 'vertical' | 'bottom' | 'sidebar';
  size?: 'sm' | 'md' | 'lg';
  elevated?: boolean;
  sticky?: boolean;
  collapsed?: boolean;
}

export interface NavigationStyles {
  container: any;
  item: any;
  link: any;
  icon: any;
  label: any;
  badge: any;
  divider: any;
  [key: string]: any;
}

// Header/Top Navigation styles
export function createHeaderNavigationStyles(theme: OrokiiPayTheme, props: NavigationStyleProps = {}): NavigationStyles {
  const { variant = 'horizontal', size = 'md', elevated = true, sticky = false } = props;
  
  const baseContainer = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.computed.background.surface,
    borderBottom: `1px solid ${theme.computed.border.light}`,
    padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
    position: sticky ? 'sticky' : 'relative',
    top: sticky ? 0 : 'auto',
    zIndex: sticky ? 1000 : 'auto',
    boxShadow: elevated ? theme.shadows.sm : 'none',
    transition: 'all 0.2s ease-in-out',
  };
  
  const sizeStyles = {
    sm: {
      height: 56,
      padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
    },
    md: {
      height: 64,
      padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
    },
    lg: {
      height: 72,
      padding: `${theme.spacing[4]}px ${theme.spacing[4]}px`,
    },
  };
  
  return {
    container: {
      ...baseContainer,
      ...sizeStyles[size],
      justifyContent: 'space-between',
    },
    
    brand: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      color: theme.computed.text.primary,
      fontWeight: theme.typography.fontWeight.bold,
      fontSize: theme.typography.fontSize.xl,
    },
    
    brandLogo: {
      width: 32,
      height: 32,
      marginRight: theme.spacing[3],
      borderRadius: theme.borderRadius.sm,
    },
    
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[6],
    },
    
    navItem: {
      position: 'relative',
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      borderRadius: theme.borderRadius.md,
      textDecoration: 'none',
      color: theme.computed.text.secondary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: theme.computed.interactive.hover,
        color: theme.computed.text.primary,
      },
    },
    
    navItemActive: {
      color: theme.colors.primary[600],
      backgroundColor: theme.colors.primary[50],
      fontWeight: theme.typography.fontWeight.semibold,
    },
    
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[3],
    },
    
    userMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing[2],
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: theme.computed.interactive.hover,
      },
    },
    
    notificationBell: {
      position: 'relative',
      padding: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: theme.computed.interactive.hover,
      },
    },
    
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.semantic.error[500],
      color: theme.computed.text.onPrimary,
      borderRadius: theme.borderRadius.full,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
      padding: `2px 6px`,
      minWidth: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
}

// Sidebar Navigation styles
export function createSidebarNavigationStyles(theme: OrokiiPayTheme, props: NavigationStyleProps = {}): NavigationStyles {
  const { collapsed = false, elevated = true } = props;
  
  const sidebarWidth = collapsed ? 64 : 240;
  
  return {
    container: {
      width: sidebarWidth,
      minHeight: '100vh',
      backgroundColor: theme.computed.background.surface,
      borderRight: `1px solid ${theme.computed.border.light}`,
      boxShadow: elevated ? theme.shadows.lg : 'none',
      transition: 'width 0.3s ease-in-out',
      overflow: 'hidden',
      position: 'relative',
    },
    
    header: {
      padding: theme.spacing[4],
      borderBottom: `1px solid ${theme.computed.border.light}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    
    brand: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      color: theme.computed.text.primary,
      fontWeight: theme.typography.fontWeight.bold,
      fontSize: theme.typography.fontSize.lg,
    },
    
    brandLogo: {
      width: 32,
      height: 32,
      marginRight: collapsed ? 0 : theme.spacing[3],
      borderRadius: theme.borderRadius.sm,
      transition: 'margin 0.3s ease-in-out',
    },
    
    brandText: {
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out',
      whiteSpace: 'nowrap',
    },
    
    nav: {
      padding: theme.spacing[2],
    },
    
    navSection: {
      marginBottom: theme.spacing[6],
    },
    
    navSectionTitle: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.computed.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: theme.typography.letterSpacing.wide,
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out',
    },
    
    navItem: {
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing[3]}px ${theme.spacing[3]}px`,
      margin: `${theme.spacing[1]}px 0`,
      borderRadius: theme.borderRadius.md,
      textDecoration: 'none',
      color: theme.computed.text.secondary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      position: 'relative',
      ':hover': {
        backgroundColor: theme.computed.interactive.hover,
        color: theme.computed.text.primary,
      },
    },
    
    navItemActive: {
      backgroundColor: theme.colors.primary[50],
      color: theme.colors.primary[700],
      fontWeight: theme.typography.fontWeight.semibold,
      '::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: '60%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: '0 2px 2px 0',
      },
    },
    
    navIcon: {
      width: 20,
      height: 20,
      marginRight: collapsed ? 0 : theme.spacing[3],
      transition: 'margin 0.3s ease-in-out',
      flexShrink: 0,
    },
    
    navLabel: {
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out',
      whiteSpace: 'nowrap',
      flex: 1,
    },
    
    navBadge: {
      backgroundColor: theme.colors.semantic.error[500],
      color: theme.computed.text.onPrimary,
      borderRadius: theme.borderRadius.full,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
      padding: `2px 6px`,
      minWidth: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.3s ease-in-out',
    },
    
    collapseToggle: {
      position: 'absolute',
      top: theme.spacing[4],
      right: -12,
      width: 24,
      height: 24,
      backgroundColor: theme.computed.background.surface,
      border: `1px solid ${theme.computed.border.light}`,
      borderRadius: theme.borderRadius.full,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.xs,
      color: theme.computed.text.secondary,
      transition: 'all 0.2s ease-in-out',
      ':hover': {
        backgroundColor: theme.computed.interactive.hover,
        color: theme.computed.text.primary,
      },
    },
  };
}

// Bottom Navigation styles (for mobile)
export function createBottomNavigationStyles(theme: OrokiiPayTheme, props: NavigationStyleProps = {}): NavigationStyles {
  const { elevated = true } = props;
  
  return {
    container: {
      display: 'flex',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.computed.background.surface,
      borderTop: `1px solid ${theme.computed.border.light}`,
      boxShadow: elevated ? theme.shadows.lg : 'none',
      padding: `${theme.spacing[2]}px 0`,
      zIndex: 1000,
    },
    
    navItem: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${theme.spacing[2]}px ${theme.spacing[1]}px`,
      textDecoration: 'none',
      color: theme.computed.text.tertiary,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.medium,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      position: 'relative',
      minHeight: 56,
      ':hover': {
        color: theme.computed.text.secondary,
      },
    },
    
    navItemActive: {
      color: theme.colors.primary[600],
    },
    
    navIcon: {
      width: 24,
      height: 24,
      marginBottom: theme.spacing[1],
    },
    
    navLabel: {
      fontSize: theme.typography.fontSize.xs,
      textAlign: 'center',
      lineHeight: 1,
    },
    
    navBadge: {
      position: 'absolute',
      top: 4,
      right: '30%',
      backgroundColor: theme.colors.semantic.error[500],
      color: theme.computed.text.onPrimary,
      borderRadius: theme.borderRadius.full,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
      padding: `2px 6px`,
      minWidth: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
}

// Breadcrumb styles
export function createBreadcrumbStyles(theme: OrokiiPayTheme): NavigationStyles {
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing[3]}px 0`,
      fontSize: theme.typography.fontSize.sm,
    },
    
    item: {
      display: 'flex',
      alignItems: 'center',
      color: theme.computed.text.secondary,
      textDecoration: 'none',
      transition: 'color 0.2s ease-in-out',
      ':hover': {
        color: theme.computed.text.primary,
      },
    },
    
    itemActive: {
      color: theme.computed.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    
    separator: {
      margin: `0 ${theme.spacing[2]}px`,
      color: theme.computed.text.tertiary,
      fontSize: theme.typography.fontSize.sm,
    },
  };
}

// Tab Navigation styles
export function createTabNavigationStyles(theme: OrokiiPayTheme, props: { variant?: 'line' | 'pill' | 'card' } = {}): NavigationStyles {
  const { variant = 'line' } = props;
  
  const baseContainer = {
    display: 'flex',
    position: 'relative',
  };
  
  const variants = {
    line: {
      borderBottom: `1px solid ${theme.computed.border.light}`,
    },
    pill: {
      backgroundColor: theme.colors.neutral[100],
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[1],
    },
    card: {
      borderBottom: `1px solid ${theme.computed.border.light}`,
    },
  };
  
  const itemVariants = {
    line: {
      padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
      borderBottom: '2px solid transparent',
      marginBottom: -1,
    },
    pill: {
      padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
      borderRadius: theme.borderRadius.md,
      margin: theme.spacing[1],
    },
    card: {
      padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
      borderRadius: `${theme.borderRadius.md}px ${theme.borderRadius.md}px 0 0`,
      border: `1px solid ${theme.computed.border.light}`,
      borderBottom: 'none',
      marginRight: theme.spacing[1],
    },
  };
  
  const activeVariants = {
    line: {
      borderBottomColor: theme.colors.primary[500],
      color: theme.colors.primary[600],
    },
    pill: {
      backgroundColor: theme.computed.background.surface,
      boxShadow: theme.shadows.sm,
    },
    card: {
      backgroundColor: theme.computed.background.surface,
      borderColor: theme.computed.border.light,
    },
  };
  
  return {
    container: {
      ...baseContainer,
      ...variants[variant],
    },
    
    item: {
      ...itemVariants[variant],
      textDecoration: 'none',
      color: theme.computed.text.secondary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      ':hover': {
        color: theme.computed.text.primary,
        backgroundColor: variant === 'pill' ? theme.computed.interactive.hover : 'transparent',
      },
    },
    
    itemActive: {
      ...activeVariants[variant],
      color: theme.colors.primary[600],
      fontWeight: theme.typography.fontWeight.semibold,
    },
  };
}

// Banking-specific navigation items
export const bankingNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    href: '/dashboard',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: '💳',
    href: '/accounts',
    children: [
      { id: 'savings', label: 'Savings', icon: '💰', href: '/accounts/savings' },
      { id: 'current', label: 'Current', icon: '🏦', href: '/accounts/current' },
    ],
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: '💸',
    href: '/transfers',
    badge: 'New',
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: '💳',
    href: '/payments',
    children: [
      { id: 'bills', label: 'Pay Bills', icon: '⚡', href: '/payments/bills' },
      { id: 'airtime', label: 'Airtime/Data', icon: '📱', href: '/payments/airtime' },
    ],
  },
  {
    id: 'investments',
    label: 'Investments',
    icon: '📈',
    href: '/investments',
  },
  {
    id: 'loans',
    label: 'Loans',
    icon: '🏦',
    href: '/loans',
    badge: 3,
  },
  {
    id: 'cards',
    label: 'Cards',
    icon: '💳',
    href: '/cards',
  },
  {
    id: 'support',
    label: 'Support',
    icon: '🎧',
    href: '/support',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    href: '/settings',
  },
];

// Mobile bottom navigation items
export const mobileNavigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    href: '/dashboard',
  },
  {
    id: 'transfers',
    label: 'Transfer',
    icon: '💸',
    href: '/transfers',
  },
  {
    id: 'payments',
    label: 'Pay',
    icon: '💳',
    href: '/payments',
  },
  {
    id: 'history',
    label: 'History',
    icon: '📋',
    href: '/history',
  },
  {
    id: 'more',
    label: 'More',
    icon: '⋯',
    href: '/more',
  },
];