import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, Chip, Searchbar, IconButton, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { invoicesAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { EmailInvoiceDialog } from '../../components/Invoice/EmailInvoiceDialog';
// import { InvoiceStats } from '../../components/Invoice/InvoiceStats';
import { RootState } from '../../store/store';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface Invoice {
  id: string;
  number: string;
  customer: string;
  customerEmail?: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  date: string;
}

export const InvoicesScreen: React.FC = ({ navigation }: any) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });
  const [emailDialogVisible, setEmailDialogVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  // const [showStats, setShowStats] = useState(true);

  // Get logged-in user's email from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const senderEmail = currentUser?.email || '';

  useEffect(() => {
    fetchInvoices();
  }, [pagination.currentPage, searchQuery]);

  // Refresh list when navigating back from create/edit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('📄 Invoices API Response:', response);

      // Backend returns: { success: true, data: { invoices: [...], pagination: {...} } }
      const invoicesData = response.data?.invoices || response.invoices || response.data || [];

      // Map backend format to frontend format
      const mappedInvoices = invoicesData.map((inv: any) => ({
        id: String(inv.id),
        number: inv.invoiceNumber || inv.invoice_number || `INV-${inv.id}`,
        customer: inv.customer?.name || inv.customer_name || 'Unknown',
        customerEmail: inv.customer?.email || inv.customer_email || '',
        amount: inv.totalAmount || inv.total_amount || 0,
        status: inv.status || 'Draft',
        date: inv.issueDate || inv.issue_date || new Date().toISOString().split('T')[0],
      }));

      console.log('📄 Mapped invoices:', mappedInvoices);
      setInvoices(mappedInvoices);

      // Handle pagination from nested data structure
      const paginationData = response.data?.pagination || response.pagination;
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          totalPages: paginationData.pages || paginationData.totalPages || 1,
          totalEntries: paginationData.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch invoices:', err);
      console.error('Error details:', err.response?.data || err.message);
      showDeleteError(err.message || 'Failed to load invoices', 'invoices');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'number',
      label: 'Invoice Number',
      sortable: true,
    },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return themeColors.success.main;
      case 'Pending': return themeColors.warning.main;
      case 'Overdue': return themeColors.error.main;
      case 'Draft': return themeColors.text.muted;
      default: return themeColors.text.muted;
    }
  };

  // const calculateStats = () => {
  //   const stats = {
  //     draft: { count: 0, amount: 0 },
  //     pending: { count: 0, amount: 0 },
  //     paid: { count: 0, amount: 0 },
  //     overdue: { count: 0, amount: 0 },
  //     partiallyPaid: { count: 0, amount: 0 },
  //   };

  //   invoices.forEach((invoice) => {
  //     const status = invoice.status.toLowerCase();
  //     const amount = invoice.amount || 0;

  //     if (status === 'draft') {
  //       stats.draft.count++;
  //       stats.draft.amount += amount;
  //     } else if (status === 'pending' || status === 'sent') {
  //       stats.pending.count++;
  //       stats.pending.amount += amount;
  //     } else if (status === 'paid') {
  //       stats.paid.count++;
  //       stats.paid.amount += amount;
  //     } else if (status === 'overdue') {
  //       stats.overdue.count++;
  //       stats.overdue.amount += amount;
  //     } else if (status === 'partially paid' || status === 'partial') {
  //       stats.partiallyPaid.count++;
  //       stats.partiallyPaid.amount += amount;
  //     }
  //   });

  //   return stats;
  // };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowAction = async (action: string, invoice: Invoice) => {
    if (action === 'edit') {
      navigation.navigate('InvoiceForm', { invoiceId: invoice.id });
    } else if (action === 'delete') {
      confirmDelete(`Invoice #${invoice.number}`, async () => {
        try {
          setLoading(true);
          await invoicesAPI.delete(invoice.id);
          await fetchInvoices();
          showDeleteSuccess('Invoice');
        } catch (err: any) {
          console.error('Failed to delete invoice:', err);
          showDeleteError(err.message || 'Unknown error', 'invoice');
        } finally {
          setLoading(false);
        }
      }, 'Invoice');
    } else if (action === 'email') {
      setSelectedInvoice(invoice);
      setEmailDialogVisible(true);
    } else if (action === 'download') {
      handleDownloadPDF(invoice);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setLoading(true);
      console.log('📄 Downloading PDF for invoice:', invoice.id);

      const blob = await invoicesAPI.downloadPDF(invoice.id);
      console.log('✅ PDF blob received, size:', blob.size);

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showSuccess(`Invoice ${invoice.number} downloaded successfully!`);
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
    if (!selectedInvoice) return;

    try {
      setEmailLoading(true);
      console.log('📧 Sending invoice email...', {
        invoiceId: selectedInvoice.id,
        to: data.to
      });

      await invoicesAPI.emailInvoice(selectedInvoice.id, data);

      console.log('✅ Email sent successfully');
      showAlert(
        'Email Sent!',
        `Invoice ${selectedInvoice.number} has been sent to ${data.to.join(', ')}`
      );

      setEmailDialogVisible(false);
      setSelectedInvoice(null);
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
    // Mobile styles
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
    // Desktop styles
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
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Invoices" onNavigate={handleNavigate}>
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
                  placeholder="Search invoices..."
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
                onPress={() => navigation.navigate('InvoiceForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Invoices</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('InvoiceForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>New Invoice</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Statistics Dashboard - Temporarily Disabled */}
        {/* {showStats && invoices.length > 0 && (
          <InvoiceStats stats={calculateStats()} />
        )} */}

        {/* Toggle Stats Button - Temporarily Disabled */}
        {/* {invoices.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowStats(!showStats)}
            style={s.toggleStatsButton}
          >
            <MaterialIcons 
              name={showStats ? 'expand-less' : 'expand-more'} 
              size={20} 
              color={baseColors.primary.main} 
            />
            <Text style={s.toggleStatsText}>
              {showStats ? 'Hide Statistics' : 'Show Statistics'}
            </Text>
          </TouchableOpacity>
        )} */}

        <EnhancedTable
          data={invoices.map(inv => ({
            ...inv,
            date: new Date(inv.date).toLocaleDateString(),
            status: (() => {
              const statusMap: Record<number, string> = { 1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue', 5: 'Cancelled' };
              return typeof inv.status === 'number' ? (statusMap[inv.status] || String(inv.status)) : inv.status;
            })()
          })) as any}
          columns={columns}
          loading={loading}
          pagination={pagination}
          searchable={true}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onRowAction={handleRowAction}
          actions={['edit', 'delete', 'email', 'download']}
        />

        <EmailInvoiceDialog
          visible={emailDialogVisible}
          onDismiss={() => {
            setEmailDialogVisible(false);
            setSelectedInvoice(null);
          }}
          onSend={handleSendEmail}
          invoiceNumber={selectedInvoice?.number || ''}
          customerEmail={selectedInvoice?.customerEmail || ''}
          senderEmail={senderEmail}
          loading={emailLoading}
        />
      </View>
    </MainLayout>
  );
};

