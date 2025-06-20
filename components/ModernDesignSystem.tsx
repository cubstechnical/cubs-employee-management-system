import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Surface, Card, Text, Button, useTheme } from 'react-native-paper';
import { getDeviceInfo, getResponsiveSpacing } from '../utils/mobileUtils';

// Modern Color Palette
export const MODERN_COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#dc2626',
  },
  
  // Neutral Grays
  gray: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Modern Typography Scale
export const TYPOGRAPHY = {
  // Display (Large headers)
  display: {
    '2xl': { fontSize: 72, lineHeight: 90, letterSpacing: -2, fontWeight: '800' },
    xl: { fontSize: 60, lineHeight: 72, letterSpacing: -2, fontWeight: '800' },
    lg: { fontSize: 48, lineHeight: 60, letterSpacing: -1, fontWeight: '700' },
    md: { fontSize: 36, lineHeight: 44, letterSpacing: -1, fontWeight: '700' },
    sm: { fontSize: 30, lineHeight: 38, letterSpacing: 0, fontWeight: '600' },
  },
  
  // Text (Body content)
  text: {
    xl: { fontSize: 20, lineHeight: 30, fontWeight: '400' },
    lg: { fontSize: 18, lineHeight: 28, fontWeight: '400' },
    md: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    xs: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  },
  
  // Labels (UI elements)
  label: {
    lg: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
    md: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    sm: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
    xs: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
  },
};

// Modern Spacing System (8pt grid)
export const SPACING = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// Modern Shadow System
export const SHADOWS = {
  xs: {
    shadowColor: MODERN_COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: MODERN_COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: MODERN_COLORS.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: MODERN_COLORS.gray[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: MODERN_COLORS.gray[900],
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 12,
  },
};

// Modern Border Radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Enhanced Card Component
interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof SPACING;
  radius?: keyof typeof BORDER_RADIUS;
  shadow?: keyof typeof SHADOWS;
  style?: any;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'elevated',
  padding = 6,
  radius = 'xl',
  shadow = 'md',
  style,
}) => {
  const { isPhone } = getDeviceInfo();
  
  const cardStyles = [
    styles.modernCard,
    {
      padding: SPACING[padding],
      borderRadius: BORDER_RADIUS[radius],
      ...(variant === 'elevated' && SHADOWS[shadow]),
      ...(variant === 'outlined' && {
        borderWidth: 1,
        borderColor: MODERN_COLORS.gray[200],
      }),
      ...(variant === 'filled' && {
        backgroundColor: MODERN_COLORS.gray[50],
      }),
    },
    isPhone && styles.mobileCard,
    style,
  ];

  return (
    <Surface style={cardStyles} elevation={variant === 'elevated' ? 2 : 0}>
      {children}
    </Surface>
  );
};

// Enhanced Button Component
interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: string;
  style?: any;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  icon,
  style,
}) => {
  const buttonSizes = {
    sm: { height: 36, paddingHorizontal: SPACING[3], fontSize: TYPOGRAPHY.text.sm.fontSize },
    md: { height: 44, paddingHorizontal: SPACING[4], fontSize: TYPOGRAPHY.text.md.fontSize },
    lg: { height: 52, paddingHorizontal: SPACING[6], fontSize: TYPOGRAPHY.text.lg.fontSize },
  };

  const buttonVariants = {
    primary: {
      backgroundColor: MODERN_COLORS.primary[500],
      color: 'white',
    },
    secondary: {
      backgroundColor: MODERN_COLORS.gray[100],
      color: MODERN_COLORS.gray[900],
    },
    ghost: {
      backgroundColor: 'transparent',
      color: MODERN_COLORS.primary[500],
    },
    danger: {
      backgroundColor: MODERN_COLORS.error[500],
      color: 'white',
    },
  };

  return (
    <Button
      mode={variant === 'primary' || variant === 'danger' ? 'contained' : 'outlined'}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      contentStyle={[
        {
          height: buttonSizes[size].height,
          paddingHorizontal: buttonSizes[size].paddingHorizontal,
        },
        fullWidth && { width: '100%' },
      ]}
      labelStyle={{
        fontSize: buttonSizes[size].fontSize,
        fontWeight: '600',
      }}
      style={[
        {
          borderRadius: BORDER_RADIUS.lg,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      buttonColor={buttonVariants[variant].backgroundColor}
      textColor={buttonVariants[variant].color}
    >
      {children}
    </Button>
  );
};

// Enhanced Status Badge
interface StatusBadgeProps {
  status: 'active' | 'warning' | 'error' | 'neutral';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  dot = false,
}) => {
  const statusColors = {
    active: { bg: MODERN_COLORS.success[50], text: MODERN_COLORS.success[700], dot: MODERN_COLORS.success[500] },
    warning: { bg: MODERN_COLORS.warning[50], text: MODERN_COLORS.warning[700], dot: MODERN_COLORS.warning[500] },
    error: { bg: MODERN_COLORS.error[50], text: MODERN_COLORS.error[700], dot: MODERN_COLORS.error[500] },
    neutral: { bg: MODERN_COLORS.gray[100], text: MODERN_COLORS.gray[700], dot: MODERN_COLORS.gray[500] },
  };

  const sizes = {
    sm: { height: 20, paddingHorizontal: SPACING[2], fontSize: TYPOGRAPHY.label.xs.fontSize },
    md: { height: 24, paddingHorizontal: SPACING[2.5], fontSize: TYPOGRAPHY.label.sm.fontSize },
    lg: { height: 28, paddingHorizontal: SPACING[3], fontSize: TYPOGRAPHY.label.md.fontSize },
  };

  return (
    <View style={[
      styles.statusBadge,
      {
        backgroundColor: statusColors[status].bg,
        height: sizes[size].height,
        paddingHorizontal: sizes[size].paddingHorizontal,
      }
    ]}>
      {dot && (
        <View style={[
          styles.statusDot,
          { backgroundColor: statusColors[status].dot }
        ]} />
      )}
      <Text style={[
        styles.statusText,
        {
          color: statusColors[status].text,
          fontSize: sizes[size].fontSize,
          fontWeight: '600',
        }
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Micro-interaction Helpers
export const createPressAnimation = (animatedValue: Animated.Value) => ({
  onPressIn: () => {
    Animated.spring(animatedValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  },
  onPressOut: () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  },
});

export const createHoverAnimation = (animatedValue: Animated.Value) => ({
  onMouseEnter: () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  },
  onMouseLeave: () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  },
});

const styles = StyleSheet.create({
  modernCard: {
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  mobileCard: {
    marginHorizontal: SPACING[1],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING[1.5],
  },
  statusText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default {
  MODERN_COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
  ModernCard,
  ModernButton,
  StatusBadge,
  createPressAnimation,
  createHoverAnimation,
}; 