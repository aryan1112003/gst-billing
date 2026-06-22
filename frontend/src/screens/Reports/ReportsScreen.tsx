import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch, RootState } from '../../store/store';
import { fetchQuickStats } from '../../store/slices/reportSlice';
import { useResponsive } from '../../utils/responsive';

interface ReportItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route?: string;
}

interface ReportCategory {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  reports: ReportItem[];
}

export const ReportsScreen: React.FC = ({ navigation }: any) => {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const dispatch = useDispatch<AppDispatch>();
  const { quickStats, loading, error } = useSelector((state: RootState) => state.reports);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchQuickStats());
  }, [dispatch]);

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const reportCategories: ReportCategory[] = [
    {
      id: 'sales',
      title: 'Sales',
      icon: 'trending-up',
      color: colors.success.main,
      reports: [
        { id: 'sales-by-customer', title: 'Sales by Customer', icon: 'person' },
        { id: 'sales-by-item', title: 'Sales by Item', icon: 'inventory-2' },
        { id: 'sales-by-salesperson', title: 'Sales by Sales Person', icon: 'badge' },
      ],
    },
    {
      id: 'receivables',
      title: 'Receivables',
      icon: 'account-balance-wallet',
      color: colors.primary.main,
      reports: [
        { id: 'customer-balances', title: 'Customer Balances', icon: 'account-balance' },
        { id: 'aging-summary', title: 'Aging Summary', icon: 'schedule' },
        { id: 'aging-details', title: 'Aging Details', icon: 'list-alt' },
        { id: 'invoice-details', title: 'Invoice Details', icon: 'description' },
      ],
    },
    {
      id: 'payments-received',
      title: 'Payments Received',
      icon: 'payment',
      color: colors.secondary.main,
      reports: [
        { id: 'payments-received', title: 'Payments Received', icon: 'receipt' },
        { id: 'withholding-tax', title: 'Withholding Tax', icon: 'account-balance' },
      ],
    },
    {
      id: 'purchases-expenses',
      title: 'Purchases and Expenses',
      icon: 'shopping-cart',
      color: colors.warning.main,
      reports: [
        { id: 'expense-details', title: 'Expense Details', icon: 'receipt-long' },
        { id: 'expenses-by-category', title: 'Expenses by Category', icon: 'category' },
        { id: 'expenses-by-customer', title: 'Expenses by Customer', icon: 'person-outline' },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: 'inventory',
      color: colors.accent.main,
      reports: [
        { id: 'inventory-summary', title: 'Inventory Summary', icon: 'summarize' },
        { id: 'inventory-valuation', title: 'Inventory Valuation Summary', icon: 'attach-money' },
        { id: 'stock-summary', title: 'Stock Summary', icon: 'storage' },
        { id: 'product-sales', title: 'Product Sales Report', icon: 'shopping-bag' },
      ],
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      icon: 'account-balance',
      color: '#1976D2',
      reports: [
        { id: 'profit-loss', title: 'Profit and Loss', icon: 'trending-up' },
        { id: 'balance-sheet', title: 'Balance Sheet', icon: 'account-balance' },
        { id: 'cash-flow', title: 'Cash Flow Statement', icon: 'water-drop' },
        { id: 'trial-balance', title: 'Trial Balance', icon: 'balance' },
      ],
    },
    {
      id: 'tax',
      title: 'Tax Reports',
      icon: 'receipt-long',
      color: colors.error.main,
      reports: [
        { id: 'gst-summary', title: 'GST Summary', icon: 'summarize' },
        { id: 'gstr1', title: 'GSTR-1', icon: 'description' },
        { id: 'gstr2', title: 'GSTR-2', icon: 'description' },
        { id: 'gstr3b', title: 'GSTR-3B', icon: 'description' },
        { id: 'tax-summary', title: 'Tax Summary', icon: 'account-balance' },
      ],
    },
    {
      id: 'vendor',
      title: 'Vendor Reports',
      icon: 'business',
      color: '#FF6F00',
      reports: [
        { id: 'vendor-balances', title: 'Vendor Balances', icon: 'account-balance' },
        { id: 'vendor-credits', title: 'Vendor Credits', icon: 'credit-card' },
        { id: 'purchase-by-vendor', title: 'Purchase by Vendor', icon: 'shopping-cart' },
        { id: 'vendor-payments', title: 'Vendor Payments', icon: 'payment' },
      ],
    },
  ];

  const handleReportClick = (reportId: string, reportTitle: string, categoryColor: string) => {
    console.log('Opening report:', reportId);
    navigation.navigate('ReportDetail', {
      reportId,
      reportTitle,
      categoryColor
    });
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
          <Text style={[styles.title, { color: themeColors.text.primary }]}>Reports</Text>
          <Text style={[styles.breadcrumb, { color: themeColors.text.secondary }]}>📊 / Reports</Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.main} />
            <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Loading reports...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: themeColors.surface.primary }]}>
            <MaterialIcons name="error-outline" size={48} color={themeColors.error.main} />
            <Text style={[styles.errorText, { color: themeColors.error.main }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: themeColors.primary.main }]}
              onPress={() => dispatch(fetchQuickStats())}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Report Categories */}
        {!loading && !error && (
          <View style={[styles.categoriesContainer, { flexWrap: 'wrap' as any, flexDirection: 'row' as any }]}>
            {reportCategories.map((category) => (
              <View key={category.id} style={[
                styles.categoryCard,
                { width: rs('100%', '48.5%', '31.5%') as any },
                {
                  backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  borderWidth: isDarkMode ? 1 : 0
                }
              ]}>
                {/* Category Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                      <MaterialIcons name={category.icon} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.categoryTitle, { color: themeColors.text.primary }]}>{category.title}</Text>
                  </View>
                  <MaterialIcons
                    name={expandedCategory === category.id ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={themeColors.text.secondary}
                  />
                </TouchableOpacity>

                {/* Category Reports */}
                {expandedCategory === category.id && (
                  <View style={[styles.reportsListContainer, { borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F0F0F0' }]}>
                    {category.reports.map((report) => (
                      <TouchableOpacity
                        key={report.id}
                        style={[styles.reportItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#F8F8F8' }]}
                        onPress={() => handleReportClick(report.id, report.title, category.color)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.reportItemLeft}>
                          <MaterialIcons
                            name={report.icon}
                            size={20}
                            color={category.color}
                            style={styles.reportIcon}
                          />
                          <Text style={[styles.reportTitle, { color: themeColors.text.primary }]}>{report.title}</Text>
                        </View>
                        <MaterialIcons
                          name="chevron-right"
                          size={20}
                          color={themeColors.text.muted}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Quick Stats Summary */}
        {!loading && !error && (
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryTitle, { color: themeColors.text.primary }]}>Quick Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Total Sales</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>{formatCurrency(quickStats.totalSales)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Total Expenses</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>{formatCurrency(quickStats.totalExpenses)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Net Profit</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: quickStats.netProfit >= 0 ? themeColors.success.main : themeColors.error.main }
                ]}>
                  {formatCurrency(quickStats.netProfit)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF' }]}>
                <Text style={[styles.summaryLabel, { color: themeColors.text.secondary }]}>Outstanding</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text.primary }]}>{formatCurrency(quickStats.outstanding)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
  },
  // NOTE: categoriesContainer flexWrap/flexDirection set inline via responsive hook
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 14,
    color: colors.text.secondary,
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
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    padding: 16,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reportsListContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  reportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  summaryContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
