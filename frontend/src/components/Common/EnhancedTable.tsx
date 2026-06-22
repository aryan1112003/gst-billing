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
  actions = ['edit', 'delete'], // Default actions
}: ExtendedEnhancedTableProps<T>) {
  const { colors: themeColors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');

  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});

  // Show full data table on tablet+ (768px+), cards on mobile
  const isDesktop = !isMobile;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const toggleMenu = (rowId: string) => {
    setMenuVisible(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleRowAction = (action: string, row: T) => {
    console.log('🔵 EnhancedTable handleRowAction called:', { action, rowId: row.id, row });
    setMenuVisible(prev => ({
      ...prev,
      [row.id]: false,
    }));
    console.log('🔵 Calling parent onRowAction...');
    onRowAction(action, row);
    console.log('🔵 Parent onRowAction called');
  };

  const renderPagination = () => {
    const maxVisiblePages = isMobile ? 3 : 5;
    const visiblePages = [];

    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(pagination.totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationControls}>
          <TouchableOpacity
            onPress={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            style={[pagination.currentPage === 1 && styles.disabledButton]}
          >
            <LinearGradient
              colors={(pagination.currentPage === 1 ? [themeColors.neutral[200], themeColors.neutral[300]] : themeColors.primary.gradient) as any}
              style={styles.paginationButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="chevron-left" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.pageNumbers}>
            {visiblePages.map((pageNum) => (
              <TouchableOpacity key={pageNum} onPress={() => onPageChange(pageNum)}>
                <LinearGradient
                  colors={(pageNum === pagination.currentPage ? themeColors.primary.gradient : (isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8FAFC'])) as any}
                  style={[
                    styles.pageButtonGradient,
                    { borderColor: pageNum === pagination.currentPage ? 'transparent' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0') }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.pageButtonText, { color: pageNum === pagination.currentPage ? '#FFFFFF' : themeColors.text.primary }]}>
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
              colors={(pagination.currentPage === pagination.totalPages ? [themeColors.neutral[200], themeColors.neutral[300]] : themeColors.primary.gradient) as any}
              style={styles.paginationButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
          borderWidth: 1
        }
      ]}
    >
      <View style={styles.mobileCardContent}>
        {/* Primary information - Gradient Header for Card */}
        <LinearGradient
          colors={isDarkMode ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(99, 102, 241, 0.08)', 'rgba(99, 102, 241, 0.02)']}
          style={styles.mobileHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.mobilePrimaryText, { color: isDarkMode ? '#FFFFFF' : themeColors.primary.dark }]}>
            {columns[0]?.render ? columns[0].render(item[columns[0].key], item) : String(item[columns[0].key])}
          </Text>
        </LinearGradient>

        {/* Secondary information in clean rows */}
        <View style={styles.mobileRowsContainer}>
          {columns.slice(1).map((column) => {
            const value = item[column.key];
            const displayValue = column.render ? column.render(value, item) : String(value);

            return (
              <View key={String(column.key)} style={styles.mobileRow}>
                <Text style={[styles.mobileLabel, { color: themeColors.neutral[500] }]}>{column.label}</Text>
                <View style={styles.mobileValueContainer}>
                  {column.render && typeof displayValue === 'object' ? displayValue : (
                    <Text style={[styles.mobileValue, { color: themeColors.text.primary }]}>
                      {displayValue && displayValue !== 'undefined' && displayValue !== 'null' && displayValue !== ''
                        ? displayValue
                        : '-'
                      }
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Buttons - Polished & Modern */}
        <View style={[styles.mobileActions, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC' }]}>
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

          {actions.includes('email') && (
            ((item as any).customerEmail || (item as any).vendorEmail || (item as any).email)
          ) && (
              <TouchableOpacity
                onPress={() => handleRowAction('email', item)}
                style={[styles.actionButton, { backgroundColor: themeColors.secondary.main }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="email" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Email</Text>
              </TouchableOpacity>
            )}

          {actions.includes('delete') && (
            <TouchableOpacity
              onPress={() => handleRowAction('delete', item)}
              style={[styles.actionButton, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}
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

  return (
    <View style={styles.container}>
      <View style={styles.tableWrapper}>
        {isDesktop ? (
          <View style={styles.desktopTableContainer}>
            <DataTable style={[
              styles.table,
              {
                backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
              }
            ]}>
              <DataTable.Header style={[styles.tableHeaderRow, { backgroundColor: isDarkMode ? '#1E293B' : themeColors.neutral[900], borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }]}>
                {columns.map((column) => (
                  <DataTable.Title
                    key={String(column.key)}
                    style={{ flex: 1 }}
                    textStyle={[styles.tableHeaderText, { color: '#FFFFFF' }]}
                  >
                    {column.label.toUpperCase()}
                  </DataTable.Title>
                ))}
                <DataTable.Title style={{ width: 160, justifyContent: 'center' }} textStyle={[styles.tableHeaderText, { color: '#FFFFFF' }]}>
                  ACTIONS
                </DataTable.Title>
              </DataTable.Header>

              <ScrollView style={styles.tableBodyScroll}>
                {data.map((item, index) => (
                  <DataTable.Row
                    key={item.id}
                    style={[
                      styles.tableRow,
                      {
                        backgroundColor: index % 2 === 0
                          ? (isDarkMode ? themeColors.surface.primary : '#FFFFFF')
                          : (isDarkMode ? themeColors.surface.secondary : themeColors.neutral[50]),
                        borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'
                      }
                    ]}
                  >
                    {columns.map((column) => {
                      const value = item[column.key];
                      const displayValue = column.render ? column.render(value, item) : String(value);
                      return (
                        <DataTable.Cell key={String(column.key)} style={{ flex: 1 }}>
                          {displayValue && displayValue !== 'undefined' ? (
                            typeof displayValue === 'object' ? displayValue : (
                              <Text style={[styles.tableCellText, { color: themeColors.text.primary }]}>{displayValue}</Text>
                            )
                          ) : <Text style={{ color: themeColors.text.muted }}>-</Text>}
                        </DataTable.Cell>
                      );
                    })}

                    <DataTable.Cell style={{ width: 160, justifyContent: 'center' }}>
                      <View style={styles.desktopActions}>
                        {actions.includes('edit') && (
                          <TouchableOpacity
                            onPress={() => handleRowAction('edit', item)}
                            style={[
                              styles.desktopActionBtn,
                              { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#f8fafc' }
                            ]}
                          >
                            <MaterialIcons name="edit" size={18} color={themeColors.primary.main} />
                          </TouchableOpacity>
                        )}
                        {actions.includes('email') && (
                          <TouchableOpacity
                            onPress={() => handleRowAction('email', item)}
                            style={[
                              styles.desktopActionBtn,
                              { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : '#f8fafc' }
                            ]}
                          >
                            <MaterialIcons name="email" size={18} color={themeColors.secondary?.main || '#0ea5e9'} />
                          </TouchableOpacity>
                        )}
                        {actions.includes('download') && (
                          <TouchableOpacity
                            onPress={() => handleRowAction('download', item)}
                            style={[
                              styles.desktopActionBtn,
                              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f8fafc' }
                            ]}
                          >
                            <MaterialIcons name="download" size={18} color={themeColors.success?.main || '#10b981'} />
                          </TouchableOpacity>
                        )}
                        {actions.includes('delete') && (
                          <TouchableOpacity
                            onPress={() => handleRowAction('delete', item)}
                            style={[
                              styles.desktopActionBtn,
                              { backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.1)' : '#f8fafc' }
                            ]}
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
          </View>
        ) : (
          <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
            {data.map((item) => renderMobileCard(item))}
          </ScrollView>
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
  desktopTableContainer: {
    flex: 1,
    padding: 16,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
  },
  tableHeaderRow: {
    height: 56,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tableBodyScroll: {
    maxHeight: 500,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    height: 60,
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  desktopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  desktopActionBtn: {
    padding: 8,
    borderRadius: 8,
  },
  mobileContainer: {
    flex: 1,
    padding: 16,
  },
  mobileCard: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mobileCardContent: {
    // Content padding handled inside
  },
  mobileHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mobilePrimaryText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mobileRowsContainer: {
    padding: 16,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mobileLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mobileValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  mobileActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 6,
  },
  pageButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.3,
  },
});
