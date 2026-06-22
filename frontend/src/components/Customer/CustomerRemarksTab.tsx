import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { CustomerRemarksTabProps } from '../../types';

export const CustomerRemarksTab: React.FC<CustomerRemarksTabProps> = ({
  formData,
  onUpdate,
  errors,
}) => {
  const updateRemarks = (remarks: string) => {
    onUpdate({ remarks });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Remarks</Text>
      <TextInput
        value={formData.remarks || ''}
        onChangeText={updateRemarks}
        mode="outlined"
        multiline
        numberOfLines={8}
        style={styles.textArea}
        placeholder="Enter any additional remarks or notes about this customer..."
      />
      
      <Text style={styles.characterCount}>
        {(formData.remarks || '').length} characters
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
    marginTop: 8,
  },
});