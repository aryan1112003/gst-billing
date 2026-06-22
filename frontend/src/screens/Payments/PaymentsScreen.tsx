import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { paymentsAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { useResponsive } from '../../utils/responsive';

interface Payment {
  id: string;
  customer: string;
  amount: number;
  date: string;
  method: 'Cash' | 'Bank Transfer' | 'Check' | 'UPI' | 'Credit Card';
  reference: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export const PaymentsScreen: React.FC = ({ navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });

  useEffect(() => {
    fetchPayments();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when screen comes into focus (after edit/create)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPayments();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('Payments API response:', response);

      // Map backend data to frontend format
      const mappedPayments = (response.data || []).map((p: any) => ({
        id: String(p.id),
        customer: p.customer_name || 'Unknown Customer',
        amount: p.amount || 0,
        date: p.payment_date || '',
        method: formatPaymentMethod(p.payment_method),
        reference: p.reference_number || '',
        status: 'Completed' // Default status since backend doesn't have it yet
      }));

      setPayments(mappedPayments);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      Alert.alert('Error', err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const formatPaymentMethod = (method: string): 'Cash' | 'Bank Transfer' | 'Check' | 'UPI' | 'Credit Card' => {
    const methodMap: { [key: string]: 'Cash' | 'Bank Transfer' | 'Check' | 'UPI' | 'Credit Card' } = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'upi': 'UPI',
      'credit_card': 'Credit Card'
    };
    return methodMap[method] || 'Cash';
  };

  const mockPayments: Payment[] = [
    {
      id: '1',
      customer: 'ABC Corporation',
      amount: 25000,
      date: '2025-01-15',
      method: 'Bank Transfer',
      reference: 'TXN123456',
      status: 'Completed'
    },
    {
      id: '2',
      customer: 'XYZ Enterprises',
      amount: 15000,
      date: '2025-01-14',
      method: 'UPI',
      reference: 'UPI789012',
      status: 'Completed'
    },
    {
      id: '3',
      customer: 'Tech Solutions',
      amount: 8500,
      date: '2025-01-13',
      method: 'Check',
      reference: 'CHK345678',
      status: 'Pending'
    },
    {
      id: '4',
      customer: 'Digital Agency',
      amount: 12000,
      date: '2025-01-12',
      method: 'Cash',
      reference: 'CASH001',
      status: 'Completed'
    },
  ];

  const columns: TableColumn<Payment>[] = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₹${value.toLocaleString()}`,
    },
    {
      key: 'method',
      label: 'Payment Method',
      sortable: false,
      render: (value) => (
        isMobile ? (
          <Text style={{
            color: getMethodColor(value as string),
            fontWeight: '700',
            fontSize: 12,
          }}>
            {value}
          </Text>
        ) : (
          <Chip
            mode="outlined"
            compact
            style={{
              backgroundColor: getMethodColor(value as string),
              borderColor: getMethodColor(value as string),
              height: 32,
              minHeight: 32,
            }}
            textStyle={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: 12,
              lineHeight: 16,
            }}
          >
            {value}
          </Chip>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (value) => (
        isMobile ? (
          <Text style={{
            color: getStatusColor(value as string),
            fontWeight: '700',
            fontSize: 12,
          }}>
            {value}
          </Text>
        ) : (
          <Chip
            mode="outlined"
            compact
            style={{
              backgroundColor: getStatusColor(value as string),
              borderColor: getStatusColor(value as string),
              height: 32,
              minHeight: 32,
            }}
            textStyle={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: 12,
              lineHeight: 16,
            }}
          >
            {value}
          </Chip>
        )
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'Bank Transfer': return colors.primary.main;
      case 'UPI': return colors.secondary.main;
      case 'Check': return colors.warning.main;
      case 'Cash': return colors.success.main;
      case 'Credit Card': return colors.accent.main;
      default: return colors.neutral[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return colors.success.main;
      case 'Pending': return colors.warning.main;
      case 'Failed': return colors.error.main;
      default: return colors.neutral[500];
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowAction = async (action: string, payment: Payment) => {
    if (action === 'edit') {
      navigation.navigate('PaymentForm', { paymentId: payment.id });
    } else if (action === 'delete') {
      confirmDelete(`Payment from ${payment.customer}`, async () => {
        try {
          setLoading(true);
          await paymentsAPI.delete(payment.id);
          await fetchPayments();
          showDeleteSuccess('Payment');
        } catch (err: any) {
          console.error('Failed to delete payment:', err);
          showDeleteError(err.message || 'Unknown error', 'payment');
        } finally {
          setLoading(false);
        }
      }, 'Payment');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const { colors: themeColors } = useTheme();

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
    <MainLayout currentRoute="Payments" onNavigate={handleNavigate}>
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
                  placeholder="Search payments..."
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
                onPress={() => navigation.navigate('PaymentForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Payments</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('PaymentForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>Record Payment</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <EnhancedTable
          data={payments.map(p => ({
            ...p,
            date: new Date(p.date).toLocaleDateString()
          })) as any}
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

