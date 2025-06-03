// 🎨 CUBS Enterprise HR Platform - Enhanced Design System
// Professional UI/UX design tokens with dark mode, micro-interactions, and accessibility

// Define types for the design system
type ColorValue = string;
type SpacingValue = number;
type FontSize = number;
type FontWeight = string;
type Duration = number;
type EasingFunction = string;

interface ColorPalette {
  50: ColorValue;
  100: ColorValue;
  200: ColorValue;
  300: ColorValue;
  400: ColorValue;
  500: ColorValue;
  600: ColorValue;
  700: ColorValue;
  800: ColorValue;
  900: ColorValue;
  950: ColorValue;
}

interface SemanticColors {
  50: ColorValue;
  100: ColorValue;
  500: ColorValue;
  600: ColorValue;
  700: ColorValue;
  900: ColorValue;
}

interface StatusColors {
  active: ColorValue;
  inactive: ColorValue;
  pending: ColorValue;
  expired: ColorValue;
  expiring: ColorValue;
  reviewing: ColorValue;
  approved: ColorValue;
  rejected: ColorValue;
}

interface ChartColors {
  primary: ColorValue;
  secondary: ColorValue;
  tertiary: ColorValue;
  quaternary: ColorValue;
  accent1: ColorValue;
  accent2: ColorValue;
  accent3: ColorValue;
  accent4: ColorValue;
}

interface DesignSystemType {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    success: SemanticColors;
    warning: SemanticColors;
    error: SemanticColors;
    info: SemanticColors;
    status: StatusColors;
    charts: ChartColors;
  };
  typography: {
    fontFamily: {
      primary: string;
      display: string;
      mono: string;
    };
    fontSize: {
      xs: FontSize;
      sm: FontSize;
      base: FontSize;
      lg: FontSize;
      xl: FontSize;
      '2xl': FontSize;
      '3xl': FontSize;
      '4xl': FontSize;
      '5xl': FontSize;
      '6xl': FontSize;
      '7xl': FontSize;
    };
    fontWeight: {
      thin: FontWeight;
      extralight: FontWeight;
      light: FontWeight;
      normal: FontWeight;
      medium: FontWeight;
      semibold: FontWeight;
      bold: FontWeight;
      extrabold: FontWeight;
      black: FontWeight;
    };
    lineHeight: {
      none: number;
      tight: number;
      snug: number;
      normal: number;
      relaxed: number;
      loose: number;
    };
    letterSpacing: {
      tighter: string;
      tight: string;
      normal: string;
      wide: string;
      wider: string;
      widest: string;
    };
  };
  spacing: Record<string | number, SpacingValue>;
  borderRadius: Record<string, number>;
  shadows: {
    light: Record<string, string>;
    dark: Record<string, string>;
    brand: Record<string, string>;
  };
  breakpoints: Record<string, number>;
  animation: {
    duration: Record<string, Duration>;
    easing: Record<string, EasingFunction>;
    interactions: Record<string, any>;
  };
  components: Record<string, any>;
  themes: Record<string, any>;
  utils: Record<string, any>;
}

