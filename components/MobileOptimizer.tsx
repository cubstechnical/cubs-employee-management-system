import React, { useEffect, useState } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';

interface MobileOptimizerProps {
  children: React.ReactNode;
  enablePullToRefresh?: boolean;
  onRefresh?: () => void;
  enableHapticFeedback?: boolean;
}

interface ScreenDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

export const MobileOptimizer: React.FC<MobileOptimizerProps> = ({
  children,
  enableHapticFeedback = true,
}) => {
  const theme = useTheme();
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
      isTablet: width >= 768,
      isMobile: width < 768,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        isTablet: window.width >= 768,
        isMobile: window.width < 768,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Haptic feedback utility
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback) return;
    
    if (Platform.OS === 'web') return; // No haptic feedback on web
    
    try {
      const { Vibration } = require('react-native');
      const duration = type === 'light' ? 10 : type === 'medium' ? 25 : 50;
      Vibration.vibrate(duration);
    } catch (error) {
      console.log('Haptic feedback not available');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
};

// Hook for mobile-responsive values
export const useMobileBreakpoint = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    isXS: dimensions.width < 576,
    isSM: dimensions.width >= 576 && dimensions.width < 768,
    isMD: dimensions.width >= 768 && dimensions.width < 992,
    isLG: dimensions.width >= 992 && dimensions.width < 1200,
    isXL: dimensions.width >= 1200,
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
  };
};

// Utility for responsive values
export const responsive = <T,>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  mobile?: T;
  tablet?: T;
  desktop?: T;
}): T | undefined => {
  const breakpoint = useMobileBreakpoint();
  
  if (values.mobile && breakpoint.isMobile) return values.mobile;
  if (values.tablet && breakpoint.isTablet) return values.tablet;
  if (values.desktop && breakpoint.isDesktop) return values.desktop;
  
  if (values.xl && breakpoint.isXL) return values.xl;
  if (values.lg && breakpoint.isLG) return values.lg;
  if (values.md && breakpoint.isMD) return values.md;
  if (values.sm && breakpoint.isSM) return values.sm;
  if (values.xs && breakpoint.isXS) return values.xs;
  
  // Return the first available value
  return values.xl || values.lg || values.md || values.sm || values.xs || 
         values.desktop || values.tablet || values.mobile;
};

// Mobile-optimized grid component
export const MobileGrid: React.FC<{
  children: React.ReactNode;
  spacing?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}> = ({ children, spacing = 16, columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 } }) => {
  const breakpoint = useMobileBreakpoint();
  
  const getColumns = () => {
    if (breakpoint.isXL && columns.xl) return columns.xl;
    if (breakpoint.isLG && columns.lg) return columns.lg;
    if (breakpoint.isMD && columns.md) return columns.md;
    if (breakpoint.isSM && columns.sm) return columns.sm;
    return columns.xs || 1;
  };

  const numColumns = getColumns();
  const itemWidth = (breakpoint.width - (spacing * (numColumns + 1))) / numColumns;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing / 2,
        gap: spacing,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: itemWidth,
            marginBottom: spacing,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

export default MobileOptimizer; 