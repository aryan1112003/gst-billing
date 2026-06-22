import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useResponsive } from '../../utils/responsive';
import { Text, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { invoicesAPI } from '../../services/api'; // Reusing invoicesAPI
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { EmailInvoiceDialog } from '../../components/Invoice/EmailInvoiceDialog';
import { RootState } from '../../store/store';

interface Quotation {
    id: string;
    number: string;
    customer: string;
    customerEmail?: string;
    amount: number;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Draft' | 'Expired'; // Adjusted statuses for Quotation
    date: string;
}

export const QuotationScreen: React.FC = ({ navigation }: any) => {
    const { colors: themeColors } = useTheme();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        totalPages: 1,
        totalEntries: 0,
        entriesPerPage: 10,
    });
    const [emailDialogVisible, setEmailDialogVisible] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    const currentUser = useSelector((state: RootState) => state.auth.user);
    const senderEmail = currentUser?.email || '';

    useEffect(() => {
        fetchQuotations();
    }, [pagination.currentPage, searchQuery]);

    // Refresh on focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchQuotations();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            // Pass type='quotation' to filter
            const response = await invoicesAPI.getAll({
                page: pagination.currentPage,
                limit: pagination.entriesPerPage,
                search: searchQuery,
                type: 'quotation'
            });

            console.log('📄 Quotations API Response:', response);

            const data = response.data?.invoices || response.invoices || response.data || [];

            const mappedData = data.map((item: any) => ({
                id: String(item.id),
                number: item.invoiceNumber || item.invoice_number || `QTN-${item.id}`,
                customer: item.customer?.name || item.customer_name || 'Unknown',
                customerEmail: item.customer?.email || item.customer_email || '',
                amount: item.totalAmount || item.total_amount || 0,
                status: item.status || 'Draft',
                date: item.issueDate || item.issue_date || new Date().toISOString().split('T')[0],
            }));

            setQuotations(mappedData);

            const paginationData = response.data?.pagination || response.pagination;
            if (paginationData) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: paginationData.pages || paginationData.totalPages || 1,
                    totalEntries: paginationData.total || 0,
                }));
            }
        } catch (err: any) {
            console.error('❌ Failed to fetch quotations:', err);
            showDeleteError(err.message || 'Failed to load quotations', 'quotation');
        } finally {
            setLoading(false);
        }
    };

    const columns: TableColumn<Quotation>[] = [
        {
            key: 'number',
            label: 'Quotation No',
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
                    <Text style={{ color: getStatusColor(value as string), fontWeight: '700', fontSize: 12 }}>
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
                        textStyle={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12, lineHeight: 16 }}
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
            case 'Accepted': return themeColors.success.main;
            case 'Pending': return themeColors.warning.main;
            case 'Rejected': return themeColors.error.main;
            case 'Expired': return baseColors.neutral[500];
            default: return themeColors.text.muted;
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const handleRowAction = async (action: string, item: Quotation) => {
        if (action === 'edit') {
            navigation.navigate('QuotationForm', { quotationId: item.id });
        } else if (action === 'delete') {
            confirmDelete(`Quotation #${item.number}`, async () => {
                try {
                    setLoading(true);
                    await invoicesAPI.delete(item.id);
                    await fetchQuotations();
                    showDeleteSuccess('Quotation');
                } catch (err: any) {
                    showDeleteError(err.message || 'Unknown error', 'quotation');
                } finally {
                    setLoading(false);
                }
            }, 'Quotation');
        } else if (action === 'email') {
            setSelectedQuotation(item);
            setEmailDialogVisible(true);
        } else if (action === 'download') {
            handleDownloadPDF(item);
        }
    };

    const handleDownloadPDF = async (item: Quotation) => {
        try {
            setLoading(true);
            const blob = await invoicesAPI.downloadPDF(item.id);
            if (Platform.OS === 'web') {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `quotation-${item.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                Alert.alert('Success', `Quotation ${item.number} downloaded successfully!`);
            } else {
                Alert.alert('Success', 'PDF download started');
            }
        } catch (err: any) {
            Alert.alert('Download Failed', err.message || 'Failed to download PDF.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (data: { to: string[]; cc?: string[]; subject: string; message: string }) => {
        if (!selectedQuotation) return;
        try {
            setEmailLoading(true);
            await invoicesAPI.emailInvoice(selectedQuotation.id, data);
            Alert.alert('Email Sent!', `Quotation ${selectedQuotation.number} has been sent.`);
            setEmailDialogVisible(false);
            setSelectedQuotation(null);
        } catch (err: any) {
            Alert.alert('Email Failed', err.message || 'Failed to send email.');
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
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? 6 : 16,
            borderRadius: isMobile ? 4 : 12,
            margin: isMobile ? 16 : 24,
            marginBottom: isMobile ? 2 : 8,
            elevation: isMobile ? 1 : 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: isMobile ? 1 : 2 },
            shadowOpacity: isMobile ? 0.03 : 0.1,
            shadowRadius: isMobile ? 1 : 4,
            borderWidth: 1,
            gap: isMobile ? 6 : 0,
        },
        searchContainer: {
            flex: 1,
        },
        searchbar: {
            borderRadius: 4,
            elevation: 0,
            height: 36,
        },
        searchInput: {
            fontSize: 12,
            minHeight: 0,
            paddingVertical: 0,
        },
        addButton: {
            borderRadius: 4,
            elevation: 1,
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
            flex: 1,
        },
        addButtonDesktop: {
            borderRadius: 8,
            elevation: 2,
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
        <MainLayout currentRoute="Quotation" onNavigate={handleNavigate}>
            <View style={[s.container, { backgroundColor: themeColors.background.main }]}>
                <View style={[s.header, {
                    backgroundColor: themeColors.surface.card,
                    borderColor: themeColors.neutral[200]
                }]}>
                    {isMobile ? (
                        <>
                            <View style={s.searchContainer}>
                                <Searchbar
                                    placeholder="Search quotations..."
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
                                onPress={() => navigation.navigate('QuotationForm')}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                                <Text style={s.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={[s.title, { color: themeColors.text.primary }]}>Quotations</Text>
                            <TouchableOpacity
                                style={[s.addButtonDesktop, { backgroundColor: themeColors.primary.main }]}
                                onPress={() => navigation.navigate('QuotationForm')}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                                <Text style={s.addButtonTextDesktop}>New Quotation</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <EnhancedTable
                    data={quotations.map(q => ({
                        ...q,
                        date: new Date(q.date).toLocaleDateString(),
                        status: typeof q.status === 'number' ? (q.status === 1 ? 'Draft' : String(q.status)) : q.status
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
                        setSelectedQuotation(null);
                    }}
                    onSend={handleSendEmail}
                    invoiceNumber={selectedQuotation?.number || ''}
                    customerEmail={selectedQuotation?.customerEmail || ''}
                    senderEmail={senderEmail}
                    loading={emailLoading}
                    title="Email Quotation"
                />
            </View>
        </MainLayout>
    );
};

