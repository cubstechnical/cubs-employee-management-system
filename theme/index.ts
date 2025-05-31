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
  // Primary CUBS Red - Ferrari Red
  primary: '#DC143C', // Ferrari Red - bright and vibrant
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
  error: '#DC143C', // Ferrari Red for errors too
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
      primary: '#DC143C', // Ferrari Red
      secondary: CUBS_BRAND_COLORS.secondary,
      accent: CUBS_BRAND_COLORS.accent,
      crimson: '#DC143C', // Ferrari Red
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
    // Primary Colors - Bright Ferrari Red for dark mode
    primary: '#FF4757', // Brighter Ferrari Red for dark mode
    onPrimary: '#FFFFFF',
    primaryContainer: '#2C1A1D', // Dark red container
    onPrimaryContainer: '#FFB3BA', // Light red text
    
    // Secondary Colors - Professional Blue
    secondary: '#70A5F0', // Lighter blue for dark mode
    onSecondary: '#001F33',
    secondaryContainer: '#1A2E42',
    onSecondaryContainer: '#B3D1FF',
    
    // Tertiary Colors - Success Green
    tertiary: '#6BCF7F', // Lighter green for dark mode
    onTertiary: '#003319',
    tertiaryContainer: '#1B3325',
    onTertiaryContainer: '#B3E5C7',
    
    // Background Colors - Modern Dark
    background: '#0F0F23', // Deep dark blue
    onBackground: '#E8E8F0', // Light gray text
    
    // Surface Colors - Layered Dark
    surface: '#1A1A2E', // Dark blue surface
    onSurface: '#EAEAEA', // Light text
    surfaceVariant: '#2D2D44', // Darker surface variant
    onSurfaceVariant: '#C0C0C8', // Medium light text
    surfaceDisabled: '#404040',
    onSurfaceDisabled: '#808080',
    
    // Outline Colors
    outline: '#666680', // Subtle outline
    outlineVariant: '#404055', // Darker outline
    
    // Error Colors - Ferrari Red
    error: '#FF6B7D', // Bright red for errors
    onError: '#FFFFFF',
    errorContainer: '#5D1A1D',
    onErrorContainer: '#FFB3BA',
    
    // Additional Custom Colors
    warning: '#FFB347', // Warm orange for warnings
    onWarning: '#2D1B00',
    warningContainer: '#4A3200',
    onWarningContainer: '#FFD09B',
    
    success: '#6BCF7F', // Bright green for success
    onSuccess: '#003319',
    successContainer: '#1B3325',
    onSuccessContainer: '#B3E5C7',
    
    info: '#70A5F0', // Bright blue for info
    onInfo: '#001F33',
    infoContainer: '#1A2E42',
    onInfoContainer: '#B3D1FF',
    
    // Shadow and Elevation
    shadow: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(0, 0, 0, 0.7)',
    
    // Inverse Colors
    inverseSurface: '#E6E6E6',
    onInverseSurface: '#2D2D2D',
    inversePrimary: '#DC143C',
    
    // Additional required properties
    body: '#C0C0C8', // Light gray for body text
    text: '#EAEAEA', // Very light text
    
    // Brand colors - Dark mode optimized
    brand: {
      primary: '#FF4757', // Bright Ferrari Red for dark mode
      secondary: '#70A5F0',
      accent: '#FFB347',
      crimson: '#FF4757', // Bright Ferrari Red for dark mode
      softPink: '#FFB3BA',
    },
    
    // Status colors - Enhanced for dark mode
    status: {
      active: '#6BCF7F', // Bright green
      inactive: '#808090', // Neutral gray
      pending: '#FFB347', // Warm orange
      expired: '#FF6B7D', // Bright red
      expiring: '#FFB347', // Warm orange
    },
    
    // Gradient colors
    gradient: {
      start: '#FF4757',
      end: '#FFB3BA',
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