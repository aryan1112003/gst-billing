import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Simple test app for Android debugging
 * Use this to verify Android is working before loading the full app
 * 
 * To use: Rename this file to App.tsx temporarily
 */

export default function TestApp() {
  const [count, setCount] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
    console.log(message);
  };

  React.useEffect(() => {
    addLog('✅ App mounted successfully');
    addLog(`Platform: ${Platform.OS} ${Platform.Version}`);
  }, []);

  const testAsyncStorage = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      await AsyncStorage.removeItem('test_key');
      addLog(`✅ AsyncStorage works: ${value}`);
    } catch (error) {
      addLog(`❌ AsyncStorage failed: ${error}`);
    }
  };

  const testNavigation = () => {
    try {
      const { NavigationContainer } = require('@react-navigation/native');
      addLog('✅ Navigation library loaded');
    } catch (error) {
      addLog(`❌ Navigation failed: ${error}`);
    }
  };

  const testRedux = () => {
    try {
      const { Provider } = require('react-redux');
      const { store } = require('./src/store/store');
      addLog('✅ Redux store loaded');
      addLog(`Store state: ${JSON.stringify(store.getState()).substring(0, 50)}...`);
    } catch (error) {
      addLog(`❌ Redux failed: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Android Test App</Text>
        <Text style={styles.subtitle}>Platform: {Platform.OS} {Platform.Version}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Counter Test</Text>
        <Text style={styles.counter}>Count: {count}</Text>
        <Button title="Increment" onPress={() => {
          setCount(c => c + 1);
          addLog(`Counter incremented to ${count + 1}`);
        }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Component Tests</Text>
        <Button title="Test AsyncStorage" onPress={testAsyncStorage} />
        <View style={styles.spacer} />
        <Button title="Test Navigation" onPress={testNavigation} />
        <View style={styles.spacer} />
        <Button title="Test Redux" onPress={testRedux} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          If you see this, React Native is working! ✅
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  counter: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#2196F3',
  },
  spacer: {
    height: 10,
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
