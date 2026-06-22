import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { EnhancedItem, TableColumn, PaginationState } from '../../types';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { itemsAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { useResponsive } from '../../utils/responsive';

export const InventoryScreen: React.FC = ({ navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { colors: themeColors, isDarkMode } = useTheme();
  const [items, setItems] = useState<EnhancedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });

  useEffect(() => {
    fetchItems();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when screen comes into focus (after edit/create)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchItems();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchItems = async () => {
    try {
      console.log('📦 Fetching items...');
      setLoading(true);

      const response = await itemsAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('📦 Items API Response:', response);
      console.log('📦 Response.data:', response.data);
      console.log('📦 Response.items:', response.items);

      const rawItems = response.data || response.items || [];
      console.log('📦 Raw items:', rawItems);
      console.log('📦 Items count:', rawItems.length);

      // Map backend data to frontend format
      const mappedItems: EnhancedItem[] = rawItems.map((item: any) => ({
        id: String(item.id),
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || 'PCS',
        unitPrice: parseFloat(item.purchase_price || item.selling_price || 0),
        sellingPrice: parseFloat(item.selling_price || 0),
        currentStock: parseInt(item.current_stock || 0),
        reorderLevel: parseInt(item.min_stock_level || 0),
        itemType: 'goods' as const,
        taxPreference: 'taxable' as const,
        intraStateTaxRate: 18,
        interStateTaxRate: 18,
        isActive: true,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));

      console.log('📦 Mapped items:', mappedItems);
      setItems(mappedItems);

      if (response.pagination) {
        console.log('📦 Pagination:', response.pagination);
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch items:', err);
      Alert.alert('Error', err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<EnhancedItem>[] = [
    {
      key: 'name',
      label: 'Item',
      sortable: true,
    },
    {
      key: 'itemType',
      label: 'Item Type',
      sortable: true,
      render: (value) => (
        isMobile ? (
          <Text style={{
            color: themeColors.primary.main,
            fontWeight: '700',
            fontSize: 12,
          }}>
            {value === 'goods' ? 'Goods' : 'Service'}
          </Text>
        ) : (
          <Chip
            mode="outlined"
            compact
            style={{
              height: 32,
              minHeight: 32,
            }}
            textStyle={{
              fontSize: 12,
              lineHeight: 16,
              fontWeight: '600',
            }}
          >
            {value === 'goods' ? 'Goods' : 'Service'}
          </Chip>
        )
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: false,
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      sortable: true,
      render: (value) => `₹${value.toLocaleString()}`,
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowAction = async (action: string, item: EnhancedItem) => {
    console.log('🎯 handleRowAction called:', { action, itemId: item.id, itemName: item.name });

    if (action === 'edit') {
      console.log('✏️ Navigating to edit form...');
      navigation.navigate('ItemForm', { itemId: item.id });
    } else if (action === 'delete') {
      console.log('🗑️ Delete action triggered for item:', item.id);

      confirmDelete(item.name, async () => {
        try {
          console.log('🚀 Starting delete API call...');
          setLoading(true);
          await itemsAPI.delete(item.id);
          console.log('✅ Delete successful!');
          await fetchItems();
          showDeleteSuccess('Item');
        } catch (err: any) {
          console.error('❌ Failed to delete item:', err);
          showDeleteError(err.message || 'Unknown error', 'item');
        } finally {
          setLoading(false);
        }
      }, 'Item');
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
      borderColor: baseColors.neutral[100],
      gap: isMobile ? 6 : 0,
    },
    searchContainer: {
      flex: 1,
    },
    searchbar: {
      backgroundColor: baseColors.neutral[50],
      borderRadius: 4,
      elevation: 0,
      height: 28,
    },
    searchInput: {
      fontSize: 12,
      color: baseColors.text.primary,
      minHeight: 0,
      paddingVertical: 0,
    },
    addButton: {
      backgroundColor: baseColors.primary.main,
      borderRadius: 4,
      elevation: 1,
      shadowColor: baseColors.primary.main,
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
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: baseColors.text.primary,
      flex: 1,
    },
    addButtonDesktop: {
      backgroundColor: baseColors.primary.main,
      borderRadius: 8,
      elevation: 2,
      shadowColor: baseColors.primary.main,
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
    tableContainer: {
      flex: 1,
      marginHorizontal: !isMobile ? 24 : 0,
      marginBottom: !isMobile ? 24 : 0,
    },
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Inventory" onNavigate={handleNavigate}>
      <View style={s.container}>
        <View style={[s.header, {
          backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : baseColors.neutral[100]
        }]}>
          {isMobile ? (
            // Mobile layout: Search + Add button
            <>
              <View style={s.searchContainer}>
                <Searchbar
                  placeholder="Search items..."
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={[s.searchbar, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}
                  inputStyle={[s.searchInput, { color: themeColors.text.primary }]}
                  iconColor={themeColors.text.muted}
                />
              </View>
              <TouchableOpacity
                style={[s.addButton, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('ItemForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Items</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('ItemForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>Add Item</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={s.tableContainer}>
          <EnhancedTable
            data={items}
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
      </View>
    </MainLayout>
  );
};

