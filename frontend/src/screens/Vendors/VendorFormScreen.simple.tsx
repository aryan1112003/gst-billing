import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { vendorsAPI } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export const VendorFormScreen: React.FC = ({ navigation, route }: any) => {
  const vendorId = route?.params?.vendorId;
  const isEditMode = !!vendorId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchVendor();
    }
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorsAPI.getById(vendorId);
      const vendor = response.data || response;
      
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        gstin: vendor.gstin || '',
      });
    } catch (err: any) {
      console.error('Failed to fetch vendor:', err);
      Alert.alert('Error', err.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Vendor name is required');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await vendorsAPI.update(vendorId, formData);
        setLoading(false);
        navigation.goBack();
      } else {
        await vendorsAPI.create(formData);
        setLoading(false);
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Failed to save vendor:', err);
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to save vendor');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <MainLayout currentRoute="Vendors" onNavigate={handleNavigate}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor Name *</Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter vendor name"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="vendor@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                mode="outlined"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                mode="outlined"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GSTIN Number</Text>
              <TextInput
                mode="outlined"
                value={formData.gstin}
                onChangeText={(text) => setFormData({ ...formData, gstin: text.toUpperCase() })}
                placeholder="Enter GST number"
                autoCapitalize="characters"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonText}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              loading={loading}
              disabled={loading}
            >
              {isEditMode ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: screenWidth < 768 ? 16 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: screenWidth < 768 ? 20 : 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: screenWidth < 768 ? 16 : 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderColor: colors.neutral[300],
  },
  cancelButtonText: {
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
});
