import React, { createContext, useContext, useState, useEffect } from 'react';
import { Provider as PaperProvider, Portal, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, CustomTheme } from '../theme';
import { Platform } from 'react-native';
import { handleKeyboardBehavior } from '../utils/mobileUtils';

// Theme Context - Single source of truth
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: any; // Use any to match Paper theme structure
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values instead of throwing to prevent crashes
    console.warn('useAppTheme used outside ThemeProvider, returning defaults');
    return {
      isDarkMode: false,
      toggleTheme: () => {},
      theme: {
        ...MD3LightTheme,
        colors: { ...MD3LightTheme.colors, ...lightTheme.colors },
        spacing: lightTheme.spacing,
        borderRadius: lightTheme.borderRadius,
      },
      isLoading: false,
    };
  }
  return context;
};

// Add animation configuration
export const APP_ANIMATIONS = {
  // Smooth transition durations
  duration: {
    short: 200,
    medium: 300,
    long: 500,
    extraLong: 800
  },
  
  // Easing curves
  easing: {
    standard: 'ease',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)'
  },
  
  // Common animation configs
  fadeIn: {
    duration: 300,
    useNativeDriver: true
  },
  
  slideIn: {
    duration: 300,
    useNativeDriver: true
  },
  
  scale: {
    duration: 200,
    useNativeDriver: true
  },
  
  spring: {
    tension: 100,
    friction: 8,
    useNativeDriver: true
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  // Setup mobile keyboard behavior
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (Platform.OS === 'web') {
      cleanup = handleKeyboardBehavior();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  // Create properly structured theme for React Native Paper
  const paperTheme = isDarkMode 
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          ...darkTheme.colors,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          ...lightTheme.colors,
        },
      };

  // Add our custom theme properties while maintaining Paper compatibility
  const customTheme = {
    ...paperTheme,
    spacing: lightTheme.spacing || {
      xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
    },
    breakpoints: lightTheme.breakpoints || {
      xs: 0, sm: 576, md: 768, lg: 992, xl: 1200
    },
    borderRadius: lightTheme.borderRadius || {
      small: 8, medium: 12, large: 16, xlarge: 24
    },
    shadows: lightTheme.shadows,
    typography: lightTheme.typography,
  };

  if (isLoading) {
    // Return a basic theme while loading
    return (
      <PaperProvider theme={MD3LightTheme}>
        <Portal.Host>
          {children}
        </Portal.Host>
      </PaperProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme: customTheme, isLoading }}>
      <PaperProvider theme={customTheme}>
        <Portal.Host>
          {children}
        </Portal.Host>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider; 