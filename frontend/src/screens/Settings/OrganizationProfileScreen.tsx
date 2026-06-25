import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import { PhoneInput } from '../../components/Common/PhoneInput';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../store/store';
import { api, agenciesAPI, getAuthToken, BASE_SERVER_URL } from '../../services/api';
import { updateAgencyLogo } from '../../store/slices/agencySlice';
import { useTheme } from '../../contexts/ThemeContext';
import { colors as baseColors } from '../../theme/colors';
import { useResponsive } from '../../utils/responsive';

const BUSINESS_TYPES = [
  'Manufacturer',
  'Service Provider',
  'Machinery Solutions',
  'Manufacturing Services',
  'Manufacturing Tools & Company Service',
  'Auto Spare Parts',
  'Job Work-Manufacturer',
  'Trader',
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Contractor',
  'Importer / Exporter',
  'Pharma / Medical',
  'Construction',
  'Transport / Logistics',
  'Food & Beverages',
  'IT / Software Services',
  'Consulting',
  'E-Commerce',
];

interface OrganizationProfileScreenProps {
  navigation?: any;
}

export const OrganizationProfileScreen: React.FC<OrganizationProfileScreenProps> = ({ navigation }) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const user = useSelector((state: RootState) => state.auth.user);
  const agency = useSelector((state: RootState) => state.agency.agency);
  const dispatch = useDispatch();

  // Admin has no agencyId — fall back to agency 1 (master company)
  const effectiveAgencyId: number = user?.agencyId ?? 1;
  const isSystemAdmin = user?.role === 'admin' && !user?.agencyId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    gstNumber: '',
    panNumber: '',
    phone: '',
    faxNumber: '',
    vatNumber: '',
    cstNumber: '',
    serviceTaxNumber: '',
    logoUrl: '',
    businessType: '',
  });

  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceStartNumber: '1',
    invoiceNumbering: 'monthly',
    deliveryChallanPrefix: '100',
    deliveryChallanStartNumber: '10000',
    deliveryChallanNumbering: 'monthly',
  });

  // Invoice terms
  const [invoiceTerms, setInvoiceTerms] = useState('');

  useEffect(() => {
    // Always load — effectiveAgencyId is at least 1
    if (!agency || !agency.companyName) {
      loadAgencyData();
    }
  }, [effectiveAgencyId]);

  // Sync with Redux agency if available
  useEffect(() => {
    if (agency) {
      setFormData({
        companyName: agency.companyName || '',
        address: agency.address || '',
        city: agency.city || '',
        state: agency.state || '',
        zipCode: agency.zipCode || '',
        gstNumber: agency.gstNumber || '',
        panNumber: agency.panNumber || '',
        phone: agency.phone || '',
        faxNumber: agency.faxNumber || '',
        vatNumber: agency.vatNumber || '',
        cstNumber: agency.cstNumber || '',
        serviceTaxNumber: agency.serviceTaxNumber || '',
        logoUrl: agency.logoUrl || '',
        businessType: agency.businessType || '',
      });
    }
  }, [agency]);

  const loadAgencyData = async () => {
    setLoading(true);
    try {
      const response: any = await api.get(`/agencies/${effectiveAgencyId}`);
      if (response.data.success) {
        const agencyData = response.data.data.agency;
        const { setAgency } = await import('../../store/slices/agencySlice');
        dispatch(setAgency(agencyData));
      }
    } catch (error) {
      console.error('Error loading agency data:', error);
      Alert.alert('Error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/agencies/${effectiveAgencyId}`, formData);
      if (response.data.success) {
        // Update Redux so sidebar menu re-filters immediately based on new business type
        const updatedAgency = response.data.data.agency;
        const { setAgency } = await import('../../store/slices/agencySlice');
        dispatch(setAgency(updatedAgency));
        Alert.alert('Success', 'Organization profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error saving agency data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update organization profile');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    console.log('Logo upload — agency:', effectiveAgencyId);

    try {
      // Simple file input for web/testing
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input); // Append to body to ensure it works

      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        document.body.removeChild(input); // Clean up

        if (!file) return;

        console.log('File selected:', file);

        // Check file size (10MB max matches backend)
        if (file.size > 10 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be less than 10MB');
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          Alert.alert('Error', 'Please select an image file');
          return;
        }

        setSaving(true);
        try {
          await uploadLogo(file);
        } catch (error) {
          console.error('Error uploading logo:', error);
          Alert.alert('Error', 'Failed to upload logo');
        } finally {
          setSaving(false);
        }
      };

      input.click();
    } catch (err) {
      console.error('Error creating file input:', err);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      console.log('Starting logo upload for agency:', effectiveAgencyId);
      const uploadFormData = new FormData();
      uploadFormData.append('logo', file);

      const token = getAuthToken();
      const uploadUrl = `${BASE_SERVER_URL}/api/v1/agencies/${effectiveAgencyId}/logo`;
      console.log('Upload URL:', uploadUrl);

      // Upload to server
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Do NOT set Content-Type here, let the browser set it with the boundary
        },
        body: uploadFormData,
      });

      console.log('Upload response status:', response.status);

      const data = await response.json();
      console.log('Upload response data:', data);

      if (data.success) {
        // Update form data with new logo URL
        setFormData(prev => ({ ...prev, logoUrl: data.data.logoUrl }));

        // Update Redux store so sidebar updates immediately
        dispatch(updateAgencyLogo(data.data.logoUrl));

        Alert.alert('Success', 'Logo uploaded successfully!');

        // Reload agency data to get updated logo
        await loadAgencyData();
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', error.message || 'Failed to upload logo');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background.main }]}>
        <ActivityIndicator size="large" color={themeColors.primary.main} />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Loading organization data...</Text>
      </View>
    );
  }

  const inputBgColor = isDarkMode ? themeColors.surface.secondary : themeColors.surface.primary;

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background.main }]}>
      <LinearGradient
        colors={isDarkMode ? themeColors.background.dark : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as any}
        style={styles.card}
      >
        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>Organization Profile</Text>

        {/* Admin info banner */}
        {isSystemAdmin && (
          <View style={[styles.adminBanner, { backgroundColor: themeColors.primary.main + '18', borderColor: themeColors.primary.main + '44' }]}>
            <MaterialIcons name="admin-panel-settings" size={18} color={themeColors.primary.main} />
            <Text style={[styles.adminBannerText, { color: themeColors.primary.main }]}>
              You are editing the <Text style={{ fontWeight: '700' }}>Master Company</Text> profile. This logo and details will appear on all invoices.
            </Text>
          </View>
        )}

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={[styles.label, { color: themeColors.text.secondary }]}>Company Logo</Text>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={pickImage}
            disabled={saving}
          >
            {formData.logoUrl ? (
              <Image
                source={{ uri: formData.logoUrl.startsWith('http') ? formData.logoUrl : `${BASE_SERVER_URL}${formData.logoUrl}` }}
                style={styles.logo}
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: themeColors.surface.secondary, borderColor: themeColors.neutral[300] }]}>
                <MaterialIcons name="business" size={48} color={themeColors.neutral[400]} />
                <Text style={[styles.logoPlaceholderText, { color: themeColors.text.muted }]}>
                  {saving ? 'Uploading...' : 'Upload Logo'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {!!formData.logoUrl && (
            <TouchableOpacity
              style={styles.removeLogoButton}
              onPress={async () => {
                try {
                  setSaving(true);
                  await api.put(`/agencies/${effectiveAgencyId}`, { ...formData, logoUrl: '' });
                  setFormData({ ...formData, logoUrl: '' });
                  dispatch(updateAgencyLogo(''));
                  Alert.alert('Success', 'Logo removed successfully');
                } catch (error) {
                  console.error('Error removing logo:', error);
                  Alert.alert('Error', 'Failed to remove logo permanently');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              <Text style={[styles.removeLogoText, { color: themeColors.error.main }]}>
                {saving ? 'Removing...' : 'Remove Logo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Company Information */}
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Company Information</Text>

        <TextInput
          label="Organization Name *"
          value={formData.companyName}
          onChangeText={(text) => setFormData({ ...formData, companyName: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        {/* Business Type Selector */}
        <View style={styles.dropdownContainer}>
          <Text style={[styles.inputLabel, { color: themeColors.text.secondary }]}>Business Type</Text>
          {Platform.OS === 'web' ? (
            // Native <select> on web — reliable, scrollable, no z-index issues
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              style={{
                width: '100%',
                height: 52,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 14,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: themeColors.neutral[300],
                borderRadius: 4,
                backgroundColor: inputBgColor,
                color: formData.businessType ? themeColors.text.primary : themeColors.text.muted,
                cursor: 'pointer',
                outline: 'none',
              } as any}
            >
              <option value="">Select Business Type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          ) : (
            // Menu-based picker for native mobile
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={[styles.dropdownAnchor, { backgroundColor: inputBgColor, borderColor: themeColors.neutral[300] }]}
                  onPress={() => setMenuVisible(true)}
                >
                  <Text style={formData.businessType
                    ? [styles.dropdownText, { color: themeColors.text.primary }]
                    : [styles.dropdownPlaceholder, { color: themeColors.text.muted }]}>
                    {formData.businessType || 'Select Business Type'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={themeColors.neutral[500]} />
                </TouchableOpacity>
              }
            >
              {BUSINESS_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    setFormData({ ...formData, businessType: type });
                    setMenuVisible(false);
                  }}
                  title={type}
                />
              ))}
            </Menu>
          )}
        </View>

        <TextInput
          label="Company Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        <View style={styles.row}>
          <TextInput
            label="City"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            mode="outlined"
            style={[styles.input, styles.halfInput, { backgroundColor: inputBgColor }]}
            outlineColor={themeColors.neutral[300]}
            activeOutlineColor={themeColors.primary.main}
            textColor={themeColors.text.primary}
          />

          <TextInput
            label="State"
            value={formData.state}
            onChangeText={(text) => setFormData({ ...formData, state: text })}
            mode="outlined"
            style={[styles.input, styles.halfInput, { backgroundColor: inputBgColor }]}
            outlineColor={themeColors.neutral[300]}
            activeOutlineColor={themeColors.primary.main}
            textColor={themeColors.text.primary}
          />
        </View>

        <TextInput
          label="Zip Code"
          value={formData.zipCode}
          onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        {/* Tax Information */}
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Tax Information</Text>

        <TextInput
          label="GSTIN Number"
          value={formData.gstNumber}
          onChangeText={(text) => setFormData({ ...formData, gstNumber: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        <TextInput
          label="PAN Number"
          value={formData.panNumber}
          onChangeText={(text) => setFormData({ ...formData, panNumber: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        <TextInput
          label="VAT/TIN Number"
          value={formData.vatNumber}
          onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        <TextInput
          label="CST Number"
          value={formData.cstNumber}
          onChangeText={(text) => setFormData({ ...formData, cstNumber: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        <TextInput
          label="Service Tax Number"
          value={formData.serviceTaxNumber}
          onChangeText={(text) => setFormData({ ...formData, serviceTaxNumber: text })}
          mode="outlined"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        {/* Contact Information */}
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Contact Information</Text>

        <PhoneInput
          label="Phone Number"
          value={formData.phone}
          onChangePhone={(fullPhone) => setFormData({ ...formData, phone: fullPhone })}
          activeColor={themeColors.primary.main}
          borderColor={themeColors.neutral[300]}
          selectorBg={isDarkMode ? themeColors.surface.secondary : '#F3F4F5'}
          textColor={themeColors.text.primary}
          labelColor={themeColors.text.secondary}
          style={[styles.input, { backgroundColor: inputBgColor }]}
        />

        <TextInput
          label="Fax Number"
          value={formData.faxNumber}
          onChangeText={(text) => setFormData({ ...formData, faxNumber: text })}
          mode="outlined"
          keyboardType="phone-pad"
          style={[styles.input, { backgroundColor: inputBgColor }]}
          outlineColor={themeColors.neutral[300]}
          activeOutlineColor={themeColors.primary.main}
          textColor={themeColors.text.primary}
        />

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          buttonColor={themeColors.primary.main}
          contentStyle={styles.saveButtonContent}
        >
          {saving ? 'Saving...' : 'Update Details'}
        </Button>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: baseColors.text.secondary,
  },
  noAgencyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noAgencyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  noAgencyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  noAgencyText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: baseColors.text.primary,
    marginBottom: 20,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  adminBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  logoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: baseColors.text.secondary,
    marginBottom: 8,
  },
  logoContainer: {
    alignSelf: 'flex-start',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: baseColors.neutral[100],
    borderWidth: 2,
    borderColor: baseColors.neutral[300],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: baseColors.text.muted,
  },
  removeLogoButton: {
    marginTop: 8,
    padding: 8,
  },
  removeLogoText: {
    fontSize: 14,
    color: baseColors.error.main,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: baseColors.text.primary,
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: baseColors.text.secondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  dropdownAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: baseColors.neutral[300],
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  dropdownText: {
    fontSize: 16,
    color: baseColors.text.primary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: baseColors.text.muted,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});
