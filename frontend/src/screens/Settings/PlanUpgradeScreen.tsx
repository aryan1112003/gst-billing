import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { subscriptionAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { showAlert, showSuccess, showError } from '../../utils/toast';

export const PlanUpgradeScreen = ({ route, navigation }: any) => {
    const { plan } = route.params;
    const { colors: themeColors } = useTheme();
    const { isMobile, isTablet, isDesktop, rs } = useResponsive();
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Step 1: Create payment intent
            const paymentResponse = await subscriptionAPI.createPaymentIntent(plan.id);

            if (!paymentResponse.success) {
                throw new Error('Failed to create payment intent');
            }

            const { clientSecret, paymentIntentId } = paymentResponse.data;

            // Step 2: Show payment confirmation
            showAlert(
                'Payment Confirmation',
                `You are about to pay ₹${plan.price_monthly.toLocaleString()} for ${plan.display_name}.\n\nIn production, Stripe payment UI would appear here.`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                    {
                        text: 'Simulate Payment',
                        onPress: () => simulatePayment(paymentIntentId),
                    },
                ]
            );
        } catch (error: any) {
            showError(error.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    const simulatePayment = async (paymentIntentId: string) => {
        setProcessing(true);
        try {
            // In production, this would be handled by Stripe
            // For now, we'll directly call confirm-upgrade

            // Wait 2 seconds to simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Confirm upgrade
            const confirmResponse = await subscriptionAPI.confirmUpgrade(plan.id, paymentIntentId);

            if (confirmResponse.success) {
                showAlert(
                    'Success! 🎉',
                    `Your subscription has been upgraded to ${plan.display_name}!\n\nAll limits have been updated and you now have full access.`,
                    [
                        {
                            text: 'View Subscription',
                            onPress: () => navigation.navigate('Settings'),
                        },
                    ]
                );
            }
        } catch (error: any) {
            showAlert('Payment Failed', error.message || 'Please try again');
        } finally {
            setProcessing(false);
            setLoading(false);
        }
    };

    if (processing) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={themeColors.primary.main} />
                <Text style={styles.processingText}>Processing payment...</Text>
                <Text style={styles.processingSubtext}>Please wait</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background.main }]}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Upgrade Plan</Text>
                <Text style={styles.headerSubtitle}>Complete your subscription upgrade</Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Plan Summary */}
                <Card style={[styles.planCard, { width: rs('100%', '48.5%', '31.5%') as any }]}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Selected Plan</Text>
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={styles.planName}>{plan.display_name}</Text>
                                <Text style={styles.planDescription}>{plan.description}</Text>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceAmount}>₹{plan.price_monthly.toLocaleString()}</Text>
                                <Text style={styles.pricePeriod}>/month</Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        {/* Features */}
                        <Text style={styles.featuresTitle}>What you'll get:</Text>
                        {plan.features && plan.features.map((feature: string, index: number) => (
                            <View key={index} style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}

                        <Divider style={styles.divider} />

                        {/* Limits */}
                        <View style={styles.limitsContainer}>
                            <View style={styles.limitRow}>
                                <MaterialIcons name="people" size={20} color="#667eea" />
                                <Text style={styles.limitLabel}>Employees:</Text>
                                <Text style={styles.limitValue}>
                                    {plan.employee_limit === null ? 'Unlimited' : plan.employee_limit}
                                </Text>
                            </View>
                            <View style={styles.limitRow}>
                                <MaterialIcons name="description" size={20} color="#667eea" />
                                <Text style={styles.limitLabel}>Invoices:</Text>
                                <Text style={styles.limitValue}>
                                    {plan.invoice_limit === null ? 'Unlimited' : plan.invoice_limit}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Payment Summary */}
                <Card style={styles.summaryCard}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Payment Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subscription</Text>
                            <Text style={styles.summaryValue}>₹{plan.price_monthly.toLocaleString()}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Billing Period</Text>
                            <Text style={styles.summaryValue}>Monthly</Text>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Due Today</Text>
                            <Text style={styles.totalValue}>₹{plan.price_monthly.toLocaleString()}</Text>
                        </View>

                        <Text style={styles.renewalNote}>
                            Your subscription will auto-renew monthly. You can cancel anytime.
                        </Text>
                    </Card.Content>
                </Card>

                {/* Important Notes */}
                <Card style={styles.notesCard}>
                    <Card.Content>
                        <View style={styles.noteItem}>
                            <MaterialIcons name="info" size={20} color="#667eea" />
                            <Text style={styles.noteText}>
                                Your trial data will be preserved
                            </Text>
                        </View>
                        <View style={styles.noteItem}>
                            <MaterialIcons name="check" size={20} color="#10b981" />
                            <Text style={styles.noteText}>
                                Instant access after payment
                            </Text>
                        </View>
                        <View style={styles.noteItem}>
                            <MaterialIcons name="lock" size={20} color="#667eea" />
                            <Text style={styles.noteText}>
                                Secure payment via Stripe
                            </Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Action Buttons */}
                <Button
                    mode="contained"
                    onPress={handlePayment}
                    loading={loading}
                    disabled={loading}
                    style={styles.payButton}
                    buttonColor="#667eea"
                    contentStyle={styles.payButtonContent}
                >
                    {loading ? 'Processing...' : `Pay ₹${plan.price_monthly.toLocaleString()}`}
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                    style={styles.cancelButton}
                >
                    Cancel
                </Button>

                <Text style={styles.disclaimer}>
                    By proceeding, you agree to our Terms of Service and Privacy Policy.
                    Your payment is secure and encrypted.
                </Text>
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
    header: {
        padding: 30,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        padding: 20,
    },
    planCard: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#667eea',
    },
    pricePeriod: {
        fontSize: 14,
        color: '#6B7280',
    },
    divider: {
        marginVertical: 16,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 10,
        flex: 1,
    },
    limitsContainer: {
        gap: 12,
    },
    limitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    limitLabel: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    limitValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    summaryCard: {
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#667eea',
    },
    renewalNote: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 12,
        fontStyle: 'italic',
    },
    notesCard: {
        marginBottom: 24,
        backgroundColor: '#F9FAFB',
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    noteText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 10,
    },
    payButton: {
        marginBottom: 12,
    },
    payButtonContent: {
        paddingVertical: 12,
    },
    cancelButton: {
        marginBottom: 16,
    },
    disclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
    },
    processingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 20,
    },
    processingSubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
});
