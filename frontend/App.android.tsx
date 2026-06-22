import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/components/Auth/AuthProvider';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { lightTheme, darkTheme } from './src/theme/theme';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Keep splash screen visible
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useTheme();
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={currentTheme}>
      {children}
    </PaperProvider>
  );
};

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('Android App initializing...');
    // Give Android a moment to initialize
    setTimeout(async () => {
      console.log('Android App ready');
      setIsReady(true);
      try {
        await SplashScreen.hideAsync();
        console.log('Splash screen hidden on Android');
      } catch (e) {
        console.warn('Error hiding splash screen on Android:', e);
      }
    }, 100);
  }, []);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemeWrapper>
            <SafeAreaProvider>
              <StatusBar
                style="dark"
                translucent={true}
                backgroundColor="transparent"
                hidden={false}
              />
              <NavigationContainer
                onReady={() => console.log('Navigation ready on Android')}
                onStateChange={(state) => {
                  console.log('Android Navigation state:', state?.routes?.[0]?.name);
                }}
              >
                <AuthProvider>
                  <AppNavigator />
                </AuthProvider>
              </NavigationContainer>
            </SafeAreaProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
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
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
