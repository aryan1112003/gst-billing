import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { expensesAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { EmailExpenseDialog } from '../../components/Expense/EmailExpenseDialog';
import { useTheme } from '../../contexts/ThemeContext';
import { RootState } from '../../store/store';
import { useResponsive } from '../../utils/responsive';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  receipt: boolean;
}

export const ExpensesScreen: React.FC = ({ navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });
  const [emailDialogVisible, setEmailDialogVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Get logged-in user's email from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const senderEmail = currentUser?.email || '';

  useEffect(() => {
    fetchExpenses();
  }, [pagination.currentPage, searchQuery]);

  // Refresh when screen comes into focus (after edit/create)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExpenses();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      console.log('Expenses API response:', response);

      // Map backend data to frontend format
      const mappedExpenses = (response.data || []).map((e: any) => ({
        id: String(e.id),
        description: e.description || e.notes || 'No description',
        category: e.category || 'Other',
        amount: e.amount || 0,
        date: e.expense_date || '',
        status: 'Approved', // Default status
        receipt: !!e.invoice_no
      }));

      setExpenses(mappedExpenses);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch expenses:', err);
      Alert.alert('Error', err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const mockExpenses: Expense[] = [
    {
      id: '1',
      description: 'Office Rent - January',
      category: 'Rent',
      amount: 25000,
      date: '2025-01-15',
      status: 'Approved',
      receipt: true
    },
    {
      id: '2',
      description: 'Internet & Phone Bills',
      category: 'Utilities',
      amount: 3500,
      date: '2025-01-14',
      status: 'Approved',
      receipt: true
    },
    {
      id: '3',
      description: 'Client Meeting Lunch',
      category: 'Travel & Entertainment',
      amount: 1200,
      date: '2025-01-13',
      status: 'Pending',
      receipt: false
    },
    {
      id: '4',
      description: 'Software Licenses',
      category: 'Software',
      amount: 15000,
      date: '2025-01-12',
      status: 'Approved',
      receipt: true
    },
  ];

  const columns: TableColumn<Expense>[] = [
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        isMobile ? (
          <Text style={{
            color: getCategoryColor(value as string),
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
              backgroundColor: getCategoryColor(value as string),
              borderColor: getCategoryColor(value as string),
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
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₹${value.toLocaleString()}`,
    },
    {
      key: 'receipt',
      label: 'Receipt',
      sortable: false,
      render: (value) => (
        isMobile ? (
          <Text style={{
            color: value ? colors.success.main : colors.warning.main,
            fontWeight: '700',
            fontSize: 12,
          }}>
            {value ? 'Yes' : 'No'}
          </Text>
        ) : (
          <Chip
            mode="outlined"
            compact
            style={{
              backgroundColor: value ? colors.success.main : colors.warning.main,
              borderColor: value ? colors.success.main : colors.warning.main,
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
            {value ? 'Yes' : 'No'}
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Rent': return colors.primary.main;
      case 'Utilities': return colors.secondary.main;
      case 'Travel & Entertainment': return colors.accent.main;
      case 'Software': return colors.warning.main;
      default: return colors.neutral[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return colors.success.main;
      case 'Pending': return colors.warning.main;
      case 'Rejected': return colors.error.main;
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

  const handleRowAction = async (action: string, expense: Expense) => {
    if (action === 'edit') {
      navigation.navigate('ExpenseForm', { expenseId: expense.id });
    } else if (action === 'delete') {
      confirmDelete(expense.description, async () => {
        try {
          setLoading(true);
          await expensesAPI.delete(expense.id);
          await fetchExpenses();
          showDeleteSuccess('Expense');
        } catch (err: any) {
          console.error('Failed to delete expense:', err);
          showDeleteError(err.message || 'Unknown error', 'expense');
        } finally {
          setLoading(false);
        }
      }, 'Expense');
    } else if (action === 'email') {
      setSelectedExpense(expense);
      setEmailDialogVisible(true);
    } else if (action === 'download') {
      handleDownloadPDF(expense);
    }
  };

  const handleDownloadPDF = async (expense: Expense) => {
    try {
      setLoading(true);
      console.log('📄 Downloading PDF for expense:', expense.id);

      const blob = await expensesAPI.downloadPDF(expense.id);
      console.log('✅ PDF blob received, size:', blob.size);

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-${expense.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Alert.alert('Success', `Expense report downloaded successfully!`);
      } else {
        Alert.alert('Success', 'PDF download started');
      }
    } catch (err: any) {
      console.error('❌ PDF download error:', err);
      Alert.alert(
        'Download Failed',
        err.message || 'Failed to download PDF. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (data: { to: string[]; cc?: string[]; subject: string; message: string }) => {
    if (!selectedExpense) return;

    try {
      setEmailLoading(true);
      console.log('📧 Sending expense email...', {
        expenseId: selectedExpense.id,
        to: data.to
      });

      await expensesAPI.emailExpense(selectedExpense.id, data);

      console.log('✅ Email sent successfully');
      Alert.alert(
        'Email Sent!',
        `Expense report has been sent to ${data.to.join(', ')}`
      );

      setEmailDialogVisible(false);
      setSelectedExpense(null);
    } catch (err: any) {
      console.error('❌ Email send error:', err);

      let errorMessage = 'Failed to send email. ';
      if (err.message?.includes('SMTP') || err.message?.includes('not configured')) {
        errorMessage += 'Email service is not configured. Please contact your administrator.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }

      Alert.alert('Email Failed', errorMessage);
    } finally {
      setEmailLoading(false);
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
    <MainLayout currentRoute="Expenses" onNavigate={handleNavigate}>
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
                  placeholder="Search expenses..."
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
                onPress={() => navigation.navigate('ExpenseForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Desktop layout: Title + Add button
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Expenses</Text>
              <TouchableOpacity
                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                onPress={() => navigation.navigate('ExpenseForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>Add Expense</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <EnhancedTable
          data={expenses.map(exp => ({
            ...exp,
            date: new Date(exp.date).toLocaleDateString(),
            category: typeof exp.category === 'number' ?
              (exp.category === 1 ? 'Rent' :
                exp.category === 2 ? 'Utilities' :
                  exp.category === 3 ? 'Travel' :
                    exp.category === 4 ? 'Software' : 'Other') :
              (exp.category === '1' ? 'Rent' :
                exp.category === '2' ? 'Utilities' :
                  exp.category === '3' ? 'Travel' :
                    exp.category === '4' ? 'Software' : exp.category)
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

        <EmailExpenseDialog
          visible={emailDialogVisible}
          onDismiss={() => {
            setEmailDialogVisible(false);
            setSelectedExpense(null);
          }}
          onSend={handleSendEmail}
          expenseDescription={selectedExpense?.description || ''}
          recipientEmail={''}
          senderEmail={senderEmail}
          loading={emailLoading}
        />
      </View>
    </MainLayout>
  );
};

