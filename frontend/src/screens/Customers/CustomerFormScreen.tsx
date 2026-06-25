import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { customersAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';
import { PhoneInput } from '../../components/Common/PhoneInput';

export const CustomerFormScreen: React.FC = ({ navigation, route }: any) => {
  const customerId = route?.params?.customerId;
  const isEditMode = !!customerId;
  const { isMobile, isTablet, rs } = useResponsive();

  const [loading, setLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    if (isEditMode) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      console.log('Fetching customer with ID:', customerId);
      const response = await customersAPI.getById(customerId);
      console.log('Customer API response:', response);
      const customer = response.data?.customer || response.data || response;
      console.log('Customer data:', customer);
      
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        gstin: customer.gstin || '',
      });
      console.log('Form data set successfully');
    } catch (err: any) {
      console.error('Failed to fetch customer:', err);
      Alert.alert('Error', err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Customer name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Invalid email format';
    }
    if (formData.phone && !phoneValid) errs.phone = 'Invalid phone number';
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      errs.gstin = 'Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (isEditMode) {
        await customersAPI.update(customerId, formData);
        setLoading(false);
        // Navigate back immediately after success
        navigation.goBack();
      } else {
        await customersAPI.create(formData);
        setLoading(false);
        // Navigate back immediately after success
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to save customer');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    contentContainer: {
      padding: rs(16, 24, 32) as any,
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
      fontSize: rs(20, 24, 24) as any,
      fontWeight: '700',
      color: colors.text.primary,
    },
    form: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: rs(16, 24, 28) as any,
      maxWidth: rs(undefined, 800, 1100) as any,
      alignSelf: 'center' as any,
      width: '100%',
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
    helperText: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 4,
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
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Customers" onNavigate={handleNavigate}>
      <ScrollView style={s.container} contentContainerStyle={s.contentContainer}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.title}>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</Text>
        </View>

        <View style={s.form}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Customer Information</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>Customer Name *</Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) => { setFormData({ ...formData, name: text }); setErrors((e) => ({ ...e, name: '' })); }}
                placeholder="Enter customer name"
                style={s.input}
                outlineColor={errors.name ? colors.error.main : colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
              {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email</Text>
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => { setFormData({ ...formData, email: text }); setErrors((e) => ({ ...e, email: '' })); }}
                placeholder="customer@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
                outlineColor={errors.email ? colors.error.main : colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
              {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}
            </View>

            {/* Phone + GSTIN row on tablet/desktop */}
            <View style={{ flexDirection: rs('column', 'row', 'row') as any, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PhoneInput
                  label="Phone"
                  value={formData.phone}
                  onChangePhone={(fullPhone, isValid) => {
                    setFormData({ ...formData, phone: fullPhone });
                    setPhoneValid(isValid || !fullPhone);
                    setErrors((e) => ({ ...e, phone: '' }));
                  }}
                  error={errors.phone}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>GSTIN Number</Text>
                <TextInput
                  mode="outlined"
                  value={formData.gstin}
                  onChangeText={(text) => { setFormData({ ...formData, gstin: text.toUpperCase() }); setErrors((e) => ({ ...e, gstin: '' })); }}
                  placeholder="29ABCDE1234F1Z5"
                  autoCapitalize="characters"
                  style={s.input}
                  outlineColor={errors.gstin ? colors.error.main : colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
                {errors.gstin ? <HelperText type="error">{errors.gstin}</HelperText> : <Text style={s.helperText}>15-digit GST identification number</Text>}
              </View>
            </View>

            <View style={[s.inputGroup, { marginTop: 16 }]}>
              <Text style={s.label}>Address</Text>
              <TextInput
                mode="outlined"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
                style={s.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>
          </View>

          <View style={s.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={s.cancelButton}
              labelStyle={s.cancelButtonText}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={s.submitButton}
              labelStyle={s.submitButtonText}
              loading={loading}
              disabled={loading}
            >
              {isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

