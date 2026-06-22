import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

interface ThemeColors {
  primary: typeof colors.primary;
  secondary: typeof colors.secondary;
  success: typeof colors.success;
  warning: typeof colors.warning;
  error: typeof colors.error;
  accent: typeof colors.accent;
  neutral: typeof colors.neutral;
  background: {
    primary: string[];
    secondary: string[];
    light: string[];
    dark: string[];
    glass: string;
    sidebar: string[];
    main: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    light: string;
  };
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
    glass: string;
    card: string;
  };
  shadow: typeof colors.shadow;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const THEME_STORAGE_KEY = '@app_theme_mode';

// Light theme — white backgrounds, brand green accents, near-black text
const lightColors: ThemeColors = {
  ...colors,
  background: {
    ...colors.background,
    main: '#F9FAFB',
  },
  text: {
    primary: '#191919',
    secondary: '#43474B',
    muted: '#929598',
    inverse: '#ffffff',
    light: '#F9FAFB',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#F3F4F5',
    elevated: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.90)',
    card: 'rgba(255, 255, 255, 0.98)',
  },
};

// Dark theme — near-black backgrounds, lighter green accents, light gray text
const darkColors: ThemeColors = {
  ...colors,
  primary: {
    ...colors.primary,
    main: '#0aad76',
    light: '#4DBF96',
    dark: '#068B5E',
  },
  background: {
    ...colors.background,
    main: '#191919',
    glass: 'rgba(25, 25, 25, 0.90)',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#CACCCF',
    muted: '#929598',
    inverse: '#191919',
    light: '#F9FAFB',
  },
  surface: {
    primary: '#2a2e32',
    secondary: '#191919',
    elevated: '#2E3135',
    glass: 'rgba(42, 46, 50, 0.92)',
    card: 'rgba(25, 25, 25, 0.96)',
  },
  neutral: {
    ...colors.neutral,
    900: '#191919',
    800: '#2a2e32',
    700: '#2E3135',
    600: '#43474B',
    500: '#6B6E71',
    400: '#929598',
    300: '#CACCCF',
    200: '#E8EAEC',
    100: '#F3F4F5',
    50: '#F9FAFB',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const themeColors = isDarkMode ? darkColors : lightColors;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
