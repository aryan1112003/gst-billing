import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../utils/responsive';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { purchasesAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { EmailPurchaseDialog } from '../../components/Purchase/EmailPurchaseDialog';
import { useTheme } from '../../contexts/ThemeContext';
import { RootState } from '../../store/store';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface Purchase {
  id: string;
  poNumber: string;
  vendor: string;
  vendorEmail?: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Received' | 'Partial' | 'Cancelled';
  items: number;
}

export const PurchasesScreen: React.FC = ({ navigation: navProp }: any) => {
  const navHook = useNavigation() as any;
  const navigation = navProp || navHook;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });
  const [emailDialogVisible, setEmailDialogVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Get logged-in user's email from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const senderEmail = currentUser?.email || '';

  useEffect(() => {
    fetchPurchases();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when coming back from form
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPurchases();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchasesAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('Purchases API response:', response);

      // Map backend data to frontend format
      const mappedPurchases = (response.data || []).map((p: any) => {
        let itemCount = 0;
        try { itemCount = JSON.parse(p.items_details || '[]').length; } catch {}
        return {
          id: String(p.id),
          poNumber: p.invoice_number || p.order_number || ('PO-' + String(p.id).padStart(4, '0')),
          vendor: p.vendor_name || p.vendor?.name || 'Unknown',
          vendorEmail: p.vendor_email || p.vendor?.email || '',
          amount: p.total_amount || 0,
          date: p.invoice_date || p.po_date || p.created_date,
          status: p.status === 'pending' ? 'Pending' :
            p.status === 'received' ? 'Received' :
              p.status === 'delivered' ? 'Received' :
                p.status === 'partial' ? 'Partial' : 'Cancelled',
          items: itemCount,
        };
      });

      setPurchases(mappedPurchases);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.pages || response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch purchases:', err);
      showError(err.message || 'Failed to load purchases');
      setPurchases([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const mockPurchases: Purchase[] = [
    {
      id: '1',
      poNumber: 'PO-001',
      vendor: 'Tech Supplies Ltd',
      amount: 45000,
      date: '2025-01-15',
      status: 'Received',
      items: 5
    },
    {
      id: '2',
      poNumber: 'PO-002',
      vendor: 'Office Solutions',
      amount: 28000,
      date: '2025-01-14',
      status: 'Pending',
      items: 3
    },
    {
      id: '3',
      poNumber: 'PO-003',
      vendor: 'IT Contractors Inc',
      amount: 65000,
      date: '2025-01-13',
      status: 'Partial',
      items: 8
    },
    {
      id: '4',
      poNumber: 'PO-004',
      vendor: 'Cleaning Services Pro',
      amount: 12000,
      date: '2025-01-12',
      status: 'Cancelled',
      items: 2
    },
  ];

  const columns: TableColumn<Purchase>[] = [
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₹${value.toLocaleString()}`,
    },
    {
      key: 'items',
      label: 'Items',
      sortable: false,
      render: (value) => `${value} items`,
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
            mode="flat"
            compact
            style={{
              backgroundColor: getStatusColor(value as string),
              borderColor: getStatusColor(value as string),
              height: 32,
              minHeight: 32,
              borderRadius: 16,
              paddingVertical: 6,
              paddingHorizontal: 8,
            }}
            textStyle={{
              color: '#FFFFFF',
              fontWeight: '700',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return '#10B981'; // Green
      case 'Pending': return '#F59E0B'; // Orange
      case 'Partial': return '#3B82F6'; // Blue
      case 'Cancelled': return '#EF4444'; // Red
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

  const handleRowAction = async (action: string, purchase: Purchase) => {
    if (action === 'edit') {
      console.log('🟢 Edit button clicked for purchase:', purchase.id);
      try {
        navigation.navigate('PurchaseForm', { purchaseId: purchase.id });
        console.log('✅ Navigation to PurchaseForm initiated');
      } catch (error) {
        console.error('❌ Navigation error:', error);
        showError('Failed to open purchase form');
      }
    } else if (action === 'delete') {
      confirmDelete(`purchase order ${purchase.poNumber}`, async () => {
        try {
          setLoading(true);
          console.log('Deleting purchase:', purchase.id);
          await purchasesAPI.delete(purchase.id);
          console.log('Purchase deleted successfully');
          await fetchPurchases();
          showDeleteSuccess('Purchase order');
        } catch (err: any) {
          console.error('Failed to delete purchase:', err);
          showDeleteError(err.message || 'Unknown error', 'purchase order');
        } finally {
          setLoading(false);
        }
      }, 'Purchase Order');
    } else if (action === 'email') {
      setSelectedPurchase(purchase);
      setEmailDialogVisible(true);
    } else if (action === 'download') {
      handleDownloadPDF(purchase);
    }
  };

  const handleDownloadPDF = async (purchase: Purchase) => {
    try {
      setLoading(true);
      console.log('📄 Downloading PDF for purchase:', purchase.id);

      const blob = await purchasesAPI.downloadPDF(purchase.id);
      console.log('✅ PDF blob received, size:', blob.size);

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase-order-${purchase.poNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showSuccess(`Purchase Order ${purchase.poNumber} downloaded successfully!`);
      } else {
        showSuccess('PDF download started');
      }
    } catch (err: any) {
      console.error('❌ PDF download error:', err);
      showAlert(
        'Download Failed',
        err.message || 'Failed to download PDF. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (data: { to: string[]; cc?: string[]; subject: string; message: string }) => {
    if (!selectedPurchase) return;

    try {
      setEmailLoading(true);
      console.log('📧 Sending purchase order email...', {
        purchaseId: selectedPurchase.id,
        to: data.to
      });

      await purchasesAPI.emailPurchase(selectedPurchase.id, data);

      console.log('✅ Email sent successfully');
      showAlert(
        'Email Sent!',
        `Purchase Order ${selectedPurchase.poNumber} has been sent to ${data.to.join(', ')}`
      );

      setEmailDialogVisible(false);
      setSelectedPurchase(null);
    } catch (err: any) {
      console.error('❌ Email send error:', err);

      let errorMessage = 'Failed to send email. ';
      if (err.message?.includes('SMTP') || err.message?.includes('not configured')) {
        errorMessage += 'Email service is not configured. Please contact your administrator.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }

      showAlert('Email Failed', errorMessage);
    } finally {
      setEmailLoading(false);
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
      padding: isMobile ? 12 : 16,
      backgroundColor: '#FFFFFF',
      borderRadius: isMobile ? 10 : 12,
      marginHorizontal: isMobile ? 16 : 24,
      marginTop: isMobile ? 8 : 24,
      marginBottom: isMobile ? 12 : 12,
      elevation: isMobile ? 2 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isMobile ? 2 : 2 },
      shadowOpacity: isMobile ? 0.08 : 0.1,
      shadowRadius: isMobile ? 3 : 4,
      borderWidth: 1,
      borderColor: colors.neutral[100],
      gap: isMobile ? 10 : 0,
    },
    // Mobile styles
    searchContainer: {
      flex: 1,
    },
    searchbar: {
      backgroundColor: colors.neutral[50],
      borderRadius: 8,
      elevation: 0,
      height: 38,
    },
    searchInput: {
      fontSize: 14,
      color: colors.text.primary,
      minHeight: 0,
      paddingVertical: 0,
    },
    addButton: {
      backgroundColor: colors.primary.main,
      borderRadius: 8,
      elevation: 2,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
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
    <MainLayout currentRoute="Purchases" onNavigate={handleNavigate}>
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
                  placeholder="Search purchases..."
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
                onPress={() => navigation.navigate('PurchaseForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Purchase Orders</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('PurchaseForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>New PO</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <EnhancedTable
          data={purchases.map(p => ({
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
          actions={['edit', 'email', 'download', 'delete']}
        />

        <EmailPurchaseDialog
          visible={emailDialogVisible}
          onDismiss={() => {
            setEmailDialogVisible(false);
            setSelectedPurchase(null);
          }}
          onSend={handleSendEmail}
          poNumber={selectedPurchase?.poNumber || ''}
          vendorEmail={selectedPurchase?.vendorEmail || ''}
          senderEmail={senderEmail}
          loading={emailLoading}
        />
      </View>
    </MainLayout>
  );
};

