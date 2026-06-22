import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

/**
 * MINIMAL TEST APP
 * Use this to test if Expo Go is working at all
 * 
 * To use: Rename App.tsx to App.main.tsx
 *         Rename this file to App.tsx
 *         Press 'r' in Metro to reload
 */

export default function App() {
  const [count, setCount] = React.useState(0);
  
  console.log('=== MINIMAL APP RENDERING ===');
  console.log('Count:', count);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ ERP App Test</Text>
      <Text style={styles.subtitle}>If you see this, React Native works!</Text>
      
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Counter: {count}</Text>
        <Button 
          title="Increment" 
          onPress={() => {
            console.log('Button pressed!');
            setCount(c => c + 1);
          }}
          color="#fff"
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>✅ React Native: Working</Text>
        <Text style={styles.infoText}>✅ Expo Go: Working</Text>
        <Text style={styles.infoText}>✅ JavaScript: Working</Text>
        <Text style={styles.infoText}>✅ State Management: Working</Text>
      </View>
      
      <Text style={styles.footer}>
        Now restore the main App.tsx and debug from there
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  counterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  footer: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 20,
  },
});
