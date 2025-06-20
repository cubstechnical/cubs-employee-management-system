import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dark Mode Theme Colors
export const darkTheme = {
  colors: {
    primary: '#3F51B5',
    primaryDark: '#303F9F',
    secondary: '#FF4081',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    border: '#333333',
    error: '#CF6679',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
};

export const lightTheme = {
  colors: {
    primary: '#2196F3',
    primaryDark: '#1976D2',
    secondary: '#FF4081',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
};

// Context Types
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof lightTheme;
}

// Context
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

// Provider Props
interface DarkModeProviderProps {
  children: ReactNode;
}

// Storage Key
const DARK_MODE_KEY = '@darkMode';

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from storage
  useEffect(() => {
    const initializeDarkMode = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (storedDarkMode !== null) {
          setIsDarkMode(JSON.parse(storedDarkMode));
        } else {
          // Default to system preference
          const systemScheme = Appearance.getColorScheme();
          setIsDarkMode(systemScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      }
    };

    initializeDarkMode();
  }, []);

  // Toggle dark mode
  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: DarkModeContextType = {
    isDarkMode,
    toggleDarkMode,
    theme,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Hook to use dark mode
export const useDarkMode = (): DarkModeContextType => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Utility functions
export const getDynamicStyles = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
  color: isDarkMode ? '#FFFFFF' : '#000000',
  borderColor: isDarkMode ? '#333333' : '#E0E0E0',
});
