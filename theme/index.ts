import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

export interface CustomTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    // CUBS Crimson Theme Colors
    warning: string;
    success: string;
    info: string;
    onWarning: string;
    onSuccess: string;
    onInfo: string;
    body: string;
    successContainer: string;
    onSuccessContainer: string;
    warningContainer: string;
    onWarningContainer: string;
    infoContainer: string;
    onInfoContainer: string;
    errorContainer: string;
    onInverseSurface: string;
    text: string;
    
    // Brand colors - CUBS Crimson Theme
    brand: {
      primary: string;
      secondary: string;
      accent: string;
      crimson: string;
      softPink: string;
    };
    
    // Status colors for visa tracking
    status: {
      active: string;
      inactive: string;
      pending: string;
      expired: string;
      expiring: string;
    };
    
    // Gradient colors
    gradient: {
      start: string;
      end: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  // Add responsive breakpoints for navigation components
  breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  // Add layout breakpoints that some navigation libraries expect
  layout?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  // Add screen breakpoints that some navigation libraries expect
  screen?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    header: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
      fontFamily: string;
    };
    title: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
      fontFamily: string;
    };
    subtitle: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
      fontFamily: string;
    };
    body: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
      fontFamily: string;
    };
    caption: {
      fontSize: number;
      fontWeight: string;
      lineHeight: number;
      color: string;
      fontFamily: string;
    };
    button: {
      fontSize: number;
      fontWeight: string;
      textTransform: string;
      fontFamily: string;
    };
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  shadows: {
    small: object;
    medium: object;
    large: object;
  };
}

// 8px baseline grid spacing system
const defaultSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive breakpoints for navigation and layout
const breakpoints = {
  xs: 0,      // Extra small devices (phones, 0px and up)
  sm: 576,    // Small devices (landscape phones, 576px and up)
  md: 768,    // Medium devices (tablets, 768px and up)
  lg: 992,    // Large devices (desktops, 992px and up)
  xl: 1200,   // Extra large devices (large desktops, 1200px and up)
};

// Typography following CUBS Crimson design
const typography = {
  header: { 
    fontSize: 28, 
    fontWeight: '700' as const,
    lineHeight: 42, // 1.5x font size
    fontFamily: 'Inter-Bold',
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700' as const,
    lineHeight: 30,
    fontFamily: 'Inter-Bold',
  },
  subtitle: { 
    fontSize: 16, 
    fontWeight: '500' as const,
    lineHeight: 24,
    fontFamily: 'Roboto-Medium',
  },
  body: { 
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: 'Roboto-Regular',
  },
  caption: { 
    fontSize: 12, 
    fontWeight: '400' as const,
    lineHeight: 18,
    color: '#666666',
    fontFamily: 'Roboto-Regular',
  },
  button: {
    fontSize: 16,
    fontWeight: '500' as const,
    textTransform: 'none' as const,
    fontFamily: 'Roboto-Medium',
  },
};

// Border radius following design system
const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
};

// Enhanced shadows for modern look
const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Modern CUBS Brand Colors
const CUBS_BRAND_COLORS = {
  // Primary CUBS Red - More subtle professional red
  primary: '#C53030', // Subtle professional red instead of Ferrari Red
  primaryVariant: '#B91C3C',
  primaryLight: '#F87171',
  primaryDark: '#991B1B',
  
  // Secondary Blue - Professional
  secondary: '#3182CE',
  secondaryVariant: '#2B77CB',
  secondaryLight: '#63B3ED',
  secondaryDark: '#2C5282',
  
  // Tertiary Green - Success/Growth
  tertiary: '#38A169',
  tertiaryVariant: '#2F855A',
  tertiaryLight: '#68D391',
  tertiaryDark: '#276749',
  
  // Accent Orange - Warning/Energy
  accent: '#DD6B20',
  accentLight: '#F6AD55',
  accentDark: '#C05621',
  
  // Neutral Grays - Modern and Clean
  neutral50: '#F7FAFC',
  neutral100: '#EDF2F7',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E0',
  neutral400: '#A0AEC0',
  neutral500: '#718096',
  neutral600: '#4A5568',
  neutral700: '#2D3748',
  neutral800: '#1A202C',
  neutral900: '#171923',
  
  // Status Colors
  success: '#38A169',
  warning: '#D69E2E',
  error: '#C53030', // Subtle professional red for errors too
  info: '#3182CE',
  
  // Special Colors
  gold: '#D69E2E',
  purple: '#805AD5',
  pink: '#D53F8C',
  teal: '#319795',
};

