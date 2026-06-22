import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { vendorsAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { useResponsive } from '../../utils/responsive';

interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    gstin?: string;
    created_at?: string;
    updated_at?: string;
}

export const SupplierScreen: React.FC = ({ navigation }: any) => {
    const { isMobile, isTablet } = useResponsive();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalEntries: 0,
        entriesPerPage: 10,
    });

    useEffect(() => {
        fetchSuppliers();
    }, [pagination.currentPage, searchQuery]);

    // Refresh when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchSuppliers();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            // Reusing vendors API as Suppliers are essentially vendors in this context
            const response = await vendorsAPI.getAll({
                page: pagination.currentPage,
                limit: pagination.entriesPerPage,
                search: searchQuery
            });

            const suppliersData = response.data || response.vendors || [];
            const mappedSuppliers = suppliersData.map((supplier: any) => ({
                id: String(supplier.id),
                name: supplier.name || 'Unknown',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                gstin: supplier.gstin || '',
                created_at: supplier.created_at,
                updated_at: supplier.updated_at,
            }));

            setSuppliers(mappedSuppliers);

            if (response.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.pagination.totalPages || 1,
                    totalEntries: response.pagination.total || 0,
                }));
            }
        } catch (err: any) {
            console.error('❌ Failed to fetch suppliers:', err);
            Alert.alert('Error', err.message || 'Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const columns: TableColumn<Supplier>[] = [
        {
            key: 'name',
            label: 'Supplier Name',
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

    const handleRowAction = async (action: string, supplier: Supplier) => {
        if (action === 'edit') {
            // Navigate to VendorForm but with perspective of Supplier - reusing form for now
            navigation.navigate('VendorForm', { vendorId: supplier.id, isSupplier: true });
        } else if (action === 'delete') {
            confirmDelete(supplier.name, async () => {
                try {
                    setLoading(true);
                    await vendorsAPI.delete(supplier.id);
                    await fetchSuppliers();
                    showDeleteSuccess('Supplier');
                } catch (err: any) {
                    showDeleteError(err.message || 'Unknown error', 'supplier');
                } finally {
                    setLoading(false);
                }
            }, 'Supplier');
        }
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    const s = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        header: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
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
        searchContainer: { flex: 1 },
        searchbar: { backgroundColor: colors.neutral[50], borderRadius: 4, elevation: 0, height: 28 },
        searchInput: { fontSize: 12, color: colors.text.primary, minHeight: 0, paddingVertical: 0 },
        addButton: {
            backgroundColor: colors.primary.main, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
            flexDirection: 'row' as const, alignItems: 'center' as const, gap: 2,
        },
        addButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' as const },
        title: { fontSize: 24, fontWeight: '700' as const, color: colors.text.primary, flex: 1 },
        addButtonDesktop: {
            backgroundColor: colors.primary.main, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
            flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
        },
        addButtonTextDesktop: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' as const },
    }), [isMobile]);

    return (
        <MainLayout currentRoute="Supplier" onNavigate={handleNavigate}>
            <View style={s.container}>
                <View style={s.header}>
                    {isMobile ? (
                        <>
                            <View style={s.searchContainer}>
                                <Searchbar
                                    placeholder="Search suppliers..."
                                    onChangeText={handleSearch}
                                    value={searchQuery}
                                    style={s.searchbar}
                                    inputStyle={s.searchInput}
                                    iconColor={colors.text.secondary}
                                />
                            </View>
                            <TouchableOpacity
                                style={s.addButton}
                                onPress={() => navigation.navigate('VendorForm')}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                                <Text style={s.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={s.title}>Suppliers</Text>
                            <TouchableOpacity
                                style={s.addButtonDesktop}
                                onPress={() => navigation.navigate('VendorForm')}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                                <Text style={s.addButtonTextDesktop}>Add Supplier</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <EnhancedTable
                    data={suppliers}
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

