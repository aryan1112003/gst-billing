import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Card, IconButton, DataTable } from 'react-native-paper';
import { SearchableDropdown } from './SearchableDropdown';
import { ContactPersonFormProps, ContactPerson } from '../../types';
import { SALUTATIONS } from '../../utils/validation';
import { useResponsive } from '../../utils/responsive';

export const ContactPersonForm: React.FC<ContactPersonFormProps> = ({
  contacts,
  onChange,
}) => {
  const { isMobile } = useResponsive();
  const isDesktop = !isMobile;

  const addContact = () => {
    const newContact: ContactPerson = {
      id: Date.now().toString(),
      salutation: '',
      firstName: '',
      lastName: '',
      emailAddress: '',
      workPhone: '',
      mobile: '',
    };
    onChange([...contacts, newContact]);
  };

  const updateContact = (index: number, field: keyof ContactPerson, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    onChange(updatedContacts);
  };

  const removeContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    onChange(updatedContacts);
  };

  const renderDesktopTable = () => (
    <DataTable style={styles.table}>
      <DataTable.Header>
        <DataTable.Title style={styles.salutationColumn}>Salutation</DataTable.Title>
        <DataTable.Title style={styles.nameColumn}>First Name</DataTable.Title>
        <DataTable.Title style={styles.nameColumn}>Last Name</DataTable.Title>
        <DataTable.Title style={styles.emailColumn}>Email Address</DataTable.Title>
        <DataTable.Title style={styles.phoneColumn}>Work Phone</DataTable.Title>
        <DataTable.Title style={styles.phoneColumn}>Mobile</DataTable.Title>
        <DataTable.Title style={styles.actionColumn}>Action</DataTable.Title>
      </DataTable.Header>

      {contacts.map((contact, index) => (
        <DataTable.Row key={contact.id}>
          <DataTable.Cell style={styles.salutationColumn}>
            <SearchableDropdown
              options={SALUTATIONS}
              value={contact.salutation}
              onSelect={(value) => updateContact(index, 'salutation', value)}
              placeholder="Select"
              searchable={false}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.nameColumn}>
            <TextInput
              value={contact.firstName}
              onChangeText={(value) => updateContact(index, 'firstName', value)}
              mode="outlined"
              dense
              style={styles.tableInput}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.nameColumn}>
            <TextInput
              value={contact.lastName}
              onChangeText={(value) => updateContact(index, 'lastName', value)}
              mode="outlined"
              dense
              style={styles.tableInput}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.emailColumn}>
            <TextInput
              value={contact.emailAddress}
              onChangeText={(value) => updateContact(index, 'emailAddress', value)}
              mode="outlined"
              dense
              keyboardType="email-address"
              style={styles.tableInput}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.phoneColumn}>
            <TextInput
              value={contact.workPhone || ''}
              onChangeText={(value) => updateContact(index, 'workPhone', value)}
              mode="outlined"
              dense
              keyboardType="phone-pad"
              style={styles.tableInput}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.phoneColumn}>
            <TextInput
              value={contact.mobile || ''}
              onChangeText={(value) => updateContact(index, 'mobile', value)}
              mode="outlined"
              dense
              keyboardType="phone-pad"
              style={styles.tableInput}
            />
          </DataTable.Cell>
          
          <DataTable.Cell style={styles.actionColumn}>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => removeContact(index)}
            />
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  );

  const renderMobileCards = () => (
    <View style={styles.mobileContainer}>
      {contacts.map((contact, index) => (
        <Card key={contact.id} style={styles.contactCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Contact Person {index + 1}</Text>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => removeContact(index)}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.salutationContainer}>
                <SearchableDropdown
                  options={SALUTATIONS}
                  value={contact.salutation}
                  onSelect={(value) => updateContact(index, 'salutation', value)}
                  placeholder="Salutation"
                  searchable={false}
                />
              </View>
              
              <TextInput
                label="First Name *"
                value={contact.firstName}
                onChangeText={(value) => updateContact(index, 'firstName', value)}
                mode="outlined"
                style={styles.nameInput}
              />
            </View>

            <TextInput
              label="Last Name *"
              value={contact.lastName}
              onChangeText={(value) => updateContact(index, 'lastName', value)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email Address *"
              value={contact.emailAddress}
              onChangeText={(value) => updateContact(index, 'emailAddress', value)}
              mode="outlined"
              keyboardType="email-address"
              style={styles.input}
            />

            <View style={styles.row}>
              <TextInput
                label="Work Phone"
                value={contact.workPhone || ''}
                onChangeText={(value) => updateContact(index, 'workPhone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
              
              <TextInput
                label="Mobile"
                value={contact.mobile || ''}
                onChangeText={(value) => updateContact(index, 'mobile', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {isDesktop ? renderDesktopTable() : renderMobileCards()}
      
      <Button
        mode="outlined"
        onPress={addContact}
        style={styles.addButton}
        icon="plus"
      >
        Add More
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  table: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  salutationColumn: {
    flex: 1,
    minWidth: 100,
  },
  nameColumn: {
    flex: 1.5,
    minWidth: 120,
  },
  emailColumn: {
    flex: 2,
    minWidth: 200,
  },
  phoneColumn: {
    flex: 1.5,
    minWidth: 120,
  },
  actionColumn: {
    flex: 0.5,
    minWidth: 60,
  },
  tableInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  mobileContainer: {
    marginBottom: 16,
  },
  contactCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  salutationContainer: {
    flex: 1,
  },
  nameInput: {
    flex: 2,
    backgroundColor: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderColor: '#3498DB',
  },
});