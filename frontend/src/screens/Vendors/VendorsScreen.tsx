import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { vendorsAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  created_at?: string;
  updated_at?: string;
}

export const VendorsScreen: React.FC = ({ navigation }: any) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });

  useEffect(() => {
    fetchVendors();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when screen comes into focus (after edit/create)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVendors();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorsAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('🏢 Vendors API Response:', response);

      // Map backend data to frontend format
      const vendorsData = response.data || response.vendors || [];
      const mappedVendors = vendorsData.map((vendor: any) => ({
        id: String(vendor.id),
        name: vendor.name || 'Unknown',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        gstin: vendor.gstin || '',
        created_at: vendor.created_at,
        updated_at: vendor.updated_at,
      }));

      console.log('🏢 Mapped vendors:', mappedVendors);
      setVendors(mappedVendors);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch vendors:', err);
      console.error('Error details:', err.response?.data || err.message);
      showError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<Vendor>[] = [
    {
      key: 'name',
      label: 'Vendor Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      render: (value) => value || '-',
    },
    {
      key: 'gstin',
      label: 'GSTIN',
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

  const handleRowAction = async (action: string, vendor: Vendor) => {
    if (action === 'edit') {
      navigation.navigate('VendorForm', { vendorId: vendor.id });
    } else if (action === 'delete') {
      confirmDelete(vendor.name, async () => {
        try {
          setLoading(true);
          await vendorsAPI.delete(vendor.id);
          await fetchVendors();
          showDeleteSuccess('Vendor');
        } catch (err: any) {
          console.error('Failed to delete vendor:', err);
          showDeleteError(err.message || 'Unknown error', 'vendor');
        } finally {
          setLoading(false);
        }
      }, 'Vendor');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const { colors: themeColors } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();

  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? 6 : 16,
      backgroundColor: '#FFFFFF',
      borderRadius: isMobile ? 4 : 12,
      margin: isMobile ? 16 : 24,
      marginBottom: isMobile ? 2 : 8,
      elevation: isMobile ? 1 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isMobile ? 1 : 2 },
      shadowOpacity: isMobile ? 0.03 : 0.1,
      shadowRadius: isMobile ? 1 : 4,
      borderWidth: 1,
      borderColor: colors.neutral[100],
      gap: isMobile ? 6 : 0,
    },
    // Mobile styles
    searchContainer: {
      flex: 1,
    },
    searchbar: {
      backgroundColor: colors.neutral[50],
      borderRadius: 4,
      elevation: 0,
      height: 28,
    },
    searchInput: {
      fontSize: 12,
      color: colors.text.primary,
      minHeight: 0,
      paddingVertical: 0,
    },
    addButton: {
      backgroundColor: colors.primary.main,
      borderRadius: 4,
      elevation: 1,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    // Desktop styles
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
    },
    addButtonDesktop: {
      backgroundColor: colors.primary.main,
      borderRadius: 8,
      elevation: 2,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    addButtonTextDesktop: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Vendors" onNavigate={handleNavigate}>
      <View style={[s.container, { backgroundColor: themeColors.background.main }]}>
        <View style={[s.header, {
          backgroundColor: themeColors.surface.card,
          borderColor: themeColors.neutral[200]
        }]}>
          {isMobile ? (
            // Mobile layout: Search + Add button
            <>
              <View style={s.searchContainer}>
                <Searchbar
                  placeholder="Search vendors..."
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={[s.searchbar, { backgroundColor: themeColors.background.main }]}
                  inputStyle={[s.searchInput, { color: themeColors.text.primary }]}
                  iconColor={themeColors.text.muted}
                  placeholderTextColor={themeColors.text.muted}
                />
              </View>
              <TouchableOpacity
                style={[s.addButton, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('VendorForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Vendors</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('VendorForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>Add Vendor</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <EnhancedTable
          data={vendors}
          columns={columns}
          loading={loading}
          pagination={pagination}
          searchable={true}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onRowAction={handleRowAction}
          actions={['edit', 'delete']}
        />
      </View>
    </MainLayout>
  );
};

