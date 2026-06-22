import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { EnhancedCustomer, TableColumn, PaginationState } from '../../types';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { customersAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';

export const CustomersScreen: React.FC = ({ navigation }: any) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const [customers, setCustomers] = useState<EnhancedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when screen comes into focus (after edit/create)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCustomers();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      const customerData = response.data || response.customers || [];
      setCustomers(customerData);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      Alert.alert('Error', err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'name',
      label: 'Customer Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'gstin',
      label: 'GSTIN Number',
      sortable: false,
      render: (value) => value || '-',
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowAction = async (action: string, customer: any) => {
    console.log('🎯 handleRowAction called:', { action, customerId: customer.id, customerName: customer.name });

    if (action === 'edit') {
      console.log('✏️ Navigating to edit form...');
      navigation.navigate('CustomerForm', { customerId: customer.id });
    } else if (action === 'delete') {
      console.log('🗑️ Delete action triggered for customer:', customer.id);

      confirmDelete(customer.name, async () => {
        try {
          console.log('🚀 Starting delete API call...');
          setLoading(true);
          await customersAPI.delete(String(customer.id));
          console.log('✅ Delete successful!');
          await fetchCustomers();
          showDeleteSuccess('Customer');
        } catch (err: any) {
          console.error('❌ Failed to delete customer:', err);
          showDeleteError(err.message || 'Unknown error', 'customer');
        } finally {
          setLoading(false);
        }
      }, 'Customer');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
      padding: isMobile ? 0 : 24,
    },
    header: {
      marginBottom: 24,
    },
    // Mobile styles
    mobileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    searchWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 12,
      height: 48,
    },
    searchbar: {
      flex: 1,
      backgroundColor: 'transparent',
      elevation: 0,
      height: 48,
    },
    searchInput: {
      fontSize: 14,
      marginLeft: -8,
    },
    addButton: {
      // Container for gradient
    },
    addButtonGradient: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    // Desktop styles
    desktopHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
      marginTop: 2,
      opacity: 0.7,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    searchWrapperDesktop: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderRadius: 12,
      height: 48,
      width: 300,
    },
    searchbarDesktop: {
      flex: 1,
      backgroundColor: 'transparent',
      elevation: 0,
      height: 48,
    },
    searchInputDesktop: {
      fontSize: 14,
      marginLeft: -8,
    },
    addButtonDesktop: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 10,
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    addButtonTextDesktop: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Customers" onNavigate={handleNavigate}>
      <View style={s.container}>
        <View style={s.header}>
          {isMobile ? (
            <View style={s.mobileHeader}>
              <View style={[s.searchWrapper, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="search" size={18} color={themeColors.text.muted} />
                <Searchbar
                  placeholder="Search customers..."
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={s.searchbar}
                  inputStyle={[s.searchInput, { color: themeColors.text.primary }]}
                  iconColor="transparent"
                  placeholderTextColor={themeColors.text.muted}
                />
              </View>
              <TouchableOpacity
                style={s.addButton}
                onPress={() => navigation.navigate('CustomerForm')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={themeColors.primary.gradient as [string, string]}
                  style={s.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="add" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.desktopHeader}>
              <View style={s.titleSection}>
                <Text style={[s.title, { color: themeColors.text.primary }]}>Customers</Text>
                <Text style={[s.subtitle, { color: themeColors.text.muted }]}>Manage your customer relationships</Text>
              </View>
              <View style={s.headerActions}>
                <View style={[s.searchWrapperDesktop, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <MaterialIcons name="search" size={20} color={themeColors.text.muted} />
                  <Searchbar
                    placeholder="Search customers..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={s.searchbarDesktop}
                    inputStyle={[s.searchInputDesktop, { color: themeColors.text.primary }]}
                    iconColor="transparent"
                    placeholderTextColor={themeColors.text.muted}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CustomerForm')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={themeColors.primary.gradient as [string, string]}
                    style={s.addButtonDesktop}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={s.addButtonTextDesktop}>Add Customer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <EnhancedTable
          data={customers}
          columns={columns}
          loading={loading}
          pagination={pagination}
          searchable={false}
          onPageChange={handlePageChange}
          onRowAction={handleRowAction}
          actions={['edit', 'delete']}
        />
      </View>
    </MainLayout>
  );
};

