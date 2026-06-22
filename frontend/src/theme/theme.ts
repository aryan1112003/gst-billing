import { MD3LightTheme as DefaultTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005437',
    secondary: '#068B5E',
    tertiary: '#4DBF96',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F5',
    background: '#F9FAFB',
    error: '#f43f5e',
    success: '#068B5E',
    warning: '#f59e0b',
    info: '#005437',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#068B5E',
    secondary: '#4DBF96',
    tertiary: '#0aad76',
    surface: '#2a2e32',
    surfaceVariant: '#191919',
    background: '#191919',
    error: '#fb7185',
    success: '#4DBF96',
    warning: '#fbbf24',
    info: '#068B5E',
  },
};

export const theme = {
  ...lightTheme,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    button: {
      shadowColor: '#005437',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
