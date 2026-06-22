import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Switch, Divider, SegmentedButtons, TextInput, Button, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { RootState } from '../../store/store';
import { OrganizationProfileScreen } from './OrganizationProfileScreen';
import { AgencyManagementScreen } from './AgencyManagementScreen';
import { api, agenciesAPI, authAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

interface SettingsItemAction {
  label: string;
  icon: string;
  action: () => void;
}

interface SettingsItemToggle {
  label: string;
  icon: string;
  toggle: boolean;
  onToggle: (value: boolean) => void;
}

type SettingsItem = SettingsItemAction | SettingsItemToggle;

export const SettingsScreen: React.FC = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme, colors: themeColors } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const user = useSelector((state: RootState) => state.auth.user) || {
    name: 'Admin User',
    email: 'admin@mawebtechnologies.com',
    role: 'admin' as 'admin' | 'agency' | 'user',
    agencyId: 0
  };

  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceNextNumber: '1',
    quotationPrefix: 'QTN',
    quotationNextNumber: '1',
    challanPrefix: 'DC',
    challanNextNumber: '1',
  });

  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(false);

  // Resolved agency ID — user.agencyId for agency/user roles, or first agency for system admin
  const [resolvedAgencyId, setResolvedAgencyId] = useState<number | null>(user?.agencyId || null);

  // Email theme color state
  const EMAIL_THEME_COLORS = ['#667eea', '#e53e3e', '#38a169', '#d69e2e', '#3182ce', '#805ad5'];
  const [emailThemeColor, setEmailThemeColor] = useState<string>('#667eea');
  const [emailThemeSaving, setEmailThemeSaving] = useState(false);

  // OTP State
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleInitiateChangePassword = async () => {
    setOtpLoading(true);
    try {
      await authAPI.sendOtp();
      setOtpVisible(true);
      setOtp('');
      Alert.alert('Security Verification', 'An OTP has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    try {
      await authAPI.verifyOtp(otp);
      setOtpVisible(false);
      setActiveSubView('change_password');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // For system admins without an agencyId, resolve by fetching the first available agency
  React.useEffect(() => {
    if (!resolvedAgencyId && user?.role === 'admin') {
      agenciesAPI.getAll().then((response: any) => {
        // Backend returns: { success: true, data: { agencies: [...], total: N } }
        const agencies: any[] = response?.data?.agencies || response?.agencies || [];
        const firstAgency = agencies[0];
        if (firstAgency?.id) {
          setResolvedAgencyId(firstAgency.id);
        }
      }).catch((err: any) => {
        console.warn('Could not resolve agency ID for admin:', err?.message);
      });
    }
  }, []);

  React.useEffect(() => {
    if (activeSubView === 'invoice_templates') {
      fetchInvoiceSettings();
    }
    if (activeSubView === 'email_branding') {
      fetchEmailThemeColor();
    }
  }, [activeSubView, resolvedAgencyId]);

  const fetchEmailThemeColor = async () => {
    if (!resolvedAgencyId) return;
    try {
      const response = await agenciesAPI.getSettings(resolvedAgencyId);
      if (response.success && response.data?.email_theme_color) {
        setEmailThemeColor(response.data.email_theme_color);
      }
    } catch (error) {
      console.error('Failed to fetch email theme color:', error);
    }
  };

  const handleSaveEmailThemeColor = async (color: string) => {
    if (!resolvedAgencyId) {
      Alert.alert('Error', 'Agency not found. Please refresh and try again.');
      return;
    }
    setEmailThemeSaving(true);
    try {
      await agenciesAPI.updateSettings(resolvedAgencyId, { email_theme_color: color });
      setEmailThemeColor(color);
      Alert.alert('Success', 'Email brand color saved!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save email theme color');
    } finally {
      setEmailThemeSaving(false);
    }
  };

  const fetchInvoiceSettings = async () => {
    if (!resolvedAgencyId) return;
    try {
      setLoading(true);
      const response = await agenciesAPI.getSettings(resolvedAgencyId);
      if (response.success && response.data) {
        setInvoiceSettings({
          invoicePrefix: response.data.invoice_prefix || 'INV',
          invoiceNextNumber: String(response.data.invoice_next_number || '1'),
          quotationPrefix: response.data.quotation_prefix || 'QTN',
          quotationNextNumber: String(response.data.quotation_next_number || '1'),
          challanPrefix: response.data.challan_prefix || 'DC',
          challanNextNumber: String(response.data.challan_next_number || '1'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoiceSettings = async () => {
    if (!resolvedAgencyId) {
      Alert.alert('Error', 'Agency not found. Please refresh and try again.');
      return;
    }
    setSaving(true);
    try {
      const settingsToSave = {
        invoice_prefix: invoiceSettings.invoicePrefix,
        invoice_next_number: invoiceSettings.invoiceNextNumber,
        quotation_prefix: invoiceSettings.quotationPrefix,
        quotation_next_number: invoiceSettings.quotationNextNumber,
        challan_prefix: invoiceSettings.challanPrefix,
        challan_next_number: invoiceSettings.challanNextNumber,
      };
      await agenciesAPI.updateSettings(resolvedAgencyId, settingsToSave);
      Alert.alert('Success', 'Templates and numbering settings saved successfully!');
      setActiveSubView(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const settingsOptions: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Account Settings',
      items: [
        { label: 'Edit Profile', icon: 'person', action: () => setActiveSubView('edit_profile') },
        { label: 'Change Password', icon: 'lock', action: handleInitiateChangePassword },
        { label: 'Subscription & Billing', icon: 'credit-card', action: () => navigation.navigate('SubscriptionManagement') },
        { label: 'Privacy Settings', icon: 'security', action: () => Alert.alert('Privacy', 'Privacy settings are managed by your administrator.') },
      ]
    },
    {
      title: 'App Preferences',
      items: [
        { label: 'Dark Mode', icon: 'brightness-6', toggle: isDarkMode, onToggle: toggleTheme },
        { label: 'Auto Backup', icon: 'backup', toggle: autoBackup, onToggle: setAutoBackup },
      ]
    },
    {
      title: 'Business Settings',
      items: [
        { label: 'Company Information', icon: 'business', action: () => setActiveTab('profile') },
        { label: 'Tax Settings', icon: 'receipt', action: () => setActiveTab('profile') },
        { label: 'Invoice Templates', icon: 'description', action: () => setActiveSubView('invoice_templates') },
        { label: 'Email Branding', icon: 'palette', action: () => setActiveSubView('email_branding') },
      ]
    }
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <OrganizationProfileScreen navigation={navigation} />;
      case 'agencies':
        return user.role === 'admin' ? (
          <AgencyManagementScreen navigation={navigation} />
        ) : null;
      case 'account':
        return activeSubView ? renderSubView() : renderAccountSettings();
      case 'settings':
        return activeSubView ? renderSubView() : renderAppSettings();
      default:
        return activeSubView ? renderSubView() : renderAppSettings();
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name || !profileData.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', profileData);
      if (response.data.success) {
        dispatch(updateUser(profileData));
        Alert.alert('Success', 'Profile updated successfully.');
        setActiveSubView(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.data.success) {
        Alert.alert('Success', 'Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setActiveSubView(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const renderSubView = () => {
    if (activeSubView === 'edit_profile') {
      return (
        <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubView(null)}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary.main} />
            <Text style={[styles.backText, { color: themeColors.primary.main }]}>Back to Account</Text>
          </TouchableOpacity>
          <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Edit Profile</Text>
            <TextInput
              label="Name"
              value={profileData.name}
              onChangeText={(text) => setProfileData({ ...profileData, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={profileData.email}
              onChangeText={(text) => setProfileData({ ...profileData, email: text })}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
            />
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Update Profile
            </Button>
          </View>
        </ScrollView>
      );
    }

    if (activeSubView === 'change_password') {
      return (
        <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubView(null)}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary.main} />
            <Text style={[styles.backText, { color: themeColors.primary.main }]}>Back to Account</Text>
          </TouchableOpacity>
          <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Change Password</Text>
            <TextInput
              label="Current Password"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="New Password"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Change Password
            </Button>
          </View>
        </ScrollView>
      );
    }

    if (activeSubView === 'invoice_templates') {
      return (
        <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubView(null)}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary.main} />
            <Text style={[styles.backText, { color: themeColors.primary.main }]}>Back to Settings</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={(isDarkMode ? themeColors.background.dark : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']) as any}
            style={styles.settingsSection}
          >
            <View style={styles.formPadding}>
              <Text style={[styles.sectionTitleHeader, { color: themeColors.text.primary }]}>Document Numbering</Text>
              <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>
                Configure prefixes and next available sequence numbers for your business documents.
              </Text>

              <View style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <MaterialIcons name="description" size={22} color={themeColors.primary.main} />
                  <Text style={[styles.templateTitle, { color: themeColors.text.primary }]}>Invoice Settings</Text>
                </View>
                <View style={styles.row}>
                  <TextInput
                    label="Prefix"
                    value={invoiceSettings.invoicePrefix}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: text })}
                    mode="outlined"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                  <TextInput
                    label="Next Number"
                    value={invoiceSettings.invoiceNextNumber}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, invoiceNextNumber: text })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                </View>
              </View>

              <View style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <MaterialIcons name="request-quote" size={22} color={themeColors.secondary.main} />
                  <Text style={[styles.templateTitle, { color: themeColors.text.primary }]}>Quotation Settings</Text>
                </View>
                <View style={styles.row}>
                  <TextInput
                    label="Prefix"
                    value={invoiceSettings.quotationPrefix}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, quotationPrefix: text })}
                    mode="outlined"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                  <TextInput
                    label="Next Number"
                    value={invoiceSettings.quotationNextNumber}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, quotationNextNumber: text })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                </View>
              </View>

              <View style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <MaterialIcons name="local-shipping" size={22} color={themeColors.success.main} />
                  <Text style={[styles.templateTitle, { color: themeColors.text.primary }]}>Delivery Challan Settings</Text>
                </View>
                <View style={styles.row}>
                  <TextInput
                    label="Prefix"
                    value={invoiceSettings.challanPrefix}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, challanPrefix: text })}
                    mode="outlined"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                  <TextInput
                    label="Next Number"
                    value={invoiceSettings.challanNextNumber}
                    onChangeText={(text) => setInvoiceSettings({ ...invoiceSettings, challanNextNumber: text })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF' }]}
                    outlineColor={themeColors.neutral[300]}
                    activeOutlineColor={themeColors.primary.main}
                    textColor={themeColors.text.primary}
                  />
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleSaveInvoiceSettings}
                loading={saving}
                disabled={saving || loading}
                style={styles.saveButton}
                buttonColor={themeColors.primary.main}
                contentStyle={styles.saveButtonContent}
              >
                Save All Settings
              </Button>
            </View>
          </LinearGradient>
        </ScrollView>
      );
    }

    if (activeSubView === 'email_branding') {
      return (
        <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveSubView(null)}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary.main} />
            <Text style={[styles.backText, { color: themeColors.primary.main }]}>Back to Settings</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={(isDarkMode ? themeColors.background.dark : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']) as any}
            style={styles.settingsSection}
          >
            <View style={styles.formPadding}>
              <Text style={[styles.sectionTitleHeader, { color: themeColors.text.primary }]}>Email Branding</Text>
              <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>
                Choose a brand color for your outgoing email templates.
              </Text>

              <View style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <MaterialIcons name="palette" size={22} color={themeColors.primary.main} />
                  <Text style={[styles.templateTitle, { color: themeColors.text.primary }]}>Theme Color</Text>
                </View>

                {/* Current color preview */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: emailThemeColor,
                      marginRight: 12,
                      borderWidth: 2,
                      borderColor: themeColors.neutral[300],
                    }}
                  />
                  <Text style={{ color: themeColors.text.secondary, fontSize: 14 }}>
                    Current: {emailThemeColor}
                  </Text>
                </View>

                {/* Color swatches */}
                {!resolvedAgencyId ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <ActivityIndicator size="small" color={themeColors.primary.main} />
                    <Text style={{ color: themeColors.text.secondary, fontSize: 13 }}>Loading agency settings...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {EMAIL_THEME_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleSaveEmailThemeColor(color)}
                        disabled={emailThemeSaving}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: color,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: emailThemeColor === color ? 3 : 1,
                          borderColor: emailThemeColor === color ? themeColors.text.primary : 'transparent',
                          opacity: emailThemeSaving ? 0.6 : 1,
                        }}
                      >
                        {emailThemeColor === color && (
                          <MaterialIcons name="check" size={24} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {emailThemeSaving && (
                  <Text style={{ color: themeColors.text.secondary, marginTop: 12, fontSize: 13 }}>
                    Saving...
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      );
    }

    return null;
  };

  const renderAccountSettings = () => (
    <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
      <LinearGradient
        colors={(isDarkMode ? themeColors.background.dark : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']) as any}
        style={styles.settingsSection}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Account Settings</Text>

        {settingsOptions[0].items.map((item, itemIndex) => (
          <View key={itemIndex}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={'action' in item ? item.action : undefined}
            >
              <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 60, 114, 0.1)' }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={themeColors.primary.main} />
                </View>
                <Text style={[styles.settingsItemText, { color: themeColors.text.primary }]}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={themeColors.neutral[400]} />
            </TouchableOpacity>
            {itemIndex < settingsOptions[0].items.length - 1 && <Divider style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />}
          </View>
        ))}
      </LinearGradient>
    </ScrollView>
  );

  const renderAppSettings = () => (
    <ScrollView style={[styles.tabContent, { backgroundColor: themeColors.background.main }]}>
      {settingsOptions.slice(1).map((section, sectionIndex) => (
        <LinearGradient
          key={sectionIndex}
          colors={(isDarkMode ? themeColors.background.dark : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']) as any}
          style={styles.settingsSection}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>{section.title}</Text>

          {section.items.map((item, itemIndex) => (
            <View key={itemIndex}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={'action' in item ? item.action : undefined}
                disabled={'toggle' in item}
              >
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(30, 60, 114, 0.1)' }]}>
                    <MaterialIcons name={item.icon as any} size={22} color={themeColors.primary.main} />
                  </View>
                  <Text style={[styles.settingsItemText, { color: themeColors.text.primary }]}>{item.label}</Text>
                </View>

                {'toggle' in item ? (
                  <Switch
                    value={item.toggle}
                    onValueChange={item.onToggle}
                    color={themeColors.primary.main}
                  />
                ) : (
                  <MaterialIcons name="chevron-right" size={24} color={themeColors.neutral[400]} />
                )}
              </TouchableOpacity>

              {itemIndex < section.items.length - 1 && <Divider style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />}
            </View>
          ))}
        </LinearGradient>
      ))}

      {/* Logout Section */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutSection}>
        <LinearGradient
          colors={baseColors.error.gradient as any}
          style={styles.logoutButton}
        >
          <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: themeColors.text.primary }]}>Erp System</Text>
        <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>Version 2.1.0</Text>
        <Text style={[styles.copyrightText, { color: themeColors.text.muted }]}>© 2026 Erp System</Text>
      </View>
    </ScrollView>
  );

  return (
    <MainLayout currentRoute="Settings" onNavigate={handleNavigate}>
      <View style={styles.container}>
        {/* Profile Section */}
        <LinearGradient
          colors={baseColors.primary.gradient as any}
          style={styles.profileSection}
        >
          <View style={styles.profileContent}>
            <LinearGradient
              colors={baseColors.secondary.gradient as any}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>{user.name?.charAt(0) || 'A'}</Text>
            </LinearGradient>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleContainer}>
                <MaterialIcons name="admin-panel-settings" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.userRole}>{user.role || 'User'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setActiveTab('account');
                setActiveSubView('edit_profile');
              }}
            >
              <MaterialIcons name="edit" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: themeColors.surface.primary, borderBottomColor: themeColors.neutral[200] }]}>
          <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && { backgroundColor: themeColors.primary.main + '15' }]}
              onPress={() => setActiveTab('profile')}
            >
              <MaterialIcons
                name="business"
                size={20}
                color={activeTab === 'profile' ? themeColors.primary.main : themeColors.text.secondary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'profile' ? themeColors.primary.main : themeColors.text.secondary }]}>
                Organization
              </Text>
            </TouchableOpacity>

            {user.role === 'admin' && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'agencies' && { backgroundColor: themeColors.primary.main + '15' }]}
                onPress={() => setActiveTab('agencies')}
              >
                <MaterialIcons
                  name="apartment"
                  size={20}
                  color={activeTab === 'agencies' ? themeColors.primary.main : themeColors.text.secondary}
                />
                <Text style={[styles.tabText, { color: activeTab === 'agencies' ? themeColors.primary.main : themeColors.text.secondary }]}>
                  Agencies
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.tab, activeTab === 'account' && { backgroundColor: themeColors.primary.main + '15' }]}
              onPress={() => {
                setActiveTab('account');
                setActiveSubView(null);
              }}
            >
              <MaterialIcons
                name="account-circle"
                size={20}
                color={activeTab === 'account' ? themeColors.primary.main : themeColors.text.secondary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'account' ? themeColors.primary.main : themeColors.text.secondary }]}>
                Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && { backgroundColor: themeColors.primary.main + '15' }]}
              onPress={() => setActiveTab('settings')}
            >
              <MaterialIcons
                name="settings"
                size={20}
                color={activeTab === 'settings' ? themeColors.primary.main : themeColors.text.secondary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'settings' ? themeColors.primary.main : themeColors.text.secondary }]}>
                Settings
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>


      <Portal>
        <Modal visible={otpVisible} onDismiss={() => setOtpVisible(false)} contentContainerStyle={{ backgroundColor: themeColors.background.main, padding: 20, margin: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: themeColors.text.primary, textAlign: 'center' }}>Security Verification</Text>
          <Text style={{ marginBottom: 20, color: themeColors.text.secondary, textAlign: 'center' }}>
            Please enter the OTP sent to your email to access Change Password settings.
          </Text>

          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            style={{ marginBottom: 20, backgroundColor: themeColors.surface?.primary || '#FFFFFF' }}
          />

          <Button
            mode="contained"
            onPress={handleVerifyOtp}
            loading={otpLoading}
            disabled={otpLoading}
            style={{ marginBottom: 10 }}
          >
            Verify & Proceed
          </Button>
          <Button onPress={() => setOtpVisible(false)} disabled={otpLoading}>
            Cancel
          </Button>
        </Modal>
      </Portal>
    </MainLayout >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    padding: 20,
    paddingTop: 0,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
  },
  saveButtonContent: {
    height: 56,
  },
  formPadding: {
    padding: 24,
  },
  sectionTitleHeader: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
    opacity: 0.8,
  },
  templateCard: {
    marginBottom: 24,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  tabContent: {
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileSection: {
    margin: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSection: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 20,
    paddingBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginHorizontal: 20,
  },
  logoutSection: {
    margin: 16,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
  },
});
