import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { Text, Card } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { subscriptionAPI } from '../../services/api';
import { useResponsive } from '../../utils/responsive';

export const AnalyticsDashboardScreen = () => {
    const { colors: themeColors, isDarkMode } = useTheme();
    const { width, isMobile, isTablet, isDesktop, rs } = useResponsive();
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await subscriptionAPI.getUsage();
            if (response.success) {
                setUsage(response.data.usage);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Sample data - replace with real API data
    const invoiceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                data: [20, 45, 28, 80, 99, 43],
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                strokeWidth: 2,
            },
        ],
    };

    const revenueData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                data: [30000, 45000, 28000, 80000],
            },
        ],
    };

    const usageDistribution = usage
        ? [
            {
                name: 'Invoices Used',
                population: usage.invoice_count,
                color: '#667eea',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
            {
                name: 'Invoices Remaining',
                population: usage.limits.invoice_limit
                    ? usage.limits.invoice_limit - usage.invoice_count
                    : 100,
                color: '#E5E7EB',
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
            },
        ]
        : [];

    const chartConfig = {
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        backgroundGradientFrom: isDarkMode ? '#1F2937' : '#FFFFFF',
        backgroundGradientTo: isDarkMode ? '#374151' : '#F9FAFB',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        labelColor: (opacity = 1) =>
            isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#667eea',
        },
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: themeColors.background.main }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.content}>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <Card style={[styles.statCard, { backgroundColor: '#667eea' }]}>
                        <Card.Content>
                            <MaterialIcons name="description" size={32} color="#FFFFFF" />
                            <Text style={styles.statValue}>{usage?.invoice_count || 0}</Text>
                            <Text style={styles.statLabel}>Total Invoices</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                        <Card.Content>
                            <MaterialIcons name="people" size={32} color="#FFFFFF" />
                            <Text style={styles.statValue}>{usage?.employee_count || 0}</Text>
                            <Text style={styles.statLabel}>Employees</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Invoice Trend */}
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Invoice Generation Trend</Text>
                        <Text style={styles.chartSubtitle}>Last 6 months</Text>
                        <LineChart
                            data={invoiceData}
                            width={width - 60}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                        />
                    </Card.Content>
                </Card>

                {/* Revenue Chart */}
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Monthly Revenue</Text>
                        <Text style={styles.chartSubtitle}>Current month breakdown</Text>
                        <BarChart
                            data={revenueData}
                            width={width - 60}
                            height={220}
                            chartConfig={chartConfig}
                            style={styles.chart}
                            yAxisLabel="₹"
                            yAxisSuffix=""
                            fromZero
                        />
                    </Card.Content>
                </Card>

                {/* Usage Distribution */}
                {usage && usage.limits.invoice_limit && (
                    <Card style={styles.chartCard}>
                        <Card.Content>
                            <Text style={styles.chartTitle}>Plan Usage</Text>
                            <Text style={styles.chartSubtitle}>Invoice limit distribution</Text>
                            <PieChart
                                data={usageDistribution}
                                width={width - 60}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                                style={styles.chart}
                            />
                        </Card.Content>
                    </Card>
                )}

                {/* Quick Stats */}
                <Card style={styles.quickStatsCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>Quick Stats</Text>
                        <View style={styles.quickStatRow}>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>Avg Invoice Value</Text>
                                <Text style={styles.quickStatValue}>₹12,450</Text>
                            </View>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>This Month</Text>
                                <Text style={styles.quickStatValue}>₹2.4L</Text>
                            </View>
                        </View>
                        <View style={styles.quickStatRow}>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>Growth Rate</Text>
                                <Text style={[styles.quickStatValue, { color: '#10b981' }]}>+24%</Text>
                            </View>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>Active Customers</Text>
                                <Text style={styles.quickStatValue}>48</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 12,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    chartCard: {
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    quickStatsCard: {
        marginBottom: 20,
    },
    quickStatRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    quickStat: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    quickStatLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    quickStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
});
