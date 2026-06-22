import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { SearchableDropdown } from './SearchableDropdown';
import { AddressFormProps } from '../../types';
import { COUNTRIES, INDIAN_STATES } from '../../utils/validation';
import { useResponsive } from '../../utils/responsive';

export const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onChange,
  title,
  copyFromBilling = false,
  onCopyFromBilling,
}) => {
  const { isMobile } = useResponsive();
  const isDesktop = !isMobile;

  const updateAddress = (field: keyof typeof address, value: string) => {
    onChange({
      ...address,
      [field]: value,
    });
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {copyFromBilling && onCopyFromBilling && (
            <Button
              mode="outlined"
              onPress={onCopyFromBilling}
              compact
              style={styles.copyButton}
            >
              Copy billing address
            </Button>
          )}
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Attention"
            value={address.attention || ''}
            onChangeText={(value) => updateAddress('attention', value)}
            mode="outlined"
            style={styles.input}
          />

          <View style={[styles.row, !isDesktop && styles.column]}>
            <SearchableDropdown
              options={COUNTRIES}
              value={address.country}
              onSelect={(value) => updateAddress('country', value)}
              placeholder="Select Country"
              searchable
            />
          </View>

          <TextInput
            label="Address *"
            value={address.street}
            onChangeText={(value) => updateAddress('street', value)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={[styles.row, !isDesktop && styles.column]}>
            <TextInput
              label="City *"
              value={address.city}
              onChangeText={(value) => updateAddress('city', value)}
              mode="outlined"
              style={[styles.input, isDesktop && styles.halfWidth]}
            />

            {address.country === 'India' ? (
              <SearchableDropdown
                options={INDIAN_STATES}
                value={address.state}
                onSelect={(value) => updateAddress('state', value)}
                placeholder="Select State"
                searchable
              />
            ) : (
              <TextInput
                label="State *"
                value={address.state}
                onChangeText={(value) => updateAddress('state', value)}
                mode="outlined"
                style={[styles.input, isDesktop && styles.halfWidth]}
              />
            )}
          </View>

          <View style={[styles.row, !isDesktop && styles.column]}>
            <TextInput
              label="ZIP Code *"
              value={address.zipCode}
              onChangeText={(value) => updateAddress('zipCode', value)}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, isDesktop && styles.halfWidth]}
            />

            <TextInput
              label="Phone"
              value={address.phone || ''}
              onChangeText={(value) => updateAddress('phone', value)}
              mode="outlined"
              keyboardType="phone-pad"
              style={[styles.input, isDesktop && styles.halfWidth]}
            />
          </View>

          <TextInput
            label="Fax"
            value={address.fax || ''}
            onChangeText={(value) => updateAddress('fax', value)}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  copyButton: {
    borderColor: '#3498DB',
  },
  formContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flexDirection: 'column',
  },
  halfWidth: {
    flex: 1,
  },
});