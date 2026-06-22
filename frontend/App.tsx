import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/components/Auth/AuthProvider';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { lightTheme, darkTheme } from './src/theme/theme';
import { ConfirmDialog } from './src/components/Common/ConfirmDialog';
import { setShowDialogCallback } from './src/utils/deleteConfirm';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useTheme();
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={currentTheme}>
      {children}
    </PaperProvider>
  );
};

/**
 * Main App with Navigation
 * Handles authentication flow and navigation
 */

export default function App() {
  const [error, setError] = React.useState<string | null>(null);
  const [dialogProps, setDialogProps] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });

  React.useEffect(() => {
    console.log('=== APP STARTED ===');
    console.log('Platform:', Platform.OS);

    // Set up global dialog callback for web
    if (Platform.OS === 'web') {
      setShowDialogCallback((props) => {
        setDialogProps({
          visible: true,
          title: props.title,
          message: props.message,
          onConfirm: () => {
            setDialogProps(prev => ({ ...prev, visible: false }));
            props.onConfirm();
          },
          onCancel: () => {
            setDialogProps(prev => ({ ...prev, visible: false }));
            props.onCancel();
          },
        });
      });
    }

    // Hide splash screen after a short delay to ensure everything is rendered
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('Splash screen hidden');
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    };

    hideSplash();
  }, []);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  try {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <ThemeWrapper>
            <SafeAreaProvider>
              <StatusBar
                style="dark"
                translucent={true}
                backgroundColor="transparent"
                hidden={false}
              />
              <AuthProvider>
                <NavigationContainer>
                  <AppNavigator />

                  {/* Global Confirm Dialog for Web */}
                  {Platform.OS === 'web' && (
                    <ConfirmDialog
                      visible={dialogProps.visible}
                      title={dialogProps.title}
                      message={dialogProps.message}
                      confirmText="Delete"
                      cancelText="Cancel"
                      onConfirm={dialogProps.onConfirm}
                      onCancel={dialogProps.onCancel}
                      type="danger"
                    />
                  )}
                </NavigationContainer>
              </AuthProvider>
            </SafeAreaProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </Provider>
    );
  } catch (err) {
    console.error('App error:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>App crashed</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    fontWeight: '600',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});