// Light Theme
export const lightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary Colors
    primary: CUBS_BRAND_COLORS.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFEBEB',
    onPrimaryContainer: CUBS_BRAND_COLORS.primaryDark,
    
    // Secondary Colors
    secondary: CUBS_BRAND_COLORS.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E6F3FF',
    onSecondaryContainer: CUBS_BRAND_COLORS.secondaryDark,
    
    // Tertiary Colors
    tertiary: CUBS_BRAND_COLORS.tertiary,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E6FFFA',
    onTertiaryContainer: CUBS_BRAND_COLORS.tertiaryDark,
    
    // Background Colors
    background: '#FFFFFF',
    onBackground: CUBS_BRAND_COLORS.neutral800,
    
    // Surface Colors
    surface: '#FFFFFF',
    onSurface: CUBS_BRAND_COLORS.neutral800,
    surfaceVariant: CUBS_BRAND_COLORS.neutral100,
    onSurfaceVariant: CUBS_BRAND_COLORS.neutral600,
    surfaceDisabled: CUBS_BRAND_COLORS.neutral200,
    onSurfaceDisabled: CUBS_BRAND_COLORS.neutral400,
    
    // Outline Colors
    outline: CUBS_BRAND_COLORS.neutral300,
    outlineVariant: CUBS_BRAND_COLORS.neutral200,
    
    // Error Colors
    error: CUBS_BRAND_COLORS.error,
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: CUBS_BRAND_COLORS.primaryDark,
    
    // Additional Custom Colors
    warning: CUBS_BRAND_COLORS.warning,
    onWarning: '#FFFFFF',
    warningContainer: '#FFF4E0',
    onWarningContainer: '#B85900',
    
    success: CUBS_BRAND_COLORS.success,
    onSuccess: '#FFFFFF',
    successContainer: '#E8F5E8',
    onSuccessContainer: CUBS_BRAND_COLORS.tertiaryDark,
    
    info: CUBS_BRAND_COLORS.info,
    onInfo: '#FFFFFF',
    infoContainer: '#E3F2FD',
    onInfoContainer: CUBS_BRAND_COLORS.secondaryDark,
    
    // Shadow and Elevation
    shadow: 'rgba(0, 0, 0, 0.1)',
    scrim: 'rgba(0, 0, 0, 0.32)',
    
    // Inverse Colors
    inverseSurface: CUBS_BRAND_COLORS.neutral800,
    onInverseSurface: CUBS_BRAND_COLORS.neutral100,
    inversePrimary: CUBS_BRAND_COLORS.primaryLight,
    
    // Additional required properties
    body: CUBS_BRAND_COLORS.neutral700,
    text: CUBS_BRAND_COLORS.neutral900,
    
    // Brand colors
    brand: {
      primary: '#C53030', // Subtle professional red
      secondary: CUBS_BRAND_COLORS.secondary,
      accent: CUBS_BRAND_COLORS.accent,
      crimson: '#C53030', // Subtle professional red
      softPink: CUBS_BRAND_COLORS.primaryLight,
    },
    
    // Status colors
    status: {
      active: CUBS_BRAND_COLORS.tertiary,
      inactive: CUBS_BRAND_COLORS.neutral500,
      pending: CUBS_BRAND_COLORS.accent,
      expired: CUBS_BRAND_COLORS.primary,
      expiring: CUBS_BRAND_COLORS.accent,
    },
    
    // Gradient colors
    gradient: {
      start: CUBS_BRAND_COLORS.primary,
      end: CUBS_BRAND_COLORS.primaryLight,
    },
  },
  spacing: defaultSpacing,
  breakpoints,
  layout: breakpoints,
  screen: breakpoints,
  typography,
  borderRadius,
  shadows: {
    ...shadows,
    // Professional shadows with CUBS blue tint
    small: {
      shadowColor: '#1B365D',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1B365D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#1B365D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Dark Theme - Enhanced for Better UX
export const darkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: CUBS_BRAND_COLORS.primary, // Use subtle red from constants
    onPrimary: '#FFFFFF',
    primaryContainer: CUBS_BRAND_COLORS.primaryDark, // Adjusted for consistency
    onPrimaryContainer: '#FFFFFF',

    secondary: CUBS_BRAND_COLORS.secondaryLight, // Lighter blue for dark mode
    onSecondary: CUBS_BRAND_COLORS.neutral900,
    secondaryContainer: CUBS_BRAND_COLORS.secondaryDark,
    onSecondaryContainer: CUBS_BRAND_COLORS.neutral100,
    
    tertiary: CUBS_BRAND_COLORS.tertiaryLight, // Lighter green
    onTertiary: CUBS_BRAND_COLORS.neutral900,
    tertiaryContainer: CUBS_BRAND_COLORS.tertiaryDark,
    onTertiaryContainer: CUBS_BRAND_COLORS.neutral100,

    error: '#CF6679', // Standard dark theme error, or CUBS_BRAND_COLORS.accent if preferred
    onError: '#000000',
    errorContainer: '#B00020', // Darker error container
    onErrorContainer: '#FFFFFF',

    background: CUBS_BRAND_COLORS.neutral900, // Dark background
    onBackground: CUBS_BRAND_COLORS.neutral100,
    surface: CUBS_BRAND_COLORS.neutral800, // Slightly lighter dark surface
    onSurface: CUBS_BRAND_COLORS.neutral100,
    surfaceVariant: CUBS_BRAND_COLORS.neutral700,
    onSurfaceVariant: CUBS_BRAND_COLORS.neutral300,
    surfaceDisabled: CUBS_BRAND_COLORS.neutral700,
    onSurfaceDisabled: CUBS_BRAND_COLORS.neutral500,

    outline: CUBS_BRAND_COLORS.neutral600,
    outlineVariant: CUBS_BRAND_COLORS.neutral700,
    
    warning: CUBS_BRAND_COLORS.accentLight, // Lighter orange for warning
    onWarning: CUBS_BRAND_COLORS.neutral900,
    warningContainer: CUBS_BRAND_COLORS.accentDark,
    onWarningContainer: CUBS_BRAND_COLORS.neutral100,
    
    success: CUBS_BRAND_COLORS.tertiaryLight, // Lighter green for success
    onSuccess: CUBS_BRAND_COLORS.neutral900,
    successContainer: CUBS_BRAND_COLORS.tertiaryDark,
    onSuccessContainer: CUBS_BRAND_COLORS.neutral100,
    
    info: CUBS_BRAND_COLORS.secondaryLight, // Lighter blue for info
    onInfo: CUBS_BRAND_COLORS.neutral900,
    infoContainer: CUBS_BRAND_COLORS.secondaryDark,
    onInfoContainer: CUBS_BRAND_COLORS.neutral100,

    shadow: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(0, 0, 0, 0.7)',
    
    inverseSurface: CUBS_BRAND_COLORS.neutral100,
    onInverseSurface: CUBS_BRAND_COLORS.neutral900,
    inversePrimary: CUBS_BRAND_COLORS.primaryLight,
    
    body: CUBS_BRAND_COLORS.neutral300,
    text: CUBS_BRAND_COLORS.neutral100,
    
    brand: {
      primary: CUBS_BRAND_COLORS.primary, // Use subtle red from constants
      secondary: CUBS_BRAND_COLORS.secondaryLight,
      accent: CUBS_BRAND_COLORS.accentLight,
      crimson: CUBS_BRAND_COLORS.primary, // Use subtle red from constants
      softPink: CUBS_BRAND_COLORS.primaryLight,
    },
    
    status: {
      active: CUBS_BRAND_COLORS.tertiaryLight,
      inactive: CUBS_BRAND_COLORS.neutral600,
      pending: CUBS_BRAND_COLORS.accentLight,
      expired: CUBS_BRAND_COLORS.primaryLight, // Lighter, but still red-based
      expiring: CUBS_BRAND_COLORS.accentLight,
    },
    
    gradient: {
      start: CUBS_BRAND_COLORS.primary,
      end: CUBS_BRAND_COLORS.primaryLight,
    },
  },
  spacing: defaultSpacing,
  breakpoints,
  layout: breakpoints,
  screen: breakpoints,
  typography: {
    ...typography,
    caption: {
      ...typography.caption,
      color: '#C0C0C8', // Better contrast for captions in dark mode
    },
  },
  borderRadius,
  shadows: {
    ...shadows,
    // Enhanced shadows for dark mode with colored glow
    small: {
      shadowColor: '#FF4757',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    medium: {
      shadowColor: '#FF4757',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10,
    },
    large: {
      shadowColor: '#FF4757',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 20,
    },
  },
};

// Safe spacing getter to prevent undefined errors
export function getSpacing(theme: any) {
  if (theme && theme.spacing) {
    return theme.spacing;
  }
  console.warn('Theme spacing not found, using default spacing');
  return defaultSpacing;
}

export const getStatusColor = (status: string, theme: CustomTheme | undefined) => {
  if (!theme?.colors?.status) {
    // Fallback colors
    const fallbackColors = {
      active: '#4CAF50',
      expired: '#F44336', 
      expiring: '#FF9800',
      pending: '#FF9800',
      inactive: '#9E9E9E',
    };
    return fallbackColors[status as keyof typeof fallbackColors] || '#9E9E9E';
  }
  
  return theme.colors.status[status as keyof typeof theme.colors.status] || '#9E9E9E';
};

export const getContainerStyle = (theme: CustomTheme | undefined, variant: 'surface' | 'elevated' | 'outlined' = 'surface') => {
  const baseStyle = {
    backgroundColor: theme?.colors?.surface || '#FFFFFF',
    borderRadius: theme?.borderRadius?.medium || 12,
  };

  switch (variant) {
    case 'elevated':
      return {
        ...baseStyle,
        ...theme?.shadows?.medium || {},
      };
    case 'outlined':
      return {
        ...baseStyle,
        borderWidth: 1,
        borderColor: theme?.colors?.outline || '#E0E0E0',
      };
    default:
      return baseStyle;
  }
};

export const getButtonStyle = (theme: CustomTheme | undefined, variant: 'primary' | 'secondary' | 'outlined' = 'primary') => {
  const baseStyle = {
    borderRadius: theme?.borderRadius?.large || 16,
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: theme?.colors?.primary || '#DD1A51',
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: theme?.colors?.secondary || '#FF6F91',
      };
    case 'outlined':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme?.colors?.primary || '#DD1A51',
      };
    default:
      return baseStyle;
  }
};

