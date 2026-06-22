import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

/**
 * Simplified App for Expo Go
 * Removes QueryClient and complex auth initialization
 */

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    console.log('App initializing...');
    // Simple delay to ensure everything is loaded
    const timer = setTimeout(() => {
      console.log('App ready!');
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
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
              console.log('Nav state:', state?.routes?.[0]?.name);
            }}
          >
            <AppNavigator />
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
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
});
