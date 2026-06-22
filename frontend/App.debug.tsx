import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('Debug App component rendering...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Debug App is Working!</Text>
      <Text style={styles.subtext}>If you see this, the basic app structure is fine.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});