export const getCardStyle = (theme: CustomTheme | undefined, statusColor?: string) => ({
    backgroundColor: theme?.colors?.surface || '#FFFFFF',
  borderRadius: theme?.borderRadius?.large || 16,
  ...theme?.shadows?.medium || {},
  ...(statusColor && {
    borderLeftWidth: 4,
    borderLeftColor: statusColor,
  }),
});

// Helper function to create styles with theme safely
export const createThemedStyles = (theme: CustomTheme | undefined) => ({
  // Common spacing styles
  spacing: {
    xs: theme?.spacing?.xs || 4,
    sm: theme?.spacing?.sm || 8,
    md: theme?.spacing?.md || 16,
    lg: theme?.spacing?.lg || 24,
    xl: theme?.spacing?.xl || 32,
  },
  
  // Common container styles
  container: {
    flex: 1,
    backgroundColor: theme?.colors?.background || '#F5F5F5',
  },
  
  // Common content padding
  contentPadding: {
    padding: theme?.spacing?.lg || 24,
  },
  
  // Common card margin
  cardMargin: {
    margin: theme?.spacing?.md || 16,
    marginBottom: theme?.spacing?.md || 16,
  },
  
  // FAB positioning
  fab: {
    position: 'absolute' as const,
    right: theme?.spacing?.lg || 24,
    bottom: theme?.spacing?.lg || 24,
  },
}); 