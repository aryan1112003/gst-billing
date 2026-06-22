import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';

export default function App() {
  console.log('=== TEST APP RENDERING ===');
  console.warn('TEST APP WARNING - Check if you see this in logs');
  
  const handlePress = () => {
    Alert.alert('Success!', 'The app is working correctly!');
    console.log('Button pressed - app is interactive');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 TEST APP WORKING! 🎉</Text>
      <Text style={styles.subtext}>If you see this bright green screen, React Native is working</Text>
      
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>TAP ME TO TEST</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>✅ React Native: Working</Text>
        <Text style={styles.infoText}>✅ Metro Bundler: Connected</Text>
        <Text style={styles.infoText}>✅ Expo Go: Running</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ff00', // Bright green so you can't miss it
    padding: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtext: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff0000',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
});