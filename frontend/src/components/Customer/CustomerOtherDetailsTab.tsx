import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Switch, Text, RadioButton } from 'react-native-paper';
import { SearchableDropdown } from '../Common/SearchableDropdown';
import { CustomerOtherDetailsTabProps } from '../../types';
import {
  CUSTOMER_TYPES,
  GST_TREATMENTS,
  TAX_PREFERENCES,
  CURRENCIES,
  getFieldError,
} from '../../utils/validation';
import { useResponsive } from '../../utils/responsive';

export const CustomerOtherDetailsTab: React.FC<CustomerOtherDetailsTabProps> = ({
  formData,
  onUpdate,
  errors,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const isDesktop = !isMobile;

  const updateField = (field: keyof typeof formData, value: any) => {
    onUpdate({ [field]: value });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    section: { marginBottom: isDesktop ? 24 : 20 },
    sectionTitle: {
      fontSize: isDesktop ? 16 : 15,
      fontWeight: '600',
      color: '#2C3E50',
      marginBottom: isDesktop ? 12 : 10,
    },
    input: {
      backgroundColor: '#FFFFFF',
      marginBottom: isDesktop ? 12 : 10,
      fontSize: isDesktop ? 16 : 14,
    },
    row: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: isDesktop ? 12 : 8,
      alignItems: isDesktop ? 'center' : 'stretch',
    } as any,
    column: { flexDirection: 'column', alignItems: 'stretch' },
    halfWidth: {
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
    } as any,
    flexInput: {
      flex: isDesktop ? 1 : undefined,
      width: isDesktop ? undefined : '100%',
    } as any,
    radioContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      gap: isDesktop ? 24 : 12,
      marginVertical: 8,
    } as any,
    radioItem: { flexDirection: 'row', alignItems: 'center', gap: 8 } as any,
    radioLabel: { fontSize: isDesktop ? 16 : 14 },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: '#F8F9FA',
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 8,
    } as any,
    switchLabel: { fontSize: isDesktop ? 16 : 14, fontWeight: '500' },
    linkText: {
      color: '#3498DB',
      fontSize: isDesktop ? 14 : 12,
      textDecorationLine: 'underline',
      marginTop: isDesktop ? 0 : 8,
      alignSelf: isDesktop ? 'center' : 'flex-start',
    } as any,
    errorText: { color: '#E74C3C', fontSize: 12, marginTop: -8, marginBottom: 8 },
  }), [isMobile, isTablet]);

  return (
    <View style={styles.container}>
      {/* Customer Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Type</Text>
        <RadioButton.Group
          onValueChange={(value) => updateField('customerType', value)}
          value={formData.customerType}
        >
          <View style={styles.radioContainer}>
            <View style={styles.radioItem}>
              <RadioButton value="business" />
              <Text style={styles.radioLabel}>Business</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="individual" />
              <Text style={styles.radioLabel}>Individual</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      {/* Primary Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Contact</Text>
        <View style={styles.row}>
          <View style={[styles.halfWidth, { marginBottom: isDesktop ? 0 : 12 }]}>
            <SearchableDropdown
              options={[
                { label: 'Salutation', value: '' },
                { label: 'Mr.', value: 'Mr.' },
                { label: 'Ms.', value: 'Ms.' },
                { label: 'Mrs.', value: 'Mrs.' },
                { label: 'Dr.', value: 'Dr.' },
              ]}
              value=""
              onSelect={() => {}}
              placeholder="Salutation"
              searchable={false}
            />
          </View>

          <View style={styles.flexInput}>
            <TextInput
              label={formData.customerType === 'business' ? 'Company Name *' : 'First Name *'}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              mode="outlined"
              style={styles.input}
              error={!!getFieldError(errors, 'name')}
            />
          </View>

          {formData.customerType === 'individual' && (
            <View style={styles.flexInput}>
              <TextInput
                label="Last Name"
                value={formData.displayName || ''}
                onChangeText={(value) => updateField('displayName', value)}
                mode="outlined"
                style={styles.input}
              />
            </View>
          )}
        </View>

        {getFieldError(errors, 'name') && (
          <Text style={styles.errorText}>{getFieldError(errors, 'name')}</Text>
        )}
      </View>

      {/* Customer Display Name */}
      <TextInput
        label="Customer Display Name"
        value={formData.displayName || ''}
        onChangeText={(value) => updateField('displayName', value)}
        mode="outlined"
        style={styles.input}
      />

      {/* Customer Email */}
      <TextInput
        label="Customer Email *"
        value={formData.email || ''}
        onChangeText={(value) => updateField('email', value)}
        mode="outlined"
        keyboardType="email-address"
        style={styles.input}
        error={!!getFieldError(errors, 'email')}
      />
      {getFieldError(errors, 'email') && (
        <Text style={styles.errorText}>{getFieldError(errors, 'email')}</Text>
      )}

      {/* Work Phone & Mobile */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <TextInput
            label="Work Phone"
            value={formData.phone || ''}
            onChangeText={(value) => updateField('phone', value)}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            error={!!getFieldError(errors, 'phone')}
          />
        </View>

        <View style={styles.halfWidth}>
          <TextInput
            label="Mobile"
            value=""
            onChangeText={() => {}}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>
      </View>

      <Text style={styles.linkText}>Add more details</Text>

      {/* Website */}
      <TextInput
        label="Website"
        value={formData.website || ''}
        onChangeText={(value) => updateField('website', value)}
        mode="outlined"
        style={styles.input}
      />

      {/* Other Details Tab */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Other Details</Text>

        {/* GST Treatment */}
        <SearchableDropdown
          options={GST_TREATMENTS}
          value={formData.gstTreatment}
          onSelect={(value) => updateField('gstTreatment', value)}
          placeholder="GST Treatment *"
          searchable
        />

        {/* GSTIN/UIN */}
        <TextInput
          label="GSTIN/UIN *"
          value={formData.gstin || ''}
          onChangeText={(value) => updateField('gstin', value)}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          error={!!getFieldError(errors, 'gstin')}
        />
        {getFieldError(errors, 'gstin') && (
          <Text style={styles.errorText}>{getFieldError(errors, 'gstin')}</Text>
        )}

        {/* Place of Supply */}
        <SearchableDropdown
          options={[
            { label: 'Place of Supply', value: '' },
            { label: 'Maharashtra', value: 'Maharashtra' },
            { label: 'Delhi', value: 'Delhi' },
            { label: 'Karnataka', value: 'Karnataka' },
          ]}
          value={formData.placeOfSupply || ''}
          onSelect={(value) => updateField('placeOfSupply', value)}
          placeholder="Place of Supply"
          searchable
        />

        {/* Tax Preference */}
        <RadioButton.Group
          onValueChange={(value) => updateField('taxPreference', value)}
          value={formData.taxPreference}
        >
          <View style={styles.radioContainer}>
            <View style={styles.radioItem}>
              <RadioButton value="taxable" />
              <Text style={styles.radioLabel}>Taxable</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="tax_exempt" />
              <Text style={styles.radioLabel}>Tax Exempt</Text>
            </View>
          </View>
        </RadioButton.Group>

        {/* Currency */}
        <SearchableDropdown
          options={CURRENCIES}
          value={formData.currency}
          onSelect={(value) => updateField('currency', value)}
          placeholder="Currency *"
          searchable
        />

        {/* Payment Terms */}
        <SearchableDropdown
          options={[
            { label: 'Payment Terms', value: '' },
            { label: 'Net 15', value: '15' },
            { label: 'Net 30', value: '30' },
            { label: 'Net 45', value: '45' },
            { label: 'Net 60', value: '60' },
          ]}
          value={formData.paymentTerms.toString()}
          onSelect={(value) => updateField('paymentTerms', parseInt(value))}
          placeholder="Payment Terms"
          searchable={false}
        />

        {/* Enable Portal */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Portal?</Text>
          <Switch
            value={formData.enablePortal}
            onValueChange={(value) => updateField('enablePortal', value)}
          />
        </View>
      </View>
    </View>
  );
};
