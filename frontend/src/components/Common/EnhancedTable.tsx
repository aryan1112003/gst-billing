import { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  DataTable,
  Searchbar,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { EnhancedTableProps } from '../../types';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';

interface ExtendedEnhancedTableProps<T> extends EnhancedTableProps<T> {
  actions?: string[];
}

export function EnhancedTable<T extends { id: string }>({
  data,
  columns,
  loading,
  pagination,
  searchable = true,
  onSearch,
  onPageChange,
  onRowAction,
  actions = ['edit', 'delete'],
}: ExtendedEnhancedTableProps<T>) {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  // Cards on phones, table on tablet+
  const showCards = isMobile;

  // Minimum column width so columns don't get too squeezed
  const MIN_COL_WIDTH = 130;
  const ACTIONS_WIDTH = actions.length > 2 ? 160 : actions.length > 1 ? 130 : 100;

  // Calculate whether table needs horizontal scrolling
  const tableMinWidth = useMemo(() => {
    return columns.length * MIN_COL_WIDTH + ACTIONS_WIDTH + 32;
  }, [columns.length]);

  // Cap how wide a single column can stretch so cells don't balloon with empty space,
  // while the table itself still fills the full available width
  const COL_MAX_WIDTH = 320;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
  };

  const toggleMenu = (rowId: string) => {
    setMenuVisible(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const handleRowAction = (action: string, row: T) => {
    setMenuVisible(prev => ({ ...prev, [row.id]: false }));
    onRowAction(action, row);
  };

  const renderPagination = () => {
    const maxVisiblePages = isMobile ? 3 : isTablet ? 4 : 5;
    const visiblePages: number[] = [];
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(pagination.totalPages, start + maxVisiblePages - 1);
    if (end - start + 1 < maxVisiblePages) start = Math.max(1, end - maxVisiblePages + 1);
    for (let i = start; i <= end; i++) visiblePages.push(i);

    const btnSize = isMobile ? 36 : 40;
    const btnRadius = isMobile ? 10 : 12;

    return (
      <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile]}>
        {!isMobile && pagination.totalEntries > 0 && (
          <Text style={[styles.paginationInfo, { color: themeColors.text.muted }]}>
            {`${((pagination.currentPage - 1) * pagination.entriesPerPage) + 1}–${Math.min(
              pagination.currentPage * pagination.entriesPerPage,
              pagination.totalEntries
            )} of ${pagination.totalEntries}`}
          </Text>
        )}
        <View style={styles.paginationControls}>
          <TouchableOpacity
            onPress={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            style={[pagination.currentPage === 1 && styles.disabledButton]}
          >
            <LinearGradient
              colors={(pagination.currentPage === 1
                ? [themeColors.neutral[200], themeColors.neutral[300]]
                : themeColors.primary.gradient) as any}
              style={[styles.paginationButtonGradient, { width: btnSize, height: btnSize, borderRadius: btnRadius }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="chevron-left" size={isMobile ? 18 : 20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.pageNumbers}>
            {visiblePages.map((pageNum) => (
              <TouchableOpacity key={pageNum} onPress={() => onPageChange(pageNum)}>
                <LinearGradient
                  colors={(pageNum === pagination.currentPage
                    ? themeColors.primary.gradient
                    : (isDarkMode
                      ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                      : ['#FFFFFF', '#F8FAFC'])) as any}
                  style={[
                    styles.pageButtonGradient,
                    {
                      width: btnSize, height: btnSize, borderRadius: btnRadius,
                      borderColor: pageNum === pagination.currentPage
                        ? 'transparent'
                        : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                    }
                  ]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={[
                    styles.pageButtonText,
                    {
                      color: pageNum === pagination.currentPage ? '#FFFFFF' : themeColors.text.primary,
                      fontSize: isMobile ? 12 : 14,
                    }
                  ]}>
                    {pageNum}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            style={[pagination.currentPage === pagination.totalPages && styles.disabledButton]}
          >
            <LinearGradient
              colors={(pagination.currentPage === pagination.totalPages
                ? [themeColors.neutral[200], themeColors.neutral[300]]
                : themeColors.primary.gradient) as any}
              style={[styles.paginationButtonGradient, { width: btnSize, height: btnSize, borderRadius: btnRadius }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="chevron-right" size={isMobile ? 18 : 20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {isMobile && pagination.totalEntries > 0 && (
          <Text style={[styles.paginationInfoMobile, { color: themeColors.text.muted }]}>
            {`${pagination.currentPage} / ${pagination.totalPages} pages`}
          </Text>
        )}
      </View>
    );
  };

  const renderMobileCard = (item: T) => (
    <View
      key={item.id}
      style={[
        styles.mobileCard,
        {
          backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
        }
      ]}
    >
      <View style={styles.mobileCardContent}>
        <LinearGradient
          colors={isDarkMode
            ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
            : ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.02)']}
          style={styles.mobileCardHeader}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.mobilePrimaryText, { color: isDarkMode ? '#FFFFFF' : themeColors.primary.dark }]} numberOfLines={2}>
            {columns[0]?.render
              ? columns[0].render(item[columns[0].key], item)
              : String(item[columns[0].key] ?? '')}
          </Text>
        </LinearGradient>

        <View style={styles.mobileRowsContainer}>
          {columns.slice(1).map((column) => {
            const value = item[column.key];
            const displayValue = column.render ? column.render(value, item) : String(value ?? '');
            return (
              <View key={String(column.key)} style={styles.mobileRow}>
                <Text style={[styles.mobileLabel, { color: themeColors.neutral[500] }]}>{column.label}</Text>
                <View style={styles.mobileValueContainer}>
                  {column.render && typeof displayValue === 'object' ? displayValue : (
                    <Text style={[styles.mobileValue, { color: themeColors.text.primary }]} numberOfLines={1}>
                      {displayValue && displayValue !== 'undefined' && displayValue !== 'null' && displayValue !== ''
                        ? displayValue : '-'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.mobileActions, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
          {actions.includes('edit') && (
            <TouchableOpacity
              onPress={() => handleRowAction('edit', item)}
              style={[styles.actionButton, { backgroundColor: themeColors.primary.main }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {actions.includes('email') && ((item as any).customerEmail || (item as any).vendorEmail || (item as any).email) && (
            <TouchableOpacity
              onPress={() => handleRowAction('email', item)}
              style={[styles.actionButton, { backgroundColor: themeColors.secondary.main }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="email" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          )}
          {actions.includes('download') && (
            <TouchableOpacity
              onPress={() => handleRowAction('download', item)}
              style={[styles.actionButton, { backgroundColor: themeColors.success?.main || '#10b981' }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="download" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {actions.includes('delete') && (
            <TouchableOpacity
              onPress={() => handleRowAction('delete', item)}
              style={[styles.actionButton, { backgroundColor: 'rgba(244,63,94,0.1)', minWidth: 44 }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete" size={16} color={themeColors.error.main} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary.main} />
        <Text style={[styles.loadingText, { color: themeColors.text.primary }]}>Loading...</Text>
      </View>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="inbox" size={48} color={themeColors.text.muted} />
        <Text style={[styles.emptyText, { color: themeColors.text.muted }]}>No records found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableWrapper}>
        {showCards ? (
          /* ── MOBILE: card list ── */
          <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
            {data.map((item) => renderMobileCard(item))}
          </ScrollView>
        ) : (
          /* ── TABLET / DESKTOP: data table with optional horizontal scroll ── */
          <View style={styles.desktopTableContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={{ minWidth: tableMinWidth }}
            >
              <DataTable style={[
                styles.table,
                {
                  backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                  width: '100%',
                }
              ]}>
                <DataTable.Header style={[
                  styles.tableHeaderRow,
                  { backgroundColor: isDarkMode ? '#1E293B' : themeColors.neutral[900] }
                ]}>
                  {columns.map((column) => (
                    <DataTable.Title
                      key={String(column.key)}
                      style={{ flex: 1, minWidth: MIN_COL_WIDTH, maxWidth: COL_MAX_WIDTH }}
                      textStyle={[styles.tableHeaderText, { color: '#FFFFFF' }]}
                    >
                      {column.label.toUpperCase()}
                    </DataTable.Title>
                  ))}
                  <DataTable.Title
                    style={{ width: ACTIONS_WIDTH, justifyContent: 'center' }}
                    textStyle={[styles.tableHeaderText, { color: '#FFFFFF' }]}
                  >
                    ACTIONS
                  </DataTable.Title>
                </DataTable.Header>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.tableBodyScroll}
                  contentContainerStyle={{ width: '100%' }}
                >
                  {data.map((item, index) => (
                    <DataTable.Row
                      key={item.id}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: index % 2 === 0
                            ? (isDarkMode ? themeColors.surface.primary : '#FFFFFF')
                            : (isDarkMode ? themeColors.surface.secondary : themeColors.neutral[50]),
                          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                        }
                      ]}
                    >
                      {columns.map((column) => {
                        const value = item[column.key];
                        const displayValue = column.render ? column.render(value, item) : String(value ?? '');
                        return (
                          <DataTable.Cell key={String(column.key)} style={{ flex: 1, minWidth: MIN_COL_WIDTH, maxWidth: COL_MAX_WIDTH }}>
                            {displayValue && displayValue !== 'undefined' ? (
                              typeof displayValue === 'object' ? displayValue : (
                                <Text style={[styles.tableCellText, { color: themeColors.text.primary }]} numberOfLines={1}>
                                  {displayValue}
                                </Text>
                              )
                            ) : <Text style={{ color: themeColors.text.muted }}>-</Text>}
                          </DataTable.Cell>
                        );
                      })}

                      <DataTable.Cell style={{ width: ACTIONS_WIDTH, justifyContent: 'center' }}>
                        <View style={styles.desktopActions}>
                          {actions.includes('edit') && (
                            <TouchableOpacity
                              onPress={() => handleRowAction('edit', item)}
                              style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.1)' : '#f8fafc' }]}
                            >
                              <MaterialIcons name="edit" size={18} color={themeColors.primary.main} />
                            </TouchableOpacity>
                          )}
                          {actions.includes('email') && (
                            <TouchableOpacity
                              onPress={() => handleRowAction('email', item)}
                              style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? 'rgba(14,165,233,0.1)' : '#f8fafc' }]}
                            >
                              <MaterialIcons name="email" size={18} color={themeColors.secondary?.main || '#0ea5e9'} />
                            </TouchableOpacity>
                          )}
                          {actions.includes('download') && (
                            <TouchableOpacity
                              onPress={() => handleRowAction('download', item)}
                              style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#f8fafc' }]}
                            >
                              <MaterialIcons name="download" size={18} color={themeColors.success?.main || '#10b981'} />
                            </TouchableOpacity>
                          )}
                          {actions.includes('delete') && (
                            <TouchableOpacity
                              onPress={() => handleRowAction('delete', item)}
                              style={[styles.desktopActionBtn, { backgroundColor: isDarkMode ? 'rgba(244,63,94,0.1)' : '#f8fafc' }]}
                            >
                              <MaterialIcons name="delete" size={18} color={themeColors.error.main} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </ScrollView>
              </DataTable>
            </ScrollView>
          </View>
        )}
      </View>
      {renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tableWrapper: {
    flex: 1,
  },
  /* ── Desktop / Tablet ── */
  desktopTableContainer: {
    flex: 1,
    padding: 16,
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
  },
  tableHeaderRow: {
    height: 52,
    width: '100%',
    alignSelf: 'stretch',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tableBodyScroll: {
    // fills remaining space — let flex handle height
    width: '100%',
    alignSelf: 'stretch',
  },
  tableRow: {
    borderBottomWidth: 1,
    minHeight: 56,
    width: '100%',
    alignSelf: 'stretch',
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  desktopActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
  },
  desktopActionBtn: {
    padding: 7,
    borderRadius: 8,
  },
  /* ── Mobile cards ── */
  mobileContainer: {
    flex: 1,
    padding: 12,
  },
  mobileCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  mobileCardContent: {},
  mobileCardHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mobilePrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  mobileRowsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  mobileLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  mobileValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mobileValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  mobileActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  /* ── Loading / Empty ── */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  /* ── Pagination ── */
  paginationContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationContainerMobile: {
    flexDirection: 'column',
    gap: 8,
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: '500',
  },
  paginationInfoMobile: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 5,
  },
  pageButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageButtonText: {
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.35,
  },
});
