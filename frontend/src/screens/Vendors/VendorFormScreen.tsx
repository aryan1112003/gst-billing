import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MainLayout } from '../../components/Layout/MainLayout';
import { SearchableDropdown } from '../../components/Common/SearchableDropdown';
import { PhoneInput } from '../../components/Common/PhoneInput';
import { colors } from '../../theme/colors';
import { vendorsAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

export const VendorFormScreen: React.FC = ({ route, navigation }: any) => {
  const { vendorId, isSupplier } = route.params || {};
  const isEditing = !!vendorId;
  const { isMobile, isTablet, rs } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: isSupplier ? 'Supplier' : 'Service Provider',
    address: '',
    city: '',
    pinCode: '',
    paymentTerms: '30',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    notes: '',
  });

  useEffect(() => {
    if (isEditing) {
      fetchVendorData();
    }
  }, [vendorId, isEditing]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const response = await vendorsAPI.getById(vendorId);
      const vendor = response.data || response;
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        category: vendor.category || 'Supplier',
        address: vendor.address || '',
        city: vendor.city || '',
        pinCode: vendor.pinCode || '',
        paymentTerms: vendor.paymentTerms?.toString() || '30',
        bankAccountNumber: vendor.bankAccountNumber || '',
        ifscCode: vendor.ifscCode || '',
        bankName: vendor.bankName || '',
        notes: vendor.notes || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch vendor:', error);
      Alert.alert('Error', 'Failed to load vendor data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Validation Error', 'Vendor name is required');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Validation Error', 'Invalid email format');
      return;
    }
    if (formData.phone && !phoneValid) {
      Alert.alert('Validation Error', 'Invalid phone number for the selected country');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await vendorsAPI.update(vendorId, formData);
        Alert.alert('Success', 'Vendor updated successfully!');
      } else {
        await vendorsAPI.create(formData);
        Alert.alert('Success', 'Vendor created successfully!');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save vendor:', error);
      Alert.alert('Error', error.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout currentRoute="Vendors" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={[styles.formCard, {
            maxWidth: rs(undefined, 800, 1100) as any,
            alignSelf: 'center' as any,
            width: '100%',
          }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.formContent, { padding: rs(16, 24, 28) as any }]}>
            <Text style={styles.title}>
              {isEditing
                ? (isSupplier ? 'Edit Supplier' : 'Edit Vendor')
                : (isSupplier ? 'Add New Supplier' : 'Add New Vendor')}
            </Text>

            <TextInput
              label="Vendor Name *"
              mode="outlined"
              style={styles.input}
              placeholder="Enter vendor company name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            {/* Email + Phone row */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <TextInput
                label="Email"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                keyboardType="email-address"
                placeholder="vendor@company.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />

              <View style={{ flex: 1 }}>
                <PhoneInput
                  label="Phone"
                  value={formData.phone}
                  onChangePhone={(fullPhone, isValid) => {
                    setFormData({ ...formData, phone: fullPhone });
                    setPhoneValid(isValid || !fullPhone);
                  }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <RadioButton.Group
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                value={formData.category}
              >
                <View style={styles.radioContainer}>
                  <View style={styles.radioItem}>
                    <RadioButton value="Supplier" />
                    <Text style={styles.radioLabel}>Supplier</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="Service Provider" />
                    <Text style={styles.radioLabel}>Service Provider</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="Contractor" />
                    <Text style={styles.radioLabel}>Contractor</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <TextInput
              label="Address"
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Complete business address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            {/* City + PIN Code row */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <TextInput
                label="City"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />

              <TextInput
                label="PIN Code"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                keyboardType="numeric"
                value={formData.pinCode}
                onChangeText={(text) => setFormData({ ...formData, pinCode: text })}
              />
            </View>

            <SearchableDropdown
              options={[
                { label: 'Net 15 days', value: '15' },
                { label: 'Net 30 days', value: '30' },
                { label: 'Net 45 days', value: '45' },
                { label: 'Net 60 days', value: '60' },
                { label: 'Immediate', value: '0' },
              ]}
              value={formData.paymentTerms}
              onSelect={(value) => setFormData({ ...formData, paymentTerms: value })}
              placeholder="Payment Terms"
              searchable={false}
            />

            <TextInput
              label="Bank Account Number"
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              value={formData.bankAccountNumber}
              onChangeText={(text) => setFormData({ ...formData, bankAccountNumber: text })}
            />

            {/* IFSC Code + Bank Name row */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <TextInput
                label="IFSC Code"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                autoCapitalize="characters"
                value={formData.ifscCode}
                onChangeText={(text) => setFormData({ ...formData, ifscCode: text })}
              />

              <TextInput
                label="Bank Name"
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                value={formData.bankName}
                onChangeText={(text) => setFormData({ ...formData, bankName: text })}
              />
            </View>

            <TextInput
              label="Notes"
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Additional notes about this vendor..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                {isEditing
                  ? (isSupplier ? 'Update Supplier' : 'Update Vendor')
                  : (isSupplier ? 'Add Supplier' : 'Add Vendor')}
              </Button>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  formCard: {
    margin: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.neutral[400],
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
  },
});