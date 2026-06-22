import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, DataTable, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { colors } from '../../theme/colors';
import { RootState } from '../../store/store';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

interface Agency {
  id: number;
  companyName: string;
  databaseName: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionPlan: string;
  createdAt: string;
}

interface AgencyManagementScreenProps {
  navigation?: any;
}

export const AgencyManagementScreen: React.FC<AgencyManagementScreenProps> = ({ navigation }) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create agency form
  const [newAgency, setNewAgency] = useState({
    companyName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    gstNumber: '',
    panNumber: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAgencies();
    }
  }, []);

  const loadAgencies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/agencies');
      if (response.data.success) {
        setAgencies(response.data.data.agencies);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      Alert.alert('Error', 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    if (!newAgency.companyName || !newAgency.email || !newAgency.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/agencies', newAgency);
      if (response.data.success) {
        Alert.alert('Success', 'Agency created successfully with dedicated database!');
        setShowCreateForm(false);
        setNewAgency({
          companyName: '',
          email: '',
          password: '',
          phone: '',
          address: '',
          gstNumber: '',
          panNumber: '',
        });
        loadAgencies();
      }
    } catch (error: any) {
      console.error('Error creating agency:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create agency');
    } finally {
      setCreating(false);
    }
  };

  const handleChangeStatus = async (agencyId: number, newStatus: string) => {
    try {
      const response = await api.patch(`/agencies/${agencyId}/status`, { status: newStatus });
      if (response.data.success) {
        Alert.alert('Success', `Agency status updated to ${newStatus}`);
        loadAgencies();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success.main;
      case 'inactive': return colors.neutral[400];
      case 'suspended': return colors.error.main;
      default: return colors.neutral[400];
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="block" size={64} color={colors.error.main} />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Only system administrators can manage agencies</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={colors.primary.gradient as any}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Agency Management</Text>
              <Text style={styles.headerSubtitle}>
                {agencies.length} {agencies.length === 1 ? 'Agency' : 'Agencies'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <MaterialIcons 
                name={showCreateForm ? "close" : "add"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Create Agency Form */}
        {showCreateForm && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Create New Agency</Text>
            <Text style={styles.cardSubtitle}>
              A new database will be created automatically with all tables
            </Text>

            <TextInput
              label="Company Name *"
              value={newAgency.companyName}
              onChangeText={(text) => setNewAgency({ ...newAgency, companyName: text })}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary.main}
            />

            <TextInput
              label="Email *"
              value={newAgency.email}
              onChangeText={(text) => setNewAgency({ ...newAgency, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary.main}
            />

            <TextInput
              label="Password *"
              value={newAgency.password}
              onChangeText={(text) => setNewAgency({ ...newAgency, password: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary.main}
            />

            <TextInput
              label="Phone"
              value={newAgency.phone}
              onChangeText={(text) => setNewAgency({ ...newAgency, phone: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary.main}
            />

            <TextInput
              label="GST Number"
              value={newAgency.gstNumber}
              onChangeText={(text) => setNewAgency({ ...newAgency, gstNumber: text })}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.neutral[300]}
              activeOutlineColor={colors.primary.main}
            />

            <Button
              mode="contained"
              onPress={handleCreateAgency}
              loading={creating}
              disabled={creating}
              style={styles.submitButton}
              buttonColor={colors.primary.main}
            >
              {creating ? 'Creating Agency & Database...' : 'Create Agency'}
            </Button>
          </LinearGradient>
        )}

        {/* Agencies List */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>All Agencies</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
          ) : agencies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="business" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No agencies yet</Text>
              <Text style={styles.emptySubtext}>Create your first agency to get started</Text>
            </View>
          ) : (
            agencies.map((agency) => (
              <View key={agency.id} style={styles.agencyCard}>
                <View style={styles.agencyHeader}>
                  <View style={styles.agencyInfo}>
                    <Text style={styles.agencyName}>{agency.companyName}</Text>
                    <Text style={styles.agencyEmail}>{agency.email}</Text>
                    <Text style={styles.agencyDatabase}>
                      <MaterialIcons name="storage" size={14} color={colors.text.muted} />
                      {' '}{agency.databaseName}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: getStatusColor(agency.status) + '20' }]}
                    textStyle={{ color: getStatusColor(agency.status), fontSize: 12, fontWeight: '600' }}
                  >
                    {agency.status.toUpperCase()}
                  </Chip>
                </View>

                <View style={styles.agencyDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="phone" size={16} color={colors.text.muted} />
                    <Text style={styles.detailText}>{agency.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="card-membership" size={16} color={colors.text.muted} />
                    <Text style={styles.detailText}>{agency.subscriptionPlan}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="calendar-today" size={16} color={colors.text.muted} />
                    <Text style={styles.detailText}>
                      {new Date(agency.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.agencyActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => navigation.navigate('AgencyDetails', { agencyId: agency.id })}
                  >
                    <MaterialIcons name="visibility" size={18} color={colors.primary.main} />
                    <Text style={[styles.actionButtonText, { color: colors.primary.main }]}>View</Text>
                  </TouchableOpacity>

                  {agency.status === 'active' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleChangeStatus(agency.id, 'suspended')}
                    >
                      <MaterialIcons name="pause" size={18} color={colors.warning.main} />
                      <Text style={[styles.actionButtonText, { color: colors.warning.main }]}>Suspend</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.activateButton]}
                      onPress={() => handleChangeStatus(agency.id, 'active')}
                    >
                      <MaterialIcons name="play-arrow" size={18} color={colors.success.main} />
                      <Text style={[styles.actionButtonText, { color: colors.success.main }]}>Activate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </LinearGradient>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  agencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  agencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  agencyEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  agencyDatabase: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  statusChip: {
    height: 28,
  },
  agencyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  agencyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  suspendButton: {
    borderColor: colors.warning.main,
    backgroundColor: colors.warning.main + '10',
  },
  activateButton: {
    borderColor: colors.success.main,
    backgroundColor: colors.success.main + '10',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
