// 🎨 Enhanced Theme Provider for CUBS Enterprise HR Platform
// Supports dark/light mode, animations, and enterprise design tokens

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENHANCED_DESIGN_SYSTEM, createTheme } from '../theme/enhancedDesignSystem';

// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  colors: any;
  spacing: any;
  typography: any;
  animation: any;
  isSystemTheme: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme
export const useEnhancedTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEnhancedTheme must be used within EnhancedThemeProvider');
  }
  return context;
};

// Enhanced Paper themes based on our design system
const createPaperTheme = (mode: 'light' | 'dark') => {
  const enhancedTheme = createTheme(mode);
  const baseTheme = mode === 'light' ? MD3LightTheme : MD3DarkTheme;
  
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: enhancedTheme.colors.primary[500],
      primaryContainer: enhancedTheme.colors.primary[100],
      onPrimary: enhancedTheme.colors.primary[50],
      onPrimaryContainer: enhancedTheme.colors.primary[900],
      
      secondary: enhancedTheme.colors.secondary[500],
      secondaryContainer: enhancedTheme.colors.secondary[100],
      onSecondary: enhancedTheme.colors.secondary[50],
      onSecondaryContainer: enhancedTheme.colors.secondary[900],
      
      surface: enhancedTheme.currentTheme.surface,
      surfaceVariant: enhancedTheme.currentTheme.surfaceVariant,
      onSurface: enhancedTheme.currentTheme.onSurface,
      onSurfaceVariant: enhancedTheme.currentTheme.onSurfaceVariant,
      
      background: enhancedTheme.currentTheme.background,
      onBackground: enhancedTheme.currentTheme.onBackground,
      
      error: enhancedTheme.colors.error[500],
      onError: enhancedTheme.colors.error[50],
      errorContainer: enhancedTheme.colors.error[100],
      onErrorContainer: enhancedTheme.colors.error[900],
      
      outline: enhancedTheme.currentTheme.outline,
      outlineVariant: enhancedTheme.currentTheme.outlineVariant,
      
      // Custom colors for HR platform
      success: enhancedTheme.colors.success[500],
      warning: enhancedTheme.colors.warning[500],
      info: enhancedTheme.colors.info[500],
    },
    
    // Enhanced component defaults
    roundness: ENHANCED_DESIGN_SYSTEM.borderRadius.lg,
    
    // Animation configuration
    animation: {
      ...baseTheme.animation,
      scale: 1.0,
    },
  };
};

interface EnhancedThemeProviderProps {
  children: ReactNode;
}

export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from storage or system preference
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app-theme');
        const storedSystemPreference = await AsyncStorage.getItem('use-system-theme');
        
        const useSystem = storedSystemPreference !== 'false';
        setIsSystemTheme(useSystem);
        
        if (useSystem) {
          const systemTheme = Appearance.getColorScheme() || 'light';
          setThemeState(systemTheme);
        } else if (storedTheme) {
          setThemeState(storedTheme as 'light' | 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (isSystemTheme) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setThemeState(colorScheme || 'light');
      });
      return () => subscription?.remove();
    }
  }, [isSystemTheme]);

  // Save theme preferences
  const saveThemePreference = async (newTheme: 'light' | 'dark', useSystem: boolean) => {
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
      await AsyncStorage.setItem('use-system-theme', useSystem.toString());
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    setIsSystemTheme(false);
    saveThemePreference(newTheme, false);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    setIsSystemTheme(false);
    saveThemePreference(newTheme, false);
  };

  const setSystemTheme = (useSystem: boolean) => {
    setIsSystemTheme(useSystem);
    if (useSystem) {
      const systemTheme = Appearance.getColorScheme() || 'light';
      setThemeState(systemTheme);
      saveThemePreference(systemTheme, true);
    }
  };

  // Create enhanced theme object
  const enhancedTheme = createTheme(theme);
  const paperTheme = createPaperTheme(theme);

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    colors: enhancedTheme.colors,
    spacing: enhancedTheme.spacing,
    typography: enhancedTheme.typography,
    animation: enhancedTheme.animation,
    isSystemTheme,
    setSystemTheme,
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

// Theme-aware components
export const ThemedView: React.FC<{
  children: ReactNode;
  style?: any;
  lightColor?: string;
  darkColor?: string;
}> = ({ children, style, lightColor, darkColor }) => {
  const { theme, colors } = useEnhancedTheme();
  const backgroundColor = theme === 'light' ? lightColor : darkColor;
  
  return (
    <div style={{
      backgroundColor: backgroundColor || colors.background,
      ...(style || {}),
    }}>
      {children}
    </div>
  );
};

export const ThemedText: React.FC<{
  children: ReactNode;
  style?: any;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  lightColor?: string;
  darkColor?: string;
}> = ({ children, style, type = 'default', lightColor, darkColor }) => {
  const { theme, colors, typography } = useEnhancedTheme();
  const color = theme === 'light' ? lightColor : darkColor;
  
  const typeStyles = {
    default: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
    },
    defaultSemiBold: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
    subtitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
    },
    link: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      color: colors.primary[500],
    },
  };
  
  return (
    <span style={{
      color: color || colors.onBackground,
      ...typeStyles[type],
      ...(style || {}),
    }}>
      {children}
    </span>
  );
};

// Animation utilities
export const useThemeAnimation = () => {
  const { animation } = useEnhancedTheme();
  
  return {
    // Quick access to common animations
    fadeIn: {
      opacity: 1,
      transition: `opacity ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    },
    slideUp: {
      transform: 'translateY(0)',
      transition: `transform ${animation.duration.normal}ms ${animation.easing.easeOut}`,
    },
    scaleIn: {
      transform: 'scale(1)',
      transition: `transform ${animation.duration.fast}ms ${animation.easing.bounce}`,
    },
    // Micro-interactions
    buttonHover: animation.interactions.buttonHover,
    cardHover: animation.interactions.cardHover,
    inputFocus: animation.interactions.inputFocus,
  };
};

// Responsive utilities
export const useResponsive = () => {
  const [windowDimensions, setWindowDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 1024, height: 768 };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { breakpoints } = ENHANCED_DESIGN_SYSTEM;
  
  return {
    ...windowDimensions,
    isMobile: windowDimensions.width < breakpoints.md,
    isTablet: windowDimensions.width >= breakpoints.md && windowDimensions.width < breakpoints.lg,
    isDesktop: windowDimensions.width >= breakpoints.lg,
    isWide: windowDimensions.width >= breakpoints['2xl'],
  };
};

export default EnhancedThemeProvider; 