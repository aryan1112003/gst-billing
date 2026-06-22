import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { Text, Card, Chip, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { subscriptionAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';

interface Transaction {
    id: number;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    created_at: string;
    metadata: any;
}

export const PaymentHistoryScreen = () => {
    const { colors: themeColors } = useTheme();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const response = await subscriptionAPI.getPaymentHistory();
            if (response.success) {
                setTransactions(response.data.transactions);
            }
        } catch (error) {
            console.error('Failed to load payment history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'failed':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'check-circle';
            case 'pending':
                return 'schedule';
            case 'failed':
                return 'error';
            default:
                return 'help';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text>Loading payment history...</Text>
            </View>
        );
    }

    if (transactions.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <MaterialIcons name="receipt-long" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No payment history yet</Text>
                <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: themeColors.background.main }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.content}>
                {transactions.map((transaction) => (
                    <Card key={transaction.id} style={styles.transactionCard}>
                        <Card.Content>
                            <View style={styles.transactionHeader}>
                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionAmount}>
                                        ₹{transaction.amount.toLocaleString()}
                                    </Text>
                                    <Text style={styles.transactionDate}>
                                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </View>
                                <Chip
                                    icon={() => (
                                        <MaterialIcons
                                            name={getStatusIcon(transaction.status)}
                                            size={16}
                                            color={getStatusColor(transaction.status)}
                                        />
                                    )}
                                    textStyle={{ color: getStatusColor(transaction.status), fontSize: 12 }}
                                    style={{
                                        backgroundColor: `${getStatusColor(transaction.status)}15`,
                                    }}
                                >
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </Chip>
                            </View>

                            <Divider style={styles.divider} />

                            <View style={styles.transactionDetails}>
                                <View style={styles.detailRow}>
                                    <MaterialIcons name="payment" size={16} color="#6B7280" />
                                    <Text style={styles.detailLabel}>Payment Method:</Text>
                                    <Text style={styles.detailValue}>
                                        {transaction.payment_method || 'Card'}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <MaterialIcons name="tag" size={16} color="#6B7280" />
                                    <Text style={styles.detailLabel}>Transaction ID:</Text>
                                    <Text style={styles.detailValue}>#{transaction.id}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                ))}
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
        padding: 20,
    },
    content: {
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
    },
    transactionCard: {
        marginBottom: 16,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    divider: {
        marginVertical: 16,
    },
    transactionDetails: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
});
