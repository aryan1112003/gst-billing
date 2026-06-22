import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContactPersonForm } from '../Common/ContactPersonForm';
import { CustomerContactPersonsTabProps, ContactPerson } from '../../types';

export const CustomerContactPersonsTab: React.FC<CustomerContactPersonsTabProps> = ({
  formData,
  onUpdate,
  errors,
}) => {
  const updateContactPersons = (contacts: ContactPerson[]) => {
    onUpdate({ contactPersons: contacts });
  };

  return (
    <View style={styles.container}>
      <ContactPersonForm
        contacts={formData.contactPersons}
        onChange={updateContactPersons}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});