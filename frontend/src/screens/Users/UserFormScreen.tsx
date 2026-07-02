import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, TextInput, Button, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { usersAPI, agenciesAPI } from '../../services/api';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface UserFormData {
  email: string;
  username: string;
  password: string;
  role: 'admin' | 'agency' | 'user';
  is_active: boolean;
  companyName?: string;
  agencyId?: number;
}

export const UserFormScreen: React.FC = ({ navigation, route }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const userId = route?.params?.userId;
  const isEditMode = !!userId;

  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    password: '',
    role: 'user',
    is_active: true,
    companyName: '',
    agencyId: undefined,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await agenciesAPI.getAll();
      if (response.success) {
        setAgencies(response.data.agencies || []);
      }
    } catch (err) {
      console.error('Failed to fetch agencies:', err);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getById(userId);
      const user = response.data || response;

      setFormData({
        email: user.email || '',
        username: user.name || user.username || '',
        password: '', // Don't populate password for security
        role: user.role || (user.roleId === 1 ? 'admin' : user.roleId === 2 ? 'agency' : 'user'),
        is_active: user.is_active !== undefined ? !!user.is_active : true,
        agencyId: user.agency_id,
        companyName: '',
      });
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      showError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.email.trim()) {
      showAlert('Validation Error', 'Email is required');
      return;
    }

    if (!formData.username.trim()) {
      showAlert('Validation Error', 'Username is required');
      return;
    }

    if (!isEditMode && !formData.password) {
      showAlert('Validation Error', 'Password is required for new users');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'agency' && !isEditMode && !formData.companyName?.trim()) {
      showAlert('Validation Error', 'Company Name is required for Agency role');
      return;
    }

    try {
      setLoading(true);

      const roleMapping: Record<string, number> = {
        'admin': 1,
        'agency': 2,
        'user': 3,
      };

      const submitData: any = {
        email: formData.email.trim(),
        name: formData.username.trim(), // Backend expects 'name'
        roleId: roleMapping[formData.role] || 3,
        is_active: formData.is_active ? 1 : 0,
        agencyId: formData.agencyId,
      };

      if (formData.role === 'agency' && formData.companyName) {
        submitData.companyData = {
          companyName: formData.companyName.trim(),
          email: formData.email.trim(),
        };
      }

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (isEditMode) {
        await usersAPI.update(userId, submitData);
        showSuccess('User updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await usersAPI.create(submitData);
        showSuccess('User created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err: any) {
      console.error('Failed to save user:', err);
      showError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const s = useMemo(() => StyleSheet.create({
    contentContainer: {
      padding: isMobile ? 16 : 24,
    },
    title: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: '700' as const,
      color: colors.text.primary,
    },
    form: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: isMobile ? 16 : 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      maxWidth: rs(undefined, 800, 1100) as any,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
  }), [isMobile, isTablet]);

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <MainLayout currentRoute="Users" onNavigate={handleNavigate}>
      <ScrollView style={styles.container} contentContainerStyle={s.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.title}>{isEditMode ? 'Edit User' : 'Add New User'}</Text>
        </View>

        <View style={s.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                mode="outlined"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                mode="outlined"
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="johndoe"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password {isEditMode ? '(leave blank to keep current)' : '*'}
              </Text>
              <TextInput
                mode="outlined"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder={isEditMode ? 'Enter new password' : 'Enter password'}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary.main}
              />
              <Text style={styles.helperText}>Minimum 6 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <View style={styles.roleContainer}>
                {(['admin', 'agency', 'user'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === role && styles.roleButtonTextActive
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {formData.role === 'agency' && !isEditMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  mode="outlined"
                  value={formData.companyName}
                  onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                  placeholder="Enter Agency Company Name"
                  style={styles.input}
                  outlineColor={colors.neutral[300]}
                  activeOutlineColor={colors.primary.main}
                />
                <Text style={styles.helperText}>
                  This will create a new agency and a dedicated database.
                </Text>
              </View>
            )}

            {formData.role === 'user' && agencies.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign to Agency</Text>
                <View style={[styles.roleContainer, { marginTop: 4 }]}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      formData.agencyId === undefined && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, agencyId: undefined })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.agencyId === undefined && styles.roleButtonTextActive
                    ]}>None</Text>
                  </TouchableOpacity>
                  {agencies.map((agency) => (
                    <TouchableOpacity
                      key={agency.id}
                      style={[
                        styles.roleButton,
                        formData.agencyId === agency.id && styles.roleButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, agencyId: agency.id })}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.agencyId === agency.id && styles.roleButtonTextActive
                      ]}>
                        {agency.companyName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Active Status</Text>
                  <Text style={styles.helperText}>
                    {formData.is_active ? 'User can login' : 'User cannot login'}
                  </Text>
                </View>
                <Switch
                  value={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                  color={colors.primary.main}
                />
              </View>
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
              {isEditMode ? 'Update User' : 'Create User'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
