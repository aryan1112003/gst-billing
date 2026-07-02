import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { Text, Button, ProgressBar, Card, Chip, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { subscriptionAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useResponsive } from '../../utils/responsive';
import { showAlert, showSuccess, showError } from '../../utils/toast';

interface Plan {
    id: number;
    name: string;
    display_name: string;
    description: string;
    employee_limit: number | null;
    invoice_limit: number | null;
    price_monthly: number;
    features: string[];
}

interface Subscription {
    plan_name: string;
    display_name: string;
    status: string;
    trial_ends_at?: string;
    current_period_end: string;
    employee_limit: number | null;
    invoice_limit: number | null;
}

interface UsageStats {
    invoice_count: number;
    employee_count: number;
    limits: {
        invoice_limit: number | null;
        employee_limit: number | null;
    };
    percentage_used: {
        invoices: number;
        employees: number;
    };
}

export const SubscriptionManagementScreen = ({ navigation }: any) => {
    const { colors: themeColors } = useTheme();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const user = useSelector((state: RootState) => state.auth.user);
    const userRole = user?.role;

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch plans independently as it should always work
            try {
                const plansResponse = await subscriptionAPI.getPlans();
                if (plansResponse.success) {
                    setPlans(plansResponse.data.plans);
                }
            } catch (error) {
                console.error('Error loading plans:', error);
            }

            // Fetch subscription and usage
            try {
                const subResponse = await subscriptionAPI.getCurrent();
                if (subResponse.success) {
                    setSubscription(subResponse.data.subscription);
                }
            } catch (error) {
                console.error('No active subscription found:', error);
                setSubscription(null);
            }

            try {
                const usageResponse = await subscriptionAPI.getUsage();
                if (usageResponse.success) {
                    setUsage(usageResponse.data.usage);
                }
            } catch (error) {
                console.error('Error loading usage data:', error);
                setUsage(null);
            }

        } catch (error: any) {
            console.error('General error loading subscription data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleUpgrade = (plan: Plan) => {
        showAlert(
            `Upgrade to ${plan.display_name}`,
            `₹${plan.price_monthly.toLocaleString()}/month\n\nThis will upgrade your subscription immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: () => navigation.navigate('PlanUpgrade', { plan }),
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#10b981';
            case 'trial':
                return '#f59e0b';
            case 'past_due':
                return '#ef4444';
            case 'cancelled':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'trial':
                return 'Free Trial';
            case 'past_due':
                return 'Payment Due';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading subscription...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: themeColors.background.main }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            {/* Current Plan Card */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.currentPlanCard}
            >
                <View style={styles.planHeader}>
                    <View>
                        <Text style={styles.planName}>
                            {userRole === 'admin' ? 'Unlimited Plan' : (subscription?.display_name || 'No Plan')}
                        </Text>
                        <View style={styles.statusBadge}>
                            <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.statusText}>
                                {userRole === 'admin' ? 'Permanent Access' : getStatusLabel(subscription?.status || '')}
                            </Text>
                        </View>
                    </View>
                    {userRole === 'admin' ? (
                        <Chip icon="all-inclusive" textStyle={{ color: '#FFFFFF' }} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            Infinite
                        </Chip>
                    ) : (
                        subscription?.status === 'trial' && (
                            <Chip icon="timer" textStyle={{ color: '#FFFFFF' }} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                Trial
                            </Chip>
                        )
                    )}
                </View>

                {subscription?.trial_ends_at && userRole !== 'admin' && (
                    <Text style={styles.trialInfo}>
                        Trial ends{' '}
                        {new Date(subscription.trial_ends_at).toLocaleDateString()}
                    </Text>
                )}
            </LinearGradient>

            {/* Usage Stats */}
            {usage && (
                <Card style={[styles.usageCard, { backgroundColor: themeColors.surface.primary }]}>
                    <Card.Content>
                        <Text style={[styles.cardTitle, { color: themeColors.text.primary }]}>Current Usage</Text>

                        {/* Invoices */}
                        <View style={styles.usageItem}>
                            <View style={styles.usageHeader}>
                                <MaterialIcons name="description" size={20} color={themeColors.primary.main} />
                                <Text style={[styles.usageLabel, { color: themeColors.text.secondary }]}>Invoices</Text>
                            </View>
                            <View style={styles.usageCountContainer}>
                                <Text style={[styles.usageCount, { color: themeColors.text.primary }]}>
                                    {usage.invoice_count}
                                    {userRole === 'admin' || usage.limits.invoice_limit === null
                                        ? ' / Unlimited'
                                        : ` / ${usage.limits.invoice_limit}`
                                    }
                                </Text>
                                {userRole === 'admin' || usage.limits.invoice_limit === null ? (
                                    <Text style={[styles.usagePercent, { color: themeColors.primary.main }]}>∞%</Text>
                                ) : (
                                    usage.limits.invoice_limit && (
                                        <Text style={[styles.usagePercent, { color: themeColors.text.muted }, usage.percentage_used.invoices >= 80 && styles.usageWarning]}>
                                            {usage.percentage_used.invoices}%
                                        </Text>
                                    )
                                )}
                            </View>
                            {userRole === 'admin' || usage.limits.invoice_limit === null ? (
                                <ProgressBar progress={0} color={themeColors.primary.main} style={styles.progressBar} />
                            ) : (
                                usage.limits.invoice_limit && (
                                    <ProgressBar
                                        progress={usage.percentage_used.invoices / 100}
                                        color={usage.percentage_used.invoices >= 80 ? '#ef4444' : themeColors.primary.main}
                                        style={styles.progressBar}
                                    />
                                )
                            )}
                        </View>

                        <Divider style={styles.divider} />

                        {/* Employees */}
                        <View style={styles.usageItem}>
                            <View style={styles.usageHeader}>
                                <MaterialIcons name="people" size={20} color={themeColors.primary.main} />
                                <Text style={[styles.usageLabel, { color: themeColors.text.secondary }]}>Employees</Text>
                            </View>
                            <View style={styles.usageCountContainer}>
                                <Text style={[styles.usageCount, { color: themeColors.text.primary }]}>
                                    {usage.employee_count}
                                    {userRole === 'admin' || usage.limits.employee_limit === null
                                        ? ' / Unlimited'
                                        : ` / ${usage.limits.employee_limit}`
                                    }
                                </Text>
                                {userRole === 'admin' || usage.limits.employee_limit === null ? (
                                    <Text style={[styles.usagePercent, { color: themeColors.primary.main }]}>∞%</Text>
                                ) : (
                                    usage.limits.employee_limit && (
                                        <Text style={[styles.usagePercent, { color: themeColors.text.muted }, usage.percentage_used.employees >= 80 && styles.usageWarning]}>
                                            {usage.percentage_used.employees}%
                                        </Text>
                                    )
                                )}
                            </View>
                            {userRole === 'admin' || usage.limits.employee_limit === null ? (
                                <ProgressBar progress={0} color={themeColors.primary.main} style={styles.progressBar} />
                            ) : (
                                usage.limits.employee_limit && (
                                    <ProgressBar
                                        progress={usage.percentage_used.employees / 100}
                                        color={usage.percentage_used.employees >= 80 ? '#ef4444' : themeColors.primary.main}
                                        style={styles.progressBar}
                                    />
                                )
                            )}
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* Available Plans */}
            <View style={styles.plansContainer}>
                <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Available Plans</Text>
                <Text style={[styles.sectionSubtitle, { color: themeColors.text.secondary }]}>Upgrade anytime to unlock more features</Text>

                {plans.filter(p => p.name !== 'free_trial').map((plan) => (
                    <Card key={plan.id} style={[styles.planCard, { backgroundColor: themeColors.surface.primary }]}>
                        <Card.Content>
                            <View style={styles.planCardHeader}>
                                <View>
                                    <Text style={[styles.planCardName, { color: themeColors.text.primary }]}>{plan.display_name}</Text>
                                    <Text style={styles.planPrice}>₹{plan.price_monthly.toLocaleString()}/month</Text>
                                </View>
                                {subscription?.plan_name === plan.name && (
                                    <Chip icon="check" mode="flat" textStyle={{ color: '#10b981' }} style={{ backgroundColor: '#d1fae5' }}>
                                        Current
                                    </Chip>
                                )}
                            </View>

                            {plan.description && (
                                <Text style={[styles.planDescription, { color: themeColors.text.secondary }]}>{plan.description}</Text>
                            )}

                            <View style={styles.planLimits}>
                                {plan.employee_limit !== undefined && (
                                    <View style={styles.limitItem}>
                                        <MaterialIcons name="people" size={16} color={themeColors.text.muted} />
                                        <Text style={[styles.limitText, { color: themeColors.text.muted }]}>
                                            {plan.employee_limit === null ? 'Unlimited' : plan.employee_limit} employees
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.limitItem}>
                                    <MaterialIcons name="description" size={16} color={themeColors.text.muted} />
                                    <Text style={[styles.limitText, { color: themeColors.text.muted }]}>
                                        {plan.invoice_limit === null ? 'Unlimited' : plan.invoice_limit} invoices
                                    </Text>
                                </View>
                            </View>

                            {plan.features && plan.features.length > 0 && (
                                <View style={styles.featuresContainer}>
                                    {plan.features.slice(0, 3).map((feature, idx) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <MaterialIcons name="check" size={16} color="#10b981" />
                                            <Text style={[styles.featureText, { color: themeColors.text.secondary }]}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {subscription?.plan_name !== plan.name && (
                                <Button
                                    mode="contained"
                                    onPress={() => handleUpgrade(plan)}
                                    style={styles.upgradeButton}
                                    buttonColor={themeColors.primary.main}
                                >
                                    Upgrade to {plan.display_name}
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </View>

            {/* Payment History Link */}
            <TouchableOpacity
                style={[styles.historyButton, {
                    backgroundColor: themeColors.surface.primary,
                    borderColor: themeColors.neutral[300]
                }]}
                onPress={() => navigation.navigate('PaymentHistory')}
            >
                <MaterialIcons name="history" size={20} color={themeColors.text.secondary} />
                <Text style={[styles.historyText, { color: themeColors.text.secondary }]}>
                    View Payment History
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={themeColors.text.secondary} />
            </TouchableOpacity>
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    currentPlanCard: {
        margin: 20,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    planName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '600',
    },
    trialInfo: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        marginTop: 8,
    },
    usageCard: {
        margin: 20,
        marginTop: 0,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1F2937',
    },
    usageItem: {
        marginBottom: 20,
    },
    usageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    usageLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: '#374151',
    },
    usageCountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    usageCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    usagePercent: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    usageWarning: {
        color: '#ef4444',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    divider: {
        marginVertical: 16,
    },
    plansContainer: {
        padding: 20,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    planCard: {
        marginBottom: 16,
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    planCardName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    planPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
        marginTop: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    planLimits: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 16,
    },
    limitItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    limitText: {
        fontSize: 13,
        color: '#6b7280',
        marginLeft: 4,
    },
    featuresContainer: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    featureText: {
        fontSize: 13,
        color: '#374151',
        marginLeft: 6,
    },
    upgradeButton: {
        marginTop: 8,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    historyText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
});
