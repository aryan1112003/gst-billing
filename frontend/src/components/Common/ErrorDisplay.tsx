import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { ErrorDisplayProps } from '../../types';
import { getFieldError } from '../../utils/validation';

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, field }) => {
  const error = getFieldError(errors, field);
  
  if (!error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -8,
    marginBottom: 8,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
  },
});