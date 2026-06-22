import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/components/Auth/AuthProvider';
import { theme } from './src/theme/theme';

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    console.log('App initializing...');
    
    // Initialize app with timeout
    const initTimer = setTimeout(() => {
      try {
        console.log('App ready');
        setIsReady(true);
      } catch (err) {
        console.error('Init error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }, 100);
    
    return () => clearTimeout(initTimer);
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading ERP App...</Text>
      </View>
    );
  }
  
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer
            onReady={() => console.log('Navigation ready')}
            onStateChange={(state) => {
              const routeName = state?.routes?.[0]?.name;
              console.log('Current route:', routeName);
            }}
          >
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
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