export const ENHANCED_DESIGN_SYSTEM: DesignSystemType = {
  // 🎯 Enhanced Color Palette - WCAG AAA Compliant
  colors: {
    // Primary Brand Colors - Professional Blue-Gray
    primary: {
      50: '#F8FAFC',
      100: '#F1F5F9', 
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#2563EB', // Main Brand Blue
      600: '#1D4ED8',
      700: '#1E40AF',
      800: '#1E3A8A',
      900: '#1E293B',
      950: '#0F172A',
    },
    
    // Secondary Colors - Warm Gray
    secondary: {
      50: '#FAFAF9',
      100: '#F5F5F4',
      200: '#E7E5E4',
      300: '#D6D3D1',
      400: '#A8A29E',
      500: '#78716C',
      600: '#57534E',
      700: '#44403C',
      800: '#292524',
      900: '#1C1917',
      950: '#0C0A09',
    },
    
    // Semantic Colors - Enhanced for Better Visibility
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      900: '#14532D',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      900: '#92400E',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      900: '#1E3A8A',
    },
    
    // Status Colors for HR Management
    status: {
      active: '#22C55E',
      inactive: '#94A3B8',
      pending: '#F59E0B',
      expired: '#EF4444',
      expiring: '#F97316',
      reviewing: '#8B5CF6',
      approved: '#10B981',
      rejected: '#F43F5E',
    },
    
    // Data Visualization Colors
    charts: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      tertiary: '#DC2626',
      quaternary: '#059669',
      accent1: '#EA580C',
      accent2: '#0891B2',
      accent3: '#C2410C',
      accent4: '#7C2D12',
    }
  },

  // 📏 Enhanced Typography System
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      display: 'Cal Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      mono: 'JetBrains Mono, "SF Mono", "Monaco", "Cascadia Code", monospace',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
    },
    
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },

  // 📐 8pt Grid System - Enhanced Spacing
  spacing: {
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
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },

  // 🔄 Professional Border Radius
  borderRadius: {
    none: 0,
    sm: 2,
    default: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },

  // 🌊 Enhanced Shadows & Elevation
  shadows: {
    // Light mode shadows
    light: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    },
    // Dark mode shadows
    dark: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    },
    // Colored shadows for brand elements
    brand: {
      sm: '0 1px 3px 0 rgba(37, 99, 235, 0.3)',
      md: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
      lg: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
    }
  },

  // 📱 Enhanced Responsive Breakpoints
  breakpoints: {
    xs: 0,      // Mobile Portrait
    sm: 480,    // Mobile Landscape
    md: 768,    // Tablet Portrait
    lg: 1024,   // Tablet Landscape / Small Desktop
    xl: 1280,   // Desktop
    '2xl': 1536, // Large Desktop
    '3xl': 1920, // Ultra Wide
  },

  // ⚡ Sophisticated Animation System
  animation: {
    duration: {
      instant: 0,
      fastest: 50,
      faster: 100,
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 400,
      slowest: 500,
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Custom professional easings
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    
    // Micro-interaction presets
    interactions: {
      buttonHover: {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        scale: 1.02,
        brightness: 1.1,
      },
      cardHover: {
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        translateY: -2,
        shadowIntensity: 1.5,
      },
      inputFocus: {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        borderWidth: 2,
        glowIntensity: 0.3,
      }
    }
  },

  // 🎛️ Professional Component Variants
  components: {
    button: {
      sizes: {
        xs: { height: 24, paddingHorizontal: 8, fontSize: 12, borderRadius: 4 },
        sm: { height: 32, paddingHorizontal: 12, fontSize: 14, borderRadius: 6 },
        md: { height: 40, paddingHorizontal: 16, fontSize: 16, borderRadius: 8 },
        lg: { height: 48, paddingHorizontal: 20, fontSize: 18, borderRadius: 10 },
        xl: { height: 56, paddingHorizontal: 24, fontSize: 20, borderRadius: 12 },
      },
      variants: {
        primary: { backgroundColor: 'primary.500', color: 'white' },
        secondary: { backgroundColor: 'secondary.100', color: 'secondary.900' },
        outline: { borderWidth: 1, borderColor: 'primary.500', color: 'primary.500' },
        ghost: { backgroundColor: 'transparent', color: 'primary.500' },
        destructive: { backgroundColor: 'error.500', color: 'white' },
      }
    },
    
    input: {
      sizes: {
        sm: { height: 36, fontSize: 14, paddingHorizontal: 12, borderRadius: 6 },
        md: { height: 44, fontSize: 16, paddingHorizontal: 16, borderRadius: 8 },
        lg: { height: 52, fontSize: 18, paddingHorizontal: 20, borderRadius: 10 },
      },
      states: {
        default: { borderColor: 'secondary.300' },
        focus: { borderColor: 'primary.500', borderWidth: 2 },
        error: { borderColor: 'error.500', borderWidth: 1 },
        disabled: { backgroundColor: 'secondary.50', color: 'secondary.400' },
      }
    },
    
    card: {
      variants: {
        elevated: { 
          backgroundColor: 'white',
          borderRadius: 12,
          shadowLevel: 'md',
          borderWidth: 0,
        },
        outlined: { 
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'secondary.200',
          shadowLevel: 'xs',
        },
        flat: { 
          backgroundColor: 'secondary.50',
          borderRadius: 8,
          shadowLevel: 'none',
          borderWidth: 0,
        },
      }
    },
    
    badge: {
      sizes: {
        sm: { height: 20, paddingHorizontal: 8, fontSize: 12 },
        md: { height: 24, paddingHorizontal: 10, fontSize: 14 },
        lg: { height: 28, paddingHorizontal: 12, fontSize: 16 },
      },
      variants: {
        default: { backgroundColor: 'secondary.100', color: 'secondary.900' },
        primary: { backgroundColor: 'primary.100', color: 'primary.900' },
        success: { backgroundColor: 'success.100', color: 'success.900' },
        warning: { backgroundColor: 'warning.100', color: 'warning.900' },
        error: { backgroundColor: 'error.100', color: 'error.900' },
      }
    }
  },

  // 🌐 Advanced Theme System
  themes: {
    light: {
      // Surface colors
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceVariant: '#F1F5F9',
      surfaceContainer: '#E2E8F0',
      
      // Text colors
      onBackground: '#0F172A',
      onSurface: '#1E293B',
      onSurfaceVariant: '#475569',
      
      // Interactive colors
      primary: '#2563EB',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DBEAFE',
      onPrimaryContainer: '#1E3A8A',
      
      secondary: '#475569',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#F1F5F9',
      onSecondaryContainer: '#0F172A',
      
      // Border and outline colors
      outline: '#CBD5E1',
      outlineVariant: '#E2E8F0',
      
      // State colors
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      
      // Shadow configuration
      shadowColor: '#000000',
      shadowOpacity: 0.1,
    },
    
    dark: {
      // Surface colors
      background: '#0F172A',
      surface: '#1E293B',
      surfaceVariant: '#334155',
      surfaceContainer: '#475569',
      
      // Text colors
      onBackground: '#F8FAFC',
      onSurface: '#E2E8F0',
      onSurfaceVariant: '#CBD5E1',
      
      // Interactive colors
      primary: '#3B82F6',
      onPrimary: '#FFFFFF',
      primaryContainer: '#1E3A8A',
      onPrimaryContainer: '#DBEAFE',
      
      secondary: '#94A3B8',
      onSecondary: '#0F172A',
      secondaryContainer: '#334155',
      onSecondaryContainer: '#F1F5F9',
      
      // Border and outline colors
      outline: '#475569',
      outlineVariant: '#334155',
      
      // State colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA',
      
      // Shadow configuration
      shadowColor: '#000000',
      shadowOpacity: 0.4,
    }
  },

  // 🔧 Utility Functions
  utils: {
    // Generate spacing values
    spacing: (...values: number[]) => 
      values.map(v => `${v * 4}px`).join(' '),
    
    // Generate responsive values
    responsive: (base: number, scale: number = 1.2) => ({
      xs: base,
      sm: Math.round(base * scale),
      md: Math.round(base * scale * scale),
      lg: Math.round(base * scale * scale * scale),
    }),
    
    // Color manipulation utilities
    alpha: (color: string, opacity: number) => 
      `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    
    // Animation utilities
    transition: (property: string, duration?: keyof typeof ENHANCED_DESIGN_SYSTEM.animation.duration) => 
      `${property} ${ENHANCED_DESIGN_SYSTEM.animation.duration[duration || 'normal']}ms ${ENHANCED_DESIGN_SYSTEM.animation.easing.easeInOut}`,
  }
};

// Theme helper functions
export const createTheme = (mode: 'light' | 'dark') => {
  const theme = ENHANCED_DESIGN_SYSTEM.themes[mode];
  return {
    ...ENHANCED_DESIGN_SYSTEM,
    currentTheme: theme,
    mode,
  };
};

export const getThemeColor = (colorPath: string, theme: 'light' | 'dark' = 'light') => {
  const themeColors = ENHANCED_DESIGN_SYSTEM.themes[theme];
  return colorPath.split('.').reduce((obj, key) => obj?.[key], themeColors as any);
};

export const getStatusColor = (status: keyof typeof ENHANCED_DESIGN_SYSTEM.colors.status) => 
  ENHANCED_DESIGN_SYSTEM.colors.status[status];

export const createResponsiveSpacing = (base: number) => 
  ENHANCED_DESIGN_SYSTEM.utils.responsive(base);

export default ENHANCED_DESIGN_SYSTEM; 