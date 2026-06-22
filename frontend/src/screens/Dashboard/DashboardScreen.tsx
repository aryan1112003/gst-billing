import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { MainLayout } from '../../components/Layout/MainLayout';
import { colors as baseColors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { customersAPI, invoicesAPI, itemsAPI, reportsAPI, subscriptionAPI } from '../../services/api';
import { getDashboardPermissions, UserRole } from '../../utils/rolePermissions';
import { useResponsive } from '../../utils/responsive';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

const TrialBanner: React.FC<{ trialEndsAt: string; onUpgrade: () => void; isDarkMode: boolean; themeColors: any }> = ({ trialEndsAt, onUpgrade, isDarkMode, themeColors }) => {
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return null;

  return (
    <LinearGradient
      colors={['#005437', '#068B5E']}
      style={styles.trialBanner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.trialBannerContent}>
        <View style={styles.trialTextContainer}>
          <MaterialIcons name="timer" size={24} color="#FFFFFF" />
          <View style={styles.trialTextInfo}>
            <Text style={styles.trialTitle}>Free Trial Active</Text>
            <Text style={styles.trialSubtitle}>
              {daysLeft} days remaining in your free trial. Upgrade now for unlimited access!
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.upgradeButtonSmall} onPress={onUpgrade}>
          <Text style={styles.upgradeButtonTextSmall}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const MetricCard: React.FC<MetricCardProps & { gradientColors: [string, string, ...string[]] }> = ({ title, value, subtitle, icon, color, gradientColors }) => (
  <LinearGradient
    colors={gradientColors}
    style={styles.metricCard}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <View style={styles.metricContent}>
      <View style={styles.metricHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={24} color="#FFFFFF" />
        </View>
        <Text style={[styles.metricValue, { color: '#FFFFFF' }]}>{value}</Text>
      </View>
      <Text style={[styles.metricTitle, { color: '#FFFFFF' }]}>{title}</Text>
      {subtitle && <Text style={[styles.metricSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>{subtitle}</Text>}
    </View>
  </LinearGradient>
);

// Moved getGradientForColor inside DashboardScreen or updated to use baseColors

export const DashboardScreen: React.FC = ({ navigation }: any) => {
  const { isDarkMode, colors: themeColors } = useTheme();
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = (user?.role || 'user') as UserRole;
  const permissions = getDashboardPermissions(userRole, user?.accountType);

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch once when component mounts
    if (!hasFetched) {
      fetchDashboardData();
      fetchSubscriptionInfo();
      setHasFetched(true);
    }
  }, []); // Empty dependency array - only run once

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await subscriptionAPI.getCurrent();
      setSubscriptionInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch subscription info:', err);
    }
  };

  const fetchDashboardData = async () => {
    // Prevent multiple simultaneous fetches
    if (loading) return;

    try {
      setLoading(true);
      const promises: Promise<any>[] = [];

      // Only fetch data user has permission to see
      if (permissions.canViewCustomers) {
        promises.push(customersAPI.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })));
      }
      if (permissions.canViewFinancials) {
        promises.push(invoicesAPI.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })));
      }
      if (permissions.canViewInventory) {
        promises.push(itemsAPI.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })));
      }

      const results = await Promise.all(promises);

      let dataIndex = 0;
      setDashboardData({
        totalCustomers: permissions.canViewCustomers ? (results[dataIndex++]?.pagination?.total || 0) : null,
        totalInvoices: permissions.canViewFinancials ? (results[dataIndex++]?.pagination?.total || 0) : null,
        totalItems: permissions.canViewInventory ? (results[dataIndex++]?.pagination?.total || 0) : null,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      // Set default values on error to prevent infinite loading
      setDashboardData({
        totalCustomers: 0,
        totalInvoices: 0,
        totalItems: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Build metrics based on role permissions
  const metrics = [];

  if (permissions.canViewCustomers && dashboardData?.totalCustomers !== null) {
    metrics.push({
      title: 'Total Customers',
      value: dashboardData?.totalCustomers?.toString() || '0',
      subtitle: 'Active customers',
      icon: 'people' as keyof typeof MaterialIcons.glyphMap,
      color: '#2196F3',
    });
  }

  if (permissions.canViewFinancials && dashboardData?.totalInvoices !== null) {
    metrics.push({
      title: 'Total Invoices',
      value: dashboardData?.totalInvoices?.toString() || '0',
      subtitle: 'All time',
      icon: 'receipt' as keyof typeof MaterialIcons.glyphMap,
      color: '#4CAF50',
    });
  }

  if (permissions.canViewInventory && dashboardData?.totalItems !== null) {
    metrics.push({
      title: 'Total Items',
      value: dashboardData?.totalItems?.toString() || '0',
      subtitle: 'In inventory',
      icon: 'inventory' as keyof typeof MaterialIcons.glyphMap,
      color: '#FF9800',
    });
  }

  // Always show system status
  metrics.push({
    title: 'System Status',
    value: '✓',
    subtitle: 'All systems operational',
    icon: 'check-circle' as keyof typeof MaterialIcons.glyphMap,
    color: '#4CAF50',
  });

  // Build quick actions based on role permissions
  const quickActions = [];

  if (permissions.canCreateInvoices) {
    quickActions.push({ title: 'New Invoice', icon: 'receipt', route: 'InvoiceForm' });
    quickActions.push({ title: 'Add Customer', icon: 'person-add', route: 'CustomerForm' });
    quickActions.push({ title: 'Record Payment', icon: 'payment', route: 'PaymentForm' });
    quickActions.push({ title: 'Add Expense', icon: 'remove-circle', route: 'ExpenseForm' });
  }

  if (permissions.canViewReports) {
    quickActions.push({ title: 'View Reports', icon: 'assessment', route: 'Reports' });
  }

  if (permissions.canManageUsers) {
    quickActions.push({ title: 'Manage Settings', icon: 'settings', route: 'Settings' });
  }

  // If user has no quick actions, show view-only options
  if (quickActions.length === 0) {
    quickActions.push({ title: 'View Dashboard', icon: 'dashboard', route: 'Dashboard' });
    quickActions.push({ title: 'My Profile', icon: 'person', route: 'Settings' });
  }

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const getActionGradient = (index: number): [string, string, ...string[]] => {
    const gradients = [
      baseColors.primary.gradient as [string, string, ...string[]],
      baseColors.success.gradient as [string, string, ...string[]],
      baseColors.warning.gradient as [string, string, ...string[]],
      baseColors.secondary.gradient as [string, string, ...string[]],
    ];
    return gradients[index % gradients.length];
  };

  const getGradientForColor = (color: string): [string, string, ...string[]] => {
    switch (color) {
      case '#2196F3': return baseColors.primary.gradient as [string, string, ...string[]];
      case '#4CAF50': return baseColors.success.gradient as [string, string, ...string[]];
      case '#FF9800': return baseColors.warning.gradient as [string, string, ...string[]];
      case '#F44336': return baseColors.error.gradient as [string, string, ...string[]];
      default: return baseColors.primary.gradient as [string, string, ...string[]];
    }
  };

  const s = useMemo(() => StyleSheet.create({
    header: {
      padding: rs(14, 16, 16),
      borderRadius: rs(10, 12, 12),
      marginHorizontal: rs(16, 24, 24),
      marginTop: rs(8, 24, 24),
      marginBottom: rs(12, 12, 12),
      elevation: rs(2, 4, 4),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: rs(2, 2, 2) },
      shadowOpacity: rs(0.08, 0.1, 0.1),
      shadowRadius: rs(3, 4, 4),
      borderWidth: 1,
    },
    headerTitle: {
      fontSize: rs(22, 24, 24),
      fontWeight: '700',
      marginBottom: rs(6, 8, 8),
    },
    headerSubtitle: {
      fontSize: rs(14, 16, 16),
      lineHeight: rs(20, 22, 22),
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: rs(16, 24, 24),
      paddingVertical: rs(12, 16, 16),
      justifyContent: 'space-between',
    },
    metricCard: {
      width: rs('100%', '48.5%', '23.5%') as any,
      minHeight: rs(95, 120, 120),
      borderRadius: rs(12, 16, 16),
      elevation: rs(3, 6, 6),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: rs(2, 3, 3) },
      shadowOpacity: rs(0.12, 0.15, 0.15),
      shadowRadius: rs(4, 8, 8),
      marginBottom: rs(12, 16, 16),
    },
    metricContent: {
      padding: rs(14, 16, 16),
      flex: 1,
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: rs(8, 12, 12),
    },
    iconContainer: {
      width: rs(38, 40, 40),
      height: rs(38, 40, 40),
      borderRadius: rs(10, 12, 12),
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricValue: {
      fontSize: rs(20, 22, 22),
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    metricTitle: {
      fontSize: rs(14, 15, 15),
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: rs(2, 4, 4),
    },
    metricSubtitle: {
      fontSize: rs(12, 13, 13),
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    section: {
      marginHorizontal: rs(16, 24, 24),
      marginVertical: rs(10, 12, 12),
      borderRadius: rs(12, 20, 20),
      elevation: rs(2, 4, 4),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: rs(2, 2, 2) },
      shadowOpacity: rs(0.08, 0.1, 0.1),
      shadowRadius: rs(4, 8, 8),
    },
    sectionContent: {
      padding: rs(16, 24, 24),
    },
    sectionTitle: {
      fontSize: rs(17, 20, 20),
      fontWeight: '700',
      marginBottom: rs(14, 20, 20),
      letterSpacing: 0.3,
    },
    quickActionButton: {
      width: rs('48.5%', '23.5%', '15%') as any,
      marginBottom: rs(12, 16, 16),
    },
    quickActionGradient: {
      paddingVertical: rs(16, 18, 18),
      paddingHorizontal: rs(12, 14, 14),
      borderRadius: rs(10, 12, 12),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: rs(75, 80, 80),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: rs(2, 3, 3) },
      shadowOpacity: rs(0.12, 0.15, 0.15),
      shadowRadius: rs(4, 6, 6),
      elevation: rs(3, 4, 4),
    },
    quickActionText: {
      color: '#FFFFFF',
      fontSize: rs(12, 13, 13),
      fontWeight: '700',
      marginTop: rs(6, 7, 7),
      textAlign: 'center',
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: rs(12, 16, 16),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    activityIcon: {
      width: rs(36, 40, 40),
      height: rs(36, 40, 40),
      borderRadius: rs(10, 12, 12),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: rs(12, 16, 16),
    },
    activityText: {
      fontSize: rs(13, 15, 15),
      fontWeight: '600',
      marginBottom: 3,
    },
    activityTime: {
      fontSize: rs(11, 12, 12),
      fontWeight: '500',
    },
    trialBanner: {
      marginHorizontal: rs(16, 24, 24),
      marginTop: rs(8, 24, 24),
      borderRadius: 16,
      padding: 16,
      elevation: 8,
      shadowColor: '#005437',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Dashboard" onNavigate={handleNavigate}>
      <ScrollView style={styles.container}>
        {subscriptionInfo?.status === 'trial' && (
          <TrialBanner
            trialEndsAt={subscriptionInfo.trial_ends_at}
            onUpgrade={() => navigation.navigate('SubscriptionManagement')}
            isDarkMode={isDarkMode}
            themeColors={themeColors}
          />
        )}

        <View style={[
          s.header,
          {
            backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : themeColors.neutral[200]
          }
        ]}>
          <Text style={[s.headerTitle, { color: themeColors.text.primary }]}>Dashboard</Text>
          <Text style={[s.headerSubtitle, { color: themeColors.text.secondary }]}>
            {`Welcome back, ${user?.name || 'User'}! ${user?.accountType === 'user' ? 'Manage your personal accounts and invoices.' :
              userRole === 'admin' ? 'You have full system access.' :
                userRole === 'agency' ? 'Manage your business operations.' :
                  'View your assigned information.'
              }`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary.main} />
          </View>
        ) : (
          <View style={s.metricsGrid}>
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} gradientColors={getGradientForColor(metric.color)} />
            ))}
          </View>
        )}

        <LinearGradient
          colors={(isDarkMode ? themeColors.background.dark : ['#FFFFFF', '#F9FAFB']) as any}
          style={[
            s.section,
            {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.sectionContent}>
            <Text style={[s.sectionTitle, { color: themeColors.text.primary }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigation.navigate(action.route)}
                  style={s.quickActionButton}
                >
                  <LinearGradient
                    colors={getActionGradient(index)}
                    style={s.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name={action.icon as any} size={20} color="#FFFFFF" />
                    <Text style={s.quickActionText}>{action.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={(isDarkMode ? themeColors.background.dark : ['#FFFFFF', '#F9FAFB']) as any}
          style={[
            s.section,
            {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={s.sectionContent}>
            <Text style={[s.sectionTitle, { color: themeColors.text.primary }]}>Recent Activity</Text>
            <View style={[s.activityItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View style={[s.activityIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="receipt" size={20} color={themeColors.primary.main} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[s.activityText, { color: themeColors.text.primary }]}>Invoice #INV-001 created for Customer ABC</Text>
                <Text style={[s.activityTime, { color: themeColors.text.muted }]}>2 hours ago</Text>
              </View>
            </View>
            <View style={[s.activityItem, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View style={[s.activityIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="payment" size={20} color={themeColors.success.main} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[s.activityText, { color: themeColors.text.primary }]}>Payment received from Customer XYZ</Text>
                <Text style={[s.activityTime, { color: themeColors.text.muted }]}>4 hours ago</Text>
              </View>
            </View>
            <View style={[s.activityItem, { borderBottomColor: 'transparent' }]}>
              <View style={[s.activityIcon, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <MaterialIcons name="person-add" size={20} color={themeColors.secondary.main} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[s.activityText, { color: themeColors.text.primary }]}>New customer "Tech Solutions" added</Text>
                <Text style={[s.activityTime, { color: themeColors.text.muted }]}>1 day ago</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityContent: {
    flex: 1,
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trialTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trialTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trialSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  upgradeButtonSmall: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeButtonTextSmall: {
    color: '#005437',
    fontSize: 13,
    fontWeight: '800',
  },
});
