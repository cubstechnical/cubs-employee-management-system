// 🎨 CUBS Employee Management System - Design System
// Comprehensive UI/UX design tokens for consistency across Web, Mobile, and PWA

export const DESIGN_SYSTEM = {
  // 🎯 Color Palette - WCAG AA Compliant
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#FEF2F2',
      100: '#FEE2E2', 
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#DC143C', // Main Brand Red
      600: '#B91C1C',
      700: '#991B1B',
      800: '#7F1D1D',
      900: '#571717',
    },
    
    // Semantic Colors
    success: {
      light: '#22C55E',
      main: '#16A34A',
      dark: '#15803D',
      bg: '#F0FDF4',
    },
    warning: {
      light: '#F59E0B',
      main: '#D97706',
      dark: '#B45309',
      bg: '#FFFBEB',
    },
    error: {
      light: '#EF4444',
      main: '#DC2626',
      dark: '#B91C1C',
      bg: '#FEF2F2',
    },
    info: {
      light: '#3B82F6',
      main: '#2563EB',
      dark: '#1D4ED8',
      bg: '#EFF6FF',
    },
    
    // Neutral Colors - Enhanced for Dark/Light Mode
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Status Colors for Employee Management
    status: {
      active: '#22C55E',
      inactive: '#6B7280',
      expiring: '#F59E0B',
      expired: '#EF4444',
      pending: '#8B5CF6',
    }
  },

  // 📏 Typography Scale
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, "Fira Code", Menlo, Monaco, monospace',
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
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // 📐 Spacing Scale (8pt grid system)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  },

  // 🔄 Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // 🌊 Shadows & Elevation
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    brand: '0 4px 14px rgba(220, 20, 60, 0.25)',
  },

  // 📱 Breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },

  // ⚡ Animation & Transitions
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  // 🎛️ Component Variants
  components: {
    button: {
      sizes: {
        sm: { height: 32, paddingHorizontal: 12, fontSize: 14 },
        md: { height: 40, paddingHorizontal: 16, fontSize: 16 },
        lg: { height: 48, paddingHorizontal: 20, fontSize: 18 },
      }
    },
    input: {
      sizes: {
        sm: { height: 36, fontSize: 14 },
        md: { height: 44, fontSize: 16 },
        lg: { height: 52, fontSize: 18 },
      }
    },
    card: {
      variants: {
        elevated: { elevation: 4, borderRadius: 12 },
        outlined: { borderWidth: 1, borderRadius: 12 },
        flat: { elevation: 0, borderRadius: 8 },
      }
    }
  },

  // 🌐 Dark/Light Mode Themes
  themes: {
    light: {
      background: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceVariant: '#F3F4F6',
      onBackground: '#111827',
      onSurface: '#374151',
      onSurfaceVariant: '#6B7280',
    },
    dark: {
      background: '#111827',
      surface: '#1F2937',
      surfaceVariant: '#374151',
      onBackground: '#F9FAFB',
      onSurface: '#E5E7EB',
      onSurfaceVariant: '#9CA3AF',
    }
  }
};

// 🛠️ Utility Functions
export const createThemeColors = (isDark: boolean) => ({
  ...DESIGN_SYSTEM.colors,
  ...DESIGN_SYSTEM.themes[isDark ? 'dark' : 'light'],
});

export const getStatusColor = (status: 'active' | 'inactive' | 'expiring' | 'expired' | 'pending') => 
  DESIGN_SYSTEM.colors.status[status];

export const getSpacing = (...values: number[]) => 
  values.map(v => DESIGN_SYSTEM.spacing[v as keyof typeof DESIGN_SYSTEM.spacing]).join('px ') + 'px';

export const createShadow = (level: keyof typeof DESIGN_SYSTEM.shadows) => 
  DESIGN_SYSTEM.shadows[level];

// 📐 Layout Helpers
export const LAYOUT = {
  headerHeight: 64,
  sidebarWidth: 280,
  sidebarWidthMobile: 320,
  containerMaxWidth: 1200,
  contentPadding: DESIGN_SYSTEM.spacing[4],
  sectionGap: DESIGN_SYSTEM.spacing[6],
};

export default DESIGN_SYSTEM; 