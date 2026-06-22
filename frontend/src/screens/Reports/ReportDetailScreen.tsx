import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Text, ActivityIndicator, DataTable } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

interface ReportDetailScreenProps {
  navigation: any;
  route: {
    params: {
      reportId: string;
      reportTitle: string;
      categoryColor: string;
    };
  };
}

export const ReportDetailScreen = ({ navigation, route }: any) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { reportId, reportTitle, categoryColor } = route.params;
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'dateRange' | 'month' | 'year'>('dateRange');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [reportId]);

  const fetchReportData = async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        queryParams = params.toString() ? `?${params.toString()}` : '';
      }

      // Map report IDs to API endpoints
      const endpoint = `/reports/${reportId}${queryParams}`;
      const response = await api.get(endpoint) as any;

      console.log('Report Response:', response);

      // Extract data from response structure
      // Backend returns: { success: true, data: { report: {...} } }
      // api.get returns: { data: { success: true, data: { report: {...} } } }
      let reportContent = response;

      if (response.data) {
        // If it's the wrapped structure from api.get
        const innerResponse = response.data;
        if (innerResponse.data && innerResponse.data.report) {
          reportContent = innerResponse.data.report;
        } else if (innerResponse.data) {
          reportContent = innerResponse.data;
        } else {
          reportContent = innerResponse.report || innerResponse;
        }
      }

      const reportData = reportContent;

      // Handle different response formats
      if (reportData.rows) {
        // Query result format: { rows: [...], rowCount: n }
        setReportData({
          data: reportData.rows,
          columns: reportData.rows.length > 0 ? Object.keys(reportData.rows[0]) : []
        });
      } else if (Array.isArray(reportData)) {
        // Direct array format
        setReportData({
          data: reportData,
          columns: reportData.length > 0 ? Object.keys(reportData[0]) : []
        });
      } else {
        // Other formats (summary, etc.)
        setReportData(reportData);
      }
    } catch (err: any) {
      console.error('Failed to fetch report:', err);
      setError(err.message || 'Failed to load report data');
      Alert.alert('Error', err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    let filters: any = {};

    if (filterType === 'dateRange') {
      if (!fromDate || !toDate) {
        Alert.alert('Error', 'Please enter both from and to dates');
        return;
      }
      filters = { fromDate, toDate };
    } else if (filterType === 'month') {
      if (!selectedMonth) {
        Alert.alert('Error', 'Please enter a month (YYYY-MM)');
        return;
      }
      // Convert month to date range
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      filters = { fromDate: firstDay, toDate: lastDayStr };
    } else if (filterType === 'year') {
      if (!selectedYear) {
        Alert.alert('Error', 'Please enter a year (YYYY)');
        return;
      }
      filters = { fromDate: `${selectedYear}-01-01`, toDate: `${selectedYear}-12-31` };
    }

    setActiveFilters(filters);
    setShowFilterModal(false);
    fetchReportData(filters);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setActiveFilters(null);
    setShowFilterModal(false);
    fetchReportData();
  };

  const setCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
  };

  const setCurrentYear = () => {
    const year = new Date().getFullYear().toString();
    setSelectedYear(year);
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      // Build query parameters for export
      let queryParams = '';
      if (activeFilters) {
        const params = new URLSearchParams();
        Object.entries(activeFilters).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });
        queryParams = params.toString() ? `?${params.toString()}` : '';
      }

      // Create export URL
      const exportUrl = `/reports/export/${format}/${reportId}${queryParams}`;

      // For web, we can use window.open or create a download link
      // For mobile, we might need to use a different approach
      const response = await api.get(exportUrl, {
        responseType: 'blob', // Important for file downloads
      }) as Blob;

      // Create download link
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle.replace(/\s+/g, '_')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Alert.alert('Success', `${format.toUpperCase()} export completed successfully!`);
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', error.message || `Failed to export ${format.toUpperCase()}`);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    // Handle different report types
    if (Array.isArray(reportData.data)) {
      return (
        <DataTable style={[
          styles.table,
          {
            backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }
        ]}>
          <DataTable.Header style={{ borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0' }}>
            {reportData.columns?.map((column: string, index: number) => (
              <DataTable.Title key={index} textStyle={{ color: themeColors.text.primary }}>{column}</DataTable.Title>
            ))}
          </DataTable.Header>

          {reportData.data.map((row: any, rowIndex: number) => (
            <DataTable.Row key={rowIndex} style={{ borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f8f8' }}>
              {Object.values(row).map((value: any, colIndex: number) => (
                <DataTable.Cell key={colIndex}>
                  <Text style={{ color: themeColors.text.primary }}>
                    {typeof value === 'number' && reportData.columns[colIndex]?.toLowerCase().includes('amount')
                      ? formatCurrency(value)
                      : String(value)}
                  </Text>
                </DataTable.Cell>
              ))}
            </DataTable.Row>
          ))}
        </DataTable>
      );
    }

    // Handle summary reports
    if (reportData.summary) {
      return (
        <View style={[styles.summaryContainer, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
          {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
            <View key={key} style={[styles.summaryItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F0F0F0' }]}>
              <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
              <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>
                {typeof value === 'number' ? formatCurrency(value) : String(value)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
        <MaterialIcons name="info-outline" size={48} color={themeColors.text.muted} />
        <Text style={[styles.emptyText, { color: themeColors.text.muted }]}>No data available for this report</Text>
      </View>
    );
  };

  return (
    <MainLayout currentRoute="Reports" onNavigate={handleNavigate}>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.background.main }]}>
        {/* Header */}
        <View style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
            borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: themeColors.text.primary }]}>{reportTitle}</Text>
            <Text style={[styles.breadcrumb, { color: themeColors.text.secondary }]}>📊 / Reports / {reportTitle}</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: categoryColor }]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="filter-list" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: categoryColor, marginLeft: 8 }]}
            onPress={() => fetchReportData(activeFilters)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#FF6B35', marginLeft: 8 }]}
            onPress={() => handleExport('pdf')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#28A745', marginLeft: 8 }]}
            onPress={() => handleExport('excel')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="table-chart" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {activeFilters && (
          <View style={[
            styles.filterSummary,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 249, 230, 0.05)' : '#FFF9E6',
              borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E0E0E0'
            }
          ]}>
            <MaterialIcons name="filter-list" size={16} color={themeColors.text.secondary} />
            <Text style={[styles.filterSummaryText, { color: themeColors.text.secondary }]}>
              Filtered: {activeFilters.fromDate} to {activeFilters.toDate}
            </Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <MaterialIcons name="close" size={18} color={themeColors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={categoryColor} />
            <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Loading report data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.errorContainer, { backgroundColor: themeColors.surface.primary }]}>
            <MaterialIcons name="error-outline" size={48} color={themeColors.error.main} />
            <Text style={[styles.errorText, { color: themeColors.error.main }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: categoryColor }]}
              onPress={fetchReportData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Report Content */}
        {!loading && !error && reportData && (
          <View style={styles.contentContainer}>
            {renderReportContent()}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface.primary, width: rs('90%', 500, 500) as any }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text.primary }]}>Filter Report</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Filter Type Tabs */}
            <View style={[styles.filterTabs, { backgroundColor: isDarkMode ? themeColors.background.main : '#F5F7FA' }]}>
              <TouchableOpacity
                style={[styles.filterTab, filterType === 'dateRange' && [styles.filterTabActive, { backgroundColor: isDarkMode ? themeColors.surface.elevated : '#FFFFFF' }]]}
                onPress={() => setFilterType('dateRange')}
              >
                <Text style={[styles.filterTabText, { color: themeColors.text.secondary }, filterType === 'dateRange' && [styles.filterTabTextActive, { color: themeColors.text.primary }]]}>
                  Date Range
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterType === 'month' && [styles.filterTabActive, { backgroundColor: isDarkMode ? themeColors.surface.elevated : '#FFFFFF' }]]}
                onPress={() => setFilterType('month')}
              >
                <Text style={[styles.filterTabText, { color: themeColors.text.secondary }, filterType === 'month' && [styles.filterTabTextActive, { color: themeColors.text.primary }]]}>
                  Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterType === 'year' && [styles.filterTabActive, { backgroundColor: isDarkMode ? themeColors.surface.elevated : '#FFFFFF' }]]}
                onPress={() => setFilterType('year')}
              >
                <Text style={[styles.filterTabText, { color: themeColors.text.secondary }, filterType === 'year' && [styles.filterTabTextActive, { color: themeColors.text.primary }]]}>
                  Year
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Inputs */}
            <View style={styles.filterInputs}>
              {filterType === 'dateRange' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.text.primary }]}>From Date</Text>
                    <TextInput
                      style={[styles.input, {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
                        backgroundColor: isDarkMode ? themeColors.background.main : '#FFFFFF',
                        color: themeColors.text.primary
                      }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={themeColors.text.muted}
                      value={fromDate}
                      onChangeText={setFromDate}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.text.primary }]}>To Date</Text>
                    <TextInput
                      style={[styles.input, {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
                        backgroundColor: isDarkMode ? themeColors.background.main : '#FFFFFF',
                        color: themeColors.text.primary
                      }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={themeColors.text.muted}
                      value={toDate}
                      onChangeText={setToDate}
                    />
                  </View>
                </>
              )}

              {filterType === 'month' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.text.primary }]}>Month</Text>
                  <TextInput
                    style={[styles.input, {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
                      backgroundColor: isDarkMode ? themeColors.background.main : '#FFFFFF',
                      color: themeColors.text.primary
                    }]}
                    placeholder="YYYY-MM"
                    placeholderTextColor={themeColors.text.muted}
                    value={selectedMonth}
                    onChangeText={setSelectedMonth}
                  />
                  <TouchableOpacity
                    style={[styles.quickButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F5F7FA' }]}
                    onPress={setCurrentMonth}
                  >
                    <Text style={[styles.quickButtonText, { color: themeColors.primary.main }]}>Current Month</Text>
                  </TouchableOpacity>
                </View>
              )}

              {filterType === 'year' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.text.primary }]}>Year</Text>
                  <TextInput
                    style={[styles.input, {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0',
                      backgroundColor: isDarkMode ? themeColors.background.main : '#FFFFFF',
                      color: themeColors.text.primary
                    }]}
                    placeholder="YYYY"
                    placeholderTextColor={themeColors.text.muted}
                    value={selectedYear}
                    onChangeText={setSelectedYear}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.quickButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F5F7FA' }]}
                    onPress={setCurrentYear}
                  >
                    <Text style={[styles.quickButtonText, { color: themeColors.primary.main }]}>Current Year</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.clearButton, { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0' }]}
                onPress={handleClearFilters}
              >
                <Text style={[styles.clearButtonText, { color: themeColors.text.secondary }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: categoryColor }]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  filterSummaryText: {
    flex: 1,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    maxWidth: 500,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.text.primary,
  },
  filterInputs: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  quickButton: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    borderRadius: 12,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
  },
  table: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
