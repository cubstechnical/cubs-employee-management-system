// Mobile utility functions for CUBS Employee Management System
import { Dimensions, Platform, PixelRatio } from 'react-native';

interface DeviceInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  pixelRatio: number;
  fontScale: number;
}

// Enhanced responsive breakpoints
export const BREAKPOINTS = {
  xs: 0,     // Extra small phones
  sm: 576,   // Small phones
  md: 768,   // Tablets
  lg: 992,   // Small desktops
  xl: 1200,  // Large desktops
  xxl: 1400, // Extra large desktops
} as const;

export const MOBILE_BREAKPOINTS = {
  phone: 576,
  tablet: 768,
  desktop: 992,
} as const;

// Mobile-optimized spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Touch-friendly sizing
export const touchTargets = {
  small: 32,
  medium: 44,  // Apple HIG minimum
  large: 56,   // Material Design minimum
  xlarge: 64,
};

// Mobile-optimized font sizes
export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

// Mobile-optimized component sizing
export const componentSizes = {
  button: {
    height: {
      small: touchTargets.small,
      medium: touchTargets.medium,
      large: touchTargets.large,
    },
    padding: {
      small: { horizontal: spacing.sm, vertical: spacing.xs },
      medium: { horizontal: spacing.md, vertical: spacing.sm },
      large: { horizontal: spacing.lg, vertical: spacing.md },
    },
  },
  input: {
    height: touchTargets.large,
    padding: { horizontal: spacing.md, vertical: spacing.sm },
  },
  card: {
    padding: {
      phone: spacing.md,
      tablet: spacing.lg,
      desktop: spacing.xl,
    },
    borderRadius: {
      phone: 8,
      tablet: 12,
      desktop: 16,
    },
  },
};

// Get current device information
export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  
  return {
    width,
    height,
    isTablet: width >= MOBILE_BREAKPOINTS.tablet,
    isPhone: width < MOBILE_BREAKPOINTS.tablet,
    isLandscape,
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
  };
};

// Responsive spacing based on device size
export const getResponsiveSpacing = (size: keyof typeof spacing): number => {
  const { isPhone } = getDeviceInfo();
  const baseSpacing = spacing[size];
  
  // Reduce spacing on phones for better space utilization
  return isPhone ? Math.max(baseSpacing * 0.75, 4) : baseSpacing;
};

// Get responsive font size
export const getResponsiveFontSize = (size: keyof typeof fontSizes): number => {
  const { fontScale, isPhone } = getDeviceInfo();
  const baseFontSize = fontSizes[size];
  
  // Apply font scale and device-specific adjustments
  const scaledSize = baseFontSize * fontScale;
  
  // Limit font scaling on phones to prevent layout issues
  if (isPhone && fontScale > 1.2) {
    return baseFontSize * 1.2;
  }
  
  return scaledSize;
};

// Enhanced responsive design utilities
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}): T | undefined => {
  const { width } = getDeviceInfo();
  
  if (width >= BREAKPOINTS.xxl && values.xxl !== undefined) return values.xxl;
  if (width >= BREAKPOINTS.xl && values.xl !== undefined) return values.xl;
  if (width >= BREAKPOINTS.lg && values.lg !== undefined) return values.lg;
  if (width >= BREAKPOINTS.md && values.md !== undefined) return values.md;
  if (width >= BREAKPOINTS.sm && values.sm !== undefined) return values.sm;
  return values.xs;
};

// Get responsive component size
export const getComponentSize = (component: keyof typeof componentSizes, property: string): any => {
  const { isPhone, isTablet } = getDeviceInfo();
  const componentConfig = componentSizes[component] as any;
  
  if (!componentConfig || !componentConfig[property]) return undefined;
  
  const propertyConfig = componentConfig[property];
  
  if (typeof propertyConfig === 'object') {
    if (isPhone && propertyConfig.phone !== undefined) return propertyConfig.phone;
    if (isTablet && propertyConfig.tablet !== undefined) return propertyConfig.tablet;
    return propertyConfig.desktop || propertyConfig.medium || propertyConfig.large;
  }
  
  return propertyConfig;
};

// Platform-specific utilities
export const platformUtils = {
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  
  // Get platform-specific styles
  select: <T>(options: { web?: T; ios?: T; android?: T; native?: T; default?: T }): T | undefined => {
    if (Platform.OS === 'web' && options.web !== undefined) return options.web;
    if (Platform.OS === 'ios' && options.ios !== undefined) return options.ios;
    if (Platform.OS === 'android' && options.android !== undefined) return options.android;
    if (Platform.OS !== 'web' && options.native !== undefined) return options.native;
    return options.default;
  },
};

// Mobile navigation utilities
export const navigationUtils = {
  // Check if device supports gestures
  supportsGestures: (): boolean => {
    const { isPhone } = getDeviceInfo();
    return isPhone && (Platform.OS === 'ios' || Platform.OS === 'android');
  },
  
  // Get safe area insets for different device types
  getSafeAreaInsets: () => {
    const { isPhone } = getDeviceInfo();
    
    return {
      top: platformUtils.select({ ios: isPhone ? 44 : 24, android: 24, web: 0, default: 0 }),
      bottom: platformUtils.select({ ios: isPhone ? 34 : 0, android: 0, web: 0, default: 0 }),
      left: 0,
      right: 0,
    };
  },
};

// Performance optimization utilities
export const performanceUtils = {
  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },
  
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  },
  
  // Check if device has limited resources
  isLowEndDevice: (): boolean => {
    const { pixelRatio, width, height } = getDeviceInfo();
    const totalPixels = width * height * pixelRatio;
    
    // Consider devices with less than 2M pixels as low-end
    return totalPixels < 2000000;
  },
};

export default {
  getDeviceInfo,
  useResponsiveValue,
  getResponsiveSpacing,
  getResponsiveFontSize,
  getComponentSize,
  platformUtils,
  navigationUtils,
  performanceUtils,
  BREAKPOINTS,
  MOBILE_BREAKPOINTS,
  spacing,
  touchTargets,
  fontSizes,
  componentSizes,
}; 