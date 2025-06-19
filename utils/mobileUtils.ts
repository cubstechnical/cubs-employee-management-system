// Mobile utility functions for CUBS Employee Management System

import { Dimensions, Platform } from 'react-native';

// Device detection utilities
export const getDeviceInfo = () => {
  const { width, height } = Dimensions.get('window');
  
  return {
    width,
    height,
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isWeb: Platform.OS === 'web',
    aspect: width / height,
    isLandscape: width > height,
    isPortrait: height > width,
  };
};

// Responsive text sizes
export const getResponsiveSize = (mobileSize: number, tabletSize?: number, desktopSize?: number) => {
  const { isMobile, isTablet } = getDeviceInfo();
  
  if (isMobile) return mobileSize;
  if (isTablet && tabletSize) return tabletSize;
  if (desktopSize) return desktopSize;
  
  return tabletSize || mobileSize * 1.2;
};

// Keyboard management for web
export const handleKeyboardBehavior = () => {
  if (Platform.OS !== 'web') return;

  // Function to close keyboard on mobile web
  const closeKeyboard = () => {
    if (document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  // Function to handle input focus with scroll behavior
  const handleInputFocus = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName.toLowerCase() === 'input') {
      // Scroll element into view with offset for mobile header
      setTimeout(() => {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  // Function to handle input blur
  const handleInputBlur = (event: Event) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName.toLowerCase() === 'input') {
      // Small delay to allow for value processing
      setTimeout(() => {
        target.blur();
      }, 100);
    }
  };

  // Add event listeners
  document.addEventListener('focus', handleInputFocus, true);
  document.addEventListener('blur', handleInputBlur, true);
  
  // Handle viewport resize (keyboard open/close on mobile)
  let initialViewportHeight = window.innerHeight;
  
  const handleViewportChange = () => {
    const currentHeight = window.innerHeight;
    const heightDiff = initialViewportHeight - currentHeight;
    
    // If height decreased significantly, keyboard is likely open
    if (heightDiff > 150) {
      document.body.style.height = `${currentHeight}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.height = 'auto';
      document.body.style.overflow = 'auto';
    }
  };

  window.addEventListener('resize', handleViewportChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('focus', handleInputFocus, true);
    document.removeEventListener('blur', handleInputBlur, true);
    window.removeEventListener('resize', handleViewportChange);
  };
};

// Text truncation utilities
export const truncateText = (text: string, maxLength: number = 50, suffix: string = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const truncateTextSmart = (text: string, maxLength: number = 50) => {
  if (!text || text.length <= maxLength) return text;
  
  // Try to break at word boundaries
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

// Dynamic column width calculation for tables
export const getTableColumnWidths = (isMobile: boolean) => {
  if (isMobile) {
    return {
      checkbox: 36,
      name: 120,
      email: 140,
      company: 160,
      trade: 90,
      status: 70,
      date: 90,
      actions: 70,
    };
  }
  
  return {
    checkbox: 60,
    name: 220,
    email: 250,
    company: 280,
    trade: 160,
    status: 130,
    date: 150,
    actions: 160,
  };
};

// Responsive grid calculations
export const getGridColumns = (containerWidth: number, itemMinWidth: number = 180) => {
  const { isMobile, isTablet } = getDeviceInfo();
  
  if (isMobile) {
    return containerWidth < 600 ? 2 : 3;
  }
  
  if (isTablet) {
    return Math.floor(containerWidth / itemMinWidth);
  }
  
  return Math.floor(containerWidth / itemMinWidth);
};

// Animation utilities for mobile performance
export const getMobileAnimationConfig = () => {
  const { isMobile } = getDeviceInfo();
  
  return {
    duration: isMobile ? 200 : 300,
    useNativeDriver: true,
    tension: isMobile ? 100 : 80,
    friction: isMobile ? 10 : 8,
  };
};

// Safe area utilities
export const getSafeAreaInsets = () => {
  if (Platform.OS === 'web') {
    // For web, try to detect if we're in a standalone PWA with notch
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasNotch = window.screen.height > window.innerHeight + 100;
    
    return {
      top: isStandalone && hasNotch ? 44 : 0,
      bottom: isStandalone ? 34 : 0,
      left: 0,
      right: 0,
    };
  }
  
  // For React Native, use safe area context
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
};

// Touch-friendly hit area calculation
export const getTouchableHitSlop = (isMobile: boolean) => {
  if (!isMobile) return { top: 0, bottom: 0, left: 0, right: 0 };
  
  return {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  };
};

// Date formatting for mobile
export const formatDateForMobile = (date: string | Date, isMobile: boolean = true) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isMobile) {
    // Shorter format for mobile
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Visa status color utilities
export const getVisaStatusColor = (expiryDate: string) => {
  if (!expiryDate) return '#6B7280'; // gray
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) return '#EF4444'; // red - expired
  if (daysUntilExpiry <= 7) return '#F59E0B'; // amber - critical
  if (daysUntilExpiry <= 30) return '#F97316'; // orange - warning
  
  return '#10B981'; // green - valid
};

// Form validation helpers
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Check if it's a reasonable length (8-15 digits)
  return digits.length >= 8 && digits.length <= 15;
};

export const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 10)}x${digits.slice(10)}`;
};

// Performance monitoring
export const measurePerformance = (label: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  
  if (__DEV__) {
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  }
};

// Debounce utility for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Memory cleanup utilities
export const cleanupAnimations = (animations: any[]) => {
  animations.forEach(animation => {
    if (animation && typeof animation.stop === 'function') {
      animation.stop();
    }
  });
};

// Error boundary utility
export const handleMobileError = (error: Error, errorInfo?: any) => {
  const { isMobile } = getDeviceInfo();
  
  if (__DEV__) {
    console.error('Mobile Error:', error, errorInfo);
  }
  
  // In production, you might want to send this to an error tracking service
  if (!__DEV__ && isMobile) {
    // Send to analytics/crash reporting
    // Example: Sentry.captureException(error);
  }
};

export default {
  getDeviceInfo,
  getResponsiveSize,
  handleKeyboardBehavior,
  truncateText,
  truncateTextSmart,
  getTableColumnWidths,
  getGridColumns,
  getMobileAnimationConfig,
  getSafeAreaInsets,
  getTouchableHitSlop,
  formatDateForMobile,
  getVisaStatusColor,
  validateEmail,
  validatePhone,
  formatPhoneNumber,
  measurePerformance,
  debounce,
  cleanupAnimations,
  handleMobileError,
}; 